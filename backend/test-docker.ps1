# Test script for Docker deployment (PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "=== FastAPI ML-RAG Backend Docker Test ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
Write-Host "1. Checking Docker installation..." -ForegroundColor Yellow
try {
    $dockerVersion = docker --version
    Write-Host "✓ Docker is installed: $dockerVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not installed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check if Docker daemon is running
Write-Host "2. Checking Docker daemon..." -ForegroundColor Yellow
try {
    docker info | Out-Null
    Write-Host "✓ Docker daemon is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker daemon is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}
Write-Host ""

# Check if .env file exists
Write-Host "3. Checking environment configuration..." -ForegroundColor Yellow
if (-Not (Test-Path .env)) {
    Write-Host "❌ .env file not found. Please create it from .env.example" -ForegroundColor Red
    exit 1
}
Write-Host "✓ .env file exists" -ForegroundColor Green
Write-Host ""

# Build Docker image
Write-Host "4. Building Docker image..." -ForegroundColor Yellow
try {
    docker build -t fastapi-ml-rag-backend .
    Write-Host "✓ Docker image built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker build failed" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Run container
Write-Host "5. Starting container..." -ForegroundColor Yellow
try {
    docker run -d `
        --name fastapi-ml-rag-backend-test `
        -p 8000:8000 `
        --env-file .env `
        fastapi-ml-rag-backend
    Write-Host "✓ Container started" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to start container" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Wait for container to be healthy
Write-Host "6. Waiting for container to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test health endpoint
Write-Host "7. Testing health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri http://localhost:8000/health -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Health endpoint responding" -ForegroundColor Green
    } else {
        throw "Health endpoint returned status code: $($response.StatusCode)"
    }
} catch {
    Write-Host "❌ Health endpoint not responding" -ForegroundColor Red
    Write-Host "Container logs:" -ForegroundColor Yellow
    docker logs fastapi-ml-rag-backend-test
    docker stop fastapi-ml-rag-backend-test
    docker rm fastapi-ml-rag-backend-test
    exit 1
}
Write-Host ""

# Clean up
Write-Host "8. Cleaning up..." -ForegroundColor Yellow
docker stop fastapi-ml-rag-backend-test
docker rm fastapi-ml-rag-backend-test
Write-Host "✓ Container stopped and removed" -ForegroundColor Green
Write-Host ""

Write-Host "=== All Docker tests passed! ===" -ForegroundColor Green
