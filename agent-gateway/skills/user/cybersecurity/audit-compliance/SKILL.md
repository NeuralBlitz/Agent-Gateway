---
name: Audit and Compliance
category: cybersecurity
description: Security audit logging, compliance frameworks, and evidence collection for regulatory requirements
tags: [audit, compliance, soc2, hipaa, pci-dss, gdpr, logging, evidence]
version: "1.0"
---

# Audit and Compliance

## What I Do

I provide guidance on implementing audit logging, achieving compliance with security frameworks (SOC 2, HIPAA, PCI-DSS, GDPR), collecting evidence for audits, and building systems that meet regulatory requirements. This includes designing immutable audit trails, configuring compliance monitoring, and automating evidence collection.

## When to Use Me

- Implementing audit logging for security-relevant events
- Preparing for SOC 2, HIPAA, PCI-DSS, or ISO 27001 compliance
- Designing data retention and deletion policies for GDPR
- Building evidence collection automation for audits
- Configuring compliance monitoring and alerting
- Implementing data classification and handling policies

## Core Concepts

1. **Audit Trail**: Immutable, chronological record of security-relevant events including who did what, when, and from where.
2. **SOC 2**: Service Organization Control 2 framework covering security, availability, processing integrity, confidentiality, and privacy.
3. **HIPAA**: Health Insurance Portability and Accountability Act requiring safeguards for protected health information.
4. **PCI-DSS**: Payment Card Industry Data Security Standard for organizations handling credit card data.
5. **GDPR**: General Data Protection Regulation governing personal data processing for EU residents.
6. **Compliance as Code**: Express compliance requirements as automated checks that run continuously.
7. **Data Classification**: Categorizing data by sensitivity level to apply appropriate security controls.
8. **Evidence Collection**: Automated gathering and preservation of artifacts that demonstrate compliance controls.

## Code Examples

### 1. Structured Audit Logger (Python)

```python
import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

class AuditLogger:
    def __init__(self, service_name: str) -> None:
        self.logger = logging.getLogger(f"audit.{service_name}")
        self.service_name = service_name

    def log_event(
        self,
        event_type: str,
        actor: str,
        resource: str,
        action: str,
        outcome: str,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> str:
        event_id = str(uuid.uuid4())
        record = {
            "event_id": event_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "service": self.service_name,
            "event_type": event_type,
            "actor": actor,
            "resource": resource,
            "action": action,
            "outcome": outcome,
            "ip_address": ip_address,
            "details": details or {},
        }
        self.logger.info(json.dumps(record, default=str))
        return event_id

audit = AuditLogger("neuralblitz-api")
audit.log_event(
    event_type="authentication",
    actor="user@example.com",
    resource="/api/v1/login",
    action="login",
    outcome="success",
    ip_address="192.168.1.100",
)
```

### 2. Data Retention Policy Enforcement (Python)

```python
from datetime import datetime, timedelta, timezone
from typing import Dict, List
from dataclasses import dataclass

@dataclass
class RetentionPolicy:
    data_class: str
    retention_days: int
    requires_deletion_log: bool

POLICIES: Dict[str, RetentionPolicy] = {
    "user_activity": RetentionPolicy("internal", 90, True),
    "audit_logs": RetentionPolicy("compliance", 2555, True),
    "session_data": RetentionPolicy("ephemeral", 30, False),
    "pii_data": RetentionPolicy("sensitive", 365, True),
}

def find_expired_records(
    policy_name: str,
    records: List[Dict],
) -> List[Dict]:
    policy = POLICIES.get(policy_name)
    if not policy:
        raise ValueError(f"Unknown policy: {policy_name}")
    cutoff = datetime.now(timezone.utc) - timedelta(days=policy.retention_days)
    return [r for r in records if r.get("created_at", datetime.max) < cutoff]
```

### 3. Compliance Check Automation (Python)

```python
from dataclasses import dataclass, field
from typing import List, Callable, Any
from enum import Enum

class CheckStatus(Enum):
    PASS = "pass"
    FAIL = "fail"
    WARNING = "warning"

@dataclass
class ComplianceCheck:
    control_id: str
    framework: str
    description: str
    check_fn: Callable[[], CheckStatus]

@dataclass
class ComplianceReport:
    framework: str
    checks: List[dict] = field(default_factory=list)

    @property
    def pass_rate(self) -> float:
        if not self.checks:
            return 0.0
        passed = sum(1 for c in self.checks if c["status"] == "pass")
        return passed / len(self.checks)

def check_encryption_at_rest() -> CheckStatus:
    return CheckStatus.PASS

def check_mfa_enabled() -> CheckStatus:
    return CheckStatus.PASS

def check_audit_logging() -> CheckStatus:
    return CheckStatus.PASS

SOC2_CHECKS = [
    ComplianceCheck("CC6.1", "SOC2", "Encryption at rest enabled", check_encryption_at_rest),
    ComplianceCheck("CC6.2", "SOC2", "MFA enabled for all users", check_mfa_enabled),
    ComplianceCheck("CC7.2", "SOC2", "Audit logging enabled", check_audit_logging),
]

def run_compliance_suite(checks: List[ComplianceCheck]) -> ComplianceReport:
    report = ComplianceReport(framework=checks[0].framework if checks else "unknown")
    for check in checks:
        status = check.check_fn()
        report.checks.append({
            "control_id": check.control_id,
            "description": check.description,
            "status": status.value,
        })
    return report
```

## Best Practices

1. **Log all security events** including authentication, authorization decisions, data access, and configuration changes.
2. **Make audit logs immutable** using append-only storage, write-once media, or cryptographic chaining.
3. **Include context in every log entry**: who (actor), what (action/resource), when (timestamp), where (IP/location), and outcome.
4. **Never log sensitive data** such as passwords, tokens, PII, or payment card numbers in audit logs.
5. **Retain audit logs** for the period required by your compliance framework (typically 1-7 years).
6. **Automate compliance checks** and run them continuously rather than relying on periodic manual reviews.
7. **Classify all data** by sensitivity level and apply controls proportional to the classification.
8. **Implement data deletion workflows** with verification and logging to meet GDPR right-to-erasure requirements.
9. **Generate compliance evidence automatically** from monitoring systems rather than manual screenshots.
10. **Review and update policies** annually or when regulations change to maintain compliance.
