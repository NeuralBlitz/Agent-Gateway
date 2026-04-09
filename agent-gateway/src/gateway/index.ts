import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';
import type { Channel } from '../channels/index.js';
import type { Provider } from '../providers/index.js';
import type { Agent } from '../agents/index.js';
import type { GatewayConfig } from '../config/index.js';

export interface GatewayOptions {
  host: string;
  port: number;
  ssl?: {
    key: string;
    cert: string;
  };
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
  /** Full config object (optional, for metadata) */
  config?: GatewayConfig;
}

export interface Session {
  id: string;
  channel: string;
  userId: string;
  provider: string;
  agent?: Agent;
  createdAt: Date;
  metadata: Record<string, any>;
}

export interface Message {
  id: string;
  sessionId: string;
  channel: string;
  userId: string;
  content: string;
  role: 'user' | 'assistant' | 'system';
  timestamp: Date;
  metadata?: Record<string, any>;
}

export class Gateway extends EventEmitter {
  private options: GatewayOptions;
  private sessions: Map<string, Session> = new Map();
  private channels: Map<string, Channel> = new Map();
  private providers: Map<string, Provider> = new Map();
  private agents: Map<string, Agent> = new Map();
  private isRunning: boolean = false;

  constructor(options: GatewayOptions) {
    super();
    this.options = options;
  }

  get host(): string { return this.options.host; }
  get port(): number { return this.options.port; }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Gateway is already running');
    }

    logger.info(`Starting gateway on ${this.options.host}:${this.options.port}`);

    this.isRunning = true;
    this.emit('started');
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Gateway is not running');
    }

    logger.info('Stopping gateway');
    
    for (const channel of this.channels.values()) {
      await channel.disconnect();
    }
    
    this.sessions.clear();
    this.isRunning = false;
    this.emit('stopped');
  }

  registerChannel(id: string, channel: Channel): void {
    this.channels.set(id, channel);
    channel.on('message', (message: Message) => this.handleMessage(message));
    logger.info(`Registered channel: ${id}`);
  }

  registerProvider(id: string, provider: Provider): void {
    this.providers.set(id, provider);
    logger.info(`Registered provider: ${id}`);
  }

  registerAgent(id: string, agent: Agent): void {
    this.agents.set(id, agent);
    logger.info(`Registered agent: ${id}`);
  }

  getAgent(id: string): Agent | undefined {
    return this.agents.get(id);
  }

  /** Find or create a session key for channel+userId */
  findOrCreateSession(channelId: string, userId: string, providerId: string, createFn: () => Session): Session {
    // Look up existing session by channel+userId
    for (const session of this.sessions.values()) {
      if (session.channel === channelId && session.userId === userId) {
        return session;
      }
    }
    // Create new
    const session = createFn();
    this.sessions.set(session.id, session);
    return session;
  }

  createSession(channelId: string, userId: string, providerId: string): Session {
    const session: Session = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channel: channelId,
      userId,
      provider: providerId,
      createdAt: new Date(),
      metadata: {},
    };
    
    this.sessions.set(session.id, session);
    logger.debug(`Created session: ${session.id}`);
    
    return session;
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  deleteSession(id: string): boolean {
    const deleted = this.sessions.delete(id);
    if (deleted) {
      logger.debug(`Deleted session: ${id}`);
    }
    return deleted;
  }

  private async handleMessage(message: Message): Promise<void> {
    const session = this.sessions.get(message.sessionId);
    if (!session) {
      logger.warn(`Message for unknown session: ${message.sessionId}`);
      return;
    }

    this.emit('message', message, session);
  }

  getChannels(): Map<string, Channel> {
    return this.channels;
  }

  getProviders(): Map<string, Provider> {
    return this.providers;
  }

  isHealthy(): boolean {
    return this.isRunning;
  }
}

export function createGateway(options: GatewayOptions): Gateway {
  return new Gateway(options);
}

// Re-export for backwards compatibility
export type { GatewayConfig } from '../config/index.js';