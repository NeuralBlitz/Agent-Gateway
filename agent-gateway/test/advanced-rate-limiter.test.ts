import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AdvancedRateLimiter, createAdvancedRateLimiter } from '../src/advanced-rate-limiter/index.js';

vi.mock('../src/infra/index.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('AdvancedRateLimiter', () => {
  let limiter: AdvancedRateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new AdvancedRateLimiter();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('creates a limiter without redis URL', () => {
      const l = new AdvancedRateLimiter();
      expect(l).toBeInstanceOf(AdvancedRateLimiter);
    });

    it('creates a limiter with redis URL', () => {
      const l = new AdvancedRateLimiter('redis://localhost:6379');
      expect(l).toBeInstanceOf(AdvancedRateLimiter);
    });
  });

  describe('createAdvancedRateLimiter', () => {
    it('returns an AdvancedRateLimiter instance', () => {
      const l = createAdvancedRateLimiter();
      expect(l).toBeInstanceOf(AdvancedRateLimiter);
    });
  });

  describe('check with sliding-window-log (default)', () => {
    it('allows requests within the limit', async () => {
      const result = await limiter.check('user:1', { max: 5, window: 60 });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });

    it('blocks requests exceeding the limit', async () => {
      const opts = { max: 3, window: 60 } as const;

      await limiter.check('user:2', opts);
      await limiter.check('user:2', opts);
      const third = await limiter.check('user:2', opts);
      expect(third.allowed).toBe(true);
      expect(third.remaining).toBe(0);

      const fourth = await limiter.check('user:2', opts);
      expect(fourth.allowed).toBe(false);
      expect(fourth.remaining).toBe(0);
      expect(fourth.retryAfter).toBeGreaterThan(0);
    });

    it('tracks separate keys independently', async () => {
      const opts = { max: 2, window: 60 } as const;

      await limiter.check('user:A', opts);
      await limiter.check('user:A', opts);
      const blocked = await limiter.check('user:A', opts);
      expect(blocked.allowed).toBe(false);

      const fresh = await limiter.check('user:B', opts);
      expect(fresh.allowed).toBe(true);
    });
  });

  describe('check with token-bucket strategy', () => {
    it('allows requests within bucket capacity', async () => {
      const result = await limiter.check('tb:1', {
        strategy: 'token-bucket',
        max: 10,
        burst: 10,
        window: 60,
      });
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('depletes bucket and blocks further requests', async () => {
      const opts = {
        strategy: 'token-bucket' as const,
        max: 3,
        burst: 3,
        window: 60,
      };

      await limiter.check('tb:2', opts);
      await limiter.check('tb:2', opts);
      const third = await limiter.check('tb:2', opts);
      expect(third.allowed).toBe(true);

      const fourth = await limiter.check('tb:2', opts);
      expect(fourth.allowed).toBe(false);
    });

    it('refills tokens over time', async () => {
      const opts = {
        strategy: 'token-bucket' as const,
        max: 2,
        burst: 2,
        window: 1,
      };

      await limiter.check('tb:3', opts);
      await limiter.check('tb:3', opts);

      const blocked = await limiter.check('tb:3', opts);
      expect(blocked.allowed).toBe(false);

      vi.advanceTimersByTime(1000);

      const afterRefill = await limiter.check('tb:3', opts);
      expect(afterRefill.allowed).toBe(true);
    });
  });

  describe('check with leaky-bucket strategy', () => {
    it('allows requests within capacity', async () => {
      const result = await limiter.check('lb:1', {
        strategy: 'leaky-bucket',
        max: 5,
        burst: 5,
        window: 60,
      });
      expect(result.allowed).toBe(true);
    });

    it('blocks when bucket is full', async () => {
      const opts = {
        strategy: 'leaky-bucket' as const,
        max: 2,
        burst: 2,
        window: 60,
      };

      await limiter.check('lb:2', opts);
      await limiter.check('lb:2', opts);

      const blocked = await limiter.check('lb:2', opts);
      expect(blocked.allowed).toBe(false);
    });

    it('leaks over time allowing new requests', async () => {
      const opts = {
        strategy: 'leaky-bucket' as const,
        max: 2,
        burst: 2,
        window: 1,
      };

      await limiter.check('lb:3', opts);
      await limiter.check('lb:3', opts);

      vi.advanceTimersByTime(2000);

      const allowed = await limiter.check('lb:3', opts);
      expect(allowed.allowed).toBe(true);
    });
  });

  describe('reset', () => {
    it('clears rate limit state for a key', async () => {
      const opts = { max: 1, window: 60 } as const;

      await limiter.check('reset:1', opts);
      const blocked = await limiter.check('reset:1', opts);
      expect(blocked.allowed).toBe(false);

      await limiter.reset('reset:1');

      const allowed = await limiter.check('reset:1', opts);
      expect(allowed.allowed).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('handles large count parameter', async () => {
      const result = await limiter.check('count:1', { max: 100, window: 60 }, 50);
      expect(result.allowed).toBe(true);

      const second = await limiter.check('count:1', { max: 100, window: 60 }, 50);
      expect(second.allowed).toBe(true); // 50 + 50 = 100, exactly at limit
      expect(second.remaining).toBe(0);

      const blocked = await limiter.check('count:1', { max: 100, window: 60 }, 1);
      expect(blocked.allowed).toBe(false); // 101 would exceed
    });

    it('handles very small windows', async () => {
      const result = await limiter.check('small:1', { max: 5, window: 1 });
      expect(result.allowed).toBe(true);
    });
  });
});
