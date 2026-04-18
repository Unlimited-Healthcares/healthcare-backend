#!/bin/bash

# Test Database Setup Script
# This script ensures the test database exists in the Docker container

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if Docker is running
check_docker() {
    print_status "Checking Docker status..."
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if the PostgreSQL container is running
check_postgres_container() {
    print_status "Checking PostgreSQL container..."
    if ! docker ps --format "table {{.Names}}" | grep -q "healthcare-backend-postgres"; then
        print_error "PostgreSQL container is not running. Please start the healthcare backend first:"
        print_status "  docker-compose up -d"
        exit 1
    fi
    print_success "PostgreSQL container is running"
}

# Create test database if it doesn't exist
create_test_database() {
    print_status "Checking if test database exists..."
    
    # Check if healthcare_test database exists
    if docker exec healthcare-backend-postgres-1 psql -U postgres -lqt | cut -d \| -f 1 | grep -qw healthcare_test; then
        print_success "Test database 'healthcare_test' already exists"
    else
        print_status "Creating test database 'healthcare_test'..."
        if docker exec healthcare-backend-postgres-1 createdb -U postgres healthcare_test; then
            print_success "Test database 'healthcare_test' created successfully"
        else
            print_error "Failed to create test database. Please check PostgreSQL container logs."
            exit 1
        fi
    fi
}

# Verify database connectivity
verify_connectivity() {
    print_status "Verifying database connectivity..."
    
    # Test connection to healthcare_test
    if docker exec healthcare-backend-postgres-1 psql -U postgres -d healthcare_test -c "SELECT 1;" > /dev/null 2>&1; then
        print_success "Successfully connected to healthcare_test database"
    else
        print_error "Failed to connect to healthcare_test database"
        exit 1
    fi
}

# Main execution
main() {
    echo "🏥 Healthcare Backend - Test Database Setup"
    echo "=========================================="
    echo
    
    check_docker
    check_postgres_container
    create_test_database
    verify_connectivity
    
    echo
    print_success "Test database setup completed successfully!"
    print_status "You can now run comprehensive tests:"
    print_status "  npm run test:comprehensive"
}

# Run main function
main "$@" 