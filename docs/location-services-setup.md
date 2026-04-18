# GPS & Location Services Setup Guide

## Overview

The GPS & Location Services module provides comprehensive location-based functionality for the healthcare management system, including:

- **Location Services**: Coordinate validation, distance calculations, and location history tracking
- **Geocoding Services**: Address-to-coordinates conversion and reverse geocoding with caching
- **Geofencing Services**: Zone management, entry/exit detection, and notifications

## Environment Configuration

Add the following environment variables to your `.env` file:

```bash
# Google Maps API Configuration (Optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Location Services Configuration
LOCATION_CACHE_TTL=86400  # 24 hours in seconds
LOCATION_DEFAULT_RADIUS=10  # Default search radius in kilometers
LOCATION_MAX_RADIUS=100  # Maximum allowed search radius in kilometers

# Geofencing Configuration
GEOFENCE_CHECK_INTERVAL=30  # Seconds between geofence checks
GEOFENCE_MAX_ZONES_PER_CENTER=50  # Maximum geofence zones per healthcare center
GEOFENCE_DEFAULT_RADIUS=100  # Default geofence radius in meters
GEOFENCE_MAX_RADIUS=10000  # Maximum geofence radius in meters

# Location History Configuration
LOCATION_HISTORY_RETENTION_DAYS=365  # Days to retain location history
LOCATION_HISTORY_MAX_RECORDS_PER_ENTITY=10000  # Maximum records per entity
```

## Database Setup

### 1. Run Migration

The location services require new database tables. Run the migration:

```bash
npm run migration:run
```

This will create:
- `location_history` table for tracking location updates
- `geofence_zones` table for managing geofence zones
- Appropriate indexes for performance optimization

### 2. Update Healthcare Centers

The `healthcare_centers` table has been updated with location fields:
- `latitude` and `longitude` for coordinates
- `city`, `state`, `country`, `postal_code` for address components
- `location_metadata` for additional location information

## API Endpoints

### Location Services

#### Validate Coordinates
```http
POST /api/location/validate-coordinates
Content-Type: application/json
Authorization: Bearer <token>

{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Calculate Distance
```http
POST /api/location/calculate-distance
Content-Type: application/json
Authorization: Bearer <token>

{
  "point1": { "latitude": 40.7128, "longitude": -74.0060 },
  "point2": { "latitude": 40.7589, "longitude": -73.9851 }
}
```

#### Record Location
```http
POST /api/location/record-location
Content-Type: application/json
Authorization: Bearer <token>

{
  "entityType": "patient",
  "entityId": "123e4567-e89b-12d3-a456-426614174000",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "source": "gps",
  "metadata": {
    "accuracy": 5.0,
    "provider": "gps"
  }
}
```

### Geocoding Services

#### Geocode Address
```http
POST /api/location/geocode
Content-Type: application/json
Authorization: Bearer <token>

{
  "address": "123 Main St, New York, NY 10001"
}
```

#### Reverse Geocode
```http
POST /api/location/reverse-geocode
Content-Type: application/json
Authorization: Bearer <token>

{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

### Geofencing Services

#### Create Geofence Zone
```http
POST /api/location/geofences
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Hospital Main Entrance",
  "description": "Geofence zone for the main hospital entrance",
  "centerLatitude": 40.7128,
  "centerLongitude": -74.0060,
  "radius": 100,
  "centerId": "123e4567-e89b-12d3-a456-426614174000",
  "status": "active"
}
```

#### Check Geofence Entry
```http
POST /api/location/geofences/check-entry
Content-Type: application/json
Authorization: Bearer <token>

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "entityType": "patient",
  "entityId": "123e4567-e89b-12d3-a456-426614174000"
}
```

## Service Integration

### Using Location Services in Other Modules

```typescript
import { LocationService } from '../location/services/location.service';

@Injectable()
export class YourService {
  constructor(
    private readonly locationService: LocationService,
  ) {}

  async processLocation(latitude: number, longitude: number) {
    // Validate coordinates
    this.locationService.validateCoordinates(latitude, longitude);

    // Calculate distance to nearest center
    const nearbyPoints = this.locationService.findNearbyPoints(
      { latitude, longitude },
      healthcareCenters,
      10 // 10km radius
    );

    // Record location history
    await this.locationService.recordLocationHistory(
      'patient',
      patientId,
      { latitude, longitude },
      { source: 'mobile_app' }
    );
  }
}
```

### Using Geocoding Services

```typescript
import { GeocodingService } from '../location/services/geocoding.service';

@Injectable()
export class YourService {
  constructor(
    private readonly geocodingService: GeocodingService,
  ) {}

  async processAddress(address: string) {
    // Convert address to coordinates
    const result = await this.geocodingService.geocodeAddress(address);
    
    console.log('Coordinates:', result.coordinates);
    console.log('Formatted Address:', result.address.formattedAddress);
    console.log('Confidence:', result.confidence);
  }
}
```

### Using Geofencing Services

```typescript
import { GeofencingService } from '../location/services/geofencing.service';

@Injectable()
export class YourService {
  constructor(
    private readonly geofencingService: GeofencingService,
  ) {}

  async checkPatientLocation(patientId: string, coordinates: Coordinates) {
    // Check if patient entered/exited any geofence zones
    const events = await this.geofencingService.checkGeofenceEntry(
      coordinates,
      'patient',
      patientId,
      userId
    );

    // Process geofence events
    for (const event of events) {
      if (event.eventType === 'enter') {
        console.log(`Patient entered ${event.geofenceName}`);
        // Trigger notifications, update status, etc.
      }
    }
  }
}
```

## Performance Considerations

### Caching

- Geocoding results are cached for 24 hours by default
- Location history queries are optimized with proper indexing
- Consider implementing Redis for distributed caching in production

### Database Optimization

- Location coordinates are indexed for fast spatial queries
- Location history is partitioned by timestamp for better performance
- Consider implementing data archiving for old location records

### Rate Limiting

- Google Maps API has usage limits and costs
- Implement rate limiting for geocoding endpoints
- Use OpenStreetMap as a fallback for geocoding

## Security Considerations

### Data Privacy

- Location data is sensitive and requires proper access controls
- Implement data retention policies for location history
- Consider anonymization for analytics purposes

### Access Control

- Location endpoints require authentication
- Role-based access control is enforced
- Audit logging is implemented for all location operations

### GDPR Compliance

- Location data is considered personal data under GDPR
- Implement data export and deletion capabilities
- Provide clear consent mechanisms for location tracking

## Monitoring and Alerts

### Key Metrics

- Location update frequency per entity
- Geocoding cache hit/miss ratios
- Geofence event frequency
- API response times

### Alerts

- High error rates in geocoding services
- Unusual location patterns (potential security issues)
- Geofence zone violations
- Database performance issues

## Troubleshooting

### Common Issues

1. **Geocoding Failures**
   - Check Google Maps API key configuration
   - Verify API quotas and billing
   - Check OpenStreetMap fallback functionality

2. **Location Validation Errors**
   - Ensure coordinates are within valid ranges
   - Check for null/undefined values
   - Verify coordinate precision

3. **Geofence Detection Issues**
   - Verify geofence zone coordinates and radius
   - Check entity location history
   - Ensure proper distance calculations

### Debug Mode

Enable debug logging by setting:
```bash
LOG_LEVEL=debug
```

This will provide detailed logs for location operations, geocoding requests, and geofence calculations.

## Testing

### Unit Tests

Run location service tests:
```bash
npm run test -- --testPathPattern=location
```

### Integration Tests

Test with real coordinates and addresses:
```bash
npm run test:e2e -- --testNamePattern="Location"
```

### Load Testing

Test location services under load:
```bash
npm run test:load -- location-endpoints
```

## Future Enhancements

### Planned Features

1. **Real-time Location Tracking**
   - WebSocket-based location updates
   - Live location sharing between users
   - Real-time geofence monitoring

2. **Advanced Geofencing**
   - Polygon-based geofences
   - Time-based geofence rules
   - Conditional geofence triggers

3. **Location Analytics**
   - Heat maps of location activity
   - Travel pattern analysis
   - Location-based insights

4. **Integration Enhancements**
   - Apple Maps integration
   - Waze integration for traffic data
   - Public transit integration

## Support

For issues related to GPS & Location Services:

1. Check the troubleshooting section above
2. Review the application logs
3. Verify environment configuration
4. Contact the development team with specific error details

## API Documentation

Complete API documentation is available at:
- Swagger UI: `http://localhost:3000/api/docs`
- OpenAPI Spec: `http://localhost:3000/api/docs-json`

Look for the "location" tag in the API documentation for all location-related endpoints. 