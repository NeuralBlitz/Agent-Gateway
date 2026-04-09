import type { Provider, ProviderConfig } from './types.js';
import { createOpenAIProvider, type OpenAIConfig } from './openai/index.js';
import { createAnthropicProvider, type AnthropicConfig } from './anthropic/index.js';
import { createGoogleProvider, type GoogleConfig } from './google/index.js';
import { createMistralProvider, type MistralConfig } from './mistral/index.js';
import { createDeepSeekProvider, type DeepSeekConfig } from './deepseek/index.js';
import { createOllamaProvider, type OllamaConfig } from './ollama/index.js';
import { createCohereProvider, type CohereConfig } from './cohere/index.js';
import { createGroqProvider, type GroqConfig } from './groq/index.js';

export type AnyProviderConfig = OpenAIConfig | AnthropicConfig | GoogleConfig | MistralConfig | DeepSeekConfig | OllamaConfig | CohereConfig | GroqConfig;

export function createProvider(type: string, id: string, config: AnyProviderConfig): Provider {
  switch (type) {
    case 'openai':
      return createOpenAIProvider(id, config as OpenAIConfig);
    case 'anthropic':
      return createAnthropicProvider(id, config as AnthropicConfig);
    case 'google':
      return createGoogleProvider(id, config as GoogleConfig);
    case 'mistral':
      return createMistralProvider(id, config as MistralConfig);
    case 'deepseek':
      return createDeepSeekProvider(id, config as DeepSeekConfig);
    case 'ollama':
      return createOllamaProvider(id, config as OllamaConfig);
    case 'cohere':
      return createCohereProvider(id, config as CohereConfig);
    case 'groq':
      return createGroqProvider(id, config as GroqConfig);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}

export { OpenAIProvider, type OpenAIConfig } from './openai/index.js';
export { AnthropicProvider, type AnthropicConfig } from './anthropic/index.js';
export { GoogleProvider, type GoogleConfig } from './google/index.js';
export { MistralProvider, type MistralConfig } from './mistral/index.js';
export { DeepSeekProvider, type DeepSeekConfig } from './deepseek/index.js';
export { OllamaProvider, type OllamaConfig } from './ollama/index.js';
export { CohereProvider, type CohereConfig } from './cohere/index.js';
export { GroqProvider, type GroqConfig } from './groq/index.js';
export * from './types.js';
