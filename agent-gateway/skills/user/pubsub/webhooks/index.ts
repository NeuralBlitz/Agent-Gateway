export interface WebhookEvent {
  id: string;
  event: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface WebhookConfig {
  url: string;
  events: string[];
  secret?: string;
  retryPolicy?: RetryPolicy;
  headers?: Record<string, string>;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export class WebhookManager {
  private webhooks = new Map<string, WebhookConfig>();
  private eventQueue: WebhookEvent[] = [];
  private processing = false;

  registerWebhook(id: string, config: WebhookConfig): void {
    this.webhooks.set(id, config);
  }

  unregisterWebhook(id: string): boolean {
    return this.webhooks.delete(id);
  }

  async trigger(event: string, data: Record<string, unknown>): Promise<void> {
    const webhookEvent: WebhookEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      event,
      timestamp: Date.now(),
      data,
    };

    const webhooks = Array.from(this.webhooks.values()).filter(w =>
      w.events.includes(event) || w.events.includes('*')
    );

    const promises = webhooks.map(webhook => this.sendWebhook(webhook, webhookEvent));
    await Promise.allSettled(promises);
  }

  private async sendWebhook(webhook: WebhookConfig, event: WebhookEvent): Promise<void> {
    const payload = JSON.stringify(event);
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Event': event.event,
      'X-Webhook-Id': event.id,
      ...webhook.headers,
    };

    if (webhook.secret) {
      const signature = this.generateSignature(payload, webhook.secret);
      headers['X-Webhook-Signature'] = signature;
    }

    const maxAttempts = webhook.retryPolicy?.maxAttempts ?? 3;
    let delay = webhook.retryPolicy?.initialDelayMs ?? 1000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: payload,
        });

        if (response.ok) {
          return;
        }

        console.error(`Webhook failed with status ${response.status}`);
      } catch (error) {
        console.error(`Webhook error:`, error);
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= webhook.retryPolicy?.backoffMultiplier ?? 2;
      }
    }
  }

  private generateSignature(payload: string, secret: string): string {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(payload);
    
    return 'sha256=' + btoa(String.fromCharCode(...new Uint8Array(
      await crypto.subtle.sign('HMAC', keyData, messageData)
    )));
  }

  getRegisteredWebhooks(): Map<string, WebhookConfig> {
    return new Map(this.webhooks);
  }
}

export const webhookEvents = {
  AGENT_CREATED: 'agent.created',
  AGENT_DELETED: 'agent.deleted',
  AGENT_TASK_STARTED: 'agent.task.started',
  AGENT_TASK_COMPLETED: 'agent.task.completed',
  CAPABILITY_GRANTED: 'capability.granted',
  CAPABILITY_REVOKED: 'capability.revoked',
  SYSTEM_ERROR: 'system.error',
  SYSTEM_READY: 'system.ready',
  BACKUP_COMPLETED: 'backup.completed',
  SECURITY_VIOLATION: 'security.violation',
};
