---
name: incident-response
description: Security incident handling procedures
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
---

## What I do
- Detect and triage security incidents
- Contain and mitigate security breaches
- Investigate root causes
- Coordinate response efforts
- Document lessons learned
- Implement recovery procedures

## When to use me
When responding to security breaches, suspicious activities, or potential vulnerabilities.

## Incident Response Lifecycle

### Preparation
```python
from enum import Enum
from datetime import datetime

class Severity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class IncidentType(Enum):
    MALWARE = "malware"
    PHISHING = "phishing"
    DATA_BREACH = "data_breach"
    DDOS = "ddos"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    INSIDER_THREAT = "insider_threat"

class IncidentResponsePlan:
    def __init__(self):
        self.escalation_contacts = {}
        self.severity_matrix = {
            Severity.CRITICAL: {
                "response_time": "immediate",
                "escalate_to": ["CISO", "CEO", "Legal"],
                "external_notification": True
            },
            Severity.HIGH: {
                "response_time": "1 hour",
                "escalate_to": ["CISO", "CTO"],
                "external_notification": False
            },
            Severity.MEDIUM: {
                "response_time": "4 hours",
                "escalate_to": ["Security Lead"],
                "external_notification": False
            },
            Severity.LOW: {
                "response_time": "24 hours",
                "escalate_to": ["Security Team"],
                "external_notification": False
            }
        }
    
    def create_incident(self, incident_type: IncidentType, 
                        severity: Severity, description: str) -> dict:
        incident = {
            "id": self._generate_incident_id(),
            "type": incident_type.value,
            "severity": severity.value,
            "description": description,
            "status": "open",
            "created_at": datetime.now().isoformat(),
            "timeline": [{
                "timestamp": datetime.now().isoformat(),
                "action": "Incident created",
                "actor": "Automated detection"
            }]
        }
        
        # Escalate based on severity
        rules = self.severity_matrix[severity]
        self._notify_escalation(incident, rules["escalate_to"])
        
        return incident
    
    def _generate_incident_id(self) -> str:
        import secrets
        return f"INC-{datetime.now().strftime('%Y%m%d')}-{secrets.token_hex(4)}"
```

### Detection and Triage
```python
class IncidentDetector:
    def __init__(self):
        self.anomaly_threshold = 3.0  # Standard deviations
    
    def detect_anomalies(self, event: dict) -> list:
        """Detect potential security incidents from events"""
        alerts = []
        
        # Failed login detection
        if event.get("event_type") == "login_failed":
            if self._is_brute_force(event):
                alerts.append({
                    "type": "brute_force",
                    "severity": Severity.HIGH,
                    "evidence": event
                })
        
        # Data exfiltration
        if event.get("event_type") == "data_transfer":
            if self._is_unusual_volume(event):
                alerts.append({
                    "type": "data_exfiltration",
                    "severity": Severity.CRITICAL,
                    "evidence": event
                })
        
        # Privilege escalation
        if event.get("event_type") == "permission_change":
            alerts.append({
                "type": "privilege_escalation",
                "severity": Severity.HIGH,
                "evidence": event
            })
        
        return alerts
    
    def _is_brute_force(self, event: dict) -> bool:
        # Check for multiple failed logins from same source
        return event.get("failed_attempts", 0) > 5
    
    def _is_unusual_volume(self, event: dict) -> bool:
        # Compare against baseline
        return event.get("bytes_transferred", 0) > 1000000000
```

### Containment
```python
class IncidentContainment:
    def __init__(self):
        self.quarantined_hosts = set()
        self.blocked_ips = set()
    
    def contain_incident(self, incident: dict) -> dict:
        actions = []
        
        # Isolate affected systems
        if incident["type"] == "malware":
            for host in self._identify_affected_hosts(incident):
                self._isolate_host(host)
                actions.append(f"Isolated host {host}")
        
        # Block attacker IPs
        if incident["type"] == "unauthorized_access":
            for ip in self._identify_attacker_ips(incident):
                self._block_ip(ip)
                actions.append(f"Blocked IP {ip}")
        
        # Revoke compromised credentials
        if incident["type"] in ["phishing", "unauthorized_access"]:
            for user in self._identify_compromised_users(incident):
                self._revoke_sessions(user)
                actions.append(f"Revoked sessions for user {user}")
        
        # Preserve evidence
        self._capture_forensics(incident)
        
        return {"containment_actions": actions, "status": "contained"}
    
    def _isolate_host(self, host_id: str):
        """Network isolation of compromised host"""
        self.quarantined_hosts.add(host_id)
        # Implementation: configure network switch/firewall
    
    def _block_ip(self, ip: str):
        """Block malicious IP at firewall"""
        self.blocked_ips.add(ip)
        # Implementation: update WAF/firewall rules
```

### Investigation
```python
class IncidentInvestigator:
    def __init__(self):
        self.evidence_store = []
    
    def investigate(self, incident: dict) -> dict:
        findings = {
            "incident_id": incident["id"],
            "timeline": self._reconstruct_timeline(incident),
            "attack_vector": self._identify_attack_vector(incident),
            "scope": self._determine_scope(incident),
            "root_cause": self._find_root_cause(incident),
            "evidence": self._collect_evidence(incident)
        }
        
        return findings
    
    def _reconstruct_timeline(self, incident: dict) -> list:
        """Build chronological timeline of events"""
        # Correlate logs from various sources
        return sorted(incident.get("related_events", []),
                     key=lambda x: x["timestamp"])
    
    def _identify_attack_vector(self, incident: dict) -> str:
        """Determine how the attacker gained access"""
        vectors = ["phishing", "exploit", "stolen_credentials", 
                   "weak_password", "insider", "unknown"]
        
        # Analyze evidence
        return vectors[0]  # Placeholder
    
    def _determine_scope(self, incident: dict) -> dict:
        """Determine what was affected"""
        return {
            "systems_affected": [],
            "data_accessed": [],
            "users_affected": 0,
            "financial_impact": 0
        }
```

### Recovery
```python
class IncidentRecovery:
    def recover_from_incident(self, incident: dict) -> dict:
        recovery_steps = []
        
        # 1. Verify threat is contained
        if not self._verify_containment(incident):
            raise RuntimeError("Cannot recover - threat not contained")
        
        # 2. Restore from clean backups
        backup_date = self._find_clean_backup(incident)
        self._restore_systems(backup_date)
        recovery_steps.append("Systems restored from backup")
        
        # 3. Patch vulnerabilities
        self._apply_patches(incident)
        recovery_steps.append("Vulnerabilities patched")
        
        # 4. Reset credentials
        self._reset_credentials(incident)
        recovery_steps.append("Credentials rotated")
        
        # 5. Resume services
        self._resume_services()
        recovery_steps.append("Services resumed")
        
        return {
            "status": "recovered",
            "steps": recovery_steps,
            "verified_at": datetime.now().isoformat()
        }
```

### Post-Incident
```python
class PostIncidentReview:
    def conduct_review(self, incident: dict, findings: dict) -> dict:
        return {
            "summary": "Brief incident summary",
            "timeline": incident["timeline"],
            "root_cause": findings["root_cause"],
            "impact": findings["scope"],
            "lessons_learned": [
                "What went well",
                "What could be improved",
                "Action items"
            ],
            "recommendations": [
                "Technical improvements",
                "Process improvements",
                "Training needs"
            ]
        }
    
    def update_playbook(self, incident: dict, lessons: list):
        """Update incident response playbook"""
        pass
```
