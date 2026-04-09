export * from './types.js';
export * from './factory.js';

export { TelegramChannel, type TelegramConfig } from './telegram/index.js';
export { DiscordChannel, type DiscordConfig } from './discord/index.js';
export { SlackChannel, type SlackConfig } from './slack/index.js';
export { WhatsAppChannel, type WhatsAppConfig } from './whatsapp/index.js';
export { SignalChannel, type SignalConfig } from './signal/index.js';
export { MatrixChannel, type MatrixConfig } from './matrix/index.js';

export interface ChannelRegistry {
  register(type: string, handler: ChannelHandler): void;
  get(type: string): ChannelHandler | undefined;
  list(): string[];
}

export interface ChannelHandler {
  create(config?: Record<string, any>): Promise<Channel>;
}

const registry: Map<string, (config?: Record<string, any>) => Promise<Channel>> = new Map();

export function registerChannel(type: string, handler: (config?: Record<string, any>) => Promise<Channel>): void {
  registry.set(type, handler);
}

export function getChannelHandler(type: string): ((config?: Record<string, any>) => Promise<Channel>) | undefined {
  return registry.get(type);
}

export function listChannels(): string[] {
  return Array.from(registry.keys());
}

import type { Channel } from './types.js';

export function registerBuiltinChannels(): void {
  registerChannel('telegram', async (config: Record<string, any>): Promise<Channel> => {
    const { createTelegramChannel } = await import('./telegram/index.js');
    return createTelegramChannel('telegram', 'telegram', config as any);
  });

  registerChannel('discord', async (config: Record<string, any>): Promise<Channel> => {
    const { createDiscordChannel } = await import('./discord/index.js');
    return createDiscordChannel('discord', 'discord', config as any);
  });

  registerChannel('slack', async (config: Record<string, any>): Promise<Channel> => {
    const { createSlackChannel } = await import('./slack/index.js');
    return createSlackChannel('slack', 'slack', config as any);
  });

  registerChannel('whatsapp', async (config: Record<string, any>): Promise<Channel> => {
    const { createWhatsAppChannel } = await import('./whatsapp/index.js');
    return createWhatsAppChannel('whatsapp', 'whatsapp', config as any);
  });

  registerChannel('signal', async (config: Record<string, any>): Promise<Channel> => {
    const { createSignalChannel } = await import('./signal/index.js');
    return createSignalChannel('signal', 'signal', config as any);
  });

  registerChannel('matrix', async (config: Record<string, any>): Promise<Channel> => {
    const { createMatrixChannel } = await import('./matrix/index.js');
    return createMatrixChannel('matrix', 'matrix', config as any);
  });
}