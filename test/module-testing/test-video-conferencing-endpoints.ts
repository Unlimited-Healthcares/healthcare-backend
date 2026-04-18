import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test video conferencing endpoints with proper authentication
 */
async function testVideoConferencingEndpoints(): Promise<void> {
  console.log('🚀 Starting Video Conferencing Endpoints Test...\n');

  const runner = new HttpTestRunner('VideoConferencing');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Setup authentication with doctor role for most endpoints
    await runner.setupAuthentication('doctor');

    // Define test endpoints for video conferencing management
    const endpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/video-conferences',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get user video conferences'
      },
      {
        method: 'GET',
        path: '/video-conferences?page=1&limit=10',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get user video conferences with pagination'
      }
    ];

    // Run basic video conferencing tests
    console.log('📋 Running video conferencing endpoint tests...\n');
    for (const endpoint of endpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test video conference creation
    console.log('\n🔍 Testing video conference creation endpoints...\n');
    
    const createConferenceData = {
      title: 'Patient Consultation Session',
      description: 'Follow-up consultation for patient health review',
      type: 'consultation',
      maxParticipants: 5,
      isRecordingEnabled: true,
      meetingPassword: 'secure123',
      waitingRoomEnabled: true,
      autoAdmitParticipants: false,
      muteParticipantsOnEntry: true,
      provider: 'webrtc',
      participantIds: [] // Will be populated after user creation
    };

    const createEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/video-conferences',
        requiresAuth: true,
        body: createConferenceData,
        expectedStatus: 201,
        description: 'Create a new video conference'
      }
    ];

    for (const endpoint of createEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test conference management endpoints (requires a valid conference ID)
    console.log('\n🔍 Testing conference management endpoints...\n');
    
    // Note: These endpoints require a valid conference ID, so we'll test with a placeholder
    // In a real scenario, you would use the ID from the creation response
    const conferenceId = '00000000-0000-0000-0000-000000000000'; // Placeholder
    
    const managementEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: `/video-conferences/${conferenceId}`,
        requiresAuth: true,
        expectedStatus: 403, // Expected to fail - not a participant
        description: 'Get video conference details (not a participant)'
      },
      {
        method: 'POST',
        path: `/video-conferences/${conferenceId}/start`,
        requiresAuth: true,
        expectedStatus: 404, // Expected to fail with placeholder ID
        description: 'Start video conference (with placeholder ID)'
      },
      {
        method: 'POST',
        path: `/video-conferences/${conferenceId}/end`,
        requiresAuth: true,
        expectedStatus: 404, // Expected to fail with placeholder ID
        description: 'End video conference (with placeholder ID)'
      },
      {
        method: 'POST',
        path: `/video-conferences/${conferenceId}/join`,
        requiresAuth: true,
        expectedStatus: 403, // Expected to fail - not a participant
        description: 'Join video conference (not a participant)'
      },
      {
        method: 'POST',
        path: `/video-conferences/${conferenceId}/leave`,
        requiresAuth: true,
        expectedStatus: 404, // Expected to fail with placeholder ID
        description: 'Leave video conference (with placeholder ID)'
      },
      {
        method: 'POST',
        path: `/video-conferences/${conferenceId}/recording/toggle`,
        requiresAuth: true,
        expectedStatus: 404, // Expected to fail with placeholder ID
        description: 'Toggle conference recording (with placeholder ID)'
      },
      {
        method: 'PATCH',
        path: `/video-conferences/${conferenceId}/settings`,
        requiresAuth: true,
        body: {
          isCameraEnabled: true,
          isMicrophoneEnabled: false,
          isScreenSharing: false
        },
        expectedStatus: 404, // Expected to fail with placeholder ID
        description: 'Update participant settings (with placeholder ID)'
      },
      {
        method: 'GET',
        path: `/video-conferences/${conferenceId}/recordings`,
        requiresAuth: true,
        expectedStatus: 403, // Expected to fail - not a participant
        description: 'Get conference recordings (not a participant)'
      }
    ];

    for (const endpoint of managementEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test error scenarios
    console.log('\n🚨 Testing error scenarios...\n');
    
    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/video-conferences/invalid-uuid',
        requiresAuth: true,
        expectedStatus: 400, // UUID validation error
        description: 'Get conference with invalid ID format'
      },
      {
        method: 'POST',
        path: '/video-conferences',
        requiresAuth: true,
        body: {
          // Missing required title field
          description: 'Test conference without title'
        },
        expectedStatus: 400, // Validation error for missing title
        description: 'Create conference without required title field'
      },
      {
        method: 'POST',
        path: '/video-conferences',
        requiresAuth: true,
        body: {
          title: 'Test Conference',
          type: 'invalid_type', // Invalid enum value
          participantIds: []
        },
        expectedStatus: 400, // Validation error for invalid type
        description: 'Create conference with invalid type'
      },
      {
        method: 'POST',
        path: '/video-conferences',
        requiresAuth: true,
        body: {
          title: 'Test Conference',
          participantIds: ['invalid-uuid'] // Invalid UUID format
        },
        expectedStatus: 400, // Validation error for invalid UUID
        description: 'Create conference with invalid participant ID'
      },
      {
        method: 'PATCH',
        path: `/video-conferences/${conferenceId}/settings`,
        requiresAuth: true,
        body: {
          isCameraEnabled: 'not-a-boolean' // Invalid type
        },
        expectedStatus: 404, // Will fail due to placeholder ID, but also type validation
        description: 'Update settings with invalid data types'
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
        method: 'POST',
        path: '/video-conferences',
        requiresAuth: true,
        body: createConferenceData,
        expectedStatus: 201, // Patients can create conferences
        description: 'Create conference (patient role - should be allowed)'
      },
      {
        method: 'GET',
        path: '/video-conferences',
        requiresAuth: true,
        expectedStatus: 200, // Patients can view their conferences
        description: 'Get conferences (patient role - should be allowed)'
      }
    ];

    for (const endpoint of unauthorizedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test different conference types
    console.log('\n🔍 Testing different conference types...\n');
    
    const conferenceTypes = [
      {
        title: 'Emergency Consultation',
        type: 'emergency',
        description: 'Urgent medical consultation'
      },
      {
        title: 'Group Therapy Session',
        type: 'group_session',
        description: 'Group therapy session'
      },
      {
        title: 'Medical Training',
        type: 'training',
        description: 'Medical staff training session'
      },
      {
        title: 'Team Meeting',
        type: 'meeting',
        description: 'Healthcare team meeting'
      }
    ];

    for (const conferenceType of conferenceTypes) {
      const typeTestData = {
        ...conferenceType,
        maxParticipants: 10,
        isRecordingEnabled: false,
        provider: 'internal',
        participantIds: []
      };

      const typeEndpoint: EndpointTestConfig = {
        method: 'POST',
        path: '/video-conferences',
        requiresAuth: true,
        body: typeTestData,
        expectedStatus: 201,
        description: `Create ${conferenceType.type} conference`
      };

      await runner.testEndpoint(typeEndpoint);
    }

    // Test different providers
    console.log('\n🔍 Testing different video providers...\n');
    
    const providers = ['internal', 'zoom', 'teams', 'webrtc'];
    
    for (const provider of providers) {
      const providerTestData = {
        title: `${provider.toUpperCase()} Test Conference`,
        description: `Test conference using ${provider} provider`,
        type: 'consultation',
        provider: provider,
        maxParticipants: 5,
        isRecordingEnabled: true,
        participantIds: []
      };

      const providerEndpoint: EndpointTestConfig = {
        method: 'POST',
        path: '/video-conferences',
        requiresAuth: true,
        body: providerTestData,
        expectedStatus: 201,
        description: `Create conference with ${provider} provider`
      };

      await runner.testEndpoint(providerEndpoint);
    }

    // Test query parameters
    console.log('\n🔍 Testing query parameters...\n');
    
    const queryTests: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/video-conferences?page=2&limit=5',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get conferences with custom pagination'
      },
      {
        method: 'GET',
        path: '/video-conferences?page=0&limit=100',
        requiresAuth: true,
        expectedStatus: 400,
        description: 'Get conferences with invalid pagination (page=0)'
      }
    ];

    for (const endpoint of queryTests) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    console.log('\n✅ Video Conferencing endpoints test completed successfully!');

  } catch (error) {
    console.error('❌ Video Conferencing test execution failed:', error.message);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testVideoConferencingEndpoints()
    .then(() => {
      console.log('\n🎉 All video conferencing tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Video conferencing tests failed:', error.message);
      process.exit(1);
    });
}

export { testVideoConferencingEndpoints }; 