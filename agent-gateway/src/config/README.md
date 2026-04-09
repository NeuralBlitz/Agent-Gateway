# Config (`src/config/`)

> **Configuration management with Zod validation — type-safe, multi-source config loading.**

---

## Overview

The `config/` module implements a type-safe configuration system for Agent Gateway. Configuration is loaded from multiple sources (environment variables, JSON files, defaults), validated with Zod schemas, and provided as a singleton throughout the application.

The design ensures that:
1. **Config is always valid** — validation happens at load time
2. **Config is type-safe** — TypeScript types match Zod schema
3. **Config is consistent** — singleton pattern prevents conflicting views
4. **Sensitive values are masked** — API keys and tokens are hidden in logs

---

## File Structure

```
config/
└── index.ts    # Zod schemas + Config class + getConfig() singleton
```

---

## Zod Schemas

All configuration is validated against Zod schemas, providing runtime type safety:

```typescript
const GatewayConfigSchema = z.object({
  host: z.string().default('0.0.0.0'),
  port: z.number().int().positive().default(3000),
  logLevel: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),

  channels: z.object({
    telegram: z.object({ token: z.string() }).optional(),
    discord: z.object({ token: z.string() }).optional(),
    slack: z.object({ token: z.string() }).optional(),
    whatsapp: z.object({
      token: z.string(),
      phoneNumberId: z.string(),
    }).optional(),
    signal: z.object({}).optional(),
    matrix: z.object({
      homeserverUrl: z.string(),
      accessToken: z.string(),
    }).optional(),
  }).default({}),

  providers: z.object({
    openai: z.object({
      apiKey: z.string(),
      model: z.string().optional(),
      baseUrl: z.string().optional(),
    }).optional(),
    anthropic: z.object({
      apiKey: z.string(),
      model: z.string().optional(),
    }).optional(),
    google: z.object({
      apiKey: z.string(),
      model: z.string().optional(),
    }).optional(),
    mistral: z.object({
      apiKey: z.string(),
      model: z.string().optional(),
    }).optional(),
    deepseek: z.object({
      apiKey: z.string(),
      model: z.string().optional(),
    }).optional(),
    ollama: z.object({
      baseUrl: z.string().optional(),
      model: z.string().optional(),
    }).optional(),
  }).default({}),

  systemPrompt: z.string().default('You are a helpful assistant.'),
  agent: z.object({
    maxSteps: z.number().int().positive().default(10),
    contextStrategy: z.enum(['truncate', 'summarize', 'error']).default('truncate'),
  }).default({}),

  sessions: z.object({
    backend: z.enum(['memory', 'file', 'database', 'redis']).default('file'),
    ttl: z.number().int().positive().default(3600),
    maxMessages: z.number().int().positive().default(50),
    cleanupInterval: z.number().int().positive().default(300),
  }).default({}),

  auth: z.object({
    enabled: z.boolean().default(false),
    apiKey: z.string().optional(),
    sessionTimeout: z.number().int().positive().default(86400),
  }).default({}),

  rateLimit: z.object({
    global: z.object({ points: z.number().int().positive(), duration: z.number().int().positive() }).optional(),
    perChannel: z.object({ points: z.number().int().positive(), duration: z.number().int().positive() }).optional(),
    perUser: z.object({ points: z.number().int().positive(), duration: z.number().int().positive() }).optional(),
  }).optional(),

  cache: z.object({
    enabled: z.boolean().default(false),
    ttl: z.number().int().positive().default(300),
    maxSize: z.number().int().positive().default(1000),
  }).default({}),

  tools: z.object({
    allowedDirs: z.array(z.string()).default([]),
    disableBash: z.boolean().default(false),
    disableFs: z.boolean().default(false),
    disableWebSearch: z.boolean().default(false),
  }).default({}),

  webhooks: z.object({
    enabled: z.boolean().default(true),
    secret: z.string().optional(),
  }).default({}),
});
```

---

## The `Config` Class

### Singleton Pattern

```typescript
class Config {
  private static instance: Config;
  private data: GatewayConfig;

  static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private constructor() {
    this.data = this.load();
  }
}
```

### Methods

#### `load()`

Loads configuration from multiple sources with precedence:

1. **Environment variables** (highest priority)
2. **JSON config file** (`agent-gateway.config.json`)
3. **Defaults** (lowest priority)

```typescript
private load(): GatewayConfig {
  // 1. Load from config file
  const fileConfig = this.loadFromFile();

  // 2. Merge with environment variables (override file config)
  const envConfig = this.loadFromEnv();

  // 3. Merge with defaults
  const merged = deepMerge(defaults, fileConfig, envConfig);

  // 4. Validate with Zod
  return GatewayConfigSchema.parse(merged);
}
```

#### `get(key?: string)`

Gets a config value by dot-notation key:

```typescript
config.get('host');                    // "0.0.0.0"
config.get('providers.openai.model');  // "gpt-4o"
config.get();                          // Returns entire config object
```

#### `set(key: string, value: unknown)`

Sets a config value at runtime:

```typescript
config.set('logLevel', 'debug');
config.set('agent.maxSteps', 20);
```

Note: Changes are in-memory only. To persist, call `save()`.

#### `save()`

Saves the current config to the JSON file:

```typescript
await config.save();
```

#### `getChannel(type: string)`

Gets configuration for a specific channel:

```typescript
const telegramConfig = config.getChannel('telegram');
// { token: "..." }
```

#### `getProvider(type: string)`

Gets configuration for a specific provider:

```typescript
const openaiConfig = config.getProvider('openai');
// { apiKey: "sk-...", model: "gpt-4o" }
```

---

## Environment Variable Mapping

Environment variables map to config fields:

| Env Variable | Config Path | Type |
|--------------|-------------|------|
| `HOST` | `host` | `string` |
| `PORT` | `port` | `number` |
| `LOG_LEVEL` | `logLevel` | `string` |
| `SYSTEM_PROMPT` | `systemPrompt` | `string` |
| `TELEGRAM_TOKEN` | `channels.telegram.token` | `string` |
| `DISCORD_TOKEN` | `channels.discord.token` | `string` |
| `SLACK_TOKEN` | `channels.slack.token` | `string` |
| `WHATSAPP_TOKEN` | `channels.whatsapp.token` | `string` |
| `WHATSAPP_PHONE_ID` | `channels.whatsapp.phoneNumberId` | `string` |
| `MATRIX_HOMESERVER_URL` | `channels.matrix.homeserverUrl` | `string` |
| `MATRIX_ACCESS_TOKEN` | `channels.matrix.accessToken` | `string` |
| `OPENAI_API_KEY` | `providers.openai.apiKey` | `string` |
| `OPENAI_MODEL` | `providers.openai.model` | `string` |
| `ANTHROPIC_API_KEY` | `providers.anthropic.apiKey` | `string` |
| `GOOGLE_API_KEY` | `providers.google.apiKey` | `string` |
| `MISTRAL_API_KEY` | `providers.mistral.apiKey` | `string` |
| `DEEPSEEK_API_KEY` | `providers.deepseek.apiKey` | `string` |
| `OLLAMA_BASE_URL` | `providers.ollama.baseUrl` | `string` |
| `AGENT_MAX_STEPS` | `agent.maxSteps` | `number` |
| `AGENT_CONTEXT_STRATEGY` | `agent.contextStrategy` | `string` |
| `SESSION_BACKEND` | `sessions.backend` | `string` |
| `SESSION_TTL` | `sessions.ttl` | `number` |
| `AUTH_ENABLED` | `auth.enabled` | `boolean` |
| `AUTH_API_KEY` | `auth.apiKey` | `string` |
| `DISABLE_BASH_TOOL` | `tools.disableBash` | `boolean` |
| `DISABLE_FS_TOOL` | `tools.disableFs` | `boolean` |
| `DISABLE_WEB_SEARCH` | `tools.disableWebSearch` | `boolean` |
| `AGENT_SESSIONS_DIR` | `sessions.dir` | `string` |

---

## Sensitive Value Masking

When config values are printed (e.g., in `config list`), sensitive values are automatically masked:

```typescript
function maskValue(key: string, value: string): string {
  if (key.match(/key|token|secret|password/i)) {
    return `${value.slice(0, 4)}...${value.slice(-4)}`;
  }
  return value;
}
```

Output:
```
host: "0.0.0.0"
port: 3000
providers.openai.apiKey: "sk-p...xyz"
channels.telegram.token: "1234...wxyz"
logLevel: "info"
```

---

## Config File Example

```jsonc
// agent-gateway.config.json
{
  "host": "0.0.0.0",
  "port": 3000,
  "logLevel": "info",
  "channels": {
    "telegram": { "token": "${TELEGRAM_TOKEN}" },
    "discord": { "token": "${DISCORD_TOKEN}" }
  },
  "providers": {
    "openai": {
      "apiKey": "${OPENAI_API_KEY}",
      "model": "gpt-4o"
    }
  },
  "systemPrompt": "You are a helpful assistant.",
  "agent": {
    "maxSteps": 10,
    "contextStrategy": "truncate"
  },
  "sessions": {
    "backend": "file",
    "ttl": 3600
  },
  "tools": {
    "allowedDirs": ["/home/user/workspace"]
  }
}
```

Environment variable references (`${VAR_NAME}`) in the config file are automatically expanded from `process.env`.

---

## Deep Merge Strategy

Config from different sources is merged using a deep merge strategy:

```typescript
function deepMerge(...objects: object[]): object {
  const result = {};
  for (const obj of objects) {
    for (const key of Object.keys(obj)) {
      if (isObject(result[key]) && isObject(obj[key])) {
        result[key] = deepMerge(result[key], obj[key]);
      } else {
        result[key] = obj[key];
      }
    }
  }
  return result;
}
```

This ensures that partial configs from different sources are properly combined:

```typescript
// Defaults:   { agent: { maxSteps: 10, contextStrategy: "truncate" } }
// File:       { agent: { maxSteps: 20 } }
// Result:     { agent: { maxSteps: 20, contextStrategy: "truncate" } }
```

---

## Related Documentation

- [`commands/config.ts`](../commands/README.md) — CLI config management commands
- [`infra/`](../infra/README.md) — Infrastructure that uses config (log level)
- [`server/`](../server/README.md) — Server that uses config at startup
