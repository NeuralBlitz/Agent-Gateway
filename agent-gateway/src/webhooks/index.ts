import { createServer, Server, IncomingMessage, ServerResponse } from 'http';
import { logger } from '../infra/logger.js';
import { EventEmitter } from 'events';

export interface WebhookConfig {
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: WebhookHandler;
  secret?: string;
}

export type WebhookHandler = (request: IncomingMessage, body: any, headers: Record<string, string>) => Promise<any>;

export interface WebhookServerOptions {
  port: number;
  host?: string;
  secret?: string;
  onRequest?: (req: IncomingMessage) => boolean;
  onResponse?: (req: IncomingMessage, res: ServerResponse) => void;
}

export class WebhookServer extends EventEmitter {
  private server?: Server;
  private webhooks: Map<string, WebhookConfig> = new Map();
  private options: WebhookServerOptions;
  private isRunning: boolean = false;

  constructor(options: WebhookServerOptions) {
    super();
    this.options = options;
  }

  register(config: WebhookConfig): void {
    this.webhooks.set(config.path, config);
    logger.info(`Registered webhook: ${config.method || 'POST'} ${config.path}`);
  }

  registerTelegram(botToken: string, secretToken?: string): void {
    this.register({
      path: `/webhook/telegram/${botToken.split(':')[0]}`,
      method: 'POST',
      handler: async (req, body) => {
        if (secretToken) {
          const signature = req.headers['x-telegram-bot-api-secret-token'];
          if (signature !== secretToken) {
            throw new Error('Invalid secret token');
          }
        }
        return body;
      },
      secret: secretToken,
    });
  }

  registerDiscord(botToken: string): void {
    this.register({
      path: '/webhook/discord',
      method: 'POST',
      handler: async (req, body) => {
        if (body.type === 1) {
          return { type: 1 };
        }
        return body;
      },
    });
  }

  registerSlack(signingSecret: string): void {
    this.register({
      path: '/webhook/slack',
      method: 'POST',
      handler: async (req, body) => {
        return body;
      },
      secret: signingSecret,
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Webhook server already running');
    }

    this.server = createServer(async (req, res) => {
      try {
        this.emit('request', req);

        if (this.options.onRequest && !this.options.onRequest(req)) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        const path = req.url || '/';
        const webhook = this.webhooks.get(path);

        if (!webhook) {
          res.writeHead(404);
          res.end('Not Found');
          return;
        }

        if (webhook.method && req.method !== webhook.method) {
          res.writeHead(405);
          res.end('Method Not Allowed');
          return;
        }

        let body: any = '';
        for await (const chunk of req) {
          body += chunk;
        }

        if (body) {
          try {
            body = JSON.parse(body);
          } catch {}
        }

        const headers: Record<string, string> = {};
        for (const [key, value] of Object.entries(req.headers)) {
          if (typeof value === 'string') {
            headers[key] = value;
          } else if (Array.isArray(value)) {
            headers[key] = value.join(', ');
          }
        }

        const result = await webhook.handler(req, body, headers);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(result));

        this.emit('webhook', path, body);
      } catch (error: any) {
        logger.error(`Webhook error: ${error.message}`);
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });

    return new Promise((resolve) => {
      this.server!.listen(this.options.port, this.options.host || '0.0.0.0', () => {
        this.isRunning = true;
        logger.info(`Webhook server listening on ${this.options.host || '0.0.0.0'}:${this.options.port}`);
        resolve();
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning || !this.server) {
      return;
    }

    return new Promise((resolve) => {
      this.server!.close(() => {
        this.isRunning = false;
        logger.info('Webhook server stopped');
        resolve();
      });
    });
  }

  getWebhook(path: string): WebhookConfig | undefined {
    return this.webhooks.get(path);
  }

  listWebhooks(): string[] {
    return Array.from(this.webhooks.keys());
  }

  unregister(path: string): boolean {
    return this.webhooks.delete(path);
  }
}

export function createWebhookServer(options: WebhookServerOptions): WebhookServer {
  return new WebhookServer(options);
}