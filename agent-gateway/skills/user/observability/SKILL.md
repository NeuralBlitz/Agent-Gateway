---
name: observability
description: System observability and monitoring
license: MIT
compatibility: opencode
metadata:
  audience: developer, devops-engineer, sre
  category: devops
---

## What I do

- Design and implement observability strategies
- Build metrics, logging, and tracing pipelines
- Create dashboards for system visibility
- Configure alerting and incident response
- Implement distributed tracing
- Analyze system behavior and performance

## When to use me

- When troubleshooting distributed systems
- When establishing SRE practices
- When implementing SLI/SLO tracking
- When debugging performance issues
- When building production-ready systems
- When needing cross-service visibility

## Key Concepts

### Three Pillars of Observability

1. **Metrics**: Quantitative measurements over time
   - Counters, Gauges, Histograms
   - Aggregable, efficient storage
   
2. **Logs**: Discrete events with context
   - Structured, timestamped
   - Rich context and metadata
   
3. **Traces**: Request paths through systems
   - Distributed request tracking
   - Causal relationships

### OpenTelemetry

```python
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.jaeger.thrift import JaegerExporter

# Setup tracing
provider = TracerProvider()
processor = BatchSpanProcessor(
    JaegerExporter(
        agent_host_name="jaeger",
        agent_port=6831,
    )
)
provider.add_span_processor(processor)
trace.set_tracer_provider(provider)

tracer = trace.get_tracer(__name__)

# Create spans
@tracer.start_as_current_span("process_order")
def process_order(order_id):
    with tracer.start_as_current_span("validate") as span:
        span.set_attribute("order.id", order_id)
        validate_order(order_id)
    
    with tracer.start_as_current_span("charge") as span:
        charge_customer(order_id)
```

### Prometheus Configuration

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

rule_files:
  - "alerts/*.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
      
  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
      - role: node
        
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
```

### Grafana Dashboard

```json
{
  "dashboard": {
    "title": "Service Dashboard",
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
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) by (service) / sum(rate(http_requests_total[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Latency p99",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service))",
            "legendFormat": "p99 {{service}}"
          }
        ]
      }
    ]
  }
}
```

### SLI/SLO Implementation

```yaml
# Service Level Indicators
slis:
  - name: availability
    type: ratio
    description: "Successful requests / Total requests"
    source: prometheus
    query: |
      sum(rate(http_requests_total{status!~"5.."}[5m])) 
      / sum(rate(http_requests_total[5m]))
    
  - name: latency
    type: threshold
    description: "P99 latency"
    source: prometheus
    query: |
      histogram_quantile(0.99, 
        sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
      )

# Service Level Objectives
slo:
  - name: api-availability
    sli: availability
    target: 99.9
    window: 30d
    error_budget:
      alerts:
        - name: ErrorBudgetWarning
          threshold: 0.05
        - name: ErrorBudgetCritical
          threshold: 0.01
```

### Distributed Tracing

```javascript
// Jaeger client integration
const jaegerConfig = {
  serviceName: 'order-service',
  reporter: {
    logSpans: true,
    agentHost: 'jaeger',
    agentPort: 6831,
  },
  sampler: {
    type: 'const',
    param: 1,
  },
};

const tracer = initJaeger(jaegerConfig);

// Add to HTTP requests
app.use((req, res, next) => {
  const span = tracer.startSpan('http-request');
  span.setTag('http.method', req.method);
  span.setTag('http.url', req.url);
  
  res.on('finish', () => {
    span.setTag('http.status_code', res.statusCode);
    span.finish();
  });
  
  next();
});
```

### Key Patterns

- **Red Metrics**: Rate, Errors, Duration
- **USE Method**: Utilization, Saturation, Errors
- **Golden Signals**: Latency, Traffic, Errors, Saturation
- **DORA Metrics**: Deployment Frequency, Lead Time, MTTR, Change Failure Rate
- **RED Metrics**: Rate, Errors, Duration (per service)
