import { Request } from 'express';

/**
 * JWT payload structure returned by authentication strategies
 */
export interface JwtUser {
  id: string;
  sub: string;
  userId: string;
  email: string;
  roles: string[];
  username?: string;
}

/**
 * Enhanced request interface for authenticated endpoints
 */
export interface AuthenticatedRequest extends Request {
  user: JwtUser;
  requestId?: string;
  clientIp?: string;
  userAgent?: string;
}

/**
 * Request interface with optional user for mixed endpoints
 */
export interface OptionalAuthRequest extends Request {
  user?: JwtUser;
  requestId?: string;
  clientIp?: string;
  userAgent?: string;
}

/**
 * Request interface for admin endpoints
 */
export interface AdminRequest extends AuthenticatedRequest {
  user: JwtUser & {
    roles: string[];
    isAdmin: boolean;
  };
}

/**
 * Request interface for file uploads
 */
export interface FileUploadRequest extends AuthenticatedRequest {
  file?: Express.Multer.File;
  files?: Express.Multer.File[];
}

/**
 * Request interface with pagination parameters
 */
export interface PaginatedRequest extends AuthenticatedRequest {
  query: {
    page?: string;
    limit?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    [key: string]: string | undefined;
  };
} 