---
name: docker
description: Docker containerization for application packaging, isolation, and deployment
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: systems-administration
---

## What I do
- Create Docker images with Dockerfiles
- Manage containers and multi-container applications
- Configure Docker networking and volumes
- Implement container security
- Optimize image sizes with multi-stage builds
- Use Docker Compose for local development
- Manage Docker registries
- Implement health checks and logging
- Handle container orchestration basics
- Debug container issues

## When to use me
When containerizing applications, creating Docker images, managing containers locally or in CI/CD pipelines.

## Core Concepts
- Dockerfile instructions and best practices
- Multi-stage builds for optimization
- Container networking (bridge, host, overlay)
- Volume management and bind mounts
- Docker Compose for multi-container apps
- Image layering and caching
- Container security (non-root, seccomp, capabilities)
- Health checks and restart policies
- Registry operations and image scanning
- Docker daemon configuration

## Code Examples

### Dockerfile Examples
```dockerfile
# Multi-stage build for Go application
# ======== BUILDER STAGE ========
FROM golang:1.21-alpine AS builder

WORKDIR /build

# Copy go modules first for better caching
COPY go.mod go.sum ./
RUN go mod download && go mod verify

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build \
    -ldflags="-s -w" \
    -o /app/server \
    ./cmd/server

# ======== RUNTIME STAGE ========
FROM alpine:3.19 AS runtime

# Install minimal runtime dependencies
RUN apk --no-cache add \
    ca-certificates \
    tzdata \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1000 appgroup && \
    adduser -u 1000 -G appgroup -s /bin/sh -D appuser

# Set working directory
WORKDIR /home/appuser

# Copy binary from builder
COPY --from=builder /app/server .

# Create data directory
RUN mkdir -p /home/appuser/data && chown -R appuser:appgroup /home/appuser

# Switch to non-root user
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Expose application port
EXPOSE 8080

# Set environment variables
ENV APP_ENV=production
ENV APP_PORT=8080

# Run the application
ENTRYPOINT ["/app/server"]
```

```dockerfile
# Multi-service application with Docker Compose
# Frontend service
FROM node:20-alpine AS frontend-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose Configuration
```yaml
version: "3.8"

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    image: myapp:${VERSION:-latest}
    container_name: myapp
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/myapp
      - REDIS_URL=redis://cache:6379
      - APP_ENV=production
    env_file:
      - .env.production
    volumes:
      - app-data:/home/appuser/data
      - ./logs:/home/appuser/logs
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    networks:
      - app-network
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:8080/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
    logging:
      driver: "json-file"
      options:
        max-size: "100m"
        max-file: "5"

  db:
    image: postgres:15-alpine
    container_name: myapp-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secret}
      POSTGRES_DB: myapp
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init-scripts:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d myapp"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  cache:
    image: redis:7-alpine
    container_name: myapp-cache
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: myapp-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx:/etc/nginx/conf.d
      - ./certs:/etc/nginx/certs
    depends_on:
      - app
    networks:
      - app-network

networks:
  app-network:
    driver: bridge
    ipam:
      config:
        - subnet: 10.10.0.0/24

volumes:
  app-data:
  postgres-data:
  redis-data:
```

### Container Management Scripts
```bash
#!/bin/bash
set -euo pipefail

# Docker utility functions
docker_cleanup() {
    echo "=== Docker Cleanup ==="
    
    # Stop all containers
    docker stop $(docker ps -aq) 2>/dev/null || true
    
    # Remove all containers
    docker rm $(docker ps -aq) 2>/dev/null || true
    
    # Remove dangling images
    docker rmi $(docker images -f "dangling=true" -q) 2>/dev/null || true
    
    # Remove unused volumes
    docker volume prune -f
    
    # Remove unused networks
    docker network prune -f
    
    # System prune
    docker system prune -af --volumes
    
    echo "Docker cleanup complete"
}

docker_health_monitor() {
    local container="${1:-}"
    
    echo "=== Docker Health Monitor ==="
    echo "Date: $(date)"
    
    if [ -n "$container" ]; then
        # Monitor specific container
        docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "Container not found"
        docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.PIDs}}" "$container"
    else
        # Monitor all containers
        echo "Running containers:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}\t{{.CPUPerc}}\t{{.MemPerc}}"
        
        echo ""
        echo "Container statistics:"
        docker stats --no-stream
    fi
}

docker_image_security_scan() {
    local image="${1}"
    
    echo "=== Security Scan for $image ==="
    
    # Check for latest tag (should not be used in production)
    if [[ "$image" == *":latest" ]]; then
        echo "WARNING: Using 'latest' tag is not recommended for production"
    fi
    
    # Check image size
    local size=$(docker image inspect "$image" --format='{{.Size}}')
    echo "Image size: $((size / 1024 / 1024)) MB"
    
    # Check for exposed ports
    docker inspect "$image" --format='{{range $k, $v := .Config.ExposedPorts}}{{$k}} {{end}}'
    
    # Check for non-root user
    local user=$(docker inspect "$image" --format='{{.Config.User}}' 2>/dev/null)
    if [ -z "$user" ] || [ "$user" = "root" ] || [ "$user" = "0" ]; then
        echo "WARNING: Container runs as root user"
    else
        echo "Runs as non-root user: $user"
    fi
    
    echo ""
    echo "Consider using external tools like Trivy or Clair for comprehensive scanning"
}

# Push with all tags
docker_push_all_tags() {
    local image="${1}"
    local registry="${2}"
    
    docker tag "$image" "$registry/$image:latest"
    docker push "$registry/$image:latest"
    
    # Get version from image
    local version=$(docker inspect "$image" --format='{{index .Config.Labels "version"}}' 2>/dev/null)
    if [ -n "$version" ]; then
        docker tag "$image" "$registry/$image:$version"
        docker push "$registry/$image:$version"
    fi
    
    echo "Pushed all tags for $image"
}
```

## Best Practices
- Use multi-stage builds to minimize final image size
- Always specify image tags, avoid using `latest`
- Run containers as non-root user
- Use `.dockerignore` to exclude unnecessary files
- Never include secrets in Dockerfiles or images
- Use named volumes instead of bind mounts for persistent data
- Implement health checks in your images
- Use specific image versions for reproducibility
- Keep base images updated for security patches
- Scan images for vulnerabilities before deployment
