---
name: kubernetes
description: Kubernetes orchestration for container deployment, scaling, and management
license: MIT
compatibility: opencode
metadata:
  audience: devops-engineers
  category: systems-administration
---

## What I do
- Create Kubernetes manifests and Helm charts
- Deploy and manage applications on Kubernetes
- Configure pods, deployments, and services
- Implement networking policies and ingress
- Manage secrets and configmaps
- Set up horizontal pod autoscaling
- Configure persistent storage
- Implement RBAC and security policies
- Perform rolling updates and rollbacks
- Debug and troubleshoot cluster issues

## When to use me
When deploying applications to Kubernetes clusters, creating deployment manifests, or managing Kubernetes resources.

## Core Concepts
- Pods, Deployments, StatefulSets, DaemonSets
- Services (ClusterIP, NodePort, LoadBalancer, Ingress)
- ConfigMaps and Secrets
- PersistentVolumes and PersistentVolumeClaims
- Horizontal Pod Autoscaler (HPA)
- Network Policies
- RBAC and ServiceAccounts
- Helm package management
- Operators and Custom Resource Definitions
- Kubernetes networking (CNI, Service mesh)

## Code Examples

### Kubernetes Manifests
```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-server
  labels:
    app: api-server
    version: v1
    tier: backend
spec:
  replicas: 3
  revisionHistoryLimit: 5
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
        tier: backend
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "8080"
    spec:
      serviceAccountName: api-server
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        fsGroup: 1000
      containers:
        - name: api-server
          image: registry.example.com/api-server:v1.2.3
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
            - name: grpc
              containerPort: 9090
              protocol: TCP
          envFrom:
            - configMapRef:
                name: api-config
            - secretRef:
                name: api-secrets
          env:
            - name: POD_NAME
              valueFrom:
                fieldRef:
                  fieldPath: metadata.name
            - name: NODE_NAME
              valueFrom:
                fieldRef:
                  fieldPath: spec.nodeName
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
              ephemeral-storage: 100Mi
            limits:
              cpu: 500m
              memory: 512Mi
              ephemeral-storage: 500Mi
          livenessProbe:
            httpGet:
              path: /health/live
              port: http
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 3
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /health/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 3
            failureThreshold: 3
          startupProbe:
            httpGet:
              path: /health/startup
              port: http
            failureThreshold: 30
            periodSeconds: 10
          volumeMounts:
            - name: tmp
              mountPath: /tmp
            - name: config
              mountPath: /etc/app/config
              readOnly: true
      volumes:
        - name: tmp
          emptyDir: {}
        - name: config
          configMap:
            name: api-config
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchLabels:
                    app: api-server
                topologyKey: kubernetes.io/hostname
      topologySpreadConstraints:
        - maxSkew: 1
          topologyKey: topology.kubernetes.io/zone
          whenUnsatisfiable: ScheduleAnyway
          labelSelector:
            matchLabels:
              app: api-server
```

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-server
  labels:
    app: api-server
spec:
  type: ClusterIP
  selector:
    app: api-server
  ports:
    - name: http
      port: 80
      targetPort: http
      protocol: TCP
    - name: grpc
      port: 9090
      targetPort: grpc
      protocol: TCP
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 3600
```

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
  annotations:
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-send-timeout: "300"
    nginx.ingress.kubernetes.io/proxy-connect-timeout: "60"
    nginx.ingress.kubernetes.io/limit-rps: "100"
    nginx.ingress.kubernetes.io/limit-connections: "50"
    cert-manager.io/cluster-issuer: letsencrypt-prod
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
          - path: /api/v1
            pathType: Prefix
            backend:
              service:
                name: api-server
                port:
                  number: 80
```

### Helm Chart Structure
```yaml
# Chart.yaml
apiVersion: v2
name: api-server
description: A Helm chart for API Server deployment
version: 1.2.3
appVersion: "1.2.3"
kubeVersion: ">=1.20.0-0"
dependencies:
  - name: redis
    version: "17.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: redis.enabled
  - name: postgresql
    version: "11.x"
    repository: "https://charts.bitnami.com/bitnami"
    condition: postgresql.enabled

# values.yaml
replicaCount: 3

image:
  repository: registry.example.com/api-server
  tag: v1.2.3
  pullPolicy: IfNotPresent

imagePullSecrets:
  - name: registry-secret

service:
  type: ClusterIP
  port: 80

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: api.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: api-tls
    hosts:
      - api.example.com

resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 50
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

nodeSelector: {}

tolerations: []

affinity: {}

# Values for production environment
production:
  replicaCount: 5
  resources:
    requests:
      cpu: 200m
      memory: 256Mi
    limits:
      cpu: 1000m
      memory: 1Gi
  autoscaling:
    minReplicas: 5
    maxReplicas: 100
```

### kubectl Commands
```bash
#!/bin/bash

# Kubernetes management utilities
k8s_deploy() {
    local manifest="$1"
    kubectl apply -f "$manifest" --record
    echo "Deployed: $manifest"
}

k8s_rollback() {
    local deployment="$1"
    local revision="${2:---previous}"
    kubectl rollout undo deployment/"$deployment" --to-revision="$revision"
    kubectl rollout status deployment/"$deployment"
}

k8s_debug_pod() {
    local pod="$1"
    kubectl debug -it "$pod" --image=busybox --target="$pod"
}

k8s_get_resources() {
    echo "=== Cluster Resources ==="
    echo "Nodes:"
    kubectl get nodes -o wide
    
    echo ""
    echo "Pods (All namespaces):"
    kubectl get pods -A -o wide --sort-by='.metadata.namespace'
    
    echo ""
    echo "Top Nodes:"
    kubectl top nodes
    
    echo ""
    echo "Top Pods:"
    kubectl top pods -A
}

k8s_network_debug() {
    local pod="$1"
    kubectl exec -it "$pod" -- netstat -ant
    kubectl exec -it "$pod" -- ss -tunapl
}

k8s_port_forward() {
    local deployment="$1"
    local local_port="${2:-8080}"
    local remote_port="${3:-80}"
    kubectl port-forward deployment/"$deployment" "$local_port":"$remote_port"
}

# Generate kubeconfig for service account
k8s_generate_service_config() {
    local namespace="${1:-default}"
    local serviceaccount="${2:-default}"
    
    local token=$(kubectl get secret -n "$namespace" \
        -o jsonpath="{.items[?(@.metadata.ownerReferences[0].name==\"$serviceaccount\")].data.token}" \
        | base64 -d)
    
    local ca=$(kubectl get secret -n "$namespace" \
        -o jsonpath="{.items[?(@.metadata.ownerReferences[0].name==\"$serviceaccount\")].data['ca\.crt']}" \
        | base64 -d)
    
    local context=$(kubectl config current-context)
    local cluster=$(kubectl config view -o jsonpath="{.contexts[?(@.name==\"$context\")].context.cluster}")
    local server=$(kubectl config view -o jsonpath="{.clusters[?(@.name==\"$cluster\")].cluster.server}")
    
    cat > "kubeconfig-$serviceaccount.yaml" <<EOF
apiVersion: v1
kind: Config
current-context: $serviceaccount-context
clusters:
  - name: $cluster
    cluster:
      certificate-authority-data: $ca
      server: $server
contexts:
  - name: $serviceaccount-context
    context:
      cluster: $cluster
      namespace: $namespace
      user: $serviceaccount
users:
  - name: $serviceaccount
    user:
      token: $token
EOF
}
```

## Best Practices
- Use namespaces to isolate environments and teams
- Implement proper resource requests and limits for all containers
- Use liveness and readiness probes for proper health checking
- Avoid running containers as root
- Use network policies to restrict traffic between pods
- Implement pod anti-affinity for high availability
- Use Helm for templating and managing releases
- Store sensitive data in Secrets (encrypted at rest)
- Use ConfigMaps for configuration, avoid hardcoding
- Implement proper logging and monitoring from the start
