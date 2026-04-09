# Middleware Pipeline

## Overview

The **Middleware Pipeline** module (`agent-gateway/src/middleware-pipeline/`) provides a composable, Express-compatible middleware chain execution engine with conditional execution, error handling, timing, and a rich library of pre-built middleware factories. It is the primary mechanism for assembling request-processing pipelines in the agent gateway.

The pipeline follows the Koa-style "onion model": each middleware receives a shared context object and a `next()` function. Calling `await next()` passes control to the next middleware in the chain; when the downstream middleware completes, control returns to the current middleware (post-`next()` code runs on the way back up).

### Key Capabilities

- **Composable Chain**: Add any number of middleware functions via `.use()`. They execute in registration order.
- **Conditional Execution**: `.when(predicate, middleware)` runs middleware only when a predicate function returns `true`.
- **Error Handling**: `.catchError(handler)` wraps downstream execution in a try/catch and invokes the handler on errors.
- **Built-in Timing**: `.withTiming(key)` automatically records execution duration.
- **Pre-built Middleware**: A `Middleware` namespace provides factories for authentication, tenant resolution, validation, rate limiting, CORS, request ID generation, logging, compression, and security headers.
- **Express Adapter**: `.toExpressMiddleware()` converts the pipeline into a standard Express middleware function.

---

## File Structure

```
agent-gateway/src/middleware-pipeline/
  index.ts              # Main implementation (MiddlewarePipeline class, Middleware namespace, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `../infra/index.js` (the shared `logger` singleton) -- available for custom middleware implementations.

---

## Full API Documentation

### Types

#### `MiddlewareFn`

```ts
type MiddlewareFn = (ctx: MiddlewareContext, next: () => Promise<void>) => Promise<void>;
```

The signature for every middleware function. `ctx` is the shared context object; `next` passes control to the subsequent middleware.

#### `MiddlewareContext`

```ts
interface MiddlewareContext {
  [key: string]: any;
  request?: any;
  response?: any;
  user?: any;
  tenant?: any;
  startTime: number;
  errors: Error[];
}
```

An extensible dictionary object that flows through the entire middleware chain. Properties are added by middleware as they execute.

---

### Class: `MiddlewarePipeline`

#### Constructor

```ts
constructor()
```

Creates an empty pipeline. No middleware is registered by default.

#### Methods

##### `use(fn: MiddlewareFn): this`

Appends a middleware function to the pipeline. Returns `this` for chaining.

```ts
pipeline
  .use(async (ctx, next) => {
    console.log('before');
    await next();
    console.log('after');
  })
  .use(async (ctx, next) => {
    ctx.customValue = 42;
    await next();
  });
```

##### `when(condition: (ctx: MiddlewareContext) => boolean, fn: MiddlewareFn): this`

Adds conditional middleware. The middleware only executes when `condition(ctx)` returns `true`.

```ts
pipeline.when(
  (ctx) => ctx.request?.method === 'POST',
  Middleware.validate(schema)
);
```

##### `catchError(handler: (error: Error, ctx: MiddlewareContext) => void | Promise<void>): this`

Adds error-handling middleware. Wraps downstream execution in try/catch, pushes errors to `ctx.errors`, and invokes the handler.

```ts
pipeline.catchError(async (error, ctx) => {
  console.error('Pipeline error:', error.message);
  ctx.response?.status(500).json({ error: error.message });
});
```

##### `withTiming(key?: string): this`

Adds a timing middleware that records the duration of all downstream middleware. Results are stored in `ctx.timing[key]`.

```ts
pipeline.withTiming('auth');    // Records auth pipeline duration
pipeline.withTiming('total');   // Default key
```

##### `async execute(initialContext?: Partial<MiddlewareContext>): Promise<MiddlewareContext>`

Executes the full middleware chain. Returns the populated context after all middleware have run.

```ts
const ctx = await pipeline.execute({ request: req, response: res });
console.log(ctx.user);    // Set by auth middleware
console.log(ctx.errors);  // Any captured errors
```

##### `toExpressMiddleware(): (req: any, res: any, next: () => void) => void`

Converts the pipeline into an Express-compatible middleware function.

```ts
app.use(pipeline.toExpressMiddleware());
```

On success, the context is merged into the request object via `Object.assign(req, ctx)`. On error, the error is passed to Express's error handler via `next(error)`.

##### `get size(): number`

Getter returning the number of registered middleware functions.

---

### Namespace: `Middleware`

Pre-built middleware factory functions.

#### `Middleware.auth(validateFn: (req: any) => Promise<any>): MiddlewareFn`

Authenticates the request and attaches the user to `ctx.user`.

```ts
pipeline.use(Middleware.auth(async (req) => {
  const token = req.headers.authorization;
  return await verifyToken(token);
}));
```

#### `Middleware.tenant(resolveFn: (user: any) => Promise<any>): MiddlewareFn`

Resolves the tenant from the authenticated user. Attaches to `ctx.tenant`. Only runs if `ctx.user` exists.

```ts
pipeline.use(Middleware.tenant(async (user) => {
  return await getTenantById(user.tenantId);
}));
```

#### `Middleware.validate(schema: any): MiddlewareFn`

Validates `ctx.request.body` against a Zod-like schema. Throws on validation failure.

```ts
pipeline.use(Middleware.validate(CreateUserSchema));
```

#### `Middleware.rateLimit(checkFn: (ctx: MiddlewareContext) => Promise<{ allowed: boolean; retryAfter?: number }>): MiddlewareFn`

Checks rate limits. Throws a 429 error if the request is not allowed.

```ts
pipeline.use(Middleware.rateLimit(async (ctx) => {
  return await rateLimiter.check(ctx.request.ip);
}));
```

#### `Middleware.cors(origins?: string[]): MiddlewareFn`

Sets CORS response headers. Default origin is `['*']`.

```ts
pipeline.use(Middleware.cors(['https://app.example.com']));
```

Headers set:
- `Access-Control-Allow-Origin`
- `Access-Control-Allow-Methods`
- `Access-Control-Allow-Headers`
- `Access-Control-Max-Age`

#### `Middleware.requestId(headerName?: string): MiddlewareFn`

Generates or reads a request ID from the specified header. Attaches to `ctx.requestId` and sets the response header.

```ts
pipeline.use(Middleware.requestId('X-Request-ID'));
```

#### `Middleware.requestLog(logFn: (ctx: MiddlewareContext) => void): MiddlewareFn`

Logs the request with duration. `logFn` is called after downstream middleware completes.

```ts
pipeline.use(Middleware.requestLog((ctx) => {
  console.log(`${ctx.request.method} ${ctx.request.path} - ${ctx.duration}ms`);
}));
```

#### `Middleware.compression(): MiddlewareFn`

Sets compression-related response headers (`Content-Encoding: gzip`, `Vary: Accept-Encoding`).

#### `Middleware.securityHeaders(): MiddlewareFn`

Sets a comprehensive set of security headers:

| Header                        | Value                                          |
|-------------------------------|------------------------------------------------|
| `X-Content-Type-Options`      | `nosniff`                                      |
| `X-Frame-Options`             | `DENY`                                         |
| `X-XSS-Protection`            | `1; mode=block`                                |
| `Strict-Transport-Security`   | `max-age=31536000; includeSubDomains`          |
| `Content-Security-Policy`     | `default-src 'self'`                           |
| `Referrer-Policy`             | `strict-origin-when-cross-origin`              |

---

### Factory Function

```ts
function createMiddlewarePipeline(): MiddlewarePipeline
```

Convenience factory that instantiates a new `MiddlewarePipeline`.

---

## Configuration Options

The pipeline itself has no constructor configuration -- it is configured entirely through middleware registration. However, individual pre-built middleware functions accept their own parameters (e.g., `cors(origins)`, `requestId(headerName)`).

---

## Usage Examples

### Full Gateway Pipeline

```ts
import { createMiddlewarePipeline, Middleware } from './index.js';
import { createErrorHandler } from '../error-handler/index.js';

const pipeline = createMiddlewarePipeline();
const errorHandler = createErrorHandler();

// 1. Security headers on every response
pipeline.use(Middleware.securityHeaders());

// 2. CORS
pipeline.use(Middleware.cors(['https://app.example.com']));

// 3. Request ID
pipeline.use(Middleware.requestId('X-Request-ID'));

// 4. Timing
pipeline.withTiming('total');

// 5. Auth (conditional -- skip for health endpoints)
pipeline.when(
  (ctx) => ctx.request?.path !== '/health',
  Middleware.auth(verifyAuthToken)
);

// 6. Tenant resolution (only if user exists)
pipeline.use(Middleware.tenant(resolveTenant));

// 7. Rate limiting
pipeline.use(Middleware.rateLimit(checkRateLimit));

// 8. Request logging
pipeline.use(Middleware.requestLog((ctx) => {
  logger.info({
    method: ctx.request.method,
    path: ctx.request.path,
    duration: ctx.duration,
    userId: ctx.user?.id,
  }, 'Request completed');
}));

// 9. Error handling
pipeline.catchError(async (error, ctx) => {
  const { statusCode, body } = errorHandler.toResponse(error, ctx.requestId);
  ctx.response.status(statusCode).json(body);
});

// Use with Express
app.use(pipeline.toExpressMiddleware());
```

### Minimal Pipeline

```ts
const pipeline = createMiddlewarePipeline();

pipeline
  .use(Middleware.requestId())
  .use(Middleware.securityHeaders())
  .withTiming('total');

app.use(pipeline.toExpressMiddleware());
```

### Custom Middleware

```ts
pipeline.use(async (ctx, next) => {
  // Pre-processing
  ctx.customHeader = ctx.request?.headers['x-custom'];

  await next();

  // Post-processing
  ctx.response?.setHeader('X-Custom-Response', ctx.customHeader);
});
```

### Conditional Pipeline

```ts
pipeline.when(
  (ctx) => ctx.request?.path.startsWith('/api/'),
  Middleware.validate(apiRequestSchema)
);

pipeline.when(
  (ctx) => ctx.request?.method === 'POST',
  Middleware.rateLimit(checkWriteRateLimit)
);
```

---

## Integration Points

- **Error Handler** (`/home/runner/workspace/agent-gateway/src/error-handler/`): The `catchError` handler typically delegates to `ErrorHandler.toResponse()` for consistent error formatting.
- **Request Logger** (`/home/runner/workspace/agent-gateway/src/request-logger/`): Use `Middleware.requestLog()` with a callback that feeds entries to the request logger.
- **Response Transformer** (`/home/runner/workspace/agent-gateway/src/response-transformer/`): The pipeline's context (`ctx.requestId`, `ctx.user`, etc.) provides data that the response transformer uses.
- **Auth Module** (`/home/runner/workspace/agent-gateway/src/auth/`): The `Middleware.auth()` factory can wrap the `Auth.verifyToken()` method.
- **API Key Manager** (`/home/runner/workspace/agent-gateway/src/api-key-manager/`): Custom auth middleware can use `ApiKeyManager.validate()` for API key authentication.

---

## Error Handling

- **Error Propagation**: Errors thrown by any middleware in the chain bubble up through all upstream middleware. Middleware that call `await next()` after an error throw can catch and handle the error.
- **Error Collection**: All errors are pushed to `ctx.errors[]`, so the final context always contains a full error history.
- **Express Adapter**: When used via `toExpressMiddleware()`, unhandled errors are passed to Express's default error handler via `next(error)`.
- **No Silent Failures**: The pipeline does not swallow errors. If no `catchError` handler is registered, errors propagate to the caller of `execute()`.

---

## Execution Order

Middleware executes in registration order. The "onion model" means:

```
use(A) -> use(B) -> use(C)

Execution flow:
  A (before next)
    B (before next)
      C (before next)
      C (after next)
    B (after next)
  A (after next)
```

This allows middleware to perform both pre-processing (before `await next()`) and post-processing (after `await next()`) logic.

---

## Related Documentation

- [Error Handler](/home/runner/workspace/agent-gateway/src/error-handler/README.md) -- Centralized error classification and Express error middleware.
- [Request Logger](/home/runner/workspace/agent-gateway/src/request-logger/README.md) -- Structured HTTP request logging.
- [Response Transformer](/home/runner/workspace/agent-gateway/src/response-transformer/README.md) -- Standardized response envelopes.
- [Auth Module](/home/runner/workspace/agent-gateway/src/auth/) -- User authentication and role management.
- [API Key Manager](/home/runner/workspace/agent-gateway/src/api-key-manager/README.md) -- API key lifecycle management.
- [Request Tracker](/home/runner/workspace/agent-gateway/src/request-tracker/README.md) -- Distributed tracing.
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
