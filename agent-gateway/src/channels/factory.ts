import type { Channel } from './types.js';
import { createTelegramChannel, type TelegramConfig } from './telegram/index.js';
import { createDiscordChannel, type DiscordConfig } from './discord/index.js';
import { createSlackChannel, type SlackConfig } from './slack/index.js';
import { createWhatsAppChannel, type WhatsAppConfig } from './whatsapp/index.js';
import { createSignalChannel, type SignalConfig } from './signal/index.js';
import { createMatrixChannel, type MatrixConfig } from './matrix/index.js';
import { createTeamsChannel, type TeamsConfig } from './teams/index.js';
import { createIRCChannel, type IRCConfig } from './irc/index.js';

export type AnyChannelConfig = TelegramConfig | DiscordConfig | SlackConfig | WhatsAppConfig | SignalConfig | MatrixConfig | TeamsConfig | IRCConfig;

export function createChannel(type: string, id: string, name: string, config: AnyChannelConfig): Channel {
  switch (type) {
    case 'telegram':
      return createTelegramChannel(id, name, config as TelegramConfig);
    case 'discord':
      return createDiscordChannel(id, name, config as DiscordConfig);
    case 'slack':
      return createSlackChannel(id, name, config as SlackConfig);
    case 'whatsapp':
      return createWhatsAppChannel(id, name, config as WhatsAppConfig);
    case 'signal':
      return createSignalChannel(id, name, config as SignalConfig);
    case 'matrix':
      return createMatrixChannel(id, name, config as MatrixConfig);
    case 'teams':
      return createTeamsChannel(id, name, config as TeamsConfig);
    case 'irc':
      return createIRCChannel(id, name, config as IRCConfig);
    default:
      throw new Error(`Unknown channel type: ${type}`);
  }
}

export { TelegramChannel, type TelegramConfig } from './telegram/index.js';
export { DiscordChannel, type DiscordConfig } from './discord/index.js';
export { SlackChannel, type SlackConfig } from './slack/index.js';
export { WhatsAppChannel, type WhatsAppConfig } from './whatsapp/index.js';
export { SignalChannel, type SignalConfig } from './signal/index.js';
export { MatrixChannel, type MatrixConfig } from './matrix/index.js';
export { TeamsChannel, type TeamsConfig } from './teams/index.js';
export { IRCChannel, type IRCConfig } from './irc/index.js';
export * from './types.js';
