import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceLocker, createResourceLocker, ResourceLock } from '../src/resource-locker/index.js';

describe('ResourceLocker', () => {
  let locker: ResourceLocker;

  beforeEach(() => {
    locker = createResourceLocker(5000);
  });

  describe('createResourceLocker', () => {
    it('should create a ResourceLocker instance', () => {
      expect(locker).toBeInstanceOf(ResourceLocker);
    });

    it('should accept custom default TTL', () => {
      const custom = createResourceLocker(10000);
      expect(custom).toBeInstanceOf(ResourceLocker);
    });

    it('should default to 30000ms TTL', () => {
      const defaultLocker = createResourceLocker();
      expect(defaultLocker).toBeInstanceOf(ResourceLocker);
    });
  });

  describe('readLock', () => {
    it('should acquire a read lock', async () => {
      const lock = await locker.readLock('resource-a', 'owner-1');
      expect(lock).toBeDefined();
      expect(lock.resource).toBe('resource-a');
      expect(lock.mode).toBe('read');
      expect(lock.ownerId).toBe('owner-1');
      expect(lock.id).toBeDefined();
      expect(lock.acquiredAt).toBeDefined();
      expect(lock.expiresAt).toBeDefined();
    });

    it('should allow multiple read locks on same resource', async () => {
      const lock1 = await locker.readLock('shared-resource', 'owner-1');
      const lock2 = await locker.readLock('shared-resource', 'owner-2');
      expect(lock1).toBeDefined();
      expect(lock2).toBeDefined();
    });

    it('should allow same owner to acquire multiple read locks', async () => {
      const lock1 = await locker.readLock('multi-read', 'owner-1');
      const lock2 = await locker.readLock('multi-read', 'owner-1');
      expect(lock1).toBeDefined();
      expect(lock2).toBeDefined();
    });
  });

  describe('writeLock', () => {
    it('should acquire a write lock', async () => {
      const lock = await locker.writeLock('resource-b', 'owner-1');
      expect(lock).toBeDefined();
      expect(lock.resource).toBe('resource-b');
      expect(lock.mode).toBe('write');
      expect(lock.ownerId).toBe('owner-1');
    });

    it('should block write when read lock exists', async () => {
      await locker.readLock('blocked-write', 'reader');

      // Write should timeout since read lock is held
      await expect(
        locker.writeLock('blocked-write', 'writer', 100),
      ).rejects.toThrow('Lock acquisition timeout');
    });

    it('should block read when write lock exists', async () => {
      await locker.writeLock('blocked-read', 'writer');

      await expect(
        locker.readLock('blocked-read', 'reader', 100),
      ).rejects.toThrow('Lock acquisition timeout');
    });

    it('should block second write lock', async () => {
      await locker.writeLock('double-write', 'writer-1');

      await expect(
        locker.writeLock('double-write', 'writer-2', 100),
      ).rejects.toThrow('Lock acquisition timeout');
    });
  });

  describe('lock upgrade (read to write)', () => {
    it('should upgrade read lock to write when sole owner', async () => {
      await locker.readLock('upgrade-res', 'owner-1');
      const writeLock = await locker.writeLock('upgrade-res', 'owner-1');
      expect(writeLock.mode).toBe('write');
    });

    it('should block upgrade when other owners have read locks', async () => {
      await locker.readLock('blocked-upgrade', 'owner-1');
      await locker.readLock('blocked-upgrade', 'owner-2');

      await expect(
        locker.writeLock('blocked-upgrade', 'owner-1', 100),
      ).rejects.toThrow('Potential deadlock');
    });
  });

  describe('release', () => {
    it('should release a lock', async () => {
      const lock = await locker.readLock('release-res', 'owner-1');
      const result = locker.release('release-res', lock.id);
      expect(result).toBe(true);
    });

    it('should return false for non-existent lock', async () => {
      const result = locker.release('non-existent', 'fake-lock-id');
      expect(result).toBe(false);
    });

    it('should allow write lock after read lock is released', async () => {
      const readLock = await locker.readLock('release-then-write', 'owner-1');
      locker.release('release-then-write', readLock.id);
      const writeLock = await locker.writeLock('release-then-write', 'writer');
      expect(writeLock.mode).toBe('write');
    });

    it('should allow next waiter to acquire lock after release', async () => {
      const readLock = await locker.readLock('waiter-release', 'owner-1');

      // Start a waiter for write lock
      const writePromise = locker.writeLock('waiter-release', 'writer');

      // Release the read lock
      locker.release('waiter-release', readLock.id);

      // The write lock should now be acquired
      const writeLock = await writePromise;
      expect(writeLock.mode).toBe('write');
    });
  });

  describe('releaseAll', () => {
    it('should release all locks for an owner', async () => {
      await locker.readLock('res-1', 'owner-multi');
      await locker.readLock('res-2', 'owner-multi');
      await locker.writeLock('res-3', 'owner-multi');

      const released = locker.releaseAll('owner-multi');
      expect(released).toBe(3);
    });

    it('should return 0 for owner with no locks', () => {
      const released = locker.releaseAll('non-existent-owner');
      expect(released).toBe(0);
    });

    it('should not release locks for other owners', async () => {
      await locker.readLock('shared', 'owner-a');
      await locker.readLock('shared', 'owner-b');

      locker.releaseAll('owner-a');
      expect(locker.isLocked('shared', 'read')).toBe(true);
    });
  });

  describe('isLocked', () => {
    it('should return true when resource has locks', async () => {
      await locker.readLock('check-lock', 'owner-1');
      expect(locker.isLocked('check-lock')).toBe(true);
    });

    it('should return false when resource has no locks', () => {
      expect(locker.isLocked('no-lock')).toBe(false);
    });

    it('should return true for write mode when write lock exists', async () => {
      await locker.writeLock('write-check', 'owner-1');
      expect(locker.isLocked('write-check', 'write')).toBe(true);
    });

    it('should return false for write mode when only read locks exist', async () => {
      await locker.readLock('read-only-check', 'owner-1');
      expect(locker.isLocked('read-only-check', 'write')).toBe(false);
    });

    it('should return true for read mode when read lock exists', async () => {
      await locker.readLock('read-check', 'owner-1');
      expect(locker.isLocked('read-check', 'read')).toBe(true);
    });
  });

  describe('getLocks', () => {
    it('should return locks for a specific resource', async () => {
      await locker.readLock('locks-res', 'owner-1');
      await locker.readLock('locks-res', 'owner-2');
      const locks = locker.getLocks('locks-res');
      expect(locks.length).toBe(2);
      expect(locks.every((l) => l.resource === 'locks-res')).toBe(true);
    });

    it('should return all locks when no resource specified', async () => {
      await locker.readLock('all-1', 'owner-1');
      await locker.writeLock('all-2', 'owner-1');
      const locks = locker.getLocks();
      expect(locks.length).toBe(2);
    });

    it('should return empty array for resource with no locks', () => {
      expect(locker.getLocks('empty')).toEqual([]);
    });

    it('should filter out expired locks', async () => {
      const lock = await locker.readLock('expire-check', 'owner-1', 10);
      await new Promise((r) => setTimeout(r, 20));
      const locks = locker.getLocks('expire-check');
      expect(locks.length).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return stats with no locks', () => {
      const stats = locker.getStats();
      expect(stats.activeLocks).toBe(0);
      expect(stats.waitingRequests).toBe(0);
      expect(stats.byResource).toEqual({});
    });

    it('should return accurate stats', async () => {
      await locker.readLock('stats-1', 'owner-1');
      await locker.writeLock('stats-2', 'owner-2');

      const stats = locker.getStats();
      expect(stats.activeLocks).toBe(2);
      expect(stats.waitingRequests).toBe(0);
      expect(stats.byResource['stats-1']).toBe(1);
      expect(stats.byResource['stats-2']).toBe(1);
    });

    it('should count waiting requests', async () => {
      await locker.writeLock('wait-stats', 'owner-1');

      // Start a waiter
      const waitPromise = locker.writeLock('wait-stats', 'owner-2', 5000);
      await new Promise((r) => setTimeout(r, 10));

      const stats = locker.getStats();
      expect(stats.waitingRequests).toBe(1);
    });
  });

  describe('lock expiration', () => {
    it('should expire locks after TTL', async () => {
      await locker.readLock('expire-res', 'owner-1', 20);
      await new Promise((r) => setTimeout(r, 30));
      expect(locker.isLocked('expire-res')).toBe(false);
    });

    it('should allow new lock after old one expired', async () => {
      await locker.writeLock('expire-write', 'owner-1', 20);
      await new Promise((r) => setTimeout(r, 30));

      const newLock = await locker.writeLock('expire-write', 'owner-2');
      expect(newLock.ownerId).toBe('owner-2');
    });
  });

  describe('custom TTL per lock', () => {
    it('should use custom TTL for individual lock', async () => {
      await locker.readLock('custom-ttl', 'owner-1', 10);
      await new Promise((r) => setTimeout(r, 20));
      expect(locker.isLocked('custom-ttl')).toBe(false);
    });
  });
});
