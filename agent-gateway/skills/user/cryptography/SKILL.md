---
name: cryptography
description: Cryptography fundamentals and implementation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  category: security
---

## What I do
- Explain cryptographic primitives and their uses
- Implement symmetric and asymmetric encryption
- Design secure key exchange protocols
- Implement hashing and digital signatures
- Choose appropriate algorithms for use cases

## When to use me
When learning about cryptography or implementing cryptographic solutions.

## Symmetric Encryption

### AES Modes of Operation
```python
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
import os

def aes_gcm_encrypt(plaintext: bytes, key: bytes) -> tuple:
    """AES-GCM provides both confidentiality and authenticity"""
    nonce = os.urandom(12)  # 96-bit nonce for GCM
    
    cipher = Cipher(
        algorithms.AES(key),
        modes.GCM(nonce),
        backend=default_backend()
    )
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(plaintext) + encryptor.finalize()
    
    return nonce, ciphertext, encryptor.tag

def aes_ctr_encrypt(plaintext: bytes, key: bytes) -> bytes:
    """AES-CTR turns block cipher into stream cipher"""
    nonce = os.urandom(16)
    
    cipher = Cipher(
        algorithms.AES(key),
        modes.CTR(nonce),
        backend=default_backend()
    )
    return cipher.encryptor().update(plaintext)

# Use cases:
# GCM - When you need authenticated encryption (most common)
# CTR - When you need random access (disk encryption)
# CBC - Legacy systems only (use GCM instead)
```

## Asymmetric Encryption

### RSA Encryption
```python
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes

def generate_rsa_keypair():
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048  # Minimum 2048 for security
    )
    public_key = private_key.public_key()
    return private_key, public_key

def rsa_encrypt(plaintext: bytes, public_key) -> bytes:
    return public_key.encrypt(
        plaintext,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

def rsa_decrypt(ciphertext: bytes, private_key) -> bytes:
    return private_key.decrypt(
        ciphertext,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

# Hybrid encryption (for large data)
def hybrid_encrypt(data: bytes, rsa_public_key):
    # Generate symmetric key for data
    symmetric_key = os.urandom(32)
    
    # Encrypt data with symmetric key
    nonce, ciphertext, tag = aes_gcm_encrypt(data, symmetric_key)
    
    # Encrypt symmetric key with RSA
    encrypted_key = rsa_encrypt(symmetric_key, rsa_public_key)
    
    return encrypted_key, nonce, ciphertext, tag
```

### Elliptic Curve Cryptography
```python
from cryptography.hazmat.primitives.asymmetric import ec

def generate_ec_keypair():
    private_key = ec.generate_private_key(ec.SECP256R1())
    return private_key, private_key.public_key()

def ecdsa_sign(message: bytes, private_key):
    return private_key.sign(
        message,
        ec.ECDSA(hashes.SHA256())
    )

def ecdsa_verify(message: bytes, signature: bytes, public_key):
    try:
        public_key.verify(signature, message, ec.ECDSA(hashes.SHA256()))
        return True
    except:
        return False

# EC is preferred over RSA for new systems
# Same security with smaller keys and faster operations
```

## Hashing

### Choosing Hash Functions
```python
from cryptography.hazmat.primitives import hashes
import hashlib

def secure_hash(data: bytes) -> str:
    """Use SHA-256 for general hashing"""
    return hashlib.sha256(data).hexdigest()

def blake2_hash(data: bytes) -> str:
    """BLAKE2 is faster than SHA-256 and equally secure"""
    return hashlib.blake2b(data).hexdigest()

# NEVER use for passwords:
# - MD5 (broken)
# - SHA-1 (broken)
# - SHA-256 (not designed for passwords)

# Use for passwords:
# - bcrypt
# - scrypt
# - Argon2

def argon2_hash(password: str) -> str:
    import argon2
    ph = argon2.PasswordHasher(
        time_cost=3,
        memory_cost=65536,
        parallelism=4,
        hash_len=32,
        salt_len=16
    )
    return ph.hash(password)

def verify_argon2(password: str, hash: str) -> bool:
    ph = argon2.PasswordHasher()
    try:
        ph.verify(hash, password)
        return True
    except:
        return False
```

## Key Exchange

### Diffie-Hellman
```python
from cryptography.hazmat.primitives.asymmetric import dh
from cryptography.hazmat.primitives import serialization

def generate_dh_parameters():
    # Use standardized parameters
    return dh.generate_parameters(generator=2, key_size=2048)

def dh_key_exchange(paramters):
    private_key = paramtes.generate_private_key()
    public_key = private_key.public_key()
    
    # Share public_key with other party
    # Other party does the same
    # Both derive same shared secret
    
    return private_key, public_key

def derive_shared_key(my_private_key, their_public_key):
    shared_key = my_private_key.exchange(their_public_key)
    # Derive symmetric key from shared secret
    return hashlib.sha256(shared_key).digest()
```

## Digital Signatures
```python
# ECDSA (recommended)
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import hashes

private_key = ec.generate_private_key(ec.SECP256R1())
signature = private_key.sign(
    b"message",
    ec.ECDSA(hashes.SHA256())
)

# Verify
public_key = private_key.public_key()
public_key.verify(signature, b"message", ec.ECDSA(hashes.SHA256()))

# Ed25519 (modern, recommended)
from cryptography.hazmat.primitives.asymmetric import ed25519

private_key = ed25519.Ed25519PrivateKey.generate()
signature = private_key.sign(b"message")
public_key = private_key.public_key()
public_key.verify(signature, b"message")
```

## Random Number Generation
```python
import secrets
import os

# Cryptographically secure random
random_bytes = secrets.token_bytes(32)  # For keys
random_int = secrets.randbelow(1000000)  # For numbers

# System CSPRNG (used by secrets)
system_random = os.urandom(32)

# NEVER use:
# - random module (not secure)
# - Mersenne Twister (predictable)
# - time-based seeds
```
