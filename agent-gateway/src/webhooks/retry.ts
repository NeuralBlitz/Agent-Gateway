/**
 * Enterprise Webhook Retry System
 * Reliable delivery with exponential backoff, jitter, and dead letter queues.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface WebhookDelivery {
  id: string;
  url: string;
  event: string;
  payload: any;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: number;
  status: 'pending' | 'delivering' | 'delivered' | 'failed' | 'dead';
  createdAt: number;
  lastError?: string;
  lastStatus?: number;
  headers?: Record<string, string>;
}

export interface RetryConfig {
  /** Max retry attempts (default: 5) */
  maxAttempts?: number;
  /** Base delay in ms (default: 1000) */
  baseDelayMs?: number;
  /** Max delay in ms (default: 60000) */
  maxDelayMs?: number;
  /** Jitter factor (0-1, default: 0.3) */
  jitter?: number;
  /** Request timeout in ms (default: 10000) */
  timeoutMs?: number;
  /** Dead letter callback */
  onDeadLetter?: (delivery: WebhookDelivery) => void;
}

export class WebhookRetrySystem extends EventEmitter {
  private config: Required<RetryConfig>;
  private queue: Map<string, WebhookDelivery> = new Map();
  private processing = false;
  private interval?: ReturnType<typeof setInterval>;
  private deadLetters: WebhookDelivery[] = [];

  constructor(config: RetryConfig = {}) {
    super();
    this.config = {
      maxAttempts: config.maxAttempts || 5,
      baseDelayMs: config.baseDelayMs || 1000,
      maxDelayMs: config.maxDelayMs || 60000,
      jitter: config.jitter ?? 0.3,
      timeoutMs: config.timeoutMs || 10000,
      onDeadLetter: config.onDeadLetter || (() => {}),
    };
  }

  /** Queue a webhook for delivery */
  queueDelivery(url: string, event: string, payload: any, headers?: Record<string, string>): WebhookDelivery {
    const delivery: WebhookDelivery = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      url,
      event,
      payload,
      attempts: 0,
      maxAttempts: this.config.maxAttempts,
      nextAttemptAt: Date.now(),
      status: 'pending',
      createdAt: Date.now(),
      headers,
    };

    this.queue.set(delivery.id, delivery);
    this.emit('queued', delivery);

    // Start processing if not running
    if (!this.processing) this.start();

    return delivery;
  }

  /** Start the retry processor */
  start(): void {
    if (this.interval) return;

    this.processing = true;
    this.interval = setInterval(() => this.processQueue(), 1000);
    logger.info('Webhook retry processor started');
  }

  /** Stop the retry processor */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    this.processing = false;
  }

  /** Process pending deliveries */
  private async processQueue(): Promise<void> {
    const now = Date.now();
    const due: WebhookDelivery[] = [];

    for (const delivery of this.queue.values()) {
      if (delivery.status === 'pending' || delivery.status === 'failed') {
        if (delivery.nextAttemptAt <= now) {
          due.push(delivery);
        }
      }
    }

    for (const delivery of due) {
      await this.attemptDelivery(delivery);
    }
  }

  /** Attempt a single delivery */
  private async attemptDelivery(delivery: WebhookDelivery): Promise<void> {
    delivery.attempts++;
    delivery.status = 'delivering';

    const attemptStart = Date.now();

    try {
      const response = await fetch(delivery.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': delivery.event,
          'X-Webhook-Delivery-Id': delivery.id,
          'X-Webhook-Attempt': String(delivery.attempts),
          'X-Webhook-Timestamp': String(delivery.createdAt),
          ...delivery.headers,
        },
        body: JSON.stringify(delivery.payload),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      delivery.lastStatus = response.status;

      if (response.ok) {
        delivery.status = 'delivered';
        this.queue.delete(delivery.id);
        const duration = Date.now() - attemptStart;
        logger.info(
          { deliveryId: delivery.id, url: delivery.url, attempt: delivery.attempts, duration },
          'Webhook delivered successfully',
        );
        this.emit('delivered', delivery);
        return;
      }

      delivery.lastError = `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(delivery.lastError);
    } catch (err: any) {
      delivery.lastError = err.message;

      if (delivery.attempts >= delivery.maxAttempts) {
        delivery.status = 'dead';
        this.queue.delete(delivery.id);
        this.deadLetters.push(delivery);
        logger.error(
          { deliveryId: delivery.id, url: delivery.url, attempts: delivery.attempts, error: err.message },
          'Webhook delivery failed - moved to dead letters',
        );
        this.emit('dead', delivery);
        this.config.onDeadLetter(delivery);
        return;
      }

      // Calculate next attempt with exponential backoff + jitter
      const baseDelay = this.config.baseDelayMs * Math.pow(2, delivery.attempts - 1);
      const jitter = baseDelay * this.config.jitter * (Math.random() * 2 - 1);
      const delay = Math.min(baseDelay + jitter, this.config.maxDelayMs);

      delivery.nextAttemptAt = Date.now() + delay;
      delivery.status = 'failed';

      logger.warn(
        { deliveryId: delivery.id, url: delivery.url, attempt: delivery.attempts, nextAttemptIn: Math.round(delay / 1000) },
        `Webhook delivery failed, retrying in ${Math.round(delay / 1000)}s`,
      );
      this.emit('retry', delivery);
    }
  }

  /** Get queue stats */
  getStats(): {
    pending: number;
    delivering: number;
    deadLetters: number;
    totalQueued: number;
  } {
    let pending = 0, delivering = 0;
    for (const d of this.queue.values()) {
      if (d.status === 'pending' || d.status === 'failed') pending++;
      if (d.status === 'delivering') delivering++;
    }
    return {
      pending,
      delivering,
      deadLetters: this.deadLetters.length,
      totalQueued: pending + delivering + this.deadLetters.length,
    };
  }

  /** Get dead letters */
  getDeadLetters(): WebhookDelivery[] {
    return [...this.deadLetters];
  }

  /** Retry a dead letter */
  retryDeadLetter(id: string): boolean {
    const idx = this.deadLetters.findIndex((d) => d.id === id);
    if (idx === -1) return false;

    const delivery = this.deadLetters.splice(idx, 1)[0];
    delivery.attempts = 0;
    delivery.status = 'pending';
    delivery.nextAttemptAt = Date.now();
    this.queue.set(delivery.id, delivery);
    logger.info({ deliveryId: id }, 'Dead letter retried');
    return true;
  }

  /** Clear all dead letters */
  clearDeadLetters(): number {
    const count = this.deadLetters.length;
    this.deadLetters = [];
    return count;
  }
}

export function createWebhookRetrySystem(config?: RetryConfig): WebhookRetrySystem {
  return new WebhookRetrySystem(config);
}
