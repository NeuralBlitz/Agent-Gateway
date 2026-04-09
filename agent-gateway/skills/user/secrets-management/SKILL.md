---
name: secrets-management
description: Secrets and credentials management best practices
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
---
## What I do
- Manage application secrets securely
- Use environment variables properly
- Integrate with secret managers
- Handle API keys and credentials
- Implement secret rotation
- Audit secret access
- Prevent secret leaks
- Use encryption appropriately

## When to use me
When handling credentials, API keys, or sensitive configuration.

## Secret Management Hierarchy
```
1. Environment Variables (for containers)
   - Set at deployment time
   - Easy rotation
   - Limited size

2. Secret Manager (Vault, AWS Secrets Manager)
   - Encrypted storage
   - Access control
   - Audit logging

3. CI/CD Secrets (GitHub Secrets, GitLab CI Variables)
   - Pipeline-only access
   - Never in code

4. Local Development (.env files)
   - .env should be in .gitignore
   - Use template .env.example

5. Hardware Security Modules (HSM)
   - Maximum security
   - For cryptographic keys
```

## Environment Variables
```bash
# .env file (NEVER commit to git)
# Copy this to .env and fill in values
DATABASE_URL=postgresql://user:password@localhost:5432/db
REDIS_URL=redis://localhost:6379
SECRET_KEY=your-secret-key-change-in-production
API_KEY=your-api-key
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key


# .env.example (safe to commit)
DATABASE_URL=
REDIS_URL=
SECRET_KEY=
API_KEY=
JWT_SECRET=
ENCRYPTION_KEY=
```

```python
from pydantic import BaseModel
from functools import lru_cache
from typing import Optional


class Settings(BaseModel):
    """Application settings from environment."""
    
    # Required
    database_url: str
    secret_key: str
    api_key: str
    
    # Optional with defaults
    debug: bool = False
    log_level: str = "info"
    
    # Computed
    @property
    def is_production(self) -> bool:
        return not self.debug
    
    @classmethod
    def from_env(cls) -> 'Settings':
        """Load settings from environment."""
        import os
        
        return cls(
            database_url=os.getenv("DATABASE_URL"),
            secret_key=os.getenv("SECRET_KEY"),
            api_key=os.getenv("API_KEY"),
            debug=os.getenv("DEBUG", "").lower() == "true",
            log_level=os.getenv("LOG_LEVEL", "info"),
        )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings."""
    return Settings.from_env()
```

## AWS Secrets Manager
```python
import boto3
import json
from botocore.exceptions import ClientError


class AWSSecretsManager:
    """Retrieve secrets from AWS Secrets Manager."""
    
    def __init__(self, region: str = "us-east-1") -> None:
        self.client = boto3.client('secretsmanager', region_name=region)
    
    def get_secret(self, secret_name: str) -> dict:
        """Retrieve secret by name."""
        try:
            response = self.client.get_secret_value(SecretId=secret_name)
            
            # Secret may be in either format
            if 'SecretString' in response:
                return json.loads(response['SecretString'])
            else:
                return json.loads(
                    bytes(
                        response['SecretBinary'],
                        encoding='utf-8'
                    )
                )
        except ClientError as e:
            if e.response['Error']['Code'] == 'DecryptionFailureException':
                raise DecryptionError("Secret cannot be decrypted")
            elif e.response['Error']['Code'] == 'ResourceNotFoundException':
                raise SecretNotFoundError(f"Secret {secret_name} not found")
            else:
                raise
    
    def get_database_credentials(self) -> dict:
        """Get database credentials from named secret."""
        return self.get_secret("myapp/database")
    
    def rotate_secret(
        self,
        secret_name: str,
        rotation_lambda: str
    ) -> None:
        """Enable automatic rotation for a secret."""
        self.client.rotate_secret(
            SecretId=secret_name,
            RotationLambdaARN=rotation_lambda,
            RotationRules={
                'AutomaticallyAfterDays': 30,
            }
        )


# Usage
secrets = AWSSecretsManager()
creds = secrets.get_database_credentials()
```

## HashiCorp Vault
```python
import hvac
import os


class VaultClient:
    """Client for HashiCorp Vault."""
    
    def __init__(
        self,
        vault_addr: str = None,
        vault_token: str = None,
        mount_point: str = 'secret'
    ) -> None:
        self.vault_addr = vault_addr or os.getenv('VAULT_ADDR')
        self.vault_token = vault_token or os.getenv('VAULT_TOKEN')
        self.mount_point = mount_point
        
        if not self.vault_addr or not self.vault_token:
            raise ValueError("Vault address and token required")
        
        self.client = hvac.Client(
            url=self.vault_addr,
            token=self.vault_token,
        )
    
    def get_secret(self, path: str) -> dict:
        """Read secret from Vault."""
        try:
            response = self.client.secrets.kv.v2.read_secret_version(
                path=path,
                mount_point=self.mount_point,
            )
            return response['data']['data']
        except hvac.exceptions.InvalidPath:
            raise SecretNotFoundError(f"Secret not found: {path}")
    
    def set_secret(self, path: str, secret: dict) -> None:
        """Write secret to Vault."""
        self.client.secrets.kv.v2.create_or_update_secret(
            path=path,
            secret=secret,
            mount_point=self.mount_point,
        )
    
    @property
    def is_authenticated(self) -> bool:
        """Check if client is authenticated."""
        return self.client.is_authenticated()


# Usage with Vault Agent
# VAULT_ADDR and VAULT_TOKEN are auto-injected by Vault Agent
vault = VaultClient()
secrets = vault.get_secret('myapp/database')
```

## Kubernetes Secrets
```yaml
# Secret manifest
apiVersion: v1
kind: Secret
metadata:
  name: myapp-secrets
type: Opaque
data:
  # Base64 encoded values
  database_url: cG9zdGdyZXNxbDovL3VzZXI6cGFzc3dvcmRAbG9jYWxob3N0OjU0MzIvZGI=
  api_key: base64encodedapikey
  jwt_secret: base64encodedjwttoken
```

```python
# Accessing Kubernetes secrets
from kubernetes import client, config


def get_k8s_secret(secret_name: str, namespace: str = "default") -> dict:
    """Read secret from Kubernetes."""
    config.load_incluster_config()
    v1 = client.CoreV1Api()
    
    secret = v1.read_namespaced_secret(
        name=secret_name,
        namespace=namespace,
    )
    
    return {
        key: base64.b64decode(value).decode('utf-8')
        for key, value in secret.data.items()
    }


# Using secrets in pods (mounted as files)
# Mounted at /etc/secrets/
with open('/etc/secrets/database_url', 'r') as f:
    database_url = f.read().strip()
```

## Secret Rotation Pattern
```python
from abc import ABC, abstractmethod
from datetime import datetime, timedelta


class SecretRotator(ABC):
    """Base class for secret rotation."""
    
    def __init__(self, rotation_period_days: int = 30) -> None:
        self.rotation_period = timedelta(days=rotation_period_days)
        self.last_rotated: Optional[datetime] = None
    
    @abstractmethod
    def generate_new_secret(self) -> str:
        """Generate a new secret value."""
        pass
    
    @abstractmethod
    def store_secret(self, secret: str) -> None:
        """Store the new secret."""
        pass
    
    @abstractmethod
    def update_consumers(self, old_secret: str, new_secret: str) -> None:
        """Update all consumers with new secret."""
        pass
    
    def rotate(self) -> None:
        """Perform rotation."""
        old_secret = self.get_current_secret()
        new_secret = self.generate_new_secret()
        
        # Store new secret
        self.store_secret(new_secret)
        
        # Update consumers
        self.update_consumers(old_secret, new_secret)
        
        self.last_rotated = datetime.utcnow()


class APIKeyRotator(SecretRotator):
    """Rotator for API keys."""
    
    def generate_new_secret(self) -> str:
        import secrets
        return secrets.token_urlsafe(32)
    
    def store_secret(self, secret: str) -> None:
        # Store in secrets manager
        secrets_manager.set_secret("myapp/api_key", secret)
    
    def update_consumers(self, old_secret: str, new_secret: str) -> None:
        # Update environment variables
        # Update Kubernetes secrets
        # Notify running services
        pass
    
    def get_current_secret(self) -> str:
        return secrets_manager.get_secret("myapp/api_key")
```

## Preventing Leaks
```python
import re


# Pre-commit hook to detect secrets
SECRET_PATTERNS = [
    r'(api[_-]?key|apikey)[_-]?\s*[:=]\s*["\']?[A-Za-z0-9_]{20,}["\']?',
    r'(secret[_-]?key|secretkey)[_-]?\s*[:=]\s*["\']?[A-Za-z0-9_]{20,}["\']?',
    r'(token|accesstoken)[_-]?\s*[:=]\s*["\']?[A-Za-z0-9_.-]{20,}["\']?',
    r'-----BEGIN (RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----',
    r'AKIA[0-9A-Z]{ AWS Access16}',  # Key ID
]


def scan_for_secrets(content: str) -> list:
    """Scan content for potential secrets."""
    findings = []
    
    for pattern in SECRET_PATTERNS:
        matches = re.finditer(pattern, content, re.IGNORECASE)
        for match in matches:
            findings.append({
                'pattern': pattern,
                'match': match.group()[:50] + '...',
                'position': match.span(),
            })
    
    return findings
```

## Best Practices
```
1. Never commit secrets to version control
   - Use .gitignore for .env files
   - Run pre-commit hooks

2. Use secret managers in production
   - Don't use environment variables for production secrets
   - AWS Secrets Manager, HashiCorp Vault, GCP Secret Manager

3. Rotate secrets regularly
   - Automated rotation where possible
   - Document rotation procedures

4. Least privilege access
   - Grant minimum required permissions
   - Use IAM policies

5. Audit secret access
   - Log who accesses what secrets
   - Alert on unusual access patterns

6. Use different secrets per environment
   - Never use same secret in dev and prod
   - Prevents credential stuffing

7. Use encryption at rest and in transit
   - TLS for transmission
   - Encrypted storage

8. Have a breach response plan
   - Know how to rotate all secrets
   - Have emergency contacts
```
