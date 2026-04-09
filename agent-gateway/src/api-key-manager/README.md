# API Key Manager

## Overview

The **API Key Manager** module (`agent-gateway/src/api-key-manager/`) provides full lifecycle API key management with scope-based authorization, key rotation, usage tracking, and automatic expiration. It is designed for issuing, validating, and managing API keys that clients use to authenticate with the gateway.

Keys are generated with a `agw_` prefix (e.g., `agw_a1b2c3d4...`), hashed with SHA-256 for secure storage, and tracked with usage statistics including last-used timestamp and total request count. The manager supports per-tenant and per-user key scoping, enabling multi-tenant deployments with granular access control.

### Differences from `src/auth/`

The agent gateway also contains an **auth** module at [`/home/runner/workspace/agent-gateway/src/auth/`](/home/runner/workspace/agent-gateway/src/auth/). Key differences:

| Aspect | `src/api-key-manager/` | `src/auth/` |
|--------|----------------------|-------------|
| **Scope** | Dedicated to API key lifecycle only (create, validate, rotate, revoke) | Full authentication system (users, roles, sessions, API keys, password auth) |
| **Key Storage** | Stores only the SHA-256 hash; plaintext is never persisted | Stores plaintext API keys in memory |
| **Key Prefix** | Keys use `agw_` prefix | Keys use `agw_` prefix (same) |
| **Scopes** | Per-key scope arrays (`['read', 'write', '*']`) with `hasScope()` check | Role-based permissions via `AuthRole` |
| **Key Rotation** | Built-in `rotate()` method (revoke old, create new with same settings) | No key rotation; only create and revoke |
| **Usage Tracking** | Tracks `usageCount` and `lastUsedAt` per key | No usage tracking |
| **Expiration** | Per-key `expiresAt` with automatic validation rejection | Session-based expiration only |
| **User Model** | Optional `userId` and `tenantId` on keys (not required) | Full `AuthUser` model with username, roles, metadata |
| **Password Auth** | Not supported | Full username/password login with `hashPassword`/`verifyPassword` |
| **Sessions** | Not managed | Session management with token-based auth |

Use `api-key-manager/` when you need production-grade API key management with rotation, scopes, and usage analytics. Use `auth/` for a broader authentication system that includes user management, roles, and session-based login.

### Key Capabilities

- **Secure Storage**: Only SHA-256 hashes of keys are stored; plaintext keys are returned only at creation time.
- **Scoped Access**: Each key has an array of scopes; `'*'` grants all scopes.
- **Key Rotation**: Atomic rotate operation -- revokes the old key and creates a new one with identical settings.
- **Usage Tracking**: Every validation increments `usageCount` and updates `lastUsedAt`.
- **Automatic Expiration**: Keys with `expiresAt` are rejected after expiration.
- **Multi-Tenant**: Keys can be scoped to `tenantId` and/or `userId`.
- **Cleanup**: Bulk removal of expired and revoked keys.
- **Analytics**: Statistics on active, revoked, and expired keys plus total usage.

---

## File Structure

```
agent-gateway/src/api-key-manager/
  index.ts              # Main implementation (ApiKeyManager class, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `crypto` (`randomBytes`, `createHash`) for key generation and hashing.
- `events` (`EventEmitter`) for key lifecycle events.
- `../infra/index.js` (the shared `logger` singleton) for info/debug logging.

---

## Full API Documentation

### Interfaces

#### `ApiKey`

```ts
interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  scopes: string[];
  tenantId?: string;
  userId?: string;
  createdAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  usageCount: number;
  revoked: boolean;
  metadata?: Record<string, any>;
}
```

Note: The `keyHash` field is stripped from objects returned by `get()` and `list()` to prevent hash exposure.

#### `ApiKeyCreateOptions`

| Property    | Type                  | Required | Description                          |
|-------------|-----------------------|----------|--------------------------------------|
| `name`      | string                | Yes      | Human-readable key name              |
| `scopes`    | string[]              | No       | Permission scopes (default: `['*']`) |
| `tenantId`  | string                | No       | Multi-tenant identifier              |
| `userId`    | string                | No       | Associated user ID                   |
| `expiresAt` | number                | No       | Expiration timestamp (epoch ms)      |
| `metadata`  | Record<string, any>   | No       | Arbitrary metadata                   |

#### `ApiKeyValidationResult`

| Property | Type     | Description                               |
|----------|----------|-------------------------------------------|
| `valid`  | boolean  | Whether the key is valid                  |
| `key`    | ApiKey?  | The key object (only if valid)            |
| `error`  | string?  | Error message (only if invalid)           |

---

### Class: `ApiKeyManager`

Extends `EventEmitter`.

#### Constructor

```ts
constructor()
```

No configuration needed. The manager uses in-memory `Map` storage.

#### Methods

##### `create(options: ApiKeyCreateOptions): { key: string; apiKey: ApiKey }`

Generates a new API key. Returns both the plaintext key (to be given to the client) and the stored `ApiKey` object.

The plaintext key format is `agw_` followed by 48 hex characters (24 random bytes).

Emits `key:created`.

```ts
const { key, apiKey } = manager.create({
  name: 'Production API Key',
  scopes: ['read', 'write'],
  tenantId: 'tenant-1',
  expiresAt: Date.now() + 90 * 24 * 60 * 60 * 1000, // 90 days
});
console.log('Give this key to the client:', key);
// => agw_a1b2c3d4e5f6...
```

##### `validate(plaintext: string): ApiKeyValidationResult`

Validates a plaintext API key. Checks existence, revocation status, and expiration. Updates `usageCount` and `lastUsedAt` on successful validation.

```ts
const result = manager.validate(req.headers['x-api-key'] as string);
if (!result.valid) {
  return res.status(401).json({ error: result.error });
}
// result.key contains the ApiKey object
```

##### `hasScope(keyId: string, scope: string): boolean`

Checks if a key has a specific scope. Keys with `'*'` in their scopes have all scopes.

```ts
if (!manager.hasScope(apiKey.id, 'write')) {
  return res.status(403).json({ error: 'Insufficient scope' });
}
```

##### `revoke(keyId: string): boolean`

Revokes a key. Removes the hash mapping so the key can no longer be validated.

Emits `key:revoked`.

##### `rotate(keyId: string, options?: { name?: string }): { key: string; apiKey: ApiKey }`

Atomically revokes the old key and creates a new one with the same scopes, tenant, user, and metadata. The new key's name defaults to `${oldName} (rotated)`.

The new key's metadata includes `rotatedFrom: <oldKeyId>` for audit trails.

Emits `key:rotated`.

```ts
const { key: newKey, apiKey: newApiKey } = manager.rotate(oldKeyId);
console.log('New key:', newKey);
```

##### `list(filter?: { tenantId?, userId?, revoked? }): ApiKey[]`

Lists keys matching the optional filter. The `keyHash` field is stripped from results.

```ts
const activeKeys = manager.list({ revoked: false });
const tenantKeys = manager.list({ tenantId: 'tenant-1', revoked: false });
```

##### `get(keyId: string): ApiKey | undefined`

Gets a single key by ID. The `keyHash` field is stripped.

##### `getStats(): { total, active, revoked, expired, totalUsage }`

Returns aggregate statistics.

##### `cleanup(): number`

Removes all revoked and expired keys from storage. Returns the count of removed keys.

---

### Factory Function

```ts
function createApiKeyManager(): ApiKeyManager
```

Convenience factory.

---

## Configuration Options

The `ApiKeyManager` has no constructor configuration. All settings are per-key via `ApiKeyCreateOptions`.

---

## Usage Examples

### Full Lifecycle

```ts
import { createApiKeyManager } from './index.js';

const manager = createApiKeyManager();

// 1. Create
const { key, apiKey } = manager.create({
  name: 'My App',
  scopes: ['read', 'write'],
  expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
});

// 2. Validate (in request middleware)
const result = manager.validate(key);
console.log(result.valid); // true
console.log(result.key.usageCount); // 1

// 3. Check scope
console.log(manager.hasScope(apiKey.id, 'read'));   // true
console.log(manager.hasScope(apiKey.id, 'delete')); // false

// 4. Rotate
const { key: newKey } = manager.rotate(apiKey.id);

// 5. Old key is now invalid
console.log(manager.validate(key).valid); // false

// 6. Revoke
manager.revoke(newKey.id);

// 7. Cleanup
const cleaned = manager.cleanup();
```

### Express Auth Middleware

```ts
import express from 'express';
import { createApiKeyManager } from './index.js';

const app = express();
const keyManager = createApiKeyManager();

app.use('/api/*', (req, res, next) => {
  const apiKeyHeader = req.headers['x-api-key'] as string;
  if (!apiKeyHeader) {
    return res.status(401).json({ error: 'API key required' });
  }

  const result = keyManager.validate(apiKeyHeader);
  if (!result.valid) {
    return res.status(401).json({ error: result.error });
  }

  // Attach key info to request
  req.apiKey = result.key;
  req.tenantId = result.key.tenantId;
  next();
});
```

### Scope-Based Authorization

```ts
app.post('/api/users', (req, res) => {
  if (!keyManager.hasScope(req.apiKey.id, 'write')) {
    return res.status(403).json({ error: 'Write scope required' });
  }
  // Process request...
});
```

### Periodic Cleanup

```ts
setInterval(() => {
  const cleaned = keyManager.cleanup();
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired/revoked keys`);
  }
}, 60 * 60 * 1000); // Every hour
```

### Analytics Dashboard

```ts
const stats = keyManager.getStats();
console.log(`Total keys: ${stats.total}`);
console.log(`Active: ${stats.active}`);
console.log(`Revoked: ${stats.revoked}`);
console.log(`Expired: ${stats.expired}`);
console.log(`Total API calls: ${stats.totalUsage}`);
```

---

## Integration Points

- **Auth Module** (`/home/runner/workspace/agent-gateway/src/auth/`): The `auth/` module has its own basic API key support. The `api-key-manager/` can be used as a more feature-rich replacement for API key operations within the broader auth flow.
- **Middleware Pipeline** (`/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md`): Use `ApiKeyManager.validate()` within a custom auth middleware factory.
- **Error Handler** (`/home/runner/workspace/agent-gateway/src/error-handler/README.md`): Failed key validation can return structured errors via the error handler (`UNAUTHORIZED` code).
- **Request Logger** (`/home/runner/workspace/agent-gateway/src/request-logger/README.md`): API key usage (`usageCount`) can be correlated with request logs for audit trails.
- **Infra Logger** (`/home/runner/workspace/agent-gateway/src/infra/`): Key creation, revocation, and cleanup events are logged.

---

## Error Handling

- **Invalid Key**: `validate()` returns `{ valid: false, error: 'Invalid API key' }` -- no exception thrown.
- **Revoked Key**: `validate()` returns `{ valid: false, error: 'API key has been revoked' }`.
- **Expired Key**: `validate()` returns `{ valid: false, error: 'API key has expired' }`.
- **Rotate Non-Existent Key**: `rotate()` throws `Error('Key not found')`.
- **Hash Collisions**: SHA-256 is used for key hashing. The probability of collision is negligible for practical key counts.

---

## Security Considerations

1. **Hash-Only Storage**: Only SHA-256 hashes are stored. Even if the in-memory store is compromised, plaintext keys cannot be recovered.
2. **Key Format**: The `agw_` prefix allows easy identification of gateway-issued keys and enables format validation.
3. **No Plaintext Logging**: The logger records `keyId` and `name` but never the plaintext key.
4. **Scope Isolation**: Keys are scoped to specific permissions; avoid using `['*']` in production unless necessary.
5. **Expiration**: Always set `expiresAt` for production keys to limit the blast radius of compromised keys.

---

## Related Documentation

- [Auth Module](/home/runner/workspace/agent-gateway/src/auth/) -- Full authentication system with users, roles, and sessions.
- [Middleware Pipeline](/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md) -- Compose API key validation into request pipelines.
- [Error Handler](/home/runner/workspace/agent-gateway/src/error-handler/README.md) -- Structured error responses for auth failures.
- [Session Manager](/home/runner/workspace/agent-gateway/src/session-manager/README.md) -- Session management that can reference API key `userId`.
- [Request Logger](/home/runner/workspace/agent-gateway/src/request-logger/README.md) -- Request logging for API key usage auditing.
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
