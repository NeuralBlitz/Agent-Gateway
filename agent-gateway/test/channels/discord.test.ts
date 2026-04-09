import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDiscordChannel, DiscordChannel, DiscordConfig } from '../../src/channels/discord/index.js';

vi.mock('undici', () => ({
  fetch: vi.fn(),
}));

const { fetch } = await import('undici');

describe('DiscordChannel', () => {
  let channel: DiscordChannel;
  const config: DiscordConfig = {
    enabled: true,
    botToken: 'test-bot-token',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    channel = createDiscordChannel('test-discord', 'Test Bot', config);
  });

  describe('constructor', () => {
    it('should create channel with correct properties', () => {
      expect(channel.id).toBe('test-discord');
      expect(channel.type).toBe('discord');
      expect(channel.name).toBe('Test Bot');
      expect(channel.connected).toBe(false);
    });
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: '123456789' }),
      } as any);

      await channel.connect();

      expect(channel.connected).toBe(true);
      expect(fetch).toHaveBeenCalledWith(
        'https://discord.com/api/v10/users/@me',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bot test-bot-token',
          }),
        })
      );
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'msg-123' }),
      } as any);

      channel.connected = true;
      await channel.sendMessage('channel-123', 'Hello Discord!');

      expect(fetch).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/channel-123/messages',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ content: 'Hello Discord!' }),
        })
      );
    });
  });

  describe('sendEmbed', () => {
    it('should send embed successfully', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'msg-456' }),
      } as any);

      channel.connected = true;
      const embed = {
        title: 'Test Embed',
        description: 'This is a test',
        color: 0x00ff00,
        fields: [{ name: 'Field 1', value: 'Value 1' }],
      };

      await channel.sendEmbed('channel-123', embed);

      expect(fetch).toHaveBeenCalledWith(
        'https://discord.com/api/v10/channels/channel-123/messages',
        expect.objectContaining({
          body: JSON.stringify({ embeds: [embed] }),
        })
      );
    });
  });

  describe('getUser', () => {
    it('should return user info', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: '123456',
            username: 'johndoe',
            discriminator: '1234',
            avatar: 'abc123',
          }),
      } as any);

      const user = await channel.getUser('123456');

      expect(user).toEqual({
        id: '123456',
        name: 'johndoe#1234',
        username: 'johndoe',
        avatar: 'https://cdn.discordapp.com/avatars/123456/abc123.png',
      });
    });
  });

  describe('handleGatewayEvent', () => {
    it('should handle MESSAGE_CREATE event', () => {
      const messageHandler = vi.fn();
      channel.on('message', messageHandler);

      const eventData = {
        id: 'msg-789',
        content: 'Hello from Discord',
        author: {
          id: 'user-123',
          username: 'testuser',
        },
        channel_id: 'channel-123',
      };

      channel.handleGatewayEvent('MESSAGE_CREATE', eventData);

      expect(messageHandler).toHaveBeenCalledWith({
        id: 'msg-789',
        content: 'Hello from Discord',
        author: {
          id: 'user-123',
          name: 'testuser',
          username: 'testuser',
        },
        channel: 'channel-123',
        timestamp: expect.any(Date),
        raw: eventData,
      });
    });

    it('should ignore bot messages', () => {
      const messageHandler = vi.fn();
      channel.on('message', messageHandler);

      const eventData = {
        id: 'msg-999',
        content: 'Bot message',
        author: {
          id: 'bot-123',
          username: 'bot',
          bot: true,
        },
        channel_id: 'channel-123',
      };

      channel.handleGatewayEvent('MESSAGE_CREATE', eventData);

      expect(messageHandler).not.toHaveBeenCalled();
    });
  });

  describe('createDM', () => {
    it('should create DM channel', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ id: 'dm-channel-123' }),
      } as any);

      channel.connected = true;
      const dmId = await channel.createDM('user-123');

      expect(dmId).toBe('dm-channel-123');
    });
  });
});