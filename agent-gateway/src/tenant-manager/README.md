# Tenant Manager Module

## Overview

The Tenant Manager module (`src/tenant-manager/`) provides comprehensive multi-tenant management for the Agent Gateway. It handles tenant lifecycle (create, update, suspend, activate), per-tenant configuration (settings, allowed models/channels/tools), quota enforcement (requests, tokens, sessions, storage, API keys), API key management, and usage tracking.

This is the more feature-rich of the two tenant management modules in the gateway. It includes plan-based default quotas (free, starter, pro, enterprise), detailed usage tracking, and SHA-256 hashed API key validation.

### Differences from `src/tenant-manager/`

The gateway contains two tenant management modules:

| Aspect                  | `src/tenant-manager/` (this module)             | `src/tenant-manager/`                                |
|-------------------------|-------------------------------------------------|-----------------------------------------------|
| **Data Model**          | Full `Tenant` with `plan`, `status`, `settings`, `quotas`, `usage` | Simpler `TenantConfig` with `allowedProviders`, `maxSessions`, etc. |
| **Plans**               | Plan-based quotas (free/starter/pro/enterprise)  | No plan system; per-tenant manual config      |
| **Status**              | `active`, `suspended`, `deleted`                 | No status field                               |
| **Settings**            | Rich `TenantSettings` (models, channels, tools, streaming, web search, file access, bash) | Basic `allowedProviders`, `allowedChannels`, `allowedTools` |
| **Quotas**              | Structured `TenantQuotas` with 6 quota types    | Simple `maxDailyTokens`, `maxSessions`, `rateLimitPerMinute` |
| **API Key Format**      | `agw_{tenantId}_{uuid}`                         | `agw_{tenantId}_{uuid}` (same)               |
| **Key Permissions**     | Configurable at creation                         | Configurable at creation                      |
| **Provider/Tool Checks**| Not available                                    | `canUseProvider()`, `canUseTool()` methods    |
| **Events**              | Emits `tenant:created`, `tenant:updated`, `tenant:suspended`, `tenant:activated` | No event emission |
| **List/Filter**         | `list(status?)` with status filtering            | `listTenants()` (no filtering)               |
| **Key Revocation**      | Implicit (via `revoked` flag on validation)     | Explicit `revokeApiKey()` method              |

Use `src/tenant-manager/` when you need plan-based quotas, detailed settings, status management, and event-driven tenant lifecycle. Use `src/tenant-manager/` for a simpler model with provider/tool permission checks.

## File Structure

```
src/tenant-manager/
  index.ts          # Tenant manager with plans, quotas, API keys, and events
```

The module imports `randomUUID` and `createHash` from `crypto`, `EventEmitter` from `events`, and the shared `logger` from `../infra/index.js`.

## Class and Function API

### Interfaces

#### `Tenant`

```typescript
interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'deleted';
  settings: TenantSettings;
  quotas: TenantQuotas;
  usage: TenantUsage;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}
```

#### `TenantSettings`

```typescript
interface TenantSettings {
  systemPrompt?: string;
  allowedModels: string[];
  allowedChannels: string[];
  allowedTools: string[];
  enableStreaming: boolean;
  enableWebSearch: boolean;
  enableFileAccess: boolean;
  enableBash: boolean;
  maxConcurrentSessions: number;
  webhookUrl?: string;
  timezone?: string;
  locale?: string;
}
```

#### `TenantQuotas`

```typescript
interface TenantQuotas {
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  maxTokensPerDay: number;
  maxSessions: number;
  maxStorageBytes: number;
  maxApiKeys: number;
}
```

#### `TenantUsage`

```typescript
interface TenantUsage {
  requestsToday: number;
  tokensToday: number;
  activeSessions: number;
  storageBytes: number;
  apiKeys: number;
  lastActivityAt: number;
}
```

#### `TenantApiKey`

```typescript
interface TenantApiKey {
  id: string;
  tenantId: string;
  name: string;
  keyHash: string;
  permissions: string[];
  createdAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  revoked: boolean;
}
```

### Default Quotas by Plan

```typescript
const DEFAULT_QUOTAS = {
  free:       { maxRequestsPerMinute: 10,   maxRequestsPerDay: 1000,    maxTokensPerDay: 50000,     maxSessions: 5,    maxStorageBytes: 10MB,   maxApiKeys: 1 },
  starter:    { maxRequestsPerMinute: 60,   maxRequestsPerDay: 10000,   maxTokensPerDay: 500000,    maxSessions: 20,   maxStorageBytes: 100MB,  maxApiKeys: 5 },
  pro:        { maxRequestsPerMinute: 300,  maxRequestsPerDay: 100000,  maxTokensPerDay: 5000000,   maxSessions: 100,  maxStorageBytes: 1GB,    maxApiKeys: 20 },
  enterprise: { maxRequestsPerMinute: 1000, maxRequestsPerDay: 1000000, maxTokensPerDay: 50000000,  maxSessions: 1000, maxStorageBytes: 10GB,   maxApiKeys: 100 },
};
```

### `TenantManager` Class

The main tenant manager class. Extends `EventEmitter`.

#### Constructor

```typescript
constructor()
```

Takes no arguments. All data is in-memory.

#### Methods

**`create(data: { name: string; plan?: string; settings?: Partial<TenantSettings>; metadata?: Record<string, any>; }): Promise<Tenant>`**

Creates a new tenant with a UUID. Defaults to `free` plan. Merges provided settings with plan defaults. Initializes usage counters to zero. Emits `tenant:created`.

**`get(id: string): Tenant | undefined`**

Retrieves a tenant by ID. Returns `undefined` if not found.

**`update(id: string, updates: Partial<Pick<Tenant, 'settings' | 'plan' | 'metadata'>>): Tenant | null`**

Updates tenant settings, plan, or metadata. Changing the plan resets quotas to the new plan's defaults. Emits `tenant:updated`.

**`suspend(id: string): boolean`**

Sets tenant status to `suspended`. Returns `false` if not found. Emits `tenant:suspended`.

**`activate(id: string): boolean`**

Sets tenant status to `active`. Returns `false` if not found. Emits `tenant:activated`.

**`checkQuota(tenantId: string, tokens?: number): { allowed: boolean; reason?: string }`**

Checks if the tenant is within daily request, token, and session quotas. Returns `{ allowed: false, reason }` if any quota is exceeded.

**`recordUsage(tenantId: string, tokens?: number): void`**

Increments daily request count and token usage. Updates `lastActivityAt`. No-op if tenant not found.

**`resetDailyUsage(): void`**

Resets `requestsToday` and `tokensToday` to zero for all tenants. Should be called on a daily schedule (e.g., via cron).

**`createApiKey(tenantId: string, name: string, permissions?: string[], expiresAt?: number): { key: string; apiKey: TenantApiKey }`**

Creates an API key for a tenant. Returns the plaintext key (prefix `agw_{tenantId}_{uuid}`) and the stored API key record (which contains only the SHA-256 hash). Throws if tenant not found or max API keys exceeded.

**`validateApiKey(key: string): { tenant: Tenant; apiKey: TenantApiKey } | null`**

Validates a plaintext API key by hashing it and looking up the stored hash. Returns `null` if the key is invalid, revoked, expired, or the tenant is not active. Updates `lastUsedAt` on success.

**`list(status?: 'active' | 'suspended' | 'deleted'): Tenant[]`**

Returns all tenants, optionally filtered by status.

**`getStats(): { totalTenants: number; byPlan: Record<string, number>; byStatus: Record<string, number>; totalApiKeys: number }`**

Returns aggregate tenant statistics.

### Factory Function

```typescript
function createTenantManager(): TenantManager
```

Convenience factory that returns a new `TenantManager` instance.

## Configuration Options

The tenant manager is entirely in-memory with no external configuration. All configuration is per-tenant and set via the `create()` and `update()` methods.

### Default Settings (per tenant)

| Setting               | Default Value                                    |
|-----------------------|--------------------------------------------------|
| `allowedModels`       | `['gpt-4o', 'gpt-4o-mini']`                      |
| `allowedChannels`     | `['webchat']`                                    |
| `allowedTools`        | `['bash', 'filesystem', 'web_search']`           |
| `enableStreaming`     | `true`                                           |
| `enableWebSearch`     | `true`                                           |
| `enableFileAccess`    | `true`                                           |
| `enableBash`          | `true`                                           |
| `maxConcurrentSessions`| `10`                                            |

## Usage Examples

### Creating Tenants

```typescript
import { createTenantManager } from './src/tenant-manager/index.js';

const tenants = createTenantManager();

// Create a free-tier tenant
const freeTenant = await tenants.create({
  name: 'hobby-user',
});

// Create a pro-tier tenant with custom settings
const proTenant = await tenants.create({
  name: 'power-user',
  plan: 'pro',
  settings: {
    allowedModels: ['gpt-4o', 'gpt-4o-mini', 'claude-3-opus'],
    allowedChannels: ['webchat', 'slack', 'discord'],
    enableBash: false,
    maxConcurrentSessions: 50,
    systemPrompt: 'You are a helpful assistant for power users.',
  },
  metadata: { department: 'engineering', costCenter: 'ENG-001' },
});
```

### API Key Management

```typescript
// Create API keys
const { key: plaintextKey, apiKey } = tenants.createApiKey(
  proTenant.id,
  'production-key',
  ['chat', 'stream'],
  Date.now() + 365 * 24 * 60 * 60 * 1000, // 1-year expiry
);

console.log(plaintextKey); // 'agw_<tenantId>_<uuid>' -- save this, it cannot be retrieved again

// Validate API key (e.g., in request middleware)
const result = tenants.validateApiKey(plaintextKey);
if (result) {
  console.log('Tenant:', result.tenant.name);
  console.log('Permissions:', result.apiKey.permissions);
} else {
  return { status: 401, body: 'Invalid API key' };
}
```

### Quota Enforcement

```typescript
// In request handler
function handleRequest(tenantId: string, estimatedTokens: number) {
  const quotaCheck = tenants.checkQuota(tenantId, estimatedTokens);
  if (!quotaCheck.allowed) {
    return { status: 429, body: quotaCheck.reason };
  }

  // Process the request...
  tenants.recordUsage(tenantId, estimatedTokens);
}

// Daily reset (call from cron job)
tenants.resetDailyUsage();
```

### Tenant Suspension

```typescript
// Suspend a tenant (e.g., for non-payment)
tenants.suspend(tenantId);

// They can no longer pass quota checks
const check = tenants.checkQuota(tenantId);
console.log(check); // { allowed: false, reason: 'Tenant is suspended' }

// Reactivate later
tenants.activate(tenantId);
```

### Event-Driven Monitoring

```typescript
tenants.on('tenant:created', (tenant) => {
  logger.info({ tenantId: tenant.id, plan: tenant.plan }, 'New tenant');
  // Could trigger welcome email, provisioning, etc.
});

tenants.on('tenant:updated', (tenant) => {
  logger.info({ tenantId: tenant.id }, 'Tenant updated');
});

tenants.on('tenant:suspended', (tenant) => {
  logger.warn({ tenantId: tenant.id }, 'Tenant suspended');
  // Could notify the tenant, revoke API keys, etc.
});

tenants.on('tenant:activated', (tenant) => {
  logger.info({ tenantId: tenant.id }, 'Tenant activated');
});
```

### Tenant Reporting

```typescript
const stats = tenants.getStats();
console.log(`Total tenants: ${stats.totalTenants}`);
console.log('By plan:', stats.byPlan);
console.log('By status:', stats.byStatus);
console.log('Total API keys:', stats.totalApiKeys);

// List active tenants
const active = tenants.list('active');
console.log(`${active.length} active tenants`);

// Get individual tenant details
const tenant = tenants.get(active[0].id);
console.log('Settings:', tenant.settings);
console.log('Quotas:', tenant.quotas);
console.log('Usage:', tenant.usage);
```

## Integration Points

### With Rate Limiter

Enforce per-tenant rate limits:

```typescript
const limiter = createRateLimiter({ max: 100, window: 60 });

async function rateLimitMiddleware(req, res) {
  const tenantId = req.headers['x-tenant-id'];
  if (!tenantId) return res.status(401).json({ error: 'Missing tenant ID' });

  const tenant = tenants.get(tenantId);
  if (!tenant || tenant.status !== 'active') {
    return res.status(403).json({ error: 'Tenant not active' });
  }

  const result = await limiter.check(`tenant:${tenantId}`);
  if (!result.allowed) {
    return res.status(429).json({ retryAfter: result.retryAfter });
  }

  next();
}
```

### With Rule Engine

Rules can enforce tenant-specific policies:

```typescript
engine.addRule({
  id: 'tenant-model-access',
  name: 'Tenant Model Access Control',
  condition: {
    operator: 'and',
    conditions: [
      { field: 'request.model', operator: 'notIn', value: tenant.settings.allowedModels },
    ],
  },
  actions: [
    { type: 'reject', params: { reason: 'Model not allowed for tenant' } },
  ],
  priority: 1000,
  enabled: true,
  category: 'tenant-policy',
});
```

### With Queue Module

Tenant-scoped message routing:

```typescript
queue.subscribe('tenant-events', async (msg) => {
  const tenant = tenants.get(msg.headers?.tenantId);
  if (!tenant || tenant.status !== 'active') return;

  await processTenantEvent(tenant, msg.payload);
  tenants.recordUsage(tenant.id);
});
```

### With Service Registry

Per-tenant service routing:

```typescript
const instance = registry.getInstance(`${tenant.settings.allowedModels[0]}-service`);
if (!instance) {
  return { status: 503, body: 'Service unavailable' };
}
```

### With Pipeline

Tenant-aware pipeline processing:

```typescript
const pipeline = createDataPipeline({
  name: 'tenant-pipeline',
  stages: [
    {
      name: 'apply-tenant-settings',
      process: (data) => {
        const tenant = tenants.get(data.tenantId);
        if (!tenant) throw new Error('Tenant not found');
        return {
          ...data,
          systemPrompt: tenant.settings.systemPrompt,
          maxTokens: tenant.quotas.maxTokensPerDay,
        };
      },
    },
  ],
});
```

## Error Handling

### Quota Checks

`checkQuota()` returns `{ allowed: false, reason }` for:
- Tenant not found
- Tenant status is not `active`
- Daily request limit exceeded
- Daily token limit exceeded
- Max concurrent sessions exceeded

The caller is responsible for enforcing the check (the manager does not auto-reject).

### API Key Errors

`createApiKey()` throws `Error('Tenant not found')` or `Error('Max API keys exceeded')`. These should be caught by the caller.

`validateApiKey()` returns `null` (never throws) for:
- Unknown key hash
- Revoked key
- Expired key (auto-revokes on first expired access)
- Inactive or non-existent tenant

### Plan Upgrade

When updating a tenant's plan, quotas are immediately reset to the new plan's defaults. Existing usage counters are NOT reset -- they continue accumulating. This means a tenant upgraded mid-day will have new, higher quotas but their existing usage counts remain.

### Daily Usage Reset

`resetDailyUsage()` must be called externally (e.g., via cron at midnight). It resets all tenants' `requestsToday` and `tokensToday` to zero. There is no automatic reset.

## Related Documentation

- **Tenants Module (simpler alternative)**: `/home/runner/workspace/agent-gateway/src/tenant-manager/README.md`
- **Rate Limiter**: `/home/runner/workspace/agent-gateway/src/rate-limiter/README.md`
- **Rule Engine**: `/home/runner/workspace/agent-gateway/src/rule-engine/README.md`
- **Queue Module**: `/home/runner/workspace/agent-gateway/src/queue/README.md`
- **Pipeline Module**: `/home/runner/workspace/agent-gateway/README.md`
- **Service Registry**: `/home/runner/workspace/agent-gateway/src/service-registry/README.md`
