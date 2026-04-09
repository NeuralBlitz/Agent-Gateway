---
name: log-management
description: Centralized logging and analysis
license: MIT
compatibility: opencode
metadata:
  audience: developer, devops-engineer, sre
  category: devops
---

## What I do

- Design centralized logging architectures
- Implement log collection and aggregation
- Configure log parsing and enrichment
- Build log-based alerting and dashboards
- Ensure compliance with logging standards
- Analyze logs for troubleshooting and insights

## When to use me

- When investigating production issues
- When implementing observability
- When meeting compliance requirements
- When building audit trails
- When analyzing user behavior
- When debugging distributed systems

## Key Concepts

### Log Aggregation Architecture

```
┌─────────────────────────────────────────────────────┐
│              Application Logs                      │
│  (stdout, file, syslog)                             │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Log Collector                          │
│  (Fluentd, Filebeat, Vector)                        │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Log Storage                            │
│  (Elasticsearch, Loki, S3)                          │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Visualization                         │
│  (Kibana, Grafana, CloudWatch)                      │
└─────────────────────────────────────────────────────┘
```

### Fluentd Configuration

```xml
<source>
  @type tail
  @id input_tail
  path /var/log/nginx/access.log
  pos_file /var/log/fluentd/nginx-access.log.pos
  tag nginx.access
  <parse>
    @type nginx
  </parse>
</source>

<filter nginx.access>
  @type parser
  key_name log
  <parse>
    @type json
  </parse>
</filter>

<match nginx.**>
  @type elasticsearch
  host elasticsearch
  port 9200
  logstash_format true
  logstash_prefix nginx
  flush_interval 10s
</match>
```

### Loki LogQL

```logql
# Find error logs
{job="myapp"} |= "ERROR"

# Exclude health checks
{job="myapp"} != "/health"

# Parse JSON logs
{job="myapp"} | json | level="error"

# Rate calculation
sum(rate({job="myapp"}[5m]))

# Latency percentiles
histogram_quantile(0.99, sum(rate({job="myapp"}[5m])) by (le, path))
```

### Structured Logging

```python
import logging
import json
from datetime import datetime

class JSONFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
            
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
            
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
            
        return json.dumps(log_data)

# Usage
logger = logging.getLogger(__name__)
logger.info("User logged in", extra={"user_id": 123, "request_id": "abc"})
```

### ELK Stack

```yaml
# docker-compose.yml
version: '3'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.10.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
      
  kibana:
    image: docker.elastic.co/kibana/kibana:8.10.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
      
  logstash:
    image: docker.elastic.co/logstash/logstash:8.10.0
    ports:
      - "5044:5044"
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
```

### Log Retention Policies

| Data Type | Retention | Storage |
|-----------|-----------|---------|
| Application Logs | 30 days | Hot |
| Audit Logs | 1 year | Warm |
| Security Logs | 2 years | Cold |
| Compliance Logs | 7 years | Archive |

### Key Metrics

- Log ingestion rate (GB/day)
- Search latency (p95, p99)
- Index storage size
- Query performance
- Alert response time
- Cost per GB
