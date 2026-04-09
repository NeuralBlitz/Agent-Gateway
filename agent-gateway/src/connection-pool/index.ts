/**
 * Enterprise Connection Pooling
 * Generic connection pool for databases, HTTP clients, and other resources
 * with health checking, automatic recycling, and overflow handling.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface PoolStats {
  total: number;
  active: number;
  idle: number;
  waiting: number;
  maxReached: number;
  created: number;
  destroyed: number;
}

export interface PoolConfig {
  /** Min idle connections */
  min?: number;
  /** Max connections */
  max: number;
  /** Connection idle timeout (ms) */
  idleTimeoutMs?: number;
  /** Connection max lifetime (ms) */
  maxLifetimeMs?: number;
  /** Acquire timeout (ms) */
  acquireTimeoutMs?: number;
  /** Health check interval (ms) */
  healthCheckIntervalMs?: number;
  /** Whether to test on acquire */
  testOnAcquire?: boolean;
  /** Whether to test on release */
  testOnRelease?: boolean;
}

export interface ManagedConnection<T> {
  connection: T;
  createdAt: number;
  lastUsedAt: number;
  acquiredAt?: number;
  useCount: number;
  healthy: boolean;
}

export interface ConnectionFactory<T> {
  create(): Promise<T>;
  destroy(conn: T): Promise<void>;
  validate(conn: T): Promise<boolean>;
}

export class ConnectionPool<T> extends EventEmitter {
  private config: Required<PoolConfig>;
  private factory: ConnectionFactory<T>;
  private idle: ManagedConnection<T>[] = [];
  private active: Set<ManagedConnection<T>> = new Set();
  private pending: Array<{ resolve: (conn: ManagedConnection<T>) => void; reject: (err: Error) => void; timestamp: number }> = [];
  private stats: PoolStats = { total: 0, active: 0, idle: 0, waiting: 0, maxReached: 0, created: 0, destroyed: 0 };
  private healthCheckInterval?: ReturnType<typeof setInterval>;
  private closed = false;

  constructor(factory: ConnectionFactory<T>, config: PoolConfig) {
    super();
    this.factory = factory;
    this.config = {
      min: config.min || 0,
      max: config.max,
      idleTimeoutMs: config.idleTimeoutMs || 30000,
      maxLifetimeMs: config.maxLifetimeMs || 600000,
      acquireTimeoutMs: config.acquireTimeoutMs || 30000,
      healthCheckIntervalMs: config.healthCheckIntervalMs || 30000,
      testOnAcquire: config.testOnAcquire ?? true,
      testOnRelease: config.testOnRelease ?? false,
    };
  }

  /** Initialize the pool and create minimum connections */
  async init(): Promise<void> {
    for (let i = 0; i < this.config.min; i++) {
      try {
        const conn = await this.createConnection();
        this.idle.push(conn);
      } catch (err: any) {
        logger.error({ err }, 'Failed to create initial connection');
      }
    }

    // Start health checker
    this.healthCheckInterval = setInterval(() => this.healthCheck(), this.config.healthCheckIntervalMs);

    logger.info({ min: this.config.min, max: this.config.max }, 'Connection pool initialized');
  }

  /** Acquire a connection from the pool */
  async acquire(): Promise<ManagedConnection<T>> {
    if (this.closed) throw new Error('Pool is closed');

    // Try to get an idle connection
    while (this.idle.length > 0) {
      const managed = this.idle.shift()!;

      // Check lifetime
      if (this.config.maxLifetimeMs > 0 && Date.now() - managed.createdAt > this.config.maxLifetimeMs) {
        await this.destroyConnection(managed);
        continue;
      }

      // Validate if configured
      if (this.config.testOnAcquire && !await this.factory.validate(managed.connection)) {
        await this.destroyConnection(managed);
        continue;
      }

      // Mark as active
      managed.acquiredAt = Date.now();
      managed.lastUsedAt = Date.now();
      managed.useCount++;
      this.active.add(managed);
      this.updateStats();

      return managed;
    }

    // If under max, create new connection
    if (this.stats.total < this.config.max) {
      const managed = await this.createConnection();
      managed.acquiredAt = Date.now();
      managed.lastUsedAt = Date.now();
      managed.useCount = 1;
      this.active.add(managed);
      this.updateStats();
      return managed;
    }

    // Otherwise, wait for a connection to be released
    return new Promise<ManagedConnection<T>>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const idx = this.pending.findIndex((p) => p.resolve === resolve);
        if (idx >= 0) this.pending.splice(idx, 1);
        reject(new Error(`Connection acquire timeout (${this.config.acquireTimeoutMs}ms)`));
      }, this.config.acquireTimeoutMs);

      this.pending.push({
        resolve: (conn) => { clearTimeout(timeout); resolve(conn); },
        reject: (err) => { clearTimeout(timeout); reject(err); },
        timestamp: Date.now(),
      });

      this.updateStats();
    });
  }

  /** Release a connection back to the pool */
  async release(managed: ManagedConnection<T>): Promise<void> {
    if (!this.active.has(managed)) return;

    this.active.delete(managed);
    managed.acquiredAt = undefined;
    managed.lastUsedAt = Date.now();

    // Validate on release if configured
    if (this.config.testOnRelease && !await this.factory.validate(managed.connection)) {
      await this.destroyConnection(managed);
      this.updateStats();
      return;
    }

    // Check if there are pending requests
    if (this.pending.length > 0) {
      const { resolve } = this.pending.shift()!;
      managed.acquiredAt = Date.now();
      managed.useCount++;
      this.active.add(managed);
      resolve(managed);
      this.updateStats();
      return;
    }

    // Check idle timeout
    if (Date.now() - managed.createdAt > this.config.maxLifetimeMs) {
      await this.destroyConnection(managed);
    } else {
      this.idle.push(managed);
    }

    // Shrink pool if too many idle connections
    while (this.idle.length > this.config.min) {
      const idleConn = this.idle[this.idle.length - 1];
      if (Date.now() - idleConn.lastUsedAt > this.config.idleTimeoutMs) {
        this.idle.pop();
        await this.destroyConnection(idleConn);
      } else {
        break;
      }
    }

    this.updateStats();
  }

  /** Execute a function with an auto-acquired/released connection */
  async use<R>(fn: (conn: T) => Promise<R>): Promise<R> {
    const managed = await this.acquire();
    try {
      return await fn(managed.connection);
    } finally {
      await this.release(managed);
    }
  }

  /** Close the pool and destroy all connections */
  async close(): Promise<void> {
    this.closed = true;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Reject pending requests
    for (const { reject } of this.pending) {
      reject(new Error('Pool closed'));
    }
    this.pending = [];

    // Destroy all connections
    for (const managed of [...this.idle, ...this.active]) {
      await this.destroyConnection(managed);
    }
    this.idle = [];
    this.active.clear();

    logger.info('Connection pool closed');
  }

  /** Run health checks on idle connections */
  private async healthCheck(): Promise<void> {
    if (this.closed) return;

    const unhealthy: ManagedConnection<T>[] = [];

    for (const managed of this.idle) {
      try {
        const healthy = await this.factory.validate(managed.connection);
        if (!healthy) unhealthy.push(managed);
      } catch {
        unhealthy.push(managed);
      }
    }

    for (const managed of unhealthy) {
      const idx = this.idle.indexOf(managed);
      if (idx >= 0) {
        this.idle.splice(idx, 1);
        await this.destroyConnection(managed);
        logger.debug('Unhealthy connection removed during health check');
      }
    }

    // Ensure minimum connections
    while (this.idle.length < this.config.min) {
      try {
        const conn = await this.createConnection();
        this.idle.push(conn);
      } catch (err: any) {
        logger.error({ err }, 'Failed to create connection during health check');
        break;
      }
    }
  }

  private async createConnection(): Promise<ManagedConnection<T>> {
    const connection = await this.factory.create();
    const managed: ManagedConnection<T> = {
      connection,
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 0,
      healthy: true,
    };
    this.stats.created++;
    this.stats.total++;
    if (this.stats.total > this.stats.maxReached) {
      this.stats.maxReached = this.stats.total;
    }
    this.updateStats();
    return managed;
  }

  private async destroyConnection(managed: ManagedConnection<T>): Promise<void> {
    try {
      await this.factory.destroy(managed.connection);
    } catch (err: any) {
      logger.error({ err }, 'Error destroying connection');
    }
    this.stats.destroyed++;
    this.stats.total--;
    this.updateStats();
  }

  private updateStats(): void {
    this.stats.active = this.active.size;
    this.stats.idle = this.idle.length;
    this.stats.waiting = this.pending.length;
  }

  /** Get pool stats */
  getStats(): PoolStats {
    return { ...this.stats };
  }
}

export function createConnectionPool<T>(factory: ConnectionFactory<T>, config: PoolConfig): ConnectionPool<T> {
  return new ConnectionPool<T>(factory, config);
}
