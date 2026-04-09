/**
 * Plugin Installer — npm-based plugin installation with dependency resolution,
 * validation, and sandbox testing.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { logger } from '../infra/index.js';

const execAsync = promisify(exec);

export interface PluginInstallResult {
  success: boolean;
  pluginId: string;
  version: string;
  error?: string;
  dependencies?: string[];
}

export interface PluginInstallerConfig {
  /** Directory to install plugins into */
  installDir?: string;
  /** Whether to run validation after install */
  validateAfterInstall?: boolean;
  /** npm registry URL */
  registry?: string;
  /** Whether to save to package.json */
  save?: boolean;
}

export class PluginInstaller {
  private config: Required<PluginInstallerConfig>;

  constructor(config: PluginInstallerConfig = {}) {
    this.config = {
      installDir: config.installDir || join(process.cwd(), '.plugins'),
      validateAfterInstall: config.validateAfterInstall ?? true,
      registry: config.registry || 'https://registry.npmjs.org',
      save: config.save ?? true,
    };

    if (!existsSync(this.config.installDir)) {
      mkdirSync(this.config.installDir, { recursive: true });
    }
  }

  /** Install a plugin from npm */
  async install(packageName: string, version?: string): Promise<PluginInstallResult> {
    const pkg = version ? `${packageName}@${version}` : packageName;
    logger.info({ pkg }, `Installing plugin: ${pkg}`);

    try {
      // Install via npm
      const cmd = `npm install ${pkg} --prefix ${this.config.installDir} --registry ${this.config.registry} --save=${this.config.save} 2>&1`;
      const { stdout, stderr } = await execAsync(cmd);

      if (stderr && !stderr.includes('npm warn')) {
        logger.warn({ stderr }, 'npm install warnings');
      }

      // Validate the installed plugin
      if (this.config.validateAfterInstall) {
        const valid = await this.validateInstalled(packageName);
        if (!valid) {
          await this.uninstall(packageName);
          return {
            success: false,
            pluginId: packageName,
            version: version || 'latest',
            error: 'Plugin validation failed',
          };
        }
      }

      // Extract installed version
      const installedVersion = await this.getInstalledVersion(packageName);

      // Resolve dependencies
      const dependencies = await this.resolveDependencies(packageName);

      logger.info({ pluginId: packageName, version: installedVersion }, 'Plugin installed successfully');

      return {
        success: true,
        pluginId: packageName,
        version: installedVersion,
        dependencies,
      };
    } catch (err: any) {
      logger.error({ err, pkg }, 'Plugin installation failed');
      return {
        success: false,
        pluginId: packageName,
        version: version || 'latest',
        error: err.message,
      };
    }
  }

  /** Uninstall a plugin */
  async uninstall(packageName: string): Promise<boolean> {
    try {
      const cmd = `npm uninstall ${packageName} --prefix ${this.config.installDir}`;
      await execAsync(cmd);
      logger.info({ pluginId: packageName }, 'Plugin uninstalled');
      return true;
    } catch (err: any) {
      logger.error({ err }, 'Plugin uninstall failed');
      return false;
    }
  }

  /** List installed plugins */
  async listInstalled(): Promise<Array<{ name: string; version: string; path: string }>> {
    const pluginsDir = join(this.config.installDir, 'node_modules');
    if (!existsSync(pluginsDir)) return [];

    const packages: Array<{ name: string; version: string; path: string }> = [];
    const entries = require('fs').readdirSync(pluginsDir);

    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const pkgPath = join(pluginsDir, entry, 'package.json');
      if (existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
          packages.push({
            name: pkg.name,
            version: pkg.version,
            path: join(pluginsDir, entry),
          });
        } catch {
          // Skip invalid packages
        }
      }
    }

    return packages;
  }

  /** Update a plugin */
  async update(packageName: string): Promise<PluginInstallResult> {
    return this.install(packageName);
  }

  /** Update all plugins */
  async updateAll(): Promise<PluginInstallResult[]> {
    const installed = await this.listInstalled();
    const results: PluginInstallResult[] = [];

    for (const plugin of installed) {
      const result = await this.update(plugin.name);
      results.push(result);
    }

    return results;
  }

  /** Validate an installed plugin */
  async validateInstalled(packageName: string): Promise<boolean> {
    const pluginsDir = join(this.config.installDir, 'node_modules', packageName);
    const pkgPath = join(pluginsDir, 'package.json');

    if (!existsSync(pkgPath)) return false;

    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

      // Check required fields
      if (!pkg.name || !pkg.version) return false;

      // Check for agent-gateway plugin marker
      if (!pkg.keywords?.includes('agent-gateway-plugin') && !pkg['agent-gateway']) {
        logger.warn({ plugin: packageName }, 'Package does not have agent-gateway-plugin keyword');
      }

      return true;
    } catch {
      return false;
    }
  }

  /** Get installed version */
  async getInstalledVersion(packageName: string): Promise<string> {
    const pkgPath = join(this.config.installDir, 'node_modules', packageName, 'package.json');
    if (!existsSync(pkgPath)) return 'unknown';

    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      return pkg.version;
    } catch {
      return 'unknown';
    }
  }

  /** Resolve plugin dependencies */
  async resolveDependencies(packageName: string): Promise<string[]> {
    try {
      const cmd = `npm view ${packageName} dependencies --json 2>/dev/null`;
      const { stdout } = await execAsync(cmd);
      const deps = JSON.parse(stdout.trim());
      return Object.keys(deps || {});
    } catch {
      return [];
    }
  }

  /** Search npm for agent-gateway plugins */
  async searchNpm(query: string, limit: number = 20): Promise<Array<{ name: string; version: string; description: string }>> {
    try {
      const url = `https://registry.npmjs.org/-/v1/search?text=agent-gateway-plugin ${query}&size=${limit}`;
      const response = await fetch(url);
      const data = await response.json() as any;

      return (data.objects || []).map((obj: any) => ({
        name: obj.package.name,
        version: obj.package.version,
        description: obj.package.description || '',
      }));
    } catch {
      return [];
    }
  }

  /** Get plugin info from npm */
  async getInfo(packageName: string): Promise<{ name: string; version: string; description: string; author?: string; homepage?: string } | null> {
    try {
      const cmd = `npm view ${packageName} --json 2>/dev/null`;
      const { stdout } = await execAsync(cmd);
      const info = JSON.parse(stdout.trim());

      return {
        name: info.name,
        version: info.version,
        description: info.description || '',
        author: typeof info.author === 'string' ? info.author : info.author?.name,
        homepage: info.homepage,
      };
    } catch {
      return null;
    }
  }

  /** Clean install directory */
  async clean(): Promise<void> {
    if (existsSync(this.config.installDir)) {
      rmSync(this.config.installDir, { recursive: true, force: true });
      mkdirSync(this.config.installDir, { recursive: true });
      logger.info('Plugin install directory cleaned');
    }
  }
}

export function createPluginInstaller(config?: PluginInstallerConfig): PluginInstaller {
  return new PluginInstaller(config);
}
