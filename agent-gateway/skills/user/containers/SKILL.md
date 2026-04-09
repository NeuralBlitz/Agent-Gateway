---
name: containers
description: Containerization technology for application packaging, isolation, and deployment
license: MIT
compatibility:
  - docker
  - containerd
  - cri-o
  - podman
audience: DevOps engineers, backend developers, platform engineers
category: cloud-computing
---

# Containers

## What I Do

I provide expertise in containerization technology - the lightweight form of virtualization that packages applications with their dependencies into portable, isolated execution environments. Containers share the host OS kernel but maintain process and filesystem isolation, enabling consistent application deployment across different environments. I cover container creation, orchestration integration, security hardening, and operational best practices for production container workloads.

## When to Use Me

- Packaging microservices or monolithic applications for consistent deployment
- Creating reproducible development environments that match production
- Isolating dependencies for applications with conflicting library requirements
- Scaling applications horizontally with container orchestration platforms
- Implementing blue-green or canary deployment strategies
- Building CI/CD pipelines with container-based build agents
- Creating reproducible data science and ML experiment environments
- Modernizing legacy applications for cloud deployment

## Core Concepts

- **Container Images**: Immutable layered filesystems containing application code, runtime, libraries, and dependencies built from Dockerfiles
- **Container Registries**: Repositories for storing and distributing container images (Docker Hub, ECR, GCR, private registries)
- **Container Orchestration**: Systems for managing container lifecycle, scaling, networking, and service discovery (Kubernetes, Docker Swarm)
- **Container Networking**: Virtual network interfaces enabling communication between containers and external systems
- **Container Storage**: Persistent data management through volumes and volume drivers
- **Container Security**: Scanning images for vulnerabilities, using minimal base images, running as non-root users, and implementing least-privilege access
- **Multi-stage Builds**: Optimizing image size by separating build and runtime environments
- **Container Runtime**: The software executing containers (containerd, CRI-O, runc)
- **Health Checks**: Liveness, readiness, and startup probes for container health monitoring
- **Resource Limits**: CPU and memory constraints preventing container resource exhaustion

## Code Examples

### Dockerfile with Multi-stage Build

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy from build stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
```

### Docker Compose for Multi-container Application

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://user:pass@db:5432/app
      - REDIS_URL=redis://cache:6379
    depends_on:
      db:
        condition: service_healthy
      cache:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    restart: unless-stopped
    networks:
      - app-network
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M

  db:
    image: postgres:15-alpine
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=app
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d app"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  cache:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  postgres-data:
  redis-data:
```

### Container Security Scanning Script

```bash
#!/bin/bash
set -e

IMAGE_NAME="${1:-myapp:latest}"
TRIVY_SERVER="${TRIVY_SERVER:-}"

echo "Scanning container image: ${IMAGE_NAME}"

if [ -n "${TRIVY_SERVER}" ]; then
    trivy --server "${TRIVY_SERVER}" image --severity HIGH,CRITICAL "${IMAGE_NAME}"
else
    trivy image --severity HIGH,CRITICAL "${IMAGE_NAME}"
fi

# Check for best practices
echo ""
echo "Running Docker Bench Security..."

docker run --rm -it \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "$(pwd)":/docker-bench-security/output \
    docker-bench-security

# Check for outdated base images
echo ""
echo "Checking for outdated base images..."
docker inspect "${IMAGE_NAME}" --format '{{.Config.Image}}'
```

### Kubernetes Pod with Security Context

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
  labels:
    app: secure-app
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    runAsGroup: 1001
    fsGroup: 1001
  containers:
    - name: app
      image: myapp:latest
      ports:
        - containerPort: 3000
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL
      resources:
        requests:
          memory: "128Mi"
          cpu: "100m"
        limits:
          memory: "256Mi"
          cpu: "200m"
      env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: host
      volumeMounts:
        - name: tmp
          mountPath: /tmp
        - name: cache
          mountPath: /app/.cache
  volumes:
    - name: tmp
      emptyDir: {}
    - name: cache
      emptyDir: {}
  restartPolicy: Always
```

### Distroless Container Image

```dockerfile
FROM gcr.io/distroless/nodejs20-debian12:nonroot AS production

WORKDIR /app

COPY --chown=nonroot:nonroot --chmod=755 package*.json ./
COPY --chown=nonroot:nonroot --chmod=755 dist/ ./dist/
COPY --chown=nonroot:nonroot --chmod=755 node_modules/ ./node_modules/

USER nonroot

EXPOSE 3000

CMD ["dist/index.js"]
```

## Best Practices

- Use minimal base images like Alpine, Distroless, or Chainguard to reduce attack surface
- Implement multi-stage builds to keep production images small and separate build dependencies
- Run containers as non-root users with least-privilege access principles
- Use read-only root filesystems where possible to prevent tampering
- Scan container images for vulnerabilities during CI/CD pipelines before deployment
- Pin exact image versions instead of using `latest` tags for reproducibility
- Implement proper signal handling with init systems like dumb-init or tini
- Use health checks (liveness, readiness, startup probes) for reliable container management
- Set appropriate resource limits (CPU, memory) to prevent resource exhaustion
- Store sensitive information in secrets or external secret management systems, never in images
- Regularly update base images and dependencies to patch security vulnerabilities
- Use container-specific vulnerability scanning tools (Trivy, Clair, Snyk)
- Implement container signing and verification for supply chain security
- Use private container registries with access controls and image scanning
- Monitor container behavior and implement logging with structured log formats

## Common Patterns

- **Sidecar Pattern**: Deploy auxiliary containers alongside main application containers for logging, monitoring, or security agents
- **Adapter Pattern**: Normalize application output or metrics through adapter containers
- **Ambassador Pattern**: Proxy network connections through ambassador containers for external service access
- **Init Containers**: Run setup or initialization tasks before main application containers start
- **Ephemeral Containers**: Temporary containers for debugging running pods without modifying deployment
- **Image Caching**: Leverage Docker layer caching in CI/CD to speed up builds
- **BuildKit**: Use Docker BuildKit for parallel builds, improved caching, and advanced features
