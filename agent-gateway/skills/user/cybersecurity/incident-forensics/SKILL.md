---
name: Incident Response and Forensics
category: cybersecurity
description: Detecting, responding to, and investigating security incidents with forensic analysis techniques
tags: [incident-response, forensics, siem, detection, containment, recovery, ioc]
version: "1.0"
---

# Incident Response and Forensics

## What I Do

I provide guidance on detecting, containing, eradicating, and recovering from security incidents. This includes building detection rules, creating incident response playbooks, performing log analysis and forensic investigation, preserving evidence chains, and implementing lessons learned to prevent recurrence.

## When to Use Me

- Building detection rules and alerting for security events
- Creating incident response playbooks and runbooks
- Performing log analysis to investigate suspicious activity
- Implementing indicators of compromise (IOC) detection
- Designing incident classification and escalation procedures
- Conducting post-incident reviews and root cause analysis

## Core Concepts

1. **NIST Incident Response Lifecycle**: Preparation, Detection & Analysis, Containment Eradication & Recovery, and Post-Incident Activity.
2. **Detection Engineering**: Writing rules and queries to identify malicious activity in logs, network traffic, and endpoints.
3. **Indicators of Compromise (IOC)**: Observable artifacts (IPs, hashes, domains, patterns) associated with malicious activity.
4. **Chain of Custody**: Documented trail showing evidence collection, handling, and preservation to maintain forensic integrity.
5. **Containment Strategies**: Short-term and long-term actions to limit the scope and impact of an incident.
6. **Log Correlation**: Combining events from multiple sources to identify attack patterns and timelines.
7. **Root Cause Analysis**: Systematic investigation to identify the fundamental cause of an incident.
8. **MITRE ATT&CK**: Framework of adversary tactics, techniques, and procedures for classifying attack behavior.

## Code Examples

### 1. Log Analysis and Anomaly Detection (Python)

```python
from collections import Counter, defaultdict
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional
from dataclasses import dataclass

@dataclass
class SecurityEvent:
    timestamp: datetime
    source_ip: str
    event_type: str
    user: Optional[str]
    resource: str
    outcome: str

class AnomalyDetector:
    def __init__(self, threshold_multiplier: float = 3.0) -> None:
        self.threshold_multiplier = threshold_multiplier
        self.baselines: Dict[str, float] = {}

    def detect_brute_force(
        self, events: List[SecurityEvent], window_minutes: int = 10, threshold: int = 10,
    ) -> List[Dict]:
        failures_by_ip: Dict[str, List[SecurityEvent]] = defaultdict(list)
        for e in events:
            if e.event_type == "authentication" and e.outcome == "failure":
                failures_by_ip[e.source_ip].append(e)

        alerts = []
        for ip, fails in failures_by_ip.items():
            fails.sort(key=lambda e: e.timestamp)
            window = timedelta(minutes=window_minutes)
            for i, event in enumerate(fails):
                count = sum(
                    1 for f in fails[i:] if f.timestamp - event.timestamp <= window
                )
                if count >= threshold:
                    alerts.append({
                        "type": "brute_force",
                        "source_ip": ip,
                        "count": count,
                        "first_seen": event.timestamp.isoformat(),
                        "targets": list({f.user for f in fails[i:i+count] if f.user}),
                    })
                    break
        return alerts
```

### 2. IOC Scanner (Python)

```python
import re
import hashlib
from typing import Set, Dict, List
from pathlib import Path

@dataclass
class IOCMatch:
    ioc_type: str
    value: str
    source_file: str
    line_number: int

class IOCScanner:
    def __init__(self) -> None:
        self.malicious_ips: Set[str] = set()
        self.malicious_domains: Set[str] = set()
        self.malicious_hashes: Set[str] = set()

    def load_threat_feed(self, feed: Dict[str, List[str]]) -> None:
        self.malicious_ips.update(feed.get("ips", []))
        self.malicious_domains.update(feed.get("domains", []))
        self.malicious_hashes.update(feed.get("hashes", []))

    def scan_log_file(self, filepath: str) -> List[IOCMatch]:
        matches: List[IOCMatch] = []
        ip_pattern = re.compile(r"\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b")
        domain_pattern = re.compile(r"\b([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)\b")

        with open(filepath, "r") as f:
            for line_num, line in enumerate(f, 1):
                for ip in ip_pattern.findall(line):
                    if ip in self.malicious_ips:
                        matches.append(IOCMatch("ip", ip, filepath, line_num))
                for domain in domain_pattern.findall(line):
                    if domain in self.malicious_domains:
                        matches.append(IOCMatch("domain", domain, filepath, line_num))
        return matches
```

### 3. Incident Response Playbook Engine (Python)

```python
from dataclasses import dataclass, field
from typing import List, Callable, Optional
from enum import Enum
from datetime import datetime, timezone

class Severity(Enum):
    CRITICAL = "P1"
    HIGH = "P2"
    MEDIUM = "P3"
    LOW = "P4"

class IncidentStatus(Enum):
    DETECTED = "detected"
    TRIAGED = "triaged"
    CONTAINED = "contained"
    ERADICATED = "eradicated"
    RECOVERED = "recovered"
    CLOSED = "closed"

@dataclass
class PlaybookStep:
    name: str
    description: str
    action: Callable
    required: bool = True

@dataclass
class Incident:
    id: str
    title: str
    severity: Severity
    status: IncidentStatus = IncidentStatus.DETECTED
    timeline: List[dict] = field(default_factory=list)

    def add_event(self, action: str, details: str) -> None:
        self.timeline.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "details": details,
        })

class PlaybookRunner:
    def __init__(self, steps: List[PlaybookStep]) -> None:
        self.steps = steps

    def execute(self, incident: Incident) -> List[dict]:
        results = []
        for step in self.steps:
            incident.add_event(step.name, step.description)
            try:
                step.action(incident)
                results.append({"step": step.name, "status": "success"})
            except Exception as e:
                results.append({"step": step.name, "status": "failed", "error": str(e)})
                if step.required:
                    break
        return results
```

### 4. Timeline Reconstruction (Python)

```python
from typing import List, Dict, Any
from datetime import datetime
from dataclasses import dataclass

@dataclass
class TimelineEntry:
    timestamp: datetime
    source: str
    event_type: str
    description: str
    raw_data: Dict[str, Any]

def build_timeline(
    log_sources: Dict[str, List[Dict[str, Any]]],
    start_time: datetime,
    end_time: datetime,
) -> List[TimelineEntry]:
    timeline: List[TimelineEntry] = []
    for source_name, events in log_sources.items():
        for event in events:
            ts = event.get("timestamp")
            if isinstance(ts, str):
                ts = datetime.fromisoformat(ts)
            if start_time <= ts <= end_time:
                timeline.append(TimelineEntry(
                    timestamp=ts,
                    source=source_name,
                    event_type=event.get("type", "unknown"),
                    description=event.get("message", ""),
                    raw_data=event,
                ))
    timeline.sort(key=lambda e: e.timestamp)
    return timeline
```

## Best Practices

1. **Prepare before incidents occur** with documented playbooks, communication templates, and pre-authorized containment actions.
2. **Detect early** by correlating events across multiple log sources with tuned alerting rules.
3. **Classify incidents by severity** to drive appropriate response urgency and escalation paths.
4. **Contain first, investigate second** to stop ongoing damage before performing detailed analysis.
5. **Preserve evidence** with proper chain of custody documentation before making system changes.
6. **Build attack timelines** from multiple log sources to understand the full scope of an incident.
7. **Communicate clearly** with stakeholders using pre-defined templates and escalation channels.
8. **Eradicate root cause** rather than just symptoms to prevent recurrence of the same attack.
9. **Conduct blameless post-incident reviews** focused on process improvement within 72 hours of resolution.
10. **Update detection rules** based on findings from every incident to improve future detection capability.
