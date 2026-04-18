import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TestAppModule } from './test-app.module';
import { DataSource } from 'typeorm';

// Increase timeout for this test suite
jest.setTimeout(90000);

describe('Authentication (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    
    await app.init();
  }, 90000); // Add timeout to beforeAll

  beforeEach(async () => {
    // Clean up database before each test - tables are already created by synchronize: true
    if (dataSource && dataSource.isInitialized) {
      // Just clean data, don't synchronize again
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
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const timestamp = Date.now();
      const registerDto = {
        name: 'Test User',
        email: `test-${timestamp}@example.com`,
        password: 'password123',
        roles: ['patient'],
      };

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('access_token'); // Fixed: expect access_token instead of accessToken
      expect(response.body.user.email).toBe(registerDto.email);
    });

    it('should return 400 if user already exists', async () => {
      const timestamp = Date.now();
      const registerDto = {
        name: 'Duplicate User',
        email: `duplicate-${timestamp}@example.com`,
        password: 'password123',
        roles: ['patient'],
      };

      // First registration
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Duplicate registration - API returns 400 for validation errors
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', async () => {
      // First register a user
      const timestamp = Date.now();
      const registerDto = {
        name: 'Login User',
        email: `login-${timestamp}@example.com`,
        password: 'password123',
        roles: ['patient'],
      };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      // Then login
      const loginDto = {
        email: registerDto.email,
        password: 'password123',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('access_token'); // Fixed: expect access_token instead of accessToken
    });

    it('should return 401 with invalid credentials', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });
  });

  describe('/auth/me (GET)', () => {
    it('should return user profile with valid token', async () => {
      // Register and login to get token
      const timestamp = Date.now();
      const registerDto = {
        name: 'Profile User',
        email: `profile-${timestamp}@example.com`,
        password: 'password123',
        roles: ['patient'],
      };

      const loginResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      const token = loginResponse.body.access_token; // Fixed: use access_token instead of accessToken

      const response = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.email).toBe(registerDto.email);
    });

    it('should return 401 without token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });
});
