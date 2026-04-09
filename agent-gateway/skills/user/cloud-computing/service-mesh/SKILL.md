---
name: service-mesh
description: Infrastructure layer that handles service-to-service communication, providing load balancing, security, and observability
category: cloud-computing
---

# Service Mesh

## What I Do

I provide a dedicated infrastructure layer for handling service-to-service communication. I abstract network complexity by managing traffic routing, load balancing, encryption, observability, and security policies without requiring changes to application code.

## When to Use Me

- Microservices architectures with many services
- Organizations requiring consistent security policies
- Teams needing observability without code changes
- Complex traffic management requirements (canary, blue-green)
- Zero-trust security models
- Multi-cluster or multi-cloud deployments

## Core Concepts

- **Sidecar Proxy**: Proxy container alongside each service instance
- **Control Plane**: Manages proxy configuration and policy
- **Data Plane**: Handles actual network traffic between services
- **Service Discovery**: Automatic detection of service instances
- **Circuit Breaking**: Prevents cascade failures
- **mTLS**: Mutual TLS for service-to-service encryption
- **Traffic Shaping**: Route percentages to different versions
- **Fault Injection**: Test resilience by introducing failures
- **Egress/Ingress Gateway**: Control external traffic flow
- **Service Entry**: Register external services in the mesh

## Code Examples

**Istio VirtualService (YAML):**
```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: reviews-route
spec:
  hosts:
  - reviews
  http:
  - match:
    - headers:
        end-user:
          exact: jason
    route:
    - destination:
        host: reviews
        subset: v2
    - route:
    - destination:
        host: reviews
        subset: v1
      weight: 90
```

**Linkerd Configuration (YAML):**
```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: web-api.default.svc.cluster.local
spec:
  routes:
  - name: GET /users
    isRetryable: true
    timeout: 300ms
    requestTimeout: 1s
    routes:
    - condition:
        method: GET
        pathRegex: /users
      responseClasses:
      - condition:
          status:
            min: 500
        weight: 100
```

**Circuit Breaker (Istio):**
```yaml
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: reviews-cb
spec:
  host: reviews
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

**mTLS Policy (Istio):**
```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default-mtls
  namespace: default
spec:
  mtls:
    mode: STRICT
```

## Best Practices

1. **Start with a pilot** - Deploy to one namespace before full rollout
2. **Use mutual TLS everywhere** - Zero-trust security by default
3. **Set appropriate timeouts** - Don't let requests hang indefinitely
4. **Configure circuit breakers** - Prevent cascade failures early
5. **Use canary releases** - Route small percentages to new versions
6. **Enable detailed metrics** - Prometheus integration, Grafana dashboards
7. **Document your policies** - Track configuration as code
8. **Test failure scenarios** - Use fault injection regularly
9. **Monitor sidecar performance** - Resource usage impacts application density
10. **Plan for egress control** - Not all traffic should leave the cluster
