/**
 * Redis-backed session persistence for horizontal scaling.
 * Multiple gateway instances can share session state via Redis.
 */

import { logger } from '../infra/index.js';
import type { SessionData, SessionPersistence } from '../sessions/index.js';

export interface RedisSessionConfig {
  /** Redis URL. Default: redis://localhost:6379 */
  url?: string;
  /** Key prefix (default: agw:sessions:) */
  keyPrefix?: string;
  /** TTL in seconds (default: 30 days) */
  ttl?: number;
}

export class RedisSessionPersistence implements SessionPersistence {
  private redis: any;
  private keyPrefix: string;
  private ttl: number;
  private initialized = false;

  constructor(config: RedisSessionConfig = {}) {
    this.keyPrefix = config.keyPrefix || 'agw:sessions:';
    this.ttl = config.ttl || 30 * 24 * 60 * 60; // 30 days
  }

  private async getClient(): Promise<any> {
    if (this.initialized && this.redis) return this.redis;

    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      const Redis = (await import('ioredis')).default;
      this.redis = new Redis(url, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        retryStrategy: (times: number) => Math.min(times * 50, 2000),
      });

      await this.redis.ping();
      this.initialized = true;
      logger.info({ url: url.replace(/:\/\/.*@/, '://***@') }, 'Redis session store connected');
    } catch (err: any) {
      logger.warn({ err }, 'Failed to connect to Redis, session persistence disabled');
      return null;
    }

    return this.redis;
  }

  private sessionKey(id: string): string {
    return `${this.keyPrefix}${id}`;
  }

  async save(session: SessionData): Promise<void> {
    const redis = await this.getClient();
    if (!redis) return;

    session.updatedAt = Date.now();

    const pipeline = redis.pipeline();
    pipeline.set(
      this.sessionKey(session.id),
      JSON.stringify(session),
      'EX',
      this.ttl,
    );
    // Also maintain a sorted set for user lookups
    pipeline.zadd(
      `${this.keyPrefix}index:${session.channel}:${session.userId}`,
      session.updatedAt,
      session.id,
    );
    await pipeline.exec();
  }

  async load(id: string): Promise<SessionData | null> {
    const redis = await this.getClient();
    if (!redis) return null;

    const data = await redis.get(this.sessionKey(id));
    if (!data) return null;

    try {
      return JSON.parse(data) as SessionData;
    } catch {
      logger.warn({ id }, 'Corrupted session data in Redis');
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    const redis = await this.getClient();
    if (!redis) return;

    // Get session to find index key
    const data = await redis.get(this.sessionKey(id));
    if (data) {
      try {
        const session = JSON.parse(data);
        await redis.del(this.sessionKey(id));
        await redis.zrem(
          `${this.keyPrefix}index:${session.channel}:${session.userId}`,
          id,
        );
      } catch {
        await redis.del(this.sessionKey(id));
      }
    }
  }

  async list(channel: string, userId: string): Promise<SessionData[]> {
    const redis = await this.getClient();
    if (!redis) return [];

    const indexKey = `${this.keyPrefix}index:${channel}:${userId}`;
    const ids = await redis.zrange(indexKey, 0, -1);

    if (!ids || ids.length === 0) return [];

    const sessions: SessionData[] = [];
    for (const id of ids) {
      const data = await redis.get(this.sessionKey(id));
      if (data) {
        try {
          sessions.push(JSON.parse(data));
        } catch {}
      }
    }

    return sessions;
  }

  /** Get count of sessions for a user */
  async countForUser(channel: string, userId: string): Promise<number> {
    const redis = await this.getClient();
    if (!redis) return 0;

    const indexKey = `${this.keyPrefix}index:${channel}:${userId}`;
    return redis.zcard(indexKey);
  }

  /** Get total session count */
  async count(): Promise<number> {
    const redis = await this.getClient();
    if (!redis) return 0;

    const keys = await redis.keys(`${this.keyPrefix}*`);
    // Filter out index keys
    return keys.filter((k: string) => !k.includes(':index:')).length;
  }

  /** Cleanup expired sessions */
  async cleanup(): Promise<number> {
    // Redis handles TTL automatically, so this is mostly a no-op
    return 0;
  }

  /** Close the Redis connection */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
      this.initialized = false;
    }
  }
}

export function createRedisSessionPersistence(config?: RedisSessionConfig): RedisSessionPersistence {
  return new RedisSessionPersistence(config);
}
