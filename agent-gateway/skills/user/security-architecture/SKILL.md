---
name: security-architecture
description: Security system design principles
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
---

## What I do
- Design secure system architectures
- Apply defense-in-depth principles
- Create security boundaries and zones
- Select appropriate security controls
- Model threats and attack surfaces

## When to use me
When designing new systems, reviewing architecture, or improving security posture.

## Security Architecture Principles

### Defense in Depth
```python
# Layered security model
SECURITY_LAYERS = [
    "Physical Security",      # Layer 1: Data center, hardware
    "Network Security",       # Layer 2: Firewalls, segmentation
    "Host Security",          # Layer 3: OS hardening, patching
    "Application Security",   # Layer 4: Code, inputs, auth
    "Data Security"           # Layer 5: Encryption, access control
]

class DefenseInDepth:
    """Multi-layered security controls"""
    
    def __init__(self):
        self.layers = {}
    
    def add_control(self, layer: str, control: str, 
                    mitigation: str):
        if layer not in self.layers:
            self.layers[layer] = []
        
        self.layers[layer].append({
            "control": control,
            "mitigation": mitigation,
            "implemented": False
        })
```

### Zero Trust Architecture
```python
class ZeroTrust:
    """Never trust, always verify"""
    
    def __init__(self):
        self.policies = []
    
    def verify_request(self, request: dict) -> bool:
        """Verify every request regardless of source"""
        
        # 1. Verify identity
        if not self._verify_identity(request):
            return False
        
        # 2. Verify device
        if not self._verify_device(request):
            return False
        
        # 3. Verify access level
        if not self._verify_access(request):
            return False
        
        # 4. Verify context
        if not self._verify_context(request):
            return False
        
        # 5. Continuous monitoring
        if not self._monitor_session(request):
            return False
        
        return True
    
    def _verify_identity(self, request: dict) -> bool:
        """Strong authentication"""
        # MFA required
        return request.get("mfa_verified", False)
    
    def _verify_device(self, request: dict) -> bool:
        """Device compliance check"""
        return request.get("device_trusted", False) and \
               request.get("device_compliant", False)
    
    def _verify_access(self, request: dict) -> bool:
        """Least privilege access"""
        return request.get("required_permission") in \
               request.get("user_permissions", [])
    
    def _verify_context(self, request: dict) -> bool:
        """Risk-based access"""
        risk_score = self._calculate_risk(request)
        return risk_score < 80
    
    def _monitor_session(self, request: dict) -> bool:
        """Continuous session validation"""
        return request.get("session_valid", False)
```

### Network Segmentation
```python
class NetworkSegmentation:
    """Isolate network segments"""
    
    ZONES = {
        "dmz": {
            "description": "Public-facing services",
            "allowed_inbound": ["http", "https"],
            "allowed_outbound": ["app_layer"],
            "trust_level": "untrusted"
        },
        "app_layer": {
            "description": "Application servers",
            "allowed_inbound": ["dmz", "internal"],
            "allowed_outbound": ["data_layer"],
            "trust_level": "semi-trusted"
        },
        "data_layer": {
            "description": "Databases and storage",
            "allowed_inbound": ["app_layer"],
            "allowed_outbound": [],
            "trust_level": "trusted"
        },
        "management": {
            "description": "Admin systems",
            "allowed_inbound": ["admin_vpn"],
            "allowed_outbound": ["all"],
            "trust_level": "highly_trusted"
        }
    }
    
    def get_allowed_traffic(self, from_zone: str, to_zone: str) -> bool:
        """Check if traffic is allowed between zones"""
        from_rules = self.ZONES.get(to_zone, {}).get("allowed_inbound", [])
        return from_zone in from_rules or "all" in from_rules
```

## Security Controls

### Identity and Access Management
```python
class IAMArchitecture:
    """Identity and Access Management"""
    
    def __init__(self):
        self.idp = "active_directory"  # or Okta, Auth0
        self.mfa_required = True
        self.session_timeout = 3600
    
    def authenticate(self, credentials: dict) -> dict:
        """Multi-factor authentication"""
        # Step 1: Primary auth
        user = self._verify_credentials(credentials)
        
        # Step 2: MFA
        if self.mfa_required:
            if not self._verify_mfa(user, credentials.get("mfa_token")):
                raise AuthenticationError("MFA required")
        
        # Step 3: Issue token
        return self._issue_token(user)
    
    def authorize(self, token: dict, resource: str, 
                  action: str) -> bool:
        """Attribute-based access control"""
        # Check permissions
        if not self._check_permission(token, resource, action):
            return False
        
        # Check resource ownership
        if not self._check_ownership(token, resource):
            return False
        
        # Check contextual factors
        if not self._check_context(token, resource):
            return False
        
        return True
```

### Data Protection Architecture
```python
class DataProtection:
    """Data classification and protection"""
    
    CLASSIFICATIONS = {
        "public": {
            "encryption_in_transit": False,
            "encryption_at_rest": False,
            "access_control": "none"
        },
        "internal": {
            "encryption_in_transit": True,
            "encryption_at_rest": True,
            "access_control": "authentication"
        },
        "confidential": {
            "encryption_in_transit": True,
            "encryption_at_rest": True,
            "access_control": "role_based"
        },
        "restricted": {
            "encryption_in_transit": True,
            "encryption_at_rest": True,
            "access_control": "explicit_grant"
        }
    }
    
    def protect_data(self, data: str, classification: str) -> dict:
        """Apply appropriate controls based on classification"""
        controls = self.CLASSIFICATIONS.get(classification, {})
        
        result = {
            "data": data,
            "classification": classification,
            "encrypted": controls.get("encryption_at_rest", False)
        }
        
        if controls.get("encryption_at_rest"):
            result["data"] = self._encrypt(data)
        
        return result
```

### Logging and Monitoring
```python
class SecurityMonitoring:
    """Security event monitoring"""
    
    def __init__(self):
        self.alert_thresholds = {
            "failed_login": 5,
            "data_exfiltration_mb": 1000,
            "admin_action": 1,
            "privilege_escalation": 1
        }
    
    def log_event(self, event: dict):
        """Log security event"""
        event["timestamp"] = datetime.now()
        event["完整性校验"] = self._calculate_hash(event)
        
        # Check for alerts
        self._check_alerts(event)
    
    def _check_alerts(self, event: dict):
        """Check if event triggers alerts"""
        for alert_type, threshold in self.alert_thresholds.items():
            if event.get("type") == alert_type:
                if event.get("count", 1) >= threshold:
                    self._trigger_alert(event)
```

## Threat Modeling

### STRIDE Analysis
```python
class ThreatModelSTRIDE:
    """STRIDE threat categories"""
    
    CATEGORIES = {
        "S": "Spoofing - Impersonating someone else",
        "T": "Tampering - Modifying data or code",
        "R": "Repudiation - Claiming to not have performed action",
        "I": "Information Disclosure - Exposing information",
        "D": "Denial of Service - Making system unavailable",
        "E": "Elevation of Privilege - Gaining capabilities"
    }
    
    def identify_threats(self, component: str) -> list:
        """Identify threats for a component"""
        threats = []
        
        if component == "authentication":
            threats.extend([
                ("S", "Credential theft"),
                ("R", "Failed login not logged"),
                ("I", "Passwords in logs")
            ])
        
        return threats
```
