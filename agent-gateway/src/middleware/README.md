# Middleware (`src/middleware/`)

> **Express middleware components for rate limiting and request validation, providing enterprise-grade request processing for the Agent Gateway.**

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture](#architecture)
4. [Rate Limiting (`rate-limit.ts`)](#rate-limiting-rate-limitts)
5. [Request Validation (`validation.ts`)](#request-validation-validationts)
6. [Combined Usage](#combined-usage)
7. [Integration Points](#integration-points)
8. [Error Handling](#error-handling)
9. [Best Practices](#best-practices)
10. [Related Documentation](#related-documentation)

---

## Overview

The `middleware/` module provides two core Express middleware components that form the foundation of request processing in the Agent Gateway:

### Rate Limiting (`rate-limit.ts`)

A **per-tenant, per-user, per-IP sliding window rate limiter** with Redis-backed or in-memory storage. It supports:

- **Multiple concurrent rules** -- Global, per-IP, per-user, per-tenant, and path-specific limits
- **Sliding window counters** -- In-memory sliding window for accurate rate tracking
- **Redis support** -- Optional Redis backend for distributed rate limiting across instances
- **Default rule set** -- Pre-configured rules for common scenarios (auth endpoints, streaming, etc.)
- **Rate limit headers** -- Automatic `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers
- **Configurable responses** -- Custom 429 responses with retry information

### Request Validation (`validation.ts`)

A **Zod-based request validation system** with automatic OpenAPI spec generation and input sanitization:

- **Zod schema validation** -- Type-safe validation for request body, query, and parameters
- **Pre-built schemas** -- Schemas for common Agent Gateway operations (send message, stream, sessions)
- **Automatic type coercion** -- Query string parameters coerced to correct types via `z.coerce`
- **XSS sanitization** -- Built-in HTML entity encoding to prevent cross-site scripting
- **OpenAPI generation** -- Automatic OpenAPI 3.0 spec generation from validation rules
- **Detailed error responses** -- Structured error responses with field-level validation messages

---

## File Structure

```
middleware/
├── rate-limit.ts     # RateLimitManager, SlidingWindowCounter, RedisRateLimiter
└── validation.ts     # ValidationManager, pre-built Zod schemas, XSS sanitizer
```

### `rate-limit.ts` (~200 lines)

Contains three classes:
- `SlidingWindowCounter` -- In-memory sliding window rate limiter
- `RedisRateLimiter` -- Redis-based rate limiter (fixed window)
- `RateLimitManager` -- Rule-based middleware orchestrator

### `validation.ts` (~240 lines)

Contains:
- Four pre-built Zod schemas (`SendMessageSchema`, `StreamRequestSchema`, `SessionQuerySchema`, `PaginationSchema`)
- `ValidationManager` class with rule-based validation and OpenAPI generation
- XSS sanitization logic

---

## Architecture

### Request Processing Pipeline

```
HTTP Request
     │
     ▼
┌──────────────────────────┐
│   Rate Limit Middleware   │
│                          │
│  1. Match rules          │
│  2. Check each rule      │
│  3. Return 429 if limited│
│  4. Set rate limit headers│
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│   Validation Middleware   │
│                          │
│  1. Find matching rule   │
│  2. Validate body/query  │
│  3. Sanitize input       │
│  4. Return 400 if invalid│
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│   Route Handler           │
│   (validated data ready)  │
└──────────────────────────┘
```

---

## Rate Limiting (`rate-limit.ts`)

### Type Definitions

```typescript
interface RateLimitRule {
  /** Unique rule name */
  name: string;
  /** Max requests in the window */
  max: number;
  /** Window in seconds */
  window: number;
  /** Key generator function */
  keyFn: (req: any) => string;
  /** HTTP methods to apply (default: all) */
  methods?: string[];
  /** Path pattern to apply (default: all) */
  pathPattern?: RegExp;
  /** Response message when rate limited */
  message?: string;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;  // Seconds until retry is allowed
}

interface RateLimitConfig {
  /** Redis URL (default: in-memory) */
  redisUrl?: string;
  /** Default rules */
  rules?: RateLimitRule[];
}
```

### Classes

#### `SlidingWindowCounter` (Internal)

In-memory sliding window counter:

```typescript
class SlidingWindowCounter {
  check(key: string, max: number, window: number): RateLimitResult
  reset(key: string): void
  cleanup(): void
}
```

#### `RedisRateLimiter` (Internal)

Redis-based fixed window rate limiter:

```typescript
class RedisRateLimiter {
  constructor(redisUrl: string)
  check(key: string, max: number, window: number): Promise<RateLimitResult>
}
```

Uses Redis pipeline for atomic increment + expire operations. Falls back to "allowed" if Redis is unavailable.

#### `RateLimitManager`

```typescript
class RateLimitManager {
  constructor(config?: RateLimitConfig)

  addRule(rule: RateLimitRule): void
  removeRule(name: string): boolean
  middleware(): (req: any, res: any, next: () => void) => Promise<void>
  destroy(): void

  // Static default rules
  static defaultRules(): RateLimitRule[]
}

function createRateLimitManager(config?: RateLimitConfig): RateLimitManager
```

### Default Rules

The `RateLimitManager.defaultRules()` static method provides these pre-configured rules:

| Rule Name | Max | Window | Key | Path |
|-----------|-----|--------|-----|------|
| `global` | 1000 | 60s | `global` | All |
| `per-ip` | 100 | 60s | `ip:{ip}` | All |
| `per-user` | 60 | 60s | `user:{id}` or `anon:{ip}` | All |
| `per-tenant` | 500 | 60s | `tenant:{tenantId}` | All (`/./`) |
| `api-stream` | 10 | 60s | `stream:{id}` | `/api/stream` |
| `auth-endpoints` | 10 | 300s | `auth:{ip}` | `/api/(auth\|login\|register)` |

### Usage Examples

#### Basic Setup

```typescript
import { createRateLimitManager } from '../middleware/rate-limit.js';

const rateLimiter = createRateLimitManager();
app.use(rateLimiter.middleware());
```

#### With Redis Backend

```typescript
const rateLimiter = createRateLimitManager({
  redisUrl: process.env.REDIS_URL,
});
app.use(rateLimiter.middleware());
```

#### Custom Rules

```typescript
const rateLimiter = createRateLimitManager();

rateLimiter.addRule({
  name: 'expensive-operation',
  max: 5,
  window: 3600, // 5 per hour
  keyFn: (req) => `expensive:${req.user?.id || req.ip}`,
  pathPattern: /\/api\/expensive/,
  message: 'Too many expensive operations. Try again later.',
});

rateLimiter.addRule({
  name: 'read-only',
  max: 1000,
  window: 60, // 1000 per minute for reads
  keyFn: (req) => `read:${req.user?.id || req.ip}`,
  methods: ['GET'],
});

app.use(rateLimiter.middleware());
```

#### Response Headers

All requests receive rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1712678460
```

When rate limited:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 45
Content-Type: application/json

{
  "error": "Too many requests",
  "message": "Try again in 45s",
  "retryAfter": 45
}
```

#### Cleanup

```typescript
// Periodic cleanup of expired in-memory windows
rateLimiter.destroy(); // Clears the internal cleanup interval
```

---

## Request Validation (`validation.ts`)

### Pre-Built Zod Schemas

#### `SendMessageSchema`

Validates message-sending requests:

```typescript
const SendMessageSchema = z.object({
  channel: z.string().min(1).max(50),
  userId: z.string().min(1).max(100),
  content: z.string().min(1).max(10000),
  metadata: z.record(z.any()).optional(),
});
```

| Field | Type | Constraints |
|-------|------|-------------|
| `channel` | string | 1-50 characters, required |
| `userId` | string | 1-100 characters, required |
| `content` | string | 1-10000 characters, required |
| `metadata` | object | Any key-value pairs, optional |

#### `StreamRequestSchema`

Validates streaming requests:

```typescript
const StreamRequestSchema = z.object({
  channel: z.string().min(1).max(50),
  userId: z.string().min(1).max(100),
  content: z.string().min(1).max(10000),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});
```

| Field | Type | Constraints |
|-------|------|-------------|
| `channel` | string | 1-50 characters, required |
| `userId` | string | 1-100 characters, required |
| `content` | string | 1-10000 characters, required |
| `model` | string | Optional model name |
| `temperature` | number | 0-2 range, optional |

#### `SessionQuerySchema`

Validates session query parameters:

```typescript
const SessionQuerySchema = z.object({
  channel: z.string().optional(),
  userId: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).optional(),
  offset: z.coerce.number().min(0).optional(),
});
```

Uses `z.coerce` to automatically convert query string values to numbers.

#### `PaginationSchema`

Validates pagination parameters:

```typescript
const PaginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  pageSize: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
```

### ValidationManager Class

```typescript
interface ValidationRule {
  method: string;           // HTTP method
  path: RegExp;             // Path pattern
  body?: z.ZodType<any>;    // Body schema
  query?: z.ZodType<any>;   // Query schema
  params?: z.ZodType<any>;  // URL params schema
  stripUnknown?: boolean;   // Strip unknown fields
}

class ValidationManager {
  addRule(rule: ValidationRule): void
  middleware(): (req: any, res: any, next: () => void) => Promise<void>
  registerDefaults(): void
  generateOpenApiSpec(info: { title: string; version: string }): any
}

function createValidationManager(): ValidationManager
```

### Default Rules

`registerDefaults()` registers these rules:

| Method | Path | Schema |
|--------|------|--------|
| POST | `/api/send` | `SendMessageSchema` |
| POST | `/api/stream` | `StreamRequestSchema` |
| GET | `/api/sessions` | `SessionQuerySchema` |

### Usage Examples

#### Basic Setup

```typescript
import { createValidationManager } from '../middleware/validation.js';

const validation = createValidationManager(); // Already has default rules
app.use(validation.middleware());
```

#### Custom Validation Rules

```typescript
const validation = new ValidationManager();

validation.addRule({
  method: 'POST',
  path: /^\/api\/users$/,
  body: z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    age: z.number().min(0).optional(),
  }),
});

validation.addRule({
  method: 'GET',
  path: /^\/api\/users\/\d+$/,
  params: z.object({
    id: z.string().regex(/^\d+$/),
  }),
});

app.use(validation.middleware());
```

#### Validation Error Response

When validation fails, a structured 400 response is returned:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "channel",
      "message": "String must contain at least 1 character(s)",
      "code": "too_small"
    },
    {
      "field": "content",
      "message": "String must contain at most 10000 character(s)",
      "code": "too_big"
    }
  ]
}
```

#### OpenAPI Spec Generation

```typescript
const openapi = validation.generateOpenApiSpec({
  title: 'Agent Gateway API',
  version: '1.0.0',
});

// Output:
// {
//   "openapi": "3.0.3",
//   "info": { "title": "Agent Gateway API", "version": "1.0.0" },
//   "paths": {
//     "/api/send": {
//       "post": {
//         "summary": "POST /api/send",
//         "requestBody": { ... },
//         "responses": { ... }
//       }
//     }
//   }
// }
```

#### XSS Sanitization

The validation middleware automatically sanitizes string values in the request body:

```typescript
// Input
req.body = { message: '<script>alert("xss")</script>Hello' };

// After validation middleware
req.body = { message: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Hello' };
```

Characters escaped:
- `<` --> `&lt;`
- `>` --> `&gt;`
- `"` --> `&quot;`
- `'` --> `&#x27;`
- `/` --> `&#x2F;`

---

## Combined Usage

### Complete Middleware Stack

```typescript
import express from 'express';
import { createRateLimitManager } from '../middleware/rate-limit.js';
import { createValidationManager } from '../middleware/validation.js';
import { createIdempotencyManager } from '../idempotency/index.js';

const app = express();
app.use(express.json());

const rateLimiter = createRateLimitManager();
const validation = createValidationManager();
const idempotency = createIdempotencyManager();

// Apply middleware in correct order:
// 1. Rate limiting (reject abuse before processing)
// 2. Idempotency (deduplicate retries)
// 3. Validation (ensure request correctness)
app.post('/api/send',
  rateLimiter.middleware(),
  idempotency.middleware(),
  validation.middleware(),
  async (req, res) => {
    // req.body is validated and sanitized
    // Rate limits have been checked
    // Duplicate requests were handled
    const result = await processMessage(req.body);
    res.json(result);
  }
);
```

### Middleware Execution Order

```
Request
  │
  ▼
[1] Rate Limit Middleware
  │   - Checks all matching rules
  │   - Returns 429 if any rule is exceeded
  │   - Sets X-RateLimit-* headers
  │
  ▼
[2] Idempotency Middleware (if configured)
  │   - Checks X-Idempotency-Key header
  │   - Returns cached response if duplicate
  │   - Intercepts res.json() for caching
  │
  ▼
[3] Validation Middleware
  │   - Matches request to validation rules
  │   - Validates body, query, params
  │   - Sanitizes input (XSS protection)
  │   - Returns 400 if validation fails
  │
  ▼
[4] Route Handler
      - All checks passed
      - req.body is validated and sanitized
      - Rate limit context available via headers
```

---

## Integration Points

### With `src/openapi/`

The `ValidationManager.generateOpenApiSpec()` method produces a basic OpenAPI spec. For more comprehensive documentation, combine with the dedicated `openapi/` module:

```typescript
import { createOpenApiGenerator } from '../openapi/index.js';

const openapi = createOpenApiGenerator({
  title: 'Agent Gateway API',
  version: '1.0.0',
  description: 'RESTful API for agent communication',
});

// Merge validation-generated spec
const validationSpec = validation.generateOpenApiSpec({
  title: 'Agent Gateway API',
  version: '1.0.0',
});

Object.assign(openapi.paths, validationSpec.paths);

// Add security schemes
openapi.addBearerAuth();
openapi.addCommonResponses();

// Serve the spec
app.get('/openapi.json', (req, res) => {
  res.json(JSON.parse(openapi.generateJson()));
});
```

### With `src/infra/` (Logger)

Both modules log via the shared logger:

```typescript
// Rate limiting
logger.warn({ rule, key, limit, window }, 'Rate limited');

// Validation
logger.warn({ path, method, errors }, 'Request validation failed');
```

### With `src/notifications/`

Alert on persistent rate limiting:

```typescript
// Track rate limited requests
let rateLimitCount = 0;

app.use((req, res, next) => {
  const originalStatus = res.status.bind(res);
  res.status = function(code: number) {
    if (code === 429) {
      rateLimitCount++;
      if (rateLimitCount >= 100) {
        notifications.warning(
          'High Rate Limiting',
          `${rateLimitCount} requests rate limited in last interval`,
        );
        rateLimitCount = 0;
      }
    }
    return originalStatus(code);
  };
  next();
});
```

---

## Error Handling

### Rate Limiting Errors

When a request exceeds rate limits:

- **HTTP Status**: 429 Too Many Requests
- **Headers**: `Retry-After` with seconds until retry window resets
- **Body**: Structured error with retry information

```json
{
  "error": "Too many requests",
  "message": "Try again in 45s",
  "retryAfter": 45
}
```

### Validation Errors

When request validation fails:

- **HTTP Status**: 400 Bad Request
- **Body**: Detailed field-level errors

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "channel", "message": "...", "code": "too_small" }
  ]
}
```

### Redis Fallback

If Redis is unavailable, the rate limiter falls back to allowing all requests:

```typescript
if (!redis) {
  return { allowed: true, limit: max, remaining: max, resetAt: Date.now() + window * 1000 };
}
```

This is a fail-open strategy ensuring availability over strict rate limiting when the backend is unavailable.

---

## Best Practices

1. **Apply rate limiting globally** -- Use `app.use(rateLimiter.middleware())` to apply to all routes, then add specific rules for sensitive endpoints.

2. **Use Redis for multi-instance deployments** -- The in-memory counter only works for single-instance deployments. Use Redis for clusters.

3. **Order middleware correctly** -- Rate limit first (cheapest check), then idempotency, then validation (most expensive).

4. **Use `z.coerce` for query parameters** -- Query strings are always strings. `z.coerce.number()` handles conversion automatically.

5. **Enable XSS sanitization** -- The default sanitization escapes HTML entities in request bodies. Do not disable it unless you have alternative protection.

6. **Monitor rate limit headers** -- The `X-RateLimit-Remaining` header helps clients self-regulate before hitting limits.

7. **Customize auth endpoint limits** -- The default auth endpoint limit (10 per 5 minutes) is conservative. Adjust based on your traffic patterns.

8. **Generate OpenAPI specs at build time** -- Use `generateOpenApiSpec()` during build rather than at runtime for better performance.

9. **Use validation rules for all public endpoints** -- Every externally-facing API endpoint should have validation rules to ensure input correctness.

10. **Test with invalid inputs** -- The validation middleware returns detailed errors. Use these to build robust client-side error handling.

---

## Related Documentation

- [``](../idempotency/README.md) -- Idempotency middleware for safe retries
- [`src/openapi/`](../openapi/README.md) -- OpenAPI spec generation
- [`src/infra/`](../infra/README.md) -- Shared logging infrastructure
- [`src/api-gateway/`](../api-gateway/README.md) -- Main API gateway that uses these middleware components
- [`src/error-handler/`](../error-handler/README.md) -- Global error handling
