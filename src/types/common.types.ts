/**
 * Common utility types used across the application
 */

/**
 * Represents a JSON object with string keys and unknown values
 */
export type JsonObject = Record<string, unknown>;

/**
 * Represents a JSON value that can be any valid JSON type
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];

/**
 * Utility type for pagination parameters
 */
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/**
 * Standard response wrapper for API endpoints
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: Date;
}

/**
 * File upload metadata
 */
export interface FileMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  uploadedBy: string;
  category?: string;
  tags?: string[];
}

/**
 * Audit trail information
 */
export interface AuditInfo {
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
  version: number;
}

/**
 * Represents a GeoJSON Point for PostGIS geography/geometry
 */
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}