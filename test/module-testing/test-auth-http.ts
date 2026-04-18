import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Simple test for authentication module using HTTP requests
 */
async function testAuthModuleHttp(): Promise<void> {
  console.log('🚀 Starting HTTP-based Authentication Module Test...\n');

  const runner = new HttpTestRunner('Authentication');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Setup authentication
    await runner.setupAuthentication();

    // Define test endpoints
    const endpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/auth/register',
        body: {
          email: `test-auth-${Date.now()}@example.com`,
          password: 'TestPassword123!',
          name: 'Test Auth User',
          roles: ['patient'],
          phone: '+1234567890'
        },
        expectedStatus: 201,
        description: 'Register new user'
      },
      {
        method: 'POST',
        path: '/auth/login',
        body: {
          email: `test-auth-${Date.now()}@example.com`,
          password: 'TestPassword123!'
        },
        expectedStatus: 200,
        description: 'Login user'
      },
      {
        method: 'GET',
        path: '/auth/me',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get user profile'
      }
    ];

    // Run tests
    console.log('📋 Running authentication endpoint tests...\n');
    for (const endpoint of endpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    const report = runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    // Summary
    console.log('\n🎯 TEST SUMMARY:');
    if (report.summary.successRate >= 80) {
      console.log('✅ Authentication module is working correctly!');
    } else {
      console.log('❌ Authentication module has issues that need to be fixed.');
    }

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    await runner.cleanup();
  }
}

// Run the test
if (require.main === module) {
  testAuthModuleHttp()
    .then(() => {
      console.log('\n✅ HTTP Authentication test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ HTTP Authentication test failed:', error);
      process.exit(1);
    });
}

export { testAuthModuleHttp }; 