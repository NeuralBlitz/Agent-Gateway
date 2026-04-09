# Plugins (`src/plugins/`)

> **Runtime plugin loader — dynamically import and manage npm plugin packages.**

---

## Overview

The `plugins/` module implements the `PluginLoader` class, which discovers, imports, validates, and manages third-party npm plugins at runtime. Plugins extend Agent Gateway with custom channels, providers, tools, and hooks.

The loader follows a strict lifecycle: discover → import → validate → initialize → register → operate → destroy.

---

## File Structure

```
plugins/
└── loader.ts    # PluginLoader implementation
```

---

## The `PluginLoader` Class

### Constructor

```typescript
new PluginLoader(config: {
  plugins?: string[];       // List of plugin package names
  pluginDir?: string;       // Directory to search for local plugins
  autoDiscover?: boolean;   // Whether to scan node_modules for plugins
})
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `plugins` | `[]` | Explicit list of npm packages to load |
| `pluginDir` | `./plugins` | Local directory to search for plugins |
| `autoDiscover` | `false` | Scan `node_modules` for `agent-gateway-plugin-*` packages |

---

## Plugin Lifecycle

### Phase 1: Discovery

The loader finds plugins through two mechanisms:

#### Explicit Configuration
```json
{
  "plugins": [
    "agent-gateway-plugin-custom-tools",
    "agent-gateway-plugin-slack-advanced"
  ]
}
```

#### Auto-Discovery
When `autoDiscover: true`, the loader scanss `node_modules` for packages matching the pattern `agent-gateway-plugin-*`:

```typescript
const plugins = await this.discoverPlugins();
// ['agent-gateway-plugin-custom-tools', 'agent-gateway-plugin-slack-advanced']
```

### Phase 2: Import

Each plugin is dynamically imported:

```typescript
const pluginModule = await import(pluginPackage);
```

The module may export:
- A default class implementing the `Plugin` interface
- Named exports: `manifest`, `default` (class), `initialize`, etc.

### Phase 3: Validation

The plugin's manifest is validated:

```typescript
const manifest = pluginModule.manifest ?? plugin.default?.manifest;
if (!manifest) {
  throw new Error(`Plugin ${pluginPackage} has no manifest`);
}
validateManifest(manifest); // Zod validation
```

Validation checks:
- `name` is a non-empty string
- `version` is valid semver
- `description` is a non-empty string
- Channel/provider/tool declarations have required fields

### Phase 4: Context Creation

A `PluginContext` is created for each plugin:

```typescript
const context = createPluginContext({
  gateway,
  config,
  logger: childLogger(`plugin:${manifest.name}`),
  eventBus,
  hooks,
  registerChannel: (id, channel) => gateway.registerChannel(id, channel),
  registerProvider: (id, provider) => gateway.registerProvider(id, provider),
  registerTool: (tool) => toolRegistry.addTool(tool),
  registerHook: (phase, handler) => hooks.register(phase, handler),
});
```

### Phase 5: Initialization

The plugin's `initialize(context)` method is called:

```typescript
const plugin = new pluginModule.default();
await plugin.initialize(context);
```

During initialization, the plugin registers its components through the context.

### Phase 6: Operation

The plugin's components operate alongside built-in components:
- **Channels**: Receive and send messages like any other channel
- **Providers**: Called by agents like any other provider
- **Tools**: Executed by agents like any other tool
- **Hooks**: Fired at the appropriate lifecycle phases

### Phase 7: Cleanup

On shutdown, each plugin's `destroy()` method is called:

```typescript
for (const plugin of this.plugins) {
  await plugin.destroy();
}
```

---

## Plugin Management API

### `load()`

Loads all discovered and configured plugins:

```typescript
await loader.load();
```

Steps:
1. Discover plugins (from config and/or auto-discovery)
2. Import each plugin
3. Validate manifest
4. Create context
5. Initialize plugin
6. Track plugin state

### `unload(name)`

Unloads a specific plugin:

```typescript
await loader.unload('agent-gateway-plugin-custom-tools');
```

Steps:
1. Call `plugin.destroy()`
2. Remove all registered components
3. Remove hook handlers
4. Remove from tracked plugins

### `list()`

Returns information about all loaded plugins:

```typescript
const plugins = loader.list();
// [
//   {
//     name: 'custom-tools',
//     version: '1.0.0',
//     description: 'Adds custom tools',
//     channels: 0,
//     providers: 0,
//     tools: 2,
//     hooks: 1,
//   }
// ]
```

### `get(name)`

Gets a specific plugin instance:

```typescript
const plugin = loader.get('agent-gateway-plugin-custom-tools');
```

---

## Error Handling

### Import Failures

If a plugin fails to import:
1. The error is logged at the error level
2. The plugin is skipped
3. Other plugins continue loading normally

### Initialization Failures

If a plugin's `initialize()` throws:
1. The error is logged with the plugin name
2. The plugin is marked as failed
3. `destroy()` is NOT called (it was never successfully initialized)
4. Other plugins continue

### Manifest Validation Failures

If a plugin's manifest is invalid:
1. The validation error is logged
2. The plugin is skipped
3. A clear error message indicates what's wrong with the manifest

---

## Plugin Installation

The loader itself does NOT install npm packages. Installation is handled by the `plugins` CLI command:

```bash
agent-gateway plugins install agent-gateway-plugin-custom-tools
```

Which runs `npm install agent-gateway-plugin-custom-tools` in the gateway's directory.

---

## Security Considerations

### Trust Model

Plugins run with **full Node.js permissions**. They can:
- Access the filesystem
- Make network requests
- Execute shell commands
- Access environment variables
- Import any npm package

**Only install plugins from trusted authors.**

### Sandboxing

The loader does NOT sandbox plugins. If sandboxing is needed, consider:
- Running the gateway in a container with limited permissions
- Using a process-isolated plugin architecture
- Implementing capability restrictions in the PluginContext

---

## Example Plugin

```typescript
// agent-gateway-plugin-weather/src/index.ts
import { Plugin, PluginManifest, PluginContext, Tool } from 'agent-gateway';

export const manifest: PluginManifest = {
  name: 'weather-tools',
  version: '1.0.0',
  description: 'Adds weather lookup tools',
  tools: [{ name: 'get_weather', description: 'Get weather for a city' }],
};

export default class WeatherPlugin implements Plugin {
  manifest = manifest;

  async initialize(context: PluginContext): Promise<void> {
    context.registerTool({
      name: 'get_weather',
      description: 'Get current weather for a city',
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          units: { type: 'string', enum: ['c', 'f'], default: 'c' },
        },
        required: ['city'],
      },
      execute: async ({ city, units = 'c' }) => {
        const res = await fetch(
          `https://wttr.in/${city}?format=%t&${units === 'f' ? 'u' : 'm'}`
        );
        return res.text();
      },
    });

    context.hooks.register('beforeMessage', async ({ message }) => {
      context.logger.debug(`Incoming: ${message.text}`);
    });

    context.logger.info('Weather tools registered');
  }

  async destroy(): Promise<void> {
    // No cleanup needed
  }
}
```

---

## Related Documentation

- [`plugin-sdk/`](../plugin-sdk/README.md) — Type definitions used by the loader
- [`commands/`](../commands/README.md) — CLI plugin management commands
- [`tools/`](../tools/README.md) — Tools that plugins can add
- [`hooks/`](../hooks/README.md) — Hooks that plugins can register
- [`gateway/`](../gateway/README.md) — Gateway that plugins register components with
