---
name: containerization
description: Application containerization with Docker
license: MIT
compatibility: opencode
metadata:
  audience: developer, devops-engineer
  category: devops
---

## What I do

- Containerize applications using Docker and containerd
- Optimize Docker images for size and security
- Configure multi-stage builds for efficient deployments
- Set up private container registries
- Implement container security scanning
- Build containerized development workflows

## When to use me

- When packaging applications for deployment
- When creating consistent development environments
- When migrating applications to Kubernetes
- When optimizing application delivery
- When implementing microservices
- When building CI/CD pipelines

## Key Concepts

### Dockerfile Best Practices

```dockerfile
# Multi-stage build for Go application
# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install dependencies first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build \
    -a -installsuffix cgo \
    -o main .

# Production stage
FROM alpine:3.18

# Install certificates
RUN apk --no-cache add ca-certificates

# Create non-root user
RUN adduser -D -u 1000 appuser

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/main .

# Switch to non-root user
USER appuser

EXPOSE 8080

CMD ["./main"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgres://db:5432/app
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    networks:
      - backend
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d app"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - backend

  cache:
    image: redis:7-alpine
    networks:
      - backend

volumes:
  postgres_data:

networks:
  backend:
    driver: bridge
```

### Image Optimization

```dockerfile
# Use specific tags, not latest
FROM node:20-alpine

# Use .dockerignore
# node_modules
# .git
# *.md
# tests/

# Combine RUN commands
RUN apk add --no-cache \
    && rm -rf /var/cache/apk/*

# Don't run as root
USER node

# Use COPY, not ADD (unless extracting archives)
COPY --chown=node:node package*.json ./
RUN npm ci --only=production

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
    CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1
```

### Security Scanning

```bash
# Scan for vulnerabilities
trivy image myapp:latest

# Scan with severity filter
trivy image --severity HIGH,CRITICAL myapp:latest

# Scan in CI/CD
docker scout cves myapp:latest

# Sysbox for secure containers
docker run --runtime=sysbox-runc myapp:latest
```

### Registry Configuration

```yaml
# Docker config for private registry
{
  "auths": {
    "registry.example.com": {
      "username": "deploy",
      "password": "${REGISTRY_PASSWORD}"
    }
  },
  "experimental": "disabled",
  "debug": "false"
}
```
