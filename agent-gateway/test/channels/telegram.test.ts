import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTelegramChannel, TelegramChannel, TelegramConfig } from '../../src/channels/telegram/index.js';

vi.mock('undici', () => ({
  fetch: vi.fn(),
}));

const { fetch } = await import('undici');

describe('TelegramChannel', () => {
  let channel: TelegramChannel;
  const config: TelegramConfig = {
    enabled: true,
    botToken: 'test-bot-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    channel = createTelegramChannel('test-telegram', 'Test Bot', config);
  });

  describe('constructor', () => {
    it('should create channel with correct properties', () => {
      expect(channel.id).toBe('test-telegram');
      expect(channel.type).toBe('telegram');
      expect(channel.name).toBe('Test Bot');
      expect(channel.connected).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: { username: 'testbot' } }),
      } as any);

      await channel.connect();

      expect(channel.connected).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-bot-token/getMe'
      );
    });

    it('should throw on connection failure', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ ok: false, description: 'Invalid token' }),
      } as any);

      await expect(channel.connect()).rejects.toThrow('Invalid token');
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await channel.disconnect();
      expect(channel.connected).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ ok: true }),
      } as any);

      channel.connected = true;
      await channel.sendMessage('123456', 'Hello!');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.telegram.org/bottest-bot-token/sendMessage',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            chat_id: '123456',
            text: 'Hello!',
            parse_mode: 'Markdown',
          }),
        })
      );
    });

    it('should throw when not connected', async () => {
      await expect(channel.sendMessage('123456', 'Hello!')).rejects.toThrow(
        'Telegram bot not connected'
      );
    });
  });

  describe('getUser', () => {
    it('should return user info', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            result: {
              id: 123456,
              first_name: 'John',
              username: 'johndoe',
            },
          }),
      } as any);

      const user = await channel.getUser('123456');

      expect(user).toEqual({
        id: '123456',
        name: 'John',
        username: 'johndoe',
      });
    });

    it('should return null on error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ ok: false }),
      } as any);

      const user = await channel.getUser('123456');
      expect(user).toBeNull();
    });
  });

  describe('getMe', () => {
    it('should return bot info', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ok: true,
            result: {
              id: 987654,
              name: 'Test Bot',
              username: 'testbot',
            },
          }),
      } as any);

      const bot = await channel.getMe();

      expect(bot).toEqual({
        id: '987654',
        name: 'Test Bot',
        username: 'testbot',
      });
    });
  });

  describe('handleWebhookUpdate', () => {
    it('should emit message event for text messages', () => {
      const messageHandler = vi.fn();
      channel.on('message', messageHandler);

      const update = {
        message: {
          message_id: 123,
          from: { id: 123456, first_name: 'John', username: 'johndoe' },
          chat: { id: 123456 },
          text: 'Hello world',
          date: 1700000000,
        },
      };

      channel.handleWebhookUpdate(update);

      expect(messageHandler).toHaveBeenCalledWith({
        id: '123',
        content: 'Hello world',
        author: {
          id: '123456',
          name: 'John',
          username: 'johndoe',
        },
        channel: 'test-telegram',
        timestamp: new Date(1700000000 * 1000),
        raw: update,
      });
    });

    it('should emit message event for photos with caption', () => {
      const messageHandler = vi.fn();
      channel.on('message', messageHandler);

      const update = {
        message: {
          message_id: 124,
          from: { id: 123456, first_name: 'Jane' },
          chat: { id: 123456 },
          photo: [{ file_id: 'abc123' }],
          caption: 'Look at this!',
          date: 1700000000,
        },
      };

      channel.handleWebhookUpdate(update);

      expect(messageHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          content: 'Look at this!',
          author: expect.any(Object),
        })
      );
    });
  });
});

describe('createTelegramChannel', () => {
  it('should create channel with correct type', () => {
    const channel = createTelegramChannel('my-id', 'My Bot', {
      enabled: true,
      botToken: 'test-token',
    });

    expect(channel.type).toBe('telegram');
    expect(channel.id).toBe('my-id');
    expect(channel.name).toBe('My Bot');
  });
});