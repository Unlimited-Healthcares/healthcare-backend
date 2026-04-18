import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test audit endpoints with proper authentication
 */
async function testAuditEndpoints(): Promise<void> {
  console.log('🚀 Starting Audit Endpoints Test...\n');

  const runner = new HttpTestRunner('Audit');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Setup authentication with admin role for audit access
    await runner.setupAuthentication('admin');

    // Define test endpoints for audit logs retrieval
    const endpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          page: 1,
          limit: 50
        },
        expectedStatus: 200,
        description: 'Get all audit logs (default pagination)'
      },
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          page: 1,
          limit: 10
        },
        expectedStatus: 200,
        description: 'Get audit logs with custom pagination'
      },
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          userId: 'test-user-id',
          page: 1,
          limit: 20
        },
        expectedStatus: 200,
        description: 'Get audit logs filtered by user ID'
      },
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          entityType: 'user',
          page: 1,
          limit: 15
        },
        expectedStatus: 200,
        description: 'Get audit logs filtered by entity type'
      },
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          action: 'CREATE',
          page: 1,
          limit: 25
        },
        expectedStatus: 200,
        description: 'Get audit logs filtered by action'
      },
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          page: 1,
          limit: 30
        },
        expectedStatus: 200,
        description: 'Get audit logs filtered by date range'
      },
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          userId: 'test-user-id',
          entityType: 'patient',
          action: 'UPDATE',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          page: 1,
          limit: 50
        },
        expectedStatus: 200,
        description: 'Get audit logs with multiple filters'
      }
    ];

    // Run basic audit tests
    console.log('📋 Running audit endpoint tests...\n');
    for (const endpoint of endpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test pagination scenarios
    console.log('\n🔍 Testing pagination scenarios...\n');
    
    const paginationTests: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          page: 2,
          limit: 10
        },
        expectedStatus: 200,
        description: 'Get second page of audit logs'
      },
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          page: 1,
          limit: 100
        },
        expectedStatus: 200,
        description: 'Get audit logs with large limit'
      },
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          page: 999,
          limit: 10
        },
        expectedStatus: 200,
        description: 'Get very high page number (should return empty)'
      }
    ];

    for (const endpoint of paginationTests) {
      await runner.testEndpoint(endpoint);
    }

    // Test error scenarios - Updated to expect 400 for validation errors
    console.log('\n🚨 Testing error scenarios...\n');
    
    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          page: -1,
          limit: 10
        },
        expectedStatus: 400, // Updated: Should return 400 for negative page
        description: 'Get audit logs with negative page number'
      },
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          page: 1,
          limit: -5
        },
        expectedStatus: 400, // Updated: Should return 400 for negative limit
        description: 'Get audit logs with negative limit'
      },
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          startDate: 'invalid-date',
          endDate: '2024-12-31'
        },
        expectedStatus: 400, // Updated: Should return 400 for invalid date
        description: 'Get audit logs with invalid start date'
      },
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          startDate: '2024-01-01',
          endDate: 'invalid-date'
        },
        expectedStatus: 400, // Updated: Should return 400 for invalid date
        description: 'Get audit logs with invalid end date'
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
        path: '/analytics/audit-logs',
        requiresAuth: true,
        expectedStatus: 403, // Patient role should not have access to audit logs
        description: 'Get audit logs (patient role - should be forbidden)'
      },
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        query: {
          page: 1,
          limit: 10
        },
        expectedStatus: 403,
        description: 'Get audit logs with pagination (patient role - should be forbidden)'
      }
    ];

    for (const endpoint of unauthorizedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test doctor role access
    console.log('\n🔍 Testing doctor role access...\n');
    
    // Switch to doctor role
    await runner.setupAuthentication('doctor');
    
    const doctorEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        expectedStatus: 403, // Doctor role should not have access to audit logs
        description: 'Get audit logs (doctor role - should be forbidden)'
      }
    ];

    for (const endpoint of doctorEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test center role access
    console.log('\n🔍 Testing center role access...\n');
    
    // Switch to center role
    await runner.setupAuthentication('center');
    
    const centerEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: true,
        expectedStatus: 403, // Center role should not have access to audit logs
        description: 'Get audit logs (center role - should be forbidden)'
      }
    ];

    for (const endpoint of centerEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test unauthenticated access
    console.log('\n🚨 Testing unauthenticated access...\n');
    
    const unauthenticatedEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/analytics/audit-logs',
        requiresAuth: false, // Don't send auth token
        expectedStatus: 401,
        description: 'Get audit logs without authentication'
      }
    ];

    for (const endpoint of unauthenticatedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    console.log('\n✅ Audit endpoints test completed successfully!');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAuditEndpoints()
    .then(() => {
      console.log('\n🎉 All audit endpoint tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error.message);
      process.exit(1);
    });
}

export { testAuditEndpoints }; 