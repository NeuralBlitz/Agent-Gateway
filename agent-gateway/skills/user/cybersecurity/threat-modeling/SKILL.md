---
name: Threat Modeling
category: cybersecurity
description: Systematic identification and prioritization of security threats to design effective countermeasures
tags: [stride, threat-analysis, attack-surface, risk-assessment, dfd]
version: "1.0"
---

# Threat Modeling

## What I Do

I provide guidance on systematically identifying, categorizing, and prioritizing security threats to applications and systems. This includes using frameworks like STRIDE and PASTA, creating data flow diagrams, analyzing attack surfaces, assessing risk, and recommending mitigations for identified threats.

## When to Use Me

- Designing a new application or feature and need to identify security risks
- Performing a threat assessment of an existing system
- Creating data flow diagrams to identify trust boundaries
- Prioritizing security work based on risk
- Documenting threat models for compliance or review
- Evaluating the security impact of architectural changes

## Core Concepts

1. **STRIDE**: Threat classification framework covering Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege.
2. **Data Flow Diagrams**: Visual representation of how data moves through a system, identifying processes, data stores, external entities, and trust boundaries.
3. **Attack Surface Analysis**: Enumeration of all entry points, interfaces, and data flows that an attacker could target.
4. **Trust Boundaries**: Lines in the architecture where the level of trust changes and where security controls must be enforced.
5. **Risk Rating**: Assessment of threat likelihood and impact (using DREAD, CVSS, or custom matrices) to prioritize mitigations.
6. **PASTA**: Process for Attack Simulation and Threat Analysis, a seven-stage risk-centric methodology.
7. **Attack Trees**: Hierarchical diagrams showing how an attacker could achieve a goal through different paths.

## Code Examples

### 1. Threat Model Document Structure (Python Data Model)

```python
from dataclasses import dataclass, field
from typing import List, Optional
from enum import Enum

class StrideCategory(Enum):
    SPOOFING = "Spoofing"
    TAMPERING = "Tampering"
    REPUDIATION = "Repudiation"
    INFO_DISCLOSURE = "Information Disclosure"
    DENIAL_OF_SERVICE = "Denial of Service"
    ELEVATION_OF_PRIVILEGE = "Elevation of Privilege"

class RiskLevel(Enum):
    CRITICAL = 4
    HIGH = 3
    MEDIUM = 2
    LOW = 1

@dataclass
class Threat:
    id: str
    title: str
    category: StrideCategory
    description: str
    affected_component: str
    risk: RiskLevel
    mitigations: List[str] = field(default_factory=list)
    status: str = "open"

@dataclass
class ThreatModel:
    name: str
    version: str
    components: List[str]
    trust_boundaries: List[str]
    threats: List[Threat] = field(default_factory=list)

    def threats_by_risk(self) -> List[Threat]:
        return sorted(self.threats, key=lambda t: t.risk.value, reverse=True)

    def open_threats(self) -> List[Threat]:
        return [t for t in self.threats if t.status == "open"]
```

### 2. Automated Attack Surface Enumeration (Python)

```python
from typing import Dict, List, Set
import ast
import os

def find_api_endpoints(source_dir: str) -> List[Dict[str, str]]:
    endpoints: List[Dict[str, str]] = []
    for root, _, files in os.walk(source_dir):
        for fname in files:
            if not fname.endswith(".py"):
                continue
            filepath = os.path.join(root, fname)
            with open(filepath, "r") as f:
                try:
                    tree = ast.parse(f.read())
                except SyntaxError:
                    continue
            for node in ast.walk(tree):
                if isinstance(node, ast.Call):
                    func = node.func
                    if isinstance(func, ast.Attribute) and func.attr in (
                        "get", "post", "put", "delete", "patch", "route"
                    ):
                        for arg in node.args:
                            if isinstance(arg, ast.Constant) and isinstance(arg.value, str):
                                endpoints.append({
                                    "file": filepath,
                                    "method": func.attr.upper(),
                                    "path": arg.value,
                                    "line": node.lineno,
                                })
    return endpoints
```

### 3. STRIDE Analysis Helper (Python)

```python
from typing import Dict, List

STRIDE_QUESTIONS: Dict[str, List[str]] = {
    "Spoofing": [
        "Can an attacker impersonate a legitimate user or service?",
        "Is authentication enforced on all entry points?",
        "Are credentials transmitted and stored securely?",
    ],
    "Tampering": [
        "Can data be modified in transit or at rest?",
        "Are integrity checks in place for critical data?",
        "Is input validated before processing?",
    ],
    "Repudiation": [
        "Can a user deny performing an action?",
        "Are audit logs tamper-proof and complete?",
        "Are critical operations logged with user identity?",
    ],
    "Information Disclosure": [
        "Can sensitive data be accessed by unauthorized users?",
        "Is data encrypted in transit and at rest?",
        "Do error messages reveal internal details?",
    ],
    "Denial of Service": [
        "Can the system be overwhelmed by excessive requests?",
        "Are rate limits and resource quotas in place?",
        "Are there single points of failure?",
    ],
    "Elevation of Privilege": [
        "Can a user gain privileges beyond their role?",
        "Is authorization checked on every operation?",
        "Are admin interfaces properly protected?",
    ],
}

def generate_stride_checklist(component: str) -> Dict[str, List[str]]:
    return {
        category: [f"[{component}] {q}" for q in questions]
        for category, questions in STRIDE_QUESTIONS.items()
    }
```

## Best Practices

1. **Threat model early** in the design phase before code is written, and update when architecture changes.
2. **Use data flow diagrams** to visualize all components, data flows, and trust boundaries.
3. **Apply STRIDE systematically** to each component and data flow in the diagram.
4. **Prioritize threats by risk** using likelihood and impact rather than treating all threats equally.
5. **Document mitigations** for each threat with specific implementation details and ownership.
6. **Review threat models** with cross-functional teams including developers, architects, and security engineers.
7. **Track threat model findings** alongside other security work in the team's backlog.
8. **Automate attack surface discovery** to keep the inventory of entry points current.
9. **Use abuse cases** alongside use cases to ensure adversarial scenarios are considered.
10. **Version threat models** alongside the code they describe for traceability.
