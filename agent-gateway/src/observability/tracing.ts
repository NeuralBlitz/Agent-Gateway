/**
 * Distributed tracing — lightweight, no external dependency needed.
 * Tracks request flow through the system for debugging and observability.
 * Compatible with OpenTelemetry trace format for future integration.
 */

import { randomUUID } from 'crypto';
import { logger } from '../infra/index.js';

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  status: 'ok' | 'error';
  attributes: Record<string, any>;
  events: SpanEvent[];
}

export interface SpanEvent {
  name: string;
  timestamp: number;
  attributes: Record<string, any>;
}

export interface TraceContext {
  traceId: string;
  spanId: string;
}

export class Tracer {
  private spans: Span[] = [];
  private maxSpans: number;

  constructor(maxSpans: number = 10000) {
    this.maxSpans = maxSpans;
  }

  /** Start a new span */
  startSpan(name: string, parent?: TraceContext, attributes: Record<string, any> = {}): Span {
    const span: Span = {
      traceId: parent?.traceId || randomUUID(),
      spanId: randomUUID(),
      parentSpanId: parent?.spanId,
      name,
      startTime: Date.now(),
      status: 'ok',
      attributes,
      events: [],
    };

    // Store in memory (evict oldest if over limit)
    if (this.spans.length >= this.maxSpans) {
      this.spans.shift();
    }
    this.spans.push(span);

    return span;
  }

  /** End a span */
  endSpan(span: Span, status: 'ok' | 'error' = 'ok'): void {
    span.endTime = Date.now();
    span.status = status;
  }

  /** Add an event to a span */
  addEvent(span: Span, name: string, attributes: Record<string, any> = {}): void {
    span.events.push({
      name,
      timestamp: Date.now(),
      attributes,
    });
  }

  /** Add an attribute to a span */
  setAttribute(span: Span, key: string, value: any): void {
    span.attributes[key] = value;
  }

  /** Get a span by ID */
  getSpan(spanId: string): Span | undefined {
    return this.spans.find((s) => s.spanId === spanId);
  }

  /** Get all spans for a trace */
  getTrace(traceId: string): Span[] {
    return this.spans.filter((s) => s.traceId === traceId);
  }

  /** Get recent spans */
  getRecentSpans(limit: number = 100): Span[] {
    return this.spans.slice(-limit);
  }

  /** Get error spans */
  getErrorSpans(limit: number = 50): Span[] {
    return this.spans.filter((s) => s.status === 'error').slice(-limit);
  }

  /** Clear all spans */
  clear(): void {
    this.spans = [];
  }

  /** Export spans in a format compatible with tracing systems */
  exportSpans(): any[] {
    return this.spans.map((span) => ({
      trace_id: span.traceId,
      span_id: span.spanId,
      parent_span_id: span.parentSpanId,
      name: span.name,
      start_time: span.startTime,
      end_time: span.endTime,
      duration_ms: span.endTime ? span.endTime - span.startTime : undefined,
      status: span.status,
      attributes: span.attributes,
      events: span.events,
    }));
  }
}

// Global tracer instance
const globalTracer = new Tracer();

export function getTracer(): Tracer {
  return globalTracer;
}

/**
 * Trace a function execution automatically.
 * Wraps an async function with a span.
 */
export async function trace<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  parent?: TraceContext,
  attributes: Record<string, any> = {},
): Promise<T> {
  const tracer = getTracer();
  const span = tracer.startSpan(name, parent, attributes);

  try {
    const result = await fn(span);
    tracer.endSpan(span, 'ok');
    return result;
  } catch (error: any) {
    tracer.endSpan(span, 'error');
    tracer.setAttribute(span, 'error.message', error.message);
    logger.error({ span: span.spanId, error: error.message }, `Span error: ${name}`);
    throw error;
  }
}
