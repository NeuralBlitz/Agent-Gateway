import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Provider, ProviderConfig, ChatMessage, ModelResponse, Tool } from '../types.js';

export interface GoogleConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export class GoogleProvider implements Provider {
  id: string;
  type: string = 'google';
  name: string = 'Google';
  config: GoogleConfig;
  private baseUrl: string;

  constructor(id: string, config: GoogleConfig) {
    this.id = id;
    this.config = config;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  async connect(): Promise<void> {
    logger.info(`Connected to Google AI`);
  }

  async disconnect(): Promise<void> {
    logger.info(`Disconnected from Google AI`);
  }

  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    const model = this.config.model || 'gemini-2.0-flash-exp';
    
    const contents = this.buildContents(messages);
    
    const body: any = {
      contents,
      generationConfig: {
        temperature: this.config.temperature ?? 0.9,
        maxOutputTokens: this.config.maxTokens || 2048,
        topP: this.config.topP || 0.95,
      },
    };

    const response = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    
    return {
      id: data.promptFeedback?.subject || `gemini-${Date.now()}`,
      content: data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      model: model,
      finishReason: this.mapFinishReason(data.candidates?.[0]?.finishReason),
    };
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse> {
    const model = this.config.model || 'gemini-2.0-flash-exp';
    
    const contents = this.buildContents(messages);
    
    const body: any = {
      contents,
      tools: tools.map(t => ({
        functionDeclarations: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      })),
      generationConfig: {
        temperature: this.config.temperature ?? 0.9,
        maxOutputTokens: this.config.maxTokens || 2048,
        topP: this.config.topP || 0.95,
      },
    };

    const response = await fetch(`${this.baseUrl}/models/${model}:generateContent?key=${this.config.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google AI API error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    
    const functionCalls = data.candidates?.[0]?.content?.parts?.filter((p: any) => p.functionCall).map((fc: any) => ({
      id: `call_${Date.now()}`,
      type: 'function' as const,
      function: {
        name: fc.functionCall.name,
        arguments: JSON.stringify(fc.functionCall.args),
      },
    }));

    return {
      id: data.promptFeedback?.subject || `gemini-${Date.now()}`,
      content: data.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text || '',
      model: model,
      finishReason: this.mapFinishReason(data.candidates?.[0]?.finishReason),
      toolCalls: functionCalls,
    };
  }

  private buildContents(messages: ChatMessage[]): any[] {
    const contents: any[] = [];
    
    for (const msg of messages) {
      if (msg.role === 'system') continue;
      
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
    
    return contents;
  }

  private mapFinishReason(reason?: string): 'stop' | 'length' | 'content_filter' | null {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
      case 'RECITATION':
        return 'content_filter';
      default:
        return null;
    }
  }

  async listModels(): Promise<any[]> {
    return [
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Experimental' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    ];
  }
}

export function createGoogleProvider(id: string, config: GoogleConfig): Provider {
  return new GoogleProvider(id, config);
}