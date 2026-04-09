# Plugin Marketplace (`src/marketplace/`)

> **Plugin registry and installer -- discover, install, manage, and rate plugins for the Agent Gateway.**

---

## Overview

The Marketplace module provides a complete plugin management system for the Agent Gateway. It consists of two core components:

1. **`PluginRegistry`** ([`registry.ts`](/home/runner/workspace/agent-gateway/src/marketplace/registry.ts)) -- An in-memory registry for discovering, managing, versioning, rating, and resolving plugin dependencies. Supports semantic versioning, compatibility checks, search/filter, trending, and featured plugins.

2. **`PluginInstaller`** ([`installer.ts`](/home/runner/workspace/agent-gateway/src/marketplace/installer.ts)) -- An npm-based installation engine that downloads, installs, validates, and manages plugin packages from npm registries. Supports dependency resolution, version extraction, and bulk operations.

Together, these components enable a full plugin marketplace experience: browse and search plugins, install from npm, manage versions and configurations, rate and review, and resolve dependencies.

Key capabilities:

- **Semantic versioning** -- Full semver-compatible version management with compatibility ranges.
- **Dependency resolution** -- Recursive dependency tree resolution with circular dependency detection.
- **Search and discovery** -- Text search across name, description, tags, and category with rating-based sorting.
- **Rating system** -- 1-5 star ratings with optional reviews, average calculation, and rating counts.
- **npm integration** -- Install plugins from npm with validation and version tracking.
- **Featured and trending** -- Curated featured plugins and trending by install count.

---

## File Structure

```
marketplace/
├── registry.ts    # PluginRegistry: discovery, search, ratings, dependency resolution
└── installer.ts   # PluginInstaller: npm-based install/uninstall/validate/update
```

---

## API Reference: Plugin Registry

### Types

#### `PluginCategory`

Enumeration of valid plugin categories.

```typescript
type PluginCategory =
  | 'channel'       // Chat channel adapters (Discord, Slack, etc.)
  | 'provider'      // AI model providers (OpenAI, Anthropic, etc.)
  | 'tool'          // External tool integrations
  | 'skill'         // Agent skill definitions
  | 'integration'   // Third-party service integrations
  | 'middleware'    // Request/response middleware
  | 'theme'         // UI themes
  | 'utility';      // General utilities
```

#### `PluginStatus`

Lifecycle status for a plugin.

```typescript
type PluginStatus = 'draft' | 'published' | 'deprecated' | 'archived';
```

| Status | Description |
|--------|-------------|
| `draft` | Plugin is not yet publicly available |
| `published` | Plugin is available for installation |
| `deprecated` | Plugin is superseded; users should migrate |
| `archived` | Plugin is no longer maintained |

#### `PluginVersion`

Represents a single published version of a plugin.

```typescript
interface PluginVersion {
  version: string;               // Semver string (e.g., "1.2.3")
  gatewayVersion: string;        // Semver range of compatible gateway versions
  source: string;                // Download URL or npm package name
  checksum?: string;             // SHA256 checksum for verification
  changelog?: string;            // Release notes
  publishedAt: number;           // Unix timestamp of release
  preRelease: boolean;           // Whether this is a pre-release (alpha, beta, rc)
}
```

#### `PluginDependency`

A dependency on another plugin.

```typescript
interface PluginDependency {
  name: string;       // Plugin ID of the dependency
  version: string;    // Required version (semver range)
  optional?: boolean; // If true, plugin works without this dependency
}
```

#### `PluginCapability`

Declares what the plugin provides to the gateway.

```typescript
interface PluginCapability {
  type: 'channel' | 'provider' | 'tool' | 'skill' | 'hook' | 'middleware';
  id: string;
  config?: Record<string, any>;
}
```

#### `PluginManifest`

The complete metadata definition for a plugin.

```typescript
interface PluginManifest {
  id: string;                    // Unique ID (reverse domain notation, e.g., "com.example.myplugin")
  name: string;                  // Human-readable name
  description: string;           // Short description (max 200 chars)
  readme?: string;               // Full README content (markdown)
  version: string;               // Current version (semver)
  category: PluginCategory;      // Plugin category
  tags: string[];                // Tags for search and filtering
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  license: string;               // SPDX identifier (e.g., "MIT", "Apache-2.0")
  homepage?: string;             // Homepage URL
  repository?: string;           // Source repository URL
  capabilities: PluginCapability[];  // What the plugin provides
  dependencies: PluginDependency[];  // Required/optional plugin dependencies
  gatewayVersion: string;        // Required gateway version range
  nodeVersion?: string;          // Required Node.js version
  envVars?: Array<{              // Required environment variables
    name: string;
    description: string;
    required: boolean;
    default?: string;
  }>;
  icon?: string;                 // Icon URL or base64 data URI
  screenshots?: string[];        // Screenshot URLs for marketplace display
  status: PluginStatus;          // Current lifecycle status
  versions: PluginVersion[];     // All published versions
}
```

#### `PluginRating`

A user rating for a plugin.

```typescript
interface PluginRating {
  id: string;
  pluginId: string;
  userId: string;
  score: number;    // 1-5
  review?: string;  // Optional text review
  createdAt: number;
  updatedAt: number;
}
```

#### `PluginInstall`

A record of an installed plugin instance.

```typescript
interface PluginInstall {
  id: string;
  pluginId: string;
  version: string;
  installedAt: number;
  enabled: boolean;
  config: Record<string, any>;
}
```

#### `PluginSearchResult`

A search result enriched with rating and install data.

```typescript
interface PluginSearchResult {
  manifest: PluginManifest;
  rating: { average: number; count: number };
  installs: number;
  featured: boolean;
}
```

#### `MarketplaceConfig`

Configuration for the PluginRegistry.

```typescript
interface MarketplaceConfig {
  storageDir?: string;          // Local plugin storage directory (default: '.plugins')
  remoteRegistryUrl?: string;   // Enable remote registry sync
  autoUpdate?: boolean;         // Auto-update plugins (default: false)
  requireSignature?: boolean;   // Require signature verification (default: false)
}
```

---

### Factory Function

#### `createPluginRegistry(config?)`

Creates and returns a new `PluginRegistry` instance.

```typescript
function createPluginRegistry(config?: MarketplaceConfig): PluginRegistry
```

**Example:**

```typescript
import { createPluginRegistry } from './marketplace/registry.js';

const registry = createPluginRegistry({
  storageDir: '.plugins',
  autoUpdate: false,
  requireSignature: true,
});
```

---

### Class: `PluginRegistry`

Extends `EventEmitter`. Manages plugin registration, search, ratings, installations, and dependency resolution.

#### Plugin Registration

##### `register(manifest)`

Registers a plugin manifest in the registry.

```typescript
register(manifest: PluginManifest): void
```

**Emits:** `plugin:registered` with the manifest.

**Example:**

```typescript
registry.register({
  id: 'com.example.weather',
  name: 'Weather Plugin',
  description: 'Get weather forecasts for any location',
  version: '1.0.0',
  category: 'tool',
  tags: ['weather', 'forecast', 'api'],
  author: { name: 'Example Dev', email: 'dev@example.com' },
  license: 'MIT',
  capabilities: [{ type: 'tool', id: 'weather.get' }],
  dependencies: [],
  gatewayVersion: '^1.0.0',
  status: 'published',
  versions: [{
    version: '1.0.0',
    gatewayVersion: '^1.0.0',
    source: '@example/weather-plugin',
    publishedAt: Date.now(),
    preRelease: false,
  }],
});
```

##### `get(pluginId)`

Retrieves a plugin manifest by ID.

```typescript
get(pluginId: string): PluginManifest | undefined
```

##### `list(category?, status?)`

Lists all plugins, optionally filtered by category and status.

```typescript
list(category?: PluginCategory, status?: PluginStatus): PluginManifest[]
```

**Example:**

```typescript
// All published tool plugins
const tools = registry.list('tool', 'published');

// All draft plugins regardless of category
const drafts = registry.list(undefined, 'draft');
```

---

#### Search and Discovery

##### `search(query, options?)`

Searches plugins with text matching and filters.

```typescript
search(
  query: string,
  options?: {
    category?: PluginCategory;
    tags?: string[];
    minRating?: number;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }
): PluginSearchResult[]
```

**Search behavior:**

- Text search across `name`, `description`, `tags`, and `category` (case-insensitive).
- Filters by category, tags, featured status, and minimum rating.
- Sorted by relevance score: `(installCount * 0.6) + (averageRating * 20)`.
- Paginated with `limit` (default 50) and `offset` (default 0).

**Example:**

```typescript
// Search for "weather" tools with rating >= 4
const results = registry.search('weather', {
  category: 'tool',
  minRating: 4,
  limit: 10,
});

// Search with tag filter
const tagged = registry.search('api', {
  tags: ['rest', 'http'],
  featured: true,
});

// Paginated results
const page2 = registry.search('', { offset: 50, limit: 25 });
```

##### `getCategories()`

Returns plugin categories with counts.

```typescript
getCategories(): Array<{ category: PluginCategory; count: number }>
```

**Example:**

```typescript
const categories = registry.getCategories();
// [{ category: 'tool', count: 15 }, { category: 'channel', count: 8 }, ...]
```

##### `getTrending(limit?)`

Returns plugins sorted by install count (most installed first).

```typescript
getTrending(limit?: number): PluginSearchResult[]
```

Default limit: 10.

##### `getFeatured(limit?)`

Returns featured plugins.

```typescript
getFeatured(limit?: number): PluginSearchResult[]
```

Default limit: 10.

##### `setFeatured(pluginId, featured)`

Sets or unsets a plugin's featured status.

```typescript
setFeatured(pluginId: string, featured: boolean): void
```

---

#### Rating System

##### `addRating(pluginId, userId, score, review?)`

Adds or updates a user's rating for a plugin.

```typescript
addRating(
  pluginId: string,
  userId: string,
  score: number,    // 1-5
  review?: string
): PluginRating
```

**Errors:** Throws if `score` is not between 1 and 5.

**Emits:** `rating:added` or `rating:updated`.

**Example:**

```typescript
const rating = registry.addRating(
  'com.example.weather',
  'user-123',
  5,
  'Excellent plugin, very reliable!'
);
```

##### `getAverageRating(pluginId)`

Returns the average rating score for a plugin.

```typescript
getAverageRating(pluginId: string): number
```

Returns `0` if no ratings exist.

##### `getRatingCount(pluginId)`

Returns the number of ratings for a plugin.

```typescript
getRatingCount(pluginId: string): number
```

##### `getRatings(pluginId, limit?)`

Returns individual ratings, sorted by date (newest first).

```typescript
getRatings(pluginId: string, limit?: number): PluginRating[]
```

Default limit: 20.

---

#### Installation Management

##### `install(pluginId, version?, config?)`

Installs a plugin with optional version pinning and configuration.

```typescript
install(
  pluginId: string,
  version?: string,
  config?: Record<string, any>
): PluginInstall
```

**Behavior:**

1. Validates the plugin exists.
2. Validates the version exists (if specified).
3. Checks gateway version compatibility.
4. Checks required dependencies are satisfied.
5. Creates an install record with `enabled: true`.
6. Increments the plugin's install count.

**Emits:** `plugin:installed`.

**Errors:** Throws if plugin not found, version not found, gateway incompatible, or dependencies missing.

**Example:**

```typescript
const install = registry.install('com.example.weather', '1.0.0', {
  apiKey: process.env.WEATHER_API_KEY,
});
console.log(install.id);  // UUID of the install record
```

##### `uninstall(installId)`

Uninstalls a plugin by install record ID.

```typescript
uninstall(installId: string): boolean
```

**Behavior:**

1. Checks if other plugins depend on this one.
2. Removes the install record.

**Emits:** `plugin:uninstalled`.

**Returns:** `true` if uninstalled, `false` if install not found.

##### `getInstalls(pluginId?)`

Lists installed plugins, optionally filtered by plugin ID.

```typescript
getInstalls(pluginId?: string): PluginInstall[]
```

##### `toggleInstall(installId, enabled)`

Enables or disables an installed plugin.

```typescript
toggleInstall(installId: string, enabled: boolean): boolean
```

**Emits:** `plugin:toggled`.

##### `updateConfig(installId, config)`

Updates the configuration of an installed plugin (merges with existing config).

```typescript
updateConfig(
  installId: string,
  config: Record<string, any>
): boolean
```

**Emits:** `plugin:configUpdated`.

---

#### Dependency Resolution

##### `checkDependencies(plugin)`

Checks if all required dependencies of a plugin are installed.

```typescript
checkDependencies(plugin: PluginManifest): string[]
```

**Returns:** Empty array if all dependencies satisfied.

**Errors:** Throws with message listing missing dependencies.

##### `checkDependents(pluginId)`

Checks which installed plugins depend on the given plugin.

```typescript
checkDependents(pluginId: string): string[]
```

**Returns:** Array of plugin IDs that depend on this one.

##### `resolveDependencies(pluginId, visited?)`

Recursively resolves the full dependency tree.

```typescript
resolveDependencies(
  pluginId: string,
  visited?: Set<string>
): PluginManifest[]
```

**Returns:** Array of all required plugin manifests (including the root plugin), with circular dependency protection via the `visited` set.

---

#### Version Compatibility

##### `isVersionCompatible(range)` (private)

Checks if a semver range is compatible with the current gateway version.

Supports:
- `*` -- any version
- `^1.0.0` -- compatible with 1.x.x
- `~1.0.0` -- compatible with 1.0.x
- `1.0.0` -- exact match

---

#### Statistics

##### `getStats()`

Returns marketplace-wide statistics.

```typescript
getStats(): {
  totalPlugins: number;
  publishedPlugins: number;
  totalInstalls: number;
  totalRatings: number;
  byCategory: Record<string, number>;
}
```

**Example:**

```typescript
const stats = registry.getStats();
// {
//   totalPlugins: 42,
//   publishedPlugins: 38,
//   totalInstalls: 156,
//   totalRatings: 89,
//   byCategory: { tool: 15, channel: 8, provider: 10, ... }
// }
```

---

### Events

| Event | Payload | When |
|-------|---------|------|
| `plugin:registered` | `PluginManifest` | A plugin manifest is registered |
| `plugin:installed` | `PluginInstall` | A plugin is installed |
| `plugin:uninstalled` | `PluginInstall` | A plugin is uninstalled |
| `plugin:toggled` | `{ installId, enabled }` | An install is enabled/disabled |
| `plugin:configUpdated` | `{ installId, config }` | An install's config is updated |
| `rating:added` | `PluginRating` | A new rating is added |
| `rating:updated` | `PluginRating` | An existing rating is updated |

---

## API Reference: Plugin Installer

### Types

#### `PluginInstallResult`

Result of an installation operation.

```typescript
interface PluginInstallResult {
  success: boolean;
  pluginId: string;
  version: string;
  error?: string;
  dependencies?: string[];
}
```

#### `PluginInstallerConfig`

Configuration for the PluginInstaller.

```typescript
interface PluginInstallerConfig {
  installDir?: string;           // Directory to install plugins (default: `<cwd>/.plugins`)
  validateAfterInstall?: boolean;// Run validation after install (default: true)
  registry?: string;             // npm registry URL (default: `https://registry.npmjs.org`)
  save?: boolean;                // Save to package.json (default: true)
}
```

---

### Factory Function

#### `createPluginInstaller(config?)`

Creates and returns a new `PluginInstaller` instance.

```typescript
function createPluginInstaller(config?: PluginInstallerConfig): PluginInstaller
```

**Example:**

```typescript
import { createPluginInstaller } from './marketplace/installer.js';

const installer = createPluginInstaller({
  installDir: '/opt/agent-gateway/plugins',
  registry: 'https://registry.npmjs.org',
  validateAfterInstall: true,
});
```

---

### Class: `PluginInstaller`

Manages npm-based plugin installation, validation, and updates.

#### Installation

##### `install(packageName, version?)`

Installs a plugin package from npm.

```typescript
async install(packageName: string, version?: string): Promise<PluginInstallResult>
```

**Behavior:**

1. Constructs the npm package specifier (`packageName@version` or just `packageName`).
2. Runs `npm install` with the configured install directory and registry.
3. Optionally validates the installed package.
4. If validation fails, automatically uninstalls and returns an error result.
5. Extracts the installed version and resolves dependencies.

**Example:**

```typescript
const result = await installer.install('@example/weather-plugin', '1.2.0');
if (result.success) {
  console.log(`Installed ${result.pluginId}@${result.version}`);
  console.log('Dependencies:', result.dependencies);
} else {
  console.error('Install failed:', result.error);
}
```

##### `uninstall(packageName)`

Uninstalls a plugin package.

```typescript
async uninstall(packageName: string): Promise<boolean>
```

**Example:**

```typescript
const ok = await installer.uninstall('@example/weather-plugin');
```

##### `update(packageName)`

Updates a plugin to the latest version (equivalent to reinstalling without version pin).

```typescript
async update(packageName: string): Promise<PluginInstallResult>
```

##### `updateAll()`

Updates all installed plugins.

```typescript
async updateAll(): Promise<PluginInstallResult[]>
```

**Example:**

```typescript
const results = await installer.updateAll();
const updated = results.filter((r) => r.success);
console.log(`${updated.length} plugins updated`);
```

---

#### Discovery

##### `listInstalled()`

Lists all installed plugins with name, version, and path.

```typescript
async listInstalled(): Promise<Array<{
  name: string;
  version: string;
  path: string;
}>>
```

**Example:**

```typescript
const plugins = await installer.listInstalled();
for (const p of plugins) {
  console.log(`${p.name}@${p.version} at ${p.path}`);
}
```

##### `searchNpm(query, limit?)`

Searches npm for packages tagged as agent-gateway plugins.

```typescript
async searchNpm(
  query: string,
  limit?: number   // default 20
): Promise<Array<{ name: string; version: string; description: string }>>
```

Uses the npm search API with the `agent-gateway-plugin` keyword.

**Example:**

```typescript
const results = await installer.searchNpm('weather', 10);
// [{ name: '@example/weather-plugin', version: '1.2.0', description: '...' }]
```

##### `getInfo(packageName)`

Fetches package metadata from npm.

```typescript
async getInfo(packageName: string): Promise<{
  name: string;
  version: string;
  description: string;
  author?: string;
  homepage?: string;
} | null>
```

**Example:**

```typescript
const info = await installer.getInfo('@example/weather-plugin');
if (info) {
  console.log(`${info.name} v${info.version}`);
  console.log(info.description);
}
```

---

#### Validation and Utility

##### `validateInstalled(packageName)`

Validates that a package is properly installed and has required fields.

```typescript
async validateInstalled(packageName: string): Promise<boolean>
```

**Checks:**

- `package.json` exists and is valid JSON.
- `name` and `version` fields are present.
- Warns if the package lacks the `agent-gateway-plugin` keyword or `agent-gateway` field.

##### `getInstalledVersion(packageName)`

Gets the installed version of a package.

```typescript
async getInstalledVersion(packageName: string): Promise<string>
```

Returns `'unknown'` if the package is not found.

##### `resolveDependencies(packageName)`

Resolves npm dependencies of a package.

```typescript
async resolveDependencies(packageName: string): Promise<string[]>
```

Uses `npm view` to fetch dependency information.

##### `clean()`

Completely removes and recreates the install directory.

```typescript
async clean(): Promise<void>
```

**Warning:** This deletes all installed plugins.

---

### Events

The `PluginInstaller` does extend `EventEmitter` but does not emit custom events. All logging is done via the infrastructure logger.

---

## Integration Points

### Between Registry and Installer

The two components are designed to work together:

```typescript
import { createPluginRegistry } from './marketplace/registry.js';
import { createPluginInstaller } from './marketplace/installer.js';

const registry = createPluginRegistry();
const installer = createPluginInstaller();

// 1. Search for a plugin
const results = registry.search('weather');

// 2. Install from npm
const installResult = await installer.install(results[0].manifest.id);

// 3. Register in registry
if (installResult.success) {
  registry.install(results[0].manifest.id, installResult.version);
}
```

### With Provider System

Plugins of category `'provider'` can be discovered through the registry and instantiated as AI providers:
- See [`/home/runner/workspace/agent-gateway/src/providers/`](/home/runner/workspace/agent-gateway/src/providers/)

### With Channel System

Plugins of category `'channel'` can be discovered and instantiated as communication channels:
- See [`/home/runner/workspace/agent-gateway/src/channels/`](/home/runner/workspace/agent-gateway/src/channels/)

### With Skills Engine

Plugins of category `'skill'` can provide skill definitions loaded by the skills engine:
- See [`/home/runner/workspace/agent-gateway/src/skills-engine/`](/home/runner/workspace/agent-gateway/src/skills-engine/)

---

## Error Handling

### Registry Errors

| Scenario | Behavior |
|----------|----------|
| Plugin not found | `get()` returns `undefined`; `install()` throws |
| Version not found | `install()` throws with version details |
| Gateway incompatible | `install()` throws with version mismatch details |
| Missing required dependencies | `install()` throws listing missing dependencies |
| Invalid rating score | `addRating()` throws "Rating must be between 1 and 5" |
| Install record not found | `uninstall()`, `toggleInstall()`, `updateConfig()` return `false` |

### Installer Errors

| Scenario | Behavior |
|----------|----------|
| npm package not found | `install()` returns `{ success: false, error: ... }` |
| Validation failure | `install()` auto-uninstalls and returns error |
| npm command fails | Error caught, logged, and returned in result |
| Invalid package.json | `validateInstalled()` returns `false` |
| Uninstall failure | `uninstall()` returns `false`, error logged |

---

## Security Considerations

- **npm supply chain** -- Plugins installed from npm execute arbitrary code. Validate packages and use a private registry for production.
- **Signature verification** -- Set `requireSignature: true` in `MarketplaceConfig` to enforce signed packages.
- **Checksum verification** -- Each `PluginVersion` can include a SHA256 `checksum` for download integrity verification.
- **Environment variables** -- Plugin manifests declare required `envVars`; the gateway should inject secrets securely.
- **Sandboxing** -- In production, consider running plugins in isolated sandboxes or containers.

---

## Related Documentation

- [`/home/runner/workspace/agent-gateway/src/skills-engine/`](/home/runner/workspace/agent-gateway/src/skills-engine/) -- Skills engine for agent capabilities
- [`/home/runner/workspace/agent-gateway/src/providers/`](/home/runner/workspace/agent-gateway/src/providers/) -- AI model providers
- [`/home/runner/workspace/agent-gateway/src/channels/`](/home/runner/workspace/agent-gateway/src/channels/) -- Communication channels
- [npm CLI Documentation](https://docs.npmjs.com/cli/) -- npm command reference
- [Semantic Versioning](https://semver.org/) -- Semver specification
- [SPDX License List](https://spdx.org/licenses/) -- Standard license identifiers
