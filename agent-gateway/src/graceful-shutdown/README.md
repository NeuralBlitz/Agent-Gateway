# Graceful Shutdown Manager (`src/graceful-shutdown/`)

> **Orchestrates clean shutdown with request draining, WebSocket closure, connection cleanup, and state persistence for the Agent Gateway.**

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture and Shutdown Phases](#architecture-and-shutdown-phases)
4. [Class API](#class-api)
5. [Configuration Options](#configuration-options)
6. [Usage Examples](#usage-examples)
7. [Shutdown Phase Details](#shutdown-phase-details)
8. [Signal Handling](#signal-handling)
9. [Error Handling](#error-handling)
10. [Integration Points](#integration-points)
11. [Differences from ``](#differences-from-srcshutdown)
12. [Best Practices](#best-practices)
13. [Related Documentation](#related-documentation)

---

## Overview

The `graceful-shutdown/` module provides a comprehensive **graceful shutdown orchestrator** for the Agent Gateway. It ensures that when the application receives a termination signal (SIGTERM, SIGINT, or unhandled exception), it does not abruptly terminate but instead follows a structured multi-phase shutdown process:

1. **Stop accepting new connections** -- HTTP servers stop listening
2. **Drain in-flight requests** -- Wait for existing requests to complete (with timeout)
3. **Close WebSocket connections** -- Gracefully close all active WebSocket clients
4. **Run cleanup tasks** -- Execute registered cleanup callbacks (DB connections, cache, etc.)

This is critical for production systems because:

- **Zero request loss** -- In-flight requests complete before the process exits
- **Clean WebSocket termination** -- Clients receive proper close frames instead of TCP resets
- **Resource cleanup** -- Database connections, file handles, and timers are properly released
- **No data corruption** -- Prevents partial writes that could corrupt state
- **Observability** -- Each phase is logged with timing and status information

The module extends `EventEmitter`, allowing external code to listen for `shutdown:start` and `shutdown:complete` events.

---

## File Structure

```
graceful-shutdown/
└── index.ts          # ShutdownManager class, factory, type definitions
```

The entire module is implemented in a single file with the `ShutdownManager` class (~160 lines), a factory function `createShutdownManager()`, and associated TypeScript interfaces.

---

## Architecture and Shutdown Phases

```
SIGTERM / SIGINT / uncaughtException
                │
                ▼
    ┌───────────────────────┐
    │  isShuttingDown check │──► Already shutting down? Return early
    └───────────────────────┘
                │
                ▼
    ┌───────────────────────┐
    │  Emit shutdown:start  │
    │  Start force-timer    │
    └───────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │  Phase 1: Stop HTTP Servers   │
    │  server.close() for each      │
    │  (stops accepting new reqs)   │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │  Phase 2: Drain In-Flight     │
    │  Poll inFlightRequests set    │
    │  Wait up to timeout/2 ms      │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │  Phase 3: Close WebSockets    │
    │  Close code 1001 (Going Away) │
    │  Close reason: "Server down"  │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │  Phase 4: Run Cleanup Tasks   │
    │  Execute all registered tasks │
    │  (try/catch per task)         │
    └───────────────────────────────┘
                │
                ▼
    ┌───────────────────────────────┐
    │  Emit shutdown:complete       │
    │  Log total duration           │
    │  process.exit(0)              │
    └───────────────────────────────┘
```

---

## Class API

### Types

```typescript
interface ShutdownConfig {
  /** Timeout before forced shutdown (ms, default: 30000) */
  timeout?: number;
  /** Whether to close WebSocket connections gracefully */
  closeWebSockets?: boolean;
  /** WebSocket close code (default: 1001 "Going Away") */
  wsCloseCode?: number;
  /** WebSocket close reason (default: "Server shutting down") */
  wsCloseReason?: string;
}

type CleanupTask = () => void | Promise<void>;
```

### `ShutdownManager` Class

```typescript
class ShutdownManager extends EventEmitter {
  constructor(config?: ShutdownConfig)

  // Server registration
  registerHttpServer(server: HttpServer | HttpsServer): void
  registerWsServer(wsServer: WebSocketServer): void

  // Cleanup task registration
  onCleanup(task: CleanupTask): void

  // Shutdown orchestration
  shutdown(signal?: string): Promise<void>

  // Signal handling (SIGTERM, SIGINT, uncaughtException, unhandledRejection)
  registerSignalHandlers(): void

  // Status flag
  readonly isShuttingDownFlag: boolean
}
```

### Factory Function

```typescript
function createShutdownManager(config?: ShutdownConfig): ShutdownManager
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `30000` | Total timeout (ms) before forced shutdown via `process.exit(1)` |
| `closeWebSockets` | `boolean` | `true` | Whether to gracefully close WebSocket connections during Phase 3 |
| `wsCloseCode` | `number` | `1001` | WebSocket close code sent to clients (1001 = "Going Away") |
| `wsCloseReason` | `string` | `"Server shutting down"` | Human-readable reason sent with WebSocket close frame |

### Timeout Behavior

The timeout is split across phases:

- **Overall timeout**: `timeout` ms (default 30s) -- if not complete by then, forced `process.exit(1)`
- **Drain timeout**: `timeout / 2` ms (default 15s) -- Phase 2 waits this long for in-flight requests

---

## Usage Examples

### Basic Setup with Express Server

```typescript
import express from 'express';
import { createShutdownManager } from '../graceful-shutdown/index.js';
import { createWebSocketServer } from '../server/index.js';

const app = express();
const httpServer = app.listen(3000);

const shutdownManager = createShutdownManager({
  timeout: 30000,
  closeWebSockets: true,
  wsCloseCode: 1001,
  wsCloseReason: 'Server shutting down for maintenance',
});

// Register the HTTP server
shutdownManager.registerHttpServer(httpServer);

// Register cleanup tasks
shutdownManager.onCleanup(async () => {
  await dbConnection.close();
});

shutdownManager.onCleanup(async () => {
  await redisClient.quit();
});

// Register signal handlers (SIGTERM, SIGINT, uncaughtException, unhandledRejection)
shutdownManager.registerSignalHandlers();
```

### With WebSocket Server

```typescript
import { WebSocketServer } from 'ws';
import { createShutdownManager } from '../graceful-shutdown/index.js';

const shutdownManager = createShutdownManager();

const httpServer = app.listen(3000);
const wsServer = new WebSocketServer({ server: httpServer });

shutdownManager.registerHttpServer(httpServer);
shutdownManager.registerWsServer(wsServer);

shutdownManager.registerSignalHandlers();
```

### With Custom WebSocket Close Settings

```typescript
const shutdownManager = createShutdownManager({
  timeout: 60000,           // 1 minute total
  closeWebSockets: true,
  wsCloseCode: 1012,        // Service Restart
  wsCloseReason: 'Deploying new version',
});
```

### Listening for Shutdown Events

```typescript
const shutdownManager = createShutdownManager();

shutdownManager.on('shutdown:start', () => {
  console.log('Shutdown sequence initiated');
  metrics.recordShutdownStart();
});

shutdownManager.on('shutdown:complete', ({ duration }) => {
  console.log(`Shutdown completed in ${duration}ms`);
  metrics.recordShutdownComplete(duration);
});
```

### Checking Shutdown State in Request Handlers

```typescript
const shutdownManager = createShutdownManager();

app.use((req, res, next) => {
  if (shutdownManager.isShuttingDownFlag) {
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Server is shutting down',
    });
    return;
  }
  next();
});
```

### Manual Shutdown Trigger

```typescript
const shutdownManager = createShutdownManager();
shutdownManager.registerHttpServer(httpServer);

// Trigger shutdown programmatically (e.g., from an admin endpoint)
app.post('/admin/shutdown', async (req, res) => {
  res.json({ message: 'Initiating shutdown' });
  await shutdownManager.shutdown('admin-request');
});
```

---

## Shutdown Phase Details

### Phase 1: Stop HTTP Servers

Each registered HTTP/HTTPS server has `server.close()` called, which stops accepting new connections. Existing connections remain active until their requests complete.

```typescript
for (const server of this.httpServers) {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}
```

### Phase 2: Drain In-Flight Requests

The manager polls the `inFlightRequests` set every 100ms, waiting up to `timeout / 2` ms. Requests are tracked by hooking into the server's `request` event and removing them on `response.finish`.

```typescript
server.on('request', (_req, res) => {
  if (this.isShuttingDown) {
    res.setHeader('Connection', 'close');  // Signal client to not reuse connection
  }
  this.inFlightRequests.add(res);
  res.on('finish', () => this.inFlightRequests.delete(res));
});
```

If requests remain after the drain timeout, they are force-closed and a warning is logged.

### Phase 3: Close WebSocket Connections

Each registered WebSocket server iterates over its connected clients, sending a close frame with the configured code and reason:

```typescript
for (const wsServer of this.wsServers) {
  for (const client of wsServer.clients) {
    client.close(this.config.wsCloseCode, this.config.wsCloseReason);
  }
  await new Promise<void>((resolve) => wsServer.close(() => resolve()));
}
```

WebSocket close code `1001` means "Going Away" -- the server is shutting down or navigating away.

### Phase 4: Run Cleanup Tasks

Each registered cleanup task is executed sequentially with individual try/catch:

```typescript
for (let i = 0; i < this.cleanupTasks.length; i++) {
  try {
    await this.cleanupTasks[i]();
  } catch (err: any) {
    logger.error({ err }, `Cleanup task ${i + 1}/${this.cleanupTasks.length} failed`);
  }
}
```

Failure of one task does not prevent subsequent tasks from running.

---

## Signal Handling

The `registerSignalHandlers()` method registers handlers for four process-level events:

| Signal | Behavior |
|--------|----------|
| `SIGTERM` | Initiates graceful shutdown, then `process.exit(0)` |
| `SIGINT` | Initiates graceful shutdown, then `process.exit(0)` |
| `uncaughtException` | Logs the error (does NOT trigger shutdown) |
| `unhandledRejection` | Logs the rejection reason (does NOT trigger shutdown) |

Note: `uncaughtException` and `unhandledRejection` handlers only log errors -- they do not call `shutdown()`. This is intentional to avoid cascading failures during error conditions.

---

## Error Handling

### Forced Shutdown

A safety timer is started at shutdown initiation. If the entire process exceeds `timeout` ms, the process is forcefully terminated:

```typescript
const forceTimer = setTimeout(() => {
  logger.error(
    { inFlight: this.inFlightRequests.size },
    `Forced shutdown after ${this.config.timeout}ms`,
  );
  process.exit(1);
}, this.config.timeout);
```

### Idempotent Shutdown

Calling `shutdown()` while a shutdown is already in progress logs a warning and returns immediately:

```typescript
if (this.isShuttingDown) {
  logger.warn('Shutdown already in progress');
  return;
}
```

### Cleanup Task Failures

Each cleanup task is wrapped in try/catch. A failed task is logged but does not abort the remaining tasks or the shutdown process.

### Shutdown Errors

If any phase throws an unexpected error, the force timer is cleared and the process exits with code 1:

```typescript
catch (err: any) {
  logger.error({ err }, 'Error during graceful shutdown');
  clearTimeout(forceTimer);
  process.exit(1);
}
```

---

## Integration Points

### With `src/server/`

The shutdown manager should be integrated at the server initialization:

```typescript
import { createServer } from '../server/index.js';
import { createShutdownManager } from '../graceful-shutdown/index.js';

const { app, httpServer } = await createServer();
const shutdownManager = createShutdownManager();

shutdownManager.registerHttpServer(httpServer);
shutdownManager.registerSignalHandlers();
```

### With `` or `src/health-checker/`

Report shutdown state in health checks:

```typescript
healthChecker.register({
  name: 'shutdown_state',
  required: true,
  check: async () => !shutdownManager.isShuttingDownFlag,
});
```

### With `src/infra/` (Logger)

All shutdown phases are logged via the shared logger:

```typescript
logger.info({ signal }, 'Graceful shutdown initiated');
logger.info('Phase 1: Stopping HTTP servers');
logger.info('Phase 2: Draining in-flight requests');
logger.info('Phase 3: Closing WebSocket connections');
logger.info('Phase 4: Running cleanup tasks');
logger.info({ duration }, 'Graceful shutdown complete');
```

### With `src/notifications/`

Trigger notifications on shutdown:

```typescript
shutdownManager.on('shutdown:start', () => {
  notifications.warning('Server Shutdown Initiated', 'Graceful shutdown has started');
});

shutdownManager.on('shutdown:complete', ({ duration }) => {
  notifications.info('Server Shutdown Complete', `Completed in ${duration}ms`);
});
```

---

## Differences from ``

The codebase contains two shutdown modules with different designs:

| Feature | `graceful-shutdown/` | `shutdown/` |
|---------|---------------------|-------------|
| **Class name** | `ShutdownManager` | `GracefulShutdownManager` |
| **Config interface** | `ShutdownConfig` | `GracefulShutdownOptions` |
| **Callbacks** | No start/complete callbacks | `onShutdownStart` / `onShutdownComplete` callbacks |
| **Factory function** | `createShutdownManager()` | `createGracefulShutdownManager()` |
| **Cleanup registration** | `onCleanup(task)` | `registerCleanup(task)` |
| **Signal handlers** | `registerSignalHandlers()` | `registerSignalHandlers()` |
| **Extends EventEmitter** | Yes | No |
| **Events emitted** | `shutdown:start`, `shutdown:complete` | None (uses callbacks instead) |
| **In-flight request logging** | Logs count during forced shutdown | Logs count periodically during drain |
| **Server registration** | Separate `registerHttpServer()` / `registerWsServer()` | Same method names |
| **Default closeWebSockets** | `true` | `true` |
| **Default timeout** | 30000ms | 30000ms |
| **WS close code/reason** | Configurable | Hardcoded to 1001 / "Server shutting down" |

### When to Use Which

- **Use `graceful-shutdown/`** when you need event-driven integration, configurable WebSocket close codes/reasons, or EventEmitter-based monitoring
- **Use `shutdown/`** when you prefer callback-based lifecycle hooks and simpler API surface

Both modules share the same core shutdown logic (4-phase approach, in-flight tracking, force timer). The differences are primarily in API style and configurability.

---

## Best Practices

1. **Register signal handlers early** -- Call `registerSignalHandlers()` immediately after server creation, before any routes or middleware.

2. **Use appropriate timeouts** -- The default 30s is suitable for most cases. For services with long-running operations (file processing, model inference), increase to 60-120s.

3. **Register all cleanup tasks** -- Every external resource (DB connections, Redis clients, file handles, intervals) should have a corresponding cleanup task.

4. **Test shutdown locally** -- Run the server and send SIGTERM (`kill -15 <pid>`) to verify clean shutdown. Check logs for all four phases completing.

5. **Monitor in-flight count** -- The `inFlightRequests.size` logged during shutdown gives insight into actual concurrent request patterns.

6. **Handle 503 during shutdown** -- Add middleware to reject new requests with 503 when `isShuttingDownFlag` is true.

7. **Configure WebSocket close codes** -- Use appropriate WebSocket close codes:
   - `1001` (Going Away) -- Server shutting down (default)
   - `1012` (Service Restart) -- Server restarting for deploy
   - `1000` (Normal Closure) -- Planned maintenance

---

## Related Documentation

- [``](../shutdown/README.md) -- Alternative shutdown manager with callback-based API
- [``](../health/README.md) -- Health check module (can report shutdown state)
- [`src/health-checker/`](../health-checker/README.md) -- Enhanced health checker with recovery
- [`src/notifications/`](../notifications/README.md) -- Notification system for shutdown alerts
- [`src/infra/`](../infra/README.md) -- Shared logging infrastructure
- [`src/server/`](../server/README.md) -- Server initialization
