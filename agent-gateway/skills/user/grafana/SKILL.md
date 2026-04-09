---
name: grafana
description: Grafana visualization and analytics for monitoring and observability
license: MIT
compatibility: opencode
metadata:
  audience: devops
  category: monitoring
---
## What I do
- Create dashboards with panels
- Set up data source connections
- Use template variables
- Configure alerts and notifications
- Build reusable panels
- Use transformations
- Set up role-based access

## When to use me
When visualizing metrics and creating monitoring dashboards.

## Dashboard JSON Structure
```json
{
  "dashboard": {
    "title": "Application Overview",
    "tags": ["production", "app"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} - {{status}}"
          }
        ],
        "gridPos": {"x": 0, "y": 0, "w": 12, "h": 8}
      },
      {
        "id": 2,
        "title": "Error Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m]) * 100"
          }
        ],
        "thresholds": {
          "mode": "absolute",
          "steps": [
            {"color": "green", "value": null},
            {"color": "red", "value": 5}
          ]
        }
      }
    ]
  }
}
```

## Template Variables
```javascript
// Query variable
// Name: $env
// Query: label_values(http_requests_total, env)

// Query using variable
rate(http_requests_total{env="$env"}[5m])

// Multi-value variable
sum by (service) (http_requests_total{env=~"$env"})

// Custom variable
// Name: $group
// Custom: backend,frontend,worker
// All value: .*
```

## Annotations
```javascript
{
  "annotations": [
    {
      "name": "Deployments",
      "datasource": "Prometheus",
      "query": "deployments{env=\"$env\"}"
    }
  ]
}
```

## Transformations
```javascript
// Outer Join
{
  "id": "joinByField",
  "options": {"mode": "outer"}
}

// Reduce
{
  "id": "reduce",
  "options": {
    "reducers": ["sum", "mean", "max"]
  }
}

// Calculate field
{
  "id": "calculateField",
  "options": {
    "mode": "binary",
    "reduce": {"reducer": "sum"},
    "binary": {
      "left": "requests",
      "operator": "/",
      "right": "errors"
    }
  }
}
```

## Alert Configuration
```json
{
  "alert": {
    "conditions": [
      {
        "type": "query",
        "query": {
          "params": ["A", "5m", "now"]
        },
        "reducer": {
          "type": "avg"
        },
        "evaluator": {
          "type": "gt",
          "params": [100]
        }
      }
    ],
    "notifications": [
      {
        "uid": "notification_uid"
      }
    ]
  }
}
```

## Python Grafana API
```python
from grafana_api.grafana_api import GrafanaClient

# Connect
gc = GrafanaClient(auth=('admin', 'admin'), host='localhost:3000')

# Create dashboard
dashboard = {
    "dashboard": {
        "id": None,
        "title": "My Dashboard",
        "tags": ["generated"],
        "timezone": "browser",
        "panels": [
            {
                "id": 1,
                "title": "CPU Usage",
                "type": "graph",
                "targets": [
                    {
                        "expr": "100 - (avg by(instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)"
                    }
                ]
            }
        ]
    }
}

gc.dashboard.update_dashboard(dashboard)
```
