import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test chat endpoints with proper authentication
 */
async function testChatEndpoints(): Promise<void> {
  console.log('🚀 Starting Chat Endpoints Test...\n');

  const runner = new HttpTestRunner('Chat');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Test with patient role
    console.log('\n👤 Testing with patient role...\n');
    
    await runner.setupAuthentication('patient');
    
    const patientEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/chat/rooms',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get chat rooms (patient role)'
      },
      {
        method: 'POST',
        path: '/chat/rooms',
        requiresAuth: true,
        body: {
          name: 'Patient Test Room',
          type: 'direct',
          participants: ['patient-123']
        },
        expectedStatus: 201,
        description: 'Create chat room (patient role)'
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
        path: '/chat/rooms',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get chat rooms (doctor role)'
      },
      {
        method: 'POST',
        path: '/chat/rooms',
        requiresAuth: true,
        body: {
          name: 'Doctor Test Room',
          type: 'group',
          participants: ['doctor-123', 'patient-456']
        },
        expectedStatus: 201,
        description: 'Create chat room (doctor role)'
      }
    ];

    for (const endpoint of doctorEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test error scenarios
    console.log('\n🚨 Testing error scenarios...\n');
    
    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/chat/rooms/invalid-uuid',
        requiresAuth: true,
        expectedStatus: 400,
        description: 'Get chat room with invalid UUID'
      },
      {
        method: 'GET',
        path: '/chat/rooms/00000000-0000-0000-0000-000000000000',
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Get non-existent chat room'
      },
      {
        method: 'POST',
        path: '/chat/rooms',
        requiresAuth: true,
        body: {
          // Missing required name field
          type: 'direct'
        },
        expectedStatus: 400,
        description: 'Create chat room with missing required field'
      }
    ];

    for (const endpoint of errorScenarios) {
      await runner.testEndpoint(endpoint);
    }

    // Test WebSocket endpoints (simulated)
    console.log('\n🔌 Testing WebSocket endpoints (simulated)...\n');
    
    const websocketEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/chat/websocket/connect',
        requiresAuth: true,
        body: {
          userId: 'test-user-123',
          roomId: 'test-room-456'
        },
        expectedStatus: 200,
        description: 'Connect to WebSocket (simulated)'
      },
      {
        method: 'POST',
        path: '/chat/websocket/join-room',
        requiresAuth: true,
        body: {
          roomId: 'test-room-456',
          userId: 'test-user-123'
        },
        expectedStatus: 200,
        description: 'Join chat room via WebSocket (simulated)'
      },
      {
        method: 'POST',
        path: '/chat/websocket/send-message',
        requiresAuth: true,
        body: {
          roomId: 'test-room-456',
          message: {
            content: 'Test message',
            type: 'text'
          },
          userId: 'test-user-123'
        },
        expectedStatus: 200,
        description: 'Send message via WebSocket (simulated)'
      }
    ];

    for (const endpoint of websocketEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    const report = runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    console.log('\n✅ Chat module testing completed successfully!');
    console.log(`📈 Success Rate: ${report.summary.successRate.toFixed(1)}%`);
    console.log(`⏱️  Average Response Time: ${report.summary.averageResponseTime.toFixed(0)}ms`);

  } catch (error) {
    console.error('❌ Chat module testing failed:', error.message);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testChatEndpoints()
    .then(() => {
      console.log('\n🎉 Chat endpoints test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Chat endpoints test failed:', error.message);
      process.exit(1);
    });
}

export { testChatEndpoints }; 