---
name: security-auditing
description: Security audit procedures and controls
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
---

## What I do
- Conduct security audits and assessments
- Evaluate control effectiveness
- Review access controls and permissions
- Audit logging and monitoring
- Test for vulnerabilities
- Document findings and recommendations

## When to use me
When conducting internal audits, preparing for external audits, or verifying security compliance.

## Audit Framework

### Audit Scope
```python
from enum import Enum
from datetime import datetime

class AuditType(Enum):
    INTERNAL = "internal"
    EXTERNAL = "external"
    COMPLIANCE = "compliance"
    VULNERABILITY = "vulnerability"

class AuditScope:
    def __init__(self, audit_type: AuditType):
        self.audit_type = audit_type
        self.systems = []
        self.processes = []
        self.standards = []
    
    def add_system(self, system_id: str, description: str,
                  owner: str):
        self.systems.append({
            "id": system_id,
            "description": description,
            "owner": owner,
            "classification": "internal"
        })
    
    def add_standard(self, standard: str):
        self.standards.append(standard)
```

### Control Assessment
```python
class ControlAssessment:
    """Evaluate security controls"""
    
    def __init__(self):
        self.controls = {}
    
    def add_control(self, control_id: str, name: str, 
                    control_type: str, category: str):
        self.controls[control_id] = {
            "name": name,
            "type": control_type,  # preventive, detective, corrective
            "category": category,   # access, encryption, logging
            "implemented": False,
            "test_results": []
        }
    
    def test_control(self, control_id: str, test_method: str,
                    result: bool, evidence: str):
        """Record control test result"""
        self.controls[control_id]["test_results"].append({
            "test_date": datetime.now(),
            "test_method": test_method,
            "result": result,
            "evidence": evidence
        })
    
    def calculate_effectiveness(self, control_id: str) -> float:
        """Calculate control effectiveness percentage"""
        results = self.controls[control_id]["test_results"]
        if not results:
            return 0.0
        
        passed = sum(1 for r in results if r["result"])
        return (passed / len(results)) * 100
    
    def get_control_status(self, control_id: str) -> str:
        """Get overall control status"""
        effectiveness = self.calculate_effectiveness(control_id)
        
        if effectiveness >= 95:
            return "effective"
        elif effectiveness >= 80:
            return "mostly_effective"
        elif effectiveness >= 60:
            return "needs_improvement"
        else:
            return "ineffective"
```

### Access Control Audit
```python
class AccessControlAudit:
    """Audit user access rights"""
    
    def __init__(self):
        self.findings = []
    
    def audit_user_access(self, user_id: str, 
                         expected_permissions: list) -> dict:
        """Compare expected vs actual permissions"""
        actual_permissions = self._get_actual_permissions(user_id)
        
        # Find discrepancies
        extra = set(actual_permissions) - set(expected_permissions)
        missing = set(expected_permissions) - set(actual_permissions)
        
        if extra or missing:
            self.findings.append({
                "user_id": user_id,
                "extra_permissions": list(extra),
                "missing_permissions": list(missing),
                "severity": "high" if len(extra) > 0 else "medium"
            })
        
        return {
            "user_id": user_id,
            "status": "compliant" if not (extra or missing) else "non_compliant",
            "extra": list(extra),
            "missing": list(missing)
        }
    
    def audit_privileged_access(self) -> list:
        """Review all privileged accounts"""
        privileged_users = self._get_privileged_users()
        
        findings = []
        for user in privileged_users:
            if not self._requires_mfa(user):
                findings.append({
                    "user": user,
                    "issue": "Privileged access without MFA",
                    "severity": "critical"
                })
            
            if not self._has_recent_certification(user):
                findings.append({
                    "user": user,
                    "issue": "Access not recently certified",
                    "severity": "high"
                })
        
        return findings
    
    def audit_service_accounts(self) -> list:
        """Review service account usage"""
        service_accounts = self._get_service_accounts()
        
        findings = []
        for account in service_accounts:
            if self._password_expired(account):
                findings.append({
                    "account": account,
                    "issue": "Password expired",
                    "severity": "critical"
                })
        
        return findings
```

### Logging Audit
```python
class LoggingAudit:
    """Audit security logging"""
    
    def __init__(self):
        self.required_events = [
            "authentication_success",
            "authentication_failure",
            "authorization_failure",
            "privilege_change",
            "data_access",
            "configuration_change",
            "system_event"
        ]
    
    def audit_logging_coverage(self, system: str) -> dict:
        """Check if all required events are logged"""
        logged_events = self._get_logged_events(system)
        
        missing = set(self.required_events) - set(logged_events)
        
        return {
            "system": system,
            "required_events": len(self.required_events),
            "logged_events": len(logged_events),
            "missing_events": list(missing),
            "coverage_percent": len(logged_events) / len(self.required_events) * 100
        }
    
    def audit_log_protection(self) -> dict:
        """Verify logs are protected from tampering"""
        checks = {
            "immutability_enabled": self._check_immutable_storage(),
            "integrity_verification": self._check_integrity_monitoring(),
            "access_restricted": self._check_restricted_access(),
            "tamper_alerts": self._check_tamper_alerts()
        }
        
        return {
            "all_checks_passed": all(checks.values()),
            "checks": checks
        }
    
    def audit_log_retention(self, retention_policy: int) -> dict:
        """Verify log retention compliance"""
        logs = self._get_all_logs()
        
        current_retention = self._calculate_retention(logs)
        
        return {
            "required_days": retention_policy,
            "actual_days": current_retention,
            "compliant": current_retention >= retention_policy
        }
```

### Audit Reporting
```python
class AuditReport:
    """Generate audit reports"""
    
    def __init__(self, audit_id: str):
        self.audit_id = audit_id
        self.findings = []
        self.recommendations = []
    
    def add_finding(self, severity: str, title: str, 
                   description: str, evidence: str, 
                   recommendation: str):
        self.findings.append({
            "id": len(self.findings) + 1,
            "severity": severity,  # critical, high, medium, low
            "title": title,
            "description": description,
            "evidence": evidence,
            "recommendation": recommendation,
            "status": "open"
        })
    
    def generate_executive_summary(self) -> dict:
        """Generate executive summary"""
        severity_counts = {}
        for finding in self.findings:
            sev = finding["severity"]
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
        
        return {
            "audit_id": self.audit_id,
            "total_findings": len(self.findings),
            "by_severity": severity_counts,
            "risk_rating": self._calculate_overall_risk(),
            "recommendations_count": len(self.recommendations)
        }
    
    def generate_full_report(self) -> dict:
        """Generate full audit report"""
        return {
            "executive_summary": self.generate_executive_summary(),
            "scope": self.scope,
            "methodology": self.methodology,
            "findings": self.findings,
            "recommendations": self.recommendations,
            "appendices": self.evidence
        }
```

### Continuous Auditing
```python
class ContinuousAudit:
    """Automated continuous control monitoring"""
    
    def __init__(self):
        self.monitors = {}
    
    def add_automated_check(self, check_id: str, check_func: callable,
                           frequency: str):
        """Add automated control check"""
        self.monitors[check_id] = {
            "function": check_func,
            "frequency": frequency,  # hourly, daily, weekly
            "last_run": None,
            "last_result": None
        }
    
    def run_continuous_checks(self) -> dict:
        """Run all automated checks"""
        results = {}
        
        for check_id, monitor in self.monitors.items():
            if self._should_run(monitor):
                result = monitor["function"]()
                monitor["last_run"] = datetime.now()
                monitor["last_result"] = result
                results[check_id] = result
        
        return results
    
    def generate_compliance_dashboard(self) -> dict:
        """Real-time compliance status"""
        return {
            "controls_monitored": len(self.monitors),
            "passing": sum(1 for m in self.monitors.values() 
                          if m["last_result"]),
            "failing": sum(1 for m in self.monitors.values() 
                         if not m["last_result"]),
            "compliance_score": self._calculate_score()
        }
```
