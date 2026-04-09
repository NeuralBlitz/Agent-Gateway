# Agent Error Classification & Graceful Degradation

This module provides a structured error classification system for AI agent operations within the Agent Gateway. It categorizes errors from AI providers and tool execution into actionable types, prescribes retry strategies with exponential backoff, selects fallback providers, and produces user-facing messages.

Part of **Roadmap Section 3.2 -- Error Classification & Graceful Degradation**.

---

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Error Types](#error-types)
- [Full API Documentation](#full-api-documentation)
  - [Types and Interfaces](#types-and-interfaces)
  - [classifyAgentError()](#classifyagenterror)
  - [getRecoveryAction()](#getrecoveryaction)
  - [ErrorTracker Class](#errortracker-class)
  - [handleAgentError()](#handleagenterror)
  - [Internal Helper Functions](#internal-helper-functions)
- [Configuration Options](#configuration-options)
- [Usage Examples](#usage-examples)
- [Integration Points](#integration-points)
- [Error Handling Strategy](#error-handling-strategy)
- [Backoff Algorithms](#backoff-algorithms)
- [Recovery Decision Flow](#recovery-decision-flow)
- [Testing Guidelines](#testing-guidelines)
- [Related Documentation](#related-documentation)

---

## Overview

The `agent-error` module is the central error-handling facility for AI agent operations in the Agent Gateway. When an LLM provider, tool execution, or network layer produces an error, this module:

1. **Classifies** the raw error into one of eleven `AgentErrorType` values by inspecting HTTP status codes, error message text, and well-known error names (e.g., `AbortError`).
2. **Prescribes** a recovery strategy -- retry with backoff, compact context, rotate credentials, fallback to another provider, or report as unrecoverable.
3. **Tracks** error frequency and recovery outcomes via the `ErrorTracker` class so that operators can monitor error rates per type.
4. **Integrates** directly into the agent loop (`/home/runner/workspace/agent-gateway/src/agents/index.ts`) so that every step in `BaseAgent.run()` benefits from automatic recovery without bubbling failures to the caller.

The module exports four public symbols:

| Export | Kind | Purpose |
|---|---|---|
| `classifyAgentError` | Function | Classify a raw `unknown` error into a structured `AgentErrorClassification` |
| `getRecoveryAction` | Function | Map a classification to a concrete `RecoveryAction` (retry, fallback, compact, etc.) |
| `ErrorTracker` | Class | Accumulate error statistics (counts by type, recovered vs. unrecoverable) |
| `handleAgentError` | Async Function | End-to-end handler that classifies, tracks, logs, and returns a retry decision |

---

## File Structure

```
/home/runner/workspace/agent-gateway/src/agent-error/
  index.ts              -- Single-file module; all types, functions, and the ErrorTracker class
```

The entire module lives in one file (~420 lines) to keep the error-handling logic co-located and easy to audit. It imports only `logger` from the `infra` module (`/home/runner/workspace/agent-gateway/src/infra/index.ts`) and has no other external dependencies.

---

## Error Types

The `AgentErrorType` union enumerates every classifiable error:

| Type | Trigger | Retryable | Fallback | Backoff | Max Retries | User Message |
|---|---|---|---|---|---|---|
| `rate_limit` | HTTP 429, message contains "rate limit" / "too many requests" / "rate_limited" | Yes | Yes | Exponential: 1s -> 2s -> 4s -> 8s -> 16s (cap 60s) | 5 | "I'm being rate-limited, trying a different model..." |
| `context_overflow` | Message contains "context length" / "maximum context" / "token limit" / "prompt too long" / "context_overflow" / "input token" | Yes | No | 0ms (immediate) | 1 | None (auto-compact) |
| `auth_failure` | HTTP 401/403, message contains "authentication" / "unauthorized" / "invalid api key" / "forbidden" / "invalid_api_key" | No | Yes | None | N/A | "Authentication issue, trying alternate credentials..." |
| `billing_error` | Message contains "billing" / "insufficient" / "quota exceeded" / "credit" / "payment" / "account_disabled" | No | Yes | None | N/A | "My primary model is unavailable, using a backup..." |
| `content_filter` | HTTP 400 + message contains "content filter" / "safety" / "blocked" / "policy" / "inappropriate" | Yes | Yes | 500ms | 1 | None (rephrase internally) |
| `timeout` | Message contains "timeout" / "timed out" / "deadline", or error name is `AbortError` | Yes | Yes | Exponential: 2s -> 4s -> 8s (cap 30s) | 3 | "That took too long, trying again..." |
| `provider_error` | HTTP 5xx, message contains "internal server" / "service unavailable" / "bad gateway" / "provider_error" | Yes | Conditional (after 2 failures) | Exponential: 1s -> 2s -> 4s -> 8s | 3 | "Having trouble with my AI provider..." |
| `tool_error` | Message contains "tool" / "function call" / "tool_error" / "tool execution" | No | No | None | N/A | None (report to agent) |
| `connection_error` | Message contains "connection" / "network" / "econnrefused" / "dns" / "fetch failed" / "socket" | Yes | Yes | 2000ms (fixed) | 3 | "Connection issue, retrying..." |
| `invalid_request` | HTTP 400, message contains "bad request" / "invalid_request" | No | No | None | N/A | "I couldn't process that request. Please try again." |
| `unknown` | Does not match any pattern above | Yes | Yes | 1000ms | 2 | "An unexpected error occurred. Please try again." |

---

## Full API Documentation

### Types and Interfaces

#### `AgentErrorType`

```typescript
export type AgentErrorType =
  | 'rate_limit'
  | 'context_overflow'
  | 'auth_failure'
  | 'billing_error'
  | 'content_filter'
  | 'timeout'
  | 'provider_error'
  | 'tool_error'
  | 'connection_error'
  | 'invalid_request'
  | 'unknown';
```

#### `AgentErrorClassification`

Returned by `classifyAgentError()`. Describes the classified error and the recovery parameters the caller should use.

```typescript
export interface AgentErrorClassification {
  type: AgentErrorType;             // The classified error type
  retryable: boolean;               // Whether the error should be retried
  backoffMs: number;                // Milliseconds to wait before retry
  maxRetries: number;               // Maximum number of retry attempts
  shouldFallback: boolean;          // Whether to attempt a provider fallback
  fallbackProvider?: string;        // Name of the fallback provider (if any)
  userMessage?: string;             // Optional message to surface to the end user
  shouldCompactContext: boolean;    // True for context_overflow
  shouldRotateAuth: boolean;        // True for auth_failure
  originalError: unknown;           // The raw error that was classified
}
```

#### `RecoveryAction`

Returned by `getRecoveryAction()`. A concrete instruction for the caller on what to do next.

```typescript
export interface RecoveryAction {
  action: 'retry' | 'fallback' | 'compact' | 'rotate_auth' | 'abort' | 'report';
  delayMs: number;                // How long to wait before executing the action
  userMessage?: string;           // Optional user-facing message
}
```

The `action` values mean:

| Action | Description |
|---|---|
| `retry` | Retry the same request after `delayMs` |
| `fallback` | Switch to an alternate provider |
| `compact` | Compact the conversation context, then retry |
| `rotate_auth` | Rotate credentials, then retry |
| `abort` | Stop processing (unrecoverable) |
| `report` | Report the error to the caller; no further action possible |

#### `ErrorStats`

The shape of statistics returned by `ErrorTracker.getStats()`.

```typescript
export interface ErrorStats {
  byType: Record<AgentErrorType, number>;   // Count of each error type
  totalErrors: number;                       // Total errors recorded
  totalRecovered: number;                    // Errors that were successfully recovered
  totalUnrecoverable: number;                // Errors that are neither retryable nor fallback-eligible
  lastError?: {                              // Details of the most recent error
    type: AgentErrorType;
    timestamp: number;
    provider?: string;
    message: string;
  };
}
```

---

### `classifyAgentError()`

Classifies an arbitrary error into a structured `AgentErrorClassification`.

**Signature:**

```typescript
function classifyAgentError(
  error: unknown,
  context?: {
    provider?: string;
    model?: string;
    attempt?: number;
    availableProviders?: string[];
  }
): AgentErrorClassification
```

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `error` | `unknown` | Yes | The raw error object (typically caught in a `catch` block) |
| `context.provider` | `string` | No | Name or ID of the AI provider that produced the error |
| `context.model` | `string` | No | Model identifier in use when the error occurred |
| `context.attempt` | `number` | No | Current retry attempt number (affects backoff calculation) |
| `context.availableProviders` | `string[]` | No | List of provider names available for fallback |

**Returns:** `AgentErrorClassification`

**Behavior:**

- If `error` is an `Error` instance, the function inspects `error.message` (case-insensitive), `error.name`, and attempts to extract an HTTP status code via `extractStatusCode()`.
- Classification rules are evaluated in a fixed priority order. The first matching rule wins. The order is: rate_limit > context_overflow > auth_failure > billing_error > content_filter > timeout > provider_error > invalid_request > connection_error > tool_error.
- If no rule matches, the error is classified as `unknown` with `retryable: true` and `maxRetries: 2`.

**Example:**

```typescript
import { classifyAgentError } from './agent-error/index.js';

try {
  await provider.chat(messages);
} catch (err) {
  const classification = classifyAgentError(err, {
    provider: 'openai',
    model: 'gpt-4',
    attempt: 0,
  });
  console.log(classification.type); // e.g., "rate_limit"
  console.log(classification.retryable); // true
  console.log(classification.backoffMs); // 1000
}
```

---

### `getRecoveryAction()`

Given an `AgentErrorClassification`, determines the concrete action the caller should take.

**Signature:**

```typescript
function getRecoveryAction(
  classification: AgentErrorClassification,
  context?: {
    availableProviders?: string[];
    fallbackProvider?: string;
  }
): RecoveryAction
```

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `classification` | `AgentErrorClassification` | Yes | The output of `classifyAgentError()` |
| `context.availableProviders` | `string[]` | No | Available providers for fallback evaluation |
| `context.fallbackProvider` | `string` | No | Explicit fallback provider name |

**Returns:** `RecoveryAction`

**Decision priority:**

1. `shouldCompactContext` is true -> `{ action: 'compact', delayMs: 0 }`
2. `shouldRotateAuth` is true -> `{ action: 'rotate_auth', delayMs: 500 }`
3. `retryable` is true -> `{ action: 'retry', delayMs: classification.backoffMs }`
4. `shouldFallback` is true AND more than one provider is available -> `{ action: 'fallback', delayMs: 200 }`
5. Otherwise -> `{ action: 'report', delayMs: 0 }`

**Example:**

```typescript
import { classifyAgentError, getRecoveryAction } from './agent-error/index.js';

const classification = classifyAgentError(err);
const action = getRecoveryAction(classification, {
  availableProviders: ['openai', 'anthropic', 'google'],
});
// action.action === 'fallback'
// action.delayMs === 200
```

---

### `ErrorTracker` Class

A stateful class that accumulates error statistics for monitoring and diagnostics.

**Constructor:**

```typescript
constructor() // No arguments; initializes all counters to zero
```

**Methods:**

#### `recordError(classification, provider?, recovered?)`

Records a single error event.

```typescript
recordError(
  classification: AgentErrorClassification,
  provider?: string,
  recovered: boolean = false
): void
```

| Parameter | Type | Description |
|---|---|---|
| `classification` | `AgentErrorClassification` | The classified error |
| `provider` | `string` | Optional provider name for attribution |
| `recovered` | `boolean` | Whether the error was recovered from (defaults to `false`) |

Increments `byType[classification.type]` and `totalErrors`. If `recovered` is `true`, increments `totalRecovered`. If the error is neither retryable nor fallback-eligible, increments `totalUnrecoverable`. Always updates `lastError` with the latest error details.

#### `getStats()`

Returns a shallow copy of the current statistics.

```typescript
getStats(): ErrorStats
```

#### `reset()`

Resets all counters to their initial zero values.

```typescript
reset(): void
```

**Example:**

```typescript
import { ErrorTracker, classifyAgentError } from './agent-error/index.js';

const tracker = new ErrorTracker();

try {
  await doSomething();
} catch (err) {
  const c = classifyAgentError(err);
  tracker.recordError(c, 'openai');
  // ... attempt recovery ...
  tracker.recordError(c, 'openai', true); // recovered
}

console.log(tracker.getStats());
// {
//   byType: { rate_limit: 1, context_overflow: 0, ... },
//   totalErrors: 2,
//   totalRecovered: 1,
//   totalUnrecoverable: 0,
//   lastError: { type: 'rate_limit', timestamp: 1712678400000, provider: 'openai', message: '...' }
// }
```

---

### `handleAgentError()`

An async convenience function that combines classification, tracking, logging, and recovery into a single call. Designed to be called from within an agent's catch block.

**Signature:**

```typescript
async function handleAgentError(
  error: unknown,
  context: {
    provider?: string;
    model?: string;
    attempt: number;
    maxAttempts: number;
    availableProviders: string[];
    fallbackProvider?: string;
    errorTracker?: ErrorTracker;
  }
): Promise<{
  shouldRetry: boolean;
  delayMs: number;
  userMessage?: string;
  action: string;
}>
```

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `error` | `unknown` | Yes | The raw error |
| `context.provider` | `string` | No | Current provider name |
| `context.model` | `string` | No | Current model name |
| `context.attempt` | `number` | Yes | Current retry attempt number |
| `context.maxAttempts` | `number` | Yes | Maximum allowed retry attempts |
| `context.availableProviders` | `string[]` | Yes | List of providers for fallback |
| `context.fallbackProvider` | `string` | No | Explicit fallback provider |
| `context.errorTracker` | `ErrorTracker` | No | Tracker instance for recording the error |

**Returns:** A promise resolving to an object with:

| Field | Type | Description |
|---|---|---|
| `shouldRetry` | `boolean` | Whether the caller should retry (true only when action is `'retry'` and `attempt < maxAttempts`) |
| `delayMs` | `number` | Milliseconds to wait before the next action |
| `userMessage` | `string \| undefined` | Optional message to display to the end user |
| `action` | `string` | The recovery action string (one of the `RecoveryAction` action values) |

**Side effects:**

- Records the error in `context.errorTracker` if provided.
- Logs a structured warning via the `logger` from `/home/runner/workspace/agent-gateway/src/infra/index.ts` with fields: `errorType`, `provider`, `model`, `attempt`, `maxAttempts`, `retryable`, `recoveryAction`, `delayMs`.

**Example:**

```typescript
import { handleAgentError, ErrorTracker } from './agent-error/index.js';

const tracker = new ErrorTracker();

for (let attempt = 0; attempt < maxAttempts; attempt++) {
  try {
    return await provider.chat(messages);
  } catch (err) {
    const result = await handleAgentError(err, {
      provider: 'openai',
      model: 'gpt-4',
      attempt,
      maxAttempts,
      availableProviders: ['openai', 'anthropic'],
      errorTracker: tracker,
    });

    if (result.userMessage) {
      sendToUser(result.userMessage);
    }
    if (!result.shouldRetry) {
      throw new Error(`Failed after ${attempt} attempts: ${result.action}`);
    }
    await sleep(result.delayMs);
  }
}
```

---

### Internal Helper Functions

These functions are not exported and are used only within the module.

#### `extractStatusCode(error: unknown): number | undefined`

Extracts an HTTP status code from an error by:

1. Matching a pattern like `status: 429` or `status 404` in `error.message`.
2. Checking for a `status` or `statusCode` property on the error object.

#### `calculateRateLimitBackoff(attempt: number): number`

Exponential backoff starting at 1s, doubling each attempt, capped at 60s.

```
attempt 0 -> 1000ms
attempt 1 -> 2000ms
attempt 2 -> 4000ms
attempt 3 -> 8000ms
attempt 4 -> 16000ms
attempt 5+ -> 60000ms (capped)
```

#### `calculateTimeoutBackoff(attempt: number): number`

Exponential backoff starting at 2s, doubling each attempt, capped at 30s.

```
attempt 0 -> 2000ms
attempt 1 -> 4000ms
attempt 2 -> 8000ms
attempt 3+ -> 30000ms (capped)
```

#### `calculateProviderBackoff(attempt: number): number`

Exponential backoff starting at 1s, doubling each attempt, uncapped.

```
attempt 0 -> 1000ms
attempt 1 -> 2000ms
attempt 2 -> 4000ms
attempt 3 -> 8000ms
```

---

## Configuration Options

The module has no external configuration file or environment variable dependencies. All tunable parameters are hardcoded in the backoff calculation functions and classification rules:

| Parameter | Location | Default | Description |
|---|---|---|---|
| Rate limit backoff base | `calculateRateLimitBackoff()` | 1000ms | Initial delay for rate-limit errors |
| Rate limit backoff cap | `calculateRateLimitBackoff()` | 60000ms | Maximum delay for rate-limit retries |
| Timeout backoff base | `calculateTimeoutBackoff()` | 2000ms | Initial delay for timeout errors |
| Timeout backoff cap | `calculateTimeoutBackoff()` | 30000ms | Maximum delay for timeout retries |
| Provider backoff base | `calculateProviderBackoff()` | 1000ms | Initial delay for provider errors |
| Auth rotation delay | `getRecoveryAction()` | 500ms | Delay before retrying after auth rotation |
| Fallback delay | `getRecoveryAction()` | 200ms | Delay before switching providers |
| Content filter delay | Classification | 500ms | Fixed delay before content filter retry |
| Connection error delay | Classification | 2000ms | Fixed delay for connection errors |
| Default unknown error retries | Classification | 2 | Max retries for unclassified errors |

To tune these values, edit the helper functions directly in `/home/runner/workspace/agent-gateway/src/agent-error/index.ts`.

---

## Usage Examples

### Standalone classification and recovery

```typescript
import { classifyAgentError, getRecoveryAction } from './agent-error/index.js';

async function callProviderWithRetry(provider, messages, maxAttempts = 5) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await provider.chat(messages);
    } catch (err) {
      const classification = classifyAgentError(err, {
        provider: provider.name,
        attempt,
      });

      const action = getRecoveryAction(classification, {
        availableProviders: ['primary', 'secondary'],
      });

      if (action.action === 'retry' && attempt < maxAttempts - 1) {
        if (action.delayMs > 0) {
          await new Promise(r => setTimeout(r, action.delayMs));
        }
        continue;
      }

      if (action.action === 'fallback') {
        // Switch provider and retry
        return await secondaryProvider.chat(messages);
      }

      throw err; // Unrecoverable
    }
  }
}
```

### Using `handleAgentError` for end-to-end handling

```typescript
import { handleAgentError, ErrorTracker } from './agent-error/index.js';

const tracker = new ErrorTracker();

async function runWithHandling(provider, messages) {
  const maxAttempts = 5;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await provider.chat(messages);
    } catch (err) {
      const result = await handleAgentError(err, {
        provider: provider.name,
        model: provider.model,
        attempt,
        maxAttempts,
        availableProviders: ['openai', 'anthropic', 'google'],
        fallbackProvider: 'anthropic',
        errorTracker: tracker,
      });

      if (result.userMessage) {
        console.log(result.userMessage);
      }

      if (!result.shouldRetry) {
        break;
      }

      if (result.delayMs > 0) {
        await new Promise(r => setTimeout(r, result.delayMs));
      }
    }
  }
}
```

### Monitoring error statistics

```typescript
import { ErrorTracker } from './agent-error/index.js';

const tracker = new ErrorTracker();
// ... record errors during operation ...

const stats = tracker.getStats();
console.log(`Total errors: ${stats.totalErrors}`);
console.log(`Recovered: ${stats.totalRecovered}`);
console.log(`Unrecoverable: ${stats.totalUnrecoverable}`);
console.log(`By type:`, stats.byType);

// Reset for the next monitoring window
tracker.reset();
```

---

## Integration Points

### 1. Agent Loop (`/home/runner/workspace/agent-gateway/src/agents/index.ts`)

The primary consumer. `BaseAgent` creates an `ErrorTracker` instance on construction and uses `classifyAgentError` + `getRecoveryAction` inside its `run()` method's inner retry loop. On each step failure:

- The error is classified.
- It is recorded in the tracker.
- A recovery action is determined.
- If the action is `compact`, the `compactContext()` private method removes the oldest non-system message.
- If the action is `retry` and retries remain, the loop waits `delayMs` and continues.
- Otherwise the error is recorded in the result's `errors` array and the loop proceeds to the next iteration.

Exports are re-exported from the gateway root:

```typescript
// /home/runner/workspace/agent-gateway/src/index.ts
export { classifyAgentError, getRecoveryAction, ErrorTracker, handleAgentError } from './agent-error/index.js';
export type { AgentErrorType, AgentErrorClassification, RecoveryAction, ErrorStats } from './agent-error/index.js';
```

### 2. Logger (`/home/runner/workspace/agent-gateway/src/infra/index.ts`)

`handleAgentError()` emits a structured warning log via `logger.warn()`. The `infra` module also defines related error classes (`GatewayError`, `ProviderError`, `ChannelError`, `PluginError`) which can serve as the raw `error` input to `classifyAgentError`.

### 3. Provider Layer (`/home/runner/workspace/agent-gateway/src/providers/`)

Errors thrown by provider `chat()` and `chatWithTools()` methods (HTTP errors, timeouts, etc.) flow into this module for classification. The `availableProviders` context parameter is populated from the provider registry.

### 4. Failover Module (`/home/runner/workspace/agent-gateway/src/failover/`)

When `getRecoveryAction()` returns `action: 'fallback'`, the failover module is responsible for selecting and activating the next available provider from the `availableProviders` list.

### 5. Retry Handler (`/home/runner/workspace/agent-gateway/src/retry-handler/`)

The generic retry handler may be layered beneath or alongside this module. `agent-error` provides semantic classification (what kind of error), while `retry-handler` provides generic retry mechanics (how to retry).

---

## Error Handling Strategy

### Classification Priority

The classification function evaluates rules in a strict top-down order. This matters because some error messages may match multiple patterns. The priority order is intentional:

1. **Rate limits** (429) take highest priority because they require immediate backoff.
2. **Context overflow** is next because it requires structural changes (compaction), not retries.
3. **Auth failures** come before billing because credential rotation is cheaper than a provider switch.
4. **Billing errors** trigger fallback before retry attempts are exhausted.
5. **Content filters** get a single retry opportunity with a short delay.
6. **Timeouts** use a longer backoff curve to avoid hammering a slow provider.
7. **Provider errors** (5xx) retry with exponential backoff and fall back after 2 failures.
8. **Invalid requests** (400) are never retried.
9. **Connection errors** use a fixed 2-second delay.
10. **Tool errors** are not retried automatically; the agent loop handles them.
11. **Unknown** falls through with conservative retry defaults.

### Retryability Matrix

| Error Type | Retry | Fallback | Compact | Rotate Auth |
|---|---|---|---|---|
| `rate_limit` | Yes | Yes | No | No |
| `context_overflow` | Yes | No | Yes | No |
| `auth_failure` | No | Yes | No | Yes |
| `billing_error` | No | Yes | No | No |
| `content_filter` | Yes | Yes | No | No |
| `timeout` | Yes | Yes | No | No |
| `provider_error` | Yes | Conditional | No | No |
| `tool_error` | No | No | No | No |
| `connection_error` | Yes | Yes | No | No |
| `invalid_request` | No | No | No | No |
| `unknown` | Yes | Yes | No | No |

---

## Backoff Algorithms

All backoff functions use exponential growth with a base delay and an optional cap:

```
backoff(attempt) = min(base * 2^attempt, cap)
```

| Algorithm | Base | Cap | Used By |
|---|---|---|---|
| Rate limit | 1000ms | 60000ms | `rate_limit` errors |
| Timeout | 2000ms | 30000ms | `timeout` errors |
| Provider | 1000ms | None | `provider_error` errors |
| Fixed (connection) | 2000ms | N/A | `connection_error` errors |
| Fixed (content filter) | 500ms | N/A | `content_filter` errors |
| Fixed (auth rotation) | 500ms | N/A | `auth_failure` errors |
| Fixed (fallback) | 200ms | N/A | Fallback transitions |

---

## Recovery Decision Flow

```
Error occurs
    |
    v
classifyAgentError()
    |
    v
AgentErrorClassification
    |
    v
getRecoveryAction()
    |
    +-- shouldCompactContext? -> compact -> retry
    |
    +-- shouldRotateAuth? -> rotate_auth -> retry
    |
    +-- retryable? -> retry (with backoff)
    |
    +-- shouldFallback && providers > 1? -> fallback
    |
    +-- otherwise -> report (unrecoverable)
```

---

## Testing Guidelines

When writing tests for this module, cover the following scenarios:

1. **Each error type** -- Verify that a representative error for each `AgentErrorType` is classified correctly.
2. **Priority ordering** -- Test an error message that matches multiple patterns (e.g., "rate limit timeout") and verify the higher-priority type wins.
3. **Non-Error inputs** -- Pass non-Error values (strings, null, objects) and verify they fall through to `unknown`.
4. **Backoff calculations** -- Assert that `calculateRateLimitBackoff`, `calculateTimeoutBackoff`, and `calculateProviderBackoff` produce correct values for attempts 0 through 6, including cap enforcement.
5. **ErrorTracker accumulation** -- Record multiple errors and verify `byType` counts, `totalErrors`, `totalRecovered`, and `totalUnrecoverable` are accurate.
6. **ErrorTracker.reset()** -- Verify all counters return to zero after reset.
7. **handleAgentError** -- Mock the logger and verify it is called with the expected structured fields. Verify `shouldRetry` is `false` when `attempt >= maxAttempts`.
8. **getRecoveryAction** -- Test the decision priority: verify `compact` wins over `retry`, `retry` wins over `fallback`, and `report` is the final fallback.

---

## Related Documentation

| Module | Path | Relationship |
|---|---|---|
| Agents (BaseAgent) | `/home/runner/workspace/agent-gateway/src/agents/index.ts` | Primary consumer of error classification and recovery |
| Infra (logger + error classes) | `/home/runner/workspace/agent-gateway/src/infra/index.ts` | Logging backend and related error types |
| Gateway root exports | `/home/runner/workspace/agent-gateway/src/index.ts` | Re-exports all public symbols from this module |
| Providers (types) | `/home/runner/workspace/agent-gateway/src/providers/` | Source of errors that flow into classification |
| Failover | `/home/runner/workspace/agent-gateway/src/failover/` | Handles provider fallback when `action: 'fallback'` |
| Retry Handler | `/home/runner/workspace/agent-gateway/src/retry-handler/` | Generic retry mechanics (complementary) |
| Error Handler | `/home/runner/workspace/agent-gateway/src/error-handler/` | General error handling middleware |
| ROADMAP (Section 3.2) | `/home/runner/workspace/agent-gateway/ROADMAP.md` | Roadmap reference for this feature |
