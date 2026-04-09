/**
 * Enterprise Graceful Shutdown Manager
 * Orchestrates clean shutdown with request draining,
 * WebSocket closure, connection cleanup, and state persistence.
 */

import { Server as HttpServer } from 'http';
import { Server as HttpsServer } from 'https';
import { WebSocketServer } from 'ws';
import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface ShutdownConfig {
  /** Timeout before forced shutdown (ms, default: 30000) */
  timeout?: number;
  /** Whether to close WebSocket connections gracefully */
  closeWebSockets?: boolean;
  /** WebSocket close code */
  wsCloseCode?: number;
  /** WebSocket close reason */
  wsCloseReason?: string;
}

type CleanupTask = () => void | Promise<void>;

export class ShutdownManager extends EventEmitter {
  private config: Required<ShutdownConfig>;
  private httpServers: (HttpServer | HttpsServer)[] = [];
  private wsServers: WebSocketServer[] = [];
  private cleanupTasks: CleanupTask[] = [];
  private inFlightRequests: Set<any> = new Set();
  private isShuttingDown = false;

  constructor(config: ShutdownConfig = {}) {
    super();
    this.config = {
      timeout: config.timeout || 30000,
      closeWebSockets: config.closeWebSockets ?? true,
      wsCloseCode: config.wsCloseCode || 1001,
      wsCloseReason: config.wsCloseReason || 'Server shutting down',
    };
  }

  /** Register an HTTP server */
  registerHttpServer(server: HttpServer | HttpsServer): void {
    this.httpServers.push(server);

    // Track in-flight requests
    server.on('request', (_req: any, res: any) => {
      if (this.isShuttingDown) {
        res.setHeader('Connection', 'close');
      }

      this.inFlightRequests.add(res);
      res.on('finish', () => this.inFlightRequests.delete(res));
    });
  }

  /** Register a WebSocket server */
  registerWsServer(wsServer: WebSocketServer): void {
    this.wsServers.push(wsServer);
  }

  /** Register a cleanup task */
  onCleanup(task: CleanupTask): void {
    this.cleanupTasks.push(task);
  }

  /** Initiate graceful shutdown */
  async shutdown(signal: string = 'SIGTERM'): Promise<void> {
    if (this.isShuttingDown) {
      logger.warn('Shutdown already in progress');
      return;
    }

    this.isShuttingDown = true;
    const startTime = Date.now();
    logger.info({ signal }, 'Graceful shutdown initiated');

    this.emit('shutdown:start');

    // Force shutdown timer
    const forceTimer = setTimeout(() => {
      logger.error(
        { inFlight: this.inFlightRequests.size },
        `Forced shutdown after ${this.config.timeout}ms`,
      );
      process.exit(1);
    }, this.config.timeout);

    try {
      // Phase 1: Stop accepting new connections
      logger.info('Phase 1: Stopping HTTP servers');
      for (const server of this.httpServers) {
        await new Promise<void>((resolve) => server.close(() => resolve()));
      }
      logger.info('HTTP servers stopped accepting new connections');

      // Phase 2: Drain in-flight requests
      logger.info('Phase 2: Draining in-flight requests');
      const drainStart = Date.now();
      const drainTimeout = this.config.timeout / 2;

      while (this.inFlightRequests.size > 0 && Date.now() - drainStart < drainTimeout) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (this.inFlightRequests.size > 0) {
        logger.warn({ count: this.inFlightRequests.size }, 'Force-closing in-flight requests');
      }

      // Phase 3: Close WebSocket connections
      if (this.config.closeWebSockets) {
        logger.info('Phase 3: Closing WebSocket connections');
        for (const wsServer of this.wsServers) {
          for (const client of wsServer.clients) {
            client.close(this.config.wsCloseCode, this.config.wsCloseReason);
          }
          await new Promise<void>((resolve) => wsServer.close(() => resolve()));
        }
        logger.info('WebSocket connections closed');
      }

      // Phase 4: Run cleanup tasks
      logger.info(`Phase 4: Running ${this.cleanupTasks.length} cleanup tasks`);
      for (let i = 0; i < this.cleanupTasks.length; i++) {
        try {
          await this.cleanupTasks[i]();
          logger.debug(`Cleanup task ${i + 1}/${this.cleanupTasks.length} completed`);
        } catch (err: any) {
          logger.error({ err }, `Cleanup task ${i + 1}/${this.cleanupTasks.length} failed`);
        }
      }

      clearTimeout(forceTimer);
      const duration = Date.now() - startTime;

      logger.info({ duration }, 'Graceful shutdown complete');
      this.emit('shutdown:complete', { duration });
    } catch (err: any) {
      logger.error({ err }, 'Error during graceful shutdown');
      clearTimeout(forceTimer);
      process.exit(1);
    }
  }

  /** Register signal handlers */
  registerSignalHandlers(): void {
    const handler = async (signal: string) => {
      await this.shutdown(signal);
      process.exit(0);
    };

    process.on('SIGTERM', () => handler('SIGTERM'));
    process.on('SIGINT', () => handler('SIGINT'));

    process.on('uncaughtException', (err: Error) => {
      logger.error({ err }, 'Uncaught exception');
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error({ reason }, 'Unhandled rejection');
    });
  }

  get isShuttingDownFlag(): boolean {
    return this.isShuttingDown;
  }
}

export function createShutdownManager(config?: ShutdownConfig): ShutdownManager {
  return new ShutdownManager(config);
}
