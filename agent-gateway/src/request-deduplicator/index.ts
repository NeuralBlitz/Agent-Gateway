/**
 * Enterprise Request Deduplicator
 * Coalesces identical in-flight requests to prevent redundant work,
 * reduce API costs, and improve throughput under load.
 * Supports configurable key generation, TTL, and concurrency limits.
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { logger } from '../infra/index.js';

export interface DeduplicationConfig {
  /** Max concurrent deduplicated requests (default: 1000) */
  maxConcurrent?: number;
  /** TTL for deduplication keys in ms (default: 30000) */
  ttlMs?: number;
  /** Whether to include headers in key generation */
  includeHeaders?: boolean;
  /** Header keys to include in deduplication key */
  headerKeys?: string[];
}

export interface DeduplicationStats {
  totalRequests: number;
  deduplicatedRequests: number;
  uniqueRequests: number;
  deduplicationRate: number;
  activeRequests: number;
  peakConcurrency: number;
}

/**
 * Request deduplication manager.
 * When multiple identical requests arrive simultaneously,
 * only the first one executes and all others share the result.
 */
export class RequestDeduplicator extends EventEmitter {
  private config: Required<DeduplicationConfig>;
  private inFlight: Map<string, { promise: Promise<any>; count: number; createdAt: number }> = new Map();
  private stats: { total: number; deduplicated: number; unique: number; peak: number } = {
    total: 0,
    deduplicated: 0,
    unique: 0,
    peak: 0,
  };
  private cleanupInterval?: ReturnType<typeof setInterval>;

  constructor(config: DeduplicationConfig = {}) {
    super();
    this.config = {
      maxConcurrent: config.maxConcurrent || 1000,
      ttlMs: config.ttlMs || 30000,
      includeHeaders: config.includeHeaders ?? false,
      headerKeys: config.headerKeys || ['content-type', 'accept'],
    };

    // Periodic cleanup of expired entries
    this.cleanupInterval = setInterval(() => this.cleanup(), this.config.ttlMs);
  }

  /**
   * Deduplicate a request. If an identical request is already in-flight,
   * returns the same promise. Otherwise executes the function.
   */
  async deduplicate<T>(
    key: string,
    fn: () => Promise<T>,
    context?: { method?: string; path?: string; headers?: Record<string, string> },
  ): Promise<T> {
    this.stats.total++;

    // Generate deduplication key
    const dedupKey = this.generateKey(key, context);

    // Check if already in-flight
    const existing = this.inFlight.get(dedupKey);
    if (existing) {
      // Check TTL
      if (Date.now() - existing.createdAt > this.config.ttlMs) {
        this.inFlight.delete(dedupKey);
      } else {
        existing.count++;
        this.stats.deduplicated++;
        logger.debug({ dedupKey, activeWaiters: existing.count }, 'Request deduplicated');
        this.emit('deduplicated', { dedupKey, context });
        return existing.promise;
      }
    }

    // Check concurrency limit
    if (this.inFlight.size >= this.config.maxConcurrent) {
      logger.warn({ concurrent: this.inFlight.size, max: this.config.maxConcurrent }, 'Deduplication limit reached, executing without dedup');
      this.stats.unique++;
      return fn();
    }

    // Execute and track
    this.stats.unique++;
    const entry = {
      promise: this.executeAndTrack(dedupKey, fn),
      count: 1,
      createdAt: Date.now(),
    };

    this.inFlight.set(dedupKey, entry);

    // Track peak concurrency
    if (this.inFlight.size > this.stats.peak) {
      this.stats.peak = this.inFlight.size;
    }

    return entry.promise;
  }

  /** Execute function and clean up on completion */
  private async executeAndTrack<T>(dedupKey: string, fn: () => Promise<T>): Promise<T> {
    try {
      const result = await fn();
      this.emit('completed', { dedupKey });
      return result;
    } catch (err: any) {
      this.emit('error', { dedupKey, error: err.message });
      throw err;
    } finally {
      // Clean up after a brief delay to allow late joiners
      setTimeout(() => {
        this.inFlight.delete(dedupKey);
      }, 100);
    }
  }

  /** Generate a deduplication key from request details */
  private generateKey(key: string, context?: { method?: string; path?: string; headers?: Record<string, string> }): string {
    const parts = [key];

    if (context?.method) parts.push(context.method);
    if (context?.path) parts.push(context.path);

    if (this.config.includeHeaders && context?.headers) {
      for (const headerKey of this.config.headerKeys) {
        const value = context.headers[headerKey.toLowerCase()];
        if (value) parts.push(`${headerKey}:${value}`);
      }
    }

    return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 32);
  }

  /** Clean up expired entries */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.inFlight) {
      if (now - entry.createdAt > this.config.ttlMs) {
        this.inFlight.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug({ cleaned }, 'Deduplication cleanup');
    }
  }

  /** Get active deduplication keys */
  getActiveKeys(): Array<{ key: string; waiters: number; age: number }> {
    const now = Date.now();
    const result: Array<{ key: string; waiters: number; age: number }> = [];

    for (const [key, entry] of this.inFlight) {
      result.push({
        key,
        waiters: entry.count,
        age: now - entry.createdAt,
      });
    }

    return result.sort((a, b) => b.waiters - a.waiters);
  }

  /** Get deduplication statistics */
  getStats(): DeduplicationStats {
    return {
      totalRequests: this.stats.total,
      deduplicatedRequests: this.stats.deduplicated,
      uniqueRequests: this.stats.unique,
      deduplicationRate: this.stats.total > 0 ? this.stats.deduplicated / this.stats.total : 0,
      activeRequests: this.inFlight.size,
      peakConcurrency: this.stats.peak,
    };
  }

  /** Reset statistics */
  resetStats(): void {
    this.stats = { total: 0, deduplicated: 0, unique: 0, peak: this.stats.peak };
  }

  /** Clear all in-flight requests */
  clear(): void {
    this.inFlight.clear();
  }

  /** Destroy the deduplicator */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.inFlight.clear();
  }
}

export function createRequestDeduplicator(config?: DeduplicationConfig): RequestDeduplicator {
  return new RequestDeduplicator(config);
}
