export * from './types.js';
export * from './factory.js';

export { OpenAIProvider, type OpenAIConfig } from './openai/index.js';
export { AnthropicProvider, type AnthropicConfig } from './anthropic/index.js';
export { GoogleProvider, type GoogleConfig } from './google/index.js';
export { MistralProvider, type MistralConfig } from './mistral/index.js';
export { DeepSeekProvider, type DeepSeekConfig } from './deepseek/index.js';
export { OllamaProvider, type OllamaConfig } from './ollama/index.js';

export interface ProviderRegistry {
  register(type: string, handler: ProviderHandler): void;
  get(type: string): ProviderHandler | undefined;
  list(): string[];
}

export interface ProviderHandler {
  create(config?: Record<string, any>): Promise<Provider>;
}

const registry: Map<string, (config?: Record<string, any>) => Promise<Provider>> = new Map();

export function registerProvider(type: string, handler: (config?: Record<string, any>) => Promise<Provider>): void {
  registry.set(type, handler);
}

export function getProviderHandler(type: string): ((config?: Record<string, any>) => Promise<Provider>) | undefined {
  return registry.get(type);
}

export function listProviders(): string[] {
  return Array.from(registry.keys());
}

import type { Provider } from './types.js';

export function registerBuiltinProviders(): void {
  registerProvider('openai', async (config) => {
    const { createOpenAIProvider } = await import('./openai/index.js');
    return createOpenAIProvider('openai', config as any);
  });

  registerProvider('anthropic', async (config) => {
    const { createAnthropicProvider } = await import('./anthropic/index.js');
    return createAnthropicProvider('anthropic', config as any);
  });

  registerProvider('google', async (config) => {
    const { createGoogleProvider } = await import('./google/index.js');
    return createGoogleProvider('google', config as any);
  });

  registerProvider('mistral', async (config) => {
    const { createMistralProvider } = await import('./mistral/index.js');
    return createMistralProvider('mistral', config as any);
  });

  registerProvider('deepseek', async (config) => {
    const { createDeepSeekProvider } = await import('./deepseek/index.js');
    return createDeepSeekProvider('deepseek', config as any);
  });

  registerProvider('ollama', async (config) => {
    const { createOllamaProvider } = await import('./ollama/index.js');
    return createOllamaProvider('ollama', config as any);
  });
}