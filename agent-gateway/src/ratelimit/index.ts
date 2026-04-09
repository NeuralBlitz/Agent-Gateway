import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';
import { logger } from '../infra/logger.js';

export interface RateLimitConfig {
  points: number;
  duration: number;
  blockDuration?: number;
}

export interface RateLimitOptions {
  global?: RateLimitConfig;
  perChannel?: Record<string, RateLimitConfig>;
  perUser?: RateLimitConfig;
  perIP?: RateLimitConfig;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;
}

export class RateLimiter {
  private limiters: Map<string, RateLimiterMemory> = new Map();
  private options: RateLimitOptions;

  constructor(options: RateLimitOptions = {}) {
    this.options = options;

    if (options.global) {
      this.createLimiter('global', options.global);
    }
  }

  private createLimiter(key: string, config: RateLimitConfig): void {
    const limiter = new RateLimiterMemory({
      points: config.points,
      duration: config.duration,
      blockDuration: config.blockDuration || 0,
    });
    this.limiters.set(key, limiter);
  }

  async check(key: string, limit: string = 'global'): Promise<RateLimitResult> {
    let limiter = this.limiters.get(limit);

    if (!limiter) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(Date.now() + 86400000),
      };
    }

    try {
      const result = await limiter.consume(key);
      return {
        allowed: true,
        remaining: result.remainingPoints,
        resetAt: new Date(Date.now() + result.msBeforeNext),
      };
    } catch (error) {
      const rateLimitError = error as RateLimiterRes;
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(Date.now() + rateLimitError.msBeforeNext),
        retryAfter: Math.ceil(rateLimitError.msBeforeNext / 1000),
      };
    }
  }

  async checkChannel(channel: string): Promise<RateLimitResult> {
    const config = this.options.perChannel?.[channel];
    if (!config) {
      return { allowed: true, remaining: Infinity, resetAt: new Date() };
    }
    return this.check(channel, `channel:${channel}`);
  }

  async checkUser(userId: string): Promise<RateLimitResult> {
    const config = this.options.perUser;
    if (!config) {
      return { allowed: true, remaining: Infinity, resetAt: new Date() };
    }
    return this.check(userId, `user:${userId}`);
  }

  setChannelLimit(channel: string, config: RateLimitConfig): void {
    this.createLimiter(`channel:${channel}`, config);
  }

  setUserLimit(userId: string, config: RateLimitConfig): void {
    this.createLimiter(`user:${userId}`, config);
  }

  removeLimit(key: string): void {
    this.limiters.delete(key);
  }

  async reset(key: string, limit?: string): Promise<void> {
    const fullKey = limit ? `${limit}:${key}` : key;
    const limiter = this.limiters.get(limit || 'global');
    if (limiter) {
      try {
        await limiter.delete(key);
      } catch {}
    }
  }

  clear(): void {
    this.limiters.clear();
  }
}

export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  return new RateLimiter(options);
}

export interface PerKeyLimitConfig extends RateLimitConfig {
  key: string;
}

export interface RateLimitThrottleOptions {
  maxConcurrent?: number;
  minTime?: number;
}

export class Throttler {
  private queue: Map<string, Promise<unknown>> = new Map();
  private maxConcurrent: number;
  private minTime: number;

  constructor(options: RateLimitThrottleOptions = {}) {
    this.maxConcurrent = options.maxConcurrent || 5;
    this.minTime = options.minTime || 100;
  }

  async throttle<T>(key: string, fn: () => Promise<T>): Promise<T> {
    while (this.queue.size >= this.maxConcurrent) {
      await Promise.race(this.queue.values());
    }

    const promise = this._throttle(key, fn);
    this.queue.set(key, promise);

    try {
      return await promise;
    } finally {
      this.queue.delete(key);
    }
  }

  private async _throttle<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    const result = await fn();
    const elapsed = Date.now() - startTime;
    
    if (elapsed < this.minTime) {
      await new Promise(resolve => setTimeout(resolve, this.minTime - elapsed));
    }

    return result;
  }

  getActiveCount(): number {
    return this.queue.size;
  }

  clear(): void {
    this.queue.clear();
  }
}

export function createThrottler(options?: RateLimitThrottleOptions): Throttler {
  return new Throttler(options);
}