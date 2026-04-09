# Hook Tests

> **Test suite for the lifecycle hook system in Agent Gateway**

This directory contains tests for the hook system, which allows custom logic to be injected at any phase of the message processing pipeline. Tests cover hook creation, registration, priority ordering, error handling, phase execution, and the global hooks singleton.

---

## Table of Contents

- [Overview](#overview)
- [Test Scope](#test-scope)
- [Hook Architecture](#hook-architecture)
- [Test Files](#test-files)
- [Test Scenarios](#test-scenarios)
- [Mocking Strategy](#mocking-strategy)
- [Running Hook Tests](#running-hook-tests)
- [Hook Phases](#hook-phases)
- [Writing New Hook Tests](#writing-new-hook-tests)
- [Integration Points](#integration-points)

---

## Overview

Location: `/home/runner/workspace/agent-gateway/test/hooks/`

The hook system provides extensibility points throughout the message processing lifecycle. Hooks are registered with a name, phase, handler function, and optional priority. They execute in priority order (highest first) at their designated phase.

Key files:
- `/home/runner/workspace/agent-gateway/src/hooks/index.ts` -- Hooks class, createHook, global hooks
- `/home/runner/workspace/agent-gateway/test/hooks.test.ts` -- Main hook test file
- `/home/runner/workspace/agent-gateway/test/hooks/` -- Additional hook tests (this directory)

---

## Test Scope

| Component | Source Location | Test Coverage |
|-----------|----------------|---------------|
| `Hooks` class | `src/hooks/index.ts` | Registration, execution, unregistration |
| `createHook()` | `src/hooks/index.ts` | Hook factory function |
| `getGlobalHooks()` | `src/hooks/index.ts` | Singleton pattern |
| `registerGlobalHook()` | `src/hooks/index.ts` | Global hook registration |
| Hook phases | `src/hooks/index.ts` | All phase execution |
| Priority ordering | `src/hooks/index.ts` | Sort by priority descending |
| Error handling | `src/hooks/index.ts` | Error catching and onError propagation |

---

## Hook Architecture

### Hook Structure

```typescript
interface Hook {
  name: string;         // Unique identifier
  phase: HookPhase;     // When to execute
  handler: HookHandler; // Async function
  priority: number;     // Higher = first (default: 0)
}
```

### Hook Phases

| Phase | Timing | Purpose |
|-------|--------|---------|
| `beforeMessage` | After message received, before processing | Validation, enrichment, rejection |
| `beforeAgent` | Before agent processing | Context modification, provider selection |
| `afterAgent` | After agent processing | Response transformation |
| `afterResponse` | Before sending response | Logging, formatting |
| `onError` | On any error | Error handling, alerting |

### Execution Flow

```
Phase: beforeMessage
  │
  ├── Hook A (priority: 10) ──► Execute
  ├── Hook B (priority: 5)  ──► Execute
  └── Hook C (priority: 1)  ──► Execute
  │
  ▼
Phase: beforeAgent
  │
  ├── Hook D (priority: 7)  ──► Execute
  └── Hook E (priority: 3)  ──► Execute
  │
  ▼
... (agent processing)
  │
  ▼
Phase: afterAgent
  │
  ▼
Phase: afterResponse
  │
  ▼
On Error ──► Phase: onError
```

---

## Test Files

| File | Coverage |
|------|----------|
| `/home/runner/workspace/agent-gateway/test/hooks.test.ts` | Hook creation, registration, priority, errors, global singleton |
| `/home/runner/workspace/agent-gateway/test/hooks/*.test.ts` | Additional hook tests (this directory) |

---

## Test Scenarios

### Hook Creation and Registration

- Create a hook with all fields
- Create a hook with default priority
- Register a hook with a Hooks instance
- List registered hooks
- Unregister a hook by name

### Priority Ordering

- Hooks execute in descending priority order
- Equal priority hooks execute in registration order
- Negative priorities are supported

### Phase Execution

- `beforeMessage` hooks execute with message context
- `beforeAgent` hooks execute with agent context
- `afterAgent` hooks execute with response context
- `afterResponse` hooks execute before sending
- `onError` hooks receive error context

### Error Handling

- Errors in hooks are caught and logged
- `onError` hooks are triggered when other hooks fail
- One hook error does not prevent subsequent hooks from executing
- isEnabled() returns correct state

### Global Hooks

- `getGlobalHooks()` returns a singleton
- Multiple calls return the same instance
- `registerGlobalHook()` adds to the global instance
- Global hooks persist across module boundaries

### Clearing Hooks

- `clear()` removes all hooks
- After clear, list returns empty array
- After clear, execute does nothing

---

## Mocking Strategy

### Mock Hook Handler

```typescript
const mockHandler = vi.fn().mockResolvedValue(undefined);

const hook = createHook('test-hook', 'beforeMessage', mockHandler, 5);
```

### Error-Throwing Handler

```typescript
const errorHandler = vi.fn().mockRejectedValue(new Error('hook error'));

const failingHook = createHook('failing', 'beforeMessage', errorHandler);
```

---

## Running Hook Tests

```bash
cd /home/runner/workspace/agent-gateway

# Run hook tests
npm run test -- hooks.test.ts
npm run test -- test/hooks/

# Run with coverage for hooks module
npm run test:coverage -- --include "src/hooks/**"

# Run specific test case
npm run test -- --grep "Hooks"
```

---

## Hook Phases

### Testing Each Phase

```typescript
describe('Hook phases', () => {
  const phases: HookPhase[] = ['beforeMessage', 'beforeAgent', 'afterAgent', 'afterResponse', 'onError'];

  for (const phase of phases) {
    it(`should execute ${phase} hooks`, async () => {
      const hooks = new Hooks();
      const executed: string[] = [];

      hooks.register(createHook('test', phase, async () => {
        executed.push(phase);
      }));

      await hooks.execute(phase, {});
      expect(executed).toContain(phase);
    });
  }
});
```

### Priority Ordering Test

```typescript
it('should execute hooks in priority order', async () => {
  const hooks = new Hooks();
  const executed: string[] = [];

  hooks.register(createHook('low', 'beforeMessage', async () => { executed.push('low'); }, 1));
  hooks.register(createHook('high', 'beforeMessage', async () => { executed.push('high'); }, 10));
  hooks.register(createHook('mid', 'beforeMessage', async () => { executed.push('mid'); }, 5));

  await hooks.execute('beforeMessage', {});
  expect(executed).toEqual(['high', 'mid', 'low']);
});
```

---

## Writing New Hook Tests

### Checklist

- [ ] Test hook creation with all parameters
- [ ] Test hook creation with defaults
- [ ] Test registration and listing
- [ ] Test unregistration
- [ ] Test priority ordering
- [ ] Test error handling in hooks
- [ ] Test onError hook propagation
- [ ] Test global hooks singleton
- [ ] Test clear functionality
- [ ] Test isEnabled() state
- [ ] Test each phase executes correctly

### Example

```typescript
import { describe, it, expect } from 'vitest';
import { Hooks, createHook, getGlobalHooks }
  from '/home/runner/workspace/agent-gateway/src/hooks/index.js';

describe('Hooks - Custom Phase', () => {
  it('should execute a beforeAgent hook', async () => {
    const hooks = new Hooks();
    let executed = false;

    hooks.register(createHook('modify-context', 'beforeAgent', async (ctx) => {
      ctx.provider = 'anthropic'; // Override provider
      executed = true;
    }, 5));

    await hooks.execute('beforeAgent', { provider: 'openai' });
    expect(executed).toBe(true);
  });
});
```

---

## Integration Points

The hook system integrates with:

| Component | Integration |
|-----------|-------------|
| **Auto-Reply** | Hooks execute during message processing |
| **Gateway** | Hooks registered at startup |
| **Agent Layer** | beforeAgent/afterAgent phases |
| **Channel** | beforeMessage/afterResponse phases |
| **Observability** | Hook execution metrics |
| **Error Handler** | onError hook propagation |
