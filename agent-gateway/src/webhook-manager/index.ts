/**
 * Enterprise Webhook Manager
 * Manage outgoing webhook subscriptions with delivery tracking,
 * retry logic, signature verification, and event filtering.
 */

import { EventEmitter } from 'events';
import { randomUUID, createHmac } from 'crypto';
import { logger } from '../infra/index.js';

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret: string;
  active: boolean;
  createdAt: number;
  metadata?: Record<string, any>;
  headers?: Record<string, string>;
  maxRetries?: number;
  timeout?: number;
}

export interface WebhookDelivery {
  id: string;
  subscriptionId: string;
  event: string;
  payload: any;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  lastAttemptAt?: number;
  lastError?: string;
  responseStatus?: number;
  createdAt: number;
}

export interface WebhookManagerConfig {
  /** Default max retries */
  maxRetries?: number;
  /** Default timeout (ms) */
  timeout?: number;
  /** Delivery history size per subscription */
  historySize?: number;
}

export class WebhookManager extends EventEmitter {
  private config: Required<WebhookManagerConfig>;
  private subscriptions: Map<string, WebhookSubscription> = new Map();
  private deliveries: Map<string, WebhookDelivery[]> = new Map();

  constructor(config: WebhookManagerConfig = {}) {
    super();
    this.config = {
      maxRetries: config.maxRetries || 3,
      timeout: config.timeout || 10000,
      historySize: config.historySize || 100,
    };
  }

  /** Create a webhook subscription */
  createSubscription(url: string, events: string[], secret?: string, metadata?: Record<string, any>): WebhookSubscription {
    const subscription: WebhookSubscription = {
      id: randomUUID(),
      url,
      events,
      secret: secret || randomUUID(),
      active: true,
      createdAt: Date.now(),
      metadata,
      maxRetries: this.config.maxRetries,
      timeout: this.config.timeout,
    };

    this.subscriptions.set(subscription.id, subscription);
    this.deliveries.set(subscription.id, []);

    logger.info({ subscriptionId: subscription.id, url, events }, 'Webhook subscription created');
    this.emit('subscription:created', subscription);
    return subscription;
  }

  /** Delete a webhook subscription */
  deleteSubscription(id: string): boolean {
    const deleted = this.subscriptions.delete(id);
    this.deliveries.delete(id);
    if (deleted) logger.info({ subscriptionId: id }, 'Webhook subscription deleted');
    return deleted;
  }

  /** List subscriptions */
  listSubscriptions(event?: string): WebhookSubscription[] {
    let subs = Array.from(this.subscriptions.values());
    if (event) subs = subs.filter((s) => s.events.includes(event) || s.events.includes('*'));
    return subs;
  }

  /** Send a webhook event */
  async sendEvent(event: string, payload: any): Promise<WebhookDelivery[]> {
    const subscriptions = this.listSubscriptions(event);
    const deliveries: WebhookDelivery[] = [];

    for (const sub of subscriptions) {
      if (!sub.active) continue;

      const delivery: WebhookDelivery = {
        id: randomUUID(),
        subscriptionId: sub.id,
        event,
        payload,
        status: 'pending',
        attempts: 0,
        createdAt: Date.now(),
      };

      deliveries.push(delivery);

      // Deliver asynchronously
      this.deliver(sub, delivery).catch((err) => {
        logger.error({ deliveryId: delivery.id, err }, 'Webhook delivery failed');
      });
    }

    return deliveries;
  }

  /** Deliver a webhook */
  private async deliver(subscription: WebhookSubscription, delivery: WebhookDelivery): Promise<void> {
    const history = this.deliveries.get(subscription.id) || [];

    for (let attempt = 1; attempt <= (subscription.maxRetries || 3); attempt++) {
      delivery.attempts = attempt;
      delivery.status = attempt > 1 ? 'retrying' : 'pending';
      delivery.lastAttemptAt = Date.now();

      try {
        const signature = this.createSignature(subscription.secret, delivery);

        const response = await fetch(subscription.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Event': delivery.event,
            'X-Webhook-Delivery-Id': delivery.id,
            'X-Webhook-Signature': signature,
            'X-Webhook-Timestamp': String(delivery.createdAt),
            ...subscription.headers,
          },
          body: JSON.stringify({
            id: delivery.id,
            event: delivery.event,
            timestamp: delivery.createdAt,
            data: delivery.payload,
          }),
          signal: AbortSignal.timeout(subscription.timeout || 10000),
        });

        delivery.responseStatus = response.status;

        if (response.ok) {
          delivery.status = 'delivered';
          history.push(delivery);
          this.trimHistory(history);
          this.emit('delivery:success', delivery);
          return;
        }

        delivery.lastError = `HTTP ${response.status}`;
      } catch (err: any) {
        delivery.lastError = err.message;
      }

      // Wait before retry
      if (attempt < (subscription.maxRetries || 3)) {
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    delivery.status = 'failed';
    history.push(delivery);
    this.trimHistory(history);
    this.emit('delivery:failed', delivery);
    logger.error({ deliveryId: delivery.id, url: subscription.url }, 'Webhook delivery failed after all retries');
  }

  /** Create HMAC signature */
  private createSignature(secret: string, delivery: WebhookDelivery): string {
    const payload = `${delivery.id}.${delivery.event}.${delivery.createdAt}.${JSON.stringify(delivery.payload)}`;
    return createHmac('sha256', secret).update(payload).digest('hex');
  }

  /** Verify an incoming webhook signature */
  static verifySignature(secret: string, payload: string, signature: string): boolean {
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    return createHmac('sha256', secret).update(payload).digest('hex') === signature;
  }

  /** Trim delivery history */
  private trimHistory(history: WebhookDelivery[]): void {
    while (history.length > this.config.historySize) {
      history.shift();
    }
  }

  /** Get delivery history */
  getDeliveryHistory(subscriptionId: string, limit: number = 20): WebhookDelivery[] {
    const history = this.deliveries.get(subscriptionId) || [];
    return history.slice(-limit);
  }

  /** Get stats */
  getStats(): {
    totalSubscriptions: number;
    activeSubscriptions: number;
    totalDeliveries: number;
    successfulDeliveries: number;
    failedDeliveries: number;
  } {
    let totalDeliveries = 0;
    let successfulDeliveries = 0;
    let failedDeliveries = 0;

    for (const [, history] of this.deliveries) {
      totalDeliveries += history.length;
      successfulDeliveries += history.filter((d) => d.status === 'delivered').length;
      failedDeliveries += history.filter((d) => d.status === 'failed').length;
    }

    const subs = Array.from(this.subscriptions.values());

    return {
      totalSubscriptions: subs.length,
      activeSubscriptions: subs.filter((s) => s.active).length,
      totalDeliveries,
      successfulDeliveries,
      failedDeliveries,
    };
  }
}

export function createWebhookManager(config?: WebhookManagerConfig): WebhookManager {
  return new WebhookManager(config);
}
