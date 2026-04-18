
# API Testing Guide

## Overview

This guide covers comprehensive testing strategies for the UNLIMITEDHEALTHCARE API, including unit tests, integration tests, end-to-end tests, and performance testing.

## Testing Architecture

### Test Types

1. **Unit Tests** - Test individual functions and methods
2. **Integration Tests** - Test API endpoints and database interactions
3. **End-to-End Tests** - Test complete user workflows
4. **Performance Tests** - Test API performance under load

### Test Environment Setup

```bash
# Install test dependencies
npm install --save-dev jest supertest @types/jest @types/supertest

# Run all tests
npm run test

# Run tests with coverage
npm run test:cov

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run performance tests
npm run test:performance
```

## Unit Testing

### Test Structure

```typescript
// Example: auth.service.spec.ts
describe('AuthService', () => {
  let service: AuthService;
  let mockRepository: Repository<User>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('should register a new user', async () => {
      // Test implementation
    });

    it('should throw ConflictException if user exists', async () => {
      // Test implementation
    });
  });
});
```

### Coverage Requirements

- **Minimum Coverage**: 80%
- **Critical Paths**: 95%
- **Services**: 90%
- **Controllers**: 85%

## Integration Testing

### Database Testing

```typescript
// Setup test database
beforeAll(async () => {
  const module = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  app = module.createNestApplication();
  dataSource = module.get<DataSource>(DataSource);
  
  await app.init();
});

beforeEach(async () => {
  // Clean database before each test
  await dataSource.synchronize(true);
});
```

### API Endpoint Testing

```typescript
describe('POST /auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        roles: ['patient'],
      })
      .expect(201);

    expect(response.body).toHaveProperty('accessToken');
    expect(response.body.user.email).toBe('test@example.com');
  });
});
```

## End-to-End Testing

### User Workflow Testing

```typescript
describe('Patient Consultation Workflow', () => {
  it('should complete full consultation workflow', async () => {
    // 1. Register patient
    const patientResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(patientData);

    // 2. Register doctor
    const doctorResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(doctorData);

    // 3. Create appointment
    const appointmentResponse = await request(app.getHttpServer())
      .post('/appointments')
      .set('Authorization', `Bearer ${patientResponse.body.accessToken}`)
      .send(appointmentData);

    // 4. Create chat room
    const chatRoomResponse = await request(app.getHttpServer())
      .post('/chat/rooms')
      .set('Authorization', `Bearer ${doctorResponse.body.accessToken}`)
      .send(chatRoomData);

    // 5. Send message
    const messageResponse = await request(app.getHttpServer())
      .post(`/chat/rooms/${chatRoomResponse.body.id}/messages`)
      .set('Authorization', `Bearer ${patientResponse.body.accessToken}`)
      .send({ content: 'Hello doctor' });

    expect(messageResponse.status).toBe(201);
  });
});
```

## Performance Testing

### Load Testing with Artillery

```yaml
# load-test.yml
config:
  target: 'https://api.unlimitedhealthcare.com'
  phases:
    - duration: 300  # 5 minutes
      arrivalRate: 10  # 10 users per second

scenarios:
  - name: "Full User Journey"
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "load-test@example.com"
            password: "password123"
          capture:
            - json: "$.accessToken"
              as: "token"
      
      - get:
          url: "/appointments"
          headers:
            Authorization: "Bearer {{ token }}"
      
      - post:
          url: "/chat/rooms"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            name: "Load Test Room"
            type: "consultation"
            participantIds: ["{{ userId }}"]
```

### Performance Benchmarks

| Endpoint | Response Time (p95) | Throughput (RPS) | Error Rate |
|----------|---------------------|------------------|------------|
| POST /auth/login | < 200ms | 1000 | < 0.1% |
| GET /appointments | < 150ms | 1500 | < 0.1% |
| POST /chat/rooms | < 300ms | 500 | < 0.1% |
| GET /medical-records | < 250ms | 800 | < 0.1% |

## Test Data Management

### Test Fixtures

```typescript
// test/fixtures/user.fixture.ts
export const createUserFixture = (overrides = {}) => ({
  email: faker.internet.email(),
  password: 'password123',
  roles: ['patient'],
  profile: {
    firstName: faker.name.firstName(),
    lastName: faker.name.lastName(),
    phone: faker.phone.number(),
  },
  ...overrides,
});
```

### Database Seeding

```typescript
// database/seeds/test-data.seed.ts
export class TestDataSeed implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    // Create test users
    const users = await dataSource.manager.save(User, [
      createUserFixture({ email: 'patient@test.com' }),
      createUserFixture({ email: 'doctor@test.com', roles: ['doctor'] }),
    ]);

    // Create test appointments
    await dataSource.manager.save(Appointment, [
      createAppointmentFixture({ patientId: users[0].id }),
    ]);
  }
}
```

## Continuous Integration

### GitHub Actions Test Pipeline

```yaml
name: Test Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: test_password
          POSTGRES_DB: healthcare_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:cov
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test_password@localhost:5432/healthcare_test
      
      - name: Run e2e tests
        run: npm run test:e2e
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

## Test Monitoring and Reporting

### Coverage Reports

```bash
# Generate HTML coverage report
npm run test:cov
open coverage/lcov-report/index.html
```

### Test Metrics Dashboard

- **Test Coverage**: Track code coverage over time
- **Test Duration**: Monitor test execution time
- **Flaky Tests**: Identify unreliable tests
- **Failure Rate**: Track test failure trends

## Quality Gates

### Pre-deployment Checks

1. **All tests pass** (unit, integration, e2e)
2. **Code coverage** >= 80%
3. **Performance tests** meet benchmarks
4. **Security scans** pass
5. **API documentation** updated

### Automated Quality Checks

```json
// package.json
{
  "scripts": {
    "precommit": "npm run lint && npm run test",
    "prepush": "npm run test:integration",
    "quality-gate": "npm run test:cov && npm run test:performance"
  }
}
```

## Best Practices

### Test Organization

1. **Descriptive test names** that explain the scenario
2. **Arrange-Act-Assert** pattern for clear test structure
3. **Mock external dependencies** for unit tests
4. **Clean up resources** after each test
5. **Parallel test execution** for faster feedback

### Data Management

1. **Isolated test data** for each test
2. **Database transactions** for easy rollback
3. **Factory patterns** for test data creation
4. **Realistic test data** using faker libraries

### Performance Testing

1. **Baseline measurements** before optimization
2. **Gradual load increase** to find breaking points
3. **Monitor system resources** during tests
4. **Test in production-like environment**

## Troubleshooting

### Common Issues

1. **Flaky Tests**
   - Add proper wait conditions
   - Increase timeouts for slow operations
   - Use deterministic test data

2. **Memory Leaks**
   - Properly close database connections
   - Clean up event listeners
   - Use WeakMap for caching

3. **Test Isolation**
   - Reset database state between tests
   - Clear caches and singletons
   - Use separate test databases

### Debug Mode

```bash
# Run tests in debug mode
npm run test:debug

# Run specific test file
npm run test -- auth.service.spec.ts

# Run tests with verbose output
npm run test -- --verbose
```
