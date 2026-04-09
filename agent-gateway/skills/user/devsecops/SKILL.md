---
name: devsecops
description: Security integration in DevOps practices
license: MIT
compatibility: opencode
metadata:
  audience: developer, security-engineer, devops-engineer
  category: security
---

## What I do

- Integrate security into CI/CD pipelines
- Implement security scanning at each pipeline stage
- Automate vulnerability detection and remediation
- Enforce security policies as code
- Conduct security code reviews
- Build security awareness programs

## When to use me

- When implementing shift-left security
- When automating security compliance
- When building secure software supply chains
- When conducting security testing in CI/CD
- When responding to vulnerabilities automatically
- When training developers on secure coding

## Key Concepts

### Security Scanning Pipeline

```yaml
stages:
  - secret-scan
  - dependency-scan
  - static-analysis
  - build-scan
  - image-scan
  - deploy-scan

secret-scan:
  stage: secret-scan
  script:
    - gitlab-sast
  allow_failure: false

dependency-scan:
  stage: dependency-scan
  script:
    - npm audit --audit-level=high
    - snyk test
    - trivy fs --security-checks vuln
  allow_failure: false

static-analysis:
  stage: static-analysis
  script:
    - semgrep --config=auto --json .
    - sonarqube-scanner
  allow_failure: true

image-scan:
  stage: image-scan
  script:
    - trivy image --severity HIGH,CRITICAL myapp:$CI_COMMIT_SHA
    - dockle myapp:$CI_COMMIT_SHA
  allow_failure: false
```

### Security Policies

```rego
# OPA Gatekeeper policy
package kubernetes.admission

deny[msg] {
  input.request.kind.kind == "Deployment"
  not input.request.object.spec.template.spec.containers[_].securityContext.runAsNonRoot
  msg = "Containers must run as non-root"
}

deny[msg] {
  input.request.kind.kind == "Pod"
  input.request.object.spec.containers[_].securityContext.privileged
  msg = "Containers must not be privileged"
}
```

### SBOM Generation

```yaml
# CycloneDX in CI/CD
syft app:latest -o cyclonedx-json > sbom.json

# Trivy SBOM
trivy sbom app:latest --format cyclonedx

# SPDX
syft app:latest -o spdx-json
```

### Secrets Management

```yaml
# HashiCorp Vault integration
apiVersion: v1
kind: Secret
metadata:
  name: vault-secrets
type: Opaque
stringData:
  secret.properties: |
    DB_PASSWORD=$(vault kv get -field=password secret/database)
    API_KEY=$(vault kv get -field=api_key secret/api)
```

### SAST Tools

| Language | Tools |
|----------|-------|
| Python | Bandit, Safety, Semgrep |
| Java | SpotBugs, SonarQube |
| JavaScript | ESLint, Semgrep |
| Go | Gosec, Staticcheck |
| All | Semgrep, SonarQube |

### DAST Integration

```yaml
dast:
  stage: dynamic-analysis
  script:
    - zap-baseline.py -t $STAGING_URL -r zap_report.html
    - nuclei -u $STAGING_URL
  allow_failure: true
```

### Supply Chain Security

- Sign all container images (Cosign, Notary)
- Use SLSA-compliant build systems
- Implement SBOM generation and scanning
- Pin dependency versions
- Use proxy registries for caching
- Enable image signature verification
