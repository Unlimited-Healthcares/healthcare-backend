# Test Database Setup Guide

## Problem Description

The comprehensive tests were failing to connect to the database because:

1. **Docker Container Database**: Your Docker container uses database name `healthcare` (from `.env.development`)
2. **Test Configuration**: The test configuration expects database name `healthcare_test` (from `.env.test`)
3. **Missing Database**: The `healthcare_test` database didn't exist in the PostgreSQL container

## Why WebSocket Tests Worked

The WebSocket tests (`npm run test:websocket`) worked because they only test HTTP endpoints and don't require database connectivity. They test the API server endpoints without actually connecting to the database.

## Solutions

### Solution 1: Manual Database Creation (One-time)

Create the test database manually in your Docker container:

```bash
docker exec healthcare-backend-postgres-1 createdb -U postgres healthcare_test
```

### Solution 2: Automated Setup Script (Recommended)

Use the automated setup script that checks and creates the test database:

```bash
# Run the setup script
./scripts/setup-test-database.sh

# Or use the npm script that combines setup + tests
npm run test:comprehensive:setup
```

### Solution 3: Update Test Configuration

If you prefer to use the existing `healthcare` database for tests, update `.env.test`:

```bash
# Change DATABASE_NAME in .env.test
DATABASE_NAME=healthcare
```

## Database Configuration Files

### Current Configuration

| File | Database Name | Purpose |
|------|---------------|---------|
| `.env.development` | `healthcare` | Development environment |
| `.env.test` | `healthcare_test` | Test environment |

### Docker Container Setup

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: healthcare  # This creates the 'healthcare' database
    ports:
      - 5433:5432
```

## Available Test Commands

### Basic Tests (No Database Required)
```bash
npm run test:websocket          # WebSocket endpoint tests
npm run test:auth               # Authentication tests
npm run test:admin              # Admin endpoint tests
```

### Database-Dependent Tests
```bash
npm run test:comprehensive       # All module tests (requires healthcare_test DB)
npm run test:comprehensive:setup # Setup DB + run comprehensive tests
```

### Database Setup
```bash
./scripts/setup-test-database.sh  # Setup test database only
```

## Troubleshooting

### Database Connection Errors

**Error**: `database "healthcare_test" does not exist`

**Solutions**:
1. Run the setup script: `./scripts/setup-test-database.sh`
2. Create database manually: `docker exec healthcare-backend-postgres-1 createdb -U postgres healthcare_test`
3. Check if PostgreSQL container is running: `docker ps`

### Container Not Running

**Error**: `PostgreSQL container is not running`

**Solution**:
```bash
docker-compose up -d
```

### Permission Issues

**Error**: `Permission denied`

**Solution**:
```bash
chmod +x scripts/setup-test-database.sh
```

## Environment Variables

### Test Environment (.env.test)
```bash
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5433
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=healthcare_test
```

### Development Environment (.env.development)
```bash
DB_HOST=healthcare-backend-postgres-1
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=healthcare
```

## Best Practices

1. **Always use the setup script** before running comprehensive tests
2. **Keep test and development databases separate** to avoid data conflicts
3. **Use the npm script** `npm run test:comprehensive:setup` for convenience
4. **Check Docker container status** before running tests
5. **Verify database connectivity** using the setup script

## CI/CD Integration

For automated testing in CI/CD environments, the setup script automatically:
- Checks Docker status
- Verifies PostgreSQL container is running
- Creates test database if it doesn't exist
- Verifies database connectivity
- Provides clear error messages for troubleshooting 