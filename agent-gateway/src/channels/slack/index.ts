import { EventEmitter } from 'events';
import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Channel, ChannelMessage, ChannelUser, ChannelBot } from '../types.js';

export interface SlackConfig {
  botToken: string;
  signingSecret?: string;
  appToken?: string;
}

export class SlackChannel extends EventEmitter implements Channel {
  id: string;
  type: string = 'slack';
  name: string;
  connected: boolean = false;
  config: SlackConfig;
  private baseUrl = 'https://slack.com/api';
  private userCache: Map<string, ChannelUser> = new Map();

  constructor(id: string, name: string, config: SlackConfig) {
    super();
    this.id = id;
    this.name = name;
    this.config = config;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.botToken}`,
      'Content-Type': 'application/json',
    };
  }

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/auth.test`, {
        headers: this.getHeaders(),
      });
      
      const data = await response.json() as any;
      
      if (!data.ok) {
        throw new Error(data.error);
      }

      this.connected = true;
      this.emit('ready');
      logger.info(`Slack bot connected: ${data.user_id}`);
    } catch (error) {
      logger.error(`Failed to connect Slack bot: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    logger.info('Slack bot disconnected');
  }

  async sendMessage(channelId: string, content: string, threadTs?: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Slack bot not connected');
    }

    const payload: any = {
      channel: channelId,
      text: content,
    };

    if (threadTs) {
      payload.thread_ts = threadTs;
    }

    await fetch(`${this.baseUrl}/chat.postMessage`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
  }

  async sendRichMessage(channelId: string, blocks: any[], threadTs?: string): Promise<void> {
    const payload: any = {
      channel: channelId,
      blocks,
    };

    if (threadTs) {
      payload.thread_ts = threadTs;
    }

    await fetch(`${this.baseUrl}/chat.postMessage`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });
  }

  async getUser(userId: string): Promise<ChannelUser | null> {
    if (this.userCache.has(userId)) {
      return this.userCache.get(userId)!;
    }

    try {
      const response = await fetch(`${this.baseUrl}/users.info`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ user: userId }),
      });
      
      const data = await response.json() as any;
      
      if (!data.ok) return null;
      
      const user: ChannelUser = {
        id: data.user.id,
        name: data.user.real_name || data.user.name,
        username: data.user.name,
        avatar: data.user.profile?.image_72,
      };
      
      this.userCache.set(userId, user);
      return user;
    } catch {
      return null;
    }
  }

  async getMe(): Promise<ChannelBot | null> {
    try {
      const response = await fetch(`${this.baseUrl}/auth.test`, {
        headers: this.getHeaders(),
      });
      
      const data = await response.json() as any;
      
      if (!data.ok) return null;
      
      return {
        id: data.user_id,
        name: data.user,
        username: data.user,
      };
    } catch {
      return null;
    }
  }

  async getChannel(channelId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/conversations.info`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ channel: channelId }),
    });
    return response.json();
  }

  handleWebhookEvent(event: any): void {
    if (event.type === 'message' && !event.subtype?.includes('bot')) {
      const channelMessage: ChannelMessage = {
        id: event.ts,
        content: event.text,
        author: {
          id: event.user,
          name: event.username || 'Unknown',
        },
        channel: event.channel,
        timestamp: new Date(parseFloat(event.ts) * 1000),
        raw: event,
      };
      this.emit('message', channelMessage);
    }
  }

  async addReaction(channelId: string, timestamp: string, emoji: string): Promise<void> {
    await fetch(`${this.baseUrl}/reactions.add`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        channel: channelId,
        timestamp,
        name: emoji,
      }),
    });
  }

  async openConversation(userId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/conversations.open`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ users: userId }),
    });
    
    const data = await response.json() as any;
    return data.channel?.id;
  }

  async listChannels(): Promise<any[]> {
    let cursor: string | undefined;
    const channels: any[] = [];
    
    do {
      const response = await fetch(`${this.baseUrl}/conversations.list`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          types: 'public_channel,private_channel',
          limit: 200,
          cursor,
        }),
      });
      
      const data = await response.json() as any;
      channels.push(...data.channels);
      cursor = data.response_metadata?.next_cursor;
    } while (cursor);
    
    return channels;
  }
}

export function createSlackChannel(id: string, name: string, config: SlackConfig): SlackChannel {
  return new SlackChannel(id, name, config);
}