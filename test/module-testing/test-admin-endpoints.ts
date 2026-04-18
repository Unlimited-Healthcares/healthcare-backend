import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test admin endpoints with admin role authentication
 */
async function testAdminEndpoints(): Promise<void> {
  console.log('🚀 Starting Admin Endpoints Test...\n');

  const runner = new HttpTestRunner('Admin');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Setup authentication with admin role
    await runner.setupAuthentication('admin');

    // Define test endpoints that require admin role
    const endpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/users',
        requiresAuth: true,
        query: { page: 1, limit: 10, role: 'patient' },
        expectedStatus: 200,
        description: 'Get users list (admin only)'
      },
      {
        method: 'POST',
        path: '/users',
        requiresAuth: true,
        body: {
          email: `admin-test-user-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          roles: ['patient']
        },
        expectedStatus: 201,
        description: 'Create new user (admin only)'
      },
      {
        method: 'POST',
        path: '/centers',
        requiresAuth: true,
        body: {
          name: `Test Center ${Date.now()}`,
          type: 'hospital',
          address: '123 Test Street',
          phone: '+1234567890',
          email: `center-${Date.now()}@example.com`
        },
        expectedStatus: 201,
        description: 'Create new center (admin only)'
      }
    ];

    // Run tests
    console.log('📋 Running admin endpoint tests...\n');
    for (const endpoint of endpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    const report = runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    // Summary
    console.log('\n🎯 ADMIN TEST SUMMARY:');
    if (report.summary.successRate >= 80) {
      console.log('✅ Admin endpoints are working correctly!');
    } else {
      console.log('❌ Admin endpoints have issues that need to be fixed.');
    }

  } catch (error) {
    console.error('❌ Admin test execution failed:', error.message);
  } finally {
    await runner.cleanup();
  }
}

// Run the test
if (require.main === module) {
  testAdminEndpoints()
    .then(() => {
      console.log('\n✅ Admin endpoints test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Admin endpoints test failed:', error);
      process.exit(1);
    });
}

export { testAdminEndpoints }; 