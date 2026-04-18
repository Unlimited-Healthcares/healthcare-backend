/**
 * Core location types and interfaces for GPS & Location Services
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Address {
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  formattedAddress?: string;
}

export interface LocationPoint extends Coordinates {
  id: string;
  name?: string;
  type?: string;
}

export interface CenterWithDistance {
  id: string;
  name: string;
  type: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number; // in kilometers
  distanceUnit: string;
  phone?: string;
  email?: string;
  hours?: string;
  imageUrl?: string;
  isActive: boolean;
  services?: string[];
}

export interface NearbySearchDto {
  latitude: number;
  longitude: number;
  radius: number; // in kilometers
  centerType?: string;
  services?: string[];
  emergencyOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface LocationUpdateDto {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

export interface LocationSearchDto {
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  centerType?: string;
  radius?: number;
  latitude?: number;
  longitude?: number;
}

export interface EmergencySearchDto extends NearbySearchDto {
  emergencyType: EmergencyType;
  urgency: UrgencyLevel;
}

export enum EmergencyType {
  AMBULANCE = 'ambulance',
  HOSPITAL = 'hospital',
  URGENT_CARE = 'urgent_care',
  PHARMACY = 'pharmacy',
  FIRE_DEPARTMENT = 'fire_department',
  POLICE = 'police'
}

export enum UrgencyLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum GeofenceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}

export enum GeofenceEventType {
  ENTER = 'enter',
  EXIT = 'exit',
  DWELL = 'dwell'
}

export interface GeofenceZone {
  id: string;
  centerId: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number; // in meters
  isActive: boolean;
  notificationEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GeofenceEvent {
  id: string;
  geofenceId: string;
  geofenceName: string;
  entityType: string;
  entityId: string;
  eventType: GeofenceEventType;
  coordinates: Coordinates;
  timestamp: Date;
  distance: number;
  metadata?: Record<string, unknown>;
}

export interface CreateGeofenceZoneDto {
  name: string;
  description?: string;
  centerLatitude: number;
  centerLongitude: number;
  radius: number;
  centerId?: string;
  status?: GeofenceStatus;
}

export interface UpdateGeofenceZoneDto {
  name?: string;
  description?: string;
  centerLatitude?: number;
  centerLongitude?: number;
  radius?: number;
  status?: GeofenceStatus;
}

export interface DirectionsResult {
  distance: number; // in kilometers
  duration: number; // in minutes
  steps: DirectionStep[];
  polyline?: string;
}

export interface DirectionStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: Coordinates;
  endLocation: Coordinates;
}

export interface PlaceDetails {
  placeId: string;
  name: string;
  address: Address;
  location: Coordinates;
  phoneNumber?: string;
  website?: string;
  rating?: number;
  openingHours?: string[];
}

export interface LocationCacheEntry {
  userId: string;
  location: Coordinates;
  timestamp: Date;
  accuracy?: number; // in meters
  source: 'gps' | 'network' | 'manual';
}

export interface LocationHistory {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: Date;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface GeocodingResult {
  coordinates: Coordinates;
  address: Address;
  confidence: number;
  source: 'google' | 'openstreetmap' | 'cache';
}

export interface DistanceCalculationOptions {
  unit: 'km' | 'miles' | 'meters';
  precision: number;
  algorithm: 'haversine' | 'vincenty';
}

export interface LocationValidationResult {
  isValid: boolean;
  errors: string[];
  normalizedLocation?: Coordinates;
}

export interface ServiceLocation extends LocationPoint {
  serviceType: string;
  availability: boolean;
  operatingHours?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
  };
}

export interface SearchResult {
  centers: CenterWithDistance[];
  totalCount: number;
  searchRadius: number;
  searchCenter: Coordinates;
  executionTime: number; // in milliseconds
}

export interface LocationMetadata {
  timezone?: string;
  elevation?: number;
  accuracy?: number;
  lastUpdated?: Date;
  source?: string;
  verified?: boolean;
  [key: string]: unknown;
} 