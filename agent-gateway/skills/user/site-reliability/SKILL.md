---
name: site-reliability
description: Site reliability engineering practices
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineer, sre
  category: devops
---

## What I do

- Implement SRE practices and principles
- Define and track SLIs and SLOs
- Design error budgets and alerting
- Conduct post-incident reviews
- Automate operational tasks
- Build observability into systems

## When to use me

- When implementing reliability practices
- When defining service level objectives
- When managing incident response
- When automating operations
- When improving system reliability
- When building SLO dashboards

## Key Concepts

### SLI/SLO/SLA Framework

```yaml
# Service Level Indicators
slis:
  - name: request-availability
    description: "Ratio of successful requests to total requests"
    type: ratio
    source: prometheus
    query: |
      sum(rate(http_requests_total{status!~"5.."}[5m])) 
      / sum(rate(http_requests_total[5m]))

  - name: request-latency
    description: "P99 latency in milliseconds"
    type: threshold
    source: prometheus
    query: |
      histogram_quantile(0.99, 
        sum(rate(http_request_duration_seconds_bucket[5m])) by (le)
      ) * 1000

# Service Level Objectives
slo:
  - name: api-availability
    sli: request-availability
    target: 99.9
    window: 30d
    
  - name: api-latency
    sli: request-latency
    target: 500
    window: 7d

# Service Level Agreement
sla:
  - name: api-availability
    objective: api-availability
    target: 99.9
    link: https://example.com/sla
```

### Error Budget Policy

```yaml
# Alert on error budget burn rate
- alert: ErrorBudgetBurnRateHigh
  expr: |
    sum(rate(http_requests_total{slo="api-availability"}[5m])) > 14.4
    / 1000
  for: 1h
  labels:
    severity: critical
  annotations:
    summary: "Error budget burning too fast"
    description: "Error budget burn rate > 10x for 1 hour"

# Alert on remaining error budget
- alert: ErrorBudgetExhausted
  expr: |
    (slo:api-availability:ratio{job="api"}/ 1) < 0.9
  for: 1h
  labels:
    severity: critical
  annotations:
    summary: "Error budget exhausted"
    description: "Less than 10% of error budget remaining"
```

### Toil Reduction

```python
# Automating manual work
class AutomatedOps:
    def __init__(self):
        self.alert_handlers = {
            'high_cpu': self.handle_high_cpu,
            'disk_full': self.handle_disk_full,
            'error_rate': self.handle_error_rate
        }
        
    def handle_alert(self, alert):
        handler = self.alert_handlers.get(alert.type)
        if handler:
            # Attempt automated remediation
            result = handler(alert)
            if result.success:
                return {'action': 'auto_resolved'}
            else:
                # Escalate if automated fix failed
                return {'action': 'escalate', 'reason': result.error}
        return {'action': 'no_handler'}
        
    def handle_high_cpu(self, alert):
        # Check if auto-scaling can help
        if self.can_scale(alert.target):
            self.scale_out(alert.target)
            return Result(success=True)
        return Result(success=False, error='Cannot scale')
```

### Post-Incident Review

```markdown
# Incident Review: Service Outage

## Summary
- **Date**: 2024-01-15
- **Duration**: 45 minutes
- **Impact**: 15% of users unable to access API

## Timeline
- 10:00 - Alert triggered (high error rate)
- 10:05 - On-call paged
- 10:10 - Investigation started
- 10:25 - Root cause identified (database connection pool exhaustion)
- 10:35 - Fix deployed
- 10:45 - Service recovered

## Root Cause
Database connection pool was undersized for traffic spike.

## Action Items
- [ ] Increase connection pool size
- [ ] Add circuit breaker pattern
- [ ] Create load test for connection handling
- [ ] Update runbook for database scaling

## Lessons Learned
1. Need better observability into DB connection pool
2. Alert threshold was too high
3. Manual scaling takes too long
```

### Observability for SRE

```python
# Custom SRE metrics
class SRERecorder:
    def __init__(self, prometheus_client):
        self.errors = Counter('sre_errors_total', 'Total errors')
        self.latency = Histogram('sre_latency_seconds', 'Request latency')
        self.availability = Gauge('sre_availability_ratio', 'Current availability')
        
    def record_request(self, success: bool, duration: float):
        if not success:
            self.errors.inc()
        self.latency.observe(duration)
        
    def calculate_availability(self, window_minutes: int):
        # Calculate rolling availability
        pass
```

### SRE Metrics (DORA)

| Metric | Elite | High | Medium | Low |
|--------|-------|------|--------|-----|
| Deployment Frequency | On-demand | Daily-weekly | Weekly-monthly | Monthly+ |
| Lead Time | <1 hour | 1 day-1 week | 1-6 months | 6+ months |
| MTTR | <1 hour | <1 day | 1 day-1 week | 6+ months |
| Change Failure Rate | 0-15% | 16-30% | 16-30% | 16-30% |

### Core SRE Principles

- **Embrace Risk**: Not 100% reliability required
- **SLOs Drive Work**: Prioritize based on objectives
- **Eliminate Toil**: Automate repetitive work
- **Measure Everything**: Data-driven decisions
- **Reduce Waste**: Don't over-engineer
- **Shared Ownership**: One team runs what they build
