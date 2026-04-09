---
name: Security Automation
category: cybersecurity
description: Automating security scanning, compliance checks, incident response, and remediation workflows
tags: [automation, soar, sast, dast, sca, pipeline-security, devsecops]
version: "1.0"
---

# Security Automation

## What I Do

I provide guidance on automating security processes across the software development lifecycle. This includes integrating SAST/DAST/SCA scanning into CI/CD pipelines, automating compliance checks, building security orchestration and automated response (SOAR) workflows, and implementing infrastructure security scanning.

## When to Use Me

- Integrating security scanners into CI/CD pipelines
- Automating vulnerability triage and ticket creation
- Building automated incident response playbooks
- Setting up compliance-as-code scanning
- Automating secret detection in repositories
- Creating security guardrails that do not slow down development

## Core Concepts

1. **Shift Left Security**: Integrate security testing early in the SDLC to catch vulnerabilities when they are cheapest to fix.
2. **SAST (Static Application Security Testing)**: Analyze source code for vulnerability patterns without executing the application.
3. **DAST (Dynamic Application Security Testing)**: Test running applications by sending crafted requests to find runtime vulnerabilities.
4. **SCA (Software Composition Analysis)**: Identify known vulnerabilities in third-party dependencies and licenses.
5. **Secret Detection**: Scan repositories for accidentally committed credentials, API keys, and tokens.
6. **Policy as Code**: Express security and compliance policies as executable code that can be versioned and tested.
7. **SOAR**: Security Orchestration, Automation, and Response platforms that coordinate tools and automate playbooks.
8. **Infrastructure Scanning**: Scan IaC templates and running infrastructure for misconfigurations.

## Code Examples

### 1. GitHub Actions Security Pipeline

```yaml
name: Security Scanning
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  sast:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Semgrep SAST
        uses: returntocorp/semgrep-action@v1
        with:
          config: p/owasp-top-ten p/python

  sca:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Trivy SCA
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: fs
          severity: CRITICAL,HIGH
          exit-code: 1

  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: Run Gitleaks
        uses: gitleaks/gitleaks-action@v2
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

  image-scan:
    runs-on: ubuntu-latest
    needs: [sast, sca, secrets]
    steps:
      - uses: actions/checkout@v4
      - name: Build image
        run: docker build -t app:${{ github.sha }} .
      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: app:${{ github.sha }}
          severity: CRITICAL,HIGH
          exit-code: 1
```

### 2. Automated Vulnerability Triage (Python)

```python
from typing import List, Dict, Any
from enum import Enum

class Priority(Enum):
    CRITICAL = "P0"
    HIGH = "P1"
    MEDIUM = "P2"
    LOW = "P3"

def triage_vulnerability(vuln: Dict[str, Any]) -> Priority:
    severity = vuln.get("severity", "").upper()
    is_exploitable = vuln.get("exploitable", False)
    is_internet_facing = vuln.get("internet_facing", False)
    has_fix = vuln.get("fix_available", False)

    if severity == "CRITICAL" and is_internet_facing:
        return Priority.CRITICAL
    if severity == "CRITICAL" or (severity == "HIGH" and is_exploitable):
        return Priority.HIGH
    if severity == "HIGH" or (severity == "MEDIUM" and is_internet_facing):
        return Priority.MEDIUM
    return Priority.LOW

def process_scan_results(results: List[Dict[str, Any]]) -> Dict[str, List]:
    triaged: Dict[str, List] = {p.value: [] for p in Priority}
    for vuln in results:
        priority = triage_vulnerability(vuln)
        triaged[priority.value].append(vuln)
    return triaged
```

### 3. Pre-Commit Secret Detection Hook

```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.18.0
    hooks:
      - id: gitleaks

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: detect-private-key
      - id: check-added-large-files
        args: ['--maxkb=500']
```

## Best Practices

1. **Fail the build** on critical and high severity findings with no known exceptions.
2. **Use baseline files** to track accepted risks and prevent alert fatigue from known issues.
3. **Run scans incrementally** on pull requests to provide fast feedback to developers.
4. **Automate secret rotation** when leaked credentials are detected.
5. **Centralize scan results** in a security dashboard for unified visibility across projects.
6. **Implement exception workflows** that require security team approval with expiration dates.
7. **Scan infrastructure-as-code** templates before applying changes to catch misconfigurations early.
8. **Integrate scanner findings** into developer workflows (IDE plugins, PR comments) for frictionless adoption.
9. **Measure mean time to remediate** (MTTR) by severity to track security posture improvement.
10. **Test your automation** by intentionally introducing known vulnerabilities to verify detection.
