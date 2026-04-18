import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const response = context.switchToHttp().getResponse();
    
    return next.handle().pipe(
      tap(() => {
        if (response.headersSent || response.writableEnded) {
          return;
        }

        // Set security headers
        response.setHeader('X-Content-Type-Options', 'nosniff');
        response.setHeader('X-Frame-Options', 'DENY');
        response.setHeader('X-XSS-Protection', '1; mode=block');
        response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; object-src 'none'");
        response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        
        // Remove potentially dangerous headers
        response.removeHeader('X-Powered-By');
        response.removeHeader('Server');
      }),
    );
  }
} 