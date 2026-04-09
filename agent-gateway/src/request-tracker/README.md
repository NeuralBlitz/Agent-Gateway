# Request Tracker

## Overview

The **Request Tracker** module (`agent-gateway/src/request-tracker/`) provides correlated request tracing across services with distributed tracing context propagation. It implements a span-based trace model where each trace has a unique `traceId` and individual spans (`spanId`) that can form parent-child hierarchies, enabling full request flow visualization across the gateway's internal services.

The tracker stores traces in memory with configurable capacity limits and provides rich querying capabilities: by service, operation, status, time range, and latency percentiles. It is designed to integrate with distributed tracing standards and can serve as the gateway's in-process tracing backend before exporting to systems like Jaeger, Zipkin, or OpenTelemetry collectors.

### Key Capabilities

- **Span-Based Tracing**: Each trace has a `traceId` and multiple spans with parent-child relationships.
- **Tags and Logs**: Attach arbitrary key-value tags and timestamped log entries to spans.
- **Latency Analysis**: Built-in percentile calculations (p50, p95, p99) and average latency.
- **Service/Operation Filtering**: Query traces by service name or operation name.
- **Error Tracing**: Separate querying for error traces, with status tracking (`ok`/`error`).
- **Trace Trees**: Retrieve the full tree of spans for a given `traceId`.
- **In-Memory Ring Buffer**: Configurable max traces with oldest-first eviction.
- **Event-Driven**: Emits `trace:complete` events when spans are ended.

---

## File Structure

```
agent-gateway/src/request-tracker/
  index.ts              # Main implementation (RequestTracker class, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `crypto` (`randomBytes`, `createHash`) for trace and span ID generation.
- `events` (`EventEmitter`) for trace completion events.
- `../infra/index.js` (the shared `logger` singleton) -- available for custom integrations.

---

## Full API Documentation

### Interfaces

#### `RequestTrace`

```ts
interface RequestTrace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  serviceName: string;
  operation: string;
  startTime: number;
  endTime?: number;
  status: 'ok' | 'error';
  tags: Record<string, any>;
  logs: Array<{ timestamp: number; message: string; level: string }>;
  children: string[];
}
```

| Property       | Type     | Description                                    |
|----------------|----------|------------------------------------------------|
| `traceId`      | string   | 32-char hex ID shared by all spans in a trace  |
| `spanId`       | string   | 16-char hex ID unique to this span             |
| `parentSpanId` | string?  | Parent span ID (undefined for root spans)      |
| `serviceName`  | string   | Name of the service creating the span          |
| `operation`    | string   | Operation name (e.g., `HTTP GET /api/users`)   |
| `startTime`    | number   | Epoch ms when the span started                 |
| `endTime`      | number?  | Epoch ms when the span ended                   |
| `status`       | string   | `'ok'` or `'error'`                            |
| `tags`         | object   | Arbitrary key-value metadata                   |
| `logs`         | array    | Timestamped log entries                        |
| `children`     | string[] | Child span IDs                               |

---

### Class: `RequestTracker`

Extends `EventEmitter`.

#### Constructor

```ts
constructor(maxTraces?: number)
```

| Parameter    | Type   | Default   | Description                    |
|--------------|--------|-----------|--------------------------------|
| `maxTraces`  | number | `100000`  | Maximum traces stored in memory|

#### Methods

##### `startTrace(serviceName: string, operation: string, parentSpanId?: string): RequestTrace`

Starts a new trace span. Generates a new `traceId` (for root spans) or reuses the parent's `traceId`. Links to the parent span if `parentSpanId` is provided.

If the trace store exceeds `maxTraces`, the oldest trace is evicted.

```ts
const rootSpan = tracker.startTrace('gateway', 'HTTP POST /api/chat');
const childSpan = tracker.startTrace('agent', 'processMessage', rootSpan.spanId);
```

##### `endTrace(spanId: string, status?: 'ok' | 'error'): RequestTrace | null`

Ends a trace span. Sets `endTime` and `status`. Returns the completed trace or `null` if not found.

Emits `trace:complete`.

```ts
tracker.endTrace(childSpan.spanId, 'ok');
tracker.endTrace(rootSpan.spanId, 'ok');
```

##### `tag(spanId: string, key: string, value: any): void`

Adds a tag to a trace span.

```ts
tracker.tag(spanId, 'http.status_code', 200);
tracker.tag(spanId, 'http.method', 'POST');
tracker.tag(spanId, 'user.id', 'user-123');
```

##### `log(spanId: string, message: string, level?: string): void`

Adds a timestamped log entry to a trace span. Default level is `'info'`.

```ts
tracker.log(spanId, 'Request received', 'info');
tracker.log(spanId, 'Database query executed', 'debug');
tracker.log(spanId, 'Connection timeout', 'error');
```

##### `getTrace(spanId: string): RequestTrace | undefined`

Gets a single trace by span ID.

##### `getTraceTree(traceId: string): RequestTrace[]`

Gets all spans belonging to a trace, reconstructing the parent-child hierarchy.

```ts
const tree = tracker.getTraceTree(rootSpan.traceId);
console.log(`Trace has ${tree.length} spans`);
```

##### `getRecent(limit?: number): RequestTrace[]`

Returns the most recent traces sorted by start time (newest first). Default limit is 100.

##### `getErrors(limit?: number): RequestTrace[]`

Returns traces with `status === 'error'` sorted by start time (newest first). Default limit is 50.

##### `getByService(serviceName: string, limit?: number): RequestTrace[]`

Returns traces for a specific service. Default limit is 100.

##### `getByOperation(operation: string, limit?: number): RequestTrace[]`

Returns traces for a specific operation name. Default limit is 100.

##### `getLatencyPercentiles(): { p50, p95, p99, avg }`

Calculates latency percentiles from all completed traces. Returns values in milliseconds.

```ts
const latencies = tracker.getLatencyPercentiles();
console.log(`p50: ${latencies.p50}ms, p95: ${latencies.p95}ms, p99: ${latencies.p99}ms`);
```

##### `getStats(): { totalTraces, completedTraces, errorTraces, avgDurationMs, byService, byOperation }`

Returns aggregate statistics.

```ts
const stats = tracker.getStats();
console.log(`Total traces: ${stats.totalTraces}`);
console.log(`Error rate: ${(stats.errorTraces / stats.totalTraces * 100).toFixed(2)}%`);
console.log(`By service:`, stats.byService);
```

##### `clear(): void`

Removes all traces from memory.

---

### Factory Function

```ts
function createRequestTracker(maxTraces?: number): RequestTracker
```

Convenience factory.

---

## Configuration Options

```ts
const tracker = createRequestTracker(50000); // Store up to 50,000 traces
```

---

## Usage Examples

### Full Request Trace

```ts
import { createRequestTracker } from './index.js';

const tracker = createRequestTracker();

// Root span -- gateway receives request
const rootSpan = tracker.startTrace('gateway', 'HTTP POST /api/chat');
tracker.tag(rootSpan, 'http.method', 'POST');
tracker.tag(rootSpan, 'http.path', '/api/chat');

// Child span -- session lookup
const sessionSpan = tracker.startTrace('session-manager', 'getSession', rootSpan.spanId);
const session = await getSession(sessionId);
tracker.tag(sessionSpan, 'session.id', sessionId);
tracker.endTrace(sessionSpan.spanId, session ? 'ok' : 'error');

// Child span -- agent processing
const agentSpan = tracker.startTrace('agent', 'processMessage', rootSpan.spanId);
tracker.log(agentSpan, 'Sending message to agent');
const result = await agent.process(message);
tracker.tag(agentSpan, 'output.tokens', result.tokenCount);
tracker.endTrace(agentSpan.spanId, 'ok');

// End root
tracker.endTrace(rootSpan.spanId, 'ok');

// Query the trace
const tree = tracker.getTraceTree(rootSpan.traceId);
console.log(`Full trace: ${tree.length} spans`);
```

### Express Middleware Integration

```ts
import express from 'express';
import { createRequestTracker } from './index.js';

const app = express();
const tracker = createRequestTracker();

app.use((req, res, next) => {
  const span = tracker.startTrace('gateway', `${req.method} ${req.path}`);
  req.traceSpan = span;
  tracker.tag(span, 'http.method', req.method);
  tracker.tag(span, 'http.path', req.path);
  tracker.tag(span, 'http.ip', req.ip);

  res.on('finish', () => {
    tracker.tag(span, 'http.status_code', res.statusCode);
    tracker.endTrace(span.spanId, res.statusCode < 400 ? 'ok' : 'error');
  });

  next();
});
```

### Latency Monitoring

```ts
setInterval(() => {
  const latencies = tracker.getLatencyPercentiles();
  const stats = tracker.getStats();

  console.log(`
    Traces: ${stats.totalTraces}
    Errors: ${stats.errorTraces}
    Avg latency: ${stats.avgDurationMs}ms
    p50: ${latencies.p50}ms
    p95: ${latencies.p95}ms
    p99: ${latencies.p99}ms
  `);
}, 30_000);
```

### Error Investigation

```ts
const recentErrors = tracker.getErrors(20);
for (const err of recentErrors) {
  console.log(`[${err.serviceName}] ${err.operation} -- ${err.logs.map(l => l.message).join(', ')}`);
}
```

### Trace Event Listening

```ts
tracker.on('trace:complete', (trace) => {
  const duration = trace.endTime! - trace.startTime;
  if (duration > 5000) {
    console.warn(`Slow trace: ${trace.serviceName}/${trace.operation} took ${duration}ms`);
  }
});
```

---

## Integration Points

- **Request Logger** (`/home/runner/workspace/agent-gateway/src/request-logger/README.md`): The `traceId` from the request tracker can be included in request log entries for correlating logs with traces.
- **Error Handler** (`/home/runner/workspace/agent-gateway/src/error-handler/README.md`): Error traces can be correlated with error reports via the `traceId`/`traceId` fields.
- **Middleware Pipeline** (`/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md`): The pipeline's `requestId` middleware generates IDs that can be used as `traceId` values.
- **Event Bus** (`/home/runner/workspace/agent-gateway/src/eventbus/`): The event bus supports `traceId` on events, enabling correlation with request traces.
- **Message Bus** (`/home/runner/workspace/agent-gateway/src/message-bus/README.md`): Bus messages can include `correlationId` linked to trace spans.

---

## Error Handling

- **Span Not Found**: `endTrace()`, `tag()`, and `log()` silently do nothing if the span ID is not found. They return `null` (for `endTrace`) or `void` (for `tag`/`log`).
- **Memory Limits**: When `maxTraces` is exceeded, the oldest trace (by `startTime`) is evicted. This is a ring buffer -- data is lost but the system does not crash.
- **Orphaned Spans**: If a parent span is ended before its children, the children still reference the parent's `traceId` but the parent-child linkage is maintained in the data model.

---

## Trace ID Generation

- **traceId**: 32 hex characters (16 random bytes).
- **spanId**: 16 hex characters (8 random bytes).

These IDs are not UUIDs but random hex strings, following the convention used by systems like Jaeger and Zipkin.

---

## Related Documentation

- [Request Logger](/home/runner/workspace/agent-gateway/src/request-logger/README.md) -- HTTP request logging with `requestId` correlation.
- [Error Handler](/home/runner/workspace/agent-gateway/src/error-handler/README.md) -- Error reports with `traceId` for trace correlation.
- [Middleware Pipeline](/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md) -- Request ID generation middleware.
- [Event Bus](/home/runner/workspace/agent-gateway/src/eventbus/) -- Gateway events with `traceId` support.
- [Message Bus](/home/runner/workspace/agent-gateway/src/message-bus/README.md) -- Internal pub/sub with `correlationId`.
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
