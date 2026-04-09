import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RequestDeduplicator, createRequestDeduplicator } from '../src/request-deduplicator/index.js';

describe('RequestDeduplicator', () => {
  let deduplicator: RequestDeduplicator;

  beforeEach(() => {
    deduplicator = createRequestDeduplicator({ ttlMs: 5000 });
  });

  afterEach(() => {
    deduplicator.destroy();
  });

  describe('createRequestDeduplicator', () => {
    it('should create a RequestDeduplicator instance', () => {
      expect(deduplicator).toBeInstanceOf(RequestDeduplicator);
    });

    it('should accept custom config', () => {
      const custom = createRequestDeduplicator({
        maxConcurrent: 500,
        ttlMs: 10000,
        includeHeaders: true,
        headerKeys: ['authorization'],
      });
      expect(custom).toBeInstanceOf(RequestDeduplicator);
      custom.destroy();
    });
  });

  describe('deduplicate', () => {
    it('should execute function when no duplicate exists', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      const result = await deduplicator.deduplicate('key1', fn);
      expect(result).toBe('result');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should deduplicate concurrent identical requests', async () => {
      let callCount = 0;
      const fn = async () => {
        callCount++;
        await new Promise((r) => setTimeout(r, 50));
        return 'shared-result';
      };

      const promises = [
        deduplicator.deduplicate('shared-key', fn),
        deduplicator.deduplicate('shared-key', fn),
        deduplicator.deduplicate('shared-key', fn),
      ];

      const results = await Promise.all(promises);
      expect(results).toEqual(['shared-result', 'shared-result', 'shared-result']);
      expect(callCount).toBe(1);
    });

    it('should not deduplicate different keys', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      await deduplicator.deduplicate('key-a', fn);
      await deduplicator.deduplicate('key-b', fn);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should return deduplication stats', async () => {
      const fn = async () => {
        await new Promise((r) => setTimeout(r, 20));
        return 'value';
      };

      const promises = [
        deduplicator.deduplicate('stats-key', fn),
        deduplicator.deduplicate('stats-key', fn),
        deduplicator.deduplicate('stats-key', fn),
      ];
      await Promise.all(promises);

      const stats = deduplicator.getStats();
      expect(stats.totalRequests).toBe(3);
      expect(stats.deduplicatedRequests).toBe(2);
      expect(stats.uniqueRequests).toBe(1);
    });

    it('should propagate errors', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fn error'));
      await expect(deduplicator.deduplicate('err-key', fn)).rejects.toThrow('fn error');
    });

    it('should share errors among waiters', async () => {
      const fn = async () => {
        await new Promise((r) => setTimeout(r, 30));
        throw new Error('shared error');
      };

      const p1 = deduplicator.deduplicate('shared-err', fn);
      const p2 = deduplicator.deduplicate('shared-err', fn);

      await expect(p1).rejects.toThrow('shared error');
      await expect(p2).rejects.toThrow('shared error');
    });

    it('should emit deduplicated event', async () => {
      const dedupHandler = vi.fn();
      deduplicator.on('deduplicated', dedupHandler);

      const fn = async () => {
        await new Promise((r) => setTimeout(r, 30));
        return 'val';
      };

      await Promise.all([
        deduplicator.deduplicate('event-key', fn),
        deduplicator.deduplicate('event-key', fn),
      ]);

      expect(dedupHandler).toHaveBeenCalledTimes(1);
    });

    it('should emit completed event', async () => {
      const completeHandler = new Promise<void>((resolve) => {
        deduplicator.on('completed', () => resolve());
      });

      await deduplicator.deduplicate('complete-key', async () => 'done');
      await completeHandler;
    });

    it('should emit error event on failure', async () => {
      const errorHandler = new Promise<{ dedupKey: string; error: string }>((resolve) => {
        deduplicator.on('error', resolve);
      });

      await expect(deduplicator.deduplicate('error-evt', async () => {
        throw new Error('boom');
      })).rejects.toThrow('boom');

      const event = await errorHandler;
      expect(event.dedupKey).toBeDefined();
      expect(event.error).toBe('boom');
    });

    it('should execute without dedup when context is different', async () => {
      const fn = vi.fn().mockResolvedValue('result');
      await deduplicator.deduplicate('ctx-key', fn, { method: 'GET', path: '/a' });
      await deduplicator.deduplicate('ctx-key', fn, { method: 'POST', path: '/b' });
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('concurrency limit', () => {
    it('should execute without dedup when max concurrent reached', async () => {
      const limitedDedup = createRequestDeduplicator({ maxConcurrent: 2, ttlMs: 5000 });
      const fn1 = async () => {
        await new Promise((r) => setTimeout(r, 200));
        return 'r1';
      };
      const fn2 = async () => 'r2';
      const fn3 = async () => 'r3';

      // Fill up the concurrent slots
      const p1 = limitedDedup.deduplicate('limit-1', fn1);
      const p2 = limitedDedup.deduplicate('limit-2', fn1);

      // Wait for slots to fill
      await new Promise((r) => setTimeout(r, 10));

      // This should execute without dedup
      const r3 = await limitedDedup.deduplicate('limit-3', fn3);
      expect(r3).toBe('r3');

      await Promise.all([p1, p2]);
      limitedDedup.destroy();
    });
  });

  describe('TTL expiration', () => {
    it('should expire old entries and re-execute', async () => {
      const shortTtlDedup = createRequestDeduplicator({ ttlMs: 50 });
      let callCount = 0;
      const fn = async () => {
        callCount++;
        return `result-${callCount}`;
      };

      const r1 = await shortTtlDedup.deduplicate('ttl-key', fn);
      expect(r1).toBe('result-1');
      expect(callCount).toBe(1);

      // Wait for TTL to expire
      await new Promise((r) => setTimeout(r, 100));

      const r2 = await shortTtlDedup.deduplicate('ttl-key', fn);
      expect(r2).toBe('result-2');
      expect(callCount).toBe(2);

      shortTtlDedup.destroy();
    });
  });

  describe('getActiveKeys', () => {
    it('should return active in-flight requests', async () => {
      const fn = async () => {
        await new Promise((r) => setTimeout(r, 100));
        return 'slow';
      };

      const promise = deduplicator.deduplicate('active-key', fn);
      // Wait a tick for the promise to be in-flight
      await new Promise((r) => setTimeout(r, 5));

      const activeKeys = deduplicator.getActiveKeys();
      expect(activeKeys.length).toBeGreaterThanOrEqual(1);

      const keyEntry = activeKeys.find((k) => k.key !== undefined);
      if (keyEntry) {
        expect(keyEntry.waiters).toBeGreaterThanOrEqual(1);
        expect(keyEntry.age).toBeGreaterThanOrEqual(0);
      }

      await promise;
    });

    it('should return empty array when no active requests', async () => {
      await deduplicator.deduplicate('quick', async () => 'done');
      // Wait for cleanup delay
      await new Promise((r) => setTimeout(r, 150));
      expect(deduplicator.getActiveKeys()).toEqual([]);
    });

    it('should sort keys by waiters descending', async () => {
      const fn1 = async () => {
        await new Promise((r) => setTimeout(r, 200));
        return 'slow1';
      };
      const fn2 = async () => {
        await new Promise((r) => setTimeout(r, 200));
        return 'slow2';
      };

      deduplicator.deduplicate('a', fn1);
      deduplicator.deduplicate('a', fn1);
      deduplicator.deduplicate('a', fn1);
      deduplicator.deduplicate('b', fn2);
      deduplicator.deduplicate('b', fn2);

      await new Promise((r) => setTimeout(r, 10));

      const keys = deduplicator.getActiveKeys();
      // Keys sorted by waiters descending
      if (keys.length >= 2) {
        expect(keys[0].waiters).toBeGreaterThanOrEqual(keys[1].waiters);
      }
    });
  });

  describe('getStats', () => {
    it('should return comprehensive stats', async () => {
      const fn = async () => {
        await new Promise((r) => setTimeout(r, 10));
        return 'value';
      };

      await deduplicator.deduplicate('s1', fn);
      await deduplicator.deduplicate('s2', fn);

      const stats = deduplicator.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.deduplicatedRequests).toBe(0);
      expect(stats.uniqueRequests).toBe(2);
      expect(stats.deduplicationRate).toBe(0);
      expect(typeof stats.activeRequests).toBe('number');
      expect(typeof stats.peakConcurrency).toBe('number');
    });

    it('should calculate deduplication rate', async () => {
      const fn = async () => {
        await new Promise((r) => setTimeout(r, 50));
        return 'value';
      };

      await Promise.all([
        deduplicator.deduplicate('rate-key', fn),
        deduplicator.deduplicate('rate-key', fn),
      ]);

      const stats = deduplicator.getStats();
      expect(stats.totalRequests).toBe(2);
      expect(stats.deduplicationRate).toBeGreaterThan(0);
    });
  });

  describe('resetStats', () => {
    it('should reset counters', async () => {
      await deduplicator.deduplicate('reset-key', async () => 'val');
      deduplicator.resetStats();

      const stats = deduplicator.getStats();
      expect(stats.totalRequests).toBe(0);
      expect(stats.deduplicatedRequests).toBe(0);
      expect(stats.uniqueRequests).toBe(0);
    });

    it('should preserve peak concurrency', async () => {
      const fn = async () => {
        await new Promise((r) => setTimeout(r, 50));
        return 'val';
      };

      await Promise.all([
        deduplicator.deduplicate('peak-1', fn),
        deduplicator.deduplicate('peak-2', fn),
      ]);

      deduplicator.resetStats();
      const stats = deduplicator.getStats();
      expect(stats.peakConcurrency).toBeGreaterThan(0);
    });
  });

  describe('clear', () => {
    it('should clear all in-flight requests', async () => {
      const fn = async () => {
        await new Promise((r) => setTimeout(r, 100));
        return 'cleared';
      };

      deduplicator.deduplicate('clear-key', fn);
      deduplicator.clear();

      expect(deduplicator.getActiveKeys().length).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should clear interval and requests', () => {
      deduplicator.destroy();
      expect(deduplicator.getActiveKeys().length).toBe(0);
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        deduplicator.destroy();
        deduplicator.destroy();
      }).not.toThrow();
    });
  });

  describe('header-based deduplication', () => {
    it('should include headers in key when configured', async () => {
      const headerDedup = createRequestDeduplicator({
        includeHeaders: true,
        headerKeys: ['authorization'],
        ttlMs: 5000,
      });

      let callCount = 0;
      const fn = async () => {
        callCount++;
        return `result-${callCount}`;
      };

      await headerDedup.deduplicate('hdr-key', fn, { headers: { authorization: 'Bearer token1' } });
      await headerDedup.deduplicate('hdr-key', fn, { headers: { authorization: 'Bearer token2' } });
      expect(callCount).toBe(2);

      headerDedup.destroy();
    });

    it('should deduplicate when headers match', async () => {
      const headerDedup = createRequestDeduplicator({
        includeHeaders: true,
        headerKeys: ['content-type'],
        ttlMs: 5000,
      });

      let callCount = 0;
      const fn = async () => {
        callCount++;
        await new Promise((r) => setTimeout(r, 30));
        return 'shared';
      };

      const results = await Promise.all([
        headerDedup.deduplicate('hdr-match', fn, { headers: { 'content-type': 'application/json' } }),
        headerDedup.deduplicate('hdr-match', fn, { headers: { 'content-type': 'application/json' } }),
      ]);

      expect(results).toEqual(['shared', 'shared']);
      expect(callCount).toBe(1);

      headerDedup.destroy();
    });
  });
});
