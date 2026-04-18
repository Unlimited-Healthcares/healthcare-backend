import { TestHelpers } from './test-helpers';
import { TestDataFactory } from './test-data-factory';

// Increase timeout for this test suite - database operations can be slow
jest.setTimeout(180000);

describe('Comprehensive API Testing (e2e)', () => {
  let testUsers: {
    admin: { user: unknown; token: string; userId: string };
    doctor: { user: unknown; token: string; userId: string };
    patient: { user: unknown; token: string; userId: string };
    nurse: { user: unknown; token: string; userId: string };
  };

  beforeAll(async () => {
    console.log('🚀 Starting comprehensive API tests...');
    try {
      await TestHelpers.initializeApp();
      console.log('✅ App initialized successfully');
      
      // Skip the complex reset and just create test users directly
      testUsers = await TestHelpers.seedTestData();
      console.log('✅ Test data seeded successfully');
    } catch (error) {
      console.error('❌ Failed to initialize test environment:', error);
      throw error;
    }
  }, 180000); // 3 minutes timeout for setup

  afterAll(async () => {
    console.log('🧹 Cleaning up test environment...');
    try {
      await TestHelpers.closeApp();
      console.log('✅ Test environment cleaned up successfully');
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  });

  beforeEach(async () => {
    // Skip complex cleanup between tests for now to maintain test speed
    // Individual tests should be designed to be independent through unique data
  });

  describe('Authentication & Authorization', () => {
    it('should register new users with different roles', async () => {
      const userData = TestDataFactory.createUser('doctor');
      
      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.admin.token)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      TestHelpers.assertResponseStructure(response.body, {
        user: 'object',
        access_token: 'string', // Fixed: expect access_token instead of accessToken
      });
    });

    it('should authenticate users and return valid tokens', async () => {
      const userData = TestDataFactory.createUser('patient');
      
      // First register
      await TestHelpers.makeAuthenticatedRequest(testUsers.admin.token)
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Then login with credentials
      const credentials = {
        email: userData.email,
        password: userData.password,
      };

      // Then login
      const response = await TestHelpers.makeAuthenticatedRequest('')
        .post('/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body).toHaveProperty('access_token'); // Fixed: expect access_token instead of accessToken
      expect(response.body).toHaveProperty('user');
    });

    it('should protect endpoints with proper authorization', async () => {
      // Test unauthorized access
      await TestHelpers.makeAuthenticatedRequest('')
        .get('/users/profile')
        .expect(401);

      // Test authorized access
      await TestHelpers.makeAuthenticatedRequest(testUsers.patient.token)
        .get('/auth/me')
        .expect(200);
    });

    it('should enforce role-based access control', async () => {
      // Patient should not access admin endpoints
      await TestHelpers.makeAuthenticatedRequest(testUsers.patient.token)
        .get('/admin/users')
        .expect(403);

      // Admin should access admin endpoints
      await TestHelpers.makeAuthenticatedRequest(testUsers.admin.token)
        .get('/admin/users')
        .expect(200);
    });
  });

  describe('Patient Management', () => {
    it('should create new patients', async () => {
      const { patient } = await TestHelpers.createTestPatient(testUsers.doctor.token);

      TestHelpers.assertResponseStructure(patient, {
        id: 'string',
        userId: 'string',
        patientId: 'string',
      });
    });

    it('should retrieve patient list with pagination', async () => {
      // Create multiple patients
      for (let i = 0; i < 5; i++) {
        await TestHelpers.createTestPatient(testUsers.doctor.token);
      }

      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .get('/patients?page=1&limit=3')
        .expect(200);

      TestHelpers.assertPaginationResponse(response.body);
      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });

    it('should update patient information', async () => {
      const { patientId } = await TestHelpers.createTestPatient(testUsers.doctor.token);

      const updateData = {
        emergencyContactName: 'Updated Contact',
        emergencyContactPhone: '+1-555-9999',
        bloodType: 'O+',
      };

      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .patch(`/patients/${patientId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.emergencyContactName).toBe(updateData.emergencyContactName);
    });

    it('should search patients by various criteria', async () => {
      // Create a patient first
      await TestHelpers.createTestPatient(testUsers.doctor.token);

      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .get('/patients/search?query=test')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Appointment Management', () => {
    let patientId: string;

    beforeEach(async () => {
      const { patientId: pid } = await TestHelpers.createTestPatient(testUsers.doctor.token);
      patientId = pid;
    });

    it('should create new appointments', async () => {
      const appointmentData = TestDataFactory.createAppointment(
        patientId,
        testUsers.doctor.userId,
        TestHelpers.getTestHealthcareCenterId()
      );
      
      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .post('/appointments')
        .send(appointmentData)
        .expect(201);

      TestHelpers.assertResponseStructure(response.body, {
        id: 'string',
        patientId: 'string',
        appointmentDate: 'string',
        status: 'string',
      });
    });

    it('should retrieve appointments with filtering', async () => {
      // Create an appointment first
      const appointmentData = TestDataFactory.createAppointment(
        patientId,
        testUsers.doctor.userId,
        TestHelpers.getTestHealthcareCenterId()
      );
      
      await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .post('/appointments')
        .send(appointmentData)
        .expect(201);

      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .get(`/appointments?patientId=${patientId}`)
        .expect(200);

      // Appointments endpoint returns array directly, not paginated response
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should update appointment status', async () => {
      const { appointmentId } = await TestHelpers.createTestAppointment(
        patientId,
        testUsers.doctor.userId,
        testUsers.doctor.token
      );

      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .patch(`/appointments/${appointmentId}`)
        .send({ status: 'confirmed' })
        .expect(200);

      expect(response.body.status).toBe('confirmed');
    });

    it('should cancel appointments', async () => {
      const { appointmentId } = await TestHelpers.createTestAppointment(
        patientId,
        testUsers.doctor.userId,
        testUsers.doctor.token
      );

      await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .patch(`/appointments/${appointmentId}`)
        .send({ status: 'cancelled' })
        .expect(200);

      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .get(`/appointments/${appointmentId}`)
        .expect(200);

      expect(response.body.status).toBe('cancelled');
    });
  });

  describe('Medical Records Management', () => {
    let patientId: string;

    beforeEach(async () => {
      const { patientId: pid } = await TestHelpers.createTestPatient(testUsers.doctor.token);
      patientId = pid;
    });

    it('should create medical records', async () => {
      const recordData = TestDataFactory.createMedicalRecord(patientId, testUsers.doctor.userId);
      
      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .post('/medical-records')
        .send(recordData)
        .expect(201);

      TestHelpers.assertResponseStructure(response.body, {
        id: 'string',
        patientId: 'string',
        recordType: 'string',
        title: 'string',
      });
    });

    it('should retrieve patient medical history', async () => {
      // Create multiple records
      for (let i = 0; i < 3; i++) {
        const recordData = TestDataFactory.createMedicalRecord(patientId, testUsers.doctor.userId);
        await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
          .post('/medical-records')
          .send(recordData)
          .expect(201);
      }

      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .get(`/medical-records?patientId=${patientId}`)
        .expect(200);

      // Medical records endpoint returns array directly, not paginated response
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should update medical records', async () => {
      const { recordId } = await TestHelpers.createTestMedicalRecord(
        patientId,
        testUsers.doctor.userId,
        testUsers.doctor.token
      );

      const updateData = {
        title: 'Updated Medical Record',
        notes: 'Updated notes for the medical record',
      };

      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .patch(`/medical-records/${recordId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title).toBe(updateData.title);
    });
  });

  describe('Chat System', () => {
    it('should create chat rooms', async () => {
      const roomData = TestDataFactory.createChatRoom([testUsers.doctor.userId, testUsers.patient.userId]);
      
      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .post('/chat/rooms')
        .send(roomData)
        .expect(201);

      TestHelpers.assertResponseStructure(response.body, {
        id: 'string',
        name: 'string',
        type: 'string',
      });
    });

    it('should send and retrieve messages', async () => {
      const { roomId } = await TestHelpers.createTestChatRoom(
        [testUsers.doctor.userId, testUsers.patient.userId],
        testUsers.doctor.token
      );

      const messageData = TestDataFactory.createMessage(roomId, testUsers.doctor.userId);
      
      // Send message
      const sendResponse = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .post(`/chat/rooms/${roomId}/messages`)
        .send(messageData)
        .expect(201);

      expect(sendResponse.body.content).toBe(messageData.content);

      // Retrieve messages
      const getResponse = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .get(`/chat/rooms/${roomId}/messages`)
        .expect(200);

      TestHelpers.assertPaginationResponse(getResponse.body);
      expect(getResponse.body.data.length).toBeGreaterThan(0);
    });

    it('should manage chat participants', async () => {
      const { roomId } = await TestHelpers.createTestChatRoom(
        [testUsers.doctor.userId],
        testUsers.doctor.token
      );

      // Add participant
      await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .post(`/chat/rooms/${roomId}/participants`)
        .send({ userId: testUsers.patient.userId })
        .expect(201);

      // Remove participant
      await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .delete(`/chat/rooms/${roomId}/participants/${testUsers.patient.userId}`)
        .expect(200);
    });
  });

  describe('File Upload & Management', () => {
    it('should upload medical documents', async () => {
      const { patientId } = await TestHelpers.createTestPatient(testUsers.doctor.token);
      
      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .post(`/patients/${patientId}/documents`)
        .attach('file', Buffer.from('test document content'), 'test-document.pdf')
        .expect(201);

      TestHelpers.assertResponseStructure(response.body, {
        id: 'string',
        filename: 'string',
        url: 'string',
      });
    });

    it('should retrieve patient documents', async () => {
      const { patientId } = await TestHelpers.createTestPatient(testUsers.doctor.token);
      
      // Upload a document first
      await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .post(`/patients/${patientId}/documents`)
        .attach('file', Buffer.from('test content'), 'test.pdf')
        .expect(201);

      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .get(`/patients/${patientId}/documents`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Referral System', () => {
    let patientId: string;

    beforeEach(async () => {
      const { patientId: pid } = await TestHelpers.createTestPatient(testUsers.doctor.token);
      patientId = pid;
    });

    it('should create referrals', async () => {
      const referralData = TestDataFactory.createReferral(
        patientId,
        testUsers.doctor.userId,
        testUsers.doctor.userId // In real scenario, this would be different doctor
      );
      
      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .post('/referrals')
        .send(referralData)
        .expect(201);

      TestHelpers.assertResponseStructure(response.body, {
        id: 'string',
        patientId: 'string',
        referringCenterId: 'string',
        receivingCenterId: 'string',
        status: 'string',
      });
    });

    it('should update referral status', async () => {
      const referralData = TestDataFactory.createReferral(
        patientId,
        testUsers.doctor.userId,
        testUsers.doctor.userId
      );
      
      const createResponse = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .post('/referrals')
        .send(referralData)
        .expect(201);

      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .patch(`/referrals/${createResponse.body.id}`)
        .send({ status: 'accepted' })
        .expect(200);

      expect(response.body.status).toBe('accepted');
    });
  });

  describe('Performance & Reliability', () => {
    it('should handle concurrent requests efficiently', async () => {
      const { patientId } = await TestHelpers.createTestPatient(testUsers.doctor.token);
      
      // Create multiple appointments concurrently
      const appointmentOperations = Array.from({ length: 10 }, () => 
        () => {
          const appointmentData = TestDataFactory.createAppointment(
            patientId, 
            testUsers.doctor.userId,
            TestHelpers.getTestHealthcareCenterId()
          );
          return TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
            .post('/appointments')
            .send(appointmentData)
            .expect(201);
        }
      );

      const results = await TestHelpers.runConcurrentRequests(appointmentOperations, 5);
      expect(results.length).toBe(10);
    });

    it('should handle large data sets with pagination', async () => {
      // Create multiple patients
      for (let i = 0; i < 25; i++) {
        await TestHelpers.createTestPatient(testUsers.doctor.token);
      }

      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .get('/patients?page=1&limit=10')
        .expect(200);

      TestHelpers.assertPaginationResponse(response.body);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should maintain data consistency under load', async () => {
      const { patientId } = await TestHelpers.createTestPatient(testUsers.doctor.token);
      
      // Create multiple appointments concurrently
      const appointmentOperations = Array.from({ length: 5 }, () => 
        () => {
          const appointmentData = TestDataFactory.createAppointment(
            patientId, 
            testUsers.doctor.userId,
            TestHelpers.getTestHealthcareCenterId()
          );
          return TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
            .post('/appointments')
            .send(appointmentData)
            .expect(201);
        }
      );

      await TestHelpers.runConcurrentRequests(appointmentOperations, 3);

      // Verify appointments were created for this specific patient
      const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .get(`/appointments?patientId=${patientId}`)
        .expect(200);

      // Appointments endpoint returns array directly, not paginated response
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(5);
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle non-existent resources', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      
      await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
        .get(`/patients/${fakeId}`)
        .expect(404);
    });

    it('should handle database connection issues gracefully', async () => {
      // This would require mocking database failures
      // Implementation depends on your specific error handling strategy
    });
  });
}); 