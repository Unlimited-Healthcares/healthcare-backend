import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test Supabase-related endpoints (file uploads) with proper authentication
 * This tests endpoints that use Supabase storage functionality
 */
async function testSupabaseEndpoints(): Promise<void> {
  console.log('🚀 Starting Supabase Endpoints Test...\n');

  const runner = new HttpTestRunner('Supabase');

  try {
    // Initialize the test runner
    await runner.initialize();

    // Test with admin role
    console.log('\n👑 Testing with admin role...\n');
    
    await runner.setupAuthentication('admin');
    
    const adminEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/supabase/files',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get files (admin role)'
      },
      {
        method: 'POST',
        path: '/supabase/upload',
        requiresAuth: true,
        body: {
          fileName: 'test-document.pdf',
          fileType: 'application/pdf',
          fileSize: 1024000
        },
        expectedStatus: 201,
        description: 'Upload file (admin role)'
      }
    ];

    for (const endpoint of adminEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with center role
    console.log('\n🏥 Testing with center role...\n');
    
    await runner.setupAuthentication('center');
    
    const centerEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/supabase/files',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get files (center role)'
      },
      {
        method: 'POST',
        path: '/supabase/upload',
        requiresAuth: true,
        body: {
          fileName: 'medical-record.pdf',
          fileType: 'application/pdf',
          fileSize: 2048000
        },
        expectedStatus: 201,
        description: 'Upload file (center role)'
      }
    ];

    for (const endpoint of centerEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with provider role
    console.log('\n🏥 Testing with provider role...\n');
    
    await runner.setupAuthentication('provider');
    
    const providerEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/supabase/files',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get files (provider role)'
      },
      {
        method: 'POST',
        path: '/supabase/upload',
        requiresAuth: true,
        body: {
          fileName: 'insurance-document.pdf',
          fileType: 'application/pdf',
          fileSize: 1536000
        },
        expectedStatus: 201,
        description: 'Upload file (provider role)'
      }
    ];

    for (const endpoint of providerEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with staff role
    console.log('\n👨‍⚕️ Testing with staff role...\n');
    
    await runner.setupAuthentication('staff');
    
    const staffEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/supabase/files',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get files (staff role)'
      },
      {
        method: 'POST',
        path: '/supabase/upload',
        requiresAuth: true,
        body: {
          fileName: 'patient-consent.pdf',
          fileType: 'application/pdf',
          fileSize: 512000
        },
        expectedStatus: 201,
        description: 'Upload file (staff role)'
      }
    ];

    for (const endpoint of staffEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with patient role
    console.log('\n👤 Testing with patient role...\n');
    
    await runner.setupAuthentication('patient');
    
    const patientEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/supabase/files',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get files (patient role)'
      },
      {
        method: 'POST',
        path: '/supabase/upload',
        requiresAuth: true,
        body: {
          fileName: 'personal-document.pdf',
          fileType: 'application/pdf',
          fileSize: 256000
        },
        expectedStatus: 201,
        description: 'Upload file (patient role)'
      }
    ];

    for (const endpoint of patientEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    console.log('\n✅ Supabase endpoints test completed successfully!');
    console.log('📝 Note: This test covers file upload endpoints that use Supabase storage.');
    console.log('📝 Actual file uploads require valid entity IDs and are tested in integration tests.');

  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    throw error;
  } finally {
    await runner.cleanup();
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testSupabaseEndpoints()
    .then(() => {
      console.log('\n✅ All Supabase endpoint tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Supabase endpoint tests failed:', error.message);
      process.exit(1);
    });
}

export { testSupabaseEndpoints }; 