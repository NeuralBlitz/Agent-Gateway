# Admin Module

## Overview

The Admin module provides a comprehensive, production-grade administrative API for managing the entire Agent Gateway system. Built on top of Express Router, it exposes RESTful endpoints that give administrators full control over gateway configuration, session management, tool registries, tenant administration, secret management, audit log inspection, authentication management, and system-level operations.

This module is designed for operators and administrators who need to monitor system health, manage users and tenants, configure routing and providers, audit security-sensitive actions, and perform operational maintenance -- all through a consistent HTTP API.

Every endpoint integrates with the gateway's centralized `logger` (from `../infra`) and is designed to work with dependency-injected services, making it testable and adaptable to different deployment architectures.

---

## File Structure

```
admin/
  index.ts          # Single entry point — creates and exports the Express Router
```

The module is intentionally lightweight: a single `index.ts` file exports one primary factory function, `createAdminRouter(deps)`, which returns a fully configured Express `Router` instance. All sub-services (session manager, tool registry, tenant manager, etc.) are injected via the `AdminDeps` interface, keeping the module decoupled from concrete implementations.

---

## Class / Function API

### `AdminDeps` Interface

All dependencies are injected through this interface. Each property is optional except `gateway` and `sessionManager`, which are required for basic functionality.

```typescript
export interface AdminDeps {
  gateway: any;          // The API gateway instance (required)
  sessionManager: any;   // Session manager (required)
  toolRegistry?: any;    // Tool registry for managing available tools
  tenantManager?: any;   // Multi-tenant management
  secretManager?: any;   // Secrets / credential management
  auditLogger?: any;     // Audit log access
  authManager?: any;     // Authentication / user management
}
```

### `createAdminRouter(deps: AdminDeps): Router`

Factory function that creates and returns a fully configured Express `Router`. The router mounts all admin endpoints under a common path prefix (typically `/admin` when mounted by the parent application).

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `deps` | `AdminDeps` | Yes | Dependency object containing gateway, session manager, and optional services |

**Returns:** `express.Router` — An Express router with all admin endpoints registered.

---

## Endpoints Reference

### System Overview

#### `GET /overview`

Returns system-level diagnostics including process uptime, Node.js version, platform, architecture, memory usage, and CPU usage.

**Response:**
```json
{
  "uptime": 3600.12,
  "nodeVersion": "v20.11.0",
  "platform": "linux",
  "arch": "x64",
  "memoryUsage": { "rss": 123456789, "heapTotal": 45678901, "heapUsed": 34567890, "external": 1234567, "arrayBuffers": 123456 },
  "cpuUsage": { "user": 123456, "system": 65432 }
}
```

### Gateway Stats

#### `GET /gateway/stats`

Returns the current state of the gateway including registered channels, providers, agents, and health status.

**Response:**
```json
{
  "channels": ["slack", "discord", "webchat"],
  "providers": ["openai", "anthropic"],
  "agents": ["agent-1", "agent-2"],
  "healthy": true
}
```

### Session Management

#### `GET /sessions`

Lists active sessions with pagination support.

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | `number` | `100` | Maximum number of sessions to return |
| `offset` | `number` | `0` | Number of sessions to skip |

**Response:**
```json
{
  "total": 250,
  "sessions": [
    {
      "id": "sess-abc123",
      "channel": "slack",
      "userId": "user-42",
      "messageCount": 15,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T01:00:00.000Z"
    }
  ]
}
```

#### `DELETE /sessions`

Bulk-deletes sessions. Supports filtering by channel, userId, and age.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `channel` | `string` | Filter by channel name |
| `userId` | `string` | Filter by user ID |
| `olderThan` | `number` | Delete sessions older than this many milliseconds |

**Response:**
```json
{ "deleted": 42 }
```

#### `POST /sessions/:id/message`

Manually inject a message into a session (useful for debugging or administrative broadcasts).

**Request Body:**
```json
{ "role": "assistant", "content": "System maintenance in 10 minutes." }
```

**Response:**
```json
{ "ok": true, "messageCount": 16 }
```

### Tool Management

#### `GET /tools`

Lists all registered tools in the gateway.

**Response:**
```json
{
  "tools": [
    { "name": "web_search", "description": "Search the web" },
    { "name": "code_exec", "description": "Execute code" }
  ]
}
```

#### `POST /tools/:name/disable`

Disables (unregisters) a tool by name.

**Response:**
```json
{ "ok": true }
```

### Tenant Management

#### `GET /tenants`

Lists all registered tenants.

**Response:**
```json
{
  "tenants": [
    { "id": "tenant-1", "name": "Acme Corp", "status": "active" }
  ]
}
```

#### `GET /tenants/stats`

Returns aggregate statistics across all tenants.

### Secret Management

#### `GET /secrets`

Lists secret names (not values) for auditing purposes.

**Response:**
```json
{ "secrets": ["OPENAI_API_KEY", "SLACK_BOT_TOKEN"] }
```

#### `POST /secrets`

Creates or updates a secret.

**Request Body:**
```json
{
  "name": "MY_SECRET",
  "value": "sensitive-value-here",
  "allowedRoles": ["admin", "operator"]
}
```

**Response:**
```json
{ "ok": true }
```

### Audit Log

#### `GET /audit`

Retrieves recent audit events with optional filtering.

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | `string` | Filter by event type |
| `actor` | `string` | Filter by actor name/ID |
| `limit` | `number` | Maximum events to return (default: 100) |

**Response:**
```json
{
  "events": [
    { "type": "auth:login", "actor": "admin", "timestamp": 1704067200000, "data": {} }
  ],
  "total": 1
}
```

#### `GET /audit/verify`

Verifies the integrity of the audit log chain (tamper detection).

**Response:**
```json
{ "valid": true }
```

### Auth Management

#### `GET /auth/stats`

Returns authentication statistics (login counts, failure rates, etc.).

#### `POST /auth/users`

Creates a new user.

**Request Body:**
```json
{
  "username": "newadmin",
  "password": "secure-password",
  "role": "admin",
  "tenantId": "tenant-1"
}
```

**Response (201):**
```json
{ "id": "user-123", "username": "newadmin", "role": "admin" }
```

### Configuration

#### `GET /config`

Returns the current gateway configuration with all sensitive values (tokens, keys, secrets, passwords) masked as `***`.

#### `PUT /config`

Updates and persists the gateway configuration.

**Request Body:** Full or partial configuration object.

**Response:**
```json
{ "ok": true }
```

### System Actions

#### `POST /actions/clear-cache`

Clears the application cache.

**Response:**
```json
{ "ok": true, "action": "cache-cleared" }
```

#### `POST /actions/rotate-keys`

Rotates the master encryption key via the secret manager.

**Response:**
```json
{ "ok": true, "action": "keys-rotated" }
```

#### `POST /actions/audit-rotate`

Rotates old audit log files based on retention policy.

**Response:**
```json
{ "ok": true, "deleted": 3 }
```

---

## Configuration Options

This module itself has no standalone configuration file. It reads and writes the gateway's global configuration through the `../config` module. Configuration of the admin endpoints is handled entirely through the `AdminDeps` injection:

- **Dependency availability**: Each optional feature (tools, tenants, secrets, audit, auth) gracefully degrades if its dependency is not provided, returning empty collections or `501 Not Implemented` errors.
- **Sensitive value masking**: The `GET /config` endpoint automatically redacts any configuration key matching `/token|key|secret|password/i` to prevent accidental exposure.

---

## Usage Examples

### Basic Setup

```typescript
import { createAdminRouter } from './src/admin/index.js';
import { createApiGateway } from './src/api-gateway/index.js';
import { createSessionManager } from './src/session-manager/index.js';
import express from 'express';

const app = express();
app.use(express.json());

const gateway = createApiGateway();
const sessionManager = createSessionManager();

const adminRouter = createAdminRouter({
  gateway,
  sessionManager,
});

app.use('/admin', adminRouter);
app.listen(8080);
```

### Full Setup with All Services

```typescript
const adminRouter = createAdminRouter({
  gateway,
  sessionManager,
  toolRegistry: createToolRegistry(),
  tenantManager: createTenantManager(),
  secretManager: createSecretManager(),
  auditLogger: getAuditLogger(),
  authManager: createAuthManager(),
});
```

### Listing and Cleaning Sessions via API

```bash
# List sessions (first page)
curl http://localhost:8080/admin/sessions?limit=50&offset=0

# Delete sessions older than 1 hour (3600000ms)
curl -X DELETE 'http://localhost:8080/admin/sessions?olderThan=3600000'

# Check system health
curl http://localhost:8080/admin/overview
```

### Verifying Audit Chain Integrity

```bash
curl http://localhost:8080/admin/audit/verify
# Response: { "valid": true }
```

---

## Integration Points

| Module | Integration |
|--------|-------------|
| `../infra` | Uses `logger` for request/event logging |
| `../api-gateway` | Reads gateway state via `AdminDeps.gateway` |
| `../session-manager` | Session CRUD via `AdminDeps.sessionManager` |
| `../tool-registry` | Tool listing and disable via `AdminDeps.toolRegistry` |
| `../tenant-manager` | Tenant listing and stats via `AdminDeps.tenantManager` |
| `../secrets` | Secret listing, creation, and key rotation via `AdminDeps.secretManager` |
| `../audit` or `../audit-logger` | Audit event retrieval and verification via `AdminDeps.auditLogger` |
| `../auth` | Auth stats and user creation via `AdminDeps.authManager` |
| `../config` | Dynamic config read/write via `require('../config/index.js')` |

---

## Error Handling

The admin module follows a consistent error-handling pattern:

1. **400 Bad Request**: Missing required fields (e.g., `POST /secrets` without `name`/`value`, `POST /auth/users` without `username`/`password`).
2. **404 Not Found**: Referenced resource does not exist (e.g., `POST /sessions/:id/message` for a non-existent session).
3. **501 Not Implemented**: Optional dependency not provided (e.g., `POST /tools/:name/disable` when `toolRegistry` is absent).
4. **Generic errors**: Caught errors from underlying services are returned as `400` with the error message in the response body.

All errors return JSON with an `error` field:
```json
{ "error": "Session not found" }
```

---

## Security Considerations

- The admin module does **not** include built-in authentication or authorization. It is the responsibility of the consuming application to mount the router behind appropriate auth middleware.
- Sensitive configuration values are automatically masked in `GET /config` responses.
- Secret values are never returned by `GET /secrets` -- only secret names are listed.
- Audit log tamper detection via `GET /audit/verify` uses HMAC-SHA256 chained hashes.

---

## Related Documentation

- [API Gateway Module](../api-gateway/README.md) — The gateway instance used by admin endpoints
- [Audit Module](../audit/README.md) — Audit log structure and tamper detection
- [Audit Logger Module](../audit-logger/README.md) — Alternative audit logger implementation
- [Backup Module](../backup/README.md) — Backup and restore operations
- [Configuration Module](../config/README.md) — Gateway configuration management
