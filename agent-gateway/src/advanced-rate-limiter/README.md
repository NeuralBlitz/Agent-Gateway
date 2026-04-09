# Advanced Rate Limiter Module

## Overview

The Advanced Rate Limiter module provides a production-grade, multi-strategy rate limiting engine for the Agent Gateway. It supports four distinct algorithms -- Token Bucket, Sliding Window Log, Fixed Window, and Leaky Bucket -- with automatic fallback to Redis-backed distributed rate limiting when a Redis connection is available.

Rate limiting is critical for protecting the gateway from abuse, ensuring fair resource allocation across tenants, and preventing upstream provider throttling. This module is designed to operate both in single-node (in-memory) and multi-node (Redis-backed) deployments, with per-key isolation that allows fine-grained control over which clients, endpoints, or tenants are rate-limited.

The module exports a primary `AdvancedRateLimiter` class and a convenience factory function `createAdvancedRateLimiter()`.

---

## File Structure

```
advanced-rate-limiter/
  index.ts          # Main module: all algorithm implementations and the AdvancedRateLimiter class
```

The entire module is self-contained in a single file. Each rate-limiting algorithm is implemented as a private class (`TokenBucket`, `SlidingWindowLog`, `LeakyBucket`) with the `AdvancedRateLimiter` class orchestrating strategy selection, Redis integration, and key management.

---

## Class / Function API

### Types

#### `RateLimitStrategy`

```typescript
export type RateLimitStrategy = 'token-bucket' | 'sliding-window-log' | 'fixed-window' | 'leaky-bucket';
```

Defines the four supported rate-limiting strategies:

- **`token-bucket`**: Allows burst traffic up to a bucket capacity, then smooths to a steady refill rate. Ideal for APIs that can handle occasional bursts but need sustained throttling.
- **`sliding-window-log`**: Maintains a precise log of request timestamps within a sliding window. Most accurate but highest memory usage. Ideal when precision matters.
- **`fixed-window`**: Simple counter reset at fixed intervals (currently falls through to allow in the default case).
- **`leaky-bucket`**: Smooths traffic to a constant output rate, regardless of input burstiness. Ideal for protecting downstream services from traffic spikes.

#### `RateLimitResult`

```typescript
export interface RateLimitResult {
  allowed: boolean;      // Whether the request is permitted
  limit: number;         // Maximum allowed requests in the window
  remaining: number;     // Remaining requests in the current window
  resetAt: number;       // Unix timestamp (ms) when the window resets
  retryAfter?: number;   // Seconds to wait before retrying (only when not allowed)
}
```

#### `RateLimitOptions`

```typescript
export interface RateLimitOptions {
  strategy?: RateLimitStrategy;  // Algorithm to use (default: 'sliding-window-log')
  max: number;                   // Maximum requests per window
  window: number;                // Window size in seconds
  burst?: number;                // Burst size for token bucket (defaults to max)
  redisUrl?: string;             // Redis URL for distributed mode
}
```

### `TokenBucket` (Private Class)

Implements the token bucket algorithm with continuous refill.

| Method | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `(maxTokens: number, refillRate: number)` | Creates a bucket with the given capacity and refill rate (tokens/second) |
| `consume` | `(count?: number) => boolean` | Attempts to consume tokens. Returns `true` if successful. |
| `getTokens` | `() => number` | Returns the current number of available tokens (after refill). |
| `refill` | `() => void` | Internal: refills tokens based on elapsed time. |

### `SlidingWindowLog` (Private Class)

Maintains a precise log of request timestamps for accurate rate limiting.

| Method | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `(maxRequests: number, windowMs: number)` | Creates a sliding window with the given max requests and window duration in ms. |
| `allow` | `() => RateLimitResult` | Checks if a request is allowed and records it if so. |

### `LeakyBucket` (Private Class)

Smooths request bursts to a constant output rate.

| Method | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `(capacity: number, leakRate: number)` | Creates a leaky bucket with the given capacity and leak rate (units/second). |
| `allow` | `() => boolean` | Attempts to add a unit to the bucket. Returns `true` if there is capacity. |

### `AdvancedRateLimiter` Class

The main orchestrator class that manages rate limiters per key and handles Redis integration.

| Method | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `(redisUrl?: string)` | Creates a new rate limiter. If `redisUrl` is provided (or `REDIS_URL` env var is set), distributed mode is enabled. |
| `check` | `(key: string, opts: RateLimitOptions, count?: number) => Promise<RateLimitResult>` | Checks if a request for the given key is allowed. Automatically uses Redis if available, otherwise falls back to in-memory. |
| `reset` | `(key: string) => Promise<void>` | Resets all rate limit state for the given key (both in-memory and Redis). |
| `getRedis` | `() => Promise<any>` | Internal: lazily initializes Redis connection. |
| `checkLocal` | `(key: string, opts: RateLimitOptions, count: number) => RateLimitResult` | Internal: performs in-memory rate limiting. |
| `checkRedis` | `(key: string, opts: RateLimitOptions) => Promise<RateLimitResult>` | Internal: performs distributed rate limiting via Redis sorted sets. |

### Factory Function

```typescript
export function createAdvancedRateLimiter(redisUrl?: string): AdvancedRateLimiter
```

Convenience factory that creates an `AdvancedRateLimiter` instance. The `redisUrl` parameter is optional -- if omitted, the module falls back to the `REDIS_URL` environment variable.

---

## Configuration Options

### Environment Variables

| Variable | Type | Description |
|----------|------|-------------|
| `REDIS_URL` | `string` | Redis connection URL. If set, enables distributed rate limiting across multiple gateway instances. |

### Constructor Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `redisUrl` | `string` | `process.env.REDIS_URL` | Optional Redis URL for distributed mode. |

### Per-Check Options (`RateLimitOptions`)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `strategy` | `RateLimitStrategy` | `'sliding-window-log'` | Which algorithm to use |
| `max` | `number` | **Required** | Maximum requests per window |
| `window` | `number` | **Required** | Window size in seconds |
| `burst` | `number` | `max` | Burst capacity (token bucket / leaky bucket only) |
| `redisUrl` | `string` | Constructor value | Override Redis URL for this check |

---

## Usage Examples

### Basic In-Memory Rate Limiting

```typescript
import { createAdvancedRateLimiter } from './src/advanced-rate-limiter/index.js';

const limiter = createAdvancedRateLimiter();

// Check rate limit for a user
const result = await limiter.check('user:42', {
  strategy: 'sliding-window-log',
  max: 100,
  window: 60, // 100 requests per 60 seconds
});

if (!result.allowed) {
  console.log(`Rate limited. Retry after ${result.retryAfter}s`);
} else {
  console.log(`${result.remaining} requests remaining`);
}
```

### Token Bucket with Burst

```typescript
const limiter = createAdvancedRateLimiter();

// Allow bursts of 20, then smooth to 10/second
const result = await limiter.check('api:search', {
  strategy: 'token-bucket',
  max: 10,
  burst: 20,
  window: 1,
});

// Consume multiple tokens at once
const bulkResult = await limiter.check('api:bulk-import', {
  strategy: 'token-bucket',
  max: 5,
  burst: 50,
  window: 1,
}, 10); // consume 10 tokens
```

### Leaky Bucket for Downstream Protection

```typescript
// Smooth traffic to an upstream API that has strict rate limits
const result = await limiter.check('upstream:openai', {
  strategy: 'leaky-bucket',
  max: 60,       // 60 requests per minute
  burst: 10,     // Allow small bursts
  window: 60,
});

if (!result.allowed) {
  // Queue the request or return 429
  return res.status(429).json({
    error: 'Rate limited',
    retryAfter: result.retryAfter,
  });
}
```

### Distributed Mode with Redis

```typescript
// When multiple gateway instances are running behind a load balancer
const limiter = createAdvancedRateLimiter('redis://localhost:6379');

// All instances share rate limit state via Redis
const result = await limiter.check('tenant:acme-corp', {
  strategy: 'sliding-window-log',
  max: 1000,
  window: 3600, // 1000 requests per hour across ALL instances
});
```

### Resetting Rate Limit State

```typescript
// Clear rate limits for a specific key (e.g., after a plan upgrade)
await limiter.reset('user:42');

// Reset will clear both in-memory state and Redis keys
```

### Express Middleware Integration

```typescript
import express from 'express';
import { createAdvancedRateLimiter } from './src/advanced-rate-limiter/index.js';

const app = express();
const limiter = createAdvancedRateLimiter();

app.use('/api', async (req, res, next) => {
  const key = `ip:${req.ip}`;
  const result = await limiter.check(key, {
    strategy: 'sliding-window-log',
    max: 60,
    window: 60,
  });

  res.set('X-RateLimit-Limit', String(result.limit));
  res.set('X-RateLimit-Remaining', String(result.remaining));
  res.set('X-RateLimit-Reset', String(result.resetAt));

  if (!result.allowed) {
    res.set('Retry-After', String(result.retryAfter));
    return res.status(429).json({
      error: 'Too many requests',
      retryAfter: result.retryAfter,
    });
  }

  next();
});
```

---

## Integration Points

| Module | Integration |
|--------|-------------|
| `../infra` | Uses `logger` for operational logging |
| Redis (ioredis) | Lazily loaded via dynamic `import('ioredis')` when `redisUrl` is provided |
| API Gateway | Rate limit checks can be wired into the gateway's request processing pipeline |
| Admin Module | The admin panel can reset rate limits via system actions |

---

## Algorithm Comparison

| Algorithm | Accuracy | Memory | Burst Support | Best Use Case |
|-----------|----------|--------|---------------|---------------|
| Token Bucket | Good | Low (per-key state) | Yes | APIs with burst tolerance |
| Sliding Window Log | Exact | High (stores timestamps) | No | Precise enforcement |
| Fixed Window | Approximate | Low (single counter) | No | Simple, low-overhead limiting |
| Leaky Bucket | Good | Low (per-key state) | Limited | Protecting downstream services |

---

## Redis Distributed Mode

When a Redis URL is provided (either via constructor or `REDIS_URL` env var), the rate limiter switches to distributed mode using Redis sorted sets:

1. Each check uses a Redis pipeline for atomicity:
   - `ZREMRANGEBYSCORE` — Remove expired entries outside the window
   - `ZCARD` — Count current requests in the window
   - `ZADD` — Add the current request timestamp
   - `EXPIRE` — Set key expiration for automatic cleanup
2. The `agw:rl:` prefix is used to namespace all rate limit keys in Redis.
3. If Redis connection fails, the limiter gracefully falls back to in-memory mode.

**Note**: In distributed mode, the strategy is always sliding-window regardless of the `strategy` option, since Redis sorted sets naturally implement sliding-window semantics.

---

## Error Handling

- **Redis connection failure**: If Redis is unavailable, the limiter silently falls back to in-memory mode. No exception is thrown.
- **Dynamic import failure**: If the `ioredis` package is not installed, Redis mode is disabled and in-memory mode is used.
- **Invalid options**: If `max` or `window` are not provided, the behavior is undefined -- callers should validate options before calling `check()`.

---

## Performance Characteristics

- **In-memory mode**: O(1) for token bucket and leaky bucket; O(n) for sliding window log where n is the number of requests in the window (old entries are pruned on each check).
- **Redis mode**: O(1) amortized via pipelined commands. Network round-trip latency is the primary bottleneck.
- **Memory usage**: In-memory mode stores one object per unique key. Under high cardinality (many unique keys), memory can grow. Consider periodic cleanup or Redis mode for production.

---

## Related Documentation

- [API Gateway Module](../api-gateway/README.md) — Where rate limiting is typically applied
- [API Proxy Module](README.md) — Upstream proxying that benefits from rate limiting
- [Admin Module](../admin/README.md) — Admin endpoints for operational control
- [Analytics Module](../analytics/README.md) — Track rate limiting impact on usage patterns
