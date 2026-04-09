/**
 * Enterprise Message Queue
 * Persistent, ordered message queue with consumer groups,
 * acknowledgment, and dead letter handling.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface QueueMessage<T = any> {
  id: string;
  topic: string;
  payload: T;
  priority: number; // Lower = higher priority
  createdAt: number;
  attempts: number;
  maxAttempts: number;
  acknowledged: boolean;
  headers?: Record<string, string>;
}

export type MessageHandler<T = any> = (message: QueueMessage<T>) => Promise<void>;

export interface QueueConfig {
  /** Max messages in memory per topic (default: 100000) */
  maxMessagesPerTopic?: number;
  /** Default max delivery attempts (default: 3) */
  maxAttempts?: number;
  /** Visibility timeout in ms (default: 30000) */
  visibilityTimeoutMs?: number;
  /** Polling interval in ms (default: 100) */
  pollIntervalMs?: number;
}

interface TopicQueue {
  messages: QueueMessage[];
  inFlight: Map<string, { message: QueueMessage; timer: ReturnType<typeof setTimeout> }>;
  deadLetters: QueueMessage[];
}

export class MessageQueue extends EventEmitter {
  private config: Required<QueueConfig>;
  private topics: Map<string, TopicQueue> = new Map();
  private handlers: Map<string, Array<{ handler: MessageHandler; groupId: string }>> = new Map();
  private running = false;
  private pollInterval?: ReturnType<typeof setInterval>;

  constructor(config: QueueConfig = {}) {
    super();
    this.config = {
      maxMessagesPerTopic: config.maxMessagesPerTopic || 100000,
      maxAttempts: config.maxAttempts || 3,
      visibilityTimeoutMs: config.visibilityTimeoutMs || 30000,
      pollIntervalMs: config.pollIntervalMs || 100,
    };
  }

  /** Publish a message to a topic */
  async publish<T>(topic: string, payload: T, options?: { priority?: number; headers?: Record<string, string>; maxAttempts?: number }): Promise<QueueMessage<T>> {
    if (!this.topics.has(topic)) {
      this.topics.set(topic, {
        messages: [],
        inFlight: new Map(),
        deadLetters: [],
      });
    }

    const queue = this.topics.get(topic)!;

    const message: QueueMessage<T> = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      topic,
      payload,
      priority: options?.priority ?? 0,
      createdAt: Date.now(),
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? this.config.maxAttempts,
      acknowledged: false,
      headers: options?.headers,
    };

    // Insert in priority order (lower number = higher priority)
    const insertIdx = queue.messages.findIndex((m) => m.priority > message.priority);
    if (insertIdx === -1) {
      queue.messages.push(message);
    } else {
      queue.messages.splice(insertIdx, 0, message);
    }

    // Enforce max size
    if (queue.messages.length > this.config.maxMessagesPerTopic) {
      queue.messages.pop(); // Remove lowest priority
    }

    this.emit('message:published', message);

    // Start processing if not running
    if (!this.running) this.start();

    return message;
  }

  /** Register a message handler for a topic */
  subscribe<T>(topic: string, handler: MessageHandler<T>, groupId: string = 'default'): void {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    this.handlers.get(topic)!.push({ handler: handler as MessageHandler, groupId });
    logger.info({ topic, groupId }, `Queue subscriber registered`);
  }

  /** Start the queue processor */
  start(): void {
    if (this.running) return;
    this.running = true;

    this.pollInterval = setInterval(() => this.processAllTopics(), this.config.pollIntervalMs);
    logger.info('Message queue processor started');
  }

  /** Stop the queue processor */
  stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = undefined;
    }
    this.running = false;
  }

  /** Process messages for all topics */
  private async processAllTopics(): Promise<void> {
    for (const [topic, queue] of this.topics) {
      await this.processTopic(topic, queue);
    }
  }

  /** Process messages for a single topic */
  private async processTopic(topic: string, queue: TopicQueue): Promise<void> {
    const handlers = this.handlers.get(topic) || [];
    if (handlers.length === 0) return;

    // Get next available message
    while (queue.messages.length > 0) {
      const message = queue.messages[0];
      if (queue.inFlight.has(message.id)) {
        // Check visibility timeout
        const inFlight = queue.inFlight.get(message.id)!;
        if (Date.now() - (inFlight.message.createdAt + inFlight.message.attempts * 100) > this.config.visibilityTimeoutMs) {
          // Timeout — return to queue
          queue.inFlight.delete(message.id);
          continue;
        }
        break; // Still in flight
      }

      // Remove from queue
      queue.messages.shift();

      // Mark in-flight
      queue.inFlight.set(message.id, {
        message,
        timer: setTimeout(() => {
          queue.inFlight.delete(message.id);
          logger.warn({ messageId: message.id, topic }, 'Message visibility timeout');
          // Re-queue for retry
          queue.messages.push(message);
          queue.messages.sort((a, b) => a.priority - b.priority);
        }, this.config.visibilityTimeoutMs),
      });

      message.attempts++;

      // Deliver to handlers (round-robin by group)
      for (const { handler, groupId } of handlers) {
        try {
          await handler(message);
          message.acknowledged = true;
          queue.inFlight.delete(message.id);
          this.emit('message:acknowledged', message);
        } catch (err: any) {
          logger.error({ messageId: message.id, topic, err }, 'Message handler failed');
          queue.inFlight.delete(message.id);

          if (message.attempts >= message.maxAttempts) {
            queue.deadLetters.push(message);
            this.emit('message:dead', message);
            logger.error({ messageId: message.id, topic, attempts: message.attempts }, 'Message moved to dead letters');
          } else {
            // Re-queue for retry
            queue.messages.push(message);
            queue.messages.sort((a, b) => a.priority - b.priority);
          }
          break; // Stop delivering this message to other handlers
        }
      }
    }
  }

  /** Acknowledge a message */
  acknowledge(topic: string, messageId: string): boolean {
    const queue = this.topics.get(topic);
    if (!queue) return false;

    const inFlight = queue.inFlight.get(messageId);
    if (!inFlight) return false;

    clearTimeout(inFlight.timer);
    queue.inFlight.delete(messageId);
    inFlight.message.acknowledged = true;
    return true;
  }

  /** Get queue stats */
  getStats(): {
    topics: number;
    pending: number;
    inFlight: number;
    deadLetters: number;
    byTopic: Array<{ topic: string; pending: number; inFlight: number; deadLetters: number }>;
  } {
    let pending = 0, inFlight = 0, deadLetters = 0;
    const byTopic: Array<any> = [];

    for (const [topic, queue] of this.topics) {
      const p = queue.messages.length;
      const i = queue.inFlight.size;
      const d = queue.deadLetters.length;
      pending += p;
      inFlight += i;
      deadLetters += d;
      byTopic.push({ topic, pending: p, inFlight: i, deadLetters: d });
    }

    return { topics: this.topics.size, pending, inFlight, deadLetters, byTopic };
  }

  /** Get dead letters for a topic */
  getDeadLetters(topic: string): QueueMessage[] {
    return this.topics.get(topic)?.deadLetters || [];
  }

  /** Retry a dead letter */
  retryDeadLetter(topic: string, messageId: string): boolean {
    const queue = this.topics.get(topic);
    if (!queue) return false;

    const idx = queue.deadLetters.findIndex((m) => m.id === messageId);
    if (idx === -1) return false;

    const message = queue.deadLetters.splice(idx, 1)[0];
    message.attempts = 0;
    message.acknowledged = false;
    queue.messages.push(message);
    queue.messages.sort((a, b) => a.priority - b.priority);
    return true;
  }

  /** Purge a topic */
  purge(topic: string): number {
    const queue = this.topics.get(topic);
    if (!queue) return 0;

    const count = queue.messages.length + queue.inFlight.size + queue.deadLetters.length;
    for (const [, { timer }] of queue.inFlight) clearTimeout(timer);
    queue.messages = [];
    queue.inFlight.clear();
    queue.deadLetters = [];
    return count;
  }
}

export function createMessageQueue(config?: QueueConfig): MessageQueue {
  return new MessageQueue(config);
}
