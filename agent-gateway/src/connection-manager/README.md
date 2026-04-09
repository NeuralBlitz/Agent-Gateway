# Connection Manager

Enterprise connection lifecycle management module for the Agent Gateway. This module manages external service connections with connection pooling, health checking, automatic reconnection with exponential backoff, and comprehensive lifecycle management. It supports multiple connection types including HTTP, WebSocket, TCP, database, Redis, and custom protocols.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [Interfaces](#interfaces)
    - [ConnectionConfig](#connectionconfig)
    - [Connection](#connection)
    - [ConnectionPool](#connectionpool)
  - [ConnectionManager Class](#connectionmanager-class)
  - [registerFactory()](#registerfactory)
  - [createPool()](#createpool)
  - [acquire()](#acquire)
  - [release()](#release)
  - [closePool()](#closepool)
  - [closeAll()](#closeall)
  - [getPoolStats()](#getpoolstats)
  - [getAllStats()](#getallstats)
  - [Factory Function](#factory-function)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Connection Manager vs. Connection Pool](#connection-manager-vs-connection-pool)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Health Check Implementation](#health-check-implementation)
- [Related Documentation](#related-documentation)

## Overview

Managing connections to external services (databases, caches, APIs, message brokers) is a critical infrastructure concern. The `ConnectionManager` provides a centralized, multi-pool connection manager that handles the entire lifecycle of connections:

**Key features:**
- **Multi-pool management:** Create and manage separate connection pools for different services.
- **Factory-based connections:** Register connection factories for each connection type (HTTP, WS, TCP, database, Redis, custom).
- **Health checking:** Periodic health checks with type-specific probes (Redis PING, database SELECT 1, HTTP HEAD).
- **Automatic reconnection:** Exponential backoff retry on connection failure.
- **Acquire/release semantics:** Pool-based connection borrowing and returning.
- **Lifecycle events:** Emitted events for pool creation, connection creation, reconnection, unhealthy detection, and pool closure.
- **Graceful shutdown:** Drains connections before closing pools.

### Connection Lifecycle Flow

```
registerFactory('redis', factory)
    └── createPool(config) ──▶ Create minPoolSize connections
         └── acquire(poolId) ──▶ Get idle connection or create new
              └── release(poolId, connId) ──▶ Return to pool
    └── healthCheckPool() ──▶ Periodic health checks + auto-reconnect
    └── closePool(poolId) ──▶ Drain and close all connections
```

## File Structure

```
/home/runner/workspace/agent-gateway/src/connection-manager/
  index.ts          # ConnectionManager class, interfaces, factory function
  README.md         # This documentation file
```

## Installation and Import

```typescript
import { ConnectionManager, createConnectionManager } from '../connection-manager/index.js';
// or with the full absolute path:
// import { ConnectionManager, createConnectionManager } from '/home/runner/workspace/agent-gateway/src/connection-manager/index.js';
```

## API Reference

### Interfaces

#### ConnectionConfig

Configuration for a connection pool.

```typescript
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
  /** Reconnect delay in ms (base for exponential backoff) */
  reconnectDelayMs?: number;
  /** Custom connection options */
  options?: Record<string, any>;
}
```

#### Connection

Represents an individual connection within a pool.

```typescript
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
```

#### ConnectionPool

Represents a pool of connections to a single service.

```typescript
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
```

### ConnectionManager Class

Extends `EventEmitter` for lifecycle observability.

```typescript
export class ConnectionManager extends EventEmitter {
  registerFactory(type: string, factory: () => Promise<any>): void;
  async createPool(config: ConnectionConfig): Promise<ConnectionPool>;
  async acquire(poolId: string, config: ConnectionConfig): Promise<{ connection: Connection; client: any }>;
  release(poolId: string, connectionId: string): void;
  async closePool(poolId: string): Promise<void>;
  async closeAll(): Promise<void>;
  getPoolStats(poolId: string): ConnectionPool | null;
  getAllStats(): Array<{
    poolId: string; url: string; type: string;
    active: number; idle: number; total: number; healthy: number;
  }>;
}
```

**Events emitted:**
| Event | Payload | Description |
|-------|---------|-------------|
| `pool:created` | `ConnectionPool` | A new connection pool was created |
| `pool:closed` | `{ poolId }` | A connection pool was closed |
| `connection:created` | `Connection` | A new connection was established |
| `connection:reconnected` | `Connection` | A connection was successfully reconnected |
| `connection:unhealthy` | `Connection` | A connection failed its health check |
| `connection:disconnected` | `Connection` | A connection could not be reconnected |

### registerFactory()

Registers a connection factory for a specific type.

**Signature:**
```typescript
registerFactory(type: string, factory: () => Promise<any>): void
```

**Parameters:**
- `type: string` -- The connection type identifier (e.g., `'redis'`, `'database'`).
- `factory: () => Promise<any>` -- An async function that creates and returns a raw connection object. The factory must return a connection that has a `.close()` method for graceful shutdown.

### createPool()

Creates a connection pool with the given configuration.

**Signature:**
```typescript
async createPool(config: ConnectionConfig): Promise<ConnectionPool>
```

**Parameters:**
- `config: ConnectionConfig` -- The pool configuration including URL, type, pool sizes, health check interval, and retry settings.

**Returns:** `Promise<ConnectionPool>` -- The created pool with `minPoolSize` initial connections.

**Behavior:**
1. Generates a UUID for the pool.
2. Creates `minPoolSize` initial connections using the registered factory.
3. Starts a periodic health check interval if `healthCheckIntervalMs` is configured.
4. Emits `pool:created` event.

### acquire()

Acquires an idle connection from the pool, or creates a new one if none are available.

**Signature:**
```typescript
async acquire(poolId: string, config: ConnectionConfig): Promise<{ connection: Connection; client: any }>
```

**Parameters:**
- `poolId: string` -- The ID of the pool to acquire from.
- `config: ConnectionConfig` -- Configuration for creating a new connection if needed.

**Returns:** An object containing the `Connection` metadata and the raw `client` for use.

**Behavior:**
1. First tries to find an idle, healthy connection.
2. If none available and under `maxPoolSize`, creates a new connection.
3. If at max capacity, waits (polls every 100ms) until a connection becomes available or times out.

### release()

Returns a connection to the pool.

**Signature:**
```typescript
release(poolId: string, connectionId: string): void
```

**Parameters:**
- `poolId: string` -- The pool ID.
- `connectionId: string` -- The connection ID to release.

### closePool()

Gracefully closes a connection pool.

**Signature:**
```typescript
async closePool(poolId: string): Promise<void>
```

**Behavior:**
1. Stops the health check interval.
2. Sets all connections to `draining` status.
3. Calls `.close()` on each connection's client.
4. Removes the pool from the manager.
5. Emits `pool:closed` event.

### closeAll()

Closes all managed connection pools.

**Signature:**
```typescript
async closeAll(): Promise<void>
```

### getPoolStats()

Returns statistics for a specific pool.

**Signature:**
```typescript
getPoolStats(poolId: string): ConnectionPool | null
```

### getAllStats()

Returns statistics for all pools.

**Signature:**
```typescript
getAllStats(): Array<{
  poolId: string; url: string; type: string;
  active: number; idle: number; total: number; healthy: number;
}>
```

### Factory Function

```typescript
export function createConnectionManager(): ConnectionManager
```

Convenience factory for creating a connection manager instance.

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `maxPoolSize` | 10 | Maximum connections per pool |
| `minPoolSize` | 1 | Minimum connections maintained in each pool |
| `timeoutMs` | 30000 | Connection acquisition timeout (ms) |
| `healthCheckIntervalMs` | Not set | Interval for periodic health checks (disabled if not set) |
| `maxRetries` | 3 | Max retry attempts on connection failure |
| `reconnectDelayMs` | 1000 | Base delay for exponential backoff (ms) |
| `options` | `{}` | Custom options passed to the factory |

## Usage Examples

### Redis Connection Pool

```typescript
import { createConnectionManager } from '/home/runner/workspace/agent-gateway/src/connection-manager/index.js';

const manager = createConnectionManager();

// Register Redis factory
manager.registerFactory('redis', async () => {
  const Redis = (await import('ioredis')).default;
  const client = new Redis(process.env.REDIS_URL);
  return client;
});

// Create pool
const pool = await manager.createPool({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  type: 'redis',
  minPoolSize: 2,
  maxPoolSize: 10,
  healthCheckIntervalMs: 30000,
  maxRetries: 5,
  reconnectDelayMs: 2000,
});

// Acquire and use
const { connection, client } = await manager.acquire(pool.id, {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  type: 'redis',
});

await client.set('key', 'value');
manager.release(pool.id, connection.id);

// Close when done
await manager.closePool(pool.id);
```

### Database Connection Pool

```typescript
manager.registerFactory('database', async () => {
  const { Client } = await import('pg');
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();
  return client;
});

const dbPool = await manager.createPool({
  url: process.env.DATABASE_URL || 'postgresql://localhost:5432/app',
  type: 'database',
  minPoolSize: 3,
  maxPoolSize: 20,
  healthCheckIntervalMs: 15000,
});

// Use in a request handler
app.get('/api/data', async (req, res) => {
  const { connection, client } = await manager.acquire(dbPool.id, {
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/app',
    type: 'database',
  });

  try {
    const result = await client.query('SELECT * FROM users');
    res.json(result.rows);
  } finally {
    manager.release(dbPool.id, connection.id);
  }
});
```

### Monitoring Connection Health

```typescript
manager.on('connection:unhealthy', (conn) => {
  console.warn(`Connection ${conn.id} is unhealthy, attempting reconnection...`);
});

manager.on('connection:reconnected', (conn) => {
  console.log(`Connection ${conn.id} reconnected successfully`);
});

manager.on('connection:disconnected', (conn) => {
  console.error(`Connection ${conn.id} could not be reconnected`);
});
```

### Graceful Shutdown

```typescript
process.on('SIGTERM', async () => {
  console.log('Shutting down connection manager...');
  await manager.closeAll();
  process.exit(0);
});
```

## Connection Manager vs. Connection Pool

Both modules handle connection pooling, but at different levels of abstraction:

| Aspect | Connection Manager (this module) | Connection Pool (`src/connection-pool/`) |
|--------|----------------------------------|------------------------------------------|
| Location | `/home/runner/workspace/agent-gateway/src/connection-manager/` | `/home/runner/workspace/agent-gateway/src/connection-pool/` |
| Scope | Multi-pool, multi-type management | Single-pool, generic type-parameterized |
| Type system | String-based type tags (`'redis'`, `'database'`) | Generic `ConnectionPool<T>` with TypeScript generics |
| Factory registration | `registerFactory(type, factory)` at manager level | Factory passed to constructor |
| Health checking | Type-specific (Redis PING, DB SELECT 1, HTTP HEAD) | Generic `validate(conn)` from factory |
| Reconnection | Built-in with exponential backoff | Not handled at pool level |
| API | `acquire(poolId)` / `release(poolId, connId)` | `acquire()` / `release(managed)` |
| Best for | Application-wide connection orchestration | Reusable pool for a single resource type |

The `ConnectionPool` at `/home/runner/workspace/agent-gateway/src/connection-pool/` is a lower-level, generic, type-parameterized pool that provides `use<R>()` auto-acquire/release, `testOnAcquire`/`testOnRelease` validation, idle timeout, max lifetime, and pending request queuing. The `ConnectionManager` is a higher-level orchestrator that manages multiple pools across different service types.

## Integration Points

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| Cache Manager | `/home/runner/workspace/agent-gateway/src/cache-manager/` | The Cache Manager manages its own Redis connection internally; the Connection Manager could be used for centralized Redis pool management. |
| API Gateway | `/home/runner/workspace/agent-gateway/src/api-gateway/` | Manage connections to upstream services. |
| Infra Logger | `/home/runner/workspace/agent-gateway/src/infra/` | Connection lifecycle events logged through the infra logger. |
| Health Checker | `/home/runner/workspace/agent-gateway/src/health-checker/` | Report connection pool stats as health check data. |

## Error Handling

- **Factory failure:** If the factory throws, the connection enters an error state and retries with exponential backoff (base delay `reconnectDelayMs`, multiplied by `2^(attempt-1)` for up to `maxRetries` attempts).
- **Acquisition timeout:** If all connections are busy and the pool is at `maxPoolSize`, `acquire()` rejects after `timeoutMs` with `"Connection acquisition timeout"`.
- **Pool not found:** `acquire()` throws if the pool ID doesn't exist; `release()` silently ignores unknown pool IDs.
- **Health check failure:** Unhealthy connections are reconnected automatically. If reconnection fails after all retries, the connection is marked `disconnected` and a `connection:disconnected` event is emitted.
- **Graceful close:** `closePool()` calls `.close()` on each client but catches errors silently to ensure all connections are attempted.

## Health Check Implementation

Health checks are type-specific:

| Type | Health Check Method |
|------|---------------------|
| `redis` | `client.ping()` |
| `database` | `client.execute('SELECT 1')` |
| `http` | `fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })` |
| Other | Assumed healthy (return `true`) |

For custom types, implement health checking in the connection factory's returned object.

## Related Documentation

- [Connection Pool](/home/runner/workspace/agent-gateway/src/connection-pool/README.md) -- Lower-level, generic, type-parameterized connection pool.
- [Cache Manager](/home/runner/workspace/agent-gateway/src/cache-manager/README.md) -- Multi-tier caching with built-in Redis client management.
- [API Gateway](/home/runner/workspace/agent-gateway/src/api-gateway/README.md) -- Upstream service connection management.
- [Health Checker](/home/runner/workspace/agent-gateway/src/health-checker/README.md) -- Service health monitoring.
