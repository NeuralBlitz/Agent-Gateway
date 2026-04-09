import { logger } from '../infra/index.js';
import { getConfig } from '../config/index.js';
import type { Command } from '../cli/index.js';

interface ChannelTypeEntry {
  type: string;
  description: string;
}

const CHANNEL_TYPES: readonly ChannelTypeEntry[] = [
  { type: 'telegram', description: 'Telegram Bot API' },
  { type: 'discord', description: 'Discord Bot (REST + webhooks)' },
  { type: 'slack', description: 'Slack Bot (Events API)' },
  { type: 'whatsapp', description: 'WhatsApp Business (Cloud API)' },
  { type: 'signal', description: 'Signal (via signal-cli REST API)' },
  { type: 'matrix', description: 'Matrix (Client-Server API)' },
    { type: 'teams', description: 'MS Teams (Bot Framework)' },
    { type: 'irc', description: 'IRC (Internet Relay Chat)' },
];

export const channelsCommand: Command = {
  name: 'channels',
  description: 'List and manage messaging channels',
  options: [
    { name: 'list', type: 'boolean', description: 'List configured channels' },
    { name: 'available', type: 'boolean', description: 'Show available channel types' },
    { name: 'add', type: 'string', description: 'Add a channel (type:name:setting1=val1,...)' },
    { name: 'remove', type: 'string', description: 'Remove a channel by name' },
  ],
  handler: async (_args: string[], options: any) => {
    const cfg = getConfig();
    const config = cfg.get();

    if (options.available) {
      logger.info('Available channel types:');
      for (const ch of CHANNEL_TYPES) {
        logger.info(`  ${ch.type.padEnd(12)} - ${ch.description}`);
      }
      return;
    }

    if (options.list || (!options.add && !options.remove)) {
      if (config.channels.length === 0) {
        logger.info('No channels configured. Use `agent-gateway init` to create a config.');
        logger.info('Available types:');
        for (const ch of CHANNEL_TYPES) {
          logger.info(`  ${ch.type.padEnd(12)} - ${ch.description}`);
        }
      } else {
        logger.info(`Configured channels (${config.channels.length}):`);
        for (const ch of config.channels) {
          const status = ch.enabled ? '✓' : '✗';
          logger.info(`  ${status} ${ch.name} (${ch.type})`);
        }
      }
      return;
    }

    if (options.add) {
      const parts = options.add.split(':');
      if (parts.length < 2) {
        logger.error('Usage: agent-gateway channels add <type>:<name>[:settings]');
        logger.error('Example: agent-gateway channels add telegram:my-bot:botToken=xxx');
        return;
      }
      const [type, name, settingsStr] = parts;
      const valid = CHANNEL_TYPES.find(c => c.type === type);
      if (!valid) {
        logger.error(`Unknown channel type: ${type}`);
        logger.info('Available: ' + CHANNEL_TYPES.map(c => c.type).join(', '));
        return;
      }
      const settings: Record<string, string> = {};
      if (settingsStr) {
        for (const pair of settingsStr.split(',')) {
          const [k, v] = pair.split('=');
          if (k && v) settings[k] = v;
        }
      }
      config.channels.push({ type, name, enabled: true, settings });
      cfg.set(config);
      cfg.save();
      logger.info(`Added channel: ${name} (${type})`);
      return;
    }

    if (options.remove) {
      const idx = config.channels.findIndex((c: any) => c.name === options.remove);
      if (idx === -1) {
        logger.error(`Channel not found: ${options.remove}`);
        return;
      }
      config.channels.splice(idx, 1);
      cfg.set(config);
      cfg.save();
      logger.info(`Removed channel: ${options.remove}`);
    }
  },
};
