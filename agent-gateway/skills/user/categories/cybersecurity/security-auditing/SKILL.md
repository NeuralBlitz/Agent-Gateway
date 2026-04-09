---
name: Security Auditing
description: Systematic evaluation of security controls, compliance assessments, and audit reporting
license: MIT
compatibility:
  - Python 3.8+
  - Linux
  - Windows
audience: Security auditors, compliance officers, IT auditors
category: Cybersecurity
---

# Security Auditing

## What I do

I enable comprehensive security audits including control assessments, compliance evaluations, policy reviews, configuration analysis, and audit reporting. I help organizations validate security posture and meet regulatory requirements.

## When to use me

- Conducting internal security audits
- Preparing for external audit assessments
- Compliance checking (SOC2, ISO27001, HIPAA, PCI-DSS)
- Configuration baseline reviews
- Policy and procedure assessments
- Third-party vendor security reviews
- Continuous compliance monitoring
- Audit remediation tracking

## Core Concepts

- **Audit Framework**: NIST CSF, ISO 27001, COBIT, COSO
- **Control Assessment**: Technical, administrative, physical controls
- **Risk Assessment**: Likelihood and impact analysis
- **Compliance Mapping**: Linking controls to requirements
- **Evidence Collection**: Documentation and artifacts
- **Gap Analysis**: Current vs desired state
- **Audit Trail**: Recording all audit activities
- **Remediation Tracking**: Following up on findings
- **Reporting**: Executive and technical audit reports
- **Continuous Monitoring**: Ongoing compliance verification

## Code Examples

### Audit Framework Manager

```python
from enum import Enum
from typing import Dict, List
from dataclasses import dataclass, field
from datetime import datetime, timedelta

class ControlFamily(Enum):
    ACCESS_CONTROL = "AC"
    AUDIT_AND_ACCOUNTABILITY = "AU"
    IDENTIFICATION_AND_AUTHENTICATION = "IA"
    SYSTEM_AND_COMMUNICATIONS_PROTECTION = "SC"
    SYSTEM_AND_INFORMATION_INTEGRITY = "SI"

class ControlStatus(Enum):
    NOT_ASSESSED = "not_assessed"
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIALLY_COMPLIANT = "partially_compliant"
    NOT_APPLICABLE = "not_applicable"

@dataclass
class AuditControl:
    control_id: str
    name: str
    description: str
    family: ControlFamily
    status: ControlStatus
    last_assessed: datetime
    next_assessment: datetime
    assessor: str
    findings: List[str]
    evidence: List[str]
    risk_score: int = 0

class SecurityAuditManager:
    def __init__(self):
        self.controls: Dict[str, AuditControl] = {}
        self.findings: List[Dict] = []
    
    def create_control(self, control_id: str, name: str, description: str,
                      family: ControlFamily) -> AuditControl:
        control = AuditControl(
            control_id=control_id,
            name=name,
            description=description,
            family=family,
            status=ControlStatus.NOT_ASSESSED,
            last_assessed=datetime.now(),
            next_assessment=datetime.now() + timedelta(days=365),
            assessor="",
            findings=[],
            evidence=[]
        )
        self.controls[control_id] = control
        return control
    
    def assess_control(self, control_id: str, status: ControlStatus,
                      assessor: str, findings: List[str], evidence: List[str]):
        if control_id in self.controls:
            self.controls[control_id].status = status
            self.controls[control_id].assessor = assessor
            self.controls[control_id].findings = findings
            self.controls[control_id].evidence = evidence
            self.controls[control_id].last_assessed = datetime.now()
            
            if status == ControlStatus.NON_COMPLIANT:
                self.controls[control_id].risk_score = 80
            elif status == ControlStatus.PARTIALLY_COMPLIANT:
                self.controls[control_id].risk_score = 50
    
    def get_compliance_summary(self) -> Dict:
        total = len(self.controls)
        compliant = sum(1 for c in self.controls.values() 
                        if c.status == ControlStatus.COMPLIANT)
        non_compliant = sum(1 for c in self.controls.values() 
                           if c.status == ControlStatus.NON_COMPLIANT)
        
        return {
            "total_controls": total,
            "compliant": compliant,
            "non_compliant": non_compliant,
            "compliance_rate": round(compliant / max(total, 1) * 100, 2)
        }
    
    def export_audit_report(self) -> Dict:
        return {
            "generated_at": datetime.now().isoformat(),
            "compliance_summary": self.get_compliance_summary(),
            "controls": [
                {
                    "id": c.control_id,
                    "name": c.name,
                    "family": c.family.value,
                    "status": c.status.value,
                    "risk_score": c.risk_score
                }
                for c in self.controls.values()
            ]
        }
```

### Configuration Compliance Checker

```python
import re
from typing import Dict, List
from dataclasses import dataclass
from enum import Enum

class ComplianceLevel(Enum):
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"
    INFO = "info"

@dataclass
class ComplianceCheck:
    check_id: str
    name: str
    description: str
    level: ComplianceLevel
    findings: str
    remediation: str
    severity: str

class ConfigurationAuditor:
    def check_ssh_config(self, sshd_config: str) -> List[ComplianceCheck]:
        findings = []
        
        if re.search(r'^PermitRootLogin\s+yes', sshd_config, re.MULTILINE):
            findings.append(ComplianceCheck(
                check_id="SSH-001",
                name="Root Login Configuration",
                description="SSH root login should be disabled",
                level=ComplianceLevel.FAIL,
                findings="PermitRootLogin is set to yes",
                remediation="Set PermitRootLogin to no",
                severity="HIGH"
            ))
        
        if re.search(r'^Protocol\s+1', sshd_config, re.MULTILINE):
            findings.append(ComplianceCheck(
                check_id="SSH-002",
                name="SSH Protocol Version",
                description="SSH protocol version 1 should not be used",
                level=ComplianceLevel.FAIL,
                findings="Protocol 1 is enabled",
                remediation="Set Protocol to 2 only",
                severity="HIGH"
            ))
        
        return findings
    
    def check_password_policy(self, policy_data: Dict) -> List[ComplianceCheck]:
        findings = []
        
        if policy_data.get('min_length', 0) < 12:
            findings.append(ComplianceCheck(
                check_id="PW-001",
                name="Minimum Password Length",
                description="Password minimum length should be at least 12",
                level=ComplianceLevel.FAIL,
                findings=f"Minimum length is {policy_data.get('min_length', 0)}",
                remediation="Set minimum password length to 12 or more",
                severity="HIGH"
            ))
        
        return findings
    
    def generate_report(self, checks: List[ComplianceCheck]) -> Dict:
        passed = sum(1 for c in checks if c.level == ComplianceLevel.PASS)
        failed = sum(1 for c in checks if c.level == ComplianceLevel.FAIL)
        
        return {
            "total_checks": len(checks),
            "passed": passed,
            "failed": failed,
            "pass_rate": round(passed / max(len(checks), 1) * 100, 2),
            "findings": [c.__dict__ for c in checks if c.level == ComplianceLevel.FAIL]
        }
```

## Best Practices

- Follow established audit frameworks (NIST, ISO 27001, CIS)
- Document scope, methodology, and criteria before starting
- Collect evidence before the assessment period ends
- Use risk-based approach to prioritize high-risk areas
- Maintain auditor independence and objectivity
- Communicate findings clearly to stakeholders
- Track remediation through completion
- Conduct regular internal audits between external assessments
- Update controls based on framework changes
- Train audit staff on current threats and vulnerabilities

## Common Patterns

- **SOC 2 Type II**: Annual audit of security, availability, processing integrity, confidentiality, privacy
- **ISO 27001 Certification**: ISMS certification with annual surveillance audits
- **PCI DSS Assessment**: Annual assessment for cardholder data environments
- **HIPAA Audit**: Periodic audits of PHI protection controls
- **Continuous Auditing**: Automated controls monitoring with sampling
