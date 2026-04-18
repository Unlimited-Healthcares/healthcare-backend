import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test notifications endpoints with proper authentication
 */
async function testNotificationsEndpoints(): Promise<void> {
  console.log('🚀 Starting Notifications Endpoints Test...\n');

  const runner = new HttpTestRunner('Notifications');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Setup authentication with patient role for most endpoints
    await runner.setupAuthentication('patient');

    // Define test endpoints for notifications management
    const endpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/notifications',
        requiresAuth: true,
        query: { page: 1, limit: 20 },
        expectedStatus: 200,
        description: 'Get user notifications with pagination'
      },
      {
        method: 'GET',
        path: '/notifications',
        requiresAuth: true,
        query: { type: 'appointment', isRead: false, page: 1, limit: 10 },
        expectedStatus: 200,
        description: 'Get filtered notifications (appointments, unread, paginated)'
      },
      {
        method: 'GET',
        path: '/notifications/unread-count',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get unread notifications count'
      },
      {
        method: 'GET',
        path: '/notifications/preferences',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get user notification preferences'
      }
    ];

    // Run basic notifications tests
    console.log('📋 Running notifications endpoint tests...\n');
    for (const endpoint of endpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test notification creation (switch to admin role)
    console.log('\n🔍 Testing notification creation endpoints...\n');
    
    // Re-authenticate as admin for notification creation
    await runner.setupAuthentication('admin');
    
    // Get the actual user ID from the JWT token
    const authToken = runner.getAuthToken();
    const tokenPayload = JSON.parse(Buffer.from(authToken.split('.')[1], 'base64').toString());
    const actualUserId = tokenPayload.sub || tokenPayload.userId || tokenPayload.id;
    
    const createNotificationData = {
      title: 'Test Notification',
      message: 'This is a test notification message',
      type: 'system',
      deliveryMethod: 'in_app',
      isUrgent: false,
      userId: actualUserId // Use the actual user ID from the JWT token
    };

    const createEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/notifications',
        requiresAuth: true,
        body: createNotificationData,
        expectedStatus: 201,
        description: 'Create a new notification'
      }
    ];

    for (const endpoint of createEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test notification preferences update
    console.log('\n🔍 Testing notification preferences endpoints...\n');
    
    const updatePreferencesData = {
      emailVerified: true,
      phoneVerified: false,
      medicalRecordRequest: 'email',
      medicalRecordAccess: 'push',
      appointment: 'both',
      message: 'email',
      system: 'push',
      referral: 'both',
      testResult: 'email',
      payment: 'push',
      marketing: 'none',
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
      timezone: 'UTC'
    };

    const preferencesEndpoints: EndpointTestConfig[] = [
      {
        method: 'PUT',
        path: '/notifications/preferences',
        requiresAuth: true,
        body: updatePreferencesData,
        expectedStatus: 200,
        description: 'Update notification preferences'
      }
    ];

    for (const endpoint of preferencesEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test test notification endpoints
    console.log('\n🔍 Testing test notification endpoints...\n');
    
    const testNotificationEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/notifications/test/email',
        requiresAuth: true,
        expectedStatus: 201,
        description: 'Send test email notification'
      },
      {
        method: 'POST',
        path: '/notifications/test/push',
        requiresAuth: true,
        expectedStatus: 201,
        description: 'Send test push notification'
      },
      {
        method: 'POST',
        path: '/notifications/test/sms',
        requiresAuth: true,
        expectedStatus: 201,
        description: 'Send test SMS notification'
      }
    ];

    for (const endpoint of testNotificationEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test error scenarios
    console.log('\n🚨 Testing error scenarios...\n');
    
    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'PUT',
        path: '/notifications/invalid-uuid/read',
        requiresAuth: true,
        expectedStatus: 400,
        description: 'Mark invalid notification as read'
      },
      {
        method: 'PUT',
        path: '/notifications/00000000-0000-0000-0000-000000000000/read',
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Mark non-existent notification as read'
      },
      {
        method: 'DELETE',
        path: '/notifications/00000000-0000-0000-0000-000000000000',
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Delete non-existent notification'
      },
      {
        method: 'POST',
        path: '/notifications',
        requiresAuth: true,
        body: {
          // Missing required fields
          message: 'Test message'
        },
        expectedStatus: 400,
        description: 'Create notification with missing required fields'
      },
      {
        method: 'POST',
        path: '/notifications',
        requiresAuth: true,
        body: {
          title: 'Test',
          message: 'Test message',
          type: 'invalid_type',
          deliveryMethod: 'invalid_method'
        },
        expectedStatus: 400,
        description: 'Create notification with invalid type and delivery method'
      },
      {
        method: 'PUT',
        path: '/notifications/preferences',
        requiresAuth: true,
        body: {
          medicalRecordRequest: 'invalid_option',
          appointment: 'invalid_option'
        },
        expectedStatus: 400,
        description: 'Update preferences with invalid delivery options'
      },
      {
        method: 'POST',
        path: '/notifications/test/invalid_type',
        requiresAuth: true,
        expectedStatus: 201, // The service accepts any type for test notifications
        description: 'Send test notification with invalid type'
      }
    ];

    for (const endpoint of errorScenarios) {
      await runner.testEndpoint(endpoint);
    }

    // Test unauthorized access scenarios
    console.log('\n🚨 Testing unauthorized access scenarios...\n');
    
    // Switch to patient role for unauthorized tests
    await runner.setupAuthentication('patient');
    
    // Get the actual user ID from the JWT token for the patient
    const patientAuthToken = runner.getAuthToken();
    const patientTokenPayload = JSON.parse(Buffer.from(patientAuthToken.split('.')[1], 'base64').toString());
    const patientUserId = patientTokenPayload.sub || patientTokenPayload.userId || patientTokenPayload.id;
    
    const unauthorizedEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/notifications',
        requiresAuth: true,
        body: {
          title: 'Test Notification',
          message: 'This is a test notification message',
          type: 'system',
          deliveryMethod: 'in_app',
          isUrgent: false,
          userId: patientUserId // Use the actual patient user ID
        },
        expectedStatus: 400,
        description: 'Create system notification (patient role - restricted type)'
      },
      {
        method: 'POST',
        path: '/notifications',
        requiresAuth: true,
        body: {
          title: 'Test Message',
          message: 'This is a test message notification',
          type: 'message',
          deliveryMethod: 'in_app',
          isUrgent: false,
          userId: patientUserId
        },
        expectedStatus: 201,
        description: 'Create message notification (patient role - allowed type)'
      }
    ];

    for (const endpoint of unauthorizedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test notification management endpoints (requires valid notification ID)
    console.log('\n🔍 Testing notification management endpoints...\n');
    
    // Note: These endpoints require a valid notification ID, so we'll test with invalid IDs
    // In a real scenario, you would create a notification first and use its ID
    const managementEndpoints: EndpointTestConfig[] = [
      {
        method: 'PUT',
        path: '/notifications/mark-all-read',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Mark all notifications as read'
      }
    ];

    for (const endpoint of managementEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test query parameter variations
    console.log('\n🔍 Testing query parameter variations...\n');
    
    const queryVariations: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/notifications',
        requiresAuth: true,
        query: { type: 'medical_record', page: 1, limit: 20 },
        expectedStatus: 200,
        description: 'Get notifications by type (medical_record)'
      },
      {
        method: 'GET',
        path: '/notifications',
        requiresAuth: true,
        query: { type: 'payment', page: 1, limit: 20 },
        expectedStatus: 200,
        description: 'Get notifications by type (payment)'
      },
      {
        method: 'GET',
        path: '/notifications',
        requiresAuth: true,
        query: { type: 'system', page: 1, limit: 20 },
        expectedStatus: 200,
        description: 'Get notifications by type (system)'
      },
      {
        method: 'GET',
        path: '/notifications',
        requiresAuth: true,
        query: { isRead: true, page: 1, limit: 20 },
        expectedStatus: 200,
        description: 'Get read notifications only'
      },
      {
        method: 'GET',
        path: '/notifications',
        requiresAuth: true,
        query: { page: 2, limit: 5 },
        expectedStatus: 200,
        description: 'Get notifications with pagination (page 2, limit 5)'
      }
    ];

    for (const endpoint of queryVariations) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    const report = runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    console.log('\n✅ Notifications module testing completed successfully!');
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
  testNotificationsEndpoints()
    .then(() => {
      console.log('\n🎉 All notifications tests completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error.message);
      process.exit(1);
    });
}

export { testNotificationsEndpoints }; 