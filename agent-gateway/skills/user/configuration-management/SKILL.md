# Configuration Management

## Overview

Configuration Management is the systematic handling of configuration changes throughout the software lifecycle, ensuring that systems maintain consistency, traceability, and compliance. It encompasses hardware, software, documentation, and deployment configurations across the enterprise.

## Description

Configuration Management establishes and maintains consistency in product performance, functional, and physical attributes throughout its lifecycle. It involves identifying, controlling, tracking, and reporting on configuration items, managing changes to those items, and verifying compliance with specified requirements.

## Prerequisites

- IT operations knowledge
- Change management processes
- Asset management concepts
- Compliance requirements
- Automation tooling

## Core Competencies

- Configuration Item (CI) identification
- Change control processes
- Configuration auditing
- Compliance verification
- CMDB management
- Impact analysis
- Rollback procedures
- Baseline management

## Implementation

```python
import uuid
import json
from typing import Any, Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class CIType(Enum):
    SERVER = "server"
    APPLICATION = "application"
    DATABASE = "database"
    NETWORK = "network"
    STORAGE = "storage"
    SERVICE = "service"

class ChangeStatus(Enum):
    DRAFT = "draft"
    PENDING = "pending_review"
    APPROVED = "approved"
    IMPLEMENTED = "implemented"
    CLOSED = "closed"
    REJECTED = "rejected"

class ChangeRisk(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class ConfigurationItem:
    id: str
    name: str
    ci_type: CIType
    attributes: Dict[str, Any]
    version: str
    created_at: datetime
    updated_at: datetime
    owner: str
    status: str = "active"
    dependencies: List[str] = field(default_factory=list)

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())
        if not self.version:
            self.version = "1.0.0"

@dataclass
class ConfigurationChange:
    id: str
    ci_id: str
    change_type: str
    old_value: Dict[str, Any]
    new_value: Dict[str, Any]
    reason: str
    requested_by: str
    requested_at: datetime
    status: ChangeStatus
    risk_level: ChangeRisk = ChangeRisk.MEDIUM
    approved_by: Optional[str] = None
    approved_at: Optional[datetime] = None
    implemented_by: Optional[str] = None
    implemented_at: Optional[datetime] = None
    rollback_plan: Dict = field(default_factory=dict)

    def __post_init__(self):
        if not self.id:
            self.id = str(uuid.uuid4())
        if not self.requested_at:
            self.requested_at = datetime.now()

class CMDB:
    def __init__(self):
        self.items: Dict[str, ConfigurationItem] = {}
        self.history: List[ConfigurationChange] = []
        self.baselines: Dict[str, Dict[str, str]] = {}

    def add_ci(self, ci: ConfigurationItem):
        if ci.id in self.items:
            raise ValueError(f"CI already exists: {ci.id}")
        self.items[ci.id] = ci
        logger.info(f"Added CI: {ci.name} ({ci.ci_type.value})")

    def update_ci(self, ci_id: str, updates: Dict[str, Any], changed_by: str, reason: str):
        if ci_id not in self.items:
            raise ValueError(f"CI not found: {ci_id}")

        old_ci = self.items[ci_id]
        old_value = {"attributes": old_ci.attributes.copy()}

        for key, value in updates.items():
            if hasattr(old_ci, key):
                setattr(old_ci, key, value)

        old_ci.updated_at = datetime.now()
        new_value = {"attributes": old_ci.attributes.copy()}

        change = ConfigurationChange(
            ci_id=ci_id,
            change_type="update",
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            requested_by=changed_by,
            status=ChangeStatus.PENDING,
        )
        self.history.append(change)
        logger.info(f"Updated CI: {ci_id}")

    def get_ci(self, ci_id: str) -> Optional[ConfigurationItem]:
        return self.items.get(ci_id)

    def get_cis_by_type(self, ci_type: CIType) -> List[ConfigurationItem]:
        return [ci for ci in self.items.values() if ci.ci_type == ci_type]

    def create_baseline(self, name: str, ci_ids: List[str], description: str = ""):
        baseline = {
            "name": name,
            "description": description,
            "timestamp": datetime.now().isoformat(),
            "items": {ci_id: self.items[ci_id].version for ci_id in ci_ids if ci_id in self.items}
        }
        self.baselines[name] = baseline
        return baseline

    def compare_baseline(self, baseline_name: str) -> Dict:
        if baseline_name not in self.baselines:
            raise ValueError(f"Baseline not found: {baseline_name}")

        baseline = self.baselines[baseline_name]
        deviations = {"added": [], "removed": [], "modified": []}

        for ci_id, baseline_version in baseline["items"].items():
            if ci_id not in self.items:
                deviations["removed"].append({"id": ci_id, "baseline_version": baseline_version})
            elif self.items[ci_id].version != baseline_version:
                deviations["modified"].append({
                    "id": ci_id,
                    "baseline_version": baseline_version,
                    "current_version": self.items[ci_id].version
                })

        for ci_id in self.items:
            if ci_id not in baseline["items"]:
                deviations["added"].append({"id": ci_id, "current_version": self.items[ci_id].version})

        return deviations

class ChangeManager:
    def __init__(self, cmdb: CMDB):
        self.cmdb = cmdb
        self.changes: Dict[str, ConfigurationChange] = {}
        self.approval_workflows: Dict[str, List[str]] = {}

    def create_change_request(
        self,
        ci_id: str,
        change_type: str,
        new_value: Dict[str, Any],
        requested_by: str,
        reason: str,
        risk_level: ChangeRisk = ChangeRisk.MEDIUM
    ) -> str:
        old_value = {"attributes": self.cmdb.items[ci_id].attributes.copy()} if ci_id in self.cmdb.items else {}

        change = ConfigurationChange(
            ci_id=ci_id,
            change_type=change_type,
            old_value=old_value,
            new_value=new_value,
            reason=reason,
            requested_by=requested_by,
            status=ChangeStatus.DRAFT,
            risk_level=risk_level
        )

        self.changes[change.id] = change
        return change.id

    def submit_change(self, change_id: str):
        if change_id not in self.changes:
            raise ValueError(f"Change not found: {change_id}")
        self.changes[change_id].status = ChangeStatus.PENDING

    def approve_change(self, change_id: str, approved_by: str):
        if change_id not in self.changes:
            raise ValueError(f"Change not found: {change_id}")
        change = self.changes[change_id]
        change.status = ChangeStatus.APPROVED
        change.approved_by = approved_by
        change.approved_at = datetime.now()

    def reject_change(self, change_id: str, rejected_by: str, reason: str):
        if change_id not in self.changes:
            raise ValueError(f"Change not found: {change_id}")
        self.changes[change_id].status = ChangeStatus.REJECTED

    def implement_change(self, change_id: str, implemented_by: str, rollback_plan: Dict = None):
        if change_id not in self.changes:
            raise ValueError(f"Change not found: {change_id}")
        change = self.changes[change_id]

        if change.status != ChangeStatus.APPROVED:
            raise ValueError(f"Change must be approved first: {change_id}")

        try:
            self.cmdb.update_ci(
                change.ci_id,
                change.new_value.get("attributes", {}),
                implemented_by,
                change.reason
            )
            change.status = ChangeStatus.IMPLEMENTED
            change.implemented_by = implemented_by
            change.implemented_at = datetime.now()
            change.rollback_plan = rollback_plan or {}
        except Exception as e:
            logger.error(f"Failed to implement change: {e}")
            raise

    def rollback_change(self, change_id: str, rolled_back_by: str):
        if change_id not in self.changes:
            raise ValueError(f"Change not found: {change_id}")
        change = self.changes[change_id]

        if change.rollback_plan:
            for action in change.rollback_plan.get("actions", []):
                if action["type"] == "update":
                    self.cmdb.update_ci(
                        action["ci_id"],
                        action["old_value"],
                        rolled_back_by,
                        f"Rollback of change {change_id}"
                    )

    def get_change_impact(self, change_id: str) -> List[str]:
        if change_id not in self.changes:
            raise ValueError(f"Change not found: {change_id}")
        change = self.changes[change_id]
        ci = self.cmdb.get_ci(change.ci_id)
        return ci.dependencies if ci else []

class ComplianceChecker:
    def __init__(self, cmdb: CMDB):
        self.cmdb = cmdb
        self.compliance_rules: Dict[str, Dict] = {}
        self.audit_reports: List[Dict] = []

    def add_compliance_rule(self, rule_id: str, rule: Dict):
        self.compliance_rules[rule_id] = rule

    def check_compliance(self, rule_id: str) -> Dict:
        if rule_id not in self.compliance_rules:
            raise ValueError(f"Rule not found: {rule_id}")

        rule = self.compliance_rules[rule_id]
        violations = []
        passed = True

        for ci in self.cmdb.items.values():
            ci_checks = []

            for check in rule.get("checks", []):
                if check["field"] in ci.attributes:
                    expected = check.get("expected")
                    actual = ci.attributes[check["field"]]

                    if check["operator"] == "equals" and actual != expected:
                        ci_checks.append(False)
                    elif check["operator"] == "contains" and expected not in str(actual):
                        ci_checks.append(False)
                    elif check["operator"] == "regex":
                        import re
                        if not re.match(expected, str(actual)):
                            ci_checks.append(False)

            if ci_checks and not all(ci_checks):
                violations.append({
                    "ci_id": ci.id,
                    "ci_name": ci.name,
                    "violations": ci_checks
                })
                passed = False

        result = {
            "rule_id": rule_id,
            "rule_name": rule.get("name"),
            "passed": passed,
            "violations": violations,
            "timestamp": datetime.now().isoformat()
        }

        self.audit_reports.append(result)
        return result

    def generate_compliance_report(self) -> Dict:
        results = []
        passed_count = 0

        for rule_id in self.compliance_rules:
            result = self.check_compliance(rule_id)
            results.append(result)
            if result["passed"]:
                passed_count += 1

        return {
            "total_rules": len(self.compliance_rules),
            "passed": passed_count,
            "failed": len(self.compliance_rules) - passed_count,
            "results": results,
            "timestamp": datetime.now().isoformat()
        }
```

## Use Cases

- IT asset and configuration tracking
- Change management approval workflows
- Compliance auditing (SOX, HIPAA, PCI-DSS)
- Configuration drift detection
- Impact analysis for changes
- CMDB maintenance

## Artifacts

- `ConfigurationItem`: CI data structure
- `CMDB`: Configuration Management Database
- `ChangeManager`: Change request handling
- `ComplianceChecker`: Compliance validation
- `ConfigurationChange`: Change tracking

## Related Skills

- Change Management
- IT Asset Management
- Compliance and Audit
- Configuration as Code
- ITIL Processes
- CMDB
