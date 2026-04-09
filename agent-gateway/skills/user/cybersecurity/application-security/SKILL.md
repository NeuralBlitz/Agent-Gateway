---
name: Application Security
category: cybersecurity
description: Securing applications through design, development, and deployment practices to prevent vulnerabilities and protect against attacks
tags: [appsec, owasp, vulnerability, secure-development, threat-prevention]
version: "1.0"
---

# Application Security

## What I Do

I provide guidance on securing applications throughout the software development lifecycle. This includes identifying and mitigating common vulnerabilities (OWASP Top 10), implementing secure coding patterns, integrating security testing into CI/CD pipelines, and establishing defense-in-depth strategies that protect applications from injection attacks, broken authentication, data exposure, and other threats.

## When to Use Me

- Designing a new application and need security architecture guidance
- Reviewing code for common vulnerability patterns
- Implementing input validation, output encoding, or authentication flows
- Integrating SAST/DAST/SCA tools into your build pipeline
- Remediating findings from a penetration test or vulnerability scan
- Building middleware for security headers, CSRF protection, or rate limiting

## Core Concepts

1. **OWASP Top 10**: The most critical web application security risks including injection, broken authentication, sensitive data exposure, XXE, broken access control, misconfigurations, XSS, insecure deserialization, vulnerable components, and insufficient logging.
2. **Input Validation**: Verify all input on the server side using allowlists, type checks, length constraints, and range checks before processing.
3. **Output Encoding**: Context-aware encoding (HTML, JavaScript, URL, CSS) to prevent injection when rendering user-controlled data.
4. **Defense in Depth**: Layered security controls so that failure of one control does not compromise the entire system.
5. **Least Privilege**: Grant only the minimum permissions required for a function, user, or process to operate.
6. **Secure Session Management**: Use strong session IDs, enforce timeouts, regenerate tokens after authentication, and bind sessions to client attributes.
7. **Security Headers**: HTTP response headers (CSP, HSTS, X-Content-Type-Options, X-Frame-Options) that instruct browsers to enable built-in protections.
8. **Dependency Management**: Track and update third-party libraries to avoid inheriting known vulnerabilities (CVEs).
9. **Error Handling**: Return generic error messages to users while logging detailed diagnostics server-side to avoid information leakage.
10. **Security Testing Integration**: Embed SAST, DAST, and SCA scans in CI/CD to catch vulnerabilities before deployment.

## Code Examples

### 1. Parameterized Queries to Prevent SQL Injection (Python)

```python
import sqlite3
from typing import Optional, Dict, Any

def get_user_by_id(db_path: str, user_id: int) -> Optional[Dict[str, Any]]:
    """Fetch user with parameterized query to prevent SQL injection."""
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, email FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None
```

### 2. Content Security Policy Middleware (Node.js/Express)

```javascript
const helmet = require('helmet');

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'nonce-{{nonce}}'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://cdn.example.com"],
      connectSrc: ["'self'", "https://api.example.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: [],
    },
  })
);

app.use(helmet.hsts({ maxAge: 31536000, includeSubDomains: true, preload: true }));
app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: 'deny' }));
```

### 3. CSRF Token Validation (Python/Flask)

```python
import secrets
from functools import wraps
from flask import Flask, session, request, abort

def generate_csrf_token() -> str:
    if "_csrf_token" not in session:
        session["_csrf_token"] = secrets.token_hex(32)
    return session["_csrf_token"]

def csrf_protect(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method in ("POST", "PUT", "DELETE", "PATCH"):
            token = request.form.get("_csrf_token") or request.headers.get("X-CSRF-Token")
            if not token or token != session.get("_csrf_token"):
                abort(403, description="CSRF token missing or invalid")
        return f(*args, **kwargs)
    return decorated
```

### 4. Input Validation with Allowlists (Python)

```python
import re
from typing import Optional

ALLOWED_USERNAME_PATTERN = re.compile(r"^[a-zA-Z0-9_]{3,30}$")
ALLOWED_SORT_FIELDS = {"created_at", "updated_at", "username", "email"}

def validate_username(username: str) -> Optional[str]:
    if not ALLOWED_USERNAME_PATTERN.match(username):
        return None
    return username

def validate_sort_field(field: str) -> str:
    if field not in ALLOWED_SORT_FIELDS:
        return "created_at"
    return field
```

### 5. Secure Password Hashing (Python)

```python
import hashlib
import secrets
from typing import Tuple

def hash_password(password: str) -> Tuple[str, str]:
    salt = secrets.token_hex(32)
    pwd_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations=600_000
    )
    return pwd_hash.hex(), salt

def verify_password(password: str, stored_hash: str, salt: str) -> bool:
    pwd_hash = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations=600_000
    )
    return secrets.compare_digest(pwd_hash.hex(), stored_hash)
```

## Best Practices

1. **Validate all input server-side** using allowlists and strict type/length/range checks regardless of client-side validation.
2. **Use parameterized queries or ORMs** for all database interactions to prevent SQL injection.
3. **Encode output contextually** (HTML, JS, URL, CSS) when rendering user-controlled data.
4. **Set security headers** (CSP, HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy) on every response.
5. **Hash passwords with strong algorithms** (bcrypt, scrypt, Argon2, or PBKDF2 with high iteration counts) and unique salts.
6. **Implement CSRF protection** for all state-changing operations using synchronizer tokens or SameSite cookies.
7. **Keep dependencies updated** and run SCA scans to detect known vulnerabilities in third-party libraries.
8. **Log security events** (authentication failures, access denials, input validation failures) with enough context for investigation but without sensitive data.
9. **Fail securely** by denying access by default when errors occur rather than allowing access.
10. **Enforce HTTPS everywhere** and redirect HTTP to HTTPS with HSTS headers.
