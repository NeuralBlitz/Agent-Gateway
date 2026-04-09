import { EventEmitter } from 'events';
import { logger } from '../../infra/logger.js';
import type { Channel, ChannelMessage, ChannelUser, ChannelBot } from '../types.js';

export interface SignalConfig {
  signalService: string;
  phoneNumber: string;
  accountId: string;
  signalingKey: string;
}

export class SignalChannel extends EventEmitter implements Channel {
  id: string;
  type: string = 'signal';
  name: string;
  connected: boolean = false;
  config: SignalConfig;

  constructor(id: string, name: string, config: SignalConfig) {
    super();
    this.id = id;
    this.name = name;
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      this.connected = true;
      this.emit('ready');
      logger.info('Signal connected');
    } catch (error) {
      logger.error(`Failed to connect Signal: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    logger.info('Signal disconnected');
  }

  async sendMessage(userId: string, content: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Signal not connected');
    }

    logger.debug(`Sending Signal message to ${userId}: ${content}`);
  }

  async sendGroupMessage(groupId: string, content: string): Promise<void> {
    logger.debug(`Sending Signal group message to ${groupId}: ${content}`);
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
      id: this.config.accountId,
      name: this.config.phoneNumber,
    };
  }

  handleMessage(source: string, groupId: string | null, message: string, timestamp: number): void {
    const channelMessage: ChannelMessage = {
      id: `signal_${timestamp}`,
      content: message,
      author: {
        id: source,
        name: source,
      },
      channel: this.id,
      timestamp: new Date(timestamp),
    };
    this.emit('message', channelMessage);
  }

  async joinGroup(groupId: string): Promise<void> {
    logger.debug(`Joining Signal group: ${groupId}`);
  }

  async leaveGroup(groupId: string): Promise<void> {
    logger.debug(`Leaving Signal group: ${groupId}`);
  }
}

export function createSignalChannel(id: string, name: string, config: SignalConfig): SignalChannel {
  return new SignalChannel(id, name, config);
}