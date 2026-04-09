---
name: gitops
description: Operational framework using Git as single source of truth for declarative infrastructure and applications
category: devops
---

# GitOps

## What I Do

I provide a framework for declarative infrastructure and application management using Git as the single source of truth. All changes are version-controlled, enabling review processes, rollbacks, and audit trails for infrastructure and deployments.

## When to Use Me

- Managing Kubernetes clusters declaratively
- Implementing infrastructure version control
- Enabling git-based deployment approvals
- Maintaining audit trails for changes
- Standardizing deployment procedures
- Implementing progressive delivery
- Multi-environment configuration management

## Core Concepts

- **Declarative Desired State**: Define infrastructure in code
- **Git as Source of Truth**: Single authoritative configuration
- **Continuous Reconciliation**: Operators enforce desired state
- **Pull-based Deployments**: Cluster pulls updates from Git
- **Immutable Artifacts**: Container images, Helm charts
- **Diff and Sync**: Comparing current vs. desired state
- **Prerequisites**: What's needed before applying changes
- **Drift Detection**: Identifying unauthorized changes
- **Health Checks**: Verifying system health after changes
- **Audit Trail**: Complete history of changes in Git

## Code Examples

**ArgoCD Application (YAML):**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: production-app
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: production
  source:
    repoURL: https://github.com/org/config-repo.git
    targetRevision: main
    path: applications/my-app/overlays/production
    kustomize:
      images:
        - myapp=registry.io/myapp:v2.3.1
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
      allowEmpty: false
    syncOptions:
      - CreateNamespace=true
      - PrunePropagationPolicy=foreground
      - PruneLast=true
    retry:
      limit: 5
      backoff:
        duration: 5s
        factor: 2
        maxDuration: 3m
  ignoreDifferences:
  - group: apps
    kind: Deployment
    jsonPointers:
      - /spec/replicas
  revisionHistoryLimit: 10
```

**FluxCD Kustomization (YAML):**
```yaml
apiVersion: kustomize.toolkit.fluxcd.io/v1beta2
kind: Kustomization
metadata:
  name: apps-production
  namespace: flux-system
spec:
  interval: 10m0s
  path: ./clusters/production/apps
  prune: true
  wait: true
  timeout: 5m0s
  retryInterval: 2m0s
  sourceRef:
    kind: GitRepository
    name: flux-system
  decryption:
    provider: sops
    secretRef:
      name: sops-gpg
  postBuild:
    substitute:
      REPLICA_COUNT: "3"
      MEMORY_LIMIT: "2Gi"
    substituteFrom:
    - kind: ConfigMap
      name: cluster-config
    - kind: Secret
      name: image-credentials
  healthChecks:
  - apiVersion: apps/v1
    kind: Deployment
    name: frontend
    namespace: apps
  - apiVersion: apps/v1
    kind: Deployment
    name: backend
    namespace: apps
  - apiVersion: apps/v1
    kind: Deployment
    name: worker
    namespace: apps
```

**GitOps Workflow with Kustomize:**
```yaml
# clusters/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

resources:
  - ../../base/deployment.yaml
  - ../../base/service.yaml
  - ../../base/hpa.yaml

namespace: default

commonLabels:
  app.kubernetes.io/part-of: myapp

images:
  - name: myapp
    newName: registry.io/myapp
    newTag: v1.0.0

configMapGenerator:
- files:
  - config.yaml
  name: app-config

secretGenerator:
- literals:
  - DATABASE_PASSWORD=changeme
  name: app-secrets
  type: Opaque

---
# clusters/production/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
  - ../../base

patches:
  - path: replicas-patch.yaml
  - path: resource-limits-patch.yaml

images:
  - name: myapp
    newTag: v2.3.1

configMapGenerator:
- behavior: merge
  files:
    - PRODUCTION=true
    - LOG_LEVEL=info
    config.yaml=./production-config.yaml

replicas:
- name: frontend
  count: 5
- name: backend
  count: 10
- name: worker
  count: 3
```

**Pull Request for GitOps Change:**
```markdown
## Summary
Increases API service replicas from 5 to 10 to handle projected traffic growth.

## Changes
- `clusters/production/kustomization.yaml`: Update replica count
- `clusters/production/replicas-patch.yaml`: Add API service scaling

## Verification
- [x] Tested locally with `kustomize build`
- [x] Diff reviewed in PR
- [x] Automated tests pass
- [x] Security scan completed

## Rollback Plan
- Revert this PR to roll back
- Estimated rollback time: 2 minutes

## Approval
Required: 2 approvers from Platform team
Labels: gitops/approved, deployment/pending
```

**GitOps Change Pipeline:**
```yaml
# .github/workflows/gitops-sync.yaml
name: GitOps Sync

on:
  pull_request:
    paths:
      - 'clusters/**'
      - 'applications/**'
  push:
    branches:
      - main
    paths:
      - 'clusters/**'
      - 'applications/**'

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Kustomize
        uses: imranismail/setup-kustomize@v1
      
      - name: Validate Kustomize
        run: |
          for cluster in clusters/*/; do
            echo "Validating $cluster"
            kustomize build "$cluster" > /dev/null
          done
      
      - name: Check Drift
        uses: stefanprodan/gitops-toolkit@v1
        with:
          action: drift-detect
          path: clusters/production
          policy: strict
      
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ GitOps validation passed. Ready for merge.'
            })

  sync:
    needs: validate
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Update Flux Source
        uses: fluxcd/flux2@v2
        with:
          command: |
            flux create source git flux-system \
              --url=https://github.com/${{ github.repository }} \
              --branch=main \
              --interval=1m \
              --export
            flux reconcile source git flux-system
```

## Best Practices

1. **Use branch strategies** - Environment-specific branches (main, staging)
2. **Implement code review** - All changes through PRs
3. **Enforce required reviewers** - Platform team approval
4. **Use immutable tags** - Never use mutable image tags
5. **Enable auto-sync** - Continuous reconciliation
6. **Implement drift detection** - Alert on unauthorized changes
7. **Use secrets management** - External secrets, Vault, SOPS
8. **Set resource quotas** - Prevent resource exhaustion
9. **Monitor sync status** - Track reconciliation health
10. **Test changes locally** - Validate before pushing
