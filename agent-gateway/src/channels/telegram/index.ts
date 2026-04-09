import { EventEmitter } from 'events';
import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Channel, ChannelMessage, ChannelUser, ChannelBot } from '../types.js';

export interface TelegramConfig {
  botToken: string;
  webhookUrl?: string;
  secretToken?: string;
}

export class TelegramChannel extends EventEmitter implements Channel {
  id: string;
  type: string = 'telegram';
  name: string;
  connected: boolean = false;
  config: TelegramConfig;
  private baseUrl: string;

  constructor(id: string, name: string, config: TelegramConfig) {
    super();
    this.id = id;
    this.name = name;
    this.config = config;
    this.baseUrl = `https://api.telegram.org/bot${config.botToken}`;
  }

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/getMe`);
      const data = await response.json() as any;
      
      if (!data.ok) {
        throw new Error(data.description);
      }

      this.connected = true;
      this.emit('ready');
      logger.info(`Telegram bot connected: ${data.result.username}`);
    } catch (error) {
      logger.error(`Failed to connect Telegram bot: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    logger.info('Telegram bot disconnected');
  }

  async sendMessage(userId: string, content: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Telegram bot not connected');
    }

    await fetch(`${this.baseUrl}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        text: content,
        parse_mode: 'Markdown',
      }),
    });
  }

  async getUser(userId: string): Promise<ChannelUser | null> {
    try {
      const response = await fetch(`${this.baseUrl}/getChat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: userId }),
      });
      
      const data = await response.json() as any;
      
      if (!data.ok) return null;
      
      const chat = data.result;
      return {
        id: String(chat.id),
        name: chat.title || chat.first_name || 'Unknown',
        username: chat.username,
        avatar: chat.photo ? undefined : undefined,
      };
    } catch {
      return null;
    }
  }

  async getMe(): Promise<ChannelBot | null> {
    try {
      const response = await fetch(`${this.baseUrl}/getMe`);
      const data = await response.json() as any;
      
      if (!data.ok) return null;
      
      const bot = data.result;
      return {
        id: String(bot.id),
        name: bot.name,
        username: bot.username,
      };
    } catch {
      return null;
    }
  }

  async setWebhook(url: string, secretToken?: string): Promise<void> {
    const options: any = { url };
    
    if (secretToken) {
      options.secret_token = secretToken;
    }

    await fetch(`${this.baseUrl}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
  }

  async deleteWebhook(): Promise<void> {
    await fetch(`${this.baseUrl}/deleteWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
  }

  handleWebhookUpdate(update: any): void {
    if (update.message) {
      const msg = update.message;
      const channelMessage: ChannelMessage = {
        id: String(msg.message_id),
        content: msg.text || msg.caption || '',
        author: {
          id: String(msg.from?.id),
          name: msg.from?.first_name || 'Unknown',
          username: msg.from?.username,
        },
        channel: this.id,
        timestamp: new Date(msg.date * 1000),
        raw: update,
      };
      this.emit('message', channelMessage);
    }
  }

  async sendPhoto(userId: string, photoUrl: string, caption?: string): Promise<void> {
    await fetch(`${this.baseUrl}/sendPhoto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        photo: photoUrl,
        caption,
      }),
    });
  }

  async sendSticker(userId: string, stickerId: string): Promise<void> {
    await fetch(`${this.baseUrl}/sendSticker`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        sticker: stickerId,
      }),
    });
  }

  async sendDocument(userId: string, documentUrl: string, caption?: string): Promise<void> {
    await fetch(`${this.baseUrl}/sendDocument`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: userId,
        document: documentUrl,
        caption,
      }),
    });
  }

  async answerCallbackQuery(callbackQueryId: string, text?: string): Promise<void> {
    await fetch(`${this.baseUrl}/answerCallbackQuery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
  }
}

export function createTelegramChannel(id: string, name: string, config: TelegramConfig): TelegramChannel {
  return new TelegramChannel(id, name, config);
}