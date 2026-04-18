import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';

describe('Database Connection', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    dataSource = moduleFixture.get<DataSource>(DataSource);
    
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('should connect to the database', async () => {
    expect(dataSource).toBeDefined();
    expect(dataSource.isInitialized).toBe(true);
  });

  it('should execute a simple query', async () => {
    const result = await dataSource.query('SELECT 1 as test');
    expect(result).toEqual([{ test: 1 }]);
  });

  it('should have the correct database configuration', () => {
    const config = dataSource.options as unknown as Record<string, unknown>;
    expect(config.host).toBe('localhost');
    expect(config.port).toBe(5433);
    expect(config.username).toBe('test_user');
    expect(config.database).toBe('healthcare_test');
  });
}); 