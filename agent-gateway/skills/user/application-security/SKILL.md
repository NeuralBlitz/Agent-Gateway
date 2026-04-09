---
name: application-security
description: Secure software development practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
---

## What I do
- Implement secure software development lifecycle (SDLC)
- Identify and mitigate application vulnerabilities
- Design and implement authentication/authorization systems
- Conduct security code reviews
- Implement input validation and output encoding
- Configure web application firewalls
- Handle sensitive data securely
- Implement secure session management

## When to use me
When building, reviewing, or securing web applications, APIs, or any software that processes user data or requires protection against attacks.

## Secure Development Lifecycle

### Threat Modeling
```python
class ThreatModel:
    """Identify threats during design phase"""
    
    def __init__(self, application: str):
        self.application = application
        self.threats = []
    
    def add_data_flow(self, source: str, dest: str, data_type: str):
        """Model data flows to identify trust boundaries"""
        self.threats.append({
            'source': source,
            'destination': dest,
            'data_type': data_type,
            'trust_boundary': self._is_trust_boundary(source, dest)
        })
    
    def _is_trust_boundary(self, source: str, dest: str) -> bool = ['app_server', 'database']
:
        trusted        untrusted = ['user_browser', 'external_api']
        return (source in untrusted and dest in trusted) or \
               (source in trusted and dest in untrusted)
```

### Input Validation
```python
from pydantic import BaseModel, validator
import re

class UserRegistration(BaseModel):
    username: str
    email: str
    password: str
    
    @validator('email')
    def validate_email(cls, v):
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError('Invalid email format')
        return v.lower()
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 12:
            raise ValueError('Password must be at least 12 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain numbers')
        return v
```

### Output Encoding
```python
import html

def safe_render(user_input: str) -> str:
    return html.escape(user_input)
```

## Authentication Patterns

### MFA Implementation
```python
import pyotp

class MFAProvider:
    def __init__(self, secret: str = None):
        self.secret = secret or pyotp.random_base32()
    
    def get_qr_uri(self, account_name: str) -> str:
        return pyotp.totp(self.secret).provisioning_uri(
            account_name, issuer_name="MyApp"
        )
    
    def verify(self, token: str) -> bool:
        totp = pyotp.TOTP(self.secret)
        return totp.verify(token, valid_window=1)
```

### Session Management
```python
import secrets
from datetime import datetime, timedelta

class SecureSessionManager:
    def __init__(self):
        self.sessions = {}
        self.session_timeout = timedelta(hours=1)
    
    def create_session(self, user_id: str) -> str:
        session_id = secrets.token_hex(32)
        self.sessions[session_id] = {
            'user_id': user_id,
            'created_at': datetime.now(),
            'last_activity': datetime.now()
        }
        return session_id
```

## Authorization Models

### RBAC Implementation
```python
from enum import Enum
from functools import wraps

class Role(Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

class Permission(Enum):
    READ = "read"
    WRITE = "write"
    DELETE = "delete"

ROLE_PERMISSIONS = {
    Role.ADMIN: {Permission.READ, Permission.WRITE, Permission.DELETE},
    Role.USER: {Permission.READ, Permission.WRITE},
    Role.GUEST: {Permission.READ}
}

def require_permission(permission: Permission):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.has_permission(permission):
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator
```
