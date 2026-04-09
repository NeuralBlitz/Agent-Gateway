import { logger } from '../infra/index.js';
import { getConfig } from '../config/index.js';
import type { Command } from '../cli/index.js';

interface ProviderTypeEntry {
  type: string;
  description: string;
}

const PROVIDER_TYPES: readonly ProviderTypeEntry[] = [
  { type: 'openai', description: 'OpenAI (GPT-4o, o1, o3, etc.)' },
  { type: 'anthropic', description: 'Anthropic Claude (Sonnet, Opus, Haiku)' },
  { type: 'google', description: 'Google Gemini (Flash, Pro)' },
  { type: 'mistral', description: 'Mistral AI (Large, Small, Medium)' },
  { type: 'deepseek', description: 'DeepSeek (Chat, Coder)' },
  { type: 'ollama', description: 'Ollama (self-hosted, no API key needed)' },
    { type: 'cohere', description: 'Cohere (Command R+, Command)' },
    { type: 'groq', description: 'Groq (ultra-fast Llama, Mixtral, Gemma)' },
];

export const providersCommand: Command = {
  name: 'providers',
  description: 'List and manage AI providers',
  options: [
    { name: 'list', type: 'boolean', description: 'List configured providers' },
    { name: 'available', type: 'boolean', description: 'Show available provider types' },
    { name: 'add', type: 'string', description: 'Add a provider (type:name:setting1=val1,...)' },
    { name: 'remove', type: 'string', description: 'Remove a provider by name' },
  ],
  handler: async (_args: string[], options: any) => {
    const cfg = getConfig();
    const config = cfg.get();

    if (options.available) {
      logger.info('Available provider types:');
      for (const p of PROVIDER_TYPES) {
        logger.info(`  ${p.type.padEnd(12)} - ${p.description}`);
      }
      return;
    }

    if (options.list || (!options.add && !options.remove)) {
      if (config.providers.length === 0) {
        logger.info('No providers configured. Add one to enable auto-reply.');
        logger.info('Available types:');
        for (const p of PROVIDER_TYPES) {
          logger.info(`  ${p.type.padEnd(12)} - ${p.description}`);
        }
      } else {
        logger.info(`Configured providers (${config.providers.length}):`);
        for (const p of config.providers) {
          const status = p.enabled ? '✓' : '✗';
          const model = p.settings?.model ?? '(default)';
          logger.info(`  ${status} ${p.name} (${p.type}, model: ${model})`);
        }
      }
      return;
    }

    if (options.add) {
      const parts = options.add.split(':');
      if (parts.length < 2) {
        logger.error('Usage: agent-gateway providers add <type>:<name>[:settings]');
        logger.error('Example: agent-gateway providers add openai:gpt4:apiKey=sk-xxx,model=gpt-4o');
        return;
      }
      const [type, name, settingsStr] = parts;
      const valid = PROVIDER_TYPES.find(p => p.type === type);
      if (!valid) {
        logger.error(`Unknown provider type: ${type}`);
        logger.info('Available: ' + PROVIDER_TYPES.map(p => p.type).join(', '));
        return;
      }
      const settings: Record<string, string> = {};
      if (settingsStr) {
        for (const pair of settingsStr.split(',')) {
          const [k, v] = pair.split('=');
          if (k && v) settings[k] = v;
        }
      }
      config.providers.push({ type, name, enabled: true, settings });
      cfg.set(config);
      cfg.save();
      logger.info(`Added provider: ${name} (${type})`);
      return;
    }

    if (options.remove) {
      const idx = config.providers.findIndex((p: any) => p.name === options.remove);
      if (idx === -1) {
        logger.error(`Provider not found: ${options.remove}`);
        return;
      }
      config.providers.splice(idx, 1);
      cfg.set(config);
      cfg.save();
      logger.info(`Removed provider: ${options.remove}`);
    }
  },
};
