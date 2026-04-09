# API Documentation

> **Complete REST, WebSocket, and SSE API reference for Agent Gateway**

This document provides comprehensive API documentation for the Agent Gateway HTTP server. It covers all REST endpoints, WebSocket events, Server-Sent Events (SSE) streaming, authentication, error responses, and Prometheus metrics. Use this reference to integrate Agent Gateway into your applications, build custom clients, or monitor the gateway programmatically.

---

## Table of Contents

- [Overview](#overview)
- [Server Configuration](#server-configuration)
- [Authentication](#authentication)
- [REST API Reference](#rest-api-reference)
- [WebSocket API](#websocket-api)
- [SSE Streaming API](#sse-streaming-api)
- [Error Response Format](#error-response-format)
- [Rate Limiting](#rate-limiting)
- [Prometheus Metrics](#prometheus-metrics)
- [Distributed Tracing](#distributed-tracing)
- [CORS Configuration](#cors-configuration)
- [Health Checks](#health-checks)
- [Integration Examples](#integration-examples)
- [API Versioning](#api-versioning)
- [Testing the API](#testing-the-api)

---

## Overview

The Agent Gateway exposes an HTTP server (built on Express) and a WebSocket server on a configurable port (default: `3000`). The API provides three primary interaction patterns:

1. **REST API**: Synchronous request-response for management operations and fire-and-forget message sending
2. **WebSocket API**: Real-time bidirectional communication for interactive sessions
3. **SSE Streaming**: Server-pushed streaming responses for long-running AI generation

The server implementation lives in `/home/runner/workspace/agent-gateway/src/server/index.ts` with routing and middleware configured through the gateway orchestrator at `/home/runner/workspace/agent-gateway/src/gateway/index.ts`.

---

## Server Configuration

### Host and Port

```jsonc
// agent-gateway.config.json
{
  "host": "0.0.0.0",  // Bind address (default)
  "port": 3000         // Listen port (default)
}
```

Override via environment variables:

```bash
export HOST=127.0.0.1
export PORT=8080
```

### TLS Configuration

For production deployments, terminate TLS at a reverse proxy (nginx, Caddy, or a cloud load balancer). Agent Gateway itself does not handle TLS directly.

---

## Authentication

### API Key Authentication

When authentication is enabled, all API endpoints (except health checks) require an API key:

```jsonc
{
  "auth": {
    "enabled": true,
    "apiKey": "your-secret-key"
  }
}
```

Pass the API key via the `Authorization` header:

```bash
curl -H "Authorization: Bearer your-secret-key" http://localhost:3000/api/status
```

### WebSocket Authentication

WebSocket connections authenticate by including the token in the connection URL:

```
ws://localhost:3000/ws?token=your-secret-key
```

### Unauthenticated Endpoints

The following endpoints do not require authentication:

- `GET /health`
- `GET /healthz`
- `GET /ready`
- `GET /metrics` (can be restricted via configuration)

---

## REST API Reference

### Health Checks

#### `GET /health`

Returns the health status of the gateway.

**Response:**

```json
{ "status": "ok" }
```

**Status codes:**

| Code | Meaning |
|------|---------|
| 200 | Gateway is healthy |
| 503 | Gateway is unhealthy |

#### `GET /healthz`

Kubernetes-style health check. Identical to `/health`.

#### `GET /ready`

Readiness probe. Returns `200` when all configured channels and providers are connected.

---

### Gateway Status

#### `GET /api/status`

Returns comprehensive status of the gateway including active channels, providers, and sessions.

**Response:**

```json
{
  "channels": ["telegram", "discord"],
  "providers": ["openai", "anthropic"],
  "sessions": {
    "active": 42,
    "total": 156
  },
  "uptime": 3600,
  "version": "1.0.0"
}
```

---

### Session Management

#### `GET /api/sessions`

Lists all active sessions with their metadata.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `channel` | string | Filter by channel type |
| `userId` | string | Filter by user ID |
| `limit` | number | Maximum results (default: 100) |
| `offset` | number | Pagination offset |

**Response:**

```json
{
  "sessions": [
    {
      "id": "sess-abc123",
      "channel": "telegram",
      "userId": "123456789",
      "provider": "openai",
      "messageCount": 15,
      "createdAt": 1712345678000,
      "lastActivity": 1712349278000
    }
  ],
  "total": 42,
  "limit": 100,
  "offset": 0
}
```

---

### Message Sending

#### `POST /api/send`

Sends a message through a specific channel, triggering the AI agent response pipeline.

**Request Body:**

```json
{
  "channel": "telegram",
  "chatId": "123456789",
  "message": "What is the weather today?"
}
```

**Fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `channel` | string | Yes | Channel identifier (telegram, discord, slack, etc.) |
| `chatId` | string | Yes | Chat/conversation identifier |
| `message` | string | Yes | User message text |
| `provider` | string | No | Override default provider |
| `sessionId` | string | No | Use existing session ID |
| `metadata` | object | No | Arbitrary metadata attached to the request |

**Response:**

```json
{
  "success": true,
  "sessionId": "sess-abc123",
  "response": "The weather today is sunny with a high of 25C."
}
```

**Status codes:**

| Code | Meaning |
|------|---------|
| 200 | Message sent and response received |
| 400 | Invalid request body |
| 401 | Authentication required |
| 404 | Channel not found |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

**Example:**

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "channel": "telegram",
    "chatId": "123456789",
    "message": "Hello, what can you do?"
  }'
```

---

### SSE Streaming

#### `POST /api/stream`

Sends a message and receives the AI response as a Server-Sent Events stream. Tokens are streamed as they are generated by the provider.

**Request Body:** Same as `POST /api/send`

**Response:** SSE stream with the following event types:

```
event: token
data: {"token": "The", "index": 0}

event: token
data: {"token": " weather", "index": 1}

event: done
data: {"sessionId": "sess-abc123", "totalTokens": 42}

event: error
data: {"message": "Provider error", "code": "PROVIDER_ERROR"}
```

**Example:**

```bash
curl -X POST http://localhost:3000/api/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secret-key" \
  -d '{
    "channel": "telegram",
    "chatId": "123456789",
    "message": "Write a poem about clouds"
  }'
```

---

### Distributed Tracing

#### `GET /api/traces`

Returns recent distributed trace spans for debugging.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `limit` | number | Maximum traces (default: 50) |
| `errors` | boolean | Only return error traces |
| `operation` | string | Filter by operation name |

**Response:**

```json
{
  "traces": [
    {
      "id": "trace-001",
      "operation": "message.process",
      "duration": 245,
      "status": "ok",
      "spans": [
        { "name": "channel.receive", "duration": 5 },
        { "name": "session.load", "duration": 12 },
        { "name": "provider.chat", "duration": 220 },
        { "name": "channel.send", "duration": 8 }
      ]
    }
  ]
}
```

---

## WebSocket API

### Connection

Connect to the WebSocket endpoint:

```
ws://localhost:3000/ws
```

With authentication:

```
ws://localhost:3000/ws?token=your-secret-key
```

### Message Format

All WebSocket messages follow this structure:

```typescript
interface WSMessage {
  type: string;    // Message type identifier
  channel?: string; // Target/source channel
  chatId?: string;  // Chat identifier
  content?: string; // Message content
  metadata?: object; // Optional metadata
  id?: string;      // Correlation ID
}
```

### Client-to-Server Messages

#### `message` -- Send a message

```json
{
  "type": "message",
  "channel": "telegram",
  "chatId": "123456789",
  "content": "Hello from WebSocket!",
  "id": "client-msg-001"
}
```

#### `ping` -- Keep-alive heartbeat

```json
{ "type": "ping" }
```

### Server-to-Client Messages

#### `response` -- Agent response

```json
{
  "type": "response",
  "channel": "telegram",
  "chatId": "123456789",
  "content": "Hello! How can I help you?",
  "sessionId": "sess-abc123",
  "id": "client-msg-001"  // Correlates to request
}
```

#### `pong` -- Heartbeat reply

```json
{ "type": "pong" }
```

#### `error` -- Error notification

```json
{
  "type": "error",
  "message": "Channel 'telegram' is not connected",
  "code": "CHANNEL_NOT_CONNECTED"
}
```

#### `token` -- Streaming token (when streaming enabled)

```json
{
  "type": "token",
  "content": "Hello",
  "index": 0,
  "sessionId": "sess-abc123"
}
```

### WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `message` | Client -> Server | Send a message through a channel |
| `response` | Server -> Client | AI agent response |
| `token` | Server -> Client | Streaming token chunk |
| `ping` | Client -> Server | Heartbeat request |
| `pong` | Server -> Client | Heartbeat response |
| `error` | Server -> Client | Error notification |
| `session:created` | Server -> Client | New session created |
| `channel:connected` | Server -> Client | Channel connection established |
| `channel:disconnected` | Server -> Client | Channel connection lost |

---

## SSE Streaming API

The SSE streaming endpoint (`POST /api/stream`) uses the standard Server-Sent Events protocol:

### Connection

```bash
curl -N http://localhost:3000/api/stream \
  -H "Content-Type: application/json" \
  -d '{ "channel": "telegram", "chatId": "123", "message": "Hello" }'
```

### Event Types

| Event | Data | Description |
|-------|------|-------------|
| `token` | `{ token: string, index: number }` | Single token chunk |
| `tool_call` | `{ name: string, args: object }` | Tool call initiated |
| `tool_result` | `{ name: string, result: string }` | Tool call completed |
| `done` | `{ sessionId: string, totalTokens: number }` | Stream completed |
| `error` | `{ message: string, code: string }` | Stream error |

### Reconnection

SSE clients can use the `Last-Event-ID` header for automatic reconnection. The server tracks the last sent event ID and can resume from that point.

---

## Error Response Format

All API errors follow a consistent JSON format:

```json
{
  "success": false,
  "error": {
    "code": "CHANNEL_NOT_FOUND",
    "message": "Channel 'telegram' is not connected or does not exist",
    "details": {
      "availableChannels": ["discord", "slack"]
    }
  },
  "timestamp": 1712345678000
}
```

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `INVALID_REQUEST` | 400 | Malformed request body or missing required fields |
| `AUTH_REQUIRED` | 401 | Authentication credentials missing or invalid |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `CHANNEL_NOT_FOUND` | 404 | Specified channel is not available |
| `PROVIDER_NOT_FOUND` | 404 | Specified provider is not available |
| `SESSION_NOT_FOUND` | 404 | Session ID does not exist |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit exceeded -- retry after delay |
| `PROVIDER_ERROR` | 500 | AI provider returned an error |
| `CHANNEL_ERROR` | 500 | Channel adapter encountered an error |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Rate Limiting

### Headers

Rate-limited responses include these headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Maximum requests per window |
| `X-RateLimit-Remaining` | Remaining requests in current window |
| `X-RateLimit-Reset` | Unix timestamp when the window resets |
| `Retry-After` | Seconds to wait before retrying (only on 429) |

### Configuration

Rate limits are configured in the gateway config:

```jsonc
{
  "rateLimit": {
    "global": { "points": 100, "duration": 60 },   // 100 req/min globally
    "perUser": { "points": 20, "duration": 60 }     // 20 req/min per user
  }
}
```

---

## Prometheus Metrics

Available at `GET /metrics`. Key metrics:

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | `path`, `method`, `status` | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | `path`, `method` | Request latency |
| `messages_total` | Counter | `channel` | Messages processed per channel |
| `api_calls_total` | Counter | `provider` | AI provider API calls |
| `tokens_used_total` | Counter | `provider` | Estimated token usage |
| `active_sessions` | Gauge | -- | Currently active sessions |
| `cache_hits_total` | Counter | `cache` | Cache hits |
| `cache_misses_total` | Counter | `cache` | Cache misses |
| `tool_executions_total` | Counter | `tool` | Tool calls by name |
| `errors_total` | Counter | `type` | Errors by category |
| `uptime_seconds` | Gauge | -- | Server uptime |

---

## Distributed Tracing

The gateway includes a lightweight in-memory `Tracer` class:

- Spans are created for: message processing, provider calls, tool executions, channel operations
- Each span records: name, duration, status, parent span ID, error information
- Traces are accessible via `GET /api/traces`
- Filter error spans for debugging: `GET /api/traces?errors=true`

---

## CORS Configuration

CORS headers are set on all responses:

| Header | Value |
|--------|-------|
| `Access-Control-Allow-Origin` | `*` (configurable) |
| `Access-Control-Allow-Methods` | `GET, POST, OPTIONS` |
| `Access-Control-Allow-Headers` | `Content-Type, Authorization` |
| `Access-Control-Max-Age` | `86400` (24 hours) |

For production, restrict the origin to specific domains.

---

## Health Checks

### Liveness Probe (`/health`)

Checks that the server process is running. Returns `200` immediately.

### Readiness Probe (`/ready`)

Checks that the server is running AND all configured channels and providers are connected. Returns `200` only when fully operational.

### Kubernetes Configuration

```yaml
livenessProbe:
  httpGet:
    path: /healthz
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /ready
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

---

## Integration Examples

### Node.js Client

```typescript
import { Gateway, createGateway } from '/home/runner/workspace/agent-gateway/src/index.js';

const gw = createGateway({ host: '0.0.0.0', port: 3000 });
await gw.start();

// Send a message programmatically
const session = gw.createSession('telegram', 'user123', 'openai');
```

### Python Client

```python
import requests

response = requests.post(
    'http://localhost:3000/api/send',
    headers={'Authorization': 'Bearer your-secret-key'},
    json={
        'channel': 'telegram',
        'chatId': '123456789',
        'message': 'Hello!'
    }
)
print(response.json()['response'])
```

### Browser WebSocket

```javascript
const ws = new WebSocket('ws://localhost:3000/ws?token=your-secret-key');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'message',
    channel: 'telegram',
    chatId: '123456789',
    content: 'Hello from browser!'
  }));
};

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'response') {
    console.log('Agent:', msg.content);
  }
};
```

---

## API Versioning

The gateway supports API versioning through the `ApiVersionManager`:

- Versions are managed via `createApiVersionManager()` from `/home/runner/workspace/agent-gateway/src/api-versioning/index.ts`
- Route versioning allows backward-compatible API evolution
- Use the `X-API-Version` header to request a specific version

---

## Testing the API

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# Send a message
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{"channel":"telegram","chatId":"123","message":"Hello"}'

# Get metrics
curl http://localhost:3000/metrics

# Get traces
curl http://localhost:3000/api/traces
```

### Using the CLI

```bash
cd /home/runner/workspace/agent-gateway
agent-gateway server    # Start the server
agent-gateway status    # Check status
agent-gateway config list  # View configuration
```

### Using Vitest

API integration tests are located in `/home/runner/workspace/agent-gateway/test/`. Run with:

```bash
npm run test
```
