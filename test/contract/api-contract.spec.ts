import { Pact, Matchers } from '@pact-foundation/pact';
import * as request from 'supertest';
import { TestDataFactory } from '../test-data-factory';

const { like, eachLike, term } = Matchers;

describe('Healthcare API Contract Tests', () => {
  let provider: Pact;

  beforeAll(async () => {
    provider = new Pact({
      consumer: 'HealthcareWebApp',
      provider: 'HealthcareAPI',
      port: 1234,
      log: './logs/pact.log',
      dir: './pacts',
      logLevel: 'info',
      spec: 2,
    });

    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  afterEach(async () => {
    await provider.verify();
  });

  describe('Authentication Contracts', () => {
    it('should authenticate user and return token', async () => {
      const expectedResponse = {
        user: like({
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'doctor@example.com',
          roles: eachLike('doctor'),
        }),
        accessToken: term({
          matcher: '^[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_=]+\\.[A-Za-z0-9-_.+/=]*$',
          generate: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        }),
      };

      await provider.addInteraction({
        state: 'user exists with valid credentials',
        uponReceiving: 'a login request',
        withRequest: {
          method: 'POST',
          path: '/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            email: 'doctor@example.com',
            password: 'validPassword123',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      });

      const response = await request('http://localhost:1234')
        .post('/auth/login')
        .send({
          email: 'doctor@example.com',
          password: 'validPassword123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 401 for invalid credentials', async () => {
      await provider.addInteraction({
        state: 'user does not exist or invalid credentials',
        uponReceiving: 'a login request with invalid credentials',
        withRequest: {
          method: 'POST',
          path: '/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            email: 'invalid@example.com',
            password: 'wrongPassword',
          },
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            message: 'Invalid credentials',
            statusCode: 401,
          },
        },
      });

      const response = await request('http://localhost:1234')
        .post('/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongPassword',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('Patient Management Contracts', () => {
    it('should create a new patient', async () => {
      const patientData = TestDataFactory.createPatient();
      
      const expectedResponse = {
        id: like('123e4567-e89b-12d3-a456-426614174000'),
        userId: like(patientData.userId),
        patientId: like('PT123456789'),
        medicalRecordNumber: like(patientData.medicalRecordNumber),
        emergencyContactName: like(patientData.emergencyContactName),
        emergencyContactPhone: like(patientData.emergencyContactPhone),
        emergencyContactRelationship: like(patientData.emergencyContactRelationship),
        bloodType: like(patientData.bloodType),
        allergies: like(patientData.allergies),
        chronicConditions: like(patientData.chronicConditions),
        currentMedications: like(patientData.currentMedications),
        insuranceProvider: like(patientData.insuranceProvider),
        insurancePolicyNumber: like(patientData.insurancePolicyNumber),
        preferredLanguage: like(patientData.preferredLanguage),
        consentDataSharing: like(patientData.consentDataSharing),
        consentResearch: like(patientData.consentResearch),
        consentMarketing: like(patientData.consentMarketing),
        isActive: like(true),
        createdAt: term({
          matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$',
          generate: '2023-01-01T00:00:00.000Z',
        }),
        updatedAt: term({
          matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$',
          generate: '2023-01-01T00:00:00.000Z',
        }),
      };

      await provider.addInteraction({
        state: 'authenticated doctor user',
        uponReceiving: 'a request to create a patient',
        withRequest: {
          method: 'POST',
          path: '/patients',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': like('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
          },
          body: like(patientData),
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      });

      const response = await request('http://localhost:1234')
        .post('/patients')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
        .send(patientData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('patientId');
    });

    it('should retrieve patients with pagination', async () => {
      const expectedResponse = {
        data: eachLike({
          id: like('123e4567-e89b-12d3-a456-426614174000'),
          userId: like('123e4567-e89b-12d3-a456-426614174000'),
          patientId: like('PT123456789'),
          medicalRecordNumber: like('MR123456789'),
          emergencyContactName: like('John Doe'),
          emergencyContactPhone: like('+1-555-0123'),
          emergencyContactRelationship: like('spouse'),
          bloodType: like('O+'),
          allergies: like('Penicillin'),
          chronicConditions: like('Diabetes'),
          currentMedications: like('Metformin'),
          insuranceProvider: like('Blue Cross'),
          insurancePolicyNumber: like('POL123456789'),
          preferredLanguage: like('English'),
          consentDataSharing: like(true),
          consentResearch: like(false),
          consentMarketing: like(false),
          isActive: like(true),
        }),
        total: like(100),
        page: like(1),
        totalPages: like(5),
      };

      await provider.addInteraction({
        state: 'patients exist in the system',
        uponReceiving: 'a request to get patients with pagination',
        withRequest: {
          method: 'GET',
          path: '/patients',
          query: 'page=1&limit=20',
          headers: {
            'Authorization': like('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      });

      const response = await request('http://localhost:1234')
        .get('/patients?page=1&limit=20')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
    });
  });

  describe('Appointment Management Contracts', () => {
    it('should create a new appointment', async () => {
      const appointmentData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        doctorId: '123e4567-e89b-12d3-a456-426614174001',
        appointmentDate: '2024-01-15',
        appointmentTime: '10:00',
        type: 'consultation',
        reason: 'Regular checkup',
        duration: 30,
      };

      const expectedResponse = {
        id: like('123e4567-e89b-12d3-a456-426614174002'),
        patientId: like(appointmentData.patientId),
        doctorId: like(appointmentData.doctorId),
        appointmentDate: term({
          matcher: '^\\d{4}-\\d{2}-\\d{2}$',
          generate: '2024-01-15',
        }),
        status: like('scheduled'),
        type: like('consultation'),
        reason: like('Regular checkup'),
        duration: like(30),
        createdAt: term({
          matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$',
          generate: '2023-01-01T00:00:00.000Z',
        }),
      };

      await provider.addInteraction({
        state: 'authenticated doctor and valid patient exist',
        uponReceiving: 'a request to create an appointment',
        withRequest: {
          method: 'POST',
          path: '/appointments',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': like('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
          },
          body: like(appointmentData),
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      });

      const response = await request('http://localhost:1234')
        .post('/appointments')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
        .send(appointmentData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
    });
  });

  describe('Medical Records Contracts', () => {
    it('should create a medical record', async () => {
      const recordData = {
        patientId: '123e4567-e89b-12d3-a456-426614174000',
        doctorId: '123e4567-e89b-12d3-a456-426614174001',
        diagnosis: 'Hypertension',
        treatment: 'Lifestyle changes and medication',
        vitals: {
          bloodPressure: '140/90',
          heartRate: 80,
          temperature: 98.6,
        },
      };

      const expectedResponse = {
        id: like('123e4567-e89b-12d3-a456-426614174003'),
        patientId: like(recordData.patientId),
        doctorId: like(recordData.doctorId),
        diagnosis: like(recordData.diagnosis),
        treatment: like(recordData.treatment),
        vitals: like(recordData.vitals),
        createdAt: term({
          matcher: '^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z$',
          generate: '2023-01-01T00:00:00.000Z',
        }),
      };

      await provider.addInteraction({
        state: 'authenticated doctor and valid patient exist',
        uponReceiving: 'a request to create a medical record',
        withRequest: {
          method: 'POST',
          path: '/medical-records',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': like('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
          },
          body: like(recordData),
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          },
          body: expectedResponse,
        },
      });

      const response = await request('http://localhost:1234')
        .post('/medical-records')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
        .send(recordData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('diagnosis');
    });
  });

  describe('Error Response Contracts', () => {
    it('should return 400 for invalid data', async () => {
      await provider.addInteraction({
        state: 'authenticated user',
        uponReceiving: 'a request with invalid patient data',
        withRequest: {
          method: 'POST',
          path: '/patients',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': like('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
          },
          body: {
            userId: 'invalid-uuid',
            medicalRecordNumber: '',
          },
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            statusCode: 400,
            message: eachLike('userId must be a UUID'),
            error: 'Bad Request',
          },
        },
      });

      const response = await request('http://localhost:1234')
        .post('/patients')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')
        .send({
          userId: 'invalid-uuid',
          medicalRecordNumber: '',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent resources', async () => {
      await provider.addInteraction({
        state: 'patient does not exist',
        uponReceiving: 'a request for non-existent patient',
        withRequest: {
          method: 'GET',
          path: '/patients/00000000-0000-0000-0000-000000000000',
          headers: {
            'Authorization': like('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
          },
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            statusCode: 404,
            message: 'Patient not found',
            error: 'Not Found',
          },
        },
      });

      const response = await request('http://localhost:1234')
        .get('/patients/00000000-0000-0000-0000-000000000000')
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...');

      expect(response.status).toBe(404);
    });
  });
}); 