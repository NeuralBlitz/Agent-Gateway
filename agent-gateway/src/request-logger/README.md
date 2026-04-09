# Request Logger

## Overview

The **Request Logger** module (`agent-gateway/src/request-logger/`) provides enterprise-grade, structured HTTP request logging with sampling, filtering, and async write buffering. It is designed to capture every incoming request's metadata, latency, status code, and optional user/tenant context -- and to emit that data both to in-memory storage and optional file-based persistence.

The module extends Node.js `EventEmitter`, allowing consumers to subscribe to log entry events in real time. It integrates with the shared infrastructure logger (see [infra/logger](file:///home/runner/workspace/agent-gateway/src/infra/)) for server-error-level events (status code 500+), ensuring those are escalated through the centralized logging pipeline.

### Key Capabilities

- **Sampling**: Configure a sample rate (0.0 to 1.0) to reduce logging overhead in high-traffic environments.
- **Filtering**: Supply a custom predicate function to selectively include or exclude entries from being logged.
- **Async File Writes**: When a `logFile` path is provided, entries are buffered and flushed asynchronously in batches of 100 or every 5 seconds (whichever comes first).
- **In-Memory Ring Buffer**: Keeps up to 50,000 (configurable) entries in memory for fast querying and statistics computation.
- **Statistics**: Built-in aggregation for average latency, error rate, cache hit rate, and breakdowns by HTTP status code and method.
- **Event-Driven**: Emits an `entry` event for every logged request, enabling real-time dashboards or streaming pipelines.

---

## File Structure

```
agent-gateway/src/request-logger/
  index.ts              # Main implementation (RequestLogger class, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `fs` (`createWriteStream`) for file-based log persistence.
- `path` (`join`) for path resolution.
- `events` (`EventEmitter`) for the pub/sub interface.
- `../infra/index.js` (the shared `logger` singleton) for error-level logging.

---

## Full API Documentation

### Interfaces

#### `RequestLogEntry`

Represents a single logged request.

| Property       | Type     | Description                                      |
|----------------|----------|--------------------------------------------------|
| `id`           | string   | Auto-generated unique entry ID                   |
| `timestamp`    | number   | Epoch ms when the entry was created              |
| `method`       | string   | HTTP method (GET, POST, etc.)                    |
| `path`         | string   | Request URL path                                 |
| `statusCode`   | number   | HTTP response status code                        |
| `latencyMs`    | number   | Request-to-response duration in milliseconds     |
| `requestId`    | string   | Correlated request ID                            |
| `userId`       | string?  | Authenticated user ID (optional)                 |
| `tenantId`     | string?  | Multi-tenant identifier (optional)               |
| `userAgent`    | string?  | Client User-Agent header                         |
| `sourceIp`     | string?  | Client IP address                                |
| `requestSize`  | number?  | Size of the request body in bytes                |
| `responseSize` | number?  | Size of the response body in bytes               |
| `cached`       | boolean  | Whether the response was served from cache       |
| `error`        | string?  | Error message for failed requests                |

#### `RequestLoggerConfig`

Configuration object passed to the constructor.

| Property      | Type                              | Default     | Description                                    |
|---------------|-----------------------------------|-------------|------------------------------------------------|
| `sampleRate`  | number                            | `1.0`       | Fraction of requests to log (0.0 to 1.0)       |
| `logFile`     | string                            | `''`        | File path for persistent log output             |
| `maxInMemory` | number                            | `50000`     | Maximum entries kept in the in-memory ring buffer |
| `filter`      | `(entry: RequestLogEntry) => boolean` | `() => true` | Predicate to include/exclude entries       |
| `onEntry`     | `(entry: RequestLogEntry) => void`    | `() => {}` | Callback invoked for every accepted entry  |

---

### Class: `RequestLogger`

Extends `EventEmitter`.

#### Constructor

```ts
constructor(config?: RequestLoggerConfig)
```

Initializes the logger with the supplied configuration. If `logFile` is set, opens an append-mode write stream and starts a 5-second flush interval.

#### Methods

##### `log(entry: Omit<RequestLogEntry, 'id' | 'timestamp'>): void`

Logs a request entry. The caller provides all fields except `id` and `timestamp`, which are auto-generated.

**Behavior**:
1. Checks sampling -- skips the entry if `Math.random() > sampleRate`.
2. Constructs the full entry with `id` (`${requestId}-${Date.now()}`) and `timestamp`.
3. Runs the entry through the `filter` predicate; discards if it returns `false`.
4. Pushes to the in-memory ring buffer (evicts oldest if `maxInMemory` exceeded).
5. If a file stream exists, buffers the JSON-stringified entry; flushes when buffer reaches 100 entries.
6. Invokes `onEntry` callback and emits `entry` event.
7. If `statusCode >= 500`, logs via the shared `logger.error()`.

##### `getRecent(limit?: number, filter?: Partial<RequestLogEntry>): RequestLogEntry[]`

Returns the most recent entries from the in-memory buffer.

| Parameter | Type                        | Default | Description                               |
|-----------|-----------------------------|---------|-------------------------------------------|
| `limit`   | number                      | `100`   | Number of recent entries to return        |
| `filter`  | Partial<RequestLogEntry>    | `undefined` | Key-value pairs to filter entries by  |

**Example**:

```ts
const errors = logger.getRecent(50, { statusCode: 500 });
const postRequests = logger.getRecent(200, { method: 'POST' });
```

##### `getStats(timeRange?: { from: number; to: number }): object`

Computes aggregate statistics over the in-memory buffer.

Returns:

| Property        | Type                         | Description                                   |
|-----------------|------------------------------|-----------------------------------------------|
| `total`         | number                       | Total matching entries                        |
| `avgLatencyMs`  | number                       | Average latency in milliseconds (rounded)     |
| `errorRate`     | number                       | Fraction of entries with status >= 400        |
| `cacheHitRate`  | number                       | Fraction of entries where `cached === true`   |
| `byStatusCode`  | Record<string, number>       | Count per HTTP status code                    |
| `byMethod`      | Record<string, number>       | Count per HTTP method                         |

If `timeRange` is provided, only entries within that window are considered.

##### `close(): void`

Shuts down the logger. Clears the flush interval, flushes any remaining buffered entries, and closes the file stream.

---

### Factory Function

```ts
function createRequestLogger(config?: RequestLoggerConfig): RequestLogger
```

Convenience factory that instantiates a `RequestLogger`.

---

## Configuration Options

```ts
import { createRequestLogger } from './index.js';

const logger = createRequestLogger({
  // Log only 10% of requests in production to reduce overhead
  sampleRate: 0.1,

  // Persist logs to disk
  logFile: '/var/log/gateway/requests.log',

  // Keep 100,000 entries in memory
  maxInMemory: 100000,

  // Only log requests to /api/* paths
  filter: (entry) => entry.path.startsWith('/api/'),

  // Stream each entry to a real-time analytics service
  onEntry: (entry) => analyticsPipeline.push(entry),
});
```

---

## Usage Examples

### Basic Express Integration

```ts
import express from 'express';
import { createRequestLogger } from './index.js';

const app = express();
const reqLogger = createRequestLogger();

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    reqLogger.log({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      latencyMs: Date.now() - start,
      requestId: req.headers['x-request-id'] as string || '',
      userId: req.user?.id,
      sourceIp: req.ip,
      cached: false,
    });
  });
  next();
});
```

### Real-Time Dashboard via Events

```ts
const logger = createRequestLogger();

logger.on('entry', (entry) => {
  if (entry.statusCode >= 400) {
    dashboard.increment('errors');
  }
  dashboard.recordLatency(entry.latencyMs);
});
```

### Error-Only Logging

```ts
const errorLogger = createRequestLogger({
  sampleRate: 1.0,
  filter: (entry) => entry.statusCode >= 400,
});
```

### Stats Dashboard

```ts
setInterval(() => {
  const stats = logger.getStats({
    from: Date.now() - 60_000, // last 60 seconds
    to: Date.now(),
  });
  console.log(`RPM: ${stats.total}, Avg latency: ${stats.avgLatencyMs}ms, Error rate: ${(stats.errorRate * 100).toFixed(2)}%`);
}, 60_000);
```

### Graceful Shutdown

```ts
process.on('SIGTERM', () => {
  logger.close();
  process.exit(0);
});
```

---

## Integration Points

- **Infra Logger** (`/home/runner/workspace/agent-gateway/src/infra/`): Server errors (5xx) are forwarded to the shared logger via `logger.error()`.
- **Request Tracker** (`/home/runner/workspace/agent-gateway/src/request-tracker/`): The `requestId` field in each log entry can be correlated with trace spans from the request tracker for full distributed tracing.
- **Error Handler** (`/home/runner/workspace/agent-gateway/src/error-handler/`): Error entries logged by this module can be cross-referenced with structured error reports from the error handler.
- **Middleware Pipeline** (`/home/runner/workspace/agent-gateway/src/middleware-pipeline/`): The `Middleware.requestLog()` factory produces a middleware-compatible logging function that can be wired into the pipeline.

---

## Error Handling

- **File Write Failures**: If the file stream encounters an error, the write buffer is not flushed and entries remain only in memory. The module does not crash; errors are absorbed silently.
- **Sampling**: Sampling uses `Math.random()` which is not cryptographically secure. For audit-grade sampling, consider an external source of randomness.
- **Memory Pressure**: The `maxInMemory` setting prevents unbounded growth. When the limit is reached, the oldest entry is discarded (FIFO eviction).

---

## Performance Considerations

| Setting            | Impact                                               |
|--------------------|------------------------------------------------------|
| `sampleRate`       | Lower values reduce CPU and I/O overhead proportionally |
| `logFile`          | File I/O is buffered and batched (100 entries or 5s) |
| `maxInMemory`      | Higher values increase memory usage (~2-5KB per entry) |
| `filter`           | Runs synchronously on every sampled entry             |

For high-throughput deployments, set `sampleRate` below 1.0 and use an external log shipper (Fluentd, Vector, etc.) to consume the file-based log output.

---

## Related Documentation

- [Request Tracker](/home/runner/workspace/agent-gateway/src/request-tracker/README.md) -- Distributed tracing and correlation IDs.
- [Error Handler](/home/runner/workspace/agent-gateway/src/error-handler/README.md) -- Centralized error classification and reporting.
- [Middleware Pipeline](/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md) -- Composable middleware chain with built-in `requestLog` middleware.
- [Response Transformer](/home/runner/workspace/agent-gateway/src/response-transformer/README.md) -- Response formatting with timing metadata.
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
