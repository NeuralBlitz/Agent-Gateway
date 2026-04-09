---
name: metrics
description: System metrics collection and analysis
license: MIT
compatibility: opencode
metadata:
  audience: developer, devops-engineer, sre
  category: devops
---

## What I do

- Design and implement metrics collection systems
- Create custom metrics for applications
- Build dashboards and visualizations
- Configure alerting based on metrics
- Analyze trends and anomalies
- Implement SLI measurements

## When to use me

- When building observability systems
- When monitoring application health
- When setting up alerting
- When measuring SLAs and SLOs
- When analyzing performance
- When creating operational dashboards

## Key Concepts

### Metric Types

| Type | Description | Examples |
|------|-------------|----------|
| **Counter** | Monotonically increasing | requests_total, errors_total |
| **Gauge** | Point-in-time value | cpu_usage, memory_used |
| **Histogram** | Distribution of values | request_duration, response_size |
| **Summary** | Quantiles and sum | request_latency |

### Prometheus Metrics

```python
from prometheus_client import Counter, Gauge, Histogram, Summary

# Counter - monotonically increasing
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

# Gauge - current value
cpu_usage = Gauge(
    'cpu_usage_percent',
    'CPU usage percentage',
    ['instance']
)

# Histogram - distribution
request_duration = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint'],
    buckets=[0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

# Summary - quantiles
response_size = Summary(
    'http_response_size_bytes',
    'Response size in bytes',
    ['endpoint'],
    quantiles=[0.5, 0.9, 0.99]
)

# Using metrics
@app.route('/api/users')
def get_users():
    start = time.time()
    users = fetch_users()
    http_requests_total.labels(method='GET', endpoint='/api/users', status='200').inc()
    request_duration.labels(method='GET', endpoint='/api/users').observe(time.time() - start)
    return users
```

### Custom Metrics

```python
# Business metrics
class BusinessMetrics:
    def __init__(self):
        self.orders_placed = Counter('orders_placed_total', 'Total orders')
        self.order_value = Histogram('order_value_dollars', 'Order value')
        self.active_users = Gauge('active_users', 'Active users')
        self.checkout_duration = Histogram('checkout_duration_seconds', 'Checkout duration')
        
    def record_order(self, order):
        self.orders_placed.inc()
        self.order_value.observe(order.total)
        
    def set_active_users(self, count):
        self.active_users.set(count)
        
    def record_checkout(self, duration):
        self.checkout_duration.observe(duration)
```

### Grafana Dashboard

```json
{
  "title": "Service Metrics",
  "panels": [
    {
      "title": "Request Rate",
      "type": "graph",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total[5m])) by (service)",
          "legendFormat": "{{service}}"
        }
      ]
    },
    {
      "title": "Error Rate",
      "type": "graph",
      "targets": [
        {
          "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service) * 100",
          "legendFormat": "{{service}} %"
        }
      ]
    },
    {
      "title": "P99 Latency",
      "type": "graph",
      "targets": [
        {
          "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)) * 1000",
          "legendFormat": "p99 {{service}}"
        }
      ]
    },
    {
      "title": "Saturation",
      "type": "gauge",
      "targets": [
        {
          "expr": "container_memory_usage_bytes / container_spec_memory_limit_bytes * 100",
          "legendFormat": "Memory"
        }
      ]
    }
  ]
}
```

### Metric Labeling Best Practices

```python
# Good: Meaningful labels
http_requests = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'path', 'status']  # Specific labels
)

# Avoid: High cardinality labels
http_requests_bad = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['user_id', 'session_id']  # Too many unique values
)

# Cardinality guidelines
# - Static values: OK
# - Known set (status codes): OK
# - User IDs, timestamps: Avoid
# - URL paths (with limits): Use recording rules
```

### Recording Rules

```yaml
groups:
  - name: service_aggregation
    interval: 30s
    rules:
      # Aggregate HTTP metrics
      - record: service:http_requests:rate5m
        expr: sum(rate(http_requests_total[5m])) by (service, status)
        
      - record: service:http_errors:rate5m
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) by (service)
        
      - record: service:http_latency:p99
        expr: histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))
        
      - record: service:cpu_usage:avg
        expr: avg(node_cpu_usage_seconds_total) by (service)
```

### Metrics Exporters

```yaml
# Node Exporter
node_exporter:
  enabled: true
  
# Blackbox Exporter
blackbox_exporter:
  enabled: true
  modules:
    http_2xx:
      prober: http
      timeout: 5s

# AWS CloudWatch Exporter
cloudwatch:
  region: us-east-1
  period: 60
  metrics:
    - name: CPUUtilization
      statistics:
        - Average
      dimensions:
        - name: InstanceId
          value: ${AWS::InstanceId}
```

### Key Metrics Categories

- **Red Metrics**: Rate, Errors, Duration
- **Golden Signals**: Latency, Traffic, Errors, Saturation
- **USE Method**: Utilization, Saturation, Errors
- **DORA**: Deployment Frequency, Lead Time, MTTR, Change Failure Rate
- **Business Metrics**: Revenue, Conversion, Active Users
