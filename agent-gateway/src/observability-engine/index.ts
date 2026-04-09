/**
 * Enterprise Observability Engine
 * Comprehensive observability platform combining metrics,
 * distributed tracing, structured logging, and alerting
 * with configurable exporters and dashboards.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { logger } from '../infra/index.js';

// --- Metrics ---

export interface MetricSample {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labelNames: string[];
  buckets?: number[]; // For histogram
  quantiles?: number[]; // For summary
}

class MetricRegistry {
  private definitions: Map<string, MetricDefinition> = new Map();
  private samples: MetricSample[] = [];
  private maxSamples: number;

  constructor(maxSamples: number = 100000) {
    this.maxSamples = maxSamples;
  }

  register(def: MetricDefinition): void {
    this.definitions.set(def.name, def);
  }

  record(name: string, value: number, labels: Record<string, string> = {}): void {
    const sample: MetricSample = {
      name,
      value,
      labels,
      timestamp: Date.now(),
    };

    this.samples.push(sample);
    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }
  }

  increment(name: string, labels: Record<string, string> = {}, by: number = 1): void {
    this.record(name, by, labels);
  }

  gauge(name: string, value: number, labels: Record<string, string> = {}): void {
    this.record(name, value, labels);
  }

  histogram(name: string, value: number, labels: Record<string, string> = {}): void {
    this.record(name, value, labels);
  }

  /** Get samples by name */
  getSamples(name: string, limit: number = 1000): MetricSample[] {
    return this.samples.filter((s) => s.name === name).slice(-limit);
  }

  /** Get aggregated metrics */
  getAggregated(name: string): { sum: number; count: number; avg: number; min: number; max: number } {
    const samples = this.samples.filter((s) => s.name === name);
    if (samples.length === 0) return { sum: 0, count: 0, avg: 0, min: 0, max: 0 };

    const values = samples.map((s) => s.value);
    const sum = values.reduce((a, b) => a + b, 0);

    return {
      sum,
      count: samples.length,
      avg: sum / samples.length,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }

  /** Get all registered definitions */
  getDefinitions(): MetricDefinition[] {
    return Array.from(this.definitions.values());
  }

  /** Clear all samples */
  clear(): void {
    this.samples = [];
  }
}

// --- Tracing ---

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  serviceName: string;
  kind: 'server' | 'client' | 'producer' | 'consumer' | 'internal';
  startTime: number;
  endTime?: number;
  status: 'ok' | 'error' | 'unset';
  attributes: Record<string, any>;
  events: Array<{ name: string; timestamp: number; attributes: Record<string, any> }>;
  links: Array<{ traceId: string; spanId: string }>;
}

class TraceRegistry {
  private spans: Map<string, Span> = new Map();
  private maxSpans: number;

  constructor(maxSpans: number = 100000) {
    this.maxSpans = maxSpans;
  }

  /** Start a new span */
  startSpan(name: string, serviceName: string, options?: { parentSpanId?: string; traceId?: string; kind?: Span['kind']; attributes?: Record<string, any> }): Span {
    const traceId = options?.traceId || randomUUID();
    const spanId = randomUUID();

    const span: Span = {
      traceId,
      spanId,
      parentSpanId: options?.parentSpanId,
      name,
      serviceName,
      kind: options?.kind || 'internal',
      startTime: Date.now(),
      status: 'unset',
      attributes: options?.attributes || {},
      events: [],
      links: [],
    };

    this.spans.set(spanId, span);

    // Enforce max
    if (this.spans.size > this.maxSpans) {
      const oldest = Array.from(this.spans.entries())
        .sort((a, b) => a[1].startTime - b[1].startTime)[0];
      if (oldest) this.spans.delete(oldest[0]);
    }

    return span;
  }

  /** End a span */
  endSpan(spanId: string, status: Span['status'] = 'ok', attributes?: Record<string, any>): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    span.endTime = Date.now();
    span.status = status;
    if (attributes) Object.assign(span.attributes, attributes);
  }

  /** Add event to span */
  addEvent(spanId: string, name: string, attributes: Record<string, any> = {}): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.events.push({ name, timestamp: Date.now(), attributes });
    }
  }

  /** Add link between spans */
  addLink(spanId: string, traceId: string, linkedSpanId: string): void {
    const span = this.spans.get(spanId);
    if (span) {
      span.links.push({ traceId, spanId: linkedSpanId });
    }
  }

  /** Get a span */
  getSpan(spanId: string): Span | undefined {
    return this.spans.get(spanId);
  }

  /** Get trace by ID */
  getTrace(traceId: string): Span[] {
    return Array.from(this.spans.values()).filter((s) => s.traceId === traceId);
  }

  /** Get recent spans */
  getRecent(limit: number = 100): Span[] {
    return Array.from(this.spans.values())
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /** Get error spans */
  getErrors(limit: number = 50): Span[] {
    return Array.from(this.spans.values())
      .filter((s) => s.status === 'error')
      .sort((a, b) => b.startTime - a.startTime)
      .slice(0, limit);
  }

  /** Get latency percentiles */
  getLatencyPercentiles(): { p50: number; p90: number; p95: number; p99: number; avg: number } {
    const completed = Array.from(this.spans.values())
      .filter((s) => s.endTime)
      .map((s) => s.endTime! - s.startTime)
      .sort((a, b) => a - b);

    if (completed.length === 0) return { p50: 0, p90: 0, p95: 0, p99: 0, avg: 0 };

    const p = (percentile: number) => completed[Math.floor(completed.length * percentile)];
    const avg = completed.reduce((s, v) => s + v, 0) / completed.length;

    return {
      p50: p(0.5),
      p90: p(0.9),
      p95: p(0.95),
      p99: p(0.99),
      avg: Math.round(avg),
    };
  }

  /** Clear all spans */
  clear(): void {
    this.spans.clear();
  }
}

// --- Alerting ---

export interface AlertRule {
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  threshold: number;
  duration: number; // Duration the condition must hold (ms)
  severity: 'info' | 'warning' | 'critical';
  recipients: string[];
  enabled: boolean;
  lastTriggered?: number;
  cooldownMs: number; // Min time between alerts
}

export interface Alert {
  id: string;
  rule: string;
  severity: string;
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  timestamp: number;
  resolved?: boolean;
  resolvedAt?: number;
}

class AlertManager extends EventEmitter {
  private rules: Map<string, AlertRule> = new Map();
  private alerts: Alert[] = [];
  private conditionStart: Map<string, { since: number; value: number }> = new Map();
  private maxAlerts: number;

  constructor(maxAlerts: number = 10000) {
    super();
    this.maxAlerts = maxAlerts;
  }

  /** Register an alert rule */
  registerRule(rule: AlertRule): void {
    this.rules.set(rule.name, rule);
    logger.info({ rule: rule.name, metric: rule.metric, threshold: rule.threshold }, 'Alert rule registered');
  }

  /** Evaluate all rules against current metric values */
  evaluate(metricName: string, currentValue: number): void {
    for (const [, rule] of this.rules) {
      if (!rule.enabled) continue;
      if (rule.metric !== metricName) continue;

      const conditionMet = this.checkCondition(currentValue, rule.condition, rule.threshold);
      const key = `${rule.name}:${metricName}`;

      if (conditionMet) {
        if (!this.conditionStart.has(key)) {
          this.conditionStart.set(key, { since: Date.now(), value: currentValue });
        } else {
          const start = this.conditionStart.get(key)!;
          // Check if condition held for required duration
          if (Date.now() - start.since >= rule.duration) {
            // Check cooldown
            if (!rule.lastTriggered || Date.now() - rule.lastTriggered > rule.cooldownMs) {
              this.fireAlert(rule, currentValue);
              rule.lastTriggered = Date.now();
            }
          }
        }
      } else {
        // Condition no longer met
        if (this.conditionStart.has(key)) {
          this.conditionStart.delete(key);
          // Resolve any active alert
          this.resolveAlert(rule.name);
        }
      }
    }
  }

  /** Fire an alert */
  private fireAlert(rule: AlertRule, currentValue: number): void {
    const alert: Alert = {
      id: randomUUID(),
      rule: rule.name,
      severity: rule.severity,
      message: `Alert: ${rule.description} — ${rule.metric} = ${currentValue} (threshold: ${rule.threshold})`,
      metric: rule.metric,
      currentValue,
      threshold: rule.threshold,
      timestamp: Date.now(),
    };

    this.alerts.push(alert);
    if (this.alerts.length > this.maxAlerts) this.alerts.shift();

    logger.warn({ alert: alert.id, rule: rule.name, severity: rule.severity }, alert.message);
    this.emit('alert:fired', alert);

    // Notify recipients
    for (const recipient of rule.recipients) {
      this.emit('alert:notify', { alert, recipient });
    }
  }

  /** Resolve an alert */
  private resolveAlert(ruleName: string): void {
    const alert = this.alerts.find((a) => a.rule === ruleName && !a.resolved);
    if (alert) {
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      this.emit('alert:resolved', alert);
      logger.info({ alert: alert.id, rule: ruleName }, 'Alert resolved');
    }
  }

  /** Check condition */
  private checkCondition(value: number, condition: AlertRule['condition'], threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'gte': return value >= threshold;
      case 'lt': return value < threshold;
      case 'lte': return value <= threshold;
      case 'eq': return value === threshold;
      case 'neq': return value !== threshold;
      default: return false;
    }
  }

  /** Get active alerts */
  getActiveAlerts(): Alert[] {
    return this.alerts.filter((a) => !a.resolved);
  }

  /** Get all alerts */
  getAlerts(limit: number = 100): Alert[] {
    return this.alerts.slice(-limit);
  }

  /** Get rules */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }
}

// --- Main Observability Engine ---

export class ObservabilityEngine extends EventEmitter {
  public metrics: MetricRegistry;
  public traces: TraceRegistry;
  public alerts: AlertManager;

  constructor(options?: { maxMetrics?: number; maxSpans?: number; maxAlerts?: number }) {
    super();
    this.metrics = new MetricRegistry(options?.maxMetrics);
    this.traces = new TraceRegistry(options?.maxSpans);
    this.alerts = new AlertManager(options?.maxAlerts);

    // Wire metrics to alert evaluation
    const originalRecord = this.metrics.record.bind(this.metrics);
    this.metrics.record = (name: string, value: number, labels: Record<string, string> = {}) => {
      originalRecord(name, value, labels);
      this.alerts.evaluate(name, value);
    };
  }

  /** Export metrics in Prometheus format */
  exportPrometheus(): string {
    const lines: string[] = [];

    for (const def of this.metrics.getDefinitions()) {
      lines.push(`# HELP ${def.name} ${def.description}`);
      lines.push(`# TYPE ${def.name} ${def.type}`);

      const samples = this.metrics.getSamples(def.name);
      for (const sample of samples) {
        const labelStr = Object.entries(sample.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',');
        const labelPart = labelStr ? `{${labelStr}}` : '';
        lines.push(`${def.name}${labelPart} ${sample.value} ${sample.timestamp}`);
      }
    }

    return lines.join('\n');
  }

  /** Export traces in OTLP-like JSON format */
  exportTraces(): any {
    const traceMap: Record<string, any[]> = {};

    for (const span of this.traces.getRecent(1000)) {
      if (!traceMap[span.traceId]) traceMap[span.traceId] = [];
      traceMap[span.traceId].push({
        trace_id: span.traceId,
        span_id: span.spanId,
        parent_span_id: span.parentSpanId,
        name: span.name,
        service: span.serviceName,
        kind: span.kind,
        start_time: span.startTime,
        end_time: span.endTime,
        duration_ms: span.endTime ? span.endTime - span.startTime : undefined,
        status: span.status,
        attributes: span.attributes,
        events: span.events,
      });
    }

    return { resourceSpans: Object.entries(traceMap).map(([traceId, spans]) => ({ traceId, spans })) };
  }

  /** Get overall health score (0-100) */
  getHealthScore(): number {
    const alerts = this.alerts.getActiveAlerts();
    const criticalAlerts = alerts.filter((a) => a.severity === 'critical').length;
    const warningAlerts = alerts.filter((a) => a.severity === 'warning').length;

    const errorRate = this.traces.getErrors(100).length / Math.max(1, this.traces.getRecent(100).length);

    let score = 100;
    score -= criticalAlerts * 20;
    score -= warningAlerts * 5;
    score -= errorRate * 30;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /** Get comprehensive stats */
  getStats(): {
    metrics: { definitions: number; samples: number };
    traces: { total: number; errors: number; latency: ReturnType<TraceRegistry['getLatencyPercentiles']> };
    alerts: { active: number; total: number; bySeverity: Record<string, number> };
    healthScore: number;
  } {
    const activeAlerts = this.alerts.getActiveAlerts();
    const bySeverity: Record<string, number> = {};
    for (const alert of activeAlerts) {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
    }

    return {
      metrics: {
        definitions: this.metrics.getDefinitions().length,
        samples: this.metrics.getSamples('').length,
      },
      traces: {
        total: this.traces.getRecent().length,
        errors: this.traces.getErrors().length,
        latency: this.traces.getLatencyPercentiles(),
      },
      alerts: {
        active: activeAlerts.length,
        total: this.alerts.getAlerts().length,
        bySeverity,
      },
      healthScore: this.getHealthScore(),
    };
  }
}

export function createObservabilityEngine(options?: { maxMetrics?: number; maxSpans?: number; maxAlerts?: number }): ObservabilityEngine {
  return new ObservabilityEngine(options);
}
