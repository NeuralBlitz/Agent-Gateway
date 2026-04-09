---
name: kubernetes
description: Kubernetes orchestration best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: devops
---
## What I do
- Create Kubernetes manifests (Deployments, Services, ConfigMaps, etc.)
- Configure resources and limits properly
- Implement health checks (liveness, readiness probes)
- Manage secrets and configmaps
- Set up autoscaling (HPA, VPA)
- Configure networking (Ingress, NetworkPolicies)
- Use Helm charts for templating

## When to use me
When creating Kubernetes configurations or deploying to K8s clusters.

## Deployment with Probes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  labels:
    app: api-server
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api-server
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app: api-server
        version: v1
    spec:
      serviceAccountName: api-server
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: api-server
          image: registry.example.com/api-server:v1.2.3
          ports:
            - containerPort: 8080
              name: http
          envFrom:
            - configMapRef:
                name: api-config
            - secretRef:
                name: api-secrets
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          livenessProbe:
            httpGet:
              path: /health/live
              port: 8080
            initialDelaySeconds: 10
            periodSeconds: 10
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: /health/startup
              port: 8080
            failureThreshold: 30
            periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: api-server
spec:
  selector:
    app: api-server
  ports:
    - port: 80
      targetPort: 8080
      protocol: TCP
      name: http
  type: ClusterIP
```

## ConfigMap and Secrets
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: api-config
data:
  DATABASE_URL: "postgres://..."
  REDIS_URL: "redis://..."
  LOG_LEVEL: "info"
  API_VERSION: "v1"
---
apiVersion: v1
kind: Secret
metadata:
  name: api-secrets
type: Opaque
stringData:
  DATABASE_PASSWORD: "your-password"
  API_KEY: "your-api-key"
```

## Horizontal Pod Autoscaler
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-server-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api-server
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 100
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

## Ingress
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /api
            pathType: Prefix
            backend:
              service:
                name: api-server
                port:
                  number: 80
```

## Commands
```bash
# Apply and manage
kubectl apply -f manifests/
kubectl rollout status deployment/api-server
kubectl rollout undo deployment/api-server

# Debug
kubectl get pods -l app=api-server
kubectl logs -f deployment/api-server
kubectl describe pod <pod-name>
kubectl exec -it <pod-name> -- /bin/bash

# Scale and update
kubectl scale deployment/api-server --replicas=10
kubectl set image deployment/api-server api-server=registry.example.com/api-server:v1.2.4
```
