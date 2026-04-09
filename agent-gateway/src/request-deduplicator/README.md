# Request Deduplicator

Enterprise request deduplication module for the Agent Gateway. This module coalesces identical in-flight requests to prevent redundant work, reduce API costs, and improve throughput under high-concurrency scenarios. It supports configurable key generation, TTL expiration, and concurrency limits.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [Interfaces](#interfaces)
    - [DeduplicationConfig](#deduplicationconfig)
    - [DeduplicationStats](#deduplicationstats)
  - [RequestDeduplicator Class](#requestdeduplicator-class)
  - [deduplicate()](#deduplicate)
  - [getActiveKeys()](#getactivekeys)
  - [getStats()](#getstats)
  - [resetStats()](#resetstats)
  - [clear()](#clear)
  - [destroy()](#destroy)
  - [Factory Function](#factory-function)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Deduplication vs. Idempotency](#deduplication-vs-idempotency)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Performance Characteristics](#performance-characteristics)
- [Related Documentation](#related-documentation)

## Overview

Request deduplication is a concurrency optimization: when multiple identical requests arrive simultaneously (e.g., fan-out from multiple clients, retry storms, or parallel microservice calls), the deduplicator ensures that only the first request executes the underlying function, while all subsequent identical requests wait for and share the result.

**Key features:**
- **Promise coalescing:** Identical in-flight requests share a single promise.
- **Configurable key generation:** Keys can incorporate method, path, and selected headers.
- **TTL-based expiration:** Deduplication entries expire after a configurable duration.
- **Concurrency limiting:** A maximum number of concurrent deduplicated requests prevents memory exhaustion.
- **Event-driven:** Emits events on deduplication, completion, and error.
- **Statistics tracking:** Tracks total, deduplicated, unique requests, and peak concurrency.

### How It Works

```
Request A (GET /api/users)  ──┐
Request B (GET /api/users)  ──┼──▶ Execute once ──▶ Result shared with all
Request C (GET /api/users)  ──┘
```

When Request A arrives first, it triggers execution of the handler. Requests B and C, arriving while A is still in-flight, receive the same promise. Once the handler resolves, all three requests get the result simultaneously.

## File Structure

```
/home/runner/workspace/agent-gateway/src/request-deduplicator/
  index.ts          # RequestDeduplicator class, DeduplicationConfig, DeduplicationStats
  README.md         # This documentation file
```

## Installation and Import

```typescript
import { RequestDeduplicator, createRequestDeduplicator } from '../request-deduplicator/index.js';
// or with the full absolute path:
// import { RequestDeduplicator, createRequestDeduplicator } from '/home/runner/workspace/agent-gateway/src/request-deduplicator/index.js';
```

## API Reference

### Interfaces

#### DeduplicationConfig

Configuration options for the deduplicator.

```typescript
export interface DeduplicationConfig {
  /** Max concurrent deduplicated requests (default: 1000) */
  maxConcurrent?: number;
  /** TTL for deduplication keys in ms (default: 30000) */
  ttlMs?: number;
  /** Whether to include headers in key generation */
  includeHeaders?: boolean;
  /** Header keys to include in deduplication key */
  headerKeys?: string[];
}
```

#### DeduplicationStats

Statistics returned by `getStats()`.

```typescript
export interface DeduplicationStats {
  totalRequests: number;
  deduplicatedRequests: number;
  uniqueRequests: number;
  deduplicationRate: number;
  activeRequests: number;
  peakConcurrency: number;
}
```

### RequestDeduplicator Class

Extends `EventEmitter` for event-driven observability.

```typescript
export class RequestDeduplicator extends EventEmitter {
  constructor(config?: DeduplicationConfig);

  deduplicate<T>(
    key: string,
    fn: () => Promise<T>,
    context?: { method?: string; path?: string; headers?: Record<string, string> }
  ): Promise<T>;

  getActiveKeys(): Array<{ key: string; waiters: number; age: number }>;
  getStats(): DeduplicationStats;
  resetStats(): void;
  clear(): void;
  destroy(): void;
}
```

**Events emitted:**
| Event | Payload | Description |
|-------|---------|-------------|
| `deduplicated` | `{ dedupKey, context }` | A request was coalesced with an in-flight request |
| `completed` | `{ dedupKey }` | A deduplicated request completed successfully |
| `error` | `{ dedupKey, error }` | A deduplicated request failed |

### deduplicate()

The core method. Deduplicates a request by key.

**Signature:**
```typescript
async deduplicate<T>(
  key: string,
  fn: () => Promise<T>,
  context?: { method?: string; path?: string; headers?: Record<string, string> }
): Promise<T>
```

**Parameters:**
- `key: string` -- A unique identifier for the request. This is combined with context (method, path, headers) to generate the actual deduplication key.
- `fn: () => Promise<T>` -- The function to execute if no identical request is already in-flight.
- `context` (optional) -- Additional context for key generation:
  - `method` -- HTTP method (e.g., `'GET'`).
  - `path` -- Request path (e.g., `'/api/users'`).
  - `headers` -- Request headers (filtered by `config.headerKeys` if `includeHeaders` is enabled).

**Returns:** `Promise<T>` -- The result of executing `fn()`, either directly or from a coalesced in-flight request.

**Behavior:**
1. Generates a SHA-256-based deduplication key (truncated to 32 hex characters) from the provided `key`, `context.method`, `context.path`, and optionally selected headers.
2. Checks if an identical key is already in-flight:
   - If yes and within TTL: returns the existing promise (deduplication hit).
   - If yes but expired: removes the stale entry and proceeds.
3. If the concurrent deduplication limit is reached, executes without deduplication.
4. Otherwise, executes `fn()`, stores the promise, and cleans up after completion.

### getActiveKeys()

Returns all currently active deduplication keys with their waiter counts and ages.

**Signature:**
```typescript
getActiveKeys(): Array<{ key: string; waiters: number; age: number }>
```

**Returns:** Array of active keys sorted by waiter count (descending). Useful for debugging and monitoring.

### getStats()

Returns deduplication statistics.

**Signature:**
```typescript
getStats(): DeduplicationStats
```

**Returns:** `DeduplicationStats` with total/deduplicated/unique request counts, deduplication rate, active request count, and peak concurrency.

### resetStats()

Resets all statistics counters to zero (except `peakConcurrency` which is preserved for historical tracking).

**Signature:**
```typescript
resetStats(): void
```

### clear()

Clears all in-flight deduplication entries. Active promises are abandoned.

**Signature:**
```typescript
clear(): void
```

### destroy()

Destroys the deduplicator: clears the cleanup interval, removes all in-flight entries. The instance should not be used after calling `destroy()`.

**Signature:**
```typescript
destroy(): void
```

### Factory Function

```typescript
export function createRequestDeduplicator(config?: DeduplicationConfig): RequestDeduplicator
```

Convenience factory for creating a configured instance.

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `maxConcurrent` | 1000 | Maximum number of concurrent deduplicated requests. Beyond this limit, requests execute without deduplication. |
| `ttlMs` | 30000 (30s) | Time-to-live for deduplication entries. Entries older than this are cleaned up. |
| `includeHeaders` | `false` | Whether to include request headers in the deduplication key. |
| `headerKeys` | `['content-type', 'accept']` | Which header keys to include when `includeHeaders` is `true`. |

## Usage Examples

### Basic Deduplication

```typescript
import { createRequestDeduplicator } from '/home/runner/workspace/agent-gateway/src/request-deduplicator/index.js';

const deduplicator = createRequestDeduplicator({ ttlMs: 10000 });

// Three identical requests arrive simultaneously
const results = await Promise.all([
  deduplicator.deduplicate('fetch-users', () => db.users.findAll()),
  deduplicator.deduplicate('fetch-users', () => db.users.findAll()), // Will be deduplicated
  deduplicator.deduplicate('fetch-users', () => db.users.findAll()), // Will be deduplicated
]);

// All three get the same result; db.users.findAll() was called only once
console.log(deduplicator.getStats());
// { totalRequests: 3, deduplicatedRequests: 2, uniqueRequests: 1, deduplicationRate: 0.666, ... }
```

### Express.js Middleware

```typescript
import express from 'express';
import { createRequestDeduplicator } from '/home/runner/workspace/agent-gateway/src/request-deduplicator/index.js';

const app = express();
const deduplicator = createRequestDeduplicator({
  maxConcurrent: 500,
  ttlMs: 5000,
  includeHeaders: true,
  headerKeys: ['authorization', 'accept'],
});

app.get('/api/*', async (req, res, next) => {
  try {
    const result = await deduplicator.deduplicate(
      req.url,
      () => next(),  // The actual handler
      { method: req.method, path: req.path, headers: req.headers }
    );
  } catch (err) {
    next(err);
  }
});
```

### Monitoring Deduplication Events

```typescript
import { createRequestDeduplicator } from '/home/runner/workspace/agent-gateway/src/request-deduplicator/index.js';

const deduplicator = createRequestDeduplicator();

deduplicator.on('deduplicated', ({ dedupKey, context }) => {
  console.log(`Request deduplicated: ${dedupKey}`, context);
});

deduplicator.on('completed', ({ dedupKey }) => {
  console.log(`Request completed: ${dedupKey}`);
});

deduplicator.on('error', ({ dedupKey, error }) => {
  console.error(`Deduplicated request failed: ${dedupKey}`, error);
});
```

### Health Check Endpoint

```typescript
app.get('/health/deduplication', (_req, res) => {
  const stats = deduplicator.getStats();
  const keys = deduplicator.getActiveKeys();

  res.json({
    ...stats,
    topKeys: keys.slice(0, 10), // Top 10 keys by waiter count
  });
});
```

## Deduplication vs. Idempotency

It is important to distinguish between **request deduplication** (this module) and **idempotency** (a separate concern in API design):

| Aspect | Request Deduplication (this module) | Idempotency (general API pattern) |
|--------|-------------------------------------|-----------------------------------|
| Scope | In-flight concurrent requests | Repeated requests over any time window |
| Goal | Reduce redundant concurrent work | Ensure safe retries without side effects |
| Time window | Seconds (TTL-based, default 30s) | Minutes to days (idempotency key stored) |
| Storage | In-memory Map | Database or persistent store |
| Methods | Any (typically GET) | Typically POST/PUT/PATCH/DELETE |
| Result sharing | Same promise shared by waiters | Same response returned for same key |
| Sibling module | N/A | `/home/runner/workspace/agent-gateway/src/idempotency/` (if present in future) |

The request deduplicator is a **runtime concurrency** optimization. Idempotency is a **semantic guarantee** for repeated requests. They can be used together: idempotency keys ensure safe retries, while the deduplicator ensures concurrent retries share a single execution.

**Note:** The `src/idempotency/` directory referenced in the task description does not currently exist in the codebase. When it is added, it will handle persistent idempotency key management (storing and replaying results for `Idempotency-Key` headers over longer time windows).

## Integration Points

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| API Gateway | `/home/runner/workspace/agent-gateway/src/api-gateway/` | Deduplicate inbound requests at the gateway before routing. |
| Rate Limit Engine | `/home/runner/workspace/agent-gateway/src/rate-limit-engine/` | Apply rate limiting before deduplication to reject excess traffic early. |
| Cache Manager | `/home/runner/workspace/agent-gateway/src/cache-manager/` | Deduplication complements caching: cache handles repeat requests over time, deduplication handles concurrent duplicates. |
| Observability Engine | `/home/runner/workspace/agent-gateway/src/observability-engine/` | Emit deduplication metrics (rate, peak concurrency) as custom metrics. |
| Infra Logger | `/home/runner/workspace/agent-gateway/src/infra/` | Internal logging of deduplication hits, misses, and errors. |

## Error Handling

- **Error propagation:** If the underlying function `fn()` throws, the error is propagated to all waiters. The `error` event is emitted with the dedup key and error message.
- **Cleanup on error:** The deduplication entry is removed after a 100ms delay (to allow late joiners), even if the request failed.
- **Concurrency overflow:** When `maxConcurrent` is reached, the request executes without deduplication. A warning is logged, but no error is thrown.
- **TTL expiration:** Expired entries are cleaned up during both the periodic cleanup interval (running at `ttlMs` intervals) and on deduplication key lookup.
- **Graceful shutdown:** Call `destroy()` to stop the cleanup interval and clear all entries. This should be done as part of the application's graceful shutdown sequence.

## Performance Characteristics

| Metric | Complexity | Notes |
|--------|-----------|-------|
| Key generation | O(1) | SHA-256 hash of concatenated strings |
| Deduplication lookup | O(1) | Map.get() by key |
| Memory per entry | ~100 bytes | Key + promise reference + metadata |
| Max memory | `maxConcurrent * ~100 bytes` | Bounded by concurrency limit |
| Cleanup overhead | O(n) per interval | Iterates all entries, removes expired ones |

## Related Documentation

- [Cache Manager](/home/runner/workspace/agent-gateway/src/cache-manager/README.md) -- Caching for repeated requests over longer time windows; complements deduplication.
- [Rate Limit Engine](/home/runner/workspace/agent-gateway/src/rate-limit-engine/README.md) -- Rate limiting to reject excess traffic before deduplication.
- [API Gateway](/home/runner/workspace/agent-gateway/src/api-gateway/README.md) -- Gateway-level request handling patterns.
- [Observability Engine](/home/runner/workspace/agent-gateway/src/observability-engine/README.md) -- Monitoring deduplication metrics and events.
- [Request Tracker](/home/runner/workspace/agent-gateway/src/request-tracker/README.md) -- Track individual request lifecycles.
