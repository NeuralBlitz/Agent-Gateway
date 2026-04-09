import { EventEmitter } from 'events';
import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Channel, ChannelMessage, ChannelUser, ChannelBot } from '../types.js';

export interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId?: string;
}

export class WhatsAppChannel extends EventEmitter implements Channel {
  id: string;
  type: string = 'whatsapp';
  name: string;
  connected: boolean = false;
  config: WhatsAppConfig;
  private baseUrl = 'https://graph.facebook.com/v18.0';

  constructor(id: string, name: string, config: WhatsAppConfig) {
    super();
    this.id = id;
    this.name = name;
    this.config = config;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${this.config.phoneNumberId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to verify WhatsApp business account');
      }

      this.connected = true;
      this.emit('ready');
      logger.info('WhatsApp business account connected');
    } catch (error) {
      logger.error(`Failed to connect WhatsApp: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    logger.info('WhatsApp disconnected');
  }

  async sendMessage(userId: string, content: string): Promise<void> {
    if (!this.connected) {
      throw new Error('WhatsApp not connected');
    }

    await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: userId,
        type: 'text',
        text: { body: content },
      }),
    });
  }

  async sendImage(userId: string, imageUrl: string, caption?: string): Promise<void> {
    await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: userId,
        type: 'image',
        image: { link: imageUrl, caption },
      }),
    });
  }

  async sendDocument(userId: string, documentUrl: string, caption?: string): Promise<void> {
    await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: userId,
        type: 'document',
        document: { link: documentUrl, caption },
      }),
    });
  }

  async sendTemplate(userId: string, templateName: string, components?: any[]): Promise<void> {
    await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: userId,
        type: 'template',
        template: {
          name: templateName,
          components,
        },
      }),
    });
  }

  async getUser(userId: string): Promise<ChannelUser | null> {
    return {
      id: userId,
      name: userId,
      username: userId,
    };
  }

  async getMe(): Promise<ChannelBot | null> {
    return {
      id: this.config.phoneNumberId,
      name: this.name,
    };
  }

  handleWebhookEvent(event: any): void {
    const entry = event.entry?.[0];
    if (entry) {
      for (const change of entry.changes || []) {
        if (change.value?.messages) {
          for (const msg of change.value.messages) {
            const channelMessage: ChannelMessage = {
              id: msg.id,
              content: msg.text?.body || '',
              author: {
                id: msg.from,
                name: msg.from,
              },
              channel: this.id,
              timestamp: new Date(parseInt(msg.timestamp) * 1000),
              raw: msg,
            };
            this.emit('message', channelMessage);
          }
        }
      }
    }
  }

  async markAsRead(messageId: string): Promise<void> {
    await fetch(`${this.baseUrl}/${this.config.phoneNumberId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: messageId,
      }),
    });
  }
}

export function createWhatsAppChannel(id: string, name: string, config: WhatsAppConfig): WhatsAppChannel {
  return new WhatsAppChannel(id, name, config);
}