# Infra (`src/infra/`)

> **Logging and custom error classes — the infrastructure foundation of Agent Gateway.**

---

## Overview

The `infra/` module provides the infrastructure foundation for Agent Gateway: structured logging via `pino` and a hierarchy of custom error classes for consistent error handling throughout the codebase.

Good logging and clear error types are essential for operating any production system. The infra module ensures both are handled consistently.

---

## File Structure

```
infra/
├── index.ts       # Barrel export + custom error classes
└── logger.ts      # Pino-based logger implementation
```

---

## Logger (`logger.ts`)

### Pino-Based Logger

The logger is built on `pino`, one of the fastest Node.js loggers available. It provides structured JSON logging with minimal overhead.

### Logger Singleton

```typescript
let logger: Logger;

function getLogger(): Logger {
  if (!logger) {
    logger = createLogger();
  }
  return logger;
}
```

### Log Levels

| Level | Usage |
|-------|-------|
| `trace` | Extremely detailed diagnostic info |
| `debug` | Debugging information for developers |
| `info` | Normal operational messages |
| `warn` | Warning conditions |
| `error` | Error conditions |
| `fatal` | Critical failures that may crash the process |

Default level: `info`

### Usage

```typescript
import { logger } from 'agent-gateway/infra';

// Simple message
logger.info('Server started on port 3000');

// Structured data
logger.info({ port: 3000, host: '0.0.0.0' }, 'Server started');

// Error logging
try {
  // ...
} catch (error) {
  logger.error({ error, channel: 'telegram' }, 'Failed to send message');
}

// Child logger (adds default fields)
const childLogger = logger.child({ module: 'telegram-channel' });
childLogger.info('Webhook received');
// Output: {"module":"telegram-channel","msg":"Webhook received"}
```

### Log Format

**Development** (with `pino-pretty`):
```
[2024-01-01T00:00:00.000Z] INFO (agent-gateway): Server started on port 3000
[2024-01-01T00:00:00.000Z] ERROR (agent-gateway): Failed to send message
    err: {
      "type": "Error",
      "message": "Channel not found",
      "stack": "Error: Channel not found\n    at ..."
    }
```

**Production** (JSON):
```json
{"level":30,"time":1704067200000,"msg":"Server started on port 3000","pid":1234,"hostname":"server"}
{"level":50,"time":1704067200000,"msg":"Failed to send message","err":{"type":"Error","message":"Channel not found"}}
```

### Creating a Logger

```typescript
function createLogger(options?: {
  level?: string;
  prettyPrint?: boolean;
  destination?: string | NodeJS.WritableStream;
}): Logger {
  return pino({
    level: options?.level || process.env.LOG_LEVEL || 'info',
    transport: options?.prettyPrint
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  }, options?.destination);
}
```

### Setting Log Level at Runtime

```typescript
import { setLogLevel } from 'agent-gateway/infra';

setLogLevel('debug');  // Increase verbosity
setLogLevel('error');  // Decrease verbosity
```

### Child Loggers

Child loggers inherit parent context and add additional fields:

```typescript
const telegramLogger = logger.child({ channel: 'telegram' });
telegramLogger.info('Bot started');
// {"level":30,"time":...,"channel":"telegram","msg":"Bot started"}

const nestedLogger = telegramLogger.child({ userId: '123' });
nestedLogger.info('Processing message');
// {"level":30,"time":...,"channel":"telegram","userId":"123","msg":"Processing message"}
```

---

## Custom Error Classes

### Error Hierarchy

```
Error
├── GatewayError          # Base error for all gateway errors
│   ├── ChannelError      # Channel-specific errors
│   ├── ProviderError     # Provider-specific errors
│   └── PluginError       # Plugin-specific errors
```

### `GatewayError`

Base error class for all gateway errors:

```typescript
class GatewayError extends Error {
  public code: string;
  public statusCode: number;
  public context: Record<string, unknown>;

  constructor(message: string, code: string, statusCode: number = 500, context?: object) {
    super(message);
    this.name = 'GatewayError';
    this.code = code;
    this.statusCode = statusCode;
    this.context = context || {};
  }
}
```

### `ChannelError`

Errors specific to channel operations:

```typescript
class ChannelError extends GatewayError {
  constructor(message: string, channelType: string, statusCode: number = 500) {
    super(message, `CHANNEL_${channelType.toUpperCase()}_ERROR`, statusCode, {
      channelType,
    });
  }
}
```

Usage:
```typescript
throw new ChannelError('Failed to send message', 'telegram', 500);
throw new ChannelError('Invalid token', 'discord', 401);
throw new ChannelError('Rate limited', 'slack', 429);
```

### `ProviderError`

Errors specific to provider operations:

```typescript
class ProviderError extends GatewayError {
  constructor(message: string, providerType: string, statusCode: number = 500) {
    super(message, `PROVIDER_${providerType.toUpperCase()}_ERROR`, statusCode, {
      providerType,
    });
  }
}
```

Usage:
```typescript
throw new ProviderError('API key invalid', 'openai', 401);
throw new ProviderError('Rate limited', 'anthropic', 429);
throw new ProviderError('Model not found', 'google', 404);
```

### `PluginError`

Errors specific to plugin operations:

```typescript
class PluginError extends GatewayError {
  constructor(message: string, pluginName: string, statusCode: number = 500) {
    super(message, `PLUGIN_${pluginName.toUpperCase()}_ERROR`, statusCode, {
      pluginName,
    });
  }
}
```

Usage:
```typescript
throw new PluginError('Manifest validation failed', 'my-plugin', 400);
throw new PluginError('Initialization failed', 'custom-tools', 500);
```

---

## Error Handling Patterns

### Try-Catch with Custom Errors

```typescript
try {
  await provider.chat(messages);
} catch (error) {
  if (error.status === 401) {
    throw new ProviderError('Invalid API key', provider.type, 401);
  }
  if (error.status === 429) {
    throw new ProviderError('Rate limited', provider.type, 429);
  }
  throw new ProviderError(error.message, provider.type, 500);
}
```

### Error Serialization

All custom errors serialize to a consistent JSON format:

```json
{
  "error": {
    "code": "CHANNEL_TELEGRAM_ERROR",
    "message": "Failed to send message",
    "statusCode": 500,
    "context": {
      "channelType": "telegram"
    }
  }
}
```

---

## Integration with Logging

Errors are logged with full context when caught:

```typescript
try {
  // ...
} catch (error) {
  if (error instanceof GatewayError) {
    logger.error(
      { error: error.code, context: error.context, stack: error.stack },
      error.message
    );
  } else {
    logger.error({ error }, 'Unexpected error');
  }
}
```

---

## Pino Transports

The logger can be configured with different transports for different environments:

### Development
```typescript
pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' }
  }
});
```

### Production
```typescript
pino({
  transport: {
    target: 'pino/file',
    options: { destination: '/var/log/agent-gateway/app.log' }
  }
});
```

### JSON to Cloud
```typescript
pino({
  transport: {
    target: 'pino-http-send',
    options: { url: 'https://logs.example.com/ingest' }
  }
});
```

---

## Related Documentation

- [`observability/`](../observability/README.md) — Metrics and tracing (complements logging)
- [`config/`](../config/README.md) — Configuration (log level setting)
- [`server/`](../server/README.md) — Server that uses the logger
