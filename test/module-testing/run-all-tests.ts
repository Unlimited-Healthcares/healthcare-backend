#!/usr/bin/env ts-node

import { runAuthModuleTests } from './auth.module.test';
import { runUsersModuleTests } from './users.module.test';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Master Test Runner - Executes all module tests
 * Provides comprehensive testing of all API endpoints
 */
class MasterTestRunner {
  private results: ModuleTestSummary[] = [];
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
  }

  /**
   * Run all module tests sequentially
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting Comprehensive API Testing...\n');
    console.log('=' .repeat(80));
    console.log('🏥 UNLIMITEDHEALTHCARE API - MODULE TESTING SUITE');
    console.log('=' .repeat(80));
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log('=' .repeat(80));

    const modules = [
      { name: 'Authentication', testFunction: runAuthModuleTests },
      { name: 'Users', testFunction: runUsersModuleTests },
      // Add more modules as they are created
      // { name: 'Patients', testFunction: runPatientsModuleTests },
      // { name: 'Appointments', testFunction: runAppointmentsModuleTests },
      // { name: 'Medical Records', testFunction: runMedicalRecordsModuleTests },
    ];

    for (const module of modules) {
      await this.runModuleTest(module.name, module.testFunction);
    }

    this.generateFinalReport();
  }

  /**
   * Run a specific module test
   */
  async runModuleTest(moduleName: string, testFunction: () => Promise<void>): Promise<void> {
    console.log(`\n🧪 Testing ${moduleName} Module...`);
    console.log('-'.repeat(50));
    
    const moduleStartTime = Date.now();
    let status: 'PASS' | 'FAIL' = 'FAIL';
    let error: string | null = null;

    try {
      await testFunction();
      status = 'PASS';
      console.log(`✅ ${moduleName} module tests completed successfully`);
    } catch (err) {
      status = 'FAIL';
      error = err instanceof Error ? err.message : String(err);
      console.error(`❌ ${moduleName} module tests failed:`, error);
    }

    const duration = Date.now() - moduleStartTime;
    
    this.results.push({
      moduleName,
      status,
      duration,
      error,
      timestamp: new Date().toISOString(),
    });

    console.log(`⏱️  Duration: ${duration}ms`);
    console.log('-'.repeat(50));
  }

  /**
   * Generate and display final test report
   */
  generateFinalReport(): void {
    const totalDuration = Date.now() - this.startTime;
    const totalModules = this.results.length;
    const passedModules = this.results.filter(r => r.status === 'PASS').length;
    const failedModules = totalModules - passedModules;

    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL TEST REPORT');
    console.log('='.repeat(80));
    console.log(`📅 Completed at: ${new Date().toISOString()}`);
    console.log(`⏱️  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`📈 Total Modules: ${totalModules}`);
    console.log(`✅ Passed: ${passedModules}`);
    console.log(`❌ Failed: ${failedModules}`);
    console.log(`📊 Success Rate: ${((passedModules / totalModules) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));

    if (failedModules > 0) {
      console.log('\n❌ FAILED MODULES:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(result => {
          console.log(`  • ${result.moduleName}: ${result.error}`);
        });
    }

    console.log('\n📋 MODULE SUMMARY:');
    this.results.forEach(result => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      console.log(`  ${status} ${result.moduleName.padEnd(20)} (${duration})`);
    });

    console.log('\n' + '='.repeat(80));
    
    if (failedModules === 0) {
      console.log('🎉 ALL TESTS PASSED! Your API is ready for frontend development.');
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.');
    }
    
    console.log('='.repeat(80));

    // Save detailed report
    this.saveDetailedReport();
  }

  /**
   * Save detailed report to file
   */
  async saveDetailedReport(): Promise<void> {
    const report = {
      timestamp: new Date().toISOString(),
      totalDuration: Date.now() - this.startTime,
      summary: {
        totalModules: this.results.length,
        passedModules: this.results.filter(r => r.status === 'PASS').length,
        failedModules: this.results.filter(r => r.status === 'FAIL').length,
        successRate: (this.results.filter(r => r.status === 'PASS').length / this.results.length) * 100,
      },
      moduleResults: this.results,
    };

    const reportsDir = path.join(process.cwd(), 'test', 'reports');
    await fs.promises.mkdir(reportsDir, { recursive: true });
    
    const filename = `master-test-report-${Date.now()}.json`;
    const filepath = path.join(reportsDir, filename);
    
    await fs.promises.writeFile(filepath, JSON.stringify(report, null, 2));
    console.log(`💾 Detailed report saved to: ${filepath}`);
  }

  /**
   * Run specific module test by name
   */
  async runSpecificModule(moduleName: string): Promise<void> {
    console.log(`🎯 Running specific module test: ${moduleName}`);
    
    const moduleMap: Record<string, () => Promise<void>> = {
      auth: runAuthModuleTests,
      users: runUsersModuleTests,
      // Add more modules as they are created
    };

    const testFunction = moduleMap[moduleName.toLowerCase()];
    
    if (!testFunction) {
      console.error(`❌ Module '${moduleName}' not found. Available modules:`, Object.keys(moduleMap));
      process.exit(1);
    }

    await this.runModuleTest(moduleName, testFunction);
    this.generateFinalReport();
  }
}

// Interface definitions
interface ModuleTestSummary {
  moduleName: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  error: string | null;
  timestamp: string;
}

// CLI handling
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const runner = new MasterTestRunner();

  if (args.length === 0) {
    // Run all tests
    await runner.runAllTests();
  } else if (args[0] === '--module' && args[1]) {
    // Run specific module
    await runner.runSpecificModule(args[1]);
  } else {
    console.log('Usage:');
    console.log('  npm run test:modules              # Run all module tests');
    console.log('  npm run test:module <name>        # Run specific module test');
    console.log('');
    console.log('Available modules: auth, users');
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n🏁 Testing completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Testing failed:', error);
      process.exit(1);
    });
}

export { MasterTestRunner }; 