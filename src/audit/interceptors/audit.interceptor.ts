import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditService: AuditService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const action = this.reflector.get<string>('audit-action', context.getHandler());
    if (!action) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const userId = user?.sub || user?.id || user?.userId || 'anonymous';
    const ipAddress = request.ip;
    const userAgent = request.get('user-agent');

    return next.handle().pipe(
      tap(() => {
        // Log asynchronously after the request is successful
        this.auditService.logActivity(
          userId,
          context.getClass().name.replace('Controller', ''),
          action,
          `User performed ${action} via ${request.method} ${request.url}`,
          {
            path: request.url,
            method: request.method,
            body: this.sanitize(request.body),
            params: request.params,
            query: request.query,
          },
          ipAddress,
          userAgent,
        ).catch(err => {
          // Internal logging only, don't break the response
          console.error('AuditInterceptor logging failed:', err.message);
        });
      }),
    );
  }

  private sanitize(body: any) {
    if (!body || typeof body !== 'object') return body;
    
    const sanitized = { ...body };
    const sensitive = ['password', 'token', 'secret', 'cvv', 'creditCard', 'refreshToken'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '******';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    });
    
    return sanitized;
  }
}
