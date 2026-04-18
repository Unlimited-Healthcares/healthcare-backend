import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

interface JwtUser {
  sub: string;
  id?: string;
  userId?: string;
}

interface UserEntity {
  id: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() === 'http') {
      return this.logHttpCall(context, next);
    }
    return next.handle();
  }

  private logHttpCall(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const res = context.switchToHttp().getResponse<Response>();
    const { method, originalUrl, ip, body, params, query } = req;
    const userAgent = req.get('user-agent') || '';
    
    // Extract user ID with proper type checking for both User entity and JwtUser
    let userId = 'anonymous';
    if (req.user) {
      // Type guard to check if it's a JwtUser (has sub property)
      const isJwtUser = (user: unknown): user is JwtUser => {
        return typeof user === 'object' && user !== null && 'sub' in user;
      };
      
      if (isJwtUser(req.user)) {
        userId = req.user.sub || req.user.id || req.user.userId || 'anonymous';
      } else {
        // It's a User entity with id property
        userId = (req.user as UserEntity).id || 'anonymous';
      }
    }
    
    // Skip logging health check requests
    if (originalUrl.includes('/health')) {
      return next.handle();
    }

    // Get the timestamp before the request is processed
    const now = Date.now();
    
    this.logger.log(`REQUEST ${method} ${originalUrl} - ${userId} (${ip}) ${userAgent}`);
    
    // For sensitive operations, log more details
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      this.logger.debug(`REQUEST BODY: ${this.sanitizeData(body)}`);
      this.logger.debug(`REQUEST PARAMS: ${this.sanitizeData(params)}`);
      this.logger.debug(`REQUEST QUERY: ${this.sanitizeData(query)}`);
    }

    return next.handle().pipe(
      tap({
        next: (_data: unknown) => {
          const delay = Date.now() - now;
          this.logger.log(`RESPONSE ${method} ${originalUrl} - ${res.statusCode} - ${delay}ms`);
          
          // Log slow responses
          if (delay > 1000) {
            this.logger.warn(`SLOW RESPONSE ${method} ${originalUrl} - ${delay}ms`);
          }
        },
        error: (error: Error & { status?: number }) => {
          const delay = Date.now() - now;
          this.logger.error(
            `RESPONSE ERROR ${method} ${originalUrl} - ${error.status || 500} - ${delay}ms`,
            error.stack,
          );
        },
      }),
    );
  }

  private sanitizeData(data: unknown): string {
    if (!data) return 'none';
    
    // Create a deep copy to avoid modifying the original data
    const sanitized = JSON.parse(JSON.stringify(data));
    
    // Mask sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'creditCard', 'ssn', 'key'];
    
    const maskField = (obj: Record<string, unknown>) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          obj[key] = '******';
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          maskField(obj[key] as Record<string, unknown>);
        }
      });
    };
    
    maskField(sanitized);
    
    return JSON.stringify(sanitized);
  }
} 