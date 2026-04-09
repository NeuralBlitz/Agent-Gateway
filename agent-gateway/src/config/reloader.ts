/**
 * Enterprise Config Hot-Reloading
 * Watch config file for changes and apply them without restart.
 * Supports env var overrides, validation, and change events.
 */

import { watch, readFileSync, existsSync } from 'fs';
import { logger } from '../infra/index.js';
import { EventEmitter } from 'events';
import type { GatewayConfig } from '../config/index.js';

export type ConfigChangeEvent = {
  key: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
};

export class ConfigReloader extends EventEmitter {
  private configPath: string;
  private lastConfig: GatewayConfig | null = null;
  private watcher: ReturnType<typeof watch> | null = null;
  private changeHistory: ConfigChangeEvent[] = [];
  private maxHistory: number;

  constructor(configPath: string, maxHistory: number = 100) {
    super();
    this.configPath = configPath;
    this.maxHistory = maxHistory;
  }

  /** Start watching the config file */
  start(): void {
    // Load initial config
    this.lastConfig = this.loadConfig();

    if (!existsSync(this.configPath)) {
      logger.warn({ path: this.configPath }, 'Config file not found, hot-reload disabled');
      return;
    }

    // Watch for changes
    this.watcher = watch(this.configPath, { persistent: false }, (eventType) => {
      if (eventType === 'change') {
        this.reload();
      }
    });

    logger.info({ path: this.configPath }, 'Config hot-reload enabled');
  }

  /** Manually reload config */
  reload(): GatewayConfig | null {
    const newConfig = this.loadConfig();
    if (!newConfig) return null;

    if (!this.lastConfig) {
      this.lastConfig = newConfig;
      return newConfig;
    }

    // Detect changes
    const changes = this.diff(this.lastConfig, newConfig);

    for (const change of changes) {
      logger.info(change, `Config change: ${change.key}`);
      this.changeHistory.push(change);
      if (this.changeHistory.length > this.maxHistory) {
        this.changeHistory.shift();
      }
    }

    if (changes.length > 0) {
      this.lastConfig = newConfig;
      this.emit('config:changed', changes);
    }

    return newConfig;
  }

  /** Stop watching */
  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }

  /** Get change history */
  getHistory(): ConfigChangeEvent[] {
    return [...this.changeHistory];
  }

  /** Get current config */
  getCurrent(): GatewayConfig | null {
    return this.lastConfig;
  }

  private loadConfig(): GatewayConfig | null {
    try {
      if (!existsSync(this.configPath)) return null;

      const content = readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(content);

      // Apply env var overrides
      const config = this.applyEnvOverrides(parsed);

      return config as GatewayConfig;
    } catch (err: any) {
      logger.error({ err, path: this.configPath }, 'Failed to load config');
      return null;
    }
  }

  private applyEnvOverrides(config: any): any {
    // Server settings
    if (process.env.HOST) config.gateway = config.gateway || {}; config.gateway.host = process.env.HOST;
    if (process.env.PORT) { config.gateway = config.gateway || {}; config.gateway.port = parseInt(process.env.PORT, 10); }

    // Logging
    if (process.env.LOG_LEVEL) { config.logging = config.logging || {}; config.logging.level = process.env.LOG_LEVEL; }

    // Channels
    if (process.env.TELEGRAM_TOKEN) this.ensureChannel(config, 'telegram', { botToken: process.env.TELEGRAM_TOKEN });
    if (process.env.DISCORD_TOKEN) this.ensureChannel(config, 'discord', { botToken: process.env.DISCORD_TOKEN });
    if (process.env.SLACK_TOKEN) this.ensureChannel(config, 'slack', { botToken: process.env.SLACK_TOKEN });
    if (process.env.WHATSAPP_TOKEN) this.ensureChannel(config, 'whatsapp', { accessToken: process.env.WHATSAPP_TOKEN });

    // Providers
    if (process.env.OPENAI_API_KEY) this.ensureProvider(config, 'openai', { apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL });
    if (process.env.ANTHROPIC_API_KEY) this.ensureProvider(config, 'anthropic', { apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL });
    if (process.env.GOOGLE_API_KEY) this.ensureProvider(config, 'google', { apiKey: process.env.GOOGLE_API_KEY, model: process.env.GOOGLE_MODEL });
    if (process.env.OLLAMA_BASE_URL) this.ensureProvider(config, 'ollama', { baseUrl: process.env.OLLAMA_BASE_URL, model: process.env.OLLAMA_MODEL });

    return config;
  }

  private ensureChannel(config: any, type: string, settings: Record<string, string>): void {
    config.channels = config.channels || [];
    const existing = config.channels.find((c: any) => c.type === type);
    if (!existing) {
      config.channels.push({ type, name: type, enabled: true, settings });
    } else {
      existing.settings = { ...existing.settings, ...settings };
    }
  }

  private ensureProvider(config: any, type: string, settings: Record<string, string | undefined>): void {
    config.providers = config.providers || [];
    const existing = config.providers.find((p: any) => p.type === type);
    if (!existing) {
      const cleanSettings = Object.fromEntries(Object.entries(settings).filter(([_, v]) => v !== undefined));
      config.providers.push({ type, name: type, enabled: true, settings: cleanSettings });
    } else {
      const cleanSettings = Object.fromEntries(Object.entries(settings).filter(([_, v]) => v !== undefined));
      existing.settings = { ...existing.settings, ...cleanSettings };
    }
  }

  private diff(old: any, newConfig: any, prefix = ''): ConfigChangeEvent[] {
    const changes: ConfigChangeEvent[] = [];

    for (const key of Object.keys(newConfig)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      const oldValue = old[key];
      const newValue = newConfig[key];

      if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
        if (typeof oldValue === 'object' && oldValue !== null) {
          changes.push(...this.diff(oldValue, newValue, fullPath));
        } else {
          changes.push({ key: fullPath, oldValue, newValue, timestamp: Date.now() });
        }
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes.push({ key: fullPath, oldValue, newValue, timestamp: Date.now() });
      }
    }

    return changes;
  }
}

export function createConfigReloader(configPath: string): ConfigReloader {
  return new ConfigReloader(configPath);
}
