import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SecurityHeadersInterceptor } from './interceptors/security-headers.interceptor';
import { InputValidationPipe } from './pipes/input-validation.pipe';
import { EncryptionService } from './encryption.service';
import { SecurityService } from './security.service';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60),
          limit: config.get('THROTTLE_LIMIT', 100),
        },
        // More restrictive rate limiting for testing
        {
          ttl: 60,
          limit: 10, // Only 10 requests per minute for testing
          name: 'strict',
        },
      ],
    }),
  ],
  providers: [
    EncryptionService,
    SecurityService,
    InputValidationPipe,
    // Temporarily disabled to debug 403 error
    // {
    //   provide: APP_GUARD,
    //   useClass: RateLimitGuard,
    // },
    {
      provide: APP_INTERCEPTOR,
      useClass: SecurityHeadersInterceptor,
    },
  ],
  exports: [
    EncryptionService,
    SecurityService,
    InputValidationPipe,
  ],
})
export class SecurityModule { } 