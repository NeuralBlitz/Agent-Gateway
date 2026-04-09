/**
 * Response caching layer.
 * Caches identical chat requests to avoid redundant API calls.
 * Supports memory (LRU) and Redis-backed caching for multi-instance deployments.
 */

import { createHash } from 'crypto';
import { logger } from '../infra/index.js';
import type { ChatMessage, ModelResponse } from '../providers/types.js';

export interface ResponseCacheConfig {
  /** Cache backend: 'memory' or 'redis' */
  backend?: 'memory' | 'redis';
  /** Max entries for memory cache (default: 10000) */
  maxSize?: number;
  /** TTL in seconds (default: 1 hour for identical prompts) */
  ttl?: number;
  /** Redis URL (only if backend is 'redis') */
  redisUrl?: string;
  /** Whether to cache tool-calling responses (default: false — tool results vary) */
  cacheToolResponses?: boolean;
}

interface CacheEntry {
  response: ModelResponse;
  expiresAt: number;
  hitCount: number;
}

/**
 * Simple LRU cache for in-memory use.
 */
class LRUCache<K, V> {
  private store: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.store = new Map();
  }

  get(key: K): V | undefined {
    const value = this.store.get(key);
    if (value !== undefined) {
      // Refresh: delete and re-insert to move to end
      this.store.delete(key);
      this.store.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.store.has(key)) {
      this.store.delete(key);
    } else if (this.store.size >= this.maxSize) {
      // Evict oldest entry
      const firstKey = this.store.keys().next().value;
      if (firstKey !== undefined) this.store.delete(firstKey);
    }
    this.store.set(key, value);
  }

  delete(key: K): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

/**
 * Response cache for AI provider calls.
 */
export class ResponseCache {
  private config: Required<ResponseCacheConfig>;
  private memoryCache: LRUCache<string, CacheEntry>;
  private redis: any;

  constructor(config: ResponseCacheConfig = {}) {
    this.config = {
      backend: config.backend || 'memory',
      maxSize: config.maxSize || 10000,
      ttl: config.ttl || 3600,
      redisUrl: config.redisUrl || process.env.REDIS_URL || '',
      cacheToolResponses: config.cacheToolResponses || false,
    };

    this.memoryCache = new LRUCache(this.config.maxSize);
  }

  /** Generate a cache key from messages and model config */
  private makeKey(messages: ChatMessage[], model: string, temperature: number): string {
    const content = JSON.stringify({
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      model,
      temperature,
    });
    return createHash('sha256').update(content).digest('hex');
  }

  /** Get cached response */
  async get(messages: ChatMessage[], model: string, temperature: number): Promise<ModelResponse | null> {
    const key = this.makeKey(messages, model, temperature);

    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && memEntry.expiresAt > Date.now()) {
      memEntry.hitCount++;
      logger.debug({ key: key.slice(0, 8), hits: memEntry.hitCount }, 'Cache hit (memory)');
      return memEntry.response;
    }

    // Check Redis
    if (this.config.backend === 'redis') {
      try {
        const redis = await this.getRedisClient();
        if (!redis) return null;

        const data = await redis.get(`agw:cache:${key}`);
        if (data) {
          const entry: CacheEntry = JSON.parse(data);
          if (entry.expiresAt > Date.now()) {
            entry.hitCount++;
            // Update in Redis
            await redis.set(
              `agw:cache:${key}`,
              JSON.stringify(entry),
              'EX',
              this.config.ttl,
            );
            // Also update memory
            this.memoryCache.set(key, entry);
            logger.debug({ key: key.slice(0, 8), hits: entry.hitCount }, 'Cache hit (redis)');
            return entry.response;
          }
          // Expired
          await redis.del(`agw:cache:${key}`);
        }
      } catch {
        // Redis error — fall through to miss
      }
    }

    return null;
  }

  /** Cache a response */
  async set(messages: ChatMessage[], model: string, temperature: number, response: ModelResponse): Promise<void> {
    // Don't cache tool-calling responses by default (they're often unique)
    if (!this.config.cacheToolResponses && response.toolCalls) return;
    // Don't cache errors or empty responses
    if (!response.content && !response.toolCalls) return;

    const key = this.makeKey(messages, model, temperature);
    const entry: CacheEntry = {
      response,
      expiresAt: Date.now() + this.config.ttl * 1000,
      hitCount: 1,
    };

    // Store in memory
    this.memoryCache.set(key, entry);

    // Store in Redis
    if (this.config.backend === 'redis') {
      try {
        const redis = await this.getRedisClient();
        if (redis) {
          await redis.set(
            `agw:cache:${key}`,
            JSON.stringify(entry),
            'EX',
            this.config.ttl,
          );
        }
      } catch {
        // Redis error — memory cache still works
      }
    }

    logger.debug({ key: key.slice(0, 8) }, 'Response cached');
  }

  /** Invalidate all cached responses */
  async invalidateAll(): Promise<void> {
    this.memoryCache.clear();

    if (this.config.backend === 'redis') {
      try {
        const redis = await this.getRedisClient();
        if (redis) {
          const keys = await redis.keys('agw:cache:*');
          if (keys.length > 0) {
            await redis.del(...keys);
          }
        }
      } catch {}
    }

    logger.info('Cache invalidated');
  }

  /** Get cache statistics */
  async stats(): Promise<{ size: number; backend: string }> {
    return {
      size: this.memoryCache.size,
      backend: this.config.backend,
    };
  }

  private async getRedisClient(): Promise<any> {
    if (this.redis) return this.redis;

    try {
      const Redis = (await import('ioredis')).default;
      this.redis = new Redis(this.config.redisUrl, { lazyConnect: true });
      return this.redis;
    } catch {
      return null;
    }
  }
}

export function createResponseCache(config?: ResponseCacheConfig): ResponseCache {
  return new ResponseCache(config);
}
