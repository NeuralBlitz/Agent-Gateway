import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Provider, ProviderConfig, ChatMessage, ModelResponse, Tool } from '../types.js';

export interface OllamaConfig {
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class OllamaProvider implements Provider {
  id: string;
  type: string = 'ollama';
  name: string = 'Ollama';
  config: OllamaConfig;
  private baseUrl: string;

  constructor(id: string, config: OllamaConfig) {
    this.id = id;
    this.config = config;
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) {
        throw new Error('Ollama server not responding');
      }
      logger.info(`Connected to Ollama at ${this.baseUrl}`);
    } catch (error) {
      logger.error(`Failed to connect to Ollama: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    logger.info(`Disconnected from Ollama`);
  }

  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    const model = this.config.model || 'llama3';
    
    const body: any = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
    };

    if (this.config.temperature) {
      body.options = { temperature: this.config.temperature };
    }

    if (this.config.maxTokens) {
      body.options = body.options || {};
      body.options.num_predict = this.config.maxTokens;
    }

    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;

    return {
      id: `ollama-${Date.now()}`,
      content: data.message?.content || '',
      model: data.model || model,
      finishReason: data.done ? 'stop' : null,
    };
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse> {
    const model = this.config.model || 'llama3';
    
    const body: any = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      stream: false,
      tools: tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
    };

    if (this.config.temperature) {
      body.options = { temperature: this.config.temperature };
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${error}`);
      }

      const data = await response.json() as any;

      return {
        id: `ollama-${Date.now()}`,
        content: data.message?.content || '',
        model: data.model || model,
        finishReason: data.done ? 'stop' : null,
      };
    } catch (error: any) {
      logger.warn(`Ollama tool calling not supported or failed: ${error.message}`);
      return this.chat(messages);
    }
  }

  async listModels(): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/tags`);
    const data = await response.json() as any;
    return data.models || [];
  }

  async pullModel(modelName: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName, stream: false }),
    });
  }

  async deleteModel(modelName: string): Promise<void> {
    await fetch(`${this.baseUrl}/api/delete`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    });
  }
}

export function createOllamaProvider(id: string, config: OllamaConfig): Provider {
  return new OllamaProvider(id, config);
}