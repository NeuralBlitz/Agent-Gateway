import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import { Gateway, GatewayConfig, Session, Message } from '../../src/gateway/index.js';
import type { Channel, ChannelMessage } from '../../src/channels/types.js';
import type { Provider } from '../../src/providers/types.js';

interface MockChannelOptions {
  id?: string;
  type?: string;
  name?: string;
  connected?: boolean;
  connectError?: Error | null;
  disconnectError?: Error | null;
}

interface MockProviderOptions {
  id?: string;
  type?: string;
  name?: string;
  connectError?: Error | null;
  disconnectError?: Error | null;
}

class MockChannel implements Channel {
  id: string;
  type: string;
  name: string;
  connected: boolean;
  config: { enabled: boolean; settings?: Record<string, any> };
  private connectError: Error | null;
  private disconnectError: Error | null;
  private messageListeners: ((message: ChannelMessage) => void)[] = [];
  private errorListeners: ((error: Error) => void)[] = [];
  private readyListeners: (() => void)[] = [];

  constructor(options: MockChannelOptions = {}) {
    this.id = options.id ?? 'mock-channel';
    this.type = options.type ?? 'mock';
    this.name = options.name ?? 'Mock Channel';
    this.connected = options.connected ?? false;
    this.config = { enabled: true };
    this.connectError = options.connectError ?? null;
    this.disconnectError = options.disconnectError ?? null;
  }

  async connect(): Promise<void> {
    if (this.connectError) {
      throw this.connectError;
    }
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.disconnectError) {
      throw this.disconnectError;
    }
    this.connected = false;
  }

  async sendMessage(_userId: string, _content: string): Promise<void> {
    return;
  }

  async getUser(_userId: string): Promise<{ id: string; name: string; username?: string; avatar?: string; metadata?: Record<string, any> } | null> {
    return null;
  }

  async getMe(): Promise<{ id: string; name: string; username?: string; avatar?: string } | null> {
    return null;
  }

  on(event: 'message', handler: (message: ChannelMessage) => void): void;
  on(event: 'error', handler: (error: Error) => void): void;
  on(event: 'ready', handler: () => void): void;
  on(event: string, handler: (...args: any[]) => void): void {
    if (event === 'message') {
      this.messageListeners.push(handler as (message: ChannelMessage) => void);
    } else if (event === 'error') {
      this.errorListeners.push(handler);
    } else if (event === 'ready') {
      this.readyListeners.push(handler);
    }
  }

  emitMessage(message: ChannelMessage): void {
    this.messageListeners.forEach(listener => listener(message));
  }

  emitError(error: Error): void {
    this.errorListeners.forEach(listener => listener(error));
  }

  emitReady(): void {
    this.readyListeners.forEach(listener => listener());
  }

  removeListener(_event: string, _handler: (...args: any[]) => void): void {
    return;
  }
}

class MockProvider implements Provider {
  id: string;
  type: string;
  name: string;
  config: { apiKey?: string; baseUrl?: string; model?: string; maxTokens?: number; temperature?: number; topP?: number; stop?: string[] };
  private connectError: Error | null;
  private disconnectError: Error | null;
  private isConnected: boolean = false;

  constructor(options: MockProviderOptions = {}) {
    this.id = options.id ?? 'mock-provider';
    this.type = options.type ?? 'mock';
    this.name = options.name ?? 'Mock Provider';
    this.config = {};
    this.connectError = options.connectError ?? null;
    this.disconnectError = options.disconnectError ?? null;
  }

  async connect(): Promise<void> {
    if (this.connectError) {
      throw this.connectError;
    }
    this.isConnected = true;
  }

  async disconnect(): Promise<void> {
    if (this.disconnectError) {
      throw this.disconnectError;
    }
    this.isConnected = false;
  }

  async chat(_messages: { role: 'system' | 'user' | 'assistant'; content: string; name?: string; toolCalls?: any[]; toolCallId?: string }[]): Promise<{ id: string; content: string; model: string; finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null; usage?: { promptTokens: number; completionTokens: number; totalTokens: number }; toolCalls?: any[] }> {
    return {
      id: 'mock-response',
      content: 'Mock response',
      model: 'mock-model',
      finishReason: 'stop',
    };
  }

  async chatWithTools(_messages: any[], _tools: any[]): Promise<{ id: string; content: string; model: string; finishReason: 'stop' | 'length' | 'content_filter' | 'tool_calls' | null; usage?: { promptTokens: number; completionTokens: number; totalTokens: number }; toolCalls?: any[] }> {
    return {
      id: 'mock-response-tools',
      content: 'Mock response with tools',
      model: 'mock-model',
      finishReason: 'stop',
    };
  }
}

function createTestConfig(overrides: Partial<GatewayConfig> = {}): GatewayConfig {
  return {
    host: '127.0.0.1',
    port: 3000,
    ...overrides,
  };
}

function createMockChannelMessage(sessionId: string, userId: string, content: string): ChannelMessage {
  return {
    id: `msg-${Date.now()}`,
    content,
    author: {
      id: userId,
      name: `User ${userId}`,
      username: `user_${userId}`,
    },
    channel: 'test-channel',
    timestamp: new Date(),
  };
}

function createChannelMessage(sessionId: string, userId: string, content: string): Message {
  return {
    id: `msg-${Date.now()}`,
    sessionId,
    channel: 'test-channel',
    userId,
    content,
    role: 'user',
    timestamp: new Date(),
  };
}

describe('Gateway', () => {
  let gateway: Gateway;
  let config: GatewayConfig;

  beforeEach(() => {
    config = createTestConfig();
    gateway = new Gateway(config);
  });

  afterEach(async () => {
    if (gateway.isHealthy()) {
      try {
        await gateway.stop();
      } catch (e) {
      }
    }
  });

  describe('Constructor', () => {
    it('should create a Gateway instance with valid config', () => {
      expect(gateway).toBeInstanceOf(Gateway);
    });

    it('should store the config correctly', () => {
      const testConfig = createTestConfig({
        host: '0.0.0.0',
        port: 8080,
        ssl: { key: 'key', cert: 'cert' },
        rateLimit: { windowMs: 60000, maxRequests: 100 },
      });
      const testGateway = new Gateway(testConfig);
      expect(testGateway).toBeInstanceOf(Gateway);
    });

    it('should initialize with empty sessions map', () => {
      expect(gateway.getChannels().size).toBe(0);
    });

    it('should initialize with empty channels map', () => {
      expect(gateway.getChannels().size).toBe(0);
    });

    it('should initialize with empty providers map', () => {
      expect(gateway.getProviders().size).toBe(0);
    });

    it('should not be running initially', () => {
      expect(gateway.isHealthy()).toBe(false);
    });

    it('should accept minimal config with just host and port', () => {
      const minimalConfig: GatewayConfig = {
        host: 'localhost',
        port: 8080,
      };
      const minimalGateway = new Gateway(minimalConfig);
      expect(minimalGateway).toBeInstanceOf(Gateway);
    });

    it('should accept config with optional ssl settings', () => {
      const sslConfig: GatewayConfig = {
        host: 'localhost',
        port: 443,
        ssl: {
          key: '/path/to/key',
          cert: '/path/to/cert',
        },
      };
      const sslGateway = new Gateway(sslConfig);
      expect(sslGateway).toBeInstanceOf(Gateway);
    });

    it('should accept config with optional rate limit settings', () => {
      const rateLimitConfig: GatewayConfig = {
        host: 'localhost',
        port: 3000,
        rateLimit: {
          windowMs: 60000,
          maxRequests: 1000,
        },
      };
      const rateLimitGateway = new Gateway(rateLimitConfig);
      expect(rateLimitGateway).toBeInstanceOf(Gateway);
    });

    it('should accept config with all options', () => {
      const fullConfig: GatewayConfig = {
        host: '0.0.0.0',
        port: 8443,
        ssl: { key: 'key', cert: 'cert' },
        rateLimit: { windowMs: 300000, maxRequests: 5000 },
      };
      const fullGateway = new Gateway(fullConfig);
      expect(fullGateway).toBeInstanceOf(Gateway);
    });

    it('should inherit from EventEmitter', () => {
      expect(gateway).toBeInstanceOf(EventEmitter);
    });

    it('should have empty sessions by default', () => {
      const session = gateway.getSession('non-existent');
      expect(session).toBeUndefined();
    });
  });

  describe('start()', () => {
    it('should start the gateway successfully', async () => {
      await gateway.start();
      expect(gateway.isHealthy()).toBe(true);
    });

    it('should emit started event when started', async () => {
      const startedCallback = vi.fn();
      gateway.on('started', startedCallback);
      
      await gateway.start();
      
      expect(startedCallback).toHaveBeenCalledTimes(1);
    });

    it('should throw error when starting already running gateway', async () => {
      await gateway.start();
      
      await expect(gateway.start()).rejects.toThrow('Gateway is already running');
    });

    it('should set isRunning to true after start', async () => {
      await gateway.start();
      expect(gateway.isHealthy()).toBe(true);
    });

    it('should be able to start after stopping', async () => {
      await gateway.start();
      await gateway.stop();
      await gateway.start();
      expect(gateway.isHealthy()).toBe(true);
    });

    it('should emit started event only once when started multiple times with catch', async () => {
      const startedCallback = vi.fn();
      gateway.on('started', startedCallback);
      
      await gateway.start();
      await gateway.start().catch(() => {});
      
      expect(startedCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop()', () => {
    it('should stop the gateway successfully', async () => {
      await gateway.start();
      await gateway.stop();
      expect(gateway.isHealthy()).toBe(false);
    });

    it('should emit stopped event when stopped', async () => {
      await gateway.start();
      
      const stoppedCallback = vi.fn();
      gateway.on('stopped', stoppedCallback);
      
      await gateway.stop();
      
      expect(stoppedCallback).toHaveBeenCalledTimes(1);
    });

    it('should throw error when stopping gateway that is not running', async () => {
      await expect(gateway.stop()).rejects.toThrow('Gateway is not running');
    });

    it('should clear sessions when stopped', async () => {
      await gateway.start();
      
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      expect(gateway.getSession(session.id)).toBeDefined();
      
      await gateway.stop();
      
      expect(gateway.getSession(session.id)).toBeUndefined();
    });

    it('should disconnect all channels when stopped', async () => {
      await gateway.start();
      
      const channel = new MockChannel({ id: 'test-channel', connected: true });
      gateway.registerChannel('test-channel', channel);
      
      await gateway.stop();
      
      expect(channel.connected).toBe(false);
    });

    it('should be able to stop and start again', async () => {
      await gateway.start();
      await gateway.stop();
      
      await gateway.start();
      expect(gateway.isHealthy()).toBe(true);
    });

    it('should handle stop when no channels are registered', async () => {
      await gateway.start();
      await gateway.stop();
      expect(gateway.isHealthy()).toBe(false);
    });

    it('should throw error when stopping without starting', async () => {
      await expect(gateway.stop()).rejects.toThrow('Gateway is not running');
    });
  });

  describe('registerChannel()', () => {
    it('should register a channel successfully', () => {
      const channel = new MockChannel({ id: 'test-channel' });
      gateway.registerChannel('test-channel', channel);
      
      const channels = gateway.getChannels();
      expect(channels.size).toBe(1);
      expect(channels.get('test-channel')).toBe(channel);
    });

    it('should register multiple channels', () => {
      const channel1 = new MockChannel({ id: 'channel1' });
      const channel2 = new MockChannel({ id: 'channel2' });
      
      gateway.registerChannel('channel1', channel1);
      gateway.registerChannel('channel2', channel2);
      
      expect(gateway.getChannels().size).toBe(2);
    });

    it('should overwrite existing channel when registering with same id', () => {
      const channel1 = new MockChannel({ id: 'channel1', name: 'Channel 1' });
      const channel2 = new MockChannel({ id: 'channel1', name: 'Channel 2' });
      
      gateway.registerChannel('channel1', channel1);
      gateway.registerChannel('channel1', channel2);
      
      expect(gateway.getChannels().size).toBe(1);
      expect(gateway.getChannels().get('channel1')).toBe(channel2);
    });

    it('should set up message listener on registered channel', () => {
      const channel = new MockChannel({ id: 'test-channel' });
      gateway.registerChannel('test-channel', channel);
      
      const messageCallback = vi.fn();
      gateway.on('message', messageCallback);
      
      const mockMessage = createChannelMessage('session1', 'user1', 'Hello');
      channel.emitMessage({
        id: 'msg-1',
        content: 'Hello',
        author: { id: 'user1', name: 'User 1' },
        channel: 'test-channel',
        timestamp: new Date(),
      });
    });

    it('should allow registering channel before starting gateway', () => {
      const channel = new MockChannel({ id: 'test-channel' });
      gateway.registerChannel('test-channel', channel);
      
      expect(gateway.getChannels().size).toBe(1);
    });

    it('should allow registering channel after starting gateway', async () => {
      await gateway.start();
      
      const channel = new MockChannel({ id: 'test-channel' });
      gateway.registerChannel('test-channel', channel);
      
      expect(gateway.getChannels().size).toBe(1);
    });

    it('should register channel with different types', () => {
      const slackChannel = new MockChannel({ id: 'slack', type: 'slack' });
      const telegramChannel = new MockChannel({ id: 'telegram', type: 'telegram' });
      const matrixChannel = new MockChannel({ id: 'matrix', type: 'matrix' });
      
      gateway.registerChannel('slack', slackChannel);
      gateway.registerChannel('telegram', telegramChannel);
      gateway.registerChannel('matrix', matrixChannel);
      
      expect(gateway.getChannels().size).toBe(3);
    });
  });

  describe('registerProvider()', () => {
    it('should register a provider successfully', () => {
      const provider = new MockProvider({ id: 'test-provider' });
      gateway.registerProvider('test-provider', provider);
      
      const providers = gateway.getProviders();
      expect(providers.size).toBe(1);
      expect(providers.get('test-provider')).toBe(provider);
    });

    it('should register multiple providers', () => {
      const provider1 = new MockProvider({ id: 'provider1' });
      const provider2 = new MockProvider({ id: 'provider2' });
      
      gateway.registerProvider('provider1', provider1);
      gateway.registerProvider('provider2', provider2);
      
      expect(gateway.getProviders().size).toBe(2);
    });

    it('should overwrite existing provider when registering with same id', () => {
      const provider1 = new MockProvider({ id: 'provider1', name: 'Provider 1' });
      const provider2 = new MockProvider({ id: 'provider1', name: 'Provider 2' });
      
      gateway.registerProvider('provider1', provider1);
      gateway.registerProvider('provider1', provider2);
      
      expect(gateway.getProviders().size).toBe(1);
      expect(gateway.getProviders().get('provider1')).toBe(provider2);
    });

    it('should allow registering provider before starting gateway', () => {
      const provider = new MockProvider({ id: 'test-provider' });
      gateway.registerProvider('test-provider', provider);
      
      expect(gateway.getProviders().size).toBe(1);
    });

    it('should allow registering provider after starting gateway', async () => {
      await gateway.start();
      
      const provider = new MockProvider({ id: 'test-provider' });
      gateway.registerProvider('test-provider', provider);
      
      expect(gateway.getProviders().size).toBe(1);
    });

    it('should register providers with different types', () => {
      const openaiProvider = new MockProvider({ id: 'openai', type: 'openai' });
      const anthropicProvider = new MockProvider({ id: 'anthropic', type: 'anthropic' });
      const ollamaProvider = new MockProvider({ id: 'ollama', type: 'ollama' });
      
      gateway.registerProvider('openai', openaiProvider);
      gateway.registerProvider('anthropic', anthropicProvider);
      gateway.registerProvider('ollama', ollamaProvider);
      
      expect(gateway.getProviders().size).toBe(3);
    });
  });

  describe('createSession()', () => {
    it('should create a session successfully', () => {
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.channel).toBe('channel1');
      expect(session.userId).toBe('user1');
      expect(session.provider).toBe('provider1');
      expect(session.createdAt).toBeInstanceOf(Date);
      expect(session.metadata).toEqual({});
    });

    it('should store session in memory', () => {
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      
      const retrieved = gateway.getSession(session.id);
      expect(retrieved).toBe(session);
    });

    it('should create sessions with unique ids', () => {
      const session1 = gateway.createSession('channel1', 'user1', 'provider1');
      const session2 = gateway.createSession('channel1', 'user1', 'provider1');
      
      expect(session1.id).not.toBe(session2.id);
    });

    it('should create session with provided channel', () => {
      const session = gateway.createSession('my-channel', 'user123', 'openai');
      
      expect(session.channel).toBe('my-channel');
    });

    it('should create session with provided userId', () => {
      const session = gateway.createSession('channel1', 'user-456', 'provider1');
      
      expect(session.userId).toBe('user-456');
    });

    it('should create session with provided provider', () => {
      const session = gateway.createSession('channel1', 'user1', 'anthropic');
      
      expect(session.provider).toBe('anthropic');
    });

    it('should create multiple sessions', () => {
      const session1 = gateway.createSession('channel1', 'user1', 'provider1');
      const session2 = gateway.createSession('channel2', 'user2', 'provider2');
      
      expect(gateway.getSession(session1.id)).toBeDefined();
      expect(gateway.getSession(session2.id)).toBeDefined();
    });

    it('should create session before starting gateway', () => {
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      
      expect(session).toBeDefined();
    });

    it('should create session after starting gateway', async () => {
      await gateway.start();
      
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      
      expect(session).toBeDefined();
    });

    it('should create session with metadata', () => {
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      
      expect(session.metadata).toBeDefined();
      expect(typeof session.metadata).toBe('object');
    });

    it('should create session with timestamp', () => {
      const before = new Date();
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      const after = new Date();
      
      expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(session.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });

  describe('getSession()', () => {
    it('should return existing session', () => {
      const created = gateway.createSession('channel1', 'user1', 'provider1');
      
      const retrieved = gateway.getSession(created.id);
      expect(retrieved).toBe(created);
    });

    it('should return undefined for non-existent session', () => {
      const retrieved = gateway.getSession('non-existent-id');
      expect(retrieved).toBeUndefined();
    });

    it('should return undefined for empty string id', () => {
      const retrieved = gateway.getSession('');
      expect(retrieved).toBeUndefined();
    });

    it('should return session after gateway is started', async () => {
      await gateway.start();
      
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      const retrieved = gateway.getSession(session.id);
      
      expect(retrieved).toBe(session);
    });

    it('should clear sessions on stop', async () => {
      await gateway.start();
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      const sessionId = session.id;
      
      await gateway.stop();
      
      expect(gateway.getSession(sessionId)).toBeUndefined();
    });

    it('should return session added via channel message', () => {
      const channel = new MockChannel({ id: 'channel1' });
      gateway.registerChannel('channel1', channel);
      
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      
      const retrieved = gateway.getSession(session.id);
      expect(retrieved).toBeDefined();
    });
  });

  describe('deleteSession()', () => {
    it('should delete existing session', () => {
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      
      const deleted = gateway.deleteSession(session.id);
      
      expect(deleted).toBe(true);
      expect(gateway.getSession(session.id)).toBeUndefined();
    });

    it('should return false for non-existent session', () => {
      const deleted = gateway.deleteSession('non-existent-id');
      
      expect(deleted).toBe(false);
    });

    it('should return false for empty string id', () => {
      const deleted = gateway.deleteSession('');
      
      expect(deleted).toBe(false);
    });

    it('should be able to delete all sessions', () => {
      gateway.createSession('channel1', 'user1', 'provider1');
      gateway.createSession('channel1', 'user2', 'provider1');
      gateway.createSession('channel1', 'user3', 'provider1');
      
      gateway.deleteSession(gateway.getSession('session_1')?.id ?? '');
      gateway.deleteSession(gateway.getSession('session_2')?.id ?? '');
      gateway.deleteSession(gateway.getSession('session_3')?.id ?? '');
      
      expect(gateway.getChannels().size).toBe(0);
    });

    it('should return true when deleting session created after start', async () => {
      await gateway.start();
      
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      const deleted = gateway.deleteSession(session.id);
      
      expect(deleted).toBe(true);
    });

    it('should delete session even when gateway is running', async () => {
      await gateway.start();
      
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      gateway.deleteSession(session.id);
      
      expect(gateway.getSession(session.id)).toBeUndefined();
    });
  });

  describe('handleMessage()', () => {
    it('should emit message event for valid session', async () => {
      await gateway.start();
      
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      const messageCallback = vi.fn();
      gateway.on('message', messageCallback);
      
      const channel = new MockChannel({ id: 'channel1' });
      gateway.registerChannel('channel1', channel);
      
      channel.emitMessage({
        id: 'msg-1',
        content: 'Hello',
        author: { id: 'user1', name: 'User 1' },
        channel: 'channel1',
        timestamp: new Date(),
      });
    });

    it('should not emit message event for unknown session', async () => {
      await gateway.start();
      
      const messageCallback = vi.fn();
      gateway.on('message', messageCallback);
      
      const channel = new MockChannel({ id: 'channel1' });
      gateway.registerChannel('channel1', channel);
      
      channel.emitMessage({
        id: 'msg-1',
        content: 'Hello',
        author: { id: 'unknown-user', name: 'Unknown' },
        channel: 'channel1',
        timestamp: new Date(),
      });
    });

    it('should route message to correct session', async () => {
      await gateway.start();
      
      const session1 = gateway.createSession('channel1', 'user1', 'provider1');
      const session2 = gateway.createSession('channel2', 'user2', 'provider2');
      
      const messageCallback = vi.fn();
      gateway.on('message', messageCallback);
      
      const channel1 = new MockChannel({ id: 'channel1' });
      const channel2 = new MockChannel({ id: 'channel2' });
      
      gateway.registerChannel('channel1', channel1);
      gateway.registerChannel('channel2', channel2);
      
      channel1.emitMessage({
        id: 'msg-1',
        content: 'Message for session 1',
        author: { id: 'user1', name: 'User 1' },
        channel: 'channel1',
        timestamp: new Date(),
      });
    });
  });

  describe('getChannels()', () => {
    it('should return empty map when no channels registered', () => {
      const channels = gateway.getChannels();
      
      expect(channels).toBeInstanceOf(Map);
      expect(channels.size).toBe(0);
    });

    it('should return map with registered channels', () => {
      const channel1 = new MockChannel({ id: 'channel1' });
      const channel2 = new MockChannel({ id: 'channel2' });
      
      gateway.registerChannel('channel1', channel1);
      gateway.registerChannel('channel2', channel2);
      
      const channels = gateway.getChannels();
      
      expect(channels.size).toBe(2);
      expect(channels.get('channel1')).toBe(channel1);
      expect(channels.get('channel2')).toBe(channel2);
    });

    it('should return same map instance', () => {
      const channels1 = gateway.getChannels();
      const channels2 = gateway.getChannels();
      
      expect(channels1).toBe(channels2);
    });

    it('should reflect channel registration changes', () => {
      const channel = new MockChannel({ id: 'channel1' });
      
      let channels = gateway.getChannels();
      expect(channels.size).toBe(0);
      
      gateway.registerChannel('channel1', channel);
      
      channels = gateway.getChannels();
      expect(channels.size).toBe(1);
    });
  });

  describe('getProviders()', () => {
    it('should return empty map when no providers registered', () => {
      const providers = gateway.getProviders();
      
      expect(providers).toBeInstanceOf(Map);
      expect(providers.size).toBe(0);
    });

    it('should return map with registered providers', () => {
      const provider1 = new MockProvider({ id: 'provider1' });
      const provider2 = new MockProvider({ id: 'provider2' });
      
      gateway.registerProvider('provider1', provider1);
      gateway.registerProvider('provider2', provider2);
      
      const providers = gateway.getProviders();
      
      expect(providers.size).toBe(2);
      expect(providers.get('provider1')).toBe(provider1);
      expect(providers.get('provider2')).toBe(provider2);
    });

    it('should return same map instance', () => {
      const providers1 = gateway.getProviders();
      const providers2 = gateway.getProviders();
      
      expect(providers1).toBe(providers2);
    });

    it('should reflect provider registration changes', () => {
      const provider = new MockProvider({ id: 'provider1' });
      
      let providers = gateway.getProviders();
      expect(providers.size).toBe(0);
      
      gateway.registerProvider('provider1', provider);
      
      providers = gateway.getProviders();
      expect(providers.size).toBe(1);
    });
  });

  describe('isHealthy()', () => {
    it('should return false when gateway is not started', () => {
      const healthy = gateway.isHealthy();
      
      expect(healthy).toBe(false);
    });

    it('should return true when gateway is started', async () => {
      await gateway.start();
      
      const healthy = gateway.isHealthy();
      
      expect(healthy).toBe(true);
    });

    it('should return false when gateway is stopped', async () => {
      await gateway.start();
      await gateway.stop();
      
      const healthy = gateway.isHealthy();
      
      expect(healthy).toBe(false);
    });

    it('should return correct status after multiple start/stop cycles', async () => {
      await gateway.start();
      expect(gateway.isHealthy()).toBe(true);
      
      await gateway.stop();
      expect(gateway.isHealthy()).toBe(false);
      
      await gateway.start();
      expect(gateway.isHealthy()).toBe(true);
      
      await gateway.stop();
      expect(gateway.isHealthy()).toBe(false);
    });
  });

  describe('Event Emitters', () => {
    describe('started event', () => {
      it('should emit started event once when start is called', async () => {
        const callback = vi.fn();
        gateway.on('started', callback);
        
        await gateway.start();
        
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('should not emit started event when gateway is already running', async () => {
        const callback = vi.fn();
        gateway.on('started', callback);
        
        await gateway.start();
        await gateway.start().catch(() => {});
        
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('should emit started event with no arguments', async () => {
        const callback = vi.fn();
        gateway.on('started', callback);
        
        await gateway.start();
        
        expect(callback).toHaveBeenCalledWith();
      });

      it('should be able to listen to started event multiple times', async () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();
        
        gateway.on('started', callback1);
        gateway.on('started', callback2);
        
        await gateway.start();
        
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledTimes(1);
      });
    });

    describe('stopped event', () => {
      it('should emit stopped event once when stop is called', async () => {
        await gateway.start();
        
        const callback = vi.fn();
        gateway.on('stopped', callback);
        
        await gateway.stop();
        
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('should emit stopped event after all sessions are cleared', async () => {
        await gateway.start();
        
        gateway.createSession('channel1', 'user1', 'provider1');
        gateway.createSession('channel2', 'user2', 'provider2');
        
        const callback = vi.fn();
        gateway.on('stopped', callback);
        
        await gateway.stop();
        
        expect(callback).toHaveBeenCalledTimes(1);
      });

      it('should emit stopped event with no arguments', async () => {
        await gateway.start();
        
        const callback = vi.fn();
        gateway.on('stopped', callback);
        
        await gateway.stop();
        
        expect(callback).toHaveBeenCalledWith();
      });

      it('should not emit stopped event when gateway is not running', async () => {
        const callback = vi.fn();
        gateway.on('stopped', callback);
        
        await gateway.stop().catch(() => {});
        
        expect(callback).not.toHaveBeenCalled();
      });
    });

    describe('message event', () => {
      it('should emit message event with message and session', async () => {
        await gateway.start();
        
        const session = gateway.createSession('channel1', 'user1', 'provider1');
        
        const messageCallback = vi.fn();
        gateway.on('message', messageCallback);
        
        const channel = new MockChannel({ id: 'channel1' });
        gateway.registerChannel('channel1', channel);
        
        channel.emitMessage({
          id: 'msg-1',
          content: 'Test message',
          author: { id: 'user1', name: 'User 1' },
          channel: 'channel1',
          timestamp: new Date(),
        });
      });

      it('should emit multiple message events', async () => {
        await gateway.start();
        
        const session = gateway.createSession('channel1', 'user1', 'provider1');
        
        const messageCallback = vi.fn();
        gateway.on('message', messageCallback);
        
        const channel = new MockChannel({ id: 'channel1' });
        gateway.registerChannel('channel1', channel);
        
        channel.emitMessage({
          id: 'msg-1',
          content: 'Message 1',
          author: { id: 'user1', name: 'User 1' },
          channel: 'channel1',
          timestamp: new Date(),
        });
        
        channel.emitMessage({
          id: 'msg-2',
          content: 'Message 2',
          author: { id: 'user1', name: 'User 1' },
          channel: 'channel1',
          timestamp: new Date(),
        });
      });
    });
  });

  describe('Channel/Provider Integration', () => {
    it('should integrate multiple channels and providers', async () => {
      await gateway.start();
      
      const slackChannel = new MockChannel({ id: 'slack', type: 'slack' });
      const telegramChannel = new MockChannel({ id: 'telegram', type: 'telegram' });
      const matrixChannel = new MockChannel({ id: 'matrix', type: 'matrix' });
      
      const openaiProvider = new MockProvider({ id: 'openai', type: 'openai' });
      const anthropicProvider = new MockProvider({ id: 'anthropic', type: 'anthropic' });
      const ollamaProvider = new MockProvider({ id: 'ollama', type: 'ollama' });
      
      gateway.registerChannel('slack', slackChannel);
      gateway.registerChannel('telegram', telegramChannel);
      gateway.registerChannel('matrix', matrixChannel);
      
      gateway.registerProvider('openai', openaiProvider);
      gateway.registerProvider('anthropic', anthropicProvider);
      gateway.registerProvider('ollama', ollamaProvider);
      
      expect(gateway.getChannels().size).toBe(3);
      expect(gateway.getProviders().size).toBe(3);
    });

    it('should create sessions for different channel/provider combinations', async () => {
      await gateway.start();
      
      const channel1 = new MockChannel({ id: 'channel1' });
      const channel2 = new MockChannel({ id: 'channel2' });
      
      const provider1 = new MockProvider({ id: 'provider1' });
      const provider2 = new MockProvider({ id: 'provider2' });
      
      gateway.registerChannel('channel1', channel1);
      gateway.registerChannel('channel2', channel2);
      gateway.registerProvider('provider1', provider1);
      gateway.registerProvider('provider2', provider2);
      
      const session1 = gateway.createSession('channel1', 'user1', 'provider1');
      const session2 = gateway.createSession('channel2', 'user2', 'provider2');
      
      expect(session1.channel).toBe('channel1');
      expect(session1.provider).toBe('provider1');
      expect(session2.channel).toBe('channel2');
      expect(session2.provider).toBe('provider2');
    });

    it('should maintain channel connections through start/stop cycle', async () => {
      const channel1 = new MockChannel({ id: 'channel1', connected: false });
      const channel2 = new MockChannel({ id: 'channel2', connected: false });
      
      gateway.registerChannel('channel1', channel1);
      gateway.registerChannel('channel2', channel2);
      
      await gateway.start();
      expect(channel1.connected).toBe(false);
      expect(channel2.connected).toBe(false);
      
      await gateway.stop();
      expect(channel1.connected).toBe(false);
      expect(channel2.connected).toBe(false);
    });
  });

  describe('Error Handling During Start/Stop', () => {
    it('should handle start error gracefully', async () => {
      const errorGateway = new Gateway({ host: 'invalid-host', port: 99999 });
      
      try {
        await errorGateway.start();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle multiple stop calls', async () => {
      await gateway.start();
      
      await gateway.stop();
      await gateway.stop().catch((err) => {
        expect(err).toBeDefined();
      });
    });

    it('should handle start when already started', async () => {
      await gateway.start();
      
      await expect(gateway.start()).rejects.toThrow('Gateway is already running');
    });

    it('should handle stop when not started', async () => {
      await expect(gateway.stop()).rejects.toThrow('Gateway is not running');
    });

    it('should handle channel disconnect errors during stop', async () => {
      const channel = new MockChannel({ 
        id: 'channel1', 
        disconnectError: new Error('Disconnect failed') 
      });
      
      await gateway.start();
      gateway.registerChannel('channel1', channel);
      
      await expect(gateway.stop()).rejects.toThrow('Disconnect failed');
    });
  });

  describe('Session Lifecycle', () => {
    it('should create session with proper lifecycle', () => {
      const beforeCreate = new Date();
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      const afterCreate = new Date();
      
      expect(session.createdAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime());
      expect(session.createdAt.getTime()).toBeLessThanOrEqual(afterCreate.getTime());
      expect(session.id).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should maintain session across multiple operations', async () => {
      await gateway.start();
      
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      const retrieved1 = gateway.getSession(session.id);
      expect(retrieved1).toBe(session);
      
      const retrieved2 = gateway.getSession(session.id);
      expect(retrieved2).toBe(session);
    });

    it('should clear all sessions on stop', async () => {
      await gateway.start();
      
      const session1 = gateway.createSession('channel1', 'user1', 'provider1');
      const session2 = gateway.createSession('channel2', 'user2', 'provider2');
      const session3 = gateway.createSession('channel3', 'user3', 'provider3');
      
      await gateway.stop();
      
      expect(gateway.getSession(session1.id)).toBeUndefined();
      expect(gateway.getSession(session2.id)).toBeUndefined();
      expect(gateway.getSession(session3.id)).toBeUndefined();
    });

    it('should allow creating new sessions after deleting old ones', () => {
      const session1 = gateway.createSession('channel1', 'user1', 'provider1');
      const sessionId1 = session1.id;
      
      gateway.deleteSession(sessionId1);
      
      const session2 = gateway.createSession('channel1', 'user1', 'provider1');
      expect(session2.id).not.toBe(sessionId1);
    });

    it('should preserve session until explicitly deleted (before stop)', async () => {
      await gateway.start();
      
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      
      expect(gateway.getSession(session.id)).toBe(session);
      
      gateway.deleteSession(session.id);
      expect(gateway.getSession(session.id)).toBeUndefined();
    });

    it('should allow session creation after stop', async () => {
      await gateway.start();
      await gateway.stop();
      
      const session = gateway.createSession('channel1', 'user1', 'provider1');
      expect(session).toBeDefined();
      expect(gateway.getSession(session.id)).toBe(session);
    });

    it('should handle session deletion during gateway operation', async () => {
      await gateway.start();
      
      const session1 = gateway.createSession('channel1', 'user1', 'provider1');
      const session2 = gateway.createSession('channel1', 'user2', 'provider1');
      
      gateway.deleteSession(session1.id);
      
      expect(gateway.getSession(session1.id)).toBeUndefined();
      expect(gateway.getSession(session2.id)).toBe(session2);
    });

    it('should allow multiple sessions for same user on different channels', () => {
      const session1 = gateway.createSession('channel1', 'user1', 'provider1');
      const session2 = gateway.createSession('channel2', 'user1', 'provider1');
      
      expect(session1.id).not.toBe(session2.id);
      expect(session1.userId).toBe(session2.userId);
      expect(session1.channel).not.toBe(session2.channel);
    });

    it('should allow multiple sessions for same channel with different users', () => {
      const session1 = gateway.createSession('channel1', 'user1', 'provider1');
      const session2 = gateway.createSession('channel1', 'user2', 'provider1');
      
      expect(session1.id).not.toBe(session2.id);
      expect(session1.userId).not.toBe(session2.userId);
      expect(session1.channel).toBe(session2.channel);
    });

    it('should handle many sessions efficiently', () => {
      const sessionIds: string[] = [];
      
      for (let i = 0; i < 100; i++) {
        const session = gateway.createSession(`channel${i % 3}`, `user${i}`, `provider${i % 2}`);
        sessionIds.push(session.id);
      }
      
      sessionIds.forEach(id => {
        expect(gateway.getSession(id)).toBeDefined();
      });
    });
  });
});