import { logger } from '../infra/index.js';
import { existsSync } from 'fs';
import { join } from 'path';
import type { Command } from '../cli/index.js';

export const initCommand: Command = {
  name: 'init',
  description: 'Initialize a new agent-gateway project',
  options: [
    { name: 'force', type: 'boolean', description: 'Overwrite existing config', default: false },
  ],
  handler: async (_args: string[], options: any) => {
    const configPath = join(process.cwd(), 'agent-gateway.config.json');
    const envPath = join(process.cwd(), '.env.example');

    if (existsSync(configPath) && !options.force) {
      logger.warn('Configuration file already exists. Use --force to overwrite.');
      return;
    }

    const defaultConfig = {
      version: '1.0.0',
      gateway: {
        host: '0.0.0.0',
        port: 3000,
      },
      channels: [
        // {
        //   "type": "telegram",
        //   "name": "my-bot",
        //   "enabled": true,
        //   "settings": {
        //     "botToken": ""  // or set TELEGRAM_TOKEN env var
        //   }
        // }
      ],
      providers: [
        // {
        //   "type": "openai",
        //   "name": "gpt-4o",
        //   "enabled": true,
        //   "settings": {
        //     "apiKey": "",       // or set OPENAI_API_KEY env var
        //     "model": "gpt-4o"
        //   }
        // }
      ],
      plugins: [],
      logging: {
        level: 'info',
        pretty: true,
      },
    };

    const fs = await import('fs/promises');
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2));
    logger.info(`Created configuration at ${configPath}`);

    // Create .env.example if it doesn't exist
    if (!existsSync(envPath)) {
      const envExample = `# Agent Gateway Environment Variables
# Copy this to .env and fill in your keys

# Server
HOST=0.0.0.0
PORT=3000

# Session storage directory
AGENT_SESSIONS_DIR=.agent-sessions

# --- Channels (uncomment and fill in) ---
# Telegram bot token (from @BotFather)
# TELEGRAM_TOKEN=

# Discord bot token
# DISCORD_TOKEN=

# Slack bot token
# SLACK_TOKEN=

# WhatsApp (Meta) access token
# WHATSAPP_TOKEN=
# WHATSAPP_VERIFY_TOKEN=

# Signal signaling key
# SIGNAL_TOKEN=

# Matrix access token
# MATRIX_TOKEN=

# --- AI Providers ---
# OpenAI
# OPENAI_API_KEY=
# OPENAI_MODEL=gpt-4o

# Anthropic / Claude
# ANTHROPIC_API_KEY=
# ANTHROPIC_MODEL=claude-sonnet-4-20250514

# Google / Gemini
# GOOGLE_API_KEY=
# GOOGLE_MODEL=gemini-2.0-flash-exp

# Mistral
# MISTRAL_API_KEY=
# MISTRAL_MODEL=mistral-large-latest

# DeepSeek
# DEEPSEEK_API_KEY=
# DEEPSEEK_MODEL=deepseek-chat

# Ollama (no API key needed, runs locally)
# OLLAMA_BASE_URL=http://localhost:11434
# OLLAMA_MODEL=llama3

# --- Optional ---
# Static web UI directory
# STATIC_DIR=

# Log level: fatal, error, warn, info, debug, trace
# LOG_LEVEL=info
`;
      await fs.writeFile(envPath, envExample);
      logger.info(`Created .env.example at ${envPath}`);
    }

    logger.info('');
    logger.info('Next steps:');
    logger.info('  1. Copy .env.example to .env and fill in your API keys');
    logger.info('  2. Edit agent-gateway.config.json to enable channels and providers');
    logger.info('  3. Run: agent-gateway server');
    logger.info('');
  },
};
