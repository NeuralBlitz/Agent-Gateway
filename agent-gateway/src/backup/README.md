# Backup Module

## Overview

The Backup module provides automated, encrypted, and compressed backup and restore capabilities for the Agent Gateway. It handles full system snapshots including session data, configuration, secrets, audit logs, and any other JSON-serializable state, with configurable encryption (AES-256-GCM), gzip compression, retention policies, and automatic backup scheduling.

This module is designed for disaster recovery, migration, and compliance scenarios. Backups are stored as encrypted `.json.gz` files with accompanying `.meta.json` metadata files, making them portable, self-contained, and recoverable without external dependencies.

---

## File Structure

```
backup/
  index.ts          # Main module: BackupManager class and factory function
```

The entire module is implemented in a single `index.ts` file exporting the `BackupManager` class, TypeScript interfaces, and a factory function.

---

## Class / Function API

### Types

#### `BackupConfig`

Configuration for the backup manager.

```typescript
export interface BackupConfig {
  backupDir?: string;        // Directory for backup files (default: '.backups')
  encryptionKey?: string;    // 32-byte hex encryption key for AES-256-GCM
  maxBackups?: number;       // Maximum backups to retain (default: 30)
  intervalMs?: number;       // Auto-backup interval in ms (default: 24 hours)
}
```

#### `BackupMetadata`

Metadata describing a single backup file.

```typescript
export interface BackupMetadata {
  id: string;                // Unique backup ID (e.g., 'backup-1704067200000-a1b2c3d4')
  createdAt: number;         // Unix timestamp (ms) when the backup was created
  size: number;              // Compressed (and encrypted) file size in bytes
  encrypted: boolean;        // Whether the backup is encrypted
  components: string[];      // List of data component names included in the backup
  compression: 'gzip';       // Compression algorithm used
}
```

### `BackupManager` Class

| Method | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `(config?: BackupConfig)` | Creates a backup manager. Automatically creates the backup directory if it does not exist. |
| `createBackup` | `(data: Record<string, any>) => Promise<BackupMetadata>` | Creates a full backup of the provided data object. Compresses with gzip and optionally encrypts with AES-256-GCM. Writes `.json.gz` and `.meta.json` files. Auto-cleans old backups beyond `maxBackups`. |
| `restore` | `(backupId: string) => Promise<Record<string, any>>` | Restores data from a backup by ID. Automatically decrypts and decompresses. Throws if the backup file is not found. |
| `listBackups` | `() => Promise<BackupMetadata[]>` | Lists all available backups by reading `.meta.json` files. Returns them sorted by creation date (newest first). |
| `deleteBackup` | `(backupId: string) => Promise<boolean>` | Deletes a backup (both data and metadata files). Returns `true` if the data file existed and was deleted. |
| `startAutoBackup` | `(dataFn: () => Promise<Record<string, any>>) => ReturnType<typeof setInterval>` | Starts an automatic backup schedule. Calls `dataFn()` at each interval to collect data, then creates a backup. Returns the `setInterval` handle for later cleanup. |

### Factory Function

```typescript
export function createBackupManager(config?: BackupConfig): BackupManager
```

Convenience factory that creates a `BackupManager` instance.

---

## Configuration Options

### Environment Variables

| Variable | Type | Description |
|----------|------|-------------|
| `BACKUP_ENCRYPTION_KEY` | `string` | 64-character hex string (32 bytes) for AES-256-GCM encryption. If not set, backups are compressed but not encrypted. |

### Constructor Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `backupDir` | `string` | `.backups` | Directory path for storing backup files. Created automatically. |
| `encryptionKey` | `string` | `BACKUP_ENCRYPTION_KEY` env or `''` | AES-256 encryption key as a hex string. Must be exactly 64 hex characters (32 bytes). If empty, backups are unencrypted. |
| `maxBackups` | `number` | `30` | Maximum number of backups to retain. Oldest backups are deleted when this limit is exceeded. |
| `intervalMs` | `number` | `86400000` (24 hours) | Interval for automatic backups when using `startAutoBackup()`. |

---

## Usage Examples

### Basic Setup and Manual Backup

```typescript
import { createBackupManager } from './src/backup/index.js';

const backupManager = createBackupManager({
  backupDir: '/var/backups/agent-gateway',
  encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
  maxBackups: 14, // Keep 2 weeks of daily backups
});

// Collect data to back up
const snapshot = {
  sessions: await sessionManager.exportAll(),
  config: gatewayConfig.get(),
  tenants: await tenantManager.listTenants(),
  users: await authManager.listUsers(),
};

// Create a backup
const metadata = await backupManager.createBackup(snapshot);
console.log(`Backup created: ${metadata.id} (${metadata.size} bytes)`);
```

### Restoring from a Backup

```typescript
// List available backups
const backups = await backupManager.listBackups();
console.log(backups.map((b) => ({ id: b.id, createdAt: new Date(b.createdAt) })));

// Restore the most recent backup
const latest = backups[0];
const restored = await backupManager.restore(latest.id);

// Apply restored data
await sessionManager.importAll(restored.sessions);
gatewayConfig.set(restored.config);
await tenantManager.importTenants(restored.tenants);
```

### Automatic Backup Scheduling

```typescript
const backupManager = createBackupManager({
  intervalMs: 6 * 60 * 60 * 1000, // Every 6 hours
  maxBackups: 28,                   // Keep 7 days of 6-hourly backups
  encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
});

// Start automatic backups
const intervalHandle = backupManager.startAutoBackup(async () => {
  return {
    sessions: await sessionManager.exportAll(),
    config: gatewayConfig.get(),
    tenants: await tenantManager.listTenants(),
    secrets: await secretManager.exportAll(),
    auditStats: auditLogger.getStats(),
  };
});

// Later, stop automatic backups (e.g., during shutdown)
clearInterval(intervalHandle);
```

### Deleting Old Backups

```typescript
// Delete a specific backup
await backupManager.deleteBackup('backup-1704067200000-a1b2c3d4');

// List and prune: delete all but the 5 most recent
const backups = await backupManager.listBackups();
for (let i = 5; i < backups.length; i++) {
  await backupManager.deleteBackup(backups[i].id);
}
```

### Unencrypted Backups (Development)

```typescript
// For development/testing, skip encryption
const backupManager = createBackupManager({
  backupDir: '.backups',
  // No encryptionKey provided
});

const metadata = await backupManager.createBackup({ test: 'data' });
console.log(metadata.encrypted); // false
```

---

## Backup File Format

Each backup produces two files in the backup directory:

```
.backups/
  backup-1704067200000-a1b2c3d4.json.gz     # Compressed (and optionally encrypted) JSON data
  backup-1704067200000-a1b2c3d4.meta.json   # Human-readable metadata
```

### Data File

The `.json.gz` file contains a gzip-compressed JSON object. If encryption is enabled, the file format is:

```
[16 bytes IV][encrypted+compressed data][16 bytes AES-GCM auth tag]
```

### Metadata File

The `.meta.json` file contains:

```json
{
  "id": "backup-1704067200000-a1b2c3d4",
  "createdAt": 1704067200000,
  "size": 45678,
  "encrypted": true,
  "components": ["sessions", "config", "tenants", "secrets"],
  "compression": "gzip"
}
```

---

## Encryption Architecture

When an `encryptionKey` is provided, the module uses AES-256-GCM (Galois/Counter Mode) for authenticated encryption:

1. **Key**: The 32-byte hex key from `encryptionKey` or `BACKUP_ENCRYPTION_KEY`.
2. **IV**: A random 16-byte initialization vector is generated per backup.
3. **Encryption Pipeline**:
   - Data is first JSON-serialized to a string.
   - The string is compressed with gzip.
   - The compressed data is encrypted with AES-256-GCM.
   - The output file format is: `[IV][encrypted_data][auth_tag]`.
4. **Decryption Pipeline**:
   - The IV and auth tag are extracted from the file boundaries.
   - AES-256-GCM decryption with authentication verification.
   - The decrypted data is decompressed with gunzip.
   - The result is JSON-parsed back to an object.

**Key Generation**: Generate a secure 32-byte hex key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Integration Points

| Module | Integration |
|--------|-------------|
| `../infra` | Uses `logger` for backup creation and restoration logging |
| `../admin` | Admin module can trigger backups and restores via system actions |
| `../config` | Gateway configuration is a primary backup component |
| `../session-manager` | Session data should be exported/imported as backup components |
| `../audit` / `../audit-logger` | Audit statistics can be included in backups |
| `../secrets` | Secrets should be carefully handled (consider whether to include them) |

---

## Data Flow

```
[Application State]
       |
       v
  collectData() --> { sessions: ..., config: ..., tenants: ... }
       |
       v
  JSON.stringify()
       |
       v
  gzip.compress()
       |
       v
  [Encryption?] --Yes--> AES-256-GCM.encrypt()
       |
       v
  writeFile(backup.json.gz)
       |
       v
  writeMetaFile(backup.meta.json)
       |
       v
  cleanupOldBackups()
       |
       v
  [Complete]
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Backup file not found on restore | Throws `Error: Backup not found: <backupId>`. |
| Invalid encryption key | If the key is not a valid 64-character hex string, `Buffer.from(key, 'hex')` will produce incorrect bytes, leading to decryption failures. |
| Decryption failure (wrong key) | AES-GCM authentication will fail, throwing a cipher error during `decipher.final()`. |
| Corrupted backup file | JSON parsing will throw a `SyntaxError`. Gunzip will throw on invalid compressed data. |
| Corrupted metadata file | `listBackups()` silently skips meta files that fail JSON parsing. |
| Disk write failure | `createBackup()` throws the underlying `writeFile` error. |
| Directory creation failure | The constructor creates the backup directory with `{ recursive: true }`. If this fails, an exception is thrown. |

---

## Retention and Cleanup

The module automatically manages backup retention:

1. **Per-backup cleanup**: After each `createBackup()`, `cleanupOldBackups()` is called to delete backups beyond the `maxBackups` limit (oldest first).
2. **Manual deletion**: Use `deleteBackup(backupId)` to remove specific backups.
3. **Listing**: `listBackups()` returns backups sorted by creation date (newest first), making it easy to identify candidates for deletion.

---

## Security Considerations

1. **Encryption Key Management**: Store `BACKUP_ENCRYPTION_KEY` in a secure secrets manager (e.g., AWS Secrets Manager, HashiCorp Vault). Never commit it to version control.
2. **Backup File Permissions**: Ensure the backup directory has restricted permissions (e.g., `0700`) to prevent unauthorized access.
3. **Sensitive Data in Backups**: Backups may contain session data, configuration, and secrets. Ensure that:
   - Encryption is enabled in production.
   - Backup files are stored on encrypted volumes.
   - Backup files are securely deleted when no longer needed.
4. **Key Rotation**: If you rotate the encryption key, existing backups encrypted with the old key will be unreadable. Plan key rotation carefully.

---

## Performance Characteristics

- **Compression**: Gzip compression typically achieves 5-10x compression ratios on JSON data.
- **Encryption overhead**: AES-256-GCM adds approximately 32 bytes (IV + auth tag) to the file size and minimal CPU overhead.
- **Memory**: The entire dataset is held in memory as a JSON string during compression/encryption. For large datasets (e.g., millions of sessions), consider streaming backups.
- **I/O**: Backup creation involves two file writes (data + metadata). Restoration involves one file read.
- **Automatic backup**: `startAutoBackup()` uses `setInterval` and runs on the event loop. If `dataFn()` is slow, subsequent intervals will queue up.

---

## Best Practices

1. **Test restores regularly**: A backup is only as good as its restore process. Periodically test restoring from a backup to verify integrity.
2. **Monitor backup size**: Track `metadata.size` over time to detect data growth.
3. **Use encryption in production**: Never disable encryption in production environments.
4. **Offsite copies**: Copy backup files to a remote location (S3, GCS, etc.) for disaster recovery.
5. **Include all critical state**: Back up sessions, configuration, tenants, users, and any other state that would be painful to lose.
6. **Schedule around peak hours**: Run automatic backups during low-traffic periods to minimize resource contention.

---

## Related Documentation

- [Admin Module](../admin/README.md) — Admin endpoints that can trigger backups
- [Audit Module](../audit/README.md) — Audit logs that may be included in backups
- [Audit Logger Module](../audit-logger/README.md) — Alternative audit logger
- [Configuration Module](../config/README.md) — Gateway configuration as a backup component
