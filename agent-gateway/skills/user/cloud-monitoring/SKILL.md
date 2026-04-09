---
name: cloud-monitoring
description: Cloud infrastructure monitoring and observability
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineer, sre
  category: devops
---

## What I do

- Design comprehensive monitoring strategies for cloud environments
- Implement metrics, logging, and tracing collection
- Create alerting policies and incident response workflows
- Build dashboards for operational visibility
- Configure cloud-native monitoring tools
- Analyze performance trends and anomalies

## When to use me

- When setting up cloud infrastructure monitoring
- When investigating production issues
- When building SRE practices
- When optimizing application performance
- When establishing SLIs and SLOs
- When automating incident detection

## Key Concepts

### Prometheus Metrics

```yaml
# Prometheus deployment on Kubernetes
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    
    scrape_configs:
      - job_name: 'kubernetes-nodes'
        kubernetes_sd_configs:
          - role: node
        relabel_configs:
          - action: labelmap
            regex: __meta_kubernetes_node_label_(.+)
    
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
          - role: pod
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
```

### CloudWatch Dashboard

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "title": "EC2 CPU Utilization",
        "metrics": [
          ["AWS/EC2", "CPUUtilization", "InstanceId", "i-1234567890abcdef0"],
          [".", "Average", "."]
        ],
        "period": 300,
        "stat": "Average"
      }
    },
    {
      "type": "metric",
      "properties": {
        "title": "Lambda Invocations",
        "metrics": [
          ["AWS/Lambda", "Invocations", "FunctionName", "my-function"],
          [".", "Errors", "."]
        ]
      }
    }
  ]
}
```

### Alerting Rules

```yaml
groups:
  - name: kubernetes-alerts
    rules:
      - alert: HighMemoryUsage
        expr: |
          (container_memory_usage_bytes / container_spec_memory_limit_bytes) > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          
      - alert: PodNotReady
        expr: |
          kube_pod_status_ready{condition="true"} == 0
        for: 3m
        labels:
          severity: critical
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} not ready"
```

### Key Metrics to Monitor

**Infrastructure**
- CPU utilization
- Memory usage
- Disk I/O and capacity
- Network throughput
- Instance health

**Application**
- Request latency (p50, p95, p99)
- Error rates
- Throughput (requests/sec)
- Saturation points

**Business**
- Active users
- Transaction volumes
- Revenue metrics
- Feature adoption

### SLI/SLO Design

```yaml
# Service Level Indicators
slis:
  - name: availability
    type: ratio
    description: "Successful requests / Total requests"
    threshold: 0.999  # 99.9%
    
  - name: latency
    type: threshold
    description: "P99 latency"
    threshold: 500  # milliseconds
    
  - name: quality
    type: ratio
    description: "Non-5xx responses / Total"
    threshold: 0.999
```
