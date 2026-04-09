# Cache Manager

Enterprise multi-tier cache management module for the Agent Gateway. This module implements a three-tier caching architecture with L1 (in-memory LRU), L2 (Redis), and L3 (database fallback) tiers, featuring automatic cache invalidation by tags, version-based invalidation, stampede protection, compression support, and comprehensive metrics.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [Types and Interfaces](#types-and-interfaces)
    - [CacheTier](#cachetier)
    - [CacheEntry\<T\>](#cacheentryt)
    - [CacheConfig](#cacheconfig)
    - [CacheStats](#cachestats)
  - [CacheManager Class](#cachemanager-class)
  - [get()](#get)
  - [set()](#set)
  - [delete()](#delete)
  - [invalidateByTag()](#invalidatebytag)
  - [invalidateByKey()](#invalidatebykey)
  - [clear()](#clear)
  - [getStats()](#getstats)
  - [getTagStats()](#gettagstats)
  - [resetStats()](#resetstats)
  - [close()](#close)
  - [Factory Function](#factory-function)
- [LRU Cache Implementation](#lru-cache-implementation)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Cache Manager vs. Cache (Response Cache)](#cache-manager-vs-cache-response-cache)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Cache Invalidation Patterns](#cache-invalidation-patterns)
- [Stampede Protection](#stampede-protection)
- [Related Documentation](#related-documentation)

## Overview

Caching is a critical performance optimization for any API. The `CacheManager` provides a sophisticated three-tier caching system:

**Tier Architecture:**

| Tier | Storage | Speed | Capacity | Use Case |
|------|---------|-------|----------|----------|
| L1 | In-memory LRU | Nanoseconds | 100,000 entries | Hot data, single-instance |
| L2 | Redis | Milliseconds | Limited by Redis memory | Shared across instances |
| L3 | Database/Regeneration | Seconds | Unlimited | Cold data, authoritative source |

**Key features:**
- **Automatic tier promotion:** Cache hits in L2 automatically promote entries to L1.
- **Tag-based invalidation:** Invalidate all cache entries with a specific tag (e.g., `'user:123'`, `'product:456'`).
- **Version-based invalidation:** Bump a version counter to logically invalidate stale entries.
- **Stampede protection:** Prevents multiple concurrent regenerations of the same cache key.
- **LRU eviction:** The L1 cache automatically evicts least-recently-used entries when full.
- **Memory estimation:** Tracks estimated memory usage for the L1 cache.
- **Event-driven:** Emits events for cache set, delete, eviction, invalidation, and clear operations.

## File Structure

```
/home/runner/workspace/agent-gateway/src/cache-manager/
  index.ts          # CacheManager class, LRUCache, interfaces, factory function
  README.md         # This documentation file
```

## Installation and Import

```typescript
import { CacheManager, createCacheManager } from '../cache-manager/index.js';
// or with the full absolute path:
// import { CacheManager, createCacheManager } from '/home/runner/workspace/agent-gateway/src/cache-manager/index.js';
```

## API Reference

### Types and Interfaces

#### CacheTier

```typescript
export type CacheTier = 'L1' | 'L2' | 'L3';
```

#### CacheEntry\<T\>

```typescript
export interface CacheEntry<T> {
  key: string;
  value: T;
  tier: CacheTier;
  expiresAt: number;
  createdAt: number;
  accessCount: number;
  lastAccessedAt: number;
  tags: string[];
  version: number;
  size?: number;
}
```

#### CacheConfig

```typescript
export interface CacheConfig {
  /** L1 max entries (default: 100000) */
  l1MaxEntries?: number;
  /** L2 Redis URL */
  redisUrl?: string;
  /** Default TTL in seconds (default: 3600) */
  defaultTtl?: number;
  /** Stampede protection: concurrent regen limit */
  stampedeLimit?: number;
  /** Compression for large values */
  compression?: boolean;
  /** Compression threshold in bytes */
  compressionThreshold?: number;
}
```

#### CacheStats

```typescript
export interface CacheStats {
  l1Hits: number;
  l1Misses: number;
  l2Hits: number;
  l2Misses: number;
  l3Hits: number;
  l3Misses: number;
  sets: number;
  deletes: number;
  invalidations: number;
  stampedePreventions: number;
  evictions: number;
  memoryUsageBytes: number;
}
```

### CacheManager Class

Extends `EventEmitter` for cache operation observability.

```typescript
export class CacheManager extends EventEmitter {
  constructor(config?: CacheConfig);

  async get<T>(key: string, regenerate?: () => Promise<T>, ttl?: number, tags?: string[]): Promise<T | null>;
  async set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void>;
  async delete(key: string): Promise<void>;
  async invalidateByTag(tag: string): Promise<number>;
  async invalidateByKey(key: string): Promise<void>;
  async clear(): Promise<void>;
  getStats(): CacheStats & {
    l1Size: number;
    l1HitRate: number;
    l2HitRate: number;
    estimatedMemoryMB: number;
  };
  getTagStats(): Array<{ tag: string; keyCount: number }>;
  resetStats(): void;
  async close(): Promise<void>;
}
```

**Events emitted:**
| Event | Payload | Description |
|-------|---------|-------------|
| `cache:set` | `{ key, tier, tags }` | A value was cached |
| `cache:delete` | `{ key }` | A key was deleted |
| `cache:eviction` | `{ key, tier }` | An LRU eviction occurred |
| `cache:invalidated` | `{ tag, count }` | Tag-based invalidation |
| `cache:clear` | -- | All caches cleared |

### get()

Retrieves a value from cache with automatic tier cascading and optional regeneration.

**Signature:**
```typescript
async get<T>(
  key: string,
  regenerate?: () => Promise<T>,
  ttl?: number,
  tags?: string[]
): Promise<T | null>
```

**Parameters:**
- `key: string` -- The cache key.
- `regenerate` (optional) -- An async function to regenerate the value on cache miss.
- `ttl` (optional) -- Time-to-live in seconds. Falls back to `defaultTtl` from config.
- `tags` (optional) -- Tags for group invalidation.

**Returns:** The cached value, regenerated value, or `null` if no cache hit and no regeneration function provided.

**Behavior:**
1. **L1 check:** Checks the in-memory LRU cache. On hit, updates access count and position.
2. **L2 check:** If L1 miss and Redis is configured, checks Redis. On hit, promotes to L1.
3. **Regeneration:** If both tiers miss and `regenerate` is provided, calls the function with stampede protection.

### set()

Stores a value across cache tiers.

**Signature:**
```typescript
async set<T>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void>
```

**Parameters:**
- `key: string` -- The cache key.
- `value: T` -- The value to cache.
- `ttl` (optional) -- TTL in seconds.
- `tags` (optional) -- Tags for group invalidation.

**Behavior:**
1. Stores in L1 (LRU cache).
2. If Redis is configured, stores in L2 with TTL.
3. Updates the tag index for tag-based invalidation.
4. Increments the version counter for the key.

### delete()

Removes a key from all cache tiers.

**Signature:**
```typescript
async delete(key: string): Promise<void>
```

**Behavior:**
1. Removes from L1.
2. Removes from L2 (Redis) if configured.
3. Removes from tag index.
4. Removes version counter.

### invalidateByTag()

Invalidates all cache entries associated with a tag.

**Signature:**
```typescript
async invalidateByTag(tag: string): Promise<number>
```

**Parameters:**
- `tag: string` -- The tag to invalidate.

**Returns:** The number of keys invalidated.

**Example:**
```typescript
// Tag a user's data
await cache.set('user:123:profile', userData, 3600, ['user:123']);
await cache.set('user:123:orders', orders, 3600, ['user:123']);

// Invalidate all of user 123's cached data
const count = await cache.invalidateByTag('user:123');
// count = 2
```

### invalidateByKey()

Invalidates a single key by bumping its version counter and deleting from all tiers.

**Signature:**
```typescript
async invalidateByKey(key: string): Promise<void>
```

### clear()

Clears all cache tiers and tag indices.

**Signature:**
```typescript
async clear(): Promise<void>
```

### getStats()

Returns comprehensive cache statistics.

**Signature:**
```typescript
getStats(): CacheStats & {
  l1Size: number;
  l1HitRate: number;
  l2HitRate: number;
  estimatedMemoryMB: number;
}
```

### getTagStats()

Returns statistics for all tags, sorted by key count.

**Signature:**
```typescript
getTagStats(): Array<{ tag: string; keyCount: number }>
```

### resetStats()

Resets all statistics counters.

**Signature:**
```typescript
resetStats(): void
```

### close()

Closes the Redis connection if active.

**Signature:**
```typescript
async close(): Promise<void>
```

### Factory Function

```typescript
export function createCacheManager(config?: CacheConfig): CacheManager
```

## LRU Cache Implementation

The internal `LRUCache<K, V>` class provides an O(1) get/set LRU cache using a `Map` (which maintains insertion order). On each `get()`, the entry is moved to the end of the Map. On `set()` when at capacity, the first entry (least recently used) is evicted.

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `l1MaxEntries` | 100,000 | Maximum entries in the in-memory LRU cache |
| `redisUrl` | `process.env.REDIS_URL` or `''` | Redis connection URL. If empty, L2 is disabled. |
| `defaultTtl` | 3600 (1 hour) | Default TTL in seconds |
| `stampedeLimit` | 10 | Maximum concurrent cache regenerations |
| `compression` | `false` | Whether to compress large values |
| `compressionThreshold` | 1024 | Byte threshold for compression |

## Usage Examples

### Basic Caching

```typescript
import { createCacheManager } from '/home/runner/workspace/agent-gateway/src/cache-manager/index.js';

const cache = createCacheManager({
  l1MaxEntries: 50000,
  redisUrl: process.env.REDIS_URL,
  defaultTtl: 1800, // 30 minutes
});

// Set a value
await cache.set('user:123', { name: 'Alice', email: 'alice@example.com' }, 3600, ['user:123']);

// Get with automatic regeneration
const user = await cache.get('user:123', async () => {
  return await db.users.findById('123');
});
```

### Tag-Based Invalidation

```typescript
// Cache related data with the same tag
await cache.set('product:456', productData, 7200, ['product:456', 'category:electronics']);
await cache.set('product:456:reviews', reviews, 3600, ['product:456']);
await cache.set('product:456:related', related, 3600, ['product:456']);

// When the product is updated, invalidate all related cache entries
await cache.invalidateByTag('product:456');
```

### Cache Statistics Dashboard

```typescript
const stats = cache.getStats();
console.log(`L1 hit rate: ${(stats.l1HitRate * 100).toFixed(1)}%`);
console.log(`L2 hit rate: ${(stats.l2HitRate * 100).toFixed(1)}%`);
console.log(`L1 size: ${stats.l1Size} entries`);
console.log(`Estimated memory: ${stats.estimatedMemoryMB} MB`);
console.log(`Evictions: ${stats.evictions}`);
console.log(`Stampede preventions: ${stats.stampedePreventions}`);

const tagStats = cache.getTagStats();
console.log('Top tags:', tagStats.slice(0, 5));
```

## Cache Manager vs. Cache (Response Cache)

Both modules provide caching, but for different use cases:

| Aspect | Cache Manager (this module) | Response Cache (`src/cache/`) |
|--------|-----------------------------|-------------------------------|
| Location | `/home/runner/workspace/agent-gateway/src/cache-manager/` | `/home/runner/workspace/agent-gateway/src/cache/` |
| Purpose | General-purpose multi-tier caching | AI provider response caching |
| Scope | Any data type (generic `<T>`) | Specifically `ModelResponse` from chat providers |
| Tiers | L1 (LRU) + L2 (Redis) + L3 (regeneration) | L1 (LRU) + L2 (Redis) |
| Cache key | Arbitrary string | SHA-256 of messages + model + temperature |
| Invalidation | Tag-based, version-based, by-key | Full invalidate only (`invalidateAll`) |
| Stampede protection | Yes | No |
| Best for | Caching any application data | Caching identical AI chat responses |

## Integration Points

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| API Gateway | `/home/runner/workspace/agent-gateway/src/api-gateway/` | Cache API responses at the gateway layer. |
| Connection Manager | `/home/runner/workspace/agent-gateway/src/connection-manager/` | The Connection Manager handles Redis connections; the Cache Manager uses ioredis directly. They can share a Redis instance. |
| Rate Limit Engine | `/home/runner/workspace/agent-gateway/src/rate-limit-engine/` | Rate limiting decisions can be cached for repeated requests. |
| Search Engine | `/home/runner/workspace/agent-gateway/src/search-engine/` | Cache search results with tag-based invalidation on data updates. |
| Data Transformer | `/home/runner/workspace/agent-gateway/src/data-transformer/` | Transform cached data before serving. |

## Error Handling

- **L2 (Redis) failures:** All Redis operations are wrapped in try/catch. If Redis is unavailable, the cache gracefully falls back to L1-only operation. No errors propagate to the caller.
- **L1-only mode:** If `redisUrl` is not set or Redis connection fails, all caching operations continue with L1 only.
- **Stampede limit exceeded:** When too many concurrent regenerations target the same key, the function logs a warning and returns `null`.
- **Memory estimation:** The `estimateSize()` method uses `JSON.stringify` length as a proxy. For non-serializable values, returns 0.
- **Deep clone on get:** Values returned from `get()` are the original cached objects (not deep-cloned). If mutation is a concern, clone before modifying.

## Cache Invalidation Patterns

### Tag-Based Invalidation

The most powerful pattern. Tag related cache entries with the same tag and invalidate them together:

```typescript
// On user update
await db.users.update(id, data);
await cache.invalidateByTag(`user:${id}`);
```

### Version-Based Invalidation

Bump the version counter to logically invalidate entries without deleting:

```typescript
await cache.invalidateByKey('user:123:profile');
// Next get() will see the version mismatch and regenerate
```

### TTL-Based Expiration

The simplest pattern. Set appropriate TTLs:

```typescript
await cache.set('static:config', config, 86400); // 24 hours
await cache.set('dynamic:feed', feed, 60);       // 1 minute
```

### Full Clear

Nuclear option -- clears everything:

```typescript
await cache.clear();
```

## Stampede Protection

When a popular cache key expires, many concurrent requests may all try to regenerate it simultaneously (the "thundering herd" or "cache stampede" problem). The Cache Manager prevents this:

1. The first request to miss the cache acquires a lock on the regeneration promise.
2. Subsequent requests for the same key wait on the same promise.
3. A `stampedeLimit` (default: 10) caps the maximum concurrent regenerations.
4. If the limit is exceeded, requests skip regeneration and return `null`.

## Related Documentation

- [Cache (Response Cache)](/home/runner/workspace/agent-gateway/src/cache/README.md) -- AI provider response caching.
- [Connection Manager](/home/runner/workspace/agent-gateway/src/connection-manager/README.md) -- Connection pooling for Redis and other services.
- [Connection Pool](/home/runner/workspace/agent-gateway/src/connection-pool/README.md) -- Generic connection pool implementation.
- [Rate Limit Engine](/home/runner/workspace/agent-gateway/src/rate-limit-engine/README.md) -- Rate limiting that may use Redis for distributed limiting.
- [API Gateway](/home/runner/workspace/agent-gateway/src/api-gateway/README.md) -- Gateway-level response caching.
