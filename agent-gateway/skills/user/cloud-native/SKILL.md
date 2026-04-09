---
name: cloud-native
description: Cloud-native application architecture
license: MIT
compatibility: opencode
metadata:
  audience: developer, architect, devops-engineer
  category: devops
---

## What I do

- Design cloud-native architectures using containers and microservices
- Implement Kubernetes-based deployments and operations
- Build serverless applications and functions
- Create event-driven systems with message queues
- Design scalable, resilient, and observable systems
- Implement GitOps and IaC practices

## When to use me

- When building new applications for cloud deployment
- When modernizing legacy applications
- When implementing microservices architecture
- When scaling applications elastically
- When adopting Kubernetes or container orchestration
- When implementing cloud-native security

## Key Concepts

### Twelve-Factor App Principles

1. **Codebase**: One repo per app, multiple deploys
2. **Dependencies**: Explicitly declare and isolate
3. **Config**: Store config in environment
4. **Backing Services**: Treat as attached resources
5. **Build/Release/Run**: Strict separation
6. **Processes**: Stateless, share nothing
7. **Port Binding**: Export via port binding
8. **Concurrency**: Scale out via processes
9. **Disposability**: Fast startup, graceful shutdown
10. **Dev/Prod Parity**: Keep environments similar
11. **Logs**: Treat as event streams
12. **Admin Processes**: Run admin tasks same as processes

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
  labels:
    app: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    metadata:
      labels:
        app: myapp
    spec:
      containers:
        - name: myapp
          image: myapp:latest
          ports:
            - containerPort: 8080
          resources:
            requests:
              memory: "128Mi"
              cpu: "250m"
            limits:
              memory: "256Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 8080
            initialDelaySeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
```

### Service Mesh

```yaml
apiVersion: networking.istio.io/v1alpha3
kind: VirtualService
metadata:
  name: myapp
spec:
  hosts:
    - myapp
  http:
    - match:
        - headers:
            x-canary:
              exact: "true"
      route:
        - destination:
            host: myapp
            subset: v2
          weight: 100
    - route:
        - destination:
            host: myapp
            subset: v1
          weight: 100
```

### Cloud-Native Patterns

- **Sidecar**: Extend container functionality
- **Ambassador**: Proxy network connections
- **Adapter**: Normalize interfaces
- **Circuit Breaker**: Prevent cascade failures
- **Bulkhead**: Isolate failures
- **Retry with Backoff**: Handle transient failures
- **Dead Letter Queue**: Handle failed messages

### Observability Stack

```yaml
# Prometheus + Grafana + Loki
apiVersion: v1
kind: Pod
metadata:
  name: monitoring
spec:
  containers:
    - name: prometheus
      image: prom/prometheus:latest
      volumeMounts:
        - name: config
          mountPath: /etc/prometheus
    - name: grafana
      image: grafana/grafana:latest
    - name: loki
      image: grafana/loki:latest
```

### Key Principles

- **Microservices**: Small, independent services
- **Containerization**: Consistent packaging
- **Orchestration**: Automated management
- **Immutable Infrastructure**: Replace, don't modify
- **Declarative**: Define desired state
- **Self-Healing**: Automatic recovery
- **Elasticity**: Scale based on load
