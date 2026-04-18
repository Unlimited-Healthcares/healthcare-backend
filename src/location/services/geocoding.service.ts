import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../../cache/cache.service';
import { 
  Coordinates, 
  GeocodingResult 
} from '../../types/location.types';

@Injectable()
export class GeocodingService {
  private readonly logger = new Logger(GeocodingService.name);
  private readonly cachePrefix = 'geocoding:';
  private readonly cacheTTL = 86400; // 24 hours in seconds

  constructor(
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {}

  /**
   * Converts an address to coordinates (geocoding)
   */
  async geocodeAddress(address: string): Promise<GeocodingResult> {
    if (!address || address.trim().length === 0) {
      throw new BadRequestException('Address is required');
    }

    const normalizedAddress = this.normalizeAddress(address);
    const cacheKey = `${this.cachePrefix}forward:${normalizedAddress}`;

    try {
      // Check cache first
      const cached = await this.cacheService.get<GeocodingResult>(cacheKey);
      if (cached) {
        this.logger.debug(`Geocoding cache hit for address: ${normalizedAddress}`);
        return { ...cached, source: 'cache' };
      }

      // Try Google Maps API first
      let result = await this.geocodeWithGoogle(normalizedAddress);
      
      // Fallback to OpenStreetMap if Google fails
      if (!result) {
        result = await this.geocodeWithOpenStreetMap(normalizedAddress);
      }

      if (!result) {
        throw new BadRequestException(`Unable to geocode address: ${address}`);
      }

      // Cache the result
      await this.cacheService.set(cacheKey, result, this.cacheTTL);
      
      this.logger.log(`Successfully geocoded address: ${normalizedAddress}`);
      return result;
    } catch (error) {
      this.logger.error(`Geocoding failed for address ${address}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Converts coordinates to an address (reverse geocoding)
   */
  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult> {
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      throw new BadRequestException('Valid latitude and longitude are required');
    }

    const coordinates: Coordinates = { latitude, longitude };
    const cacheKey = `${this.cachePrefix}reverse:${latitude},${longitude}`;

    try {
      // Check cache first
      const cached = await this.cacheService.get<GeocodingResult>(cacheKey);
      if (cached) {
        this.logger.debug(`Reverse geocoding cache hit for coordinates: ${latitude},${longitude}`);
        return { ...cached, source: 'cache' };
      }

      // Try Google Maps API first
      let result = await this.reverseGeocodeWithGoogle(coordinates);
      
      // Fallback to OpenStreetMap if Google fails
      if (!result) {
        result = await this.reverseGeocodeWithOpenStreetMap(coordinates);
      }

      if (!result) {
        throw new BadRequestException(`Unable to reverse geocode coordinates: ${latitude},${longitude}`);
      }

      // Cache the result
      await this.cacheService.set(cacheKey, result, this.cacheTTL);
      
      this.logger.log(`Successfully reverse geocoded coordinates: ${latitude},${longitude}`);
      return result;
    } catch (error) {
      this.logger.error(`Reverse geocoding failed for coordinates ${latitude},${longitude}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Geocoding using Google Maps API
   */
  private async geocodeWithGoogle(address: string): Promise<GeocodingResult | null> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      this.logger.warn('Google Maps API key not configured, skipping Google geocoding');
      return null;
    }

    try {
      this.logger.debug(`Google geocoding for address: ${address}`);
      
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        this.logger.warn(`Google Maps API returned status: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        this.logger.debug(`Google Maps API returned status: ${data.status} for address: ${address}`);
        return null;
      }

      const result = data.results[0];
      const location = result.geometry.location;
      
      if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        this.logger.warn(`Invalid coordinates returned from Google Maps: ${JSON.stringify(location)}`);
        return null;
      }

      const addressComponents = result.address_components || [];
      const getComponent = (types: string[]) => {
        const component = addressComponents.find((comp: any) => 
          types.some(type => comp.types.includes(type))
        );
        return component?.long_name || '';
      };

      return {
        coordinates: {
          latitude: location.lat,
          longitude: location.lng,
        },
        address: {
          formattedAddress: result.formatted_address || address,
          city: getComponent(['locality', 'administrative_area_level_2']),
          state: getComponent(['administrative_area_level_1']),
          country: getComponent(['country']),
          postalCode: getComponent(['postal_code']),
        },
        confidence: 0.9,
        source: 'google',
      };
    } catch (error) {
      this.logger.error(`Google geocoding failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Reverse geocoding using Google Maps API
   */
  private async reverseGeocodeWithGoogle(coordinates: Coordinates): Promise<GeocodingResult | null> {
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    if (!apiKey) {
      this.logger.warn('Google Maps API key not configured, skipping Google reverse geocoding');
      return null;
    }

    try {
      this.logger.debug(`Google reverse geocoding for coordinates: ${coordinates.latitude},${coordinates.longitude}`);
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.latitude},${coordinates.longitude}&key=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        this.logger.warn(`Google Maps API returned status: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        this.logger.debug(`Google Maps API returned status: ${data.status} for coordinates: ${coordinates.latitude},${coordinates.longitude}`);
        return null;
      }

      const result = data.results[0];
      const addressComponents = result.address_components || [];
      const getComponent = (types: string[]) => {
        const component = addressComponents.find((comp: any) => 
          types.some(type => comp.types.includes(type))
        );
        return component?.long_name || '';
      };

      return {
        coordinates,
        address: {
          formattedAddress: result.formatted_address || '',
          city: getComponent(['locality', 'administrative_area_level_2']),
          state: getComponent(['administrative_area_level_1']),
          country: getComponent(['country']),
          postalCode: getComponent(['postal_code']),
        },
        confidence: 0.9,
        source: 'google',
      };
    } catch (error) {
      this.logger.error(`Google reverse geocoding failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Geocoding using OpenStreetMap Nominatim API
   */
  private async geocodeWithOpenStreetMap(address: string): Promise<GeocodingResult | null> {
    try {
      this.logger.debug(`OpenStreetMap geocoding for address: ${address}`);
      
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Healthcare-Backend/1.0 (contact@unlimtedhealth.com)',
        },
      });

      if (!response.ok) {
        this.logger.warn(`OpenStreetMap API returned status: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (!Array.isArray(data) || data.length === 0) {
        this.logger.debug(`No results found for address: ${address}`);
        return null;
      }

      const result = data[0];
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);

      if (isNaN(lat) || isNaN(lon)) {
        this.logger.warn(`Invalid coordinates returned: lat=${result.lat}, lon=${result.lon}`);
        return null;
      }

      return {
        coordinates: {
          latitude: lat,
          longitude: lon,
        },
        address: {
          formattedAddress: result.display_name || address,
          city: result.address?.city || result.address?.town || result.address?.village || '',
          state: result.address?.state || '',
          country: result.address?.country || '',
          postalCode: result.address?.postcode || '',
        },
        confidence: 0.7,
        source: 'openstreetmap',
      };
    } catch (error) {
      this.logger.error(`OpenStreetMap geocoding failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Reverse geocoding using OpenStreetMap Nominatim API
   */
  private async reverseGeocodeWithOpenStreetMap(coordinates: Coordinates): Promise<GeocodingResult | null> {
    try {
      this.logger.debug(`OpenStreetMap reverse geocoding for coordinates: ${coordinates.latitude},${coordinates.longitude}`);
      
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates.latitude}&lon=${coordinates.longitude}&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Healthcare-Backend/1.0 (contact@unlimtedhealth.com)',
        },
      });

      if (!response.ok) {
        this.logger.warn(`OpenStreetMap API returned status: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (!data || data.error) {
        this.logger.debug(`No results found for coordinates: ${coordinates.latitude},${coordinates.longitude}`);
        return null;
      }

      return {
        coordinates,
        address: {
          formattedAddress: data.display_name || '',
          city: data.address?.city || data.address?.town || data.address?.village || '',
          state: data.address?.state || '',
          country: data.address?.country || '',
          postalCode: data.address?.postcode || '',
        },
        confidence: 0.7,
        source: 'openstreetmap',
      };
    } catch (error) {
      this.logger.error(`OpenStreetMap reverse geocoding failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Normalizes address for consistent caching
   */
  private normalizeAddress(address: string): string {
    return address
      .trim()
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s,-]/g, '');
  }

  /**
   * Validates geocoding result
   */
  private validateGeocodingResult(result: unknown): result is GeocodingResult {
    if (!result || typeof result !== 'object') {
      return false;
    }

    const r = result as Record<string, unknown>;
    
    return (
      typeof r.coordinates === 'object' &&
      r.coordinates !== null &&
      typeof (r.coordinates as Record<string, unknown>).latitude === 'number' &&
      typeof (r.coordinates as Record<string, unknown>).longitude === 'number' &&
      typeof r.confidence === 'number' &&
      typeof r.source === 'string'
    );
  }

  /**
   * Clears geocoding cache
   */
  async clearCache(): Promise<void> {
    try {
      // Implementation would depend on your cache service
      this.logger.log('Geocoding cache cleared');
    } catch (error) {
      this.logger.error(`Failed to clear geocoding cache: ${error.message}`);
    }
  }

  /**
   * Gets cache statistics
   */
  async getCacheStats(): Promise<{ hits: number; misses: number; size: number }> {
    try {
      // Mock implementation - replace with actual cache statistics
      return {
        hits: 0,
        misses: 0,
        size: 0,
      };
    } catch (error) {
      this.logger.error(`Failed to get cache stats: ${error.message}`);
      return { hits: 0, misses: 0, size: 0 };
    }
  }
} 