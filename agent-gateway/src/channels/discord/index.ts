import { EventEmitter } from 'events';
import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Channel, ChannelMessage, ChannelUser, ChannelBot } from '../types.js';

export interface DiscordConfig {
  botToken: string;
  intents?: number;
}

export class DiscordChannel extends EventEmitter implements Channel {
  id: string;
  type: string = 'discord';
  name: string;
  connected: boolean = false;
  config: DiscordConfig;
  private baseUrl = 'https://discord.com/api/v10';

  constructor(id: string, name: string, config: DiscordConfig) {
    super();
    this.id = id;
    this.name = name;
    this.config = config;
  }

  private getHeaders() {
    return {
      'Authorization': `Bot ${this.config.botToken}`,
      'Content-Type': 'application/json',
    };
  }

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/users/@me`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.status}`);
      }

      this.connected = true;
      this.emit('ready');
      logger.info('Discord bot connected');
    } catch (error) {
      logger.error(`Failed to connect Discord bot: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    logger.info('Discord bot disconnected');
  }

  async sendMessage(channelId: string, content: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Discord bot not connected');
    }

    await fetch(`${this.baseUrl}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ content }),
    });
  }

  async sendEmbed(channelId: string, embed: any): Promise<void> {
    await fetch(`${this.baseUrl}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ embeds: [embed] }),
    });
  }

  async sendReply(messageId: string, channelId: string, content: string): Promise<void> {
    await fetch(`${this.baseUrl}/channels/${channelId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ 
        content,
        message_reference: { message_id: messageId },
      }),
    });
  }

  async getUser(userId: string): Promise<ChannelUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/${userId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return null;

      const user = await response.json() as any;
      return {
        id: user.id,
        name: `${user.username}#${user.discriminator || '0000'}`,
        username: user.username,
        avatar: user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png` : undefined,
      };
    } catch {
      return null;
    }
  }

  async getMe(): Promise<ChannelBot | null> {
    try {
      const response = await fetch(`${this.baseUrl}/users/@me`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return null;

      const bot = await response.json() as any;
      return {
        id: bot.id,
        name: `${bot.username}#${bot.discriminator || '0000'}`,
        username: bot.username,
      };
    } catch {
      return null;
    }
  }

  async getChannel(channelId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/channels/${channelId}`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  async getGuild(guildId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/guilds/${guildId}`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }

  handleGatewayEvent(event: string, data: any): void {
    switch (event) {
      case 'MESSAGE_CREATE':
        if (data.author?.bot) return;
        
        const channelMessage: ChannelMessage = {
          id: data.id,
          content: data.content,
          author: {
            id: data.author.id,
            name: data.author.username,
            username: data.author.username,
          },
          channel: data.channel_id,
          timestamp: new Date(),
          raw: data,
        };
        this.emit('message', channelMessage);
        break;

      case 'GUILD_CREATE':
        this.emit('guildAvailable', data);
        break;
    }
  }

  async createDM(userId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/users/@me/channels`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ recipient_id: userId }),
    });
    
    const data = await response.json() as any;
    return data.id;
  }

  async addReaction(channelId: string, messageId: string, emoji: string): Promise<void> {
    const encodedEmoji = encodeURIComponent(emoji);
    await fetch(`${this.baseUrl}/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}/@me`, {
      method: 'PUT',
      headers: this.getHeaders(),
    });
  }

  async deleteMessage(channelId: string, messageId: string): Promise<void> {
    await fetch(`${this.baseUrl}/channels/${channelId}/messages/${messageId}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
  }
}

export function createDiscordChannel(id: string, name: string, config: DiscordConfig): DiscordChannel {
  return new DiscordChannel(id, name, config);
}