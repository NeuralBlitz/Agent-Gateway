---
name: encryption
description: Data encryption best practices and implementation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
---
## What I do
- Implement encryption at rest
- Handle encryption in transit
- Use proper algorithms
- Manage encryption keys
- Hash passwords securely
- Encrypt sensitive data
- Handle key rotation
- Validate encryption

## When to use me
When implementing encryption or handling sensitive data.

## Encryption at Rest
```python
import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend


class EncryptionService:
    """Encryption service for sensitive data."""
    
    def __init__(self, master_key: bytes = None):
        self.master_key = master_key or os.environ.get("ENCRYPTION_KEY").encode()
        self.fernet = Fernet(self._derive_key(self.master_key, b"fernet"))
    
    def _derive_key(self, key: bytes, salt: bytes) -> bytes:
        """Derive a key from master key using PBKDF2."""
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=480000,
            backend=default_backend()
        )
        return base64.urlsafe_b64encode(kdf.derive(key))
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt plaintext string."""
        if isinstance(plaintext, str):
            plaintext = plaintext.encode()
        
        encrypted = self.fernet.encrypt(plaintext)
        return encrypted.decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt ciphertext string."""
        if isinstance(ciphertext, str):
            ciphertext = ciphertext.encode()
        
        decrypted = self.fernet.decrypt(ciphertext)
        return decrypted.decode()
    
    def encrypt_file(self, input_path: str, output_path: str) -> None:
        """Encrypt a file."""
        with open(input_path, 'rb') as f:
            data = f.read()
        
        encrypted = self.fernet.encrypt(data)
        
        with open(output_path, 'wb') as f:
            f.write(encrypted)
    
    def decrypt_file(self, input_path: str, output_path: str) -> None:
        """Decrypt a file."""
        with open(input_path, 'rb') as f:
            data = f.read()
        
        decrypted = self.fernet.decrypt(data)
        
        with open(output_path, 'wb') as f:
            f.write(decrypted)


class AsymmetricEncryption:
    """Asymmetric encryption for key exchange and signatures."""
    
    def __init__(self):
        self.private_key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )
        self.public_key = self.private_key.public_key()
    
    def encrypt(self, plaintext: bytes) -> bytes:
        """Encrypt with public key."""
        return self.public_key.encrypt(
            plaintext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
    
    def decrypt(self, ciphertext: bytes) -> bytes:
        """Decrypt with private key."""
        return self.private_key.decrypt(
            ciphertext,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
    
    def get_public_key_pem(self) -> bytes:
        """Get public key in PEM format."""
        return self.public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
    
    def sign(self, data: bytes) -> bytes:
        """Sign data with private key."""
        return self.private_key.sign(
            data,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
    
    def verify_signature(self, data: bytes, signature: bytes) -> bool:
        """Verify signature with public key."""
        try:
            self.public_key.verify(
                signature,
                data,
                padding.PKCS1v15(),
                hashes.SHA256()
            )
            return True
        except:
            return False
```

## Field-Level Encryption
```python
from dataclasses import dataclass
from typing import Dict, Any
import json


@dataclass
class EncryptedField:
    """Encrypted field value."""
    ciphertext: str
    iv: str
    algorithm: str = "AES-256-GCM"


class FieldEncryption:
    """Encrypt specific fields in data."""
    
    def __init__(self, encryption_service: EncryptionService):
        self.encryption = encryption_service
    
    def encrypt_fields(
        self,
        data: Dict[str, Any],
        fields_to_encrypt: list[str]
    ) -> Dict[str, Any]:
        """Encrypt specific fields in data."""
        encrypted = data.copy()
        
        for field in fields_to_encrypt:
            if field in encrypted and encrypted[field]:
                encrypted[field] = self.encryption.encrypt(
                    str(encrypted[field])
                )
        
        return encrypted
    
    def decrypt_fields(
        self,
        data: Dict[str, Any],
        fields_to_decrypt: list[str]
    ) -> Dict[str, Any]:
        """Decrypt specific fields in data."""
        decrypted = data.copy()
        
        for field in fields_to_decrypt:
            if field in decrypted and decrypted[field]:
                try:
                    decrypted[field] = self.encryption.decrypt(
                        decrypted[field]
                    )
                except:
                    # Field might not be encrypted
                    pass
        
        return decrypted


# Usage with Pydantic model
from pydantic import BaseModel, Field


class UserData(BaseModel):
    """User data with encrypted fields."""
    
    id: str
    name: str
    email: str
    
    @Field
    def ssn(self) -> str:
        """Get decrypted SSN."""
        return self._decrypted_ssn
    
    @ssn.setter
    def ssn(self, value: str):
        self._encrypted_ssn = value
    
    class Config:
        json_encoders = {
            EncryptedField: lambda v: v.ciphertext
        }
```

## Key Management
```python
import os
import json
from datetime import datetime, timedelta
from cryptography.fernet import Fernet


class KeyRotationManager:
    """Manage encryption key rotation."""
    
    def __init__(self, key_storage_path: str):
        self.key_storage_path = key_storage_path
        self.current_key_id = None
        self.keys: Dict[str, dict] = self._load_keys()
    
    def _load_keys(self) -> dict:
        """Load keys from storage."""
        if os.path.exists(self.key_storage_path):
            with open(self.key_storage_path, 'r') as f:
                return json.load(f)
        return {}
    
    def _save_keys(self) -> None:
        """Save keys to storage."""
        with open(self.key_storage_path, 'w') as f:
            json.dump(self.keys, f)
    
    def generate_key(self, key_id: str = None) -> str:
        """Generate a new encryption key."""
        key_id = key_id or f"key_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        key = Fernet.generate_key().decode()
        
        self.keys[key_id] = {
            "key": key,
            "created_at": datetime.utcnow().isoformat(),
            "version": 1,
            "status": "active",
        }
        
        self.current_key_id = key_id
        self._save_keys()
        
        return key_id
    
    def rotate_key(self, key_id: str) -> str:
        """Rotate an existing key."""
        if key_id not in self.keys:
            raise KeyError(f"Key {key_id} not found")
        
        # Mark old key as deprecated
        self.keys[key_id]["status"] = "deprecated"
        self.keys[key_id]["rotated_at"] = datetime.utcnow().isoformat()
        
        # Generate new key
        return self.generate_key(f"{key_id}_v{self.keys[key_id]['version'] + 1}")
    
    def get_current_key(self) -> str:
        """Get current active key."""
        if not self.current_key_id:
            return self.generate_key()
        
        return self.keys[self.current_key_id]["key"]
    
    def get_all_active_keys(self) -> list:
        """Get all active keys for decryption."""
        return [
            {"id": k, **v}
            for k, v in self.keys.items()
            if v["status"] in ["active", "deprecated"]
        ]
```

## TLS/HTTPS Configuration
```python
# Nginx TLS configuration
# /etc/nginx/nginx.conf

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    
    ssl_certificate /etc/ssl/certs/certificate.crt;
    ssl_certificate_key /etc/ssl/private/private.key;
    
    # TLS configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Content-Security-Policy "default-src 'self'";
    
    location / {
        proxy_pass http://localhost:8000;
    }
}


# Python SSL context for HTTPS
import ssl

ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)

# Load certificate and key
ssl_context.load_cert_chain(
    certfile="/etc/ssl/certs/certificate.crt",
    keyfile="/etc/ssl/private/private.key"
)

# Set secure protocols
ssl_context.minimum_version = ssl.TLSVersion.TLSv1_2

# Set cipher suites
ssl_context.set_ciphers('ECDHE+AESGCM:DHE+AESGCM:ECDHE+CHACHA20:DHE+CHACHA20')
```

## Best Practices
```
Encryption Best Practices:

1. Use strong algorithms
   - AES-256 for symmetric
   - RSA-2048+ for asymmetric
   - SHA-256 for hashing

2. Manage keys properly
   - Use key management services
   - Rotate keys regularly
   - Never hardcode keys

3. Encrypt sensitive data
   - PII, passwords, tokens
   - Database fields
   - Files at rest

4. Use TLS everywhere
   - HTTPS for all traffic
   - Certificate pinning
   - HSTS headers

5. Don't roll your own crypto
   - Use established libraries
   - Don't implement algorithms

6. Key separation
   - Different keys for different purposes
   - Development vs production

7. Secure key storage
   - Hardware security modules
   - Cloud KMS
   - Vault

8. Audit encryption
   - Log encryption operations
   - Monitor key usage
   - Alert on anomalies

9. Plan for key rotation
   - Automated rotation
   - Graceful transitions
   - Backward compatibility

10. Protect against side channels
    - Constant-time operations
    - Secure memory handling
```
