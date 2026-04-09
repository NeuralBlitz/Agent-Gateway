# Auth (`src/auth/`)

> **Authentication and authorization module — API keys, user management, and role-based access control.**

---

## Overview

The `auth/` module implements authentication and authorization for Agent Gateway. It provides API key management, user registration and login, and role-based access control (RBAC) with three roles: admin, user, and guest.

This module is optional — authentication is disabled by default. Enable it when deploying to production or when restricting access to gateway functionality.

---

## File Structure

```
auth/
└── index.ts    # Auth class implementation
```

---

## The `Auth` Class

### Configuration

```json
{
  "auth": {
    "enabled": true,
    "apiKey": "your-master-api-key",
    "sessionTimeout": 86400,
    "hashRounds": 12
  }
}
```

| Setting | Default | Description |
|---------|---------|-------------|
| `enabled` | `false` | Whether to enforce authentication |
| `apiKey` | — | Master API key for unauthenticated access |
| `sessionTimeout` | `86400` (24h) | User session timeout in seconds |
| `hashRounds` | `12` | bcrypt hashing rounds |

---

## Features

### API Key Authentication

The primary authentication method for API access:

```typescript
// Validate an API key from the Authorization header
const isValid = await auth.validateApiKey('Bearer sk-gateway-abc123');
```

API keys are passed in the `Authorization` header:
```
Authorization: Bearer sk-gateway-abc123
```

### User Management

#### Registration
```typescript
await auth.register({
  username: 'john',
  password: 'secure-password',
  role: 'user',
});
```

#### Login
```typescript
const session = await auth.login({
  username: 'john',
  password: 'secure-password',
});
// Returns: { sessionId, user, expiresAt }
```

### API Key Management

#### Create API Key
```typescript
const key = await auth.createApiKey({
  userId: 'john',
  name: 'Production Key',
  role: 'user',
  expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
});
// Returns: { key: 'sk-gateway-abc...', id: 'key-123' }
```

#### Revoke API Key
```typescript
await auth.revokeApiKey('key-123');
```

#### List API Keys
```typescript
const keys = await auth.listApiKeys('john');
```

### Role-Based Access Control (RBAC)

Three roles with increasing permissions:

| Role | Permissions |
|------|-------------|
| **guest** | Read-only access to public endpoints (health, status) |
| **user** | Full access to messaging and sessions |
| **admin** | Full access including configuration, channel management, plugin management |

#### Permission Matrix

| Endpoint | Guest | User | Admin |
|----------|-------|------|-------|
| `GET /health` | ✅ | ✅ | ✅ |
| `GET /api/status` | ✅ | ✅ | ✅ |
| `POST /api/send` | ❌ | ✅ | ✅ |
| `GET /api/sessions` | ❌ | ✅ | ✅ |
| `GET /api/traces` | ❌ | ❌ | ✅ |
| `POST /api/stream` | ❌ | ✅ | ✅ |
| Config endpoints | ❌ | ❌ | ✅ |
| Channel management | ❌ | ❌ | ✅ |
| Provider management | ❌ | ❌ | ✅ |
| Plugin management | ❌ | ❌ | ✅ |

### Session Management

User sessions (for web UI login):

```typescript
// Validate a user session
const session = await auth.validateSession(sessionId);

// Extend session TTL
await auth.touchSession(sessionId);

// Destroy session (logout)
await auth.logout(sessionId);
```

---

## Password Handling

### Hashing
```typescript
const hash = await auth.hashPassword('my-password');
// Returns: bcrypt hash string
```

### Verification
```typescript
const isValid = await auth.verifyPassword('my-password', hash);
// Returns: boolean
```

Passwords are hashed with bcrypt at the configured number of rounds (default: 12).

---

## Auth Middleware

The auth module provides Express middleware for route protection:

```typescript
// Require any valid API key
app.use('/api/*', auth.middleware());

// Require specific role
app.use('/admin/*', auth.middleware({ role: 'admin' }));
```

### Middleware Behavior

1. Extract API key from `Authorization: Bearer <key>` header
2. Validate the key against stored keys
3. Check the key's role against required role
4. If valid: attach user info to `req.user` and continue
5. If invalid: return 401 JSON error response

### Error Response

```json
{
  "error": {
    "code": "AUTH_REQUIRED",
    "message": "Valid API key required in Authorization header",
    "status": 401
  }
}
```

---

## API Key Format

API keys follow a structured format:

```
sk-gateway-<random-string>
```

- `sk-`: Secret key prefix
- `gateway`: Service identifier
- `<random-string>`: Cryptographically random component

---

## Storage

Authentication data is stored in-memory by default. For production use, integrate with a persistent backend:

| Data | Storage |
|------|---------|
| API Keys | In-memory Map (persistent via config file) |
| User Credentials | In-memory Map (persistent via config file) |
| Sessions | In-memory Map with TTL |

For production deployments, consider:
- Storing API keys in the config file
- Using Redis for session storage
- Integrating with external identity providers (OAuth, OIDC)

---

## Security Best Practices

1. **Enable auth in production**: Set `auth.enabled: true`
2. **Use strong API keys**: Generate with `crypto.randomBytes(32).toString('hex')`
3. **Rotate keys regularly**: Revoke old keys and create new ones
4. **Use role-appropriate access**: Give users the minimum required role
5. **Set expiration dates**: API keys should expire after a reasonable period
6. **Monitor auth failures**: High failure rates may indicate brute-force attempts

---

## Related Documentation

- [`server/`](../server/README.md) — Where auth middleware is applied
- [`config/`](../config/README.md) — Auth configuration options
- [`ratelimit/`](../ratelimit/README.md) — Rate limiting for auth endpoints
