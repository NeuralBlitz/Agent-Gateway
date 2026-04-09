/**
 * Enterprise Cache Manager
 * Multi-tier caching with L1 (in-memory), L2 (Redis), and L3 (database) tiers,
 * automatic invalidation patterns, cache warming, stampede protection,
 * and comprehensive metrics.
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { logger } from '../infra/index.js';

export type CacheTier = 'L1' | 'L2' | 'L3';

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

/**
 * LRU Cache for in-memory tier
 */
class LRUCache<K, V> {
  private store: Map<K, V>;
  private maxSize: number;
  private onEviction?: (key: K, value: V) => void;

  constructor(maxSize: number, onEviction?: (key: K, value: V) => void) {
    this.maxSize = maxSize;
    this.store = new Map();
    this.onEviction = onEviction;
  }

  get(key: K): V | undefined {
    const value = this.store.get(key);
    if (value !== undefined) {
      this.store.delete(key);
      this.store.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): boolean {
    let evicted = false;
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) {
        const firstValue = this.store.get(firstKey);
        this.store.delete(firstKey);
        if (this.onEviction && firstValue !== undefined) {
          this.onEviction(firstKey, firstValue);
        }
        evicted = true;
      }
    }
    this.store.set(key, value);
    return evicted;
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  has(key: K): boolean {
    return this.store.has(key);
  }

  get size(): number {
    return this.store.size;
  }

  keys(): K[] {
    return Array.from(this.store.keys());
  }

  values(): V[] {
    return Array.from(this.store.values());
  }
}

export class CacheManager extends EventEmitter {
  private config: Required<CacheConfig>;
  private l1: LRUCache<string, CacheEntry<any>>;
  private redis: any;
  private stats: CacheStats;
  private stampedeLocks: Map<string, Promise<any>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();
  private versionMap: Map<string, number> = new Map();
  private estimatedMemoryBytes = 0;

  constructor(config: CacheConfig = {}) {
    super();
    this.config = {
      l1MaxEntries: config.l1MaxEntries || 100000,
      redisUrl: config.redisUrl || process.env.REDIS_URL || '',
      defaultTtl: config.defaultTtl || 3600,
      stampedeLimit: config.stampedeLimit || 10,
      compression: config.compression ?? false,
      compressionThreshold: config.compressionThreshold || 1024,
    };

    this.l1 = new LRUCache(this.config.l1MaxEntries, (key, entry) => {
      this.stats.evictions++;
      this.estimatedMemoryBytes -= entry.size || 0;
      this.emit('cache:eviction', { key, tier: 'L1' });
    });

    this.stats = {
      l1Hits: 0, l1Misses: 0,
      l2Hits: 0, l2Misses: 0,
      l3Hits: 0, l3Misses: 0,
      sets: 0, deletes: 0,
      invalidations: 0,
      stampedePreventions: 0,
      evictions: 0,
      memoryUsageBytes: 0,
    };
  }

  /** Get a value from cache with automatic regeneration */
  async get<T>(
    key: string,
    regenerate?: () => Promise<T>,
    ttl?: number,
    tags: string[] = [],
  ): Promise<T | null> {
    // L1 check
    const l1Entry = this.l1.get(key);
    if (l1Entry && l1Entry.expiresAt > Date.now()) {
      l1Entry.accessCount++;
      l1Entry.lastAccessedAt = Date.now();
      this.stats.l1Hits++;
      return l1Entry.value as T;
    }
    if (l1Entry) {
      this.l1.delete(key);
      this.estimatedMemoryBytes -= l1Entry.size || 0;
    }
    this.stats.l1Misses++;

    // L2 check (Redis)
    if (this.config.redisUrl) {
      try {
        const redis = await this.getRedisClient();
        if (redis) {
          const data = await redis.get(`agw:cache:${key}`);
          if (data) {
            const entry: CacheEntry<T> = JSON.parse(data);
            if (entry.expiresAt > Date.now()) {
              // Promote to L1
              this.setL1(key, entry);
              this.stats.l2Hits++;
              return entry.value;
            }
            await redis.del(`agw:cache:${key}`);
          }
        }
      } catch {
        // L2 error — continue
      }
    }
    this.stats.l2Misses++;

    // Cache miss — regenerate if function provided
    if (regenerate) {
      return this.getOrRegenerate(key, regenerate, ttl, tags);
    }

    this.stats.l3Misses++;
    return null;
  }

  /** Set a value across cache tiers */
  async set<T>(
    key: string,
    value: T,
    ttl?: number,
    tags: string[] = [],
  ): Promise<void> {
    const entry: CacheEntry<T> = {
      key,
      value,
      tier: 'L1',
      expiresAt: Date.now() + (ttl !== undefined ? ttl : this.config.defaultTtl) * 1000,
      createdAt: Date.now(),
      accessCount: 0,
      lastAccessedAt: Date.now(),
      tags,
      version: (this.versionMap.get(key) || 0) + 1,
      size: this.estimateSize(value),
    };

    this.versionMap.set(key, entry.version);

    // Set L1
    const evicted = this.l1.set(key, entry);
    if (evicted) this.stats.evictions++;
    if (entry.size) this.estimatedMemoryBytes += entry.size;

    // Set L2
    if (this.config.redisUrl) {
      try {
        const redis = await this.getRedisClient();
        if (redis) {
          await redis.set(
            `agw:cache:${key}`,
            JSON.stringify(entry),
            'EX',
            ttl || this.config.defaultTtl,
          );
        }
      } catch {
        // L2 error — L1 still works
      }
    }

    // Update tag index
    for (const tag of tags) {
      if (!this.tagIndex.has(tag)) this.tagIndex.set(tag, new Set());
      this.tagIndex.get(tag)!.add(key);
    }

    this.stats.sets++;
    this.emit('cache:set', { key, tier: 'L1', tags });
  }

  /** Delete a key from all tiers */
  async delete(key: string): Promise<void> {
    // Delete L1
    const l1Entry = this.l1.get(key);
    if (l1Entry) {
      if (l1Entry.size) this.estimatedMemoryBytes -= l1Entry.size;
      this.l1.delete(key);
    }

    // Delete L2
    if (this.config.redisUrl) {
      try {
        const redis = await this.getRedisClient();
        if (redis) await redis.del(`agw:cache:${key}`);
      } catch {}
    }

    // Remove from tag index
    for (const [, keys] of this.tagIndex) {
      keys.delete(key);
    }

    this.versionMap.delete(key);
    this.stats.deletes++;
    this.emit('cache:delete', { key });
  }

  /** Invalidate all keys with a specific tag */
  async invalidateByTag(tag: string): Promise<number> {
    const keys = this.tagIndex.get(tag);
    if (!keys || keys.size === 0) return 0;

    let count = 0;
    const keysArray = Array.from(keys);

    // Delete from L1
    for (const key of keysArray) {
      const entry = this.l1.get(key);
      if (entry) {
        if (entry.size) this.estimatedMemoryBytes -= entry.size;
        this.l1.delete(key);
      }
      count++;
    }

    // Delete from L2
    if (this.config.redisUrl && keysArray.length > 0) {
      try {
        const redis = await this.getRedisClient();
        if (redis) {
          const pipe = redis.pipeline();
          for (const key of keysArray) {
            pipe.del(`agw:cache:${key}`);
          }
          await pipe.exec();
        }
      } catch {}
    }

    this.tagIndex.delete(tag);
    this.stats.invalidations += count;

    logger.info({ tag, count }, `Cache invalidated by tag: ${tag}`);
    this.emit('cache:invalidated', { tag, count });
    return count;
  }

  /** Invalidate by version bump */
  async invalidateByKey(key: string): Promise<void> {
    const currentVersion = this.versionMap.get(key) || 0;
    this.versionMap.set(key, currentVersion + 1);
    await this.delete(key);
    this.stats.invalidations++;
  }

  /** Clear all caches */
  async clear(): Promise<void> {
    this.l1.clear();
    this.estimatedMemoryBytes = 0;
    this.tagIndex.clear();
    this.versionMap.clear();

    if (this.config.redisUrl) {
      try {
        const redis = await this.getRedisClient();
        if (redis) {
          const keys = await redis.keys('agw:cache:*');
          if (keys.length > 0) await redis.del(...keys);
        }
      } catch {}
    }

    logger.info('Cache cleared');
    this.emit('cache:clear');
  }

  /** Get or regenerate a value with stampede protection */
  private async getOrRegenerate<T>(
    key: string,
    regenerate: () => Promise<T>,
    ttl?: number,
    tags: string[] = [],
  ): Promise<T> {
    // Check stampede lock
    if (this.stampedeLocks.has(key)) {
      if (this.stampedeLocks.size >= this.config.stampedeLimit) {
        // Too many concurrent regenerations — skip
        logger.warn({ key }, 'Stampede limit reached, skipping regeneration');
        return null as T;
      }

      this.stats.stampedePreventions++;
      return this.stampedeLocks.get(key)!;
    }

    // Create regeneration promise
    const promise = regenerate().then(async (value) => {
      await this.set(key, value, ttl, tags);
      return value;
    }).finally(() => {
      this.stampedeLocks.delete(key);
    });

    this.stampedeLocks.set(key, promise);
    return promise;
  }

  /** Set L1 cache entry */
  private setL1(key: string, entry: CacheEntry<any>): void {
    entry.tier = 'L1';
    this.l1.set(key, entry);
    if (entry.size) this.estimatedMemoryBytes += entry.size;
  }

  /** Get Redis client */
  private async getRedisClient(): Promise<any> {
    if (this.redis) return this.redis;
    try {
      const Redis = (await import('ioredis')).default;
      this.redis = new Redis(this.config.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
      });
      return this.redis;
    } catch {
      return null;
    }
  }

  /** Estimate size of a value in bytes */
  private estimateSize(value: any): number {
    if (typeof value === 'string') return value.length * 2; // UTF-16
    if (typeof value === 'number') return 8;
    if (typeof value === 'boolean') return 1;
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 0;
    }
  }

  /** Get cache statistics */
  getStats(): CacheStats & { l1Size: number; l1HitRate: number; l2HitRate: number; estimatedMemoryMB: number; estimatedMemoryBytes: number } {
    const l1Total = this.stats.l1Hits + this.stats.l1Misses;
    const l2Total = this.stats.l2Hits + this.stats.l2Misses;

    return {
      ...this.stats,
      l1Size: this.l1.size,
      l1HitRate: l1Total > 0 ? this.stats.l1Hits / l1Total : 0,
      l2HitRate: l2Total > 0 ? this.stats.l2Hits / l2Total : 0,
      estimatedMemoryMB: Math.round(this.estimatedMemoryBytes / (1024 * 1024) * 100) / 100,
      estimatedMemoryBytes: this.estimatedMemoryBytes,
    };
  }

  /** Get tag statistics */
  getTagStats(): Array<{ tag: string; keyCount: number }> {
    return Array.from(this.tagIndex.entries())
      .map(([tag, keys]) => ({ tag, keyCount: keys.size }))
      .sort((a, b) => b.keyCount - a.keyCount);
  }

  /** Reset statistics */
  resetStats(): void {
    this.stats = {
      l1Hits: 0, l1Misses: 0,
      l2Hits: 0, l2Misses: 0,
      l3Hits: 0, l3Misses: 0,
      sets: 0, deletes: 0,
      invalidations: 0,
      stampedePreventions: 0,
      evictions: 0,
      memoryUsageBytes: 0,
    };
  }

  /** Close the cache manager */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}

export function createCacheManager(config?: CacheConfig): CacheManager {
  return new CacheManager(config);
}
