# Audit Module

## Overview

The Audit module provides a comprehensive, tamper-evident audit trail system for the Agent Gateway. It records every significant action -- authentication events, message sends/receives, session lifecycle, configuration changes, plugin management, administrative actions, system events, rate limiting, and security blocks -- in a cryptographically chained, append-only log.

The module is designed for compliance, security monitoring, and operational forensics. Each audit event is linked to its predecessor via an HMAC-SHA256 hash chain, making it computationally infeasible to modify or delete events without detection. Events are persisted to disk in JSONL format with configurable rotation and retention policies.

This module (`audit/`) is the primary audit implementation, featuring disk persistence, file rotation, and convenience functions for common audit events. A sibling module (`audit-logger/`) provides a similar but lighter implementation focused on in-memory event streaming.

---

## File Structure

```
audit/
  index.ts          # Main module: AuditLogger class, convenience functions, and factories
```

The entire module is implemented in a single `index.ts` file. It exports the `AuditLogger` class, TypeScript interfaces, convenience audit functions, and factory functions.

---

## Class / Function API

### Types

#### `AuditEventType`

Union type of all supported audit event types.

```typescript
export type AuditEventType =
  | 'auth:login' | 'auth:logout'
  | 'auth:api-key-created' | 'auth:api-key-revoked'
  | 'auth:user-created' | 'auth:user-disabled'
  | 'message:send' | 'message:receive'
  | 'session:create' | 'session:delete'
  | 'config:change'
  | 'plugin:install' | 'plugin:uninstall'
  | 'admin:action'
  | 'system:start' | 'system:stop' | 'system:error'
  | 'rate:limited'
  | 'security:blocked';
```

#### `AuditEvent`

Represents a single audit event in the chain.

```typescript
export interface AuditEvent {
  id: string;                    // Unique event ID (timestamp + random)
  type: AuditEventType;          // Event type
  timestamp: number;             // Unix timestamp (ms)
  actor: string;                 // Actor identity (user ID, API key name, or 'system')
  actorType: 'user' | 'api-key' | 'system' | 'anonymous'; // Actor classification
  tenantId?: string;             // Multi-tenant: tenant identifier
  sourceIp?: string;             // Source IP address
  userAgent?: string;            // HTTP User-Agent
  data: Record<string, any>;     // Event-specific payload
  previousState?: Record<string, any>; // Previous state (for config changes)
  previousHash: string;          // Hash of the preceding event (chain link)
  hash: string;                  // HMAC-SHA256 hash of this event
}
```

#### `AuditConfig`

Configuration for the audit logger.

```typescript
export interface AuditConfig {
  maxInMemory?: number;      // Max events in memory (default: 100000)
  persistToDisk?: boolean;   // Whether to write JSONL files (default: true)
  logDir?: string;           // Directory for audit log files (default: '.audit-logs')
  rotationSize?: number;     // Max events per file (default: 10000)
  retentionMs?: number;      // Delete files older than this (default: 90 days)
  hmacSecret?: string;       // HMAC secret for tamper-evident hashing
}
```

### `AuditLogger` Class

| Method | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `(config?: AuditConfig)` | Creates an audit logger with the given configuration. Initializes the hash chain with a zero hash. |
| `log` | `(event: Omit<AuditEvent, 'id' \| 'timestamp' \| 'previousHash' \| 'hash'>) => Promise<AuditEvent>` | Logs an audit event. Auto-generates ID, timestamp, previous hash link, and HMAC hash. Persists to disk if enabled. |
| `getRecent` | `(limit?: number) => AuditEvent[]` | Returns the most recent events (default: 100). |
| `searchByType` | `(type: AuditEventType, limit?: number) => AuditEvent[]` | Searches events by type (default: 100). |
| `searchByActor` | `(actor: string, limit?: number) => AuditEvent[]` | Searches events by actor identity (default: 100). |
| `searchByTenant` | `(tenantId: string, limit?: number) => AuditEvent[]` | Searches events by tenant ID (default: 100). |
| `searchByTimeRange` | `(from: number, to: number, limit?: number) => AuditEvent[]` | Searches events within a time range (default: 1000). |
| `verifyChain` | `() => { valid: boolean; firstInvalidIndex?: number }` | Verifies the integrity of the hash chain. Returns `{ valid: true }` or `{ valid: false, firstInvalidIndex: N }`. |
| `getStats` | `() => { totalEvents, eventTypes: Record<string, number>, oldestEvent?: number }` | Returns aggregate statistics. |
| `rotateOldFiles` | `() => Promise<number>` | Deletes log files older than the retention period. Returns the count of deleted files. |

### Factory Functions

```typescript
export function getAuditLogger(): AuditLogger
```

Returns a global singleton `AuditLogger` instance. Creates one with default configuration if it does not already exist.

```typescript
export function createAuditLogger(config?: AuditConfig): AuditLogger
```

Creates a new `AuditLogger` instance and sets it as the global singleton. Use this to configure the logger at application startup.

### Convenience Functions

```typescript
export async function auditLogin(userId: string, sourceIp?: string): Promise<void>
export async function auditApiKeyCreated(userId: string, keyName: string): Promise<void>
export async function auditMessageSend(userId: string, channel: string, content: string): Promise<void>
export async function auditConfigChange(userId: string, key: string, previousState?: any): Promise<void>
```

Convenience wrappers that call `getAuditLogger().log()` with the appropriate event type and data structure.

---

## Configuration Options

### Environment Variables

| Variable | Type | Description |
|----------|------|-------------|
| `AUDIT_HMAC_SECRET` | `string` | HMAC secret for tamper-evident hashing. **Change this from the default in production.** |

### Constructor Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxInMemory` | `number` | `100000` | Maximum events stored in the in-memory array. Oldest events are evicted when exceeded. |
| `persistToDisk` | `boolean` | `true` | Whether to write events to JSONL files. |
| `logDir` | `string` | `.audit-logs` | Directory path for audit log files. Created automatically if it does not exist. |
| `rotationSize` | `number` | `10000` | Maximum events per JSONL file. A new file is started when this limit is reached. |
| `retentionMs` | `number` | `7776000000` (90 days) | Files older than this are eligible for deletion by `rotateOldFiles()`. |
| `hmacSecret` | `string` | `AUDIT_HMAC_SECRET` env or `'default-secret-change-me'` | HMAC-SHA256 key for chain hashing. |

---

## Usage Examples

### Basic Setup

```typescript
import { createAuditLogger, getAuditLogger } from './src/audit/index.js';

// At application startup
createAuditLogger({
  maxInMemory: 200000,
  persistToDisk: true,
  logDir: '/var/log/agent-gateway/audit',
  rotationSize: 50000,
  retentionMs: 180 * 24 * 60 * 60 * 1000, // 180 days
  hmacSecret: process.env.AUDIT_HMAC_SECRET,
});
```

### Logging Events

```typescript
import { auditLogin, auditMessageSend, auditConfigChange } from './src/audit/index.js';

// Login event
await auditLogin('user-42', '192.168.1.100');

// Message event
await auditMessageSend('user-42', 'slack', 'Hello, how can I help?');

// Config change
await auditConfigChange('admin-1', 'providers.openai.apiKey', { masked: 'sk-***' });
```

### Manual Event Logging

```typescript
const audit = getAuditLogger();

await audit.log({
  type: 'security:blocked',
  actor: 'ip:10.0.0.99',
  actorType: 'anonymous',
  sourceIp: '10.0.0.99',
  data: { reason: 'Brute force detected', attempts: 50 },
});
```

### Searching Events

```typescript
const audit = getAuditLogger();

// Recent login failures
const logins = audit.searchByType('auth:login', 50);

// Actions by a specific user
const userActions = audit.searchByActor('admin-1', 200);

// Tenant-specific events
const tenantEvents = audit.searchByTenant('acme-corp', 500);

// Events in the last hour
const oneHourAgo = Date.now() - 60 * 60 * 1000;
const recentEvents = audit.searchByTimeRange(oneHourAgo, Date.now(), 1000);
```

### Verifying Chain Integrity

```typescript
const audit = getAuditLogger();
const result = audit.verifyChain();

if (result.valid) {
  console.log('Audit chain is intact');
} else {
  console.error(`Tampering detected at event index ${result.firstInvalidIndex}`);
  // Trigger security alert
}
```

### Getting Statistics

```typescript
const stats = audit.getStats();
console.log(stats);
// {
//   totalEvents: 15000,
//   eventTypes: {
//     'auth:login': 5000,
//     'message:send': 8000,
//     'config:change': 200,
//     'security:blocked': 50
//   },
//   oldestEvent: 1704067200000
// }
```

### Log Rotation

```typescript
// Rotate old log files (delete those older than retention period)
const deleted = await audit.rotateOldFiles();
console.log(`Deleted ${deleted} old log files`);
```

---

## Tamper-Evident Hash Chain

Each audit event is cryptographically linked to its predecessor:

1. **Previous Hash**: Each event stores the hash of the preceding event in `previousHash`.
2. **Event Hash**: Each event's `hash` is computed as `HMAC-SHA256(hmacSecret, serialized_event)`, where the serialized event includes all fields except `hash` itself.
3. **Chain Genesis**: The first event's `previousHash` is a zero-filled 64-character hex string.
4. **Verification**: `verifyChain()` walks the chain from the first event, recomputing each hash and checking that `previousHash` matches the prior event's `hash`.

If any event is modified, deleted, or inserted:
- Its own hash will no longer match the recomputed value, OR
- The next event's `previousHash` will no longer match.

This makes undetected tampering computationally infeasible without knowledge of the HMAC secret.

---

## File Format

Audit logs are written as JSONL (JSON Lines) files:

```
.audit-logs/
  audit-1.jsonl    # Events 1-10000
  audit-2.jsonl    # Events 10001-20000
  audit-3.jsonl    # Events 20001-30000
  ...
```

Each line is a single JSON object representing one `AuditEvent`. Files rotate when they reach `rotationSize` events.

---

## Integration Points

| Module | Integration |
|--------|-------------|
| `../infra` | Uses `logger` for real-time audit event logging to stdout/files |
| `../admin` | Admin module queries audit events via `AdminDeps.auditLogger` |
| `../auth` | Authentication events should be logged here |
| `../backup` | Audit logs can be included in backups |
| `../tenant-manager` | Multi-tenant environments use `tenantId` for tenant isolation |

---

## Event Type Reference

| Type | Actor | Data Fields | Description |
|------|-------|-------------|-------------|
| `auth:login` | User ID | `{ method }` | User login |
| `auth:logout` | User ID | `{}` | User logout |
| `auth:api-key-created` | User ID | `{ keyName }` | API key creation |
| `auth:api-key-revoked` | User ID | `{ keyName }` | API key revocation |
| `auth:user-created` | User ID | `{}` | New user creation |
| `auth:user-disabled` | User ID | `{}` | User account disabled |
| `message:send` | User ID | `{ channel, contentLength }` | Message sent |
| `message:receive` | User ID | `{ channel }` | Message received |
| `session:create` | User ID | `{}` | Session created |
| `session:delete` | User ID | `{}` | Session deleted |
| `config:change` | User ID | `{ key }`, `previousState` | Configuration changed |
| `plugin:install` | User ID | `{}` | Plugin installed |
| `plugin:uninstall` | User ID | `{}` | Plugin uninstalled |
| `admin:action` | User ID | `{}` | Administrative action |
| `system:start` | `system` | `{}` | System started |
| `system:stop` | `system` | `{}` | System stopped |
| `system:error` | `system` | `{ error }` | System error |
| `rate:limited` | `system` | `{}` | Rate limit triggered |
| `security:blocked` | IP/actor | `{ reason }` | Security block |

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Disk write failure | Error is logged via `logger.error()`. Event is still stored in memory. No exception is thrown. |
| Directory creation failure | If `logDir` cannot be created, disk persistence is silently skipped. |
| Memory overflow | When `maxInMemory` is exceeded, oldest events are silently removed via `shift()`. |
| HMAC secret exposure | If the secret is compromised, an attacker could forge valid chain entries. Rotate the secret immediately. |
| Corrupted log files | `listBackups()`-style reading skips files that fail JSON parsing. |

---

## Security Considerations

1. **HMAC Secret**: Always set `AUDIT_HMAC_SECRET` to a strong, unique value in production. The default `'default-secret-change-me'` is trivially guessable.
2. **Log Directory**: Ensure the audit log directory has restricted file permissions (e.g., `0600`) to prevent unauthorized read/write access.
3. **Append-Only**: The module does not provide mechanisms to modify or delete individual events. Only bulk rotation (by age) is supported.
4. **Chain Verification**: Run `verifyChain()` periodically (e.g., via a scheduled job) to detect tampering early.
5. **Log Shipping**: For production compliance, ship audit logs to a secure, append-only log aggregation service (e.g., Splunk, Datadog) in addition to local disk storage.

---

## Related Documentation

- [Audit Logger Module](../audit-logger/README.md) — Alternative lighter audit logger implementation
- [Admin Module](../admin/README.md) — Admin endpoints for querying and verifying audit logs
- [Backup Module](../backup/README.md) — Backup and restore including audit log data
- [API Gateway Module](../api-gateway/README.md) — Where audit events are generated from
