import { JsonObject, JsonValue } from './common';
import { Profile } from '../users/entities/profile.entity';

/**
 * Standard API response structure
 */
export interface StandardApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Authentication response structure
 */
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email: string;
    roles: string[];
    displayId: string;
    isActive?: boolean;
    createdAt?: Date;
  };
  profile?: Profile | null;
  center_id?: string;
  expiresIn?: number;
}

/**
 * User profile response structure
 */
export interface UserProfileResponse {
  id: string;
  email: string;
  roles: string[];
  displayId: string;
  profile: Profile | null;
  center_id?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

/**
 * Paginated API response structure
 */
export interface PaginatedApiResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  message?: string;
  timestamp: string;
}

/**
 * Bulk operation response structure
 */
export interface BulkOperationResponse {
  success: number;
  failed: number;
  total: number;
  errors: string[];
  details?: {
    successIds: string[];
    failedIds: string[];
  };
}

/**
 * File upload response structure
 */
export interface FileUploadResponse {
  success: boolean;
  file: {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: Date;
  };
  message?: string;
}

/**
 * Search response structure
 */
export interface SearchResponse<T = unknown> {
  results: T[];
  total: number;
  query: string;
  filters?: JsonObject;
  facets?: {
    [key: string]: {
      value: string;
      count: number;
    }[];
  };
  suggestions?: string[];
}

/**
 * Analytics response structure
 */
export interface AnalyticsResponse {
  metrics: {
    [key: string]: number | string;
  };
  trends: {
    period: string;
    data: {
      date: string;
      value: number;
    }[];
  }[];
  comparisons?: {
    current: number;
    previous: number;
    change: number;
    changePercent: number;
  };
  breakdown?: {
    category: string;
    value: number;
    percentage: number;
  }[];
}

/**
 * Health check response structure
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    [serviceName: string]: {
      status: 'up' | 'down' | 'degraded';
      responseTime?: number;
      lastCheck: string;
      error?: string;
    };
  };
  metrics?: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
}

/**
 * Validation error response structure
 */
export interface ValidationErrorResponse {
  success: false;
  error: 'VALIDATION_ERROR';
  message: string;
  details: {
    field: string;
    message: string;
    code: string;
    value?: JsonValue;
  }[];
  timestamp: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: JsonObject;
  timestamp: string;
  requestId?: string;
  stack?: string; // Only in development
}

/**
 * Cache operation response
 */
export interface CacheResponse<T = unknown> {
  hit: boolean;
  data?: T;
  ttl?: number;
  key: string;
  timestamp: string;
}

/**
 * Export operation response
 */
export interface ExportResponse {
  success: boolean;
  exportId: string;
  format: 'csv' | 'xlsx' | 'pdf' | 'json';
  downloadUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  estimatedCompletion?: Date;
  fileSize?: number;
}

/**
 * Import operation response
 */
export interface ImportResponse {
  success: boolean;
  importId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  results?: {
    totalRecords: number;
    successfulRecords: number;
    failedRecords: number;
    errors: string[];
  };
}

/**
 * Notification response structure
 */
export interface NotificationResponse {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  metadata?: JsonObject;
}

/**
 * System configuration response
 */
export interface SystemConfigResponse {
  [key: string]: {
    value: JsonValue;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description?: string;
    lastModified: Date;
    modifiedBy: string;
    isReadOnly?: boolean;
  };
} 