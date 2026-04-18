// Polyfill for crypto global object (required for @nestjs/schedule in tests)
import { webcrypto } from 'crypto';

if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as Crypto;
}

// Additional test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key';

// Database configuration - match the working workflow settings
process.env.DATABASE_HOST = '127.0.0.1'; // Use localhost for GitHub Actions service containers
process.env.DATABASE_PORT = '5433'; // Matches the port mapping in workflow (5433:5432)
process.env.DATABASE_USERNAME = 'postgres'; // Use test_user to match workflow configuration
process.env.DATABASE_PASSWORD = 'postgres'; // Use test_password to match workflow configuration
process.env.DATABASE_NAME = 'healthcare_test';

// Redis configuration
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Enable database synchronization for tests
process.env.SYNC_DATABASE = 'true';

// Handle Jest teardown
afterAll(async () => {
  // Give time for any pending operations to complete
  await new Promise(resolve => setTimeout(resolve, 1000));
});

// Increase timeout for all tests
jest.setTimeout(10000); 