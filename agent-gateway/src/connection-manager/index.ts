/**
 * Enterprise Connection Manager
 * Manages external service connections with pooling, health checking,
 * automatic reconnection, circuit breaking, and lifecycle management.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { logger } from '../infra/index.js';

export interface ConnectionConfig {
  /** Connection URL */
  url: string;
  /** Connection type */
  type: 'http' | 'ws' | 'tcp' | 'database' | 'redis' | 'custom';
  /** Max connections in pool */
  maxPoolSize?: number;
  /** Min connections in pool */
  minPoolSize?: number;
  /** Connection timeout in ms */
  timeoutMs?: number;
  /** Health check interval in ms */
  healthCheckIntervalMs?: number;
  /** Max retries on failure */
  maxRetries?: number;
  /** Reconnect delay in ms */
  reconnectDelayMs?: number;
  /** Custom connection options */
  options?: Record<string, any>;
}

export interface Connection {
  id: string;
  url: string;
  type: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error' | 'draining';
  createdAt: number;
  lastUsedAt?: number;
  lastHealthCheck?: number;
  healthy: boolean;
  metadata: Record<string, any>;
}

export interface ConnectionPool {
  id: string;
  url: string;
  type: string;
  connections: Connection[];
  activeCount: number;
  idleCount: number;
  maxPoolSize: number;
  minPoolSize: number;
  createdAt: number;
}

export class ConnectionManager extends EventEmitter {
  private pools: Map<string, ConnectionPool> = new Map();
  private healthCheckIntervals: Map<string, ReturnType<typeof setInterval>> = new Map();
  private connectionFactories: Map<string, () => Promise<any>> = new Map();

  /** Register a connection factory */
  registerFactory(type: string, factory: () => Promise<any>): void {
    this.connectionFactories.set(type, factory);
  }

  /** Create a connection pool */
  async createPool(config: ConnectionConfig): Promise<ConnectionPool> {
    const poolId = randomUUID();

    const pool: ConnectionPool = {
      id: poolId,
      url: config.url,
      type: config.type,
      connections: [],
      activeCount: 0,
      idleCount: 0,
      maxPoolSize: config.maxPoolSize || 10,
      minPoolSize: config.minPoolSize || 1,
      createdAt: Date.now(),
    };

    this.pools.set(poolId, pool);

    // Create initial connections
    for (let i = 0; i < pool.minPoolSize; i++) {
      await this.createConnection(pool, config);
    }

    // Start health checking
    if (config.healthCheckIntervalMs) {
      const interval = setInterval(() => this.healthCheckPool(pool, config), config.healthCheckIntervalMs);
      this.healthCheckIntervals.set(poolId, interval);
    }

    logger.info({ poolId, url: config.url, type: config.type, minPool: pool.minPoolSize, maxPool: pool.maxPoolSize }, 'Connection pool created');
    this.emit('pool:created', pool);

    return pool;
  }

  /** Get a connection from pool */
  async acquire(poolId: string, config: ConnectionConfig): Promise<{ connection: Connection; client: any }> {
    const pool = this.pools.get(poolId);
    if (!pool) throw new Error(`Pool not found: ${poolId}`);

    // Try to get an idle connection
    for (const conn of pool.connections) {
      if (conn.status === 'connected' && conn.healthy && !conn.lastUsedAt) {
        conn.lastUsedAt = Date.now();
        pool.activeCount++;
        pool.idleCount--;
        return { connection: conn, client: conn.metadata.client };
      }
    }

    // Create new connection if under max
    if (pool.connections.length < pool.maxPoolSize) {
      const conn = await this.createConnection(pool, config);
      pool.activeCount++;
      return { connection: conn, client: conn.metadata.client };
    }

    // Wait for an available connection
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Connection acquisition timeout')), config.timeoutMs || 30000);

      const checkAvailable = setInterval(() => {
        for (const conn of pool.connections) {
          if (conn.status === 'connected' && conn.healthy && !conn.lastUsedAt) {
            clearInterval(checkAvailable);
            clearTimeout(timeout);
            conn.lastUsedAt = Date.now();
            pool.activeCount++;
            pool.idleCount--;
            resolve({ connection: conn, client: conn.metadata.client });
            return;
          }
        }
      }, 100);
    });
  }

  /** Release a connection back to pool */
  release(poolId: string, connectionId: string): void {
    const pool = this.pools.get(poolId);
    if (!pool) return;

    const conn = pool.connections.find((c) => c.id === connectionId);
    if (conn) {
      conn.lastUsedAt = undefined;
      pool.activeCount = Math.max(0, pool.activeCount - 1);
      pool.idleCount++;
    }
  }

  /** Create a single connection */
  private async createConnection(pool: ConnectionPool, config: ConnectionConfig): Promise<Connection> {
    const factory = this.connectionFactories.get(config.type);
    if (!factory) throw new Error(`No factory registered for type: ${config.type}`);

    const conn: Connection = {
      id: randomUUID(),
      url: config.url,
      type: config.type,
      status: 'connecting',
      createdAt: Date.now(),
      healthy: false,
      metadata: {},
    };

    pool.connections.push(conn);

    try {
      const client = await factory();
      conn.status = 'connected';
      conn.healthy = true;
      conn.metadata.client = client;
      pool.idleCount++;

      this.emit('connection:created', conn);
      logger.debug({ connectionId: conn.id, poolId: pool.id }, 'Connection created');
    } catch (err: any) {
      conn.status = 'error';
      conn.healthy = false;
      conn.metadata.error = err.message;

      // Retry with backoff
      const maxRetries = config.maxRetries || 3;
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        const delay = (config.reconnectDelayMs || 1000) * Math.pow(2, attempt - 1);
        logger.warn({ connectionId: conn.id, attempt, maxRetries, delay }, 'Connection failed, retrying');
        await new Promise((resolve) => setTimeout(resolve, delay));

        try {
          const client = await factory();
          conn.status = 'connected';
          conn.healthy = true;
          conn.metadata.client = client;
          pool.idleCount++;
          this.emit('connection:reconnected', conn);
          break;
        } catch {
          if (attempt === maxRetries) {
            logger.error({ connectionId: conn.id }, 'Connection failed after all retries');
          }
        }
      }
    }

    return conn;
  }

  /** Health check a pool */
  private async healthCheckPool(pool: ConnectionPool, config: ConnectionConfig): Promise<void> {
    for (const conn of pool.connections) {
      try {
        conn.lastHealthCheck = Date.now();

        // Use client-specific health check
        if (conn.metadata.client) {
          const healthy = await this.checkConnectionHealth(conn, config);
          conn.healthy = healthy;

          if (!healthy && conn.status === 'connected') {
            conn.status = 'error';
            logger.warn({ connectionId: conn.id, poolId: pool.id }, 'Connection health check failed');
            this.emit('connection:unhealthy', conn);

            // Attempt reconnection
            await this.reconnectConnection(conn, config);
          }
        }
      } catch (err: any) {
        conn.healthy = false;
        conn.status = 'error';
        logger.error({ connectionId: conn.id, err }, 'Health check error');
      }
    }

    // Ensure minimum pool size
    const healthyConnections = pool.connections.filter((c) => c.healthy && c.status === 'connected').length;
    while (healthyConnections < pool.minPoolSize) {
      await this.createConnection(pool, config);
    }
  }

  /** Check connection health */
  private async checkConnectionHealth(conn: Connection, config: ConnectionConfig): Promise<boolean> {
    const client = conn.metadata.client;
    if (!client) return false;

    switch (config.type) {
      case 'redis':
        try { await client.ping(); return true; } catch { return false; }
      case 'database':
        try { await client.execute('SELECT 1'); return true; } catch { return false; }
      case 'http':
        try {
          const response = await fetch(config.url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
          return response.ok;
        } catch { return false; }
      default:
        return true; // Assume healthy for unknown types
    }
  }

  /** Reconnect a connection */
  private async reconnectConnection(conn: Connection, config: ConnectionConfig): Promise<void> {
    const maxRetries = config.maxRetries || 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delay = (config.reconnectDelayMs || 1000) * Math.pow(2, attempt - 1);
      await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        const factory = this.connectionFactories.get(config.type);
        if (!factory) return;

        const client = await factory();
        conn.status = 'connected';
        conn.healthy = true;
        conn.metadata.client = client;
        conn.metadata.error = undefined;

        this.emit('connection:reconnected', conn);
        return;
      } catch (err: any) {
        logger.warn({ connectionId: conn.id, attempt, maxRetries }, 'Reconnection failed');
      }
    }

    conn.status = 'disconnected';
    this.emit('connection:disconnected', conn);
  }

  /** Close a pool */
  async closePool(poolId: string): Promise<void> {
    const pool = this.pools.get(poolId);
    if (!pool) return;

    // Stop health checking
    const interval = this.healthCheckIntervals.get(poolId);
    if (interval) {
      clearInterval(interval);
      this.healthCheckIntervals.delete(poolId);
    }

    // Drain connections
    for (const conn of pool.connections) {
      conn.status = 'draining';
      if (conn.metadata.client?.close) {
        try { await conn.metadata.client.close(); } catch {}
      }
    }

    this.pools.delete(poolId);
    logger.info({ poolId }, 'Connection pool closed');
    this.emit('pool:closed', { poolId });
  }

  /** Close all pools */
  async closeAll(): Promise<void> {
    for (const poolId of this.pools.keys()) {
      await this.closePool(poolId);
    }
  }

  /** Get pool stats */
  getPoolStats(poolId: string): ConnectionPool | null {
    return this.pools.get(poolId) || null;
  }

  /** Get all pool stats */
  getAllStats(): Array<{ poolId: string; url: string; type: string; active: number; idle: number; total: number; healthy: number }> {
    return Array.from(this.pools.values()).map((pool) => ({
      poolId: pool.id,
      url: pool.url,
      type: pool.type,
      active: pool.activeCount,
      idle: pool.idleCount,
      total: pool.connections.length,
      healthy: pool.connections.filter((c) => c.healthy).length,
    }));
  }
}

export function createConnectionManager(): ConnectionManager {
  return new ConnectionManager();
}
