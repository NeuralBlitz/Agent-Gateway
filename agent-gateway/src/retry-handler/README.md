# Retry Handler

## Overview

The **Retry Handler** module (`agent-gateway/src/retry-handler/`) provides resilient operation execution with configurable retry strategies, including exponential backoff with jitter, operation timeouts, and the bulkhead pattern for concurrency control. It is designed to make transient failures (network glitches, rate limits, temporary unavailability) recoverable without requiring each caller to implement its own retry logic.

The module exports three independent utilities:
1. **`withRetry`** -- Wraps an async function with retry logic and exponential backoff.
2. **`withTimeout`** -- Wraps an async function with a timeout deadline.
3. **`Bulkhead`** -- Limits concurrent executions of an operation to prevent resource exhaustion.

Together, these utilities implement key resilience patterns from Michael Nygard's "Release It!" and are foundational to building fault-tolerant distributed systems.

### Key Capabilities

- **Exponential Backoff**: Delay doubles with each retry attempt (1s, 2s, 4s, 8s, ...).
- **Jitter**: Randomized delay (+/- configurable jitter factor) prevents thundering herd problems.
- **Configurable Retries**: Set max retry count, base delay, max delay ceiling, and retryable error codes.
- **Selective Retrying**: Only retry errors matching a whitelist of error codes/messages; all others fail immediately.
- **Timeout Wrapping**: Enforce operation deadlines with `AbortSignal`-style race conditions.
- **Bulkhead Pattern**: Limit concurrent operations to isolate failures and prevent cascading overload.
- **Structured Logging**: Each retry attempt is logged via the shared infra logger with attempt number, delay, and error message.

---

## File Structure

```
agent-gateway/src/retry-handler/
  index.ts              # Main implementation (withRetry, withTimeout, Bulkhead, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `../infra/index.js` (the shared `logger` singleton) for warn-level logging on each retry attempt.

---

## Full API Documentation

### Interfaces

#### `RetryConfig`

| Property         | Type       | Default   | Description                                    |
|------------------|------------|-----------|------------------------------------------------|
| `maxRetries`     | number     | `3`       | Maximum number of retry attempts               |
| `baseDelayMs`    | number     | `1000`    | Initial delay before first retry (ms)          |
| `maxDelayMs`     | number     | `30000`   | Maximum delay ceiling (ms)                     |
| `jitter`         | number     | `0.3`     | Jitter factor (0.0 = none, 1.0 = full random)  |
| `retryableErrors`| string[]   | `undefined` | Whitelist of error codes/messages to retry; if undefined, all errors are retried |

---

### Function: `withRetry`

```ts
async function withRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig
): Promise<T>
```

Wraps an async function with retry logic using exponential backoff with jitter.

**Delay Calculation**:
```
delay = min(baseDelayMs * 2^attempt * (1 + jitter * (random(-1, 1))), maxDelayMs)
```

For default settings (`baseDelayMs=1000`, `jitter=0.3`):

| Attempt | Min Delay | Max Delay |
|---------|-----------|-----------|
| 1       | 700ms     | 1300ms    |
| 2       | 1400ms    | 2600ms    |
| 3       | 2800ms    | 5200ms    |
| 4       | 5600ms    | 10400ms   |

**Behavior**:
1. Executes `fn()`.
2. If it succeeds, returns the result immediately.
3. If it throws:
   - If `retryableErrors` is configured and the error's `code` or `message` is not in the list, re-throws immediately.
   - If retries remain, calculates delay, logs a warning, sleeps, and retries.
   - If no retries remain, throws the last error.

```ts
import { withRetry } from './index.js';

const result = await withRetry(async () => {
  return await fetch('https://api.example.com/data');
}, {
  maxRetries: 5,
  baseDelayMs: 500,
  maxDelayMs: 10000,
  jitter: 0.5,
});
```

**Selective Retrying**:

```ts
const result = await withRetry(async () => {
  return await callUpstreamService();
}, {
  maxRetries: 3,
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'RATE_LIMITED'],
});
// Only retries for connection refused, timeout, and rate limit errors
// All other errors (e.g., 404, validation errors) fail immediately
```

---

### Function: `withTimeout`

```ts
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  errorMsg?: string
): Promise<T>
```

Wraps an async function with a timeout. Uses `Promise.race()` to compete the operation against a timeout promise.

If the operation exceeds the timeout, throws an `Error` with the provided message (or a default message).

```ts
import { withTimeout } from './index.js';

const result = await withTimeout(
  async () => await slowDatabaseQuery(),
  5000,
  'Database query timed out after 5 seconds'
);
```

---

### Class: `Bulkhead`

```ts
class Bulkhead {
  constructor(maxConcurrent: number);
  async execute<T>(fn: () => Promise<T>): Promise<T>;
}
```

Implements the Bulkhead pattern: limits the number of concurrent executions of an operation. When the limit is reached, additional calls wait in a FIFO queue until a slot becomes available.

```ts
import { Bulkhead } from './index.js';

const bulkhead = new Bulkhead(10); // Max 10 concurrent operations

// All calls go through the bulkhead
const results = await Promise.all(
  Array.from({ length: 50 }, (_, i) =>
    bulkhead.execute(async () => {
      return await processItem(items[i]);
    })
  )
);
// At most 10 processItem calls run simultaneously
```

### Factory Function: `createBulkhead`

```ts
function createBulkhead(maxConcurrent: number): Bulkhead
```

Convenience factory.

---

## Configuration Options

### Aggressive Retry (Production)

```ts
const result = await withRetry(fn, {
  maxRetries: 5,
  baseDelayMs: 200,
  maxDelayMs: 5000,
  jitter: 0.5,
});
```

### Conservative Retry (Background Jobs)

```ts
const result = await withRetry(fn, {
  maxRetries: 10,
  baseDelayMs: 5000,
  maxDelayMs: 120000,
  jitter: 0.3,
});
```

### No Jitter (Deterministic Testing)

```ts
const result = await withRetry(fn, {
  maxRetries: 3,
  baseDelayMs: 1000,
  jitter: 0, // Fixed delays: 1s, 2s, 4s
});
```

---

## Usage Examples

### Combined Retry and Timeout

```ts
import { withRetry, withTimeout } from './index.js';

async function resilientFetch(url: string) {
  return await withRetry(
    async () => {
      return await withTimeout(
        async () => fetch(url),
        10000,
        `Request to ${url} timed out`
      );
    },
    {
      maxRetries: 3,
      retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT'],
    }
  );
}
```

### Bulkhead with Retry

```ts
import { withRetry, Bulkhead } from './index.js';

const bulkhead = new Bulkhead(5);

async function resilientProcess(item: any) {
  return await bulkhead.execute(async () => {
    return await withRetry(
      async () => processItem(item),
      { maxRetries: 3 }
    );
  });
}

// Process 100 items with at most 5 concurrent, each with 3 retries
const results = await Promise.all(
  items.map((item) => resilientProcess(item))
);
```

### API Call with Selective Retry

```ts
import { withRetry } from './index.js';
import { ErrorCodes } from '../error-handler/index.js';

async function callAgentService(message: string) {
  return await withRetry(
    async () => {
      const response = await fetch('https://agent.internal/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        const err = new Error(`HTTP ${response.status}`);
        (err as any).code = response.status === 429 ? 'RATE_LIMITED' : 'UPSTREAM_ERROR';
        throw err;
      }

      return response.json();
    },
    {
      maxRetries: 3,
      retryableErrors: ['RATE_LIMITED', 'UPSTREAM_ERROR', 'ECONNREFUSED', 'ETIMEDOUT'],
      baseDelayMs: 1000,
      maxDelayMs: 30000,
    }
  );
}
```

### Database Connection with Timeout

```ts
import { withTimeout } from './index.js';

async function connectToDatabase() {
  return await withTimeout(
    async () => {
      const conn = await createConnection(dbConfig);
      return conn;
    },
    30000,
    'Database connection timed out after 30 seconds'
  );
}
```

### Bulkhead for Resource Protection

```ts
import { createBulkhead } from './index.js';

// Limit concurrent LLM API calls to prevent rate limiting
const llmBulkhead = createBulkhead(3);

async function generateResponse(prompt: string) {
  return await llmBulkhead.execute(async () => {
    return await withRetry(
      async () => callLLMApi(prompt),
      { maxRetries: 2, retryableErrors: ['RATE_LIMITED'] }
    );
  });
}
```

---

## Integration Points

- **Error Handler** (`/home/runner/workspace/agent-gateway/src/error-handler/README.md`): The `retryableErrors` list can reference error codes from the error handler (e.g., `RATE_LIMITED`, `UPSTREAM_ERROR`, `TIMEOUT` are all marked as `retryable: true`).
- **Webhook Manager** (`/home/runner/workspace/agent-gateway/src/webhook-manager/README.md`): The webhook manager has its own built-in retry logic. For custom webhook delivery logic, `withRetry` can be used externally.
- **Message Bus** (`/home/runner/workspace/agent-gateway/src/message-bus/README.md`): Message bus handlers can use `withRetry` for resilient processing of published messages.
- **Middleware Pipeline** (`/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md`): Middleware functions can use `withTimeout` to enforce processing deadlines.
- **Infra Logger** (`/home/runner/workspace/agent-gateway/src/infra/`): Each retry attempt logs a warning with attempt number, max retries, delay, and error message.

---

## Error Handling

- **Non-Retryable Errors**: When `retryableErrors` is configured, errors whose `code` or `message` is not in the list are thrown immediately without retry.
- **Exhausted Retries**: After all retries are exhausted, the last error is thrown to the caller.
- **Timeout Errors**: `withTimeout` throws an `Error` with the provided message. This error's `message` field can be matched in `retryableErrors` if retrying on timeout is desired.
- **Bulkhead Queue Timeout**: The bulkhead has no timeout for queued operations. If all slots are permanently occupied, queued calls will wait indefinitely. Consider wrapping `bulkhead.execute()` with `withTimeout`.
- **No Retry State Exposure**: The module does not expose retry state (e.g., attempt number, next delay) to the caller. For visibility, rely on the structured log output.

---

## Retryable Error Codes from Error Handler

The following error codes from the [Error Handler](/home/runner/workspace/agent-gateway/src/error-handler/README.md) are marked as `retryable: true` and are natural candidates for the `retryableErrors` whitelist:

| Error Code          | HTTP Status | Description                        |
|---------------------|-------------|------------------------------------|
| `RATE_LIMITED`      | 429         | Rate limit exceeded                |
| `UPSTREAM_ERROR`    | 502         | Downstream service unavailable     |
| `TIMEOUT`           | 504         | Request timeout                    |
| `INTERNAL_ERROR`    | 500         | Unexpected server error            |
| `SERVICE_UNAVAILABLE` | 503       | Service temporarily unavailable    |

---

## Related Documentation

- [Error Handler](/home/runner/workspace/agent-gateway/src/error-handler/README.md) -- Error codes with `retryable` flag for selective retry configuration.
- [Webhook Manager](/home/runner/workspace/agent-gateway/src/webhook-manager/README.md) -- Built-in webhook retry with exponential backoff.
- [Message Bus](/home/runner/workspace/agent-gateway/src/message-bus/README.md) -- Resilient message handler processing.
- [Middleware Pipeline](/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md) -- Timeout enforcement in middleware.
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger for retry attempt logging.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
