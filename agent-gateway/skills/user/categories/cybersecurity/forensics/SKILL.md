---
name: Forensics
description: Digital forensics evidence collection, preservation, analysis, and reporting
license: MIT
compatibility:
  - Python 3.8+
  - Linux
  - Windows
audience: Forensic analysts, incident responders, security engineers
category: Cybersecurity
---

# Forensics

## What I do

I enable digital forensics capabilities including evidence acquisition, preservation, analysis, and reporting. I help with disk forensics, memory forensics, network forensics, and mobile device forensics.

## When to use me

- Collecting and preserving evidence after a security incident
- Analyzing compromised systems for malware and IOCs
- Conducting employee investigations
- Supporting legal proceedings with digital evidence
- Recovering deleted files and artifacts
- Timeline analysis of security events
- Malware analysis and reverse engineering
- Email and communication forensics

## Core Concepts

- **Chain of Custody**: Documenting evidence handling and transfers
- **Write Blockers**: Hardware/software to prevent evidence modification
- **Hash Verification**: Ensuring evidence integrity (MD5, SHA-256)
- **Live vs Dead Forensics**: Acquiring memory vs powered-off systems
- **File System Forensics**: NTFS, ext4, APFS analysis
- **Registry Analysis**: Windows registry artifacts
- **Memory Forensics**: Volatile memory analysis (processes, connections)
- **Network Forensics**: PCAP analysis, flow data, proxy logs
- **Timeline Analysis**: Correlating events across sources
- **Anti-Forensics Detection**: Identifying evidence tampering

## Code Examples

### Evidence Collection Manager

```python
import hashlib
import os
import json
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum

class EvidenceType(Enum):
    DISK_IMAGE = "disk_image"
    MEMORY_DUMP = "memory_dump"
    NETWORK_CAPTURE = "network_capture"
    LOG_FILE = "log_file"
    REGISTRY_HIVE = "registry_hive"
    FILE = "file"
    EMAIL = "email"

class EvidenceIntegrity(Enum):
    VERIFIED = "verified"
    COMPROMISED = "compromised"
    UNKNOWN = "unknown"

@dataclass
class EvidenceItem:
    evidence_id: str
    case_number: str
    evidence_type: EvidenceType
    description: str
    source_path: str
    acquisition_path: str
    acquired_by: str
    acquired_at: datetime
    hash_md5: str
    hash_sha256: str
    size_bytes: int
    integrity_status: EvidenceIntegrity
    chain_of_custody: List[Dict]
    tags: List[str] = field(default_factory=list)
    notes: str = ""
    deleted: bool = False

class EvidenceManager:
    def __init__(self, evidence_directory: str = "/forensics/evidence"):
        self.evidence_dir = evidence_directory
        os.makedirs(evidence_dir, exist_ok=True)
        self.evidence_items: Dict[str, EvidenceItem] = {}
    
    def calculate_hashes(self, file_path: str) -> Dict[str, str]:
        md5_hash = hashlib.md5()
        sha256_hash = hashlib.sha256()
        
        with open(file_path, 'rb') as f:
            while chunk := f.read(8192):
                md5_hash.update(chunk)
                sha256_hash.update(chunk)
        
        return {
            "md5": md5_hash.hexdigest(),
            "sha256": sha256_hash.hexdigest()
        }
    
    def acquire_file(self, case_number: str, source_path: str,
                    description: str, acquired_by: str,
                    evidence_type: EvidenceType = EvidenceType.FILE) -> EvidenceItem:
        file_size = os.path.getsize(source_path)
        hashes = self.calculate_hashes(source_path)
        
        evidence_id = f"EV-{case_number}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        filename = os.path.basename(source_path)
        acquisition_path = os.path.join(self.evidence_dir, f"{evidence_id}_{filename}")
        
        with open(source_path, 'rb') as src:
            with open(acquisition_path, 'wb') as dst:
                src.seek(0)
                while chunk := src.read(8192):
                    dst.write(chunk)
        
        acquired_hashes = self.calculate_hashes(acquisition_path)
        
        if acquired_hashes["sha256"] != hashes["sha256"]:
            raise ValueError("Hash mismatch - evidence may be corrupted")
        
        evidence = EvidenceItem(
            evidence_id=evidence_id,
            case_number=case_number,
            evidence_type=evidence_type,
            description=description,
            source_path=source_path,
            acquisition_path=acquisition_path,
            acquired_by=acquired_by,
            acquired_at=datetime.now(),
            hash_md5=acquired_hashes["md5"],
            hash_sha256=acquired_hashes["sha256"],
            size_bytes=file_size,
            integrity_status=EvidenceIntegrity.VERIFIED,
            chain_of_custody=[{
                "timestamp": datetime.now().isoformat(),
                "action": "acquired",
                "person": acquired_by,
                "location": acquisition_path
            }]
        )
        
        self.evidence_items[evidence_id] = evidence
        return evidence
    
    def verify_integrity(self, evidence_id: str) -> bool:
        if evidence_id not in self.evidence_items:
            return False
        
        evidence = self.evidence_items[evidence_id]
        
        if not os.path.exists(evidence.acquisition_path):
            evidence.integrity_status = EvidenceIntegrity.COMPROMISED
            return False
        
        current_hashes = self.calculate_hashes(evidence.acquisition_path)
        
        if current_hashes["sha256"] == evidence.hash_sha256:
            evidence.integrity_status = EvidenceIntegrity.VERIFIED
            self._add_custody_entry(evidence, "integrity_verified")
            return True
        else:
            evidence.integrity_status = EvidenceIntegrity.COMPROMISED
            return False
    
    def chain_of_custody_log(self, evidence_id: str, action: str,
                            person: str, notes: str = "") -> bool:
        if evidence_id in self.evidence_items:
            self._add_custody_entry(
                self.evidence_items[evidence_id],
                action, person, notes
            )
            return True
        return False
    
    def _add_custody_entry(self, evidence: EvidenceItem, action: str,
                          person: str = "", notes: str = ""):
        evidence.chain_of_custody.append({
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "person": person,
            "notes": notes,
            "hash_sha256": evidence.hash_sha256
        })
    
    def export_case_manifest(self, case_number: str) -> Dict:
        case_evidence = [
            e for e in self.evidence_items.values() 
            if e.case_number == case_number
        ]
        
        return {
            "case_number": case_number,
            "exported_at": datetime.now().isoformat(),
            "total_items": len(case_evidence),
            "total_size_bytes": sum(e.size_bytes for e in case_evidence),
            "evidence": [
                {
                    "evidence_id": e.evidence_id,
                    "type": e.evidence_type.value,
                    "description": e.description,
                    "acquired_at": e.acquired_at.isoformat(),
                    "hash_sha256": e.hash_sha256,
                    "integrity": e.integrity_status.value,
                    "chain_of_custody": e.chain_of_custody
                }
                for e in case_evidence
            ]
        }
```

### Memory Forensics Analyzer

```python
import re
from typing import Dict, List, Optional
from dataclasses import dataclass
from datetime import datetime

@dataclass
class ProcessInfo:
    pid: int
    name: str
    path: str
    command_line: str
    parent_pid: int
    user: str
    created_time: datetime
    connections: List[Dict]
    loaded_modules: List[str]

@dataclass
class NetworkConnection:
    local_addr: str
    local_port: int
    remote_addr: str
    remote_port: int
    protocol: str
    state: str
    pid: int

class MemoryAnalyzer:
    def __init__(self):
        self.processes: Dict[int, ProcessInfo] = {}
        self.connections: List[NetworkConnection] = []
        self.suspicious_patterns: List[Dict] = []
    
    def parse_process_list(self, process_output: str):
        lines = process_output.strip().split('\n')
        
        for line in lines[1:]:
            parts = line.split()
            if len(parts) >= 8:
                pid = int(parts[1])
                
                self.processes[pid] = ProcessInfo(
                    pid=pid,
                    name=parts[0],
                    path=parts[2],
                    command_line=' '.join(parts[7:]),
                    parent_pid=int(parts[3]) if parts[3].isdigit() else 0,
                    user=parts[5],
                    created_time=datetime.now(),
                    connections=[],
                    loaded_modules=[]
                )
    
    def parse_netstat(self, netstat_output: str):
        lines = netstat_output.strip().split('\n')
        
        for line in lines[4:]:
            parts = line.split()
            if len(parts) >= 7:
                try:
                    conn = NetworkConnection(
                        local_addr=parts[1].rsplit(':', 1)[0],
                        local_port=int(parts[1].rsplit(':', 1)[1]),
                        remote_addr=parts[2].rsplit(':', 1)[0],
                        remote_port=int(parts[2].rsplit(':', 1)[1]),
                        protocol=parts[0],
                        state=parts[5],
                        pid=int(parts[6]) if len(parts) > 6 and parts[6].isdigit() else 0
                    )
                    self.connections.append(conn)
                    
                    if conn.pid in self.processes:
                        self.processes[conn.pid].connections.append({
                            "local": f"{conn.local_addr}:{conn.local_port}",
                            "remote": f"{conn.remote_addr}:{conn.remote_port}",
                            "state": conn.state
                        })
                except (IndexError, ValueError):
                    continue
    
    def detect_suspicious_connections(self) -> List[Dict]:
        suspicious = []
        
        known_malicious_ips = {
            "1.1.1.1", "2.2.2.2", "3.3.3.3"
        }
        
        for conn in self.connections:
            if conn.remote_addr in known_malicious_ips:
                suspicious.append({
                    "type": "known_malicious_ip",
                    "pid": conn.pid,
                    "process": self.processes.get(conn.pid, ProcessInfo(
                        pid=conn.pid, name="unknown", path="",
                        command_line="", parent_pid=0, user="",
                        created_time=datetime.now(), connections=[], loaded_modules=[]
                    )).name,
                    "connection": f"{conn.remote_addr}:{conn.remote_port}",
                    "severity": "CRITICAL"
                })
        
        for pid, proc in self.processes.items():
            suspicious_ports = [445, 135, 139]
            for conn in proc.connections:
                port = int(conn["remote"].rsplit(':', 1)[1])
                if port in suspicious_ports:
                    suspicious.append({
                        "type": "lateral_movement_port",
                        "pid": pid,
                        "process": proc.name,
                        "connection": conn["remote"],
                        "severity": "HIGH"
                    })
        
        return suspicious
    
    def check_persistence_mechanisms(self) -> List[Dict]:
        persistence = []
        
        registry_autoruns = [
            r"HKLM\Software\Microsoft\Windows\CurrentVersion\Run",
            r"HKCU\Software\Microsoft\Windows\CurrentVersion\Run",
            r"HKLM\Software\Microsoft\Windows\CurrentVersion\RunOnce",
        ]
        
        for reg_key in registry_autoruns:
            persistence.append({
                "type": "registry_autorun",
                "location": reg_key,
                "suspicious": True
            })
        
        startup_folders = [
            r"C:\Users\%USERNAME%\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup",
            r"C:\ProgramData\Microsoft\Windows\Start Menu\Programs\Startup"
        ]
        
        for folder in startup_folders:
            persistence.append({
                "type": "startup_folder",
                "location": folder,
                "suspicious": False
            })
        
        scheduled_tasks = [
            "\\Microsoft\\Windows\\DefaultSetting",
            "\\Microsoft\\Windows\\Customer Experience Improvement Program"
        ]
        
        for task in scheduled_tasks:
            persistence.append({
                "type": "scheduled_task",
                "location": task,
                "suspicious": False
            })
        
        return persistence
    
    def detect_malware_indicators(self) -> List[Dict]:
        indicators = []
        
        suspicious_names = ["malware", "virus", "trojan", "ransom", "crypt"]
        
        for pid, proc in self.processes.items():
            for name in suspicious_names:
                if name in proc.name.lower():
                    indicators.append({
                        "type": "suspicious_process_name",
                        "pid": pid,
                        "name": proc.name,
                        "path": proc.path,
                        "confidence": "HIGH"
                    })
        
        suspicious_paths = [
            r"\Temp\", r"\AppData\Local\Temp", r"\Windows\Temp",
            r"\Users\Public", r"\Perflogs"
        ]
        
        for pid, proc in self.processes.items():
            for path in suspicious_paths:
                if path.lower() in proc.path.lower():
                    indicators.append({
                        "type": "suspicious_location",
                        "pid": pid,
                        "name": proc.name,
                        "path": proc.path,
                        "confidence": "MEDIUM"
                    })
        
        return indicators
```

### Timeline Generator

```python
import re
from typing import Dict, List
from dataclasses import dataclass
from datetime import datetime
from enum import Enum

class EventType(Enum):
    FILE_CREATED = "file_created"
    FILE_MODIFIED = "file_modified"
    FILE_ACCESSED = "file_accessed"
    FILE_DELETED = "file_deleted"
    PROCESS_CREATED = "process_created"
    NETWORK_CONNECTION = "network_connection"
    REGISTRY_MODIFIED = "registry_modified"
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    SERVICE_STARTED = "service_started"
    SERVICE_STOPPED = "service_stopped"

@dataclass
class TimelineEvent:
    timestamp: datetime
    event_type: EventType
    source: str
    description: str
    artifact: str
    details: Dict
    confidence: float

class TimelineGenerator:
    def __init__(self):
        self.events: List[TimelineEvent] = []
    
    def parse_syslog(self, syslog_content: str):
        pattern = r'(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\S+)\s+(.*)'
        
        for line in syslog_content.split('\n'):
            match = re.match(pattern, line)
            if match:
                timestamp_str = f"{datetime.now().year} {match.group(1)}"
                try:
                    timestamp = datetime.strptime(timestamp_str, '%Y %b %d %H:%M:%S')
                    
                    self.events.append(TimelineEvent(
                        timestamp=timestamp,
                        event_type=EventType.SERVICE_STARTED if "Started" in match.group(3) 
                                   else EventType.PROCESS_CREATED,
                        source=match.group(2),
                        description=match.group(3),
                        artifact="syslog",
                        details={"raw": line},
                        confidence=1.0
                    ))
                except ValueError:
                    continue
    
    def parse_windows_evtx(self, evtx_data: str):
        event_patterns = {
            4624: (EventType.USER_LOGIN, "Successful login"),
            4625: (EventType.USER_LOGIN, "Failed login"),
            4647: (EventType.USER_LOGOUT, "User initiated logoff"),
            4688: (EventType.PROCESS_CREATED, "New process created"),
            4104: (EventType.FILE_MODIFIED, "PowerShell script execution"),
        }
        
        self.events.extend([
            TimelineEvent(
                timestamp=datetime.now(),
                event_type=event_patterns.get(event_id, (EventType.PROCESS_CREATED, ""))[0],
                source="Windows Security",
                description=description,
                artifact="Security.evtx",
                details={"event_id": event_id},
                confidence=0.9
            )
            for event_id, (event_type, description) in event_patterns.items()
        ])
    
    def parse_apache_access(self, access_log: str):
        pattern = r'(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\d+)'
        
        for line in access_log.split('\n'):
            match = re.match(pattern, line)
            if match:
                try:
                    timestamp = datetime.strptime(
                        match.group(2), '%d/%b/%Y:%H:%M:%S %z'
                    )
                    
                    self.events.append(TimelineEvent(
                        timestamp=timestamp,
                        event_type=EventType.NETWORK_CONNECTION,
                        source=match.group(1),
                        description=f"{match.group(3)} {match.group(4)} {match.group(5)}",
                        artifact=match.group(4),
                        details={
                            "method": match.group(3),
                            "status": int(match.group(6)),
                            "bytes": int(match.group(7)) if match.group(7).isdigit() else 0
                        },
                        confidence=1.0
                    ))
                except (ValueError, IndexError):
                    continue
    
    def generate_timeline(self, time_zone: str = "UTC") -> List[Dict]:
        sorted_events = sorted(self.events, key=lambda x: x.timestamp)
        
        timeline = []
        for event in sorted_events:
            timeline.append({
                "timestamp": event.timestamp.isoformat(),
                "event_type": event.event_type.value,
                "source": event.source,
                "description": event.description,
                "artifact": event.artifact,
                "details": event.details,
                "confidence": event.confidence
            })
        
        return timeline
    
    def search_timeline(self, keyword: str = None, 
                       event_types: List[EventType] = None,
                       start_time: datetime = None,
                       end_time: datetime = None) -> List[Dict]:
        results = []
        
        for event in self.events:
            if event_types and event.event_type not in event_types:
                continue
            
            if start_time and event.timestamp < start_time:
                continue
            
            if end_time and event.timestamp > end_time:
                continue
            
            if keyword:
                search_text = f"{event.description} {event.source}".lower()
                if keyword.lower() not in search_text:
                    continue
            
            results.append({
                "timestamp": event.timestamp.isoformat(),
                "event_type": event.event_type.value,
                "source": event.source,
                "description": event.description,
                "details": event.details
            })
        
        return sorted(results, key=lambda x: x["timestamp"])
```

## Best Practices

- Always use write blockers when acquiring evidence
- Verify hash integrity immediately after acquisition
- Document chain of custody at every transfer
- Maintain original evidence, work on copies
- Use write-once media or encrypted storage for chain of custody
- Time-sync all systems before acquisition
- Use standard forensic formats (E01, AFF, DD)
- Document all tools used and their versions
- Preserve volatile data (memory) before powering off
- Use cryptographic hashes for evidence verification
- Store evidence in secure, access-controlled location
- Follow legal requirements for evidence handling

## Common Patterns

- **Dead Box Forensics**: Powered-off system imaging and analysis
- **Live Response**: Collecting volatile evidence before shutdown
- **Memory Forensics**: Using Volatility for RAM analysis
- **Network Forensics**: PCAP analysis with Wireshark/Bro
- **Malware Analysis**: Static and dynamic analysis techniques
- **Email Forensics**: Header analysis and content recovery
- **Mobile Forensics**: Device imaging and app data extraction
