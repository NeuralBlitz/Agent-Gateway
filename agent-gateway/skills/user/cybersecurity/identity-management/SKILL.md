---
name: Identity Management
category: cybersecurity
description: Managing digital identities including authentication, SSO, federation, and identity lifecycle management
tags: [iam, sso, oauth, oidc, saml, federation, mfa]
version: "1.0"
---

# Identity Management

## What I Do

I provide guidance on managing digital identities across applications and services. This includes implementing authentication protocols (OAuth 2.0, OIDC, SAML), single sign-on, multi-factor authentication, identity federation, user provisioning/deprovisioning, and session management.

## When to Use Me

- Implementing OAuth 2.0 or OpenID Connect authentication flows
- Setting up single sign-on across multiple applications
- Adding multi-factor authentication to existing systems
- Designing user provisioning and deprovisioning workflows
- Implementing SCIM for automated identity lifecycle management
- Configuring SAML federation with enterprise identity providers

## Core Concepts

1. **OAuth 2.0**: Authorization framework for delegated access using access tokens without sharing credentials.
2. **OpenID Connect (OIDC)**: Identity layer on top of OAuth 2.0 that provides authentication and user identity claims.
3. **SAML 2.0**: XML-based framework for exchanging authentication and authorization data between identity and service providers.
4. **Multi-Factor Authentication**: Requiring two or more verification factors (knowledge, possession, inherence) for authentication.
5. **Single Sign-On (SSO)**: Authenticate once and access multiple applications without re-entering credentials.
6. **SCIM**: System for Cross-domain Identity Management protocol for automated user provisioning and deprovisioning.
7. **Session Management**: Creating, maintaining, and invalidating user sessions securely across requests.
8. **Identity Federation**: Linking identities across different identity providers and trust domains.

## Code Examples

### 1. OAuth 2.0 Authorization Code Flow with PKCE (Python)

```python
import secrets
import hashlib
import base64
from urllib.parse import urlencode

def generate_pkce_pair() -> tuple:
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).rstrip(b"=").decode()
    return verifier, challenge

def build_authorization_url(
    auth_endpoint: str,
    client_id: str,
    redirect_uri: str,
    scopes: list,
) -> tuple:
    state = secrets.token_urlsafe(32)
    verifier, challenge = generate_pkce_pair()
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "scope": " ".join(scopes),
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    }
    return f"{auth_endpoint}?{urlencode(params)}", state, verifier
```

### 2. JWT Token Validation (Python)

```python
import jwt
from typing import Dict, Any, Optional
from datetime import datetime, timezone

def validate_token(
    token: str,
    public_key: str,
    expected_issuer: str,
    expected_audience: str,
) -> Optional[Dict[str, Any]]:
    try:
        payload = jwt.decode(
            token,
            public_key,
            algorithms=["RS256", "ES256"],
            issuer=expected_issuer,
            audience=expected_audience,
            options={
                "require": ["exp", "iss", "aud", "sub", "iat"],
                "verify_exp": True,
                "verify_iss": True,
                "verify_aud": True,
            },
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None
```

### 3. Secure Session Management (Python/Flask)

```python
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

class SessionManager:
    def __init__(self, max_age_minutes: int = 30, max_idle_minutes: int = 15):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.max_age = timedelta(minutes=max_age_minutes)
        self.max_idle = timedelta(minutes=max_idle_minutes)

    def create_session(self, user_id: str, metadata: Dict[str, Any]) -> str:
        session_id = secrets.token_urlsafe(32)
        now = datetime.now(timezone.utc)
        self.sessions[session_id] = {
            "user_id": user_id,
            "created_at": now,
            "last_active": now,
            "metadata": metadata,
        }
        return session_id

    def validate_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        session = self.sessions.get(session_id)
        if not session:
            return None
        now = datetime.now(timezone.utc)
        if now - session["created_at"] > self.max_age:
            del self.sessions[session_id]
            return None
        if now - session["last_active"] > self.max_idle:
            del self.sessions[session_id]
            return None
        session["last_active"] = now
        return session

    def destroy_session(self, session_id: str) -> None:
        self.sessions.pop(session_id, None)
```

## Best Practices

1. **Use PKCE for all OAuth 2.0 flows** including confidential clients for defense in depth.
2. **Validate JWTs fully** including signature, expiration, issuer, audience, and required claims.
3. **Implement token refresh rotation** where each refresh token can only be used once.
4. **Enforce MFA for sensitive operations** even if the user authenticated with MFA at login.
5. **Automate deprovisioning** via SCIM to ensure access is revoked immediately when users leave.
6. **Use short-lived access tokens** (5-15 minutes) with longer-lived refresh tokens stored securely.
7. **Bind sessions to client attributes** (IP range, user-agent) to detect session hijacking.
8. **Regenerate session identifiers** after authentication to prevent session fixation.
9. **Implement account lockout** with exponential backoff after repeated authentication failures.
10. **Log all authentication events** including successes, failures, token refreshes, and logouts.
