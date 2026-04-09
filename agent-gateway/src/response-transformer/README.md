# Response Transformer

## Overview

The **Response Transformer** module (`agent-gateway/src/response-transformer/`) provides standardized API response formatting, error normalization, pagination envelopes, and field-level selection/masking. It ensures that every HTTP response from the gateway follows a consistent envelope structure, making client integration predictable and enabling uniform error handling across the platform.

The module produces `ResponseEnvelope<T>` objects that wrap payload data with metadata including pagination info, timing, cache hints, and API versioning. Error responses are sanitized to prevent leaking internal implementation details to external consumers.

### Key Capabilities

- **Consistent Envelopes**: All responses follow a `{ success, data, error, meta, requestId, timestamp }` shape.
- **Pagination**: Automatic pagination metadata calculation (total pages, hasNext, hasPrev).
- **Field Selection**: Whitelist (`includeFields`) and blacklist (`excludeFields`) for controlling response payloads.
- **Field Masking**: Replace sensitive field values with a configurable mask string (default: `***`).
- **Error Sanitization**: Internal server error messages (5xx) are replaced with a generic message to prevent information leakage.
- **Timing Metadata**: Optional request timing metadata in the response envelope.
- **API Versioning**: Responses include the API version in metadata.

---

## File Structure

```
agent-gateway/src/response-transformer/
  index.ts              # Main implementation (ResponseTransformer class, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `../infra/index.js` (the shared `logger` singleton) for error-level logging when transforming error responses.

---

## Full API Documentation

### Interfaces

#### `ResponseEnvelope<T>`

The standard response wrapper returned by all transformation methods.

| Property    | Type            | Description                                    |
|-------------|-----------------|------------------------------------------------|
| `success`   | boolean         | Whether the request was successful              |
| `data`      | T?              | The response payload (present on success)       |
| `error`     | ErrorResponse?  | Error details (present on failure)              |
| `meta`      | ResponseMeta?   | Additional metadata                            |
| `requestId` | string?         | Correlated request ID                          |
| `timestamp` | number          | Epoch ms when the envelope was created          |

#### `ErrorResponse`

Error information included when `success` is `false`.

| Property  | Type     | Description                              |
|-----------|----------|------------------------------------------|
| `code`    | string   | Machine-readable error code              |
| `message` | string   | Human-readable error message (sanitized) |
| `details` | any?     | Additional error details                 |
| `traceId` | string?  | Request trace ID for support reference   |

#### `ResponseMeta`

Metadata envelope attached to responses.

| Property    | Type             | Description                                  |
|-------------|------------------|----------------------------------------------|
| `pagination`| PaginationInfo?  | Pagination metadata (for paginated responses)|
| `timing`    | object?          | `{ startMs, endMs, durationMs }`             |
| `cache`     | object?          | `{ hit: boolean; key?: string }`             |
| `version`   | string?          | API version string                           |

#### `PaginationInfo`

| Property    | Type    | Description                                |
|-------------|---------|--------------------------------------------|
| `page`      | number  | Current page number                        |
| `pageSize`  | number  | Items per page                             |
| `total`     | number  | Total items across all pages               |
| `totalPages`| number  | Total number of pages                      |
| `hasNext`   | boolean | Whether there is a next page               |
| `hasPrev`   | boolean | Whether there is a previous page           |

#### `TransformerOptions`

Configuration object for the transformer instance.

| Property        | Type                    | Default | Description                                   |
|-----------------|-------------------------|---------|-----------------------------------------------|
| `apiVersion`    | string                  | `'v2'`  | API version string included in meta           |
| `requestId`     | string                  | `undefined` | Request ID to include in envelope         |
| `includeTiming` | boolean                 | `true`  | Whether to include timing metadata            |
| `pagination`    | `{ page, pageSize, total }` | `undefined` | Pre-computed pagination info           |
| `includeFields` | string[]                | `undefined` | Whitelist of fields to include             |
| `excludeFields` | string[]                | `undefined` | Blacklist of fields to exclude             |
| `maskFields`    | string[]                | `undefined` | Fields to mask with `maskValue`            |
| `maskValue`     | string                  | `'***'` | Replacement value for masked fields           |

---

### Class: `ResponseTransformer`

#### Constructor

```ts
constructor(options?: TransformerOptions)
```

Creates a new transformer with the supplied options. All options have sensible defaults.

#### Methods

##### `success<T>(data: T, meta?: Partial<ResponseMeta>): ResponseEnvelope<T>`

Wraps successful data in the standard envelope.

```ts
const transformer = createResponseTransformer({ requestId: 'req-abc123' });
const response = transformer.success({ name: 'Alice', email: 'alice@example.com' });
// => { success: true, data: { name: 'Alice', email: 'alice@example.com' }, meta: {...}, requestId: 'req-abc123', timestamp: ... }
```

The data is processed through `transformData()` to apply field selection, exclusion, and masking.

##### `error(code: string, message: string, details?: any, statusCode?: number): ResponseEnvelope<never> & { statusCode: number }`

Creates an error response envelope.

```ts
const response = transformer.error('NOT_FOUND', 'User 42 not found', { userId: 42 }, 404);
// => { success: false, error: { code: 'NOT_FOUND', message: 'User 42 not found', ... }, statusCode: 404, ... }
```

**Error Sanitization**: For 5xx status codes, the `message` is replaced with `"An internal error occurred. Please try again later."` to prevent leaking internal details. The error is also logged via the shared infra logger.

##### `paginated<T>(data: T[], total: number, page: number, pageSize: number, meta?: Partial<ResponseMeta>): ResponseEnvelope<T[]>`

Creates a paginated response envelope. Automatically calculates `totalPages`, `hasNext`, and `hasPrev`.

```ts
const response = transformer.paginated(
  [{ id: 1 }, { id: 2 }],  // data
  50,                       // total items
  1,                        // current page
  10                        // page size
);
// => { success: true, data: [...], meta: { pagination: { page: 1, pageSize: 10, total: 50, totalPages: 5, hasNext: true, hasPrev: false } }, ... }
```

##### Private Methods

- **`transformData(data: any): any`**: Recursively applies `includeFields`, `excludeFields`, and `maskFields` transformations to the data object.
- **`filterFields(data: any): any`**: Filters error detail objects based on `includeFields` if set.
- **`buildMeta(extra?: Partial<ResponseMeta>): ResponseMeta`**: Constructs the metadata object with version and optional pagination.
- **`sanitizeErrorMessage(message: string, statusCode: number): string`**: Replaces 5xx error messages with a generic string.

---

### Factory Function

```ts
function createResponseTransformer(options?: TransformerOptions): ResponseTransformer
```

Convenience factory that instantiates a `ResponseTransformer`.

---

## Configuration Options

### Field Whitelisting

Only specified fields are included in the response:

```ts
const transformer = createResponseTransformer({
  includeFields: ['id', 'name', 'email'],
});
```

### Field Blacklisting

Specified fields are removed from the response:

```ts
const transformer = createResponseTransformer({
  excludeFields: ['password', 'internalNotes'],
});
```

### Field Masking

Sensitive fields are replaced with a mask value:

```ts
const transformer = createResponseTransformer({
  maskFields: ['ssn', 'creditCard', 'password'],
  maskValue: '[REDACTED]',
});
```

### API Versioning

```ts
const transformer = createResponseTransformer({
  apiVersion: 'v3',
  requestId: 'req-xyz',
});
```

---

## Usage Examples

### Express Response Wrapper

```ts
import express from 'express';
import { createResponseTransformer } from './index.js';

const app = express();

app.get('/api/users/:id', async (req, res) => {
  const transformer = createResponseTransformer({
    requestId: req.headers['x-request-id'] as string,
    includeTiming: true,
    maskFields: ['password', 'ssn'],
  });

  try {
    const user = await getUserById(req.params.id);
    const response = transformer.success(user);
    res.json(response);
  } catch (err) {
    const response = transformer.error('USER_NOT_FOUND', 'User not found', undefined, 404);
    res.status(response.statusCode).json(response);
  }
});
```

### Paginated List Endpoint

```ts
app.get('/api/users', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const { users, total } = await getUsersPaginated(page, pageSize);

  const transformer = createResponseTransformer({
    apiVersion: 'v2',
  });

  const response = transformer.paginated(users, total, page, pageSize);
  res.json(response);
});
```

### Field-Level Security

```ts
// Admin response -- all fields
const adminTransformer = createResponseTransformer();

// Public API response -- masked sensitive fields
const publicTransformer = createResponseTransformer({
  excludeFields: ['internalNotes', 'role'],
  maskFields: ['email'],
  maskValue: 'hidden@example.com',
});
```

### Error Handling with Sanitization

```ts
const transformer = createResponseTransformer({ requestId: 'req-123' });

// 4xx errors show original message
const clientError = transformer.error('VALIDATION_ERROR', 'Name is required', { field: 'name' }, 400);
// message: "Name is required"

// 5xx errors get sanitized
const serverError = transformer.error('DB_CONNECTION_FAILED', 'ECONNREFUSED 127.0.0.1:5432', undefined, 500);
// message: "An internal error occurred. Please try again later."
```

---

## Integration Points

- **Error Handler** (`/home/runner/workspace/agent-gateway/src/error-handler/`): The `error()` method can be used in tandem with the error handler's `toResponse()` method. The error handler provides structured error codes, while the response transformer handles envelope formatting.
- **Request Logger** (`/home/runner/workspace/agent-gateway/src/request-logger/`): The `requestId` in the response envelope correlates with request log entries.
- **Middleware Pipeline** (`/home/runner/workspace/agent-gateway/src/middleware-pipeline/`): The pipeline's `toExpressMiddleware()` can set up request context that the transformer uses (e.g., `requestId`).
- **Infra Logger** (`/home/runner/workspace/agent-gateway/src/infra/`): Error responses (5xx) are automatically logged via `logger.error()`.

---

## Error Handling

- **Sanitization**: All 5xx error messages are replaced with a generic message to prevent information leakage. This is non-configurable by design -- internal error details should never reach external consumers.
- **Null/Undefined Data**: `null` and `undefined` values pass through `transformData` unchanged.
- **Non-Object Data**: Primitive values (strings, numbers, booleans) are returned as-is without transformation.
- **Array Data**: Each element in an array is individually processed through the field transformation pipeline.

---

## Response Envelope Shape

Every successful response from this module follows this shape:

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "version": "v2",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  },
  "requestId": "req-abc123",
  "timestamp": 1712678400000
}
```

Every error response follows this shape:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "The requested resource was not found",
    "traceId": "req-abc123"
  },
  "meta": {
    "version": "v2"
  },
  "requestId": "req-abc123",
  "timestamp": 1712678400000,
  "statusCode": 404
}
```

---

## Related Documentation

- [Error Handler](/home/runner/workspace/agent-gateway/src/error-handler/README.md) -- Structured error codes, classification, and Express error middleware.
- [Request Logger](/home/runner/workspace/agent-gateway/src/request-logger/README.md) -- HTTP request logging with correlation IDs.
- [Middleware Pipeline](/home/runner/workspace/agent-gateway/src/middleware-pipeline/README.md) -- Middleware composition including response header management.
- [Request Tracker](/home/runner/workspace/agent-gateway/src/request-tracker/README.md) -- Distributed tracing with correlation IDs.
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
