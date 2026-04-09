/**
 * MS Teams Channel Adapter
 * Connects to Microsoft Teams via Bot Framework.
 */

import { EventEmitter } from 'events';
import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Channel, ChannelMessage, ChannelUser, ChannelBot } from '../types.js';

export interface TeamsConfig {
  appId: string;
  appPassword: string;
  tenantId?: string;
  baseUrl?: string;
}

export class TeamsChannel extends EventEmitter implements Channel {
  id: string;
  type: string = 'teams';
  name: string;
  connected: boolean = false;
  config: TeamsConfig;
  private token?: string;
  private tokenExpiry: number = 0;

  constructor(id: string, name: string, config: TeamsConfig) {
    super();
    this.id = id;
    this.name = name;
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      await this.getAccessToken();
      const me = await this.getMe();
      if (me) {
        this.connected = true;
        this.emit('ready');
        logger.info({ botName: me.name }, 'Teams bot connected');
      }
    } catch (error: any) {
      logger.error({ error }, 'Failed to connect Teams bot');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.token = undefined;
    logger.info('Teams bot disconnected');
  }

  async sendMessage(userId: string, content: string): Promise<void> {
    const token = await this.getAccessToken();
    const baseUrl = this.config.baseUrl || 'https://smba.trafficmanager.net/teams';

    await fetch(`${baseUrl}/v3/conversations/${userId}/activities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'message',
        text: content,
        from: { id: this.id, name: this.name },
        recipient: { id: userId },
      }),
    });
  }

  async getUser(userId: string): Promise<ChannelUser | null> {
    try {
      const token = await this.getAccessToken();
      const baseUrl = this.config.baseUrl || 'https://smba.trafficmanager.net/teams';

      const response = await fetch(`${baseUrl}/v3/conversations/${userId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) return null;

      const data = await response.json() as any;
      return {
        id: userId,
        name: data.name || 'Unknown',
        username: data.userPrincipalName,
      };
    } catch {
      return null;
    }
  }

  async getMe(): Promise<ChannelBot | null> {
    try {
      return {
        id: this.id,
        name: this.name,
        username: this.config.appId,
      };
    } catch {
      return null;
    }
  }

  handleWebhookUpdate(update: any): void {
    if (update.type === 'message') {
      const channelMessage: ChannelMessage = {
        id: update.id || `teams_${Date.now()}`,
        content: update.text || '',
        author: {
          id: update.from?.id || 'unknown',
          name: update.from?.name || 'Unknown',
        },
        channel: this.id,
        timestamp: new Date(update.timestamp || Date.now()),
        raw: update,
      };
      this.emit('message', channelMessage);
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const tenantId = this.config.tenantId || 'botframework.com';
    const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.config.appId,
        client_secret: this.config.appPassword,
        scope: 'https://api.botframework.com/.default',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get Teams access token: ${response.status}`);
    }

    const data = await response.json() as any;
    this.token = data.access_token;
    this.tokenExpiry = Date.now() + ((data.expires_in || 3600) - 300) * 1000;
    return this.token;
  }
}

export function createTeamsChannel(id: string, name: string, config: TeamsConfig): TeamsChannel {
  return new TeamsChannel(id, name, config);
}
