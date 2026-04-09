import { logger } from '../infra/index.js';
import { getConfig } from '../config/index.js';
import { createChannel } from '../channels/index.js';
import { createProvider } from '../providers/index.js';
import { createAndStartServer } from '../server/index.js';
import 'dotenv/config';
import type { Command } from '../cli/index.js';

export const serverCommand: Command = {
  name: 'server',
  description: 'Start the agent-gateway server',
  options: [
    { name: 'host', type: 'string', description: 'Server host (default: 0.0.0.0)', default: '0.0.0.0' },
    { name: 'port', type: 'string', description: 'Server port (default: 3000)', default: '3000' },
    { name: 'config', type: 'string', description: 'Path to config file' },
  ],
  handler: async (_args: string[], options: any) => {
    const host = options.host || process.env.HOST || '0.0.0.0';
    const port = parseInt(options.port || process.env.PORT || '3000', 10);
    const configPath = options.config;

    // Load config (file + env overrides)
    const configInstance = getConfig(configPath);
    const config = configInstance.get();

    logger.info({ host, port }, 'Starting agent-gateway server');

    // Build channels from config + env
    const channels = new Map();
    for (const ch of config.channels) {
      if (!ch.enabled) continue;
      try {
        const settings = { ...(ch.settings || {}) };
        // Env var overrides for sensitive values
        const tokenKey = `${ch.type.toUpperCase()}_TOKEN`;
        if (process.env[tokenKey] && !settings.botToken && !settings.accessToken) {
          if (ch.type === 'telegram') settings.botToken = process.env[tokenKey];
          if (ch.type === 'discord') settings.botToken = process.env[tokenKey];
          if (ch.type === 'slack') settings.botToken = process.env[tokenKey];
          if (ch.type === 'whatsapp') settings.accessToken = process.env[tokenKey];
          if (ch.type === 'signal') { settings.signalingKey = process.env[tokenKey]; settings.signalService = process.env.SIGNAL_SERVICE || 'http://localhost:8080'; settings.phoneNumber = process.env.SIGNAL_PHONE || ''; settings.accountId = process.env.SIGNAL_ACCOUNT || ''; }
          if (ch.type === 'matrix') { settings.accessToken = process.env[tokenKey]; settings.homeserver = process.env.MATRIX_HOMESERVER || 'https://matrix.org'; settings.userId = process.env.MATRIX_USER_ID || ''; }
        }
        const channel = createChannel(ch.type, ch.name, ch.name, settings as any);
        channels.set(ch.name, channel);
        logger.info({ type: ch.type, name: ch.name }, 'Configured channel');
      } catch (err: any) {
        logger.error({ err, channel: ch.name }, 'Failed to create channel');
      }
    }

    // Build providers from config + env
    const providers = new Map();
    for (const prov of config.providers) {
      if (!prov.enabled) continue;
      try {
        const settings = { ...prov.settings };
        // Env var overrides for API keys
        const keyVar = `${prov.type.toUpperCase()}_API_KEY`;
        if (process.env[keyVar] && !settings.apiKey) {
          settings.apiKey = process.env[keyVar];
        }
        if (process.env[`${prov.type.toUpperCase()}_BASE_URL`] && !settings.baseUrl) {
          settings.baseUrl = process.env[`${prov.type.toUpperCase()}_BASE_URL`];
        }
        if (process.env[`${prov.type.toUpperCase()}_MODEL`] && !settings.model) {
          settings.model = process.env[`${prov.type.toUpperCase()}_MODEL`];
        }
        const provider = createProvider(prov.type, prov.name, settings);
        providers.set(prov.name, provider);
        logger.info({ type: prov.type, name: prov.name }, 'Configured provider');
      } catch (err: any) {
        logger.error({ err, provider: prov.name }, 'Failed to create provider');
      }
    }

    if (channels.size === 0) {
      logger.warn('No channels configured. Use `agent-gateway init` or set AGENT_CHANNELS in config.');
      logger.warn('You can still use the API and WebSocket interface.');
    }

    if (providers.size === 0) {
      logger.warn('No providers configured. Set at least one AI provider.');
      logger.warn('Auto-reply will not work.');
    }

    // Determine static directory for web UI
    const staticDir = process.env.STATIC_DIR;

    try {
      await createAndStartServer({
        host,
        port,
        channels,
        providers,
        config,
        staticDir,
      });

      logger.info('Gateway is running. Press Ctrl+C to stop.');

      // Graceful shutdown
      const shutdown = async () => {
        logger.info('Shutting down...');
        process.exit(0);
      };
      process.on('SIGINT', shutdown);
      process.on('SIGTERM', shutdown);
    } catch (err: any) {
      logger.error({ err }, 'Failed to start server');
      process.exit(1);
    }
  },
};
