/**
 * Groq Provider
 * Ultra-fast inference with Llama, Mixtral, and Gemma models.
 * OpenAI-compatible API endpoint.
 */

import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Provider, ProviderConfig, ChatMessage, ModelResponse, Tool } from '../../providers/types.js';

export interface GroqConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class GroqProvider implements Provider {
  id: string;
  type: string = 'groq';
  name: string = 'Groq';
  config: GroqConfig;

  constructor(id: string, config: GroqConfig) {
    this.id = id;
    this.config = config;
  }

  async connect(): Promise<void> {
    logger.info('Groq provider connected');
  }

  async disconnect(): Promise<void> {
    logger.info('Groq provider disconnected');
  }

  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    const model = this.config.model || 'llama-3.3-70b-versatile';
    const baseUrl = this.config.baseUrl || 'https://api.groq.com/openai/v1';

    const body: any = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        name: m.name,
      })),
      temperature: this.config.temperature ?? 0.7,
    };

    if (this.config.maxTokens) body.max_tokens = this.config.maxTokens;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    const choice = data.choices[0];

    return {
      id: data.id,
      content: choice.message.content || '',
      model: data.model,
      finishReason: choice.finish_reason,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
    };
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse> {
    const model = this.config.model || 'llama-3.3-70b-versatile';
    const baseUrl = this.config.baseUrl || 'https://api.groq.com/openai/v1';

    const body: any = {
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
        name: m.name,
      })),
      temperature: this.config.temperature ?? 0.7,
      tools: tools.map((t) => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
    };

    if (this.config.maxTokens) body.max_tokens = this.config.maxTokens;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    const choice = data.choices[0];

    return {
      id: data.id,
      content: choice.message.content || '',
      model: data.model,
      finishReason: choice.finish_reason,
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens,
            completionTokens: data.usage.completion_tokens,
            totalTokens: data.usage.total_tokens,
          }
        : undefined,
      toolCalls: choice.message.tool_calls?.map((tc: any) => ({
        id: tc.id,
        type: tc.type,
        function: {
          name: tc.function.name,
          arguments: tc.function.arguments,
        },
      })),
    };
  }
}

export function createGroqProvider(id: string, config: GroqConfig): GroqProvider {
  return new GroqProvider(id, config);
}
