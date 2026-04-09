---
name: compliance
description: Regulatory compliance management
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
---

## What I do
- Identify applicable regulatory frameworks (GDPR, HIPAA, SOC2, PCI-DSS)
- Implement data protection and privacy controls
- Conduct compliance audits
- Document security controls and processes
- Manage data retention and deletion policies
- Handle data subject requests (DSAR)
- Implement audit logging

## When to use me
When building systems that must comply with regulations around data protection, privacy, or industry-specific security requirements.

## Key Compliance Frameworks

### GDPR (General Data Protection Regulation)
```python
from datetime import datetime, timedelta
from enum import Enum

class DataCategory(Enum):
    PERSONAL = "personal"
    SENSITIVE = "sensitive"
    SPECIAL = "special_category"

class GDPRCompliance:
    def __init__(self):
        self.data_subjects = {}
        self.consent_records = {}
    
    def process_data_subject_request(self, request_id: str, request_type: str):
        """Handle DSAR - Data Subject Access Requests"""
        if request_type == "access":
            return self._handle_access_request(request_id)
        elif request_type == "deletion":
            return self._handle_deletion_request(request_id)
        elif request_type == "portability":
            return self._handle_portability_request(request_id)
    
    def _handle_deletion_request(self, request_id: str) -> dict:
        """Right to be forgotten - delete all personal data"""
        subject = self.data_subjects.get(request_id)
        if not subject:
            raise ValueError("Data subject not found")
        
        # Delete from all systems
        self._delete_from_database(request_id)
        self._delete_from_cache(request_id)
        self._delete_from_backups(request_id)
        
        return {"status": "completed", "request_id": request_id}
    
    def record_consent(self, user_id: str, purpose: str, granted: bool):
        """Record user consent with timestamp"""
        if user_id not in self.consent_records:
            self.consent_records[user_id] = []
        
        self.consent_records[user_id].append({
            "purpose": purpose,
            "granted": granted,
            "timestamp": datetime.now(),
            "ip_address": get_current_ip(),
            "version": "1.0"
        })
    
    def has_valid_consent(self, user_id: str, purpose: str) -> bool:
        """Check if user has valid consent for purpose"""
        records = self.consent_records.get(user_id, [])
        for record in records:
            if record["purpose"] == purpose and record["granted"]:
                return True
        return False
```

### HIPAA Compliance
```python
class HIPAAController:
    """Health Insurance Portability and Accountability Act"""
    
    def __init__(self):
        self.phi_access_log = []
        self.encryption_required = True
    
    def access_phi(self, user_id: str, patient_id: str, data_type: str):
        """Log all Protected Health Information access"""
        if not self._is_authorized(user_id, patient_id):
            raise PermissionError("Unauthorized PHI access")
        
        self.phi_access_log.append({
            "user_id": user_id,
            "patient_id": patient_id,
            "data_type": data_type,
            "timestamp": datetime.now(),
            "action": "read"
        })
    
    def _is_authorized(self, user_id: str, patient_id: str) -> bool:
        """Check minimum necessary standard"""
        return True  # Implement actual authorization logic
    
    def encrypt_phi(self, data: bytes) -> bytes:
        """Encrypt PHI at rest and in transit"""
        if not self.encryption_required:
            return data
        from cryptography.fernet import Fernet
        key = self._get_encryption_key()
        f = Fernet(key)
        return f.encrypt(data)
```

### SOC 2 Compliance
```python
class SOC2Controls:
    """Service Organization Control 2"""
    
    def __init__(self):
        self.controls = {}
        self.exceptions = []
    
    def document_control(self, control_id: str, description: str, 
                        control_type: str, periodicity: str):
        """Document security control"""
        self.controls[control_id] = {
            "description": description,
            "type": control_type,  # preventive, detective, corrective
            "periodicity": periodicity,  # daily, weekly, monthly, quarterly
            "last_tested": None,
            "status": "active"
        }
    
    def log_control_exception(self, control_id: str, description: str,
                            remediation: str):
        """Log control deviation with remediation"""
        self.exceptions.append({
            "control_id": control_id,
            "description": description,
            "remediation": remediation,
            "timestamp": datetime.now(),
            "status": "open"
        })
```

## Data Retention Policies
```python
class DataRetentionPolicy:
    def __init__(self):
        self.policies = {
            "user_data": {"retention": timedelta(days=365*2), "deletion": "automatic"},
            "logs": {"retention": timedelta(days=90), "deletion": "automatic"},
            "financial": {"retention": timedelta(days=365*7), "deletion": "manual"},
            "session_data": {"retention": timedelta(hours=24), "deletion": "automatic"}
        }
    
    def should_delete(self, data_category: str, created_at: datetime) -> bool:
        policy = self.policies.get(data_category)
        if not policy:
            return False
        
        age = datetime.now() - created_at
        return age > policy["retention"]
    
    def apply_retention_policy(self):
        """Run periodically to delete expired data"""
        for category, policy in self.policies.items():
            if policy["deletion"] == "automatic":
                self._delete_expired_data(category, policy["retention"])
```

## Audit Logging
```python
import hashlib
import json

class ComplianceLogger:
    def __init__(self):
        self.logs = []
    
    def log_event(self, event_type: str, user_id: str, resource: str,
                  action: str, result: str, metadata: dict = None):
        """Immutable audit log entry"""
        entry = {
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "user_id": user_id,
            "resource": resource,
            "action": action,
            "result": result,
            "metadata": metadata or {}
        }
        
        # Create integrity hash
        entry["hash"] = self._calculate_hash(entry)
        
        self.logs.append(entry)
        self._write_to_secure_storage(entry)
    
    def _calculate_hash(self, entry: dict) -> str:
        """Calculate hash for integrity verification"""
        content = json.dumps(entry, sort_keys=True)
        return hashlib.sha256(content.encode()).hexdigest()
```
