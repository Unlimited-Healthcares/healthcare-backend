import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as path from 'path';

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

interface AxiosRequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  timeout: number;
  validateStatus: () => boolean;
  data?: Record<string, unknown>;
  params?: Record<string, string | number | boolean>;
}

/**
 * HTTP-based test runner that makes actual HTTP requests to the running API server
 */
export class HttpTestRunner {
  private baseUrl: string;
  private authToken: string;
  private testResults: TestResult[] = [];

  constructor(private moduleName: string, baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.BASE_URL || 'http://localhost:3000';
  }

  /**
   * Initialize the test runner
   */
  async initialize(): Promise<void> {
    console.log(`🚀 Initializing HTTP test runner for ${this.moduleName} module...`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
    
    // Test if the API server is running
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 5000 });
      console.log(`✅ API server is running (status: ${response.status})`);
    } catch (error) {
      console.log(`⚠️  Health check failed, but continuing with tests...`);
    }
  }

  /**
   * Setup authentication by registering and logging in a test user
   */
  async setupAuthentication(userRole: string = 'patient'): Promise<void> {
    console.log(`🔐 Setting up authentication for ${this.moduleName} tests (role: ${userRole})...`);
    
    try {
      // First, try to register a test user with the specified role
      const cleanModuleName = this.moduleName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const registerData = {
        email: `test-${cleanModuleName}-${userRole}-${Date.now()}@example.com`,
        password: 'StrongP@ssw0rd2024!',
        name: `Test ${userRole} User ${this.moduleName}`,
        roles: [userRole],
        phone: '+1234567890'
      };

      try {
        await axios.post(`${this.baseUrl}/auth/register`, registerData, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });
        console.log(`✅ Test user registered successfully (role: ${userRole})`);
      } catch (registerError) {
        // User might already exist, continue with login
        console.log(`ℹ️  Registration failed (user might exist), trying login...`);
        if (registerError.response?.data) {
          console.log(`   Registration error details: ${JSON.stringify(registerError.response.data)}`);
        }
      }

      // Login to get auth token
      const loginData = {
        email: registerData.email,
        password: registerData.password
      };

      const loginResponse = await axios.post(`${this.baseUrl}/auth/login`, loginData, {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' }
      });

      if (loginResponse.data && (loginResponse.data.access_token || loginResponse.data.accessToken)) {
        this.authToken = loginResponse.data.access_token || loginResponse.data.accessToken;
        console.log(`✅ Authentication successful for ${this.moduleName} (role: ${userRole})`);
      } else {
        console.log(`❌ Login response data: ${JSON.stringify(loginResponse.data)}`);
        throw new Error('No access token received from login');
      }

    } catch (error) {
      console.error(`❌ Authentication setup failed for ${this.moduleName}:`, error.message);
      if (error.response?.data) {
        console.error(`   Error details: ${JSON.stringify(error.response.data)}`);
      }
      throw error;
    }
  }

  /**
   * Test a single endpoint
   */
  async testEndpoint(config: EndpointTestConfig): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // Build the full URL
      const url = `${this.baseUrl}${config.path}`;
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...config.headers
      };

      // Add authentication if required
      if (config.requiresAuth && this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      // Prepare axios config
      const axiosConfig: AxiosRequestConfig = {
        method: config.method.toLowerCase(),
        url,
        headers,
        timeout: 30000, // 30 second timeout
        validateStatus: () => true // Don't throw on any status code
      };

      // Add request body
      if (config.body) {
        axiosConfig.data = config.body;
      }

      // Add query parameters
      if (config.query) {
        axiosConfig.params = config.query;
      }

      const response: AxiosResponse = await axios(axiosConfig);
      const responseTime = Date.now() - startTime;

      // Validate response
      const expectedStatus = config.expectedStatus || 200;
      const isSuccess = response.status === expectedStatus;
      
      const result: TestResult = {
        endpoint: `${config.method.toUpperCase()} ${config.path}`,
        status: isSuccess ? 'PASS' : 'FAIL',
        responseTime,
        statusCode: response.status,
        expectedStatus,
        error: isSuccess ? null : `Expected ${expectedStatus}, got ${response.status}`,
        responseBody: response.data,
      };

      this.testResults.push(result);
      
      if (isSuccess) {
        console.log(`✅ ${result.endpoint} - ${responseTime}ms`);
      } else {
        console.log(`❌ ${result.endpoint} - ${result.error}`);
        if (response.data) {
          console.log(`   Response: ${JSON.stringify(response.data).substring(0, 200)}...`);
        }
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
   * Generate test report
   */
  generateReport(): TestReport {
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = totalTests - passedTests;
    const averageResponseTime = totalTests > 0 
      ? this.testResults.reduce((sum, r) => sum + r.responseTime, 0) / totalTests 
      : 0;

    const report: TestReport = {
      moduleName: this.moduleName,
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        successRate: totalTests > 0 ? (passedTests / totalTests) * 100 : 0,
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
    console.log(`📊 HTTP TEST REPORT - ${report.moduleName.toUpperCase()} MODULE`);
    console.log('='.repeat(60));
    console.log(`📅 Timestamp: ${report.timestamp}`);
    console.log(`🌐 Base URL: ${this.baseUrl}`);
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
    const filename = `${this.moduleName}-test-report-${timestamp}.json`;
    const filepath = path.join(reportsDir, filename);
    
    // Write report to file
    await fs.promises.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`💾 Test report saved to: ${filepath}`);
  }

  /**
   * Cleanup test environment
   */
  async cleanup(): Promise<void> {
    console.log(`🧹 Cleaning up HTTP test environment for ${this.moduleName}...`);
    // No cleanup needed for HTTP-based testing
    console.log(`✅ Cleanup complete for ${this.moduleName}`);
  }

  /**
   * Get the auth token for use in other tests
   */
  getAuthToken(): string {
    return this.authToken;
  }
} 