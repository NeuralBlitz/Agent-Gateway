import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { RateLimitEngine, createRateLimitEngine } from '../src/rate-limit-engine/index.js';

vi.mock('../src/infra/index.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('RateLimitEngine', () => {
  let engine: RateLimitEngine;

  beforeEach(() => {
    engine = createRateLimitEngine(); // No Redis
  });

  afterEach(async () => {
    await engine.close();
  });

  describe('constructor', () => {
    it('should create a RateLimitEngine instance', () => {
      expect(engine).toBeInstanceOf(RateLimitEngine);
    });

    it('should accept a Redis URL', () => {
      const e = createRateLimitEngine('redis://localhost:6379');
      expect(e).toBeInstanceOf(RateLimitEngine);
    });
  });

  describe('registerRule', () => {
    it('should register a rule', () => {
      engine.registerRule({
        name: 'test-rule',
        algorithm: 'sliding-window-log',
        max: 10,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });
      const rules = engine.listRules();
      expect(rules.length).toBe(1);
      expect(rules[0].name).toBe('test-rule');
    });

    it('should register multiple rules', () => {
      engine.registerRule({ name: 'rule1', algorithm: 'sliding-window-log', max: 5, window: 60, keyFn: (ctx) => ctx.ip! });
      engine.registerRule({ name: 'rule2', algorithm: 'token-bucket', max: 10, window: 60, keyFn: (ctx) => ctx.userId! });
      expect(engine.listRules().length).toBe(2);
    });
  });

  describe('unregisterRule', () => {
    it('should remove a registered rule', () => {
      engine.registerRule({ name: 'temp-rule', algorithm: 'sliding-window-log', max: 5, window: 60, keyFn: (ctx) => ctx.ip! });
      const removed = engine.unregisterRule('temp-rule');
      expect(removed).toBe(true);
      expect(engine.listRules().length).toBe(0);
    });

    it('should return false for unknown rule', () => {
      expect(engine.unregisterRule('nonexistent')).toBe(false);
    });
  });

  describe('check — sliding-window-log', () => {
    it('should allow requests within limit', async () => {
      engine.registerRule({
        name: 'api-limit',
        algorithm: 'sliding-window-log',
        max: 5,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      const result = await engine.check({ ip: '1.2.3.4' });
      expect(result.blocked).toBe(false);
      expect(result.results.length).toBe(1);
      expect(result.results[0].allowed).toBe(true);
      expect(result.results[0].remaining).toBe(4);
    });

    it('should block requests exceeding limit', async () => {
      engine.registerRule({
        name: 'strict-limit',
        algorithm: 'sliding-window-log',
        max: 2,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      await engine.check({ ip: '1.2.3.4' });
      await engine.check({ ip: '1.2.3.4' });
      const result = await engine.check({ ip: '1.2.3.4' });

      expect(result.blocked).toBe(true);
      expect(result.results[0].allowed).toBe(false);
      expect(result.results[0].retryAfter).toBeGreaterThan(0);
    });

    it('should track different IPs independently', async () => {
      engine.registerRule({
        name: 'per-ip',
        algorithm: 'sliding-window-log',
        max: 1,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      const r1 = await engine.check({ ip: 'user-a' });
      const r2 = await engine.check({ ip: 'user-b' });

      expect(r1.results[0].allowed).toBe(true);
      expect(r2.results[0].allowed).toBe(true);
    });
  });

  describe('check — token-bucket', () => {
    it('should allow requests within bucket capacity', async () => {
      engine.registerRule({
        name: 'burst-limit',
        algorithm: 'token-bucket',
        max: 10,
        window: 60,
        burst: 10,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      const result = await engine.check({ ip: '1.2.3.4' });
      expect(result.blocked).toBe(false);
      expect(result.results[0].allowed).toBe(true);
    });

    it('should deplete bucket and block', async () => {
      engine.registerRule({
        name: 'small-bucket',
        algorithm: 'token-bucket',
        max: 2,
        window: 60,
        burst: 2,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      await engine.check({ ip: '1.2.3.4' });
      await engine.check({ ip: '1.2.3.4' });
      const result = await engine.check({ ip: '1.2.3.4' });

      expect(result.blocked).toBe(true);
    });
  });

  describe('check — leaky-bucket', () => {
    it('should allow requests within capacity', async () => {
      engine.registerRule({
        name: 'leaky-limit',
        algorithm: 'leaky-bucket',
        max: 5,
        window: 60,
        burst: 5,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      const result = await engine.check({ ip: '1.2.3.4' });
      expect(result.blocked).toBe(false);
      expect(result.results[0].allowed).toBe(true);
    });

    it('should block when bucket is full', async () => {
      engine.registerRule({
        name: 'tiny-leaky',
        algorithm: 'leaky-bucket',
        max: 1,
        window: 60,
        burst: 1,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      await engine.check({ ip: '1.2.3.4' });
      const result = await engine.check({ ip: '1.2.3.4' });
      expect(result.blocked).toBe(true);
    });
  });

  describe('check — fixed-window', () => {
    it('should allow requests within window', async () => {
      engine.registerRule({
        name: 'fixed-limit',
        algorithm: 'fixed-window',
        max: 3,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      const result = await engine.check({ ip: '1.2.3.4' });
      expect(result.blocked).toBe(false);
      expect(result.results[0].allowed).toBe(true);
    });

    it('should block after window limit reached', async () => {
      engine.registerRule({
        name: 'fixed-strict',
        algorithm: 'fixed-window',
        max: 1,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      await engine.check({ ip: '1.2.3.4' });
      const result = await engine.check({ ip: '1.2.3.4' });
      expect(result.blocked).toBe(true);
    });
  });

  describe('check — method filtering', () => {
    it('should only apply rule to specified methods', async () => {
      engine.registerRule({
        name: 'post-limit',
        algorithm: 'sliding-window-log',
        max: 1,
        window: 60,
        methods: ['POST'],
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      const getResult = await engine.check({ ip: '1.2.3.4', method: 'GET' });
      expect(getResult.results.length).toBe(0); // Rule doesn't apply to GET

      const postResult = await engine.check({ ip: '1.2.3.4', method: 'POST' });
      expect(postResult.results.length).toBe(1);
    });
  });

  describe('check — path filtering', () => {
    it('should only apply rule to matching paths', async () => {
      engine.registerRule({
        name: 'api-post-limit',
        algorithm: 'sliding-window-log',
        max: 1,
        window: 60,
        pathPattern: '^/api/.*',
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      const homeResult = await engine.check({ ip: '1.2.3.4', path: '/home' });
      expect(homeResult.results.length).toBe(0);

      const apiResult = await engine.check({ ip: '1.2.3.4', path: '/api/users' });
      expect(apiResult.results.length).toBe(1);
    });
  });

  describe('check — multiple rules', () => {
    it('should check all applicable rules', async () => {
      engine.registerRule({
        name: 'per-ip',
        algorithm: 'sliding-window-log',
        max: 100,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });
      engine.registerRule({
        name: 'per-user',
        algorithm: 'sliding-window-log',
        max: 50,
        window: 60,
        keyFn: (ctx) => ctx.userId || 'unknown',
      });

      const result = await engine.check({ ip: '1.2.3.4', userId: 'user-1' });
      expect(result.results.length).toBe(2);
      expect(result.blocked).toBe(false);
    });

    it('should set mostRestrictive result', async () => {
      engine.registerRule({
        name: 'generous',
        algorithm: 'sliding-window-log',
        max: 100,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });
      engine.registerRule({
        name: 'strict',
        algorithm: 'sliding-window-log',
        max: 1,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      await engine.check({ ip: '1.2.3.4' }); // Use 1 of 1
      const result = await engine.check({ ip: '1.2.3.4' }); // Should be blocked by strict

      expect(result.mostRestrictive).toBeDefined();
      expect(result.mostRestrictive?.remaining).toBe(0);
    });
  });

  describe('reset', () => {
    it('should clear rate limit state for a key', async () => {
      engine.registerRule({
        name: 'resettable',
        algorithm: 'sliding-window-log',
        max: 1,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      await engine.check({ ip: '1.2.3.4' });
      await engine.reset('resettable', '1.2.3.4');

      const result = await engine.check({ ip: '1.2.3.4' });
      expect(result.results[0].allowed).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return initial stats', () => {
      const stats = engine.getStats();
      expect(stats.rules).toBe(0);
      expect(stats.checks).toBe(0);
      expect(stats.denialRate).toBe(0);
    });

    it('should track checks, allowed, and denied', async () => {
      engine.registerRule({
        name: 'stats-rule',
        algorithm: 'sliding-window-log',
        max: 1,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      await engine.check({ ip: '1.2.3.4' }); // allowed
      await engine.check({ ip: '1.2.3.4' }); // denied

      const stats = engine.getStats();
      expect(stats.checks).toBe(2);
      expect(stats.allowed).toBe(1);
      expect(stats.denied).toBe(1);
      expect(stats.denialRate).toBe(0.5);
    });

    it('should count active buckets and windows', async () => {
      engine.registerRule({
        name: 'tb-stats',
        algorithm: 'token-bucket',
        max: 5,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      await engine.check({ ip: '1.2.3.4' });

      const stats = engine.getStats();
      expect(stats.activeBuckets).toBeGreaterThanOrEqual(1);
    });
  });

  describe('listRules', () => {
    it('should return all registered rules', () => {
      engine.registerRule({ name: 'a', algorithm: 'sliding-window-log', max: 10, window: 60, keyFn: () => 'x' });
      engine.registerRule({ name: 'b', algorithm: 'token-bucket', max: 5, window: 30, keyFn: () => 'y' });

      const rules = engine.listRules();
      expect(rules.length).toBe(2);
      expect(rules.map((r) => r.name)).toContain('a');
      expect(rules.map((r) => r.name)).toContain('b');
    });

    it('should return empty array when no rules registered', () => {
      expect(engine.listRules()).toEqual([]);
    });
  });

  describe('emit events', () => {
    it('should emit rate:check event on each check', async () => {
      engine.registerRule({
        name: 'emit-test',
        algorithm: 'sliding-window-log',
        max: 5,
        window: 60,
        keyFn: (ctx) => ctx.ip || 'unknown',
      });

      const handler = vi.fn();
      engine.on('rate:check', handler);

      await engine.check({ ip: '1.2.3.4' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          rule: 'emit-test',
          key: '1.2.3.4',
          allowed: true,
        })
      );
    });
  });
});
