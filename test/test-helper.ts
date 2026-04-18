import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TestAppModule } from './test-app.module';

export interface TestApp {
  app: INestApplication;
  dataSource: DataSource;
}

/**
 * Create a test application with proper error handling
 */
export async function createTestApp(): Promise<TestApp> {
  try {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestAppModule],
    }).compile();

    const app = moduleFixture.createNestApplication();
    const dataSource = moduleFixture.get<DataSource>(DataSource);
    
    await app.init();

    return { app, dataSource };
  } catch (error) {
    console.error('Failed to create test app:', error);
    throw error;
  }
}

/**
 * Close test application with proper error handling
 */
export async function closeTestApp(app: INestApplication): Promise<void> {
  if (app) {
    try {
      await app.close();
    } catch (error) {
      console.warn('Failed to close test app:', error);
    }
  }
}

/**
 * Clean up test database tables
 */
export async function cleanTestDatabase(dataSource: DataSource): Promise<void> {
  if (!dataSource) {
    console.warn('DataSource not available, skipping cleanup');
    return;
  }
  
  try {
    // Clean up in reverse order of dependencies
    await dataSource.query('DELETE FROM chat_messages');
    await dataSource.query('DELETE FROM chat_participants');
    await dataSource.query('DELETE FROM chat_rooms');
    await dataSource.query('DELETE FROM appointments');
    await dataSource.query('DELETE FROM medical_records');
    await dataSource.query('DELETE FROM users');
  } catch (error) {
    console.warn('Failed to clean up test database:', error);
  }
}

/**
 * Wait for database connection to be ready
 */
export async function waitForDatabase(dataSource: DataSource, maxRetries = 15): Promise<void> {
  console.log('⏳ Waiting for database connection...');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      // First check if the dataSource is initialized
      if (!dataSource.isInitialized) {
        console.log(`Database not initialized, retrying in 3 seconds... (${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        continue;
      }
      
      // Then test the connection
      await dataSource.query('SELECT 1');
      console.log('✅ Database connection established');
      return;
    } catch (error) {
      if (i === maxRetries - 1) {
        console.error(`Database connection failed after ${maxRetries} retries:`, error);
        throw new Error(`Database connection failed after ${maxRetries} retries: ${error.message}`);
      }
      console.log(`Database not ready, retrying in 3 seconds... (${i + 1}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
} 