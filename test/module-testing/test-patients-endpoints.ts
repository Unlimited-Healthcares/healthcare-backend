import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test patients endpoints with proper authentication and role-based access
 */
async function testPatientsEndpoints(): Promise<void> {
  console.log('🚀 Starting Patients Endpoints Test...\n');

  const runner = new HttpTestRunner('Patients');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Test with admin role
    console.log('\n👑 Testing with admin role...\n');
    
    await runner.setupAuthentication('admin');
    
    const adminEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/patients',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get patients list (admin role)'
      },
      {
        method: 'POST',
        path: '/patients',
        requiresAuth: true,
        body: {
          userId: 'user-123',
          patientId: 'PAT-001',
          medicalRecordNumber: 'MRN-001',
          emergencyContactName: 'John Doe',
          emergencyContactPhone: '+1234567890',
          bloodType: 'A+',
          allergies: ['Penicillin'],
          medicalConditions: ['Hypertension']
        },
        expectedStatus: 201,
        description: 'Create patient (admin role)'
      }
    ];

    for (const endpoint of adminEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with patient user role
    console.log('\n👤 Testing with patient user role...\n');
    
    await runner.setupAuthentication('patient');
    
    const patientUserEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/patients/profile',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get patient profile (patient user role)'
      },
      {
        method: 'PUT',
        path: '/patients/profile',
        requiresAuth: true,
        body: {
          emergencyContactName: 'Updated Contact',
          emergencyContactPhone: '+1234567890',
          allergies: ['Penicillin', 'Sulfa']
        },
        expectedStatus: 200,
        description: 'Update patient profile (patient user role)'
      }
    ];

    for (const endpoint of patientUserEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with doctor role
    console.log('\n👨‍⚕️ Testing with doctor role...\n');
    
    await runner.setupAuthentication('doctor');
    
    const doctorEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/patients',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get patients list (doctor role)'
      },
      {
        method: 'GET',
        path: '/patients/search',
        requiresAuth: true,
        query: { q: 'John' },
        expectedStatus: 200,
        description: 'Search patients (doctor role)'
      }
    ];

    for (const endpoint of doctorEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with staff role
    console.log('\n👨‍⚕️ Testing with staff role...\n');
    
    await runner.setupAuthentication('staff');
    
    const staffEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/patients',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get patients list (staff role)'
      },
      {
        method: 'POST',
        path: '/patients',
        requiresAuth: true,
        body: {
          userId: 'user-456',
          patientId: 'PAT-002',
          medicalRecordNumber: 'MRN-002',
          emergencyContactName: 'Jane Smith',
          emergencyContactPhone: '+1234567891',
          bloodType: 'O+',
          allergies: [],
          medicalConditions: []
        },
        expectedStatus: 201,
        description: 'Create patient (staff role)'
      }
    ];

    for (const endpoint of staffEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with center role
    console.log('\n🏥 Testing with center role...\n');
    
    await runner.setupAuthentication('center');
    
    const centerEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/patients',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get patients list (center role)'
      },
      {
        method: 'GET',
        path: '/patients/visits',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get patient visits (center role)'
      }
    ];

    for (const endpoint of centerEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    console.log('\n✅ Patients endpoints test completed successfully!');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testPatientsEndpoints()
    .then(() => {
      console.log('\n🎉 All patients endpoint tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test execution failed:', error);
      process.exit(1);
    });
}

export { testPatientsEndpoints }; 