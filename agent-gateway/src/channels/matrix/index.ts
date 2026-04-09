import { EventEmitter } from 'events';
import { fetch } from 'undici';
import { logger } from '../../infra/logger.js';
import type { Channel, ChannelMessage, ChannelUser, ChannelBot } from '../types.js';

export interface MatrixConfig {
  homeserver: string;
  userId: string;
  accessToken: string;
}

export class MatrixChannel extends EventEmitter implements Channel {
  id: string;
  type: string = 'matrix';
  name: string;
  connected: boolean = false;
  config: MatrixConfig;

  constructor(id: string, name: string, config: MatrixConfig) {
    super();
    this.id = id;
    this.name = name;
    this.config = config;
  }

  private getBaseUrl(): string {
    return this.config.homeserver;
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/_matrix/client/v3/account/whoami`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to verify Matrix credentials');
      }

      this.connected = true;
      this.emit('ready');
      logger.info(`Matrix connected: ${this.config.userId}`);
    } catch (error) {
      logger.error(`Failed to connect Matrix: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    logger.info('Matrix disconnected');
  }

  async sendMessage(roomId: string, content: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Matrix not connected');
    }

    const txnId = `m${Date.now()}`;
    
    await fetch(`${this.getBaseUrl()}/_matrix/client/v3/rooms/${roomId}/send/m.room.message/${txnId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        msgtype: 'm.text',
        body: content,
      }),
    });
  }

  async sendReply(roomId: string, eventId: string, content: string): Promise<void> {
    const txnId = `m${Date.now()}`;
    
    await fetch(`${this.getBaseUrl()}/_matrix/client/v3/rooms/${roomId}/send/m.room.message/${txnId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        msgtype: 'm.text',
        body: content,
        'm.relates_to': {
          'm.in_reply_to': {
            event_id: eventId,
          },
        },
      }),
    });
  }

  async sendNotice(roomId: string, content: string): Promise<void> {
    const txnId = `m${Date.now()}`;
    
    await fetch(`${this.getBaseUrl()}/_matrix/client/v3/rooms/${roomId}/send/m.room.message/${txnId}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify({
        msgtype: 'm.notice',
        body: content,
      }),
    });
  }

  async getUser(userId: string): Promise<ChannelUser | null> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/_matrix/client/v3/profile/${userId}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) return null;

      const profile = await response.json() as any;
      return {
        id: userId,
        name: profile.displayname || userId,
        username: userId,
      };
    } catch {
      return null;
    }
  }

  async getMe(): Promise<ChannelBot | null> {
    return {
      id: this.config.userId,
      name: this.config.userId,
      username: this.config.userId,
    };
  }

  async joinRoom(roomIdOrAlias: string): Promise<void> {
    await fetch(`${this.getBaseUrl()}/_matrix/client/v3/join/${encodeURIComponent(roomIdOrAlias)}`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  async leaveRoom(roomId: string): Promise<void> {
    await fetch(`${this.getBaseUrl()}/_matrix/client/v3/rooms/${roomId}/leave`, {
      method: 'POST',
      headers: this.getHeaders(),
    });
  }

  async getRoomMembers(roomId: string): Promise<string[]> {
    const response = await fetch(`${this.getBaseUrl()}/_matrix/client/v3/rooms/${roomId}/members`, {
      headers: this.getHeaders(),
    });
    
    const data = await response.json() as any;
    return data.chunk?.map((m: any) => m.state_key) || [];
  }

  handleSyncEvent(roomId: string, event: any): void {
    if (event.type === 'm.room.message' && event.sender !== this.config.userId) {
      const channelMessage: ChannelMessage = {
        id: event.event_id,
        content: event.content?.body || '',
        author: {
          id: event.sender,
          name: event.sender,
        },
        channel: roomId,
        timestamp: new Date(event.origin_server_ts),
        raw: event,
      };
      this.emit('message', channelMessage);
    }
  }

  async createRoom(name: string, topic?: string): Promise<string> {
    const response = await fetch(`${this.getBaseUrl()}/_matrix/client/v3/createRoom`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        name,
        topic,
        preset: 'public_chat',
      }),
    });
    
    const data = await response.json() as any;
    return data.room_id;
  }

  async getRoomState(roomId: string): Promise<any> {
    const response = await fetch(`${this.getBaseUrl()}/_matrix/client/v3/rooms/${roomId}/state`, {
      headers: this.getHeaders(),
    });
    return response.json();
  }
}

export function createMatrixChannel(id: string, name: string, config: MatrixConfig): MatrixChannel {
  return new MatrixChannel(id, name, config);
}