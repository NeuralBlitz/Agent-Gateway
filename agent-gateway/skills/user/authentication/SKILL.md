# Authentication

**Category:** Security  
**Skill Level:** Intermediate  
**Domain:** Web Security, Identity Management, API Security

## Overview

Authentication is the process of verifying the identity of a user, system, or entity requesting access to resources. It establishes trust by confirming that entities are who they claim to be before granting access to protected systems, data, or functionality.

## Description

Authentication forms the foundational layer of any security architecture, serving as the primary mechanism for establishing identity within digital systems. The process typically involves collecting credentials from an entity seeking access, validating those credentials against a trusted authority, and returning an authentication token or session that can be used for subsequent requests. Without robust authentication, systems cannot reliably distinguish between legitimate users and attackers, making it impossible to enforce proper access controls.

Modern authentication systems support multiple credential types and verification methods. Traditional username and password authentication remains common but is increasingly supplemented or replaced by stronger alternatives including multi-factor authentication (MFA), passwordless login flows, federated identity through standards like OAuth 2.0 and OpenID Connect, and certificate-based authentication for machine-to-machine communication. The choice of authentication method depends on the sensitivity of protected resources, user experience requirements, regulatory compliance obligations, and integration with existing identity systems.

JSON Web Tokens (JWT) have emerged as a dominant standard for representing authenticated claims between parties, enabling stateless authentication at scale. OAuth 2.0 provides the authorization framework within which authentication flows operate, while OpenID Connect extends OAuth 2.0 to provide standardized authentication capabilities. These specifications enable single sign-on (SSO) across multiple applications, secure delegation of access without sharing credentials, and interoperability between identity providers and service consumers.

## Prerequisites

- Understanding of HTTP protocol and stateless communication
- Familiarity with cryptographic concepts including hashing and encryption
- Knowledge of common attack vectors (phishing, credential stuffing, replay attacks)
- Understanding of session management principles

## Core Competencies

- Implementing secure credential storage using proper hashing algorithms
- Designing and supporting multiple authentication factors
- Integrating with OAuth 2.0 and OpenID Connect providers
- Managing JWT token lifecycle including issuance, validation, and revocation
- Implementing secure session management and token storage
- Detecting and preventing authentication attacks

## Implementation

```python
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Dict, Any
import hashlib
import secrets
import jwt

class AuthenticationFactor(Enum):
    PASSWORD = "password"
    TOTP = "totp"
    SMS = "sms"
    EMAIL = "email"

@dataclass
class User:
    id: str
    username: str
    email: str
    password_hash: str
    salt: str
    mfa_enabled: bool = False
    failed_attempts: int = 0

@dataclass
class AuthToken:
    access_token: str
    refresh_token: str
    token_type: str = "Bearer"
    expires_in: int = 3600

class PasswordHasher:
    @staticmethod
    def hash(password: str, salt: Optional[bytes] = None) -> tuple[str, str]:
        if salt is None:
            salt = secrets.token_bytes(32)
        return (
            hashlib.pbkdf2_hmac('sha256', password.encode(), salt, 100000).hex(),
            salt.hex()
        )
    
    @staticmethod
    def verify(password: str, password_hash: str, salt: str) -> bool:
        new_hash, _ = PasswordHasher.hash(password, bytes.fromhex(salt))
        return secrets.compare_digest(new_hash, password_hash)

class JWTAuthenticationProvider:
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
    
    def create_token(self, user: User) -> AuthToken:
        now = datetime.now()
        payload = {
            "sub": user.id,
            "username": user.username,
            "iat": now,
            "exp": now + timedelta(hours=1)
        }
        token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
        return AuthToken(access_token=token, refresh_token="")
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        try:
            return jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
        except jwt.ExpiredSignatureError:
            return None

auth_provider = JWTAuthenticationProvider("secret-key")
```

## Use Cases

- Securing API endpoints with JWT token authentication
- Implementing multi-factor authentication for sensitive operations
- Integrating with third-party identity providers (Google, Auth0, Okta)
- Building secure session-based authentication for web applications
- Protecting microservices with centralized authentication

## Artifacts

- JWT authentication middleware for Express.js
- OAuth 2.0 provider implementation
- LDAP integration module
- TOTP authentication utilities
- Authentication policy documentation

## Related Skills

- Authorization
- OAuth 2.0
- JWT Token Management
- Multi-Factor Authentication
- Security Best Practices
