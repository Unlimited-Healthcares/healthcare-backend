#!/bin/bash

# Database Readiness Check Script
# This script checks if PostgreSQL and Redis are ready for testing

set -e

echo "🔍 Checking database readiness..."

# Check PostgreSQL
echo "📊 Checking PostgreSQL..."
max_retries=30
retry_count=0

while [ $retry_count -lt $max_retries ]; do
  if pg_isready -h localhost -p 5433 -U test_user -d healthcare_test >/dev/null 2>&1; then
    echo "✅ PostgreSQL is ready!"
    break
  else
    retry_count=$((retry_count + 1))
    echo "⏳ PostgreSQL not ready yet... (${retry_count}/${max_retries})"
    sleep 2
  fi
done

if [ $retry_count -eq $max_retries ]; then
  echo "❌ PostgreSQL failed to become ready after ${max_retries} attempts"
  exit 1
fi

# Check Redis
echo "🔴 Checking Redis..."
retry_count=0

while [ $retry_count -lt $max_retries ]; do
  if redis-cli -h localhost -p 6379 ping >/dev/null 2>&1; then
    echo "✅ Redis is ready!"
    break
  else
    retry_count=$((retry_count + 1))
    echo "⏳ Redis not ready yet... (${retry_count}/${max_retries})"
    sleep 2
  fi
done

if [ $retry_count -eq $max_retries ]; then
  echo "❌ Redis failed to become ready after ${max_retries} attempts"
  exit 1
fi

# Test application database connection
echo "🔗 Testing application database connection..."
retry_count=0

while [ $retry_count -lt $max_retries ]; do
  if npx typeorm-ts-node-commonjs query "SELECT 1" -d src/datasource.ts >/dev/null 2>&1; then
    echo "✅ Application database connection successful!"
    break
  else
    retry_count=$((retry_count + 1))
    echo "⏳ Application database connection not ready yet... (${retry_count}/${max_retries})"
    sleep 3
  fi
done

if [ $retry_count -eq $max_retries ]; then
  echo "❌ Application database connection failed after ${max_retries} attempts"
  exit 1
fi

echo "🎉 All database services are ready for testing!" 