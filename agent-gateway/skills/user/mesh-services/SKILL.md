---
name: mesh-services
description: Service mesh implementation and management
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineer, platform-engineer
  category: devops
---

## What I do

- Implement service mesh architectures (Istio, Linkerd, Consul Connect)
- Configure traffic management and routing
- Implement mutual TLS between services
- Set up observability (tracing, metrics, logging)
- Manage service discovery
- Configure security policies

## When to use me

- When managing microservices communication
- When implementing zero-trust networking
- When debugging distributed systems
- When requiring traffic management (canary, blue-green)
- When implementing mTLS between services
- When building observable service networks

## Key Concepts

### Istio Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Control Plane                     │
│  (Istiod - Pilot, Citadel, Galley)                  │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                   Data Plane                         │
│  (Envoy Proxies - Sidecars)                         │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│              Service A    Service B                  │
└─────────────────────────────────────────────────────┘
```

### Virtual Service (Traffic Routing)

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
    - myapp
  http:
    # Canary routing
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: myapp
            subset: v2
          weight: 100
    # Default routing
    - route:
        - destination:
            host: myapp
            subset: v1
          weight: 90
        - destination:
            host: myapp
            subset: v2
          weight: 10
    # Retry policy
    - retries:
        attempts: 3
        perTryTimeout: 2s
        retryOn: gateway-error,connect-failure,refused-stream
      route:
        - destination:
            host: myapp
```

### Destination Rule

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: DestinationRule
metadata:
  name: myapp
spec:
  host: myapp
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
        http2MaxRequests: 1000
    loadBalancer:
      simple: LEAST_CONN
    tls:
      mode: ISTIO_MUTUAL
  subsets:
    - name: v1
      labels:
        version: v1
    - name: v2
      labels:
        version: v2
```

### Peer Authentication (mTLS)

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default
spec:
  mtls:
    mode: STRICT
---
# Per-namespace
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: product-viewer
  namespace: production
spec:
  selector:
    matchLabels:
      app: product
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/default/sa/sleep"]
      to:
        - operation:
            methods: ["GET"]
```

### Service Monitor

```yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: istio-component-monitor
  labels:
    release: prometheus
spec:
  selector:
    matchLabels:
      istio: mixer
  endpoints:
    - port: prometheus
      interval: 15s
```

### Linkerd Configuration

```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: myapp.default.svc.cluster.local
spec:
  routes:
    - name: GET /
      condition:
        pathRegex: /
      responseClasses:
        - condition:
            status:
              min: 500
          isFailure: true
      isRetryable: true
      timeout: 10s
```

### Observability Integration

```yaml
# Jaeger tracing
apiVersion: install.istio.io/v1alpha1
kind: IstioOperator
metadata:
  name: istio-default
spec:
  values:
    pilot:
      traceSampling: 1.0
    tracing:
    - enabled: true
      provider: jaeger
```

### Traffic Management Features

- **Canary Deployments**: Gradually shift traffic
- **A/B Testing**: Route based on headers/cookies
- **Circuit Breaking**: Prevent cascade failures
- **Rate Limiting**: Protect services
- **Fault Injection**: Test resilience
- **Mirror Traffic**: Copy requests for testing
