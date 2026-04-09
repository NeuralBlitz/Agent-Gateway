import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Provider, ProviderConfig, ChatMessage, ModelResponse, Tool } from '../types.js';

export interface DeepSeekConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export class DeepSeekProvider implements Provider {
  id: string;
  type: string = 'deepseek';
  name: string = 'DeepSeek';
  config: DeepSeekConfig;
  private baseUrl: string;

  constructor(id: string, config: DeepSeekConfig) {
    this.id = id;
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.deepseek.com/v1';
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async connect(): Promise<void> {
    logger.info(`Connected to DeepSeek`);
  }

  async disconnect(): Promise<void> {
    logger.info(`Disconnected from DeepSeek`);
  }

  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    const model = this.config.model || 'deepseek-chat';
    
    const body: any = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature: this.config.temperature ?? 0.7,
    };

    if (this.config.maxTokens) {
      body.max_tokens = this.config.maxTokens;
    }

    if (this.config.topP) {
      body.top_p = this.config.topP;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    const choice = data.choices[0];

    return {
      id: data.id,
      content: choice.message.content || '',
      model: data.model,
      finishReason: choice.finish_reason === 'stop' ? 'stop' : choice.finish_reason === 'length' ? 'length' : null,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse> {
    const model = this.config.model || 'deepseek-chat';
    
    const body: any = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      tools: tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
      temperature: this.config.temperature ?? 0.7,
    };

    if (this.config.maxTokens) {
      body.max_tokens = this.config.maxTokens;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    const choice = data.choices[0];

    return {
      id: data.id,
      content: choice.message.content || '',
      model: data.model,
      finishReason: choice.finish_reason === 'stop' ? 'stop' : choice.finish_reason === 'length' ? 'length' : null,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
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

  async listModels(): Promise<any[]> {
    return [
      { id: 'deepseek-chat', name: 'DeepSeek Chat' },
      { id: 'deepseek-coder', name: 'DeepSeek Coder' },
    ];
  }
}

export function createDeepSeekProvider(id: string, config: DeepSeekConfig): Provider {
  return new DeepSeekProvider(id, config);
}