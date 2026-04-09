/**
 * Enterprise Rate Limiting Middleware
 * Redis-backed, per-tenant, sliding window rate limiting with configurable rules.
 */

import { logger } from '../infra/index.js';

export interface RateLimitRule {
  /** Unique rule name */
  name: string;
  /** Max requests in the window */
  max: number;
  /** Window in seconds */
  window: number;
  /** Key generator function (returns identifier for rate limiting) */
  keyFn: (req: any) => string;
  /** HTTP methods to apply (default: all) */
  methods?: string[];
  /** Path pattern to apply (default: all) */
  pathPattern?: RegExp;
  /** Response when rate limited */
  message?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface RateLimitConfig {
  /** Redis URL (default: in-memory) */
  redisUrl?: string;
  /** Default rules */
  rules?: RateLimitRule[];
}

// --- In-Memory Sliding Window Counter ---

class SlidingWindowCounter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();

  check(key: string, max: number, window: number): RateLimitResult {
    const now = Date.now();
    const entry = this.windows.get(key);

    if (!entry || now >= entry.resetAt) {
      // New window
      this.windows.set(key, { count: 1, resetAt: now + window * 1000 });
      return {
        allowed: true,
        limit: max,
        remaining: max - 1,
        resetAt: now + window * 1000,
      };
    }

    entry.count++;

    if (entry.count > max) {
      return {
        allowed: false,
        limit: max,
        remaining: 0,
        resetAt: entry.resetAt,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      };
    }

    return {
      allowed: true,
      limit: max,
      remaining: max - entry.count,
      resetAt: entry.resetAt,
    };
  }

  reset(key: string): void {
    this.windows.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.windows) {
      if (now >= entry.resetAt) this.windows.delete(key);
    }
  }
}

// --- Redis Sliding Window (using fixed window for simplicity) ---

class RedisRateLimiter {
  private redis: any;

  constructor(redisUrl: string) {
    // Lazy init
  }

  private async getClient(): Promise<any> {
    if (this.redis) return this.redis;
    try {
      const Redis = (await import('ioredis')).default;
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', { lazyConnect: true });
      return this.redis;
    } catch {
      return null;
    }
  }

  async check(key: string, max: number, window: number): Promise<RateLimitResult> {
    const redis = await this.getClient();
    if (!redis) {
      // Fallback to allowed
      return { allowed: true, limit: max, remaining: max, resetAt: Date.now() + window * 1000 };
    }

    const now = Date.now();
    const windowKey = `agw:rl:${key}:${Math.floor(now / (window * 1000))}`;

    const pipeline = redis.pipeline();
    pipeline.incr(windowKey);
    pipeline.expire(windowKey, window);
    const results = await pipeline.exec();

    const count = (results?.[0]?.[1] as number) || 0;
    const resetAt = (Math.floor(now / (window * 1000)) + 1) * window * 1000;

    if (count > max) {
      return {
        allowed: false,
        limit: max,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil((resetAt - now) / 1000),
      };
    }

    return {
      allowed: true,
      limit: max,
      remaining: max - count,
      resetAt,
    };
  }
}

// --- Rate Limit Manager ---

export class RateLimitManager {
  private rules: Map<string, RateLimitRule> = new Map();
  private memoryLimiter = new SlidingWindowCounter();
  private redisLimiter?: RedisRateLimiter;
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(config: RateLimitConfig = {}) {
    if (config.redisUrl) {
      this.redisLimiter = new RedisRateLimiter(config.redisUrl);
    }

    // Register default rules
    if (config.rules) {
      for (const rule of config.rules) {
        this.addRule(rule);
      }
    }

    // Periodic cleanup
    this.cleanupInterval = setInterval(() => this.memoryLimiter.cleanup(), 60_000);
  }

  addRule(rule: RateLimitRule): void {
    this.rules.set(rule.name, rule);
  }

  removeRule(name: string): boolean {
    return this.rules.delete(name);
  }

  /** Express middleware that applies all matching rate limit rules */
  middleware(): (req: any, res: any, next: () => void) => Promise<void> {
    return async (req: any, res: any, next: () => void) => {
      let rateLimited = false;
      let bestResult: RateLimitResult | null = null;

      for (const [, rule] of this.rules) {
        // Check method filter
        if (rule.methods && rule.methods.length > 0 && !rule.methods.includes(req.method)) continue;

        // Check path filter
        if (rule.pathPattern && !rule.pathPattern.test(req.path)) continue;

        const key = rule.keyFn(req);
        const result = this.redisLimiter
          ? await this.redisLimiter.check(key, rule.max, rule.window)
          : this.memoryLimiter.check(key, rule.max, rule.window);

        // Track the most restrictive result
        if (!bestResult || result.remaining < bestResult.remaining) {
          bestResult = result;
        }

        if (!result.allowed) {
          rateLimited = true;
          logger.warn({ rule: rule.name, key, limit: rule.max, window: rule.window }, 'Rate limited');
          break;
        }
      }

      // Set rate limit headers
      if (bestResult) {
        res.set('X-RateLimit-Limit', String(bestResult.limit));
        res.set('X-RateLimit-Remaining', String(bestResult.remaining));
        res.set('X-RateLimit-Reset', String(Math.floor(bestResult.resetAt / 1000)));
      }

      if (rateLimited && bestResult) {
        res.set('Retry-After', String(bestResult.retryAfter || 60));
        res.status(429).json({
          error: 'Too many requests',
          message: bestResult.retryAfter ? `Try again in ${bestResult.retryAfter}s` : 'Rate limit exceeded',
          retryAfter: bestResult.retryAfter,
        });
        return;
      }

      next();
    };
  }

  /** Default rules for common scenarios */
  static defaultRules(): RateLimitRule[] {
    return [
      {
        name: 'global',
        max: 1000,
        window: 60, // 1000 req/min
        keyFn: () => 'global',
      },
      {
        name: 'per-ip',
        max: 100,
        window: 60, // 100 req/min per IP
        keyFn: (req: any) => `ip:${req.ip || req.connection?.remoteAddress || 'unknown'}`,
      },
      {
        name: 'per-user',
        max: 60,
        window: 60, // 60 req/min per user
        keyFn: (req: any) => req.user ? `user:${req.user.id}` : `anon:${req.ip || 'unknown'}`,
      },
      {
        name: 'per-tenant',
        max: 500,
        window: 60, // 500 req/min per tenant
        keyFn: (req: any) => req.user?.tenantId ? `tenant:${req.user.tenantId}` : '',
        pathPattern: /./,
      },
      {
        name: 'api-stream',
        max: 10,
        window: 60, // 10 stream req/min
        keyFn: (req: any) => `stream:${req.user?.id || req.ip || 'unknown'}`,
        pathPattern: /\/api\/stream/,
      },
      {
        name: 'auth-endpoints',
        max: 10,
        window: 300, // 10 auth req/5min
        keyFn: (req: any) => `auth:${req.ip || 'unknown'}`,
        pathPattern: /\/api\/(auth|login|register)/,
      },
    ];
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

export function createRateLimitManager(config?: RateLimitConfig): RateLimitManager {
  return new RateLimitManager(config);
}
