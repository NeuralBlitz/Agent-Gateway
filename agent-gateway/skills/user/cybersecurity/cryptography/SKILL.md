---
name: Cryptography
category: cybersecurity
description: Applied cryptography for data protection including encryption, hashing, digital signatures, and key management
tags: [encryption, hashing, tls, pki, key-management, digital-signatures]
version: "1.0"
---

# Cryptography

## What I Do

I provide guidance on correctly applying cryptographic primitives to protect data confidentiality, integrity, and authenticity. This includes symmetric and asymmetric encryption, secure hashing, digital signatures, key management, TLS configuration, and avoiding common cryptographic pitfalls.

## When to Use Me

- Choosing encryption algorithms and modes for data at rest or in transit
- Implementing password hashing or token generation
- Setting up TLS/mTLS configuration for services
- Designing key management and rotation strategies
- Implementing digital signatures for data integrity
- Reviewing code for cryptographic misuse

## Core Concepts

1. **Symmetric Encryption**: Single-key encryption (AES-256-GCM) for bulk data encryption with authenticated encryption modes.
2. **Asymmetric Encryption**: Public/private key pairs (RSA, ECDSA, Ed25519) for key exchange, encryption, and signatures.
3. **Hashing**: One-way functions (SHA-256, SHA-3, BLAKE2) for data integrity verification.
4. **Password Hashing**: Memory-hard functions (Argon2id, bcrypt, scrypt) designed to resist brute-force attacks.
5. **Digital Signatures**: Cryptographic proof of data origin and integrity using private keys.
6. **Key Management**: Secure generation, storage, rotation, and destruction of cryptographic keys.
7. **TLS Configuration**: Secure transport layer setup including cipher suite selection, certificate management, and protocol version enforcement.
8. **Authenticated Encryption**: Modes (GCM, ChaCha20-Poly1305) that provide both confidentiality and integrity in a single operation.

## Code Examples

### 1. AES-256-GCM Encryption (Python)

```python
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from typing import Tuple

def generate_key() -> bytes:
    return AESGCM.generate_key(bit_length=256)

def encrypt(key: bytes, plaintext: bytes, associated_data: bytes = b"") -> Tuple[bytes, bytes]:
    nonce = os.urandom(12)
    aesgcm = AESGCM(key)
    ciphertext = aesgcm.encrypt(nonce, plaintext, associated_data)
    return nonce, ciphertext

def decrypt(key: bytes, nonce: bytes, ciphertext: bytes, associated_data: bytes = b"") -> bytes:
    aesgcm = AESGCM(key)
    return aesgcm.decrypt(nonce, ciphertext, associated_data)
```

### 2. Password Hashing with Argon2 (Python)

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

def hash_password(password: str) -> str:
    return ph.hash(password)

def verify_password(password: str, stored_hash: str) -> bool:
    try:
        return ph.verify(stored_hash, password)
    except VerifyMismatchError:
        return False

def needs_rehash(stored_hash: str) -> bool:
    return ph.check_needs_rehash(stored_hash)
```

### 3. Ed25519 Digital Signatures (Python)

```python
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)
from cryptography.hazmat.primitives import serialization

def generate_signing_keypair() -> tuple:
    private_key = Ed25519PrivateKey.generate()
    public_key = private_key.public_key()
    return private_key, public_key

def sign_data(private_key: Ed25519PrivateKey, data: bytes) -> bytes:
    return private_key.sign(data)

def verify_signature(public_key: Ed25519PublicKey, data: bytes, signature: bytes) -> bool:
    try:
        public_key.verify(signature, data)
        return True
    except Exception:
        return False
```

### 4. Secure TLS Configuration (Python)

```python
import ssl

def create_secure_ssl_context() -> ssl.SSLContext:
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    ctx.minimum_version = ssl.TLSVersion.TLSv1_2
    ctx.set_ciphers(
        "ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS"
    )
    ctx.check_hostname = True
    ctx.verify_mode = ssl.CERT_REQUIRED
    return ctx
```

## Best Practices

1. **Use authenticated encryption** (AES-256-GCM, ChaCha20-Poly1305) instead of unauthenticated modes (ECB, CBC without HMAC).
2. **Never roll your own cryptography**; use well-audited libraries (cryptography, libsodium, BouncyCastle).
3. **Use Argon2id for password hashing** with tuned parameters; never use MD5, SHA-1, or plain SHA-256 for passwords.
4. **Generate random values with CSPRNGs** (os.urandom, secrets module) not math.random or similar.
5. **Never reuse nonces/IVs** with the same key; generate a fresh random nonce for each encryption operation.
6. **Rotate keys regularly** and implement key versioning to support decryption of data encrypted with older keys.
7. **Enforce TLS 1.2+** with strong cipher suites and disable SSLv3, TLS 1.0, and TLS 1.1.
8. **Store keys in HSMs or KMS** rather than in application configuration files or environment variables.
9. **Use constant-time comparison** for MAC verification and other security-sensitive comparisons.
10. **Validate certificates properly** with hostname verification and trusted CA chains; never disable verification.
