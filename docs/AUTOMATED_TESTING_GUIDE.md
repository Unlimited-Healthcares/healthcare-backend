# 🚀 Automated API Testing Guide

## Overview

This guide explains how to use the comprehensive automated testing system for the Healthcare Management API. The system includes multiple types of tests to ensure your API is reliable, performant, and secure.

## 📋 Types of Tests

### 1. **Unit Tests**
- Test individual functions and methods
- Fast execution (< 1 second per test)
- Mock external dependencies
- **Command**: `npm run test`

### 2. **Integration Tests**
- Test interactions between modules
- Use real database connections
- Test service integrations
- **Command**: `npm run test:integration`

### 3. **End-to-End (E2E) Tests**
- Test complete user workflows
- Test API endpoints with real HTTP requests
- Validate entire request/response cycles
- **Command**: `npm run test:e2e`

### 4. **Performance Tests**
- Load testing with Artillery
- Stress testing under high concurrency
- Response time monitoring
- **Command**: `npm run test:performance`

### 5. **Contract Tests**
- API contract validation with Pact
- Ensure API compatibility
- Consumer-driven contract testing
- **Command**: `npm run test:contract`

## 🛠️ Quick Start

### Run All Tests
```bash
# Run comprehensive test suite
npx ts-node test/automated-test-runner.ts

# Or run individual test types
npm run test              # Unit tests
npm run test:integration  # Integration tests
npm run test:e2e         # E2E tests
npm run test:performance # Performance tests
npm run test:contract    # Contract tests
```

### Run Tests with Coverage
```bash
npm run test:cov
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## 📊 Test Data Management

### Using Test Data Factory
```typescript
import { TestDataFactory } from './test/test-data-factory';

// Generate test user
const userData = TestDataFactory.createUser('doctor');

// Generate test patient
const patientData = TestDataFactory.createPatient();

// Generate multiple entities
const patients = TestDataFactory.createMultiple(
  () => TestDataFactory.createPatient(), 
  10
);
```

### Using Test Helpers
```typescript
import { TestHelpers } from './test/test-helpers';

// Initialize test app
await TestHelpers.initializeApp();

// Create authenticated user
const { user, token, userId } = await TestHelpers.createAuthenticatedUser('doctor');

// Make authenticated requests
const response = await TestHelpers.makeAuthenticatedRequest(token)
  .get('/patients')
  .expect(200);

// Clean database
await TestHelpers.cleanDatabase();
```

## 🔧 Configuration

### Environment Setup
Create `.env.test` file:
```env
NODE_ENV=test
DATABASE_URL=postgresql://user:pass@localhost:5432/healthcare_test
REDIS_URL=redis://localhost:6379
JWT_SECRET=test-secret-key
```

### Jest Configuration
Tests use different Jest configurations:
- `jest.config.js` - Unit tests
- `test/jest-e2e.json` - E2E tests
- `test/jest-integration.json` - Integration tests

### Performance Test Configuration
Edit `test/performance/comprehensive-load-test.yml`:
```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Load test"
```

## 📈 Performance Testing

### Load Testing Scenarios
1. **Authentication Flow** (20% of traffic)
2. **Patient Management** (25% of traffic)
3. **Appointment Management** (20% of traffic)
4. **Medical Records** (15% of traffic)
5. **Chat System** (10% of traffic)
6. **Search Operations** (10% of traffic)

### Performance Thresholds
- **P95 Response Time**: < 1000ms
- **P99 Response Time**: < 2000ms
- **Success Rate**: > 95%
- **Error Rate**: < 5%

### Running Performance Tests
```bash
# Run comprehensive load test
npm run test:performance

# Run specific scenario
artillery run test/performance/auth-load-test.yml

# Generate HTML report
artillery run test/performance/comprehensive-load-test.yml --output report.json
artillery report report.json
```

## 🤝 Contract Testing

### Provider Testing (API)
```typescript
// test/contract/api-contract.spec.ts
describe('Healthcare API Contract Tests', () => {
  it('should authenticate user and return token', async () => {
    await provider.addInteraction({
      state: 'user exists with valid credentials',
      uponReceiving: 'a login request',
      withRequest: {
        method: 'POST',
        path: '/auth/login',
        body: { email: 'test@example.com', password: 'password' }
      },
      willRespondWith: {
        status: 200,
        body: { user: like({}), accessToken: like('token') }
      }
    });
  });
});
```

### Consumer Testing (Frontend)
```typescript
// Verify API contracts from consumer perspective
const pact = new Pact({
  consumer: 'HealthcareWebApp',
  provider: 'HealthcareAPI'
});
```

## 🚀 CI/CD Integration

### GitHub Actions
The system includes automated CI/CD with GitHub Actions:

```yaml
# .github/workflows/automated-testing.yml
- name: Run comprehensive test suite
  run: npx ts-node test/automated-test-runner.ts
  env:
    NODE_ENV: test
```

### Test Stages
1. **Linting** - Code quality checks
2. **Unit Tests** - Fast feedback
3. **Integration Tests** - Module interactions
4. **E2E Tests** - Full workflow validation
5. **Performance Tests** - Load and stress testing
6. **Security Scan** - Vulnerability assessment
7. **Contract Tests** - API compatibility

## 📊 Test Reports

### Coverage Reports
- **HTML Report**: `coverage/lcov-report/index.html`
- **JSON Report**: `coverage/coverage-final.json`
- **LCOV Report**: `coverage/lcov.info`

### Performance Reports
- **Artillery Report**: `test/performance/results.html`
- **JSON Results**: `test/performance/results.json`

### Test Results
- **JUnit XML**: `test-results.xml`
- **JSON Report**: `reports/test-report-{timestamp}.json`

## 🔍 Debugging Tests

### Debug Individual Tests
```bash
# Debug specific test file
npm run test:debug test/auth.e2e-spec.ts

# Debug with breakpoints
node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand test/auth.e2e-spec.ts
```

### Verbose Output
```bash
# Run tests with detailed output
npm run test -- --verbose

# Run with coverage and verbose
npm run test:cov -- --verbose
```

### Database Debugging
```typescript
// Enable query logging in test environment
await TestHelpers.getDataSource().query('SET log_statement = "all"');
```

## 🛡️ Security Testing

### Automated Security Scans
```bash
# Run security audit
npm audit --audit-level high

# Run Snyk security scan
npx snyk test

# Check for known vulnerabilities
npm run security:scan
```

### Security Test Cases
- Authentication bypass attempts
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting validation
- Input sanitization

## 📝 Writing New Tests

### E2E Test Template
```typescript
describe('New Feature E2E', () => {
  let testUsers: any;

  beforeAll(async () => {
    await TestHelpers.initializeApp();
    testUsers = await TestHelpers.seedTestData();
  });

  afterAll(async () => {
    await TestHelpers.closeApp();
  });

  beforeEach(async () => {
    await TestHelpers.cleanDatabase();
  });

  it('should perform new feature workflow', async () => {
    const response = await TestHelpers.makeAuthenticatedRequest(testUsers.doctor.token)
      .post('/new-endpoint')
      .send(TestDataFactory.createNewEntity())
      .expect(201);

    TestHelpers.assertResponseStructure(response.body, {
      id: 'string',
      status: 'string'
    });
  });
});
```

### Performance Test Template
```yaml
scenarios:
  - name: "New Feature Load Test"
    weight: 10
    flow:
      - post:
          url: "/new-endpoint"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            data: "{{ $randomData() }}"
          expect:
            - statusCode: 201
```

## 🎯 Best Practices

### Test Organization
1. **Group related tests** in describe blocks
2. **Use descriptive test names** that explain the scenario
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Clean up after tests** to avoid side effects

### Data Management
1. **Use test data factories** for consistent data generation
2. **Clean database** between tests
3. **Use transactions** for test isolation
4. **Mock external services** in unit tests

### Performance Considerations
1. **Run tests in parallel** when possible
2. **Use database transactions** for faster cleanup
3. **Mock heavy operations** in unit tests
4. **Optimize test data creation**

### Maintenance
1. **Keep tests simple** and focused
2. **Update tests** when API changes
3. **Monitor test execution time**
4. **Review and refactor** regularly

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check database is running
pg_isready -h localhost -p 5432

# Reset test database
npm run db:reset:test
```

#### Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Kill process using port
kill -9 $(lsof -t -i:3000)
```

#### Memory Issues
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Run tests with memory monitoring
npm run test -- --detectOpenHandles --forceExit
```

#### Timeout Issues
```typescript
// Increase timeout for slow tests
jest.setTimeout(30000); // 30 seconds

// Or in individual test
it('slow test', async () => {
  // test code
}, 30000);
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Artillery Documentation](https://artillery.io/docs/)
- [Pact Documentation](https://docs.pact.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)

## 🤝 Contributing

When adding new features:
1. **Write tests first** (TDD approach)
2. **Add performance tests** for new endpoints
3. **Update contract tests** for API changes
4. **Document test scenarios** in this guide
5. **Ensure all tests pass** before submitting PR

---

**Remember**: Automated testing is not just about catching bugs—it's about building confidence in your code and enabling rapid, safe deployments in a healthcare environment where reliability is critical. 