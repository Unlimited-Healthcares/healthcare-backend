#!/bin/bash

# Test Database Setup Script
# This script sets up the test database for integration tests

set -e

echo "🔧 Setting up test database..."

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until pg_isready -h localhost -p 5433 -U test_user -d healthcare_test; do
  echo "Database is not ready yet. Waiting..."
  sleep 2
done

echo "✅ Database is ready!"

# Run migrations
echo "📊 Running database migrations..."
npm run migration:run

# Run seeds if they exist
echo "🌱 Running database seeds..."
npm run seed:run || echo "⚠️ No seeds to run or seeds failed"

echo "✅ Test database setup complete!" 