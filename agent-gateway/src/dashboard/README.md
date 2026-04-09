# Dashboard (`src/dashboard/`)

> **WebSocket-based real-time dashboard for system metrics, logs, events, and live monitoring.**

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture](#architecture)
4. [Class API](#class-api)
5. [Supported Channels](#supported-channels)
6. [Usage Examples](#usage-examples)
7. [WebSocket Protocol](#websocket-protocol)
8. [Data Providers](#data-providers)
9. [Client Messages](#client-messages)
10. [Error Handling](#error-handling)
11. [Integration Points](#integration-points)
12. [Security Considerations](#security-considerations)
13. [Best Practices](#best-practices)
14. [Related Documentation](#related-documentation)

---

## Overview

The `dashboard/` module provides a **real-time, WebSocket-based monitoring dashboard** for the Agent Gateway. It enables live streaming of system metrics, logs, events, and operational data to any WebSocket-compatible client (web browsers, CLI tools, monitoring services).

### Key Features

- **WebSocket protocol** -- low-latency, bidirectional communication
- **Channel-based subscriptions** -- clients subscribe to specific data channels
- **Provider registry** -- pluggable data providers for each channel
- **Periodic broadcasting** -- configurable broadcast intervals per channel
- **Ad-hoc queries** -- clients can request on-demand data with filters
- **Push events** -- server can push events to subscribed clients at any time
- **Client management** -- track connected clients and their subscriptions
- **Graceful shutdown** -- clean disconnect of all clients

### Use Cases

| Scenario | Channel | Description |
|----------|---------|-------------|
| Live metrics | `metrics` | Real-time CPU, memory, request rates |
| Log streaming | `logs` | Tail application logs in the browser |
| Event monitoring | `events` | Business events (session starts, completions) |
| Session tracking | `sessions` | Active user sessions and their states |
| Health monitoring | `health` | Health check results for all providers |
| Performance tracking | `performance` | Latency percentiles, throughput |
| Alert streaming | `alerts` | Real-time alert notifications |
| Audit trail | `audit` | Configuration and admin action audit |

---

## File Structure

```
dashboard/
├── index.ts          # RealTimeDashboard class, factory, type definitions
```

The module is implemented in a single file (~190 lines) with the WebSocket server setup, channel management, provider registry, and broadcast logic all contained within the `RealTimeDashboard` class.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                        RealTimeDashboard                           │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    WebSocket Server                           │ │
│  │                                                              │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │ │
│  │  │ Client 1 │  │ Client 2 │  │ Client 3 │  ...             │ │
│  │  │ [metrics,│  │ [logs,   │  │ [health] │                  │ │
│  │  │  logs]   │  │  events] │  │          │                  │ │
│  │  └──────────┘  └──────────┘  └──────────┘                  │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                   Data Providers                              │ │
│  │                                                              │ │
│  │  metrics     ───► () => Promise<{ cpu, mem, reqs }>          │ │
│  │  logs        ───► () => Promise<LogEntry[]>                   │ │
│  │  events      ───► () => Promise<Event[]>                      │ │
│  │  sessions    ───► () => Promise<Session[]>                    │ │
│  │  health      ───► () => Promise<HealthCheck[]>                │ │
│  │  performance ───► () => Promise<PerfMetrics>                  │ │
│  │  alerts      ───► () => Promise<Alert[]>                      │ │
│  │  audit       ───► () => Promise<AuditEntry[]>                 │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                  Broadcast Timers                              │ │
│  │                                                              │ │
│  │  metrics:     every 5000ms  ──►  broadcastToChannel('metrics')│ │
│  │  logs:        every 2000ms  ──►  broadcastToChannel('logs')   │ │
│  │  health:      every 10000ms ──►  broadcastToChannel('health')  │ │
│  └──────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Client sends: {"type": "subscribe", "channel": "metrics"}
                        │
                        ▼
          Add channel to client's subscription set
                        │
                        ▼
          Send initial data: call provider for "metrics"
                        │
                        ▼
          Respond: {"type": "subscribed", "channel": "metrics"}
                        │
                        ▼
          If broadcast interval configured:
          Periodically call provider and send to all subscribers:
          {"type": "data", "channel": "metrics", "data": {...}, "timestamp": ...}
```

---

## Class API

### Types

```typescript
type DashboardChannel =
  | 'metrics'      // System and application metrics
  | 'logs'          // Application logs
  | 'events'        // Business events
  | 'sessions'      // Active sessions
  | 'health'        // Health check results
  | 'performance'   // Performance metrics
  | 'alerts'        // Alert notifications
  | 'audit';        // Audit trail events

interface DashboardSubscription {
  id: string;
  channel: string;
  filters?: Record<string, any>;
  intervalMs?: number;
}
```

### `RealTimeDashboard` Class

```typescript
class RealTimeDashboard extends EventEmitter {
  constructor()

  // Server setup
  attach(server: any, path?: string): void      // Attach to existing HTTP server
  listen(port: number): void                      // Create standalone WebSocket server

  // Provider registration
  registerProvider(
    channel: DashboardChannel,
    provider: () => Promise<any>,
    broadcastIntervalMs?: number,
  ): void

  // Push events to clients
  pushEvent(channel: DashboardChannel, data: any): void

  // Client info
  getClientCount(): number
  getSubscriptionCounts(): Record<string, number>

  // Shutdown
  close(): void
}
```

### Factory Function

```typescript
function createRealTimeDashboard(): RealTimeDashboard
```

---

## Supported Channels

| Channel | Purpose | Recommended Broadcast Interval |
|---------|---------|-------------------------------|
| `metrics` | CPU, memory, request rates, error rates | 5000ms |
| `logs` | Application log entries | 2000ms |
| `events` | Business events (sessions, completions) | On-demand (push) |
| `sessions` | Active user sessions and states | 10000ms |
| `health` | Provider health check results | 10000ms |
| `performance` | p50/p95/p99 latency, throughput | 5000ms |
| `alerts` | Alert notifications | On-demand (push) |
| `audit` | Configuration and admin actions | On-demand (push) |

---

## Usage Examples

### Basic Setup (Standalone Server)

```typescript
import { createRealTimeDashboard } from '../dashboard/index.js';

const dashboard = createRealTimeDashboard();

// Register a metrics provider
dashboard.registerProvider('metrics', async () => {
  const mem = process.memoryUsage();
  return {
    cpu: process.cpuUsage(),
    memory: {
      rss: mem.rss,
      heapUsed: mem.heapUsed,
      heapTotal: mem.heapTotal,
    },
    uptime: process.uptime(),
  };
}, 5000); // Broadcast every 5 seconds

// Register a logs provider
dashboard.registerProvider('logs', async () => {
  return getRecentLogs(50); // Last 50 log entries
}, 2000); // Broadcast every 2 seconds

// Start the WebSocket server
dashboard.listen(8081);
console.log('Dashboard WebSocket listening on ws://localhost:8081/dashboard/ws');
```

### Attach to Existing HTTP Server

```typescript
import http from 'http';
import { createRealTimeDashboard } from '../dashboard/index.js';

const app = createApp(); // Your Express/Fastify/Hono app
const server = http.createServer(app);

const dashboard = createRealTimeDashboard();
dashboard.attach(server, '/dashboard/ws');

server.listen(3000);
```

### Registering Health Provider

```typescript
dashboard.registerProvider('health', async () => {
  const providers = await getAllProviderHealth();
  return providers.map(p => ({
    name: p.name,
    type: p.type,
    status: p.healthy ? 'healthy' : 'unhealthy',
    lastCheck: p.lastCheck,
    latency: p.latency,
  }));
}, 10000);
```

### Pushing Real-Time Events

```typescript
// Push an alert when a provider goes down
dashboard.pushEvent('alerts', {
  type: 'provider_down',
  provider: 'openai',
  timestamp: Date.now(),
  severity: 'critical',
});

// Push a session event
dashboard.pushEvent('events', {
  type: 'session_started',
  sessionId: 'sess-abc123',
  userId: 'user-42',
  channel: 'telegram',
  timestamp: Date.now(),
});

// Push an audit event
dashboard.pushEvent('audit', {
  action: 'config_changed',
  key: 'logging.level',
  oldValue: 'info',
  newValue: 'debug',
  source: 'api',
  timestamp: Date.now(),
});
```

### Getting Client Info

```typescript
console.log(`Connected clients: ${dashboard.getClientCount()}`);
// Connected clients: 3

console.log('Subscriptions per channel:', dashboard.getSubscriptionCounts());
// { metrics: 2, logs: 3, health: 1 }
```

---

## WebSocket Protocol

The dashboard uses a simple JSON-based message protocol over WebSocket.

### Server-to-Client Messages

#### Welcome (on connection)

```json
{
  "type": "welcome",
  "channels": ["metrics", "logs", "health", "sessions"],
  "timestamp": 1712345678901
}
```

#### Subscribed (after subscribe)

```json
{
  "type": "subscribed",
  "channel": "metrics"
}
```

#### Unsubscribed (after unsubscribe)

```json
{
  "type": "unsubscribed",
  "channel": "metrics"
}
```

#### Data (periodic broadcast or initial data)

```json
{
  "type": "data",
  "channel": "metrics",
  "data": {
    "cpu": { "user": 12345, "system": 6789 },
    "memory": { "rss": 52428800, "heapUsed": 20971520 },
    "uptime": 3600
  },
  "timestamp": 1712345678901
}
```

#### Event (pushed event)

```json
{
  "type": "event",
  "channel": "alerts",
  "data": {
    "type": "provider_down",
    "provider": "openai",
    "severity": "critical"
  },
  "timestamp": 1712345678901
}
```

#### Query Result

```json
{
  "type": "query:result",
  "queryId": "q-123",
  "data": [...],
  "timestamp": 1712345678901
}
```

#### Error

```json
{
  "type": "error",
  "message": "Invalid JSON"
}
```

#### Pong (response to ping)

```json
{
  "type": "pong",
  "timestamp": 1712345678901
}
```

---

## Data Providers

A data provider is an async function that returns data for a channel:

```typescript
// Provider signature
provider: () => Promise<any>
```

### Provider Guidelines

- **Return format should match channel expectations** -- metrics should return numeric values, logs should return arrays of log entries
- **Keep providers fast** -- they are called on every broadcast interval; avoid expensive operations
- **Handle errors gracefully** -- provider errors are caught and sent as error messages to clients
- **Return fresh data** -- the provider is called on every broadcast, not cached

### Provider Examples

```typescript
// Array provider (logs)
dashboard.registerProvider('logs', async () => {
  return logger.getRecentEntries(100);
}, 2000);

// Object provider (metrics)
dashboard.registerProvider('metrics', async () => {
  return {
    requests: metrics.getRequestCount(),
    errors: metrics.getErrorCount(),
    latency: metrics.getAvgLatency(),
  };
}, 5000);

// No broadcast (push-only)
dashboard.registerProvider('alerts', async () => {
  return []; // Alerts are pushed via pushEvent()
});
```

---

## Client Messages

Clients send JSON messages with a `type` field:

### Subscribe

```json
{ "type": "subscribe", "channel": "metrics" }
```

### Unsubscribe

```json
{ "type": "unsubscribe", "channel": "metrics" }
```

### Subscribe to All

```json
{ "type": "subscribe-all" }
```

### Ping

```json
{ "type": "ping" }
```

### Ad-hoc Query

```json
{
  "type": "query",
  "channel": "logs",
  "queryId": "q-123",
  "filters": { "level": "error" }
}
```

---

## Error Handling

### Provider Errors

If a data provider throws, the error is caught and sent to the client:

```json
{
  "type": "error",
  "channel": "metrics",
  "message": "Database connection refused"
}
```

The error is also logged:

```
ERROR { channel: "metrics", err: ... } Dashboard broadcast failed
```

### Invalid Client Messages

Invalid JSON or unknown message types result in error responses:

```json
{ "type": "error", "message": "Invalid JSON" }
{ "type": "error", "message": "Unknown message type: foobar" }
```

### Query Errors

Invalid queries or non-existent channels:

```json
{
  "type": "error",
  "message": "No provider for channel: foobar"
}
```

### Client Disconnects

Client disconnections are handled silently -- the client is removed from the tracking map and any intervals continue for remaining subscribers.

### Shutdown

```typescript
// Close all connections and stop broadcast timers
dashboard.close();
// All WebSocket clients receive a 1001 (Going Away) close code
// All broadcast intervals are cleared
```

---

## Integration Points

### With `src/cron/`

Push scheduled job events to the dashboard:

```typescript
scheduler.on('job:failed', ({ job, execution }) => {
  dashboard.pushEvent('alerts', {
    type: 'cron_job_failed',
    job: job.name,
    error: execution.error,
    timestamp: Date.now(),
  });
});
```

### With `src/config-manager/`

Push configuration changes to the dashboard:

```typescript
configManager.on('config:changed', (event) => {
  dashboard.pushEvent('audit', {
    type: 'config_change',
    key: event.key,
    oldValue: event.oldValue,
    newValue: event.newValue,
    source: event.source,
    timestamp: event.timestamp,
  });
});
```

### With ``

Push circuit breaker state changes:

```typescript
breaker.on('state:change', ({ from, to }) => {
  dashboard.pushEvent('alerts', {
    type: 'circuit_breaker_state_change',
    circuit: breaker.name,
    from,
    to,
    timestamp: Date.now(),
  });
});
```

### With `src/infra/` (Logger)

Use the logger as a data provider:

```typescript
dashboard.registerProvider('logs', async () => {
  return logger.getHistory(100);
}, 2000);
```

### With `src/feature-flags/`

Expose feature flag state:

```typescript
dashboard.registerProvider('metrics', async () => {
  const flagStats = flagManager.getStats();
  return {
    ...getSystemMetrics(),
    featureFlags: flagStats,
  };
}, 5000);
```

---

## Security Considerations

### Authentication

The dashboard module itself does not implement authentication. In production, protect the WebSocket endpoint with:

- **HTTP middleware** -- attach the dashboard to a server that requires authentication
- **Token validation** -- validate tokens in the WebSocket upgrade request
- **Network isolation** -- restrict access to the dashboard port

### Data Sensitivity

Be cautious about what data providers expose:

- **Never expose API keys** in metrics or config providers
- **Sanitize log entries** to remove PII before broadcasting
- **Use channel-level access control** if different clients should see different channels

### Rate Limiting

The broadcast intervals provide natural rate limiting. However, ad-hoc queries have no built-in rate limit. Consider implementing query rate limiting for production use.

---

## Best Practices

1. **Register providers before starting the server** -- providers define the available channels; register them during application initialization.

2. **Use appropriate broadcast intervals** -- metrics every 5s, logs every 2s, health every 10s. Don't broadcast more frequently than needed.

3. **Use pushEvent for rare events** -- alerts, config changes, and failures should be pushed via `pushEvent()` rather than relying on broadcast polling.

4. **Keep provider functions lightweight** -- they are called on every broadcast interval. Cache expensive computations outside the provider.

5. **Handle client reconnections** -- clients that reconnect will receive a welcome message and must resubscribe. Design your client to handle this gracefully.

6. **Monitor client count** -- use `getClientCount()` to detect unexpected drops (network issues) or spikes (DDoS).

7. **Use the query mechanism for ad-hoc data** -- instead of subscribing to continuous broadcasts, clients can request specific data on demand.

---

## Related Documentation

- [`src/cron/`](../cron/README.md) -- Push cron job events to the dashboard
- [`src/config-manager/`](../config-manager/README.md) -- Push config changes to the audit channel
- [``](../circuit-breaker/README.md) -- Push circuit breaker state changes
- [`src/feature-flags/`](../feature-flags/README.md) -- Expose feature flag metrics
- [`src/infra/`](../infra/README.md) -- Shared logging infrastructure
- [WebSocket MDN Docs](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) -- WebSocket API reference
