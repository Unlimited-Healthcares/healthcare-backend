// Polyfill for crypto global object (required for @nestjs/schedule)
import { webcrypto } from 'crypto';
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { LoggingInterceptor } from './interceptors/logging.interceptor';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import * as bodyParser from 'body-parser';
import { DataSource } from 'typeorm';
import { seedAdmin } from './database/seeds/admin-seed';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Required for Stripe webhook signature verification
  });

  // Increase body size limit for base64 profile picture uploads
  // Default is ~100KB which is too small for image payloads
  const expressApp = app.getHttpAdapter().getInstance();
  expressApp.use(bodyParser.json({ limit: '10mb' }));
  expressApp.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // WebSocket gateways are automatically configured by NestJS
  // No additional adapter configuration needed for @nestjs/websockets

  // Set global prefix for API routes
  const globalPrefix = process.env.API_PREFIX || 'api';
  app.setGlobalPrefix(globalPrefix, {
    exclude: ['/'],
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false,
      exceptionFactory: (errors) => {
        const messages = errors.map(error => {
          const constraints = error.constraints;
          if (constraints) {
            return Object.values(constraints).join(', ');
          }
          return `${error.property} is invalid`;
        });

        console.error('❌ Validation Errors:', JSON.stringify(messages, null, 2));

        return new BadRequestException({
          statusCode: 400,
          message: messages,
          error: 'Bad Request',
        });
      },
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global filters
  app.useGlobalFilters(new GlobalExceptionFilter());

  // CORS configuration
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  const isWildcard = corsOrigin === '*';
  const allowedOrigins = isWildcard
    ? true
    : corsOrigin.split(',').map(o => o.trim());

  console.log(`CORS: Allowed Origins = ${corsOrigin}`);

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Request-ID',
      'Cache-Control',
      'Accept',
      'X-Requested-With',
    ],
    exposedHeaders: ['Content-Type', 'Cache-Control', 'X-Accel-Buffering'],
    credentials: !isWildcard, // Only allow credentials when specific origins are set
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  console.log(`🔒 CORS: Enabled for origin(s): ${corsOrigin}`);
  console.log('🔧 Environment Variables:');
  console.log('  - NODE_ENV:', process.env.NODE_ENV);
  console.log('  - FRONTEND_URL:', process.env.FRONTEND_URL);
  console.log('  - PORT:', process.env.PORT);
  console.log('  - HOST:', process.env.HOST);

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('UNLIMITEDHEALTHCARE API')
    .setDescription(`
      Comprehensive Healthcare Management API
      
      ## Overview
      This API provides complete healthcare management functionality including:
      - User authentication and authorization
      - Patient and medical record management
      - Appointment scheduling and management
      - Chat and video conferencing systems
      - Emergency services and ambulance tracking
      - Blood donation system
      - Equipment marketplace
      - AI-powered medical assistance
      - Reviews and ratings system
      - Location-based services
      
      ## Authentication
      Most endpoints require JWT authentication. Include the token in the Authorization header:
      \`Authorization: Bearer YOUR_JWT_TOKEN\`
      
      ## Rate Limiting
      API requests are rate-limited to prevent abuse:
      - 100 requests per minute per API key
      - 1000 requests per hour per API key
      - 10,000 requests per day per API key
      
      ## Error Responses
      All errors follow the standard HTTP status codes with detailed error messages.
      
      ## Support
      For API support, contact: codesphere@unlimitedhealthcares.com
    `)
    .setVersion('2.1.3')
    .setContact(
      'UNLIMITEDHEALTHCARE API Team',
      'https://unlimitedhealthcares.com',
      'codesphere@unlimitedhealthcares.com'
    )
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://healthcare-backend-8tfs.onrender.com', 'Production Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API Key for external integrations',
      },
      'API-Key',
    )
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Users', 'User management and profiles')
    .addTag('Patients', 'Patient management and medical records')
    .addTag('Medical Records', 'Medical record management with versioning')
    .addTag('Appointments', 'Appointment scheduling and management')
    .addTag('Chat', 'Real-time chat system')
    .addTag('Video Conferencing', 'Video conferencing and meetings')
    .addTag('Emergency Services', 'Emergency alerts and ambulance services')
    .addTag('Blood Donation', 'Blood donation system management')
    .addTag('Equipment Marketplace', 'Medical equipment marketplace')
    .addTag('AI Assistant', 'AI-powered medical assistance')
    .addTag('Reviews & Ratings', 'Reviews and ratings system')
    .addTag('Location Services', 'GPS and location-based services')
    .addTag('Notifications', 'Notification management')
    .addTag('Analytics', 'Analytics and reporting')
    .addTag('Admin', 'Administrative functions')
    .addTag('Health Check', 'API health monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
    deepScanRoutes: true,
  });

  // Customize the Swagger UI
  SwaggerModule.setup(`${globalPrefix}/docs`, app, document, {
    customSiteTitle: 'UNLIMITEDHEALTHCARE API Documentation',
    customfavIcon: '/favicon.ico',
    customJs: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-standalone-preset.min.js',
    ],
    customCssUrl: [
      'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css',
    ],
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
      defaultModelsExpandDepth: 2,
      defaultModelExpandDepth: 2,
    },
  });

  // API Documentation JSON endpoint
  app.getHttpAdapter().get('/api-json', (req, res) => {
    res.json(document);
  });

  // Run database seeds on startup (idempotent)
  try {
    const dataSource = app.get(DataSource);

    console.log('🌱 Checking for core database seeds...');
    await seedAdmin(dataSource);
  } catch (seedError) {
    console.warn(`⚠️ Seed warning: ${seedError.message}`);
  }

  const port = process.env.PORT || 3000;
  const host = process.env.HOST || '0.0.0.0';

  await app.listen(port, host);

  console.log(`🚀 Application is running on: http://${host}:${port}`);
  console.log(`📚 API Documentation: http://${host}:${port}/${globalPrefix}/docs`);
  console.log(`📄 API JSON: http://${host}:${port}/${globalPrefix}/api-json`);
  console.log(`🔍 Health Check: http://${host}:${port}/${globalPrefix}/health`);
  console.log(`🌐 Production URL: https://healthcare-backend-8tfs.onrender.com`);
  console.log(`🔒 CORS: Enabled for ${corsOrigin}`);
}

bootstrap();
