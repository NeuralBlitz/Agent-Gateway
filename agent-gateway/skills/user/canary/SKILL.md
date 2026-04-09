---
name: canary
description: Canary deployment patterns
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineer, platform-engineer
  category: devops
---

## What I do

- Implement gradual traffic shifting strategies
- Create automated canary deployments with metric analysis
- Design rollback automation based on health checks
- Build observability dashboards for canary analysis
- Integrate canary releases with CI/CD pipelines
- Configure intelligent traffic routing based on user segments

## When to use me

- When introducing new features to production
- When validating infrastructure changes
- When testing performance under real load
- When deploying to multiple regions progressively
- When working with A/B testing alongside deployments
- When reducing blast radius of potential issues

## Key Concepts

### Flagger Canary CRD

```yaml
apiVersion: flagger.app/v1alpha3
kind: Canary
metadata:
  name: myapp
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  service:
    port: 80
  canaryAnalysis:
    interval: 1m
    threshold: 10
    maxWeight: 50
    stepWeight: 10
    metrics:
      - name: request-success-rate
        threshold: 99
        interval: 1m
      - name: request-duration
        threshold: 500
        interval: 1m
```

### Deployment Strategy

- Start with small percentage (1-5%)
- Increase gradually if metrics stay healthy
- Stop and rollback if errors spike
- Analyze at each stage before proceeding
- Full rollout typically takes 30-60 minutes

### Analysis Criteria

- Error rate within acceptable threshold
- Response time not degraded
- No memory leaks or resource exhaustion
- Business metrics not negatively impacted
- No adverse effects on dependent services
