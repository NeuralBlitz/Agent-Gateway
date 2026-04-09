/**
 * Plugin Marketplace — Core Registry
 * Central registry for discovering, managing, and versioning plugins.
 * Supports semantic versioning, dependency resolution, compatibility checks,
 * and plugin metadata (descriptions, categories, authors, ratings).
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { logger } from '../infra/index.js';

// --- Types ---

export type PluginCategory =
  | 'channel'
  | 'provider'
  | 'tool'
  | 'skill'
  | 'integration'
  | 'middleware'
  | 'theme'
  | 'utility';

export type PluginStatus = 'draft' | 'published' | 'deprecated' | 'archived';

export interface PluginVersion {
  version: string;
  /** Semver range of compatible gateway versions */
  gatewayVersion: string;
  /** Download URL or npm package name */
  source: string;
  /** SHA256 checksum for verification */
  checksum?: string;
  /** Release notes */
  changelog?: string;
  /** Release date */
  publishedAt: number;
  /** Whether this is a pre-release */
  preRelease: boolean;
}

export interface PluginDependency {
  name: string;
  version: string;
  optional?: boolean;
}

export interface PluginCapability {
  type: 'channel' | 'provider' | 'tool' | 'skill' | 'hook' | 'middleware';
  id: string;
  config?: Record<string, any>;
}

export interface PluginManifest {
  /** Unique plugin identifier (reverse domain notation) */
  id: string;
  /** Human-readable name */
  name: string;
  /** Short description (max 200 chars) */
  description: string;
  /** Full README content (markdown) */
  readme?: string;
  /** Current version (semver) */
  version: string;
  /** Plugin category */
  category: PluginCategory;
  /** Tags for search */
  tags: string[];
  /** Author info */
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  /** License (SPDX identifier) */
  license: string;
  /** Homepage URL */
  homepage?: string;
  /** Repository URL */
  repository?: string;
  /** Plugin capabilities */
  capabilities: PluginCapability[];
  /** Dependencies on other plugins */
  dependencies: PluginDependency[];
  /** Gateway version compatibility */
  gatewayVersion: string;
  /** Required Node.js version */
  nodeVersion?: string;
  /** Required environment variables */
  envVars?: Array<{
    name: string;
    description: string;
    required: boolean;
    default?: string;
  }>;
  /** Icon URL or base64 data URI */
  icon?: string;
  /** Screenshots for marketplace display */
  screenshots?: string[];
  /** Current status */
  status: PluginStatus;
  /** All published versions */
  versions: PluginVersion[];
}

export interface PluginRating {
  id: string;
  pluginId: string;
  userId: string;
  score: number; // 1-5
  review?: string;
  createdAt: number;
  updatedAt: number;
}

export interface PluginInstall {
  id: string;
  pluginId: string;
  version: string;
  installedAt: number;
  enabled: boolean;
  config: Record<string, any>;
}

export interface PluginSearchResult {
  manifest: PluginManifest;
  rating: { average: number; count: number };
  installs: number;
  featured: boolean;
}

export interface MarketplaceConfig {
  /** Local plugin storage directory */
  storageDir?: string;
  /** Enable remote registry sync */
  remoteRegistryUrl?: string;
  /** Auto-update plugins */
  autoUpdate?: boolean;
  /** Require signature verification */
  requireSignature?: boolean;
}

// --- Plugin Registry ---

export class PluginRegistry extends EventEmitter {
  private plugins: Map<string, PluginManifest> = new Map();
  private installs: Map<string, PluginInstall> = new Map();
  private ratings: PluginRating[] = [];
  private installCounts: Map<string, number> = new Map();
  private featuredPlugins: Set<string> = new Set();
  private config: Required<MarketplaceConfig>;

  constructor(config: MarketplaceConfig = {}) {
    super();
    this.config = {
      storageDir: config.storageDir || '.plugins',
      remoteRegistryUrl: config.remoteRegistryUrl || '',
      autoUpdate: config.autoUpdate ?? false,
      requireSignature: config.requireSignature ?? false,
    };
  }

  /** Register a plugin manifest */
  register(manifest: PluginManifest): void {
    this.plugins.set(manifest.id, manifest);
    if (!this.installCounts.has(manifest.id)) {
      this.installCounts.set(manifest.id, 0);
    }
    this.emit('plugin:registered', manifest);
    logger.info({ pluginId: manifest.id, name: manifest.name, version: manifest.version }, 'Plugin registered');
  }

  /** Get a plugin manifest */
  get(pluginId: string): PluginManifest | undefined {
    return this.plugins.get(pluginId);
  }

  /** Get all plugins */
  list(category?: PluginCategory, status?: PluginStatus): PluginManifest[] {
    let plugins = Array.from(this.plugins.values());
    if (category) plugins = plugins.filter((p) => p.category === category);
    if (status) plugins = plugins.filter((p) => p.status === status);
    return plugins;
  }

  /** Search plugins */
  search(query: string, options?: {
    category?: PluginCategory;
    tags?: string[];
    minRating?: number;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): PluginSearchResult[] {
    let results = Array.from(this.plugins.values())
      .filter((p) => p.status === 'published');

    // Text search
    if (query) {
      const q = query.toLowerCase();
      results = results.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.category.includes(q)
      );
    }

    // Filters
    if (options?.category) results = results.filter((p) => p.category === options.category);
    if (options?.tags?.length) {
      results = results.filter((p) => options.tags!.some((t) => p.tags.includes(t)));
    }
    if (options?.featured) {
      results = results.filter((p) => this.featuredPlugins.has(p.id));
    }

    // Rating filter
    if (options?.minRating) {
      results = results.filter((p) => {
        const avg = this.getAverageRating(p.id);
        return avg >= options.minRating!;
      });
    }

    // Sort by relevance (installs + rating)
    results.sort((a, b) => {
      const aScore = (this.installCounts.get(a.id) || 0) * 0.6 + this.getAverageRating(a.id) * 20;
      const bScore = (this.installCounts.get(b.id) || 0) * 0.6 + this.getAverageRating(b.id) * 20;
      return bScore - aScore;
    });

    // Pagination
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    results = results.slice(offset, offset + limit);

    return results.map((p) => ({
      manifest: p,
      rating: {
        average: this.getAverageRating(p.id),
        count: this.getRatingCount(p.id),
      },
      installs: this.installCounts.get(p.id) || 0,
      featured: this.featuredPlugins.has(p.id),
    }));
  }

  /** Get plugin categories with counts */
  getCategories(): Array<{ category: PluginCategory; count: number }> {
    const categories: Map<PluginCategory, number> = new Map();
    for (const plugin of this.plugins.values()) {
      if (plugin.status === 'published') {
        categories.set(plugin.category, (categories.get(plugin.category) || 0) + 1);
      }
    }
    return Array.from(categories.entries()).map(([category, count]) => ({ category, count }));
  }

  /** Get trending plugins (by recent installs) */
  getTrending(limit: number = 10): PluginSearchResult[] {
    return Array.from(this.plugins.values())
      .filter((p) => p.status === 'published')
      .sort((a, b) => (this.installCounts.get(b.id) || 0) - (this.installCounts.get(a.id) || 0))
      .slice(0, limit)
      .map((p) => ({
        manifest: p,
        rating: { average: this.getAverageRating(p.id), count: this.getRatingCount(p.id) },
        installs: this.installCounts.get(p.id) || 0,
        featured: this.featuredPlugins.has(p.id),
      }));
  }

  /** Get featured plugins */
  getFeatured(limit: number = 10): PluginSearchResult[] {
    return Array.from(this.featuredPlugins)
      .map((id) => this.plugins.get(id))
      .filter(Boolean)
      .slice(0, limit)
      .map((p) => ({
        manifest: p!,
        rating: { average: this.getAverageRating(p!.id), count: this.getRatingCount(p!.id) },
        installs: this.installCounts.get(p!.id) || 0,
        featured: true,
      }));
  }

  /** Set/unset featured status */
  setFeatured(pluginId: string, featured: boolean): void {
    if (featured) this.featuredPlugins.add(pluginId);
    else this.featuredPlugins.delete(pluginId);
  }

  // --- Rating System ---

  /** Add a rating */
  addRating(pluginId: string, userId: string, score: number, review?: string): PluginRating {
    if (score < 1 || score > 5) throw new Error('Rating must be between 1 and 5');

    const existing = this.ratings.find((r) => r.pluginId === pluginId && r.userId === userId);
    if (existing) {
      existing.score = score;
      existing.review = review;
      existing.updatedAt = Date.now();
      this.emit('rating:updated', existing);
      return existing;
    }

    const rating: PluginRating = {
      id: randomUUID(),
      pluginId,
      userId,
      score,
      review,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.ratings.push(rating);
    this.emit('rating:added', rating);
    return rating;
  }

  /** Get average rating for a plugin */
  getAverageRating(pluginId: string): number {
    const pluginRatings = this.ratings.filter((r) => r.pluginId === pluginId);
    if (pluginRatings.length === 0) return 0;
    return pluginRatings.reduce((sum, r) => sum + r.score, 0) / pluginRatings.length;
  }

  /** Get rating count */
  getRatingCount(pluginId: string): number {
    return this.ratings.filter((r) => r.pluginId === pluginId).length;
  }

  /** Get ratings for a plugin */
  getRatings(pluginId: string, limit: number = 20): PluginRating[] {
    return this.ratings
      .filter((r) => r.pluginId === pluginId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  // --- Installation Management ---

  /** Install a plugin */
  install(pluginId: string, version?: string, config: Record<string, any> = {}): PluginInstall {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin not found: ${pluginId}`);

    const targetVersion = version || plugin.version;
    const versionInfo = plugin.versions.find((v) => v.version === targetVersion);
    if (!versionInfo && version) throw new Error(`Version ${targetVersion} not found for plugin ${pluginId}`);

    // Check gateway compatibility
    if (versionInfo && !this.isVersionCompatible(versionInfo.gatewayVersion)) {
      throw new Error(`Plugin requires gateway ${versionInfo.gatewayVersion}, current version incompatible`);
    }

    // Check dependencies
    this.checkDependencies(plugin);

    const install: PluginInstall = {
      id: randomUUID(),
      pluginId,
      version: targetVersion,
      installedAt: Date.now(),
      enabled: true,
      config,
    };

    this.installs.set(install.id, install);
    this.installCounts.set(pluginId, (this.installCounts.get(pluginId) || 0) + 1);

    this.emit('plugin:installed', install);
    logger.info({ pluginId, version: targetVersion }, 'Plugin installed');

    return install;
  }

  /** Uninstall a plugin */
  uninstall(installId: string): boolean {
    const install = this.installs.get(installId);
    if (!install) return false;

    // Check if other installed plugins depend on this
    this.checkDependents(install.pluginId);

    this.installs.delete(installId);
    this.emit('plugin:uninstalled', install);
    logger.info({ pluginId: install.pluginId }, 'Plugin uninstalled');
    return true;
  }

  /** Get installed plugins */
  getInstalls(pluginId?: string): PluginInstall[] {
    let installs = Array.from(this.installs.values());
    if (pluginId) installs = installs.filter((i) => i.pluginId === pluginId);
    return installs;
  }

  /** Enable/disable an installed plugin */
  toggleInstall(installId: string, enabled: boolean): boolean {
    const install = this.installs.get(installId);
    if (!install) return false;
    install.enabled = enabled;
    this.emit('plugin:toggled', { installId, enabled });
    return true;
  }

  /** Update plugin configuration */
  updateConfig(installId: string, config: Record<string, any>): boolean {
    const install = this.installs.get(installId);
    if (!install) return false;
    install.config = { ...install.config, ...config };
    this.emit('plugin:configUpdated', { installId, config: install.config });
    return true;
  }

  // --- Dependency Resolution ---

  /** Check if plugin dependencies are satisfied */
  checkDependencies(plugin: PluginManifest): string[] {
    const missing: string[] = [];
    for (const dep of plugin.dependencies) {
      const installed = this.getInstalls(dep.name);
      if (installed.length === 0 && !dep.optional) {
        missing.push(dep.name);
      }
    }
    if (missing.length > 0) {
      throw new Error(`Missing required dependencies: ${missing.join(', ')}`);
    }
    return missing;
  }

  /** Check if other plugins depend on this one */
  checkDependents(pluginId: string): string[] {
    const dependents: string[] = [];
    for (const [id, plugin] of this.plugins) {
      if (plugin.dependencies.some((d) => d.name === pluginId)) {
        const installed = this.getInstalls(id);
        if (installed.length > 0) {
          dependents.push(id);
        }
      }
    }
    return dependents;
  }

  /** Resolve full dependency tree for a plugin */
  resolveDependencies(pluginId: string, visited: Set<string> = new Set()): PluginManifest[] {
    if (visited.has(pluginId)) return [];
    visited.add(pluginId);

    const plugin = this.plugins.get(pluginId);
    if (!plugin) return [];

    const deps: PluginManifest[] = [plugin];
    for (const dep of plugin.dependencies) {
      deps.push(...this.resolveDependencies(dep.name, visited));
    }
    return deps;
  }

  // --- Version Compatibility ---

  /** Check if a semver range is compatible with current gateway version */
  private isVersionCompatible(range: string): boolean {
    // Simplified semver check — in production, use semver package
    const currentVersion = '1.0.0'; // Would come from package.json
    if (range === '*') return true;
    if (range.startsWith('^')) {
      const minVersion = range.slice(1);
      return this.compareVersions(currentVersion, minVersion) >= 0;
    }
    if (range.startsWith('~')) {
      const minVersion = range.slice(1);
      return this.compareVersions(currentVersion, minVersion) >= 0;
    }
    return currentVersion === range;
  }

  private compareVersions(a: string, b: string): number {
    const partsA = a.split('.').map(Number);
    const partsB = b.split('.').map(Number);
    for (let i = 0; i < 3; i++) {
      const diff = (partsA[i] || 0) - (partsB[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  // --- Stats ---

  /** Get marketplace stats */
  getStats(): {
    totalPlugins: number;
    publishedPlugins: number;
    totalInstalls: number;
    totalRatings: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    let publishedCount = 0;

    for (const plugin of this.plugins.values()) {
      if (plugin.status === 'published') {
        publishedCount++;
        byCategory[plugin.category] = (byCategory[plugin.category] || 0) + 1;
      }
    }

    return {
      totalPlugins: this.plugins.size,
      publishedPlugins: publishedCount,
      totalInstalls: Array.from(this.installCounts.values()).reduce((s, v) => s + v, 0),
      totalRatings: this.ratings.length,
      byCategory,
    };
  }
}

export function createPluginRegistry(config?: MarketplaceConfig): PluginRegistry {
  return new PluginRegistry(config);
}
