import type { EventEmitter } from 'events';

export interface Channel extends EventEmitter {
  id: string;
  type: string;
  name: string;
  connected: boolean;
  config: Record<string, any>;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(userId: string, content: string): Promise<void>;
  getUser(userId: string): Promise<ChannelUser | null>;
  getMe(): Promise<ChannelBot | null>;
}

export interface ChannelUser {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

export interface ChannelBot {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
}

export interface ChannelMessage {
  id: string;
  content: string;
  author: ChannelUser;
  channel: string;
  timestamp: Date;
  raw?: any;
}

export type ChannelEventHandler = (message: ChannelMessage) => void;

export interface ChannelEvents {
  message: ChannelEventHandler;
  error: (error: Error) => void;
  ready: () => void;
}