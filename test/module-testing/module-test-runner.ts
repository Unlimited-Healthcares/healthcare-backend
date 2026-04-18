import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Module Test Runner - Executes tests for individual API modules
 * Provides isolated testing environment for each module
 */
export class ModuleTestRunner {
  private app: INestApplication;
  private dataSource: DataSource;
  private authToken: string;
  private testResults: TestResult[] = [];

  constructor(private moduleName: string) {}

  /**
   * Initialize the test environment
   */
  async initialize(): Promise<void> {
    console.log(`🚀 Initializing test environment for ${this.moduleName} module...`);
    
    // Create test module
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: '.env.test',
          isGlobal: true,
        }),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST || process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DATABASE_PORT || process.env.DB_PORT) || 5433,
          username: process.env.DATABASE_USERNAME || process.env.DB_USERNAME || 'postgres',
          password: process.env.DATABASE_PASSWORD || process.env.DB_PASSWORD || 'postgres',
          database: process.env.DATABASE_NAME || process.env.DB_NAME || 'healthcare_test',
          entities: ['src/**/*.entity{.ts,.js}'],
          synchronize: true,
          dropSchema: true, // Clean database for each test
        }),
      ],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    await this.app.init();

    this.dataSource = this.app.get(DataSource);
    
    console.log(`✅ Test environment initialized for ${this.moduleName}`);
  }

  /**
   * Setup authentication for protected endpoints
   */
  async setupAuthentication(): Promise<void> {
    console.log('🔐 Setting up authentication...');
    
    // Register test user
    const registerResponse = await request(this.app.getHttpServer())
      .post('/auth/register')
      .send({
        email: `test-${this.moduleName}@example.com`,
        password: 'TestPassword123!',
        roles: ['patient', 'doctor', 'admin'], // Grant all roles for testing
      });

    if (registerResponse.status !== 201) {
      console.error('❌ Failed to register test user:', registerResponse.body);
      throw new Error('Authentication setup failed');
    }

    // Login to get token
    const loginResponse = await request(this.app.getHttpServer())
      .post('/auth/login')
      .send({
        email: `test-${this.moduleName}@example.com`,
        password: 'TestPassword123!',
      });

    if (loginResponse.status !== 200) {
      console.error('❌ Failed to login test user:', loginResponse.body);
      throw new Error('Authentication setup failed');
    }

    this.authToken = loginResponse.body.accessToken;
    console.log('✅ Authentication setup complete');
  }

  /**
   * Execute a test for a specific endpoint
   */
  async testEndpoint(config: EndpointTestConfig): Promise<TestResult> {
    const startTime = Date.now();
    console.log(`🧪 Testing ${config.method.toUpperCase()} ${config.path}...`);

    try {
      let requestBuilder = request(this.app.getHttpServer())[config.method.toLowerCase()](config.path);

      // Add authentication if required
      if (config.requiresAuth && this.authToken) {
        requestBuilder = requestBuilder.set('Authorization', `Bearer ${this.authToken}`);
      }

      // Add custom headers
      if (config.headers) {
        Object.entries(config.headers).forEach(([key, value]) => {
          requestBuilder = requestBuilder.set(key, value);
        });
      }

      // Add request body
      if (config.body) {
        requestBuilder = requestBuilder.send(config.body);
      }

      // Add query parameters
      if (config.query) {
        requestBuilder = requestBuilder.query(config.query);
      }

      const response = await requestBuilder;
      const responseTime = Date.now() - startTime;

      // Validate response
      const isSuccess = this.validateResponse(response, config.expectedStatus || 200);
      
      const result: TestResult = {
        endpoint: `${config.method.toUpperCase()} ${config.path}`,
        status: isSuccess ? 'PASS' : 'FAIL',
        responseTime,
        statusCode: response.status,
        expectedStatus: config.expectedStatus || 200,
        error: isSuccess ? null : `Expected ${config.expectedStatus || 200}, got ${response.status}`,
        responseBody: response.body,
      };

      this.testResults.push(result);
      
      if (isSuccess) {
        console.log(`✅ ${result.endpoint} - ${responseTime}ms`);
      } else {
        console.log(`❌ ${result.endpoint} - ${result.error}`);
      }

      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: TestResult = {
        endpoint: `${config.method.toUpperCase()} ${config.path}`,
        status: 'FAIL',
        responseTime,
        statusCode: 0,
        expectedStatus: config.expectedStatus || 200,
        error: error.message,
        responseBody: null,
      };

      this.testResults.push(result);
      console.log(`❌ ${result.endpoint} - ${error.message}`);
      return result;
    }
  }

  /**
   * Validate response against expected criteria
   */
  private validateResponse(response: request.Response, expectedStatus: number): boolean {
    return response.status === expectedStatus;
  }

  /**
   * Generate test report
   */
  generateReport(): TestReport {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = totalTests - passedTests;
    const averageResponseTime = this.testResults.reduce((sum, r) => sum + r.responseTime, 0) / totalTests;

    const report: TestReport = {
      moduleName: this.moduleName,
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: (passedTests / totalTests) * 100,
        averageResponseTime,
      },
      results: this.testResults,
    };

    return report;
  }

  /**
   * Print test report to console
   */
  printReport(): void {
    const report = this.generateReport();
    
    console.log('\n' + '='.repeat(60));
    console.log(`📊 TEST REPORT - ${report.moduleName.toUpperCase()} MODULE`);
    console.log('='.repeat(60));
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`📈 Total Tests: ${report.summary.total}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`📊 Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`⚡ Average Response Time: ${report.summary.averageResponseTime.toFixed(0)}ms`);
    console.log('='.repeat(60));

    if (report.summary.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      report.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`  • ${result.endpoint}: ${result.error}`);
        });
    }

    console.log('\n📋 DETAILED RESULTS:');
    report.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${status} ${result.endpoint} (${result.responseTime}ms)`);
    });
  }

  /**
   * Save test report to file
   */
  async saveReport(): Promise<void> {
    const report = this.generateReport();
    
    // Ensure reports directory exists
    const reportsDir = path.join(process.cwd(), 'test', 'reports');
    await fs.promises.mkdir(reportsDir, { recursive: true });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${this.moduleName}-module-test-report-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);
    
    // Write report to file
    await fs.promises.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`💾 Test report saved to: ${filepath}`);
  }

  /**
   * Cleanup test environment
   */
  async cleanup(): Promise<void> {
    console.log(`🧹 Cleaning up test environment for ${this.moduleName}...`);
    
    if (this.dataSource) {
      await this.dataSource.destroy();
    }
    
    if (this.app) {
      await this.app.close();
    }
    
    console.log(`✅ Cleanup complete for ${this.moduleName}`);
  }
}

// Type definitions
export interface EndpointTestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  requiresAuth?: boolean;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  query?: Record<string, string | number | boolean>;
  expectedStatus?: number;
  description?: string;
}

export interface TestResult {
  endpoint: string;
  status: 'PASS' | 'FAIL';
  responseTime: number;
  statusCode: number;
  expectedStatus: number;
  error: string | null;
  responseBody: unknown;
}

export interface TestReport {
  moduleName: string;
  timestamp: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    successRate: number;
    averageResponseTime: number;
  };
  results: TestResult[];
} 