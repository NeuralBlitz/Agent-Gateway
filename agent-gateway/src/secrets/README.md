# Secrets Module

## Overview

The Secrets module (`src/secrets/`) provides encrypted secret storage with file-based persistence, automatic key rotation, and optional HashiCorp Vault integration. It is the more feature-rich of the two secret management modules in the gateway, offering disk persistence, auto-rotation of individual secrets, and external vault support.

Secrets are encrypted at rest using AES-256-GCM and stored in a JSON file with restricted file permissions (mode 0600). The module supports master key rotation, per-secret rotatability flags, and access control via role-based permissions.

### Differences from `src/secrets/`

| Aspect                  | `src/secrets/` (this module)                | `src/secrets/`                          |
|-------------------------|----------------------------------------------|-------------------------------------------------|
| **Storage**             | File-based persistence (`.secrets.json`)     | In-memory only                                  |
| **IV Size**             | 16 bytes                                     | 12 bytes (GCM recommended)                      |
| **Encrypted Value Format** | Combined `encryptedValue:authTag` string | Separate `encryptedValue` and `authTag` fields  |
| **Vault Integration**   | HashiCorp Vault (`getFromVault`, `setInVault`) | Not supported                                |
| **Auto-Rotate**         | Per-secret `rotatable` flag + `autoRotateSecrets()` | Not supported                         |
| **Persistence**         | Auto-saves on every set/delete               | No persistence                                  |
| **File Permissions**    | 0o600 (owner read/write only)                | N/A                                             |

Use `src/secrets/` when you need persistent storage across process restarts, HashiCorp Vault integration, or automatic secret rotation. Use `src/secrets/` for lightweight in-memory usage.

## File Structure

```
src/secrets/
  index.ts          # Secret manager with persistence, Vault, and rotation support
```

The module imports Node.js `crypto` for encryption, `fs/promises` and `fs` for file I/O, `path` for path manipulation, and the shared `logger` from `../infra/index.js`.

## Class and Function API

### Interfaces

#### `SecretEntry`

```typescript
interface SecretEntry {
  id: string;
  name: string;
  encryptedValue: string;   // Combined encryptedValue:authTag
  iv: string;
  keyVersion: number;
  createdAt: number;
  lastAccessedAt?: number;
  allowedRoles: string[];
  rotatable: boolean;
  expiresAt?: number;
}
```

| Field            | Type       | Description                                          |
|------------------|------------|------------------------------------------------------|
| `id`             | `string`   | Unique random identifier (16 hex chars)              |
| `name`           | `string`   | Human-readable secret name                           |
| `encryptedValue` | `string`   | Combined format: `encryptedHex:authTagHex`           |
| `iv`             | `string`   | Initialization vector (16 bytes, hex)                |
| `keyVersion`     | `number`   | Master key version used for encryption               |
| `createdAt`      | `number`   | Unix timestamp of creation                           |
| `lastAccessedAt` | `number`   | Unix timestamp of last read                          |
| `allowedRoles`   | `string[]` | Roles permitted to access this secret                |
| `rotatable`      | `boolean`  | Whether the secret can be auto-rotated               |
| `expiresAt`      | `number`   | Optional expiration timestamp                        |

#### `SecretManagerConfig`

```typescript
interface SecretManagerConfig {
  masterKey?: string;
  storagePath?: string;
  autoRotate?: boolean;
  rotationInterval?: number;
  vaultUrl?: string;
  vaultToken?: string;
}
```

| Field              | Type      | Description                                      | Default           |
|--------------------|-----------|--------------------------------------------------|-------------------|
| `masterKey`        | `string`  | Master encryption key (64 hex chars)             | `MASTER_KEY` env or generated |
| `storagePath`      | `string`  | Path to the secrets JSON file                    | `.secrets.json`   |
| `autoRotate`       | `boolean` | Whether to enable auto-rotation                  | `false`           |
| `rotationInterval` | `number`  | Rotation interval in ms                          | 90 days           |
| `vaultUrl`         | `string`  | HashiCorp Vault URL                              | Empty (disabled)  |
| `vaultToken`       | `string`  | HashiCorp Vault authentication token             | Empty (disabled)  |

### `SecretManager` Class

#### Constructor

```typescript
constructor(config?: SecretManagerConfig)
```

Initializes the secret manager, loads existing secrets from the storage file, and validates the master key. If no master key is provided and `MASTER_KEY` is not set, a random key is generated (with a warning logged).

#### Methods

**`set(name: string, value: string, allowedRoles?: string[], rotatable?: boolean): Promise<void>`**

Encrypts and stores a secret. Auto-saves to disk. The `allowedRoles` defaults to `['admin']` and `rotatable` defaults to `false`.

**`get(name: string): Promise<string | null>`**

Decrypts and returns a secret. Returns `null` if not found or expired. Updates `lastAccessedAt`.

**`delete(name: string): Promise<boolean>`**

Removes a secret and persists to disk. Returns `true` if it existed.

**`list(): Array<{ name: string; keyVersion: number; createdAt: number; lastAccessedAt?: number; rotatable: boolean }>`**

Returns metadata for all secrets (not values).

**`rotateMasterKey(): Promise<void>`**

Generates a new random 32-byte master key, decrypts all secrets with the old key, re-encrypts with the new key, and saves to disk. Increments the key version.

**`needsRotation(name: string): boolean`**

Returns `true` if the secret is marked as rotatable and its age exceeds the configured rotation interval.

**`autoRotateSecrets(): Promise<number>`**

Iterates all rotatable secrets that need rotation, re-encrypts them with the current master key (generating new IVs), and saves. Returns the count of rotated secrets.

**`getFromVault(path: string): Promise<string | null>`**

Fetches a secret from HashiCorp Vault. Requires `vaultUrl` and `vaultToken` to be configured. Returns `null` if Vault is not configured or the fetch fails.

**`setInVault(path: string, value: string): Promise<boolean>`**

Stores a secret in HashiCorp Vault. Returns `true` on success.

**`getStats(): { secretCount: number; keyVersion: number }`**

Returns the number of stored secrets and the current master key version.

### Factory Function

```typescript
function createSecretManager(config?: SecretManagerConfig): SecretManager
```

Convenience factory that returns a new `SecretManager` instance.

## Configuration Options

### Environment Variables

| Variable     | Description                                       |
|--------------|---------------------------------------------------|
| `MASTER_KEY` | 64-character hex string for encryption            |

### Programmatic Configuration

| Option             | Type      | Description                                   |
|--------------------|-----------|-----------------------------------------------|
| `masterKey`        | `string`  | Master encryption key                         |
| `storagePath`      | `string`  | File path for secrets storage                 |
| `autoRotate`       | `boolean` | Enable automatic rotation check               |
| `rotationInterval` | `number`  | Rotation interval in milliseconds             |
| `vaultUrl`         | `string`  | HashiCorp Vault base URL                      |
| `vaultToken`       | `string`  | Vault authentication token                    |

## Usage Examples

### Basic Usage with Persistence

```typescript
import { createSecretManager } from './src/secrets/index.js';

const secrets = createSecretManager({
  storagePath: '.secrets.json',
  masterKey: process.env.MASTER_KEY,
});

// Secrets persist across restarts
await secrets.set('database-url', 'postgres://user:pass@localhost/db', ['admin']);
await secrets.set('api-token', 'sk-12345', ['admin', 'api-service']);

// Retrieve on next process start
// (secrets are loaded from .secrets.json automatically)
const dbUrl = await secrets.get('database-url');
```

### HashiCorp Vault Integration

```typescript
const secrets = createSecretManager({
  vaultUrl: 'https://vault.company.com',
  vaultToken: process.env.VAULT_TOKEN,
});

// Store in Vault
await secrets.setInVault('secret/data/api-key', 'sk-vault-12345');

// Retrieve from Vault
const vaultSecret = await secrets.getFromVault('secret/data/api-key');
console.log(vaultSecret); // 'sk-vault-12345'

// Use local storage as cache
const localValue = await secrets.get('api-key');
if (!localValue) {
  const vaultValue = await secrets.getFromVault('secret/data/api-key');
  if (vaultValue) {
    await secrets.set('api-key', vaultValue, ['admin']);
  }
}
```

### Automatic Secret Rotation

```typescript
const secrets = createSecretManager({
  autoRotate: true,
  rotationInterval: 30 * 24 * 60 * 60 * 1000, // 30 days
});

// Store a rotatable secret
await secrets.set('db-password', 'old-password', ['admin'], true);

// Check if rotation is needed
if (secrets.needsRotation('db-password')) {
  console.log('Secret needs rotation');
}

// Rotate all eligible secrets
const rotated = await secrets.autoRotateSecrets();
console.log(`Rotated ${rotated} secrets`);
```

### Master Key Rotation

```typescript
const secrets = createSecretManager({
  storagePath: '.secrets.json',
});

await secrets.set('key1', 'value1', ['admin']);
await secrets.set('key2', 'value2', ['admin']);

// Rotate the master key
await secrets.rotateMasterKey();

// All secrets are re-encrypted with the new key
const value = await secrets.get('key1');
console.log(value); // 'value1' (still accessible)

console.log(secrets.getStats()); // { secretCount: 2, keyVersion: 2 }
```

### Vault-as-Primary Pattern

```typescript
// Use Vault as primary, local as fallback
async function getSecret(name: string): Promise<string | null> {
  // Try local cache first
  const local = await secrets.get(name);
  if (local) return local;

  // Fall back to Vault
  const vaultPath = `secret/data/${name}`;
  const vault = await secrets.getFromVault(vaultPath);
  if (vault) {
    // Cache locally
    await secrets.set(name, vault, ['admin']);
  }
  return vault;
}
```

### Secret Deletion

```typescript
// Delete a secret (also removes from disk)
const deleted = await secrets.delete('old-api-key');
if (deleted) {
  console.log('Secret deleted and storage updated');
}

// List remaining secrets
const remaining = secrets.list();
console.log(`${remaining.length} secrets remaining`);
```

## Integration Points

### With Tenant Manager

Store tenant-specific secrets with persistence:

```typescript
const secrets = createSecretManager({
  storagePath: '.tenants-secrets.json',
});

const tenant = await tenantManager.create({ name: 'acme', plan: 'pro' });
await secrets.set(
  `tenant:${tenant.id}:db-url`,
  'postgres://acme-db.internal/acme',
  ['admin', `tenant-${tenant.id}`],
);
```

### With Service Registry

Store service credentials that persist across restarts:

```typescript
await secrets.set(
  'service:redis:url',
  'redis://redis.internal:6379',
  ['admin'],
);

const redisUrl = await secrets.get('service:redis:url');
const rateLimiter = createRateLimiter({
  max: 1000,
  window: 60,
  redisUrl: redisUrl,
});
```

### With Queue

Secure queue credentials:

```typescript
const queueConfig = {
  maxMessagesPerTopic: 100000,
  // Could store queue auth tokens in secrets
};

await secrets.set('queue:auth-token', 'queue-token-123', ['admin']);
const queue = createMessageQueue(queueConfig);
```

### With Rule Engine

Rules can enforce secret access policies:

```typescript
engine.addRule({
  id: 'secret-access-audit',
  name: 'Audit Secret Access',
  condition: {
    field: 'action.type',
    operator: 'eq',
    value: 'secret:read',
  },
  actions: [
    { type: 'log', params: { message: 'Secret access logged' } },
    { type: 'tag', params: { tag: 'secret-access' } },
  ],
  priority: 1,
  enabled: true,
  category: 'audit',
});
```

## Error Handling

### Master Key Generation

If no master key is provided and `MASTER_KEY` env is not set, a random key is generated and a warning is logged: "Generated new master key. Set MASTER_KEY env var for persistence." The random key is NOT persisted, so secrets encrypted with it will be unreadable after restart unless the env var is set.

### File I/O Errors

- **Load failures**: If the storage file cannot be read (e.g., missing, corrupted), the manager starts fresh and logs a warning.
- **Save failures**: Write errors during `set()` or `delete()` will propagate as uncaught exceptions. This is intentional to ensure callers know if persistence failed.
- **ENOENT tolerance**: If the storage file does not exist on first load, this is silently ignored (starting fresh).

### Vault Errors

Vault operations (`getFromVault`, `setInVault`) are non-throwing:
- If Vault is not configured (`vaultUrl` or `vaultToken` is empty), operations return `null`/`false` immediately.
- Network errors, non-200 responses, and JSON parse errors are caught and logged, returning `null`/`false`.

### Decryption Failures

During `rotateMasterKey()`, individual decryption failures are caught and logged -- rotation continues for remaining secrets. This prevents one corrupted secret from blocking rotation of all others.

### File Security

The secrets file is written with mode `0o600` (owner read/write only). The directory is created recursively if it does not exist. This provides basic filesystem-level protection against unauthorized reads.

## Encryption Details

- **Algorithm**: AES-256-GCM (authenticated encryption)
- **Key Size**: 32 bytes (256 bits)
- **IV Size**: 16 bytes (128 bits)
- **Storage Format**: Combined `encryptedHex:authTagHex` in a single field
- **File Permissions**: 0o600 (owner-only read/write)

## Related Documentation

- **Secret Manager Module (in-memory)**: `/home/runner/workspace/agent-gateway/src/secrets/README.md`
- **Tenant Manager**: `/home/runner/workspace/agent-gateway/src/tenant-manager/README.md`
- **Service Registry**: `/home/runner/workspace/agent-gateway/src/service-registry/README.md`
