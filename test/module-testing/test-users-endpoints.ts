import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test user endpoints with proper authentication
 */
async function testUsersEndpoints(): Promise<void> {
  console.log('🚀 Starting Users Endpoints Test...\n');

  const runner = new HttpTestRunner('Users');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Setup authentication with patient role
    await runner.setupAuthentication('patient');

    // Define test endpoints for user management
    const endpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/auth/me',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get current user profile'
      }
    ];

    // Run basic user tests
    console.log('📋 Running user endpoint tests...\n');
    for (const endpoint of endpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test admin-only user management endpoints (switch to admin role)
    console.log('\n🔍 Testing admin user management endpoints...\n');
    
    // Re-authenticate as admin for admin-only endpoints
    await runner.setupAuthentication('admin');
    
    const adminEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/users',
        requiresAuth: true,
        query: { page: 1, limit: 5 },
        expectedStatus: 200,
        description: 'Get users list with pagination (admin only)'
      },
      {
        method: 'GET',
        path: '/users',
        requiresAuth: true,
        query: { role: 'patient' },
        expectedStatus: 200,
        description: 'Get users filtered by role (admin only)'
      }
    ];

    for (const endpoint of adminEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test error scenarios
    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/users/invalid-uuid',
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Get user with invalid ID format (admin only)'
      },
      {
        method: 'GET',
        path: '/users/00000000-0000-0000-0000-000000000000',
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Get non-existent user (admin only)'
      }
    ];

    console.log('\n🚨 Testing error scenarios...\n');
    for (const endpoint of errorScenarios) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    const report = runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    // Summary
    console.log('\n🎯 USERS TEST SUMMARY:');
    if (report.summary.successRate >= 80) {
      console.log('✅ User endpoints are working correctly!');
    } else {
      console.log('❌ User endpoints have issues that need to be fixed.');
    }

  } catch (error) {
    console.error('❌ Users test execution failed:', error.message);
  } finally {
    await runner.cleanup();
  }
}

// Run the test
if (require.main === module) {
  testUsersEndpoints()
    .then(() => {
      console.log('\n✅ Users endpoints test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Users endpoints test failed:', error);
      process.exit(1);
    });
}

export { testUsersEndpoints }; 