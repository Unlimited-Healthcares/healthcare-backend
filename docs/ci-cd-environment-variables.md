# CI/CD Environment Variables Guide

## Required Environment Variables for CI/CD

This document lists all environment variables required for the NestJS application to run successfully in CI/CD environments.

### Critical Environment Variables

These variables are **REQUIRED** for the application to start successfully:

#### Database Configuration
```bash
DATABASE_HOST=127.0.0.1  # Use IPv4 to avoid connectivity issues
DATABASE_PORT=5433       # GitHub Actions service port mapping
DATABASE_USERNAME=test_user
DATABASE_PASSWORD=test_password
DATABASE_NAME=healthcare_test
```

#### Redis Configuration
```bash
REDIS_HOST=127.0.0.1     # Use IPv4 to avoid connectivity issues
REDIS_PORT=6379
```

#### JWT Authentication
```bash
JWT_SECRET=test-jwt-secret-key-for-ci
JWT_REFRESH_SECRET=test-refresh-secret-key-for-ci
```

#### Supabase Storage (Required)
```bash
SUPABASE_URL=https://test.supabase.co
SUPABASE_KEY=test-anon-key
SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key
```

#### Encryption Service (Required)
```bash
ENCRYPTION_KEY=test-encryption-key-for-ci-environment-only
ENCRYPTION_SALT=test-salt-for-ci
```

#### Optional Environment Variables

These variables are optional but recommended to avoid warnings:

```bash
# OpenAI Service (Optional - prevents warnings)
OPENAI_API_KEY=test-openai-key

# Node Environment
NODE_ENV=test
PORT=3000
```

### Common Issues

#### Application Fails to Start
**Error**: `Error: Supabase credentials not configured properly`
**Solution**: Ensure `SUPABASE_URL` and `SUPABASE_KEY` are set

#### Encryption Service Error
**Error**: `Missing ENCRYPTION_KEY environment variable`
**Solution**: Set `ENCRYPTION_KEY` environment variable

#### Database Connection Issues
**Error**: `connect ECONNREFUSED ::1:5432` or `connect ECONNREFUSED 127.0.0.1:5432`
**Solutions**: 
- Use `127.0.0.1` instead of `localhost` for `DATABASE_HOST` to avoid IPv6 issues
- Ensure correct port mapping in GitHub Actions services (5433:5432)
- Add database connectivity verification before starting the application
- Install PostgreSQL client tools (`postgresql-client`) in CI environment

#### Application Startup Timeout
**Error**: Application fails to respond to health checks within 30 seconds
**Solutions**:
- Increase startup timeout to 120 seconds (60 attempts × 2 seconds)
- Add proper service readiness checks before starting the application
- Verify all dependencies (PostgreSQL, Redis) are ready before app startup

### GitHub Actions Workflows

The following workflows have been updated with these environment variables:

1. `.github/workflows/api-testing.yml`
2. `.github/workflows/automated-testing.yml`

#### Recent Improvements

**v2.0 - Enhanced Database Connectivity (January 2025)**
- Added PostgreSQL and Redis connectivity verification before app startup
- Implemented IPv4-specific addressing to avoid IPv6 connectivity issues
- Extended application startup timeout from 30s to 120s with detailed logging
- Added database tools installation (`postgresql-client`, `redis-tools`)
- Improved error reporting and debugging information

### Testing Locally

To test with these environment variables locally:

```bash
# Copy from CI environment variables
export NODE_ENV=test
export DATABASE_HOST=localhost
export DATABASE_PORT=5432
export DATABASE_USERNAME=postgres
export DATABASE_PASSWORD=postgres
export DATABASE_NAME=healthcare_test
export REDIS_HOST=localhost
export REDIS_PORT=6379
export JWT_SECRET=test-jwt-secret-key-for-ci
export JWT_REFRESH_SECRET=test-refresh-secret-key-for-ci
export SUPABASE_URL=https://test.supabase.co
export SUPABASE_KEY=test-anon-key
export ENCRYPTION_KEY=test-encryption-key-for-ci-environment-only
export ENCRYPTION_SALT=test-salt-for-ci

# Run the application
npm run start:prod
```

### Security Notes

- These are **TEST VALUES ONLY** for CI/CD environments
- Never use these values in production
- Production values should be stored in GitHub Secrets
- Test Supabase URLs and keys are non-functional placeholders

### Future Updates

When adding new services that require environment variables:

1. Add the variable to this documentation
2. Update all relevant GitHub Actions workflows
3. Add test values to the test setup scripts
4. Document any new requirements 