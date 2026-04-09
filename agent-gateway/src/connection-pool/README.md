# Connection Pool (`src/connection-pool/`)

> **Generic connection pooling for databases, HTTP clients, and other resources with health checking, automatic recycling, and overflow handling.**

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture](#architecture)
4. [Class API](#class-api)
5. [Configuration Options](#configuration-options)
6. [Usage Examples](#usage-examples)
7. [Connection Lifecycle](#connection-lifecycle)
8. [Health Checking](#health-checking)
9. [Error Handling](#error-handling)
10. [Integration Points](#integration-points)
11. [Performance Tuning](#performance-tuning)
12. [Related Documentation](#related-documentation)

---

## Overview

The `connection-pool/` module provides a **generic, type-parameterized connection pool** for managing reusable connections to databases, HTTP endpoints, Redis instances, or any other external resource. It implements the proven connection pool pattern used in high-throughput systems to avoid the overhead of creating and destroying connections on every request.

### Key Features

- **Generic type support** -- works with any connection type (`<T>`)
- **Factory pattern** -- pluggable `ConnectionFactory<T>` for create/destroy/validate
- **Automatic recycling** -- connections are returned to the idle pool after use
- **Overflow handling** -- pending requests queue when pool is at capacity
- **Health checking** -- periodic validation of idle connections
- **Lifetime management** -- connections expire after a configurable max lifetime
- **Idle timeout** -- unused connections are destroyed to free resources
- **Statistics tracking** -- real-time pool utilization metrics
- **Auto-acquire/release** -- `use()` helper for safe connection usage

### Why Connection Pooling Matters

In the Agent Gateway, connections to AI provider APIs, databases, and Redis instances are expensive:

- **TCP handshake overhead** -- creating a new connection takes 1-3 round trips
- **TLS negotiation** -- HTTPS connections require certificate verification
- **Authentication** -- database connections often need handshake-based auth
- **Resource limits** -- databases have max connection limits
- **Memory pressure** -- each connection consumes server-side resources

Pooling eliminates these costs by keeping a warm pool of ready-to-use connections.

---

## File Structure

```
connection-pool/
├── index.ts          # ConnectionPool class, factory, type definitions
```

The entire implementation is in a single file (~200 lines), with the pool logic, health checker, and statistics tracking all contained within the generic `ConnectionPool<T>` class.

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    ConnectionPool<T>                        │
│                                                            │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │   Idle Queue     │    │   Active Set     │              │
│  │                  │    │                  │              │
│  │  ┌────┐ ┌────┐  │    │  ┌────┐ ┌────┐  │              │
│  │  │ C1 │ │ C2 │  │    │  │ C3 │ │ C4 │  │              │
│  │  └────┘ └────┘  │    │  └────┘ └────┘  │              │
│  │  ready to use    │    │  in use          │              │
│  └──────────────────┘    └──────────────────┘              │
│                                                            │
│  ┌──────────────────┐    ┌──────────────────┐              │
│  │  Pending Queue   │    │  Health Checker   │              │
│  │                  │    │                   │              │
│  │  ┌────┐ ┌────┐  │    │  Periodic validate│              │
│  │  │ R1 │ │ R2 │  │    │  on idle conns    │              │
│  │  └────┘ └────┘  │    │  Recycle unhealthy │              │
│  └──────────────────┘    └──────────────────┘              │
│                                                            │
│  ┌──────────────────┐                                      │
│  │ ConnectionFactory│                                      │
│  │                  │                                      │
│  │  create()        │                                      │
│  │  destroy(conn)   │                                      │
│  │  validate(conn)  │                                      │
│  └──────────────────┘                                      │
└────────────────────────────────────────────────────────────┘
```

### Connection States

Each managed connection tracks:
- `createdAt` -- when the underlying connection was created
- `lastUsedAt` -- when it was last used (for idle timeout)
- `acquiredAt` -- when it was acquired from the pool (undefined when idle)
- `useCount` -- total number of times this connection has been acquired
- `healthy` -- last known health status

---

## Class API

### Types

```typescript
interface PoolConfig {
  min?: number;                    // Min idle connections (default: 0)
  max: number;                     // Max connections (required)
  idleTimeoutMs?: number;          // Idle timeout before destroying connection (default: 30000)
  maxLifetimeMs?: number;          // Max total lifetime of a connection (default: 600000)
  acquireTimeoutMs?: number;       // Timeout waiting for a connection (default: 30000)
  healthCheckIntervalMs?: number;  // How often to run health checks (default: 30000)
  testOnAcquire?: boolean;         // Validate connection on acquire (default: true)
  testOnRelease?: boolean;         // Validate connection on release (default: false)
}

interface PoolStats {
  total: number;       // Total connections (idle + active)
  active: number;      // Currently in-use connections
  idle: number;        // Available idle connections
  waiting: number;     // Requests waiting for a connection
  maxReached: number;  // Peak total connections ever reached
  created: number;     // Total connections ever created
  destroyed: number;   // Total connections ever destroyed
}

interface ManagedConnection<T> {
  connection: T;         // The actual connection object
  createdAt: number;     // Timestamp of creation
  lastUsedAt: number;    // Timestamp of last use
  acquiredAt?: number;   // Timestamp of acquisition (undefined if idle)
  useCount: number;      // Number of times acquired
  healthy: boolean;      // Last health check result
}

interface ConnectionFactory<T> {
  create(): Promise<T>;
  destroy(conn: T): Promise<void>;
  validate(conn: T): Promise<boolean>;
}
```

### `ConnectionPool<T>` Class

```typescript
class ConnectionPool<T> extends EventEmitter {
  constructor(factory: ConnectionFactory<T>, config: PoolConfig)

  // Lifecycle
  async init(): Promise<void>
  async close(): Promise<void>

  // Core operations
  async acquire(): Promise<ManagedConnection<T>>
  async release(managed: ManagedConnection<T>): Promise<void>
  async use<R>(fn: (conn: T) => Promise<R>): Promise<R>

  // Inspection
  getStats(): PoolStats
}
```

### Factory Function

```typescript
function createConnectionPool<T>(factory: ConnectionFactory<T>, config: PoolConfig): ConnectionPool<T>
```

---

## Configuration Options

| Option | Type | Default | Required | Description |
|--------|------|---------|----------|-------------|
| `min` | `number` | `0` | No | Minimum number of idle connections to maintain |
| `max` | `number` | -- | **Yes** | Maximum number of connections allowed |
| `idleTimeoutMs` | `number` | `30000` (30s) | No | How long a connection can sit idle before being destroyed |
| `maxLifetimeMs` | `number` | `600000` (10m) | No | Maximum lifetime of any connection before forced recycling |
| `acquireTimeoutMs` | `number` | `30000` (30s) | No | How long to wait for a connection when pool is full |
| `healthCheckIntervalMs` | `number` | `30000` (30s) | No | Interval between health check runs |
| `testOnAcquire` | `boolean` | `true` | No | Whether to validate connections when acquiring |
| `testOnRelease` | `boolean` | `false` | No | Whether to validate connections when releasing |

### Sizing Recommendations

| Use Case | min | max | idleTimeoutMs | maxLifetimeMs |
|----------|-----|-----|---------------|---------------|
| Database (PostgreSQL) | 2 | 20 | 60000 | 1800000 (30m) |
| Redis | 1 | 10 | 120000 | 3600000 (1h) |
| HTTP client | 0 | 50 | 15000 | 300000 (5m) |
| AI provider API | 1 | 5 | 30000 | 600000 (10m) |
| WebSocket | 1 | 3 | 300000 (5m) | 7200000 (2h) |

---

## Usage Examples

### Database Connection Pool (PostgreSQL)

```typescript
import { createConnectionPool } from '../connection-pool/index.js';
import pg from 'pg';

const dbPool = createConnectionPool<pg.PoolClient>({
  create: async () => {
    const pool = new pg.Pool({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    });
    return pool.connect();
  },
  destroy: async (client) => {
    client.release(true); // true = destroy the underlying connection
  },
  validate: async (client) => {
    try {
      await client.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  },
}, {
  min: 2,
  max: 20,
  idleTimeoutMs: 60000,
  maxLifetimeMs: 1800000,
});

await dbPool.init();

// Use with auto-acquire/release
const result = await dbPool.use(async (client) => {
  return client.query('SELECT * FROM users WHERE id = $1', [userId]);
});

console.log(result.rows);
```

### HTTP Connection Pool

```typescript
import { createConnectionPool, ConnectionFactory } from '../connection-pool/index.js';

interface HttpClient {
  baseURL: string;
  get(url: string): Promise<any>;
  post(url: string, data: any): Promise<any>;
  close(): void;
}

const httpFactory: ConnectionFactory<HttpClient> = {
  create: async () => {
    return {
      baseURL: 'https://api.openai.com/v1',
      get: async (url: string) => fetch(`https://api.openai.com/v1${url}`).then(r => r.json()),
      post: async (url: string, data: any) => fetch(`https://api.openai.com/v1${url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
      close: () => {},
    };
  },
  destroy: async (client) => {
    client.close();
  },
  validate: async () => true, // HTTP clients are always valid
};

const httpPool = createConnectionPool(httpFactory, {
  min: 1,
  max: 5,
  maxLifetimeMs: 300000,
});

await httpPool.init();
```

### Redis Connection Pool

```typescript
import { createConnectionPool } from '../connection-pool/index.js';
import Redis from 'ioredis';

const redisPool = createConnectionPool<Redis>({
  create: async () => {
    const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    return client;
  },
  destroy: async (client) => {
    await client.quit();
  },
  validate: async (client) => {
    try {
      await client.ping();
      return true;
    } catch {
      return false;
    }
  },
}, {
  min: 1,
  max: 10,
  idleTimeoutMs: 120000,
  maxLifetimeMs: 3600000,
});

await redisPool.init();
```

### Manual Acquire/Release Pattern

```typescript
// When you need fine-grained control over connection lifetime
const managed = await dbPool.acquire();
try {
  const client = managed.connection;
  const result = await client.query('SELECT * FROM sessions');
  // ... process results
} finally {
  // ALWAYS release in finally
  await dbPool.release(managed);
}
```

### Monitoring Pool Stats

```typescript
setInterval(() => {
  const stats = dbPool.getStats();
  console.log(`Pool: ${stats.active}/${stats.maxReached} active, ${stats.idle} idle, ${stats.waiting} waiting`);
  // Pool: 3/12 active, 5 idle, 0 waiting
}, 10000);
```

---

## Connection Lifecycle

### Creation Flow

1. `init()` is called
2. Pool creates `min` connections via `factory.create()`
3. Health check interval timer is started

### Acquisition Flow

1. `acquire()` is called
2. Pool checks idle queue for available connections
3. For each idle connection:
   - Checks if `maxLifetimeMs` has elapsed -- if so, destroys and tries next
   - Checks `testOnAcquire` -- validates if enabled, destroys if invalid
   - Marks as active and returns
4. If no idle connection available and `total < max`:
   - Creates new connection via factory
5. If pool is at max capacity:
   - Adds request to pending queue with timeout
   - Waits for another caller to release a connection

### Release Flow

1. `release(managed)` is called
2. Marks connection as no longer active
3. If `testOnRelease` is enabled, validates -- destroys if invalid
4. If pending requests exist, immediately gives connection to next waiter
5. Otherwise, returns to idle queue
6. Shrinks pool if too many idle connections (oldest beyond `idleTimeoutMs` first)

### Shutdown Flow

1. `close()` is called
2. Health check interval is cleared
3. All pending requests are rejected with "Pool closed"
4. All idle and active connections are destroyed via factory
5. Pool is marked as closed (further `acquire()` calls throw)

---

## Health Checking

The pool runs a periodic health checker on a configurable interval:

1. **Validates all idle connections** using `factory.validate()`
2. **Removes unhealthy connections** from the idle queue
3. **Ensures minimum connections** -- creates new ones if `idle.length < min`
4. **Logs warnings** when unhealthy connections are found

```typescript
// Health check runs every healthCheckIntervalMs
// Default: 30 seconds
// Unhealthy connections are immediately destroyed
// New connections are created to maintain the minimum
```

### Validation Strategies

```typescript
// Database: lightweight query
validate: async (client) => {
  await client.query('SELECT 1');
  return true;
}

// Redis: ping
validate: async (client) => {
  await client.ping();
  return true;
}

// HTTP: always valid (stateless)
validate: async () => true,

// Complex: check connection state
validate: async (client) => {
  return client.readyState === 'connected';
}
```

---

## Error Handling

### Pool Closed

```typescript
// Calling acquire() on a closed pool throws synchronously
if (this.closed) throw new Error('Pool is closed');
```

### Acquire Timeout

```typescript
// When no connection is available within acquireTimeoutMs
// Error: "Connection acquire timeout (30000ms)"
```

### Factory Failures

- **create() failure** -- logged and swallowed (does not crash the pool)
- **destroy() failure** -- logged, connection count is still decremented
- **validate() failure** -- connection is destroyed and removed from pool

### Graceful Shutdown

```typescript
// Always close pools on application shutdown
process.on('SIGTERM', async () => {
  await dbPool.close();
  await redisPool.close();
  process.exit(0);
});
```

---

## Integration Points

### With ``

Wrap pool operations with a circuit breaker for resilience:

```typescript
import { createCircuitBreaker } from '../circuit-breaker/index.js';

const dbBreaker = createCircuitBreaker('database', { failureThreshold: 5 });

async function queryWithResilience(sql: string, params: any[]) {
  return dbBreaker.execute(async () => {
    return dbPool.use(async (client) => {
      return client.query(sql, params);
    });
  });
}
```

### With `src/distributed-lock/`

The distributed lock manager internally uses Redis connections, which can be pooled:

```typescript
// Use connection pool for Redis connections that the lock manager needs
const redisPool = createConnectionPool(redisFactory, { min: 1, max: 5 });
await redisPool.init();

const redis = await redisPool.use(async (client) => {
  return client;
});
```

### With `src/embedding-store/`

When using persistent backends (SQLite, Pinecone, Weaviate), connection pooling manages the backend connections:

```typescript
const store = createEmbeddingStore({ backend: 'sqlite' });
// Underlying SQLite connections are managed by a ConnectionPool
```

---

## Performance Tuning

### Monitoring Key Metrics

```typescript
const stats = pool.getStats();

// High waiting count = pool is undersized
if (stats.waiting > 0) {
  console.warn('Connections are contended -- consider increasing max');
}

// High active/max ratio = pool is frequently at capacity
if (stats.active / stats.maxReached > 0.8) {
  console.warn('Pool frequently at capacity');
}

// High created count = connections are being churned
if (stats.created > stats.maxReached * 3) {
  console.warn('High connection churn -- consider increasing maxLifetimeMs');
}
```

### Common Tuning Strategies

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Frequent acquire timeouts | Pool at max capacity | Increase `max` |
| High connection creation rate | Connections expiring too quickly | Increase `maxLifetimeMs` |
| Memory growing over time | Too many idle connections | Decrease `min`, increase `idleTimeoutMs` |
| Validation failures | Unstable backend connections | Investigate backend health |
| Pending queue growing | Sustained demand exceeds supply | Increase `max` or optimize query patterns |

---

## Related Documentation

- [``](../circuit-breaker/README.md) -- Wrap pool operations with circuit breakers
- [`src/distributed-lock/`](../distributed-lock/README.md) -- Uses Redis connections that can be pooled
- [`src/embedding-store/`](../embedding-store/README.md) -- Persistent backends use connection pooling
- [``](../README.md) -- Resilience patterns for external service calls
