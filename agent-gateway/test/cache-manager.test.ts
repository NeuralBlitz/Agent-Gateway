import { describe, it, expect, beforeEach } from 'vitest';
import { CacheManager, createCacheManager, CacheEntry } from '../src/cache-manager/index.js';

describe('CacheManager', () => {
  let cache: CacheManager;

  beforeEach(() => {
    cache = createCacheManager({ l1MaxEntries: 1000, redisUrl: '' });
  });

  describe('createCacheManager', () => {
    it('should create a CacheManager instance', () => {
      expect(cache).toBeInstanceOf(CacheManager);
    });

    it('should use default config when no options provided', () => {
      const defaultCache = createCacheManager();
      expect(defaultCache).toBeInstanceOf(CacheManager);
    });

    it('should accept custom config', () => {
      const custom = createCacheManager({
        l1MaxEntries: 500,
        defaultTtl: 60,
        stampedeLimit: 5,
        compression: true,
        compressionThreshold: 512,
      });
      expect(custom).toBeInstanceOf(CacheManager);
    });
  });

  describe('set', () => {
    it('should store a value in cache', async () => {
      await cache.set('key1', 'value1');
      const result = await cache.get<string>('key1');
      expect(result).toBe('value1');
    });

    it('should store objects', async () => {
      const obj = { name: 'test', count: 42 };
      await cache.set('obj-key', obj);
      const result = await cache.get<typeof obj>('obj-key');
      expect(result).toEqual(obj);
    });

    it('should store arrays', async () => {
      const arr = [1, 2, 3];
      await cache.set('arr-key', arr);
      const result = await cache.get<number[]>('arr-key');
      expect(result).toEqual(arr);
    });

    it('should use custom TTL', async () => {
      await cache.set('ttl-key', 'value', 1);
      const result = await cache.get<string>('ttl-key');
      expect(result).toBe('value');
    });

    it('should store tags', async () => {
      await cache.set('tagged-key', 'value', 3600, ['users', 'cache']);
      const tagStats = cache.getTagStats();
      expect(tagStats.some((t) => t.tag === 'users')).toBe(true);
      expect(tagStats.some((t) => t.tag === 'cache')).toBe(true);
    });

    it('should emit cache:set event', async () => {
      const setHandler = new Promise<{ key: string; tier: string; tags: string[] }>((resolve) => {
        cache.on('cache:set', resolve);
      });
      await cache.set('event-key', 'event-value', 3600, ['tag1']);
      const event = await setHandler;
      expect(event.key).toBe('event-key');
      expect(event.tier).toBe('L1');
    });
  });

  describe('get', () => {
    it('should return null for non-existent key', async () => {
      const result = await cache.get<string>('non-existent');
      expect(result).toBeNull();
    });

    it('should return cached value', async () => {
      await cache.set('get-key', 'get-value');
      const result = await cache.get<string>('get-key');
      expect(result).toBe('get-value');
    });

    it('should track L1 hits and misses', async () => {
      await cache.set('stat-key', 'value');
      await cache.get('stat-key');
      await cache.get('miss-key');

      const stats = cache.getStats();
      expect(stats.l1Hits).toBe(1);
      expect(stats.l1Misses).toBe(1);
    });

    it('should regenerate value when cache miss and regenerate function provided', async () => {
      const result = await cache.get<string>('regen-key', async () => 'generated');
      expect(result).toBe('generated');
      // Verify it's now cached
      const cached = await cache.get<string>('regen-key');
      expect(cached).toBe('generated');
    });

    it('should use custom TTL for regenerated values', async () => {
      const result = await cache.get<string>('regen-ttl', async () => 'regenerated', 60);
      expect(result).toBe('regenerated');
    });

    it('should use tags with regenerated values', async () => {
      await cache.get<string>('regen-tag', async () => 'value', 3600, ['auto-tag']);
      const tagStats = cache.getTagStats();
      expect(tagStats.some((t) => t.tag === 'auto-tag')).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete a key from cache', async () => {
      await cache.set('del-key', 'value');
      await cache.delete('del-key');
      const result = await cache.get<string>('del-key');
      expect(result).toBeNull();
    });

    it('should delete non-existent key without error', async () => {
      await expect(cache.delete('non-existent')).resolves.not.toThrow();
    });

    it('should emit cache:delete event', async () => {
      const deleteHandler = new Promise<{ key: string }>((resolve) => {
        cache.on('cache:delete', resolve);
      });
      await cache.set('del-event-key', 'value');
      await cache.delete('del-event-key');
      const event = await deleteHandler;
      expect(event.key).toBe('del-event-key');
    });

    it('should update stats on delete', async () => {
      await cache.set('del-stat-key', 'value');
      await cache.delete('del-stat-key');
      const stats = cache.getStats();
      expect(stats.deletes).toBe(1);
    });
  });

  describe('invalidateByTag', () => {
    it('should invalidate all keys with a tag', async () => {
      await cache.set('tag-1', 'v1', 3600, ['shared-tag']);
      await cache.set('tag-2', 'v2', 3600, ['shared-tag']);
      await cache.set('tag-3', 'v3', 3600, ['other-tag']);

      const count = await cache.invalidateByTag('shared-tag');
      expect(count).toBe(2);

      expect(await cache.get<string>('tag-1')).toBeNull();
      expect(await cache.get<string>('tag-2')).toBeNull();
      expect(await cache.get<string>('tag-3')).toBe('v3');
    });

    it('should return 0 for non-existent tag', async () => {
      const count = await cache.invalidateByTag('non-existent');
      expect(count).toBe(0);
    });

    it('should emit cache:invalidated event', async () => {
      const invalidatedHandler = new Promise<{ tag: string; count: number }>((resolve) => {
        cache.on('cache:invalidated', resolve);
      });
      await cache.set('inv-1', 'v', 3600, ['inv-tag']);
      await cache.invalidateByTag('inv-tag');
      const event = await invalidatedHandler;
      expect(event.tag).toBe('inv-tag');
      expect(event.count).toBe(1);
    });
  });

  describe('invalidateByKey', () => {
    it('should invalidate a specific key', async () => {
      await cache.set('inv-key', 'value');
      await cache.invalidateByKey('inv-key');
      expect(await cache.get<string>('inv-key')).toBeNull();
    });

    it('should increment version', async () => {
      await cache.set('ver-key', 'v1');
      await cache.invalidateByKey('ver-key');
      await cache.set('ver-key', 'v2');
      const stats = cache.getStats();
      expect(stats.invalidations).toBeGreaterThanOrEqual(1);
    });
  });

  describe('clear', () => {
    it('should clear all cached entries', async () => {
      await cache.set('clear-1', 'a');
      await cache.set('clear-2', 'b');
      await cache.set('clear-3', 'c', 3600, ['clear-tag']);

      await cache.clear();

      expect(await cache.get<string>('clear-1')).toBeNull();
      expect(await cache.get<string>('clear-2')).toBeNull();
      expect(await cache.get<string>('clear-3')).toBeNull();
    });

    it('should clear tag index', async () => {
      await cache.set('ci-1', 'v', 3600, ['ci-tag']);
      await cache.clear();
      expect(cache.getTagStats()).toEqual([]);
    });

    it('should emit cache:clear event', async () => {
      const clearHandler = new Promise<void>((resolve) => {
        cache.on('cache:clear', () => resolve());
      });
      await cache.set('clr-1', 'v');
      await cache.clear();
      await expect(clearHandler).resolves.not.toThrow();
    });
  });

  describe('getStats', () => {
    it('should return comprehensive stats', async () => {
      await cache.set('stats-1', 'a');
      await cache.set('stats-2', 'b', 3600, ['tag-a']);
      await cache.get('stats-1');
      await cache.get('non-existent');

      const stats = cache.getStats();
      expect(typeof stats.l1Hits).toBe('number');
      expect(typeof stats.l1Misses).toBe('number');
      expect(typeof stats.sets).toBe('number');
      expect(typeof stats.l1Size).toBe('number');
      expect(typeof stats.l1HitRate).toBe('number');
      expect(typeof stats.estimatedMemoryMB).toBe('number');
      expect(stats.sets).toBeGreaterThanOrEqual(2);
    });

    it('should calculate hit rate correctly', async () => {
      await cache.set('hr-1', 'value');
      await cache.get('hr-1');
      await cache.get('hr-miss');

      const stats = cache.getStats();
      expect(stats.l1Hits).toBe(1);
      expect(stats.l1Misses).toBe(1);
      expect(stats.l1HitRate).toBe(0.5);
    });

    it('should return 0 hit rate when no requests', () => {
      const stats = cache.getStats();
      expect(stats.l1HitRate).toBe(0);
    });
  });

  describe('getTagStats', () => {
    it('should return tag statistics', async () => {
      await cache.set('t1', 'a', 3600, ['tag-a']);
      await cache.set('t2', 'b', 3600, ['tag-a']);
      await cache.set('t3', 'c', 3600, ['tag-b']);

      const tagStats = cache.getTagStats();
      expect(tagStats.length).toBe(2);
      expect(tagStats[0].tag).toBe('tag-a');
      expect(tagStats[0].keyCount).toBe(2);
      expect(tagStats[1].tag).toBe('tag-b');
      expect(tagStats[1].keyCount).toBe(1);
    });

    it('should sort by keyCount descending', async () => {
      await cache.set('s1', 'a', 3600, ['small']);
      await cache.set('s2', 'b', 3600, ['big']);
      await cache.set('s3', 'c', 3600, ['big']);
      await cache.set('s4', 'd', 3600, ['big']);

      const tagStats = cache.getTagStats();
      expect(tagStats[0].tag).toBe('big');
      expect(tagStats[tagStats.length - 1].tag).toBe('small');
    });

    it('should return empty array when no tags', () => {
      expect(cache.getTagStats()).toEqual([]);
    });
  });

  describe('resetStats', () => {
    it('should reset all counters to zero', async () => {
      await cache.set('reset-1', 'value');
      await cache.get('reset-1');
      await cache.get('reset-miss');

      cache.resetStats();
      const stats = cache.getStats();
      expect(stats.l1Hits).toBe(0);
      expect(stats.l1Misses).toBe(0);
      expect(stats.sets).toBe(0);
      expect(stats.deletes).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entries when full', async () => {
      const smallCache = createCacheManager({ l1MaxEntries: 3 });
      await smallCache.set('evict-1', 'a');
      await smallCache.set('evict-2', 'b');
      await smallCache.set('evict-3', 'c');
      // Access evict-1 to make it recently used
      await smallCache.get('evict-1');
      // Add new entry, should evict evict-2
      await smallCache.set('evict-4', 'd');

      expect(await smallCache.get<string>('evict-1')).toBe('a');
      expect(await smallCache.get<string>('evict-2')).toBeNull();
      expect(await smallCache.get<string>('evict-3')).toBe('c');
      expect(await smallCache.get<string>('evict-4')).toBe('d');
    });

    it('should emit eviction event', async () => {
      const evictCache = createCacheManager({ l1MaxEntries: 2 });
      const evictionHandler = new Promise<{ key: string; tier: string }>((resolve) => {
        evictCache.on('cache:eviction', resolve);
      });
      await evictCache.set('ev1', 'a');
      await evictCache.set('ev2', 'b');
      await evictCache.set('ev3', 'c');
      const event = await evictionHandler;
      expect(event.tier).toBe('L1');
    });
  });

  describe('stampede protection', () => {
    it('should prevent concurrent regenerations for same key', async () => {
      let regenCount = 0;
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          cache.get<string>('stampede-key', async () => {
            regenCount++;
            await new Promise((r) => setTimeout(r, 10));
            return 'regenerated';
          }),
        );
      }
      const results = await Promise.all(promises);
      // Only one regeneration should occur
      expect(regenCount).toBe(1);
      expect(results.every((r) => r === 'regenerated')).toBe(true);
    });
  });

  describe('expiration', () => {
    it('should return null for expired entries', async () => {
      await cache.set('expire-key', 'value', 0);
      const result = await cache.get<string>('expire-key');
      expect(result).toBeNull();
    });
  });

  describe('close', () => {
    it('should close without error when no redis', async () => {
      await expect(cache.close()).resolves.not.toThrow();
    });
  });

  describe('estimate size', () => {
    it('should track memory for string values', async () => {
      await cache.set('size-str', 'hello world');
      const stats = cache.getStats();
      expect(stats.estimatedMemoryBytes).toBeGreaterThan(0);
    });

    it('should handle numeric values', async () => {
      await cache.set('size-num', 42);
      const stats = cache.getStats();
      expect(stats.estimatedMemoryBytes).toBeGreaterThan(0);
    });

    it('should handle object values', async () => {
      await cache.set('size-obj', { a: 1, b: 'hello' });
      const stats = cache.getStats();
      expect(stats.estimatedMemoryBytes).toBeGreaterThan(0);
    });
  });
});
