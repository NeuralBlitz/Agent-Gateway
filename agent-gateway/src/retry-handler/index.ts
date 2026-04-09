/** Enterprise Retry Handler with exponential backoff and jitter */
import { logger } from '../infra/index.js';

export interface RetryConfig { maxRetries?: number; baseDelayMs?: number; maxDelayMs?: number; jitter?: number; retryableErrors?: string[]; }

export async function withRetry<T>(fn: () => Promise<T>, config: RetryConfig = {}): Promise<T> {
  const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000, jitter = 0.3, retryableErrors } = config;
  let lastError: Error | undefined;
  for (let i = 0; i <= maxRetries; i++) {
    try { return await fn(); }
    catch (err: any) {
      lastError = err;
      if (retryableErrors && !retryableErrors.includes(err.code || err.message)) throw err;
      if (i < maxRetries) {
        const delay = Math.min(baseDelayMs * Math.pow(2, i) * (1 + jitter * (Math.random() * 2 - 1)), maxDelayMs);
        logger.warn({ attempt: i + 1, maxRetries, delay, error: err.message }, 'Retrying');
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}

/** Enterprise Timeout wrapper */
export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number, errorMsg?: string): Promise<T> {
  let timeoutHandle: ReturnType<typeof setTimeout>;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutHandle = setTimeout(() => reject(new Error(errorMsg || `Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  try { return await Promise.race([fn(), timeoutPromise]); }
  finally { clearTimeout(timeoutHandle!); }
}

/** Bulkhead pattern — limit concurrent operations */
export class Bulkhead {
  private maxConcurrent: number;
  private active = 0;
  private queue: Array<{ resolve: () => void; reject: (err: Error) => void }> = [];
  constructor(maxConcurrent: number) { this.maxConcurrent = maxConcurrent; }
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrent) {
      await new Promise<void>((resolve, reject) => this.queue.push({ resolve, reject }));
    }
    this.active++;
    try { return await fn(); }
    finally {
      this.active--;
      const next = this.queue.shift();
      if (next) next.resolve();
    }
  }
}

export function createBulkhead(maxConcurrent: number): Bulkhead { return new Bulkhead(maxConcurrent); }
