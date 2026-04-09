---
name: docker
description: Docker containerization best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: devops
---
## What I do
- Write efficient Dockerfiles using multi-stage builds
- Optimize image size with minimal base images
- Properly structure docker-compose configurations
- Implement health checks
- Use .dockerignore effectively
- Follow security best practices for containers
- Manage environment variables and secrets properly

## When to use me
When creating Dockerfiles, docker-compose files, or container-related configurations.

## Multi-stage Dockerfile
```dockerfile
# Builder stage
FROM python:3.11-slim-bookworm AS builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Runtime stage
FROM python:3.11-slim-bookworm AS runtime

WORKDIR /home/runner/workspace

COPY --from=builder /install /usr/local

COPY src/ ./src/

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN addgroup --gid 1000 appgroup && \
    adduser --uid 1000 --gid 1000 --shell /bin/bash appuser

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')" || exit 1

CMD ["python", "src/main.py"]
```

## Docker Compose
```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    volumes:
      - ./src:/home/runner/workspace/src
      - app_data:/home/runner/workspace/data
    networks:
      - app_network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:5000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d app"]
      interval: 10s
      timeout: 5s
      retries: 5

  cache:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
  app_data:

networks:
  app_network:
    driver: bridge
```

## Security Best Practices
- Don't run as root
- Use specific tags, not :latest
- Scan images for vulnerabilities
- Don't include secrets in build context
- Use read-only filesystems where possible
- Limit capabilities

## Commands
```bash
# Build and run
docker build -t myapp:latest .
docker run -p 5000:5000 myapp:latest

# View logs and debug
docker compose logs -f
docker exec -it container_name bash

# Clean up
docker system prune -a
docker volume prune
```
