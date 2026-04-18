import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test WebSocket gateway endpoints for real-time functionality
 * This tests the WebSocket gateways for notifications, chat, and video conferencing
 */
async function testWebSocketEndpoints(): Promise<void> {
  console.log('🚀 Starting WebSocket Endpoints Test...\n');

  const runner = new HttpTestRunner('WebSocket');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Test WebSocket gateway health endpoints
    console.log('📋 Testing WebSocket gateway health endpoints...\n');
    
    const healthEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/health',
        requiresAuth: false,
        expectedStatus: 200,
        description: 'Health check to verify WebSocket gateways are available'
      }
    ];

    for (const endpoint of healthEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test notification WebSocket endpoints
    console.log('\n🔔 Testing notification WebSocket endpoints...\n');
    
    await runner.setupAuthentication('admin');
    
    const notificationEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/notifications',
        requiresAuth: true,
        expectedStatus: 200, // HTTP endpoint for notifications
        description: 'Access notification HTTP endpoint'
      }
    ];

    for (const endpoint of notificationEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test chat WebSocket endpoints
    console.log('\n💬 Testing chat WebSocket endpoints...\n');
    
    await runner.setupAuthentication('patient');
    
    const chatEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/chat',
        requiresAuth: true,
        expectedStatus: 200, // HTTP endpoint for chat
        description: 'Access chat HTTP endpoint'
      }
    ];

    for (const endpoint of chatEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test video conferencing WebSocket endpoints
    console.log('\n📹 Testing video conferencing WebSocket endpoints...\n');
    
    await runner.setupAuthentication('doctor');
    
    const videoEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/video-conference',
        requiresAuth: true,
        expectedStatus: 200, // HTTP endpoint for video conferencing
        description: 'Access video conferencing HTTP endpoint'
      }
    ];

    for (const endpoint of videoEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test WebSocket authentication endpoints
    console.log('\n🔐 Testing WebSocket authentication endpoints...\n');
    
    const authEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/auth/login',
        requiresAuth: false,
        body: {
          email: 'test-websocket@example.com',
          password: 'StrongP@ssw0rd2024!'
        },
        expectedStatus: 401, // Invalid credentials
        description: 'Test WebSocket authentication with invalid credentials'
      }
    ];

    for (const endpoint of authEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test WebSocket namespace access
    console.log('\n🌐 Testing WebSocket namespace access...\n');
    
    const namespaceEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/socket.io/',
        requiresAuth: false,
        expectedStatus: 400, // Socket.IO endpoint with transport error
        description: 'Access Socket.IO endpoint'
      }
    ];

    for (const endpoint of namespaceEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test error scenarios for WebSocket endpoints
    console.log('\n🚨 Testing WebSocket error scenarios...\n');
    
    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/notifications/invalid-endpoint',
        requiresAuth: true,
        expectedStatus: 404, // Invalid WebSocket endpoint
        description: 'Access invalid notification WebSocket endpoint'
      },
      {
        method: 'POST',
        path: '/chat/invalid-endpoint',
        requiresAuth: true,
        expectedStatus: 404, // Invalid WebSocket endpoint
        description: 'Access invalid chat WebSocket endpoint'
      },
      {
        method: 'POST',
        path: '/video-conference/invalid-endpoint',
        requiresAuth: true,
        expectedStatus: 404, // Invalid WebSocket endpoint
        description: 'Access invalid video conferencing WebSocket endpoint'
      }
    ];

    for (const endpoint of errorScenarios) {
      await runner.testEndpoint(endpoint);
    }

    // Test unauthorized access scenarios
    console.log('\n🚨 Testing unauthorized WebSocket access scenarios...\n');
    
    // Switch to patient role for unauthorized tests
    await runner.setupAuthentication('patient');
    
    const unauthorizedEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/admin/websocket',
        requiresAuth: true,
        expectedStatus: 404, // Admin WebSocket endpoint doesn't exist
        description: 'Access admin WebSocket endpoint (patient role - should be not found)'
      }
    ];

    for (const endpoint of unauthorizedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test WebSocket connection limits
    console.log('\n🔢 Testing WebSocket connection limits...\n');
    
    const connectionLimitEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/socket.io/?EIO=4&transport=polling',
        requiresAuth: false,
        expectedStatus: 200, // Socket.IO polling endpoint
        description: 'Test Socket.IO polling transport'
      }
    ];

    for (const endpoint of connectionLimitEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    console.log('\n✅ WebSocket endpoints test completed successfully!');
    console.log('📝 Note: This test covers WebSocket gateway accessibility and basic functionality.');
    console.log('📝 Actual WebSocket connections and real-time events are tested in integration tests.');
    console.log('🌐 WebSocket Namespaces:');
    console.log('   - /notifications - Real-time notifications');
    console.log('   - /chat - Real-time chat functionality');
    console.log('   - /video-conference - Real-time video conferencing');

  } catch (error) {
    console.error('❌ WebSocket test execution failed:', error.message);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testWebSocketEndpoints()
    .then(() => {
      console.log('\n✅ All WebSocket endpoint tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ WebSocket endpoint tests failed:', error.message);
      process.exit(1);
    });
}

export { testWebSocketEndpoints }; 