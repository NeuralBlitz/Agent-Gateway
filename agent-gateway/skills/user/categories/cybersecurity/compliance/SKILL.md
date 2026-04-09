---
name: Compliance
description: Regulatory compliance management, policy enforcement, and compliance automation
license: MIT
compatibility:
  - Python 3.8+
  - Linux
  - Windows
audience: Compliance officers, security architects, risk managers
category: Cybersecurity
---

# Compliance

## What I do

I enable regulatory compliance management including mapping requirements to controls, tracking compliance status, automating evidence collection, and maintaining compliance documentation for various frameworks and regulations.

## When to use me

- Implementing compliance programs for frameworks (SOC2, ISO27001, HIPAA, PCI-DSS, GDPR)
- Mapping regulatory requirements to technical controls
- Automating compliance evidence collection
- Tracking compliance status and gaps
- Preparing for audits and certifications
- Managing policy and procedure updates
- Continuous compliance monitoring
- Vendor compliance assessments

## Core Concepts

- **Regulatory Frameworks**: SOC2, ISO27001, HIPAA, PCI-DSS, GDPR, SOX, NIST CSF
- **Control Mapping**: Linking requirements to implemented controls
- **Evidence Management**: Automated collection and storage
- **Policy Management**: Creation, review, and approval workflows
- **Gap Analysis**: Identifying compliance gaps
- **Compliance Monitoring**: Continuous tracking of controls
- **Audit Readiness**: Maintaining audit-ready state
- **Risk Treatment**: Accepting, mitigating, transferring risks
- **Compliance Calendar**: Tracking deadlines and renewals
- **Reporting**: Compliance status dashboards and reports

## Code Examples

### Compliance Framework Manager

```python
from enum import Enum
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta

class ComplianceFramework(Enum):
    SOC2_TYPE2 = "SOC2"
    ISO27001 = "ISO27001"
    HIPAA = "HIPAA"
    PCI_DSS = "PCI_DSS"
    GDPR = "GDPR"
    NIST_CSF = "NIST_CSF"
    SOX = "SOX"

class ComplianceStatus(Enum):
    COMPLIANT = "compliant"
    NON_COMPLIANT = "non_compliant"
    PARTIAL = "partial"
    NOT_APPLICABLE = "not_applicable"
    IN_PROGRESS = "in_progress"

class EvidenceType(Enum):
    AUTOMATED = "automated"
    MANUAL = "manual"
    SYSTEM_GENERATED = "system_generated"
    THIRD_PARTY = "third_party"

@dataclass
class ComplianceRequirement:
    req_id: str
    framework: ComplianceFramework
    name: str
    description: str
    controls: List[str]
    status: ComplianceStatus
    last_reviewed: datetime
    next_review: datetime
    evidence: List[Dict]
    notes: str

@dataclass
class ComplianceControl:
    control_id: str
    name: str
    description: str
    requirements: List[str]
    implementation: str
    owner: str
    test_procedures: List[str]
    automation_level: str
    last_tested: datetime
    test_results: Dict

class ComplianceManager:
    def __init__(self):
        self.requirements: Dict[str, ComplianceRequirement] = {}
        self.controls: Dict[str, ComplianceControl] = {}
        self.frameworks: Dict[ComplianceFramework, List[str]] = {}
    
    def add_requirement(self, req: ComplianceRequirement):
        self.requirements[req.req_id] = req
        
        if req.framework not in self.frameworks:
            self.frameworks[req.framework] = []
        self.frameworks[req.framework].append(req.req_id)
    
    def create_soc2_control(self, control_id: str, name: str, 
                            trust_service_criteria: str) -> ComplianceControl:
        control = ComplianceControl(
            control_id=control_id,
            name=name,
            description=f"SOC2 control for {trust_service_criteria}",
            requirements=[control_id],
            implementation="Technical and administrative controls",
            owner="Security Team",
            test_procedures=[f"Test {name} effectiveness"],
            automation_level="semi-automated",
            last_tested=datetime.now(),
            test_results={}
        )
        self.controls[control_id] = control
        return control
    
    def map_control_to_requirements(self, control_id: str, req_ids: List[str]):
        if control_id in self.controls:
            self.controls[control_id].requirements.extend(req_ids)
            for req_id in req_ids:
                if req_id in self.requirements:
                    if control_id not in self.requirements[req_id].controls:
                        self.requirements[req_id].controls.append(control_id)
    
    def assess_requirement(self, req_id: str, status: ComplianceStatus,
                          notes: str, evidence: List[Dict]):
        if req_id in self.requirements:
            self.requirements[req_id].status = status
            self.requirements[req_id].notes = notes
            self.requirements[req_id].evidence.extend(evidence)
            self.requirements[req_id].last_reviewed = datetime.now()
    
    def get_framework_status(self, framework: ComplianceFramework) -> Dict:
        req_ids = self.frameworks.get(framework, [])
        requirements = [self.requirements[r] for r in req_ids if r in self.requirements]
        
        total = len(requirements)
        compliant = sum(1 for r in requirements if r.status == ComplianceStatus.COMPLIANT)
        non_compliant = sum(1 for r in requirements if r.status == ComplianceStatus.NON_COMPLIANT)
        partial = sum(1 for r in requirements if r.status == ComplianceStatus.PARTIAL)
        
        return {
            "framework": framework.value,
            "total_requirements": total,
            "compliant": compliant,
            "non_compliant": non_compliant,
            "partial": partial,
            "compliance_rate": round(compliant / max(total, 1) * 100, 2)
        }
    
    def generate_compliance_report(self, framework: ComplianceFramework) -> Dict:
        status = self.get_framework_status(framework)
        req_ids = self.frameworks.get(framework, [])
        
        requirements = []
        for req_id in req_ids:
            if req_id in self.requirements:
                r = self.requirements[req_id]
                requirements.append({
                    "id": r.req_id,
                    "name": r.name,
                    "status": r.status.value,
                    "controls": r.controls,
                    "evidence_count": len(r.evidence)
                })
        
        return {
            "report_date": datetime.now().isoformat(),
            "framework": framework.value,
            "status": status,
            "requirements": requirements,
            "gaps": [r for r in requirements 
                    if self.requirements[r["id"]].status != ComplianceStatus.COMPLIANT]
        }
```

### PCI-DSS Compliance Checker

```python
from enum import Enum
from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime

class PCIDSSRequirement(Enum):
    FIREWALLS = "1.1"
    ENCRYPTION = "3.4"
    VULNERABILITY = "6.1"
    ACCESS_CONTROL = "7.1"
    MONITORING = "10.1"
    TESTING = "11.1"
    SECURITY_POLICY = "12.1"

@dataclass
class PCIDSSFinding:
    requirement_id: str
    description: str
    status: str
    remediation: str
    evidence: str

class PCIDSSComplianceChecker:
    def __init__(self):
        self.findings: List[PCIDSSFinding] = []
    
    def check_firewall_config(self, firewall_rules: List[Dict]) -> List[PCIDSSFinding]:
        findings = []
        
        for rule in firewall_rules:
            if rule.get('source') == 'any' and rule.get('dest') == 'cardholder_data':
                findings.append(PCIDSSFinding(
                    requirement_id="1.1",
                    description="Firewall allows unrestricted access to cardholder data",
                    status="FAIL",
                    remediation="Restrict access to least privilege required",
                    evidence=f"Rule: {rule}"
                ))
        
        return findings
    
    def check_encryption(self, encryption_config: Dict) -> List[PCIDSSFinding]:
        findings = []
        
        if encryption_config.get('algorithm') in ['DES', '3DES']:
            findings.append(PCIDSSFinding(
                requirement_id="3.4",
                description="Weak encryption algorithm detected",
                status="FAIL",
                remediation="Use AES-256 or stronger",
                evidence=f"Algorithm: {encryption_config.get('algorithm')}"
            ))
        
        if not encryption_config.get('key_management'):
            findings.append(PCIDSSFinding(
                requirement_id="3.6",
                description="Key management procedures not documented",
                status="FAIL",
                remediation="Document key management procedures",
                evidence="Missing key management configuration"
            ))
        
        return findings
    
    def check_access_control(self, access_config: Dict) -> List[PCIDSSFinding]:
        findings = []
        
        if access_config.get('mfa_required') == False:
            findings.append(PCIDSSFinding(
                requirement_id="7.2",
                description="Multi-factor authentication not required for cardholder data access",
                status="FAIL",
                remediation="Implement MFA for all access to cardholder data",
                evidence="MFA disabled"
            ))
        
        return findings
    
    def run_full_assessment(self, environment: Dict) -> Dict:
        self.findings = []
        
        self.findings.extend(self.check_firewall_config(
            environment.get('firewall_rules', [])
        ))
        self.findings.extend(self.check_encryption(
            environment.get('encryption_config', {})
        ))
        self.findings.extend(self.check_access_control(
            environment.get('access_config', {})
        ))
        
        passed = len([f for f in self.findings if f.status == "PASS"])
        failed = len([f for f in self.findings if f.status == "FAIL"])
        
        return {
            "assessment_date": datetime.now().isoformat(),
            "total_requirements_tested": 12,
            "passed": passed,
            "failed": failed,
            "compliance_status": "COMPLIANT" if failed == 0 else "NON_COMPLIANT",
            "findings": [f.__dict__ for f in self.findings]
        }
```

### GDPR Compliance Tracker

```python
from enum import Enum
from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime

class GDPRArticle(Enum):
    CONSENT = "7"
    RIGHT_TO_ACCESS = "15"
    RIGHT_TO_ERASURE = "17"
    DATA_PORTABILITY = "20"
    DATA_PROTECTION_BY_DESIGN = "25"
    DATA_BREACH_NOTIFICATION = "33"

@dataclass
class GDPRRequirement:
    article: GDPRArticle
    name: str
    description: str
    implemented: bool
    last_reviewed: datetime
    evidence: List[str]
    gap: str = ""

class GDPRComplianceManager:
    def __init__(self):
        self.requirements: Dict[GDPRArticle, GDPRRequirement] = {}
    
    def add_requirement(self, req: GDPRRequirement):
        self.requirements[req.article] = req
    
    def check_consent_mechanism(self, consent_data: Dict) -> Dict:
        findings = []
        
        if not consent_data.get('explicit_consent'):
            findings.append({
                "issue": "No explicit consent mechanism found",
                "remediation": "Implement explicit consent for data processing",
                "article": "GDPR Article 7"
            })
        
        if not consent_data.get('withdrawal_available'):
            findings.append({
                "issue": "No consent withdrawal mechanism",
                "remediation": "Implement easy consent withdrawal",
                "article": "GDPR Article 7(3)"
            })
        
        return findings
    
    def check_data_subject_rights(self, rights_config: Dict) -> Dict:
        findings = []
        
        rights_required = ['access', 'erasure', 'portability', 'rectification']
        
        for right in rights_required:
            if not rights_config.get(right, {}).get('implemented', False):
                findings.append({
                    "issue": f"{right.title()} right not implemented",
                    "remediation": f"Implement {right} request handling",
                    "article": f"GDPR Article {15 + int(right in ['erasure', 'portability']) * 5}"
                })
        
        return findings
    
    def assess_data_processing(self, processing_activities: List[Dict]) -> Dict:
        high_risk_activities = []
        
        for activity in processing_activities:
            if activity.get('risk_level') == 'high':
                high_risk_activities.append({
                    "activity": activity.get('name'),
                    "purpose": activity.get('purpose'),
                    "dpo_review": activity.get('dpo_review', False),
                    "pia_completed": activity.get('pia_completed', False)
                })
        
        return {
            "total_activities": len(processing_activities),
            "high_risk_count": len(high_risk_activities),
            "high_risk_activities": high_risk_activities,
            "requires_dpia": len([a for a in high_risk_activities 
                                 if not a.get('pia_completed')]) > 0
        }
    
    def generate_gdpr_report(self) -> Dict:
        implemented = sum(1 for r in self.requirements.values() if r.implemented)
        total = len(self.requirements)
        
        gaps = [r for r in self.requirements.values() if not r.implemented]
        
        return {
            "report_date": datetime.now().isoformat(),
            "total_requirements": total,
            "implemented": implemented,
            "compliance_rate": round(implemented / max(total, 1) * 100, 2),
            "gaps": [{"article": g.article.value, "name": g.name, "gap": g.gap} 
                    for g in gaps],
            "priority_actions": [
                "Complete DPO appointment if not done",
                "Implement consent management",
                "Establish breach notification procedures",
                "Document all processing activities"
            ]
        }
```

## Best Practices

- Maintain a unified control framework mapping to multiple regulations
- Automate evidence collection wherever possible
- Conduct regular gap assessments against applicable frameworks
- Implement continuous monitoring with alerts for control drift
- Keep policies updated and accessible to employees
- Train staff on compliance requirements and their responsibilities
- Document all compliance decisions and justifications
- Use compliance management platforms for tracking
- Establish clear ownership for each control and requirement
- Regular internal audits to identify gaps before external audits
- Maintain audit trails for all compliance activities
- Engage legal counsel for regulatory interpretation

## Common Patterns

- **Unified Compliance**: Map SOC2, ISO27001, and NIST CSF controls to common framework
- **Continuous Compliance**: Automated monitoring with real-time dashboards
- **Compliance as Code**: Infrastructure and policy as code for automated compliance
- **Evidence Automation**: CI/CD integration for compliance evidence collection
- **Risk-Based Prioritization**: Focus resources on highest-risk compliance gaps
- **Vendor Compliance Management**: Third-party risk and compliance assessments
