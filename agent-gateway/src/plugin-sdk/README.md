# Plugin SDK (`src/plugin-sdk/`)

> **Plugin type definitions and base classes — the interface for extending Agent Gateway.**

---

## Overview

The `plugin-sdk/` module defines the TypeScript interfaces and abstract base classes that form the plugin system. It is the contract between the Agent Gateway core and any third-party plugin that extends its capabilities.

Plugins can add:
- **Channels**: New messaging platform adapters
- **Providers**: New AI model provider adapters
- **Tools**: New tools agents can execute
- **Hooks**: Custom lifecycle hook handlers
- **Agents**: Custom agent implementations

---

## File Structure

```
plugin-sdk/
└── index.ts    # Type definitions + base classes
```

---

## Type Definitions

### `PluginManifest`

Every plugin must declare its manifest:

```typescript
interface PluginManifest {
  /** Plugin name (should follow agent-gateway-plugin-<name> convention) */
  name: string;

  /** Semantic version */
  version: string;

  /** Human-readable description */
  description: string;

  /** Plugin author */
  author?: string;

  /** License */
  license?: string;

  /** Channels this plugin provides */
  channels?: ChannelManifest[];

  /** Providers this plugin provides */
  providers?: ProviderManifest[];

  /** Tools this plugin provides */
  tools?: ToolManifest[];

  /** Hooks this plugin registers */
  hooks?: HookManifest[];
}
```

### `Channel` Interface

```typescript
interface Channel {
  id: string;
  type: string;
  sendMessage(chatId: string, text: string, options?: SendMessageOptions): Promise<MessageResult>;
  start?(onMessage: (message: ChannelMessage) => void): Promise<void>;
  stop?(): Promise<void>;
  handleEvent?(data: unknown): Promise<ChannelMessage | null>;
  getInfo?(): Promise<ChannelInfo>;
}
```

### `Provider` Interface

```typescript
interface Provider {
  id: string;
  type: string;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ModelResponse>;
  chatWithTools?(messages: ChatMessage[], tools: Tool[], options?: ChatOptions): Promise<ModelResponseWithTools>;
  chatStream?(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string>;
  listModels?(): Promise<ModelInfo[]>;
}
```

### `Tool` Interface

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: object;  // JSON Schema
  parallel?: boolean;  // Whether this tool can be called in parallel
  execute(args: object, context?: ToolContext): Promise<string>;
}
```

### `Agent` Interface

```typescript
interface Agent {
  id: string;
  run(messages: ChatMessage[], options?: AgentOptions): Promise<ModelResponse>;
  addTool(tool: Tool): void;
  removeTool(name: string): boolean;
}
```

### `Plugin` Interface

```typescript
interface Plugin {
  manifest: PluginManifest;
  initialize?(context: PluginContext): Promise<void>;
  destroy?(): Promise<void>;
}
```

### `PluginContext` Interface

```typescript
interface PluginContext {
  /** Gateway instance — plugins can register channels, providers, etc. */
  gateway: Gateway;

  /** Configuration access */
  config: GatewayConfig;

  /** Logger for plugin output */
  logger: Logger;

  /** Event bus for publishing/subscribing */
  eventBus: EventBus;

  /** Hook registration */
  hooks: Hooks;

  /** Register a channel */
  registerChannel(id: string, channel: Channel): void;

  /** Register a provider */
  registerProvider(id: string, provider: Provider): void;

  /** Register a tool */
  registerTool(tool: Tool): void;

  /** Register a hook handler */
  registerHook(phase: HookPhase, handler: HookHandler): void;
}
```

---

## Base Classes

### `BaseChannel`

Abstract class providing common channel functionality:

```typescript
abstract class BaseChannel implements Channel {
  abstract id: string;
  abstract type: string;

  // Default implementations that can be overridden
  async start(onMessage: (message: ChannelMessage) => void): Promise<void> {
    // Default: no-op
  }

  async stop(): Promise<void> {
    // Default: no-op
  }

  abstract sendMessage(chatId: string, text: string, options?: SendMessageOptions): Promise<MessageResult>;
}
```

### `BaseProvider`

Abstract class providing common provider functionality:

```typescript
abstract class BaseProvider implements Provider {
  abstract id: string;
  abstract type: string;

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ModelResponse> {
    throw new Error('Not implemented');
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[], options?: ChatOptions): Promise<ModelResponseWithTools> {
    // Default: fall back to chat() without tool support
    return this.chat(messages, options);
  }

  async listModels(): Promise<ModelInfo[]> {
    return [];
  }
}
```

---

## Hook Phases

Plugins can register handlers for these lifecycle phases:

| Phase | When Fired | Handler Payload |
|-------|-----------|-----------------|
| `beforeMessage` | Before processing an incoming message | `{ message, channel }` |
| `afterMessage` | After message is added to session | `{ message, session }` |
| `beforeResponse` | Before sending AI response to user | `{ message, response }` |
| `afterResponse` | After response is sent | `{ message, response, channel }` |
| `beforeTool` | Before executing a tool | `{ toolName, args }` |
| `afterTool` | After tool execution | `{ toolName, args, result }` |
| `onError` | When an error occurs | `{ message, error, channel }` |
| `onSessionStart` | When a new session is created | `{ session }` |
| `onSessionEnd` | When a session is destroyed | `{ session }` |

---

## Plugin Lifecycle

### 1. Discovery
The `PluginLoader` scans for packages matching `agent-gateway-plugin-*` pattern.

### 2. Import
The plugin is dynamically imported via `import(pluginPackage)`.

### 3. Validation
The plugin's manifest is validated against the `PluginManifest` schema.

### 4. Context Creation
A `PluginContext` is created with access to the Gateway, config, logger, event bus, and registration methods.

### 5. Initialization
The plugin's `initialize(context)` method is called. During initialization, the plugin:
- Registers channels via `context.registerChannel()`
- Registers providers via `context.registerProvider()`
- Registers tools via `context.registerTool()`
- Registers hook handlers via `context.registerHook()`

### 6. Operation
The plugin operates alongside built-in components, indistinguishable from them.

### 7. Cleanup
On shutdown, `plugin.destroy()` is called for cleanup.

---

## Creating a Plugin

### Directory Structure

```
agent-gateway-plugin-mycustomtool/
├── package.json      # With "main" pointing to dist/index.js
├── src/
│   └── index.ts      # Plugin entry point
└── README.md
```

### package.json

```json
{
  "name": "agent-gateway-plugin-mycustomtool",
  "version": "1.0.0",
  "description": "A custom tool plugin for Agent Gateway",
  "main": "dist/index.js",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  }
}
```

### Plugin Entry Point

```typescript
import { Plugin, PluginManifest, PluginContext, Tool } from 'agent-gateway';

export const manifest: PluginManifest = {
  name: 'my-custom-tool',
  version: '1.0.0',
  description: 'Adds a custom tool for Agent Gateway',
  tools: [{
    name: 'my_custom_tool',
    description: 'Does something special',
  }],
};

export default class MyPlugin implements Plugin {
  manifest = manifest;

  async initialize(context: PluginContext): Promise<void> {
    context.registerTool({
      name: 'my_custom_tool',
      description: 'Does something special',
      parameters: {
        type: 'object',
        properties: { input: { type: 'string' } },
        required: ['input'],
      },
      execute: async ({ input }) => {
        // Custom tool logic
        return `Processed: ${input}`;
      },
    });

    context.logger.info('MyCustomTool registered');
  }

  async destroy(): Promise<void> {
    // Cleanup
  }
}
```

---

## Plugin Conventions

### Naming
- Prefix: `agent-gateway-plugin-`
- Suffix: Descriptive name (e.g., `-slack-advanced`, `-custom-tools`)

### Dependencies
- Only depend on `agent-gateway` as a peer dependency
- Do not bundle the gateway — it's provided at runtime

### Security
- Plugins run with full Node.js permissions
- Only install plugins from trusted authors
- Plugins should validate their own inputs

### Logging
- Use `context.logger` for all output
- Prefix log messages with the plugin name

---

## Related Documentation

- [`plugins/`](../plugins/README.md) — Plugin loader that uses the SDK
- [`tools/`](../tools/README.md) — Built-in tools that plugins can extend
- [`hooks/`](../hooks/README.md) — Lifecycle system plugins hook into
- [`gateway/`](../gateway/README.md) — Gateway that plugins register with
