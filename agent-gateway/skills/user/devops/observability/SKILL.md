---
name: observability
description: Comprehensive system understanding through metrics, logs, traces, and alerts for debugging and monitoring
category: devops
---

# Observability

## What I Do

I provide comprehensive visibility into complex systems by collecting, correlating, and analyzing metrics, logs, and traces. I enable teams to understand system behavior, diagnose issues, and maintain confidence in their infrastructure.

## When to Use Me

- Debugging distributed systems
- Understanding system behavior in production
- Proactive monitoring and alerting
- Performance optimization
- Incident investigation and resolution
- Capacity planning
- Service level management

## Core Concepts

- **Metrics**: Quantitative measurements over time
- **Logs**: Discrete event records
- **Traces**: End-to-end request tracking
- **Dashboards**: Visual aggregations of data
- **Alerts**: Notifications when conditions are met
- **MELT**: Metrics, Events, Logs, Traces
- **Service Level Indicators (SLIs)**: Reliability measurements
- **Service Level Objectives (SLOs)**: Target reliability levels
- **OpenTelemetry**: Standard for telemetry data
- **Distributed Tracing**: Tracking across service boundaries

## Code Examples

**OpenTelemetry Configuration (YAML):**
```yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318
  
  prometheus:
    config:
      scrape_configs:
      - job_name: 'otel-collector'
        scrape_interval: 10s
        static_configs:
        - targets: ['localhost:8888']

processors:
  batch:
    timeout: 1s
    send_batch_size: 1024
  
  memory_limiter:
    check_interval: 1s
    limit_mib: 1000
    spike_limit_mib: 200
  
  resource:
    attributes:
    - key: service.name
      value: my-service
      action: upsert
    - key: deployment.environment
      value: production
      action: upsert

exporters:
  prometheusremotewrite:
    endpoint: https://prometheus.example.com/api/v1/write
    tls:
      insecure: false
  
  jaeger:
    endpoint: jaeger-collector:14250
    tls:
      insecure: true
  
  loki:
    endpoint: https://loki.example.com/loki/api/v1/push
    tls:
      insecure: false

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [jaeger]
    metrics:
      receivers: [prometheus, otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheusremotewrite]
    logs:
      receivers: [otlp]
      processors: [resource]
      exporters: [loki]
```

**Prometheus Metrics (Python):**
```python
from prometheus_client import Counter, Histogram, Gauge, Summary
from prometheus_client import start_http_server, REGISTRY
import time
import random

# Custom metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

ACTIVE_USERS = Gauge(
    'active_users',
    'Number of currently active users',
    ['region']
)

QUEUE_SIZE = Gauge(
    'job_queue_size',
    'Size of job processing queue',
    ['worker_group']
)

BUSINESS_METRICS = Summary(
    'orders_processed',
    'Number of orders processed',
    ['product_type']
)

class MetricsMiddleware:
    def __init__(self, app):
        self.app = app
    
    def __call__(self, environ, start_response):
        start_time = time.time()
        
        def start_response_wrapper(status, headers):
            response = self.app(environ, start_response)
            duration = time.time() - start_time
            
            method = environ.get('REQUEST_METHOD', 'UNKNOWN')
            path = environ.get('PATH_INFO', '/')
            status_code = int(status.split()[0])
            
            REQUEST_COUNT.labels(
                method=method,
                endpoint=path,
                status=status_code
            ).inc()
            
            REQUEST_LATENCY.labels(
                method=method,
                endpoint=path
            ).observe(duration)
            
            return response
        
        return self.app(environ, start_response_wrapper)

# Start metrics server
start_http_server(8000)
```

**Structured Logging (JSON):**
```json
{
  "level": "INFO",
  "timestamp": "2024-01-15T10:30:00.123Z",
  "service": "payment-api",
  "version": "2.3.1",
  "environment": "production",
  "trace_id": "00-1234567890abcdef-1234567890abcdef-01",
  "span_id": "1234567890abcdef",
  "event": "payment_processed",
  "user_id": "usr_12345",
  "order_id": "ord_67890",
  "amount": 99.99,
  "currency": "USD",
  "payment_method": "credit_card",
  "duration_ms": 245,
  "status": "success",
  "metadata": {
    "processor": "stripe",
    "processor_transaction_id": "tx_abc123",
    "retry_count": 0
  },
  "message": "Payment processed successfully for order ord_67890"
}
```

**Grafana Dashboard (JSON):**
```json
{
  "dashboard": {
    "title": "Service Health Overview",
    "tags": ["production", "health"],
    "timezone": "browser",
    "refresh": "30s",
    
    "panels": [
      {
        "id": 1,
        "title": "Request Rate (RPM)",
        "type": "graph",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0},
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{service=~\"$service\"}[5m])) by (endpoint)",
            "legendFormat": "{{ endpoint }}"
          }
        ],
        "alert": {
          "name": "HighRequestRate",
          "conditions": [
            {
              "evaluator": {
                "params": [10000],
                "type": "gt"
              }
            }
          ],
          "executionErrorState": "alerting",
          "frequency": "1m"
        }
      },
      {
        "id": 2,
        "title": "Error Rate (%)",
        "type": "gauge",
        "gridPos": {"h": 8, "w": 6, "x": 12, "y": 0},
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\",service=~\"$service\"}[5m])) / sum(rate(http_requests_total{service=~\"$service\"}[5m])) * 100"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "max": 5,
            "thresholds": [
              {"color": "green", "value": null},
              {"color": "yellow", "value": 1},
              {"color": "red", "value": 3}
            ]
          }
        }
      },
      {
        "id": 3,
        "title": "P95 Latency (ms)",
        "type": "timeseries",
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 8},
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=~\"$service\"}[5m])) by (le)) * 1000",
            "legendFormat": "P95"
          },
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service=~\"$service\"}[5m])) by (le)) * 1000",
            "legendFormat": "P99"
          }
        ]
      },
      {
        "id": 4,
        "title": "Active Traces",
        "type": "stat",
        "gridPos": {"h": 4, "w": 6, "x": 12, "y": 8},
        "targets": [
          {
            "expr": "sum(traces_spanmetrics_calls_total{service=~\"$service\"})"
          }
        ]
      }
    ],
    
    "templating": {
      "list": [
        {
          "name": "service",
          "type": "query",
          "datasource": "Prometheus",
          "query": "label_values(http_requests_total, service)",
          "refresh": 2
        }
      ]
    }
  }
}
```

## Best Practices

1. **Implement structured logging** - JSON format with consistent fields
2. **Use OpenTelemetry** - Vendor-neutral instrumentation
3. **Correlate metrics, logs, traces** - Understand the full picture
4. **Define SLOs and alert on them** - Measure user-impacting issues
5. **Create golden signals dashboards** - Latency, traffic, errors, saturation
6. **Retain data strategically** - Hot, warm, cold storage tiers
7. **Use sampling for traces** - Manage volume while maintaining visibility
8. **Label everything consistently** - Service, environment, region, team
9. **Test your alerts** - Don't discover issues during incidents
10. **Automate remediation** - Self-healing for known failure modes
