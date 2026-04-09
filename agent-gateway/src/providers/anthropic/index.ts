import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Provider, ProviderConfig, ChatMessage, ModelResponse, Tool } from '../types.js';

export interface AnthropicConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export class AnthropicProvider implements Provider {
  id: string;
  type: string = 'anthropic';
  name: string = 'Anthropic';
  config: AnthropicConfig;
  private baseUrl: string;

  constructor(id: string, config: AnthropicConfig) {
    this.id = id;
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  }

  private getHeaders() {
    return {
      'x-api-key': this.config.apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    };
  }

  async connect(): Promise<void> {
    logger.info(`Connected to Anthropic`);
  }

  async disconnect(): Promise<void> {
    logger.info(`Disconnected from Anthropic`);
  }

  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    const model = this.config.model || 'claude-sonnet-4-20250514';
    const maxTokens = this.config.maxTokens || 4096;
    
    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    const body: any = {
      model,
      max_tokens: maxTokens,
      messages: nonSystemMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: this.config.temperature ?? 0.7,
    };

    if (systemMessages.length > 0) {
      body.system = systemMessages.map(m => m.content).join('\n');
    }

    if (this.config.topP) {
      body.top_p = this.config.topP;
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    
    return {
      id: data.id,
      content: data.content?.[0]?.text || '',
      model: data.model,
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason === 'max_tokens' ? 'length' : null,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
    };
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse> {
    const model = this.config.model || 'claude-sonnet-4-20250514';
    const maxTokens = this.config.maxTokens || 4096;
    
    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');

    const body: any = {
      model,
      max_tokens: maxTokens,
      messages: nonSystemMessages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      tools: tools.map(t => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      })),
    };

    if (systemMessages.length > 0) {
      body.system = systemMessages.map(m => m.content).join('\n');
    }

    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    
    const toolCalls = data.content?.filter((c: any) => c.type === 'tool_use').map((tc: any) => ({
      id: tc.id,
      type: 'function' as const,
      function: {
        name: tc.name,
        arguments: JSON.stringify(tc.input),
      },
    }));

    return {
      id: data.id,
      content: data.content?.find((c: any) => c.type === 'text')?.text || '',
      model: data.model,
      finishReason: data.stop_reason === 'end_turn' ? 'stop' : data.stop_reason === 'max_tokens' ? 'length' : null,
      usage: data.usage ? {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens,
      } : undefined,
      toolCalls,
    };
  }

  async listModels(): Promise<any[]> {
    return [
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4' },
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4' },
      { id: 'claude-haiku-3-20240307', name: 'Claude Haiku 3' },
    ];
  }
}

export function createAnthropicProvider(id: string, config: AnthropicConfig): Provider {
  return new AnthropicProvider(id, config);
}