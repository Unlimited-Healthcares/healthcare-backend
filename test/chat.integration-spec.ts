
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp, closeTestApp, cleanTestDatabase, waitForDatabase } from './test-helper';

describe('Chat System Integration', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    try {
      const testApp = await createTestApp();
      app = testApp.app;
      dataSource = testApp.dataSource;

      // Wait for database to be ready
      await waitForDatabase(dataSource);

      // Create test user with unique email
      const uniqueEmail = `chattest-${Date.now()}@example.com`;
      console.log('Creating test user with email:', uniqueEmail);
      
      const registerResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: uniqueEmail,
          password: 'password123',
          name: 'Chat Test User',
          roles: ['doctor'],
        });

      console.log('Registration response status:', registerResponse.status);
      console.log('Registration response body:', registerResponse.body);

      userId = registerResponse.body.id;

      // Login to get auth token
      console.log('Logging in with email:', uniqueEmail);
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: uniqueEmail,
          password: 'password123',
        });

      console.log('Login response status:', loginResponse.status);
      console.log('Login response body:', loginResponse.body);

      authToken = loginResponse.body.access_token;
      console.log('Auth token obtained:', authToken ? 'YES' : 'NO');
    } catch (error) {
      console.error('Failed to initialize test app:', error);
      throw error;
    }
  });

  beforeEach(async () => {
    await cleanTestDatabase(dataSource);
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  describe('Chat Rooms', () => {
    it('should create a chat room', async () => {
      if (!app) {
        throw new Error('App not initialized');
      }

      const createRoomDto = {
        name: 'Test Consultation Room',
        type: 'consultation',
        participantIds: [userId],
      };

      const response = await request(app.getHttpServer())
        .post('/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createRoomDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Consultation Room');
      expect(response.body.type).toBe('consultation');
    });

    it('should get user chat rooms', async () => {
      if (!app) {
        throw new Error('App not initialized');
      }

      // First create a room
      await request(app.getHttpServer())
        .post('/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Room',
          type: 'direct',
          participantIds: [userId],
        });

      const response = await request(app.getHttpServer())
        .get('/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('Chat Messages', () => {
    let roomId: string;

    beforeEach(async () => {
      if (!app) {
        throw new Error('App not initialized');
      }

      // Create a test room for each message test
      const roomResponse = await request(app.getHttpServer())
        .post('/chat/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Message Test Room',
          type: 'direct',
          participantIds: [userId],
        });

      roomId = roomResponse.body.id;
    });

    it('should send a message to a chat room', async () => {
      if (!app) {
        throw new Error('App not initialized');
      }

      const messageDto = {
        content: 'Hello, this is a test message',
        messageType: 'text',
      };

      const response = await request(app.getHttpServer())
        .post(`/chat/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(messageDto)
        .expect(201);

      expect(response.body.content).toBe('Hello, this is a test message');
      expect(response.body.messageType).toBe('text');
    });

    it('should get messages from a chat room', async () => {
      if (!app) {
        throw new Error('App not initialized');
      }

      // Send a test message first
      await request(app.getHttpServer())
        .post(`/chat/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'Test message for retrieval',
          messageType: 'text',
        });

      const response = await request(app.getHttpServer())
        .get(`/chat/rooms/${roomId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].content).toBe('Test message for retrieval');
    });
  });
});
