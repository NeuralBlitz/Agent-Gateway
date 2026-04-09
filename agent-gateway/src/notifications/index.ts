/**
 * Enterprise Notification System
 * Multi-channel notifications (email, Slack, webhook, SMS) for system events,
 * alerts, and operational updates.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export type NotificationChannel = 'email' | 'slack' | 'webhook' | 'sms' | 'pagerduty';

export interface NotificationRecipient {
  channel: NotificationChannel;
  address: string; // email, webhook URL, phone number, etc.
  metadata?: Record<string, any>;
}

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  recipients: NotificationRecipient[];
  data?: Record<string, any>;
  createdAt: number;
  delivered: boolean;
  deliveryErrors: Array<{ channel: string; address: string; error: string }>;
}

export interface NotificationConfig {
  /** Default recipients for all notifications */
  defaultRecipients?: NotificationRecipient[];
  /** Rate limit: max notifications per minute */
  rateLimitPerMinute?: number;
  /** Quiet hours (don't send non-critical notifications) */
  quietHours?: { start: number; end: number }; // e.g., { start: 22, end: 7 }
  /** Deduplication window (ms) — don't send duplicate notifications */
  dedupWindowMs?: number;
  /** Max notifications to keep in memory */
  maxNotifications?: number;
}

export class NotificationSystem extends EventEmitter {
  private config: Required<NotificationConfig>;
  private notifications: Notification[] = [];
  private recentHashes: Map<string, number> = new Map();
  private maxNotifications: number;

  constructor(config: NotificationConfig = {}) {
    super();
    const maxNotifications = config.maxNotifications || 10000;
    this.config = {
      defaultRecipients: config.defaultRecipients || [],
      rateLimitPerMinute: config.rateLimitPerMinute || 60,
      quietHours: config.quietHours || { start: 0, end: 0 },
      dedupWindowMs: config.dedupWindowMs || 5 * 60 * 1000,
      maxNotifications,
    };
    this.maxNotifications = maxNotifications;
  }

  /** Send a notification */
  async notify(
    type: Notification['type'],
    title: string,
    message: string,
    recipients?: NotificationRecipient[],
    data?: Record<string, any>,
  ): Promise<Notification> {
    // Check quiet hours
    if (!this.isAllowedToSend(type)) {
      logger.debug({ type, title }, 'Notification suppressed (quiet hours)');
      return this.createNotification(type, title, message, [], data);
    }

    // Check deduplication
    const hash = this.hashNotification(type, title, message);
    if (this.isDuplicate(hash)) {
      logger.debug({ type, title }, 'Notification suppressed (duplicate)');
      return this.createNotification(type, title, message, [], data);
    }

    const targets = recipients || this.config.defaultRecipients;
    const notification = this.createNotification(type, title, message, targets, data);

    // Deliver to each recipient
    for (const recipient of targets) {
      try {
        await this.deliver(notification, recipient);
        notification.delivered = true;
      } catch (err: any) {
        notification.deliveryErrors.push({
          channel: recipient.channel,
          address: recipient.address,
          error: err.message,
        });
        logger.error({ recipient, err }, 'Failed to deliver notification');
      }
    }

    this.notifications.push(notification);
    if (this.notifications.length > this.maxNotifications) {
      this.notifications.shift();
    }
    this.recentHashes.set(hash, Date.now());

    this.emit('notification:sent', notification);
    return notification;
  }

  /** Send an info notification */
  async info(title: string, message: string, recipients?: NotificationRecipient[]): Promise<Notification> {
    return this.notify('info', title, message, recipients);
  }

  /** Send a warning notification */
  async warning(title: string, message: string, recipients?: NotificationRecipient[]): Promise<Notification> {
    return this.notify('warning', title, message, recipients);
  }

  /** Send an error notification */
  async error(title: string, message: string, recipients?: NotificationRecipient[]): Promise<Notification> {
    return this.notify('error', title, message, recipients);
  }

  /** Send a critical notification (always sent, even during quiet hours) */
  async critical(title: string, message: string, recipients?: NotificationRecipient[]): Promise<Notification> {
    return this.notify('critical', title, message, recipients);
  }

  /** Get recent notifications */
  getRecent(limit: number = 50): Notification[] {
    return this.notifications.slice(-limit);
  }

  /** Get notification stats */
  getStats(): {
    total: number;
    byType: Record<string, number>;
    deliveryErrors: number;
  } {
    const byType: Record<string, number> = {};
    let deliveryErrors = 0;

    for (const n of this.notifications) {
      byType[n.type] = (byType[n.type] || 0) + 1;
      deliveryErrors += n.deliveryErrors.length;
    }

    return { total: this.notifications.length, byType, deliveryErrors };
  }

  /** Create a notification object */
  private createNotification(
    type: Notification['type'],
    title: string,
    message: string,
    recipients: NotificationRecipient[],
    data?: Record<string, any>,
  ): Notification {
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      message,
      recipients,
      data,
      createdAt: Date.now(),
      delivered: false,
      deliveryErrors: [],
    };
  }

  /** Deliver a notification to a specific recipient */
  private async deliver(notification: Notification, recipient: NotificationRecipient): Promise<void> {
    const payload = {
      type: notification.type,
      title: notification.title,
      message: notification.message,
      timestamp: new Date(notification.createdAt).toISOString(),
      data: notification.data,
    };

    switch (recipient.channel) {
      case 'webhook':
        await this.deliverWebhook(recipient.address, payload);
        break;
      case 'slack':
        await this.deliverSlack(recipient.address, payload);
        break;
      case 'email':
        // Email would require an SMTP client — log for now
        logger.info({ to: recipient.address, ...payload }, 'Email notification (SMTP not configured)');
        break;
      case 'sms':
      case 'pagerduty':
        // Would require external service integration
        logger.info({ channel: recipient.channel, to: recipient.address, ...payload }, 'Notification (integration not configured)');
        break;
      default:
        throw new Error(`Unknown notification channel: ${recipient.channel}`);
    }
  }

  private async deliverWebhook(url: string, payload: any): Promise<void> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error(`Webhook delivery failed: HTTP ${response.status}`);
    }
  }

  private async deliverSlack(webhookUrl: string, payload: any): Promise<void> {
    const colorMap: Record<string, string> = {
      info: '#36a64f',
      warning: '#ffaa00',
      error: '#ff0000',
      critical: '#cc0000',
    };

    const slackPayload = {
      attachments: [
        {
          color: colorMap[payload.type] || '#888888',
          title: payload.title,
          text: payload.message,
          ts: Math.floor(new Date(payload.timestamp).getTime() / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackPayload),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      throw new Error(`Slack delivery failed: HTTP ${response.status}`);
    }
  }

  /** Check if notifications are allowed during quiet hours */
  private isAllowedToSend(type: Notification['type']): boolean {
    if (type === 'critical') return true;

    const qh = this.config.quietHours;
    if (qh.start === 0 && qh.end === 0) return true; // No quiet hours

    const hour = new Date().getHours();
    if (qh.start > qh.end) {
      // e.g., 22:00 - 07:00
      return hour < qh.end || hour >= qh.start;
    } else {
      // e.g., 09:00 - 17:00 (quiet during work hours?)
      return hour < qh.start || hour >= qh.end;
    }
  }

  /** Check for duplicate notifications */
  private isDuplicate(hash: string): boolean {
    const lastSent = this.recentHashes.get(hash);
    if (!lastSent) return false;
    return Date.now() - lastSent < this.config.dedupWindowMs;
  }

  /** Generate a hash for deduplication */
  private hashNotification(type: string, title: string, message: string): string {
    return `${type}:${title}:${message.slice(0, 100)}`;
  }

  /** Cleanup old hashes */
  cleanup(): void {
    const now = Date.now();
    for (const [hash, timestamp] of this.recentHashes) {
      if (now - timestamp > this.config.dedupWindowMs) {
        this.recentHashes.delete(hash);
      }
    }
  }
}

export function createNotificationSystem(config?: NotificationConfig): NotificationSystem {
  return new NotificationSystem(config);
}
