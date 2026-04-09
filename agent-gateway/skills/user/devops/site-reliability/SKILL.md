---
name: site-reliability
description: Practices and principles for designing, building, and operating reliable systems at scale
category: devops
---

# Site Reliability Engineering

## What I Do

I bridge the gap between development and operations by applying software engineering principles to operations problems. I focus on reliability, scalability, and efficiency through automation, measurement, and continuous improvement.

## When to Use Me

- Building reliable production systems
- Managing production infrastructure
- Implementing SLOs and error budgets
- Automating operational tasks
- Incident response and post-mortems
- Capacity planning and forecasting
- Balancing reliability vs. feature velocity

## Core Concepts

- **SRE (Site Reliability Engineering)**: Disciplined approach to operations
- **SLI (Service Level Indicator)**: Metric measuring service behavior
- **SLO (Service Level Objective)**: Target reliability level
- **Error Budget**: Allowed unreliability before slowing feature work
- **Toil Reduction**: Automating manual operational tasks
- **Post-Mortem**: Learning from incidents without blame
- **Service Catalog**: Inventory of services with ownership
- **Operational Level Agreements**: Internal SLAs between teams
- **CAPEX vs OPEX**: Capital and operational expenditure planning
- **Reliability Engineering**: Building reliability into systems

## Code Examples

**SLO Definition (YAML):**
```yaml
apiVersion: reliability/v1
kind: ServiceLevelObjective
metadata:
  name: api-slo
  namespace: production
spec:
  service: payment-api
  description: "Payment processing API reliability"
  
  indicators:
    - name: availability
      description: "API responds successfully"
      threshold: 99.9
      window: 30d
    
    - name: latency_p99
      description: "99th percentile response time"
      threshold: "500ms"
      window: 7d
    
    - name: error_rate
      description: "Rate of 5xx errors"
      threshold: 0.1
      window: 1d
    
    - name: throughput
      description: "Successful requests per second"
      threshold: 1000
      window: 5m
      type: minimum
  
  compliance: rolling
  alert_budgets:
    - threshold: 0.5
      severity: warning
    - threshold: 0.2
      severity: critical

---
apiVersion: reliability/v1
kind: ErrorBudgetPolicy
metadata:
  name: error-budget-config
spec:
  service: payment-api
  
  burn_rate_thresholds:
    - name: fast_burn
      threshold: 10  # 10x normal burn rate
      duration: 1m
      action: page_on_call
    
    - name: slow_burn
      threshold: 2  # 2x normal burn rate
      duration: 1h
      action: create_ticket
  
  recovery_actions:
    - name: feature_freeze
      when_budget_depleted: true
    - name: incident_declaration
      when_budget_depleted: true
```

**Incident Response Runbook:**
```markdown
# Payment API Incident Runbook

## Severity Levels
- **SEV1**: Complete outage, >50% users affected
- **SEV2**: Degraded performance, >20% users affected  
- **SEV3**: Minor impact, <5% users affected
- **SEV4**: Potential issue, no user impact

## Initial Response Checklist
- [ ] Acknowledge alert within 15 minutes
- [ ] Determine severity level
- [ ] Declare incident in status page
- [ ] Create incident channel in Slack
- [ ] Notify on-call engineers

## Common Issues

### Database Connection Pool Exhaustion
**Symptoms**: 503 errors, connection timeouts
**Diagnosis**:
```bash
kubectl exec -it postgres-0 -- psql -c "SELECT count(*) FROM pg_stat_activity;"
```
**Remediation**:
1. Increase connection pool limit in config
2. Restart affected pods: `kubectl rollout restart deployment/payment-api`
3. If persistent, scale up database

### High Latency on Payment Processing
**Symptoms**: P99 > 2s, increased error rates
**Diagnosis**:
```bash
# Check recent traces
jaeger-query --service=payment-api --operation=processPayment --lookback=1h
```
**Remediation**:
1. Check downstream dependencies
2. Enable circuit breakers
3. Scale horizontally if needed

## Rollback Procedures
```bash
# Rollback to previous version
kubectl rollout undo deployment/payment-api

# Or rollback to specific image
kubectl set image deployment/payment-api payment-api=registry.io/payment:v1.2.3
```
```

**Toil Reduction Automation (Python):**
```python
#!/usr/bin/env python3
"""
Automated operational tasks to reduce toil
"""
import boto3
import subprocess
from datetime import datetime, timedelta

class OperationalAutomation:
    def __init__(self):
        self.ec2 = boto3.client('ec2')
        self.s3 = boto3.client('s3')
        self.k8s = subprocess.run(
            ['kubectl', 'config', 'view', '-o', 'json'],
            capture_output=True, text=True
        )
    
    def cleanup_old_log_files(self):
        """Delete log files older than 30 days"""
        cutoff = datetime.now() - timedelta(days=30)
        result = subprocess.run(
            ['find', '/var/log', '-name', '*.log', '-mtime', '+30', '-delete'],
            capture_output=True
        )
        return f"Cleaned logs older than {cutoff}"
    
    def rotate_kubernetes_secrets(self):
        """Rotate service account tokens that are expiring"""
        result = subprocess.run(
            ['kubectl', 'get', 'secrets', '-A', '-o', 'json'],
            capture_output=True, text=True
        )
        # Check for secrets older than 90 days and rotate
        return "Secret rotation complete"
    
    def scale_down_non_production(self):
        """Scale non-production workloads during off-hours"""
        clusters = self.ec2.describe_instances(
            Filters=[
                {'Name': 'tag:Environment', 'Values': ['staging', 'development']},
                {'Name': 'instance-state-name', 'Values': ['running']}
            ]
        )
        
        for instance in clusters['Reservations']:
            # Implement scale-down logic
            pass
        
        return "Non-production environments scaled down"
    
    def generate_capacity_report(self):
        """Generate weekly capacity utilization report"""
        metrics = {
            'cpu_utilization': [],
            'memory_utilization': [],
            'storage_iops': [],
            'network_throughput': []
        }
        
        # Collect metrics across all services
        return metrics
    
    def detect_anomalies(self):
        """Detect operational anomalies using statistical analysis"""
        # Implement anomaly detection
        return {
            'anomalies_detected': 0,
            'requires_attention': []
        }
    
    def run_automated_remediation(self):
        """Run scheduled automated remediation tasks"""
        tasks = [
            self.cleanup_old_log_files,
            self.rotate_kubernetes_secrets,
            self.scale_down_non_production,
            self.detect_anomalies
        ]
        
        results = []
        for task in tasks:
            try:
                result = task()
                results.append({'task': task.__name__, 'status': 'success', 'result': result})
            except Exception as e:
                results.append({'task': task.__name__, 'status': 'failed', 'error': str(e)})
        
        return results

if __name__ == "__main__":
    automation = OperationalAutomation()
    automation.run_automated_remediation()
```

## Best Practices

1. **Define SLOs early** - Measure what matters to users
2. **Use error budgets** - Balance reliability and velocity
3. **Automate everything** - Eliminate manual toil where possible
4. **Write runbooks** - Document operational procedures
5. **Conduct regular game days** - Practice incident response
6. **Implement SRE rotation** - On-call with reasonable load
7. **Learn from incidents** - Blameless post-mortems
8. **Monitor SLO performance** - Alert on error budget burn rate
9. **Prioritize reliability work** - Balance features vs. stability
10. **Graduate to production carefully** - Progressive rollouts
