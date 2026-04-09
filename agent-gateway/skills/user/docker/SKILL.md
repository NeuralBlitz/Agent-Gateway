---
name: docker
description: Docker containerization for application packaging, isolation, and deployment
license: MIT
compatibility: opencode
metadata:
  audience: devops
  category: containers
---
## What I do
- Write Dockerfiles for various languages
- Optimize images for production
- Create docker-compose files for local dev
- Build multi-stage builds
- Manage volumes and networks
- Set up container orchestration
- Implement security best practices

## When to use me
When containerizing applications or setting up development environments.

## Multi-stage Build (Node.js)
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./

USER appuser
EXPOSE 3000

CMD ["node", "dist/main.js"]
```

## Multi-stage Build (Go)
```dockerfile
# Build stage
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o main .

# Production stage
FROM alpine:3.18
RUN apk --no-cache add ca-certificates
WORKDIR /app
COPY --from=builder /app/main .
EXPOSE 8080
CMD ["./main"]
```

## Python with uv
```dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install uv
RUN pip install uv

# Copy requirements first for better caching
COPY requirements.txt .
RUN uv pip install --system --no-cache -r requirements.txt

COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0"]
```

## Docker Compose
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/mydb
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./data:/app/data
    networks:
      - backend

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: mydb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - backend

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    networks:
      - backend

volumes:
  postgres_data:
  redis_data:

networks:
  backend:
```

## Security Best Practices
```dockerfile
# Use specific version tags
FROM node:20.11.0-alpine3.19

# Don't run as root
RUN addgroup -g 1001 -S appgroup && \
    adduser -u 1001 -S appuser -G appgroup

# Set ownership
COPY --chown=appuser:appgroup . .

USER appuser

# Read-only filesystem (where possible)
# docker run --read-only ...
```

## Docker Commands
```bash
# Build
docker build -t myapp:latest .

# Run
docker run -d -p 3000:3000 --name myapp myapp:latest

# Compose
docker compose up -d
docker compose logs -f
docker compose down

# Inspect
docker ps
docker logs myapp
docker exec -it myapp sh

# Cleanup
docker system prune -af
```
