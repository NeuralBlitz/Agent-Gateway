---
name: Application Security
description: Secure software development practices, vulnerability remediation, and secure coding techniques
license: MIT
compatibility:
  - Python 3.8+
  - Node.js 14+
  - Java 11+
  - Go 1.18+
audience: Software developers, security engineers, DevSecOps engineers
category: Cybersecurity
---

# Application Security

## What I do

I enable secure software development by identifying vulnerabilities, implementing secure coding practices, integrating security into CI/CD pipelines, performing code reviews, and providing remediation guidance for common application security flaws.

## When to use me

- Writing secure code in any programming language
- Reviewing code for security vulnerabilities
- Implementing authentication and authorization
- Securing APIs and microservices
- Integrating security scanning into build pipelines
- Responding to security findings from scanners
- Implementing input validation and output encoding
- Managing secrets and credentials securely

## Core Concepts

- **OWASP Top 10**: Understanding the most critical web security risks
- **Secure SDLC**: Integrating security throughout software development lifecycle
- **Input Validation**: Whitelisting, sanitization, and parameterization
- **Authentication**: MFA, session management, password hashing
- **Authorization**: RBAC, ABAC, least privilege, zero-trust
- **Session Management**: Secure cookies, session fixation protection
- **Cryptographic Practices**: Proper use of encryption, hashing, signatures
- **API Security**: Authentication, rate limiting, input validation
- **Secrets Management**: Vaults, environment variables, rotation
- **Dependency Security**: SCA tools, vulnerability scanning, updates

## Code Examples

### SQL Injection Prevention

```python
import sqlite3
from typing import List, Any, Optional
from dataclasses import dataclass
from contextlib import contextmanager

@dataclass
class User:
    id: int
    username: str
    email: str
    role: str

class SecureDatabase:
    def __init__(self, db_path: str):
        self.db_path = db_path
    
    @contextmanager
    def get_connection(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        query = "SELECT id, username, email, role FROM users WHERE id = ?"
        
        with self.get_connection() as conn:
            cursor = conn.execute(query, (user_id,))
            row = cursor.fetchone()
            
            if row:
                return User(id=row['id'], username=row['username'],
                           email=row['email'], role=row['role'])
            return None
    
    def search_users(self, search_term: str, limit: int = 10) -> List[User]:
        query = """
            SELECT id, username, email, role FROM users 
            WHERE username LIKE ? OR email LIKE ? 
            LIMIT ?
        """
        
        search_pattern = f"%{search_term}%"
        
        with self.get_connection() as conn:
            cursor = conn.execute(query, (search_pattern, search_pattern, limit))
            return [User(id=row['id'], username=row['username'],
                        email=row['email'], role=row['role'])
                   for row in cursor.fetchall()]
    
    def execute_raw_query(self, query: str, params: tuple) -> List[dict]:
        allowed_statements = {"SELECT"}
        
        statement_type = query.strip().split()[0].upper()
        if statement_type not in allowed_statements:
            raise ValueError("Only SELECT statements are allowed")
        
        if "DROP" in query.upper() or "DELETE" in query.upper() or \
           "UPDATE" in query.upper() or "INSERT" in query.upper():
            raise ValueError("Disallowed SQL operation")
        
        with self.get_connection() as conn:
            cursor = conn.execute(query, params)
            columns = [desc[0] for desc in cursor.description]
            return [dict(zip(columns, row)) for row in cursor.fetchall()]
```

### XSS Prevention with Output Encoding

```python
import html
import re
from typing import Union, Dict, List
from dataclasses import dataclass
from enum import Enum

class EncodingType(Enum):
    HTML = "html"
    URL = "url"
    JAVASCRIPT = "js"
    CSS = "css"
    HTML_ATTRIBUTE = "html_attr"

@dataclass
class SanitizationConfig:
    allow_attributes: List[str] = None
    allow_tags: List[str] = None
    strip_disallowed: bool = True

class OutputEncoder:
    @staticmethod
    def encode_for_html(unsafe_string: str) -> str:
        return html.escape(unsafe_string)
    
    @staticmethod
    def encode_for_url(unsafe_string: str) -> str:
        import urllib.parse
        return urllib.parse.quote(unsafe_string, safe='')
    
    @staticmethod
    def encode_for_javascript(unsafe_string: str) -> str:
        replacements = {
            '\\': '\\\\',
            '"': '\\"',
            "'": "\\'",
            '\n': '\\n',
            '\r': '\\r',
            '\t': '\\t',
            '<': '\\x3c',
            '>': '\\x3e',
            '&': '\\x26',
        }
        result = unsafe_string
        for old, new in replacements.items():
            result = result.replace(old, new)
        return result
    
    @staticmethod
    def encode_for_css(unsafe_string: str) -> str:
        pattern = r'[^\w\-]'
        return re.sub(pattern, lambda m: '\\%02x' % ord(m.group()), unsafe_string)

class InputValidator:
    ALPHA_PATTERN = re.compile(r'^[a-zA-Z]+$')
    EMAIL_PATTERN = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
    
    @classmethod
    def validate_alpha(cls, value: str, max_length: int = 50) -> tuple:
        if not value:
            return False, "Value is required"
        if len(value) > max_length:
            return False, f"Value exceeds maximum length of {max_length}"
        if not cls.ALPHA_PATTERN.match(value):
            return False, "Value must contain only letters"
        return True, value
    
    @classmethod
    def validate_email(cls, value: str) -> tuple:
        if not value:
            return False, "Email is required"
        if len(value) > 254:
            return False, "Email too long"
        if not cls.EMAIL_PATTERN.match(value):
            return False, "Invalid email format"
        return True, value.lower()
    
    @classmethod
    def validate_uuid(cls, value: str) -> tuple:
        if not value:
            return False, "UUID is required"
        if not cls.UUID_PATTERN.match(value):
            return False, "Invalid UUID format"
        return True, value.lower()
```

### CSRF Token Handler

```python
import secrets
import hashlib
import time
from typing import Optional
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class CSRFToken:
    token: str
    created_at: datetime
    expires_at: datetime
    session_id: str

class CSRFTokenManager:
    MAX_TOKEN_AGE_MINUTES = 30
    TOKEN_LENGTH = 32
    
    def __init__(self):
        self.tokens: dict = {}
    
    def generate_token(self, session_id: str) -> CSRFToken:
        token = secrets.token_urlsafe(self.TOKEN_LENGTH)
        now = datetime.now()
        
        csrf_token = CSRFToken(
            token=token,
            created_at=now,
            expires_at=now + timedelta(minutes=self.MAX_TOKEN_AGE_MINUTES),
            session_id=session_id
        )
        
        self.tokens[token] = csrf_token
        self._cleanup_expired()
        
        return csrf_token
    
    def validate_token(self, token: str, session_id: str) -> tuple:
        if not token:
            return False, "Token is missing"
        
        csrf_token = self.tokens.get(token)
        if not csrf_token:
            return False, "Invalid token"
        
        if datetime.now() > csrf_token.expires_at:
            del self.tokens[token]
            return False, "Token has expired"
        
        if csrf_token.session_id != session_id:
            return False, "Session mismatch"
        
        return True, csrf_token
    
    def _cleanup_expired(self):
        now = datetime.now()
        expired = [t for t, v in self.tokens.items() if now > v.expires_at]
        for t in expired:
            del self.tokens[t]
    
    def refresh_token(self, old_token: str, session_id: str) -> Optional[CSRFToken]:
        valid, result = self.validate_token(old_token, session_id)
        if valid:
            del self.tokens[old_token]
            return self.generate_token(session_id)
        return None
```

### Secure Session Management

```python
import secrets
import hashlib
import json
import base64
import time
from typing import Optional, Dict, Any
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from cryptography.fernet import Fernet

@dataclass
class Session:
    session_id: str
    user_id: str
    created_at: datetime
    last_accessed: datetime
    expires_at: datetime
    data: Dict[str, Any] = field(default_factory=dict)
    is_valid: bool = True

class SessionManager:
    SESSION_COOKIE_NAME = "session_id"
    SESSION_TIMEOUT_MINUTES = 60
    ABSOLUTE_TIMEOUT_HOURS = 8
    
    def __init__(self, secret_key: str):
        self.secret_key = secret_key
        self.sessions: Dict[str, Session] = {}
        self.cipher = Fernet(self._derive_fernet_key())
    
    def _derive_fernet_key(self) -> bytes:
        key_bytes = hashlib.pbkdf2_hmac(
            'sha256',
            self.secret_key.encode(),
            b'session_salt',
            100000,
            32
        )
        return base64.urlsafe_b64encode(key_bytes)
    
    def create_session(self, user_id: str) -> Session:
        session_id = secrets.token_urlsafe(32)
        now = datetime.now()
        
        session = Session(
            session_id=session_id,
            user_id=user_id,
            created_at=now,
            last_accessed=now,
            expires_at=now + timedelta(minutes=self.SESSION_TIMEOUT_MINUTES)
        )
        
        self.sessions[session_id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[Session]:
        session = self.sessions.get(session_id)
        
        if not session:
            return None
        
        if datetime.now() > session.expires_at:
            del self.sessions[session_id]
            return None
        
        session.last_accessed = datetime.now()
        session.expires_at = datetime.now() + timedelta(minutes=self.SESSION_TIMEOUT_MINUTES)
        
        return session
    
    def invalidate_session(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id].is_valid = False
            del self.sessions[session_id]
    
    def validate_session_cookie(self, cookie_value: str) -> Optional[Session]:
        try:
            session_id = self.cipher.decrypt(
                base64.urlsafe_b64decode(cookie_value)
            ).decode()
            return self.get_session(session_id)
        except Exception:
            return None
    
    def create_secure_cookie(self, session_id: str) -> str:
        encrypted = self.cipher.encrypt(session_id.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
```

### Secure Password Handler

```python
import secrets
import hashlib
import bcrypt
from typing import Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta

@dataclass
class PasswordStrengthResult:
    score: int
    feedback: list
    is_acceptable: bool

class PasswordValidator:
    MIN_LENGTH = 12
    MAX_LENGTH = 128
    
    @classmethod
    def check_password_strength(cls, password: str) -> PasswordStrengthResult:
        feedback = []
        score = 0
        
        length = len(password)
        if length < cls.MIN_LENGTH:
            feedback.append(f"Password must be at least {cls.MIN_LENGTH} characters")
        elif length >= 16:
            score += 2
        elif length >= 12:
            score += 1
        
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(not c.isalnum() for c in password)
        
        char_types = sum([has_upper, has_lower, has_digit, has_special])
        score += char_types
        
        if not has_upper:
            feedback.append("Add uppercase letters")
        if not has_lower:
            feedback.append("Add lowercase letters")
        if not has_digit:
            feedback.append("Add numbers")
        if not has_special:
            feedback.append("Add special characters")
        
        common_patterns = [
            '123', 'abc', 'qwerty', 'password', 'admin',
            'letmein', 'welcome', 'login'
        ]
        
        password_lower = password.lower()
        for pattern in common_patterns:
            if pattern in password_lower:
                score = max(0, score - 2)
                feedback.append(f"Avoid common patterns like '{pattern}'")
        
        if password.strip() != password:
            feedback.append("Remove leading/trailing whitespace")
        
        return PasswordStrengthResult(
            score=min(score, 7),
            feedback=feedback,
            is_acceptable=length >= cls.MIN_LENGTH and char_types >= 3
        )
    
    @classmethod
    def hash_password(cls, password: str) -> Tuple[str, str]:
        salt = bcrypt.gensalt(rounds=12)
        hashed = bcrypt.hashpw(password.encode(), salt)
        return hashed.decode(), salt.decode()
    
    @classmethod
    def verify_password(cls, password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode(), hashed.encode())
```

## Best Practices

- Apply security throughout the SDLC (threat modeling, secure design, coding, testing)
- Use parameterized queries for all database operations
- Implement proper output encoding for all user-controlled data
- Enforce least privilege for users and service accounts
- Use strong cryptographic algorithms (AES-256, SHA-256+, bcrypt/Argon2)
- Implement multi-factor authentication for sensitive operations
- Validate all input on server-side (client-side validation is easily bypassed)
- Use security headers (CSP, X-Frame-Options, HSTS)
- Keep dependencies updated and use SCA tools
- Implement proper error handling without exposing sensitive information
- Use secure session management with proper timeout and invalidation

## Common Patterns

- **Secure API Gateway**: Centralize authentication, rate limiting, and input validation
- **Defense in Depth**: Multiple security layers (WAF, input validation, authorization)
- **Secure Configuration**: Hardened defaults, environment-specific configs, secrets management
- **API Security Layer**: OAuth2/JWT validation, request signing, payload validation
- **Microservice Security**: Service mesh, mTLS, API gateways, zero-trust networking
