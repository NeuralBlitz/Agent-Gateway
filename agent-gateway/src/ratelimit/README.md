# Rate Limit (`src/ratelimit/`)

> **Rate limiting and throttling — protect the gateway from abuse and overload.**

---

## Overview

The `ratelimit/` module implements rate limiting and request throttling for Agent Gateway. It uses a token-bucket algorithm via `rate-limiter-flexible` to enforce limits at three levels (global, per-channel, per-user) and a separate `Throttler` for controlling concurrent call rates.

Rate limiting is essential for:
- Preventing API cost overruns from provider calls
- Protecting against abuse and spam
- Ensuring fair usage across multiple users
- Staying within provider rate limits

---

## File Structure

```
ratelimit/
└── index.ts    # RateLimiter + Throttler implementations
```

---

## RateLimiter

### Configuration

```json
{
  "rateLimit": {
    "global": {
      "points": 100,
      "duration": 60
    },
    "perChannel": {
      "points": 50,
      "duration": 60
    },
    "perUser": {
      "points": 20,
      "duration": 60
    }
  }
}
```

| Setting | Description |
|---------|-------------|
| `global.points` | Max requests across all users/channels |
| `global.duration` | Time window in seconds for global limit |
| `perChannel.points` | Max requests per channel |
| `perChannel.duration` | Time window per channel |
| `perUser.points` | Max requests per user ID |
| `perUser.duration` | Time window per user |

### Implementation

The RateLimiter uses `RateLimiterMemory` from `rate-limiter-flexible`:

```typescript
class RateLimiter {
  private global: RateLimiterMemory;
  private perChannel: RateLimiterMemory;
  private perUser: RateLimiterMemory;

  constructor(config: RateLimitConfig) {
    this.global = new RateLimiterMemory({
      points: config.global.points,
      duration: config.global.duration,
    });
    this.perChannel = new RateLimiterMemory({
      points: config.perChannel.points,
      duration: config.perChannel.duration,
    });
    this.perUser = new RateLimiterMemory({
      points: config.perUser.points,
      duration: config.perUser.duration,
    });
  }
}
```

### Checking Limits

```typescript
/**
 * Check if a request is allowed
 * @returns true if allowed, false if rate limited
 */
async isAllowed(channelId: string, userId: string): Promise<boolean> {
  try {
    // Check global limit
    await this.global.consume(1);

    // Check per-channel limit
    if (channelId) {
      await this.perChannel.consume(channelId, 1);
    }

    // Check per-user limit
    if (userId) {
      await this.perUser.consume(userId, 1);
    }

    return true;
  } catch (rejRes) {
    return false; // Rate limited
  }
}
```

Limits are checked in order: global → channel → user. If ANY limit is exceeded, the request is rejected.

### Rate Limited Response

When a request is rate limited, the server returns:

```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again later.",
    "status": 429,
    "retryAfter": 30
  }
}
```

With headers:
```
Retry-After: 30
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1704067260
```

---

## Throttler

The `Throttler` controls the rate of concurrent operations, enforcing minimum time between calls.

### Configuration

```typescript
new Throttler({
  minTime: 100,    // Minimum ms between calls
  maxConcurrent: 5, // Max concurrent operations
});
```

### Usage

```typescript
const throttler = new Throttler({ minTime: 100 });

// Throttled function call
await throttler.throttle(async () => {
  return await someApiCall();
});
```

The throttler ensures:
1. At least `minTime` ms between consecutive calls
2. At most `maxConcurrent` operations running simultaneously
3. Queued calls execute in order after the minTime elapses

### Implementation

```typescript
class Throttler {
  private queue: Array<() => Promise<void>> = [];
  private lastCallTime = 0;
  private running = 0;

  constructor(private config: { minTime: number; maxConcurrent: number }) {}

  async throttle<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        const elapsed = Date.now() - this.lastCallTime;
        if (elapsed < this.config.minTime) {
          await sleep(this.config.minTime - elapsed);
        }
        this.lastCallTime = Date.now();
        this.running++;
        try {
          resolve(await fn());
        } catch (err) {
          reject(err);
        } finally {
          this.running--;
          this.processQueue();
        }
      });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.running >= this.config.maxConcurrent) return;
    const next = this.queue.shift();
    if (next) next();
  }
}
```

---

## Rate Limiting Layers

### Layer 1: HTTP Layer (Express Middleware)

Applied to all incoming HTTP requests:

```typescript
app.use(rateLimit.middleware());
```

Checks global, per-channel (from request path), and per-user (from API key) limits.

### Layer 2: Message Layer (AutoReply)

Applied to incoming messages from channels:

```typescript
if (!(await rateLimiter.isAllowed(message.channelType, message.from.id))) {
  return; // Silently drop rate-limited messages
}
```

### Layer 3: Provider Layer

Applied to AI provider API calls:

```typescript
// Provider-level rate limiting handled by the providers themselves
// The gateway respects provider rate limits via Retry-After headers
```

---

## Default Limits

| Layer | Limit | Window | Purpose |
|-------|-------|--------|---------|
| Global | 100 requests | 60s | Prevent total overload |
| Per-Channel | 50 requests | 60s | Prevent channel-specific spam |
| Per-User | 20 requests | 60s | Prevent user-level spam |

### Tuning Guidelines

| Scenario | Recommended Limits |
|----------|-------------------|
| **Personal use** | Global: 1000/60s, Per-user: 100/60s |
| **Small team** | Global: 500/60s, Per-user: 50/60s |
| **Public bot** | Global: 200/60s, Per-user: 10/60s |
| **Testing** | Global: 10000/60s, Per-user: 1000/60s |

---

## Redis Backend

For distributed deployments, rate limiting can use Redis as the backend:

```typescript
import { RateLimiterRedis } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterRedis({
  storeClient: redisClient,
  points: 100,
  duration: 60,
});
```

This ensures rate limits are enforced across multiple gateway instances.

---

## Metrics

Rate limiting events are tracked in Prometheus metrics:

| Metric | Type | Labels |
|--------|------|--------|
| `rate_limit_hits_total` | Counter | `type` (global, channel, user) |
| `throttled_calls_total` | Counter | — |

---

## Related Documentation

- [`server/`](../server/README.md) — Where rate limiting middleware is applied
- [`auto-reply/`](../auto-reply/README.md) — Where message-level rate limiting happens
- [`observability/`](../observability/README.md) — Metrics for rate limit events
- [`cache/`](../cache/README.md) — Redis backend shared with rate limiter
