# Distributed Lock (`src/distributed-lock/`)

> **Redis-backed distributed locks with automatic renewal, fairness guarantees, and deadlock prevention.**

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture](#architecture)
4. [Class API](#class-api)
5. [Configuration Options](#configuration-options)
6. [Usage Examples](#usage-examples)
7. [Lock Lifecycle](#lock-lifecycle)
8. [Auto-Renewal](#auto-renewal)
9. [Redis vs In-Memory Fallback](#redis-vs-in-memory-fallback)
10. [Atomic Operations](#atomic-operations)
11. [Error Handling](#error-handling)
12. [Integration Points](#integration-points)
13. [Best Practices](#best-practices)
14. [Related Documentation](#related-documentation)

---

## Overview

The `distributed-lock/` module provides a **distributed locking mechanism** backed by Redis, enabling safe coordination of operations across multiple processes, threads, or server instances. It implements the well-known Redis lock pattern using `SET NX PX` for atomic acquisition and Lua scripts for safe release and renewal.

### Why Distributed Locks Matter

In a distributed Agent Gateway:

- **Multiple gateway instances** may attempt to update the same resource simultaneously
- **Scheduled jobs** (from `src/cron/`) must not overlap across instances
- **Config changes** must be applied atomically without race conditions
- **Cache invalidation** must happen exactly once
- **Rate limit counters** must be incremented atomically

### Key Features

- **Redis-backed** -- uses `SET NX PX` for atomic lock acquisition
- **Lua scripts** -- atomic check-and-delete for safe release (only owner can release)
- **Auto-renewal** -- optional background timer to extend lock TTL before expiration
- **In-memory fallback** -- gracefully degrades to in-process locks if Redis is unavailable
- **Configurable timeouts** -- acquisition timeout, lock TTL, retry interval
- **Force release** -- admin operation to release stuck locks
- **Lock tracking** -- track active locks with resource names, IDs, and expiration times

---

## File Structure

```
distributed-lock/
├── index.ts          # DistributedLockManager, factory, type definitions
```

The module is implemented in a single file (~190 lines) containing the lock manager with Redis integration, Lua scripts for atomic operations, and in-memory fallback logic.

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                   DistributedLockManager                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   Redis Backend                         │  │
│  │                                                         │  │
│  │  ACQUIRE:  SET key value PX ttl NX (atomic)             │  │
│  │  RELEASE:  Lua script: GET key == value ? DEL key : 0   │  │
│  │  RENEW:    Lua script: GET key == value ? PEXPIRE : 0   │  │
│  │                                                         │  │
│  │  Key format: agw:lock:<resource>                        │  │
│  │  Value: <uuid> (unique per acquisition)                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │               In-Memory Fallback                        │  │
│  │                                                         │  │
│  │  Used when Redis is unavailable                          │  │
│  │  activeLocks Map<resource, Lock>                        │  │
│  │  Only protects against concurrent operations in same     │  │
│  │  process -- NOT across processes                         │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │               Auto-Renewal Timers                        │  │
│  │                                                         │  │
│  │  renewTimers Map<lockId, setInterval>                   │  │
│  │  Fires every renewalIntervalMs (default: TTL/3)          │  │
│  │  Only renews if lock is not yet expired                  │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │               Active Lock Tracking                      │  │
│  │                                                         │  │
│  │  activeLocks Map<resource, DistributedLock>             │  │
│  │  Tracks all currently held locks (Redis + in-memory)     │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Lock Acquisition Flow

```
acquire(resource, ttl)
    │
    ▼
Generate unique lockId (UUID)
    │
    ▼
┌───────────────────────────────┐
│ Has acquireTimeout elapsed?   │
│                               │
│ YES ──► Throw TimeoutError    │
│                               │
│ NO ──► Continue                │
└───────────────────────────────┘
    │
    ▼
┌───────────────────────────────┐
│   Redis available?             │
│                                │
│ YES ──► SET key value PX ttl NX│
│                                │
│ NO ──► Check in-memory map     │
└───────────────────────────────┘
    │
    ▼
┌───────────────────────────────┐
│   Lock acquired?               │
│                                │
│ YES ──► Create lock object    │
│         Start renewal timer    │
│         Return lock            │
│                                │
│ NO ──► Wait retryIntervalMs    │
│         Loop back              │
└───────────────────────────────┘
```

### Lock Release Flow

```
lock.release()
    │
    ▼
Stop auto-renewal timer
    │
    ▼
┌───────────────────────────────┐
│   Redis available?             │
│                                │
│ YES ──► Lua script:            │
│         GET key == lockId      │
│         ? DEL key : 0          │
│                                │
│ NO ──► Check in-memory map:    │
│         resource exists and    │
│         lockId matches         │
└───────────────────────────────┘
    │
    ▼
Remove from activeLocks map
```

---

## Class API

### Types

```typescript
interface DistributedLockConfig {
  redisUrl?: string;              // Redis connection URL (default: process.env.REDIS_URL or 'redis://localhost:6379')
  defaultTtlMs?: number;          // Default lock TTL in ms (default: 10000)
  renewalIntervalMs?: number;     // Lock renewal interval in ms (default: TTL / 3)
  acquireTimeoutMs?: number;      // Max wait time for lock acquisition in ms (default: 30000)
  retryIntervalMs?: number;       // Retry interval in ms (default: 100)
}

interface DistributedLock {
  resource: string;               // The locked resource name
  lockId: string;                 // Unique lock identifier (UUID)
  acquiredAt: number;             // When the lock was acquired
  expiresAt: number;              // When the lock expires
  release(): Promise<void>;       // Release this lock
  renew(): Promise<boolean>;      // Renew the lock's TTL
  isExpired(): boolean;           // Check if lock has expired
}
```

### `DistributedLockManager` Class

```typescript
class DistributedLockManager {
  constructor(config?: DistributedLockConfig)

  // Core operations
  async acquire(resource: string, ttl?: number): Promise<DistributedLock>
  async withLock<T>(resource: string, ttl: number | undefined, fn: () => Promise<T>): Promise<T>

  // Inspection
  async isLocked(resource: string): Promise<boolean>
  getActiveLockCount(): number
  getActiveLocks(): Array<{ resource: string; lockId: string; expiresAt: number }>

  // Admin operations
  async forceRelease(resource: string): Promise<void>

  // Lifecycle
  async close(): Promise<void>
}
```

### Factory Function

```typescript
function createDistributedLockManager(config?: DistributedLockConfig): DistributedLockManager
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `redisUrl` | `string` | `process.env.REDIS_URL` or `redis://localhost:6379` | Redis connection string |
| `defaultTtlMs` | `number` | `10000` (10s) | Default lock time-to-live in milliseconds |
| `renewalIntervalMs` | `number` | `TTL / 3` | How often to auto-renew locks. Set to 0 to compute automatically |
| `acquireTimeoutMs` | `number` | `30000` (30s) | Maximum time to wait for lock acquisition before throwing |
| `retryIntervalMs` | `number` | `100` | Time between retry attempts when lock is contested |

### Recommended Configurations

| Scenario | defaultTtlMs | acquireTimeoutMs | renewalIntervalMs |
|----------|-------------|------------------|-------------------|
| Quick operation (cache update) | 5000 | 5000 | auto (1667ms) |
| Medium operation (config change) | 10000 | 30000 | auto (3333ms) |
| Long operation (data migration) | 60000 | 60000 | auto (20000ms) |
| Critical section (no auto-renew) | 30000 | 5000 | 0 (disabled) |

---

## Usage Examples

### Basic Lock Acquisition and Release

```typescript
import { createDistributedLockManager } from '../distributed-lock/index.js';

const lockManager = createDistributedLockManager({
  redisUrl: process.env.REDIS_URL,
  defaultTtlMs: 10000,
});

// Acquire a lock
const lock = await lockManager.acquire('config-update');

try {
  // Perform the protected operation
  await updateConfiguration(newConfig);
} finally {
  // Always release the lock
  await lock.release();
}
```

### Using `withLock` (Recommended Pattern)

The `withLock` method handles acquisition, execution, and release automatically:

```typescript
const result = await lockManager.withLock('cache-warm', 5000, async () => {
  await warmAllCaches();
  return { cachesWarmed: 5 };
});

console.log(result); // { cachesWarmed: 5 }
// Lock is automatically released even if the handler throws
```

### Checking Lock Status

```typescript
const isLocked = await lockManager.isLocked('critical-section');
if (isLocked) {
  console.log('Resource is currently locked');
}

// Get all active locks
const locks = lockManager.getActiveLocks();
for (const lock of locks) {
  console.log(`${lock.resource} (expires at ${new Date(lock.expiresAt).toISOString()})`);
}
```

### Manual Renewal

```typescript
const lock = await lockManager.acquire('long-running-task', 5000);

try {
  // Do some work
  await doWork();

  // Work took longer than expected -- renew the lock
  if (lock.isExpired()) {
    const renewed = await lock.renew();
    if (!renewed) {
      throw new Error('Lock was lost and could not be renewed');
    }
  }

  // Continue working
  await doMoreWork();
} finally {
  await lock.release();
}
```

### Force Release (Admin Operation)

```typescript
// Emergency: a lock is stuck (e.g., process crashed without releasing)
await lockManager.forceRelease('stuck-resource');
```

### Monitoring Lock Count

```typescript
console.log(`Active locks: ${lockManager.getActiveLockCount()}`);
```

---

## Lock Lifecycle

### Acquisition

1. A unique `lockId` (UUID) is generated
2. The manager enters a retry loop bounded by `acquireTimeoutMs`
3. Each iteration attempts a Redis `SET key value PX ttl NX` command
4. If Redis is unavailable, falls back to in-memory check
5. On success, a `DistributedLock` object is returned with the resource, lockId, and expiration times
6. If `renewalIntervalMs > 0`, a `setInterval` timer is started to auto-renew

### Holding

The lock is valid until `expiresAt`. During this window:
- No other process can acquire the same resource (Redis ensures this)
- The holder can manually `renew()` to extend the TTL
- If auto-renewal is enabled, the TTL is extended automatically at each interval

### Release

1. The auto-renewal timer (if any) is stopped
2. A Lua script atomically checks that the Redis key still holds our lockId, then deletes it
3. The lock is removed from the `activeLocks` tracking map

### Expiration

If a lock expires without being released or renewed:
- Another process can acquire the lock
- The original holder's `release()` call will fail silently (the Lua script checks ownership)
- This prevents the original holder from accidentally releasing another process's lock

---

## Auto-Renewal

When `renewalIntervalMs > 0` (default: TTL / 3), the manager starts a `setInterval` timer that periodically attempts to renew the lock:

```typescript
const timer = setInterval(() => {
  if (!lock.isExpired()) {
    this.renewLock(lock, lockTtl).catch(() => {});
  }
}, this.config.renewalIntervalMs);
```

### Why TTL / 3?

The default renewal interval of TTL/3 provides a safety margin:

- At T=0: Lock acquired with 10s TTL
- At T=3.3s: First renewal -- TTL reset to 10s (new expiry: T=13.3s)
- At T=6.6s: Second renewal -- TTL reset to 10s (new expiry: T=16.6s)
- At T=10s: Third renewal -- TTL reset to 10s (new expiry: T=20s)

This means the lock is renewed approximately 3 times before it would naturally expire, providing 3 chances for renewal to succeed even if some fail.

### Disabling Auto-Renewal

Set `renewalIntervalMs` to 0:

```typescript
const lockManager = createDistributedLockManager({
  defaultTtlMs: 30000,
  renewalIntervalMs: 0, // No auto-renewal
});
```

---

## Redis vs In-Memory Fallback

### Redis Mode (Primary)

When Redis is available, the manager uses Redis for distributed locking:

- **Atomic acquisition** -- `SET key value PX ttl NX` is atomic in Redis
- **Safe release** -- Lua script ensures only the lock owner can release
- **Cross-process** -- locks work across multiple gateway instances
- **Cross-machine** -- works in distributed deployments

### In-Memory Fallback

If Redis cannot be loaded (the `ioredis` import fails), the manager silently falls back to in-memory locking:

```
WARN { err: ... } Redis not available -- using in-memory lock fallback
```

In-memory mode:
- Uses a `Map<resource, Lock>` for tracking
- **Only protects within the same process** -- NOT across processes
- Provides the same API, so calling code doesn't need changes
- Logs a warning so operators are aware of reduced guarantees

### Connection Resolution Order

```typescript
1. Reuse existing Redis client (if already created)
2. Dynamically import 'ioredis' and create new client with redisUrl
3. If import fails, return null (triggers in-memory fallback)
```

The Redis client is **lazily initialized** on first `acquire()` call, not at construction time.

---

## Atomic Operations

### Acquisition: `SET NX PX`

```redis
SET agw:lock:config-update <uuid> PX 10000 NX
```

- `NX` -- only set if the key does not exist (Not eXists)
- `PX` -- set the key's expiration in milliseconds
- Returns `OK` if the key was set, `null` if it already existed

### Release: Lua Script

```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("del", KEYS[1])
else
  return 0
end
```

This script atomically:
1. Gets the current value of the lock key
2. Compares it with our lockId (ensures we own the lock)
3. Only deletes if we are the owner
4. Returns 1 if deleted, 0 if not owned by us

This prevents a critical bug: if our lock expired and another process acquired it, we must not delete their lock.

### Renewal: Lua Script

```lua
if redis.call("get", KEYS[1]) == ARGV[1] then
  return redis.call("pexpire", KEYS[1], ARGV[2])
else
  return 0
end
```

This script atomically:
1. Gets the current value of the lock key
2. Compares it with our lockId
3. Only extends the TTL if we own the lock
4. Returns 1 if renewed, 0 if not owned by us

---

## Error Handling

### Acquisition Timeout

If the lock cannot be acquired within `acquireTimeoutMs`:

```typescript
throw new Error(`Failed to acquire lock for '${resource}' within ${this.config.acquireTimeoutMs}ms`);
```

### Lock Lost During Renewal

If `renew()` returns `false` (the lock is no longer owned by us):

```typescript
const renewed = await lock.renew();
if (!renewed) {
  // Another process has the lock -- stop working
  throw new Error('Lock was lost');
}
```

### Redis Connection Errors

Redis connection errors during `acquire()`, `release()`, or `renew()` are handled:

- **acquire()** -- falls back to in-memory mode if Redis import fails
- **release()** -- errors are caught and logged; the lock is still removed from tracking
- **renew()** -- errors are silently swallowed by the auto-renewal timer

### Force Release

Force release does not verify ownership -- it unconditionally deletes the lock key:

```typescript
await lockManager.forceRelease('stuck-resource');
// WARNING: This may release another process's lock
```

Use only as an emergency admin operation.

---

## Integration Points

### With `src/cron/`

Protect scheduled jobs from overlapping execution:

```typescript
scheduler.register({
  name: 'hourly-aggregation',
  schedule: '0 * * * *',
  enabled: true,
  maxConcurrency: 1,
  handler: async () => {
    await lockManager.withLock('hourly-aggregation', 60000, async () => {
      await aggregateHourlyMetrics();
    });
  },
});
```

### With `src/config-manager/`

Ensure config changes are applied atomically:

```typescript
configManager.on('config:changed', async (event) => {
  await lockManager.withLock('config-reload', 5000, async () => {
    await reloadService(event.key);
  });
});
```

### With `src/connection-pool/`

Protect connection pool operations:

```typescript
await lockManager.withLock('pool-resize', 5000, async () => {
  await dbPool.resize(newSize);
});
```

### With `src/dashboard/`

Push lock events to the dashboard:

```typescript
// Periodic lock stats
dashboard.registerProvider('metrics', async () => {
  return {
    ...systemMetrics,
    activeLocks: lockManager.getActiveLockCount(),
    lockDetails: lockManager.getActiveLocks(),
  };
}, 5000);
```

---

## Best Practices

1. **Use `withLock` whenever possible** -- it guarantees the lock is released even if your handler throws.

2. **Set appropriate TTLs** -- the TTL should be longer than your operation's expected duration, but not so long that a crashed process holds the lock for minutes.

3. **Enable auto-renewal for unpredictable operations** -- if your operation duration varies significantly, auto-renewal prevents accidental lock expiration.

4. **Always check renewal results** -- if manual renewal returns `false`, stop working immediately -- another process has the lock.

5. **Use descriptive resource names** -- names like `config-update`, `cache-warm:openai`, `migration:v2` make debugging easier.

6. **Don't hold locks during I/O** -- keep the critical section as short as possible. Acquire the lock, perform the operation, release immediately.

7. **Monitor active locks** -- use `getActiveLocks()` to detect stuck locks (locks held much longer than expected).

8. **Use force release sparingly** -- it bypasses ownership checks and can cause race conditions. Only use it when you are certain a lock is stuck.

9. **Test with Redis unavailable** -- verify your code handles the in-memory fallback gracefully (same-process protection only).

---

## Related Documentation

- [`src/cron/`](../cron/README.md) -- Protect scheduled jobs from overlapping execution
- [`src/config-manager/`](../config-manager/README.md) -- Atomic configuration reloads
- [`src/connection-pool/`](../connection-pool/README.md) -- Protect pool resize operations
- [`src/dashboard/`](../dashboard/README.md) -- Monitor active locks in real-time
- [Redis SET Command](https://redis.io/commands/set/) -- Redis documentation for SET NX PX
- [Redis Distlock Pattern](https://redis.io/docs/manual/patterns/distributed-locks/) -- Official Redis distributed lock pattern
