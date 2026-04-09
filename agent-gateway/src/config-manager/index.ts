/**
 * Enterprise Config Manager
 * Hot-reloadable configuration with environment variable overrides,
 * validation, defaults, and change notification.
 */

import { readFileSync, watch, existsSync } from 'fs';
import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface ConfigChangeEvent {
  key: string;
  oldValue: any;
  newValue: any;
  source: 'file' | 'env' | 'api';
  timestamp: number;
}

export interface ConfigManagerOptions {
  /** Config file path */
  filePath?: string;
  /** Whether to watch for file changes */
  watchFile?: boolean;
  /** Validation function */
  validate?: (config: any) => string | null;
}

export class ConfigManager extends EventEmitter {
  private config: Record<string, any> = {};
  private filePath: string;
  private validate?: (config: any) => string | null;
  private changeHistory: ConfigChangeEvent[] = [];
  private maxHistory = 1000;

  constructor(options: ConfigManagerOptions = {}) {
    super();
    this.filePath = options.filePath || 'agent-gateway.config.json';
    this.validate = options.validate;

    // Load initial config
    this.load();

    // Watch for changes
    if (options.watchFile !== false) {
      this.watch();
    }
  }

  /** Load config from file and env */
  load(): void {
    const fileConfig = this.loadFile();
    const envConfig = this.loadEnv();

    const oldConfig = { ...this.config };
    this.config = this.merge(fileConfig, envConfig);

    // Detect changes
    this.detectChanges(oldConfig, this.config);

    // Validate
    if (this.validate) {
      const error = this.validate(this.config);
      if (error) {
        logger.error({ error }, 'Config validation failed');
        this.config = oldConfig; // Revert
        return;
      }
    }

    logger.info({ keys: Object.keys(this.config).length }, 'Configuration loaded');
  }

  /** Get a config value (supports dot notation) */
  get<T = any>(key: string, defaultValue?: T): T {
    const keys = key.split('.');
    let current: any = this.config;

    for (const k of keys) {
      if (current === null || current === undefined) return defaultValue as T;
      current = current[k];
    }

    return current !== undefined ? current : (defaultValue as T);
  }

  /** Set a config value */
  set(key: string, value: any, source: ConfigChangeEvent['source'] = 'api'): void {
    const oldConfig = { ...this.config };
    const keys = key.split('.');

    let current = this.config;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    const oldValue = current[keys[keys.length - 1]];
    current[keys[keys.length - 1]] = value;

    this.changeHistory.push({
      key,
      oldValue,
      newValue: value,
      source,
      timestamp: Date.now(),
    });

    if (this.changeHistory.length > this.maxHistory) {
      this.changeHistory.shift();
    }

    this.emit('config:changed', { key, oldValue, newValue: value, source });
    logger.info({ key, source }, `Config changed: ${key}`);
  }

  /** Get all config */
  getAll(): Record<string, any> {
    return { ...this.config };
  }

  /** Get change history */
  getHistory(limit: number = 100): ConfigChangeEvent[] {
    return this.changeHistory.slice(-limit);
  }

  /** Load config from JSON file */
  private loadFile(): Record<string, any> {
    if (!existsSync(this.filePath)) return {};

    try {
      const content = readFileSync(this.filePath, 'utf-8');
      return JSON.parse(content);
    } catch (err: any) {
      logger.warn({ err, path: this.filePath }, 'Failed to load config file');
      return {};
    }
  }

  /** Load config from environment variables */
  private loadEnv(): Record<string, any> {
    const config: Record<string, any> = {};

    // Server
    if (process.env.HOST) config.host = process.env.HOST;
    if (process.env.PORT) config.port = parseInt(process.env.PORT, 10);

    // Logging
    if (process.env.LOG_LEVEL) {
      config.logging = config.logging || {};
      config.logging.level = process.env.LOG_LEVEL;
    }

    // Feature flags
    if (process.env.DISABLE_BASH_TOOL) config.disableBashTool = process.env.DISABLE_BASH_TOOL === '1';
    if (process.env.DISABLE_FS_TOOL) config.disableFsTool = process.env.DISABLE_FS_TOOL === '1';
    if (process.env.DISABLE_WEB_SEARCH) config.disableWebSearch = process.env.DISABLE_WEB_SEARCH === '1';

    // Provider API keys
    if (process.env.OPENAI_API_KEY) {
      config.providers = config.providers || [];
      config.providers.push({ type: 'openai', name: 'openai', enabled: true, settings: { apiKey: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL } });
    }
    if (process.env.ANTHROPIC_API_KEY) {
      config.providers = config.providers || [];
      config.providers.push({ type: 'anthropic', name: 'anthropic', enabled: true, settings: { apiKey: process.env.ANTHROPIC_API_KEY, model: process.env.ANTHROPIC_MODEL } });
    }

    // Channel tokens
    if (process.env.TELEGRAM_TOKEN) {
      config.channels = config.channels || [];
      config.channels.push({ type: 'telegram', name: 'telegram', enabled: true, settings: { botToken: process.env.TELEGRAM_TOKEN } });
    }

    return config;
  }

  /** Deep merge configs (env overrides file) */
  private merge(fileConfig: Record<string, any>, envConfig: Record<string, any>): Record<string, any> {
    const result = { ...fileConfig };

    for (const [key, value] of Object.entries(envConfig)) {
      if (Array.isArray(value)) {
        result[key] = [...(result[key] || []), ...value];
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.merge(result[key] || {}, value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /** Detect changes between old and new config */
  private detectChanges(oldConfig: Record<string, any>, newConfig: Record<string, any>, prefix = ''): void {
    for (const [key, newValue] of Object.entries(newConfig)) {
      const fullPath = prefix ? `${prefix}.${key}` : key;
      const oldValue = oldConfig[key];

      if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
        if (typeof oldValue === 'object' && oldValue !== null) {
          this.detectChanges(oldValue, newValue, fullPath);
        } else {
          this.recordChange(fullPath, oldValue, newValue, 'file');
        }
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        this.recordChange(fullPath, oldValue, newValue, 'file');
      }
    }
  }

  private recordChange(key: string, oldValue: any, newValue: any, source: ConfigChangeEvent['source']): void {
    this.changeHistory.push({ key, oldValue, newValue, source, timestamp: Date.now() });
    if (this.changeHistory.length > this.maxHistory) this.changeHistory.shift();
    this.emit('config:changed', { key, oldValue, newValue, source });
  }

  /** Watch config file for changes */
  private watch(): void {
    if (!existsSync(this.filePath)) return;

    watch(this.filePath, { persistent: false }, (eventType) => {
      if (eventType === 'change') {
        logger.info('Config file changed, reloading');
        this.load();
      }
    });
  }
}

export function createConfigManager(options?: ConfigManagerOptions): ConfigManager {
  return new ConfigManager(options);
}
