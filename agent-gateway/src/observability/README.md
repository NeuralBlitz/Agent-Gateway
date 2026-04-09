# Observability (`src/observability/`)

> **Prometheus metrics + distributed tracing — production-grade visibility into gateway operations.**

---

## Overview

The `observability/` module provides two key capabilities for monitoring and debugging Agent Gateway:

1. **Metrics** (`metrics.ts`): Prometheus metrics for quantitative monitoring — request rates, latencies, token usage, error counts, and more.
2. **Tracing** (`tracing.ts`): Lightweight distributed tracing for request flow visibility — spans, events, and error tracking.

Together, these provide the observability foundation needed to operate Agent Gateway reliably in production.

---

## File Structure

```
observability/
├── metrics.ts    # Prometheus metrics + Express middleware
└── tracing.ts    # In-memory span tracing
```

---

## Metrics (`metrics.ts`)

### Prometheus Integration

The module uses `prom-client` to register and expose Prometheus metrics. Prometheus is the industry-standard monitoring system, originally built at SoundCloud and now a CNCF project.

### Registered Metrics

#### HTTP Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | `method`, `path`, `status` | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | `method`, `path` | Request latency distribution |

#### Message Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `messages_total` | Counter | `channel` | Total messages processed by channel |
| `api_calls_total` | Counter | `provider` | Total API calls to AI providers |
| `tokens_used_total` | Counter | `provider`, `type` | Token usage (input/output) |
| `active_sessions` | Gauge | — | Currently active conversation sessions |

#### Cache Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `cache_hits_total` | Counter | — | Cache hit count |
| `cache_misses_total` | Counter | — | Cache miss count |

#### Tool Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `tool_executions_total` | Counter | `tool` | Tool calls by name |
| `tool_execution_duration_seconds` | Histogram | `tool` | Tool execution latency |

#### Error Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `errors_total` | Counter | `type`, `phase` | Error count by type and phase |

#### System Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `uptime_seconds` | Gauge | — | Server uptime in seconds |
| `nodejs_*` | Various | — | Automatic Node.js process metrics |

### Metrics Middleware

Express middleware that records metrics for every HTTP request:

```typescript
const metricsMiddleware = createMetricsMiddleware();

app.use(metricsMiddleware);
```

The middleware:
1. Records request start time
2. After response, records duration in the histogram
3. Increments the request counter with method, path, and status labels

### Recording Helpers

```typescript
// Record a message processed
recordMessage('telegram');

// Record an API call
recordApiCall('openai', { promptTokens: 25, completionTokens: 10 });

// Record tool execution
recordToolExecution('bash', { duration: 150 });

// Record an error
recordError('provider_error', 'beforeResponse');

// Update active sessions gauge
setActiveSessions(42);
```

### Metrics Endpoint

Metrics are exposed at `GET /metrics` in Prometheus scrape format:

```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",path="/health",status="200"} 1523

# HELP http_request_duration_seconds HTTP request duration in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="POST",path="/api/send",le="0.1"} 800
http_request_duration_seconds_bucket{method="POST",path="/api/send",le="0.5"} 950
http_request_duration_seconds_bucket{method="POST",path="/api/send",le="1"} 990
http_request_duration_seconds_bucket{method="POST",path="/api/send",le="+Inf"} 1000

# HELP messages_total Total messages processed
# TYPE messages_total counter
messages_total{channel="telegram"} 5432
messages_total{channel="discord"} 2100

# HELP uptime_seconds Server uptime in seconds
# TYPE uptime_seconds gauge
uptime_seconds 86400
```

### Prometheus Configuration

To scrape the gateway metrics, add this to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'agent-gateway'
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Grafana Dashboard

Metrics can be visualized in Grafana. Key panels to create:

1. **Request Rate**: `rate(http_requests_total[5m])` by path
2. **Latency**: `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))`
3. **Message Rate**: `rate(messages_total[5m])` by channel
4. **Token Usage**: `rate(tokens_used_total[5m])` by provider
5. **Error Rate**: `rate(errors_total[5m])` by type
6. **Cache Hit Ratio**: `rate(cache_hits_total[5m]) / (rate(cache_hits_total[5m]) + rate(cache_misses_total[5m]))`
7. **Active Sessions**: `active_sessions` over time
8. **Uptime**: `uptime_seconds`

---

## Tracing (`tracing.ts`)

### Tracer Class

Lightweight in-memory distributed tracing for request flow visibility.

```typescript
class Tracer {
  private spans: Span[] = [];
  private maxSpans = 1000;

  /** Start a new span */
  startSpan(name: string, parentId?: string): Span;

  /** End a span with optional status */
  endSpan(spanId: string, status?: 'ok' | 'error', error?: Error): void;

  /** Add an event to a span */
  addEvent(spanId: string, name: string, attributes?: object): void;

  /** Get recent spans */
  getRecentSpans(limit?: number): Span[];

  /** Get error spans */
  getErrorSpans(): Span[];

  /** Export all spans (for API endpoint) */
  exportSpans(): Span[];
}
```

### Span Structure

```typescript
interface Span {
  id: string;              // Unique span ID (UUID)
  name: string;            // Operation name
  parentId?: string;       // Parent span ID (for nesting)
  startTime: number;       // Milliseconds since epoch
  endTime?: number;        // When the span ended
  status: 'ok' | 'error' | 'in_progress';
  events: SpanEvent[];     // Timeline events within the span
  attributes: object;      // Key-value metadata
  error?: {                // Error details if status is 'error'
    message: string;
    stack?: string;
  };
}

interface SpanEvent {
  name: string;
  timestamp: number;
  attributes?: object;
}
```

### `trace()` Helper

The `trace()` function wraps async functions with automatic span management:

```typescript
async function processMessage(message: ChannelMessage) {
  return await trace('processMessage', async (span) => {
    span.addEvent('message received', { userId: message.from.id });

    const response = await trace('agent.run', async (agentSpan) => {
      agentSpan.addEvent('calling provider');
      const result = await agent.run(message);
      agentSpan.addEvent('provider returned', { contentLength: result.content.length });
      return result;
    });

    span.addEvent('response sent', { contentLength: response.content.length });
    return response;
  });
}
```

### Traced Operations

The gateway creates spans for:

| Span Name | Description | Child Spans |
|-----------|-------------|-------------|
| `processMessage` | Full message processing | `session.lookup`, `agent.run`, `channel.send` |
| `agent.run` | Agent tool-calling loop | `provider.chat`, `tool.execute` (per tool) |
| `provider.chat` | Provider API call | — |
| `provider.chatWithTools` | Provider API call with tools | — |
| `tool.execute` | Tool execution | — |
| `session.save` | Session persistence | — |
| `hook.fire` | Hook handler execution | — |

### Viewing Traces

Traces are available at `GET /api/traces`:

```json
{
  "traces": [
    {
      "id": "span-abc123",
      "name": "processMessage",
      "startTime": 1704067200000,
      "endTime": 1704067205000,
      "duration": 5000,
      "status": "ok",
      "attributes": { "channel": "telegram", "userId": "123" },
      "events": [
        { "name": "message received", "timestamp": 1704067200000 },
        { "name": "response sent", "timestamp": 1704067205000 }
      ]
    }
  ]
}
```

Query parameters:
- `limit` — Number of traces (default: 50)
- `errors` — Filter to errors only (`true`/`false`)

### Error Spans

When an operation fails:
1. The span status is set to `error`
2. The error message and stack are recorded
3. The span is retrievable via `getErrorSpans()`

### Trace Context Propagation

For distributed tracing across services, the tracer supports W3C Trace Context headers:
- `traceparent`: Propagates trace ID across service boundaries
- `tracestate`: Vendor-specific trace data

Currently, the tracer generates independent trace IDs per request. Full distributed tracing would require exporting spans to a central collector (Jaeger, Zipkin, Tempo).

---

## Integration with External Systems

### Grafana Loki (Logs)

Combine metrics and traces with structured logs from `pino` for a complete observability stack. Use trace IDs in log messages to correlate logs with traces.

### OpenTelemetry Export

For production-grade tracing, consider exporting spans via OpenTelemetry Protocol (OTLP) to:
- **Jaeger**: Open-source distributed tracing
- **Zipkin**: Twitter's tracing system
- **Grafana Tempo**: Grafana Labs tracing backend
- **Datadog APM**: Commercial APM

### Alerting

Prometheus AlertManager rules for common alerts:

```yaml
groups:
  - name: agent-gateway
    rules:
      - alert: HighErrorRate
        expr: rate(errors_total[5m]) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate in Agent Gateway"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 5
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency above 5 seconds"

      - alert: ProviderDown
        expr: rate(api_calls_total[5m]) == 0
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "No API calls to provider in 10 minutes"
```

---

## Performance Impact

The observability module is designed for minimal overhead:

| Component | Overhead | Notes |
|-----------|----------|-------|
| Prometheus metrics | < 1ms per request | In-memory counters/histograms |
| Tracing | < 2ms per span | In-memory span storage |
| Metrics endpoint | ~10ms | Text serialization |
| Traces endpoint | ~20ms | JSON serialization |

For high-throughput deployments, consider:
- Sampling traces (e.g., 10% of requests)
- Exporting metrics to remote Prometheus
- Capping `maxSpans` to limit memory usage

---

## Related Documentation

- [`server/`](../server/README.md) — Where metrics middleware is applied
- [`infra/logger.ts`](../infra/README.md) — Structured logging (complements metrics)
- [`cache/`](../cache/README.md) — Cache metrics are recorded here
- [`ratelimit/`](../ratelimit/README.md) — Rate limit metrics are recorded here
