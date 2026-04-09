import { logger } from '../infra/logger.js';
import type { Channel, ChannelMessage } from '../channels/index.js';
import type { Provider } from '../providers/index.js';
import type { Session, SessionManager } from '../sessions/index.js';
import type { Hooks } from '../hooks/index.js';
import type { BaseAgent } from '../agents/index.js';
import type { ChatMessage } from '../providers/types.js';
import type { ResponseCache } from '../cache/index.js';

export interface AutoReplyConfig {
  enabled: boolean;
  provider?: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  matchPatterns?: RegExp[];
  excludePatterns?: RegExp[];
  cooldown?: number;
}

export interface AutoReplyContext {
  channel: Channel;
  message: ChannelMessage;
  session: Session;
}

export class AutoReply {
  private config: AutoReplyConfig;
  private provider?: Provider;
  private sessionManager?: SessionManager;
  private hooks?: Hooks;
  /** Optional agent with tools for tool-calling support */
  private agent?: BaseAgent;
  /** Optional response cache to avoid redundant API calls */
  private responseCache?: ResponseCache;
  private lastReplyTime: Map<string, number> = new Map();

  constructor(config: AutoReplyConfig, provider?: Provider, sessionManager?: SessionManager, hooks?: Hooks, agent?: BaseAgent, responseCache?: ResponseCache) {
    this.config = config;
    this.provider = provider;
    this.sessionManager = sessionManager;
    this.hooks = hooks;
    this.agent = agent;
    this.responseCache = responseCache;
  }

  setAgent(agent: BaseAgent): void {
    this.agent = agent;
  }

  setResponseCache(cache: ResponseCache): void {
    this.responseCache = cache;
  }

  async handleMessage(channel: Channel, message: ChannelMessage): Promise<void> {
    if (!this.config.enabled) return;
    if (!this.provider) {
      logger.warn('AutoReply: No provider configured');
      return;
    }

    if (this.shouldIgnore(message)) {
      logger.debug(`AutoReply: Ignoring message ${message.id} due to pattern match`);
      return;
    }

    const cooldownKey = `${message.channel}:${message.author.id}`;
    const lastTime = this.lastReplyTime.get(cooldownKey) || 0;
    const now = Date.now();
    
    if (this.config.cooldown && now - lastTime < this.config.cooldown) {
      logger.debug(`AutoReply: Ignoring message ${message.id} due to cooldown`);
      return;
    }

    await this.hooks?.execute('beforeMessage', {
      channel: message.channel,
      userId: message.author.id,
      message,
      metadata: {},
    });

    let session: Session | undefined;
    if (this.sessionManager) {
      session = this.sessionManager.get(`${message.channel}:${message.author.id}`);
      if (!session) {
        session = await this.sessionManager.create({
          channel: message.channel,
          userId: message.author.id,
          provider: this.config.provider || 'default',
        });
      }
    }

    await session?.addMessage('user', message.content);

    const messages = session?.getMessages() || [{ role: 'user', content: message.content }];

    const systemPrompt = this.config.systemPrompt || 'You are a helpful AI assistant. Respond to user messages helpfully and concisely.';
    
    const fullMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages,
    ];

    try {
      let responseContent: string;

      if (this.agent && this.agent.tools.length > 0) {
        // Use agent's tool-calling loop
        const sessionMessages = session?.getMessages() || [];
        const result = await this.agent.run(sessionMessages as ChatMessage[]);
        responseContent = result.messages[result.messages.length - 1]?.content || '';

        // Add assistant response to session
        await session?.addMessage('assistant', responseContent);
      } else {
        // Plain chat without tools — check cache first
        const messages = session?.getMessages() || [{ role: 'user' as const, content: message.content }];
        const systemPrompt = this.config.systemPrompt || 'You are a helpful AI assistant. Respond to user messages helpfully and concisely.';
        const fullMessages = [
          { role: 'system' as const, content: systemPrompt },
          ...messages,
        ];

        // Try cache lookup
        const cached = await this.responseCache?.get(fullMessages, this.provider.id, 1.0);
        if (cached) {
          responseContent = cached.content;
          logger.debug('AutoReply: served from response cache');
        } else {
          const response = await this.provider!.chat(fullMessages);
          responseContent = response.content;

          // Cache the response
          await this.responseCache?.set(fullMessages, this.provider.id, 1.0, response);
        }

        await session?.addMessage('assistant', responseContent);
      }

      await this.hooks?.execute('afterResponse', {
        channel: message.channel,
        userId: message.author.id,
        message,
        response: responseContent,
        metadata: {},
      });

      await channel.sendMessage(message.author.id, responseContent);

      this.lastReplyTime.set(cooldownKey, now);

      logger.debug(`AutoReply: Responded to ${message.author.id} in ${message.channel}`);
    } catch (error: any) {
      logger.error(`AutoReply: Failed to generate response: ${error.message}`);
      await this.hooks?.execute('onError', {
        channel: message.channel,
        userId: message.author.id,
        message,
        error,
        metadata: {},
      });
    }
  }

  private shouldIgnore(message: ChannelMessage): boolean {
    if (this.config.excludePatterns) {
      for (const pattern of this.config.excludePatterns) {
        if (pattern.test(message.content)) {
          return true;
        }
      }
    }

    if (this.config.matchPatterns && this.config.matchPatterns.length > 0) {
      for (const pattern of this.config.matchPatterns) {
        if (pattern.test(message.content)) {
          return false;
        }
      }
      return true;
    }

    return false;
  }

  setProvider(provider: Provider): void {
    this.provider = provider;
  }

  setSessionManager(sessionManager: SessionManager): void {
    this.sessionManager = sessionManager;
  }

  setHooks(hooks: Hooks): void {
    this.hooks = hooks;
  }

  enable(): void {
    this.config.enabled = true;
    logger.info('AutoReply enabled');
  }

  disable(): void {
    this.config.enabled = false;
    logger.info('AutoReply disabled');
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }

  updateConfig(config: Partial<AutoReplyConfig>): void {
    Object.assign(this.config, config);
  }
}

export function createAutoReply(config: AutoReplyConfig, provider?: Provider, sessionManager?: SessionManager, hooks?: Hooks): AutoReply {
  return new AutoReply(config, provider, sessionManager, hooks);
}