---
name: Cryptography
description: Encryption, hashing, digital signatures, and cryptographic protocols implementation
license: MIT
compatibility:
  - Python 3.8+
  - Go 1.18+
  - Node.js 14+
audience: Security engineers, developers, DevOps engineers
category: Cybersecurity
---

# Cryptography

## What I do

I provide cryptographic capabilities including secure random number generation, encryption/decryption, hashing, digital signatures, key management, password hashing, and secure communication protocols implementation.

## When to use me

- Encrypting sensitive data at rest or in transit
- Implementing secure password storage
- Creating digital signatures for code/documents
- Managing cryptographic keys securely
- Implementing authentication tokens (JWT)
- Building secure communication channels
- Hashing and MAC calculations
- Certificate handling and validation

## Core Concepts

- **Symmetric Encryption**: AES-256-GCM, ChaCha20-Poly1305 for bulk encryption
- **Asymmetric Encryption**: RSA, ECC for key exchange and digital signatures
- **Key Exchange**: ECDH, Diffie-Hellman for secure key agreement
- **Digital Signatures**: ECDSA, EdDSA for authentication and non-repudiation
- **Hashing**: SHA-256/384/512 for integrity, HMAC for keyed hashing
- **Password Hashing**: Argon2, bcrypt, scrypt for secure password storage
- **Key Derivation**: PBKDF2, HKDF for deriving keys from passwords/secrets
- **Random Generation**: Cryptographically secure PRNGs (CSPRNG)
- **TLS/SSL**: Certificate-based authentication and encrypted transport
- **Key Management**: Rotation, storage, access controls, lifecycle management

## Code Examples

### AES-256-GCM Encryption

```python
import os
import base64
import json
from typing import Tuple, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.backends import default_backend

class AES256Encryptor:
    NONCE_LENGTH = 12
    KEY_LENGTH = 32
    
    def __init__(self, master_key: bytes):
        if len(master_key) < 32:
            raise ValueError("Master key must be at least 32 bytes")
        self.master_key = master_key
    
    def derive_key(self, purpose: str, length: int = 32) -> bytes:
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=length,
            salt=purpose.encode(),
            info=b'key-derivation',
            backend=default_backend()
        )
        return hkdf.derive(self.master_key)
    
    def encrypt(self, plaintext: str, associated_data: str = "") -> str:
        nonce = os.urandom(self.NONCE_LENGTH)
        key = self.derive_key("encryption")
        aesgcm = AESGCM(key)
        
        if associated_data:
            ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), associated_data.encode())
        else:
            ciphertext = aesgcm.encrypt(nonce, plaintext.encode(), None)
        
        result = {
            "nonce": base64.b64encode(nonce).decode(),
            "ciphertext": base64.b64encode(ciphertext).decode(),
            "has_aad": bool(associated_data)
        }
        
        return base64.b64encode(json.dumps(result).encode()).decode()
    
    def decrypt(self, encrypted_data: str, associated_data: str = "") -> Optional[str]:
        try:
            raw = base64.b64decode(encrypted_data)
            parsed = json.loads(raw)
            
            nonce = base64.b64decode(parsed["nonce"])
            ciphertext = base64.b64decode(parsed["ciphertext"])
            
            key = self.derive_key("encryption")
            aesgcm = AESGCM(key)
            
            if parsed.get("has_aad") and associated_data:
                plaintext = aesgcm.decrypt(nonce, ciphertext, associated_data.encode())
            else:
                plaintext = aesgcm.decrypt(nonce, ciphertext, None)
            
            return plaintext.decode()
        except Exception:
            return None
```

### Secure Password Hashing with Argon2

```python
import secrets
import base64
from typing import Tuple, Optional
from dataclasses import dataclass
from datetime import datetime

try:
    import argon2
    from argon2 import PasswordHasher
    from argon2.low_level import Type
except ImportError:
    PasswordHasher = None

@dataclass
class PasswordHashResult:
    password_hash: str
    salt: str
    algorithm: str
    version: int
    time_cost: int
    memory_cost: int
    parallelism: int

class SecurePasswordHasher:
    DEFAULT_TIME_COST = 3
    DEFAULT_MEMORY_COST = 65536
    DEFAULT_PARALLELISM = 4
    
    def __init__(self):
        if PasswordHasher is None:
            raise ImportError("argon2-cffi library is required")
        self.ph = PasswordHasher(
            time_cost=self.DEFAULT_TIME_COST,
            memory_cost=self.DEFAULT_MEMORY_COST,
            parallelism=self.DEFAULT_PARALLELISM,
            type=Type.ID
        )
    
    def hash_password(self, password: str) -> PasswordHashResult:
        if not password:
            raise ValueError("Password cannot be empty")
        
        if len(password) > 4096:
            raise ValueError("Password too long")
        
        password_hash = self.ph.hash(password)
        
        return PasswordHashResult(
            password_hash=password_hash,
            salt="",  # Argon2 includes salt in the hash string
            algorithm="argon2id",
            version=0x13,
            time_cost=self.DEFAULT_TIME_COST,
            memory_cost=self.DEFAULT_MEMORY_COST,
            parallelism=self.DEFAULT_PARALLELISM
        )
    
    def verify_password(self, password: str, password_hash: str) -> bool:
        try:
            return self.ph.verify(password_hash, password)
        except argon2.exceptions.VerifyMismatchError:
            return False
        except Exception:
            return False
    
    def check_needs_rehash(self, password_hash: str) -> bool:
        try:
            return self.ph.check_needs_rehash(password_hash)
        except Exception:
            return True

class FallbackPasswordHasher:
    @staticmethod
    def hash_with_bcrypt(password: str, work_factor: int = 12) -> str:
        import bcrypt
        salt = bcrypt.gensalt(rounds=work_factor)
        return bcrypt.hashpw(password.encode(), salt).decode()
    
    @staticmethod
    def verify_bcrypt(password: str, password_hash: str) -> bool:
        import bcrypt
        return bcrypt.checkpw(password.encode(), password_hash.encode())
```

### Digital Signature with ECDSA

```python
import os
import base64
import hashlib
from typing import Tuple, Optional
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.backends import default_backend
from cryptography.exceptions import InvalidSignature

class ECDSASigner:
    def __init__(self, curve: ec.EllipticCurve = ec.SECP256R1()):
        self.curve = curve
    
    def generate_keypair(self) -> Tuple[ec.EllipticCurvePrivateKey, ec.EllipticCurvePublicKey]:
        private_key = ec.generate_private_key(self.curve, default_backend())
        public_key = private_key.public_key()
        return private_key, public_key
    
    def load_private_key(self, pem_data: bytes, password: Optional[bytes] = None) -> ec.EllipticCurvePrivateKey:
        return serialization.load_pem_private_key(
            pem_data, password=password, backend=default_backend()
        )
    
    def load_public_key(self, pem_data: bytes) -> ec.EllipticCurvePublicKey:
        return serialization.load_pem_public_key(pem_data, backend=default_backend())
    
    def sign(self, private_key: ec.EllipticCurvePrivateKey, message: str) -> str:
        message_bytes = message.encode() if isinstance(message, str) else message
        
        signature = private_key.sign(
            message_bytes,
            ec.ECDSA(hashes.SHA256())
        )
        
        return base64.b64encode(signature).decode()
    
    def verify(self, public_key: ec.EllipticCurvePublicKey, message: str, signature: str) -> bool:
        try:
            message_bytes = message.encode() if isinstance(message, str) else message
            signature_bytes = base64.b64decode(signature)
            
            public_key.verify(
                signature_bytes,
                message_bytes,
                ec.ECDSA(hashes.SHA256())
            )
            return True
        except InvalidSignature:
            return False
        except Exception:
            return False
    
    def export_private_key(self, private_key: ec.EllipticCurvePrivateKey, 
                          password: Optional[bytes] = None) -> bytes:
        if password:
            encryption = serialization.BestAvailableEncryption(password)
        else:
            encryption = serialization.NoEncryption()
        
        return private_key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=encryption
        )
    
    def export_public_key(self, public_key: ec.EllipticCurvePublicKey) -> bytes:
        return public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
```

### HMAC Message Authentication

```python
import hmac
import hashlib
import secrets
import base64
import time
from typing import Tuple, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta

@dataclass
class HMACToken:
    token: str
    created_at: datetime
    expires_at: datetime
    data: dict = field(default_factory=dict)

class HMACAuthenticator:
    DEFAULT_ALGORITHM = "sha256"
    TOKEN_EXPIRY_MINUTES = 60
    
    def __init__(self, secret_key: bytes):
        if len(secret_key) < 32:
            raise ValueError("Secret key must be at least 32 bytes")
        self.secret_key = secret_key
        self.algorithm = self.DEFAULT_ALGORITHM
    
    def generate_token(self, data: dict, expiry_minutes: int = None) -> HMACToken:
        if expiry_minutes is None:
            expiry_minutes = self.TOKEN_EXPIRY_MINUTES
        
        now = datetime.now()
        token_data = {
            **data,
            "timestamp": now.isoformat(),
            "nonce": secrets.token_hex(16)
        }
        
        payload = base64.b64encode(
            str(token_data).encode()
        ).decode()
        
        signature = self._generate_signature(payload)
        
        token = f"{payload}.{signature}"
        
        return HMACToken(
            token=token,
            created_at=now,
            expires_at=now + timedelta(minutes=expiry_minutes),
            data=token_data
        )
    
    def verify_token(self, token: str) -> Tuple[bool, Optional[dict], str]:
        try:
            parts = token.split('.')
            if len(parts) != 2:
                return False, None, "Invalid token format"
            
            payload, signature = parts
            
            if not self._verify_signature(payload, signature):
                return False, None, "Invalid signature"
            
            decoded_data = base64.b64decode(payload.encode())
            token_data = eval(decoded_data.decode())
            
            token_obj = HMACToken(
                token=token,
                created_at=datetime.fromisoformat(token_data["timestamp"]),
                expires_at=datetime.now() + timedelta(minutes=self.TOKEN_EXPIRY_MINUTES),
                data=token_data
            )
            
            if datetime.now() > token_obj.expires_at:
                return False, None, "Token expired"
            
            return True, token_data.data, "Valid"
            
        except Exception as e:
            return False, None, f"Verification failed: {str(e)}"
    
    def _generate_signature(self, payload: str) -> str:
        signature = hmac.new(
            self.secret_key,
            payload.encode(),
            getattr(hashlib, self.algorithm)
        ).hexdigest()
        return signature
    
    def _verify_signature(self, payload: str, signature: str) -> bool:
        expected = self._generate_signature(payload)
        return hmac.compare_digest(expected, signature)
```

### Secure Random and Key Derivation

```python
import os
import secrets
import hashlib
import base64
from typing import Tuple, Bytes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

class SecureRandomGenerator:
    @staticmethod
    def get_bytes(length: int) -> bytes:
        return secrets.token_bytes(length)
    
    @staticmethod
    def get_hex(length: int) -> str:
        return secrets.token_hex(length)
    
    @staticmethod
    def get_urlsafe(length: int) -> str:
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def get_random_int(min_val: int, max_val: int) -> int:
        return secrets.randbelow(max_val - min_val) + min_val
    
    @staticmethod
    def get_token(length: int = 32) -> str:
        return secrets.token_urlsafe(length)

class KeyDeriver:
    @staticmethod
    def derive_from_password(
        password: str,
        salt: bytes = None,
        iterations: int = 100000,
        key_length: int = 32
    ) -> Tuple[bytes, bytes]:
        if salt is None:
            salt = secrets.token_bytes(32)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=key_length,
            salt=salt,
            iterations=iterations,
            backend=default_backend()
        )
        
        key = kdf.derive(password.encode())
        return key, salt
    
    @staticmethod
    def derive_hkdf(
        master_key: bytes,
        purpose: str,
        length: int = 32,
        salt: bytes = None
    ) -> bytes:
        if salt is None:
            salt = purpose.encode()
        
        hkdf = HKDF(
            algorithm=hashes.SHA256(),
            length=length,
            salt=salt,
            info=purpose.encode(),
            backend=default_backend()
        )
        
        return hkdf.derive(master_key)
    
    @staticmethod
    def generate_key_for_encryption(key_length: int = 32) -> bytes:
        return secrets.token(key_length)
    
    @staticmethod
    def derive_subkey(
        master_key: bytes,
        key_id: str,
        key_length: int = 32
    ) -> bytes:
        context = f"subkey:{key_id}"
        return KeyDeriver.derive_hkdf(
            master_key, context, key_length,
            salt=b"key-derivation"
        )
```

## Best Practices

- Use authenticated encryption (AES-GCM, ChaCha20-Poly1305) for all encryption
- Always use random IVs/nonces for each encryption operation
- Store passwords using Argon2id, bcrypt, or scrypt (NOT MD5/SHA1/SHA256)
- Use minimum 256-bit keys for symmetric encryption
- Use ECDSA or EdDSA for digital signatures (prefer Ed25519)
- Never roll your own cryptography - use well-audited libraries
- Implement perfect forward secrecy in TLS configurations
- Rotate keys regularly and have a key rotation strategy
- Use HMAC for message authentication, not raw hash functions
- Validate all cryptographic implementations with test vectors
- Keep cryptographic libraries updated (watch for vulnerabilities like Heartbleed)
- Use constant-time comparison for secrets to prevent timing attacks

## Common Patterns

- **Envelope Encryption**: Encrypt data with DEK, encrypt DEK with KEK
- **Zero-Knowledge Architecture**: Client-side encryption, server never sees plaintext
- **Certificate Pinning**: Hardcode or TEE-verify certificate public keys
- **JWT Signing**: Use RS256 or ES256, validate algorithms
- **Secure Key Storage**: Use HSMs, cloud KMS, or secure enclaves
- **Key Escrow**: Encrypted backup of keys with multiple holders
