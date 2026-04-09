FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source
COPY tsconfig.json ./
COPY src/ ./src/

# Build
RUN npm run build 2>/dev/null || npx tsc --outDir dist --noUnusedLocals false --noUnusedParameters false || true

# If build fails (tsdown issue), use tsc directly
RUN if [ ! -d "dist" ] || [ ! -f "dist/cli/index.js" ]; then \
    npx tsc --outDir dist --noUnusedLocals false --noUnusedParameters false; \
  fi

# Runtime stage
FROM node:22-alpine

WORKDIR /app

RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Copy built files
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

# Create session directory
RUN mkdir -p /app/.agent-sessions && chown -R appuser:appgroup /app

USER appuser

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
ENV AGENT_SESSIONS_DIR=/app/.agent-sessions

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/cli/index.js", "server"]
