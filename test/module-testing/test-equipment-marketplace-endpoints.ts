import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

/**
 * Test equipment marketplace endpoints with proper authentication
 */
async function testEquipmentMarketplaceEndpoints(): Promise<void> {
  console.log('🚀 Starting Equipment Marketplace Endpoints Test...\n');

  const runner = new HttpTestRunner('Equipment Marketplace');

  let categoryId: string | undefined;
  let vendorId: string | undefined;
  let equipmentItemId: string | undefined;

  try {
    // Initialize the test runner
    await runner.initialize();

    // --- CATEGORY CREATION (admin role) ---
    await runner.setupAuthentication('admin');
    console.log('📋 Testing Equipment Categories endpoints...\n');
    const categoryData = {
      name: 'Test Diagnostic Equipment',
      description: 'Medical diagnostic and imaging equipment for testing',
      categoryCode: `TEST${Date.now().toString().slice(-6)}`, // Shorter code to fit 20 char limit
      isActive: true,
      sortOrder: 1
    };
    // Create category and capture ID
    const createCategoryEndpoint: EndpointTestConfig = {
      method: 'POST',
      path: '/equipment/categories',
      requiresAuth: true,
      body: categoryData,
      expectedStatus: 201,
      description: 'Create a new equipment category'
    };
    const createCategoryResult = await runner.testEndpoint(createCategoryEndpoint);
    if (createCategoryResult.responseBody && typeof createCategoryResult.responseBody === 'object') {
      if ('id' in createCategoryResult.responseBody) {
        categoryId = (createCategoryResult.responseBody as { id: string }).id;
      } else if ('category' in createCategoryResult.responseBody && typeof (createCategoryResult.responseBody as Record<string, unknown>).category === 'object') {
        categoryId = ((createCategoryResult.responseBody as Record<string, unknown>).category as { id: string }).id;
      }
    }

    // --- VENDOR CREATION (center role) ---
    await runner.setupAuthentication('center');
    console.log('\n📋 Testing Equipment Vendors endpoints...\n');
    const vendorData = {
      companyName: 'Test Medical Equipment Vendor',
      email: `test-vendor-${Date.now()}@example.com`, // Simplified email to avoid conflicts
      phone: '+1234567890',
      address: '123 Test Street, Test City, TS 12345',
      specialties: ['diagnostic', 'imaging'],
      websiteUrl: 'https://testvendor.com',
      description: 'Leading provider of medical diagnostic equipment'
    };
    // Create vendor and capture ID
    const createVendorEndpoint: EndpointTestConfig = {
      method: 'POST',
      path: '/equipment/vendors',
      requiresAuth: true,
      body: vendorData,
      expectedStatus: 201,
      description: 'Register as equipment vendor'
    };
    const createVendorResult = await runner.testEndpoint(createVendorEndpoint);
    if (createVendorResult.responseBody && typeof createVendorResult.responseBody === 'object') {
      if ('id' in createVendorResult.responseBody) {
        vendorId = (createVendorResult.responseBody as { id: string }).id;
      } else if ('vendor' in createVendorResult.responseBody && typeof (createVendorResult.responseBody as Record<string, unknown>).vendor === 'object') {
        vendorId = ((createVendorResult.responseBody as Record<string, unknown>).vendor as { id: string }).id;
      }
    }

    // --- EQUIPMENT ITEM CREATION (center role) ---
    console.log('\n📋 Testing Equipment Items endpoints...\n');
    const equipmentItemData = {
      name: 'Test Ultrasound Machine',
      description: 'High-resolution ultrasound machine for diagnostic imaging',
      categoryId: categoryId || '00000000-0000-0000-0000-000000000001',
      vendorId: vendorId || '00000000-0000-0000-0000-000000000002',
      modelNumber: 'TEST-US-001',
      manufacturer: 'Test Medical Devices',
      condition: 'new',
      purchasePrice: 150000.00,
      currentValue: 135000.00,
      isRentable: true,
      isForSale: false,
      rentalPriceDaily: 500.00,
      rentalPriceWeekly: 3000.00,
      rentalPriceMonthly: 10000.00,
      minimumRentalDays: 1,
      maximumRentalDays: 365,
      tags: ['ultrasound', 'diagnostic', 'portable'],
      weightKg: 45.5,
      dimensions: {
        length: 120,
        width: 60,
        height: 100,
        unit: 'cm'
      },
      powerRequirements: '110-240V AC, 50/60Hz',
      maintenanceSchedule: 'Every 6 months',
      safetyNotes: 'Handle with care, requires specialized training',
      operatingInstructions: 'Refer to user manual for detailed operating procedures'
    };
    // Create equipment item and capture ID
    const createItemEndpoint: EndpointTestConfig = {
      method: 'POST',
      path: '/equipment/items',
      requiresAuth: true,
      body: equipmentItemData,
      expectedStatus: 201,
      description: 'Create a new equipment item'
    };
    const createItemResult = await runner.testEndpoint(createItemEndpoint);
    if (createItemResult.responseBody && typeof createItemResult.responseBody === 'object') {
      if ('id' in createItemResult.responseBody) {
        equipmentItemId = (createItemResult.responseBody as { id: string }).id;
      } else if ('item' in createItemResult.responseBody && typeof (createItemResult.responseBody as Record<string, unknown>).item === 'object') {
        equipmentItemId = ((createItemResult.responseBody as Record<string, unknown>).item as { id: string }).id;
      }
    }

    // --- Use captured IDs in subsequent tests ---
    // (Update all test configs below to use categoryId, vendorId, equipmentItemId as needed)
    // Test Equipment Categories endpoints
    console.log('📋 Testing Equipment Categories endpoints...\n');
    
    const categoryEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/equipment/categories',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get all equipment categories'
      },
      {
        method: 'GET',
        path: '/equipment/categories/hierarchy',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get equipment categories hierarchy'
      },
      {
        method: 'POST',
        path: '/equipment/categories',
        requiresAuth: true,
        body: {
          name: 'Test Imaging Equipment',
          description: 'Medical imaging equipment for testing',
          categoryCode: `IMG${Date.now().toString().slice(-6)}`, // Shorter code
          isActive: true,
          sortOrder: 2
        },
        expectedStatus: 201,
        description: 'Create another equipment category'
      }
    ];

    for (const endpoint of categoryEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test Equipment Vendors endpoints
    console.log('\n📋 Testing Equipment Vendors endpoints...\n');
    
    const vendorEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/equipment/vendors',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get all equipment vendors'
      },
      {
        method: 'POST',
        path: '/equipment/vendors',
        requiresAuth: true,
        body: {
          companyName: 'Test Imaging Equipment Vendor',
          email: `test-imaging-${Date.now()}@example.com`, // Different email
          phone: '+1234567891',
          address: '456 Test Street, Test City, TS 12345',
          specialties: ['imaging', 'radiology'],
          websiteUrl: 'https://testimaging.com',
          description: 'Leading provider of medical imaging equipment'
        },
        expectedStatus: 201,
        description: 'Register another equipment vendor'
      }
    ];

    for (const endpoint of vendorEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test Equipment Items endpoints
    console.log('\n📋 Testing Equipment Items endpoints...\n');
    
    const equipmentItemEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/equipment/items',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get all equipment items'
      },
      {
        method: 'GET',
        path: '/equipment/items',
        requiresAuth: true,
        query: {
          page: 1,
          limit: 10,
          condition: 'new',
          isRentable: true
        },
        expectedStatus: 200,
        description: 'Get equipment items with filters'
      },
      {
        method: 'GET',
        path: '/equipment/items/featured',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get featured equipment items'
      },
      {
        method: 'POST',
        path: '/equipment/items',
        requiresAuth: true,
        body: {
          name: 'Test MRI Machine',
          description: 'High-resolution MRI machine for diagnostic imaging',
          categoryId: categoryId || '00000000-0000-0000-0000-000000000001',
          vendorId: vendorId || '00000000-0000-0000-0000-000000000002',
          modelNumber: 'TEST-MRI-001',
          manufacturer: 'Test Medical Devices',
          condition: 'new',
          purchasePrice: 250000.00,
          currentValue: 225000.00,
          isRentable: true,
          isForSale: false,
          rentalPriceDaily: 800.00,
          rentalPriceWeekly: 5000.00,
          rentalPriceMonthly: 18000.00,
          minimumRentalDays: 1,
          maximumRentalDays: 365,
          tags: ['mri', 'diagnostic', 'imaging'],
          weightKg: 1200.0,
          dimensions: {
            length: 200,
            width: 150,
            height: 180,
            unit: 'cm'
          },
          powerRequirements: '220-240V AC, 60Hz',
          maintenanceSchedule: 'Every 3 months',
          safetyNotes: 'Requires specialized facility and trained personnel',
          operatingInstructions: 'Refer to user manual for detailed operating procedures'
        },
        expectedStatus: 201,
        description: 'Create another equipment item'
      }
    ];

    for (const endpoint of equipmentItemEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test Equipment Rental endpoints
    console.log('\n📋 Testing Equipment Rental endpoints...\n');
    
    const rentalRequestData = {
      equipmentId: equipmentItemId || '00000000-0000-0000-0000-000000000003', // Placeholder UUID
      startDate: '2024-02-01',
      endDate: '2024-02-07',
      purpose: 'Diagnostic imaging for patient care',
      specialRequirements: 'Requires certified technician',
      deliveryAddress: '123 Medical Center Dr, Test City, TS 12345',
      pickupAddress: '456 Equipment Warehouse, Test City, TS 12345'
    };

    const rentalEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/equipment/rental/requests',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get rental requests'
      },
      {
        method: 'POST',
        path: '/equipment/rental/requests',
        requiresAuth: true,
        body: rentalRequestData,
        expectedStatus: 201,
        description: 'Create rental request'
      }
    ];

    for (const endpoint of rentalEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test Equipment Sales endpoints
    console.log('\n📋 Testing Equipment Sales endpoints...\n');
    
    const salesListingData = {
      equipmentId: equipmentItemId || '00000000-0000-0000-0000-000000000004', // Placeholder UUID
      salePrice: 120000.00,
      negotiable: true,
      warrantyIncluded: true,
      warrantyDuration: '12 months',
      deliveryOptions: ['pickup', 'delivery'],
      paymentTerms: '50% upfront, 50% on delivery',
      description: 'Excellent condition ultrasound machine, barely used'
    };

    const salesEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/equipment/sales/listings',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get sales listings'
      },
      {
        method: 'POST',
        path: '/equipment/sales/listings',
        requiresAuth: true,
        body: salesListingData,
        expectedStatus: 201,
        description: 'Create sales listing'
      }
    ];

    for (const endpoint of salesEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test Equipment Maintenance endpoints
    console.log('\n📋 Testing Equipment Maintenance endpoints...\n');
    
    const maintenanceEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/equipment/maintenance/schedules',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get maintenance schedules'
      },
      {
        method: 'GET',
        path: '/equipment/maintenance/records',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get maintenance records'
      }
    ];

    for (const endpoint of maintenanceEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test File Upload endpoints
    console.log('\n📋 Testing Equipment File Upload endpoints...\n');
    
    const fileUploadEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/equipment/files/upload/presigned-url',
        requiresAuth: true,
        query: {
          fileName: 'test-equipment-image.jpg',
          fileType: 'image/jpeg',
          equipmentId: equipmentItemId || '00000000-0000-0000-0000-000000000005'
        },
        expectedStatus: 200,
        description: 'Get presigned URL for file upload'
      }
    ];

    for (const endpoint of fileUploadEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test error scenarios
    console.log('\n🚨 Testing error scenarios...\n');
    
    const errorScenarios: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/equipment/items/invalid-uuid',
        requiresAuth: true,
        expectedStatus: 400,
        description: 'Get equipment item with invalid ID format'
      },
      {
        method: 'GET',
        path: '/equipment/items/00000000-0000-0000-0000-000000000000',
        requiresAuth: true,
        expectedStatus: 404,
        description: 'Get non-existent equipment item'
      },
      {
        method: 'GET',
        path: '/equipment/categories/invalid-uuid',
        requiresAuth: true,
        expectedStatus: 400,
        description: 'Get category with invalid ID format'
      },
      {
        method: 'POST',
        path: '/equipment/items',
        requiresAuth: true,
        body: {
          name: 'Test Equipment',
          // Missing required fields: categoryId, vendorId, condition
        },
        expectedStatus: 400,
        description: 'Create equipment item with missing required fields'
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
        path: '/equipment/categories',
        requiresAuth: true,
        body: categoryData,
        expectedStatus: 403,
        description: 'Create category (patient role - should be forbidden)'
      },
      {
        method: 'POST',
        path: '/equipment/items',
        requiresAuth: true,
        body: equipmentItemData,
        expectedStatus: 403,
        description: 'Create equipment item (patient role - should be forbidden)'
      },
      {
        method: 'PATCH',
        path: '/equipment/vendors/00000000-0000-0000-0000-000000000001/verification',
        requiresAuth: true,
        body: { status: 'verified' },
        expectedStatus: 403,
        description: 'Update vendor verification (patient role - should be forbidden)'
      }
    ];

    for (const endpoint of unauthorizedEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test admin-specific endpoints
    console.log('\n🔐 Testing admin-specific endpoints...\n');
    
    // Switch to admin role
    await runner.setupAuthentication('admin');
    
    const adminEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/equipment/vendors',
        requiresAuth: true,
        query: {
          verificationStatus: 'pending'
        },
        expectedStatus: 200,
        description: 'Get vendors with pending verification (admin)'
      }
    ];

    for (const endpoint of adminEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test equipment creation with different roles
    console.log('\n🔧 Testing equipment creation with different roles...\n');
    
    const equipmentData: Record<string, unknown> = {
      name: 'Advanced MRI Machine',
      category: 'imaging',
      manufacturer: 'Siemens',
      model: 'MAGNETOM Vida',
      serialNumber: 'MRI-2024-001',
      purchaseDate: '2024-01-15',
      warrantyExpiry: '2027-01-15',
      location: 'Radiology Department',
      status: 'available',
      specifications: {
        fieldStrength: '3T',
        boreSize: '70cm',
        weight: '4500kg'
      },
      maintenanceSchedule: {
        frequency: 'monthly',
        lastMaintenance: '2024-11-01',
        nextMaintenance: '2024-12-01'
      },
      pricing: {
        purchasePrice: 2500000,
        rentalPricePerDay: 5000,
        insuranceCost: 50000
      }
    };

    const maintenanceData: Record<string, unknown> = {
      equipmentId: 'equipment-123',
      maintenanceType: 'preventive',
      scheduledDate: '2024-12-15',
      estimatedCost: 5000,
      priority: 'medium',
      notes: 'Regular preventive maintenance'
    };

    // Test with center role (should have access to equipment management)
    console.log('\n🏥 Testing with center role...\n');
    
    await runner.setupAuthentication('center');
    
    const centerEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/equipment-marketplace/equipment',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get equipment list (center role)'
      },
      {
        method: 'POST',
        path: '/equipment-marketplace/equipment',
        requiresAuth: true,
        body: equipmentData,
        expectedStatus: 201,
        description: 'Create equipment (center role)'
      },
      {
        method: 'GET',
        path: '/equipment-marketplace/maintenance/schedules',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get maintenance schedules (center role)'
      },
      {
        method: 'POST',
        path: '/equipment-marketplace/maintenance/schedules',
        requiresAuth: true,
        body: maintenanceData,
        expectedStatus: 201,
        description: 'Create maintenance schedule (center role)'
      }
    ];

    for (const endpoint of centerEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with staff role
    console.log('\n👨‍⚕️ Testing with staff role...\n');
    
    await runner.setupAuthentication('staff');
    
    const staffEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/equipment-marketplace/equipment',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get equipment list (staff role)'
      },
      {
        method: 'POST',
        path: '/equipment-marketplace/equipment',
        requiresAuth: true,
        body: equipmentData,
        expectedStatus: 201,
        description: 'Create equipment (staff role)'
      },
      {
        method: 'GET',
        path: '/equipment-marketplace/maintenance/schedules',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get maintenance schedules (staff role)'
      },
      {
        method: 'POST',
        path: '/equipment-marketplace/maintenance/schedules',
        requiresAuth: true,
        body: maintenanceData,
        expectedStatus: 201,
        description: 'Create maintenance schedule (staff role)'
      }
    ];

    for (const endpoint of staffEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Test with provider role
    console.log('\n🏥 Testing with provider role...\n');
    
    await runner.setupAuthentication('provider');
    
    const providerEndpoints: EndpointTestConfig[] = [
      {
        method: 'GET',
        path: '/equipment-marketplace/equipment',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get equipment list (provider role)'
      },
      {
        method: 'POST',
        path: '/equipment-marketplace/equipment',
        requiresAuth: true,
        body: equipmentData,
        expectedStatus: 201,
        description: 'Create equipment (provider role)'
      },
      {
        method: 'GET',
        path: '/equipment-marketplace/maintenance/schedules',
        requiresAuth: true,
        expectedStatus: 200,
        description: 'Get maintenance schedules (provider role)'
      },
      {
        method: 'POST',
        path: '/equipment-marketplace/maintenance/schedules',
        requiresAuth: true,
        body: maintenanceData,
        expectedStatus: 201,
        description: 'Create maintenance schedule (provider role)'
      }
    ];

    for (const endpoint of providerEndpoints) {
      await runner.testEndpoint(endpoint);
    }

    // Generate and display report
    console.log('\n📊 Generating test report...\n');
    const report = runner.generateReport();
    runner.printReport();
    await runner.saveReport();

    // Summary
    console.log('\n🎯 EQUIPMENT MARKETPLACE TEST SUMMARY:');
    if (report.summary.successRate >= 80) {
      console.log('✅ Equipment marketplace endpoints are working correctly!');
    } else {
      console.log('❌ Equipment marketplace endpoints have issues that need to be fixed.');
    }

  } catch (error) {
    console.error('❌ Equipment marketplace test execution failed:', error.message);
  } finally {
    await runner.cleanup();
  }
}

// Run the test
if (require.main === module) {
  testEquipmentMarketplaceEndpoints()
    .then(() => {
      console.log('\n✅ Equipment marketplace endpoints test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Equipment marketplace endpoints test failed:', error);
      process.exit(1);
    });
}

export { testEquipmentMarketplaceEndpoints }; 