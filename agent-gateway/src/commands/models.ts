import { logger } from '../infra/index.js';
import { getConfig } from '../config/index.js';
import { fetch } from 'undici';
import { existsSync } from 'fs';
import { join } from 'path';

// Model context window registry
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  // OpenAI
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000,
  'gpt-4-turbo': 128_000,
  'gpt-4': 8192,
  'gpt-3.5-turbo': 16_385,
  'o1': 200_000,
  'o1-mini': 128_000,
  // Anthropic
  'claude-sonnet-4-20250514': 200_000,
  'claude-opus-4-20250514': 200_000,
  'claude-3-5-sonnet': 200_000,
  'claude-3-5-haiku': 200_000,
  'claude-3-opus': 200_000,
  // Google
  'gemini-2.0-flash': 1_048_576,
  'gemini-2.0-flash-exp': 1_048_576,
  'gemini-2.0-pro': 2_000_000,
  'gemini-1.5-pro': 2_000_000,
  // Mistral
  'mistral-large-latest': 128_000,
  'mistral-small-latest': 32_000,
  'mistral-medium': 32_000,
  // DeepSeek
  'deepseek-chat': 128_000,
  'deepseek-coder': 128_000,
  // Cohere
  'command-r-plus': 128_000,
  'command-r': 128_000,
  // Groq
  'llama-3.3-70b-versatile': 128_000,
  'mixtral-8x7b-32768': 32_768,
  'gemma-7b-it': 8192,
  // Ollama
  'llama3': 8192,
  'llama3.1': 128_000,
  'llama3.2': 128_000,
  'llama3.3': 128_000,
  'mistral': 8192,
  'mixtral': 32_000,
  'phi3': 8192,
};

export const modelsCommand = {
  name: 'models',
  description: 'List configured models and test provider connectivity',
  options: [
    { name: 'list', type: 'boolean', description: 'List configured models with context windows' },
    { name: 'test', type: 'string', description: 'Test connectivity to a provider by name' },
    { name: 'port', type: 'string', description: 'Gateway port for testing (default: 3000)', default: '3000' },
    { name: 'json', type: 'boolean', description: 'Output as JSON', default: false },
  ],
  handler: async (_args: string[], options: any) => {
    const port = parseInt(options.port || '3000', 10);
    const asJson = options.json === true || options.json === 'true';

    // Test provider connectivity
    if (options.test) {
      const providerName = options.test;
      logger.info(`Testing connectivity to provider: ${providerName}`);

      // Check if gateway is running
      try {
        const response = await fetch(`http://localhost:${port}/api/status`, {
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          logger.error('Gateway is not running. Start it with: agent-gateway server');
          process.exit(1);
        }

        const status = await response.json() as any;
        const provider = status.providers?.find((p: string) => p === providerName);

        if (!provider) {
          logger.error(`Provider '${providerName}' not found in configuration`);
          logger.info(`Available providers: ${status.providers.join(', ') || 'none'}`);
          process.exit(1);
        }

        // For a real test, we'd send a test message. For now, just verify the provider is configured.
        logger.info(`Provider '${providerName}' is configured and gateway is running`);
        logger.info(`   Note: Full connectivity test requires an API call (coming soon)`);
      } catch (err: any) {
        logger.error(`Cannot connect to gateway: ${err.message}`);
        process.exit(1);
      }
      return;
    }

    // List models (default)
    const configPath = join(process.cwd(), 'agent-gateway.config.json');
    const models: Array<{ provider: string; model: string; contextWindow: number; hasApiKey: boolean }> = [];

    if (existsSync(configPath)) {
      const cfg = getConfig();
      const config = cfg.get();

      for (const prov of config.providers) {
        const settings = prov.settings as Record<string, any> || {};
        const model = (settings.model as string) || getDefaultModel(prov.type);
        const apiKey = (settings.apiKey as string) || process.env[`${prov.type.toUpperCase()}_API_KEY`];
        const contextWindow = MODEL_CONTEXT_WINDOWS[model] || 128_000;

        models.push({
          provider: prov.type,
          model,
          contextWindow,
          hasApiKey: !!apiKey,
        });
      }
    }

    if (asJson) {
      console.log(JSON.stringify({ models, total: models.length }, null, 2));
    } else if (models.length === 0) {
      logger.info('No models configured. Add providers with: agent-gateway providers add <type>:<name>');
    } else {
      logger.info(`Configured models (${models.length}):`);
      logger.info('');
      logger.info(`  ${'Provider'.padEnd(12)} ${'Model'.padEnd(30)} ${'Context'.padEnd(12)} API Key`);
      logger.info(`  ${'─'.repeat(12)} ${'─'.repeat(30)} ${'─'.repeat(12)} ${'─'.repeat(8)}`);
      for (const m of models) {
        const ctxStr = m.contextWindow >= 1_000_000 ? `${(m.contextWindow / 1_000_000).toFixed(1)}M` :
                       m.contextWindow >= 1000 ? `${(m.contextWindow / 1000).toFixed(0)}K` :
                       String(m.contextWindow);
        const keyStatus = m.hasApiKey ? '✅' : '❌';
        logger.info(`  ${m.provider.padEnd(12)} ${m.model.padEnd(30)} ${ctxStr.padEnd(12)} ${keyStatus}`);
      }
    }
  },
};

function getDefaultModel(type: string): string {
  const defaults: Record<string, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-20250514',
    google: 'gemini-2.0-flash-exp',
    mistral: 'mistral-large-latest',
    deepseek: 'deepseek-chat',
    ollama: 'llama3',
    cohere: 'command-r-plus',
    groq: 'llama-3.3-70b-versatile',
  };
  return defaults[type] || 'unknown';
}
