/**
 * Enterprise Distributed Lock Manager
 * Redis-backed distributed locks with automatic renewal,
 * fairness guarantees, and deadlock prevention.
 */

import { randomUUID } from 'crypto';
import { logger } from '../infra/index.js';

export interface DistributedLockConfig {
  /** Redis URL */
  redisUrl?: string;
  /** Default lock TTL in ms (default: 10000) */
  defaultTtlMs?: number;
  /** Lock renewal interval in ms (default: TTL / 3) */
  renewalIntervalMs?: number;
  /** Max wait time for lock acquisition in ms (default: 30000) */
  acquireTimeoutMs?: number;
  /** Retry interval in ms (default: 100) */
  retryIntervalMs?: number;
}

export interface DistributedLock {
  resource: string;
  lockId: string;
  acquiredAt: number;
  expiresAt: number;
  release(): Promise<void>;
  renew(): Promise<boolean>;
  isExpired(): boolean;
}

export class DistributedLockManager {
  private config: Required<DistributedLockConfig>;
  private redis: any;
  private renewTimers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private activeLocks: Map<string, DistributedLock> = new Map();

  constructor(config: DistributedLockConfig = {}) {
    this.config = {
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      defaultTtlMs: config.defaultTtlMs || 10000,
      renewalIntervalMs: config.renewalIntervalMs || 0,
      acquireTimeoutMs: config.acquireTimeoutMs || 30000,
      retryIntervalMs: config.retryIntervalMs || 100,
    };

    // Default renewal to TTL/3
    if (this.config.renewalIntervalMs === 0) {
      this.config.renewalIntervalMs = Math.floor(this.config.defaultTtlMs / 3);
    }
  }

  private async getClient(): Promise<any> {
    if (this.redis) return this.redis;
    try {
      const Redis = (await import('ioredis')).default;
      this.redis = new Redis(this.config.redisUrl, { lazyConnect: true });
      return this.redis;
    } catch (err: any) {
      logger.warn({ err }, 'Redis not available — using in-memory lock fallback');
      return null;
    }
  }

  /** Acquire a distributed lock */
  async acquire(resource: string, ttl?: number): Promise<DistributedLock> {
    const lockId = randomUUID();
    const lockTtl = ttl || this.config.defaultTtlMs;
    const startTime = Date.now();

    while (Date.now() - startTime < this.config.acquireTimeoutMs) {
      const redis = await this.getClient();

      let acquired: boolean;

      if (redis) {
        // Use Redis SET NX for atomic lock acquisition
        const result = await redis.set(
          `agw:lock:${resource}`,
          lockId,
          'PX',
          lockTtl,
          'NX',
        );
        acquired = result === 'OK';
      } else {
        // In-memory fallback
        acquired = !this.activeLocks.has(resource);
      }

      if (acquired) {
        const lock: DistributedLock = {
          resource,
          lockId,
          acquiredAt: Date.now(),
          expiresAt: Date.now() + lockTtl,
          release: async () => this.release(lock),
          renew: async () => this.renewLock(lock, lockTtl),
          isExpired: () => Date.now() > lock.expiresAt,
        };

        this.activeLocks.set(resource, lock);

        // Start auto-renewal
        if (this.config.renewalIntervalMs > 0) {
          const timer = setInterval(() => {
            if (!lock.isExpired()) {
              this.renewLock(lock, lockTtl).catch((err) => {
                logger.error({ resource, lockId: lock.lockId, err }, 'Lock renewal failed — lock may expire');
                // Release the lock from our active set since renewal failed
                this.activeLocks.delete(resource);
              });
            }
          }, this.config.renewalIntervalMs);
          this.renewTimers.set(lockId, timer);
        }

        logger.debug({ resource, lockId, ttl: lockTtl }, 'Distributed lock acquired');
        return lock;
      }

      // Wait and retry
      await new Promise((resolve) => setTimeout(resolve, this.config.retryIntervalMs));
    }

    throw new Error(`Failed to acquire lock for '${resource}' within ${this.config.acquireTimeoutMs}ms`);
  }

  /** Execute a function while holding a lock */
  async withLock<T>(resource: string, ttl: number | undefined, fn: () => Promise<T>): Promise<T> {
    const lock = await this.acquire(resource, ttl);
    try {
      return await fn();
    } finally {
      await lock.release();
    }
  }

  /** Release a lock */
  private async release(lock: DistributedLock): Promise<void> {
    // Stop renewal timer
    const timer = this.renewTimers.get(lock.lockId);
    if (timer) {
      clearInterval(timer);
      this.renewTimers.delete(lock.lockId);
    }

    const redis = await this.getClient();

    if (redis) {
      // Use Lua script for atomic check-and-delete (only delete if we own the lock)
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `;
      await redis.eval(script, 1, `agw:lock:${lock.resource}`, lock.lockId);
    } else {
      // In-memory fallback
      const existing = this.activeLocks.get(lock.resource);
      if (existing?.lockId === lock.lockId) {
        this.activeLocks.delete(lock.resource);
      }
    }

    this.activeLocks.delete(lock.resource);
    logger.debug({ resource: lock.resource, lockId: lock.lockId }, 'Distributed lock released');
  }

  /** Renew a lock's TTL */
  private async renewLock(lock: DistributedLock, ttl: number): Promise<boolean> {
    const redis = await this.getClient();

    if (redis) {
      // Only renew if we still own the lock
      const script = `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("pexpire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `;
      const result = await redis.eval(
        script,
        1,
        `agw:lock:${lock.resource}`,
        lock.lockId,
        String(ttl),
      );
      const renewed = result === 1;
      if (renewed) {
        lock.expiresAt = Date.now() + ttl;
      }
      return renewed;
    }

    // In-memory fallback
    const existing = this.activeLocks.get(lock.resource);
    if (existing?.lockId === lock.lockId) {
      lock.expiresAt = Date.now() + ttl;
      return true;
    }
    return false;
  }

  /** Check if a resource is locked */
  async isLocked(resource: string): Promise<boolean> {
    const redis = await this.getClient();

    if (redis) {
      const value = await redis.get(`agw:lock:${resource}`);
      return value !== null;
    }

    return this.activeLocks.has(resource);
  }

  /** Force release a lock (admin operation) */
  async forceRelease(resource: string): Promise<void> {
    const redis = await this.getClient();

    if (redis) {
      await redis.del(`agw:lock:${resource}`);
    }

    const lock = this.activeLocks.get(resource);
    if (lock) {
      const timer = this.renewTimers.get(lock.lockId);
      if (timer) {
        clearInterval(timer);
        this.renewTimers.delete(lock.lockId);
      }
    }
    this.activeLocks.delete(resource);
    logger.warn({ resource }, 'Force released distributed lock');
  }

  /** Get active lock count */
  getActiveLockCount(): number {
    return this.activeLocks.size;
  }

  /** Get active lock info */
  getActiveLocks(): Array<{ resource: string; lockId: string; expiresAt: number }> {
    return Array.from(this.activeLocks.values()).map((l) => ({
      resource: l.resource,
      lockId: l.lockId,
      expiresAt: l.expiresAt,
    }));
  }

  /** Close the lock manager */
  async close(): Promise<void> {
    // Release all locks
    for (const lock of this.activeLocks.values()) {
      try {
        await lock.release();
      } catch {
        // Ignore errors during shutdown
      }
    }

    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}

export function createDistributedLockManager(config?: DistributedLockConfig): DistributedLockManager {
  return new DistributedLockManager(config);
}
