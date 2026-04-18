import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';
import axios from 'axios';

/**
 * Helper function to create a patient record for a test user
 */
async function createPatientRecord(baseUrl: string, authToken: string, userId: string): Promise<void> {
  try {
    const patientData = {
      userId: userId,
      medicalRecordNumber: `MRN${Date.now()}`,
      emergencyContactName: 'Test Emergency Contact',
      emergencyContactPhone: '+1234567890',
      emergencyContactRelationship: 'Spouse',
      bloodType: 'O+',
      allergies: 'None',
      chronicConditions: 'None',
      currentMedications: 'None',
      insuranceProvider: 'Test Insurance',
      insurancePolicyNumber: 'POL123456',
      preferredLanguage: 'English',
      consentDataSharing: true,
      consentResearch: false,
      consentMarketing: false
    };

    await axios.post(`${baseUrl}/patients`, patientData, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Patient record created successfully');
  } catch (error) {
    // Patient might already exist, ignore error
    console.log('ℹ️  Patient record creation skipped (might already exist)');
  }
}

/**
 * Test reviews endpoints with proper authentication and role-based testing
 */
async function testReviewsEndpoints(): Promise<void> {
  console.log('🚀 Starting Reviews Endpoints Test...\n');

  const runner = new HttpTestRunner('Reviews');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Test data setup - we'll need valid UUIDs for testing
    const timestamp = Date.now();

    // 1. Create a real test center
    await runner.setupAuthentication('admin');
    const adminToken = runner.getAuthToken();
    let testCenterId = '';
    try {
      const centerData = {
        name: 'Test Healthcare Center',
        type: 'hospital',
        address: '123 Test Street',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        phone: '+1234567890',
        email: `test-center-${timestamp}@healthcare.com`,
        website: 'https://test-healthcare.com',
        description: 'Test healthcare center for reviews testing',
        services: ['general', 'emergency'],
        operatingHours: {
          monday: '9:00 AM - 5:00 PM',
          tuesday: '9:00 AM - 5:00 PM',
          wednesday: '9:00 AM - 5:00 PM',
          thursday: '9:00 AM - 5:00 PM',
          friday: '9:00 AM - 5:00 PM',
          saturday: '9:00 AM - 1:00 PM',
          sunday: 'Closed'
        },
        isActive: true
      };
      const centerResp = await axios.post(`${runner['baseUrl']}/centers`, centerData, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      testCenterId = centerResp.data.id;
      console.log('✅ Test center created successfully:', testCenterId);
    } catch (error) {
      // Try to fetch the center if already exists
      const resp = await axios.get(`${runner['baseUrl']}/centers`, {
        headers: { 'Authorization': `Bearer ${adminToken}` },
        params: { search: 'Test Healthcare Center' }
      });
      if (resp.data && resp.data.length > 0) {
        testCenterId = resp.data[0].id;
        console.log('ℹ️  Using existing test center:', testCenterId);
      } else {
        throw error;
      }
    }

    // 2. Create a real patient user and record
    const testPatientEmail = `test-reviews-patient-${timestamp}@example.com`;
    const testPatientData = {
      email: testPatientEmail,
      password: 'TestPassword123!',
      name: 'Test Reviews Patient',
      roles: ['patient'],
      phone: '+1234567890'
    };
    await axios.post(`${runner['baseUrl']}/auth/register`, testPatientData, {
      headers: { 'Content-Type': 'application/json' }
    });
    const patientLoginResponse = await axios.post(`${runner['baseUrl']}/auth/login`, {
      email: testPatientEmail,
      password: 'TestPassword123!'
    });
    const patientUserId = patientLoginResponse.data.user.id;
    const patientToken = patientLoginResponse.data.access_token;
    console.log(`✅ Got patient user ID: ${patientUserId}`);
    await runner.setupAuthentication('admin');
    const adminTokenForPatient = runner.getAuthToken();
    await createPatientRecord(runner['baseUrl'], adminTokenForPatient, patientUserId);
    const patientRecord = await axios.get(`${runner['baseUrl']}/patients/me`, {
      headers: { 'Authorization': `Bearer ${patientToken}` }
    });
    const realPatientId = patientRecord.data.id;

    // Set the test runner to use the same patient token for all patient role tests
    runner['authToken'] = patientToken;

    // 3. Create a real doctor user
    const testDoctorEmail = `test-reviews-doctor-${timestamp}@example.com`;
    const testDoctorData = {
      email: testDoctorEmail,
      password: 'TestPassword123!',
      name: 'Test Reviews Doctor',
      roles: ['doctor'],
      phone: '+1234567891'
    };
    await axios.post(`${runner['baseUrl']}/auth/register`, testDoctorData, {
      headers: { 'Content-Type': 'application/json' }
    });
    const doctorLoginResponse = await axios.post(`${runner['baseUrl']}/auth/login`, {
      email: testDoctorEmail,
      password: 'TestPassword123!'
    });
    const doctorUserId = doctorLoginResponse.data.user.id;

    // 4. Create multiple real appointments for the patient and doctor at the test center
    // Create first appointment for the first review
    let testAppointmentId1 = '';
    try {
      const appointmentData1 = {
        centerId: testCenterId,
        patientId: realPatientId,
        doctor: doctorUserId,
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        reason: 'Test appointment for first review'
      };
      const appointmentResp1 = await axios.post(`${runner['baseUrl']}/appointments`, appointmentData1, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      testAppointmentId1 = appointmentResp1.data.id;
      console.log('✅ Test appointment 1 created successfully:', testAppointmentId1);
    } catch (error) {
      if (error.response && error.response.data) {
        console.error('❌ Failed to create test appointment 1:', error.response.data);
      }
      throw error;
    }

    // Create second appointment for the second review
    let testAppointmentId2 = '';
    try {
      const appointmentData2 = {
        centerId: testCenterId,
        patientId: realPatientId,
        doctor: doctorUserId,
        appointmentDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        reason: 'Test appointment for second review'
      };
      const appointmentResp2 = await axios.post(`${runner['baseUrl']}/appointments`, appointmentData2, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      testAppointmentId2 = appointmentResp2.data.id;
      console.log('✅ Test appointment 2 created successfully:', testAppointmentId2);
    } catch (error) {
      if (error.response && error.response.data) {
        console.error('❌ Failed to create test appointment 2:', error.response.data);
      }
      throw error;
    }

    // Use these real IDs for all test data below
    const testReviewId = '123e4567-e89b-12d3-a456-426614174002'; // Only for non-existent review tests

    // Test public endpoints (no auth required)
    console.log('📋 Testing public review endpoints...\n');
    
    const publicEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/reviews',
        requiresAuth: false,
        expectedStatus: 200,
        description: 'Get all reviews (public)'
      },
      {
        method: 'GET',
        path: '/reviews',
        requiresAuth: false,
        query: { centerId: testCenterId, limit: 10 },
        expectedStatus: 200,
        description: 'Get reviews filtered by center ID'
      },
      {
        method: 'GET',
        path: '/reviews',
        requiresAuth: false,
        query: { minRating: 4, maxRating: 5 },
        expectedStatus: 200,
        description: 'Get reviews filtered by rating range'
      },
      {
        method: 'GET',
        path: '/reviews',
        requiresAuth: false,
        query: { verifiedOnly: true },
        expectedStatus: 200,
        description: 'Get verified reviews only'
      },
      {
        method: 'GET',
        path: '/reviews',
        requiresAuth: false,
        query: { hasResponse: true },
        expectedStatus: 200,
        description: 'Get reviews with responses'
      },
      {
        method: 'GET',
        path: '/reviews',
        requiresAuth: false,
        query: { search: 'friendly staff' },
        expectedStatus: 200,
        description: 'Search reviews by content'
      },
      {
        method: 'GET',
        path: '/reviews',
        requiresAuth: false,
        query: { sortBy: 'createdAt', sortOrder: 'DESC' },
        expectedStatus: 200,
        description: 'Get reviews sorted by creation date'
      },
      {
        method: 'GET',
        path: '/reviews',
        requiresAuth: false,
        query: { page: 1, limit: 5 },
        expectedStatus: 200,
        description: 'Get reviews with pagination'
      },
      {
        method: 'GET',
        path: `/reviews/${testReviewId}`,
        requiresAuth: false,
        expectedStatus: 404, // Will fail since review doesn't exist
        description: 'Get specific review by ID (non-existent)'
      },
      {
        method: 'GET',
        path: `/reviews/appointments/${testAppointmentId1}`,
        requiresAuth: false,
        expectedStatus: 200,
        description: 'Get reviews for specific appointment'
      },
      {
        method: 'GET',
        path: `/reviews/centers/${testCenterId}/summary`,
        requiresAuth: false,
        expectedStatus: 200,
        description: 'Get review summary for healthcare center'
      },
      {
        method: 'GET',
        path: `/reviews/${testReviewId}/photos`,
        requiresAuth: false,
        expectedStatus: 404, // Will fail since review doesn't exist
        description: 'Get photos for specific review (non-existent)'
      }
    ];

    for (const endpoint of publicEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test patient role endpoints (create, update, delete reviews)
    console.log('\n🔍 Testing patient role endpoints...\n');

    const createReviewData1 = {
      centerId: testCenterId,
      appointmentId: testAppointmentId1,
      overallRating: 4.5,
      staffRating: 4.0,
      cleanlinessRating: 5.0,
      waitTimeRating: 3.0,
      treatmentRating: 4.5,
      title: 'Great experience at the clinic',
      content: 'The staff was very friendly and professional. The facility was clean and well-maintained.',
      isAnonymous: false,
      photos: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg']
    };

    const createReviewData2 = {
      centerId: testCenterId,
      appointmentId: testAppointmentId2,
      overallRating: 5.0,
      title: 'Another great review',
      content: 'Excellent service and care.'
    };

    const patientEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/reviews',
        requiresAuth: true,
        body: createReviewData1,
        expectedStatus: 201,
        description: 'Create a new review (patient role)'
      },
      {
        method: 'POST',
        path: '/reviews',
        requiresAuth: true,
        body: createReviewData2,
        expectedStatus: 201,
        description: 'Create a simple review (patient role)'
      }
    ];

    for (const endpoint of patientEndpoints) {
      try {
        await runner.testEndpoint(endpoint);
      } catch (error) {
        if (error.response && error.response.data) {
          console.error('❌ Failed to create review:', error.response.data);
        } else {
          console.error('❌ Failed to create review:', error);
        }
        throw error;
      }
    }

    // Test review update (patient role)
    const updateReviewData = {
      overallRating: 4.0,
      title: 'Updated: Great experience at the clinic',
      content: 'Updated review: The staff was very friendly and professional.',
      photos: ['https://example.com/updated-photo.jpg']
    };

    const updateEndpoints: EndpointTestConfig[] = [
      {
        method: 'PUT',
        path: `/reviews/${testReviewId}`,
        requiresAuth: true,
        body: updateReviewData,
        expectedStatus: 404, // Will fail since review doesn't exist
        description: 'Update review (patient role - non-existent review)'
      }
    ];

    for (const endpoint of updateEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test review deletion (patient role)
    const deleteEndpoints: EndpointTestConfig[] = [
      {
        method: 'DELETE',
        path: `/reviews/${testReviewId}`,
        requiresAuth: true,
        expectedStatus: 404, // Will fail since review doesn't exist
        description: 'Delete review (patient role - non-existent review)'
      }
    ];

    for (const endpoint of deleteEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test photo upload (patient role)
    const photoEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: `/reviews/${testReviewId}/photos`,
        requiresAuth: true,
        body: { photos: ['https://example.com/new-photo.jpg'] },
        expectedStatus: 404, // Will fail since review doesn't exist
        description: 'Upload photos to review (patient role - non-existent review)'
      }
    ];

    for (const endpoint of photoEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test voting (patient role)
    const voteEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: `/reviews/${testReviewId}/vote`,
        requiresAuth: true,
        body: { isHelpful: true },
        expectedStatus: 404, // Will fail since review doesn't exist
        description: 'Vote on review (patient role - non-existent review)'
      }
    ];

    for (const endpoint of voteEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test healthcare provider role endpoints (create responses)
    console.log('\n🔍 Testing healthcare provider role endpoints...\n');
    
    await runner.setupAuthentication('doctor');

    const responseEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: `/reviews/${testReviewId}/response`,
        requiresAuth: true,
        body: { content: 'Thank you for your feedback. We appreciate your review.' },
        expectedStatus: 404, // Will fail since review doesn't exist
        description: 'Create response to review (doctor role - non-existent review)'
      }
    ];

    for (const endpoint of responseEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test admin/staff role endpoints (moderation, analytics)
    console.log('\n🔍 Testing admin/staff role endpoints...\n');
    
    await runner.setupAuthentication('admin');

    const moderateReviewData = {
      action: 'approve',
      notes: 'Review approved after verification'
    };

    const adminEndpoints: EndpointTestConfig[] = [
      {
        method: 'PUT',
        path: `/reviews/${testReviewId}/moderate`,
        requiresAuth: true,
        body: moderateReviewData,
        expectedStatus: 404, // Will fail since review doesn't exist
        description: 'Moderate review (admin role - non-existent review)'
      },
      {
        method: 'GET',
        path: `/reviews/centers/${testCenterId}/analytics`,
        requiresAuth: true,
        query: { months: 6 },
        expectedStatus: 200,
        description: 'Get review analytics for healthcare center (admin role)'
      },
      {
        method: 'GET',
        path: `/reviews/centers/${testCenterId}/trends`,
        requiresAuth: true,
        query: { months: 3 },
        expectedStatus: 200,
        description: 'Get review trends for healthcare center (admin role)'
      },
      {
        method: 'GET',
        path: `/reviews/centers/${testCenterId}/advanced-analytics`,
        requiresAuth: true,
        query: { 
          startDate: '2024-01-01', 
          endDate: '2024-12-31',
          includePhotos: true,
          includeResponses: true
        },
        expectedStatus: 200,
        description: 'Get advanced analytics for healthcare center (admin role)'
      }
    ];

    for (const endpoint of adminEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test error scenarios
    console.log('\n🚨 Testing error scenarios...\n');
    
    // Create a new patient user for error scenarios to avoid conflicts
    const errorTestPatientEmail = `test-reviews-error-patient-${timestamp}@example.com`;
    const errorTestPatientData = {
      email: errorTestPatientEmail,
      password: 'TestPassword123!',
      name: 'Test Reviews Error Patient',
      roles: ['patient'],
      phone: '+1234567892'
    };
    await axios.post(`${runner['baseUrl']}/auth/register`, errorTestPatientData, {
      headers: { 'Content-Type': 'application/json' }
    });
    const errorPatientLoginResponse = await axios.post(`${runner['baseUrl']}/auth/login`, {
      email: errorTestPatientEmail,
      password: 'TestPassword123!'
    });
    const errorPatientUserId = errorPatientLoginResponse.data.user.id;
    const errorPatientToken = errorPatientLoginResponse.data.access_token;
    
    // Create patient record for error test user
    await createPatientRecord(runner['baseUrl'], runner.getAuthToken(), errorPatientUserId);
    
    // Set the error test patient token
    runner['authToken'] = errorPatientToken;
    
    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/reviews/invalid-uuid',
        requiresAuth: false,
        expectedStatus: 400, // UUID validation error
        description: 'Get review with invalid ID format'
      },
      {
        method: 'POST',
        path: '/reviews',
        requiresAuth: true,
        body: {
          // Missing required centerId
          appointmentId: testAppointmentId1,
          overallRating: 4.5,
          title: 'Test review'
        },
        expectedStatus: 400, // Validation error
        description: 'Create review with missing required fields'
      },
      {
        method: 'POST',
        path: '/reviews',
        requiresAuth: true,
        body: {
          centerId: testCenterId,
          appointmentId: testAppointmentId1,
          overallRating: 6.0, // Invalid rating
          title: 'Test review'
        },
        expectedStatus: 400, // Validation error
        description: 'Create review with invalid rating'
      },
      {
        method: 'POST',
        path: '/reviews',
        requiresAuth: true,
        body: {
          centerId: testCenterId,
          appointmentId: testAppointmentId1,
          overallRating: 4.5,
          title: 'A'.repeat(201) // Too long title
        },
        expectedStatus: 400, // Validation error
        description: 'Create review with title too long'
      },
      {
        method: 'POST',
        path: '/reviews',
        requiresAuth: true,
        body: {
          centerId: testCenterId,
          appointmentId: testAppointmentId1,
          overallRating: 4.5,
          content: 'A'.repeat(2001) // Too long content
        },
        expectedStatus: 400, // Validation error
        description: 'Create review with content too long'
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
        path: `/reviews/${testReviewId}/response`,
        requiresAuth: true,
        body: { content: 'Unauthorized response' },
        expectedStatus: 403, // Patient cannot create responses
        description: 'Create response (patient role - should be forbidden)'
      },
      {
        method: 'PUT',
        path: `/reviews/${testReviewId}/moderate`,
        requiresAuth: true,
        body: { action: 'approve' },
        expectedStatus: 403, // Patient cannot moderate
        description: 'Moderate review (patient role - should be forbidden)'
      },
      {
        method: 'GET',
        path: `/reviews/centers/${testCenterId}/analytics`,
        requiresAuth: true,
        expectedStatus: 403, // Patient cannot access analytics
        description: 'Get analytics (patient role - should be forbidden)'
      }
    ];

    for (const endpoint of unauthorizedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test staff role for moderation
    console.log('\n🔍 Testing staff role for moderation...\n');
    
    await runner.setupAuthentication('staff');

    const staffEndpoints: EndpointTestConfig[] = [
      {
        method: 'PUT',
        path: `/reviews/${testReviewId}/moderate`,
        requiresAuth: true,
        body: { action: 'flag', notes: 'Flagged for review' },
        expectedStatus: 404, // Will fail since review doesn't exist
        description: 'Moderate review (staff role - non-existent review)'
      },
      {
        method: 'POST',
        path: `/reviews/${testReviewId}/response`,
        requiresAuth: true,
        body: { content: 'Staff response to review' },
        expectedStatus: 404, // Will fail since review doesn't exist
        description: 'Create response (staff role - non-existent review)'
      }
    ];

    for (const endpoint of staffEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with doctor role
    console.log('\n👨‍⚕️ Testing with doctor role...\n');
    
    await runner.setupAuthentication('doctor');
    
    const doctorEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/reviews',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get reviews (doctor role)'
      },
      {
        method: 'POST',
        path: '/reviews',
        requiresAuth: true,
        body: {
          centerId: 'center-123',
          rating: 5,
          comment: 'Excellent service and care',
          reviewType: 'patient_experience'
        },
        expectedStatus: 201,
        description: 'Create review (doctor role)'
      }
    ];

    for (const endpoint of doctorEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with staff role
    console.log('\n👨‍⚕️ Testing with staff role...\n');
    
    await runner.setupAuthentication('staff');
    
    const staffReviewEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/reviews',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get reviews (staff role)'
      },
      {
        method: 'POST',
        path: '/reviews',
        requiresAuth: true,
        body: {
          centerId: 'center-456',
          rating: 4,
          comment: 'Good service overall',
          reviewType: 'staff_experience'
        },
        expectedStatus: 201,
        description: 'Create review (staff role)'
      }
    ];

    for (const endpoint of staffReviewEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    console.log('\n✅ Reviews endpoints test completed successfully!');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testReviewsEndpoints()
    .then(() => {
      console.log('\n🎉 All reviews endpoint tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Reviews endpoint tests failed:', error.message);
      process.exit(1);
    });
}

export { testReviewsEndpoints }; 