---
name: security
description: Security best practices and patterns
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
---
## What I do
- Implement secure authentication (OAuth2, JWT, sessions)
- Protect against OWASP Top 10 vulnerabilities
- Handle secrets and credentials securely
- Implement proper authorization (RBAC, ABAC)
- Use HTTPS and TLS everywhere
- Sanitize inputs to prevent injection
- Implement rate limiting
- Log security events properly

## When to use me
When implementing authentication, authorization, or any security-sensitive code.

## OWASP Top 10 Mitigations

### 1. Broken Access Control
```python
from functools import wraps
from flask import abort
from typing import Callable


def require_permission(permission: str) -> Callable:
    def decorator(f: Callable) -> Callable:
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                abort(401)

            if not current_user.has_permission(permission):
                abort(403)

            return f(*args, **kwargs)
        return decorated_function
    return decorator


# Use in routes
@app.route('/admin/users')
@require_permission('users:read')
def list_users():
    return User.query.all()


# Always verify resource ownership
@app.route('/documents/<doc_id>')
def get_document(doc_id):
    document = Document.query.get_or_404(doc_id)
    # Check ownership, not just authentication
    if document.owner_id != current_user.id and not current_user.is_admin:
        abort(403)
    return document
```

### 2. Cryptographic Failures
```python
import secrets
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC


# Use strong cryptographic algorithms
def hash_password(password: str, salt: bytes = None) -> tuple:
    if salt is None:
        salt = secrets.token_bytes(32)

    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=480000,
    )
    key = kdf.derive(password.encode())

    return key, salt


# Verify password
def verify_password(password: str, stored_key: bytes, salt: bytes) -> bool:
    new_key, _ = hash_password(password, salt)
    return secrets.compare_digest(new_key, stored_key)


# Use secrets for tokens
SECRET_KEY = secrets.token_hex(32)  # 256-bit key
API_KEY = secrets.token_urlsafe(32)
```

### 3. Injection Prevention
```python
# NEVER use string formatting for queries
# BAD:
query = f"SELECT * FROM users WHERE email = '{email}'"

# GOOD: Use parameterized queries
query = "SELECT * FROM users WHERE email = ?"
cursor.execute(query, (email,))


# Sanitize HTML output
from bleach import clean


def render_comment(comment: str) -> str:
    allowed_tags = ['b', 'i', 'em', 'strong', 'p']
    return clean(comment, tags=allowed_tags, strip=True)


# Validate and sanitize input
from pydantic import BaseModel, EmailStr, validator


class UserInput(BaseModel):
    email: EmailStr
    username: str
    bio: str | None = None

    @validator('username')
    def username_alphanumeric(cls, v):
        if not v.replace('_', '').isalnum():
            raise ValueError('Username must be alphanumeric')
        return v.lower().strip()
```

### 4. Insecure Design
```python
# Implement rate limiting
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="redis://localhost:6379"
)


@app.route('/api/login', methods=['POST'])
@limiter.limit("10/minute")
def login():
    # ... login logic


# Account lockout after failed attempts
MAX_FAILED_ATTEMPTS = 5
LOCKOUT_DURATION = minutes(15)


def login_attempt(email: str, password: str):
    user = get_user_by_email(email)

    if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
        if user.lockout_end_time > datetime.now():
            raise AccountLockedError(
                f"Account locked until {user.lockout_end_time}"
            )

    if verify_password(password, user.password_hash):
        user.failed_login_attempts = 0
        user.save()
        return create_session(user)

    user.failed_login_attempts += 1
    if user.failed_login_attempts >= MAX_FAILED_ATTEMPTS:
        user.lockout_end_time = datetime.now() + LOCKOUT_DURATION
    user.save()
    raise InvalidCredentialsError()
```

## Secret Management
```bash
# NEVER commit secrets to git
# Use environment variables
export DATABASE_URL="postgresql://user:pass@host:5432/db"
export API_KEY="secret-key"

# Or use secret management tools
# - HashiCorp Vault
# - AWS Secrets Manager
# - Azure Key Vault
# - GCP Secret Manager
```

## Security Headers
```python
@app.after_request
def add_security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Content-Security-Policy'] = "default-src 'self'"
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response
```
