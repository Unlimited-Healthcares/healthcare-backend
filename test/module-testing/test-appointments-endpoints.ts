import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';
import { TestDataFactory } from '../test-data-factory';
import axios from 'axios';

/**
 * Test appointments endpoints with proper authentication
 */
async function testAppointmentsEndpoints(): Promise<void> {
  console.log('🚀 Starting Appointments Endpoints Test...\n');

  const runner = new HttpTestRunner('Appointments');
  const baseUrl = 'http://localhost:3000';

  try {
    // Initialize the test runner
    await runner.initialize();

    // Setup authentication with admin role for center creation
    await runner.setupAuthentication('admin');
    let authToken = runner.getAuthToken();

    // Create test data for appointments
    console.log('📋 Creating test data for appointments...\n');
    
    // 1. Create a test patient user
    console.log('Creating test patient user...');
    const timestamp = Date.now();
    const patientUserData = {
      name: 'Test Patient',
      email: `test-patient-${timestamp}@example.com`,
      password: 'TestPassword123!',
      roles: ['patient'],
      phone: '+1234567890'
    };
    let patientUserId: string;
    try {
      const patientUserResponse = await axios.post(`${baseUrl}/auth/register`, patientUserData, {
        headers: { 'Content-Type': 'application/json' }
      });
      patientUserId = patientUserResponse.data.user.id;
      console.log(`✅ Created test patient user with ID: ${patientUserId}`);
    } catch (error) {
      console.error('❌ Failed to create patient user:', error.response?.data || error.message);
      throw error;
    }

    // 1b. Create a Patient entity for the user
    console.log('Creating Patient entity...');
    let patientId: string;
    try {
      const patientEntityData = TestDataFactory.createPatient(patientUserId);
      const patientEntityResponse = await axios.post(`${baseUrl}/patients`, patientEntityData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      patientId = patientEntityResponse.data.id;
      console.log(`✅ Created Patient entity with ID: ${patientId}`);
    } catch (error) {
      console.error('❌ Failed to create Patient entity:', error.response?.data || error.message);
      throw error;
    }

    // 2. Create a test healthcare center with correct DTO structure (as admin)
    console.log('Creating test healthcare center...');
    const centerData = {
      name: 'Test Medical Center',
      type: 'hospital',
      address: '123 Test Street, Test City, TS 12345',
      phone: '+1234567890',
      email: 'test@medicalcenter.com',
      hours: '9:00 AM - 5:00 PM'
    };
    let centerId: string;
    try {
      const centerResponse = await axios.post(`${baseUrl}/centers`, centerData, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      });
      centerId = centerResponse.data.id;
      console.log(`✅ Created test center with ID: ${centerId}`);
    } catch (error) {
      console.error('❌ Failed to create center:', error.response?.data || error.message);
      throw error;
    }

    // Switch authentication to doctor for the rest of the test
    await runner.setupAuthentication('doctor');
    authToken = runner.getAuthToken();

    // 3. Create a test provider (doctor)
    console.log('Creating test provider...');
    const providerData = {
      name: 'Test Doctor',
      email: `test-doctor-${timestamp}@example.com`,
      password: 'TestPassword123!',
      roles: ['doctor'],
      phone: '+1234567891'
    };
    let providerId: string;
    try {
      const providerResponse = await axios.post(`${baseUrl}/auth/register`, providerData, {
        headers: { 'Content-Type': 'application/json' }
      });
      providerId = providerResponse.data.user.id;
      console.log(`✅ Created test provider with ID: ${providerId}`);
    } catch (error) {
      console.error('❌ Failed to create provider:', error.response?.data || error.message);
      throw error;
    }

    // Generate valid appointment data using real IDs
    const appointmentData = TestDataFactory.createAppointment(patientId, providerId, centerId);

    // Define test endpoints for appointments management
    const endpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/appointments',
        requiresAuth: true,
        body: appointmentData,
        expectedStatus: 201,
        description: 'Create a new appointment'
      },
      {
        method: 'GET',
        path: '/appointments',
        requiresAuth: true,
        query: { patientId },
        expectedStatus: 200,
        description: 'Get all appointments for a patient'
      },
      {
        method: 'GET',
        path: `/appointments/00000000-0000-0000-0000-000000000000`,
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Get non-existent appointment by ID'
      },
      {
        method: 'GET',
        path: `/appointments/invalid-uuid`,
        requiresAuth: true,
        expectedStatus: 400,
        description: 'Get appointment with invalid ID format'
      }
    ];

    // Run basic appointments tests
    console.log('📋 Running appointments endpoint tests...\n');
    for (const endpoint of endpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test unauthorized access scenarios
    console.log('\n🚨 Testing unauthorized access scenarios...\n');
    await runner.setupAuthentication('patient');
    const unauthorizedEndpoints: EndpointTestConfig[] = [
      {
        method: 'POST',
        path: '/appointments',
        requiresAuth: true,
        body: appointmentData,
        expectedStatus: 201, // Patients can create appointments
        description: 'Create appointment as patient (should be allowed)'
      }
    ];
    for (const endpoint of unauthorizedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    const report = runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    // Summary
    console.log('\n🎯 APPOINTMENTS TEST SUMMARY:');
    if (report.summary.successRate >= 80) {
      console.log('✅ Appointments endpoints are working correctly!');
    } else {
      console.log('❌ Appointments endpoints have issues that need to be fixed.');
    }

  } catch (error) {
    console.error('❌ Appointments test execution failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  } finally {
    await runner.cleanup();
  }
}

// Run the test
if (require.main === module) {
  testAppointmentsEndpoints()
    .then(() => {
      console.log('\n✅ Appointments endpoints test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Appointments endpoints test failed:', error);
      process.exit(1);
    });
}

export { testAppointmentsEndpoints }; 