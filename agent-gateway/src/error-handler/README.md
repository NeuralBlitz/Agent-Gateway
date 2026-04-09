# Error Handler

## Overview

The **Error Handler** module (`agent-gateway/src/error-handler/`) provides centralized error classification, formatting, masking, and reporting with structured error codes. It ensures that every error flowing through the gateway is categorized, assigned an appropriate HTTP status code, sanitized for external consumption, and optionally reported to an external monitoring service.

The module defines a canonical set of `ErrorCodes` that map error names to categories, HTTP status codes, machine-readable messages, and user-friendly messages. This creates a single source of truth for error semantics across the entire gateway.

### Key Capabilities

- **Structured Error Codes**: Ten predefined error codes covering validation, authentication, rate limiting, conflicts, upstream failures, timeouts, and internal errors.
- **Error Classification**: Automatic categorization into `client`, `server`, `upstream`, `auth`, `rate-limit`, `validation`, `not-found`, `conflict`, and `forbidden`.
- **Response Formatting**: Converts any error into a consistent `{ success: false, error: { code, message, traceId, details } }` JSON shape.
- **Message Sanitization**: User-facing messages are friendly; internal stack traces are optionally included only for server errors.
- **Express Middleware**: Drop-in error handler middleware via `.middleware()`.
- **External Reporting**: Optional `reportFn` callback for integration with Sentry, Datadog, or custom monitoring services.
- **Retryability Metadata**: Each error code includes a `retryable` flag indicating whether the client should retry.

---

## File Structure

```
agent-gateway/src/error-handler/
  index.ts              # Main implementation (ErrorHandler class, ErrorCodes, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `../infra/index.js` (the shared `logger` singleton) for logging server-level errors (status >= 500).

---

## Full API Documentation

### Types

#### `ErrorCategory`

```ts
type ErrorCategory =
  | 'client'
  | 'server'
  | 'upstream'
  | 'auth'
  | 'rate-limit'
  | 'validation'
  | 'not-found'
  | 'conflict'
  | 'forbidden';
```

#### `ErrorCode`

```ts
interface ErrorCode {
  code: string;
  category: ErrorCategory;
  statusCode: number;
  message: string;
  userMessage?: string;
  retryable: boolean;
}
```

#### `ErrorReport`

```ts
interface ErrorReport {
  code: string;
  category: ErrorCategory;
  statusCode: number;
  message: string;
  userMessage: string;
  details?: Record<string, any>;
  traceId?: string;
  timestamp: number;
  stack?: string;
}
```

---

### Predefined Error Codes

The module exports a `ErrorCodes` dictionary with the following entries:

| Code               | Category     | HTTP Status | User Message                                      | Retryable |
|--------------------|--------------|-------------|---------------------------------------------------|-----------|
| `VALIDATION_ERROR` | validation   | 400         | Invalid request format                            | No        |
| `NOT_FOUND`        | not-found    | 404         | The requested resource was not found              | No        |
| `UNAUTHORIZED`     | auth         | 401         | Please authenticate to access this resource       | No        |
| `FORBIDDEN`        | forbidden    | 403         | You do not have permission to access this resource| No        |
| `RATE_LIMITED`     | rate-limit   | 429         | Too many requests. Please try again later.        | Yes       |
| `CONFLICT`         | conflict     | 409         | The request conflicts with current state          | No        |
| `UPSTREAM_ERROR`   | upstream     | 502         | A downstream service is unavailable               | Yes       |
| `TIMEOUT`          | server       | 504         | The request took too long to process              | Yes       |
| `INTERNAL_ERROR`   | server       | 500         | An unexpected error occurred                      | Yes       |
| `SERVICE_UNAVAILABLE` | server    | 503         | The service is temporarily unavailable            | Yes       |

---

### Class: `ErrorHandler`

#### Constructor

```ts
constructor(includeStack?: boolean, reportFn?: (report: ErrorReport) => void)
```

| Parameter     | Type      | Default     | Description                                        |
|---------------|-----------|-------------|----------------------------------------------------|
| `includeStack`| boolean   | `false`     | Whether to include stack traces in error reports   |
| `reportFn`    | function  | `undefined` | Callback invoked for errors with status >= 400     |

#### Methods

##### `createReport(err: Error | any, traceId?: string): ErrorReport`

Creates a full `ErrorReport` from any error object. The method follows a priority chain:

1. If the error has a `code` property that matches a known `ErrorCodes` entry, use that code's metadata.
2. If the error has a `statusCode` property, classify by HTTP status and find the matching error code.
3. Default to `INTERNAL_ERROR` (500).

Stack traces are only included when `includeStack` is `true` (and for server errors by default).

##### `toResponse(err: Error | any, traceId?: string): { statusCode: number; body: any }`

Formats an error for API response. Returns an object with `statusCode` and `body`.

The response body shape:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource was not found",
    "traceId": "req-abc123",
    "details": { "resourceId": 42 }
  }
}
```

Server errors (status >= 500) are automatically logged via `logger.error()`. If `reportFn` is configured, all errors with status >= 400 are reported.

##### `middleware(): (err: Error, req: any, res: any, next: () => void) => void`

Returns an Express-compatible error handler middleware function. Reads `traceId` from `req.headers['x-request-id']` or `req.id`, formats the error, and sends the JSON response.

```ts
app.use(errorHandler.middleware());
// Must be the last middleware registered
```

##### Private Methods

- **`classifyByStatus(statusCode: number): ErrorCategory`**: Maps HTTP status codes to error categories.
- **`getCodeForStatus(statusCode: number): string`**: Finds the matching error code name for a given status.
- **`getUserMessage(statusCode: number, message: string): string`**: Returns the user-friendly message for the status code.

---

### Factory Function

```ts
function createErrorHandler(includeStack?: boolean, reportFn?: (report: ErrorReport) => void): ErrorHandler
```

Convenience factory.

---

## Configuration Options

### Basic Setup

```ts
import { createErrorHandler } from './index.js';

const handler = createErrorHandler();
```

### With Stack Traces (Development)

```ts
const handler = createErrorHandler(true);
```

### With External Reporting (Production)

```ts
const handler = createErrorHandler(false, (report) => {
  // Send to Sentry, Datadog, etc.
  sentry.captureException(new Error(report.message), {
    extra: { code: report.code, category: report.category, traceId: report.traceId },
  });
});
```

---

## Usage Examples

### Express Integration

```ts
import express from 'express';
import { createErrorHandler, ErrorCodes } from './index.js';

const app = express();
const errorHandler = createErrorHandler(false, (report) => {
  monitoringService.report(report);
});

// Application routes
app.get('/users/:id', async (req, res, next) => {
  try {
    const user = await getUser(req.params.id);
    if (!user) {
      const err = new Error('User not found');
      err.code = 'NOT_FOUND';
      err.details = { userId: req.params.id };
      throw err;
    }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// Error handler -- must be registered AFTER all routes
app.use(errorHandler.middleware());
```

### Programmatic Error Response

```ts
import { createErrorHandler, ErrorCodes } from './index.js';

const handler = createErrorHandler();

// In a service layer
try {
  await callUpstreamService();
} catch (err) {
  const { statusCode, body } = handler.toResponse(err, reqId);
  // statusCode: 502
  // body: { success: false, error: { code: 'UPSTREAM_ERROR', message: 'A downstream service is unavailable', ... } }
  return { statusCode, body };
}
```

### Custom Error with Known Code

```ts
const err = new Error('Detailed validation error');
err.code = 'VALIDATION_ERROR';
err.details = { field: 'email', reason: 'Invalid format' };

const report = handler.createReport(err, 'req-123');
// report.code === 'VALIDATION_ERROR'
// report.category === 'validation'
// report.statusCode === 400
// report.userMessage === 'Invalid request format'
```

### Error in Middleware

```ts
import { createMiddlewarePipeline, Middleware } from '../middleware-pipeline/index.js';
import { createErrorHandler } from './index.js';

const pipeline = createMiddlewarePipeline();
const errorHandler = createErrorHandler();

pipeline.catchError(async (error, ctx) => {
  const { statusCode, body } = errorHandler.toResponse(error, ctx.requestId);
  ctx.response.status(statusCode).json(body);
});
```

---

## Integration Points

- **Middleware Pipeline** (`/home/runner/workspace/agent-gateway/src/middleware-pipeline/`): The `ErrorHandler.middleware()` is typically registered as the final middleware in the pipeline. The pipeline's `catchError` can also use `toResponse()` for inline error handling.
- **Response Transformer** (`/home/runner/workspace/agent-gateway/src/response-transformer/`): The response transformer's `error()` method provides an alternative way to format errors. The two modules can be used together: the error handler for classification, the transformer for envelope formatting.
- **Request Logger** (`/home/runner/workspace/agent-gateway/src/request-logger/`): Server errors logged by the error handler (via `logger.error()`) are also captured by the request logger when status >= 500.
- **Retry Handler** (`/home/runner/workspace/agent-gateway/src/retry-handler/README.md`): The `retryable` flag on error codes can inform retry decisions.
- **Request Tracker** (`/home/runner/workspace/agent-gateway/src/request-tracker/README.md`): The `traceId` in error reports correlates with trace spans.

---

## Error Handling

- **Unknown Errors**: Errors that do not match any known code or status code default to `INTERNAL_ERROR` (500) with a generic user message.
- **Stack Traces**: Stack traces are only included in reports when `includeStack` is `true`. They are never included in the API response body sent to clients.
- **Error Details**: The `details` field from the original error is passed through to both the report and the response body, enabling rich error context for debugging.
- **Reporting Failures**: If `reportFn` throws, the error is not caught by the handler. The reporting callback should have its own error handling.

---

## Error Code Design Principles

1. **Machine-Readable Code**: The `code` field (e.g., `VALIDATION_ERROR`) is stable across versions and safe for client-side switch statements.
2. **Human-Readable Message**: The `userMessage` is safe to display directly to end users.
3. **Categorization**: The `category` enables centralized logging dashboards and alerting rules.
4. **Retryability**: The `retryable` flag enables automated retry logic in clients and the retry handler module.
5. **HTTP Mapping**: Each code maps to a single canonical HTTP status code, ensuring consistency.

---

## Related Documentation

- [Middleware Pipeline](/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md) -- Pipeline composition with error handling support.
- [Response Transformer](/home/runner/workspace/agent-gateway/src/response-transformer/README.md) -- Response envelope formatting with error normalization.
- [Request Logger](/home/runner/workspace/agent-gateway/src/request-logger/README.md) -- HTTP request logging for error monitoring.
- [Retry Handler](/home/runner/workspace/agent-gateway/src/retry-handler/README.md) -- Retry logic with backoff; uses `retryable` flag.
- [Request Tracker](/home/runner/workspace/agent-gateway/src/request-tracker/README.md) -- Trace correlation for error investigation.
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
