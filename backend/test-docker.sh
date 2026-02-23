#!/bin/bash
# Test script for Docker deployment

set -e

echo "=== FastAPI ML-RAG Backend Docker Test ==="
echo ""

# Check if Docker is installed
echo "1. Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi
echo "✓ Docker is installed: $(docker --version)"
echo ""

# Check if Docker daemon is running
echo "2. Checking Docker daemon..."
if ! docker info &> /dev/null; then
    echo "❌ Docker daemon is not running. Please start Docker Desktop."
    exit 1
fi
echo "✓ Docker daemon is running"
echo ""

# Check if .env file exists
echo "3. Checking environment configuration..."
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi
echo "✓ .env file exists"
echo ""

# Build Docker image
echo "4. Building Docker image..."
docker build -t fastapi-ml-rag-backend . || {
    echo "❌ Docker build failed"
    exit 1
}
echo "✓ Docker image built successfully"
echo ""

# Run container
echo "5. Starting container..."
docker run -d \
    --name fastapi-ml-rag-backend-test \
    -p 8000:8000 \
    --env-file .env \
    fastapi-ml-rag-backend || {
    echo "❌ Failed to start container"
    exit 1
}
echo "✓ Container started"
echo ""

# Wait for container to be healthy
echo "6. Waiting for container to be healthy..."
sleep 5

# Test health endpoint
echo "7. Testing health endpoint..."
if curl -f http://localhost:8000/health &> /dev/null; then
    echo "✓ Health endpoint responding"
else
    echo "❌ Health endpoint not responding"
    echo "Container logs:"
    docker logs fastapi-ml-rag-backend-test
    docker stop fastapi-ml-rag-backend-test
    docker rm fastapi-ml-rag-backend-test
    exit 1
fi
echo ""

# Clean up
echo "8. Cleaning up..."
docker stop fastapi-ml-rag-backend-test
docker rm fastapi-ml-rag-backend-test
echo "✓ Container stopped and removed"
echo ""

echo "=== All Docker tests passed! ==="
