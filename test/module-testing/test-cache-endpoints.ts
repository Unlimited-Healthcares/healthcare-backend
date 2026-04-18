import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test cache endpoints with proper authentication
 */
async function testCacheEndpoints(): Promise<void> {
  console.log('🚀 Starting Cache Endpoints Test...\n');

  const runner = new HttpTestRunner('Cache');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Setup authentication with admin role for cache management
    await runner.setupAuthentication('admin');

    // Debug: Test what user object looks like
    console.log('\n🔍 Debug: Testing user object in request...\n');
    
    const debugEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/cache/stats/overview',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Debug: Check user object in admin request'
      }
    ];

    for (const endpoint of debugEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test data for cache operations
    const testCacheData = {
      key: 'test-key',
      value: { message: 'Hello from cache', timestamp: new Date().toISOString() },
      ttl: 3600
    };

    const testCacheData2 = {
      key: 'test-key-2',
      value: { data: 'Another cached value', number: 42 },
      ttl: 1800
    };

    // Define test endpoints for cache management
    const endpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/cache/generate-key',
        requiresAuth: true,
        body: { userId: '123', action: 'test' },
        query: { prefix: 'user' },
        expectedStatus: 201,
        description: 'Generate cache key from parameters'
      }
    ];

    // Run basic cache tests
    console.log('📋 Running cache endpoint tests...\n');
    for (const endpoint of endpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test cache set operations
    console.log('\n🔍 Testing cache set operations...\n');
    
    const setEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/cache',
        requiresAuth: true,
        body: testCacheData,
        expectedStatus: 201,
        description: 'Set value in cache with TTL'
      },
      {
        method: 'POST',
        path: '/cache',
        requiresAuth: true,
        body: testCacheData2,
        expectedStatus: 201,
        description: 'Set another value in cache'
      },
      {
        method: 'POST',
        path: '/cache',
        requiresAuth: true,
        body: {
          key: 'simple-key',
          value: 'simple string value'
        },
        expectedStatus: 201,
        description: 'Set simple string value in cache'
      }
    ];

    for (const endpoint of setEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test cache get operations
    console.log('\n🔍 Testing cache get operations...\n');
    
    const getEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/cache/test-key',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get cached value by key'
      },
      {
        method: 'GET',
        path: '/cache/test-key-2',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get second cached value by key'
      },
      {
        method: 'GET',
        path: '/cache/simple-key',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get simple string value from cache'
      }
    ];

    for (const endpoint of getEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test cache delete operations
    console.log('\n🔍 Testing cache delete operations...\n');
    
    const deleteEndpoints: EndpointTestConfig[] = [
      {
        method: 'DELETE',
        path: '/cache/test-key-2',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Delete specific cache key'
      }
    ];

    for (const endpoint of deleteEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Verify deletion by trying to get the deleted key
    console.log('\n🔍 Verifying cache deletion...\n');
    
    const verifyDeletionEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/cache/test-key-2',
        requiresAuth: true,
        expectedStatus: 200, // Should return hit: false
        description: 'Verify deleted key returns hit: false'
      }
    ];

    for (const endpoint of verifyDeletionEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test cache reset operation
    console.log('\n🔍 Testing cache reset operation...\n');
    
    const resetEndpoints: EndpointTestConfig[] = [
      {
        method: 'DELETE',
        path: '/cache',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Reset entire cache'
      }
    ];

    for (const endpoint of resetEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Verify reset by trying to get previously cached values
    console.log('\n🔍 Verifying cache reset...\n');
    
    const verifyResetEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/cache/test-key',
        requiresAuth: true,
        expectedStatus: 200, // Should return hit: false
        description: 'Verify reset key returns hit: false'
      },
      {
        method: 'GET',
        path: '/cache/simple-key',
        requiresAuth: true,
        expectedStatus: 200, // Should return hit: false
        description: 'Verify reset simple key returns hit: false'
      }
    ];

    for (const endpoint of verifyResetEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test error scenarios
    console.log('\n🚨 Testing error scenarios...\n');
    
    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/cache',
        requiresAuth: true,
        body: {
          // Missing key field
          value: 'test value'
        },
        expectedStatus: 400,
        description: 'Set cache with missing key field'
      },
      {
        method: 'POST',
        path: '/cache',
        requiresAuth: true,
        body: {
          key: '',
          value: 'test value'
        },
        expectedStatus: 400,
        description: 'Set cache with empty key'
      },
      {
        method: 'GET',
        path: '/cache/non-existent-key',
        requiresAuth: true,
        expectedStatus: 200, // Should return hit: false
        description: 'Get non-existent cache key'
      }
    ];

    for (const endpoint of errorScenarios) {
      await runner.testEndpoint(endpoint);
    }

    // Test unauthorized access scenarios
    console.log('\n🚨 Testing unauthorized access scenarios...\n');
    
    // Switch to patient role for unauthorized tests
    await runner.setupAuthentication('patient');
    
    const unauthorizedEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/cache/stats/overview',
        requiresAuth: true,
        expectedStatus: 403,
        description: 'Get cache stats (patient role - should be forbidden)'
      },
      {
        method: 'POST',
        path: '/cache',
        requiresAuth: true,
        body: testCacheData,
        expectedStatus: 403,
        description: 'Set cache value (patient role - should be forbidden)'
      },
      {
        method: 'GET',
        path: '/cache/test-key',
        requiresAuth: true,
        expectedStatus: 403,
        description: 'Get cache value (patient role - should be forbidden)'
      },
      {
        method: 'DELETE',
        path: '/cache/test-key',
        requiresAuth: true,
        expectedStatus: 403,
        description: 'Delete cache key (patient role - should be forbidden)'
      },
      {
        method: 'DELETE',
        path: '/cache',
        requiresAuth: true,
        expectedStatus: 403,
        description: 'Reset cache (patient role - should be forbidden)'
      }
    ];

    for (const endpoint of unauthorizedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test doctor role access (should also be forbidden)
    console.log('\n🚨 Testing doctor role access...\n');
    
    await runner.setupAuthentication('doctor');
    
    const doctorUnauthorizedEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/cache/stats/overview',
        requiresAuth: true,
        expectedStatus: 403,
        description: 'Get cache stats (doctor role - should be forbidden)'
      },
      {
        method: 'POST',
        path: '/cache/generate-key',
        requiresAuth: true,
        body: { userId: '123' },
        query: { prefix: 'user' },
        expectedStatus: 403,
        description: 'Generate cache key (doctor role - should be forbidden)'
      }
    ];

    for (const endpoint of doctorUnauthorizedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test center role access (should also be forbidden)
    console.log('\n🚨 Testing center role access...\n');
    
    await runner.setupAuthentication('center');
    
    const centerUnauthorizedEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/cache/stats/overview',
        requiresAuth: true,
        expectedStatus: 403,
        description: 'Get cache stats (center role - should be forbidden)'
      }
    ];

    for (const endpoint of centerUnauthorizedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with patient role
    console.log('\n👤 Testing with patient role...\n');
    
    await runner.setupAuthentication('patient');
    
    const patientEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/cache/health',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get cache health (patient role)'
      },
      {
        method: 'GET',
        path: '/cache/stats',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get cache stats (patient role)'
      }
    ];

    for (const endpoint of patientEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with doctor role
    console.log('\n👨‍⚕️ Testing with doctor role...\n');
    
    await runner.setupAuthentication('doctor');
    
    const doctorEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/cache/health',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get cache health (doctor role)'
      },
      {
        method: 'GET',
        path: '/cache/stats',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get cache stats (doctor role)'
      },
      {
        method: 'POST',
        path: '/cache/clear',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Clear cache (doctor role)'
      }
    ];

    for (const endpoint of doctorEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with center role
    console.log('\n🏥 Testing with center role...\n');
    
    await runner.setupAuthentication('center');
    
    const centerEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/cache/health',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get cache health (center role)'
      },
      {
        method: 'GET',
        path: '/cache/stats',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get cache stats (center role)'
      },
      {
        method: 'POST',
        path: '/cache/clear',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Clear cache (center role)'
      }
    ];

    for (const endpoint of centerEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    console.log('\n✅ Cache endpoints test completed successfully!');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCacheEndpoints()
    .then(() => {
      console.log('\n🎉 Cache endpoints test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Cache endpoints test failed:', error.message);
      process.exit(1);
    });
}

export { testCacheEndpoints }; 