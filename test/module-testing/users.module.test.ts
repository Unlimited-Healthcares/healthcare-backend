import { ModuleTestRunner, EndpointTestConfig } from './module-test-runner';

/**
 * Users Module Tests
 * Tests all user management endpoints
 */
async function runUsersModuleTests(): Promise<void> {
  const runner = new ModuleTestRunner('users');
  let createdUserId: string;
  
  try {
    // Initialize test environment
    await runner.initialize();
    await runner.setupAuthentication();
    
    console.log('👥 Starting Users Module Tests...\n');

    // Test user creation
    const timestamp = Date.now();
    const createUserEndpoint: EndpointTestConfig = {
      method: 'POST',
      path: '/users',
      requiresAuth: true,
      body: {
        email: `testuser-${timestamp}@example.com`,
        password: 'TestPassword123!',
        roles: ['patient'],
        profile: {
          firstName: 'Test',
          lastName: 'User',
          phone: '+1234567890',
        },
      },
      expectedStatus: 201,
      description: 'Create new user',
    };

    const createResult = await runner.testEndpoint(createUserEndpoint);
    if (createResult.status === 'PASS' && (createResult.responseBody as { id?: string })?.id) {
      createdUserId = (createResult.responseBody as { id: string }).id;
      console.log(`📝 Created user with ID: ${createdUserId}`);
    }

    // Test user retrieval endpoints
    const retrievalEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/users',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get all users',
      },
      {
        method: 'GET',
        path: `/users/${createdUserId || 'test-id'}`,
        requiresAuth: true,
        expectedStatus: createdUserId ? 200 : 404,
        description: 'Get user by ID',
      },
    ];

    for (const endpoint of retrievalEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test user update endpoints
    if (createdUserId) {
      const updateEndpoints: EndpointTestConfig[] = [
        {
          method: 'PATCH',
          path: `/users/${createdUserId}`,
          requiresAuth: true,
          body: {
            profile: {
              firstName: 'Updated',
              lastName: 'User',
            },
          },
          expectedStatus: 200,
          description: 'Update user',
        },
        {
          method: 'PATCH',
          path: `/users/${createdUserId}/profile`,
          requiresAuth: true,
          body: {
            firstName: 'Profile',
            lastName: 'Updated',
            bio: 'Updated bio',
          },
          expectedStatus: 200,
          description: 'Update user profile',
        },
      ];

      for (const endpoint of updateEndpoints) {
        await runner.testEndpoint(endpoint);
      }
    }

    // Test search and filtering
    const searchEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/users',
        requiresAuth: true,
        query: {
          role: 'patient',
          limit: 10,
        },
        expectedStatus: 200,
        description: 'Search users by role',
      },
      {
        method: 'GET',
        path: '/users',
        requiresAuth: true,
        query: {
          search: 'test',
        },
        expectedStatus: 200,
        description: 'Search users by name',
      },
    ];

    for (const endpoint of searchEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test error scenarios
    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/users',
        requiresAuth: true,
        body: {
          email: 'invalid-email',
          password: '123',
        },
        expectedStatus: 400,
        description: 'Create user with invalid data',
      },
      {
        method: 'GET',
        path: '/users/invalid-uuid',
        requiresAuth: true,
        expectedStatus: 400,
        description: 'Get user with invalid ID format',
      },
      {
        method: 'GET',
        path: '/users/00000000-0000-0000-0000-000000000000',
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Get non-existent user',
      },
      {
        method: 'PATCH',
        path: '/users/00000000-0000-0000-0000-000000000000',
        requiresAuth: true,
        body: { profile: { firstName: 'Test' } },
        expectedStatus: 404,
        description: 'Update non-existent user',
      },
    ];

    console.log('\n🚨 Testing Error Scenarios...');
    for (const endpoint of errorScenarios) {
      await runner.testEndpoint(endpoint);
    }

    // Test user deletion (if user was created)
    if (createdUserId) {
      const deleteEndpoint: EndpointTestConfig = {
        method: 'DELETE',
        path: `/users/${createdUserId}`,
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Delete user',
      };

      await runner.testEndpoint(deleteEndpoint);
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
  runUsersModuleTests()
    .then(() => {
      console.log('\n✅ Users module tests completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Users module tests failed:', error);
      process.exit(1);
    });
}

export { runUsersModuleTests }; 