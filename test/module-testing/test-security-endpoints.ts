import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

async function testSecurityEndpoints(): Promise<void> {
  const runner = new HttpTestRunner('security', 'http://localhost:3000');

  try {
    await runner.initialize();

    // Test with admin role
    console.log('\n👑 Testing with admin role...\n');
    
    await runner.setupAuthentication('admin');
    
    const adminEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/security/audit-logs',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get audit logs (admin role)'
      },
      {
        method: 'GET',
        path: '/security/incidents',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get security incidents (admin role)'
      }
    ];

    for (const endpoint of adminEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    console.log('\n✅ Security endpoints test completed successfully!');

  } catch (error) {
    console.error('❌ Security test execution failed:', error.message);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSecurityEndpoints()
    .then(() => {
      console.log('\n🎉 Security endpoints test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Security endpoints test failed:', error.message);
      process.exit(1);
    });
}

export { testSecurityEndpoints }; 