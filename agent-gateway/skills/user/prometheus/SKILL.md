---
name: prometheus
description: Prometheus monitoring system for collecting and querying time-series metrics
license: MIT
compatibility: opencode
metadata:
  audience: devops
  category: monitoring
---
## What I do
- Set up Prometheus metrics collection
- Write PromQL queries
- Configure alerting rules
- Use client libraries
- Set up service discovery
- Create Grafana dashboards
- Handle metric cardinality

## When to use me
When monitoring applications and infrastructure metrics.

## Configuration
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'myapp'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['app:8080']
```

## Metrics Types
```go
import "github.com/prometheus/client_golang/prometheus"

var (
    // Counter - only increases
    requestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total HTTP requests",
        },
        []string{"method", "status"},
    )
    
    // Gauge - can go up and down
    temperature = prometheus.NewGauge(
        prometheus.GaugeOpts{
            Name: "room_temperature_celsius",
            Help: "Current room temperature",
        },
    )
    
    // Histogram - distributions
    requestDuration = prometheus.NewHistogram(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Buckets: []float64{.005, .01, .025, .05, .1, .25, .5, 1, 2.5, 5},
        },
    )
    
    // Summary - percentiles
    responseSize = prometheus.NewSummary(
        prometheus.SummaryOpts{
            Name: "http_response_size_bytes",
            Objectives: map[float64]float64{0.5: 0.05, 0.95: 0.05, 0.99: 0.01},
        },
    )
)

func init() {
    prometheus.MustRegister(requestsTotal, temperature, requestDuration)
}
```

## PromQL Queries
```promql
# Rate - per second increase
rate(http_requests_total[5m])

# Increase over time window
increase(http_requests_total[1h])

# Average over time
avg(http_request_duration_seconds)

# Percentiles
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# Count over time
count(http_requests_total{status="200"})

# Sum by label
sum by (method) (http_requests_total)

# Top queries
topk(10, http_requests_total)

# Subqueries
max_over_time(http_requests_total[1h:5m])
```

## Alerting Rules
```yaml
groups:
  - name: example
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.method }}"
          
      - alert: InstanceDown
        expr: up == 0
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Instance {{ $labels.instance }} down"
```

## Python Client
```python
from prometheus_client import Counter, Gauge, Histogram, start_http_server

REQUEST_COUNT = Counter('http_requests_total', 'Total HTTP requests', ['method', 'status'])
ACTIVE_USERS = Gauge('active_users', 'Number of active users')
REQUEST_LATENCY = Histogram('http_request_latency_seconds', 'Request latency')

@app.route('/api')
def handle_request():
    with REQUEST_LATENCY.time():
        # process request
        REQUEST_COUNT.labels(method='GET', status='200').inc()
        return 'OK'

if __name__ == '__main__':
    start_http_server(8000)
```
