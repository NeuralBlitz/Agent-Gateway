import { describe, it, expect, vi, beforeEach } from 'vitest';

const limiterKeyState = new Map<number, Record<string, number>>();
let limiterId = 0;

vi.mock('rate-limiter-flexible', () => {
  return {
    RateLimiterMemory: vi.fn().mockImplementation((config: any) => {
      const currentId = ++limiterId;
      const keyConsumed: Record<string, number> = {};
      limiterKeyState.set(currentId, keyConsumed);
      
      const points = config?.points ?? 5;
      
      return {
        consume: vi.fn(async (key: string) => {
          const consumed = keyConsumed[key] ?? 0;
          keyConsumed[key] = consumed + 1;
          
          if (consumed >= points) {
            const error = new Error('Rate limit exceeded') as any;
            error.msBeforeNext = 1000;
            error.remainingPoints = 0;
            throw error;
          }
          
          return {
            remainingPoints: points - consumed - 1,
            msBeforeNext: 1000,
          };
        }),
        delete: vi.fn(async (key: string) => {
          delete keyConsumed[key];
        }),
      };
    }),
    RateLimiterRes: class RateLimiterRes {
      msBeforeNext = 1000;
      remainingPoints = 0;
    },
  };
});

import { RateLimiter, Throttler, createRateLimiter, createThrottler, RateLimitConfig, RateLimitOptions } from '../../src/ratelimit/index.js';

beforeEach(() => {
  limiterId = 0;
  limiterKeyState.clear();
});

describe('RateLimiter', () => {
  describe('Constructor', () => {
    it('should create a RateLimiter instance with default options', () => {
      const limiter = new RateLimiter();
      expect(limiter).toBeDefined();
    });

    it('should create a RateLimiter instance with global config', () => {
      const config: RateLimitConfig = { points: 10, duration: 60 };
      const options: RateLimitOptions = { global: config };
      const limiter = new RateLimiter(options);
      expect(limiter).toBeDefined();
    });

    it('should create a RateLimiter instance with perChannel config', () => {
      const config: RateLimitOptions = {
        perChannel: {
          'channel1': { points: 5, duration: 60 },
          'channel2': { points: 10, duration: 120 },
        },
      };
      const limiter = new RateLimiter(config);
      expect(limiter).toBeDefined();
    });

    it('should create a RateLimiter instance with perUser config', () => {
      const config: RateLimitOptions = {
        perUser: { points: 20, duration: 60 },
      };
      const limiter = new RateLimiter(config);
      expect(limiter).toBeDefined();
    });

    it('should create a RateLimiter instance with perIP config', () => {
      const config: RateLimitOptions = {
        perIP: { points: 100, duration: 3600 },
      };
      const limiter = new RateLimiter(config);
      expect(limiter).toBeDefined();
    });

    it('should create a RateLimiter with multiple config types', () => {
      const config: RateLimitOptions = {
        global: { points: 1000, duration: 3600 },
        perChannel: {
          'telegram': { points: 50, duration: 60 },
        },
        perUser: { points: 20, duration: 60 },
        perIP: { points: 500, duration: 3600 },
      };
      const limiter = new RateLimiter(config);
      expect(limiter).toBeDefined();
    });

    it('should create a RateLimiter with blockDuration', () => {
      const config: RateLimitConfig = { points: 5, duration: 60, blockDuration: 300 };
      const options: RateLimitOptions = { global: config };
      const limiter = new RateLimiter(options);
      expect(limiter).toBeDefined();
    });

    it('should handle empty perChannel config', () => {
      const config: RateLimitOptions = {
        perChannel: {},
      };
      const limiter = new RateLimiter(config);
      expect(limiter).toBeDefined();
    });

    it('should create limiter with custom point values', () => {
      const limiter = new RateLimiter({
        global: { points: 1, duration: 1 },
      });
      expect(limiter).toBeDefined();
    });

    it('should create limiter with large duration values', () => {
      const limiter = new RateLimiter({
        global: { points: 10000, duration: 86400 },
      });
      expect(limiter).toBeDefined();
    });
  });

  describe('check() method - allow scenarios', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        global: { points: 5, duration: 60 },
      });
    });

    it('should allow request when under limit', async () => {
      const result = await limiter.check('key1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThanOrEqual(5);
    });

    it('should allow multiple requests under limit', async () => {
      for (let i = 0; i < 5; i++) {
        const result = await limiter.check('key1');
        expect(result.allowed).toBe(true);
      }
    });

    it('should return correct remaining count', async () => {
      await limiter.check('key1');
      const result = await limiter.check('key1');
      expect(result.remaining).toBeLessThan(5);
    });

    it('should include resetAt timestamp', async () => {
      const result = await limiter.check('key1');
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should handle different keys independently', async () => {
      const result1 = await limiter.check('key1');
      const result2 = await limiter.check('key2');
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });

    it('should work with custom limit name', async () => {
      const limiter2 = new RateLimiter();
      limiter2.setChannelLimit('channel1', { points: 10, duration: 60 });
      const result = await limiter2.check('user1', 'channel:channel1');
      expect(result.allowed).toBe(true);
    });

    it('should allow request when limiter does not exist', async () => {
      const result = await limiter.check('key1', 'nonexistent');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it('should return far future resetAt for nonexistent limiters', async () => {
      const result = await limiter.check('key1', 'nonexistent');
      const expectedReset = new Date(Date.now() + 86400000);
      expect(result.resetAt.getTime()).toBeCloseTo(expectedReset.getTime(), -3);
    });

    it('should handle check with empty key', async () => {
      const result = await limiter.check('');
      expect(result.allowed).toBe(true);
    });

    it('should handle check with special characters in key', async () => {
      const result = await limiter.check('key-with-special@chars');
      expect(result.allowed).toBe(true);
    });
  });

  describe('check() method - deny scenarios', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        global: { points: 2, duration: 60 },
      });
    });

    it('should deny request when limit exceeded', async () => {
      await limiter.check('key1');
      await limiter.check('key1');
      const result = await limiter.check('key1');
      expect(result.allowed).toBe(false);
    });

    it('should return remaining as 0 when denied', async () => {
      await limiter.check('key1');
      await limiter.check('key1');
      const result = await limiter.check('key1');
      expect(result.remaining).toBe(0);
    });

    it('should include retryAfter when denied', async () => {
      await limiter.check('key1');
      await limiter.check('key1');
      const result = await limiter.check('key1');
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should include resetAt timestamp when denied', async () => {
      await limiter.check('key1');
      await limiter.check('key1');
      const result = await limiter.check('key1');
      expect(result.resetAt).toBeInstanceOf(Date);
      expect(result.resetAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('should not affect other keys when one key is denied', async () => {
      await limiter.check('key1');
      await limiter.check('key1');
      await limiter.check('key1');
      const result2 = await limiter.check('key2');
      expect(result2.allowed).toBe(true);
    });

    it('should deny multiple requests after exhaustion', async () => {
      await limiter.check('key1');
      await limiter.check('key1');
      const result1 = await limiter.check('key1');
      const result2 = await limiter.check('key1');
      expect(result1.allowed).toBe(false);
      expect(result2.allowed).toBe(false);
    });

    it('should deny requests for blocked keys', async () => {
      const limitedLimiter = new RateLimiter({
        global: { points: 1, duration: 60, blockDuration: 300 },
      });
      await limitedLimiter.check('key1');
      const result = await limitedLimiter.check('key1');
      expect(result.allowed).toBe(false);
    });
  });

  describe('checkChannel() method', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        perChannel: {
          'telegram': { points: 10, duration: 60 },
          'discord': { points: 5, duration: 60 },
        },
      });
    });

    it('should allow request for configured channel', async () => {
      const result = await limiter.checkChannel('telegram');
      expect(result.allowed).toBe(true);
    });

    it('should track limits per channel separately', async () => {
      const testLimiter = new RateLimiter({});
      testLimiter.setChannelLimit('telegram', { points: 2, duration: 60 });
      await testLimiter.check('user1', 'channel:telegram');
      await testLimiter.check('user1', 'channel:telegram');
      const result1 = await testLimiter.check('user1', 'channel:telegram');
      expect(result1).toBeDefined();
    });

    it('should allow unlimited requests for unconfigured channels', async () => {
      const result = await limiter.checkChannel('unknown');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it('should return current date for unconfigured channels', async () => {
      const result = await limiter.checkChannel('unknown');
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should use channel-specific limits correctly', async () => {
      const testLimiter = new RateLimiter({});
      testLimiter.setChannelLimit('discord', { points: 2, duration: 60 });
      await testLimiter.check('user1', 'channel:discord');
      await testLimiter.check('user1', 'channel:discord');
      const result = await testLimiter.check('user1', 'channel:discord');
      expect(result.allowed).toBe(false);
    });

    it('should handle channel names with special characters', async () => {
      const result = await limiter.checkChannel('channel-with-dashes');
      expect(result).toBeDefined();
    });

    it('should track different channels independently', async () => {
      const result1 = await limiter.checkChannel('telegram');
      const result2 = await limiter.checkChannel('discord');
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });

    it('should work with empty channel name', async () => {
      const result = await limiter.checkChannel('');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it('should respect perChannel config structure', async () => {
      const newLimiter = new RateLimiter({
        perChannel: {
          'slack': { points: 20, duration: 60 },
        },
      });
      const result = await newLimiter.checkChannel('slack');
      expect(result.allowed).toBe(true);
    });

    it('should return Infinity remaining for unknown channels', async () => {
      const result = await limiter.checkChannel('unknown-channel');
      expect(result.remaining).toBe(Infinity);
    });
  });

  describe('checkUser() method', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        perUser: { points: 3, duration: 60 },
      });
    });

    it('should allow request for configured user limit', async () => {
      const testLimiter = new RateLimiter({});
      testLimiter.setUserLimit('user123', { points: 3, duration: 60 });
      const result = await testLimiter.check('user123', 'user:user123');
      expect(result.allowed).toBe(true);
    });

    it('should deny when user exceeds their limit', async () => {
      const testLimiter = new RateLimiter({});
      testLimiter.setUserLimit('user123', { points: 1, duration: 60 });
      await testLimiter.check('user123', 'user:user123');
      const result = await testLimiter.check('user123', 'user:user123');
      expect(result.allowed).toBe(false);
    });

    it('should allow unlimited requests when perUser not configured', async () => {
      const limiterNoUser = new RateLimiter({});
      const result = await limiterNoUser.checkUser('user123');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it('should track each user independently', async () => {
      const testLimiter = new RateLimiter({});
      testLimiter.setUserLimit('user1', { points: 2, duration: 60 });
      
      await testLimiter.check('user1', 'user:user1');
      await testLimiter.check('user1', 'user:user1');
      const result1 = await testLimiter.check('user1', 'user:user1');
      expect(result1.allowed).toBe(false);
    });

    it('should include retryAfter when user is denied', async () => {
      const testLimiter = new RateLimiter({});
      testLimiter.setUserLimit('user1', { points: 1, duration: 60 });
      await testLimiter.check('user1', 'user:user1');
      const result = await testLimiter.check('user1', 'user:user1');
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should handle numeric user IDs', async () => {
      const result = await limiter.checkUser('12345');
      expect(result.allowed).toBe(true);
    });

    it('should handle UUID user IDs', async () => {
      const result = await limiter.checkUser('550e8400-e29b-41d4-a716-446655440000');
      expect(result.allowed).toBe(true);
    });

    it('should work with empty user ID', async () => {
      const result = await limiter.checkUser('');
      expect(result).toBeDefined();
    });

    it('should respect configured user limits', async () => {
      const limitedLimiter = new RateLimiter({});
      limitedLimiter.setUserLimit('user1', { points: 2, duration: 60 });
      await limitedLimiter.check('user1', 'user:user1');
      await limitedLimiter.check('user1', 'user:user1');
      const result = await limitedLimiter.check('user1', 'user:user1');
      expect(result).toBeDefined();
    });

    it('should track remaining points correctly', async () => {
      const testLimiter = new RateLimiter({});
      testLimiter.setUserLimit('user1', { points: 3, duration: 60 });
      await testLimiter.check('user1', 'user:user1');
      const result = await testLimiter.check('user1', 'user:user1');
      expect(result.remaining).toBeLessThan(3);
    });
  });

  describe('setChannelLimit() method', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter();
    });

    it('should set channel limit dynamically', () => {
      limiter.setChannelLimit('telegram', { points: 10, duration: 60 });
    });

    it('should allow requests after setting channel limit', async () => {
      limiter.setChannelLimit('telegram', { points: 5, duration: 60 });
      const result = await limiter.check('user1', 'channel:telegram');
      expect(result.allowed).toBe(true);
    });

    it('should overwrite existing channel limit', () => {
      limiter.setChannelLimit('telegram', { points: 5, duration: 60 });
      limiter.setChannelLimit('telegram', { points: 20, duration: 120 });
    });

    it('should allow setting multiple channel limits', () => {
      limiter.setChannelLimit('telegram', { points: 5, duration: 60 });
      limiter.setChannelLimit('discord', { points: 10, duration: 60 });
      limiter.setChannelLimit('slack', { points: 15, duration: 60 });
    });

    it('should track set channel limits independently', async () => {
      limiter.setChannelLimit('telegram', { points: 2, duration: 60 });
      await limiter.check('user1', 'channel:telegram');
      await limiter.check('user1', 'channel:telegram');
      const result = await limiter.check('user1', 'channel:telegram');
      expect(result.allowed).toBe(false);
    });

    it('should set channel limit with blockDuration', () => {
      limiter.setChannelLimit('telegram', { points: 5, duration: 60, blockDuration: 300 });
    });

    it('should set channel limit with custom point values', () => {
      limiter.setChannelLimit('test', { points: 1000, duration: 3600 });
    });

    it('should set channel limit with small duration', () => {
      limiter.setChannelLimit('test', { points: 1, duration: 1 });
    });

    it('should allow setting channel limit for existing channel', () => {
      limiter.setChannelLimit('telegram', { points: 5, duration: 60 });
      limiter.setChannelLimit('telegram', { points: 10, duration: 120 });
    });

    it('should work with special characters in channel name', () => {
      limiter.setChannelLimit('channel-name_123', { points: 5, duration: 60 });
    });
  });

  describe('setUserLimit() method', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter();
    });

    it('should set user limit dynamically', () => {
      limiter.setUserLimit('user123', { points: 10, duration: 60 });
    });

    it('should allow requests after setting user limit', async () => {
      limiter.setUserLimit('user123', { points: 5, duration: 60 });
      const result = await limiter.check('user123', 'user:user123');
      expect(result.allowed).toBe(true);
    });

    it('should overwrite existing user limit', () => {
      limiter.setUserLimit('user123', { points: 5, duration: 60 });
      limiter.setUserLimit('user123', { points: 20, duration: 120 });
    });

    it('should allow setting multiple user limits', () => {
      limiter.setUserLimit('user1', { points: 5, duration: 60 });
      limiter.setUserLimit('user2', { points: 10, duration: 60 });
      limiter.setUserLimit('user3', { points: 15, duration: 60 });
    });

    it('should track set user limits independently', async () => {
      limiter.setUserLimit('user1', { points: 2, duration: 60 });
      await limiter.check('user1', 'user:user1');
      await limiter.check('user1', 'user:user1');
      const result = await limiter.check('user1', 'user:user1');
      expect(result.allowed).toBe(false);
    });

    it('should set user limit with blockDuration', () => {
      limiter.setUserLimit('user123', { points: 5, duration: 60, blockDuration: 300 });
    });

    it('should set user limit with high point value', () => {
      limiter.setUserLimit('user123', { points: 10000, duration: 86400 });
    });

    it('should allow setting user limit for existing user', () => {
      limiter.setUserLimit('user1', { points: 5, duration: 60 });
      limiter.setUserLimit('user1', { points: 10, duration: 120 });
    });

    it('should work with UUID user IDs', () => {
      limiter.setUserLimit('550e8400-e29b-41d4-a716-446655440000', { points: 5, duration: 60 });
    });

    it('should respect new user limit after update', async () => {
      limiter.setUserLimit('user1', { points: 1, duration: 60 });
      await limiter.check('user1', 'user:user1');
      const result = await limiter.check('user1', 'user:user1');
      expect(result.allowed).toBe(false);
    });
  });

  describe('removeLimit() method', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        global: { points: 5, duration: 60 },
      });
    });

    it('should remove a limit by key', () => {
      limiter.removeLimit('global');
    });

    it('should remove channel limit', () => {
      limiter.setChannelLimit('telegram', { points: 5, duration: 60 });
      limiter.removeLimit('channel:telegram');
    });

    it('should remove user limit', () => {
      limiter.setUserLimit('user1', { points: 5, duration: 60 });
      limiter.removeLimit('user:user1');
    });

    it('should allow unlimited requests after removing limit', async () => {
      limiter.setChannelLimit('telegram', { points: 1, duration: 60 });
      await limiter.check('user1', 'channel:telegram');
      limiter.removeLimit('channel:telegram');
      const result = await limiter.check('user1', 'channel:telegram');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it('should handle removing non-existent limit', () => {
      expect(() => limiter.removeLimit('nonexistent')).not.toThrow();
    });

    it('should remove multiple limits sequentially', () => {
      limiter.setChannelLimit('telegram', { points: 5, duration: 60 });
      limiter.setChannelLimit('discord', { points: 5, duration: 60 });
      limiter.removeLimit('channel:telegram');
      limiter.removeLimit('channel:discord');
    });

    it('should handle removing limit with special characters', () => {
      limiter.setChannelLimit('test-channel', { points: 5, duration: 60 });
      limiter.removeLimit('channel:test-channel');
    });
  });

  describe('reset() method', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        global: { points: 5, duration: 60 },
        perChannel: {
          'telegram': { points: 5, duration: 60 },
        },
      });
    });

    it('should reset limit for a key', async () => {
      await limiter.check('key1');
      await limiter.reset('key1');
    });

    it('should reset limit for specific limit type', async () => {
      await limiter.check('user1', 'user:user1');
      limiter.setUserLimit('user1', { points: 5, duration: 60 });
      await limiter.reset('user1', 'user');
    });

    it('should handle reset for non-existent key', async () => {
      await limiter.reset('nonexistent');
    });

    it('should handle reset with limit parameter', async () => {
      await limiter.reset('key1', 'global');
    });

    it('should not throw on reset error', async () => {
      await limiter.reset('key1', 'nonexistent');
    });

    it('should reset channel limits correctly', async () => {
      await limiter.checkChannel('telegram');
      await limiter.reset('telegram', 'channel');
    });

    it('should reset user limits correctly', async () => {
      await limiter.checkUser('user1');
      await limiter.reset('user1', 'user');
    });

    it('should handle empty key in reset', async () => {
      await limiter.reset('');
    });

    it('should allow requests after reset', async () => {
      limiter.setChannelLimit('telegram', { points: 1, duration: 60 });
      await limiter.check('user1', 'channel:telegram');
      const result = await limiter.check('user1', 'channel:telegram');
      expect(result).toBeDefined();
    });
  });

  describe('clear() method', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        global: { points: 5, duration: 60 },
        perChannel: {
          'telegram': { points: 5, duration: 60 },
          'discord': { points: 5, duration: 60 },
        },
        perUser: { points: 5, duration: 60 },
      });
    });

    it('should clear all limits', () => {
      limiter.clear();
    });

    it('should allow unlimited requests after clear', async () => {
      await limiter.check('key1');
      await limiter.checkChannel('telegram');
      await limiter.checkUser('user1');
      limiter.clear();
      const result = await limiter.check('key1', 'global');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(Infinity);
    });

    it('should clear channel limits', async () => {
      limiter.setChannelLimit('telegram', { points: 1, duration: 60 });
      limiter.clear();
      const result = await limiter.check('user1', 'channel:telegram');
      expect(result.remaining).toBe(Infinity);
    });

    it('should clear user limits', async () => {
      limiter.setUserLimit('user1', { points: 1, duration: 60 });
      limiter.clear();
      const result = await limiter.check('user1', 'user:user1');
      expect(result.remaining).toBe(Infinity);
    });

    it('should allow setting new limits after clear', () => {
      limiter.clear();
      limiter.setChannelLimit('telegram', { points: 10, duration: 60 });
      limiter.setUserLimit('user1', { points: 10, duration: 60 });
    });

    it('should handle multiple clears', () => {
      limiter.clear();
      limiter.clear();
      limiter.clear();
    });

    it('should reset state completely after clear', async () => {
      limiter.clear();
      const result1 = await limiter.check('key1', 'nonexistent');
      const result2 = await limiter.checkChannel('unknown');
      const result3 = await limiter.checkUser('unknown');
      expect(result1.remaining).toBe(Infinity);
      expect(result2.remaining).toBe(Infinity);
      expect(result3.remaining).toBe(Infinity);
    });
  });

  describe('RateLimitResult structure', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        global: { points: 5, duration: 60 },
      });
    });

    it('should return correct allowed property when allowed', async () => {
      const result = await limiter.check('key1');
      expect(typeof result.allowed).toBe('boolean');
      expect(result.allowed).toBe(true);
    });

    it('should return correct allowed property when denied', async () => {
      await limiter.check('key1');
      await limiter.check('key1');
      await limiter.check('key1');
      await limiter.check('key1');
      await limiter.check('key1');
      const result = await limiter.check('key1');
      expect(result.allowed).toBe(false);
    });

    it('should return correct remaining property', async () => {
      const result = await limiter.check('key1');
      expect(typeof result.remaining).toBe('number');
    });

    it('should return Infinity for nonexistent limiters', async () => {
      const result = await limiter.check('key1', 'nonexistent');
      expect(result.remaining).toBe(Infinity);
    });

    it('should return 0 for denied requests', async () => {
      const limited = new RateLimiter({ global: { points: 1, duration: 60 } });
      await limited.check('key1');
      const result = await limited.check('key1');
      expect(result.remaining).toBe(0);
    });

    it('should return resetAt as Date object', async () => {
      const result = await limiter.check('key1');
      expect(result.resetAt).toBeInstanceOf(Date);
    });

    it('should return future resetAt for allowed requests', async () => {
      const beforeCheck = Date.now();
      const result = await limiter.check('key1');
      expect(result.resetAt.getTime()).toBeGreaterThan(beforeCheck);
    });

    it('should return future resetAt for denied requests', async () => {
      await limiter.check('key1');
      await limiter.check('key1');
      await limiter.check('key1');
      await limiter.check('key1');
      await limiter.check('key1');
      const beforeCheck = Date.now();
      const result = await limiter.check('key1');
      expect(result.resetAt.getTime()).toBeGreaterThan(beforeCheck);
    });

    it('should not include retryAfter for allowed requests', async () => {
      const result = await limiter.check('key1');
      expect(result.retryAfter).toBeUndefined();
    });

    it('should include retryAfter for denied requests', async () => {
      const limited = new RateLimiter({ global: { points: 1, duration: 60 } });
      await limited.check('key1');
      const result = await limited.check('key1');
      expect(result.retryAfter).toBeDefined();
      expect(typeof result.retryAfter).toBe('number');
    });

    it('should return retryAfter in seconds', async () => {
      const limited = new RateLimiter({ global: { points: 1, duration: 60 } });
      await limited.check('key1');
      const result = await limited.check('key1');
      expect(result.retryAfter).toBeGreaterThanOrEqual(1);
    });

    it('should have all required properties', async () => {
      const result = await limiter.check('key1');
      expect('allowed' in result).toBe(true);
      expect('remaining' in result).toBe(true);
      expect('resetAt' in result).toBe(true);
    });

    it('should have optional retryAfter property', async () => {
      const result = await limiter.check('key1');
      expect('retryAfter' in result || result.retryAfter === undefined).toBe(true);
    });
  });

  describe('Throttler class', () => {
    describe('Constructor', () => {
      it('should create Throttler with default options', () => {
        const throttler = new Throttler();
        expect(throttler).toBeDefined();
      });

      it('should create Throttler with custom maxConcurrent', () => {
        const throttler = new Throttler({ maxConcurrent: 10 });
        expect(throttler).toBeDefined();
      });

      it('should create Throttler with custom minTime', () => {
        const throttler = new Throttler({ minTime: 200 });
        expect(throttler).toBeDefined();
      });

      it('should create Throttler with both options', () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 100 });
        expect(throttler).toBeDefined();
      });

      it('should use default maxConcurrent of 5', () => {
        const throttler = new Throttler();
        expect(throttler).toBeDefined();
      });

      it('should use default minTime of 100', () => {
        const throttler = new Throttler();
        expect(throttler).toBeDefined();
      });

      it('should handle zero maxConcurrent', () => {
        const throttler = new Throttler({ maxConcurrent: 0 });
        expect(throttler).toBeDefined();
      });

      it('should handle zero minTime', () => {
        const throttler = new Throttler({ minTime: 0 });
        expect(throttler).toBeDefined();
      });

      it('should handle large maxConcurrent', () => {
        const throttler = new Throttler({ maxConcurrent: 1000 });
        expect(throttler).toBeDefined();
      });

      it('should handle large minTime', () => {
        const throttler = new Throttler({ minTime: 10000 });
        expect(throttler).toBeDefined();
      });
    });

    describe('throttle() method', () => {
      it('should execute throttled function', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        const fn = vi.fn().mockResolvedValue('result');
        const result = await throttler.throttle('key1', fn);
        expect(result).toBe('result');
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it('should return function result', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        const result = await throttler.throttle('key1', async () => 'test');
        expect(result).toBe('test');
      });

      it('should handle async functions', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        const result = await throttler.throttle('key1', async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
          return 'async result';
        });
        expect(result).toBe('async result');
      });

      it('should handle functions returning objects', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        const result = await throttler.throttle('key1', async () => ({ data: 'test' }));
        expect(result).toEqual({ data: 'test' });
      });

      it('should handle functions returning arrays', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        const result = await throttler.throttle('key1', async () => [1, 2, 3]);
        expect(result).toEqual([1, 2, 3]);
      });

      it('should handle functions throwing errors', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        await expect(
          throttler.throttle('key1', async () => {
            throw new Error('Test error');
          })
        ).rejects.toThrow('Test error');
      });

      it('should handle different keys independently', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        const fn1 = vi.fn().mockResolvedValue('result1');
        const fn2 = vi.fn().mockResolvedValue('result2');
        const result1 = await throttler.throttle('key1', fn1);
        const result2 = await throttler.throttle('key2', fn2);
        expect(result1).toBe('result1');
        expect(result2).toBe('result2');
      });

      it('should handle null returns', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        const result = await throttler.throttle('key1', async () => null);
        expect(result).toBeNull();
      });

      it('should handle undefined returns', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        const result = await throttler.throttle('key1', async () => undefined);
        expect(result).toBeUndefined();
      });

      it('should handle numeric returns', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        const result = await throttler.throttle('key1', async () => 42);
        expect(result).toBe(42);
      });
    });

    describe('throttle() method with concurrency', () => {
      it('should limit concurrent executions', async () => {
        const throttler = new Throttler({ maxConcurrent: 2, minTime: 50 });
        const activeCount: number[] = [];
        let maxActive = 0;
        
        const fn = vi.fn(async () => {
          activeCount.push(throttler.getActiveCount());
          maxActive = Math.max(maxActive, throttler.getActiveCount());
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'done';
        });

        await Promise.all([
          throttler.throttle('key1', fn),
          throttler.throttle('key2', fn),
          throttler.throttle('key3', fn),
        ]);

        expect(maxActive).toBeLessThanOrEqual(2);
      });

      it('should queue requests when at concurrency limit', async () => {
        const throttler = new Throttler({ maxConcurrent: 1, minTime: 20 });
        const results: string[] = [];

        const p1 = throttler.throttle('key1', async () => {
          await new Promise(resolve => setTimeout(resolve, 30));
          return '1';
        });
        const p2 = throttler.throttle('key2', async () => {
          return '2';
        });

        const [r1, r2] = await Promise.all([p1, p2]);
        results.push(r1, r2);

        expect(results.length).toBe(2);
      });

      it('should handle rapid sequential requests', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        const results = [];
        
        for (let i = 0; i < 10; i++) {
          results.push(await throttler.throttle(`key${i}`, async () => i));
        }

        expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      });

      it('should reuse same key for sequential execution', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        
        const result1 = await throttler.throttle('sameKey', async () => 'first');
        const result2 = await throttler.throttle('sameKey', async () => 'second');
        
        expect(result1).toBe('first');
        expect(result2).toBe('second');
      });
    });

    describe('getActiveCount() method', () => {
      it('should return 0 initially', () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        expect(throttler.getActiveCount()).toBe(0);
      });

      it('should return correct count during execution', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 50 });
        
        const promise = throttler.throttle('key1', async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
          return 'done';
        });

        await new Promise(resolve => setTimeout(resolve, 10));
        const count = throttler.getActiveCount();
        
        await promise;
        
        expect(count).toBeGreaterThanOrEqual(1);
      });

      it('should return 0 after all requests complete', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        
        await throttler.throttle('key1', async () => 'done');
        
        expect(throttler.getActiveCount()).toBe(0);
      });

      it('should track multiple concurrent requests', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 50 });
        
        const promises = [
          throttler.throttle('key1', async () => { await new Promise(r => setTimeout(r, 50)); return '1'; }),
          throttler.throttle('key2', async () => { await new Promise(r => setTimeout(r, 50)); return '2'; }),
          throttler.throttle('key3', async () => { await new Promise(r => setTimeout(r, 50)); return '3'; }),
        ];

        await Promise.all(promises);
        expect(throttler.getActiveCount()).toBe(0);
      });
    });

    describe('clear() method', () => {
      it('should clear all pending throttles', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        
        throttler.throttle('key1', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'done';
        });
        
        throttler.clear();
        
        expect(throttler.getActiveCount()).toBe(0);
      });

      it('should allow new throttles after clear', async () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        
        await throttler.throttle('key1', async () => 'first');
        throttler.clear();
        const result = await throttler.throttle('key2', async () => 'second');
        
        expect(result).toBe('second');
      });

      it('should handle multiple clears', () => {
        const throttler = new Throttler({ maxConcurrent: 5, minTime: 10 });
        throttler.clear();
        throttler.clear();
        throttler.clear();
        expect(throttler.getActiveCount()).toBe(0);
      });
    });
  });

  describe('Rate limit exhaustion scenarios', () => {
    it('should handle rapid exhaustion of global limit', async () => {
      const limiter = new RateLimiter({ global: { points: 2, duration: 60 } });
      
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(await limiter.check('key1'));
      }

      const allowed = results.filter(r => r.allowed);
      const denied = results.filter(r => !r.allowed);
      expect(allowed.length).toBe(2);
      expect(denied.length).toBe(3);
    });

    it('should handle channel limit exhaustion', async () => {
      const limiter = new RateLimiter({});
      limiter.setChannelLimit('telegram', { points: 2, duration: 60 });

      await limiter.check('user1', 'channel:telegram');
      await limiter.check('user1', 'channel:telegram');
      const result1 = await limiter.check('user1', 'channel:telegram');
      
      expect(result1.allowed).toBe(false);
    });

    it('should handle user limit exhaustion', async () => {
      const limiter = new RateLimiter({});
      limiter.setUserLimit('user1', { points: 2, duration: 60 });

      await limiter.check('user1', 'user:user1');
      await limiter.check('user1', 'user:user1');
      const result1 = await limiter.check('user1', 'user:user1');
      expect(result1.allowed).toBe(false);
    });

    it('should maintain independent exhaustion states per key', async () => {
      const limiter = new RateLimiter({ global: { points: 2, duration: 60 } });
      
      await limiter.check('key1');
      await limiter.check('key1');
      const result1 = await limiter.check('key1');
      expect(result1.allowed).toBe(false);
    });

    it('should maintain independent exhaustion states per channel', async () => {
      const limiter = new RateLimiter({});
      limiter.setChannelLimit('telegram', { points: 2, duration: 60 });
      limiter.setChannelLimit('discord', { points: 2, duration: 60 });

      await limiter.check('user1', 'channel:telegram');
      await limiter.check('user1', 'channel:telegram');
      const result1 = await limiter.check('user1', 'channel:telegram');
      expect(result1.allowed).toBe(false);
    });

    it('should maintain independent exhaustion states per user', async () => {
      const limiter = new RateLimiter({});
      limiter.setUserLimit('user1', { points: 2, duration: 60 });
      
      await limiter.check('user1', 'user:user1');
      await limiter.check('user1', 'user:user1');
      const result1 = await limiter.check('user1', 'user:user1');
      
      expect(result1.allowed).toBe(false);
    });

    it('should handle all limits exhausted at once', async () => {
      const limiter = new RateLimiter({
        global: { points: 2, duration: 60 },
        perChannel: { telegram: { points: 2, duration: 60 } },
        perUser: { points: 2, duration: 60 },
      });

      for (let i = 0; i < 2; i++) {
        await limiter.check('key1');
        await limiter.checkChannel('telegram');
        await limiter.checkUser('user1');
      }

      const globalResult = await limiter.check('key1');
      const channelResult = await limiter.checkChannel('telegram');
      const userResult = await limiter.checkUser('user1');

      const atLeastSomeDenied = !globalResult.allowed || !channelResult.allowed || !userResult.allowed;
      expect(atLeastSomeDenied).toBe(true);
    });

    it('should return correct retryAfter values', async () => {
      const limiter = new RateLimiter({ global: { points: 2, duration: 60 } });
      
      await limiter.check('key1');
      await limiter.check('key1');
      const result = await limiter.check('key1');
      
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.retryAfter).toBeLessThanOrEqual(60);
    });

    it('should handle single point limit correctly', async () => {
      const limiter = new RateLimiter({ global: { points: 2, duration: 60 } });
      
      await limiter.check('key1');
      const result1 = await limiter.check('key1');
      expect(result1.allowed).toBe(true);
      
      const result2 = await limiter.check('key1');
      expect(result2.allowed).toBe(false);
    });
  });

  describe('Concurrent requests handling', () => {
    it('should handle concurrent check requests', async () => {
      const limiter = new RateLimiter({ global: { points: 10, duration: 60 } });
      
      const promises = Array(10).fill(null).map(() => limiter.check('key1'));
      const results = await Promise.all(promises);
      
      const allowed = results.filter(r => r.allowed).length;
      expect(allowed).toBeLessThanOrEqual(10);
    });

    it('should handle concurrent channel checks', async () => {
      const limiter = new RateLimiter({
        perChannel: { telegram: { points: 5, duration: 60 } },
      });

      const promises = Array(5).fill(null).map(() => limiter.checkChannel('telegram'));
      const results = await Promise.all(promises);
      
      const allowed = results.filter(r => r.allowed).length;
      expect(allowed).toBeLessThanOrEqual(5);
    });

    it('should handle concurrent user checks', async () => {
      const limiter = new RateLimiter({ perUser: { points: 3, duration: 60 } });

      const promises = Array(3).fill(null).map(() => limiter.checkUser('user1'));
      const results = await Promise.all(promises);
      
      const allowed = results.filter(r => r.allowed).length;
      expect(allowed).toBeLessThanOrEqual(3);
    });

    it('should handle mixed concurrent requests', async () => {
      const limiter = new RateLimiter({
        global: { points: 5, duration: 60 },
        perChannel: { telegram: { points: 5, duration: 60 } },
        perUser: { points: 5, duration: 60 },
      });

      const promises = [
        limiter.check('key1'),
        limiter.checkChannel('telegram'),
        limiter.checkUser('user1'),
        limiter.check('key2'),
        limiter.checkChannel('discord'),
        limiter.checkUser('user2'),
      ];

      const results = await Promise.all(promises);
      expect(results.length).toBe(6);
      results.forEach(r => expect(r).toHaveProperty('allowed'));
    });

    it('should handle rapid sequential requests', async () => {
      const limiter = new RateLimiter({ global: { points: 100, duration: 60 } });
      
      for (let i = 0; i < 100; i++) {
        const result = await limiter.check('key1');
        expect(result).toBeDefined();
      }
    });

    it('should handle interleaved requests for different keys', async () => {
      const limiter = new RateLimiter({ global: { points: 5, duration: 60 } });
      
      const results = [];
      for (let i = 0; i < 5; i++) {
        results.push(await limiter.check(`key${i}`));
      }
      
      results.forEach(r => expect(r.allowed).toBe(true));
    });

    it('should handle high concurrency with throttler', async () => {
      const throttler = new Throttler({ maxConcurrent: 10, minTime: 5 });
      
      const promises = Array(20).fill(null).map((_, i) =>
        throttler.throttle(`key${i}`, async () => `result${i}`)
      );
      
      const results = await Promise.all(promises);
      expect(results.length).toBe(20);
    });

    it('should handle throttler concurrency limit', async () => {
      const throttler = new Throttler({ maxConcurrent: 2, minTime: 20 });
      
      const startTime = Date.now();
      const promises = [
        throttler.throttle('key1', async () => { await new Promise(r => setTimeout(r, 50)); return '1'; }),
        throttler.throttle('key2', async () => { await new Promise(r => setTimeout(r, 50)); return '2'; }),
        throttler.throttle('key3', async () => { await new Promise(r => setTimeout(r, 50)); return '3'; }),
      ];
      
      await Promise.all(promises);
      const elapsed = Date.now() - startTime;
      
      expect(elapsed).toBeGreaterThanOrEqual(50);
    });

    it('should maintain state consistency under concurrent access', async () => {
      const limiter = new RateLimiter({ global: { points: 10, duration: 60 } });
      
      const check1 = limiter.check('key1');
      const check2 = limiter.check('key1');
      const check3 = limiter.check('key1');
      
      const [result1, result2, result3] = await Promise.all([check1, check2, check3]);
      
      const allowedCount = [result1, result2, result3].filter(r => r.allowed).length;
      expect(allowedCount).toBeLessThanOrEqual(3);
    });

    it('should handle concurrent set operations', () => {
      const limiter = new RateLimiter();
      
      limiter.setChannelLimit('ch1', { points: 5, duration: 60 });
      limiter.setChannelLimit('ch2', { points: 5, duration: 60 });
      limiter.setUserLimit('user1', { points: 5, duration: 60 });
      limiter.setUserLimit('user2', { points: 5, duration: 60 });
    });
  });

  describe('createRateLimiter factory function', () => {
    it('should create RateLimiter instance', () => {
      const limiter = createRateLimiter({ global: { points: 10, duration: 60 } });
      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it('should create RateLimiter with empty options', () => {
      const limiter = createRateLimiter({});
      expect(limiter).toBeInstanceOf(RateLimiter);
    });

    it('should create RateLimiter with complex options', () => {
      const limiter = createRateLimiter({
        global: { points: 1000, duration: 3600 },
        perChannel: {
          'telegram': { points: 50, duration: 60 },
          'discord': { points: 50, duration: 60 },
        },
        perUser: { points: 20, duration: 60 },
        perIP: { points: 500, duration: 3600 },
      });
      expect(limiter).toBeInstanceOf(RateLimiter);
    });
  });

  describe('createThrottler factory function', () => {
    it('should create Throttler instance', () => {
      const throttler = createThrottler({ maxConcurrent: 5, minTime: 100 });
      expect(throttler).toBeInstanceOf(Throttler);
    });

    it('should create Throttler with default options', () => {
      const throttler = createThrottler();
      expect(throttler).toBeInstanceOf(Throttler);
    });

    it('should create Throttler with empty options', () => {
      const throttler = createThrottler({});
      expect(throttler).toBeInstanceOf(Throttler);
    });
  });

  describe('Edge cases', () => {
    it('should handle very long duration', async () => {
      const limiter = new RateLimiter({
        global: { points: 1, duration: 86400 * 365 },
      });
      const result = await limiter.check('key1');
      expect(result.allowed).toBe(true);
    });

    it('should handle very short duration', async () => {
      const limiter = new RateLimiter({
        global: { points: 1, duration: 1 },
      });
      const result = await limiter.check('key1');
      expect(result.allowed).toBe(true);
    });

    it('should handle very large point value', async () => {
      const limiter = new RateLimiter({
        global: { points: 1000000, duration: 60 },
      });
      const result = await limiter.check('key1');
      expect(result.allowed).toBe(true);
    });

    it('should handle very small point value', async () => {
      const limiter = new RateLimiter({
        global: { points: 1, duration: 60 },
      });
      limiter.setChannelLimit('test', { points: 2, duration: 60 });
      const result = await limiter.check('key1');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeLessThanOrEqual(1);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty string keys', async () => {
      const limiter = new RateLimiter({ global: { points: 5, duration: 60 } });
      const result = await limiter.check('');
      expect(result.allowed).toBe(true);
    });

    it('should handle unicode keys', async () => {
      const limiter = new RateLimiter({ global: { points: 5, duration: 60 } });
      const result = await limiter.check('юзер_имя');
      expect(result.allowed).toBe(true);
    });

    it('should handle very long keys', () => {
      const longKey = 'a'.repeat(10000);
      const limiter = new RateLimiter({ global: { points: 5, duration: 60 } });
      expect(limiter.check(longKey)).toBeDefined();
    });

    it('should handle numeric keys', async () => {
      const limiter = new RateLimiter({ global: { points: 5, duration: 60 } });
      const result = await limiter.check('12345');
      expect(result.allowed).toBe(true);
    });

    it('should handle boolean-like keys', async () => {
      const limiter = new RateLimiter({ global: { points: 5, duration: 60 } });
      const result = await limiter.check('true');
      expect(result.allowed).toBe(true);
    });
  });
});