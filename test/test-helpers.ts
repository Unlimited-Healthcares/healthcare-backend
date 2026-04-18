import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { TestAppModule } from './test-app.module';
import { TestDataFactory } from './test-data-factory';
import { ConfigModule } from '@nestjs/config';

/**
 * Interface for test file upload object
 */
interface TestFileUpload {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination: string;
  filename: string;
  path: string;
  stream: null;
}

/**
 * Comprehensive test helper utilities for automated API testing
 */
export class TestHelpers {
  private static app: INestApplication | null = null;
  private static dataSource: DataSource | null = null;
  private static moduleRef: TestingModule | null = null;
  private static testHealthcareCenter: { id: string } | null = null;

  /**
   * Initialize the test application
   */
  static async initializeApp(): Promise<INestApplication> {
    if (this.app) {
      return this.app;
    }

    // 🔧 CRITICAL FIX: Load test environment variables
    process.env.NODE_ENV = 'test';
    
    this.moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
          isGlobal: true,
        }),
        TestAppModule, // Use TestAppModule instead of AppModule
      ],
    }).compile();

    this.app = this.moduleRef.createNestApplication();
    this.dataSource = this.moduleRef.get<DataSource>(DataSource);
    
    // 🔧 CRITICAL FIX: Ensure database is properly initialized
    if (!this.dataSource.isInitialized) {
      console.log('Initializing database connection...');
      await this.dataSource.initialize();
      console.log('Database connection initialized successfully');
    }
    
    // 🔧 CRITICAL FIX: Wait for database to be ready
    await this.waitForDatabaseConnection();
    
    // Drop and recreate all tables for clean test environment
    console.log('Synchronizing database schema...');
    await this.dataSource.synchronize(true);
    console.log('Database schema synchronized');
    
    await this.app.init();
    console.log('NestJS application initialized successfully');
    return this.app;
  }

  /**
   * Wait for database connection to be established
   */
  private static async waitForDatabaseConnection(): Promise<void> {
    const maxRetries = 10;
    const retryDelay = 1000;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Test the connection with a simple query
        await this.dataSource!.query('SELECT 1');
        console.log('Database connection verified');
        return;
      } catch (error) {
        console.log(`Database connection attempt ${i + 1}/${maxRetries} failed:`, error.message);
        if (i === maxRetries - 1) {
          throw new Error(`Failed to connect to database after ${maxRetries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Clean up and close the test application
   */
  static async closeApp(): Promise<void> {
    if (this.app) {
      await this.app.close();
      this.app = null;
      this.moduleRef = null;
      this.dataSource = null;
      this.testHealthcareCenter = null;
    }
  }

  /**
   * Get the test application instance
   */
  static getApp(): INestApplication {
    if (!this.app) {
      throw new Error('Test app not initialized. Call initializeApp() first.');
    }
    return this.app;
  }

  /**
   * Get the data source for database operations
   */
  static getDataSource(): DataSource {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error('DataSource not available or not initialized. Call initializeApp() first.');
    }
    return this.dataSource;
  }

  /**
   * Clean all test data from database
   */
  static async cleanDatabase(): Promise<void> {
    const dataSource = this.getDataSource();
    
    try {
      console.log('Starting database cleanup...');
      
      // Check if connection is still alive
      if (!dataSource.isInitialized) {
        console.log('Database connection lost, reinitializing...');
        await dataSource.initialize();
      }
      
      // Disable foreign key constraints temporarily for easier cleanup
      await dataSource.query(`SET session_replication_role = replica;`);
      
      // Order matters due to foreign key constraints - children first, then parents
      const entities = [
        // Chat system (most dependent)
        'chat_message_reactions',
        'chat_messages', 
        'chat_participants',
        'chat_rooms',
        
        // Medical records and documents
        'medical_record_files',
        'medical_record_shares',
        'medical_record_share_requests',
        'medical_records',
        
        // Appointments and referrals
        'appointment_participants',
        'appointment_reminders',
        'appointments',
        'appointment_types',
        'referral_documents',
        'referrals',
        
        // Blood donation system
        'blood_donations',
        'blood_donation_requests',
        'donation_appointments',
        'donor_rewards',
        'donor_verifications',
        'blood_donors',
        'blood_inventory',
        
        // Emergency system
        'ambulance_requests',
        'ambulances',
        'emergency_contacts',
        
        // Location and admin
        'location_history',
        'geofence_zones',
        'user_activity_logs',
        'center_verification_requests',
        'audit_logs',
        
        // Notifications
        'notifications',
        'notification_preferences',
        
        // Patient data
        'patient_visits',
        'patients',
        
        // Center data
        'center_staff',
        'center_services',
        'center_availability',
        
        // User data (profiles depend on users)
        'user_health_profiles',
        'user_settings',
        'user_management',
        'profiles',
        'users',
        
        // Base entities (no dependencies)
        'healthcare_centers',
      ];

      for (const entity of entities) {
        try {
          // Check if connection is still alive before each operation
          if (!dataSource.isInitialized) {
            console.log('Reconnecting to database...');
            await dataSource.initialize();
          }
          
          // Check if table exists first
          const tableExists = await dataSource.query(
            `SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = $1
            )`,
            [entity]
          );
          
          if (tableExists[0]?.exists) {
            // Special handling for users table to ensure complete cleanup
            if (entity === 'users') {
              await dataSource.query(`DELETE FROM ${entity} WHERE email LIKE '%@example.com';`);
              console.log(`Cleaned users table (removed test emails)`);
            } else {
              await dataSource.query(`TRUNCATE TABLE ${entity} RESTART IDENTITY CASCADE;`);
              console.log(`Cleaned table: ${entity}`);
            }
          } else {
            console.log(`Table ${entity} does not exist, skipping`);
          }
        } catch (error) {
          console.warn(`Could not clean table ${entity}:`, error.message);
          // Try to reconnect if connection was lost
          if (error.message.includes('Driver not Connected') || error.message.includes('Connection terminated')) {
            try {
              console.log('Attempting to reconnect to database...');
              await dataSource.initialize();
            } catch (reconnectError) {
              console.error('Failed to reconnect to database:', reconnectError.message);
            }
          }
        }
      }
      
      // Re-enable foreign key constraints
      try {
        if (dataSource.isInitialized) {
          await dataSource.query(`SET session_replication_role = DEFAULT;`);
        }
      } catch {
        // Ignore errors when resetting constraints during cleanup
      }
      
      console.log('Database cleanup completed successfully');
      
    } catch (error) {
      console.error('Error during database cleanup:', error);
      // Re-enable foreign key constraints even on error
      try {
        if (dataSource.isInitialized) {
          await dataSource.query(`SET session_replication_role = DEFAULT;`);
        }
      } catch {
        // Ignore cleanup errors during error handling
      }
      throw error;
    }
    
    // Reset the test healthcare center reference
    this.testHealthcareCenter = null;
  }

  /**
   * Reset database to clean state
   */
  static async resetDatabase(): Promise<void> {
    console.log('Resetting database...');
    const dataSource = this.getDataSource();
    
    try {
      // Clean all data
      await this.cleanDatabase();
      
      // Ensure we have a clean state by waiting a bit
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create a test healthcare center for all tests
      await this.createTestHealthcareCenter();
      console.log('Database reset completed');
    } catch (error) {
      console.error('Error during database reset:', error);
      // Try to recover by reinitializing the connection
      try {
        if (!dataSource.isInitialized) {
          await dataSource.initialize();
        }
      } catch (reconnectError) {
        console.error('Failed to reconnect during reset:', reconnectError.message);
      }
      throw error;
    }
  }

  /**
   * Create a test healthcare center that can be reused across tests
   */
  static async createTestHealthcareCenter(): Promise<{ id: string }> {
    if (this.testHealthcareCenter) {
      return this.testHealthcareCenter;
    }

    const dataSource = this.getDataSource();
    
    const centerData = {
      id: '550e8400-e29b-41d4-a716-446655440001', // Fixed UUID for consistency
      displayId: 'HSP123456789', // Add the required displayId
      name: 'Test Healthcare Center',
      type: 'hospital',
      address: '123 Test Street, Test City, TC 12345',
      phone: '+1-555-0123',
      email: 'test@testcenter.com',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await dataSource.query(
        `INSERT INTO healthcare_centers (id, "displayId", name, type, address, phone, email, "isActive", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          centerData.id,
          centerData.displayId,
          centerData.name,
          centerData.type,
          centerData.address,
          centerData.phone,
          centerData.email,
          centerData.isActive,
          centerData.createdAt,
          centerData.updatedAt,
        ]
      );

      this.testHealthcareCenter = { id: centerData.id };
      return this.testHealthcareCenter;
    } catch (error) {
      console.error('Failed to create test healthcare center:', error);
      throw error;
    }
  }

  /**
   * Get the test healthcare center ID
   */
  static getTestHealthcareCenterId(): string {
    return '550e8400-e29b-41d4-a716-446655440001';
  }

  /**
   * Create test medical record with proper foreign key relationships
   */
  static async createTestMedicalRecord(
    patientId: string,
    doctorId: string,
    doctorToken: string
  ): Promise<{ record: unknown; recordId: string }> {
    const recordData = TestDataFactory.createMedicalRecord(patientId, doctorId);

    const response = await this.makeAuthenticatedRequest(doctorToken)
      .post('/medical-records')
      .send(recordData)
      .expect(201);

    return {
      record: response.body,
      recordId: response.body.id,
    };
  }

  /**
   * Create test referral with proper foreign key relationships
   */
  static async createTestReferral(
    patientId: string,
    doctorId: string,
    doctorToken: string
  ): Promise<{ referral: unknown; referralId: string }> {
    const referralData = TestDataFactory.createReferral(patientId, doctorId, doctorId);

    const response = await this.makeAuthenticatedRequest(doctorToken)
      .post('/referrals')
      .send(referralData)
      .expect(201);

    return {
      referral: response.body,
      referralId: response.body.id,
    };
  }

  /**
   * Create and authenticate a test user with unique email
   */
  static async createAuthenticatedUser(
    role: 'patient' | 'doctor' | 'admin' | 'nurse' = 'patient'
  ): Promise<{ user: unknown; token: string; userId: string }> {
    const app = this.getApp();
    
    // Generate highly unique email to avoid conflicts
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const processId = process.pid.toString();
    const testRunId = Math.random().toString(36).substring(2, 10);
    const userData = {
      ...TestDataFactory.createUser(role),
      email: `test-${role}-${timestamp}-${processId}-${testRunId}-${randomSuffix}@example.com`,
    };

    try {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      return {
        user: response.body.user,
        token: response.body.access_token, // Fixed: use access_token instead of accessToken
        userId: response.body.user.id,
      };
    } catch (error) {
      console.error(`Failed to create authenticated user with email: ${userData.email}`, error);
      throw error;
    }
  }

  /**
   * Create multiple authenticated users
   */
  static async createMultipleUsers(
    roles: Array<'patient' | 'doctor' | 'admin' | 'nurse'>
  ): Promise<Array<{ user: unknown; token: string; userId: string }>> {
    const users: Array<{ user: unknown; token: string; userId: string }> = [];
    for (const role of roles) {
      const user = await this.createAuthenticatedUser(role);
      users.push(user);
    }
    return users;
  }

  /**
   * Make authenticated request
   */
  static makeAuthenticatedRequest(token: string) {
    const app = this.getApp();
    
    // If token is empty or undefined, don't set Authorization header
    const baseRequest = request(app.getHttpServer());
    
    return {
      get: (url: string) => {
        const req = baseRequest.get(url);
        return token && token.trim() !== '' ? req.set('Authorization', `Bearer ${token}`) : req;
      },
      post: (url: string) => {
        const req = baseRequest.post(url);
        return token && token.trim() !== '' ? req.set('Authorization', `Bearer ${token}`) : req;
      },
      put: (url: string) => {
        const req = baseRequest.put(url);
        return token && token.trim() !== '' ? req.set('Authorization', `Bearer ${token}`) : req;
      },
      patch: (url: string) => {
        const req = baseRequest.patch(url);
        return token && token.trim() !== '' ? req.set('Authorization', `Bearer ${token}`) : req;
      },
      delete: (url: string) => {
        const req = baseRequest.delete(url);
        return token && token.trim() !== '' ? req.set('Authorization', `Bearer ${token}`) : req;
      },
    };
  }

  /**
   * Create test patient with medical history
   */
  static async createTestPatient(doctorToken?: string): Promise<{ patient: unknown; patientId: string }> {
    const app = this.getApp();
    
    // First create a user for the patient
    const userData = await this.createAuthenticatedUser('patient');
    const userId = userData.userId;
    
    const patientData = TestDataFactory.createPatient(userId);

    let response;
    if (doctorToken) {
      response = await this.makeAuthenticatedRequest(doctorToken)
        .post('/patients')
        .send(patientData)
        .expect(201);
    } else {
      // Create without authentication for basic tests
      response = await request(app.getHttpServer())
        .post('/patients')
        .send(patientData)
        .expect(201);
    }

    return {
      patient: response.body,
      patientId: response.body.id,
    };
  }

  /**
   * Create test appointment with proper foreign key relationships
   */
  static async createTestAppointment(
    patientId: string,
    doctorId: string,
    doctorToken: string
  ): Promise<{ appointment: unknown; appointmentId: string }> {
    // Ensure healthcare center exists
    const centerId = this.getTestHealthcareCenterId();
    
    // Create appointment data with valid foreign keys
    const appointmentData = TestDataFactory.createAppointment(patientId, doctorId, centerId);

    const response = await this.makeAuthenticatedRequest(doctorToken)
      .post('/appointments')
      .send(appointmentData)
      .expect(201);

    return {
      appointment: response.body,
      appointmentId: response.body.id,
    };
  }

  /**
   * Create test chat room with participants
   */
  static async createTestChatRoom(
    participantIds: string[],
    creatorToken: string
  ): Promise<{ room: unknown; roomId: string }> {
    const roomData = TestDataFactory.createChatRoom(participantIds);

    const response = await this.makeAuthenticatedRequest(creatorToken)
      .post('/chat/rooms')
      .send(roomData)
      .expect(201);

    return {
      room: response.body,
      roomId: response.body.id,
    };
  }

  /**
   * Wait for async operations to complete
   */
  static async waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxRetries) {
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await this.waitFor(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Assert response structure
   */
  static assertResponseStructure(response: unknown, expectedStructure: Record<string, string>): void {
    const responseObj = response as Record<string, unknown>;
    
    for (const [key, expectedType] of Object.entries(expectedStructure)) {
      expect(responseObj).toHaveProperty(key);
      
      if (expectedType === 'string') {
        expect(typeof responseObj[key]).toBe('string');
      } else if (expectedType === 'number') {
        expect(typeof responseObj[key]).toBe('number');
      } else if (expectedType === 'boolean') {
        expect(typeof responseObj[key]).toBe('boolean');
      } else if (expectedType === 'array') {
        expect(Array.isArray(responseObj[key])).toBe(true);
      } else if (expectedType === 'object') {
        expect(typeof responseObj[key]).toBe('object');
        expect(responseObj[key]).not.toBeNull();
      }
    }
  }

  /**
   * Assert pagination response
   */
  static assertPaginationResponse(response: unknown): void {
    this.assertResponseStructure(response, {
      data: 'array',
      total: 'number',
      page: 'number',
      totalPages: 'number',
    });
  }

  /**
   * Generate test file for upload
   */
  static createTestFile(filename: string = 'test.txt', content: string = 'test content'): TestFileUpload {
    return {
      fieldname: 'file',
      originalname: filename,
      encoding: '7bit',
      mimetype: 'text/plain',
      size: content.length,
      buffer: Buffer.from(content),
      destination: '',
      filename: '',
      path: '',
      stream: null,
    };
  }

  /**
   * Seed test data for comprehensive testing
   */
  static async seedTestData(): Promise<{
    admin: { user: unknown; token: string; userId: string };
    doctor: { user: unknown; token: string; userId: string };
    patient: { user: unknown; token: string; userId: string };
    nurse: { user: unknown; token: string; userId: string };
  }> {
    console.log('Seeding test data...');
    
    // Clean all related tables first to avoid foreign key and unique constraint conflicts
    const dataSource = this.getDataSource();
    try {
      // Clean in reverse dependency order to avoid foreign key violations
      await dataSource.query('DELETE FROM chat_message_reactions');
      await dataSource.query('DELETE FROM chat_messages');
      await dataSource.query('DELETE FROM chat_participants');
      await dataSource.query('DELETE FROM chat_rooms');
      await dataSource.query('DELETE FROM medical_records');
      await dataSource.query('DELETE FROM appointments');
      await dataSource.query('DELETE FROM referrals');
      await dataSource.query('DELETE FROM patients');
      await dataSource.query('DELETE FROM users');
      await dataSource.query('DELETE FROM healthcare_centers');
      console.log('All tables cleaned before seeding');
    } catch (error) {
      console.warn('Could not clean tables:', error.message);
    }
    
    // Ensure healthcare center exists
    await this.createTestHealthcareCenter();
    console.log('Healthcare center created');
    
    // Create users with unique emails to avoid conflicts
    const [admin, doctor, patient, nurse] = await this.createMultipleUsers([
      'admin',
      'doctor', 
      'patient',
      'nurse'
    ]);
    
    console.log('Test users created successfully');
    console.log(`Admin user ID: ${admin.userId}`);
    console.log(`Doctor user ID: ${doctor.userId}`);
    console.log(`Patient user ID: ${patient.userId}`);
    console.log(`Nurse user ID: ${nurse.userId}`);

    return { admin, doctor, patient, nurse };
  }

  /**
   * Performance testing helper
   */
  static async measureResponseTime(operation: () => Promise<unknown>): Promise<{ result: unknown; duration: number }> {
    const startTime = Date.now();
    const result = await operation();
    const duration = Date.now() - startTime;
    
    return { result, duration };
  }

  /**
   * Concurrent request testing
   */
  static async runConcurrentRequests<T>(
    operations: Array<() => Promise<T>>,
    concurrency: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Database state verification
   */
  static async verifyDatabaseState(tableName: string, expectedCount: number): Promise<void> {
    const dataSource = this.getDataSource();
    const result = await dataSource.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const actualCount = parseInt(result[0].count);
    
    expect(actualCount).toBe(expectedCount);
  }

  /**
   * Mock external service responses
   */
  static mockExternalService(serviceName: string, mockResponse: unknown): jest.SpyInstance {
    // This would be implemented based on your external service integrations
    return jest.fn().mockResolvedValue(mockResponse);
  }
} 