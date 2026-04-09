# Observability Engine

Enterprise observability platform for the Agent Gateway. This module combines metrics collection, distributed tracing, structured alerting, and health scoring into a unified observability system with configurable exporters, latency percentiles, and Prometheus-compatible output.

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Installation and Import](#installation-and-import)
- [API Reference](#api-reference)
  - [Metrics Types](#metrics-types)
    - [MetricSample](#metricsample)
    - [MetricDefinition](#metricdefinition)
    - [MetricRegistry](#metricregistry)
  - [Tracing Types](#tracing-types)
    - [Span](#span)
  - [Alerting Types](#alerting-types)
    - [AlertRule](#alertrule)
    - [Alert](#alert)
    - [AlertManager](#alertmanager)
  - [ObservabilityEngine Class](#observabilityengine-class)
  - [exportPrometheus()](#exportprometheus)
  - [exportTraces()](#exporttraces)
  - [getHealthScore()](#gethealthscore)
  - [getStats()](#getstats)
  - [Factory Function](#factory-function)
- [Metrics Subsystem](#metrics-subsystem)
- [Tracing Subsystem](#tracing-subsystem)
- [Alerting Subsystem](#alerting-subsystem)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Observability Engine vs. Observability](#observability-engine-vs-observability)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Health Score Calculation](#health-score-calculation)
- [Related Documentation](#related-documentation)

## Overview

Observability is the ability to understand the internal state of a system from its external outputs. The `ObservabilityEngine` provides three pillars of observability in a single module:

1. **Metrics:** Counter, gauge, histogram, and summary metrics with label support.
2. **Traces:** Distributed tracing with spans, events, links, and latency percentiles.
3. **Alerts:** Rule-based alerting with duration thresholds, cooldowns, and auto-resolution.

**Key features:**
- **Unified engine:** Metrics, traces, and alerts in a single object with cross-cutting capabilities.
- **Automatic alert evaluation:** Recording a metric value automatically triggers alert rule evaluation.
- **Prometheus export:** Metrics can be exported in Prometheus exposition format.
- **OTLP-like trace export:** Traces can be exported in a JSON format compatible with OTLP consumers.
- **Health score:** A composite health score (0-100) computed from alerts and error rates.
- **Configurable limits:** Maximum samples, spans, and alerts to bound memory usage.

## File Structure

```
/home/runner/workspace/agent-gateway/src/observability-engine/
  index.ts          # Full ObservabilityEngine with Metrics, Tracing, Alerting
  README.md         # This documentation file
```

## Installation and Import

```typescript
import { ObservabilityEngine, createObservabilityEngine } from '../observability-engine/index.js';
// or with the full absolute path:
// import { ObservabilityEngine, createObservabilityEngine } from '/home/runner/workspace/agent-gateway/src/observability-engine/index.js';
```

## API Reference

### Metrics Types

#### MetricSample

```typescript
export interface MetricSample {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}
```

#### MetricDefinition

```typescript
export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  labelNames: string[];
  buckets?: number[];    // For histogram
  quantiles?: number[];  // For summary
}
```

#### MetricRegistry

The internal metrics store.

```typescript
class MetricRegistry {
  register(def: MetricDefinition): void;
  record(name: string, value: number, labels?: Record<string, string>): void;
  increment(name: string, labels?: Record<string, string>, by?: number): void;
  gauge(name: string, value: number, labels?: Record<string, string>): void;
  histogram(name: string, value: number, labels?: Record<string, string>): void;
  getSamples(name: string, limit?: number): MetricSample[];
  getAggregated(name: string): { sum: number; count: number; avg: number; min: number; max: number };
  getDefinitions(): MetricDefinition[];
  clear(): void;
}
```

### Tracing Types

#### Span

```typescript
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
```

The `TraceRegistry` provides span lifecycle management:

```typescript
class TraceRegistry {
  startSpan(name: string, serviceName: string, options?): Span;
  endSpan(spanId: string, status?: Span['status'], attributes?): void;
  addEvent(spanId: string, name: string, attributes?): void;
  addLink(spanId: string, traceId: string, linkedSpanId: string): void;
  getSpan(spanId: string): Span | undefined;
  getTrace(traceId: string): Span[];
  getRecent(limit?: number): Span[];
  getErrors(limit?: number): Span[];
  getLatencyPercentiles(): { p50: number; p90: number; p95: number; p99: number; avg: number };
  clear(): void;
}
```

### Alerting Types

#### AlertRule

```typescript
export interface AlertRule {
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq';
  threshold: number;
  duration: number;       // Duration the condition must hold (ms)
  severity: 'info' | 'warning' | 'critical';
  recipients: string[];
  enabled: boolean;
  lastTriggered?: number;
  cooldownMs: number;     // Min time between alerts
}
```

#### Alert

```typescript
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
```

#### AlertManager

```typescript
class AlertManager extends EventEmitter {
  registerRule(rule: AlertRule): void;
  evaluate(metricName: string, currentValue: number): void;
  getActiveAlerts(): Alert[];
  getAlerts(limit?: number): Alert[];
  getRules(): AlertRule[];
}
```

**Events emitted by AlertManager:**
| Event | Payload | Description |
|-------|---------|-------------|
| `alert:fired` | `Alert` | A new alert was triggered |
| `alert:resolved` | `Alert` | An alert was resolved |
| `alert:notify` | `{ alert, recipient }` | Notification should be sent to recipient |

### ObservabilityEngine Class

The main unified class.

```typescript
export class ObservabilityEngine extends EventEmitter {
  public metrics: MetricRegistry;
  public traces: TraceRegistry;
  public alerts: AlertManager;

  constructor(options?: { maxMetrics?: number; maxSpans?: number; maxAlerts?: number });

  exportPrometheus(): string;
  exportTraces(): any;
  getHealthScore(): number;
  getStats(): {
    metrics: { definitions: number; samples: number };
    traces: { total: number; errors: number; latency: { p50; p90; p95; p99; avg } };
    alerts: { active: number; total: number; bySeverity: Record<string, number> };
    healthScore: number;
  };
}
```

### exportPrometheus()

Exports all metrics in Prometheus exposition format.

**Signature:**
```typescript
exportPrometheus(): string
```

**Returns:** A string in Prometheus format with `# HELP`, `# TYPE`, and metric lines.

### exportTraces()

Exports recent traces in OTLP-like JSON format.

**Signature:**
```typescript
exportTraces(): any
```

**Returns:** A JSON-serializable object with `resourceSpans` array, each containing `traceId` and its spans.

### getHealthScore()

Computes a composite health score from 0 to 100.

**Signature:**
```typescript
getHealthScore(): number
```

**Returns:** Integer from 0 (completely unhealthy) to 100 (fully healthy).

### getStats()

Returns comprehensive stats across all three pillars.

**Signature:**
```typescript
getStats(): {
  metrics: { definitions: number; samples: number };
  traces: { total: number; errors: number; latency: { p50; p90; p95; p99; avg } };
  alerts: { active: number; total: number; bySeverity: Record<string, number> };
  healthScore: number;
}
```

### Factory Function

```typescript
export function createObservabilityEngine(options?: {
  maxMetrics?: number;
  maxSpans?: number;
  maxAlerts?: number;
}): ObservabilityEngine
```

## Metrics Subsystem

The `MetricRegistry` supports four metric types:

| Type | Behavior | Use Case |
|------|----------|----------|
| `counter` | Monotonically increasing (use `increment()`) | Request counts, error counts |
| `gauge` | Point-in-time value (use `gauge()`) | Active connections, memory usage |
| `histogram` | Distribution of values | Response times, payload sizes |
| `summary` | Quantile-based aggregation | P50/P90/P99 latency |

**Recording metrics:**
```typescript
engine.metrics.register({ name: 'http_requests', type: 'counter', description: 'Total HTTP requests', labelNames: ['method', 'path'] });
engine.metrics.increment('http_requests', { method: 'GET', path: '/api/users' });

engine.metrics.register({ name: 'active_connections', type: 'gauge', description: 'Active DB connections', labelNames: [] });
engine.metrics.gauge('active_connections', 15);

engine.metrics.register({ name: 'response_time_ms', type: 'histogram', description: 'Response time', labelNames: ['endpoint'], buckets: [5, 10, 25, 50, 100, 250, 500, 1000] });
engine.metrics.histogram('response_time_ms', 45, { endpoint: '/api/users' });
```

**Aggregation:**
```typescript
const agg = engine.metrics.getAggregated('response_time_ms');
// { sum: 12345, count: 100, avg: 123.45, min: 5, max: 890 }
```

## Tracing Subsystem

**Creating spans:**
```typescript
const span = engine.traces.startSpan('GET /api/users', 'api-gateway', {
  kind: 'server',
  attributes: { 'http.method': 'GET', 'http.url': '/api/users' },
});

try {
  // ... handle request
  engine.traces.endSpan(span.spanId, 'ok', { 'http.status_code': 200 });
} catch (err) {
  engine.traces.endSpan(span.spanId, 'error', { 'error.message': err.message });
  engine.traces.addEvent(span.spanId, 'error', { message: err.message });
}
```

**Distributed tracing:**
```typescript
// Parent span
const parent = engine.traces.startSpan('process-order', 'order-service', {
  kind: 'server',
  traceId: 'trace-123',
});

// Child span
const child = engine.traces.startSpan('charge-payment', 'payment-service', {
  kind: 'client',
  parentSpanId: parent.spanId,
  traceId: parent.traceId,
});
```

**Latency percentiles:**
```typescript
const latency = engine.traces.getLatencyPercentiles();
// { p50: 25, p90: 120, p95: 250, p99: 890, avg: 45 }
```

## Alerting Subsystem

**Registering alert rules:**
```typescript
engine.alerts.registerRule({
  name: 'high-error-rate',
  description: 'Error rate exceeds threshold',
  metric: 'error_count',
  condition: 'gt',
  threshold: 100,
  duration: 60000,   // Must exceed for 1 minute
  severity: 'critical',
  recipients: ['ops-team@example.com'],
  enabled: true,
  cooldownMs: 300000, // 5-minute cooldown between alerts
});

engine.alerts.registerRule({
  name: 'high-latency',
  description: 'P99 latency exceeds 1 second',
  metric: 'response_time_ms',
  condition: 'gt',
  threshold: 1000,
  duration: 120000,   // Must exceed for 2 minutes
  severity: 'warning',
  recipients: ['dev-team@example.com'],
  enabled: true,
  cooldownMs: 600000,
});
```

**Automatic evaluation:**
```typescript
// When you record a metric value, alerts are automatically evaluated
engine.metrics.increment('error_count', { endpoint: '/api/users' });
// This triggers engine.alerts.evaluate('error_count', value) automatically
```

**Checking active alerts:**
```typescript
const activeAlerts = engine.alerts.getActiveAlerts();
for (const alert of activeAlerts) {
  console.log(`[${alert.severity}] ${alert.message}`);
}
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `maxMetrics` | 100,000 | Maximum metric samples stored |
| `maxSpans` | 100,000 | Maximum spans stored |
| `maxAlerts` | 10,000 | Maximum alerts stored |

## Usage Examples

### Express.js Middleware for Metrics and Tracing

```typescript
import express from 'express';
import { createObservabilityEngine } from '/home/runner/workspace/agent-gateway/src/observability-engine/index.js';

const app = express();
const obs = createObservabilityEngine();

// Register metrics
obs.metrics.register({ name: 'http_requests_total', type: 'counter', description: 'Total HTTP requests', labelNames: ['method', 'path', 'status'] });
obs.metrics.register({ name: 'http_request_duration_ms', type: 'histogram', description: 'Request duration', labelNames: ['method', 'path'] });

// Register alert
obs.alerts.registerRule({
  name: 'high-5xx-rate',
  description: 'High rate of 5xx errors',
  metric: 'http_requests_total',
  condition: 'gt',
  threshold: 50,
  duration: 60000,
  severity: 'critical',
  recipients: ['oncall@example.com'],
  enabled: true,
  cooldownMs: 300000,
});

app.use((req, res, next) => {
  const span = obs.traces.startSpan(`${req.method} ${req.path}`, 'api-gateway', {
    kind: 'server',
    attributes: { 'http.method': req.method, 'http.path': req.path },
  });

  res.on('finish', () => {
    const duration = Date.now() - span.startTime;
    obs.traces.endSpan(span.spanId, res.statusCode >= 400 ? 'error' : 'ok', {
      'http.status_code': res.statusCode,
      'http.duration_ms': duration,
    });

    obs.metrics.increment('http_requests_total', { method: req.method, path: req.path, status: String(res.statusCode) });
    obs.metrics.histogram('http_request_duration_ms', duration, { method: req.method, path: req.path });
  });

  next();
});

// Prometheus metrics endpoint
app.get('/metrics', (_req, res) => {
  res.set('Content-Type', 'text/plain');
  res.send(obs.exportPrometheus());
});

// Health endpoint
app.get('/health', (_req, res) => {
  const stats = obs.getStats();
  const health = obs.getHealthScore();
  res.json({ ...stats, healthScore: health, status: health > 50 ? 'healthy' : 'degraded' });
});
```

## Observability Engine vs. Observability

Two observability modules exist with different architectures:

| Aspect | Observability Engine (this module) | Observability (`src/observability/`) |
|--------|-----------------------------------|--------------------------------------|
| Location | `/home/runner/workspace/agent-gateway/src/observability-engine/` | `/home/runner/workspace/agent-gateway/src/observability/` |
| Architecture | Single unified class with MetricRegistry, TraceRegistry, AlertManager | Split across multiple files: `metrics.ts`, `tracing.ts` |
| Metrics | Counter, gauge, histogram, summary with in-memory store | Module-level functions (`recordHttpRequest`, `recordMessage`, etc.) |
| Tracing | Span management with events, links, latency percentiles | `Tracer` class with `trace()` decorator |
| Alerting | Full alerting system with rules, conditions, cooldowns, auto-resolution | No alerting |
| Export | Prometheus format, OTLP-like JSON | Depends on exporters configured separately |
| Health Score | Composite 0-100 score | No health scoring |
| Best for | Unified, all-in-one observability | Modular, file-per-concern approach |

The `src/observability/` module takes a modular approach with separate `metrics.ts` and `tracing.ts` files, each exporting module-level functions and types. The `ObservabilityEngine` (this module) consolidates metrics, tracing, and alerting into a single class with cross-cutting features like automatic alert evaluation on metric recording and composite health scoring.

## Integration Points

| Module | Path | Integration Pattern |
|--------|------|---------------------|
| API Gateway | `/home/runner/workspace/agent-gateway/src/api-gateway/` | Instrument all gateway endpoints with metrics and traces. |
| Health Checker | `/home/runner/workspace/agent-gateway/src/health-checker/` | Use health score as the basis for health check responses. |
| Rate Limit Engine | `/home/runner/workspace/agent-gateway/src/rate-limit-engine/` | Track rate limit denial rates as metrics. |
| Connection Manager | `/home/runner/workspace/agent-gateway/src/connection-manager/` | Track connection pool stats as gauges. |
| Cache Manager | `/home/runner/workspace/agent-gateway/src/cache-manager/` | Track cache hit rates and eviction counts as metrics. |

## Error Handling

- **No exceptions:** The observability engine is designed to never throw. All subsystems handle edge cases gracefully.
- **Sample overflow:** When the number of samples exceeds `maxMetrics` (or spans exceed `maxSpans`), the oldest entries are dropped.
- **Alert evaluation errors:** If an alert rule's condition check fails, the alert is silently skipped.
- **Empty trace export:** If no spans exist, `exportTraces()` returns `{ resourceSpans: [] }`.

## Health Score Calculation

The health score (0-100) is computed as follows:

```
score = 100
score -= critical_alerts * 20   // Each critical alert reduces by 20
score -= warning_alerts * 5     // Each warning alert reduces by 5
score -= error_rate * 30        // Error rate (0-1) reduces by up to 30
score = max(0, min(100, round(score)))
```

**Example:**
- 1 critical alert: -20 points
- 3 warning alerts: -15 points
- 5% error rate: -1.5 points
- Score: 100 - 20 - 15 - 1.5 = 64 (rounded to 64)

## Related Documentation

- [Observability](/home/runner/workspace/agent-gateway/src/observability/README.md) -- Modular observability with separate metrics and tracing files.
- [Health Checker](/home/runner/workspace/agent-gateway/src/health-checker/README.md) -- Service health monitoring.
- [API Gateway](/home/runner/workspace/agent-gateway/src/api-gateway/README.md) -- Gateway-level instrumentation.
- [Request Logger](/home/runner/workspace/agent-gateway/src/request-logger/README.md) -- Structured request logging complementing tracing.
- [Request Tracker](/home/runner/workspace/agent-gateway/src/request-tracker/README.md) -- Individual request lifecycle tracking.
