import { logger } from '../infra/index.js';
import type { Plugin, PluginManifest, PluginContext } from '../plugin-sdk/index.js';
import type { Gateway } from '../gateway/index.js';
import type { ToolDefinition } from '../tools/registry.js';

export interface PluginLoaderConfig {
  pluginNames: string[];
  gateway: Gateway;
  pluginContext: PluginContext;
}

/**
 * PluginLoader — discovers, loads, and manages plugins at runtime.
 * Plugins are npm packages that export a `Plugin` interface.
 */
export class PluginLoader {
  private plugins: Map<string, { plugin: Plugin; context: PluginContext }> = new Map();
  private gateway: Gateway;

  constructor(gateway: Gateway) {
    this.gateway = gateway;
  }

  /** Load and initialize all configured plugins */
  async loadAll(pluginNames: string[]): Promise<void> {
    for (const name of pluginNames) {
      try {
        await this.loadPlugin(name);
      } catch (err: any) {
        logger.error({ plugin: name, err }, 'Failed to load plugin');
      }
    }
    logger.info({ count: this.plugins.size }, 'Plugins loaded');
  }

  /** Load a single plugin by npm package name */
  async loadPlugin(packageName: string): Promise<void> {
    if (this.plugins.has(packageName)) {
      logger.debug({ plugin: packageName }, 'Plugin already loaded');
      return;
    }

    logger.info({ plugin: packageName }, 'Loading plugin');

    // Dynamically import the plugin package
    let pluginModule: any;
    try {
      pluginModule = await import(packageName);
    } catch (err: any) {
      throw new Error(`Failed to import plugin '${packageName}': ${err.message}`);
    }

    // Find the plugin export (default or named 'plugin')
    const plugin: Plugin = pluginModule.default || pluginModule.plugin;
    if (!plugin) {
      throw new Error(`Plugin '${packageName}' does not export a default or 'plugin' export`);
    }

    // Validate manifest
    if (!plugin.manifest || !plugin.manifest.name || !plugin.manifest.version) {
      throw new Error(`Plugin '${packageName}' has invalid manifest (requires name and version)`);
    }

    // Create plugin context
    const context = this.createPluginContext(plugin.manifest);

    // Initialize the plugin
    await plugin.initialize(context);

    this.plugins.set(packageName, { plugin, context });
    logger.info({ plugin: packageName, version: plugin.manifest.version }, 'Plugin initialized');
  }

  /** Unload and destroy a plugin */
  async unloadPlugin(packageName: string): Promise<void> {
    const entry = this.plugins.get(packageName);
    if (!entry) {
      throw new Error(`Plugin not found: ${packageName}`);
    }

    logger.info({ plugin: packageName }, 'Unloading plugin');
    await entry.plugin.destroy?.();
    this.plugins.delete(packageName);
  }

  /** Unload all plugins */
  async unloadAll(): Promise<void> {
    for (const name of Array.from(this.plugins.keys())) {
      await this.unloadPlugin(name);
    }
  }

  /** Get a loaded plugin */
  getPlugin(packageName: string): Plugin | undefined {
    return this.plugins.get(packageName)?.plugin;
  }

  /** List loaded plugins */
  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  // --- Plugin Context ---

  private createPluginContext(manifest: PluginManifest): PluginContext {
    const self = this;

    return {
      logger: logger.child({ plugin: manifest.name }),
      config: {},
      manifest,

      registerChannel(channel: any): void {
        self.gateway.registerChannel(channel.id || channel.name, channel);
      },

      registerProvider(provider: any): void {
        self.gateway.registerProvider(provider.id || provider.name, provider);
      },

      registerTool(tool: any): void {
        self.gateway.emit('plugin:tool', tool);
      },

      getChannel(id: string): any {
        return self.gateway.getChannels().get(id);
      },

      getProvider(id: string): any {
        return self.gateway.getProviders().get(id);
      },
    };
  }
}

export function createPluginLoader(gateway: Gateway): PluginLoader {
  return new PluginLoader(gateway);
}
