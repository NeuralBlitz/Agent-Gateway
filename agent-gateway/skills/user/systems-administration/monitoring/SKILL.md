---
name: monitoring
description: System monitoring and observability implementation using Prometheus, Grafana, and related tools
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineers
  category: systems-administration
---

## What I do
- Configure Prometheus metrics collection
- Create Grafana dashboards
- Set up alerting rules and notifications
- Monitor application and infrastructure metrics
- Implement distributed tracing
- Configure log aggregation
- Design observability strategies
- Create SLOs and SLIs
- Analyze performance bottlenecks
- Debug production issues using metrics

## When to use me
When setting up monitoring systems, creating dashboards, configuring alerts, or troubleshooting performance issues.

## Core Concepts
- Prometheus metrics types (counter, gauge, histogram, summary)
- Service discovery and scraping configurations
- PromQL query language
- Grafana visualization and alerting
- Alertmanager routing and silencing
- Kubernetes metrics (kube-state-metrics, node-exporter)
- Application performance monitoring (APM)
- Distributed tracing (Jaeger, Zipkin)
- Log aggregation (ELK, Loki)
- SLO/SLI/Error budget design

## Code Examples

### Prometheus Configuration
```yaml
# prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'prod-us-east-1'
    env: 'production'

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093
      timeout: 10s
      api_version: v2

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  # Prometheus self-monitoring
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Node Exporter for hardware/OS metrics
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        regex: '(.+):\\d+'
        replacement: '${1}'

  # Kubernetes service discovery
  - job_name: 'kubernetes-service-endpoints'
    kubernetes_sd_configs:
      - role: endpoints
    relabel_configs:
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_service_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)
      - source_labels: [__address__, __meta_kubernetes_service_annotation_prometheus_io_port]
        action: replace
        target_label: __address__
        regex: ([^:]+)(?::\\d+)?;(\\d+)
        replacement: ${1}:${2}

  # Kubernetes pods
  - job_name: 'kubernetes-pods'
    kubernetes_sd_configs:
      - role: pod
    relabel_configs:
      - action: keep
        source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
```

```yaml
# prometheus-rules.yml
groups:
  - name: default-alerts
    rules:
      # High CPU usage
      - alert: HighCPUUsage
        expr: |
          sum(rate(container_cpu_usage_seconds_total{namespace!="kube-system"}[5m]))
          /
          sum(machine_cpu_cores) > 0.85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage on {{ $labels.node }}"
          description: "CPU usage is above 85% for more than 5 minutes"
      
      # High memory usage
      - alert: HighMemoryUsage
        expr: |
          (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) > 0.90
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage on {{ $labels.instance }}"
          description: "Memory usage is above 90% for more than 5 minutes"
      
      # Disk space low
      - alert: LowDiskSpace
        expr: |
          (1 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"})) > 0.85
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "Low disk space on {{ $labels.instance }}"
          description: "Disk usage is above 85% on {{ $labels.mountpoint }}"
      
      # Pod not ready
      - alert: PodNotReady
        expr: |
          kube_pod_status_ready{namespace!="kube-system",condition="true"} == 0
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} not ready"
          description: "Pod has been not ready for more than 3 minutes"
      
      # Pod crashing
      - alert: PodCrashing
        expr: |
          increase(kube_pod_container_status_restarts_total[1h]) > 3
        labels:
          severity: critical
        annotations:
          summary: "Pod {{ $labels.namespace }}/{{ $labels.pod }} is crashing"
          description: "Container restarted more than 3 times in the last hour"
      
      # High error rate
      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{status=~"5.."}[5m])) 
          / 
          sum(rate(http_requests_total[5m])) > 0.05
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High HTTP error rate"
          description: "More than 5% of requests are returning 5xx errors"

  - name: sli-metrics
    rules:
      # Availability SLI (99.9%)
      - record: service:http_requests:ratio5m
        expr: |
          sum(rate(http_requests_total{handler!~"/health|/metrics"}[5m])) 
          / 
          sum(rate(http_requests_total{handler!~"/health|/metrics"}[5m]))
      
      # Latency SLI (p99 < 500ms)
      - record: service:http_request_duration_seconds:p99
        expr: |
          histogram_quantile(0.99, 
            sum(rate(http_request_duration_seconds_bucket{handler!~"/health|/metrics"}[5m])) by (le))
```

### AlertManager Configuration
```yaml
# alertmanager.yml
global:
  resolve_timeout: 5m
  smtp_smarthost: 'smtp.example.com:587'
  smtp_from: 'alertmanager@example.com'
  smtp_auth_username: 'alertmanager'
  smtp_auth_password: '${SMTP_PASSWORD}'

route:
  group_by: ['alertname', 'severity']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'default'
  routes:
    - match:
        severity: critical
      receiver: 'critical-pager'
      continue: true
    - match:
        severity: warning
      receiver: 'warning-slack'
      continue: true
    - match_re:
        alertname: '.*Info'
      receiver: 'informational'
      group_interval: 15m

receivers:
  - name: 'default'
    email_configs:
      - to: 'team@example.com'
        send_resolved: true
        html: |
          {{ define "email.default.html" }}
          <!DOCTYPE html>
          <html>
          <body>
            <h2>{{ .Status }} - {{ .GroupLabels.alertname }}</h2>
            {{ range .Alerts }}
              <p><strong>{{ .Labels.severity | upper }}</strong></p>
              <p>{{ .Annotations.summary }}</p>
              <pre>{{ .Annotations.description }}</pre>
            {{ end }}
          </body>
          </html>
          {{ end }}
          {{ template "email.default.html" . }}
    
  - name: 'critical-pager'
    pagerduty_configs:
      - service_key: '${PAGERDUTY_SERVICE_KEY}'
        severity: critical
    
  - name: 'warning-slack'
    slack_configs:
      - channel: '#alerts-warning'
        api_url: '${SLACK_WEBHOOK_URL}'
        title: '{{ range .Alerts }}{{ .Labels.alertname }} {{ end }}'
        text: '{{ range .Alerts }}{{ .Annotations.summary }} {{ end }}'
        severity: '{{ .Labels.severity }}'
        color: '{{ if eq .Labels.severity "critical" }}danger{{ else }}warning{{ end }}'

inhibit_rules:
  - source_match:
      severity: 'critical'
    target_match:
      severity: 'warning'
    equal: ['alertname', 'instance']
```

### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Application Overview",
    "uid": "app-overview",
    "tags": ["application", "overview"],
    "timezone": "browser",
    "refresh": "30s",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "sum(rate(http_requests_total[5m])) by (method, status)",
            "legendFormat": "{{method}} {{status}}"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "stat",
        "gridPos": {"x": 12, "y": 0, "w": 12, "h": 4},
        "targets": [
          {
            "expr": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100",
            "legendFormat": "Error Rate %"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "unit": "percent",
            "thresholds": {
              "mode": "absolute",
              "steps": [
                {"color": "green", "value": null},
                {"color": "yellow", "value": 1},
                {"color": "red", "value": 5}
              ]
            }
          }
        }
      },
      {
        "title": "P99 Latency",
        "type": "graph",
        "gridPos": {"x": 0, "y": 8, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p99"
          },
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))",
            "legendFormat": "p95"
          }
        ]
      },
      {
        "title": "Active Pods",
        "type": "timeseries",
        "gridPos": {"x": 12, "y": 8, "w": 12, "h": 8},
        "targets": [
          {
            "expr": "count(kube_pod_container_status_ready{namespace=\"$namespace\"})",
            "legendFormat": "Ready"
          },
          {
            "expr": "count(kube_pod_container_status_ready{namespace=\"$namespace\"} == 0)",
            "legendFormat": "Not Ready"
          }
        ]
      }
    ]
  }
}
```

## Best Practices
- Use histograms for values with many distinct values (latency, sizes)
- Set appropriate recording rules for complex queries
- Implement labels consistently across metrics
- Use appropriate alert thresholds based on SLOs
- Avoid alert fatigue with proper grouping and routing
- Use service discovery instead of static configurations
- Monitor not just infrastructure but business metrics too
- Implement proper error budget policies
- Use annotations for rich alert information
- Test alerting rules before deploying to production
