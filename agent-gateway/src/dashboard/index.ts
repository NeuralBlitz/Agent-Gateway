/**
 * Enterprise Real-Time Dashboard
 * WebSocket-based live dashboard for system metrics, logs, and events.
 */

import { WebSocket, WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface DashboardSubscription {
  id: string;
  channel: string;
  filters?: Record<string, any>;
  intervalMs?: number;
}

export type DashboardChannel =
  | 'metrics'      // System and application metrics
  | 'logs'          // Application logs
  | 'events'        // Business events
  | 'sessions'      // Active sessions
  | 'health'        // Health check results
  | 'performance'   // Performance metrics
  | 'alerts'        // Alert notifications
  | 'audit';        // Audit trail events

export class RealTimeDashboard extends EventEmitter {
  private wss?: WebSocketServer;
  private clients: Map<WebSocket, Set<DashboardChannel>> = new Map();
  private subscriptions: Map<string, DashboardSubscription> = new Map();
  private broadcastIntervals: Map<DashboardChannel, ReturnType<typeof setInterval>> = new Map();
  private dataProviders: Map<DashboardChannel, () => Promise<any>> = new Map();
  private running = false;

  /** Attach to an existing HTTP server's WebSocket upgrade */
  attach(server: any, path: string = '/dashboard/ws'): void {
    this.wss = new WebSocketServer({ server, path });
    this.setupHandlers();
    logger.info({ path }, 'Real-time dashboard WebSocket attached');
  }

  /** Or create standalone WebSocket server */
  listen(port: number): void {
    this.wss = new WebSocketServer({ port });
    this.setupHandlers();
    logger.info({ port }, 'Real-time dashboard WebSocket listening');
  }

  private setupHandlers(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocket, req: any) => {
      logger.debug({ remoteAddress: req.socket?.remoteAddress }, 'Dashboard client connected');
      this.clients.set(ws, new Set());

      // Send welcome message
      this.sendToClient(ws, {
        type: 'welcome',
        channels: this.getAvailableChannels(),
        timestamp: Date.now(),
      });

      ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(ws, msg);
        } catch {
          this.sendToClient(ws, { type: 'error', message: 'Invalid JSON' });
        }
      });

      ws.on('close', () => {
        this.clients.delete(ws);
        logger.debug('Dashboard client disconnected');
      });

      ws.on('error', (err: Error) => {
        logger.error({ err }, 'Dashboard WebSocket error');
      });
    });
  }

  private handleMessage(ws: WebSocket, msg: any): void {
    switch (msg.type) {
      case 'subscribe': {
        const channel = msg.channel as DashboardChannel;
        const channels = this.clients.get(ws);
        if (channels && this.dataProviders.has(channel)) {
          channels.add(channel);
          this.sendToClient(ws, { type: 'subscribed', channel });

          // Send initial data
          this.sendChannelData(ws, channel);
        }
        break;
      }

      case 'unsubscribe': {
        const channel = msg.channel as DashboardChannel;
        const channels = this.clients.get(ws);
        if (channels) {
          channels.delete(channel);
          this.sendToClient(ws, { type: 'unsubscribed', channel });
        }
        break;
      }

      case 'subscribe-all': {
        const channels = this.clients.get(ws);
        if (channels) {
          for (const [channel] of this.dataProviders) {
            channels.add(channel);
          }
          this.sendToClient(ws, { type: 'subscribed-all', channels: Array.from(channels) });
        }
        break;
      }

      case 'ping':
        this.sendToClient(ws, { type: 'pong', timestamp: Date.now() });
        break;

      case 'query':
        this.handleQuery(ws, msg);
        break;

      default:
        this.sendToClient(ws, { type: 'error', message: `Unknown message type: ${msg.type}` });
    }
  }

  /** Register a data provider for a channel */
  registerProvider(channel: DashboardChannel, provider: () => Promise<any>, broadcastIntervalMs?: number): void {
    this.dataProviders.set(channel, provider);

    if (broadcastIntervalMs) {
      // Start periodic broadcast to all subscribed clients
      if (this.broadcastIntervals.has(channel)) {
        clearInterval(this.broadcastIntervals.get(channel)!);
      }

      const interval = setInterval(() => {
        this.broadcastToChannel(channel);
      }, broadcastIntervalMs);

      this.broadcastIntervals.set(channel, interval);
    }
  }

  /** Send data for a specific channel to a client */
  private async sendChannelData(ws: WebSocket, channel: DashboardChannel): Promise<void> {
    const provider = this.dataProviders.get(channel);
    if (!provider) return;

    try {
      const data = await provider();
      this.sendToClient(ws, { type: 'data', channel, data, timestamp: Date.now() });
    } catch (err: any) {
      this.sendToClient(ws, { type: 'error', channel, message: err.message });
    }
  }

  /** Broadcast channel data to all subscribed clients */
  private async broadcastToChannel(channel: DashboardChannel): Promise<void> {
    const provider = this.dataProviders.get(channel);
    if (!provider) return;

    try {
      const data = await provider();
      const message = JSON.stringify({ type: 'data', channel, data, timestamp: Date.now() });

      for (const [ws, channels] of this.clients) {
        if (channels.has(channel) && ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      }
    } catch (err: any) {
      logger.error({ channel, err }, 'Dashboard broadcast failed');
    }
  }

  /** Handle ad-hoc queries */
  private async handleQuery(ws: WebSocket, msg: any): Promise<void> {
    const { channel, filters } = msg;
    const provider = this.dataProviders.get(channel);
    if (!provider) {
      this.sendToClient(ws, { type: 'error', message: `No provider for channel: ${channel}` });
      return;
    }

    try {
      const data = await provider();
      let result = data;

      // Apply filters
      if (filters) {
        if (Array.isArray(data)) {
          result = data.filter((item: any) => {
            for (const [key, value] of Object.entries(filters)) {
              if (item[key] !== value) return false;
            }
            return true;
          });
        }
      }

      this.sendToClient(ws, { type: 'query:result', queryId: msg.queryId, data: result, timestamp: Date.now() });
    } catch (err: any) {
      this.sendToClient(ws, { type: 'query:error', queryId: msg.queryId, message: err.message });
    }
  }

  /** Push an event to all clients subscribed to a channel */
  pushEvent(channel: DashboardChannel, data: any): void {
    const message = JSON.stringify({ type: 'event', channel, data, timestamp: Date.now() });

    for (const [ws, channels] of this.clients) {
      if (channels.has(channel) && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  /** Send a message to a specific client */
  private sendToClient(ws: WebSocket, data: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /** Get available channels */
  private getAvailableChannels(): DashboardChannel[] {
    return Array.from(this.dataProviders.keys());
  }

  /** Get connected client count */
  getClientCount(): number {
    return this.clients.size;
  }

  /** Get subscriptions per channel */
  getSubscriptionCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [, channels] of this.clients) {
      for (const channel of channels) {
        counts[channel] = (counts[channel] || 0) + 1;
      }
    }
    return counts;
  }

  /** Close all connections */
  close(): void {
    for (const interval of this.broadcastIntervals.values()) {
      clearInterval(interval);
    }
    this.broadcastIntervals.clear();

    if (this.wss) {
      for (const ws of this.wss.clients) {
        ws.close(1001, 'Dashboard shutting down');
      }
      this.wss.close();
      this.wss = undefined;
    }

    this.clients.clear();
    this.running = false;
  }
}

export function createRealTimeDashboard(): RealTimeDashboard {
  return new RealTimeDashboard();
}
