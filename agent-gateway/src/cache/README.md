# Cache (`src/cache/`)

> **Response caching layer — LRU memory cache + optional Redis backend for provider responses.**

---

## Overview

The `cache/` module provides a response caching layer for AI provider calls. When the same message is sent to the same model with the same parameters, the cached response is returned immediately — saving API costs, reducing latency, and avoiding rate limits.

The cache supports two backends:
- **LRU Memory Cache**: Fast, in-memory cache using `lru-cache`
- **Redis**: Distributed cache shared across multiple gateway instances

---

## File Structure

```
cache/
└── index.ts    # ResponseCache implementation
```

---

## The `ResponseCache` Class

### Configuration

```json
{
  "cache": {
    "enabled": true,
    "ttl": 300,
    "maxSize": 1000,
    "backend": "memory",
    "cacheToolResponses": false
  }
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `enabled` | `false` | Whether caching is active |
| `ttl` | `300` (5 min) | Time-to-live in seconds |
| `maxSize` | `1000` | Maximum entries in memory cache |
| `backend` | `"memory"` | Cache backend: `"memory"` or `"redis"` |
| `cacheToolResponses` | `false` | Whether to cache results that involved tool execution |

### Constructor

```typescript
new ResponseCache(config: {
  enabled: boolean;
  ttl: number;
  maxSize: number;
  backend: 'memory' | 'redis';
  redisClient?: Redis;
  cacheToolResponses?: boolean;
})
```

---

## Cache Keys

Cache keys are generated from a SHA-256 hash of the request parameters:

```typescript
function generateCacheKey(
  messages: ChatMessage[],
  model: string,
  temperature: number,
  tools?: Tool[]
): string {
  const data = JSON.stringify({
    messages,
    model,
    temperature,
    tools: tools?.map(t => t.name),
  });
  return createHash('sha256').update(data).digest('hex');
}
```

This ensures that identical requests get cache hits:
- Same messages + same model + same temperature → cache hit
- Different temperature → cache miss (different response expected)
- Same messages + different model → cache miss

---

## Cache Operations

### `get(key: string)`

Retrieves a cached response:

```typescript
const cached = await cache.get(cacheKey);
if (cached) {
  recordCacheHit();
  return cached;
}
recordCacheMiss();
```

### `set(key: string, response: ModelResponse)`

Stores a response in the cache:

```typescript
await cache.set(cacheKey, response, { ttl: this.config.ttl });
```

### `delete(key: string)`

Removes a specific cache entry:

```typescript
await cache.delete(cacheKey);
```

### `clear()`

Flushes the entire cache:

```typescript
await cache.clear();
```

### `getStats()`

Returns cache statistics:

```typescript
const stats = cache.getStats();
// { hits: 150, misses: 300, size: 150, hitRate: 0.33 }
```

---

## LRU Memory Cache

The default backend uses `lru-cache` for fast, in-memory caching:

```typescript
import { LRUCache } from 'lru-cache';

class MemoryCacheBackend {
  private cache: LRUCache<string, ModelResponse>;

  constructor(maxSize: number, ttl: number) {
    this.cache = new LRUCache({
      max: maxSize,
      ttl: ttl * 1000, // Convert to ms
      updateAgeOnGet: true,
    });
  }

  async get(key: string): Promise<ModelResponse | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, value: ModelResponse): Promise<void> {
    this.cache.set(key, value);
  }
}
```

**LRU eviction**: When the cache reaches `maxSize`, the least recently used entries are evicted first. This ensures frequently accessed responses stay cached.

---

## Redis Cache

For distributed deployments, Redis provides a shared cache:

```typescript
class RedisCacheBackend {
  constructor(
    private redis: Redis,
    private ttl: number,
    private prefix: string = 'agent-gateway:cache:'
  ) {}

  async get(key: string): Promise<ModelResponse | null> {
    const data = await this.redis.get(this.prefix + key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: ModelResponse): Promise<void> {
    await this.redis.set(
      this.prefix + key,
      JSON.stringify(value),
      'EX',
      this.ttl
    );
  }
}
```

**Key format**: `agent-gateway:cache:{sha256-hash}`

---

## Cache Integration with Providers

The cache is applied at the provider level:

```typescript
// In provider wrapper:
async chatWithCache(messages: ChatMessage[], options?: ChatOptions): Promise<ModelResponse> {
  if (!this.cache.enabled) {
    return this.provider.chat(messages, options);
  }

  const key = generateCacheKey(messages, options.model, options.temperature);
  const cached = await this.cache.get(key);
  if (cached) {
    return cached;
  }

  const response = await this.provider.chat(messages, options);
  await this.cache.set(key, response);
  return response;
}
```

---

## When NOT to Cache

Some responses should NOT be cached:

| Scenario | Reason |
|----------|--------|
| Tool-calling responses | May have side effects, non-idempotent |
| Streaming responses | Partial responses aren't cacheable |
| Time-sensitive queries | Weather, news, stock prices |
| Error responses | Don't cache failures |

The `cacheToolResponses` option controls whether responses that triggered tool execution are cached. By default, this is `false` because tool execution may have side effects.

---

## Cache Hit Rate Monitoring

The cache hit rate is tracked via Prometheus metrics:

```
cache_hits_total 150
cache_misses_total 300
hit_rate = 150 / (150 + 300) = 33%
```

A low hit rate may indicate:
- Cache TTL is too short
- Messages are too diverse for caching
- Cache size is too small (entries evicted)

A high hit rate is generally desirable for repetitive queries (e.g., FAQ bots).

---

## Cache Invalidation

### TTL-Based
Entries automatically expire after the configured TTL.

### Manual
```typescript
// Clear specific entry
await cache.delete(specificKey);

// Clear all
await cache.clear();
```

### Size-Based
LRU eviction automatically removes the least-used entries when the cache is full.

---

## Usage Recommendations

| Use Case | Recommended Config |
|----------|-------------------|
| **FAQ bot** | enabled: true, ttl: 3600, maxSize: 5000 |
| **Creative writing** | enabled: false (each response should be unique) |
| **Code assistant** | enabled: true, ttl: 600, maxSize: 1000 |
| **Multi-instance** | enabled: true, backend: "redis", ttl: 300 |
| **Testing** | enabled: true, ttl: 60, maxSize: 100 |

---

## Related Documentation

- [`providers/`](../providers/README.md) — Providers that are cached
- [`observability/`](../observability/README.md) — Cache hit/miss metrics
- [`ratelimit/`](../ratelimit/README.md) — Redis shared with rate limiter
