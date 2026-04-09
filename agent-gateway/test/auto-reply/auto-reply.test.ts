import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AutoReply, createAutoReply } from '../../src/auto-reply/index.js';
import type { Channel, ChannelMessage, ChannelUser } from '../../src/channels/index.js';
import type { Provider, ChatMessage, ModelResponse } from '../../src/providers/index.js';
import type { Session, SessionManager } from '../../src/sessions/index.js';
import type { Hooks, HookContext } from '../../src/hooks/index.js';

describe('AutoReply', () => {
  let mockProvider: Provider;
  let mockChannel: Channel;
  let mockSessionManager: SessionManager;
  let mockHooks: Hooks;
  let mockSession: Session;
  let defaultConfig: any;

  const createMockChannelUser = (id: string, name: string = 'Test User'): ChannelUser => ({
    id,
    name,
    username: name.toLowerCase().replace(' ', '_'),
  });

  const createMockChannelMessage = (
    id: string,
    content: string,
    authorId: string,
    channelId: string = 'test-channel'
  ): ChannelMessage => ({
    id,
    content,
    author: createMockChannelUser(authorId),
    channel: channelId,
    timestamp: new Date(),
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

    mockProvider = {
      id: 'mock-provider',
      type: 'openai',
      name: 'Mock Provider',
      config: { apiKey: 'test-key' },
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      chat: vi.fn().mockResolvedValue({
        id: 'response-1',
        content: 'Mock response content',
        model: 'gpt-4',
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 5, totalTokens: 15 },
      }),
      chatWithTools: vi.fn(),
    };

    mockChannel = {
      id: 'test-channel',
      type: 'telegram',
      name: 'Test Channel',
      connected: true,
      config: { enabled: true },
      connect: vi.fn().mockResolvedValue(undefined),
      disconnect: vi.fn().mockResolvedValue(undefined),
      sendMessage: vi.fn().mockResolvedValue(undefined),
      getUser: vi.fn().mockResolvedValue(createMockChannelUser('user-1')),
      getMe: vi.fn().mockResolvedValue({ id: 'bot-1', name: 'Test Bot', username: 'testbot' }),
    };

    mockSession = {
      id: 'session-1',
      channel: 'test-channel',
      userId: 'user-1',
      provider: 'openai',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {},
      context: {},
      addMessage: vi.fn().mockResolvedValue(undefined),
      getMessages: vi.fn().mockReturnValue([]),
      getHistory: vi.fn().mockReturnValue([]),
      clearMessages: vi.fn(),
      setContext: vi.fn(),
      getContext: vi.fn(),
      clearContext: vi.fn(),
      getMetadata: vi.fn(),
      setMetadata: vi.fn(),
      persist: vi.fn().mockResolvedValue(undefined),
      loadFromPersistence: vi.fn().mockResolvedValue(false),
      toJSON: vi.fn().mockReturnValue({
        id: 'session-1',
        channel: 'test-channel',
        userId: 'user-1',
        provider: 'openai',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {},
        messages: [],
        context: {},
      }),
    } as unknown as Session;

    mockSessionManager = {
      create: vi.fn().mockResolvedValue(mockSession),
      get: vi.fn().mockReturnValue(mockSession),
      getOrCreate: vi.fn().mockResolvedValue(mockSession),
      delete: vi.fn().mockReturnValue(true),
      list: vi.fn().mockReturnValue([]),
      listFromPersistence: vi.fn().mockResolvedValue([]),
      clear: vi.fn(),
      count: 0,
    } as unknown as SessionManager;

    mockHooks = {
      execute: vi.fn().mockResolvedValue(undefined),
      register: vi.fn(),
      unregister: vi.fn(),
      enable: vi.fn(),
      disable: vi.fn(),
      isEnabled: vi.fn().mockReturnValue(true),
      getHooks: vi.fn().mockReturnValue([]),
      clear: vi.fn(),
    } as unknown as Hooks;

    defaultConfig = {
      enabled: true,
      provider: 'openai',
      systemPrompt: 'You are a helpful assistant.',
      maxTokens: 1000,
      temperature: 0.7,
      matchPatterns: undefined,
      excludePatterns: undefined,
      cooldown: 0,
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create AutoReply instance with config only', () => {
      const autoReply = new AutoReply(defaultConfig);
      expect(autoReply).toBeDefined();
      expect(autoReply.isEnabled()).toBe(true);
    });

    it('should create AutoReply instance with provider', () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      expect(autoReply).toBeDefined();
    });

    it('should create AutoReply instance with all dependencies', () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager, mockHooks);
      expect(autoReply).toBeDefined();
    });

    it('should initialize with disabled state when config.enabled is false', () => {
      const config = { ...defaultConfig, enabled: false };
      const autoReply = new AutoReply(config);
      expect(autoReply.isEnabled()).toBe(false);
    });

    it('should initialize with empty config and defaults', () => {
      const config = { enabled: true, provider: 'test' };
      const autoReply = new AutoReply(config);
      expect(autoReply.isEnabled()).toBe(true);
    });

    it('should accept all config options', () => {
      const config = {
        enabled: true,
        provider: 'anthropic',
        systemPrompt: 'Custom prompt',
        maxTokens: 2000,
        temperature: 0.5,
        matchPatterns: [/hello/i, /help/],
        excludePatterns: [/ignore/i],
        cooldown: 5000,
      };
      const autoReply = new AutoReply(config);
      expect(autoReply.isEnabled()).toBe(true);
    });

    it('should create instance using factory function', () => {
      const autoReply = createAutoReply(defaultConfig, mockProvider);
      expect(autoReply).toBeDefined();
      expect(autoReply.isEnabled()).toBe(true);
    });

    it('should create instance with no initial config', () => {
      const config = { enabled: true, provider: 'openai' };
      const autoReply = new AutoReply(config);
      expect(autoReply).toBeDefined();
    });
  });

  describe('handleMessage', () => {
    it('should not respond when disabled', async () => {
      const config = { ...defaultConfig, enabled: false };
      const autoReply = new AutoReply(config, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).not.toHaveBeenCalled();
      expect(mockChannel.sendMessage).not.toHaveBeenCalled();
    });

    it('should not respond when no provider configured', async () => {
      const autoReply = new AutoReply(defaultConfig);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockChannel.sendMessage).not.toHaveBeenCalled();
    });

    it('should process message and send response', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
      expect(mockChannel.sendMessage).toHaveBeenCalledWith('user-1', 'Mock response content');
    });

    it('should call beforeMessage hook before processing', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager, mockHooks);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockHooks.execute).toHaveBeenCalledWith('beforeMessage', expect.objectContaining({
        channel: message.channel,
        userId: message.author.id,
        message: message,
        metadata: {},
      }));
    });

    it('should call afterResponse hook after generating response', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager, mockHooks);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockHooks.execute).toHaveBeenCalledWith('afterResponse', expect.objectContaining({
        channel: message.channel,
        userId: message.author.id,
        message: message,
        response: 'Mock response content',
        metadata: {},
      }));
    });

    it('should create session when session manager is available', async () => {
      (mockSessionManager.get as any).mockReturnValueOnce(undefined);
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockSessionManager.create).toHaveBeenCalledWith({
        channel: message.channel,
        userId: message.author.id,
        provider: defaultConfig.provider,
      });
    });

    it('should use existing session when available', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockSessionManager.get).toHaveBeenCalled();
    });

    it('should add user message to session', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager);
      const message = createMockChannelMessage('msg-1', 'Hello there', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockSession.addMessage).toHaveBeenCalledWith('user', 'Hello there');
    });

    it('should add assistant response to session', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockSession.addMessage).toHaveBeenCalledWith('assistant', 'Mock response content');
    });

    it('should use default system prompt when not configured', async () => {
      const config = { enabled: true, provider: 'openai' };
      const autoReply = new AutoReply(config, mockProvider, mockSessionManager);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system', content: expect.any(String) }),
        ])
      );
    });

    it('should use custom system prompt when configured', async () => {
      const customPrompt = 'You are a custom assistant.';
      const config = { ...defaultConfig, systemPrompt: customPrompt };
      const autoReply = new AutoReply(config, mockProvider, mockSessionManager);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ role: 'system', content: customPrompt }),
        ])
      );
    });

    it('should handle message without session manager', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should handle multiple messages in sequence', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);

      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-1', 'Hello', 'user-1'));
      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-2', 'How are you?', 'user-1'));

      expect(mockProvider.chat).toHaveBeenCalledTimes(2);
    });

    it('should handle message with empty content', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', '', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should handle message with unicode content', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', '你好世界 🌍', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should handle message with very long content', async () => {
      const longContent = 'A'.repeat(10000);
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', longContent, 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should handle provider returning empty content', async () => {
      (mockProvider.chat as any).mockResolvedValueOnce({
        id: 'response-1',
        content: '',
        model: 'gpt-4',
        finishReason: 'stop',
      });
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockChannel.sendMessage).toHaveBeenCalledWith('user-1', '');
    });

    it('should handle message with different channel IDs', async () => {
      (mockSessionManager.get as any).mockReturnValueOnce(undefined).mockReturnValueOnce(undefined);
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager);

      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-1', 'Hello', 'user-1', 'channel-1'));
      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-2', 'Hello', 'user-2', 'channel-2'));

      expect(mockSessionManager.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('shouldIgnore', () => {
    it('should not ignore messages when no patterns configured', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should ignore messages matching excludePatterns', async () => {
      const config = {
        ...defaultConfig,
        excludePatterns: [/ignore/i, /spam/],
      };
      const autoReply = new AutoReply(config, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Please ignore this message', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).not.toHaveBeenCalled();
    });

    it('should ignore messages matching excludePatterns with regex special characters', async () => {
      const config = {
        ...defaultConfig,
        excludePatterns: [/test.*pattern/i],
      };
      const autoReply = new AutoReply(config, mockProvider);
      const message = createMockChannelMessage('msg-1', 'This is a test pattern', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).not.toHaveBeenCalled();
    });

    it('should only process messages matching matchPatterns when configured', async () => {
      const config = {
        ...defaultConfig,
        matchPatterns: [/hello/i, /help/],
      };
      const autoReply = new AutoReply(config, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello, how can you help me?', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should ignore messages not matching matchPatterns', async () => {
      const config = {
        ...defaultConfig,
        matchPatterns: [/hello/i, /help/],
      };
      const autoReply = new AutoReply(config, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Goodbye', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).not.toHaveBeenCalled();
    });

    it('should ignore messages matching both matchPatterns and excludePatterns', async () => {
      const config = {
        ...defaultConfig,
        matchPatterns: [/hello/i],
        excludePatterns: [/ignore/i],
      };
      const autoReply = new AutoReply(config, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello ignore', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).not.toHaveBeenCalled();
    });

    it('should process messages matching matchPatterns but not excludePatterns', async () => {
      const config = {
        ...defaultConfig,
        matchPatterns: [/hello/i],
        excludePatterns: [/ignore/i],
      };
      const autoReply = new AutoReply(config, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello world', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should handle empty matchPatterns array as no filter', async () => {
      const config = {
        ...defaultConfig,
        matchPatterns: [],
      };
      const autoReply = new AutoReply(config, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Any message', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should handle multiple excludePatterns', async () => {
      const config = {
        ...defaultConfig,
        excludePatterns: [/ignore1/i, /ignore2/i, /ignore3/i],
      };
      const autoReply = new AutoReply(config, mockProvider);
      const message = createMockChannelMessage('msg-1', 'ignore2', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).not.toHaveBeenCalled();
    });

    it('should handle complex regex patterns', async () => {
      const config = {
        ...defaultConfig,
        matchPatterns: [/^(hi|hello|hey)/i],
      };
      const autoReply = new AutoReply(config, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hi there!', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should use case-insensitive matching by default', async () => {
      const config = {
        ...defaultConfig,
        matchPatterns: [/hello/],
        excludePatterns: [/stop/],
      };
      const autoReply = new AutoReply(config, mockProvider);
      const message = createMockChannelMessage('msg-1', 'HELLO stop', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).not.toHaveBeenCalled();
    });
  });

  describe('cooldown functionality', () => {
    it('should not respond during cooldown period', async () => {
      const config = { ...defaultConfig, cooldown: 5000 };
      const autoReply = new AutoReply(config, mockProvider);

      const message1 = createMockChannelMessage('msg-1', 'Hello', 'user-1');
      await autoReply.handleMessage(mockChannel, message1);

      expect(mockProvider.chat).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(3000);

      const message2 = createMockChannelMessage('msg-2', 'Hello again', 'user-1');
      await autoReply.handleMessage(mockChannel, message2);

      expect(mockProvider.chat).toHaveBeenCalledTimes(1);
    });

    it('should respond after cooldown period expires', async () => {
      const config = { ...defaultConfig, cooldown: 5000 };
      const autoReply = new AutoReply(config, mockProvider);

      const message1 = createMockChannelMessage('msg-1', 'Hello', 'user-1');
      await autoReply.handleMessage(mockChannel, message1);

      expect(mockProvider.chat).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(6000);

      const message2 = createMockChannelMessage('msg-2', 'Hello again', 'user-1');
      await autoReply.handleMessage(mockChannel, message2);

      expect(mockProvider.chat).toHaveBeenCalledTimes(2);
    });

    it('should track cooldown per user per channel', async () => {
      const config = { ...defaultConfig, cooldown: 5000 };
      const autoReply = new AutoReply(config, mockProvider);

      const message1 = createMockChannelMessage('msg-1', 'Hello', 'user-1', 'channel-1');
      await autoReply.handleMessage(mockChannel, message1);

      expect(mockProvider.chat).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(3000);

      const message2 = createMockChannelMessage('msg-2', 'Hello', 'user-1', 'channel-2');
      await autoReply.handleMessage(mockChannel, message2);

      expect(mockProvider.chat).toHaveBeenCalledTimes(2);
    });

    it('should track cooldown per different users', async () => {
      const config = { ...defaultConfig, cooldown: 5000 };
      const autoReply = new AutoReply(config, mockProvider);

      const message1 = createMockChannelMessage('msg-1', 'Hello', 'user-1');
      await autoReply.handleMessage(mockChannel, message1);

      expect(mockProvider.chat).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(3000);

      const message2 = createMockChannelMessage('msg-2', 'Hello', 'user-2');
      await autoReply.handleMessage(mockChannel, message2);

      expect(mockProvider.chat).toHaveBeenCalledTimes(2);
    });

    it('should allow rapid messages when cooldown is 0', async () => {
      const config = { ...defaultConfig, cooldown: 0 };
      const autoReply = new AutoReply(config, mockProvider);

      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-1', 'Hello', 'user-1'));
      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-2', 'Hello', 'user-1'));
      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-3', 'Hello', 'user-1'));

      expect(mockProvider.chat).toHaveBeenCalledTimes(3);
    });

    it('should handle negative cooldown as no cooldown', async () => {
      const config = { ...defaultConfig, cooldown: -1 };
      const autoReply = new AutoReply(config, mockProvider);

      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-1', 'Hello', 'user-1'));
      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-2', 'Hello', 'user-1'));

      expect(mockProvider.chat).toHaveBeenCalledTimes(2);
    });

    it('should handle large cooldown values', async () => {
      const config = { ...defaultConfig, cooldown: 86400000 };
      const autoReply = new AutoReply(config, mockProvider);

      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-1', 'Hello', 'user-1'));
      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-2', 'Hello', 'user-1'));

      expect(mockProvider.chat).toHaveBeenCalledTimes(1);
    });

    it('should ignore messages during cooldown without affecting session', async () => {
      const config = { ...defaultConfig, cooldown: 5000 };
      (mockSessionManager.get as any).mockReturnValueOnce(undefined);
      const autoReply = new AutoReply(config, mockProvider, mockSessionManager);

      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-1', 'Hello', 'user-1'));

      expect(mockSessionManager.create).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(3000);

      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-2', 'Hello again', 'user-1'));

      expect(mockSessionManager.create).toHaveBeenCalledTimes(1);
    });
  });

  describe('setProvider', () => {
    it('should set provider after construction', () => {
      const autoReply = new AutoReply(defaultConfig);
      autoReply.setProvider(mockProvider);
    });

    it('should allow changing provider', () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const newProvider = { ...mockProvider, id: 'new-provider' };
      autoReply.setProvider(newProvider);
    });

    it('should work with provider set after construction', async () => {
      const autoReply = new AutoReply(defaultConfig);
      autoReply.setProvider(mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });
  });

  describe('setSessionManager', () => {
    it('should set session manager after construction', () => {
      const autoReply = new AutoReply(defaultConfig);
      autoReply.setSessionManager(mockSessionManager);
    });

    it('should allow changing session manager', () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager);
      const newManager = { ...mockSessionManager } as any;
      newManager.create = vi.fn().mockResolvedValue(mockSession);
      autoReply.setSessionManager(newManager);
    });

    it('should work with session manager set after construction', async () => {
      (mockSessionManager.get as any).mockReturnValueOnce(undefined);
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      autoReply.setSessionManager(mockSessionManager);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockSessionManager.create).toHaveBeenCalled();
    });
  });

  describe('setHooks', () => {
    it('should set hooks after construction', () => {
      const autoReply = new AutoReply(defaultConfig);
      autoReply.setHooks(mockHooks);
    });

    it('should allow changing hooks', () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager, mockHooks);
      const newHooks = { ...mockHooks } as any;
      newHooks.execute = vi.fn().mockResolvedValue(undefined);
      autoReply.setHooks(newHooks);
    });

    it('should work with hooks set after construction', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      autoReply.setHooks(mockHooks);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockHooks.execute).toHaveBeenCalled();
    });
  });

  describe('enable and disable', () => {
    it('should enable auto-reply', () => {
      const config = { ...defaultConfig, enabled: false };
      const autoReply = new AutoReply(config);

      autoReply.enable();

      expect(autoReply.isEnabled()).toBe(true);
    });

    it('should disable auto-reply', () => {
      const autoReply = new AutoReply(defaultConfig);

      autoReply.disable();

      expect(autoReply.isEnabled()).toBe(false);
    });

    it('should toggle enable/disable multiple times', () => {
      const autoReply = new AutoReply(defaultConfig);

      expect(autoReply.isEnabled()).toBe(true);
      autoReply.disable();
      expect(autoReply.isEnabled()).toBe(false);
      autoReply.enable();
      expect(autoReply.isEnabled()).toBe(true);
      autoReply.disable();
      expect(autoReply.isEnabled()).toBe(false);
    });

    it('should not respond when disabled via disable method', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      autoReply.disable();
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).not.toHaveBeenCalled();
    });

    it('should respond when re-enabled', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      autoReply.disable();
      autoReply.enable();
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });
  });

  describe('isEnabled', () => {
    it('should return true when enabled', () => {
      const autoReply = new AutoReply(defaultConfig);
      expect(autoReply.isEnabled()).toBe(true);
    });

    it('should return false when disabled', () => {
      const config = { ...defaultConfig, enabled: false };
      const autoReply = new AutoReply(config);
      expect(autoReply.isEnabled()).toBe(false);
    });

    it('should reflect enable/disable state changes', () => {
      const autoReply = new AutoReply(defaultConfig);

      expect(autoReply.isEnabled()).toBe(true);
      autoReply.disable();
      expect(autoReply.isEnabled()).toBe(false);
      autoReply.enable();
      expect(autoReply.isEnabled()).toBe(true);
    });
  });

  describe('updateConfig', () => {
    it('should update config options', () => {
      const autoReply = new AutoReply(defaultConfig);

      autoReply.updateConfig({ cooldown: 5000 });

      expect((autoReply as any).config.cooldown).toBe(5000);
    });

    it('should update matchPatterns', () => {
      const autoReply = new AutoReply(defaultConfig);
      const newPatterns = [/test/i];

      autoReply.updateConfig({ matchPatterns: newPatterns });

      expect((autoReply as any).config.matchPatterns).toBe(newPatterns);
    });

    it('should update excludePatterns', () => {
      const autoReply = new AutoReply(defaultConfig);
      const newPatterns = [/ignore/i];

      autoReply.updateConfig({ excludePatterns: newPatterns });

      expect((autoReply as any).config.excludePatterns).toBe(newPatterns);
    });

    it('should update systemPrompt', () => {
      const autoReply = new AutoReply(defaultConfig);

      autoReply.updateConfig({ systemPrompt: 'New prompt' });

      expect((autoReply as any).config.systemPrompt).toBe('New prompt');
    });

    it('should update temperature', () => {
      const autoReply = new AutoReply(defaultConfig);

      autoReply.updateConfig({ temperature: 0.9 });

      expect((autoReply as any).config.temperature).toBe(0.9);
    });

    it('should update multiple config options at once', () => {
      const autoReply = new AutoReply(defaultConfig);

      autoReply.updateConfig({
        cooldown: 3000,
        temperature: 0.5,
        maxTokens: 500,
      });

      const config = (autoReply as any).config;
      expect(config.cooldown).toBe(3000);
      expect(config.temperature).toBe(0.5);
      expect(config.maxTokens).toBe(500);
    });

    it('should allow disabling via updateConfig', () => {
      const autoReply = new AutoReply(defaultConfig);

      autoReply.updateConfig({ enabled: false });

      expect(autoReply.isEnabled()).toBe(false);
    });

    it('should allow enabling via updateConfig', () => {
      const config = { ...defaultConfig, enabled: false };
      const autoReply = new AutoReply(config);

      autoReply.updateConfig({ enabled: true });

      expect(autoReply.isEnabled()).toBe(true);
    });
  });

  describe('Provider integration', () => {
    it('should use provider from constructor', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should handle provider errors gracefully', async () => {
      (mockProvider.chat as any).mockRejectedValueOnce(new Error('Provider error'));
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager, mockHooks);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockHooks.execute).toHaveBeenCalledWith('onError', expect.objectContaining({
        error: expect.any(Error),
      }));
    });

    it('should handle multiple provider calls', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);

      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-1', 'Hello', 'user-1'));
      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-2', 'How are you?', 'user-1'));
      await autoReply.handleMessage(mockChannel, createMockChannelMessage('msg-3', 'Goodbye', 'user-1'));

      expect(mockProvider.chat).toHaveBeenCalledTimes(3);
    });

    it('should pass messages to provider correctly', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Test message', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      const chatCall = (mockProvider.chat as any).mock.calls[0][0];
      expect(chatCall).toHaveLength(2);
      expect(chatCall[0].role).toBe('system');
      expect(chatCall[1].role).toBe('user');
      expect(chatCall[1].content).toBe('Test message');
    });

    it('should handle provider disconnect', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      await mockProvider.disconnect();
      expect(mockProvider.disconnect).toHaveBeenCalled();
    });
  });

  describe('Session management integration', () => {
    it('should create new session for new user-channel combination', async () => {
      (mockSessionManager.get as any).mockReturnValueOnce(undefined);
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1', 'channel-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockSessionManager.create).toHaveBeenCalledWith({
        channel: 'channel-1',
        userId: 'user-1',
        provider: 'openai',
      });
    });

    it('should pass session messages to provider', async () => {
      const existingMessages = [
        { role: 'user' as const, content: 'Previous message 1' },
        { role: 'assistant' as const, content: 'Previous response 1' },
      ];
      (mockSessionManager.get as any).mockReturnValueOnce({
        ...mockSession,
        getMessages: () => existingMessages,
      });
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager);
      const message = createMockChannelMessage('msg-1', 'New message', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      const chatCall = (mockProvider.chat as any).mock.calls[0][0];
      expect(chatCall.some((m: any) => m.role === 'system')).toBe(true);
      expect(chatCall.some((m: any) => m.role === 'user')).toBe(true);
    });

    it('should work without session manager', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should work without session manager', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });
  });

  describe('Hooks integration', () => {
    it('should call beforeMessage hook', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager, mockHooks);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockHooks.execute).toHaveBeenCalledWith('beforeMessage', expect.objectContaining({
        channel: message.channel,
        userId: message.author.id,
        message: message,
      }));
    });

    it('should call afterResponse hook with response content', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager, mockHooks);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockHooks.execute).toHaveBeenCalledWith('afterResponse', expect.objectContaining({
        channel: message.channel,
        userId: message.author.id,
        response: 'Mock response content',
      }));
    });

    it('should call onError hook when provider fails', async () => {
      (mockProvider.chat as any).mockRejectedValueOnce(new Error('API Error'));
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager, mockHooks);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockHooks.execute).toHaveBeenCalledWith('onError', expect.objectContaining({
        error: expect.any(Error),
      }));
    });

    it('should work without hooks', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should pass metadata to hooks', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager, mockHooks);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      const beforeMessageCall = (mockHooks.execute as any).mock.calls.find(
        (call: any[]) => call[0] === 'beforeMessage'
      );
      expect(beforeMessageCall[1].metadata).toEqual({});

      const afterResponseCall = (mockHooks.execute as any).mock.calls.find(
        (call: any[]) => call[0] === 'afterResponse'
      );
      expect(afterResponseCall[1].metadata).toEqual({});
    });
  });

  describe('Error handling', () => {
    it('should handle provider chat error', async () => {
      (mockProvider.chat as any).mockRejectedValueOnce(new Error('Network error'));
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager, mockHooks);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockHooks.execute).toHaveBeenCalledWith('onError', expect.objectContaining({
        error: expect.any(Error),
      }));
    });

    it('should handle provider returning error response', async () => {
      (mockProvider.chat as any).mockResolvedValueOnce({
        id: 'error-response',
        content: '',
        model: 'gpt-4',
        finishReason: 'content_filter',
      });
      const autoReply = new AutoReply(defaultConfig, mockProvider, mockSessionManager);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockChannel.sendMessage).toHaveBeenCalled();
    });

    it('should handle channel sendMessage error', async () => {
      (mockChannel.sendMessage as any).mockRejectedValueOnce(new Error('Send failed'));
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockHooks.execute).not.toHaveBeenCalledWith('onError');
    });

    it('should handle session addMessage error but continue', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockChannel.sendMessage).toHaveBeenCalled();
    });

    it('should handle hooks execution error but continue', async () => {
      const autoReply = new AutoReply(defaultConfig, mockProvider);
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');

      await autoReply.handleMessage(mockChannel, message);

      expect(mockChannel.sendMessage).toHaveBeenCalled();
    });

    it('should handle undefined message content', async () => {
      const message = createMockChannelMessage('msg-1', '', 'user-1');
      message.content = undefined as any;
      const autoReply = new AutoReply(defaultConfig, mockProvider);

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should handle null message content', async () => {
      const message = createMockChannelMessage('msg-1', '', 'user-1');
      message.content = null as any;
      const autoReply = new AutoReply(defaultConfig, mockProvider);

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });

    it('should handle missing author id', async () => {
      const message = createMockChannelMessage('msg-1', 'Hello', 'user-1');
      message.author = { id: '', name: 'Test' } as any;
      const autoReply = new AutoReply(defaultConfig, mockProvider);

      await autoReply.handleMessage(mockChannel, message);

      expect(mockProvider.chat).toHaveBeenCalled();
    });
  });
});
