// @ts-nocheck
/**
 * Enterprise Message Bus
 * In-process pub/sub with persistence, replay, and dead letter handling
 * for decoupled inter-module communication.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { logger } from '../infra/index.js';

export interface BusMessage {
  id: string;
  topic: string;
  payload: any;
  headers: Record<string, string>;
  timestamp: number;
  source?: string;
  correlationId?: string;
}

export type MessageHandler = (message: BusMessage) => void | Promise<void>;

export class MessageBus extends EventEmitter {
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private history: BusMessage[] = [];
  private maxHistory: number;
  private deadLetters: BusMessage[] = [];
  private maxDeadLetters: number;

  constructor(maxHistory: number = 10000, maxDeadLetters: number = 1000) {
    super();
    this.maxHistory = maxHistory;
    this.maxDeadLetters = maxDeadLetters;
  }

  /** Publish a message */
  async publish(topic: string, payload: any, headers: Record<string, string> = {}, source?: string): Promise<BusMessage> {
    const id = randomUUID();
    const message: BusMessage = {
      id,
      topic,
      payload,
      headers: { ...headers, 'x-message-id': id, 'x-timestamp': String(Date.now()) },
      timestamp: Date.now(),
      source,
      correlationId: headers['x-correlation-id'],
    };

    // Store in history
    this.history.push(message);
    if (this.history.length > this.maxHistory) this.history.shift();

    // Get handlers
    const topicHandlers = this.handlers.get(topic) || new Set();
    const wildcardHandlers = this.handlers.get('*') || new Set();
    const patternHandlers = this.getPatternHandlers(topic);

    const allHandlers = new Set([...topicHandlers, ...wildcardHandlers, ...patternHandlers]);

    // Deliver
    const errors: Error[] = [];
    for (const handler of allHandlers) {
      try {
        await handler(message);
      } catch (err: any) {
        errors.push(err);
        this.deadLetters.push({ ...message, headers: { ...message.headers, 'x-error': err.message } });
        if (this.deadLetters.length > this.maxDeadLetters) this.deadLetters.shift();
        logger.error({ topic, messageId: message.id, err }, 'Message handler failed');
      }
    }

    this.emit('message', message);
    this.emit(`message:${topic}`, message);

    if (errors.length > 0) {
      logger.warn({ topic, errors: errors.length }, `${errors.length} handler(s) failed for topic: ${topic}`);
    }

    return message;
  }

  /** Subscribe to a topic */
  subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(topic)) this.handlers.set(topic, new Set());
    this.handlers.get(topic)!.add(handler);

    logger.debug({ topic }, `Subscriber registered for: ${topic}`);

    // Return unsubscribe function
    return () => {
      const handlers = this.handlers.get(topic);
      if (handlers) handlers.delete(handler);
    };
  }

  /** Subscribe to all topics (wildcard) */
  subscribeAll(handler: MessageHandler): () => void {
    return this.subscribe('*', handler);
  }

  /** Get message history */
  getHistory(topic?: string, limit: number = 100): BusMessage[] {
    let messages = this.history.slice(-limit);
    if (topic) messages = messages.filter((m) => m.topic === topic);
    return messages;
  }

  /** Replay messages from history */
  async replay(topic: string, handler: MessageHandler, since?: number): Promise<number> {
    const messages = this.history.filter((m) => m.topic === topic && (!since || m.timestamp >= since));
    let count = 0;

    for (const message of messages) {
      try {
        await handler(message);
        count++;
      } catch (err: any) {
        logger.error({ messageId: message.id, err }, 'Replay handler failed');
      }
    }

    logger.info({ topic, count }, `Replayed ${count} messages for: ${topic}`);
    return count;
  }

  /** Get dead letters */
  getDeadLetters(limit: number = 50): BusMessage[] {
    return this.deadLetters.slice(-limit);
  }

  /** Retry a dead letter */
  async retryDeadLetter(message: BusMessage): Promise<boolean> {
    const idx = this.deadLetters.findIndex((m) => m.id === message.id);
    if (idx === -1) return false;

    this.deadLetters.splice(idx, 1);
    await this.publish(message.topic, message.payload, message.headers, message.source);
    return true;
  }

  /** Clear dead letters */
  clearDeadLetters(): number {
    const count = this.deadLetters.length;
    this.deadLetters = [];
    return count;
  }

  /** Get topic stats */
  getStats(): {
    topics: number;
    totalHandlers: number;
    historySize: number;
    deadLetterCount: number;
    byTopic: Record<string, number>;
  } {
    const byTopic: Record<string, number> = {};
    for (const msg of this.history) {
      byTopic[msg.topic] = (byTopic[msg.topic] || 0) + 1;
    }

    let totalHandlers = 0;
    for (const [, handlers] of this.handlers) {
      totalHandlers += handlers.size;
    }

    return {
      topics: this.handlers.size,
      totalHandlers,
      historySize: this.history.length,
      deadLetterCount: this.deadLetters.length,
      byTopic,
    };
  }

  private getPatternHandlers(topic: string): Set<MessageHandler> {
    const result = new Set<MessageHandler>();

    for (const [pattern, handlers] of this.handlers) {
      if (pattern.includes('*') || pattern.includes('?')) {
        const regex = new RegExp(`^${pattern.replace(/\*/g, '.*').replace(/\?/g, '.')}$`);
        if (regex.test(topic)) {
          for (const handler of handlers) result.add(handler);
        }
      }
    }

    return result;
  }
}

export function createMessageBus(maxHistory?: number, maxDeadLetters?: number): MessageBus {
  return new MessageBus(maxHistory, maxDeadLetters);
}
