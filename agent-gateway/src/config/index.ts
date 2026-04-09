import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';

export interface GatewayConfig {
  version: string;
  gateway: {
    host: string;
    port: number;
    ssl?: { key: string; cert: string };
  };
  channels: Array<{
    type: string;
    name: string;
    enabled: boolean;
    settings?: Record<string, unknown>;
  }>;
  providers: Array<{
    type: string;
    name: string;
    enabled: boolean;
    settings?: Record<string, unknown>;
  }>;
  plugins: string[];
  logging?: {
    level: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
    pretty: boolean;
  };
}

export const GatewayConfigSchema: z.ZodType<GatewayConfig> = z.object({
  version: z.string().default('1.0.0'),
  gateway: z.object({
    host: z.string().default('0.0.0.0'),
    port: z.number().default(3000),
    ssl: z.object({
      key: z.string(),
      cert: z.string(),
    }).optional(),
  }),
  channels: z.array(z.object({
    type: z.string(),
    name: z.string(),
    enabled: z.boolean().default(true),
    settings: z.record(z.any()).optional(),
  })).default([]),
  providers: z.array(z.object({
    type: z.string(),
    name: z.string(),
    enabled: z.boolean().default(true),
    settings: z.record(z.any()).optional(),
  })).default([]),
  plugins: z.array(z.string()).default([]),
  logging: z.object({
    level: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    pretty: z.boolean().default(false),
  }).optional(),
});

const DEFAULT_CONFIG: GatewayConfig = {
  version: '1.0.0',
  gateway: {
    host: '0.0.0.0',
    port: 3000,
  },
  channels: [],
  providers: [],
  plugins: [],
};

export class Config {
  private config: GatewayConfig;
  private configPath: string;

  constructor(configPath?: string) {
    this.configPath = configPath || join(process.cwd(), 'agent-gateway.config.json');
    this.config = this.load();
  }

  private load(): GatewayConfig {
    if (!existsSync(this.configPath)) {
      return DEFAULT_CONFIG;
    }

    try {
      const data = readFileSync(this.configPath, 'utf-8');
      const parsed = JSON.parse(data);
      return GatewayConfigSchema.parse(parsed);
    } catch (error) {
      console.warn(`Failed to load config from ${this.configPath}, using defaults`);
      return DEFAULT_CONFIG;
    }
  }

  get(): GatewayConfig {
    return this.config;
  }

  set(config: Partial<GatewayConfig>): void {
    this.config = { ...this.config, ...config };
  }

  save(): void {
    const data = JSON.stringify(this.config, null, 2);
    writeFileSync(this.configPath, data, 'utf-8');
  }

  getChannel(name: string): GatewayConfig['channels'][number] | undefined {
    return this.config.channels.find(c => c.name === name);
  }

  getProvider(name: string): GatewayConfig['providers'][number] | undefined {
    return this.config.providers.find(p => p.name === name);
  }
}

let configInstance: Config | null = null;

export function getConfig(configPath?: string): Config {
  if (!configInstance) {
    configInstance = new Config(configPath);
  }
  return configInstance;
}

export function loadConfig(configPath?: string): GatewayConfig {
  const config = new Config(configPath);
  return config.get();
}
// Config hot-reloader
export { ConfigReloader, createConfigReloader } from './reloader.js';
export type { ConfigChangeEvent } from './reloader.js';
