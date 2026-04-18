#!/bin/bash

# Healthcare API - Automated Testing Setup Script
# This script sets up the complete automated testing environment

set -e

echo "🚀 Setting up Automated Testing Environment for Healthcare API"
echo "=============================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js is installed: $NODE_VERSION"
        
        # Check if version is 18 or higher
        MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
        if [ "$MAJOR_VERSION" -lt 18 ]; then
            print_warning "Node.js version 18+ is recommended. Current: $NODE_VERSION"
        fi
    else
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
}

# Check if PostgreSQL is installed and running
check_postgresql() {
    print_status "Checking PostgreSQL installation..."
    if command -v psql &> /dev/null; then
        print_success "PostgreSQL is installed"
        
        # Check if PostgreSQL is running
        if pg_isready -q; then
            print_success "PostgreSQL is running"
        else
            print_warning "PostgreSQL is not running. Please start PostgreSQL service."
        fi
    else
        print_warning "PostgreSQL is not installed. Some tests may fail."
        print_status "Install PostgreSQL: https://www.postgresql.org/download/"
    fi
}

# Check if Redis is installed and running
check_redis() {
    print_status "Checking Redis installation..."
    if command -v redis-cli &> /dev/null; then
        print_success "Redis is installed"
        
        # Check if Redis is running
        if redis-cli ping &> /dev/null; then
            print_success "Redis is running"
        else
            print_warning "Redis is not running. Please start Redis service."
        fi
    else
        print_warning "Redis is not installed. Some tests may fail."
        print_status "Install Redis: https://redis.io/download"
    fi
}

# Install npm dependencies
install_dependencies() {
    print_status "Installing npm dependencies..."
    
    # Install production dependencies
    npm install
    
    # Install testing dependencies
    print_status "Installing testing dependencies..."
    npm install --save-dev \
        @faker-js/faker \
        @pact-foundation/pact \
        artillery \
        jest-html-reporter \
        jest-junit \
        supertest \
        @types/supertest \
        codecov \
        snyk
    
    print_success "Dependencies installed successfully"
}

# Create test environment file
create_test_env() {
    print_status "Creating test environment configuration..."
    
    if [ ! -f .env.test ]; then
        cat > .env.test << EOF
# Test Environment Configuration
NODE_ENV=test
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthcare_test
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=healthcare_test

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=test-jwt-secret-key-for-testing-only
JWT_EXPIRES_IN=1h

# Supabase Configuration (Test)
SUPABASE_URL=https://test.supabase.co
SUPABASE_ANON_KEY=test-anon-key
SUPABASE_SERVICE_ROLE_KEY=test-service-role-key

# Email Configuration (Test)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=test
SMTP_PASS=test
SMTP_FROM=test@healthcare.local

# Other Test Configuration
LOG_LEVEL=error
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=1000
EOF
        print_success "Test environment file created: .env.test"
    else
        print_warning "Test environment file already exists: .env.test"
    fi
}

# Create test database
create_test_database() {
    print_status "Creating test database..."
    
    if command -v psql &> /dev/null && pg_isready -q; then
        # Check if database exists
        if psql -lqt | cut -d \| -f 1 | grep -qw healthcare_test; then
            print_warning "Test database 'healthcare_test' already exists"
        else
            createdb healthcare_test 2>/dev/null || {
                print_warning "Could not create test database. You may need to create it manually:"
                print_status "  createdb healthcare_test"
            }
            print_success "Test database 'healthcare_test' created"
        fi
    else
        print_warning "PostgreSQL not available. Please create test database manually:"
        print_status "  createdb healthcare_test"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating test directories..."
    
    mkdir -p test/performance
    mkdir -p test/contract
    mkdir -p reports
    mkdir -p coverage
    mkdir -p logs
    mkdir -p pacts
    
    print_success "Test directories created"
}

# Update package.json scripts
update_package_scripts() {
    print_status "Updating package.json test scripts..."
    
    # Check if scripts need to be added
    if ! grep -q "test:integration" package.json; then
        print_status "Adding test scripts to package.json..."
        
        # Create a temporary file with updated scripts
        node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        
        pkg.scripts = pkg.scripts || {};
        
        // Add test scripts
        pkg.scripts['test:integration'] = 'jest --config ./test/jest-integration.json';
        pkg.scripts['test:contract'] = 'jest --config ./test/jest-contract.json';
        pkg.scripts['test:performance'] = 'artillery run test/performance/comprehensive-load-test.yml';
        pkg.scripts['test:all'] = 'npx ts-node test/automated-test-runner.ts';
        pkg.scripts['test:security'] = 'npm audit --audit-level high && snyk test';
        pkg.scripts['test:setup'] = './scripts/setup-testing.sh';
        
        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
        "
        
        print_success "Package.json scripts updated"
    else
        print_success "Package.json scripts already configured"
    fi
}

# Run initial tests
run_initial_tests() {
    print_status "Running initial test suite to verify setup..."
    
    # Run linting
    if npm run lint &> /dev/null; then
        print_success "Linting passed"
    else
        print_warning "Linting failed - please fix linting errors"
    fi
    
    # Run unit tests
    if npm run test &> /dev/null; then
        print_success "Unit tests passed"
    else
        print_warning "Unit tests failed - this is normal for initial setup"
    fi
    
    print_status "Initial test verification completed"
}

# Create sample test files if they don't exist
create_sample_tests() {
    print_status "Creating sample test files..."
    
    # Create jest configuration files if they don't exist
    if [ ! -f test/jest-integration.json ]; then
        cat > test/jest-integration.json << EOF
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "../",
  "testEnvironment": "node",
  "testRegex": ".integration-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "collectCoverageFrom": [
    "src/**/*.(t|j)s"
  ],
  "coverageDirectory": "./coverage",
  "testTimeout": 30000
}
EOF
        print_success "Integration test configuration created"
    fi
    
    if [ ! -f test/jest-contract.json ]; then
        cat > test/jest-contract.json << EOF
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": "../",
  "testEnvironment": "node",
  "testRegex": ".contract-spec.ts$",
  "transform": {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  "testTimeout": 30000
}
EOF
        print_success "Contract test configuration created"
    fi
}

# Main execution
main() {
    echo
    print_status "Starting automated testing setup..."
    echo
    
    # Run all setup steps
    check_nodejs
    check_postgresql
    check_redis
    install_dependencies
    create_test_env
    create_test_database
    create_directories
    create_sample_tests
    update_package_scripts
    run_initial_tests
    
    echo
    print_success "🎉 Automated Testing Setup Complete!"
    echo
    print_status "Next steps:"
    echo "  1. Review and update .env.test file if needed"
    echo "  2. Start your database and Redis services"
    echo "  3. Run tests: npm run test:all"
    echo "  4. Check the documentation: docs/AUTOMATED_TESTING_GUIDE.md"
    echo
    print_status "Available test commands:"
    echo "  npm run test              # Unit tests"
    echo "  npm run test:integration  # Integration tests"
    echo "  npm run test:e2e         # End-to-end tests"
    echo "  npm run test:performance # Performance tests"
    echo "  npm run test:contract    # Contract tests"
    echo "  npm run test:all         # All tests with reporting"
    echo "  npm run test:cov         # Tests with coverage"
    echo
}

# Run main function
main "$@" 