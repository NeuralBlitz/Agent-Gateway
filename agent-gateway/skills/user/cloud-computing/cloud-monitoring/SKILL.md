---
name: cloud-monitoring
description: Comprehensive observability and monitoring practices for cloud infrastructure and applications
category: cloud-computing
---

# Cloud Monitoring

## What I Do

I provide comprehensive visibility into cloud infrastructure and applications through metrics collection, log aggregation, distributed tracing, and alerting. I enable teams to understand system behavior, detect anomalies, and maintain service reliability.

## When to Use Me

- Monitoring production systems and infrastructure
- Troubleshooting application issues
- Setting up alerting and on-call procedures
- Implementing SLOs and SLIs
- Analyzing system performance
- Distributed systems observability
- Compliance and audit requirements

## Core Concepts

- **Metrics**: Quantitative measurements (CPU, latency, error rates)
- **Logs**: Textual records of events and errors
- **Traces**: End-to-end request tracking across services
- **Service Level Indicators (SLIs)**: Metrics measuring service behavior
- **Service Level Objectives (SLOs)**: Target reliability thresholds
- **Error Budgets**: Allowed unreliability before action required
- **Dashboards**: Visual representation of metrics and status
- **Alerting**: Notifications when thresholds are breached
- **Synthetic Monitoring**: Proactive testing from external locations
- **Distributed Tracing**: Tracking requests across service boundaries

## Code Examples

**Prometheus Configuration (YAML):**
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
  - static_configs:
    - targets: ['alertmanager:9093']

rule_files:
  - '/etc/prometheus/rules/*.yml'

scrape_configs:
  - job_name: 'kubernetes-nodes'
    kubernetes_sd_configs:
    - role: node
    relabel_configs:
    - source_labels: [__address__]
      regex: '(.*):10250'
      target_label: __address__
      replacement: '${1}:9100'

  - job_name: 'kubernetes-services'
    kubernetes_sd_configs:
    - role: service
    metrics_path: /metrics
    relabel_configs:
    - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
      action: keep
      regex: true
---
# rules/high-availability.yml
groups:
- name: ha-alerts
  rules:
  - alert: HighErrorRate
    expr: |
      sum(rate(http_requests_total{status=~"5.."}[5m])) 
      / sum(rate(http_requests_total[5m])) > 0.05
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "{{ $labels.service }} error rate is {{ $value | humanizePercentage }}"
      
  - alert: HighLatency
    expr: |
      histogram_quantile(0.99, 
        sum(rate(http_request_duration_seconds_bucket[5m])) by (le, service)
      ) > 2
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "High latency detected"
      description: "99th percentile latency for {{ $labels.service }} is {{ $value }}s"
```

**Grafana Dashboard (JSON):**
```json
{
  "dashboard": {
    "title": "Application Performance Overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{service=~\"$service\"}[5m])) by (method)",
            "legendFormat": "{{ method }}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 0, "y": 0}
      },
      {
        "title": "Error Rate by Status",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{service=~\"$service\", status=~\"5..\"}[5m])) by (status)",
            "legendFormat": "{{ status }}"
          }
        ],
        "gridPos": {"h": 8, "w": 12, "x": 12, "y": 0}
      },
      {
        "title": "P99 Latency",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{service=~\"$service\"}[5m])) by (le))",
            "legendFormat": "P99"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{service=~\"$service\"}[5m])) by (le))",
            "legendFormat": "P95"
          }
        ],
        "gridPos": {"h": 8, "w": 24, "x": 0, "y": 8}
      }
    ]
  },
  "templating": {
    "list": [
      {
        "name": "service",
        "type": "query",
        "datasource": "Prometheus",
        "query": "label_values(http_requests_total, service)"
      }
    ]
  }
}
```

**OpenTelemetry Collector (YAML):**
```yaml
receivers:
  otlp:
    protocols:
      grpc:
      http:
  prometheus:
    config:
      scrape_configs:
      - job_name: 'otel-collector'
        scrape_interval: 10s
        static_configs:
        - targets: ['0.0.0.0:8888']

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
    - key: deployment.environment
      value: production
      action: upsert

exporters:
  prometheusremotewrite:
    endpoint: "https://prometheus-remote-write.example.com/api/v1/write"
    tls:
      insecure: false
  
  otlp:
    endpoint: "jaeger-collector:4317"
    tls:
      insecure: false
  
  logging:
    loglevel: info

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch, resource]
      exporters: [otlp, logging]
    metrics:
      receivers: [prometheus, otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheusremotewrite, logging]
    logs:
      receivers: [otlp]
      processors: [resource]
      exporters: [logging]
```

## Best Practices

1. **Define SLIs and SLOs early** - Measure what matters for your users
2. **Use structured logging** - JSON format with consistent fields
3. **Implement distributed tracing** - Essential for microservices
4. **Create runbooks for alerts** - Don't page without action plans
5. **Avoid alert fatigue** - Tune thresholds, consolidate similar alerts
6. **Use Golden Signals** - Latency, traffic, errors, saturation
7. **Monitor from multiple angles** - Synthetic + real user monitoring
8. **Retain data appropriately** - Hot, warm, cold storage tiers
9. **Test alerting regularly** - Don't discover failures during incidents
10. **Automate remediation** - Self-healing for known failure modes
