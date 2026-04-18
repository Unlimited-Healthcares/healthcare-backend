#!/usr/bin/env ts-node

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  duration: number;
  coverage?: number;
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalDuration: number;
  overallCoverage: number;
  results: TestResult[];
}

/**
 * Automated test runner for comprehensive API testing
 */
class AutomatedTestRunner {
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  /**
   * Check if database is ready
   */
  private async checkDatabaseConnection(): Promise<void> {
    console.log('🔍 Checking database connection...');
    
    // First check if PostgreSQL is ready
    try {
      execSync('pg_isready -h localhost -p 5433 -U test_user -d healthcare_test', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 10000,
      });
      console.log('✅ PostgreSQL is ready');
    } catch (error) {
      console.error('❌ PostgreSQL is not ready:', error.message);
      throw new Error('PostgreSQL is not ready for testing');
    }
    
    // Then check if Redis is ready
    try {
      execSync('redis-cli -h localhost -p 6379 ping', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 10000,
      });
      console.log('✅ Redis is ready');
    } catch (error) {
      console.error('❌ Redis is not ready:', error.message);
      throw new Error('Redis is not ready for testing');
    }
    
    // Finally test the application's database connection
    try {
      execSync('npx typeorm-ts-node-commonjs query "SELECT 1" -d src/datasource.ts', {
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 30000,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          DATABASE_HOST: 'localhost',
          DATABASE_PORT: '5433',
          DATABASE_USERNAME: 'test_user',
          DATABASE_PASSWORD: 'test_password',
          DATABASE_NAME: 'healthcare_test',
        }
      });
      console.log('✅ Database connection successful');
    } catch (error) {
      console.error('❌ Database connection failed:', error.message);
      throw new Error('Database is not ready for testing');
    }
  }

  /**
   * Setup test environment
   */
  private async setupTestEnvironment(): Promise<void> {
    console.log('🔧 Setting up test environment...');
    
    try {
      // Run database setup script if it exists
      if (fs.existsSync('./scripts/setup-test-db.sh')) {
        execSync('chmod +x ./scripts/setup-test-db.sh && ./scripts/setup-test-db.sh', {
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 60000,
          env: {
            ...process.env,
            NODE_ENV: 'test',
            DATABASE_HOST: 'localhost',
            DATABASE_PORT: '5433',
            DATABASE_USERNAME: 'test_user',
            DATABASE_PASSWORD: 'test_password',
            DATABASE_NAME: 'healthcare_test',
          }
        });
        console.log('✅ Test environment setup complete');
      } else {
        console.log('⚠️ Test database setup script not found, skipping');
      }
    } catch (error) {
      console.error('❌ Test environment setup failed:', error.message);
      throw error;
    }
  }

  /**
   * Run all test suites
   */
  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Starting Automated API Testing Suite...\n');

    try {
      // Check database connection first
      await this.checkDatabaseConnection();
      
      // Setup test environment
      await this.setupTestEnvironment();

      // 1. Unit Tests
      await this.runTestSuite('Unit Tests', 'npm run test');

      // 2. Integration Tests
      await this.runTestSuite('Integration Tests', 'npm run test:integration');

      // 3. E2E Tests
      await this.runTestSuite('E2E Tests', 'npm run test:e2e');

      // 4. Performance Tests
      await this.runTestSuite('Performance Tests', 'npm run test:performance');

      // 5. Coverage Report
      await this.generateCoverageReport();

      // Generate final report
      const report = this.generateFinalReport();
      await this.saveReport(report);
      this.printSummary(report);

      return report;
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Run specific test suite
   */
  private async runTestSuite(suiteName: string, command: string): Promise<void> {
    console.log(`📋 Running ${suiteName}...`);
    const startTime = Date.now();

    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        timeout: 300000, // 5 minutes timeout
        env: {
          ...process.env,
          NODE_ENV: 'test',
          DATABASE_HOST: 'localhost',
          DATABASE_PORT: '5433',
          DATABASE_USERNAME: 'test_user',
          DATABASE_PASSWORD: 'test_password',
          DATABASE_NAME: 'healthcare_test',
          REDIS_HOST: 'localhost',
          REDIS_PORT: '6379',
        }
      });

      const duration = Date.now() - startTime;
      const result = this.parseTestOutput(suiteName, output, duration);
      this.results.push(result);

      console.log(`✅ ${suiteName} completed: ${result.passed} passed, ${result.failed} failed (${duration}ms)\n`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        suite: suiteName,
        passed: 0,
        failed: 1,
        duration,
      };
      this.results.push(result);

      console.log(`❌ ${suiteName} failed: ${error.message}\n`);
    }
  }

  /**
   * Parse test output to extract results
   */
  private parseTestOutput(suiteName: string, output: string, duration: number): TestResult {
    // Parse Jest output format
    const passedMatch = output.match(/(\d+) passing/);
    const failedMatch = output.match(/(\d+) failing/);
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);

    return {
      suite: suiteName,
      passed: passedMatch ? parseInt(passedMatch[1]) : 0,
      failed: failedMatch ? parseInt(failedMatch[1]) : 0,
      duration,
      coverage: coverageMatch ? parseFloat(coverageMatch[1]) : undefined,
    };
  }

  /**
   * Generate coverage report
   */
  private async generateCoverageReport(): Promise<void> {
    console.log('📊 Generating coverage report...');
    
    try {
      execSync('npm run test:cov', { 
        encoding: 'utf8',
        stdio: 'pipe',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          DATABASE_HOST: 'localhost',
          DATABASE_PORT: '5433',
          DATABASE_USERNAME: 'test_user',
          DATABASE_PASSWORD: 'test_password',
          DATABASE_NAME: 'healthcare_test',
          REDIS_HOST: 'localhost',
          REDIS_PORT: '6379',
        }
      });
      console.log('✅ Coverage report generated\n');
    } catch (error) {
      console.log('⚠️  Coverage report generation failed\n');
    }
  }

  /**
   * Generate final test report
   */
  private generateFinalReport(): TestReport {
    const totalTests = this.results.reduce((sum, r) => sum + r.passed + r.failed, 0);
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalDuration = Date.now() - this.startTime;
    
    const coverageResults = this.results.filter(r => r.coverage !== undefined);
    const overallCoverage = coverageResults.length > 0 
      ? coverageResults.reduce((sum, r) => sum + r.coverage!, 0) / coverageResults.length
      : 0;

    return {
      timestamp: new Date().toISOString(),
      totalTests,
      totalPassed,
      totalFailed,
      totalDuration,
      overallCoverage,
      results: this.results,
    };
  }

  /**
   * Save report to file
   */
  private async saveReport(report: TestReport): Promise<void> {
    const reportsDir = path.join(__dirname, '../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = path.join(reportsDir, `test-report-${timestamp}.json`);
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Test report saved to: ${reportPath}`);
  }

  /**
   * Print test summary
   */
  private printSummary(report: TestReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Duration: ${(report.totalDuration / 1000).toFixed(2)}s`);
    console.log(`📈 Total Tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.totalPassed}`);
    console.log(`❌ Failed: ${report.totalFailed}`);
    console.log(`📊 Success Rate: ${((report.totalPassed / report.totalTests) * 100).toFixed(2)}%`);
    console.log(`🎯 Coverage: ${report.overallCoverage.toFixed(2)}%`);
    console.log('='.repeat(60));

    // Print individual suite results
    console.log('\n📋 SUITE BREAKDOWN:');
    report.results.forEach(result => {
      const successRate = ((result.passed / (result.passed + result.failed)) * 100).toFixed(2);
      console.log(`  ${result.suite}: ${result.passed}/${result.passed + result.failed} (${successRate}%)`);
    });

    // Determine overall status
    if (report.totalFailed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! 🎉');
      process.exit(0);
    } else {
      console.log('\n⚠️  SOME TESTS FAILED');
      process.exit(1);
    }
  }

  /**
   * Run specific test category
   */
  async runCategory(category: 'unit' | 'integration' | 'e2e' | 'performance'): Promise<void> {
    const commands = {
      unit: 'npm run test',
      integration: 'npm run test:integration',
      e2e: 'npm run test:e2e',
      performance: 'npm run test:performance',
    };

    await this.runTestSuite(`${category} tests`, commands[category]);
    const report = this.generateFinalReport();
    this.printSummary(report);
  }
}

// CLI interface
const args = process.argv.slice(2);
const runner = new AutomatedTestRunner();

if (args.length === 0) {
  // Run all tests
  runner.runAllTests();
} else {
  const category = args[0] as 'unit' | 'integration' | 'e2e' | 'performance';
  if (['unit', 'integration', 'e2e', 'performance'].includes(category)) {
    runner.runCategory(category);
  } else {
    console.error('Invalid category. Use: unit, integration, e2e, or performance');
    process.exit(1);
  }
} 