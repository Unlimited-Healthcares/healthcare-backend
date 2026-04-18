import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test compliance endpoints with proper authentication
 */
async function testComplianceEndpoints(): Promise<void> {
  console.log('🚀 Starting Compliance Endpoints Test...\n');

  const runner = new HttpTestRunner('Compliance');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Test with patient role
    console.log('\n👤 Testing with patient role...\n');
    
    await runner.setupAuthentication('patient');
    
    const patientEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/compliance/privacy-policy',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get privacy policy (patient role)'
      },
      {
        method: 'GET',
        path: '/compliance/terms-of-service',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get terms of service (patient role)'
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
        path: '/compliance/privacy-policy',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get privacy policy (doctor role)'
      },
      {
        method: 'GET',
        path: '/compliance/terms-of-service',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get terms of service (doctor role)'
      },
      {
        method: 'GET',
        path: '/compliance/audit-logs',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get audit logs (doctor role)'
      }
    ];

    for (const endpoint of doctorEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with admin role
    console.log('\n👑 Testing with admin role...\n');
    
    await runner.setupAuthentication('admin');
    
    const adminEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/compliance/privacy-policy',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get privacy policy (admin role)'
      },
      {
        method: 'GET',
        path: '/compliance/terms-of-service',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get terms of service (admin role)'
      },
      {
        method: 'GET',
        path: '/compliance/audit-logs',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get audit logs (admin role)'
      }
    ];

    for (const endpoint of adminEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    const report = runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    console.log('\n✅ Compliance endpoints test completed successfully!');
    console.log(`📈 Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`⏱️  Average Response Time: ${report.summary.averageResponseTime.toFixed(0)}ms`);

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testComplianceEndpoints()
    .then(() => {
      console.log('\n🎉 All compliance endpoint tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Compliance endpoint tests failed:', error.message);
      process.exit(1);
    });
}

export { testComplianceEndpoints }; 