import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';
import axios from 'axios';

/**
 * Test referrals endpoints with proper authentication
 */
async function testReferralsEndpoints(): Promise<void> {
  console.log('🚀 Starting Referrals Endpoints Test...\n');

  const runner = new HttpTestRunner('Referrals');
  let testData: {
    patientId: string;
    referringCenterId: string;
    receivingCenterId: string;
    providerId: string;
    referralId?: string;
  } | null = null;

  try {
    // Initialize the test runner
    await runner.initialize();

    // Setup authentication with healthcare_provider role for most endpoints
    await runner.setupAuthentication('healthcare_provider');
    // Note: providerAuthToken is available but not used in this test flow
    const baseUrl = 'http://localhost:3000';
    const timestamp = Date.now();

    // Create test data first
    console.log('🔧 Creating test data for referrals...\n');

    // 1. Register the patient user
    console.log('Registering test patient user...');
    const patientData = {
      name: `Test Patient ${timestamp}`,
      email: `test-patient-${timestamp}@example.com`,
      password: 'TestPassword123!',
      roles: ['patient'],
      phone: '+1234567890'
    };

    let patientUserId: string;
    try {
      const patientResponse = await axios.post(`${baseUrl}/auth/register`, patientData, {
        headers: { 'Content-Type': 'application/json' }
      });
      patientUserId = patientResponse.data.user.id;
      console.log(`✅ Registered test patient user with ID: ${patientUserId}`);
    } catch (error) {
      console.error('❌ Failed to create test patient:', error.response?.data || error.message);
      throw error;
    }

    // 2. Authenticate as admin and create the patient entity
    await runner.setupAuthentication('admin');
    const adminToken = runner.getAuthToken();
    let patientId: string;
    try {
      const patientEntityData = {
        userId: patientUserId,
        medicalRecordNumber: `MRN${timestamp}`,
        emergencyContactName: 'Emergency Contact',
        emergencyContactPhone: '+1234567891',
        emergencyContactRelationship: 'spouse',
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

      const patientEntityResponse = await axios.post(`${baseUrl}/patients`, patientEntityData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        }
      });
      patientId = patientEntityResponse.data.id;
      console.log(`✅ Created Patient entity with ID: ${patientId}`);
    } catch (error) {
      console.error('❌ Failed to create Patient entity:', error.response?.data || error.message);
      throw error;
    }

    // Switch back to healthcare_provider for the rest of the test
    await runner.setupAuthentication('healthcare_provider');
    // Note: authToken is available but not used in this test flow

    // 3. Create test healthcare centers using admin role
    console.log('Creating test healthcare centers...');
    await runner.setupAuthentication('admin');
    const centersAdminToken = runner.getAuthToken();
    
    const referringCenterData = {
      name: 'Referring Medical Center',
      type: 'hospital',
      address: '123 Referring Street, Test City, TS 12345',
      phone: '+1234567892',
      email: 'referring@medicalcenter.com',
      hours: '9:00 AM - 5:00 PM'
    };

    const receivingCenterData = {
      name: 'Receiving Specialist Center',
      type: 'clinic',
      address: '456 Receiving Avenue, Test City, TS 12346',
      phone: '+1234567893',
      email: 'receiving@specialist.com',
      hours: '8:00 AM - 6:00 PM'
    };

    let referringCenterId: string;
    let receivingCenterId: string;

    try {
      const referringCenterResponse = await axios.post(`${baseUrl}/centers`, referringCenterData, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${centersAdminToken}`
        }
      });
      referringCenterId = referringCenterResponse.data.id;
      console.log(`✅ Created referring center with ID: ${referringCenterId}`);
    } catch (error) {
      console.error('❌ Failed to create referring center:', error.response?.data || error.message);
      throw error;
    }

    try {
      const receivingCenterResponse = await axios.post(`${baseUrl}/centers`, receivingCenterData, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${centersAdminToken}`
        }
      });
      receivingCenterId = receivingCenterResponse.data.id;
      console.log(`✅ Created receiving center with ID: ${receivingCenterId}`);
    } catch (error) {
      console.error('❌ Failed to create receiving center:', error.response?.data || error.message);
      throw error;
    }

    // 4. Create a test provider (doctor)
    console.log('Creating test provider...');
    const providerData = {
      name: 'Test Doctor',
      email: `test-doctor-${timestamp}@example.com`,
      password: 'TestPassword123!',
      roles: ['doctor'],
      phone: '+1234567894'
    };

    let providerId: string;
    try {
      const providerResponse = await axios.post(`${baseUrl}/auth/register`, providerData, {
        headers: { 'Content-Type': 'application/json' }
      });
      providerId = providerResponse.data.user.id;
      console.log(`✅ Created test provider with ID: ${providerId}`);
    } catch (error) {
      console.error('❌ Failed to create test provider:', error.response?.data || error.message);
      throw error;
    }

    // Store test data for use in tests
    testData = {
      patientId,
      referringCenterId,
      receivingCenterId,
      providerId
    };

    console.log('✅ Test data created successfully!\n');

    // Define test endpoints for referrals management
    const endpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/referrals',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get all referrals (healthcare_provider role)'
      },
      {
        method: 'GET',
        path: '/referrals',
        requiresAuth: true,
        query: { status: 'pending' },
        expectedStatus: 200,
        description: 'Get referrals filtered by status'
      },
      {
        method: 'GET',
        path: '/referrals',
        requiresAuth: true,
        query: { referralType: 'specialist' },
        expectedStatus: 200,
        description: 'Get referrals filtered by type'
      }
    ];

    // Run basic referrals tests
    console.log('📋 Running referrals endpoint tests...\n');
    for (const endpoint of endpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test referral creation with real data
    console.log('\n🔍 Testing referral creation endpoints...\n');
    
    const createReferralData = {
      patientId: testData.patientId,
      referringCenterId: testData.referringCenterId,
      receivingCenterId: testData.receivingCenterId,
      receivingProviderId: testData.providerId,
      referralType: 'specialist',
      priority: 'normal',
      reason: 'Specialist consultation for diabetes management',
      clinicalNotes: 'Patient has uncontrolled Type 2 diabetes with recent HbA1c of 9.2%',
      diagnosis: 'Type 2 Diabetes Mellitus (E11.9)',
      instructions: 'Please evaluate for insulin therapy and provide nutritional guidance',
      scheduledDate: '2023-10-15',
      expirationDate: '2023-12-31',
      metadata: { urgencyScore: 7, insuranceVerified: true },
      medications: [
        { name: 'Metformin', dosage: '1000mg', frequency: 'BID' },
        { name: 'Lisinopril', dosage: '10mg', frequency: 'daily' }
      ],
      allergies: [
        { allergen: 'Penicillin', reaction: 'Rash', severity: 'Moderate' }
      ],
      medicalHistory: 'History of hypertension and hyperlipidemia. Family history of cardiovascular disease.'
    };

    const createEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/referrals',
        requiresAuth: true,
        body: createReferralData,
        expectedStatus: 201,
        description: 'Create a new referral'
      }
    ];

    for (const endpoint of createEndpoints) {
      const result = await runner.testEndpoint(endpoint);
      // If creation was successful, store the referral ID for later tests
      if (result.status === 'PASS' && result.responseBody && typeof result.responseBody === 'object' && 'id' in result.responseBody) {
        testData.referralId = (result.responseBody as Record<string, unknown>).id as string;
        console.log(`✅ Created referral with ID: ${testData.referralId}`);
      }
    }

    // Test referral document endpoints (only if referral was created)
    if (testData.referralId) {
      console.log('\n🔍 Testing referral document endpoints...\n');
      
      const documentEndpoints: EndpointTestConfig[] = [
        {
          method: 'GET',
          path: `/referrals/${testData.referralId}/documents`,
          requiresAuth: true,
          expectedStatus: 200,
          description: 'Get documents for a referral'
        }
      ];

      for (const endpoint of documentEndpoints) {
        await runner.testEndpoint(endpoint);
      }

      // Test specific referral operations
      console.log('\n🔍 Testing specific referral operations...\n');
      
      const specificReferralEndpoints: EndpointTestConfig[] = [
        {
          method: 'GET',
          path: `/referrals/${testData.referralId}`,
          requiresAuth: true,
          expectedStatus: 200,
          description: 'Get specific referral by ID'
        },
        {
          method: 'PATCH',
          path: `/referrals/${testData.referralId}`,
          requiresAuth: true,
          body: { status: 'accepted', responseNotes: 'Referral accepted for specialist consultation' },
          expectedStatus: 200,
          description: 'Update referral status'
        }
      ];

      for (const endpoint of specificReferralEndpoints) {
        await runner.testEndpoint(endpoint);
      }
    }

    // Test referral analytics endpoints
    console.log('\n🔍 Testing referral analytics endpoints...\n');
    
    const analyticsEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: `/referrals/analytics/${testData.referringCenterId}`,
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get referral analytics for a center'
      },
      {
        method: 'GET',
        path: `/referrals/analytics/${testData.referringCenterId}`,
        requiresAuth: true,
        query: { startDate: '2023-01-01', endDate: '2023-12-31' },
        expectedStatus: 200,
        description: 'Get referral analytics with date range'
      }
    ];

    for (const endpoint of analyticsEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test error scenarios
    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/referrals/invalid-uuid',
        requiresAuth: true,
        expectedStatus: 400,
        description: 'Get referral with invalid ID format'
      },
      {
        method: 'GET',
        path: '/referrals/00000000-0000-0000-0000-000000000000',
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Get non-existent referral'
      },
      {
        method: 'PATCH',
        path: '/referrals/00000000-0000-0000-0000-000000000000',
        requiresAuth: true,
        body: { status: 'accepted' },
        expectedStatus: 404,
        description: 'Update non-existent referral'
      },
      {
        method: 'DELETE',
        path: '/referrals/00000000-0000-0000-0000-000000000000',
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Delete non-existent referral'
      },
      {
        method: 'POST',
        path: '/referrals',
        requiresAuth: true,
        body: { reason: 'Missing required fields' },
        expectedStatus: 400,
        description: 'Create referral with missing required fields'
      },
      {
        method: 'POST',
        path: '/referrals',
        requiresAuth: true,
        body: {
          patientId: 'invalid-uuid',
          referringCenterId: testData.referringCenterId,
          receivingCenterId: testData.receivingCenterId,
          referralType: 'specialist',
          reason: 'Test referral'
        },
        expectedStatus: 400,
        description: 'Create referral with invalid UUID'
      }
    ];

    console.log('\n🚨 Testing error scenarios...\n');
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
        path: '/referrals',
        requiresAuth: true,
        expectedStatus: 403,
        description: 'Get all referrals (patient role - should be forbidden)'
      },
      {
        method: 'POST',
        path: '/referrals',
        requiresAuth: true,
        body: createReferralData,
        expectedStatus: 403,
        description: 'Create referral (patient role - should be forbidden)'
      }
    ];

    for (const endpoint of unauthorizedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test admin role access
    console.log('\n🔍 Testing admin role access...\n');
    
    // Switch to admin role
    await runner.setupAuthentication('admin');
    
    const adminEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/referrals',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get all referrals (admin role)'
      },
      {
        method: 'POST',
        path: '/referrals',
        requiresAuth: true,
        body: createReferralData,
        expectedStatus: 201,
        description: 'Create referral (admin role)'
      }
    ];

    for (const endpoint of adminEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test doctor role access
    console.log('\n🔍 Testing doctor role access...\n');
    
    // Switch to doctor role
    await runner.setupAuthentication('doctor');
    
    const doctorEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/referrals',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get all referrals (doctor role)'
      },
      {
        method: 'POST',
        path: '/referrals',
        requiresAuth: true,
        body: createReferralData,
        expectedStatus: 201,
        description: 'Create referral (doctor role)'
      }
    ];

    for (const endpoint of doctorEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    console.log('\n✅ Referrals endpoints test completed successfully!');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testReferralsEndpoints()
    .then(() => {
      console.log('\n🎉 All referrals tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
} 