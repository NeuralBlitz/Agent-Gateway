# Server (`src/server/`)

> **Express HTTP + WebSocket server — REST API, SSE, webhooks, and the main startup orchestrator.**

---

## Overview

The `server/` module is responsible for the HTTP/WebSocket surface of Agent Gateway. It contains two main pieces:

1. **`AgentServer` class**: An Express-based HTTP server that provides health checks, REST API endpoints, SSE streaming, WebSocket, and webhook routes for all channels.
2. **`createAndStartServer()` function**: The main startup orchestrator that creates the Gateway, SessionManager, registers all channels/providers, creates the ToolRegistry, BaseAgent, PluginLoader, AutoReply, and then starts the HTTP server.

For most users, `createAndStartServer()` is the single function they need — it bootstraps the entire system.

---

## File Structure

```
server/
└── index.ts    # AgentServer class + createAndStartServer() orchestrator
```

---

## The `AgentServer` Class

### Core Responsibilities

- Health and readiness probes
- Prometheus metrics endpoint
- REST API for status, sessions, and messaging
- Server-Sent Events (SSE) streaming
- WebSocket connections
- Webhook route registration for all channels

### Health Endpoints

| Endpoint | Method | Response | Use Case |
|----------|--------|----------|----------|
| `/health` | GET | `{ "status": "ok" }` | General health check |
| `/healthz` | GET | `{ "status": "ok" }` | Kubernetes liveness probe |
| `/ready` | GET | `{ "ready": true }` | Kubernetes readiness probe |

These endpoints return immediately with minimal overhead. They do NOT perform database or external service checks — they simply confirm the HTTP server is running.

### Metrics Endpoint

| Endpoint | Method | Content-Type |
|----------|--------|-------------|
| `/metrics` | GET | `text/plain` (Prometheus format) |

Exposes all Prometheus metrics registered by the observability module. See `src/observability/` for the full metric list.

### REST API Endpoints

#### `GET /api/status`

Returns the current gateway status:

```json
{
  "running": true,
  "channels": ["telegram", "discord"],
  "providers": ["openai"],
  "sessions": 42,
  "uptime": 86400
}
```

#### `GET /api/sessions`

Lists all active sessions:

```json
{
  "sessions": [
    {
      "id": "telegram:123456",
      "channelId": "telegram",
      "userId": "123456",
      "messageCount": 15,
      "createdAt": "2024-01-01T00:00:00Z",
      "lastActive": "2024-01-01T01:00:00Z"
    }
  ]
}
```

#### `POST /api/send`

Send a message through the gateway programmatically:

```json
{
  "channel": "telegram",
  "chatId": "123456",
  "message": "What is the weather today?",
  "userId": "user123"
}
```

Response:
```json
{
  "response": "The weather today is...",
  "sessionId": "telegram:123456"
}
```

#### `POST /api/stream`

Send a message with Server-Sent Events (SSE) streaming response:

```json
{
  "channel": "telegram",
  "chatId": "123456",
  "message": "Write a long story about..."
}
```

The response is streamed as SSE events with `text/event-stream` content type. Each chunk of the AI response is sent as a separate SSE event.

#### `GET /api/traces`

Returns recent distributed tracing spans for debugging:

```json
{
  "traces": [
    {
      "id": "span-123",
      "name": "processMessage",
      "startTime": 1704067200000,
      "endTime": 1704067205000,
      "status": "ok",
      "events": [...]
    }
  ]
}
```

Query parameters:
- `limit` — Number of traces to return (default: 50)
- `errors` — Filter to error-only traces (`true`/`false`)

### WebSocket Endpoint

**Path**: `/ws`

The WebSocket endpoint provides real-time bidirectional communication with the gateway.

#### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000/ws');
```

#### Message Format (Client → Server)

```json
{
  "type": "message",
  "channel": "telegram",
  "chatId": "123456",
  "content": "Hello from WebSocket!",
  "userId": "user123"
}
```

#### Message Format (Server → Client)

```json
{
  "type": "response",
  "content": "Hello! How can I help you?",
  "sessionId": "telegram:123456"
}
```

#### Heartbeat

The server sends periodic `ping` messages. Clients should respond with `pong` to keep the connection alive. Connections that fail to respond to pings are terminated after a timeout.

#### Event Types

| Type | Direction | Description |
|------|-----------|-------------|
| `message` | Client → Server | Send a message through a channel |
| `response` | Server → Client | Agent response to a message |
| `error` | Server → Client | Error notification |
| `ping` | Server → Client | Heartbeat ping |
| `pong` | Client → Server | Heartbeat pong response |
| `session_update` | Server → Client | Session state changed |

### Webhook Routes

The server registers webhook routes for each channel type. These routes accept incoming HTTP POST requests from the messaging platforms.

| Path Pattern | Channel | Description |
|-------------|---------|-------------|
| `/webhook/telegram/:botId` | Telegram | Telegram Bot API webhook updates |
| `/webhook/discord/:channelId` | Discord | Discord gateway events |
| `/webhook/slack/events` | Slack | Slack event API callbacks |
| `/webhook/whatsapp` | WhatsApp | Meta WhatsApp API webhook |

Webhook processing:
1. Parse the request body
2. Validate any secret tokens/signatures
3. Convert platform-specific format to `ChannelMessage`
4. Route through the Gateway's `handleMessage()`
5. Send the AI response back through the channel

---

## The `createAndStartServer()` Orchestrator

This is the **main startup function** that bootstraps the entire Agent Gateway system. It performs the following steps in order:

### Step 1: Load Configuration
```typescript
const config = getConfig();
```

Loads configuration from environment variables and JSON config file, validated by Zod.

### Step 2: Create Gateway
```typescript
const gateway = new Gateway(config);
```

Creates the central Gateway orchestrator with the loaded configuration.

### Step 3: Create Session Manager
```typescript
const sessionManager = createSessionManager(config);
```

Creates the appropriate session persistence backend based on configuration:
- File-based (atomic JSON writes)
- Database (libsql/SQLite)
- Redis (distributed)
- In-memory (volatile)

### Step 4: Set Up Hooks
```typescript
const hooks = getHooks();
// Register global hooks
```

Initializes the lifecycle hook system and registers any configured global hooks.

### Step 5: Register Channels
```typescript
registerBuiltinChannels(gateway, config);
```

Iterates through configured channels in the config and creates/registers each one. Only channels with valid credentials are registered.

### Step 6: Register Providers
```typescript
registerBuiltinProviders(gateway, config);
```

Iterates through configured providers and creates/registers each one. Only providers with valid API keys are registered.

### Step 7: Create Tool Registry
```typescript
const toolRegistry = new ToolRegistry(config);
```

Creates the tool registry with built-in tools:
- Bash execution (if not disabled)
- Filesystem operations (if not disabled)
- Web search (if not disabled)

### Step 8: Create Agent
```typescript
const agent = createAgent({
  provider: primaryProvider,
  tools: toolRegistry,
  maxSteps: config.agent.maxSteps,
  systemPrompt: config.systemPrompt,
});
```

Creates the primary BaseAgent with the configured provider, tools, and parameters.

### Step 9: Load Plugins
```typescript
const pluginLoader = new PluginLoader(config);
await pluginLoader.load();
```

Dynamically imports and initializes all configured npm plugins. Plugins can register additional channels, providers, tools, and hooks.

### Step 10: Create Auto-Reply Handler
```typescript
const autoReply = new AutoReply(gateway, agent, config);
```

Creates the auto-reply handler that connects channel messages to the agent's tool-calling loop.

### Step 11: Start HTTP Server
```typescript
const server = new AgentServer(gateway, config);
await server.start();
```

Creates and starts the Express HTTP server with all endpoints.

### Step 12: Graceful Shutdown
```typescript
process.on('SIGINT', async () => {
  await gateway.stop();
  await server.stop();
  process.exit(0);
});
```

Registers signal handlers for graceful shutdown on `SIGINT` and `SIGTERM`.

---

## Server Configuration

| Config Key | Type | Default | Description |
|------------|------|---------|-------------|
| `host` | `string` | `"0.0.0.0"` | HTTP server bind address |
| `port` | `number` | `3000` | HTTP server port |
| `cors` | `object` | `{ origin: "*" }` | CORS configuration |
| `auth.enabled` | `boolean` | `false` | Whether to require API key auth |
| `auth.apiKey` | `string` | — | API key for authenticated endpoints |
| `ws.enabled` | `boolean` | `true` | Whether to enable WebSocket |
| `ws.path` | `string` | `"/ws"` | WebSocket endpoint path |
| `webhooks.enabled` | `boolean` | `true` | Whether to register webhook routes |
| `webhooks.secret` | `string` | — | Shared secret for webhook validation |
| `static.enabled` | `boolean` | `true` | Whether to serve static files from `public/` |

---

## Middleware Stack

The Express server applies the following middleware in order:

1. **CORS** — Cross-origin resource sharing headers
2. **JSON parsing** — `express.json()` for request body parsing
3. **Metrics middleware** — Records request duration and count for Prometheus
4. **Auth middleware** (optional) — Validates API key for protected routes
5. **Rate limiting** — Applies rate limits per IP/user
6. **Static files** — Serves `public/` directory (if enabled)
7. **Route handlers** — The actual endpoint handlers
8. **Error handler** — Catches unhandled errors and returns 500 JSON responses

---

## Error Responses

All API errors return consistent JSON error objects:

```json
{
  "error": {
    "code": "CHANNEL_NOT_FOUND",
    "message": "Channel 'telegram' is not registered",
    "status": 404
  }
}
```

Common error codes:
- `CHANNEL_NOT_FOUND` — Requested channel doesn't exist
- `PROVIDER_NOT_FOUND` — No provider available
- `SESSION_NOT_FOUND` — Session doesn't exist
- `AUTH_REQUIRED` — API key missing or invalid
- `RATE_LIMITED` — Request rate exceeded
- `INTERNAL_ERROR` — Unexpected server error

---

## Usage Example

### Minimal: Using `createAndStartServer()`

```typescript
import { createAndStartServer } from 'agent-gateway';

// This bootstraps everything — just call it
await createAndStartServer();
console.log('Gateway is running!');
```

### Advanced: Manual Server Construction

```typescript
import { AgentServer, Gateway, Config } from 'agent-gateway';

const config = getConfig();
const gateway = new Gateway(config);

// Manually register components
gateway.registerChannel('telegram', telegramChannel);
gateway.registerProvider('openai', openaiProvider);
gateway.registerAgent('default', agent);

// Start server
const server = new AgentServer(gateway, config);
await server.start();
```

---

## Related Documentation

- [`gateway/`](../gateway/README.md) — The Gateway class used by AgentServer
- [`agents/`](../agents/README.md) — Agents created by the orchestrator
- [`channels/`](../channels/README.md) — Channels registered by the orchestrator
- [`providers/`](../providers/README.md) — Providers registered by the orchestrator
- [`hooks/`](../hooks/README.md) — Lifecycle hooks
- [`observability/`](../observability/README.md) — Prometheus metrics middleware
- [`auth/`](../auth/README.md) — Authentication middleware
- [`ratelimit/`](../ratelimit/README.md) — Rate limiting middleware
- [`webhooks/`](../webhooks/README.md) — Webhook processing
- [`streaming/`](../streaming/README.md) — SSE streaming support
- [`plugins/`](../plugins/README.md) — Plugin loading
