# Resource Locker

## Overview

The **Resource Locker** module (`agent-gateway/src/resource-locker/`) provides fine-grained, in-process resource locking with shared/exclusive (read/write) locks, lock escalation, wait queues, and deadlock detection. It is designed to protect concurrent access to shared resources within the gateway process, ensuring data consistency when multiple asynchronous operations need to read from or write to the same logical resource.

The locker supports both read locks (shared -- multiple readers allowed simultaneously) and write locks (exclusive -- only one writer, no concurrent readers). It includes automatic TTL-based lock expiration to prevent lock leaks, a wait queue for blocked lock requests, and basic deadlock detection for lock upgrade scenarios.

### Key Capabilities

- **Read/Write Locks**: Shared read locks (multiple concurrent readers) and exclusive write locks (single writer).
- **Lock Escalation**: Automatically upgrade a read lock to a write lock when the same owner is the sole lock holder.
- **TTL-Based Expiration**: Locks auto-expire after a configurable TTL (default 30 seconds) to prevent deadlocks from abandoned locks.
- **Wait Queues**: Blocked lock requests are queued and automatically granted when the lock becomes available.
- **Deadlock Detection**: Detects and prevents potential deadlocks when an owner holding a read lock requests a write lock on a resource with other concurrent lock holders.
- **Per-Resource Tracking**: Track active locks per resource with statistics.
- **Bulk Release**: Release all locks held by a specific owner (useful for request-scoped cleanup).

---

## File Structure

```
agent-gateway/src/resource-locker/
  index.ts              # Main implementation (ResourceLocker class, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `events` (`EventEmitter`) for lock lifecycle events.
- `crypto` (`randomUUID`) for lock ID generation.
- `../infra/index.js` (the shared `logger` singleton) -- available for custom integrations.

---

## Full API Documentation

### Types

#### `LockMode`

```ts
type LockMode = 'read' | 'write' | 'upgrade';
```

#### `ResourceLock`

```ts
interface ResourceLock {
  id: string;
  resource: string;
  mode: LockMode;
  ownerId: string;
  acquiredAt: number;
  expiresAt: number;
}
```

| Property    | Type     | Description                                |
|-------------|----------|--------------------------------------------|
| `id`        | string   | Unique lock ID (UUID)                      |
| `resource`  | string   | Resource identifier being locked           |
| `mode`      | string   | `'read'` (shared) or `'write'` (exclusive) |
| `ownerId`   | string   | Identifier of the lock owner               |
| `acquiredAt`| number   | Timestamp when lock was acquired           |
| `expiresAt` | number   | Timestamp when lock will auto-expire       |

---

### Class: `ResourceLocker`

Extends `EventEmitter`.

#### Constructor

```ts
constructor(defaultTtlMs?: number)
```

| Parameter      | Type   | Default  | Description                         |
|----------------|--------|----------|-------------------------------------|
| `defaultTtlMs` | number | `30000`  | Default lock TTL in milliseconds    |

#### Methods

##### `async readLock(resource: string, ownerId: string, ttl?: number): Promise<ResourceLock>`

Acquires a shared read lock on the resource. Multiple owners can hold read locks simultaneously, but not if any owner holds a write lock.

```ts
const lock = await locker.readLock('user:123', 'request-abc');
```

##### `async writeLock(resource: string, ownerId: string, ttl?: number): Promise<ResourceLock>`

Acquires an exclusive write lock on the resource. Only one write lock can be held, and no read locks can coexist.

If the owner already holds the only read lock on the resource, it is automatically upgraded to a write lock.

```ts
const lock = await locker.writeLock('user:123', 'request-abc');
```

##### `release(resource: string, lockId: string): boolean`

Releases a specific lock. Returns `true` if the lock was found and released.

```ts
const released = locker.release('user:123', lock.id);
```

##### `releaseAll(ownerId: string): number`

Releases all locks held by a specific owner across all resources. Returns the count of released locks.

```ts
const count = locker.releaseAll('request-abc');
```

##### `isLocked(resource: string, mode?: LockMode): boolean`

Checks if a resource has active locks. If `mode` is specified, checks for that specific lock mode.

```ts
console.log(locker.isLocked('user:123'));        // Any lock?
console.log(locker.isLocked('user:123', 'write')); // Write lock?
console.log(locker.isLocked('user:123', 'read'));  // Read lock?
```

##### `getLocks(resource?: string): ResourceLock[]`

Returns active (non-expired) locks. If `resource` is specified, filters to that resource.

##### `getStats(): { activeLocks, waitingRequests, byResource }`

Returns locker statistics.

```ts
const stats = locker.getStats();
console.log(`Active locks: ${stats.activeLocks}`);
console.log(`Waiting: ${stats.waitingRequests}`);
console.log(`By resource:`, stats.byResource);
```

#### Private Methods

- **`acquireLock(resource, mode, ownerId, ttl)`**: Core lock acquisition logic with wait queue support.
- **`tryAcquire(resource, mode, ownerId, ttl)`**: Non-blocking lock acquisition attempt.
- **`processWaitQueue(resource)`**: Grants locks to waiting requests when resources become available.
- **`detectDeadlock(resource, ownerId, mode)`**: Checks for potential deadlock conditions.

---

### Factory Function

```ts
function createResourceLocker(defaultTtlMs?: number): ResourceLocker
```

Convenience factory.

---

## Configuration Options

```ts
const locker = createResourceLocker(60000); // 60-second default TTL
```

---

## Usage Examples

### Basic Read/Write Lock

```ts
import { createResourceLocker } from './index.js';

const locker = createResourceLocker();

// Read lock -- multiple readers allowed
const readLock1 = await locker.readLock('config:global', 'reader-1');
const readLock2 = await locker.readLock('config:global', 'reader-2');
console.log('Both readers hold locks simultaneously');

// Release
locker.release('config:global', readLock1.id);
locker.release('config:global', readLock2.id);

// Write lock -- exclusive
const writeLock = await locker.writeLock('config:global', 'writer-1');
// No other locks can be acquired on 'config:global' now
locker.release('config:global', writeLock.id);
```

### Read-Write Pattern with Await

```ts
// Reader
async function readConfig(requestId: string) {
  const lock = await locker.readLock('config:global', requestId);
  try {
    const config = await loadConfig();
    return config;
  } finally {
    locker.release('config:global', lock.id);
  }
}

// Writer
async function updateConfig(requestId: string, newConfig: any) {
  const lock = await locker.writeLock('config:global', requestId);
  try {
    await saveConfig(newConfig);
  } finally {
    locker.release('config:global', lock.id);
  }
}
```

### Lock Escalation

```ts
// Owner holds the only read lock -- can upgrade to write
const readLock = await locker.readLock('data:123', 'owner-1');
const writeLock = await locker.writeLock('data:123', 'owner-1');
// writeLock is now held; readLock was automatically upgraded
locker.release('data:123', writeLock.id);
```

### Wait Queue (Blocking Acquisition)

```ts
// Thread A holds a write lock
const lockA = await locker.writeLock('data:456', 'thread-a');

// Thread B tries to acquire -- will wait in queue
const lockBPromise = locker.writeLock('data:456', 'thread-b');

// Thread A releases -- Thread B's promise resolves
locker.release('data:456', lockA.id);

const lockB = await lockBPromise; // Resolves after lockA is released
```

### Bulk Release for Request Cleanup

```ts
// At the end of a request, release all locks held by this request
app.use((req, res, next) => {
  const requestId = req.id;
  res.on('finish', () => {
    const released = locker.releaseAll(requestId);
    if (released > 0) {
      console.log(`Released ${released} locks for request ${requestId}`);
    }
  });
  next();
});
```

### TTL Expiration

```ts
// Lock with custom TTL
const lock = await locker.writeLock('data:789', 'owner-1', 5000); // 5 second TTL

// After 5 seconds, the lock expires automatically
// Other waiters will be granted access
```

### Checking Lock Status

```ts
// Check before attempting an operation
if (locker.isLocked('data:123', 'write')) {
  console.log('Resource is exclusively locked; waiting...');
  const lock = await locker.writeLock('data:123', 'my-owner');
} else {
  // Safe to read without locking
}
```

---

## Integration Points

- **Session Manager** (`/home/runner/workspace/agent-gateway/src/session-manager/README.md`): Lock sessions by ID during concurrent message additions to prevent race conditions.
- **Event Store** (`/home/runner/workspace/agent-gateway/src/event-store/README.md`): Lock aggregates during event appending to ensure version consistency.
- **API Key Manager** (`/home/runner/workspace/agent-gateway/src/api-key-manager/README.md`): Lock API keys during rotation to prevent concurrent access issues.
- **Middleware Pipeline** (`/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md`): Custom middleware can acquire/release locks around request processing.
- **Infra Logger** (`/home/runner/workspace/agent-gateway/src/infra/`): Lock operations can be logged via the shared logger.

---

## Error Handling

- **Deadlock Detection**: If an owner holds a read lock and there are other concurrent lock holders, attempting to acquire a write lock throws `Error("Potential deadlock: owner '${ownerId}' holds read lock while requesting write lock on '${resource}'")`.
- **Lock Timeout**: If a lock request waits in the queue for more than 30 seconds, it is rejected with `Error("Lock acquisition timeout for resource: ${resource}")`.
- **Expired Locks**: Expired locks are automatically cleaned during `tryAcquire()`. They are silently removed from the active lock list.
- **Release Non-Existent Lock**: `release()` returns `false` if the lock ID is not found.
- **Wait Queue Cleanup**: If the locker is garbage collected while waiters are queued, those waiters' promises are never resolved. In practice, the 30-second timeout handles this.

---

## Lock Compatibility Matrix

| Current Locks    | Request: Read | Request: Write |
|-----------------|---------------|----------------|
| None            | Granted       | Granted        |
| Read (same owner) | Granted     | Upgraded       |
| Read (other owner) | Granted    | Wait           |
| Read (mixed)     | Granted      | Wait           |
| Write (any)      | Wait         | Wait           |

---

## Limitations

1. **In-Process Only**: Locks are not distributed across processes or nodes. For multi-instance deployments, use a distributed lock (e.g., Redis-based).
2. **No Re-Entrancy**: The same owner cannot acquire multiple read locks on the same resource. The wait queue handles same-owner requests sequentially.
3. **TTL Accuracy**: Lock expiration is checked opportunistically (during `tryAcquire()`). A lock may persist slightly beyond its TTL if no lock acquisition attempts are made on that resource.
4. **No Lock Fairness**: The wait queue processes readers in FIFO order but grants write locks as soon as the resource is free, potentially starving readers under heavy write load.

---

## Related Documentation

- [Session Manager](/home/runner/workspace/agent-gateway/src/session-manager/README.md) -- Session-level locking for concurrent message operations.
- [Event Store](/home/runner/workspace/agent-gateway/src/event-store/README.md) -- Aggregate-level locking for event consistency.
- [API Key Manager](/home/runner/workspace/agent-gateway/src/api-key-manager/README.md) -- Lock protection during key rotation.
- [Middleware Pipeline](/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md) -- Request-scoped lock management.
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
