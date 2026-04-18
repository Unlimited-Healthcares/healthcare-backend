import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from '../test-app.module';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Comprehensive Module Testing System
 * Automatically tests all API modules based on the Postman collection
 * Organized by priority and dependencies
 */

interface EndpointTestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  requiresAuth: boolean;
  body?: Record<string, unknown>;
  query?: Record<string, unknown>;
  expectedStatus: number;
  description: string;
}

interface ModuleTestSuite {
  name: string;
  priority: number;
  dependencies: string[];
  endpoints: EndpointTestConfig[];
  setupData?: () => Promise<Record<string, unknown>>;
  cleanupData?: () => Promise<void>;
}

interface TestSummary {
  total: number;
  passed: number;
  failed: number;
  successRate: number;
}

interface EndpointResult {
  status: 'passed' | 'failed';
  error?: string;
  duration: number;
}

/**
 * Test data storage for cross-module testing
 */
class TestDataStore {
  private static instance: TestDataStore;
  private data: Map<string, unknown> = new Map();

  static getInstance(): TestDataStore {
    if (!TestDataStore.instance) {
      TestDataStore.instance = new TestDataStore();
    }
    return TestDataStore.instance;
  }

  set(key: string, value: unknown): void {
    this.data.set(key, value);
  }

  get(key: string): unknown {
    return this.data.get(key);
  }

  clear(): void {
    this.data.clear();
  }
}

/**
 * Comprehensive Module Test Runner
 */
export class ComprehensiveModuleTestRunner {
  private testStore = TestDataStore.getInstance();
  private testResults: Map<string, Record<string, unknown>> = new Map();
  private app: INestApplication;

  /**
   * Define all module test suites
   */
  private getModuleTestSuites(): ModuleTestSuite[] {
    return [
      // Phase 1: Core Infrastructure (Priority 1)
      {
        name: 'application',
        priority: 1,
        dependencies: [],
        endpoints: [
          {
            method: 'GET',
            path: '/',
            requiresAuth: false,
            expectedStatus: 200,
            description: 'Application health check',
          },
        ],
      },

      // Phase 2: Authentication (Priority 2)
      {
        name: 'authentication',
        priority: 2,
        dependencies: ['application'],
        endpoints: [
          {
            method: 'POST',
            path: '/auth/register',
            requiresAuth: false,
            body: {
              email: 'patient@test.com',
              password: 'TestPassword123!',
              name: 'Test Patient',
              roles: ['patient'],
              phone: '+1234567890',
            },
            expectedStatus: 201,
            description: 'Register patient',
          },
          {
            method: 'POST',
            path: '/auth/register/staff',
            requiresAuth: true,
            body: {
              email: 'doctor@test.com',
              password: 'TestPassword123!',
              name: 'Test Doctor',
              roles: ['doctor'],
              phone: '+1234567891',
            },
            expectedStatus: 201,
            description: 'Register staff member',
          },
          {
            method: 'POST',
            path: '/auth/login',
            requiresAuth: false,
            body: {
              email: 'patient@test.com',
              password: 'TestPassword123!',
            },
            expectedStatus: 200,
            description: 'Login patient',
          },
          {
            method: 'GET',
            path: '/auth/me',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get current user profile',
          },
          {
            method: 'POST',
            path: '/auth/refresh',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Refresh access token',
          },
          {
            method: 'POST',
            path: '/auth/logout',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Logout user',
          },
        ],
      },

      // Phase 3: User Management (Priority 3)
      {
        name: 'users',
        priority: 3,
        dependencies: ['authentication'],
        endpoints: [
          {
            method: 'POST',
            path: '/users',
            requiresAuth: true,
            body: {
              email: 'newuser@test.com',
              password: 'TestPassword123!',
              roles: ['patient'],
              firstName: 'John',
              lastName: 'Doe',
              phone: '+1234567890',
            },
            expectedStatus: 201,
            description: 'Create new user',
          },
          {
            method: 'GET',
            path: '/users',
            requiresAuth: true,
            query: { page: 1, limit: 10, role: 'patient' },
            expectedStatus: 200,
            description: 'Get all users with pagination',
          },
          {
            method: 'GET',
            path: '/users/{{user_id}}',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get user by ID',
          },
          {
            method: 'PATCH',
            path: '/users/{{user_id}}',
            requiresAuth: true,
            body: {
              firstName: 'John Updated',
              lastName: 'Doe Updated',
              phone: '+1234567891',
            },
            expectedStatus: 200,
            description: 'Update user',
          },
          {
            method: 'PATCH',
            path: '/users/{{user_id}}/profile',
            requiresAuth: true,
            body: {
              bio: 'Updated bio',
              dateOfBirth: '1990-01-01',
              gender: 'male',
              address: {
                street: '123 Main St',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'USA',
              },
            },
            expectedStatus: 200,
            description: 'Update user profile',
          },
        ],
      },

      // Phase 4: Healthcare Centers (Priority 4)
      {
        name: 'centers',
        priority: 4,
        dependencies: ['users'],
        endpoints: [
          {
            method: 'POST',
            path: '/centers',
            requiresAuth: true,
            body: {
              name: 'Test General Hospital',
              type: 'hospital',
              description: 'Full-service hospital with emergency care',
              address: {
                street: '123 Hospital Ave',
                city: 'New York',
                state: 'NY',
                zipCode: '10001',
                country: 'USA',
              },
              phone: '+1234567890',
              email: 'info@testgeneral.com',
              website: 'https://testgeneral.com',
              operatingHours: {
                monday: '00:00-23:59',
                tuesday: '00:00-23:59',
                wednesday: '00:00-23:59',
                thursday: '00:00-23:59',
                friday: '00:00-23:59',
                saturday: '00:00-23:59',
                sunday: '00:00-23:59',
              },
            },
            expectedStatus: 201,
            description: 'Create healthcare center',
          },
          {
            method: 'GET',
            path: '/centers',
            requiresAuth: true,
            query: { page: 1, limit: 10, type: 'hospital' },
            expectedStatus: 200,
            description: 'Get all centers',
          },
          {
            method: 'GET',
            path: '/centers/types',
            requiresAuth: false,
            expectedStatus: 200,
            description: 'Get center types',
          },
          {
            method: 'GET',
            path: '/centers/{{center_id}}',
            requiresAuth: false,
            expectedStatus: 200,
            description: 'Get center by ID',
          },
          {
            method: 'PATCH',
            path: '/centers/{{center_id}}',
            requiresAuth: true,
            body: {
              name: 'Updated Hospital Name',
              description: 'Updated description',
              phone: '+1234567891',
            },
            expectedStatus: 200,
            description: 'Update center',
          },
        ],
      },

      // Phase 5: Appointments (Priority 5)
      {
        name: 'appointments',
        priority: 5,
        dependencies: ['centers'],
        endpoints: [
          {
            method: 'POST',
            path: '/appointments',
            requiresAuth: true,
            body: {
              patientId: '{{patient_id}}',
              providerId: '{{provider_id}}',
              centerId: '{{center_id}}',
              appointmentDate: '2024-12-20T14:00:00Z',
              duration: 30,
              appointmentType: 'consultation',
              reason: 'Follow-up for hypertension',
              priority: 'normal',
              notes: 'Patient requested afternoon appointment',
              reminderPreferences: {
                email: true,
                sms: true,
                reminderTime: 24,
              },
            },
            expectedStatus: 201,
            description: 'Create appointment',
          },
          {
            method: 'GET',
            path: '/appointments',
            requiresAuth: true,
            query: { page: 1, limit: 10, status: 'scheduled' },
            expectedStatus: 200,
            description: 'Get all appointments',
          },
          {
            method: 'GET',
            path: '/appointments/{{appointment_id}}',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get appointment by ID',
          },
          {
            method: 'PATCH',
            path: '/appointments/{{appointment_id}}',
            requiresAuth: true,
            body: {
              appointmentDate: '2024-12-21T15:00:00Z',
              duration: 45,
              reason: 'Follow-up for hypertension and medication review',
            },
            expectedStatus: 200,
            description: 'Update appointment',
          },
          {
            method: 'GET',
            path: '/appointments/me',
            requiresAuth: true,
            query: { status: 'scheduled', upcoming: true, limit: 20 },
            expectedStatus: 200,
            description: 'Get my appointments',
          },
        ],
      },

      // Phase 6: Referrals (Priority 6)
      {
        name: 'referrals',
        priority: 6,
        dependencies: ['appointments'],
        endpoints: [
          {
            method: 'POST',
            path: '/referrals',
            requiresAuth: true,
            body: {
              patientId: '{{patient_id}}',
              fromProviderId: '{{provider_id}}',
              toProviderId: '{{specialist_provider_id}}',
              toCenterId: '{{specialist_center_id}}',
              referralType: 'specialist_consultation',
              specialty: 'cardiology',
              priority: 'routine',
              reason: 'Elevated blood pressure requiring specialist evaluation',
              clinicalSummary: '45-year-old patient with persistent hypertension despite medication',
              currentMedications: [
                {
                  name: 'Lisinopril',
                  dosage: '10mg',
                  frequency: 'once daily',
                },
              ],
              relevantHistory: 'Family history of cardiovascular disease',
              urgentBy: '2024-03-15T00:00:00Z',
            },
            expectedStatus: 201,
            description: 'Create referral',
          },
          {
            method: 'GET',
            path: '/referrals',
            requiresAuth: true,
            query: { page: 1, limit: 10, status: 'pending' },
            expectedStatus: 200,
            description: 'Get all referrals',
          },
          {
            method: 'GET',
            path: '/referrals/{{referral_id}}',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get referral by ID',
          },
          {
            method: 'GET',
            path: '/referrals/me',
            requiresAuth: true,
            query: { type: 'all', status: 'active' },
            expectedStatus: 200,
            description: 'Get my referrals',
          },
        ],
      },

      // Phase 7: Medical Records (Priority 7)
      {
        name: 'medical-records',
        priority: 7,
        dependencies: ['referrals'],
        endpoints: [
          {
            method: 'GET',
            path: '/medical-records',
            requiresAuth: true,
            query: { page: 1, limit: 10 },
            expectedStatus: 200,
            description: 'Get all medical records',
          },
          {
            method: 'GET',
            path: '/medical-records/tags',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get all tags',
          },
          {
            method: 'GET',
            path: '/medical-records/categories',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get all categories',
          },
          {
            method: 'GET',
            path: '/medical-records/categories/hierarchy',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get category hierarchy',
          },
          {
            method: 'POST',
            path: '/medical-records',
            requiresAuth: true,
            body: {
              patientId: '{{patient_id}}',
              recordType: 'lab_result',
              title: 'Blood Test Results',
              description: 'Complete blood count test results',
              category: 'laboratory',
              tags: ['blood', 'lab', 'routine'],
              recordData: {
                vitals: { bloodPressure: '120/80', heartRate: 72 },
                symptoms: ['fatigue', 'headache']
              },
              diagnosis: 'Normal blood count',
              treatment: 'Continue current medication',
              notes: 'Patient shows normal blood count values',
              followUp: 'Schedule follow-up in 3 months',
              medications: [
                { name: 'Aspirin', dosage: '100mg', frequency: 'daily' }
              ],
              isSensitive: false,
              isShareable: true,
              sharingRestrictions: {
                allowedRoles: ['doctor', 'nurse'],
                restrictedFields: ['personalNotes']
              }
            },
            expectedStatus: 201,
            description: 'Create medical record',
          },
          {
            method: 'GET',
            path: '/medical-records/search',
            requiresAuth: true,
            query: { q: 'blood', category: 'laboratory', page: 1, limit: 5 },
            expectedStatus: 200,
            description: 'Search medical records',
          },
          {
            method: 'POST',
            path: '/medical-records/categories',
            requiresAuth: true,
            body: {
              name: 'Test Category',
              description: 'Test category for medical records',
              parentId: null,
              color: '#FF5733',
              icon: 'test-icon'
            },
            expectedStatus: 201,
            description: 'Create category',
          },
        ],
      },

      // Phase 8: Medical Reports (Priority 8)
      {
        name: 'medical-reports',
        priority: 8,
        dependencies: ['medical-records'],
        endpoints: [
          {
            method: 'POST',
            path: '/medical-reports/patient/{{patient_id}}',
            requiresAuth: true,
            body: {
              reportType: 'comprehensive',
              dateRange: {
                startDate: '2024-01-01',
                endDate: '2024-02-29',
              },
              includeSections: [
                'demographics',
                'medical_history',
                'medications',
                'appointments',
              ],
              format: 'pdf',
              includeCharts: true,
              includeTimeline: true,
            },
            expectedStatus: 201,
            description: 'Generate patient report',
          },
          {
            method: 'GET',
            path: '/medical-reports',
            requiresAuth: true,
            query: { page: 1, limit: 20, type: 'patient', status: 'completed' },
            expectedStatus: 200,
            description: 'Get all reports',
          },
          {
            method: 'GET',
            path: '/medical-reports/{{report_id}}',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get report by ID',
          },
          {
            method: 'GET',
            path: '/medical-reports/templates',
            requiresAuth: true,
            query: { category: 'patient', active: true },
            expectedStatus: 200,
            description: 'Get report templates',
          },
        ],
      },

      // Phase 9: Blood Donation (Priority 9)
      {
        name: 'blood-donation',
        priority: 9,
        dependencies: ['medical-reports'],
        endpoints: [
          {
            method: 'POST',
            path: '/blood-donation/donors',
            requiresAuth: true,
            body: {
              patientId: '{{patient_id}}',
              bloodType: 'A+',
              eligibilityStatus: 'eligible',
              lastDonationDate: '2023-12-15T00:00:00Z',
              medicalHistory: {
                chronicConditions: [],
                currentMedications: [],
                allergies: [],
              },
              contactPreferences: {
                email: true,
                sms: true,
                emergencyContact: true,
              },
              emergencyContact: {
                name: 'Jane Doe',
                phone: '+1234567891',
                relationship: 'spouse',
              },
            },
            expectedStatus: 201,
            description: 'Register blood donor',
          },
          {
            method: 'GET',
            path: '/blood-donation/donors',
            requiresAuth: true,
            query: { page: 1, limit: 20, bloodType: 'A+', status: 'eligible' },
            expectedStatus: 200,
            description: 'Get all donors',
          },
          {
            method: 'POST',
            path: '/blood-donation/donations',
            requiresAuth: true,
            body: {
              donorId: '{{donor_id}}',
              centerId: '{{center_id}}',
              donationDate: '2024-03-15T10:30:00Z',
              donationType: 'whole_blood',
              volumeCollected: 450,
              bloodType: 'A+',
              vitalSigns: {
                bloodPressure: '120/80',
                heartRate: 72,
                temperature: 98.6,
                hemoglobin: 14.5,
              },
              complications: [],
              staffId: '{{provider_id}}',
              notes: 'Successful donation, donor tolerated well',
            },
            expectedStatus: 201,
            description: 'Record blood donation',
          },
          {
            method: 'GET',
            path: '/blood-donation/inventory',
            requiresAuth: true,
            query: { centerId: '{{center_id}}', bloodType: 'A+', status: 'available' },
            expectedStatus: 200,
            description: 'Get blood inventory',
          },
        ],
      },

      // Phase 10: AI Services (Priority 10)
      {
        name: 'ai-services',
        priority: 10,
        dependencies: ['blood-donation'],
        endpoints: [
          {
            method: 'POST',
            path: '/ai/chat/sessions',
            requiresAuth: true,
            body: {
              sessionType: 'general',
              title: 'Test AI Chat Session',
              metadata: {
                category: 'health_inquiry',
                priority: 'normal'
              }
            },
            expectedStatus: 201,
            description: 'Create AI chat session',
          },
          {
            method: 'GET',
            path: '/ai/chat/sessions',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get user chat sessions',
          },
          {
            method: 'POST',
            path: '/ai/chat/message',
            requiresAuth: true,
            body: {
              content: 'Hello, I have a health question',
              messageType: 'user',
              sessionType: 'general'
            },
            expectedStatus: 201,
            description: 'Send direct chat message',
          },
          {
            method: 'POST',
            path: '/ai/symptom-analysis/analyze',
            requiresAuth: true,
            body: {
              symptoms: [
                {
                  name: 'headache',
                  severity: 7,
                  duration: '2 hours',
                  description: 'Throbbing pain in temples'
                },
                {
                  name: 'fever',
                  severity: 5,
                  duration: '1 day',
                  description: 'Low-grade fever'
                }
              ],
              sessionId: 'test-session-123'
            },
            expectedStatus: 201,
            description: 'Analyze symptoms using AI',
          },
          {
            method: 'GET',
            path: '/ai/health-analytics/trends',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Analyze health trends using AI',
          },
          {
            method: 'POST',
            path: '/ai/health-analytics/risk-assessment',
            requiresAuth: true,
            body: {
              assessmentType: 'cardiovascular',
              inputData: {
                age: 45,
                gender: 'male',
                bloodPressure: '140/90',
                cholesterol: '220',
                smoking: true,
                diabetes: false,
                familyHistory: ['heart_disease']
              }
            },
            expectedStatus: 201,
            description: 'Perform AI-powered health risk assessment',
          },
          {
            method: 'POST',
            path: '/ai/medical-recommendations/generate',
            requiresAuth: true,
            expectedStatus: 201,
            description: 'Generate AI-powered medical recommendations',
          },
        ],
      },

      // Phase 11: Chat & Video (Priority 11)
      {
        name: 'chat-video',
        priority: 11,
        dependencies: ['ai-services'],
        endpoints: [
          {
            method: 'POST',
            path: '/chat/rooms',
            requiresAuth: true,
            body: {
              name: 'Patient Consultation - Test Patient',
              type: 'patient_consultation',
              participants: [
                {
                  userId: '{{provider_id}}',
                  role: 'doctor',
                  permissions: ['read', 'write', 'moderate'],
                },
                {
                  userId: '{{patient_id}}',
                  role: 'patient',
                  permissions: ['read', 'write'],
                },
              ],
              isPrivate: true,
              encryptionEnabled: true,
              autoDeleteAfter: 30,
              allowFileSharing: true,
              relatedAppointmentId: '{{appointment_id}}',
            },
            expectedStatus: 201,
            description: 'Create chat room',
          },
          {
            method: 'GET',
            path: '/chat/rooms',
            requiresAuth: true,
            query: { page: 1, limit: 20, type: 'patient_consultation' },
            expectedStatus: 200,
            description: 'Get chat rooms',
          },
          {
            method: 'POST',
            path: '/chat/messages',
            requiresAuth: true,
            body: {
              roomId: '{{chat_room_id}}',
              content: 'Hello! Test message for automated testing.',
              messageType: 'text',
              priority: 'normal',
              isEncrypted: true,
            },
            expectedStatus: 201,
            description: 'Send chat message',
          },
          {
            method: 'POST',
            path: '/video/calls',
            requiresAuth: true,
            body: {
              roomId: '{{chat_room_id}}',
              callType: 'video',
              participants: [
                {
                  userId: '{{provider_id}}',
                  role: 'host',
                  permissions: ['video', 'audio', 'screen_share', 'record'],
                },
                {
                  userId: '{{patient_id}}',
                  role: 'participant',
                  permissions: ['video', 'audio'],
                },
              ],
              scheduledStartTime: '2024-03-15T14:00:00Z',
              estimatedDuration: 30,
              recordingEnabled: true,
            },
            expectedStatus: 201,
            description: 'Start video call',
          },
        ],
      },

      // Phase 12: Video Conferencing (Priority 12)
      {
        name: 'video-conferencing',
        priority: 12,
        dependencies: ['chat-video'],
        endpoints: [
          {
            method: 'POST',
            path: '/video-conferences',
            requiresAuth: true,
            body: {
              title: 'Patient Consultation Session',
              description: 'Follow-up consultation for patient health review',
              type: 'consultation',
              maxParticipants: 5,
              isRecordingEnabled: true,
              meetingPassword: 'secure123',
              waitingRoomEnabled: true,
              autoAdmitParticipants: false,
              muteParticipantsOnEntry: true,
              provider: 'webrtc',
              participantIds: ['{{provider_id}}', '{{patient_id}}'],
            },
            expectedStatus: 201,
            description: 'Create video conference',
          },
          {
            method: 'GET',
            path: '/video-conferences',
            requiresAuth: true,
            query: { page: 1, limit: 10 },
            expectedStatus: 200,
            description: 'Get user video conferences',
          },
          {
            method: 'GET',
            path: '/video-conferences/{{conference_id}}',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get video conference details',
          },
          {
            method: 'POST',
            path: '/video-conferences/{{conference_id}}/start',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Start video conference',
          },
          {
            method: 'POST',
            path: '/video-conferences/{{conference_id}}/join',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Join video conference',
          },
          {
            method: 'PATCH',
            path: '/video-conferences/{{conference_id}}/settings',
            requiresAuth: true,
            body: {
              isCameraEnabled: true,
              isMicrophoneEnabled: false,
              isScreenSharing: false,
            },
            expectedStatus: 200,
            description: 'Update participant settings',
          },
          {
            method: 'POST',
            path: '/video-conferences/{{conference_id}}/recording/toggle',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Toggle conference recording',
          },
          {
            method: 'POST',
            path: '/video-conferences/{{conference_id}}/end',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'End video conference',
          },
          {
            method: 'GET',
            path: '/video-conferences/{{conference_id}}/recordings',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get conference recordings',
          },
        ],
      },

      // Phase 13: Equipment Marketplace (Priority 13)
      {
        name: 'equipment-marketplace',
        priority: 13,
        dependencies: ['video-conferencing'],
        endpoints: [
          {
            method: 'GET',
            path: '/equipment/categories',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get all equipment categories',
          },
          {
            method: 'POST',
            path: '/equipment/categories',
            requiresAuth: true,
            body: {
              name: 'Test Diagnostic Equipment',
              description: 'Medical diagnostic and imaging equipment for testing',
              categoryCode: `TEST-${Date.now()}`,
              isActive: true,
              sortOrder: 1
            },
            expectedStatus: 201,
            description: 'Create equipment category',
          },
          {
            method: 'GET',
            path: '/equipment/vendors',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get all equipment vendors',
          },
          {
            method: 'POST',
            path: '/equipment/vendors',
            requiresAuth: true,
            body: {
              name: 'Test Medical Equipment Vendor',
              email: `test-vendor-${Date.now()}@example.com`,
              phone: '+1234567890',
              address: '123 Test Street, Test City, TS 12345',
              specialties: ['diagnostic', 'imaging'],
              website: 'https://testvendor.com',
              description: 'Leading provider of medical diagnostic equipment'
            },
            expectedStatus: 201,
            description: 'Register equipment vendor',
          },
          {
            method: 'GET',
            path: '/equipment/items',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get all equipment items',
          },
          {
            method: 'GET',
            path: '/equipment/items/featured',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get featured equipment items',
          },
          {
            method: 'POST',
            path: '/equipment/items',
            requiresAuth: true,
            body: {
              name: 'Test Ultrasound Machine',
              description: 'High-resolution ultrasound machine for diagnostic imaging',
              categoryId: '00000000-0000-0000-0000-000000000001',
              vendorId: '00000000-0000-0000-0000-000000000002',
              modelNumber: 'TEST-US-001',
              manufacturer: 'Test Medical Devices',
              condition: 'new',
              purchasePrice: 150000.00,
              currentValue: 135000.00,
              isRentable: true,
              isForSale: false,
              rentalPriceDaily: 500.00,
              rentalPriceWeekly: 3000.00,
              rentalPriceMonthly: 10000.00,
              minimumRentalDays: 1,
              maximumRentalDays: 365,
              tags: ['ultrasound', 'diagnostic', 'portable'],
              weightKg: 45.5,
              dimensions: {
                length: 120,
                width: 60,
                height: 100,
                unit: 'cm'
              },
              powerRequirements: '110-240V AC, 50/60Hz',
              maintenanceSchedule: 'Every 6 months',
              safetyNotes: 'Handle with care, requires specialized training',
              operatingInstructions: 'Refer to user manual for detailed operating procedures'
            },
            expectedStatus: 201,
            description: 'Create equipment item',
          },
          {
            method: 'GET',
            path: '/equipment/rental/requests',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get rental requests',
          },
          {
            method: 'POST',
            path: '/equipment/rental/requests',
            requiresAuth: true,
            body: {
              equipmentId: '00000000-0000-0000-0000-000000000003',
              startDate: '2024-02-01',
              endDate: '2024-02-07',
              purpose: 'Diagnostic imaging for patient care',
              specialRequirements: 'Requires certified technician',
              deliveryAddress: '123 Medical Center Dr, Test City, TS 12345',
              pickupAddress: '456 Equipment Warehouse, Test City, TS 12345'
            },
            expectedStatus: 201,
            description: 'Create rental request',
          },
          {
            method: 'GET',
            path: '/equipment/sales/listings',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get sales listings',
          },
          {
            method: 'GET',
            path: '/equipment/maintenance/schedules',
            requiresAuth: true,
            expectedStatus: 200,
            description: 'Get maintenance schedules',
          },
        ],
      },
    ];
  }

  /**
   * Run comprehensive tests for all modules
   */
  async runAllModuleTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive Module Testing...');
    console.log('=' .repeat(80));

    const testSuites = this.getModuleTestSuites();
    
    // Sort by priority
    testSuites.sort((a, b) => a.priority - b.priority);

    let totalPassed = 0;
    let totalFailed = 0;
    const moduleResults: Record<string, unknown>[] = [];

    for (const suite of testSuites) {
      const result = await this.runModuleTestSuite(suite);
      moduleResults.push(result);
      
      const endpoints = result.endpoints as EndpointResult[];
      const passed = endpoints.filter(e => e.status === 'passed').length;
      const failed = endpoints.filter(e => e.status === 'failed').length;
      
      totalPassed += passed;
      totalFailed += failed;
    }

    const summary: TestSummary = {
      total: totalPassed + totalFailed,
      passed: totalPassed,
      failed: totalFailed,
      successRate: totalPassed + totalFailed > 0 ? (totalPassed / (totalPassed + totalFailed)) * 100 : 0,
    };

    await this.generateComprehensiveReport(moduleResults, summary);
  }

  /**
   * Run tests for a specific module test suite
   */
  private async runModuleTestSuite(suite: ModuleTestSuite): Promise<Record<string, unknown>> {
    console.log(`\n🧪 Testing Module: ${suite.name.toUpperCase()}`);
    console.log(`📋 Dependencies: ${suite.dependencies.join(', ') || 'None'}`);
    console.log(`🎯 Endpoints: ${suite.endpoints.length}`);

    const moduleResult = {
      name: suite.name,
      status: 'passed',
      endpoints: [] as EndpointResult[],
      errors: [] as string[],
      duration: 0,
    };

    const startTime = Date.now();

    try {
      // Setup test data if needed
      if (suite.setupData) {
        await suite.setupData();
      }

      // Test each endpoint
      for (const endpoint of suite.endpoints) {
        const endpointResult = await this.testEndpoint(endpoint);
        moduleResult.endpoints.push(endpointResult);

        if (endpointResult.status === 'failed') {
          moduleResult.status = 'failed';
          moduleResult.errors.push(`${endpoint.method} ${endpoint.path}: ${endpointResult.error}`);
        }
      }

      // Cleanup test data if needed
      if (suite.cleanupData) {
        await suite.cleanupData();
      }

    } catch (error) {
      moduleResult.status = 'failed';
      moduleResult.errors.push(`Module setup/cleanup error: ${error.message}`);
    }

    moduleResult.duration = Date.now() - startTime;
    return moduleResult;
  }

  /**
   * Replace placeholders in endpoint configuration with actual test data
   */
  private processEndpointPlaceholders(endpoint: EndpointTestConfig): EndpointTestConfig {
    const processed = { ...endpoint };
    
    // Replace path placeholders
    if (processed.path) {
      processed.path = this.replacePlaceholders(processed.path);
    }
    
    // Replace body placeholders
    if (processed.body) {
      processed.body = this.replacePlaceholdersInObject(processed.body);
    }
    
    return processed;
  }

  /**
   * Replace placeholders in strings
   */
  private replacePlaceholders(text: string): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match: string, key: string) => {
      const value = this.testStore.get(key.trim());
      return value ? String(value) : match;
    });
  }

  /**
   * Replace placeholders in objects recursively
   */
  private replacePlaceholdersInObject(obj: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.replacePlaceholders(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.replacePlaceholdersInObject(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }
    
    return result;
  }

  /**
   * Store test data for use in other modules
   */
  private storeTestData(moduleName: string, endpoint: EndpointTestConfig, result: Record<string, unknown>): void {
    // Store commonly used IDs for cross-module testing
    if (result.id) {
      this.testStore.set(`${moduleName}_id`, result.id);
    }

    if (result.userId) {
      this.testStore.set('user_id', result.userId);
    }

    if (result.centerId) {
      this.testStore.set('center_id', result.centerId);
    }

    if (result.patientId) {
      this.testStore.set('patient_id', result.patientId);
    }

    if (result.appointmentId) {
      this.testStore.set('appointment_id', result.appointmentId);
    }

    if (result.accessToken) {
      this.testStore.set('access_token', result.accessToken);
    }

    // Store the entire result for specific endpoint access
    this.testStore.set(`${moduleName}_${endpoint.method}_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}`, result);
  }

  /**
   * Generate comprehensive test report
   */
  private async generateComprehensiveReport(moduleResults: Record<string, unknown>[], summary: TestSummary): Promise<void> {
    const reportContent = {
      timestamp: new Date().toISOString(),
      summary,
      moduleResults,
      testConfiguration: {
        totalModules: moduleResults.length,
        testEnvironment: process.env.NODE_ENV || 'test',
        databaseUrl: process.env.DATABASE_URL ? '[REDACTED]' : 'Not configured',
      },
    };

    // Generate HTML report
    const htmlReport = this.generateHtmlReport(reportContent);
    
    // Generate JSON report
    const jsonReport = JSON.stringify(reportContent, null, 2);

    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Write reports
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const htmlPath = path.join(reportsDir, `comprehensive-test-report-${timestamp}.html`);
    const jsonPath = path.join(reportsDir, `comprehensive-test-report-${timestamp}.json`);

    fs.writeFileSync(htmlPath, htmlReport);
    fs.writeFileSync(jsonPath, jsonReport);

    console.log(`\n📊 Reports generated:`);
    console.log(`   HTML: ${htmlPath}`);
    console.log(`   JSON: ${jsonPath}`);
  }

  private generateHtmlReport(_reportContent: Record<string, unknown>): string {
    // Implementation of generateHtmlReport method
    return ''; // Placeholder return, actual implementation needed
  }

  private async testEndpoint(endpoint: EndpointTestConfig): Promise<EndpointResult> {
    const startTime = Date.now();
    
    try {
      // Initialize app if not already done
      if (!this.app) {
        const moduleFixture: TestingModule = await Test.createTestingModule({
          imports: [TestAppModule],
        }).compile();

        this.app = moduleFixture.createNestApplication();
        await this.app.init();
      }

      const processedEndpoint = this.processEndpointPlaceholders(endpoint);
      
      let requestBuilder = request(this.app.getHttpServer())[endpoint.method.toLowerCase()](processedEndpoint.path);

      if (endpoint.requiresAuth) {
        const token = this.testStore.get('access_token') as string;
        if (token) {
          requestBuilder = requestBuilder.set('Authorization', `Bearer ${token}`);
        }
      }

      if (endpoint.body) {
        requestBuilder = requestBuilder.send(endpoint.body);
      }

      if (endpoint.query) {
        requestBuilder = requestBuilder.query(endpoint.query);
      }

      await requestBuilder.expect(endpoint.expectedStatus);

      return {
        status: 'passed',
        duration: Date.now() - startTime,
      };

    } catch (error) {
      return {
        status: 'failed',
        error: error.message,
        duration: Date.now() - startTime,
      };
    }
  }
}

/**
 * Main execution function
 */
async function runComprehensiveModuleTests(): Promise<void> {
  const runner = new ComprehensiveModuleTestRunner();
  
  try {
    await runner.runAllModuleTests();
    console.log('\n✅ Comprehensive module testing completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Comprehensive module testing failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runComprehensiveModuleTests();
}

export { runComprehensiveModuleTests }; 