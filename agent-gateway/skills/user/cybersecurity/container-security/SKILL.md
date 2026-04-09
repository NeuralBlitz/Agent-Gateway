---
name: Container Security
category: cybersecurity
description: Securing container images, runtimes, and orchestration platforms against vulnerabilities and misconfigurations
tags: [docker, kubernetes, containers, image-scanning, runtime-security]
version: "1.0"
---

# Container Security

## What I Do

I provide guidance on securing containerized workloads from image build through runtime. This includes writing secure Dockerfiles, scanning images for vulnerabilities, configuring Kubernetes security policies, implementing runtime monitoring, and establishing supply chain integrity for container images.

## When to Use Me

- Writing secure Dockerfiles with minimal attack surface
- Scanning container images for CVEs and misconfigurations
- Configuring Kubernetes Pod Security Standards and network policies
- Implementing image signing and verification workflows
- Setting up runtime anomaly detection for containers
- Hardening container orchestration platforms

## Core Concepts

1. **Minimal Base Images**: Use distroless or scratch images to reduce attack surface and vulnerability count.
2. **Non-Root Execution**: Run containers as non-root users to limit the impact of container escape vulnerabilities.
3. **Image Scanning**: Scan images for known CVEs in OS packages and application dependencies before deployment.
4. **Image Signing**: Sign images with cosign or Notary and verify signatures before deployment.
5. **Pod Security Standards**: Apply Kubernetes restricted, baseline, or privileged profiles to control pod capabilities.
6. **Network Policies**: Use Kubernetes NetworkPolicy to restrict pod-to-pod and pod-to-external communication.
7. **Read-Only Filesystems**: Mount container filesystems as read-only and use tmpfs for writable directories.
8. **Resource Limits**: Set CPU and memory limits to prevent denial-of-service from runaway containers.

## Code Examples

### 1. Secure Multi-Stage Dockerfile

```dockerfile
FROM python:3.11-slim AS builder
WORKDIR /build
COPY requirements.txt .
RUN pip install --no-cache-dir --target=/deps -r requirements.txt

FROM gcr.io/distroless/python3-debian12
WORKDIR /app
COPY --from=builder /deps /deps
COPY src/ /app/
ENV PYTHONPATH=/deps
USER nonroot:nonroot
EXPOSE 8080
ENTRYPOINT ["python3", "main.py"]
```

### 2. Kubernetes Pod Security Context

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: secure-app
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 65534
    fsGroup: 65534
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: app
      image: registry.example.com/app:v1.2.3@sha256:abc123...
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
      resources:
        limits:
          memory: "256Mi"
          cpu: "500m"
        requests:
          memory: "128Mi"
          cpu: "250m"
      volumeMounts:
        - name: tmp
          mountPath: /tmp
  volumes:
    - name: tmp
      emptyDir:
        medium: Memory
        sizeLimit: "64Mi"
```

### 3. Kubernetes Network Policy

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: app-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: frontend
      ports:
        - protocol: TCP
          port: 8080
  egress:
    - to:
        - podSelector:
            matchLabels:
              app: database
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - namespaceSelector: {}
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
```

## Best Practices

1. **Use minimal base images** (distroless, scratch, alpine) to reduce attack surface.
2. **Run as non-root** and drop all Linux capabilities except those explicitly required.
3. **Pin image digests** (sha256) instead of mutable tags for reproducible deployments.
4. **Scan images in CI/CD** with Trivy, Grype, or Snyk and fail builds on critical CVEs.
5. **Enable read-only root filesystems** and use emptyDir volumes for temporary files.
6. **Set resource limits** on all containers to prevent resource exhaustion attacks.
7. **Apply network policies** to restrict communication to only required paths.
8. **Sign and verify images** using cosign with keyless signing via Sigstore.
9. **Use Pod Security Standards** at the namespace level with restricted profile for production.
10. **Never mount the Docker socket** or Kubernetes service account tokens unless explicitly needed.
