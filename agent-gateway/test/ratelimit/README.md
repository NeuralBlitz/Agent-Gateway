# Rate Limit Tests

> **Test suite for rate limiting in Agent Gateway**

This directory contains tests for the rate limiting subsystem, which protects the gateway from abuse and API exhaustion. Tests cover global rate limits, per-user rate limits, per-channel rate limits, and the throttler implementation.

---

## Table of Contents

- [Overview](#overview)
- [Test Scope](#test-scope)
- [Rate Limiting Architecture](#rate-limiting-architecture)
- [Test Files](#test-files)
- [Test Scenarios](#test-scenarios)
- [Mocking Strategy](#mocking-strategy)
- [Running Rate Limit Tests](#running-rate-limit-tests)
- [Algorithm Details](#algorithm-details)
- [Writing New Rate Limit Tests](#writing-new-rate-limit-tests)
- [Integration Points](#integration-points)

---

## Overview

Location: `/home/runner/workspace/agent-gateway/test/ratelimit/`

The rate limiting system enforces request limits at multiple levels:

1. **Global rate limit**: Total requests across all users and channels
2. **Per-user rate limit**: Requests per individual user
3. **Per-channel rate limit**: Requests per channel type
4. **Per-provider rate limit**: API calls per AI provider

The implementation uses the `rate-limiter-flexible` library for efficient sliding window rate limiting.

---

## Test Scope

| Component | Source Location | Test Coverage |
|-----------|----------------|---------------|
| `RateLimiter` class | `src/ratelimit/index.ts` | Core rate limiting logic |
| `Throttler` class | `src/ratelimit/index.ts` | Request throttling |
| Rate limit middleware | `src/server/` | HTTP middleware integration |
| Rate limit engine | `src/rate-limit-engine/index.ts` | Advanced rate limiting |
| Advanced rate limiter | `src/advanced-rate-limiter/index.ts` | Complex rate configurations |

---

## Rate Limiting Architecture

### Rate Limiter Class

```typescript
class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig);

  /** Check if a request is allowed */
  async isAllowed(key: string): Promise<boolean>;

  /** Consume a point from the rate limit */
  async consume(key: string): Promise<{ remaining: number; reset: number }>;

  /** Reset rate limit for a key */
  reset(key: string): void;

  /** Get current state for a key */
  get(key: string): { used: number; remaining: number; reset: number };
}
```

### Configuration

```typescript
interface RateLimitConfig {
  global: {
    points: number;     // Maximum requests
    duration: number;   // Window in seconds
  };
  perUser: {
    points: number;
    duration: number;
  };
  perChannel?: {
    points: number;
    duration: number;
  };
  perProvider?: {
    points: number;
    duration: number;
  };
}
```

### Request Flow

```
Incoming Request
       │
       ▼
┌──────────────────────┐
│ Check Global Limit   │──► Exceeded ──► Return 429
└────────┬─────────────┘
         │ Allowed
         ▼
┌──────────────────────┐
│ Check Per-User Limit │──► Exceeded ──► Return 429
└────────┬─────────────┘
         │ Allowed
         ▼
┌──────────────────────┐
│ Consume Points       │──► Update counters
└────────┬─────────────┘
         │
         ▼
   Process Request
```

---

## Test Files

| File | Coverage |
|------|----------|
| `/home/runner/workspace/agent-gateway/test/ratelimit/*.test.ts` | Rate limiter and throttler tests (this directory) |
| `/home/runner/workspace/agent-gateway/test/gateway.test.ts` | Rate limiting integration in gateway tests |

---

## Test Scenarios

### Global Rate Limiting

- Requests within limit are allowed
- Requests exceeding limit are rejected
- Rate limit resets after window expires
- Remaining count decreases with each request
- Reset timestamp is accurate

### Per-User Rate Limiting

- Each user has independent limit
- User A exhausting limit does not affect User B
- User key is derived from userId
- Unknown users get default limits

### Per-Channel Rate Limiting

- Each channel type has independent limit
- Telegram limit exhaustion does not affect Discord
- Channel key derived from channel type

### Throttler

- Requests are throttled to specified rate
- Burst handling behavior
- Queue management for pending requests

### Reset Behavior

- Manual reset clears counters
- Automatic reset after window expires
- Reset does not affect other keys

### Error Handling

- Invalid configuration throws error
- Negative points/duration handled gracefully
- Storage backend errors are caught

---

## Mocking Strategy

### Mock Rate Limiter Backend

```typescript
import { vi } from 'vitest';

vi.mock('rate-limiter-flexible', () => ({
  RateLimiterMemory: vi.fn().mockImplementation(() => ({
    consume: vi.fn().mockResolvedValue({
      remainingPoints: 9,
      msBeforeNextReset: 60000,
    }),
    penalty: vi.fn(),
    reward: vi.fn(),
    delete: vi.fn(),
    get: vi.fn().mockResolvedValue({
      consumedPoints: 1,
      isFirstInDuration: true,
    }),
  })),
}));
```

---

## Running Rate Limit Tests

```bash
cd /home/runner/workspace/agent-gateway

# Run rate limit tests
npm run test -- ratelimit

# Run specific test file
npm run test -- ratelimit/rate-limiter.test.ts

# Run with coverage for ratelimit module
npm run test:coverage -- --include "src/ratelimit/**"
```

---

## Algorithm Details

### Sliding Window Counter

The rate limiter uses a sliding window algorithm:

1. Each request is recorded with a timestamp
2. When checking the limit, only requests within the current window are counted
3. The window slides forward with time, automatically expiring old requests

### Token Bucket (Alternative)

Some rate limiters use the token bucket algorithm:

1. Bucket starts full with `points` tokens
2. Each request consumes one token
3. Tokens refill at a constant rate
4. If bucket is empty, request is rejected

---

## Writing New Rate Limit Tests

### Checklist

- [ ] Test rate limit allows requests within threshold
- [ ] Test rate limit rejects requests over threshold
- [ ] Test rate limit resets after window
- [ ] Test independent keys do not affect each other
- [ ] Test remaining count is accurate
- [ ] Test reset functionality
- [ ] Test error handling for invalid config
- [ ] Test concurrent requests under rate limit

### Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '/home/runner/workspace/agent-gateway/src/ratelimit/index.js';

describe('RateLimiter - Per-User', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      perUser: { points: 3, duration: 60 }, // 3 requests per minute
    });
  });

  it('should allow requests within limit', async () => {
    expect(await limiter.consume('user1')).toBeTruthy();
    expect(await limiter.consume('user1')).toBeTruthy();
    expect(await limiter.consume('user1')).toBeTruthy();
  });

  it('should reject requests over limit', async () => {
    await limiter.consume('user1');
    await limiter.consume('user1');
    await limiter.consume('user1');

    await expect(limiter.consume('user1')).rejects.toThrow();
  });

  it('should not affect other users', async () => {
    await limiter.consume('user1');
    await limiter.consume('user1');
    await limiter.consume('user1');

    // user2 should still have full allowance
    expect(await limiter.consume('user2')).toBeTruthy();
  });
});
```

---

## Integration Points

The rate limiting system integrates with:

| Component | Integration |
|-----------|-------------|
| **Server Middleware** | Rate limit check on every request |
| **Auth System** | Failed auth attempts count toward rate limit |
| **Provider** | Per-provider rate limits |
| **Channel** | Per-channel rate limits |
| **Observability** | Rate limit metrics and alerts |
| **Response Headers** | X-RateLimit-* headers on responses |
| **API Response** | 429 status with Retry-After header |
