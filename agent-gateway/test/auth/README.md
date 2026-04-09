# Auth Tests

> **Test suite for authentication and authorization in Agent Gateway**

This directory contains tests for the authentication and authorization subsystems of Agent Gateway. Tests cover API key validation, role-based access control (RBAC), token management, OAuth flows, and enterprise authentication features.

---

## Table of Contents

- [Overview](#overview)
- [Test Scope](#test-scope)
- [Test Files](#test-files)
- [Authentication Architecture](#authentication-architecture)
- [Test Patterns](#test-patterns)
- [Mocking Strategy](#mocking-strategy)
- [Running Auth Tests](#running-auth-tests)
- [API Coverage](#api-coverage)
- [Security Considerations](#security-considerations)
- [Writing New Auth Tests](#writing-new-auth-tests)
- [Integration Points](#integration-points)

---

## Overview

Location: `/home/runner/workspace/agent-gateway/test/auth/`

The authentication system provides multiple layers of access control:

1. **API Key Authentication**: Simple bearer token validation for REST API endpoints
2. **WebSocket Authentication**: Token-based authentication via query parameters
3. **Role-Based Access Control (RBAC)**: Admin, user, and guest roles with different permissions
4. **OAuth Integration**: Enterprise OAuth authentication flows
5. **Password Hashing**: bcrypt-based password storage for user accounts

All auth tests validate both the happy path and error scenarios, including invalid tokens, expired tokens, insufficient permissions, and edge cases.

---

## Test Scope

The auth tests cover the following components:

| Component | Source Location | Test Coverage |
|-----------|----------------|---------------|
| `Auth` class | `src/auth/index.ts` | Core authentication logic |
| `createAuth()` | `src/auth/index.ts` | Factory function |
| `AuthManager` | `src/auth/enterprise.ts` | Enterprise auth manager |
| `createAuthManager()` | `src/auth/enterprise.ts` | OAuth, token management |
| Auth middleware | `src/server/` | Request authentication |
| RBAC system | `src/auth/` | Role validation, permission checks |
| Token generation | `src/auth/enterprise.ts` | JWT creation, validation |

---

## Test Files

Tests for auth are located in multiple locations:

| File | Coverage |
|------|----------|
| `/home/runner/workspace/agent-gateway/test/auth-enterprise.test.ts` | Enterprise auth, OAuth, token management |
| `/home/runner/workspace/agent-gateway/test/auth/*.test.ts` | Core auth tests (in this directory) |

### Key Test Scenarios

1. **API Key Validation**: Valid key, invalid key, missing key, expired key
2. **Role Permissions**: Admin can do everything, user can do standard ops, guest is read-only
3. **Token Lifecycle**: Create, validate, revoke, expire
4. **OAuth Flow**: Authorization redirect, callback, token exchange
5. **Password Hashing**: bcrypt comparison, salt rounds, invalid passwords
6. **WebSocket Auth**: Valid token, invalid token, missing token
7. **Rate Limiting Integration**: Auth failures count toward rate limits

---

## Authentication Architecture

### API Key Flow

```
Request ─► Auth Middleware ─► Extract Bearer Token ─► Validate Key
                                                         │
                                        ┌────────────────┼────────────────┐
                                        ▼                ▼                ▼
                                   Valid Key        Invalid Key       Missing Key
                                        │                │                │
                                        ▼                ▼                ▼
                                  Allow Request     Return 401       Return 401
                                  with Role        AUTH_REQUIRED    AUTH_REQUIRED
```

### RBAC Permission Matrix

| Permission | Admin | User | Guest |
|------------|-------|------|-------|
| Send messages | Yes | Yes | No |
| Read sessions | Yes | Own only | No |
| Manage channels | Yes | No | No |
| Manage providers | Yes | No | No |
| View metrics | Yes | Yes | Yes |
| Manage config | Yes | No | No |
| Manage users | Yes | No | No |

### Token Lifecycle

```
createToken() ─► Sign JWT ─► Return token string
                                   │
                                   ▼
                        validateToken(token) ─► Verify signature
                                                     │
                                    ┌────────────────┼────────────────┐
                                    ▼                ▼                ▼
                               Valid & Not       Expired         Invalid
                               Expired                              Signature
                                    │                │                │
                                    ▼                ▼                ▼
                              Return User       Return 401      Return 401
                              with Role
```

---

## Test Patterns

### Testing Authentication

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createAuth } from '/home/runner/workspace/agent-gateway/src/auth/index.js';

describe('Auth', () => {
  let auth: ReturnType<typeof createAuth>;

  beforeEach(() => {
    auth = createAuth({
      enabled: true,
      apiKey: 'test-secret-key',
    });
  });

  it('should authenticate with valid API key', async () => {
    const result = await auth.authenticate('Bearer test-secret-key');
    expect(result.valid).toBe(true);
    expect(result.role).toBe('admin');
  });

  it('should reject invalid API key', async () => {
    const result = await auth.authenticate('Bearer wrong-key');
    expect(result.valid).toBe(false);
  });

  it('should reject missing authorization header', async () => {
    const result = await auth.authenticate('');
    expect(result.valid).toBe(false);
  });
});
```

### Testing RBAC

```typescript
it('should enforce role-based permissions', async () => {
  const admin = await auth.authenticate('Bearer admin-key');
  const user = await auth.authenticate('Bearer user-key');
  const guest = await auth.authenticate('Bearer guest-key');

  expect(admin.role).toBe('admin');
  expect(user.role).toBe('user');
  expect(guest.role).toBe('guest');

  expect(auth.hasPermission(admin, 'manage:channels')).toBe(true);
  expect(auth.hasPermission(user, 'manage:channels')).toBe(false);
  expect(auth.hasPermission(guest, 'manage:channels')).toBe(false);
});
```

---

## Mocking Strategy

### Mock JWT Verification

```typescript
import { vi } from 'vitest';

vi.mock('jose', () => ({
  jwtVerify: vi.fn().mockResolvedValue({ payload: { role: 'admin', sub: 'user1' } }),
  SignJWT: vi.fn().mockImplementation(() => ({
    setProtectedHeader: () => ({ sign: vi.fn().mockResolvedValue('mock.jwt.token') }),
  })),
}));
```

### Mock bcrypt

```typescript
vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('$2b$10$mockhash'),
  compare: vi.fn().mockResolvedValue(true),
}));
```

---

## Running Auth Tests

```bash
cd /home/runner/workspace/agent-gateway

# Run all auth tests
npm run test -- auth

# Run specific auth test file
npm run test -- auth-enterprise.test.ts

# Run with coverage for auth modules
npm run test:coverage -- --include "src/auth/**"
```

---

## API Coverage

The auth tests cover the following API behaviors:

| Endpoint | Auth Required | Role Required | Test Coverage |
|----------|--------------|---------------|---------------|
| `GET /health` | No | -- | No auth needed |
| `GET /healthz` | No | -- | No auth needed |
| `GET /ready` | No | -- | No auth needed |
| `GET /metrics` | Configurable | -- | Configurable auth |
| `GET /api/status` | Yes | Any | Admin, user, guest |
| `GET /api/sessions` | Yes | User+ | Admin, user (own), guest (denied) |
| `POST /api/send` | Yes | User+ | Admin, user, guest (denied) |
| `POST /api/stream` | Yes | User+ | Admin, user, guest (denied) |
| `GET /api/traces` | Yes | Admin | Admin only |
| `WS /ws` | Yes | Any | Valid/invalid tokens |

---

## Security Considerations

### What Auth Tests Validate

1. **Token Validation**: Only valid, non-expired tokens are accepted
2. **Permission Enforcement**: Users cannot access admin-only endpoints
3. **Password Security**: Passwords are hashed with bcrypt (not stored in plaintext)
4. **Token Expiration**: Expired tokens are rejected
5. **Header Validation**: Authorization header format is validated
6. **Rate Limiting**: Failed auth attempts are tracked and rate-limited

### What Auth Tests Do NOT Cover

- Cryptographic strength of JWT signatures (tested by the library)
- Network-level security (TLS, firewall rules)
- Social engineering attacks (phishing, credential theft)
- Denial of service against the auth system

---

## Writing New Auth Tests

### Test Checklist

When adding new auth tests, verify:

- [ ] Valid credentials are accepted
- [ ] Invalid credentials are rejected with 401
- [ ] Missing credentials are rejected with 401
- [ ] Expired credentials are rejected
- [ ] Role permissions are correctly enforced
- [ ] Error messages do not leak sensitive information
- [ ] Rate limiting triggers after threshold failures
- [ ] Token revocation takes immediate effect
- [ ] Concurrent sessions are handled correctly
- [ ] Password changes invalidate old tokens

### Example Test Structure

```typescript
describe('Auth - New Feature', () => {
  describe('happy path', () => {
    it('should work with valid input', async () => {
      // Arrange
      // Act
      // Assert
    });
  });

  describe('error cases', () => {
    it('should reject invalid input', async () => {
      // ...
    });

    it('should reject expired input', async () => {
      // ...
    });

    it('should reject malformed input', async () => {
      // ...
    });
  });

  describe('edge cases', () => {
    it('should handle concurrent requests', async () => {
      // ...
    });

    it('should handle empty input', async () => {
      // ...
    });
  });
});
```

---

## Integration Points

The auth system integrates with:

| Component | Integration |
|-----------|-------------|
| **Server middleware** | Auth checks on every request |
| **WebSocket server** | Token validation on connection |
| **Rate limiter** | Failed auth attempts tracked |
| **Audit logger** | Auth events logged |
| **Session manager** | User identity attached to sessions |
| **Observability** | Auth metrics recorded |
