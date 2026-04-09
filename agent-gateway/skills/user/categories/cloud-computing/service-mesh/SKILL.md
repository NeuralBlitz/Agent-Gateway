---
name: service-mesh
description: Service mesh infrastructure for microservices communication, observability, and traffic management
license: MIT
compatibility:
  - istio
  - linkerd
  - consul-connect
  - osm
audience: Platform engineers, DevOps engineers, cloud architects
category: cloud-computing
---

# Service Mesh

## What I Do

I provide expertise in service mesh technology - a dedicated infrastructure layer that handles service-to-service communication, providing capabilities like traffic management, security, and observability without requiring changes to application code. I cover service mesh implementation with popular platforms like Istio and Linkerd, including traffic routing, load balancing, security policies, and troubleshooting methodologies for distributed microservices architectures.

## When to Use Me

- Managing complex microservices communication patterns with advanced traffic routing
- Implementing zero-trust security between services with mutual TLS
- Observing service-to-service traffic with distributed tracing and metrics
- Configuring canary releases and traffic splitting for gradual rollouts
- Implementing circuit breakers and retry policies for resilience
- Enforcing consistent security policies across heterogeneous services
- Migrating from monolithic architectures to microservices
- Debugging inter-service communication issues in distributed systems

## Core Concepts

- **Sidecar Proxy**: Decoupled proxy containers (Envoy, Linkerd-proxy) intercepting all network traffic for service instances
- **Control Plane**: Centralized management component configuring data plane behavior and policies
- **Data Plane**: Network proxies handling actual service-to-service communication
- **Mutual TLS (mTLS)**: Automatic encryption and authentication between services without code changes
- **Traffic Splitting**: Routing percentages of traffic between different service versions for canary deployments
- **Circuit Breaking**: Automatic failure isolation preventing cascading failures in microservices
- **Service Discovery**: Automatic detection of service instances and their endpoints
- **Ingress/Egress Gateway**: Controlled entry and exit points for cluster traffic
- **Virtual Services**: Traffic routing rules defining how requests reach services
- **Destination Rules**: Policies applied after routing decisions (load balancing, connection pools)
- **Authorization Policies**: Fine-grained access control between services
- **Telemetry Collection**: Automatic metrics, traces, and logs for all service traffic

## Code Examples

### Istio VirtualService with Traffic Splitting

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
            user-agent:
              regex: ".*Mobile.*"
      route:
        - destination:
            host: reviews
            subset: v2
          weight: 100
    - route:
        - destination:
            host: reviews
            subset: v1
          weight: 80
        - destination:
            host: reviews
            subset: v2
          weight: 20
    - fault:
        delay:
          percentage:
            value: 0.1
          fixedDelay: 5s
      route:
        - destination:
            host: reviews
            subset: v1
```

### Linkerd ServiceProfile for Retries and Timeouts

```yaml
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: api-service.namespace.svc.cluster.local
spec:
  routes:
    - name: GET /api/users
      isRetryable: true
      timeout: 300ms
      retryBudget:
        minRetriesPerSecond: 10
        retryRatio: 0.2
      condition:
        method: GET
        pathRegex: "/api/users"
    - name: POST /api/orders
      isRetryable: false
      timeout: 5s
      condition:
        method: POST
        pathRegex: "/api/orders"
  dstOverrides:
    - authority: api-service.namespace.svc.cluster.local
      weight: 1
```

### Istio DestinationRule with Load Balancing

```yaml
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: product-page-dr
spec:
  host: product-page
  trafficPolicy:
    connectionPool:
      tcp:
        maxConnections: 100
      http:
        h2UpgradePolicy: UPGRADE
        http1MaxPendingRequests: 100
        http2MaxRequests: 1000
    loadBalancer:
      simple: LEAST_REQUEST
      localityLbSetting:
        enabled: true
        distribute:
          - from: "us-east/*"
            to:
              "us-east/*": 80
              "us-west/*": 20
    tls:
      mode: ISTIO_MUTUAL
      subjectAltNames:
        - "product-page.namespace.svc.cluster.local"
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50
```

### Istio Authorization Policy

```yaml
apiVersion: security.istio.io/v1beta1
kind: AuthorizationPolicy
metadata:
  name: backend-authz
  namespace: production
spec:
  action: ALLOW
  rules:
    - from:
        - source:
            principals: ["cluster.local/ns/frontend/sa/frontend-sa"]
        - source:
            namespaces: ["frontend"]
      to:
        - operations:
            - methods: ["GET", "POST"]
              paths: ["/api/v1/protected/*"]
      when:
        - key: request.auth.claims[role]
          values: ["user", "admin"]
    - from:
        - source:
            principals: ["cluster.local/ns/monitoring/sa/prometheus"]
      to:
        - operations:
            - methods: ["GET"]
              paths: ["/metrics", "/health"]
      action: ALLOW
    - to:
        - operations:
            - methods: ["*"]
      action: DENY
```

### Istio PeerAuthentication for mTLS

```yaml
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: default-mtls
  namespace: istio-system
spec:
  mtls:
    mode: STRICT
---
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: permissive-mtls
  namespace: production
spec:
  mtls:
    mode: PERMISSIVE
---
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: legacy-mtls
  namespace: legacy-apps
spec:
  mtls:
    mode: DISABLE
```

### Linkerd Traffic Split for Canary Deployment

```yaml
apiVersion: split.smi-spec.io/v1alpha2
kind: TrafficSplit
metadata:
  name: api-canary
  namespace: default
spec:
  service: api-service
  backends:
    - service: api-service-v1
      weight: 95
    - service: api-service-v2
      weight: 5
  apex:
    service: api-service
```

### Istio Gateway Configuration

```yaml
apiVersion: networking.istio.io/v1beta1
kind: Gateway
metadata:
  name: ingress-gateway
  namespace: istio-system
spec:
  selector:
    istio: ingressgateway
  servers:
    - port:
        number: 443
        name: https
        protocol: HTTPS
      tls:
        mode: SIMPLE
        credentialName: wildcard-tls-secret
      hosts:
        - "*.example.com"
    - port:
        number: 8443
        name: https-mtls
        protocol: HTTPS
      tls:
        mode: MUTUAL
        credentialName: mtls-gateway-secret
        caCertificates: /etc/istio/ingressgateway-certs/ca.crt
      hosts:
        - "internal.example.com"
```

## Best Practices

- Start with strict mTLS enforcement to secure all service communication by default
- Use traffic splitting progressively - start with small percentages for canary releases
- Implement circuit breakers with appropriate thresholds based on service capacity
- Leverage locality-aware load balancing to reduce cross-region traffic costs
- Use authorization policies for zero-trust network security between services
- Monitor service mesh metrics (request rates, latencies, error rates) for observability
- Implement distributed tracing to understand request flows across services
- Use egress gateways to control and monitor outbound service traffic
- Regularly review and update destination rules as services evolve
- Test resilience patterns (retries, timeouts, circuit breakers) under failure conditions
- Use mesh expansion to include VMs and legacy services in the service mesh
- Implement rate limiting at the mesh level to protect backend services
- Use ingress gateways with proper TLS configuration for external traffic
- Consider resource overhead - service mesh adds latency and memory consumption
- Use canary deployments with automatic rollback based on error rate thresholds

## Common Patterns

- **Canary Deployments**: Gradually shift traffic to new versions while monitoring for issues
- **Circuit Breaker Pattern**: Automatically fail fast when downstream services are unhealthy
- **Retry with Backoff**: Automatically retry failed requests with exponential backoff
- **Rate Limiting**: Protect services from overwhelming traffic spikes
- **Mirror Traffic**: Send copies of production traffic to new versions for testing
- **Access Logging**: Log all service-to-service communication for auditing
- **Header-Based Routing**: Route requests based on HTTP headers for A/B testing
- **Fault Injection**: Introduce delays and errors to test system resilience
- **JWT Validation**: Offload token validation to the sidecar proxy
- **Service Tap**: Securely access service traffic for debugging without production impact
