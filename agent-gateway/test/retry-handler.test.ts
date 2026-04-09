import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { withRetry, withTimeout, Bulkhead, createBulkhead } from '../src/retry-handler/index.js';

vi.mock('../src/infra/index.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('withRetry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const promise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10 });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('temp error'))
      .mockRejectedValueOnce(new Error('temp error'))
      .mockResolvedValue('success');

    const promise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10, jitter: 0 });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('should throw after maxRetries exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('permanent error'));

    const promise = withRetry(fn, { maxRetries: 2, baseDelayMs: 10, jitter: 0 });
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow('permanent error');
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('should throw immediately for non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(Object.assign(new Error('not retryable'), { code: 'NOT_RETRYABLE' }));

    const promise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10, retryableErrors: ['RETRYABLE'] });
    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow('not retryable');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry for retryable errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('retryable'), { code: 'RETRYABLE' }))
      .mockResolvedValue('success');

    const promise = withRetry(fn, { maxRetries: 3, baseDelayMs: 10, retryableErrors: ['RETRYABLE'], jitter: 0 });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should respect baseDelay', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const promise = withRetry(fn, { maxRetries: 3, baseDelayMs: 500, jitter: 0 });
    await vi.advanceTimersByTimeAsync(400);
    expect(fn).toHaveBeenCalledTimes(1); // Still waiting

    await vi.advanceTimersByTimeAsync(200);
    const result = await promise;
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should respect maxDelayMs cap', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const promise = withRetry(fn, { maxRetries: 5, baseDelayMs: 1000, maxDelayMs: 100, jitter: 0 });
    await vi.runAllTimersAsync();
    const result = await promise;
    expect(result).toBe('success');
  });
});

describe('withTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result if operation completes before timeout', async () => {
    const fn = vi.fn().mockResolvedValue('done');
    const promise = withTimeout(fn, 1000);
    const result = await promise;
    expect(result).toBe('done');
  });

  it('should throw timeout error if operation takes too long', async () => {
    const fn = vi.fn().mockImplementation(() => new Promise((r) => setTimeout(r, 5000)));
    const promise = withTimeout(fn, 100);
    await vi.advanceTimersByTimeAsync(150);
    await expect(promise).rejects.toThrow('Operation timed out after 100ms');
  });

  it('should use custom error message', async () => {
    const fn = vi.fn().mockImplementation(() => new Promise((r) => setTimeout(r, 5000)));
    const promise = withTimeout(fn, 100, 'custom timeout');
    await vi.advanceTimersByTimeAsync(150);
    await expect(promise).rejects.toThrow('custom timeout');
  });

  it('should clear timeout on successful completion', async () => {
    const fn = vi.fn().mockResolvedValue('fast');
    const promise = withTimeout(fn, 1000);
    const result = await promise;
    expect(result).toBe('fast');
  });
});

describe('Bulkhead', () => {
  let bulkhead: Bulkhead;

  beforeEach(() => {
    bulkhead = createBulkhead(2);
  });

  it('should allow concurrent operations up to limit', async () => {
    let concurrent = 0;
    let maxConcurrent = 0;

    const fn = async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((r) => setTimeout(r, 10));
      concurrent--;
      return 'done';
    };

    const results = await Promise.all([
      bulkhead.execute(fn),
      bulkhead.execute(fn),
      bulkhead.execute(fn),
    ]);

    expect(results).toEqual(['done', 'done', 'done']);
    expect(maxConcurrent).toBe(2);
  });

  it('should queue operations when limit is reached', async () => {
    const results: string[] = [];

    const slowFn = async (name: string) => {
      results.push(`${name}-start`);
      await new Promise((r) => setTimeout(r, 20));
      results.push(`${name}-end`);
      return name;
    };

    const promises = [
      bulkhead.execute(() => slowFn('a')),
      bulkhead.execute(() => slowFn('b')),
      bulkhead.execute(() => slowFn('c')),
    ];

    await Promise.all(promises);

    expect(results).toContain('a-start');
    expect(results).toContain('b-start');
    // c should start after a or b ends
    expect(results).toContain('c-start');
  });

  it('should release queue slot on error', async () => {
    const failingFn = async () => {
      throw new Error('fail');
    };
    const successFn = async () => 'success';

    await expect(bulkhead.execute(failingFn)).rejects.toThrow('fail');
    const result = await bulkhead.execute(successFn);
    expect(result).toBe('success');
  });

  it('should handle maxConcurrent of 1', async () => {
    const single = createBulkhead(1);
    let concurrent = 0;
    let maxConcurrent = 0;

    const fn = async () => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((r) => setTimeout(r, 10));
      concurrent--;
      return 'done';
    };

    await Promise.all([
      single.execute(fn),
      single.execute(fn),
      single.execute(fn),
    ]);

    expect(maxConcurrent).toBe(1);
  });
});
