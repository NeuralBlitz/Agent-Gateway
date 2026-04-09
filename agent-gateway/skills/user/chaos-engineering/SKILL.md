---
name: chaos-engineering
description: Resilience testing through controlled experiments
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineer, sre
  category: devops
---

## What I do

- Design and execute chaos experiments to test system resilience
- Create controlled failure scenarios in production-like environments
- Build automated chaos testing pipelines
- Analyze system behavior under failure conditions
- Improve system robustness based on experiment results
- Document failure recovery procedures

## When to use me

- When you want to proactively find system weaknesses
- When validating disaster recovery procedures
- When building confidence in system resilience
- When testing multi-region failover capabilities
- When training incident response teams
- When validating auto-scaling and self-healing behaviors

## Key Concepts

### Chaos Mesh Example

```yaml
apiVersion: chaos-mesh.org/v1alpha1
kind: PodChaos
metadata:
  name: pod-failure
spec:
  action: pod-failure
  mode: one
  duration: "30s"
  selector:
    labelSelectors:
      app: payment-service
```

### LitmusChaos Experiment

```yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: pod-delete-chaos
spec:
  appinfo:
    appns: production
    applabel: "app=payment-service"
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: "30"
            - name: CHAOS_INTERVAL
              value: "10"
```

### Experiment Categories

- **Infrastructure**: Network latency, packet loss, disk failure
- **Compute**: CPU exhaustion, memory pressure, process kill
- **Stateful**: Database failures, cache eviction, storage limits
- **Network**: DNS failures, firewall rules, service isolation
- **Security**: Certificate expiration, authentication failures
- **Scaling**: Node removal, cluster downscaling

### Chaos Engineering Principles

1. **Define steady state**: What does normal behavior look like?
2. **Hypothesize**: What do you expect will happen?
3. **Run experiment**: Introduce real-world failure
4. **Verify**: Did the system behave as expected?
5. **Improve**: Fix发现的 weaknesses
6. **Repeat**: Continuously test and improve

### Observability Integration

```python
# Prometheus alerts during chaos
- alert: HighErrorRateDuringChaos
  expr: |
    sum(rate(http_requests_total{status=~"5.."}[5m])) 
    / sum(rate(http_requests_total[5m])) > 0.05
  for: 2m
  labels:
    chaos_experiment: "active"
```

### Safe Experimentation

- Start in non-production environments
- Define clear abort conditions
- Limit blast radius (one service at a time)
- Have rollback plans ready
- Communicate with stakeholders
- Monitor experiments in real-time
- Document all findings
