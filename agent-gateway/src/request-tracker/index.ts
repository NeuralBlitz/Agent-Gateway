/**
 * Enterprise Request Tracker
 * Correlated request tracking across services with
 * distributed tracing context propagation.
 */

import { randomBytes, createHash } from 'crypto';
import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface RequestTrace {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  serviceName: string;
  operation: string;
  startTime: number;
  endTime?: number;
  status: 'ok' | 'error';
  tags: Record<string, any>;
  logs: Array<{ timestamp: number; message: string; level: string }>;
  children: string[];
}

export class RequestTracker extends EventEmitter {
  private traces: Map<string, RequestTrace> = new Map();
  private maxTraces: number;

  constructor(maxTraces: number = 100000) {
    super();
    this.maxTraces = maxTraces;
  }

  /** Start a new trace */
  startTrace(serviceName: string, operation: string, parentSpanId?: string, traceId?: string): RequestTrace {
    const resolvedTraceId =
      traceId ||
      (parentSpanId ? this.traces.get(parentSpanId)?.traceId : undefined) ||
      randomBytes(16).toString('hex');
    const spanId = randomBytes(8).toString('hex');

    const trace: RequestTrace = {
      traceId: resolvedTraceId,
      spanId,
      parentSpanId,
      serviceName,
      operation,
      startTime: Date.now(),
      status: 'ok',
      tags: {},
      logs: [],
      children: [],
    };

    this.traces.set(spanId, trace);

    // Link to parent
    if (parentSpanId) {
      const parent = this.traces.get(parentSpanId);
      if (parent) parent.children.push(spanId);
    }

    // Enforce max
    if (this.traces.size > this.maxTraces) {
      const oldest = Array.from(this.traces.entries())
        .sort((a, b) => a[1].startTime - b[1].startTime)[0];
      if (oldest) this.traces.delete(oldest[0]);
    }

    return trace;
  }

  /** End a trace */
  endTrace(spanId: string, status: 'ok' | 'error' = 'ok'): RequestTrace | null {
    const trace = this.traces.get(spanId);
    if (!trace) return null;

    trace.endTime = Date.now();
    trace.status = status;

    this.emit('trace:complete', trace);
    return trace;
  }

  /** Add a tag to a trace */
  tag(spanId: string, key: string, value: any): void {
    const trace = this.traces.get(spanId);
    if (trace) trace.tags[key] = value;
  }

  /** Add a log entry to a trace */
  log(spanId: string, message: string, level: string = 'info'): void {
    const trace = this.traces.get(spanId);
    if (trace) {
      trace.logs.push({ timestamp: Date.now(), message, level });
    }
  }

  /** Get a trace */
  getTrace(spanId: string): RequestTrace | undefined {
    return this.traces.get(spanId);
  }

  /** Get full trace tree */
  getTraceTree(traceId: string): RequestTrace[] {
    return Array.from(this.traces.values()).filter((t) => t.traceId === traceId);
  }

  /** Get recent traces */
  getRecent(limit: number = 100): RequestTrace[] {
    return Array.from(this.traces.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /** Get error traces */
  getErrors(limit: number = 50): RequestTrace[] {
    return Array.from(this.traces.values())
      .filter((t) => t.status === 'error')
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /** Get traces by service */
  getByService(serviceName: string, limit: number = 100): RequestTrace[] {
    return Array.from(this.traces.values())
      .filter((t) => t.serviceName === serviceName)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /** Get traces by operation */
  getByOperation(operation: string, limit: number = 100): RequestTrace[] {
    return Array.from(this.traces.values())
      .filter((t) => t.operation === operation)
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /** Get latency percentiles */
  getLatencyPercentiles(): { p50: number; p95: number; p99: number; avg: number } {
    const completed = Array.from(this.traces.values())
      .filter((t) => t.endTime)
      .map((t) => t.endTime! - t.startTime)
      .sort((a, b) => a - b);

    if (completed.length === 0) return { p50: 0, p95: 0, p99: 0, avg: 0 };

    const p = (percentile: number) => completed[Math.floor(completed.length * percentile)];
    const avg = completed.reduce((s, v) => s + v, 0) / completed.length;

    return { p50: p(0.5), p95: p(0.95), p99: p(0.99), avg: Math.round(avg) };
  }

  /** Get stats */
  getStats(): {
    totalTraces: number;
    completedTraces: number;
    errorTraces: number;
    avgDurationMs: number;
    byService: Record<string, number>;
    byOperation: Record<string, number>;
  } {
    const traces = Array.from(this.traces.values());
    const completed = traces.filter((t) => t.endTime);
    const errors = traces.filter((t) => t.status === 'error');

    const byService: Record<string, number> = {};
    const byOperation: Record<string, number> = {};

    for (const t of traces) {
      byService[t.serviceName] = (byService[t.serviceName] || 0) + 1;
      byOperation[t.operation] = (byOperation[t.operation] || 0) + 1;
    }

    const avgDuration = completed.length > 0
      ? completed.reduce((s, t) => s + (t.endTime! - t.startTime), 0) / completed.length
      : 0;

    return {
      totalTraces: traces.length,
      completedTraces: completed.length,
      errorTraces: errors.length,
      avgDurationMs: Math.round(avgDuration),
      byService,
      byOperation,
    };
  }

  /** Clear all traces */
  clear(): void {
    this.traces.clear();
  }
}

export function createRequestTracker(maxTraces?: number): RequestTracker {
  return new RequestTracker(maxTraces);
}
