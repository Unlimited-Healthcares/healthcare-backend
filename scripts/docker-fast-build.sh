#!/bin/bash

# Fast Docker Build Script for Healthcare Management System
# This script enables all Docker build optimizations

set -e  # Exit on any error

echo "🚀 Starting optimized Docker build..."

# Enable Docker BuildKit for faster builds
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

# Clean up any dangling images to free space
echo "🧹 Cleaning up dangling images..."
docker image prune -f

# Build with BuildKit optimizations and proper error handling
echo "🔨 Building with optimizations..."
if docker compose build --parallel --progress=plain; then
    echo ""
    echo "✅ Build completed successfully!"
    echo ""
    echo "📊 Build optimizations applied:"
    echo "   ✓ Docker BuildKit enabled"
    echo "   ✓ .dockerignore created (excludes node_modules, .git, etc.)"
    echo "   ✓ Multi-stage build optimized"
    echo "   ✓ Layer caching improved"
    echo "   ✓ Parallel builds enabled"
    echo ""
    echo "🏃‍♂️ To start the services:"
    echo "   docker compose up"
else
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "🔍 Common issues to check:"
    echo "   • Network connectivity for downloading packages"
    echo "   • Docker daemon running properly"
    echo "   • Sufficient disk space"
    echo "   • Check the error messages above"
    echo ""
    echo "🛠️  Try these troubleshooting steps:"
    echo "   1. docker system prune -f"
    echo "   2. docker compose build --no-cache"
    echo "   3. Check your internet connection"
    exit 1
fi 