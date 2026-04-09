---
name: Security Testing
category: cybersecurity
description: Techniques and tools for testing application and infrastructure security including penetration testing, fuzzing, and vulnerability assessment
tags: [pentesting, fuzzing, vulnerability-assessment, sast, dast, red-team]
version: "1.0"
---

# Security Testing

## What I Do

I provide guidance on testing the security posture of applications and infrastructure. This includes penetration testing methodologies, fuzzing strategies, vulnerability scanning, security unit testing, and building security regression test suites that catch vulnerabilities before deployment.

## When to Use Me

- Planning a penetration test or security assessment
- Writing security-focused unit and integration tests
- Setting up fuzzing for parsers, APIs, or protocol handlers
- Building security regression tests for previously found vulnerabilities
- Evaluating SAST/DAST tool results and reducing false positives
- Testing authentication, authorization, and cryptographic implementations

## Core Concepts

1. **Penetration Testing**: Simulated attacks on applications and infrastructure to identify exploitable vulnerabilities.
2. **Fuzzing**: Automated generation of malformed or random inputs to discover crashes, memory issues, and unexpected behavior.
3. **SAST**: Static analysis of source code to identify vulnerability patterns without running the application.
4. **DAST**: Dynamic testing of running applications by sending crafted HTTP requests and analyzing responses.
5. **Security Unit Tests**: Tests that verify security controls (auth, authz, input validation) function correctly.
6. **Regression Testing**: Tests for previously discovered vulnerabilities to prevent reintroduction.
7. **Red Team/Blue Team**: Adversarial exercises where red teams attack and blue teams defend to test detection and response.

## Code Examples

### 1. Security Unit Tests for Authentication (Python/pytest)

```python
import pytest
from app.auth import authenticate, hash_password, verify_password

class TestAuthentication:
    def test_reject_empty_password(self):
        with pytest.raises(ValueError, match="Password cannot be empty"):
            authenticate("user@example.com", "")

    def test_reject_sql_injection_in_username(self):
        result = authenticate("' OR 1=1 --", "password123")
        assert result is None

    def test_timing_safe_comparison(self):
        import time
        wrong_short = "a"
        wrong_long = "a" * 100
        valid_hash, salt = hash_password("correct_password")

        start = time.perf_counter()
        verify_password(wrong_short, valid_hash, salt)
        time_short = time.perf_counter() - start

        start = time.perf_counter()
        verify_password(wrong_long, valid_hash, salt)
        time_long = time.perf_counter() - start

        assert abs(time_short - time_long) < 0.01

    def test_password_hash_uniqueness(self):
        hash1, salt1 = hash_password("same_password")
        hash2, salt2 = hash_password("same_password")
        assert salt1 != salt2
        assert hash1 != hash2

    def test_account_lockout_after_failures(self, auth_service):
        for _ in range(5):
            auth_service.authenticate("user@example.com", "wrong")
        result = auth_service.authenticate("user@example.com", "correct")
        assert result is None
        assert auth_service.is_locked("user@example.com")
```

### 2. API Fuzzing with Hypothesis (Python)

```python
from hypothesis import given, strategies as st, settings
import requests

BASE_URL = "http://localhost:8080"

@given(
    username=st.text(min_size=0, max_size=1000),
    password=st.text(min_size=0, max_size=1000),
)
@settings(max_examples=500)
def test_login_fuzz(username: str, password: str):
    response = requests.post(
        f"{BASE_URL}/api/v1/login",
        json={"username": username, "password": password},
        timeout=5,
    )
    assert response.status_code in (200, 400, 401, 422, 429)
    assert response.status_code != 500

@given(payload=st.dictionaries(st.text(), st.text(), max_size=50))
@settings(max_examples=200)
def test_arbitrary_json_endpoint(payload: dict):
    response = requests.post(
        f"{BASE_URL}/api/v1/data",
        json=payload,
        timeout=5,
    )
    assert response.status_code != 500
```

### 3. Authorization Matrix Test (Python/pytest)

```python
import pytest
from typing import Dict, List

AUTHORIZATION_MATRIX: Dict[str, Dict[str, List[str]]] = {
    "GET /api/v1/users": {"admin": [200], "user": [200], "anonymous": [401]},
    "POST /api/v1/users": {"admin": [201], "user": [403], "anonymous": [401]},
    "DELETE /api/v1/users/{id}": {"admin": [204], "user": [403], "anonymous": [401]},
    "GET /api/v1/admin/settings": {"admin": [200], "user": [403], "anonymous": [401]},
}

@pytest.mark.parametrize("endpoint,roles", AUTHORIZATION_MATRIX.items())
def test_authorization_matrix(endpoint, roles, api_client):
    method, path = endpoint.split(" ", 1)
    for role, expected_codes in roles.items():
        client = api_client(role=role)
        response = client.request(method, path.replace("{id}", "1"))
        assert response.status_code in expected_codes, (
            f"{role} got {response.status_code} for {endpoint}, expected {expected_codes}"
        )
```

## Best Practices

1. **Write security tests for every vulnerability found** to prevent regression.
2. **Test authorization at every endpoint** using a role-based authorization matrix.
3. **Fuzz all input parsers** including JSON, XML, file uploads, and query parameters.
4. **Use property-based testing** (Hypothesis, fast-check) to explore edge cases automatically.
5. **Test for timing side channels** in authentication and cryptographic comparisons.
6. **Validate error responses** do not leak internal details like stack traces or SQL queries.
7. **Test rate limiting** by exceeding thresholds and verifying enforcement.
8. **Include negative tests** that verify rejected inputs, denied access, and blocked attacks.
9. **Automate security tests in CI** so they run on every pull request.
10. **Maintain a security test suite** separate from functional tests for clear ownership and tracking.
