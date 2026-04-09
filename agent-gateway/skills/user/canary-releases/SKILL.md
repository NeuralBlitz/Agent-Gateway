---
name: canary-releases
description: Progressive rollout deployment strategy
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineer, platform-engineer
  category: devops
---

## What I do

- Design and implement canary release strategies
- Gradually shift traffic from stable to new versions
- Implement automated traffic routing based on metrics
- Create canary analysis and evaluation frameworks
- Build rollback triggers based on error rates and latency
- Monitor and analyze canary performance metrics

## When to use me

- When you want to reduce risk of new deployments
- When you need to validate changes with real production traffic
- When deploying to large user bases where failures are costly
- When you want data-driven deployment decisions
- When implementing progressive delivery practices
- When working with microservices architectures

## Key Concepts

### Traffic Splitting

```yaml
# Kubernetes Istio virtual service for canary routing
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
    - myapp
  http:
    - route:
        - destination:
            host: myapp
            subset: stable
          weight: 90
        - destination:
            host: myapp
            subset: canary
          weight: 10
```

### Metrics-Based Routing

```javascript
// Prometheus alert for canary analysis
- alert: CanaryHighErrorRate
  expr: |
    rate(http_requests_total{service="canary"}[5m]) 
    / rate(http_requests_total{service="stable"}[5m]) > 0.1
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "Canary error rate exceeds 10% of stable"
    description: "Automated rollback recommended"
```

### Phased Rollout

1. **Initial**: 1-5% traffic to canary
2. **Validation**: Monitor error rates and latency
3. **Expansion**: Increase to 25%, 50%, 75%
4. **Promotion**: Full 100% traffic
5. **Cleanup**: Remove old version

### Key Metrics to Monitor

- **Error Rate**: Compare canary vs. stable
- **Latency**: P50, P95, P99 response times
- **Success Rate**: Request completion percentage
- **Resource Usage**: CPU, memory, network
- **Business Metrics**: Conversion rates, session duration
- **Custom Metrics**: Domain-specific indicators

### Rollback Triggers

- Error rate exceeds 2x stable environment
- P99 latency exceeds threshold (e.g., 500ms)
- CPU or memory usage exceeds 80%
- Custom business metric degradation
- Manual override triggered
