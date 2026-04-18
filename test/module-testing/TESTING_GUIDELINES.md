# 🧪 API Endpoint Testing Guidelines for New Modules

This guide will help you write robust endpoint tests for any module (e.g., centers, users, appointments) in this NestJS healthcare backend. Follow these steps and best practices to ensure your tests work and avoid common pitfalls.

---

## ✅ Step-by-Step Instructions

1. **Check Existing Patterns**
   - Review a working test file (e.g., `test/module-testing/test-centers-endpoints.ts` or `test-users-endpoints.ts`).
   - Note the structure: initialization, authentication, endpoint definitions, error/permission checks, and report generation.

2. **Identify Endpoints to Test**
   - Open the module's controller (e.g., `src/centers/centers.controller.ts`).
   - List all public endpoints (GET, POST, PATCH, DELETE, etc.) and note required roles/permissions.
   - Check DTOs (e.g., `create-center.dto.ts`) for required request body fields.

3. **Create the Test File**
   - Place your test in `test/module-testing/` as `test-<module>-endpoints.ts`.
   - Import `HttpTestRunner` and `EndpointTestConfig` from `./http-test-runner`.
   - Follow the async function pattern: initialize runner, authenticate, define endpoints, run tests, print/save report, cleanup.

4. **Define Endpoint Test Cases**
   - For each endpoint, create an `EndpointTestConfig` object:
     - `method`, `path`, `requiresAuth`, `expectedStatus`, `description`, and (if needed) `body` or `query`.
   - Cover:
     - Normal/expected usage
     - Error scenarios (invalid IDs, missing fields, etc.)
     - Permission/role checks (admin, patient, etc.)

5. **Run and Debug the Test**
   - Use `npm run test:<module>` to run your test.
   - If you get errors like `Cannot find module`, check the file path and name.
   - If status codes don't match, check the controller for correct permissions and error handling.

6. **Adjust and Re-run**
   - Update expected status codes to match actual API behavior (e.g., 400 for invalid UUID, 403 for forbidden, 404 for not found).
   - Skip or adjust tests that require dynamic data (e.g., IDs from previous requests).

7. **Document and Save**
   - Add comments to your test file for clarity.
   - Save this guideline for future reference.

---

## ❌ Common Mistakes to Avoid

- **Wrong file path or name**: Always use `test/module-testing/test-<module>-endpoints.ts`.
- **Import errors**: Double-check import paths and exported names.
- **Incorrect status code expectations**: Match your test to the controller's actual behavior.
- **Missing required fields in DTOs**: Always check the DTO for required request body fields.
- **Testing endpoints that require dynamic IDs without setup**: Either create the resource first or skip these tests.
- **Forgetting to clean up**: Always call `await runner.cleanup()` in a `finally` block.

### 🚨 CRITICAL: DTO Compliance Issues
- **Sending fields not in DTO**: Never send fields that don't exist in the DTO (e.g., `patientId` in `CreatePatientDto`).
- **Missing required fields**: Always check DTOs for `@IsNotEmpty()` and `@IsUUID()` decorators.
- **Wrong field types**: Ensure field types match DTO validation (string, boolean, UUID, etc.).

### 🔐 Authentication & Role Issues
- **Wrong role for endpoint**: Check controller `@Roles()` decorators before testing (e.g., centers need `admin` or `center` role).
- **Role switching in tests**: Use `await runner.setupAuthentication('role')` when switching roles mid-test.
- **Variable conflicts**: Use unique variable names when switching authentication (e.g., `centersAdminToken` vs `adminToken`).

### 🏗️ Test Data Setup Issues
- **Circular dependencies**: Create test data in correct order (users → entities → relationships).
- **Missing test data**: Ensure all required IDs exist before testing endpoints that need them.
- **Invalid UUIDs**: Use proper UUID format for test IDs, not placeholder strings.

---

## ✅ MANDATORY PRACTICES

### 1. DTO Compliance Requirements
```typescript
// ✅ ALWAYS check the actual DTO before creating test data
// Example: Check src/patients/dto/create-patient.dto.ts
export class CreatePatientDto {
  @IsUUID()
  userId: string;  // ✅ Required field
  
  @IsOptional()
  @IsString()
  medicalRecordNumber?: string;  // ✅ Optional field
  
  // ❌ DON'T send fields that don't exist in DTO
  // patientId: string;  // This field doesn't exist!
}

// ✅ Correct test data creation
const patientData = {
  userId: patientUserId,  // ✅ Required
  medicalRecordNumber: `MRN${timestamp}`,  // ✅ Optional
  // ❌ patientId: `PT${timestamp}`,  // DON'T include this!
};
```

### 2. Authentication & Role Management
```typescript
// ✅ Check controller roles before testing
@Post()
@Roles('admin', 'center')  // ✅ Only these roles can create centers
async create(@Body() createCenterDto: CreateCenterDto) {
  // Implementation
}

// ✅ Switch roles properly in tests
await runner.setupAuthentication('admin');
const adminToken = runner.getAuthToken();

// ✅ Use unique variable names when switching auth
await runner.setupAuthentication('admin');
const centersAdminToken = runner.getAuthToken();  // Different name!
```

### 3. Test Data Creation Order
```typescript
// ✅ Correct order for complex test data
// 1. Create users first
const patientUser = await createUser('patient');
const adminUser = await createUser('admin');

// 2. Create entities that depend on users
const patient = await createPatient({ userId: patientUser.id });

// 3. Create relationships
const referral = await createReferral({ 
  patientId: patient.id,
  referringCenterId: center.id 
});
```

### 4. Error Handling Best Practices
```typescript
// ✅ Always handle errors gracefully
try {
  const response = await axios.post('/endpoint', data);
  console.log(`✅ Created with ID: ${response.data.id}`);
} catch (error) {
  console.error('❌ Failed:', error.response?.data || error.message);
  throw error;  // Re-throw to fail the test
}
```

---

## 📂 Key Files to Reference

- **Working test example**: `test/module-testing/test-centers-endpoints.ts`
- **Test runner utility**: `test/module-testing/http-test-runner.ts`
- **Module controller**: `src/<module>/<module>.controller.ts`
- **DTOs for request bodies**: `src/<module>/dto/`
- **Comprehensive test**: `test/comprehensive-api.e2e-spec.ts` (for advanced patterns)

---

## 📝 Template for New Module Test

```typescript
import { HttpTestRunner, EndpointTestConfig } from './http-test-runner';

async function test<ModuleName>Endpoints(): Promise<void> {
  const runner = new HttpTestRunner('<ModuleName>');
  try {
    await runner.initialize();
    await runner.setupAuthentication('admin'); // or other role as needed
    const endpoints: EndpointTestConfig[] = [
      // Define your endpoints here
    ];
    for (const endpoint of endpoints) {
      await runner.testEndpoint(endpoint);
    }
    // ... more tests, error scenarios, permissions, etc.
    const report = runner.generateReport();
    runner.printReport();
    await runner.saveReport();
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
  } finally {
    await runner.cleanup();
  }
}

if (require.main === module) {
  test<ModuleName>Endpoints()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
```

---

## 🚨 Troubleshooting Common Issues

### 1. "property X should not exist" Error (400 Bad Request)
```bash
# ❌ Error: property patientId should not exist
# ✅ Solution: Remove field from request body
const patientData = {
  userId: patientUserId,
  // ❌ patientId: `PT${timestamp}`,  // Remove this!
  medicalRecordNumber: `MRN${timestamp}`,
  // ... other valid fields
};
```

### 2. "Forbidden resource" Error (403 Forbidden)
```bash
# ❌ Error: Forbidden resource
# ✅ Solution: Check controller roles and use correct role
@Post()
@Roles('admin', 'center')  // Check this line in controller
async create(@Body() dto: CreateDto) { }

# In test:
await runner.setupAuthentication('admin');  // Use correct role
```

### 3. "Cannot redeclare block-scoped variable" Error
```typescript
// ❌ Problem: Multiple adminToken variables
const adminToken = runner.getAuthToken();
// ... later ...
const adminToken = runner.getAuthToken();  // Error!

// ✅ Solution: Use unique names
const adminToken = runner.getAuthToken();
// ... later ...
const centersAdminToken = runner.getAuthToken();  // Different name!
```

### 4. "Cannot read properties of undefined" Error (500 Internal Server Error)
```bash
# ❌ Error: Usually means missing required data or broken endpoint
# ✅ Solution: Check if endpoint is fully implemented
# If it's an analytics or complex endpoint, it might not be ready yet
# Skip these tests or mark them as expected failures
```

---

## 📋 Pre-Commit Checklist

Before making any changes, verify:
- [ ] All imports resolve correctly
- [ ] No `any` types used
- [ ] Proper interfaces defined
- [ ] Services exported from modules
- [ ] Authentication guards applied
- [ ] Swagger documentation added
- [ ] Audit logging implemented
- [ ] Input validation applied
- [ ] Error handling implemented
- [ ] Tests written/updated
- [ ] **DTO fields match exactly** (no extra fields!)
- [ ] **Correct roles used for each endpoint**
- [ ] **Unique variable names when switching auth**
- [ ] **Test data created in correct order**

---

**Save this file and refer to it whenever you write new module endpoint tests!** 