---
name: Secure Coding
category: cybersecurity
description: Writing code that is resilient to attacks through defensive programming patterns and vulnerability prevention
tags: [secure-development, defensive-coding, input-validation, injection-prevention, memory-safety]
version: "1.0"
---

# Secure Coding

## What I Do

I provide guidance on writing code that is inherently resistant to security vulnerabilities. This includes defensive programming patterns, safe handling of user input, secure use of cryptographic primitives, memory-safe coding practices, and avoiding common vulnerability classes like injection, deserialization, and race conditions.

## When to Use Me

- Writing code that handles untrusted input from users or external systems
- Implementing cryptographic operations or secure random number generation
- Handling file operations, process execution, or system commands
- Working with serialization/deserialization of external data
- Writing code in memory-unsafe languages (C, C++)
- Reviewing code for common vulnerability patterns

## Core Concepts

1. **Input Validation**: Validate all input from untrusted sources against strict allowlists before use.
2. **Output Encoding**: Encode data contextually when outputting to different interpreters (HTML, SQL, OS).
3. **Principle of Least Authority**: Code should only request and use the minimum permissions needed.
4. **Fail Secure**: When errors occur, default to denying access rather than allowing it.
5. **Secure Defaults**: Ship with the most secure configuration; require explicit opt-out for less secure options.
6. **Avoiding Injection**: Use parameterized APIs instead of string concatenation for queries, commands, and templates.
7. **Safe Deserialization**: Never deserialize untrusted data with formats that allow code execution (pickle, YAML load).
8. **Memory Safety**: Prevent buffer overflows, use-after-free, and other memory corruption through safe APIs and bounds checking.

## Code Examples

### 1. Safe Command Execution (Python)

```python
import subprocess
import shlex
from typing import List

ALLOWED_COMMANDS = {"ls", "cat", "grep", "wc"}

def safe_execute(command: str, args: List[str]) -> str:
    if command not in ALLOWED_COMMANDS:
        raise ValueError(f"Command not allowed: {command}")
    sanitized_args = [shlex.quote(arg) for arg in args]
    result = subprocess.run(
        [command] + args,
        capture_output=True,
        text=True,
        timeout=30,
        shell=False,
    )
    return result.stdout
```

### 2. Safe Deserialization (Python)

```python
import json
from typing import Any, Dict
from pydantic import BaseModel, validator

class UserConfig(BaseModel):
    theme: str
    language: str
    notifications: bool

    @validator("theme")
    def validate_theme(cls, v: str) -> str:
        allowed = {"light", "dark", "system"}
        if v not in allowed:
            raise ValueError(f"Theme must be one of {allowed}")
        return v

    @validator("language")
    def validate_language(cls, v: str) -> str:
        if len(v) != 2 or not v.isalpha():
            raise ValueError("Language must be a 2-letter ISO code")
        return v.lower()

def load_user_config(raw: str) -> UserConfig:
    data = json.loads(raw)
    return UserConfig(**data)
```

### 3. Path Traversal Prevention (Python)

```python
import os
from pathlib import Path

UPLOAD_DIR = Path("/var/app/uploads").resolve()

def safe_file_path(user_filename: str) -> Path:
    clean_name = Path(user_filename).name
    if not clean_name or clean_name.startswith("."):
        raise ValueError("Invalid filename")
    full_path = (UPLOAD_DIR / clean_name).resolve()
    if not str(full_path).startswith(str(UPLOAD_DIR)):
        raise ValueError("Path traversal detected")
    return full_path
```

### 4. Secure Random Token Generation (Python)

```python
import secrets
import string
from typing import Optional

def generate_token(length: int = 32) -> str:
    return secrets.token_urlsafe(length)

def generate_otp(length: int = 6) -> str:
    return "".join(secrets.choice(string.digits) for _ in range(length))

def generate_api_key(prefix: str = "nbx") -> str:
    return f"{prefix}_{secrets.token_hex(24)}"
```

### 5. Safe HTML Rendering (Python)

```python
import html
from markupsafe import Markup, escape

def render_user_comment(username: str, comment: str) -> str:
    safe_username = html.escape(username)
    safe_comment = html.escape(comment)
    return f'<div class="comment"><strong>{safe_username}</strong>: {safe_comment}</div>'

def render_with_markupsafe(username: str, comment: str) -> Markup:
    return Markup('<div class="comment"><strong>{}</strong>: {}</div>').format(
        username, comment
    )
```

## Best Practices

1. **Never use string concatenation** for SQL queries, OS commands, or template rendering; use parameterized APIs.
2. **Never deserialize untrusted data** with pickle, yaml.load, or eval; use json.loads or strict schemas.
3. **Use secrets module** (not random) for generating tokens, API keys, and session identifiers.
4. **Validate file paths** against a base directory to prevent path traversal attacks.
5. **Set timeouts on all external calls** including HTTP requests, subprocess execution, and database queries.
6. **Use subprocess with shell=False** and pass arguments as a list, never as a shell string.
7. **Escape output contextually** using the appropriate encoding for the target interpreter.
8. **Avoid logging sensitive data** including passwords, tokens, PII, and full request bodies.
9. **Use constant-time comparison** (secrets.compare_digest) for security-critical string comparisons.
10. **Pin dependencies** and verify checksums to prevent supply chain attacks.
