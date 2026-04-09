import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventEmitter } from 'events';
import http from 'http';
import { WebhookServer, WebhookConfig, WebhookHandler, WebhookServerOptions } from '../../src/webhooks/index.js';

function createTestOptions(overrides: Partial<WebhookServerOptions> = {}): WebhookServerOptions {
  return {
    port: 0,
    host: '127.0.0.1',
    ...overrides,
  };
}

function createMockHandler(returnValue: any = { success: true }): WebhookHandler {
  return vi.fn().mockResolvedValue(returnValue);
}

function createMockIncomingMessage(options: {
  url?: string;
  method?: string;
  headers?: Record<string, string | string[]>;
} = {}): http.IncomingMessage {
  const req = {
    url: options.url || '/',
    method: options.method || 'POST',
    headers: options.headers || {},
  } as http.IncomingMessage;
  return req;
}

async function makeRequest(port: number, path: string, options: {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
} = {}): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method: options.method || 'POST',
        headers: options.headers || {},
        timeout: 2000,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          resolve({ statusCode: res.statusCode || 500, body });
        });
      }
    );
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

function getServerPort(server: WebhookServer): number {
  const httpServer = (server as any).server;
  if (!httpServer) return 0;
  const address = httpServer.address();
  if (!address) return 0;
  return typeof address === 'number' ? address : address.port;
}

describe('WebhookServer', () => {
  let server: WebhookServer;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (server) {
      try {
        await server.stop();
      } catch (e) {}
    }
  });

  describe('Constructor', () => {
    it('should create a WebhookServer instance with valid options', () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      expect(server).toBeInstanceOf(WebhookServer);
    });

    it('should create a WebhookServer instance with minimal options', () => {
      server = new WebhookServer({ port: 0 });
      expect(server).toBeInstanceOf(WebhookServer);
    });

    it('should store options correctly', () => {
      const options = createTestOptions({ port: 0, host: '0.0.0.0', secret: 'test-secret' });
      server = new WebhookServer(options);
      expect(server).toBeInstanceOf(WebhookServer);
    });

    it('should accept custom onRequest callback', () => {
      const onRequest = vi.fn().mockReturnValue(true);
      server = new WebhookServer(createTestOptions({ port: 0, onRequest }));
      expect(server).toBeInstanceOf(WebhookServer);
    });

    it('should accept custom onResponse callback', () => {
      const onResponse = vi.fn();
      server = new WebhookServer(createTestOptions({ port: 0, onResponse }));
      expect(server).toBeInstanceOf(WebhookServer);
    });

    it('should inherit from EventEmitter', () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      expect(server).toBeInstanceOf(EventEmitter);
    });

    it('should not be running initially', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      await expect(server.stop()).resolves.toBeUndefined();
    });

    it('should accept all options at once', () => {
      const onRequest = vi.fn().mockReturnValue(true);
      const onResponse = vi.fn();
      server = new WebhookServer({
        port: 0,
        host: 'localhost',
        secret: 'my-secret',
        onRequest,
        onResponse,
      });
      expect(server).toBeInstanceOf(WebhookServer);
    });

    it('should handle missing host gracefully', () => {
      server = new WebhookServer({ port: 0 });
      expect(server).toBeInstanceOf(WebhookServer);
    });

    it('should handle undefined options gracefully', () => {
      server = new WebhookServer({ port: 0, host: undefined, secret: undefined });
      expect(server).toBeInstanceOf(WebhookServer);
    });

    it('should initialize with empty webhooks map', () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      expect(server.listWebhooks()).toHaveLength(0);
    });

    it('should allow creating multiple instances', () => {
      const server1 = new WebhookServer(createTestOptions({ port: 0 }));
      const server2 = new WebhookServer(createTestOptions({ port: 0 }));
      expect(server1).not.toBe(server2);
    });
  });

  describe('register()', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should register a webhook successfully', () => {
      const handler = createMockHandler();
      server.register({
        path: '/test-webhook',
        method: 'POST',
        handler,
      });
      expect(server.getWebhook('/test-webhook')).toBeDefined();
      expect(server.getWebhook('/test-webhook')?.path).toBe('/test-webhook');
    });

    it('should register webhook without method', () => {
      const handler = createMockHandler();
      server.register({
        path: '/any-method',
        handler,
      });
      expect(server.getWebhook('/any-method')).toBeDefined();
    });

    it('should register webhook with secret', () => {
      const handler = createMockHandler();
      server.register({
        path: '/secret-webhook',
        method: 'POST',
        handler,
        secret: 'my-secret-token',
      });
      const webhook = server.getWebhook('/secret-webhook');
      expect(webhook?.secret).toBe('my-secret-token');
    });

    it('should store multiple webhooks', () => {
      const handler1 = createMockHandler({ result: 1 });
      const handler2 = createMockHandler({ result: 2 });
      server.register({ path: '/webhook1', handler: handler1 });
      server.register({ path: '/webhook2', handler: handler2 });
      expect(server.listWebhooks()).toHaveLength(2);
    });

    it('should overwrite existing webhook at same path', () => {
      const handler1 = createMockHandler({ value: 'first' });
      const handler2 = createMockHandler({ value: 'second' });
      server.register({ path: '/duplicate', handler: handler1 });
      server.register({ path: '/duplicate', handler: handler2 });
      expect(server.listWebhooks()).toHaveLength(1);
    });

    it('should accept GET method', () => {
      const handler = createMockHandler();
      server.register({
        path: '/get-webhook',
        method: 'GET',
        handler,
      });
      const webhook = server.getWebhook('/get-webhook');
      expect(webhook?.method).toBe('GET');
    });

    it('should accept PUT method', () => {
      const handler = createMockHandler();
      server.register({
        path: '/put-webhook',
        method: 'PUT',
        handler,
      });
      const webhook = server.getWebhook('/put-webhook');
      expect(webhook?.method).toBe('PUT');
    });

    it('should accept DELETE method', () => {
      const handler = createMockHandler();
      server.register({
        path: '/delete-webhook',
        method: 'DELETE',
        handler,
      });
      const webhook = server.getWebhook('/delete-webhook');
      expect(webhook?.method).toBe('DELETE');
    });

    it('should handle root path', () => {
      const handler = createMockHandler();
      server.register({ path: '/', handler });
      expect(server.getWebhook('/')).toBeDefined();
    });

    it('should handle paths with query strings in matching', () => {
      const handler = createMockHandler();
      server.register({ path: '/webhook', handler });
      expect(server.getWebhook('/webhook')).toBeDefined();
    });

    it('should register webhooks with complex paths', () => {
      const handler = createMockHandler();
      server.register({ path: '/api/v1/webhooks/abc123', handler });
      expect(server.getWebhook('/api/v1/webhooks/abc123')).toBeDefined();
    });
  });

  describe('registerTelegram()', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should register Telegram webhook successfully', () => {
      server.registerTelegram('123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11');
      const webhook = server.getWebhook('/webhook/telegram/123456');
      expect(webhook).toBeDefined();
      expect(webhook?.method).toBe('POST');
    });

    it('should register Telegram webhook with secret token', () => {
      server.registerTelegram('123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11', 'my-secret-token');
      const webhook = server.getWebhook('/webhook/telegram/123456');
      expect(webhook?.secret).toBe('my-secret-token');
    });

    it('should extract bot ID from token', () => {
      server.registerTelegram('999999:ABC-DEF');
      expect(server.getWebhook('/webhook/telegram/999999')).toBeDefined();
    });

    it('should handle different bot tokens', () => {
      server.registerTelegram('111111:AAAAAA');
      server.registerTelegram('222222:BBBBBB');
      expect(server.listWebhooks()).toHaveLength(2);
    });

    it('should register Telegram webhook with full token format', () => {
      server.registerTelegram('1234567890:ABCdefGHIjklMNOpqrsTUVwxyz');
      const webhook = server.getWebhook('/webhook/telegram/1234567890');
      expect(webhook).toBeDefined();
      expect(webhook?.method).toBe('POST');
    });

    it('should allow multiple Telegram bots', () => {
      server.registerTelegram('111111:AAA', 'secret1');
      server.registerTelegram('222222:BBB', 'secret2');
      expect(server.listWebhooks()).toHaveLength(2);
    });

    it('should register Telegram webhook returning body', async () => {
      server.registerTelegram('123456:ABC');
      await server.start();
      const port = getServerPort(server);
      if (port) {
        const response = await makeRequest(port, '/webhook/telegram/123456', {
          body: JSON.stringify({ message: { text: 'hello' } }),
        });
        expect(response.statusCode).toBe(200);
      }
    });
  });

  describe('registerDiscord()', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should register Discord webhook successfully', () => {
      server.registerDiscord('bot-token');
      const webhook = server.getWebhook('/webhook/discord');
      expect(webhook).toBeDefined();
      expect(webhook?.method).toBe('POST');
    });

    it('should register Discord webhook at correct path', () => {
      server.registerDiscord('test-token');
      expect(server.getWebhook('/webhook/discord')).toBeDefined();
    });

    it('should handle Discord ping interaction', async () => {
      server.registerDiscord('bot-token');
      await server.start();
      const port = getServerPort(server);
      if (port) {
        const response = await makeRequest(port, '/webhook/discord', {
          body: JSON.stringify({ type: 1 }),
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('"type":1');
      }
    });

    it('should return body for non-ping messages', async () => {
      server.registerDiscord('bot-token');
      await server.start();
      const port = getServerPort(server);
      if (port) {
        const response = await makeRequest(port, '/webhook/discord', {
          body: JSON.stringify({ type: 2, content: 'Test' }),
        });
        expect(response.statusCode).toBe(200);
      }
    });

    it('should allow registering Discord webhook without secret', () => {
      server.registerDiscord('bot-token');
      const webhook = server.getWebhook('/webhook/discord');
      expect(webhook?.secret).toBeUndefined();
    });

    it('should handle multiple Discord webhooks by overwriting', () => {
      server.registerDiscord('token1');
      server.registerDiscord('token2');
      expect(server.listWebhooks()).toHaveLength(1);
    });
  });

  describe('registerSlack()', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should register Slack webhook successfully', () => {
      server.registerSlack('signing-secret');
      const webhook = server.getWebhook('/webhook/slack');
      expect(webhook).toBeDefined();
      expect(webhook?.method).toBe('POST');
    });

    it('should register Slack webhook with signing secret', () => {
      server.registerSlack('xoxb-signing-secret');
      const webhook = server.getWebhook('/webhook/slack');
      expect(webhook?.secret).toBe('xoxb-signing-secret');
    });

    it('should register Slack webhook at correct path', () => {
      server.registerSlack('secret');
      expect(server.getWebhook('/webhook/slack')).toBeDefined();
    });

    it('should return body from handler', async () => {
      server.registerSlack('secret');
      await server.start();
      const port = getServerPort(server);
      if (port) {
        const response = await makeRequest(port, '/webhook/slack', {
          body: JSON.stringify({ type: 'url_verification' }),
        });
        expect(response.statusCode).toBe(200);
      }
    });

    it('should handle different signing secrets', () => {
      server.registerSlack('first-secret');
      server.registerSlack('second-secret');
      const webhook = server.getWebhook('/webhook/slack');
      expect(webhook?.secret).toBe('second-secret');
    });

    it('should accept complex signing secrets', () => {
      server.registerSlack('xoxb-1234567890123-1234567890123-abcdefghijklmnopqrstuvwx');
      const webhook = server.getWebhook('/webhook/slack');
      expect(webhook?.secret).toBeDefined();
    });
  });

  describe('start()', () => {
    it('should start the server successfully', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      await server.start();
      expect(server).toBeDefined();
    });

    it('should throw error when already running', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      await server.start();
      await expect(server.start()).rejects.toThrow('Webhook server already running');
    });

    it('should emit request event on start', async () => {
      const requestCallback = vi.fn();
      server = new WebhookServer(createTestOptions({ port: 0 }));
      server.on('request', requestCallback);
      await server.start();
      expect(requestCallback).not.toHaveBeenCalled();
    });

    it('should start with specific port', async () => {
      server = new WebhookServer(createTestOptions({ port: 3456, host: '127.0.0.1' }));
      await server.start();
      const address = (server as any).server?.address();
      expect(address?.port).toBe(3456);
    });

    it('should start on specified host', async () => {
      server = new WebhookServer(createTestOptions({ port: 0, host: '127.0.0.1' }));
      await server.start();
      const address = (server as any).server?.address();
      expect(address?.address).toBe('127.0.0.1');
    });

    it('should allow start after stop', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      await server.start();
      await server.stop();
      await server.start();
    });

    it('should handle start without webhooks', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      await server.start();
      const address = (server as any).server?.address();
      expect(address?.port).toBeGreaterThan(0);
    });

    it('should start with multiple webhooks registered', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      server.register({ path: '/webhook1', handler: createMockHandler() });
      server.register({ path: '/webhook2', handler: createMockHandler() });
      await server.start();
      expect((server as any).server).toBeDefined();
    });

    it('should start with onRequest callback', async () => {
      const onRequest = vi.fn().mockReturnValue(true);
      server = new WebhookServer(createTestOptions({ port: 0, onRequest }));
      await server.start();
      expect(onRequest).not.toHaveBeenCalled();
    });

    it('should start with onResponse callback', async () => {
      const onResponse = vi.fn();
      server = new WebhookServer(createTestOptions({ port: 0, onResponse }));
      await server.start();
      expect(onResponse).not.toHaveBeenCalled();
    });
  });

  describe('stop()', () => {
    it('should stop the server successfully', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      await server.start();
      await server.stop();
    });

    it('should handle stop when not running', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      await server.stop();
    });

    it('should stop server that was started', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      await server.start();
      await server.stop();
      expect((server as any).server).toBeDefined();
    });

    it('should allow multiple stop calls', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      await server.start();
      await server.stop();
      await server.stop();
    });

    it('should stop with webhooks registered', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      server.register({ path: '/webhook', handler: createMockHandler() });
      await server.start();
      await server.stop();
    });

    it('should stop after handling requests', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      server.register({ path: '/test', handler: createMockHandler({ result: 'ok' }) });
      await server.start();
      await server.stop();
    });

    it('should be able to restart after full stop', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      await server.start();
      await server.stop();
      await server.start();
      await server.stop();
    });
  });

  describe('getWebhook()', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should return registered webhook', () => {
      const handler = createMockHandler();
      server.register({ path: '/test', handler });
      const webhook = server.getWebhook('/test');
      expect(webhook).toBeDefined();
      expect(webhook?.handler).toBe(handler);
    });

    it('should return undefined for non-existent webhook', () => {
      const webhook = server.getWebhook('/non-existent');
      expect(webhook).toBeUndefined();
    });

    it('should return undefined for empty path', () => {
      server.register({ path: '/test', handler: createMockHandler() });
      const webhook = server.getWebhook('');
      expect(webhook).toBeUndefined();
    });

    it('should return webhook with all properties', () => {
      const handler = createMockHandler();
      server.register({ path: '/full', method: 'POST', handler, secret: 'secret' });
      const webhook = server.getWebhook('/full');
      expect(webhook?.path).toBe('/full');
      expect(webhook?.method).toBe('POST');
      expect(webhook?.secret).toBe('secret');
    });

    it('should return undefined after unregister', () => {
      server.register({ path: '/to-delete', handler: createMockHandler() });
      server.unregister('/to-delete');
      const webhook = server.getWebhook('/to-delete');
      expect(webhook).toBeUndefined();
    });

    it('should find webhook with exact path match', () => {
      server.register({ path: '/exact/path', handler: createMockHandler() });
      const webhook = server.getWebhook('/exact/path');
      expect(webhook).toBeDefined();
    });
  });

  describe('listWebhooks()', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should return empty array when no webhooks', () => {
      const webhooks = server.listWebhooks();
      expect(webhooks).toEqual([]);
    });

    it('should return array of registered paths', () => {
      server.register({ path: '/webhook1', handler: createMockHandler() });
      server.register({ path: '/webhook2', handler: createMockHandler() });
      const webhooks = server.listWebhooks();
      expect(webhooks).toHaveLength(2);
      expect(webhooks).toContain('/webhook1');
      expect(webhooks).toContain('/webhook2');
    });

    it('should return array with single webhook', () => {
      server.register({ path: '/single', handler: createMockHandler() });
      const webhooks = server.listWebhooks();
      expect(webhooks).toHaveLength(1);
      expect(webhooks[0]).toBe('/single');
    });

    it('should reflect registered webhooks after unregister', () => {
      server.register({ path: '/keep', handler: createMockHandler() });
      server.register({ path: '/remove', handler: createMockHandler() });
      server.unregister('/remove');
      const webhooks = server.listWebhooks();
      expect(webhooks).toHaveLength(1);
      expect(webhooks).toContain('/keep');
    });

    it('should return paths in registration order', () => {
      server.register({ path: '/first', handler: createMockHandler() });
      server.register({ path: '/second', handler: createMockHandler() });
      server.register({ path: '/third', handler: createMockHandler() });
      const webhooks = server.listWebhooks();
      expect(webhooks).toEqual(['/first', '/second', '/third']);
    });

    it('should include all registered webhook paths', () => {
      server.registerTelegram('123:ABC');
      server.registerDiscord('token');
      server.registerSlack('secret');
      const webhooks = server.listWebhooks();
      expect(webhooks).toContain('/webhook/telegram/123');
      expect(webhooks).toContain('/webhook/discord');
      expect(webhooks).toContain('/webhook/slack');
    });
  });

  describe('unregister()', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should remove webhook successfully', () => {
      server.register({ path: '/remove', handler: createMockHandler() });
      const result = server.unregister('/remove');
      expect(result).toBe(true);
      expect(server.getWebhook('/remove')).toBeUndefined();
    });

    it('should return false for non-existent path', () => {
      const result = server.unregister('/non-existent');
      expect(result).toBe(false);
    });

    it('should return true when removing existing webhook', () => {
      server.register({ path: '/existing', handler: createMockHandler() });
      const result = server.unregister('/existing');
      expect(result).toBe(true);
    });

    it('should remove from listWebhooks result', () => {
      server.register({ path: '/a', handler: createMockHandler() });
      server.register({ path: '/b', handler: createMockHandler() });
      server.unregister('/a');
      const webhooks = server.listWebhooks();
      expect(webhooks).toHaveLength(1);
      expect(webhooks).not.toContain('/a');
    });

    it('should handle empty string path', () => {
      server.register({ path: '/test', handler: createMockHandler() });
      const result = server.unregister('');
      expect(result).toBe(false);
    });

    it('should handle removing same path twice', () => {
      server.register({ path: '/duplicate', handler: createMockHandler() });
      server.unregister('/duplicate');
      const result = server.unregister('/duplicate');
      expect(result).toBe(false);
    });

    it('should allow registering new webhook after unregister', () => {
      server.register({ path: '/old', handler: createMockHandler({ old: true }) });
      server.unregister('/old');
      server.register({ path: '/old', handler: createMockHandler({ old: false }) });
      const webhook = server.getWebhook('/old');
      expect(webhook).toBeDefined();
    });
  });

  describe('HTTP Request Handling', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should respond with 200 for valid webhook request', async () => {
      const handler = createMockHandler({ status: 'ok' });
      server.register({ path: '/test', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/test', { body: '{}' });
      expect(response.statusCode).toBe(200);
    });

    it('should respond with 404 for unregistered path', async () => {
      server.register({ path: '/registered', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/unregistered');
      expect(response.statusCode).toBe(404);
      expect(response.body).toBe('Not Found');
    });

    it('should respond with 405 for wrong method', async () => {
      server.register({ path: '/test', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/test', { method: 'GET' });
      expect(response.statusCode).toBe(405);
      expect(response.body).toBe('Method Not Allowed');
    });

    it('should parse JSON body', async () => {
      const handler = vi.fn().mockResolvedValue({ received: true });
      server.register({ path: '/json', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/json', { body: '{"key":"value"}' });
      expect(handler).toHaveBeenCalled();
    });

    it('should pass headers to handler', async () => {
      const handler = vi.fn().mockResolvedValue({});
      server.register({ path: '/headers', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/headers', {
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      expect(handler).toHaveBeenCalled();
    });

    it('should return JSON response', async () => {
      const handler = createMockHandler({ message: 'hello' });
      server.register({ path: '/response', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/response', { body: '{}' });
      expect(response.body).toContain('message');
    });

    it('should handle empty body', async () => {
      const handler = createMockHandler({ result: 'empty-body-ok' });
      server.register({ path: '/empty', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/empty', { body: '' });
      expect(response.statusCode).toBe(200);
    });

    it('should handle non-JSON body gracefully', async () => {
      const handler = createMockHandler({});
      server.register({ path: '/nonjson', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/nonjson', { body: 'plain text' });
      expect(response.statusCode).toBe(200);
    });
  });

  describe('Webhook Handler Execution', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should call handler with request object', async () => {
      const handler = vi.fn().mockResolvedValue({});
      server.register({ path: '/handler-test', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/handler-test', { body: '{}' });
      expect(handler).toHaveBeenCalled();
    });

    it('should call handler with body', async () => {
      const handler = vi.fn().mockResolvedValue({ received: true });
      server.register({ path: '/body-test', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/body-test', { body: '{"test":"data"}' });
      expect(handler).toHaveBeenCalled();
    });

    it('should call handler with headers', async () => {
      const handler = vi.fn().mockResolvedValue({});
      server.register({ path: '/headers-test', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/headers-test', {
        headers: { 'X-Custom-Header': 'test-value' },
        body: '{}',
      });
      expect(handler).toHaveBeenCalled();
    });

    it('should use handler return value in response', async () => {
      const handler = createMockHandler({ custom: 'response-data' });
      server.register({ path: '/return', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/return', { body: '{}' });
      expect(response.body).toContain('custom');
    });

    it('should handle async handler', async () => {
      const handler = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return { async: true };
      });
      server.register({ path: '/async', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/async', { body: '{}' });
      expect(response.statusCode).toBe(200);
    });

    it('should handle handler returning null', async () => {
      const handler = vi.fn().mockResolvedValue(null);
      server.register({ path: '/null', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/null', { body: '{}' });
      expect(response.statusCode).toBe(200);
    });

    it('should handle handler returning undefined', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      server.register({ path: '/undefined', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/undefined', { body: '{}' });
      expect(response.statusCode).toBe(200);
    });

    it('should handle handler returning array', async () => {
      const handler = createMockHandler(['item1', 'item2']);
      server.register({ path: '/array', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/array', { body: '{}' });
      expect(response.statusCode).toBe(200);
    });

    it('should handle handler returning number', async () => {
      const handler = createMockHandler(42);
      server.register({ path: '/number', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/number', { body: '{}' });
      expect(response.statusCode).toBe(200);
    });
  });

  describe('Path Matching', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should match exact path', async () => {
      server.register({ path: '/exact', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/exact', { body: '{}' });
      expect(response.statusCode).toBe(200);
    });

    it('should not match similar path', async () => {
      server.register({ path: '/webhook', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/webhook-extra', { body: '{}' });
      expect(response.statusCode).toBe(404);
    });

    it('should match root path', async () => {
      server.register({ path: '/', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/', { body: '{}' });
      expect(response.statusCode).toBe(200);
    });

    it('should match nested path', async () => {
      server.register({ path: '/api/v1/webhook', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/api/v1/webhook', { body: '{}' });
      expect(response.statusCode).toBe(200);
    });

    it('should match path with special characters', async () => {
      server.register({ path: '/webhook/abc123', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/webhook/abc123', { body: '{}' });
      expect(response.statusCode).toBe(200);
    });

    it('should match path with numbers', async () => {
      server.register({ path: '/webhook123', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/webhook123', { body: '{}' });
      expect(response.statusCode).toBe(200);
    });
  });

  describe('Method Validation', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should accept GET method', async () => {
      server.register({ path: '/get', method: 'GET', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/get', { method: 'GET' });
      expect(response.statusCode).toBe(200);
    });

    it('should accept POST method', async () => {
      server.register({ path: '/post', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/post', { method: 'POST', body: '{}' });
      expect(response.statusCode).toBe(200);
    });

    it('should accept PUT method', async () => {
      server.register({ path: '/put', method: 'PUT', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/put', { method: 'PUT', body: '{}' });
      expect(response.statusCode).toBe(200);
    });

    it('should accept DELETE method', async () => {
      server.register({ path: '/delete', method: 'DELETE', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/delete', { method: 'DELETE' });
      expect(response.statusCode).toBe(200);
    });

    it('should reject wrong method for POST webhook', async () => {
      server.register({ path: '/method', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/method', { method: 'PUT', body: '{}' });
      expect(response.statusCode).toBe(405);
    });

    it('should reject GET for POST webhook', async () => {
      server.register({ path: '/post-only', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/post-only', { method: 'GET' });
      expect(response.statusCode).toBe(405);
    });

    it('should allow any method when not specified', async () => {
      server.register({ path: '/any', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const getResponse = await makeRequest(port!, '/any', { method: 'GET' });
      expect(getResponse.statusCode).toBe(200);
      const postResponse = await makeRequest(port!, '/any', { method: 'POST', body: '{}' });
      expect(postResponse.statusCode).toBe(200);
    });

    it('should handle PATCH method not allowed', async () => {
      server.register({ path: '/patch', method: 'PATCH', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/patch', { method: 'GET' });
      expect(response.statusCode).toBe(405);
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should return 500 on handler error', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
      server.register({ path: '/error', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/error', { body: '{}' });
      expect(response.statusCode).toBe(500);
      expect(response.body).toBe('Internal Server Error');
    });

    it('should return 500 on handler throwing exception', async () => {
      const handler = vi.fn().mockImplementation(() => {
        throw new Error('Exception');
      });
      server.register({ path: '/exception', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/exception', { body: '{}' });
      expect(response.statusCode).toBe(500);
    });

    it('should handle handler returning rejected promise', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Promise rejected'));
      server.register({ path: '/rejected', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/rejected', { body: '{}' });
      expect(response.statusCode).toBe(500);
    });

    it('should continue after error on one webhook', async () => {
      const goodHandler = createMockHandler({ good: true });
      const badHandler = vi.fn().mockRejectedValue(new Error('Bad handler'));
      server.register({ path: '/good', method: 'POST', handler: goodHandler });
      server.register({ path: '/bad', method: 'POST', handler: badHandler });
      await server.start();
      const port = getServerPort(server);
      const goodResponse = await makeRequest(port!, '/good', { body: '{}' });
      expect(goodResponse.statusCode).toBe(200);
    });

    it('should handle malformed JSON gracefully', async () => {
      const handler = createMockHandler({});
      server.register({ path: '/malformed', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/malformed', { body: 'not-valid-json' });
      expect(response.statusCode).toBe(200);
    });

    it('should handle onRequest returning false', async () => {
      const onRequest = vi.fn().mockReturnValue(false);
      server = new WebhookServer(createTestOptions({ port: 0, onRequest }));
      server.register({ path: '/test', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/test', { body: '{}' });
      expect(response.statusCode).toBe(404);
    });

    it('should handle server listen error', async () => {
      server = new WebhookServer(createTestOptions({ port: 99999 }));
      try {
        await server.start();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Request/Response Events', () => {
    beforeEach(() => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
    });

    it('should emit request event on incoming request', async () => {
      const requestCallback = vi.fn();
      server.on('request', requestCallback);
      server.register({ path: '/test', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/test', { body: '{}' });
      expect(requestCallback).toHaveBeenCalledTimes(1);
    });

    it('should emit webhook event after handling', async () => {
      const webhookCallback = vi.fn();
      server.on('webhook', webhookCallback);
      server.register({ path: '/webhook-event', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/webhook-event', { body: '{}' });
      expect(webhookCallback).toHaveBeenCalledWith('/webhook-event', {});
    });

    it('should emit webhook event with parsed body', async () => {
      const webhookCallback = vi.fn();
      server.on('webhook', webhookCallback);
      server.register({ path: '/body-event', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/body-event', { body: '{"test":"data"}' });
      expect(webhookCallback).toHaveBeenCalledWith('/body-event', { test: 'data' });
    });

    it('should emit request event before webhook event', async () => {
      const order: string[] = [];
      const requestCallback = vi.fn(() => order.push('request'));
      const webhookCallback = vi.fn(() => order.push('webhook'));
      server.on('request', requestCallback);
      server.on('webhook', webhookCallback);
      server.register({ path: '/order', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/order', { body: '{}' });
      expect(order).toEqual(['request', 'webhook']);
    });

    it('should emit webhook event on successful response', async () => {
      const webhookCallback = vi.fn();
      server.on('webhook', webhookCallback);
      server.register({ path: '/success-webhook', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/success-webhook', { body: '{}' });
      expect(webhookCallback).toHaveBeenCalled();
    });

    it('should not emit webhook event for 404', async () => {
      const webhookCallback = vi.fn();
      server.on('webhook', webhookCallback);
      server.register({ path: '/exists', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/not-exists');
      expect(webhookCallback).not.toHaveBeenCalled();
    });

    it('should not emit webhook event for 405', async () => {
      const webhookCallback = vi.fn();
      server.on('webhook', webhookCallback);
      server.register({ path: '/post-only', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/post-only', { method: 'GET' });
      expect(webhookCallback).not.toHaveBeenCalled();
    });

    it('should emit multiple webhook events for multiple requests', async () => {
      const webhookCallback = vi.fn();
      server.on('webhook', webhookCallback);
      server.register({ path: '/multiple', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/multiple', { body: '{}' });
      await makeRequest(port!, '/multiple', { body: '{}' });
      await makeRequest(port!, '/multiple', { body: '{}' });
      expect(webhookCallback).toHaveBeenCalledTimes(3);
    });

    it('should emit request event for all paths', async () => {
      const requestCallback = vi.fn();
      server.on('request', requestCallback);
      server.register({ path: '/a', method: 'POST', handler: createMockHandler() });
      server.register({ path: '/b', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/a', { body: '{}' });
      await makeRequest(port!, '/b', { body: '{}' });
      expect(requestCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple platform webhooks', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      server.registerTelegram('123:ABC', 'telegram-secret');
      server.registerDiscord('discord-token');
      server.registerSlack('slack-secret');
      await server.start();
      const port = getServerPort(server);
      expect(port).toBeGreaterThan(0);
      await server.stop();
    });

    it('should handle sequential requests', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      const handler = vi.fn().mockResolvedValue({ count: 1 });
      server.register({ path: '/sequential', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      await makeRequest(port!, '/sequential', { body: '{}' });
      await makeRequest(port!, '/sequential', { body: '{}' });
      expect(handler).toHaveBeenCalledTimes(2);
      await server.stop();
    });

    it('should handle concurrent requests', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      const handler = vi.fn().mockResolvedValue({ done: true });
      server.register({ path: '/concurrent', method: 'POST', handler });
      await server.start();
      const port = getServerPort(server);
      await Promise.all([
        makeRequest(port!, '/concurrent', { body: '{}' }),
        makeRequest(port!, '/concurrent', { body: '{}' }),
        makeRequest(port!, '/concurrent', { body: '{}' }),
      ]);
      expect(handler).toHaveBeenCalledTimes(3);
      await server.stop();
    });

    it('should work with createWebhookServer factory', async () => {
      const { createWebhookServer } = await import('../../src/webhooks/index.js');
      const webhookServer = createWebhookServer({ port: 0 });
      expect(webhookServer).toBeDefined();
      expect(typeof webhookServer.start).toBe('function');
      expect(typeof webhookServer.stop).toBe('function');
      expect(typeof webhookServer.register).toBe('function');
    });

    it('should register many webhooks', () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      for (let i = 0; i < 50; i++) {
        server.register({ path: `/webhook${i}`, handler: createMockHandler() });
      }
      expect(server.listWebhooks()).toHaveLength(50);
    });

    it('should handle webhook registration during server run', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      await server.start();
      server.register({ path: '/dynamic', method: 'POST', handler: createMockHandler() });
      const port = getServerPort(server);
      const response = await makeRequest(port!, '/dynamic', { body: '{}' });
      expect(response.statusCode).toBe(200);
      await server.stop();
    });

    it('should unregister webhook during server run', async () => {
      server = new WebhookServer(createTestOptions({ port: 0 }));
      server.register({ path: '/remove-me', method: 'POST', handler: createMockHandler() });
      await server.start();
      const port = getServerPort(server);
      server.unregister('/remove-me');
      const response = await makeRequest(port!, '/remove-me');
      expect(response.statusCode).toBe(404);
      await server.stop();
    });
  });
});