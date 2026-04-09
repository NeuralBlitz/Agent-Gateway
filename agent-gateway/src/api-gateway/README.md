# API Gateway Module

## Overview

The API Gateway module is the core routing and request-handling engine of the Agent Gateway system. It provides a programmable gateway that registers route configurations, matches incoming requests to routes, caches responses, logs all traffic, and exposes operational statistics.

Designed as an EventEmitter-based service, the gateway decouples routing logic from request transport, making it adaptable to HTTP servers, WebSocket connections, or any other transport layer. It supports wildcard and parameterized route patterns, response caching with TTL, request/response transformation hooks, retry policies, circuit breaker integration, and custom handlers.

This module serves as the central nervous system of the gateway -- all incoming API traffic flows through it, and all other modules (rate limiting, proxying, versioning, analytics) integrate at this layer.

---

## File Structure

```
api-gateway/
  index.ts          # Main module: ApiGateway class, interfaces, and factory function
```

The entire module is implemented in a single `index.ts` file, exporting the `ApiGateway` class, TypeScript interfaces, and a factory function.

---

## Class / Function API

### Types

#### `RouteConfig`

Defines a single route in the gateway.

```typescript
export interface RouteConfig {
  path: string;                              // Route pattern (supports wildcards: /api/*, /users/:id)
  methods: string[];                         // HTTP methods (e.g., ['GET', 'POST'] or ['*'])
  upstream?: string;                         // Target upstream URL for proxying
  requireAuth?: boolean;                     // Whether authentication is required
  permissions?: string[];                    // Required permission strings
  rateLimit?: { max: number; window: number }; // Rate limit config (requests per window in seconds)
  cacheTtl?: number;                         // Response cache TTL in seconds
  transformRequest?: (req: any) => Promise<any>;    // Request transformation function
  transformResponse?: (res: any) => Promise<any>;   // Response transformation function
  timeout?: number;                          // Request timeout in milliseconds
  retries?: { max: number; delayMs: number }; // Retry configuration
  circuitBreaker?: string;                   // Circuit breaker name
  logRequests?: boolean;                     // Whether to log requests for this route
  handler?: (req: any, res: any) => Promise<void>; // Custom handler (bypasses upstream proxy)
}
```

#### `RequestLog`

Represents a single logged request.

```typescript
export interface RequestLog {
  id: string;           // Unique request ID
  method: string;       // HTTP method
  path: string;         // Request path
  statusCode: number;   // Response status code
  latencyMs: number;    // Request latency in milliseconds
  timestamp: number;    // Unix timestamp (ms)
  upstream?: string;    // Upstream URL that served the response
  cached: boolean;      // Whether the response was served from cache
  retryCount: number;   // Number of retries performed
}
```

### `ApiGateway` Class

Extends `EventEmitter` for event-driven architecture.

| Method | Signature | Description |
|--------|-----------|-------------|
| `register` | `(config: RouteConfig) => void` | Registers a single route. Emits a log event. |
| `registerAll` | `(configs: RouteConfig[]) => void` | Registers multiple routes at once. |
| `matchRoute` | `(method: string, path: string) => RouteConfig \| null` | Finds the first matching route for a given method and path. |
| `extractParams` | `(pattern: string, path: string) => Record<string, string>` | Extracts named path parameters from a matched route (e.g., `:id` from `/users/:id`). |
| `getFromCache` | `(key: string) => any \| null` | Retrieves a cached response by cache key. Returns `null` if expired or missing. |
| `setInCache` | `(key: string, data: any, ttl: number) => void` | Stores a response in the cache with the given TTL (seconds). Auto-cleans when cache exceeds 10,000 entries. |
| `logRequest` | `(log: Omit<RequestLog, 'id' \| 'timestamp'>) => void` | Logs a request. Generates a unique ID and timestamp. Emits `request:logged` event. Auto-truncates at 10,000 entries. |
| `getLogs` | `(limit?: number, path?: string, status?: number) => RequestLog[]` | Returns recent request logs, optionally filtered by path prefix and status code. |
| `getStats` | `() => { totalRoutes, cacheSize, totalRequests, avgLatencyMs, errorRate, cacheHitRate }` | Returns aggregated gateway statistics. |
| `clearCache` | `(pattern?: string) => number` | Clears cache entries. If `pattern` is provided, only entries whose key includes the pattern are removed. Returns the count of cleared entries. |
| `listRoutes` | `() => Array<{ path, methods, upstream?, cacheTtl?, requireAuth? }>` | Returns a summary of all registered routes (excludes sensitive fields like transform functions). |

### Factory Function

```typescript
export function createApiGateway(): ApiGateway
```

Convenience factory that creates an `ApiGateway` instance.

---

## Route Pattern Syntax

The gateway supports three types of route patterns:

### Exact Match

```typescript
gateway.register({ path: '/api/health', methods: ['GET'] });
// Matches: GET /api/health
// Does not match: GET /api/health/extra
```

### Wildcard Match

```typescript
gateway.register({ path: '/api/*', methods: ['GET', 'POST'] });
// Matches: GET /api/anything, POST /api/users/create, etc.
```

### Parameterized Match

```typescript
gateway.register({ path: '/users/:id/posts/:postId', methods: ['GET'] });
// Matches: GET /users/42/posts/99
// extractParams returns: { id: '42', postId: '99' }
```

---

## Configuration Options

The gateway itself has no external configuration file. All configuration is done programmatically through route registration.

### Route Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `path` | `string` | Route pattern (required) |
| `methods` | `string[]` | HTTP methods (required). Use `['*']` to match all methods. |
| `upstream` | `string` | Target URL for proxying. If not set, a custom `handler` must be provided. |
| `requireAuth` | `boolean` | Whether auth is required for this route. |
| `permissions` | `string[]` | Permission strings required to access this route. |
| `rateLimit` | `{ max, window }` | Rate limit for this specific route. |
| `cacheTtl` | `number` | Cache TTL in seconds. Set to 0 or omit to disable caching. |
| `transformRequest` | `function` | Async function to transform the request before forwarding. |
| `transformResponse` | `function` | Async function to transform the response before returning. |
| `timeout` | `number` | Request timeout in milliseconds. |
| `retries` | `{ max, delayMs }` | Retry configuration for failed requests. |
| `circuitBreaker` | `string` | Name of the circuit breaker to use for this route. |
| `logRequests` | `boolean` | Whether to log requests to the request log. |
| `handler` | `function` | Custom async handler that bypasses upstream proxying. |

---

## Usage Examples

### Basic Setup

```typescript
import { createApiGateway } from './src/api-gateway/index.js';

const gateway = createApiGateway();

// Register routes
gateway.register({
  path: '/api/health',
  methods: ['GET'],
  handler: async (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  },
});

gateway.register({
  path: '/api/users/:id',
  methods: ['GET'],
  upstream: 'http://user-service:3000',
  cacheTtl: 60, // Cache for 60 seconds
  requireAuth: true,
});

gateway.register({
  path: '/api/*',
  methods: ['*'],
  upstream: 'http://backend:8080',
  rateLimit: { max: 100, window: 60 },
});

// Match a request
const route = gateway.matchRoute('GET', '/api/users/42');
if (route) {
  const params = gateway.extractParams(route.path, '/api/users/42');
  console.log(params); // { id: '42' }
}
```

### Request/Response Transformation

```typescript
gateway.register({
  path: '/api/v2/search',
  methods: ['POST'],
  upstream: 'http://search-service:9200',
  transformRequest: async (req) => {
    // Add authentication header
    req.headers = { ...req.headers, 'X-Api-Key': 'secret' };
    return req;
  },
  transformResponse: async (res) => {
    // Envelope the response
    return { success: true, data: res };
  },
});
```

### Caching

```typescript
// Manually interact with the cache
// Note: cache keys are generated internally; use your own key string or derive one externally
const myKey = 'get:/api/users/42';
const cached = gateway.getFromCache(myKey);

if (cached) {
  console.log('Cache hit!');
} else {
  // Fetch from upstream, then cache
  const data = await fetchFromUpstream();
  gateway.setInCache(myKey, data, 120); // Cache for 2 minutes
}

// Clear all cache
const cleared = gateway.clearCache();
console.log(`Cleared ${cleared} cache entries`);

// Clear cache for a specific pattern
gateway.clearCache('/api/users');
```

### Event Listening

```typescript
// Listen for logged requests
gateway.on('request:logged', (logEntry) => {
  console.log(
    `${logEntry.method} ${logEntry.path} -> ${logEntry.statusCode} (${logEntry.latencyMs}ms)`
  );

  if (logEntry.statusCode >= 500) {
    // Alert on server errors
    sendAlert(`Server error on ${logEntry.path}`);
  }
});
```

### Viewing Statistics

```typescript
const stats = gateway.getStats();
console.log(stats);
// {
//   totalRoutes: 5,
//   cacheSize: 234,
//   totalRequests: 15000,
//   avgLatencyMs: 145,
//   errorRate: 0.02,
//   cacheHitRate: 0.35
// }

const logs = gateway.getLogs(50, '/api/users', 200);
console.log(`Found ${logs.length} successful user API requests`);
```

---

## Integration Points

| Module | Integration |
|--------|-------------|
| `../infra` | Uses `logger` for route registration and operational logging |
| `../api-proxy` | The `upstream` field on routes delegates to the proxy module for forwarding |
| `../api-versioning` | Versioned routes can be registered alongside gateway routes |
| `../advanced-rate-limiter` | Per-route rate limiting via `rateLimit` config |
| `../analytics` | Request logs feed into analytics metrics |
| `../admin` | Admin endpoints read gateway state (channels, providers, health) |

---

## Cache Architecture

The gateway implements an in-memory LRU-style cache with the following properties:

- **Key generation**: Cache keys are SHA-256 hashes of `method:path:headers`, truncated to 16 hex characters.
- **TTL**: Set per-route via `cacheTtl` (in seconds). Expired entries are lazily evicted on access.
- **Auto-cleanup**: When the cache exceeds 10,000 entries, all expired entries are purged on the next `setInCache` call.
- **No distributed caching**: The cache is local to the process. For distributed caching, use Redis or Memcached externally.

---

## Error Handling

- **No matching route**: `matchRoute()` returns `null`. The caller is responsible for returning a 404 response.
- **Invalid route pattern**: If a route pattern produces an invalid regex, `pathMatches()` will throw. Ensure patterns use only supported syntax (`*` for wildcard, `:param` for named parameters).
- **Cache overflow**: The cache silently evicts expired entries when it exceeds 10,000 entries. No error is thrown.
- **Request log overflow**: The request log is capped at 10,000 entries. Oldest entries are silently removed via `shift()`.

---

## Route Matching Order

Routes are matched in **registration order** (first-match-wins):

1. The gateway iterates through all registered routes.
2. For each route, it checks if the HTTP method matches (or if the route accepts `*`).
3. If the method matches, it converts the route pattern to a regex and tests the request path.
4. The first route that matches both method and path is returned.

**Important**: Register more specific routes before general/wildcard routes to avoid accidental shadowing.

```typescript
// Correct order: specific first
gateway.register({ path: '/api/users/admin', methods: ['GET'], ... });
gateway.register({ path: '/api/users/:id', methods: ['GET'], ... });
gateway.register({ path: '/api/*', methods: ['*'], ... });

// Wrong order: wildcard shadows specific routes
gateway.register({ path: '/api/*', methods: ['*'], ... });       // Will match everything
gateway.register({ path: '/api/users/:id', methods: ['GET'], ... }); // Never reached
```

---

## Performance Characteristics

- **Route matching**: O(n) where n is the number of routes. Each match involves regex compilation and testing. For large route sets, consider caching compiled regexes.
- **Cache operations**: O(1) for get/set. Cleanup is O(m) where m is the number of expired entries.
- **Request logging**: O(1) amortized (push + occasional shift).
- **Memory**: Request log stores up to 10,000 entries. Cache stores up to 10,000 entries. Monitor memory in high-throughput scenarios.

---

## Related Documentation

- [API Proxy Module](README.md) — Upstream proxying used by gateway routes
- [API Versioning Module](README.md) — Version-aware routing
- [Advanced Rate Limiter](../advanced-rate-limiter/README.md) — Traffic shaping for gateway routes
- [Analytics Module](../analytics/README.md) — Usage analytics from gateway traffic
- [Admin Module](../admin/README.md) — Administrative access to gateway state
