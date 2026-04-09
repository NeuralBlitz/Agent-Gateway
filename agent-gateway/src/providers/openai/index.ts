import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Provider, ProviderConfig, ChatMessage, ModelResponse, Tool } from '../types.js';
import { parseOpenAIStream, type StreamChunk } from '../../streaming/index.js';

export interface OpenAIConfig {
  apiKey: string;
  organization?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  stop?: string[];
}

export class OpenAIProvider implements Provider {
  id: string;
  type: string = 'openai';
  name: string = 'OpenAI';
  config: OpenAIConfig;
  private baseUrl: string;

  constructor(id: string, config: OpenAIConfig) {
    this.id = id;
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  private getHeaders() {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    if (this.config.organization) {
      headers['OpenAI-Organization'] = this.config.organization;
    }

    return headers;
  }

  async connect(): Promise<void> {
    logger.info(`Connected to OpenAI`);
  }

  async disconnect(): Promise<void> {
    logger.info(`Disconnected from OpenAI`);
  }

  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    const model = this.config.model || 'gpt-4o';
    
    const body: any = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        name: m.name,
      })),
      temperature: this.config.temperature ?? 0.7,
    };

    if (this.config.maxTokens) {
      body.max_tokens = this.config.maxTokens;
    }

    if (this.config.topP) {
      body.top_p = this.config.topP;
    }

    if (this.config.stop) {
      body.stop = this.config.stop;
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    const choice = data.choices[0];

    return {
      id: data.id,
      content: choice.message.content || '',
      model: data.model,
      finishReason: choice.finish_reason,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse> {
    const model = this.config.model || 'gpt-4o';
    
    const body: any = {
      model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        name: m.name,
      })),
      temperature: this.config.temperature ?? 0.7,
      tools: tools.map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
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
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    const choice = data.choices[0];

    return {
      id: data.id,
      content: choice.message.content || '',
      model: data.model,
      finishReason: choice.finish_reason,
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
    const response = await fetch(`${this.baseUrl}/models`, {
      headers: this.getHeaders(),
    });

    const data = await response.json() as any;
    return data.data || [];
  }

  // --- Streaming methods ---

  /**
   * Stream a chat response. Returns an async generator of chunks.
   */
  async *chatStream(messages: ChatMessage[]): AsyncGenerator<StreamChunk> {
    const model = this.config.model || 'gpt-4o';

    const body: any = {
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content, name: m.name })),
      temperature: this.config.temperature ?? 0.7,
      stream: true,
    };

    if (this.config.maxTokens) body.max_tokens = this.config.maxTokens;
    if (this.config.topP) body.top_p = this.config.topP;
    if (this.config.stop) body.stop = this.config.stop;

    logger.debug({ model, stream: true }, 'OpenAI streaming chat');

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    yield* parseOpenAIStream(response.body);
  }

  /**
   * Stream a chat response with tools. Returns an async generator of chunks.
   */
  async *chatStreamWithTools(messages: ChatMessage[], tools: Tool[]): AsyncGenerator<StreamChunk> {
    const model = this.config.model || 'gpt-4o';

    const body: any = {
      model,
      messages: messages.map(m => ({ role: m.role, content: m.content, name: m.name })),
      temperature: this.config.temperature ?? 0.7,
      stream: true,
      tools: tools.map(t => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.parameters },
      })),
    };

    if (this.config.maxTokens) body.max_tokens = this.config.maxTokens;

    logger.debug({ model, toolCount: tools.length, stream: true }, 'OpenAI streaming chat with tools');

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    if (!response.body) {
      throw new Error('No response body for streaming');
    }

    yield* parseOpenAIStream(response.body);
  }
}

export function createOpenAIProvider(id: string, config: OpenAIConfig): Provider {
  return new OpenAIProvider(id, config);
}