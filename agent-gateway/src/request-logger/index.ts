/**
 * Enterprise Request Logger
 * Structured, high-performance request logging with
 * sampling, filtering, and async write buffering.
 */

import { createWriteStream } from 'fs';
import { join } from 'path';
import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface RequestLogEntry {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  requestId: string;
  userId?: string;
  tenantId?: string;
  userAgent?: string;
  sourceIp?: string;
  requestSize?: number;
  responseSize?: number;
  cached: boolean;
  error?: string;
}

export interface RequestLoggerConfig {
  /** Sample rate (0-1, default: 1.0 = all) */
  sampleRate?: number;
  /** Write to file */
  logFile?: string;
  /** Max entries in memory */
  maxInMemory?: number;
  /** Filter function */
  filter?: (entry: RequestLogEntry) => boolean;
  /** Callback for each entry */
  onEntry?: (entry: RequestLogEntry) => void;
}

export class RequestLogger extends EventEmitter {
  private config: Required<RequestLoggerConfig>;
  private entries: RequestLogEntry[] = [];
  private fileStream?: ReturnType<typeof createWriteStream>;
  private writeBuffer: string[] = [];
  private flushInterval?: ReturnType<typeof setInterval>;

  constructor(config: RequestLoggerConfig = {}) {
    super();
    this.config = {
      sampleRate: config.sampleRate ?? 1.0,
      logFile: config.logFile || '',
      maxInMemory: config.maxInMemory || 50000,
      filter: config.filter || (() => true),
      onEntry: config.onEntry || (() => {}),
    };

    if (this.config.logFile) {
      this.fileStream = createWriteStream(this.config.logFile, { flags: 'a' });
      this.flushInterval = setInterval(() => this.flush(), 5000);
    }
  }

  /** Log a request */
  log(entry: Omit<RequestLogEntry, 'id' | 'timestamp'>): void {
    // Sampling
    if (Math.random() > this.config.sampleRate) return;

    const fullEntry: RequestLogEntry = {
      ...entry,
      id: `${entry.requestId}-${Date.now()}`,
      timestamp: Date.now(),
    };

    // Filter
    if (!this.config.filter(fullEntry)) return;

    // Store in memory
    this.entries.push(fullEntry);
    if (this.entries.length > this.config.maxInMemory) {
      this.entries.shift();
    }

    // Write to file
    if (this.fileStream) {
      this.writeBuffer.push(JSON.stringify(fullEntry));
      if (this.writeBuffer.length >= 100) this.flush();
    }

    // Callback
    this.config.onEntry(fullEntry);
    this.emit('entry', fullEntry);

    // Log errors
    if (fullEntry.statusCode >= 500) {
      logger.error({ ...fullEntry }, `Request error: ${fullEntry.method} ${fullEntry.path}`);
    }
  }

  /** Get recent entries */
  getRecent(limit: number = 100, filter?: Partial<RequestLogEntry>): RequestLogEntry[] {
    let entries = this.entries.slice(-limit);

    if (filter) {
      entries = entries.filter((e) => {
        for (const [key, value] of Object.entries(filter)) {
          if (value !== undefined && (e as any)[key] !== value) return false;
        }
        return true;
      });
    }

    return entries;
  }

  /** Get stats */
  getStats(timeRange?: { from: number; to: number }): {
    total: number;
    avgLatencyMs: number;
    errorRate: number;
    cacheHitRate: number;
    byStatusCode: Record<string, number>;
    byMethod: Record<string, number>;
  } {
    let entries = this.entries;
    if (timeRange) {
      entries = entries.filter((e) => e.timestamp >= timeRange.from && e.timestamp <= timeRange.to);
    }

    const total = entries.length;
    const avgLatency = total > 0 ? entries.reduce((s, e) => s + e.latencyMs, 0) / total : 0;
    const errors = entries.filter((e) => e.statusCode >= 400).length;
    const cached = entries.filter((e) => e.cached).length;

    const byStatusCode: Record<string, number> = {};
    const byMethod: Record<string, number> = {};

    for (const e of entries) {
      byStatusCode[e.statusCode] = (byStatusCode[e.statusCode] || 0) + 1;
      byMethod[e.method] = (byMethod[e.method] || 0) + 1;
    }

    return {
      total,
      avgLatencyMs: Math.round(avgLatency),
      errorRate: total > 0 ? errors / total : 0,
      cacheHitRate: total > 0 ? cached / total : 0,
      byStatusCode,
      byMethod,
    };
  }

  /** Flush write buffer */
  private flush(): void {
    if (this.writeBuffer.length === 0 || !this.fileStream) return;

    const data = this.writeBuffer.join('\n') + '\n';
    this.writeBuffer = [];
    this.fileStream.write(data);
  }

  /** Close the logger */
  close(): void {
    if (this.flushInterval) clearInterval(this.flushInterval);
    this.flush();
    if (this.fileStream) {
      this.fileStream.end();
      this.fileStream = undefined;
    }
  }
}

export function createRequestLogger(config?: RequestLoggerConfig): RequestLogger {
  return new RequestLogger(config);
}
