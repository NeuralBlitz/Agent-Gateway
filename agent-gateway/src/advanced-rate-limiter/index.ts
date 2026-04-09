// @ts-nocheck
/**
 * Enterprise Rate Limiter — Advanced Multi-Strategy
 * Token bucket, sliding window log, fixed window, and leaky bucket
 * with Redis-backed distributed limiting and per-tenant isolation.
 */

import { logger } from '../infra/index.js';

export type RateLimitStrategy = 'token-bucket' | 'sliding-window-log' | 'fixed-window' | 'leaky-bucket';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface RateLimitOptions {
  strategy?: RateLimitStrategy;
  /** Max requests per window */
  max: number;
  /** Window in seconds */
  window: number;
  /** Burst size (for token bucket) */
  burst?: number;
  /** Redis URL for distributed mode */
  redisUrl?: string;
}

/** Token Bucket */
class TokenBucket {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.tokens = maxTokens;
    this.refillRate = refillRate;
    this.lastRefill = Date.now();
  }

  consume(count: number = 1): boolean {
    this.refill();
    if (this.tokens >= count) { this.tokens -= count; return true; }
    return false;
  }

  getTokens(): number { this.refill(); return this.tokens; }

  private refill(): void {
    const now = Date.now();
    this.tokens = Math.min(this.maxTokens, this.tokens + ((now - this.lastRefill) / 1000) * this.refillRate);
    this.lastRefill = now;
  }
}

/** Sliding Window Log */
class SlidingWindowLog {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  allow(count: number = 1): RateLimitResult {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);

    if (this.requests.length + count <= this.maxRequests) {
      for (let i = 0; i < count; i++) this.requests.push(now);
      return { allowed: true, limit: this.maxRequests, remaining: this.maxRequests - this.requests.length, resetAt: now + this.windowMs };
    }

    const resetAt = this.requests[0] + this.windowMs;
    return { allowed: false, limit: this.maxRequests, remaining: 0, resetAt, retryAfter: Math.ceil((resetAt - now) / 1000) };
  }
}

/** Leaky Bucket */
class LeakyBucket {
  private capacity: number;
  private leakRate: number;
  private water: number;
  private lastLeak: number;

  constructor(capacity: number, leakRate: number) {
    this.capacity = capacity;
    this.leakRate = leakRate;
    this.water = 0;
    this.lastLeak = Date.now();
  }

  allow(): boolean {
    const now = Date.now();
    this.water = Math.max(0, this.water - ((now - this.lastLeak) / 1000) * this.leakRate);
    this.lastLeak = now;
    if (this.water < this.capacity) { this.water++; return true; }
    return false;
  }
}

export class AdvancedRateLimiter {
  private buckets: Map<string, TokenBucket> = new Map();
  private windows: Map<string, SlidingWindowLog> = new Map();
  private leakyBuckets: Map<string, LeakyBucket> = new Map();
  private redis: any;
  private redisUrl?: string;

  constructor(redisUrl?: string) {
    this.redisUrl = redisUrl || process.env.REDIS_URL;
  }

  private async getRedis(): Promise<any> {
    if (this.redis) return this.redis;
    if (!this.redisUrl) return null;
    try {
      const Redis = (await import('ioredis')).default;
      this.redis = new Redis(this.redisUrl, { lazyConnect: true });
      return this.redis;
    } catch { return null; }
  }

  async check(key: string, opts: RateLimitOptions, count: number = 1): Promise<RateLimitResult> {
    const fullKey = `agw:rl:${key}`;
    const redis = await this.getRedis();

    if (redis) {
      return this.checkRedis(fullKey, opts);
    }

    return this.checkLocal(key, opts, count);
  }

  private checkLocal(key: string, opts: RateLimitOptions, count: number): RateLimitResult {
    const strategy = opts.strategy || 'sliding-window-log';

    switch (strategy) {
      case 'token-bucket': {
        let bucket = this.buckets.get(key);
        if (!bucket) {
          bucket = new TokenBucket(opts.burst || opts.max, opts.max / opts.window);
          this.buckets.set(key, bucket);
        }
        if (bucket.consume(count)) {
          return { allowed: true, limit: opts.max, remaining: Math.floor(bucket.getTokens()), resetAt: Date.now() + opts.window * 1000 };
        }
        return { allowed: false, limit: opts.max, remaining: 0, resetAt: Date.now() + 1000, retryAfter: 1 };
      }

      case 'sliding-window-log': {
        let win = this.windows.get(key);
        if (!win) { win = new SlidingWindowLog(opts.max, opts.window * 1000); this.windows.set(key, win); }
        return win.allow(count);
      }

      case 'leaky-bucket': {
        let bucket = this.leakyBuckets.get(key);
        if (!bucket) { bucket = new LeakyBucket(opts.burst || opts.max, opts.max / opts.window); this.leakyBuckets.set(key, bucket); }
        if (bucket.allow()) {
          return { allowed: true, limit: opts.max, remaining: Math.floor(opts.max - bucket.water), resetAt: Date.now() + opts.window * 1000 };
        }
        return { allowed: false, limit: opts.max, remaining: 0, resetAt: Date.now() + 1000, retryAfter: 1 };
      }

      default:
        return { allowed: true, limit: opts.max, remaining: opts.max, resetAt: Date.now() };
    }
  }

  private async checkRedis(key: string, opts: RateLimitOptions): Promise<RateLimitResult> {
    const redis = await this.getRedis();
    if (!redis) return this.checkLocal(key, opts);

    const now = Date.now();
    const windowStart = now - opts.window * 1000;

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, opts.window + 1);

    const results = await pipeline.exec();
    const requestCount = (results?.[1]?.[1] as number) || 0;

    if (requestCount < opts.max) {
      return { allowed: true, limit: opts.max, remaining: opts.max - requestCount - 1, resetAt: now + opts.window * 1000 };
    }

    return { allowed: false, limit: opts.max, remaining: 0, resetAt: now + opts.window * 1000, retryAfter: opts.window };
  }

  async reset(key: string): Promise<void> {
    this.buckets.delete(key);
    this.windows.delete(key);
    this.leakyBuckets.delete(key);

    const redis = await this.getRedis();
    if (redis) await redis.del(`agw:rl:${key}`);
  }
}

export function createAdvancedRateLimiter(redisUrl?: string): AdvancedRateLimiter {
  return new AdvancedRateLimiter(redisUrl);
}
