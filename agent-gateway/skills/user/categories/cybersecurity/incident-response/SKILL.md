---
name: Incident Response
description: Security incident handling, containment, eradication, recovery, and lessons learned
license: MIT
compatibility:
  - Python 3.8+
  - Linux
audience: Security analysts, incident responders, SOC teams
category: Cybersecurity
---

# Incident Response

## What I do

I enable effective security incident handling including detection, analysis, containment, eradication, recovery, and post-incident activities. I provide frameworks for incident classification, response procedures, and documentation.

## When to use me

- Responding to active security incidents
- Building incident response playbooks
- Establishing an incident response team
- Conducting incident post-mortems
- Setting up detection and alerting
- Creating communication templates
- Training incident responders
- Improving detection capabilities

## Core Concepts

- **Incident Lifecycle**: Detection, Analysis, Containment, Eradication, Recovery, Lessons Learned
- **NIST Framework**: Identify, Protect, Detect, Respond, Recover
- **SANS 6-Step**: Preparation, Identification, Containment, Eradication, Recovery, Lessons Learned
- **IOCs**: Indicators of Compromise (IPs, domains, hashes, patterns)
- **TTPs**: Tactics, Techniques, and Procedures (MITRE ATT&CK)
- **Chain of Custody**: Evidence handling and documentation
- **Escalation**: When and how to escalate incidents
- **Communication**: Stakeholder updates and notifications
- **Forensics**: Preserving and analyzing evidence
- **Playbooks**: Pre-defined response procedures

## Code Examples

### Incident Manager

```python
from enum import Enum
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import json

class IncidentSeverity(Enum):
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class IncidentStatus(Enum):
    NEW = "new"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    ERADICATED = "eradicated"
    RECOVERED = "recovered"
    CLOSED = "closed"

class IncidentType(Enum):
    MALWARE = "malware"
    PHISHING = "phishing"
    RANSOMWARE = "ransomware"
    DATA_BREACH = "data_breach"
    DDOS = "ddos"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    INSIDER_THREAT = "insider_threat"
    APT = "apt"
    OTHER = "other"

@dataclass
class IOC:
    type: str
    value: str
    source: str
    first_seen: datetime
    last_seen: datetime
    confidence: float
    tags: List[str] = field(default_factory=list)

@dataclass
class Incident:
    incident_id: str
    title: str
    description: str
    severity: IncidentSeverity
    status: IncidentStatus
    type: IncidentType
    created_at: datetime
    updated_at: datetime
    assigned_to: str
    affected_assets: List[str] = field(default_factory=list)
    iocs: List[IOC] = field(default_factory=list)
    timeline: List[Dict] = field(default_factory=list)
    containment_actions: List[str] = field(default_factory=list)
    eradication_actions: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)
    affected_systems: List[str] = field(default_factory=list)
    data_breach: bool = False
    customers_affected: int = 0

class IncidentManager:
    def __init__(self):
        self.incidents: Dict[str, Incident] = {}
        self.ioc_database: Dict[str, List[str]] = {}
    
    def create_incident(self, title: str, description: str,
                       severity: IncidentSeverity, incident_type: IncidentType,
                       assigned_to: str = "") -> Incident:
        incident_id = f"INC-{datetime.now().strftime('%Y%m%d')}-{len(self.incidents) + 1:04d}"
        
        incident = Incident(
            incident_id=incident_id,
            title=title,
            description=description,
            severity=severity,
            status=IncidentStatus.NEW,
            type=incident_type,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            assigned_to=assigned_to
        )
        
        self.incidents[incident_id] = incident
        self._add_timeline_entry(incident, "Incident created")
        
        return incident
    
    def update_status(self, incident_id: str, status: IncidentStatus):
        if incident_id in self.incidents:
            self.incidents[incident_id].status = status
            self.incidents[incident_id].updated_at = datetime.now()
            self._add_timeline_entry(
                self.incidents[incident_id],
                f"Status changed to {status.value}"
            )
    
    def add_ioc(self, incident_id: str, ioc: IOC):
        if incident_id in self.incidents:
            self.incidents[incident_id].iocs.append(ioc)
            self._add_timeline_entry(
                self.incidents[incident_id],
                f"IOC added: {ioc.type}={ioc.value}"
            )
            
            if ioc.type not in self.ioc_database:
                self.ioc_database[ioc.type] = []
            if ioc.value not in self.ioc_database[ioc.type]:
                self.ioc_database[ioc.type].append(ioc.value)
    
    def add_containment_action(self, incident_id: str, action: str):
        if incident_id in self.incidents:
            self.incidents[incident_id].containment_actions.append(action)
            self._add_timeline_entry(
                self.incidents[incident_id],
                f"Containment: {action}"
            )
    
    def add_eradication_action(self, incident_id: str, action: str):
        if incident_id in self.incidents:
            self.incidents[incident_id].eradication_actions.append(action)
            self._add_timeline_entry(
                self.incidents[incident_id],
                f"Eradication: {action}"
            )
    
    def add_note(self, incident_id: str, note: str, author: str = "analyst"):
        if incident_id in self.incidents:
            self.incidents[incident_id].notes.append(f"[{author}] {note}")
            self._add_timeline_entry(
                self.incidents[incident_id],
                f"Note added by {author}"
            )
    
    def _add_timeline_entry(self, incident: Incident, action: str):
        incident.timeline.append({
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "actor": "system"
        })
    
    def get_active_incidents(self) -> List[Incident]:
        active_statuses = [IncidentStatus.NEW, IncidentStatus.INVESTIGATING,
                          IncidentStatus.CONTAINED, IncidentStatus.ERADICATED]
        return [i for i in self.incidents.values() if i.status in active_statuses]
    
    def get_incident_summary(self) -> Dict:
        return {
            "total": len(self.incidents),
            "by_status": {s.value: 0 for s in IncidentStatus},
            "by_severity": {s.value: 0 for s in IncidentSeverity},
            "by_type": {t.value: 0 for t in IncidentType}
        }
```

### Playbook Executor

```python
from typing import Dict, List, Callable, Optional
from dataclasses import dataclass
from enum import Enum
from datetime import datetime

class PlaybookPhase(Enum):
    PREPARATION = "preparation"
    DETECTION = "detection"
    ANALYSIS = "analysis"
    CONTAINMENT = "containment"
    ERADICATION = "eradication"
    RECOVERY = "recovery"
    POST_INCIDENT = "post_incident"

@dataclass
class PlaybookStep:
    step_id: str
    name: str
    description: str
    phase: PlaybookPhase
    automated: bool
    manual_instructions: str
    verification_steps: List[str]
    rollback_steps: List[str]
    estimated_time_minutes: int

@dataclass
class Playbook:
    playbook_id: str
    name: str
    description: str
    applicable_types: List[IncidentType]
    severity_range: tuple
    steps: List[PlaybookStep]
    created_date: datetime
    version: str

class PlaybookExecutor:
    def __init__(self, incident_manager: IncidentManager):
        self.incident_manager = incident_manager
        self.playbooks: Dict[str, Playbook] = {}
    
    def create_ransomware_playbook(self) -> Playbook:
        steps = [
            PlaybookStep(
                step_id="RANS-001",
                name="Isolate Affected Systems",
                description="Immediately isolate infected systems from network",
                phase=PlaybookPhase.CONTAINMENT,
                automated=True,
                manual_instructions="Pull network cables, disable WiFi adapters",
                verification_steps=["Verify no network connectivity", "Check physical isolation"],
                rollback_steps=["Document network config before changes", "Take screenshots"],
                estimated_time_minutes=5
            ),
            PlaybookStep(
                step_id="RANS-002",
                name="Preserve Evidence",
                description="Capture memory and disk images for forensics",
                phase=PlaybookPhase.ANALYSIS,
                automated=True,
                manual_instructions="Use FTK Imager for disk, winpmem for memory",
                verification_steps=["Verify image hashes match", "Check storage integrity"],
                rollback_steps=[],
                estimated_time_minutes=30
            ),
            PlaybookStep(
                step_id="RANS-003",
                name="Identify Ransomware Variant",
                description="Determine the specific ransomware family",
                phase=PlaybookPhase.ANALYSIS,
                automated=True,
                manual_instructions="Check file extensions, ransom note content, encryption pattern",
                verification_steps=["Cross-reference with known variants", "Check ID Ransomware service"],
                rollback_steps=[],
                estimated_time_minutes=15
            ),
            PlaybookStep(
                step_id="RANS-004",
                name="Assess Scope",
                description="Determine extent of encryption across environment",
                phase=PlaybookPhase.ANALYSIS,
                automated=True,
                manual_instructions="Check shared drives, backup systems, cloud storage",
                verification_steps=["Document all affected paths", "Identify encryption timestamp"],
                rollback_steps=[],
                estimated_time_minutes=30
            ),
            PlaybookStep(
                step_id="RANS-005",
                name="Check Backups",
                description="Verify backup integrity and availability",
                phase=PlaybookPhase.RECOVERY,
                automated=True,
                manual_instructions="Check offline backups, air-gapped copies, cloud backups",
                verification_steps=["Test restore process", "Verify backup timestamps"],
                rollback_steps=[],
                estimated_time_minutes=60
            ),
        ]
        
        return Playbook(
            playbook_id="PB-RANSOMWARE-001",
            name="Ransomware Response",
            description="Playbook for responding to ransomware incidents",
            applicable_types=[IncidentType.RANSOMWARE],
            severity_range=(IncidentSeverity.HIGH, IncidentSeverity.CRITICAL),
            steps=steps,
            created_date=datetime.now(),
            version="1.0"
        )
    
    def execute_playbook(self, playbook: Playbook, incident_id: str) -> Dict:
        incident = self.incident_manager.incidents.get(incident_id)
        if not incident:
            raise ValueError(f"Incident {incident_id} not found")
        
        execution_report = {
            "playbook_id": playbook.playbook_id,
            "incident_id": incident_id,
            "started_at": datetime.now().isoformat(),
            "steps_executed": [],
            "completed": [],
            "failed": [],
            "skipped": []
        }
        
        for step in playbook.steps:
            if incident.severity not in playbook.severity_range:
                execution_report["skipped"].append({
                    "step_id": step.step_id,
                    "reason": "Severity out of playbook scope"
                })
                continue
            
            try:
                self.incident_manager.add_note(
                    incident_id,
                    f"Executing step: {step.name} ({step.step_id})"
                )
                
                execution_report["steps_executed"].append({
                    "step_id": step.step_id,
                    "name": step.name,
                    "started_at": datetime.now().isoformat(),
                    "status": "in_progress"
                })
                
                self.incident_manager.add_note(
                    incident_id,
                    f"Step {step.step_id} completed: {step.description}"
                )
                
                execution_report["completed"].append({
                    "step_id": step.step_id,
                    "completed_at": datetime.now().isoformat()
                })
                
            except Exception as e:
                execution_report["failed"].append({
                    "step_id": step.step_id,
                    "error": str(e)
                })
        
        execution_report["completed_at"] = datetime.now().isoformat()
        return execution_report
```

### Alert Correlation Engine

```python
from typing import Dict, List, Set
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict

@dataclass
class SecurityAlert:
    alert_id: str
    rule_name: str
    source_ip: str
    destination_ip: str
    timestamp: datetime
    severity: str
    description: str
    raw_data: Dict
    processed: bool = False
    correlated: bool = False

class AlertCorrelator:
    def __init__(self, correlation_window_minutes: int = 15):
        self.correlation_window = timedelta(minutes=correlation_window_minutes)
        self.alerts: List[SecurityAlert] = []
        self.ip_activity: Dict[str, List[SecurityAlert]] = defaultdict(list)
        self.alert_patterns: Dict[str, List[SecurityAlert]] = defaultdict(list)
    
    def ingest_alert(self, alert: SecurityAlert):
        self.alerts.append(alert)
        
        self.ip_activity[alert.source_ip].append(alert)
        self.ip_activity[alert.destination_ip].append(alert)
        
        self._update_patterns(alert)
    
    def _update_patterns(self, alert: SecurityAlert):
        pattern_key = f"{alert.rule_name}:{alert.severity}"
        self.alert_patterns[pattern_key].append(alert)
    
    def find_related_alerts(self, alert: SecurityAlert) -> List[SecurityAlert]:
        related = []
        window_start = datetime.now() - self.correlation_window
        
        for ip in [alert.source_ip, alert.destination_ip]:
            for related_alert in self.ip_activity[ip]:
                if related_alert.alert_id != alert.alert_id:
                    if related_alert.timestamp >= window_start:
                        related.append(related_alert)
        
        return related
    
    def detect_brute_force(self, threshold: int = 5, 
                          time_window_minutes: int = 10) -> List[Dict]:
        brute_force_attacks = []
        window_start = datetime.now() - timedelta(minutes=time_window_minutes)
        
        for ip, alerts in self.ip_activity.items():
            recent_alerts = [a for a in alerts if a.timestamp >= window_start]
            
            failed_logins = [
                a for a in recent_alerts 
                if "failed" in a.description.lower() or 
                   "authentication" in a.rule_name.lower()
            ]
            
            if len(failed_logins) >= threshold:
                unique_targets = set(
                    a.destination_ip for a in failed_logins 
                    if a.destination_ip != ip
                )
                
                if len(unique_targets) >= 3:
                    brute_force_attacks.append({
                        "attacker_ip": ip,
                        "attack_count": len(failed_logins),
                        "targets": list(unique_targets),
                        "first_seen": min(a.timestamp for a in failed_logins).isoformat(),
                        "last_seen": max(a.timestamp for a in failed_logins).isoformat(),
                        "severity": "HIGH" if len(failed_logins) > 20 else "MEDIUM"
                    })
        
        return brute_force_attacks
    
    def correlate_port_scan(self, min_ports: int = 5) -> List[Dict]:
        port_scans = []
        window_start = datetime.now() - timedelta(minutes=15)
        
        for ip, alerts in self.ip_activity.items():
            scan_alerts = [
                a for a in alerts 
                if "port" in a.rule_name.lower() or 
                   "scan" in a.description.lower()
            ]
            
            recent_scans = [
                a for a in scan_alerts if a.timestamp >= window_start
            ]
            
            if len(recent_scans) >= min_ports:
                ports = set()
                for alert in recent_scans:
                    if hasattr(alert, 'destination_port'):
                        ports.add(alert.destination_port)
                
                if len(ports) >= min_ports:
                    port_scans.append({
                        "scanner_ip": ip,
                        "ports_probed": list(ports),
                        "probe_count": len(recent_scans),
                        "severity": "HIGH" if len(ports) > 20 else "MEDIUM"
                    })
        
        return port_scans
    
    def generate_incident_candidates(self) -> List[Dict]:
        candidates = []
        
        for attack in self.detect_brute_force():
            candidates.append({
                "type": "brute_force",
                "source_ip": attack["attacker_ip"],
                "confidence": min(attack["attack_count"] / 50, 1.0),
                "severity": attack["severity"],
                "description": f"Brute force attack from {attack['attacker_ip']}: {attack['attack_count']} attempts",
                "related_alerts": attack["attack_count"]
            })
        
        for scan in self.correlate_port_scan():
            candidates.append({
                "type": "port_scan",
                "source_ip": scan["scanner_ip"],
                "confidence": min(scan["probe_count"] / 30, 1.0),
                "severity": scan["severity"],
                "description": f"Port scan from {scan['scanner_ip']}: {scan['probe_count']} probes",
                "related_alerts": scan["probe_count"]
            })
        
        return candidates
```

## Best Practices

- Maintain up-to-date contact lists and escalation procedures
- Practice incident response with regular tabletop exercises
- Use structured frameworks (NIST, SANS) consistently
- Preserve evidence before containment actions
- Document everything with timestamps
- Communicate clearly with stakeholders
- Follow chain of custody for potential legal actions
- Use IOCs to detect related/follow-up attacks
- Conduct lessons learned after major incidents
- Update playbooks based on incident findings
- Integrate threat intelligence for better detection
- Automate repetitive response tasks where possible

## Common Patterns

- **Tiered Response**: Level 1 (triage), Level 2 (investigation), Level 3 (specialists)
- **Detection Rules**: Sigma rules for SIEM correlation
- **IOC Feeds**: Automated indicator blocking
- **War Room**: Collaborative investigation space
- **Incident Types**: Phishing, Malware, DDoS, Data Breach playbooks
- **Metrics**: MTTD (Detect), MTTC (Contain), MTTR (Recover)
