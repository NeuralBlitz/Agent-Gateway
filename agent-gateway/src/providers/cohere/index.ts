/**
 * Cohere AI Provider
 * Connects to Cohere's Command and Command-R models.
 * Supports chat, command, and tool calling.
 */

import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Provider, ProviderConfig, ChatMessage, ModelResponse, Tool } from '../../providers/types.js';

export interface CohereConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export class CohereProvider implements Provider {
  id: string;
  type: string = 'cohere';
  name: string = 'Cohere';
  config: CohereConfig;

  constructor(id: string, config: CohereConfig) {
    this.id = id;
    this.config = config;
  }

  async connect(): Promise<void> {
    logger.info('Cohere provider connected');
  }

  async disconnect(): Promise<void> {
    logger.info('Cohere provider disconnected');
  }

  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    const model = this.config.model || 'command-r-plus';
    const baseUrl = this.config.baseUrl || 'https://api.cohere.ai/v1';

    // Convert messages to Cohere format
    const chatHistory = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: m.content,
    }));

    const lastMessage = messages[messages.length - 1];

    const body: any = {
      model,
      message: lastMessage.content,
      chat_history: chatHistory,
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens || 4096,
    };

    const response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cohere API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;

    return {
      id: data.generation_id || `cohere_${Date.now()}`,
      content: data.text || '',
      model: data.model || model,
      finishReason: data.finish_reason === 'COMPLETE' ? 'stop' : 'length',
      usage: data.meta?.billed_units
        ? {
            promptTokens: data.meta.billed_units.input_tokens || 0,
            completionTokens: data.meta.billed_units.output_tokens || 0,
            totalTokens: (data.meta.billed_units.input_tokens || 0) + (data.meta.billed_units.output_tokens || 0),
          }
        : undefined,
    };
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse> {
    const model = this.config.model || 'command-r-plus';
    const baseUrl = this.config.baseUrl || 'https://api.cohere.ai/v1';

    const chatHistory = messages.slice(0, -1).map((m) => ({
      role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
      message: m.content,
    }));

    const lastMessage = messages[messages.length - 1];

    const body: any = {
      model,
      message: lastMessage.content,
      chat_history: chatHistory,
      temperature: this.config.temperature ?? 0.7,
      max_tokens: this.config.maxTokens || 4096,
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        parameter_definitions: Object.fromEntries(
          Object.entries(t.parameters.properties || {}).map(([key, val]: [string, any]) => [
            key,
            { description: val.description || '', type: val.type || 'string', required: (t.parameters.required || []).includes(key) },
          ])
        ),
      })),
    };

    const response = await fetch(`${baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Cohere API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;

    // Check for tool calls
    if (data.tool_calls && data.tool_calls.length > 0) {
      return {
        id: data.generation_id || `cohere_${Date.now()}`,
        content: data.text || '',
        model: data.model || model,
        finishReason: 'tool_calls',
        toolCalls: data.tool_calls.map((tc: any, i: number) => ({
          id: `tc_${i}`,
          type: 'function' as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.parameters || {}),
          },
        })),
      };
    }

    return {
      id: data.generation_id || `cohere_${Date.now()}`,
      content: data.text || '',
      model: data.model || model,
      finishReason: data.finish_reason === 'COMPLETE' ? 'stop' : 'length',
      usage: data.meta?.billed_units
        ? {
            promptTokens: data.meta.billed_units.input_tokens || 0,
            completionTokens: data.meta.billed_units.output_tokens || 0,
            totalTokens: (data.meta.billed_units.input_tokens || 0) + (data.meta.billed_units.output_tokens || 0),
          }
        : undefined,
    };
  }
}

export function createCohereProvider(id: string, config: CohereConfig): CohereProvider {
  return new CohereProvider(id, config);
}
