# Rate Limit Engine

Enterprise multi-dimensional rate limiting engine for the Agent Gateway. This module implements four rate limiting algorithms (token bucket, sliding window log, fixed window counter, and leaky bucket), supports Redis-backed distributed limiting, per-tenant isolation, configurable rule registration, and comprehensive rate limit statistics.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [Types and Interfaces](#types-and-interfaces)
    - [RateLimitAlgorithm](#ratelimitalgorithm)
    - [RateLimitRule](#ratelimitrule)
    - [RateLimitContext](#ratelimitcontext)
    - [RateLimitResult](#ratelimitresult)
  - [RateLimitEngine Class](#ratelimitengine-class)
  - [registerRule()](#registerrule)
  - [unregisterRule()](#unregisterrule)
  - [check()](#check)
  - [reset()](#reset)
  - [getStats()](#getstats)
  - [listRules()](#listrules)
  - [close()](#close)
  - [Factory Function](#factory-function)
- [Algorithm Implementations](#algorithm-implementations)
  - [Token Bucket](#token-bucket)
  - [Sliding Window Log](#sliding-window-log)
  - [Leaky Bucket](#leaky-bucket)
  - [Fixed Window Counter](#fixed-window-counter)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Rate Limit Engine vs. Rate Limiter vs. Ratelimit](#rate-limit-engine-vs-rate-limiter-vs-ratelimit)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Redis-Based Distributed Limiting](#redis-based-distributed-limiting)
- [Related Documentation](#related-documentation)

## Overview

Rate limiting protects APIs from abuse, ensures fair resource allocation, and prevents system overload. The `RateLimitEngine` goes beyond simple fixed-window counters by offering four distinct algorithms, each with different trade-offs:

**Algorithm Comparison:**

| Algorithm | Burst Handling | Smoothness | Memory | Best For |
|-----------|---------------|------------|--------|----------|
| Token Bucket | Allows bursts up to bucket size | Smooth average rate | O(1) per key | API rate limits with burst tolerance |
| Sliding Window Log | No bursts -- strict | Exact enforcement | O(n) per window | Strict compliance requirements |
| Leaky Bucket | Smooths out bursts | Constant output rate | O(1) per key | Traffic shaping, smoothing |
| Fixed Window Counter | Allows burst at window boundary | Coarse-grained | O(1) per key | Simple quotas (e.g., daily limits) |

**Key features:**
- **Multi-rule evaluation:** Multiple rules can apply to a single request; the engine evaluates all applicable rules.
- **Key-based targeting:** Rules generate keys from request context (IP, user ID, tenant ID, API key, path).
- **Redis distributed limiting:** When Redis is configured, rate limits are enforced across multiple gateway instances.
- **Per-tenant isolation:** Different tenants can have different rate limit rules.
- **Method and path filtering:** Rules can target specific HTTP methods or path patterns.
- **Event-driven:** Emits events on every rate limit check.

## File Structure

```
/home/runner/workspace/agent-gateway/src/rate-limit-engine/
  index.ts          # RateLimitEngine class, algorithm implementations, interfaces
  README.md         # This documentation file
```

## Installation and Import

```typescript
import { RateLimitEngine, createRateLimitEngine } from '../rate-limit-engine/index.js';
// or with the full absolute path:
// import { RateLimitEngine, createRateLimitEngine } from '/home/runner/workspace/agent-gateway/src/rate-limit-engine/index.js';
```

## API Reference

### Types and Interfaces

#### RateLimitAlgorithm

```typescript
export type RateLimitAlgorithm = 'token-bucket' | 'sliding-window-log' | 'fixed-window' | 'leaky-bucket';
```

#### RateLimitRule

A rule defining rate limiting behavior for a specific pattern.

```typescript
export interface RateLimitRule {
  /** Unique rule name */
  name: string;
  /** Algorithm to use */
  algorithm: RateLimitAlgorithm;
  /** Max requests allowed in the window */
  max: number;
  /** Time window in seconds */
  window: number;
  /** Burst size (for token bucket / leaky bucket) */
  burst?: number;
  /** Key generator function */
  keyFn: (context: RateLimitContext) => string;
  /** HTTP methods to apply (empty = all methods) */
  methods?: string[];
  /** Path pattern (regex string) */
  pathPattern?: string;
  /** Response message when rate limited */
  responseMessage?: string;
  /** Whether to include rate limit headers */
  includeHeaders?: boolean;
}
```

#### RateLimitContext

The request context used for rate limit evaluation.

```typescript
export interface RateLimitContext {
  ip?: string;
  userId?: string;
  tenantId?: string;
  apiKey?: string;
  path?: string;
  method?: string;
  headers?: Record<string, string>;
  [key: string]: any;
}
```

#### RateLimitResult

The result of evaluating a rate limit rule.

```typescript
export interface RateLimitResult {
  allowed: boolean;
  rule: string;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}
```

### RateLimitEngine Class

Extends `EventEmitter` for rate limit check observability.

```typescript
export class RateLimitEngine extends EventEmitter {
  constructor(redisUrl?: string);

  registerRule(rule: RateLimitRule): void;
  unregisterRule(name: string): boolean;
  async check(context: RateLimitContext): Promise<{
    results: RateLimitResult[];
    blocked: boolean;
    mostRestrictive?: RateLimitResult;
  }>;
  async reset(ruleName: string, key: string): Promise<void>;
  getStats(): {
    rules: number;
    checks: number;
    allowed: number;
    denied: number;
    denialRate: number;
    activeBuckets: number;
    activeWindows: number;
  };
  listRules(): Array<{ name: string; algorithm: string; max: number; window: number }>;
  async close(): Promise<void>;
}
```

**Events emitted:**
| Event | Payload | Description |
|-------|---------|-------------|
| `rate:check` | `{ rule, key, allowed }` | A rate limit rule was evaluated |

### registerRule()

Registers a rate limit rule.

**Signature:**
```typescript
registerRule(rule: RateLimitRule): void
```

**Parameters:**
- `rule: RateLimitRule` -- The rule configuration including algorithm, limits, key function, and optional filters.

### unregisterRule()

Removes a rate limit rule by name.

**Signature:**
```typescript
unregisterRule(name: string): boolean
```

**Returns:** `true` if the rule was found and removed, `false` otherwise.

### check()

Evaluates all applicable rate limit rules against a request context.

**Signature:**
```typescript
async check(context: RateLimitContext): Promise<{
  results: RateLimitResult[];
  blocked: boolean;
  mostRestrictive?: RateLimitResult;
}>
```

**Parameters:**
- `context: RateLimitContext` -- The request context with IP, user ID, path, method, etc.

**Returns:**
- `results` -- Array of results from all applicable rules.
- `blocked` -- `true` if any rule denied the request.
- `mostRestrictive` -- The result with the fewest remaining requests.

**Behavior:**
1. Iterates over all registered rules.
2. Skips rules that don't match the request method or path pattern.
3. Generates a key using the rule's `keyFn`.
4. Evaluates the rate limit (in-memory or Redis-based).
5. Aggregates results and determines if the request is blocked.

### reset()

Resets rate limit counters for a specific rule and key.

**Signature:**
```typescript
async reset(ruleName: string, key: string): Promise<void>
```

### getStats()

Returns engine statistics.

**Signature:**
```typescript
getStats(): {
  rules: number;
  checks: number;
  allowed: number;
  denied: number;
  denialRate: number;
  activeBuckets: number;
  activeWindows: number;
}
```

### listRules()

Lists all registered rules.

**Signature:**
```typescript
listRules(): Array<{ name: string; algorithm: string; max: number; window: number }>
```

### close()

Closes the Redis connection and clears all in-memory state.

**Signature:**
```typescript
async close(): Promise<void>
```

### Factory Function

```typescript
export function createRateLimitEngine(redisUrl?: string): RateLimitEngine
```

Convenience factory for creating the engine with optional Redis.

## Algorithm Implementations

### Token Bucket

Each key has a bucket of tokens that refills at a constant rate. Requests consume tokens. When the bucket is empty, requests are denied.

```
max tokens = burst (or max if burst not set)
refill rate = max / window (tokens per second)
```

**Properties:**
- Allows bursts up to the bucket size.
- Smooths average rate over time.
- O(1) time and space per key.

**Example:**
```typescript
engine.registerRule({
  name: 'api-burst',
  algorithm: 'token-bucket',
  max: 100,
  window: 60,
  burst: 20, // Allow bursts of up to 20 requests
  keyFn: (ctx) => ctx.ip || 'anonymous',
  includeHeaders: true,
});
```

### Sliding Window Log

Maintains a log of request timestamps. Counts requests within the sliding window.

**Properties:**
- Exact enforcement -- no boundary effects.
- Higher memory usage (stores all timestamps).
- O(n) where n = requests in window.

**Example:**
```typescript
engine.registerRule({
  name: 'strict-api',
  algorithm: 'sliding-window-log',
  max: 100,
  window: 60,
  keyFn: (ctx) => `${ctx.userId}:${ctx.path}`,
});
```

### Leaky Bucket

Requests fill a bucket that leaks at a constant rate. If the bucket overflows, the request is denied.

```
capacity = burst (or max if burst not set)
leak rate = max / window (requests per second)
```

**Properties:**
- Smooths request rate to a constant output.
- Good for traffic shaping.
- O(1) time and space per key.

### Fixed Window Counter

Counts requests within fixed time windows. Resets at window boundaries.

**Properties:**
- Simple and efficient.
- Can allow 2x burst at window boundaries (e.g., all requests at end of window 1 and start of window 2).
- O(1) time and space per key.

**Example:**
```typescript
engine.registerRule({
  name: 'daily-limit',
  algorithm: 'fixed-window',
  max: 10000,
  window: 86400, // 24 hours
  keyFn: (ctx) => ctx.apiKey || ctx.ip || 'anonymous',
});
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `redisUrl` | `string` | undefined | Redis URL for distributed limiting. If not provided, uses in-memory storage. |

Rules are configured individually via `registerRule()`.

## Usage Examples

### Multi-Layer Rate Limiting

```typescript
import { createRateLimitEngine } from '/home/runner/workspace/agent-gateway/src/rate-limit-engine/index.js';

const engine = createRateLimitEngine(process.env.REDIS_URL);

// Global IP-based limit
engine.registerRule({
  name: 'global-ip',
  algorithm: 'token-bucket',
  max: 1000,
  window: 3600, // 1000 requests per hour per IP
  burst: 50,
  keyFn: (ctx) => `ip:${ctx.ip || 'unknown'}`,
});

// Per-user limit
engine.registerRule({
  name: 'per-user',
  algorithm: 'sliding-window-log',
  max: 500,
  window: 3600, // 500 requests per hour per user
  keyFn: (ctx) => `user:${ctx.userId || 'anonymous'}`,
});

// Strict limit on authentication endpoints
engine.registerRule({
  name: 'auth-limit',
  algorithm: 'fixed-window',
  max: 10,
  window: 60, // 10 login attempts per minute
  pathPattern: '/api/auth/(login|token)',
  keyFn: (ctx) => `auth:${ctx.ip || 'unknown'}`,
});

// Tenant-based limit
engine.registerRule({
  name: 'tenant-limit',
  algorithm: 'leaky-bucket',
  max: 200,
  window: 60,
  burst: 30,
  keyFn: (ctx) => `tenant:${ctx.tenantId || 'unknown'}`,
});
```

### Express.js Middleware

```typescript
app.use(async (req, res, next) => {
  const context: import('/home/runner/workspace/agent-gateway/src/rate-limit-engine/index.js').RateLimitContext = {
    ip: req.ip,
    userId: req.user?.id,
    tenantId: req.user?.tenantId,
    path: req.path,
    method: req.method,
    headers: req.headers,
  };

  const { results, blocked, mostRestrictive } = await engine.check(context);

  if (blocked) {
    const restrictive = mostRestrictive!;
    return res.status(429).json({
      error: 'Rate limit exceeded',
      rule: restrictive.rule,
      limit: restrictive.limit,
      remaining: 0,
      retryAfter: restrictive.retryAfter,
      resetAt: new Date(restrictive.resetAt).toISOString(),
    });
  }

  // Add rate limit headers
  if (mostRestrictive) {
    res.setHeader('X-RateLimit-Limit', mostRestrictive.limit);
    res.setHeader('X-RateLimit-Remaining', mostRestrictive.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(mostRestrictive.resetAt).toISOString());
  }

  next();
});
```

### Reset Rate Limit for a User

```typescript
// Admin endpoint to reset a user's rate limit
app.post('/api/admin/rate-limit/reset/:userId/:ruleName', async (req, res) => {
  await engine.reset(req.params.ruleName, `user:${req.params.userId}`);
  res.json({ message: `Rate limit reset for user ${req.params.userId}`);
});
```

### Rate Limit Dashboard

```typescript
app.get('/api/admin/rate-limit/stats', (_req, res) => {
  const stats = engine.getStats();
  const rules = engine.listRules();

  res.json({
    ...stats,
    rules,
    denialRatePercent: (stats.denialRate * 100).toFixed(2) + '%',
  });
});
```

## Rate Limit Engine vs. Rate Limiter vs. Ratelimit

Three modules handle rate limiting in the codebase, each with different scope and implementation:

| Aspect | Rate Limit Engine (this module) | Rate Limiter (`src/ratelimit/`) | Rate Limiter (non-existent) |
|--------|--------------------------------|--------------------------------|----------------------------|
| Location | `/home/runner/workspace/agent-gateway/src/rate-limit-engine/` | `/home/runner/workspace/agent-gateway/src/ratelimit/` | `/home/runner/workspace/agent-gateway/src/rate-limiter/` (does not exist) |
| Algorithms | 4 (token bucket, sliding window, leaky bucket, fixed window) | 1 (fixed window via `rate-limiter-flexible`) | N/A |
| Dependencies | None (pure JS implementations) | `rate-limiter-flexible` npm package | N/A |
| Redis support | Yes (custom sliding window via sorted sets) | Yes (via `rate-limiter-flexible`) | N/A |
| Rule system | Yes (named rules with key functions) | Simple per-key check | N/A |
| Multi-rule eval | Yes (evaluates all matching rules) | Single limiter check | N/A |
| Throttler | No | Yes (separate `Throttler` class with queue) | N/A |
| Best for | Complex, multi-layer rate limiting | Simple rate limiting with external library | N/A |

The `src/rate-limiter/` directory does not exist in the codebase. The two existing modules are:
- **Rate Limit Engine** (this module): Self-contained, algorithm-rich, rule-based.
- **Ratelimit** (`src/ratelimit/`): Wraps the `rate-limiter-flexible` npm package, includes a `Throttler` for request queuing with `maxConcurrent` and `minTime` controls.

## Integration Points

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| API Gateway | `/home/runner/workspace/agent-gateway/src/api-gateway/` | Apply rate limiting as the first middleware layer. |
| Cache Manager | `/home/runner/workspace/agent-gateway/src/cache-manager/` | Share Redis connection between rate limiting and caching. |
| Request Deduplicator | `/home/runner/workspace/agent-gateway/src/request-deduplicator/` | Rate limit before deduplication to reject excess traffic early. |
| Observability Engine | `/home/runner/workspace/agent-gateway/src/observability-engine/` | Track rate limit denial rates as metrics. |
| Security Scanner | `/home/runner/workspace/agent-gateway/src/security-scanner/` | Security scanner has its own request rate check; the Rate Limit Engine provides configurable multi-algorithm limiting. |

## Error Handling

- **Redis unavailability:** If Redis connection fails, the engine falls back to in-memory rate limiting. A warning is logged on startup.
- **No matching rules:** If no rules match the request context (no method/path filter match, or keyFn returns falsy), the request is allowed with no results.
- **Key function errors:** If `keyFn` throws, the rule is skipped for that request.
- **Graceful shutdown:** Call `close()` to quit Redis and clear all in-memory state.

## Redis-Based Distributed Limiting

When a `redisUrl` is provided, all rate limit checks use Redis sorted sets (sliding window algorithm):

1. `ZREMRANGEBYSCORE key 0 windowStart` -- Remove expired entries.
2. `ZCARD key` -- Count current requests.
3. `ZADD key now uniqueId` -- Add current request.
4. `EXPIRE key window + 1` -- Set TTL.

This ensures consistent rate limiting across multiple gateway instances. The `key` format is `agw:rl:<ruleName>:<generatedKey>`.

## Related Documentation

- [Ratelimit](/home/runner/workspace/agent-gateway/src/ratelimit/README.md) -- Simpler rate limiter using `rate-limiter-flexible` with throttler.
- [Cache Manager](/home/runner/workspace/agent-gateway/src/cache-manager/README.md) -- Shared Redis infrastructure.
- [API Gateway](/home/runner/workspace/agent-gateway/src/api-gateway/README.md) -- Gateway-level rate limiting.
- [Security Scanner](/home/runner/workspace/agent-gateway/src/security-scanner/README.md) -- Security-level request rate checking.
- [Observability Engine](/home/runner/workspace/agent-gateway/src/observability-engine/README.md) -- Monitoring rate limit metrics.
