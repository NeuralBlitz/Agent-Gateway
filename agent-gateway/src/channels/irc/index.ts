/**
 * IRC Channel Adapter
 * Connects to IRC servers for AI bot messaging.
 */

import { EventEmitter } from 'events';
import { logger } from '../../infra/logger.js';
import type { Channel, ChannelMessage, ChannelUser, ChannelBot } from '../types.js';

export interface IRCConfig {
  host: string;
  port: number;
  nick: string;
  channels: string[];
  password?: string;
  sasl?: boolean;
  tls?: boolean;
}

export class IRCChannel extends EventEmitter implements Channel {
  id: string;
  type: string = 'irc';
  name: string;
  connected: boolean = false;
  config: IRCConfig;
  private socket?: any;

  constructor(id: string, name: string, config: IRCConfig) {
    super();
    this.id = id;
    this.name = name;
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      const net = await import('net');
      const tls = await import('tls');

      const connectFn: (opts: { host: string; port: number }) => any = this.config.tls
        ? ((opts: { host: string; port: number }) => (tls as any).connect(opts))
        : ((opts: { host: string; port: number }) => net.createConnection(opts));
      this.socket = connectFn({
        host: this.config.host,
        port: this.config.port,
      });

      this.socket.on('data', (data: Buffer) => {
        const lines = data.toString().split('\r\n');
        for (const line of lines) {
          this.handleLine(line);
        }
      });

      this.socket.on('connect', () => {
        if (this.config.password) {
          this.socket.write(`PASS ${this.config.password}\r\n`);
        }
        this.socket.write(`NICK ${this.config.nick}\r\n`);
        this.socket.write(`USER ${this.config.nick} 0 * :AI Bot\r\n`);
      });

      this.socket.on('error', (err: Error) => {
        logger.error({ err }, 'IRC connection error');
        this.connected = false;
        this.emit('error', err);
      });

    } catch (error: any) {
      logger.error({ error }, 'Failed to connect IRC');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.socket?.write('QUIT :Goodbye\r\n');
    this.socket?.destroy();
    this.connected = false;
    logger.info('IRC disconnected');
  }

  async sendMessage(userId: string, content: string): Promise<void> {
    // userId is channel name for IRC
    const lines = content.split('\n').filter(Boolean);
    for (const line of lines) {
      // Truncate to IRC's 512 byte limit
      const truncated = line.slice(0, 450);
      this.socket?.write(`PRIVMSG ${userId} :${truncated}\r\n`);
    }
  }

  async getUser(userId: string): Promise<ChannelUser | null> {
    return { id: userId, name: userId };
  }

  async getMe(): Promise<ChannelBot | null> {
    return { id: this.config.nick, name: this.config.nick };
  }

  private handleLine(line: string): void {
    if (!line) return;

    // Handle PING/PONG
    if (line.startsWith('PING')) {
      const server = line.slice(5);
      this.socket?.write(`PONG ${server}\r\n`);
      return;
    }

    // Check for successful connection
    if (line.includes('001') && !this.connected) {
      this.connected = true;
      // Join configured channels
      for (const channel of this.config.channels) {
        this.socket?.write(`JOIN ${channel}\r\n`);
      }
      this.emit('ready');
      logger.info({ channels: this.config.channels }, 'IRC connected and joined channels');
      return;
    }

    // Parse PRIVMSG
    const match = line.match(/^:(\S+)!\S+ PRIVMSG (\S+) :(.+)$/);
    if (match) {
      const [, nick, target, message] = match;

      // Ignore own messages
      if (nick === this.config.nick) return;

      const channelMessage: ChannelMessage = {
        id: `irc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        content: message,
        author: { id: nick, name: nick },
        channel: target,
        timestamp: new Date(),
      };
      this.emit('message', channelMessage);
    }
  }
}

export function createIRCChannel(id: string, name: string, config: IRCConfig): IRCChannel {
  return new IRCChannel(id, name, config);
}
