/**
 * Enterprise Resource Locker
 * Fine-grained resource locking with read/write locks,
 * lock escalation, and deadlock detection.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { logger } from '../infra/index.js';

export type LockMode = 'read' | 'write' | 'upgrade';

export interface ResourceLock {
  id: string;
  resource: string;
  mode: LockMode;
  ownerId: string;
  acquiredAt: number;
  expiresAt: number;
}

export class ResourceLocker extends EventEmitter {
  private locks: Map<string, ResourceLock[]> = new Map(); // resource -> locks
  private waitQueue: Map<string, Array<{ id: string; mode: LockMode; ownerId: string; resolve: (lock: ResourceLock) => void; reject: (err: Error) => void; timestamp: number }>> = new Map();
  private defaultTtlMs: number;

  constructor(defaultTtlMs: number = 30000) {
    super();
    this.defaultTtlMs = defaultTtlMs;
  }

  /** Acquire a read lock (shared) */
  async readLock(resource: string, ownerId: string, ttl?: number): Promise<ResourceLock> {
    return this.acquireLock(resource, 'read', ownerId, ttl);
  }

  /** Acquire a write lock (exclusive) */
  async writeLock(resource: string, ownerId: string, ttl?: number): Promise<ResourceLock> {
    return this.acquireLock(resource, 'write', ownerId, ttl);
  }

  /** Acquire a lock with mode */
  private async acquireLock(resource: string, mode: LockMode, ownerId: string, ttl?: number): Promise<ResourceLock> {
    const lockTtl = ttl || this.defaultTtlMs;

    // Check for deadlock
    this.detectDeadlock(resource, ownerId, mode);

    const existingLocks = this.locks.get(resource) || [];

    // Try immediate acquisition
    const lock = this.tryAcquire(resource, mode, ownerId, lockTtl);
    if (lock) return lock;

    // Queue and wait
    return new Promise<ResourceLock>((resolve, reject) => {
      const queue = this.waitQueue.get(resource) || [];
      queue.push({
        id: randomUUID(),
        mode,
        ownerId,
        resolve,
        reject,
        timestamp: Date.now(),
      });
      this.waitQueue.set(resource, queue);

      // Timeout after ttl or default 30s
      setTimeout(() => {
        const idx = queue.findIndex((w) => w.ownerId === ownerId && w.mode === mode);
        if (idx >= 0) {
          queue.splice(idx, 1);
          reject(new Error(`Lock acquisition timeout for resource: ${resource}`));
        }
      }, lockTtl);
    });
  }

  /** Try to acquire a lock immediately */
  private tryAcquire(resource: string, mode: LockMode, ownerId: string, ttl: number): ResourceLock | null {
    const existingLocks = this.locks.get(resource) || [];

    // Clean expired locks
    const activeLocks = existingLocks.filter((l) => Date.now() < l.expiresAt);
    this.locks.set(resource, activeLocks);

    const hasWriteLock = activeLocks.some((l) => l.mode === 'write');

    if (mode === 'read') {
      // Read locks are shared — allow if no write lock
      if (hasWriteLock) return null;

      const lock: ResourceLock = {
        id: randomUUID(),
        resource,
        mode: 'read',
        ownerId,
        acquiredAt: Date.now(),
        expiresAt: Date.now() + ttl,
      };

      activeLocks.push(lock);
      this.locks.set(resource, activeLocks);
      this.processWaitQueue(resource);
      return lock;
    }

    if (mode === 'write') {
      // Write locks are exclusive — allow if no locks exist
      if (activeLocks.length > 0) {
        // Check if same owner has a read lock (upgrade)
        const readLock = activeLocks.find((l) => l.ownerId === ownerId && l.mode === 'read');
        if (readLock && activeLocks.every((l) => l.ownerId === ownerId)) {
          // Upgrade read to write
          this.locks.set(resource, []);
          const lock: ResourceLock = {
            id: randomUUID(),
            resource,
            mode: 'write',
            ownerId,
            acquiredAt: Date.now(),
            expiresAt: Date.now() + ttl,
          };
          this.locks.set(resource, [lock]);
          this.processWaitQueue(resource);
          return lock;
        }
        return null;
      }

      const lock: ResourceLock = {
        id: randomUUID(),
        resource,
        mode: 'write',
        ownerId,
        acquiredAt: Date.now(),
        expiresAt: Date.now() + ttl,
      };

      this.locks.set(resource, [lock]);
      return lock;
    }

    return null;
  }

  /** Release a lock */
  release(resource: string, lockId: string): boolean {
    const existingLocks = this.locks.get(resource) || [];
    const newLocks = existingLocks.filter((l) => l.id !== lockId);

    if (newLocks.length === existingLocks.length) return false;

    this.locks.set(resource, newLocks);
    this.processWaitQueue(resource);
    return true;
  }

  /** Release all locks for an owner */
  releaseAll(ownerId: string): number {
    let released = 0;

    for (const [resource, locks] of this.locks) {
      const newLocks = locks.filter((l) => l.ownerId !== ownerId);
      if (newLocks.length !== locks.length) {
        released += locks.length - newLocks.length;
        this.locks.set(resource, newLocks);
        this.processWaitQueue(resource);
      }
    }

    return released;
  }

  /** Check if a resource is locked */
  isLocked(resource: string, mode?: LockMode): boolean {
    const locks = this.locks.get(resource) || [];
    const active = locks.filter((l) => Date.now() < l.expiresAt);

    if (mode === 'write') return active.some((l) => l.mode === 'write');
    if (mode === 'read') return active.some((l) => l.mode === 'read');
    return active.length > 0;
  }

  /** Get active locks */
  getLocks(resource?: string): ResourceLock[] {
    if (resource) {
      return (this.locks.get(resource) || []).filter((l) => Date.now() < l.expiresAt);
    }

    const all: ResourceLock[] = [];
    for (const locks of this.locks.values()) {
      all.push(...locks.filter((l) => Date.now() < l.expiresAt));
    }
    return all;
  }

  /** Process wait queue */
  private processWaitQueue(resource: string): void {
    const queue = this.waitQueue.get(resource) || [];
    if (queue.length === 0) return;

    const resolved: number[] = [];

    for (let i = 0; i < queue.length; i++) {
      const waiter = queue[i];
      const lock = this.tryAcquire(resource, waiter.mode, waiter.ownerId, this.defaultTtlMs);
      if (lock) {
        resolved.push(i);
        waiter.resolve(lock);
        // Read locks can be granted simultaneously
        if (waiter.mode === 'write') break; // Write lock is exclusive
      }
    }

    // Remove resolved waiters
    for (const idx of resolved.reverse()) {
      queue.splice(idx, 1);
    }
  }

  /** Simple deadlock detection */
  private detectDeadlock(resource: string, ownerId: string, mode: LockMode): void {
    // Check if owner already holds an incompatible lock
    const locks = this.locks.get(resource) || [];
    const ownerLocks = locks.filter((l) => l.ownerId === ownerId && Date.now() < l.expiresAt);

    if (mode === 'write' && ownerLocks.some((l) => l.mode === 'read' && locks.some((l2) => l2.ownerId !== ownerId))) {
      throw new Error(`Potential deadlock: owner '${ownerId}' holds read lock while requesting write lock on '${resource}'`);
    }
  }

  /** Get stats */
  getStats(): { activeLocks: number; waitingRequests: number; byResource: Record<string, number> } {
    let activeLocks = 0;
    const byResource: Record<string, number> = {};

    for (const [resource, locks] of this.locks) {
      const active = locks.filter((l) => Date.now() < l.expiresAt).length;
      activeLocks += active;
      byResource[resource] = active;
    }

    let waitingRequests = 0;
    for (const queue of this.waitQueue.values()) {
      waitingRequests += queue.length;
    }

    return { activeLocks, waitingRequests, byResource };
  }
}

export function createResourceLocker(defaultTtlMs?: number): ResourceLocker {
  return new ResourceLocker(defaultTtlMs);
}
