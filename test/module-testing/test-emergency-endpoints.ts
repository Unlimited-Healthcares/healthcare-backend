import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test Emergency Services endpoints with proper authentication
 * Covers: Ambulance Services, Emergency Alerts, Viral Reporting
 */
async function testEmergencyEndpoints(): Promise<void> {
  console.log('🚨 Starting Emergency Services Endpoints Test...\n');

  const runner = new HttpTestRunner('Emergency');

  try {
    // Initialize the test runner
    await runner.initialize();

    // ========================================
    // AMBULANCE SERVICES TESTS
    // ========================================
    console.log('🚑 Testing Ambulance Services endpoints...\n');
    
    // Test with patient role
    console.log('\n👤 Testing with patient role...\n');
    
    await runner.setupAuthentication('patient');
    
    const patientEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/emergency/ambulances',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get available ambulances (patient role)'
      },
      {
        method: 'POST',
        path: '/emergency/ambulance-requests',
        requiresAuth: true,
        body: {
          patientName: 'John Doe',
          patientPhone: '+1234567890',
          pickupLatitude: 40.7128,
          pickupLongitude: -74.0060,
          pickupAddress: '123 Main St, New York, NY',
          medicalCondition: 'Chest pain',
          priority: 'high'
        },
        expectedStatus: 201,
        description: 'Create ambulance request (patient role)'
      }
    ];

    for (const endpoint of patientEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with admin role
    console.log('\n👑 Testing with admin role...\n');
    
    await runner.setupAuthentication('admin');
    
    const adminEmergencyEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/emergency/ambulances',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get available ambulances (admin role)'
      },
      {
        method: 'GET',
        path: '/emergency/ambulance-requests',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get ambulance requests (admin role)'
      }
    ];

    for (const endpoint of adminEmergencyEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // ========================================
    // EMERGENCY ALERTS TESTS
    // ========================================
    console.log('\n🚨 Testing Emergency Alerts endpoints...\n');

    // Test SOS alert creation
    const sosAlertData = {
      type: 'medical_emergency',
      description: 'Patient experiencing severe chest pain',
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Emergency Street, New York, NY 10001',
      contactNumber: '+1234567890',
      medicalInfo: {
        bloodType: 'O+',
        allergies: ['Penicillin'],
        medications: ['Aspirin'],
        medicalConditions: ['Hypertension'],
        emergencyContacts: [
          {
            name: 'Jane Doe',
            phone: '+1234567891',
            relationship: 'Spouse'
          }
        ],
        notes: 'Patient has history of heart disease'
      },
      isTestAlert: false
    };

    const alertEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/emergency/alerts/sos',
        requiresAuth: true,
        body: sosAlertData,
        expectedStatus: 201,
        description: 'Create SOS alert'
      },
      {
        method: 'GET',
        path: '/emergency/alerts',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get emergency alerts'
      }
    ];

    for (const endpoint of alertEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test emergency contacts
    const emergencyContactData = {
      contactName: 'Jane Doe',
      contactPhone: '+1234567891',
      contactEmail: 'jane.doe@example.com',
      relationship: 'Spouse',
      isPrimary: true,
      isMedicalContact: true,
      contactAddress: '123 Emergency Street, New York, NY 10001',
      notes: 'Primary emergency contact',
      notificationPreferences: {
        sms: true,
        email: true,
        push: false
      }
    };

    const contactEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/emergency/alerts/emergency-contacts',
        requiresAuth: true,
        body: emergencyContactData,
        expectedStatus: 201,
        description: 'Add emergency contact'
      },
      {
        method: 'GET',
        path: '/emergency/alerts/emergency-contacts',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get emergency contacts'
      }
    ];

    for (const endpoint of contactEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test invalid SOS alert data
    const invalidSOSData = {
      type: 'invalid_type', // Invalid enum value
      latitude: 'invalid', // Invalid: should be number
      longitude: -74.0060,
      contactNumber: 'invalid-phone' // Invalid phone format
    };

    const invalidAlertEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/emergency/alerts/sos',
        requiresAuth: true,
        body: invalidSOSData,
        expectedStatus: 400,
        description: 'Create SOS alert with invalid data'
      }
    ];

    for (const endpoint of invalidAlertEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // ========================================
    // VIRAL REPORTING TESTS
    // ========================================
    console.log('\n🦠 Testing Viral Reporting endpoints...\n');

    // Test viral report creation
    const viralReportData = {
      type: 'symptom_report',
      isAnonymous: false,
      diseaseType: 'COVID-19',
      symptoms: ['fever', 'cough', 'fatigue', 'loss of taste'],
      onsetDate: '2024-01-15T00:00:00.000Z',
      exposureDate: '2024-01-10T00:00:00.000Z',
      locationLatitude: 40.7128,
      locationLongitude: -74.0060,
      locationAddress: '123 Test Street, New York, NY 10001',
      contactInformation: {
        name: 'John Doe',
        phone: '+1234567890',
        email: 'john.doe@example.com'
      },
      affectedCount: 1,
      description: 'Experiencing COVID-like symptoms',
      riskFactors: ['recent travel', 'contact with infected person'],
      preventiveMeasures: ['mask wearing', 'social distancing'],
      healthcareFacilityVisited: 'City General Hospital',
      testResults: {
        testType: 'PCR',
        testDate: '2024-01-15T00:00:00.000Z',
        result: 'pending'
      }
    };

    const viralReportingEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/emergency/viral-reporting/reports',
        requiresAuth: true,
        body: viralReportData,
        expectedStatus: 201,
        description: 'Create viral report'
      },
      {
        method: 'GET',
        path: '/emergency/viral-reporting/reports',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get viral reports'
      }
    ];

    for (const endpoint of viralReportingEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test invalid viral report data
    const invalidViralData = {
      type: 'invalid_type', // Invalid enum value
      diseaseType: '', // Invalid: empty string
      symptoms: 'invalid', // Invalid: should be array
      onsetDate: 'invalid-date', // Invalid date format
      locationLatitude: 'invalid' // Invalid: should be number
    };

    const invalidViralEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/emergency/viral-reporting/reports',
        requiresAuth: true,
        body: invalidViralData,
        expectedStatus: 400,
        description: 'Create viral report with invalid data'
      }
    ];

    for (const endpoint of invalidViralEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // ========================================
    // ADMIN ROLE TESTS
    // ========================================
    console.log('\n👨‍⚕️ Testing Admin role endpoints...\n');
    
    // Switch to admin role for admin-only endpoints
    await runner.setupAuthentication('admin');
    
    const adminEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/emergency/ambulance/coordinate-response',
        requiresAuth: true,
        body: {
          type: 'ambulance',
          priority: 'high',
          location: { latitude: 40.7128, longitude: -74.0060 },
          address: '123 Emergency Street, New York, NY 10001',
          description: 'Medical emergency requiring immediate response',
          contactNumber: '+1234567890'
        },
        expectedStatus: 200,
        description: 'Coordinate emergency response (admin only)'
      }
    ];

    for (const endpoint of adminEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // ========================================
    // ERROR SCENARIOS TESTS
    // ========================================
    console.log('\n🚨 Testing error scenarios...\n');

    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/emergency/ambulance/requests/invalid-uuid',
        requiresAuth: true,
        expectedStatus: 400,
        description: 'Get ambulance request with invalid ID format'
      },
      {
        method: 'GET',
        path: '/emergency/ambulance/requests/00000000-0000-0000-0000-000000000000',
        requiresAuth: true,
        expectedStatus: 400,
        description: 'Get non-existent ambulance request'
      },
      {
        method: 'PUT',
        path: '/emergency/ambulance/requests/00000000-0000-0000-0000-000000000000/status',
        requiresAuth: true,
        body: { status: 'completed' },
        expectedStatus: 404,
        description: 'Update status of non-existent ambulance request'
      },
      {
        method: 'PUT',
        path: '/emergency/alerts/00000000-0000-0000-0000-000000000000/acknowledge',
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Acknowledge non-existent emergency alert'
      },
      {
        method: 'PUT',
        path: '/emergency/alerts/00000000-0000-0000-0000-000000000000/resolve',
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Resolve non-existent emergency alert'
      },
      {
        method: 'GET',
        path: '/emergency/viral-reporting/reports/00000000-0000-0000-0000-000000000000/contact-traces',
        requiresAuth: true,
        expectedStatus: 400,
        description: 'Get contact traces for non-existent viral report'
      }
    ];

    for (const endpoint of errorScenarios) {
      await runner.testEndpoint(endpoint);
    }

    // ========================================
    // UNAUTHORIZED ACCESS TESTS
    // ========================================
    console.log('\n🚨 Testing unauthorized access scenarios...\n');
    
    // Switch to patient role for unauthorized tests
    await runner.setupAuthentication('patient');
    
    const unauthorizedEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/emergency/ambulance/coordinate-response',
        requiresAuth: true,
        body: {
          type: 'ambulance',
          priority: 'high',
          location: { latitude: 40.7128, longitude: -74.0060 },
          description: 'Medical emergency',
          contactNumber: '+1234567890'
        },
        expectedStatus: 403,
        description: 'Coordinate emergency response (patient role - should be forbidden)'
      }
    ];

    for (const endpoint of unauthorizedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // ========================================
    // AUTHENTICATION TESTS
    // ========================================
    console.log('\n🔐 Testing authentication scenarios...\n');

    const unauthenticatedEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/emergency/ambulance/requests',
        requiresAuth: false,
        expectedStatus: 401,
        description: 'Get ambulance requests without authentication'
      },
      {
        method: 'POST',
        path: '/emergency/alerts/sos',
        requiresAuth: false,
        body: sosAlertData,
        expectedStatus: 401,
        description: 'Create SOS alert without authentication'
      },
      {
        method: 'GET',
        path: '/emergency/viral-reporting/reports',
        requiresAuth: false,
        expectedStatus: 401,
        description: 'Get viral reports without authentication'
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

    console.log('\n✅ Emergency Services endpoints test completed successfully!');

  } catch (error) {
    console.error('❌ Emergency Services test execution failed:', error.message);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testEmergencyEndpoints()
    .then(() => {
      console.log('\n🎉 All Emergency Services tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Emergency Services tests failed:', error.message);
      process.exit(1);
    });
}

export { testEmergencyEndpoints }; 