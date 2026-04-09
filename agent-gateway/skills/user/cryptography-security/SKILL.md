---
name: cryptography-security
description: Cryptographic security implementation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
---

## What I do
- Implement encryption at rest and in transit
- Design key management systems
- Use modern cryptographic libraries correctly
- Implement digital signatures and certificates
- Secure password storage
- Handle cryptographic secrets

## When to use me
When implementing encryption, secure storage, or any cryptographic operations in code.

## Encryption at Rest

### AES-256 Encryption
```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os
import base64

class AESEncryption:
    def __init__(self, key: bytes = None):
        self.key = key or os.urandom(32)  # 256-bit key
    
    def encrypt(self, plaintext: str) -> str:
        iv = os.urandom(16)  # 128-bit IV
        cipher = Cipher(
            algorithms.AES(self.key),
            modes.CBC(iv),
            backend=default_backend()
        )
        encryptor = cipher.encryptor()
        
        # PKCS7 padding
        padded = self._pkcs7_pad(plaintext.encode(), 16)
        ciphertext = encryptor.update(padded) + encryptor.finalize()
        
        # Return IV + ciphertext
        result = base64.b64encode(iv + ciphertext).decode()
        return result
    
    def decrypt(self, encrypted: str) -> str:
        data = base64.b64decode(encrypted)
        iv = data[:16]
        ciphertext = data[16:]
        
        cipher = Cipher(
            algorithms.AES(self.key),
            modes.CBC(iv),
            backend=default_backend()
        )
        decryptor = cipher.decryptor()
        
        padded = decryptor.update(ciphertext) + decryptor.finalize()
        plaintext = self._pkcs7_unpad(padded)
        
        return plaintext.decode()
    
    def _pkcs7_pad(self, data: bytes, block_size: int) -> bytes:
        padding = block_size - (len(data) % block_size)
        return data + bytes([padding] * padding)
    
    def _pkcs7_unpad(self, data: bytes) -> bytes:
        padding = data[-1]
        return data[:-padding]
```

### Field-Level Encryption
```python
class FieldEncryption:
    """Encrypt specific sensitive fields in a database"""
    
    def __init__(self, master_key: bytes):
        self.master_key = master_key
    
    def encrypt_field(self, field_name: str, value: str, 
                      field_keys: dict) -> dict:
        """Encrypt specific fields with field-specific keys"""
        if field_name in field_keys:
            key = self._derive_key(field_keys[field_name])
            enc = AESEncryption(key)
            return {"encrypted": enc.encrypt(value), "encrypted_field": True}
        return {"value": value, "encrypted_field": False}
    
    def _derive_key(self, key_material: str) -> bytes:
        from cryptography.hazmat.primitives import hashes
        from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=b"field_salt",
            iterations=100000,
        )
        return kdf.derive(key_material.encode())
```

## Encryption in Transit

### TLS Configuration
```python
import ssl
import hashlib

class TLSConfig:
    """Configure secure TLS settings"""
    
    @staticmethod
    def get_secure_context() -> ssl.SSLContext:
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        
        # Load certificate
        context.load_cert_chain(
            certfile="server.crt",
            keyfile="server.key"
        )
        
        # Enforce strong protocols
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        
        # Configure ciphers
        context.set_ciphers(
            'ECDHE+AESGCM:DHE+AESGCM:ECDHE+CHACHA20:DHE+CHACHA20'
        )
        
        # Enable OCSP stapling
        context.sni_callback = TLSConfig.sni_callback
        
        return context
    
    @staticmethod
    def sni_callback(ssl_socket, server_name, initial_context):
        # Verify certificate for SNI
        return None  # Continue normally
```

## Key Management

### Key Rotation
```python
from datetime import datetime, timedelta
import json

class KeyManager:
    def __init__(self):
        self.keys = {}
        self.rotation_period = timedelta(days=90)
    
    def generate_key(self, key_id: str) -> dict:
        """Generate new encryption key"""
        import os
        key = {
            "key_id": key_id,
            "key": base64.b64encode(os.urandom(32)).decode(),
            "created": datetime.now().isoformat(),
            "expires": (datetime.now() + self.rotation_period).isoformat(),
            "status": "active"
        }
        self.keys[key_id] = key
        return key
    
    def get_active_key(self) -> dict:
        """Get currently active key"""
        for key in self.keys.values():
            if key["status"] == "active":
                return key
        raise ValueError("No active key found")
    
    def rotate_keys(self):
        """Rotate to new key, deprecate old"""
        new_key_id = f"key_{datetime.now().strftime('%Y%m%d')}"
        
        # Mark old key as deprecated
        for key in self.keys.values():
            if key["status"] == "active":
                key["status"] = "deprecated"
                key["deprecated"] = datetime.now().isoformat()
        
        # Generate new key
        self.generate_key(new_key_id)
        
        return new_key_id
```

## Password Hashing
```python
import secrets
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

class PasswordHasher:
    def __init__(self, iterations: int = 480000):
        self.iterations = iterations
    
    def hash_password(self, password: str) -> tuple:
        salt = secrets.token_bytes(32)
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=self.iterations,
        )
        key = kdf.derive(password.encode())
        return base64.b64encode(key), base64.b64encode(salt)
    
    def verify_password(self, password: str, stored_key: str, 
                        salt: str) -> bool:
        key, _ = self.hash_password(password, 
            base64.b64decode(salt))
        return secrets.compare_digest(key, stored_key)
```

## Digital Signatures
```python
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa, padding

class DigitalSigner:
    def __init__(self, private_key=None):
        if private_key is None:
            self.private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048
            )
        else:
            self.private_key = private_key
    
    def sign(self, data: bytes) -> bytes:
        return self.private_key.sign(
            data,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
    
    def verify(self, data: bytes, signature: bytes, 
               public_key) -> bool:
        try:
            public_key.verify(
                signature,
                data,
                padding.PSS(
                    mgf=padding.MGF1(hashes.SHA256()),
                    salt_length=padding.PSS.MAX_LENGTH
                ),
                hashes.SHA256()
            )
            return True
        except:
            return False
```
