/**
 * Common type definitions for the Healthcare Management System
 * These types replace all `any` usage throughout the application
 */

// Base metadata interface for all entities
export interface BaseMetadata {
  createdBy?: string;
  updatedBy?: string;
  version?: number;
  tags?: string[];
  category?: string;
  source?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

// JSON data structures
export interface JsonObject {
  [key: string]: JsonValue;
}

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[];

// API Response structures
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  requestId?: string;
}

export interface PaginatedResponse<T = unknown> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Audit and logging structures
export interface AuditLogData {
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  timestamp: Date;
  changes?: {
    field: string;
    oldValue: JsonValue;
    newValue: JsonValue;
  }[];
  metadata?: BaseMetadata;
}

export interface ActivityLogData {
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  details?: JsonObject;
}

// Medical data structures
export interface MedicalData {
  diagnosis?: string;
  symptoms?: string[];
  medications?: MedicationInfo[];
  allergies?: string[];
  vitalSigns?: VitalSigns;
  labResults?: LabResult[];
  notes?: string;
  attachments?: FileAttachment[];
}

export interface MedicationInfo {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy: string;
  notes?: string;
}

export interface VitalSigns {
  bloodPressure?: {
    systolic: number;
    diastolic: number;
  };
  heartRate?: number;
  temperature?: number;
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  height?: number;
  bmi?: number;
}

export interface LabResult {
  testName: string;
  value: string | number;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'abnormal' | 'critical';
  date: Date;
  notes?: string;
}

export interface FileAttachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  metadata?: BaseMetadata;
}

// Location and geographic data
export interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  accuracy?: number;
}

export interface GeoSearchResult {
  id: string;
  name: string;
  type: string;
  location: LocationData;
  distance?: number;
  rating?: number;
  contact?: ContactInfo;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  hours?: string;
}

// Emergency and tracking data
export interface EmergencyData {
  type: 'medical' | 'fire' | 'police' | 'ambulance';
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: LocationData;
  description: string;
  reportedBy: string;
  timestamp: Date;
  status: 'pending' | 'dispatched' | 'in-progress' | 'resolved' | 'cancelled';
  assignedUnits?: string[];
  estimatedArrival?: Date;
  notes?: string;
}

export interface TrackingData {
  entityId: string;
  entityType: string;
  location: LocationData;
  timestamp: Date;
  status: string;
  metadata?: JsonObject;
}

// Equipment and marketplace data
export interface EquipmentSpecifications {
  manufacturer: string;
  model: string;
  serialNumber?: string;
  yearManufactured?: number;
  condition: 'new' | 'excellent' | 'good' | 'fair' | 'poor';
  certifications?: string[];
  warranty?: {
    type: string;
    expiryDate: Date;
    provider: string;
  };
  technicalSpecs?: JsonObject;
}

export interface PricingInfo {
  basePrice: number;
  currency: string;
  discounts?: {
    type: string;
    value: number;
    validUntil?: Date;
  }[];
  taxes?: {
    type: string;
    rate: number;
  }[];
  shippingCost?: number;
}

// Chat and communication data
export interface ChatMessageData {
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  attachments?: FileAttachment[];
  metadata?: JsonObject;
  replyTo?: string;
  edited?: boolean;
  editedAt?: Date;
}

export interface ParticipantSettings {
  notifications: boolean;
  role: 'admin' | 'moderator' | 'member';
  permissions: string[];
  customSettings?: JsonObject;
}

// Video conferencing data
export interface ConferenceSettings {
  maxParticipants: number;
  recordingEnabled: boolean;
  chatEnabled: boolean;
  screenSharingEnabled: boolean;
  waitingRoomEnabled: boolean;
  password?: string;
  customSettings?: JsonObject;
}

export interface ParticipantData {
  userId: string;
  displayName: string;
  role: 'host' | 'moderator' | 'participant';
  joinedAt: Date;
  leftAt?: Date;
  connectionQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  settings?: JsonObject;
}

// System configuration data
export interface SystemConfigValue {
  value: JsonValue;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  validationRules?: JsonObject;
  lastModified: Date;
  modifiedBy: string;
}

// Error and validation types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: JsonValue;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: JsonObject;
  timestamp: Date;
  requestId?: string;
  userId?: string;
}

// Cache and performance types
export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  namespace?: string;
  compress?: boolean;
}

export interface PerformanceMetrics {
  responseTime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  timestamp: Date;
  metadata?: JsonObject;
}

// Export utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>; 