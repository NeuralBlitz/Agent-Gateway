---
name: container-orchestration
description: Container orchestration and management
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineer, platform-engineer
  category: devops
---

## What I do

- Design and implement container orchestration systems
- Manage Kubernetes clusters and workloads
- Configure service discovery and networking
- Implement storage orchestration
- Set up auto-scaling and self-healing
- Build CI/CD pipelines for containerized applications

## When to use me

- When deploying containerized applications at scale
- When managing microservices architectures
- When implementing self-healing infrastructure
- When orchestrating stateful workloads
- When scaling applications automatically
- When implementing service mesh

## Key Concepts

### Kubernetes Resources

```yaml
# Deployment with HPA
apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  replicas: 3
  selector:
    matchLabels:
      app: myapp
  template:
    spec:
      containers:
        - name: myapp
          image: myapp:latest
          resources:
            requests:
              cpu: "100m"
              memory: "128Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"

---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: myapp-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: myapp
  minReplicas: 3
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Service and Ingress

```yaml
apiVersion: v1
kind: Service
metadata:
  name: myapp
spec:
  selector:
    app: myapp
  ports:
    - port: 80
      targetPort: 8080
  type: ClusterIP

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: myapp-ingress
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: myapp.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: myapp
                port:
                  number: 80
```

### StatefulSet

```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mysql
spec:
  serviceName: mysql
  replicas: 3
  selector:
    matchLabels:
      app: mysql
  template:
    spec:
      containers:
        - name: mysql
          image: mysql:8
          volumeMounts:
            - name: data
              mountPath: /var/lib/mysql
  volumeClaimTemplates:
    - metadata:
        name: data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 10Gi
```

### Operators

```yaml
# Custom Resource Definition
apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: databases.example.com
spec:
  group: example.com
  names:
    kind: Database
    listKind: DatabaseList
    plural: databases
  scope: Namespaced
  versions:
    - name: v1
      served: true
      storage: true
      schema:
        openAPIV3Schema:
          type: object
          properties:
            spec:
              type: object
              properties:
                version:
                  type: string
```

### Key Patterns

- **Liveness Probes**: Detect hung containers
- **Readiness Probes**: Route traffic to ready pods
- **Startup Probes**: Handle slow starters
- **Pod Disruption Budgets**: Maintain availability
- **Resource Quotas**: Limit resource usage
- **Network Policies**: Microsegmentation
- **Pod Security Standards**: Container security
