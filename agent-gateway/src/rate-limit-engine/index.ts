/**
 * Enterprise Rate Limit Engine
 * Advanced multi-dimensional rate limiting with token bucket,
 * sliding window log, fixed window counter, and leaky bucket algorithms.
 * Supports Redis-backed distributed limiting and per-tenant isolation.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export type RateLimitAlgorithm = 'token-bucket' | 'sliding-window-log' | 'fixed-window' | 'leaky-bucket';

export interface RateLimitRule {
  /** Unique rule name */
  name: string;
  /** Algorithm to use */
  algorithm: RateLimitAlgorithm;
  /** Max requests allowed */
  max: number;
  /** Time window in seconds */
  window: number;
  /** Burst size (for token bucket / leaky bucket) */
  burst?: number;
  /** Key generator function */
  keyFn: (context: RateLimitContext) => string;
  /** HTTP methods to apply (empty = all) */
  methods?: string[];
  /** Path pattern (regex string) */
  pathPattern?: string;
  /** Response when rate limited */
  responseMessage?: string;
  /** Whether to include rate limit headers */
  includeHeaders?: boolean;
}

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

export interface RateLimitResult {
  allowed: boolean;
  rule: string;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

/** Token Bucket Implementation */
class TokenBucketImpl {
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

  consume(count: number = 1): { allowed: boolean; remaining: number } {
    this.refill();
    if (this.tokens >= count) {
      this.tokens -= count;
      return { allowed: true, remaining: Math.floor(this.tokens) };
    }
    return { allowed: false, remaining: 0 };
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}

/** Sliding Window Log Implementation */
class SlidingWindowLogImpl {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  allow(): { allowed: boolean; remaining: number; resetAt: number; retryAfter?: number } {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);

    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return { allowed: true, remaining: this.maxRequests - this.requests.length, resetAt: now + this.windowMs };
    }

    const resetAt = this.requests[0] + this.windowMs;
    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt - now) / 1000),
    };
  }
}

/** Leaky Bucket Implementation */
class LeakyBucketImpl {
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

  allow(): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const elapsed = (now - this.lastLeak) / 1000;
    this.water = Math.max(0, this.water - elapsed * this.leakRate);
    this.lastLeak = now;

    if (this.water < this.capacity) {
      this.water++;
      return { allowed: true, remaining: Math.floor(this.capacity - this.water) };
    }
    return { allowed: false, remaining: 0 };
  }
}

/** Fixed Window Counter Implementation */
class FixedWindowCounterImpl {
  private windowStart: number;
  private count: number;
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.windowStart = Date.now();
    this.count = 0;
  }

  allow(): { allowed: boolean; remaining: number; resetAt: number; retryAfter?: number } {
    const now = Date.now();

    // Reset window if expired
    if (now - this.windowStart >= this.windowMs) {
      this.windowStart = now;
      this.count = 0;
    }

    const resetAt = this.windowStart + this.windowMs;

    if (this.count < this.maxRequests) {
      this.count++;
      return { allowed: true, remaining: this.maxRequests - this.count, resetAt };
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.ceil((resetAt - now) / 1000),
    };
  }
}

export class RateLimitEngine extends EventEmitter {
  private rules: Map<string, RateLimitRule> = new Map();
  private tokenBuckets: Map<string, TokenBucketImpl> = new Map();
  private slidingWindows: Map<string, SlidingWindowLogImpl> = new Map();
  private leakyBuckets: Map<string, LeakyBucketImpl> = new Map();
  private fixedWindows: Map<string, FixedWindowCounterImpl> = new Map();
  private redis: any;
  private stats: { checks: number; allowed: number; denied: number } = { checks: 0, allowed: 0, denied: 0 };

  constructor(redisUrl?: string) {
    super();
    if (redisUrl) {
      this.initializeRedis(redisUrl).catch((err) => {
        logger.warn({ err }, 'Redis initialization failed — falling back to in-memory rate limiting');
      });
    }
  }

  /** Initialize Redis connection */
  private async initializeRedis(url: string): Promise<void> {
    try {
      const Redis = (await import('ioredis')).default;
      this.redis = new Redis(url, { lazyConnect: true });
      logger.info('Rate limit engine connected to Redis');
    } catch (err: any) {
      logger.warn({ err }, 'Redis not available for rate limiting, using in-memory');
    }
  }

  /** Register a rate limit rule */
  registerRule(rule: RateLimitRule): void {
    this.rules.set(rule.name, rule);
    logger.info({ rule: rule.name, algorithm: rule.algorithm, max: rule.max, window: rule.window }, 'Rate limit rule registered');
  }

  /** Unregister a rule */
  unregisterRule(name: string): boolean {
    return this.rules.delete(name);
  }

  /** Check all applicable rules for a request */
  async check(context: RateLimitContext): Promise<{ results: RateLimitResult[]; blocked: boolean; mostRestrictive?: RateLimitResult }> {
    const results: RateLimitResult[] = [];
    let blocked = false;
    let mostRestrictive: RateLimitResult | undefined;

    for (const [, rule] of this.rules) {
      // Check method filter
      if (rule.methods && rule.methods.length > 0 && context.method && !rule.methods.includes(context.method)) continue;

      // Check path filter
      if (rule.pathPattern && context.path) {
        const regex = new RegExp(rule.pathPattern);
        if (!regex.test(context.path)) continue;
      }

      // Generate key
      const key = rule.keyFn(context);
      if (!key) continue;

      // Check rate limit
      const result = await this.checkRule(rule, key);
      results.push(result);

      if (!result.allowed) {
        blocked = true;
      }

      // Track most restrictive
      if (!mostRestrictive || result.remaining < mostRestrictive.remaining) {
        mostRestrictive = result;
      }

      this.stats.checks++;
      if (result.allowed) this.stats.allowed++;
      else this.stats.denied++;

      this.emit('rate:check', { rule: rule.name, key, allowed: result.allowed });
    }

    return { results, blocked, mostRestrictive };
  }

  /** Check a single rule */
  private async checkRule(rule: RateLimitRule, key: string): Promise<RateLimitResult> {
    const fullKey = `agw:rl:${rule.name}:${key}`;

    // Use Redis if available
    if (this.redis) {
      return this.checkRedis(rule, fullKey);
    }

    // In-memory check
    return this.checkLocal(rule, key);
  }

  /** In-memory rate limit check */
  private checkLocal(rule: RateLimitRule, key: string): RateLimitResult {
    const now = Date.now();

    switch (rule.algorithm) {
      case 'token-bucket': {
        const bucketKey = `${rule.name}:tb:${key}`;
        let bucket = this.tokenBuckets.get(bucketKey);
        if (!bucket) {
          const refillRate = rule.max / rule.window;
          bucket = new TokenBucketImpl(rule.burst || rule.max, refillRate);
          this.tokenBuckets.set(bucketKey, bucket);
        }
        const { allowed, remaining } = bucket.consume();
        return {
          allowed,
          rule: rule.name,
          limit: rule.max,
          remaining,
          resetAt: now + rule.window * 1000,
          retryAfter: allowed ? undefined : Math.ceil((rule.burst || rule.max) / (rule.max / rule.window)),
        };
      }

      case 'sliding-window-log': {
        const windowKey = `${rule.name}:sw:${key}`;
        let window = this.slidingWindows.get(windowKey);
        if (!window) {
          window = new SlidingWindowLogImpl(rule.max, rule.window * 1000);
          this.slidingWindows.set(windowKey, window);
        }
        const result = window.allow();
        return { allowed: result.allowed, rule: rule.name, limit: rule.max, remaining: result.remaining, resetAt: result.resetAt, retryAfter: result.retryAfter };
      }

      case 'leaky-bucket': {
        const bucketKey = `${rule.name}:lb:${key}`;
        let bucket = this.leakyBuckets.get(bucketKey);
        if (!bucket) {
          bucket = new LeakyBucketImpl(rule.burst || rule.max, rule.max / rule.window);
          this.leakyBuckets.set(bucketKey, bucket);
        }
        const { allowed, remaining } = bucket.allow();
        return { allowed, rule: rule.name, limit: rule.max, remaining, resetAt: now + rule.window * 1000 };
      }

      case 'fixed-window': {
        const windowKey = `${rule.name}:fw:${key}`;
        let window = this.fixedWindows.get(windowKey);
        if (!window) {
          window = new FixedWindowCounterImpl(rule.max, rule.window * 1000);
          this.fixedWindows.set(windowKey, window);
        }
        const result = window.allow();
        return { allowed: result.allowed, rule: rule.name, limit: rule.max, remaining: result.remaining, resetAt: result.resetAt, retryAfter: result.retryAfter };
      }

      default:
        return { allowed: true, rule: rule.name, limit: rule.max, remaining: rule.max, resetAt: now + rule.window * 1000 };
    }
  }

  /** Redis-based rate limit check using sliding window */
  private async checkRedis(rule: RateLimitRule, key: string): Promise<RateLimitResult> {
    const now = Date.now();
    const windowStart = now - rule.window * 1000;

    const pipeline = this.redis.pipeline();
    pipeline.zremrangebyscore(key, 0, windowStart);
    pipeline.zcard(key);
    pipeline.zadd(key, now, `${now}-${Math.random()}`);
    pipeline.expire(key, rule.window + 1);

    const results = await pipeline.exec();
    const requestCount = (results?.[1]?.[1] as number) || 0;

    const resetAt = now + rule.window * 1000;

    if (requestCount < rule.max) {
      return {
        allowed: true,
        rule: rule.name,
        limit: rule.max,
        remaining: rule.max - requestCount - 1,
        resetAt,
      };
    }

    return {
      allowed: false,
      rule: rule.name,
      limit: rule.max,
      remaining: 0,
      resetAt,
      retryAfter: rule.window,
    };
  }

  /** Reset rate limit for a key */
  async reset(ruleName: string, key: string): Promise<void> {
    const fullKey = `agw:rl:${ruleName}:${key}`;

    // Clear in-memory
    for (const k of this.tokenBuckets.keys()) { if (k.includes(ruleName) && k.includes(key)) this.tokenBuckets.delete(k); }
    for (const k of this.slidingWindows.keys()) { if (k.includes(ruleName) && k.includes(key)) this.slidingWindows.delete(k); }
    for (const k of this.leakyBuckets.keys()) { if (k.includes(ruleName) && k.includes(key)) this.leakyBuckets.delete(k); }
    for (const k of this.fixedWindows.keys()) { if (k.includes(ruleName) && k.includes(key)) this.fixedWindows.delete(k); }

    // Clear Redis
    if (this.redis) {
      await this.redis.del(fullKey);
    }
  }

  /** Get engine stats */
  getStats(): {
    rules: number;
    checks: number;
    allowed: number;
    denied: number;
    denialRate: number;
    activeBuckets: number;
    activeWindows: number;
  } {
    return {
      rules: this.rules.size,
      checks: this.stats.checks,
      allowed: this.stats.allowed,
      denied: this.stats.denied,
      denialRate: this.stats.checks > 0 ? this.stats.denied / this.stats.checks : 0,
      activeBuckets: this.tokenBuckets.size + this.leakyBuckets.size,
      activeWindows: this.slidingWindows.size + this.fixedWindows.size,
    };
  }

  /** List registered rules */
  listRules(): Array<{ name: string; algorithm: string; max: number; window: number }> {
    return Array.from(this.rules.values()).map((r) => ({
      name: r.name,
      algorithm: r.algorithm,
      max: r.max,
      window: r.window,
    }));
  }

  /** Close the engine */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
    this.tokenBuckets.clear();
    this.slidingWindows.clear();
    this.leakyBuckets.clear();
    this.fixedWindows.clear();
  }
}

export function createRateLimitEngine(redisUrl?: string): RateLimitEngine {
  return new RateLimitEngine(redisUrl);
}
