# Config Manager (`src/config-manager/`)

> **Hot-reloadable configuration with environment variable overrides, validation, dot-notation access, and change notification.**

---

## Table of Contents

1. [Overview](#overview)
2. [Difference from `src/config/`](#difference-from-srcconfig)
3. [File Structure](#file-structure)
4. [Class API](#class-api)
5. [Configuration Options](#configuration-options)
6. [Usage Examples](#usage-examples)
7. [Environment Variable Overrides](#environment-variable-overrides)
8. [Change History and Events](#change-history-and-events)
9. [Error Handling](#error-handling)
10. [Integration Points](#integration-points)
11. [Best Practices](#best-practices)
12. [Related Documentation](#related-documentation)

---

## Overview

The `config-manager/` module provides a general-purpose, runtime-configurable configuration management system for the Agent Gateway. It supports:

- **Hot-reloading** -- watches the configuration JSON file for changes and automatically reloads
- **Environment variable overrides** -- `ENV_VAR` values take precedence over file-based config
- **Validation** -- optional validation function that can reject invalid configurations
- **Dot-notation access** -- `config.get('providers.openai.apiKey')` instead of nested property access
- **Change history** -- tracks the last 1000 configuration changes with old/new values and source
- **Event-driven notifications** -- emits events when configuration changes
- **Change detection** -- automatically diffs old and new configs to identify what changed

Unlike the schema-driven `src/config/` module (which uses Zod validation and is tightly coupled to the `GatewayConfig` interface), this module is **schema-agnostic** and works with any JSON configuration structure. This makes it suitable for plugins, dynamic feature configuration, and runtime admin changes via API.

### Key Capabilities

| Capability | Description |
|-----------|-------------|
| File-based config | Loads from JSON file on disk |
| Environment overrides | `HOST`, `PORT`, `LOG_LEVEL`, provider keys, channel tokens |
| Hot reload | Watches file for changes (configurable) |
| Validation | Custom validation function with automatic revert on failure |
| Change tracking | Full audit trail of configuration changes |
| Event system | Emits `config:changed` events |
| Dot notation | Access nested config via `server.port` style paths |
| Runtime mutation | Set values at runtime via API or code |

---

## Difference from `src/config/`

Both modules handle configuration but serve different purposes:

| Feature | `config-manager/` | `src/config/` |
|---------|-------------------|---------------|
| Schema validation | Optional custom function | Zod schema (`GatewayConfigSchema`) |
| Typed config interface | Generic `Record<string, any>` | Strict `GatewayConfig` interface |
| Environment overrides | Built-in for common vars | Built-in (more comprehensive) |
| Hot reload | Built-in file watcher | Via `config/reloader.ts` (separate class) |
| Dot-notation access | Yes (`get('a.b.c')`) | No (typed object access) |
| Change history | Yes (up to 1000 entries) | Via `ConfigReloader` (separate class) |
| Runtime mutation | Yes (`set()`) | Yes (`set()`) |
| File persistence on set | No (in-memory only) | Yes (`save()` writes to file) |
| Use case | Dynamic, plugin-level, admin changes | Core gateway bootstrap configuration |

**Use `config-manager/`** when you need runtime changes, change auditing, event notifications, or working with arbitrary JSON structures. **Use `src/config/`** for the strongly-typed core gateway configuration with Zod validation.

---

## File Structure

```
config-manager/
├── index.ts          # ConfigManager class, factory function, type definitions
```

The module is a single file (~170 lines) containing the `ConfigManager` class with all configuration loading, merging, validation, and change-tracking logic.

---

## Class API

### Types

```typescript
interface ConfigChangeEvent {
  key: string;           // Dot-notation key path
  oldValue: any;         // Previous value
  newValue: any;         // New value
  source: 'file' | 'env' | 'api';  // Where the change originated
  timestamp: number;     // Unix timestamp in ms
}

interface ConfigManagerOptions {
  filePath?: string;                            // Config file path (default: 'agent-gateway.config.json')
  watchFile?: boolean;                          // Whether to watch for file changes (default: true)
  validate?: (config: any) => string | null;   // Validation function; returns error message or null
}
```

### `ConfigManager` Class

```typescript
class ConfigManager extends EventEmitter {
  constructor(options?: ConfigManagerOptions)

  // Loading
  load(): void

  // Access
  get<T = any>(key: string, defaultValue?: T): T
  getAll(): Record<string, any>

  // Mutation
  set(key: string, value: any, source?: 'file' | 'env' | 'api'): void

  // History
  getHistory(limit?: number): ConfigChangeEvent[]

  // Events
  on(event: 'config:changed', listener: (event: ConfigChangeEvent) => void): this
}
```

### Factory Function

```typescript
function createConfigManager(options?: ConfigManagerOptions): ConfigManager
```

---

## Configuration Options

### Constructor Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `filePath` | `string` | `'agent-gateway.config.json'` | Path to the JSON configuration file |
| `watchFile` | `boolean` | `true` | Enable file watching for hot-reload |
| `validate` | `(config: any) => string \| null` | `undefined` | Custom validation function. Return `null` for valid, or an error string |

### Supported Environment Variables

The `loadEnv()` method recognizes and maps these environment variables:

| Environment Variable | Config Key | Type |
|---------------------|-----------|------|
| `HOST` | `host` | `string` |
| `PORT` | `port` | `number` |
| `LOG_LEVEL` | `logging.level` | `string` |
| `DISABLE_BASH_TOOL` | `disableBashTool` | `boolean` ('1' = true) |
| `DISABLE_FS_TOOL` | `disableFsTool` | `boolean` ('1' = true) |
| `DISABLE_WEB_SEARCH` | `disableWebSearch` | `boolean` ('1' = true) |
| `OPENAI_API_KEY` | `providers[].settings.apiKey` | `string` |
| `OPENAI_MODEL` | `providers[].settings.model` | `string` |
| `ANTHROPIC_API_KEY` | `providers[].settings.apiKey` | `string` |
| `ANTHROPIC_MODEL` | `providers[].settings.model` | `string` |
| `TELEGRAM_TOKEN` | `channels[].settings.botToken` | `string` |

### Merge Priority

Configuration is merged in this order (later sources override earlier ones):

1. **File config** -- loaded from JSON file (lowest priority)
2. **Environment variables** -- override file config (highest priority)

The merge is deep: nested objects are merged recursively, and arrays are concatenated.

---

## Usage Examples

### Basic Initialization

```typescript
import { createConfigManager } from '../config-manager/index.js';

const config = createConfigManager({
  filePath: 'agent-gateway.config.json',
  watchFile: true,
});

// Access config with dot notation
const port = config.get('port', 3000);
const logLevel = config.get('logging.level', 'info');
const host = config.get('host', '0.0.0.0');

console.log(`Server running on ${host}:${port}`);
```

### Nested Access

```typescript
// Deep nested access with dot notation
const apiKey = config.get('providers.0.settings.apiKey');
const botToken = config.get('channels.0.settings.botToken');

// With default value
const timeout = config.get('server.timeout', 30000);
```

### Validation

```typescript
const config = createConfigManager({
  validate: (cfg) => {
    if (cfg.port && (cfg.port < 1 || cfg.port > 65535)) {
      return 'Port must be between 1 and 65535';
    }
    if (cfg.providers && !Array.isArray(cfg.providers)) {
      return 'providers must be an array';
    }
    return null;
  },
});
```

If validation fails, the configuration is automatically **reverted** to the previous valid state and an error is logged.

### Getting All Config

```typescript
const allConfig = config.getAll();
console.log(JSON.stringify(allConfig, null, 2));
// {
//   "host": "0.0.0.0",
//   "port": 3000,
//   "logging": { "level": "info" },
//   "providers": [...],
//   "channels": [...]
// }
```

### Runtime Configuration Changes

```typescript
// Change a setting at runtime (e.g., via admin API)
config.set('logging.level', 'debug', 'api');
config.set('disableBashTool', true, 'api');
config.set('providers.0.settings.model', 'gpt-4-turbo', 'api');
```

---

## Environment Variable Overrides

Environment variables always take precedence over file-based configuration. This allows operators to override settings without modifying files:

```bash
# Override port and host
export HOST=127.0.0.1
export PORT=8080

# Disable specific tools
export DISABLE_BASH_TOOL=1
export DISABLE_WEB_SEARCH=1

# Override provider configuration
export OPENAI_API_KEY="sk-proj-abc123"
export OPENAI_MODEL="gpt-4o"

# Change logging
export LOG_LEVEL=debug
```

When the config manager loads, it:
1. Reads the JSON file
2. Reads environment variables
3. Deep-merges with env vars taking priority
4. Runs validation (if configured)
5. Emits change events for any detected differences

---

## Change History and Events

### Change History

The config manager tracks every configuration change in a rolling history buffer (max 1000 entries):

```typescript
// Get the last 50 changes
const recent = config.getHistory(50);

// Recent returns:
// [
//   {
//     key: 'logging.level',
//     oldValue: 'info',
//     newValue: 'debug',
//     source: 'api',
//     timestamp: 1712345678901,
//   },
//   ...
// ]
```

### Events

```typescript
// Listen for any config change
config.on('config:changed', (event) => {
  console.log(`Config changed: ${event.key} from ${event.oldValue} to ${event.newValue} (source: ${event.source})`);
});

// React to specific changes
config.on('config:changed', (event) => {
  if (event.key === 'logging.level') {
    updateLogLevel(event.newValue);
  }
  if (event.key === 'providers') {
    reloadProviders(event.newValue);
  }
});
```

---

## Error Handling

### File Load Failures

If the config file does not exist or cannot be parsed, the manager starts with an empty configuration (no crash):

```
WARN { err: ..., path: "agent-gateway.config.json" } Failed to load config file
```

### Validation Failures

If the validation function rejects, the configuration is **automatically reverted** to the previous valid state:

```
ERROR { error: "Port must be between 1 and 65535" } Config validation failed
```

### File Watcher Errors

File watching errors are silently handled -- the manager continues with the current configuration:

```typescript
// If file doesn't exist when watcher starts
if (!existsSync(this.filePath)) return;
```

---

## Integration Points

### With `src/config/`

The two config modules can be used together. `src/config/` handles the typed `GatewayConfig` at bootstrap, while `config-manager/` handles runtime changes:

```typescript
import { getConfig } from '../config/index.js';
import { createConfigManager } from '../config-manager/index.js';

// Bootstrap with typed config
const typedConfig = getConfig();

// Runtime changes via config manager
const manager = createConfigManager();
manager.on('config:changed', (event) => {
  if (event.key === 'providers') {
    reloadProviderConnections(event.newValue);
  }
});
```

### With `src/feature-flags/`

Feature flags can be stored and managed via the config manager:

```typescript
manager.set('featureFlags.newProviderRouting', true, 'api');
const flags = manager.get('featureFlags', {});
```

### With `src/infra/` (Logger)

All config changes are logged via the shared logger. The logger itself can be reconfigured when `logging.level` changes:

```typescript
manager.on('config:changed', (event) => {
  if (event.key === 'logging.level') {
    logger.level = event.newValue;
  }
});
```

### With Dashboard

The config manager's `getAll()` and `getHistory()` methods can power a configuration dashboard:

```typescript
// Dashboard endpoint
app.get('/api/config', (req, res) => {
  res.json(manager.getAll());
});

app.get('/api/config/history', (req, res) => {
  res.json(manager.getHistory(100));
});

app.put('/api/config/:key', (req, res) => {
  manager.set(req.params.key, req.body.value, 'api');
  res.json({ ok: true });
});
```

---

## Best Practices

1. **Use dot notation for nested access** -- `config.get('providers.0.settings.apiKey')` is safer than chaining property access on potentially undefined values.

2. **Always provide default values** -- `config.get('timeout', 30000)` ensures your code works even if the key is missing.

3. **Validate early** -- provide a validation function to catch configuration errors before they cause runtime issues.

4. **Monitor change events** -- subscribe to `config:changed` to react to configuration changes without polling.

5. **Use the `source` field** -- differentiate between `file`, `env`, and `api` changes in your audit logs.

6. **Don't store secrets in config files** -- use environment variables for API keys and tokens. The config manager supports this pattern natively.

7. **Keep change history in production** -- the 1000-entry buffer is sufficient for auditing. Increase `maxHistory` if needed for compliance.

---

## Related Documentation

- [`src/config/`](../config/README.md) -- Core gateway configuration with Zod schema validation
- [`src/feature-flags/`](../feature-flags/README.md) -- Feature flag management (can be stored in config)
- [`src/dashboard/`](../dashboard/README.md) -- Dashboard for real-time config viewing
- [`src/infra/`](../infra/README.md) -- Shared logging infrastructure
- [12-Factor App: Config](https://12factor.net/config) -- Best practices for configuration management
