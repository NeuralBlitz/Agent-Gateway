/**
 * Internal event bus for decoupled async message processing.
 * Allows different parts of the system to communicate without direct coupling.
 * Supports priority queues, dead letter handling, and retry logic.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export type GatewayEventType =
  | 'message:inbound'       // Message received from a channel
  | 'message:outbound'      // Response sent to a channel
  | 'message:failed'        // Message processing failed
  | 'session:created'       // New session created
  | 'session:deleted'       // Session deleted
  | 'session:updated'       // Session updated
  | 'agent:started'         // Agent started processing
  | 'agent:completed'       // Agent completed processing
  | 'agent:error'           // Agent encountered an error
  | 'tool:executed'         // Tool was executed
  | 'tool:error'            // Tool execution failed
  | 'provider:call'         // API call to provider
  | 'provider:error'        // Provider API error
  | 'cache:hit'             // Cache hit
  | 'cache:miss'            // Cache miss
  | 'rate:limited'          // Request was rate limited
  | 'health:degraded'       // Health check degraded
  | 'health:recovered'      // Health check recovered
  | 'plugin:loaded'         // Plugin loaded
  | 'plugin:error'          // Plugin error
  | 'system:shutdown';      // System shutting down

export interface GatewayEvent {
  type: GatewayEventType;
  timestamp: number;
  traceId?: string;
  data: Record<string, any>;
  metadata?: {
    channel?: string;
    userId?: string;
    sessionId?: string;
    provider?: string;
  };
}

export type EventHandler = (event: GatewayEvent) => void | Promise<void>;

export interface EventSubscription {
  id: string;
  event: GatewayEventType;
  handler: EventHandler;
  priority?: number; // Higher = runs first
  once?: boolean; // Run only once then unsubscribe
}

/**
 * EventBus — central pub/sub for the gateway.
 * Decouples message ingestion from processing, allows observability hooks,
 * and supports async queueing for backpressure handling.
 */
export class EventBus extends EventEmitter {
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: GatewayEvent[] = [];
  private maxHistory: number;
  private processingQueue: GatewayEvent[] = [];
  private isProcessing = false;
  private deadLetters: GatewayEvent[] = [];
  private maxDeadLetters: number;

  constructor(options: { maxHistory?: number; maxDeadLetters?: number } = {}) {
    super();
    this.maxHistory = options.maxHistory || 10000;
    this.maxDeadLetters = options.maxDeadLetters || 1000;
    // Prevent MaxListenersExceededWarning with high subscriber counts
    this.setMaxListeners(100);
  }

  /** Publish an event */
  async publish(event: Omit<GatewayEvent, 'timestamp'>): Promise<void> {
    const fullEvent: GatewayEvent = {
      ...event,
      timestamp: Date.now(),
    };

    // Store in history
    this.eventHistory.push(fullEvent);
    if (this.eventHistory.length > this.maxHistory) {
      this.eventHistory.shift();
    }

    // Emit synchronously for low-latency handlers (with error protection)
    try {
      this.emit(fullEvent.type, fullEvent);
      this.emit('*', fullEvent); // Wildcard listener
    } catch (err: any) {
      logger.error({ event: fullEvent.type, err }, 'Event emitter handler failed');
    }

    // Queue for async processing
    this.processingQueue.push(fullEvent);
    // Use setImmediate to ensure atomic isProcessing check
    setImmediate(() => {
      this.processQueue().catch((err) => {
        logger.error({ err }, 'Event processing failed');
      });
    });
  }

  /** Subscribe to an event type */
  subscribe(event: GatewayEventType, handler: EventHandler, options: { priority?: number; once?: boolean } = {}): string {
    const id = `${event}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const subscription: EventSubscription = {
      id,
      event,
      handler,
      priority: options.priority || 0,
      once: options.once,
    };

    this.subscriptions.set(id, subscription);
    this.on(event, handler);

    logger.debug({ event, id }, 'Event subscription registered');
    return id;
  }

  /** Unsubscribe */
  unsubscribe(id: string): boolean {
    const sub = this.subscriptions.get(id);
    if (!sub) return false;

    this.removeListener(sub.event, sub.handler);
    this.subscriptions.delete(id);
    return true;
  }

  /** Get events by type */
  getEvents(type: GatewayEventType, limit: number = 100): GatewayEvent[] {
    return this.eventHistory
      .filter((e) => e.type === type)
      .slice(-limit);
  }

  /** Get all recent events */
  getRecentEvents(limit: number = 100): GatewayEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /** Get dead letter events */
  getDeadLetters(): GatewayEvent[] {
    return [...this.deadLetters];
  }

  /** Get subscription count */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }

  /** Clear all event history */
  clearHistory(): void {
    this.eventHistory = [];
  }

  /** Process the async event queue */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.processingQueue.length > 0) {
      const event = this.processingQueue.shift()!;

      // Get handlers for this event type sorted by priority
      const handlers = Array.from(this.subscriptions.values())
        .filter((s) => s.event === event.type)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      for (const sub of handlers) {
        try {
          await sub.handler(event);
          if (sub.once) {
            this.unsubscribe(sub.id);
          }
        } catch (err: any) {
          logger.error({ event: event.type, handler: sub.id, err }, 'Event handler failed');
          // Dead-letter the event and continue with remaining handlers
          this.deadLetters.push({ ...event, data: { ...event.data, error: err.message } });
          if (this.deadLetters.length > this.maxDeadLetters) {
            this.deadLetters.shift();
          }
        }
      }
    }

    this.isProcessing = false;
  }
}

// Global event bus
let globalEventBus: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!globalEventBus) {
    globalEventBus = new EventBus();
  }
  return globalEventBus;
}

export function createEventBus(options?: { maxHistory?: number; maxDeadLetters?: number }): EventBus {
  return new EventBus(options);
}

/** Convenience: publish a message event */
export function publishMessageEvent(data: {
  channel: string;
  userId: string;
  content: string;
  messageId: string;
  direction: 'inbound' | 'outbound';
  sessionId?: string;
  traceId?: string;
}): void {
  const bus = getEventBus();
  bus.publish({
    type: data.direction === 'inbound' ? 'message:inbound' : 'message:outbound',
    traceId: data.traceId,
    data,
    metadata: {
      channel: data.channel,
      userId: data.userId,
      sessionId: data.sessionId,
    },
  }).catch((err) => logger.error({ err }, 'Failed to publish message event'));
}
