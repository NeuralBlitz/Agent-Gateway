import { EventEmitter } from 'events';

export interface PluginManifest {
  name: string;
  version: string;
  description?: string;
  type: 'channel' | 'provider' | 'capability';
  author?: string;
  homepage?: string;
  dependencies?: Record<string, string>;
}

export interface ChannelConfig {
  enabled: boolean;
  settings?: Record<string, any>;
}

export interface Channel {
  id: string;
  type: string;
  name: string;
  connected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(userId: string, content: string): Promise<void>;
  on(event: string, handler: (...args: any[]) => void): void;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ModelResponse {
  id: string;
  content: string;
  model: string;
  finishReason: 'stop' | 'length' | 'content_filter' | null;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface Provider {
  id: string;
  type: string;
  name: string;
  config: ProviderConfig;
  chat(messages: ChatMessage[]): Promise<ModelResponse>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute(params: Record<string, any>): Promise<any>;
}

export interface Agent {
  id: string;
  name: string;
  provider: Provider;
  tools: Tool[];
  systemPrompt?: string;
  run(messages: ChatMessage[]): Promise<ModelResponse>;
}

export interface Plugin {
  manifest: PluginManifest;
  initialize(context: PluginContext): Promise<void>;
  destroy(): Promise<void>;
}

export interface PluginContext {
  logger: any;
  config: any;
  manifest: PluginManifest;
  registerChannel(channel: Channel): void;
  registerProvider(provider: Provider): void;
  registerTool(tool: Tool): void;
  getChannel(id: string): Channel | undefined;
  getProvider(id: string): Provider | undefined;
}

export abstract class BaseChannel extends EventEmitter implements Channel {
  abstract id: string;
  abstract type: string;
  abstract name: string;
  abstract connected: boolean;

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendMessage(userId: string, content: string): Promise<void>;
}

export abstract class BaseProvider implements Provider {
  abstract id: string;
  abstract type: string;
  abstract name: string;
  abstract config: ProviderConfig;

  abstract chat(messages: ChatMessage[]): Promise<ModelResponse>;
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
}

export function createPluginContext(logger: any, config: any, manifest: PluginManifest): PluginContext {
  const channels = new Map<string, Channel>();
  const providers = new Map<string, Provider>();
  const tools = new Map<string, Tool>();

  return {
    logger,
    config,
    manifest,
    registerChannel(channel: Channel) {
      channels.set(channel.id, channel);
    },
    registerProvider(provider: Provider) {
      providers.set(provider.id, provider);
    },
    registerTool(tool: Tool) {
      tools.set(tool.name, tool);
    },
    getChannel(id: string) {
      return channels.get(id);
    },
    getProvider(id: string) {
      return providers.get(id);
    },
  };
}