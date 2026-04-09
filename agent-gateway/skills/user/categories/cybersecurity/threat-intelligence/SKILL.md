---
name: Threat Intelligence
description: Collecting, analyzing, and applying threat data to improve security posture
license: MIT
compatibility:
  - Python 3.8+
  - Linux
audience: Security analysts, threat hunters, SOC teams, security architects
category: Cybersecurity
---

# Threat Intelligence

## What I do

I enable threat intelligence capabilities including IOC collection, threat actor profiling, ATT&CK mapping, threat feeds integration, and applying threat data to improve detection and defense.

## When to use me

- Collecting and processing threat intelligence feeds
- Mapping threats to MITRE ATT&CK framework
- Creating detection rules from threat data
- Threat hunting based on intelligence
- Analyzing campaign attribution
- Building threat profiles for actors
- Integrating STIX/TAXII feeds
- Prioritizing vulnerabilities based on threat data
- Sharing threat intelligence with stakeholders

## Core Concepts

- **IOCs**: Indicators of Compromise (IPs, domains, hashes, URLs)
- **TTPs**: Tactics, Techniques, and Procedures (MITRE ATT&CK)
- **Threat Feeds**: Commercial, OSINT, ISAC, government feeds
- **STIX/TAXII**: Structured threat intelligence standards
- **Diamond Model**: Attack analysis methodology
- **Kill Chain**: Understanding attack phases
- **Threat Hunting**: Proactive threat identification
- **Attribution**: Identifying threat actors
- **Intelligence Lifecycle**: Direction, Collection, Processing, Analysis, Dissemination
- **Risk Prioritization**: Combining threat data with asset criticality

## Code Examples

### IOC Manager

```python
from enum import Enum
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import hashlib

class IOCType(Enum):
    IP_ADDRESS = "ip"
    DOMAIN = "domain"
    URL = "url"
    FILE_HASH = "hash"
    EMAIL = "email"
    REGISTRY = "registry"
    MUTEX = "mutex"

class ThreatLevel(Enum):
    CRITICAL = 5
    HIGH = 4
    MEDIUM = 3
    LOW = 2
    INFO = 1

@dataclass
class IOC:
    ioc_id: str
    value: str
    ioc_type: IOCType
    threat_level: ThreatLevel
    source: List[str]
    first_seen: datetime
    last_seen: datetime
    tags: List[str] = field(default_factory=list)
    confidence: float = 0.0
    description: str = ""
    campaigns: List[str] = field(default_factory=list)
    remediation: str = ""

class IOCManager:
    def __init__(self):
        self.iocs: Dict[str, IOC] = {}
        self.ioc_index: Dict[str, List[str]] = {
            "ip": [],
            "domain": [],
            "url": [],
            "hash": []
        }
    
    def add_ioc(self, value: str, ioc_type: IOCType, source: List[str],
               threat_level: ThreatLevel, description: str = "",
               tags: List[str] = None) -> IOC:
        ioc_id = self._generate_ioc_id(value)
        
        ioc = IOC(
            ioc_id=ioc_id,
            value=value,
            ioc_type=ioc_type,
            threat_level=threat_level,
            source=source,
            first_seen=datetime.now(),
            last_seen=datetime.now(),
            tags=tags or [],
            description=description
        )
        
        self.iocs[ioc_id] = ioc
        self._index_ioc(ioc)
        
        return ioc
    
    def _generate_ioc_id(self, value: str) -> str:
        hash_obj = hashlib.md5(f"{value}{datetime.now()}".encode())
        return f"IOC-{hash_obj.hexdigest()[:12].upper()}"
    
    def _index_ioc(self, ioc: IOC):
        index_key = ioc.ioc_type.value
        if index_key in self.ioc_index:
            self.ioc_index[index_key].append(ioc.value)
    
    def lookup(self, value: str, ioc_type: IOCType) -> Optional[IOC]:
        for ioc in self.iocs.values():
            if ioc.value == value and ioc.ioc_type == ioc_type:
                return ioc
        return None
    
    def bulk_lookup(self, values: List[Dict]) -> Dict[str, Optional[IOC]]:
        results = {}
        
        for item in values:
            value = item['value']
            ioc_type = item.get('type', IOCType.IP_ADDRESS)
            result = self.lookup(value, ioc_type)
            results[value] = result
        
        return results
    
    def check_ip(self, ip: str) -> Optional[IOC]:
        return self.lookup(ip, IOCType.IP_ADDRESS)
    
    def check_domain(self, domain: str) -> Optional[IOC]:
        return self.lookup(domain, IOCType.DOMAIN)
    
    def check_hash(self, file_hash: str) -> Optional[IOC]:
        normalized_hash = file_hash.lower()
        return self.lookup(normalized_hash, IOCType.FILE_HASH)
    
    def get_malicious_ips(self, limit: int = 100) -> List[Dict]:
        malicious = []
        
        for ioc in self.iocs.values():
            if ioc.ioc_type == IOCType.IP_ADDRESS:
                if ioc.threat_level.value >= ThreatLevel.HIGH.value:
                    malicious.append({
                        "value": ioc.value,
                        "threat_level": ioc.threat_level.name,
                        "tags": ioc.tags,
                        "last_seen": ioc.last_seen.isoformat()
                    })
        
        return malicious[:limit]
    
    def export_stix(self) -> Dict:
        stix_objects = []
        
        for ioc in self.iocs.values():
            stix_obj = {
                "type": "indicator",
                "id": f"indicator--{ioc.ioc_id.lower()}",
                "created": ioc.first_seen.isoformat(),
                "modified": ioc.last_seen.isoformat(),
                "pattern": f"[ipv4-addr:value = '{ioc.value}']" 
                          if ioc.ioc_type == IOCType.IP_ADDRESS else "",
                "labels": ["malicious-activity"],
                "external_references": [
                    {"source_name": src, "url": src} 
                    for src in ioc.source
                ]
            }
            stix_objects.append(stix_obj)
        
        return {
            "type": "bundle",
            "objects": stix_objects
        }
```

### MITRE ATT&CK Mapper

```python
from enum import Enum
from typing import Dict, List, Set
from dataclasses import dataclass
from datetime import datetime

class ATTACKTactic(Enum):
    RECONNAISSANCE = "TA0043"
    RESOURCE_DEVELOPMENT = "TA0042"
    INITIAL_ACCESS = "TA0001"
    EXECUTION = "TA0002"
    PERSISTENCE = "TA0003"
    PRIVILEGE_ESCALATION = "TA0004"
    DEFENSE_EVASION = "TA0005"
    CREDENTIAL_ACCESS = "TA0006"
    DISCOVERY = "TA0007"
    LATERAL_MOVEMENT = "TA0008"
    COLLECTION = "TA0009"
    COMMAND_AND_CONTROL = "TA0011"
    EXFILTRATION = "TA0010"
    IMPACT = "TA0040"

@dataclass
class ATTACKTechnique:
    technique_id: str
    name: str
    tactic: ATTACKTactic
    description: str
    detection: str
    mitigations: List[str]

class ATTACKMapper:
    TECHNIQUES = {
        "T1566": ATTACKTechnique(
            technique_id="T1566",
            name="Phishing",
            tactic=ATTACKTactic.INITIAL_ACCESS,
            description="Adversaries may send phishing messages to gain access to victim systems",
            detection="Monitor for suspicious email attachments and links",
            mitigations=["User training", "Email filtering", "MFA"]
        ),
        "T1059": ATTACKTechnique(
            technique_id="T1059",
            name="Command and Scripting Interpreter",
            tactic=ATTACKTactic.EXECUTION,
            description="Adversaries may abuse command and script interpreters to execute commands",
            detection="Monitor for unusual process spawning",
            mitigations=["Application whitelisting", "Restrict PowerShell"]
        ),
        "T1053": ATTACKTechnique(
            technique_id="T1053",
            name="Scheduled Task/Job",
            tactic=ATTACKTactic.PERSISTENCE,
            description="Adversaries may schedule tasks to gain execution",
            detection="Monitor for scheduled task creation",
            mitigations=["Limit privileges", "Audit scheduled tasks"]
        ),
        "T1021": ATTACKTechnique(
            technique_id="T1021",
            name="Remote Services",
            tactic=ATTACKTactic.LATERAL_MOVEMENT,
            description="Adversaries may use valid accounts to log into a service for remote access",
            detection="Monitor for unusual remote access patterns",
            mitigations=["MFA", "Network segmentation", "Log analysis"]
        ),
        "T1486": ATTACKTechnique(
            technique_id="T1486",
            name="Data Encrypted for Impact",
            tactic=ATTACKTactic.IMPACT,
            description="Adversaries may encrypt data on target systems to interrupt availability",
            detection="Monitor for mass file encryption",
            mitigations=["Backups", "Endpoint detection", "Network segmentation"]
        )
    }
    
    def __init__(self):
        self.mappings: Dict[str, Set[str]] = {}
    
    def map_ioc_to_techniques(self, ioc_type: str, value: str) -> List[str]:
        techniques = []
        
        if "powershell" in value.lower() or "cmd.exe" in value.lower():
            techniques.append("T1059")
        
        if "scheduled" in value.lower() or "cron" in value.lower():
            techniques.append("T1053")
        
        if "ransom" in value.lower() or "encrypt" in value.lower():
            techniques.append("T1486")
        
        if any(d in value.lower() for d in ['smb', 'rdp', 'ssh', 'vnc']):
            techniques.append("T1021")
        
        if any(p in value.lower() for p in ['http://', 'https://', 'dns:']):
            techniques.append("T1071")
        
        return techniques
    
    def analyze_incident(self, description: str, iocs: List[str]) -> Dict:
        detected_techniques = set()
        
        for ioc in iocs:
            techniques = self.map_ioc_to_techniques("generic", ioc)
            detected_techniques.update(techniques)
        
        for tech_id, technique in self.TECHNIQUES.items():
            if technique.description.lower() in description.lower():
                detected_techniques.add(tech_id)
        
        technique_objects = [
            {
                "id": tech_id,
                **self.TECHNIQUES[tech_id].__dict__
            }
            for tech_id in detected_techniques
            if tech_id in self.TECHNIQUES
        ]
        
        tactics_used = set(
            self.TECHNIQUES[t].tactic for t in detected_techniques 
            if t in self.TECHNIQUES
        )
        
        return {
            "detection_date": datetime.now().isoformat(),
            "techniques_detected": technique_objects,
            "tactics_used": [t.value for t in tactics_used],
            "coverage_gaps": self._identify_coverage_gaps(detected_techniques)
        }
    
    def _identify_coverage_gaps(self, detected_techniques: Set[str]) -> List[Dict]:
        gaps = []
        
        for tech_id, technique in self.TECHNIQUES.items():
            if tech_id not in detected_techniques:
                gaps.append({
                    "technique": tech_id,
                    "name": technique.name,
                    "priority": "HIGH" if technique.tactic in [
                        ATTACKTactic.INITIAL_ACCESS,
                        ATTACKTactic.CREDENTIAL_ACCESS,
                        ATTACKTactic.EXFILTRATION
                    ] else "MEDIUM"
                })
        
        return gaps[:10]
    
    def generate_detection_rules(self, techniques: List[str]) -> List[Dict]:
        rules = []
        
        sigma_rules = {
            "T1566": {
                "title": "Possible Phishing",
                "detection": "process where command line contains suspicious attachment extensions",
                "tags": ["attack.initial_access", "attack.phishing"]
            },
            "T1059": {
                "title": "Suspicious Command Shell Usage",
                "detection": "process creation of cmd.exe or powershell.exe with suspicious parameters",
                "tags": ["attack.execution", "attack.command_and_scripting_interpreter"]
            },
            "T1053": {
                "title": "Scheduled Task Creation",
                "detection": "Event ID 4698 or 106 in Windows Security log",
                "tags": ["attack.persistence", "attack.scheduled_task"]
            }
        }
        
        for tech_id in techniques:
            if tech_id in sigma_rules:
                rules.append({
                    "technique": tech_id,
                    **sigma_rules[tech_id]
                })
        
        return rules
```

### Threat Feed Aggregator

```python
import requests
from typing import Dict, List, Set
from dataclasses import dataclass
from datetime import datetime, timedelta
import json

@dataclass
class ThreatFeed:
    name: str
    url: str
    feed_type: str
    last_updated: datetime
    update_frequency: str
    ioc_count: int
    reliability_score: float

class ThreatFeedAggregator:
    def __init__(self):
        self.feeds: Dict[str, ThreatFeed] = {}
        self.blocklist: Set[str] = set()
        self.feed_data: Dict[str, List[Dict]] = {}
    
    def register_feed(self, name: str, url: str, feed_type: str):
        self.feeds[name] = ThreatFeed(
            name=name,
            url=url,
            feed_type=feed_type,
            last_updated=datetime.now() - timedelta(days=1),
            update_frequency="daily",
            ioc_count=0,
            reliability_score=0.8
        )
    
    def fetch_feed(self, name: str, api_key: str = None) -> Dict:
        if name not in self.feeds:
            return {"error": "Feed not registered"}
        
        feed = self.feeds[name]
        
        try:
            headers = {"Accept": "application/json"}
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"
            
            response = requests.get(feed.url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                self.feed_data[name] = data.get('ioc', data.get('data', []))
                self.feeds[name].last_updated = datetime.now()
                self.feeds[name].ioc_count = len(self.feed_data[name])
                
                return {"status": "success", "iocs_added": len(self.feed_data[name])}
            else:
                return {"status": "error", "message": f"HTTP {response.status_code}"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
    
    def build_blocklist(self, sources: List[str] = None) -> Set[str]:
        if sources is None:
            sources = list(self.feed_data.keys())
        
        for source in sources:
            if source in self.feed_data:
                for ioc in self.feed_data[source]:
                    if isinstance(ioc, dict):
                        value = ioc.get('indicator', ioc.get('value', ''))
                    else:
                        value = str(ioc)
                    
                    if value:
                        self.blocklist.add(value)
        
        return self.blocklist
    
    def check_ip_reputation(self, ip: str) -> Dict:
        results = {
            "indicator": ip,
            "type": "ipv4",
            "verdict": "unknown",
            "sources": [],
            "first_seen": None,
            "last_seen": None,
            "tags": [],
            "confidence_score": 0.0
        }
        
        hits = 0
        for name, data in self.feed_data.items():
            for ioc in data:
                if isinstance(ioc, dict):
                    if ioc.get('indicator') == ip or ioc.get('value') == ip:
                        hits += 1
                        results["sources"].append(name)
                        results["tags"].extend(ioc.get('tags', []))
                        if not results["first_seen"]:
                            results["first_seen"] = ioc.get('first_seen')
                        results["last_seen"] = ioc.get('last_seen')
                else:
                    if str(ioc) == ip:
                        hits += 1
                        results["sources"].append(name)
        
        if hits > 0:
            results["verdict"] = "malicious" if hits >= 2 else "suspicious"
            results["confidence_score"] = min(hits / 3, 1.0)
        
        return results
    
    def generate_intelligence_report(self) -> Dict:
        total_iocs = sum(len(data) for data in self.feed_data.values())
        
        sources_summary = [
            {
                "name": name,
                "iocs": len(data),
                "last_updated": feed.last_updated.isoformat(),
                "reliability": feed.reliability_score
            }
            for name, feed in self.feeds.items()
            if name in self.feed_data
        ]
        
        return {
            "report_date": datetime.now().isoformat(),
            "total_feeds": len(self.feeds),
            "active_feeds": len(self.feed_data),
            "total_iocs": total_iocs,
            "unique_indicators": len(self.blocklist),
            "feed_summary": sources_summary,
            "top_threats": self._get_top_threats(),
            "recommendations": [
                "Enable automatic feed updates for critical sources",
                "Integrate blocklist with firewall/SIEM",
                "Review and validate high-confidence IOCs",
                "Monitor feed reliability and remove stale sources"
            ]
        }
    
    def _get_top_threats(self) -> List[Dict]:
        threats = []
        
        for name, data in self.feed_data.items():
            for ioc in data[:5]:
                if isinstance(ioc, dict):
                    threats.append({
                        "indicator": ioc.get('value', ''),
                        "source": name,
                        "severity": ioc.get('severity', 'medium'),
                        "tags": ioc.get('tags', [])[:3]
                    })
        
        return threats[:10]
```

## Best Practices

- Use structured formats (STIX/TAXII) for threat intelligence sharing
- Apply confidence scores to all intelligence
- Contextualize IOCs with campaign and actor attribution
- Integrate threat feeds with SIEM for automated detection
- Regularly validate and update threat feeds
- Focus on actionable intelligence, not volume
- Apply risk-based prioritization using threat data
- Share intelligence with trusted partners and ISACs
- Document intelligence requirements based on threat landscape
- Train analysts on threat intelligence consumption
- Maintain intelligence lifecycle documentation
- Balance timeliness with accuracy

## Common Patterns

- **STIX/TAXII Integration**: Automated threat feed consumption and sharing
- **Threat Intelligence Platform (TIP)**: Centralized threat data management
- **Detection Engineering**: Converting threat intel to Sigma/YARA rules
- **Threat Hunting**: Proactive hunting based on actor TTPs
- **Intelligence Sharing**: ISAC participation, MISP communities
- **Risk Scoring**: Combining CVSS with threat actor capability
