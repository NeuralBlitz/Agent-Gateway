# Rule Engine Module

## Overview

The Rule Engine module provides a declarative, condition-based evaluation system for the Agent Gateway. It allows you to define business rules with complex conditions (including nested AND/OR/NOT logic), priority-ordered execution, configurable actions, and full audit trails.

The `RuleEngine` class extends Node.js `EventEmitter` and evaluates rules against arbitrary data objects. It supports 20+ comparison operators, dot-nested field access, configurable timeouts, first-match mode, and built-in action types including `set`, `tag`, `log`, `notify`, `reject`, and `transform`.

## File Structure

```
src/rule-engine/
  index.ts          # Rule engine implementation (RuleEngine, types, factory)
```

The module is a single-file implementation that imports the shared `logger` from `../infra/index.js`.

## Class and Function API

### Types and Interfaces

#### `RuleOperator`

```typescript
type RuleOperator =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'notContains' | 'startsWith' | 'endsWith'
  | 'matches' | 'in' | 'notIn' | 'between'
  | 'isNull' | 'isNotNull' | 'isEmpty' | 'isNotEmpty'
  | 'and' | 'or' | 'not';
```

#### `RuleCondition`

```typescript
interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value?: any;
  conditions?: RuleCondition[]; // For and/or/not compound conditions
}
```

| Field        | Type              | Description                                                |
|--------------|-------------------|------------------------------------------------------------|
| `field`      | `string`          | Dot-nested field path in the data object (e.g., `user.age`) |
| `operator`   | `RuleOperator`    | Comparison or logical operator                              |
| `value`      | `any`             | Value to compare against (not used for `and`/`or`/`not`)    |
| `conditions` | `RuleCondition[]` | Nested conditions for compound logical operators            |

#### `Rule`

```typescript
interface Rule {
  id: string;
  name: string;
  description?: string;
  condition: RuleCondition;
  actions: Array<{ type: string; params: Record<string, any> }>;
  priority: number;
  enabled: boolean;
  category?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}
```

| Field         | Type     | Description                                          |
|---------------|----------|------------------------------------------------------|
| `id`          | `string` | Unique rule identifier                               |
| `name`        | `string` | Human-readable rule name                             |
| `description` | `string` | Optional description                                 |
| `condition`   | `RuleCondition` | Condition that triggers the rule's actions     |
| `actions`     | `Array`  | List of actions to execute when the rule matches     |
| `priority`    | `number` | Execution priority (higher = evaluated first)        |
| `enabled`     | `boolean`| Whether the rule is active                           |
| `category`    | `string` | Optional grouping category                           |
| `tags`        | `string[]`| Optional tags for organization                       |
| `createdAt`   | `number` | Unix timestamp of creation (auto-set)                |
| `updatedAt`   | `number` | Unix timestamp of last update (auto-set)             |

#### `RuleEvaluationResult`

```typescript
interface RuleEvaluationResult {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  actions: Array<{ type: string; params: Record<string, any>; executed: boolean; error?: string }>;
  evaluatedAt: number;
  evaluationTimeMs: number;
}
```

#### `RuleEngineConfig`

```typescript
interface RuleEngineConfig {
  timeoutMs?: number;
  firstMatch?: boolean;
  maxRules?: number;
}
```

| Field        | Type      | Description                                  | Default  |
|--------------|-----------|----------------------------------------------|----------|
| `timeoutMs`  | `number`  | Max evaluation time per call (ms)            | `10000`  |
| `firstMatch` | `boolean` | Stop evaluating after the first matching rule| `false`  |
| `maxRules`   | `number`  | Max rules evaluated per call                 | `1000`   |

### `RuleEngine` Class

The main rule engine class. Extends `EventEmitter`.

#### Constructor

```typescript
constructor(config?: RuleEngineConfig)
```

#### Methods

**`addRule(rule: Omit<Rule, 'createdAt' | 'updatedAt'>): void`**

Adds or updates a rule. If a rule with the same ID exists, its `createdAt` timestamp is preserved and `updatedAt` is refreshed. Logs the addition via the infra logger.

**`removeRule(ruleId: string): boolean`**

Removes a rule by ID. Returns `true` if the rule existed and was removed.

**`toggleRule(ruleId: string, enabled: boolean): boolean`**

Enables or disables a rule without removing it. Returns `false` if the rule does not exist.

**`evaluate(data: Record<string, any>): RuleEvaluationResult[]`**

Evaluates all enabled rules (sorted by priority descending) against the provided data object. Returns an array of evaluation results, one per evaluated rule. Actions are executed inline for matching rules.

In `firstMatch` mode, evaluation stops after the first rule matches. The total evaluation is bounded by `timeoutMs`.

**`getRules(category?: string): Rule[]`**

Returns all rules, optionally filtered by category.

**`getHistory(ruleId?: string, limit?: number): Array<{ ruleId: string; matched: boolean; timestamp: number }>`**

Returns evaluation history, optionally filtered by rule ID. Default limit is 100. History is capped at 10,000 entries (oldest entries are dropped).

**`getStats(): { totalRules: number; enabledRules: number; byCategory: Record<string, number>; matchRate: number }`**

Returns engine statistics including rule counts by category and overall match rate from history.

### Factory Function

```typescript
function createRuleEngine(config?: RuleEngineConfig): RuleEngine
```

Convenience factory that returns a new `RuleEngine` instance.

## Configuration Options

| Option       | Type      | Description                                | Default |
|-------------|-----------|--------------------------------------------|---------|
| `timeoutMs` | `number`  | Max time for one evaluate() call in ms     | 10,000  |
| `firstMatch`| `boolean` | Stop after first matching rule             | false   |
| `maxRules`  | `number`  | Max rules evaluated per call               | 1,000   |

## Usage Examples

### Basic Rule Evaluation

```typescript
import { createRuleEngine } from './src/rule-engine/index.js';

const engine = createRuleEngine();

// Add a rule
engine.addRule({
  id: 'high-value-alert',
  name: 'High Value Transaction Alert',
  condition: {
    field: 'transaction.amount',
    operator: 'gt',
    value: 1000,
  },
  actions: [
    { type: 'log', params: { message: 'High value transaction detected' } },
    { type: 'notify', params: { channel: 'security', message: 'Transaction over $1000' } },
  ],
  priority: 10,
  enabled: true,
  category: 'fraud-detection',
  tags: ['financial', 'alert'],
});

// Evaluate against data
const results = engine.evaluate({
  transaction: { amount: 1500, currency: 'USD', userId: 'user-123' },
});

for (const result of results) {
  console.log(`Rule "${result.ruleName}": matched=${result.matched}`);
  for (const action of result.actions) {
    console.log(`  Action: ${action.type} (executed=${action.executed})`);
  }
}
```

### Complex Conditions with AND/OR/NOT

```typescript
engine.addRule({
  id: 'suspicious-login',
  name: 'Suspicious Login Detection',
  condition: {
    operator: 'and',
    conditions: [
      { field: 'event.type', operator: 'eq', value: 'login' },
      { field: 'event.country', operator: 'notIn', value: ['US', 'CA', 'UK'] },
      {
        operator: 'or',
        conditions: [
          { field: 'user.failedAttempts', operator: 'gte', value: 5 },
          { field: 'user.lastLoginDaysAgo', operator: 'gt', value: 30 },
        ],
      },
    ],
  },
  actions: [
    { type: 'tag', params: { tag: 'suspicious' } },
    { type: 'reject', params: { reason: 'Suspicious login attempt' } },
  ],
  priority: 100,
  enabled: true,
  category: 'security',
});
```

### Pattern Matching and String Operations

```typescript
engine.addRule({
  id: 'email-validation',
  name: 'Email Format Validation',
  condition: {
    field: 'user.email',
    operator: 'matches',
    value: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
  },
  actions: [
    { type: 'set', params: { field: 'user.emailValid', value: true } },
  ],
  priority: 5,
  enabled: true,
});

engine.addRule({
  id: 'internal-domain',
  name: 'Internal Domain Check',
  condition: {
    field: 'user.email',
    operator: 'endsWith',
    value: '@company.com',
  },
  actions: [
    { type: 'tag', params: { tag: 'internal-user' } },
  ],
  priority: 5,
  enabled: true,
});
```

### First-Match Mode

```typescript
const engine = createRuleEngine({ firstMatch: true });

// Only the highest-priority matching rule will be evaluated
engine.addRule({
  id: 'block-listed-ip',
  name: 'Block Listed IP',
  condition: { field: 'request.ip', operator: 'in', value: blockedIPs },
  actions: [{ type: 'reject', params: { reason: 'IP is blocked' } }],
  priority: 1000,
  enabled: true,
});

engine.addRule({
  id: 'rate-check',
  name: 'Rate Limit Check',
  condition: { field: 'request.count', operator: 'gt', value: 100 },
  actions: [{ type: 'reject', params: { reason: 'Rate limited' } }],
  priority: 500,
  enabled: true,
});

// If the IP is blocked, only the first rule fires -- rate check is skipped
const results = engine.evaluate({ request: { ip: '10.0.0.1', count: 200 } });
console.log(results.length); // 1 (first match)
```

### Transform Action

```typescript
engine.addRule({
  id: 'normalize-email',
  name: 'Normalize Email',
  condition: {
    field: 'user.email',
    operator: 'isNotEmpty',
  },
  actions: [
    {
      type: 'transform',
      params: {
        transform: (data) => {
          data.user.email = data.user.email.toLowerCase().trim();
        },
      },
    },
  ],
  priority: 1,
  enabled: true,
});
```

### Event-Driven Rule Monitoring

```typescript
const engine = createRuleEngine();

engine.on('rule:matched', ({ rule, data, result }) => {
  logger.info({ ruleId: rule.id, data }, 'Rule matched');
});

engine.on('rule:notify', ({ channel, message, data }) => {
  notificationService.send(channel, message, data);
});

engine.on('rule:custom-action', ({ type, params, data }) => {
  customActionHandler(type, params, data);
});
```

### Rule Management and Auditing

```typescript
// View all rules
console.log(engine.getRules());

// View rules by category
console.log(engine.getRules('security'));

// Disable a rule
engine.toggleRule('old-rule-id', false);

// Remove a rule
engine.removeRule('deprecated-rule-id');

// Check evaluation history
const history = engine.getHistory('high-value-alert', 50);
console.log(`Matched ${history.filter(h => h.matched).length}/${history.length} times`);

// Get stats
const stats = engine.getStats();
console.log(`Total: ${stats.totalRules}, Enabled: ${stats.enabledRules}, Match rate: ${stats.matchRate}`);
```

## Built-in Action Types

| Type         | Parameters                        | Description                                       |
|--------------|-----------------------------------|---------------------------------------------------|
| `set`        | `{ field: string, value: any }`   | Sets a field in the data object (supports dot paths) |
| `tag`        | `{ tag: string }`                 | Appends a tag to `data._tags` array               |
| `log`        | `{ message: string }`             | Logs a message via the infra logger               |
| `notify`     | `{ channel: string, message: string }` | Emits a `rule:notify` event                  |
| `reject`     | `{ reason?: string }`             | Throws an Error with the given reason             |
| `transform`  | `{ transform: Function }`         | Applies a transformation function to the data     |
| *custom*     | Any                               | Emits a `rule:custom-action` event                |

## Integration Points

### With Pipeline Module

Rules can be evaluated within pipeline stages for data validation and transformation:

```typescript
const pipeline = createDataPipeline({
  name: 'validated-pipeline',
  stages: [
    {
      name: 'apply-rules',
      process: (data) => {
        const results = ruleEngine.evaluate(data);
        const rejected = results.find(r => r.actions.some(a => a.error));
        if (rejected) throw new Error(`Rule rejected: ${rejected.ruleName}`);
        return data;
      },
    },
  ],
});
```

### With Queue Module

Rules can filter or route queue messages:

```typescript
queue.subscribe('events', async (msg) => {
  const results = ruleEngine.evaluate(msg.payload);
  const matched = results.filter(r => r.matched);

  for (const result of matched) {
    await routeByCategory(result.ruleId, msg);
  }
});
```

### With Tenant Manager

Rules can enforce tenant-specific policies:

```typescript
engine.addRule({
  id: 'tenant-model-restriction',
  name: 'Tenant Model Access',
  condition: {
    field: 'request.model',
    operator: 'notIn',
    value: tenant.allowedModels,
  },
  actions: [{ type: 'reject', params: { reason: 'Model not allowed for tenant' } }],
  priority: 1000,
  enabled: true,
  category: 'tenant-policy',
});
```

### With Rate Limiter

Rules can dynamically adjust rate limits:

```typescript
engine.addRule({
  id: 'premium-tier-limit',
  name: 'Premium Tier Rate Limit',
  condition: { field: 'user.tier', operator: 'eq', value: 'premium' },
  actions: [
    {
      type: 'transform',
      params: {
        transform: (data) => {
          data.rateLimit = { max: 1000, window: 60 };
        },
      },
    },
  ],
  priority: 50,
  enabled: true,
  category: 'rate-limiting',
});
```

## Error Handling

### Condition Evaluation Errors

- Comparison operators gracefully handle missing or undefined fields by returning `undefined`, which never matches equality checks.
- Numeric operators (`gt`, `gte`, `lt`, `lte`, `between`) coerce values via `Number()`.
- String operators coerce via `String()`.

### Action Execution Errors

- Each action is executed independently within a try/catch block.
- If an action fails, the error is recorded in the result's `actions` array (`executed: false, error: message`) and evaluation continues to the next action.
- The `reject` action is the exception -- it throws an error, which is caught at the action level and recorded, but does not stop evaluation of subsequent rules.

### Timeout Protection

If evaluation exceeds `timeoutMs`, a warning is logged and evaluation stops. Results accumulated so far are returned. This prevents runaway rule evaluation from blocking the event loop.

### History Management

Evaluation history is capped at 10,000 entries. When the cap is reached, the oldest entries are dropped (FIFO). This prevents unbounded memory growth.

## Related Documentation

- **Pipeline Module**: `/home/runner/workspace/agent-gateway/README.md`
- **Queue Module**: `/home/runner/workspace/agent-gateway/src/queue/README.md`
- **Tenant Manager**: `/home/runner/workspace/agent-gateway/src/tenant-manager/README.md`
- **Rate Limiter**: `/home/runner/workspace/agent-gateway/src/rate-limiter/README.md`
