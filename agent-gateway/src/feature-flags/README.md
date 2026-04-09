# Feature Flags (`src/feature-flags/`)

> **Runtime-toggleable features with per-tenant targeting, rollout percentages, and A/B test support.**

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture](#architecture)
4. [Class API](#class-api)
5. [Feature Flag Types](#feature-flag-types)
6. [Flag Evaluation](#flag-evaluation)
7. [Configuration Options](#configuration-options)
8. [Usage Examples](#usage-examples)
9. [Targeting Rules](#targeting-rules)
10. [Rollout Percentages](#rollout-percentages)
11. [A/B Testing with Variants](#ab-testing-with-variants)
12. [Tenant Overrides](#tenant-overrides)
13. [Evaluation Logging](#evaluation-logging)
14. [Error Handling](#error-handling)
15. [Integration Points](#integration-points)
16. [Best Practices](#best-practices)
17. [Related Documentation](#related-documentation)

---

## Overview

The `feature-flags/` module provides a **runtime feature flag management system** for the Agent Gateway. It allows operators to toggle features on and off, roll out features gradually to a percentage of users, target specific tenants with custom values, define A/B test variants, and apply complex targeting rules -- all without restarting the gateway.

### Why Feature Flags Matter

Feature flags are essential for operating a production AI gateway:

- **Safe deployments** -- enable new features for a small percentage of traffic first
- **Tenant isolation** -- different customers can have different feature sets
- **A/B testing** -- compare provider performance, prompt templates, or UI variants
- **Emergency kill switches** -- instantly disable problematic features
- **Gradual rollouts** -- ramp up features from 1% to 100% over time
- **Environment parity** -- enable experimental features in staging but not production

### Key Features

- **Four flag types** -- boolean, percentage, variant, and JSON
- **Per-tenant overrides** -- specific values for specific tenants
- **Targeting rules** -- attribute-based conditions (eq, neq, contains, gt, lt)
- **Consistent rollout** -- hash-based bucket assignment ensures users always get the same variant
- **Evaluation logging** -- track which flags are evaluated and what results are returned
- **Real-time toggling** -- change flag values without restart
- **Stats and auditing** -- track evaluation counts and review recent evaluations

---

## File Structure

```
feature-flags/
├── index.ts          # FeatureFlagManager, factory, type definitions
```

The module is implemented in a single file (~160 lines) containing the flag manager with registration, evaluation, targeting, rollout, variant selection, and logging logic.

---

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                    FeatureFlagManager                          │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 Flag Registry                            │  │
│  │                                                         │  │
│  │  ┌───────────────────────────────────────────────────┐  │  │
│  │  │ FeatureFlag                                       │  │  │
│  │  │  key: "new-provider-routing"                      │  │  │
│  │  │  type: "boolean"                                  │  │  │
│  │  │  enabled: true                                    │  │  │
│  │  │  description: "Route to providers via new logic"   │  │  │
│  │  │  defaultValue: false                              │  │  │
│  │  │  tenantOverrides: { "acme": true }                │  │  │
│  │  │  targetingRules: [                                 │  │  │
│  │  │    { attribute: "channelId", operator: "eq",       │  │  │
│  │  │      value: "slack", result: true }                │  │  │
│  │  │  ]                                                │  │  │
│  │  │  createdAt: 1712345678901                         │  │  │
│  │  │  updatedAt: 1712345678901                         │  │  │
│  │  └───────────────────────────────────────────────────┘  │  │
│  │                                                         │  │
│  │  [Flag 1]  [Flag 2]  [Flag 3]  ...                      │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Evaluation Pipeline                        │  │
│  │                                                         │  │
│  │  1. Check if flag exists                                │  │
│  │  2. Check if flag is enabled                            │  │
│  │  3. Check tenant overrides                              │  │
│  │  4. Evaluate targeting rules                            │  │
│  │  5. Apply percentage rollout                            │  │
│  │  6. Select variant (if type=variant)                    │  │
│  │  7. Return default value                                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │              Evaluation Log                             │  │
│  │                                                         │  │
│  │  [{ flag, context, result, timestamp }, ...]            │  │
│  │  (max 10000 entries)                                    │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Evaluation Order

Flag evaluation follows a strict priority order:

```
evaluate(key, context)
    │
    ▼
Flag exists? ──NO──► return null
    │
    YES
    ▼
Flag enabled? ──NO──► return defaultValue
    │
    YES
    ▼
Tenant override? ──YES──► return override value
    │
    NO
    ▼
Targeting rules match? ──YES──► return matching rule result
    │
    NO
    ▼
Percentage rollout? ──► Hash context, check bucket
    │
    ▼
Variant type? ──► Hash userId, select variant
    │
    ▼
JSON type? ──► return defaultValue
    │
    ▼
Boolean type ──► return true (flag is enabled, no conditions matched)
```

---

## Class API

### Types

```typescript
type FeatureFlagType = 'boolean' | 'percentage' | 'variant' | 'json';

interface FeatureFlag {
  key: string;                           // Unique flag identifier
  type: FeatureFlagType;                 // Flag type
  enabled: boolean;                      // Whether the flag is active
  description: string;                   // Human-readable description
  rolloutPercentage?: number;            // 0-100 for percentage type
  variants?: string[];                   // Variant names for A/B testing
  defaultValue: any;                     // Value when flag is off/no conditions match
  tenantOverrides?: Record<string, any>; // Per-tenant value overrides
  targetingRules?: Array<{               // Attribute-based targeting
    attribute: string;
    operator: 'eq' | 'neq' | 'contains' | 'gt' | 'lt';
    value: any;
    result: any;
  }>;
  createdAt: number;                     // Registration timestamp
  updatedAt: number;                     // Last update timestamp
}

interface FlagEvaluationContext {
  tenantId?: string;
  userId?: string;
  channelId?: string;
  [key: string]: any;                    // Any additional attributes
}
```

### `FeatureFlagManager` Class

```typescript
class FeatureFlagManager extends EventEmitter {
  constructor()

  // Registration
  register(flag: Omit<FeatureFlag, 'createdAt' | 'updatedAt'>): void
  update(key: string, updates: Partial<FeatureFlag>): boolean
  toggle(key: string, enabled: boolean): boolean
  setRollout(key: string, percentage: number): boolean

  // Evaluation
  evaluate(key: string, context?: FlagEvaluationContext): any
  evaluateAll(context?: FlagEvaluationContext): Record<string, any>

  // Inspection
  getFlag(key: string): FeatureFlag | undefined
  listFlags(): Array<{ key: string; enabled: boolean; type: FeatureFlagType; rolloutPercentage?: number }>
  getStats(): { totalFlags: number; enabledFlags: number; evaluationCount: number }

  // Audit
  getEvaluationLog(limit?: number): Array<{ key: string; context: FlagEvaluationContext; result: any; timestamp: number }>

  // Events
  on(event: 'flag:updated', listener: (data: { key: string; updates: Partial<FeatureFlag> }) => void): this
}
```

### Factory Function

```typescript
function createFeatureFlagManager(): FeatureFlagManager
```

---

## Feature Flag Types

### Boolean

Simple on/off toggle:

```typescript
manager.register({
  key: 'new-ui',
  type: 'boolean',
  enabled: true,
  description: 'Enable the new dashboard UI',
  defaultValue: false,
});

// Evaluation
manager.evaluate('new-ui', { tenantId: 'acme' });
// true (flag is enabled, no conditions matched, boolean type)

manager.evaluate('new-ui', { tenantId: 'beta-tester' });
// true (same -- no tenant override or targeting rules matched)

// Disable
manager.toggle('new-ui', false);
manager.evaluate('new-ui', {});
// false (flag disabled, returns defaultValue)
```

### Percentage

Roll out to a percentage of users:

```typescript
manager.register({
  key: 'experimental-provider',
  type: 'percentage',
  enabled: true,
  description: 'Gradually roll out experimental AI provider',
  defaultValue: false,
  rolloutPercentage: 10, // 10% of users
});

// 10% of users get true, 90% get false
// Assignment is consistent per context (same context always gets same result)
```

### Variant

A/B test with multiple variants:

```typescript
manager.register({
  key: 'prompt-template',
  type: 'variant',
  enabled: true,
  description: 'A/B test prompt templates',
  defaultValue: 'default',
  variants: ['default', 'concise', 'verbose'],
});

// User is consistently assigned to one variant based on hash of userId
manager.evaluate('prompt-template', { userId: 'user-123' });
// 'concise' (or 'default' or 'verbose' -- consistent for this userId)
```

### JSON

Complex configuration objects:

```typescript
manager.register({
  key: 'rate-limits',
  type: 'json',
  enabled: true,
  description: 'Rate limit configuration',
  defaultValue: {
    requestsPerMinute: 60,
    burstSize: 10,
    retryAfter: 30,
  },
});

const limits = manager.evaluate('rate-limits', { tenantId: 'acme' });
// { requestsPerMinute: 60, burstSize: 10, retryAfter: 30 }
```

---

## Flag Evaluation

### The Evaluate Method

```typescript
evaluate(key: string, context?: FlagEvaluationContext): any
```

The evaluation follows a strict priority chain (documented in the Architecture section). Each step can short-circuit and return a value.

### The EvaluateAll Method

```typescript
evaluateAll(context?: FlagEvaluationContext): Record<string, any>
```

Evaluates every registered flag for the given context:

```typescript
const allFlags = manager.evaluateAll({ tenantId: 'acme', userId: 'user-123' });
// {
//   'new-ui': true,
//   'experimental-provider': false,
//   'prompt-template': 'concise',
//   'rate-limits': { requestsPerMinute: 60, burstSize: 10, retryAfter: 30 },
//   'dark-mode': true,
// }
```

---

## Configuration Options

The `FeatureFlagManager` has no constructor options -- all configuration is done through flag registration.

### Flag Registration Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `key` | `string` | Yes | Unique identifier for the flag |
| `type` | `FeatureFlagType` | Yes | One of `boolean`, `percentage`, `variant`, `json` |
| `enabled` | `boolean` | Yes | Master toggle -- if false, always returns `defaultValue` |
| `description` | `string` | Yes | Human-readable description for operators |
| `defaultValue` | `any` | Yes | Value returned when flag is off or no conditions match |
| `rolloutPercentage` | `number` | No | 0-100 for percentage type flags |
| `variants` | `string[]` | No | List of variant names for variant type flags |
| `tenantOverrides` | `Record<string, any>` | No | Per-tenant value overrides |
| `targetingRules` | `TargetingRule[]` | No | Attribute-based conditional rules |

---

## Usage Examples

### Basic Boolean Flag

```typescript
import { createFeatureFlagManager } from '../feature-flags/index.js';

const manager = createFeatureFlagManager();

// Register
manager.register({
  key: 'dark-mode',
  type: 'boolean',
  enabled: true,
  description: 'Enable dark mode in the dashboard',
  defaultValue: false,
});

// Evaluate
const isDarkMode = manager.evaluate('dark-mode', { userId: 'user-123' });
if (isDarkMode) {
  renderDarkTheme();
}
```

### Tenant-Specific Overrides

```typescript
manager.register({
  key: 'advanced-analytics',
  type: 'boolean',
  enabled: true,
  description: 'Advanced analytics dashboard',
  defaultValue: false,
  tenantOverrides: {
    'enterprise-corp': true,
    'startup-inc': true,
    'free-tier': false,
  },
});

manager.evaluate('advanced-analytics', { tenantId: 'enterprise-corp' });
// true (tenant override)

manager.evaluate('advanced-analytics', { tenantId: 'regular-customer' });
// false (default -- flag is enabled but no conditions matched for boolean)
```

### Gradual Rollout

```typescript
manager.register({
  key: 'new-chat-model',
  type: 'percentage',
  enabled: true,
  description: 'Gradually roll out new chat model',
  defaultValue: false,
  rolloutPercentage: 5, // Start with 5%
});

// Gradually increase
manager.setRollout('new-chat-model', 5);   // Day 1: 5%
manager.setRollout('new-chat-model', 15);  // Day 3: 15%
manager.setRollout('new-chat-model', 50);  // Day 7: 50%
manager.setRollout('new-chat-model', 100); // Day 14: 100%
```

---

## Targeting Rules

Targeting rules provide attribute-based conditional logic. Rules are evaluated in order, and the first matching rule's `result` is returned.

### Supported Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal | `channelId === 'telegram'` |
| `neq` | Not equal | `tenantId !== 'internal'` |
| `contains` | String contains | `userId contains 'beta'` |
| `gt` | Greater than | `requestCount > 1000` |
| `lt` | Less than | `errorRate < 0.01` |

### Example: Channel-Specific Feature

```typescript
manager.register({
  key: 'streaming-responses',
  type: 'boolean',
  enabled: true,
  description: 'Enable streaming responses over WebSocket',
  defaultValue: false,
  targetingRules: [
    { attribute: 'channelId', operator: 'eq', value: 'slack', result: true },
    { attribute: 'channelId', operator: 'eq', value: 'discord', result: true },
    { attribute: 'version', operator: 'contains', value: 'beta', result: true },
  ],
});

// Slack users get streaming
manager.evaluate('streaming-responses', { channelId: 'slack' });
// true

// Telegram users don't get streaming (falls through to boolean default)
manager.evaluate('streaming-responses', { channelId: 'telegram' });
// true (boolean, enabled, no rules matched)
```

### Example: High-Value Customer Feature

```typescript
manager.register({
  key: 'premium-models',
  type: 'boolean',
  enabled: true,
  description: 'Access to premium AI models',
  defaultValue: false,
  targetingRules: [
    { attribute: 'plan', operator: 'eq', value: 'enterprise', result: true },
    { attribute: 'monthlySpend', operator: 'gt', value: 500, result: true },
    { attribute: 'tenantId', operator: 'contains', value: 'partner', result: true },
  ],
});
```

---

## Rollout Percentages

The percentage rollout uses a hash-based bucket assignment for consistency:

```typescript
private hashContext(key: string, context: FlagEvaluationContext): number {
  const str = `${key}:${JSON.stringify(context)}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32-bit integer
  }
  return Math.abs(hash);
}
```

### Consistency

The same context always gets the same result:

```typescript
// User-123 is in the 5% bucket
manager.evaluate('new-model', { userId: 'user-123' });
// true

// Always true for this user
manager.evaluate('new-model', { userId: 'user-123' });
// true

// But user-456 is in the 95% bucket
manager.evaluate('new-model', { userId: 'user-456' });
// false
```

### Sticky Assignment

The hash is computed from the flag key and the full context JSON, so changing any context attribute changes the bucket. For consistent user assignment, use `userId` or `tenantId` as the primary context attribute.

---

## A/B Testing with Variants

Variant flags provide sticky, user-consistent variant selection:

```typescript
manager.register({
  key: 'landing-page-design',
  type: 'variant',
  enabled: true,
  description: 'A/B test landing page designs',
  defaultValue: 'control',
  variants: ['control', 'variation-a', 'variation-b'],
});

// User is consistently assigned based on hash(userId)
manager.evaluate('landing-page-design', { userId: 'user-123' });
// 'variation-a'

manager.evaluate('landing-page-design', { userId: 'user-123' });
// 'variation-a' (always the same)

manager.evaluate('landing-page-design', { userId: 'user-456' });
// 'control' (different user, different assignment)
```

### Without userId

If `userId` is not in the context, `tenantId` is used. If neither exists, `'anonymous'` is used, meaning all anonymous users get the same variant:

```typescript
manager.evaluate('landing-page-design', {});
// All anonymous users get the same variant
```

---

## Tenant Overrides

Tenant overrides take the highest priority in the evaluation chain:

```typescript
manager.register({
  key: 'max-concurrent-sessions',
  type: 'json',
  enabled: true,
  description: 'Maximum concurrent sessions per tenant',
  defaultValue: { max: 10 },
  tenantOverrides: {
    'enterprise-corp': { max: 100 },
    'startup-inc': { max: 25 },
  },
});

manager.evaluate('max-concurrent-sessions', { tenantId: 'enterprise-corp' });
// { max: 100 }

manager.evaluate('max-concurrent-sessions', { tenantId: 'small-biz' });
// { max: 10 } (default value)
```

### Updating Overrides

```typescript
manager.update('max-concurrent-sessions', {
  tenantOverrides: {
    'enterprise-corp': { max: 200 },
    'startup-inc': { max: 50 },
    'new-customer': { max: 5 },
  },
});
```

---

## Evaluation Logging

Every evaluation is logged to an in-memory buffer (max 10,000 entries):

```typescript
manager.evaluate('dark-mode', { userId: 'user-123' });
manager.evaluate('new-model', { tenantId: 'acme' });
manager.evaluate('streaming-responses', { channelId: 'slack' });

// Get recent evaluations
const log = manager.getEvaluationLog(10);
// [
//   { key: 'dark-mode', context: { userId: 'user-123' }, result: true, timestamp: ... },
//   { key: 'new-model', context: { tenantId: 'acme' }, result: false, timestamp: ... },
//   { key: 'streaming-responses', context: { channelId: 'slack' }, result: true, timestamp: ... },
// ]
```

### Evaluation Stats

```typescript
const stats = manager.getStats();
// {
//   totalFlags: 15,
//   enabledFlags: 12,
//   evaluationCount: 45678,
// }
```

### Update Events

```typescript
manager.on('flag:updated', ({ key, updates }) => {
  logger.info({ key, changes: Object.keys(updates) }, `Feature flag updated: ${key}`);
  dashboard.pushEvent('audit', {
    type: 'feature_flag_updated',
    key,
    updates,
    timestamp: Date.now(),
  });
});
```

---

## Error Handling

### Unknown Flags

Evaluating a non-existent flag returns `null` and logs a debug message:

```typescript
manager.evaluate('nonexistent-flag', {});
// null
// DEBUG { key: "nonexistent-flag" } Feature flag not found, returning null
```

### Disabled Flags

Disabled flags always return their `defaultValue`, regardless of targeting rules or tenant overrides:

```typescript
manager.toggle('experimental-feature', false);
manager.evaluate('experimental-feature', { tenantId: 'acme' });
// false (or whatever the defaultValue is)
```

### Empty Context

The evaluator handles empty context gracefully:

```typescript
manager.evaluate('dark-mode', {});
// true or false (based on flag state and type)

manager.evaluateAll({});
// { 'dark-mode': true, 'new-model': false, ... }
```

---

## Integration Points

### With `src/content-moderator/`

Gate moderation features:

```typescript
if (manager.evaluate('content-moderation', { tenantId })) {
  const result = moderator.moderate(message);
  if (result.blocked) {
    return { error: 'Content blocked' };
  }
}
```

### With `src/cron/`

Enable/disable scheduled jobs:

```typescript
scheduler.register({
  name: 'embedding-maintenance',
  schedule: '0 0 * * *',
  enabled: manager.evaluate('embedding-auto-optimize', {}),
  handler: async () => {
    await optimizeEmbeddingStore();
  },
});
```

### With `src/dashboard/`

Expose feature flag state:

```typescript
dashboard.registerProvider('metrics', async () => {
  return {
    ...systemMetrics,
    featureFlags: manager.getStats(),
    recentEvaluations: manager.getEvaluationLog(5),
  };
}, 5000);
```

### With ``

Enable circuit breakers per provider:

```typescript
if (manager.evaluate('circuit-breaker-openai', { tenantId })) {
  return openaiBreaker.execute(() => callOpenAI());
}
return callOpenAI(); // No circuit breaker
```

### With `src/distributed-lock/`

Control lock usage:

```typescript
if (manager.evaluate('distributed-locks', {})) {
  return lockManager.withLock('config-update', 10000, async () => {
    await updateConfig();
  });
}
await updateConfig(); // No locking
```

### With `src/config-manager/`

React to config changes:

```typescript
configManager.on('config:changed', (event) => {
  if (event.key === 'featureFlags') {
    // Reload feature flags from config
    for (const [key, flag] of Object.entries(event.newValue)) {
      manager.update(key, flag);
    }
  }
});
```

---

## Best Practices

1. **Use descriptive flag keys** -- keys like `new-provider-routing-v2` are clearer than `feature-123`.

2. **Always provide sensible defaults** -- the `defaultValue` should be the safe, conservative option.

3. **Start small with rollouts** -- begin at 1-5% and gradually increase. Monitor error rates at each step.

4. **Use targeting rules for beta programs** -- `contains: 'beta'` on `userId` is a simple way to target beta testers.

5. **Clean up old flags** -- once a feature is fully rolled out and stable, remove the flag to reduce cognitive overhead.

6. **Audit evaluation logs** -- use `getEvaluationLog()` to debug unexpected flag results.

7. **Use variant type for A/B tests** -- the hash-based assignment ensures consistent user experience.

8. **Don't nest too many flags** -- if your code has `if (flag1) { if (flag2) { if (flag3) ... } }`, consider simplifying your feature flag strategy.

9. **Test with flags disabled** -- always verify your application works when new flags are turned off.

10. **Use `evaluateAll` for bootstrapping** -- when initializing a user session, call `evaluateAll(context)` once and cache the results.

---

## Related Documentation

- [`src/content-moderator/`](../content-moderator/README.md) -- Gate moderation features
- [`src/cron/`](../cron/README.md) -- Enable/disable scheduled jobs
- [`src/dashboard/`](../dashboard/README.md) -- Monitor feature flag state in real-time
- [``](../circuit-breaker/README.md) -- Enable circuit breakers per provider
- [`src/distributed-lock/`](../distributed-lock/README.md) -- Control locking behavior
- [`src/config-manager/`](../config-manager/README.md) -- Store and manage flag definitions
- [Martin Fowler: Feature Toggles](https://martinfowler.com/articles/feature-toggles.html) -- Comprehensive guide to feature toggles
- [LaunchDarkly: Feature Flags 101](https://launchdarkly.com/blog/what-are-feature-flags/) -- Industry-standard feature flag concepts
