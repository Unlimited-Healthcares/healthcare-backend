import { ModuleTestRunner, EndpointTestConfig } from './module-test-runner';

/**
 * Authentication Module Tests
 * Tests all authentication-related endpoints
 */
async function runAuthModuleTests(): Promise<void> {
  const runner = new ModuleTestRunner('auth');
  
  try {
    // Initialize test environment
    await runner.initialize();
    
    console.log('🔐 Starting Authentication Module Tests...\n');

    // Test endpoints that don't require authentication first
    const timestamp = Date.now();
    const publicEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/auth/register',
        requiresAuth: false,
        body: {
          email: `newuser-${timestamp}@example.com`,
          password: 'SecurePassword123!',
          roles: ['patient'],
        },
        expectedStatus: 201,
        description: 'Register new user',
      },
      {
        method: 'POST',
        path: '/auth/login',
        requiresAuth: false,
        body: {
          email: `newuser-${timestamp}@example.com`,
          password: 'SecurePassword123!',
        },
        expectedStatus: 200,
        description: 'Login with valid credentials',
      },
    ];

    // Test public endpoints
    for (const endpoint of publicEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Setup authentication for protected endpoints
    await runner.setupAuthentication();

    // Test protected endpoints
    const protectedEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/auth/me',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get current user profile',
      },
      {
        method: 'POST',
        path: '/auth/refresh',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Refresh access token',
      },
      {
        method: 'POST',
        path: '/auth/logout',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Logout user',
      },
    ];

    for (const endpoint of protectedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test error scenarios
    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/auth/login',
        requiresAuth: false,
        body: {
          email: `invalid-${timestamp}@example.com`,
          password: 'wrongpassword',
        },
        expectedStatus: 401,
        description: 'Login with invalid credentials',
      },
      {
        method: 'POST',
        path: '/auth/register',
        requiresAuth: false,
        body: {
          email: 'invalid-email',
          password: '123',
        },
        expectedStatus: 400,
        description: 'Register with invalid data',
      },
      {
        method: 'GET',
        path: '/auth/me',
        requiresAuth: false,
        expectedStatus: 401,
        description: 'Access protected endpoint without token',
      },
    ];

    console.log('\n🚨 Testing Error Scenarios...');
    for (const endpoint of errorScenarios) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    runner.printReport();
    await runner.saveReport();

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    throw error; // Re-throw to properly fail the test
  } finally {
    await runner.cleanup();
  }
}

// Run the tests if this file is executed directly
if (require.main === module) {
  runAuthModuleTests()
    .then(() => {
      console.log('\n✅ Authentication module tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Authentication module tests failed:', error);
      process.exit(1);
    });
}

export { runAuthModuleTests }; 