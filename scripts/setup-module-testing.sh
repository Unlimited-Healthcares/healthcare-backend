#!/bin/bash

# 🧪 Module Testing Setup Script
# Sets up the environment for comprehensive API module testing

set -e

echo "🚀 Setting up Module Testing Environment..."
echo "============================================"

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

# Check if Docker is running
print_status "Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi
print_success "Docker is running"

# Check if PostgreSQL container is running
print_status "Checking PostgreSQL container..."
if ! docker-compose ps postgres | grep -q "Up"; then
    print_warning "PostgreSQL container is not running. Starting it now..."
    docker-compose up postgres -d
    
    # Wait for PostgreSQL to be ready
    print_status "Waiting for PostgreSQL to be ready..."
    sleep 10
    
    # Check if it's ready
    max_attempts=30
    attempt=1
    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
            print_success "PostgreSQL is ready"
            break
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            print_error "PostgreSQL failed to start after $max_attempts attempts"
            exit 1
        fi
        
        print_status "Attempt $attempt/$max_attempts - waiting for PostgreSQL..."
        sleep 2
        ((attempt++))
    done
else
    print_success "PostgreSQL container is already running"
fi

# Install dependencies if needed
print_status "Checking dependencies..."
if [ ! -d "node_modules" ]; then
    print_warning "Node modules not found. Installing dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_success "Dependencies are already installed"
fi

# Create test database if it doesn't exist
print_status "Setting up test database..."
docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE healthcare_test;" 2>/dev/null || print_warning "Test database already exists"

# Create test reports directory
print_status "Creating test reports directory..."
mkdir -p test/reports
print_success "Test reports directory created"

# Create test environment file if it doesn't exist
print_status "Setting up test environment configuration..."
if [ ! -f ".env.test" ]; then
    print_warning ".env.test not found. Creating from .env.development..."
    cp .env.development .env.test
    
    # Modify for test environment
    sed -i 's/DB_NAME=healthcare/DB_NAME=healthcare_test/g' .env.test
    sed -i 's/PORT=3000/PORT=3001/g' .env.test
    sed -i 's/NODE_ENV=development/NODE_ENV=test/g' .env.test
    
    print_success "Test environment configuration created"
else
    print_success "Test environment configuration already exists"
fi

# Build the application
print_status "Building the application..."
npm run build
print_success "Application built successfully"

# Run database migrations for test database
print_status "Running database migrations for test environment..."
NODE_ENV=test npm run db:migrate 2>/dev/null || print_warning "Migrations may have already been run"

print_success "Module testing environment setup complete!"
echo ""
echo "============================================"
echo "🎯 Ready to run module tests!"
echo ""
echo "Available commands:"
echo "  npm run test:modules        # Run all module tests"
echo "  npm run test:module auth    # Run authentication module tests"
echo "  npm run test:module users   # Run users module tests"
echo "  npm run test:auth           # Run auth tests directly"
echo "  npm run test:users          # Run users tests directly"
echo ""
echo "📊 Test reports will be saved to: test/reports/"
echo "============================================" 