#!/usr/bin/env ts-node

import { runComprehensiveModuleTests } from './comprehensive-module-tests';

/**
 * Quick runner for comprehensive module tests
 * This script provides a simple entry point for running all module tests
 */

async function main(): Promise<void> {
  console.log('🏥 UNLIMITEDHEALTHCARE API - Comprehensive Module Testing');
  console.log('=' .repeat(80));
  console.log('📋 This will test all API modules systematically');
  console.log('⏱️  Estimated time: 5-10 minutes');
  console.log('🔧 Make sure your API server is running on the configured port');
  console.log('=' .repeat(80));
  console.log();

  // Check environment
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  console.log(`🌐 Testing against: ${baseUrl}`);
  console.log(`📊 Database: ${process.env.DATABASE_URL ? 'Configured' : 'Using default'}`);
  console.log();

  // Start comprehensive testing
  await runComprehensiveModuleTests();
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Failed to run comprehensive tests:', error);
    process.exit(1);
  });
} 