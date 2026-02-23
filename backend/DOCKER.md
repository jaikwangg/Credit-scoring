# Docker Deployment Guide

This guide provides detailed instructions for deploying the FastAPI ML-RAG Backend using Docker.

## Quick Start

```bash
# 1. Ensure .env file is configured
cp .env.example .env
# Edit .env with your API keys

# 2. Build and run with docker-compose
docker-compose up -d

# 3. Verify the service is running
curl http://localhost:8000/health
```

## Files Overview

### Dockerfile
- **Base Image**: Python 3.11 slim (smaller footprint)
- **Security**: Runs as non-root user (appuser)
- **Optimization**: Multi-layer caching for faster rebuilds
- **Health Check**: Built-in monitoring of /health endpoint
- **Size**: ~200MB (optimized with slim image and .dockerignore)

### docker-compose.yml
- **Service**: Single backend service
- **Port Mapping**: 8000:8000 (host:container)
- **Environment**: Loads from .env file
- **Restart Policy**: unless-stopped (auto-restart on failure)
- **Network**: Custom bridge network (ml-rag-network)
- **Health Check**: Monitors service availability

### .dockerignore
Excludes unnecessary files from build context:
- Python cache files (__pycache__, *.pyc)
- Virtual environments (venv/, env/)
- Test artifacts (.pytest_cache/, htmlcov/)
- IDE files (.vscode/, .idea/)
- Documentation (*.md)
- Git files (.git/)

## Building the Image

### Basic Build
```bash
docker build -t fastapi-ml-rag-backend .
```

### Build with Tag
```bash
docker build -t fastapi-ml-rag-backend:v1.0.0 .
```

### Build with No Cache
```bash
docker build --no-cache -t fastapi-ml-rag-backend .
```

### View Build Layers
```bash
docker history fastapi-ml-rag-backend
```

## Running the Container

### Using docker run

**Basic Run:**
```bash
docker run -d \
  --name fastapi-ml-rag-backend \
  -p 8000:8000 \
  --env-file .env \
  fastapi-ml-rag-backend
```

**With Custom Port:**
```bash
docker run -d \
  --name fastapi-ml-rag-backend \
  -p 8001:8000 \
  --env-file .env \
  fastapi-ml-rag-backend
```

**With Environment Variables:**
```bash
docker run -d \
  --name fastapi-ml-rag-backend \
  -p 8000:8000 \
  -e ML_ENDPOINT_URL=https://api.example.com/ml \
  -e OPENAI_API_KEY=sk-your-key \
  -e FRONTEND_URL=http://localhost:3000 \
  fastapi-ml-rag-backend
```

### Using docker-compose

**Start Services:**
```bash
# Start in detached mode
docker-compose up -d

# Start with logs
docker-compose up

# Start and rebuild
docker-compose up -d --build
```

**Stop Services:**
```bash
# Stop containers
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes
docker-compose down -v
```

**View Logs:**
```bash
# All logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100
```

## Container Management

### View Running Containers
```bash
docker ps
```

### View All Containers
```bash
docker ps -a
```

### View Container Logs
```bash
# All logs
docker logs fastapi-ml-rag-backend

# Follow logs
docker logs -f fastapi-ml-rag-backend

# Last 100 lines
docker logs --tail=100 fastapi-ml-rag-backend
```

### Execute Commands in Container
```bash
# Interactive shell
docker exec -it fastapi-ml-rag-backend /bin/bash

# Run Python command
docker exec fastapi-ml-rag-backend python -c "print('Hello')"

# Check Python version
docker exec fastapi-ml-rag-backend python --version
```

### Stop and Remove Container
```bash
# Stop container
docker stop fastapi-ml-rag-backend

# Remove container
docker rm fastapi-ml-rag-backend

# Force remove running container
docker rm -f fastapi-ml-rag-backend
```

## Health Monitoring

### Check Container Health
```bash
# View health status
docker ps

# Inspect health details
docker inspect --format='{{json .State.Health}}' fastapi-ml-rag-backend | jq
```

### Manual Health Check
```bash
# Using curl
curl http://localhost:8000/health

# Using httpx (Python)
python -c "import httpx; print(httpx.get('http://localhost:8000/health').json())"
```

### Health Check Configuration
The health check runs every 30 seconds and checks the `/health` endpoint:
- **Interval**: 30s (time between checks)
- **Timeout**: 10s (max time for check to complete)
- **Start Period**: 5s (grace period before first check)
- **Retries**: 3 (failures before marking unhealthy)

## Testing the Deployment

### Automated Testing

**Linux/Mac:**
```bash
chmod +x test-docker.sh
./test-docker.sh
```

**Windows PowerShell:**
```powershell
.\test-docker.ps1
```

### Manual Testing

**1. Test Health Endpoint:**
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy"}
```

**2. Test Predict Endpoint:**
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "input_text": "Test input for ML model",
    "extra_features": {
      "feature1": 1.0
    }
  }'
```

**3. Test API Documentation:**
```bash
# Open in browser
open http://localhost:8000/docs  # Mac
start http://localhost:8000/docs  # Windows
xdg-open http://localhost:8000/docs  # Linux
```

## Environment Configuration

### Required Variables
```bash
ML_ENDPOINT_URL=https://your-ml-endpoint.com/predict
OPENAI_API_KEY=sk-your-openai-key
# OR
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
```

### Optional Variables
```bash
ML_API_KEY=your-ml-api-key
FRONTEND_URL=http://localhost:3000
```

### Verifying Environment Variables
```bash
# View environment variables in container
docker exec fastapi-ml-rag-backend env | grep -E "ML_|OPENAI_|ANTHROPIC_|FRONTEND_"
```

## Production Deployment

### Best Practices

**1. Use Specific Tags:**
```bash
docker build -t fastapi-ml-rag-backend:1.0.0 .
docker tag fastapi-ml-rag-backend:1.0.0 fastapi-ml-rag-backend:latest
```

**2. Use Secrets Management:**
```bash
# Don't use .env in production
# Use Docker secrets or cloud provider secrets
docker secret create ml_api_key /path/to/secret
```

**3. Resource Limits:**
```yaml
# In docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

**4. Logging:**
```yaml
# In docker-compose.yml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

**5. Use Reverse Proxy:**
```yaml
# nginx or traefik for TLS termination
services:
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
```

### Multi-Stage Build (Advanced)

For even smaller images, use multi-stage builds:

```dockerfile
# Builder stage
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY main.py ml_service.py rag_service.py ./
ENV PATH=/root/.local/bin:$PATH
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Troubleshooting

### Container Won't Start

**Check logs:**
```bash
docker logs fastapi-ml-rag-backend
```

**Common issues:**
- Missing environment variables
- Invalid API keys
- Port already in use

**Solutions:**
```bash
# Check if port is in use
netstat -an | grep 8000  # Linux/Mac
netstat -an | findstr 8000  # Windows

# Use different port
docker run -p 8001:8000 ...
```

### Health Check Failing

**Check health status:**
```bash
docker inspect fastapi-ml-rag-backend | grep -A 10 Health
```

**Common causes:**
- Application not starting properly
- Environment variables not set
- ML endpoint unreachable

**Debug:**
```bash
# Check if app is running
docker exec fastapi-ml-rag-backend ps aux

# Test health endpoint from inside container
docker exec fastapi-ml-rag-backend curl http://localhost:8000/health
```

### Build Failures

**Clear build cache:**
```bash
docker builder prune
```

**Build with verbose output:**
```bash
docker build --progress=plain -t fastapi-ml-rag-backend .
```

**Check disk space:**
```bash
docker system df
```

### Performance Issues

**Check resource usage:**
```bash
docker stats fastapi-ml-rag-backend
```

**Increase resources:**
```yaml
# In docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
```

## Cleanup

### Remove Containers
```bash
# Stop and remove specific container
docker stop fastapi-ml-rag-backend
docker rm fastapi-ml-rag-backend

# Remove all stopped containers
docker container prune
```

### Remove Images
```bash
# Remove specific image
docker rmi fastapi-ml-rag-backend

# Remove all unused images
docker image prune -a
```

### Complete Cleanup
```bash
# Remove everything (containers, images, volumes, networks)
docker system prune -a --volumes
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Build Docker image
        run: docker build -t fastapi-ml-rag-backend .
      
      - name: Run tests
        run: |
          docker run -d --name test-container \
            -e ML_ENDPOINT_URL=${{ secrets.ML_ENDPOINT_URL }} \
            -e OPENAI_API_KEY=${{ secrets.OPENAI_API_KEY }} \
            fastapi-ml-rag-backend
          sleep 5
          docker exec test-container pytest
          docker stop test-container
      
      - name: Push to registry
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
          docker tag fastapi-ml-rag-backend:latest myregistry/fastapi-ml-rag-backend:${{ github.sha }}
          docker push myregistry/fastapi-ml-rag-backend:${{ github.sha }}
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Python Docker Best Practices](https://docs.docker.com/language/python/best-practices/)

## Support

For issues with Docker deployment, check:
1. Container logs: `docker logs fastapi-ml-rag-backend`
2. Health status: `docker inspect fastapi-ml-rag-backend`
3. Environment variables: `docker exec fastapi-ml-rag-backend env`
4. Application logs inside container: `docker exec fastapi-ml-rag-backend cat /app/logs/app.log`
