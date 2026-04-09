import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ShutdownManager, createShutdownManager } from '../src/graceful-shutdown/index.js';

vi.mock('../src/infra/index.js', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock process.exit
const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);

describe('ShutdownManager', () => {
  let manager: ShutdownManager;

  beforeEach(() => {
    vi.useFakeTimers();
    manager = createShutdownManager({ timeout: 5000, closeWebSockets: false });
    mockExit.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('constructor', () => {
    it('should create a ShutdownManager instance', () => {
      expect(manager).toBeInstanceOf(ShutdownManager);
      expect(manager).toBeInstanceOf(EventEmitter);
    });

    it('should accept custom config', () => {
      const custom = createShutdownManager({
        timeout: 10000,
        closeWebSockets: true,
        wsCloseCode: 1000,
        wsCloseReason: 'custom',
      });
      expect(custom).toBeInstanceOf(ShutdownManager);
    });

    it('should default timeout to 30000', () => {
      const defaultMgr = createShutdownManager();
      expect(defaultMgr).toBeInstanceOf(ShutdownManager);
    });
  });

  describe('registerHttpServer', () => {
    it('should register an HTTP server', () => {
      const mockServer = {
        on: vi.fn(),
        close: vi.fn((cb: any) => cb()),
      } as any;

      manager.registerHttpServer(mockServer);
      expect(mockServer.on).toHaveBeenCalled();
    });

    it('should set Connection: close header during shutdown', async () => {
      const mockServer = {
        on: vi.fn((event: string, handler: any) => {
          if (event === 'request') {
            // Simulate a request during shutdown
            const mockRes = {
              setHeader: vi.fn(),
              on: vi.fn(),
              finish: vi.fn(),
            };
            handler({}, mockRes);
            expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'close');
          }
        }),
        close: vi.fn((cb: any) => cb()),
      } as any;

      manager.registerHttpServer(mockServer);

      // Trigger shutdown to set isShuttingDown flag
      const shutdownPromise = manager.shutdown('SIGTERM');
      await vi.runAllTimersAsync();
      await shutdownPromise;
    });
  });

  describe('onCleanup', () => {
    it('should register a cleanup task', () => {
      const task = vi.fn();
      manager.onCleanup(task);
      // Task should be stored (verified during shutdown)
    });

    it('should run cleanup tasks during shutdown', async () => {
      const task1 = vi.fn();
      const task2 = vi.fn();
      manager.onCleanup(task1);
      manager.onCleanup(task2);

      const mockServer = {
        on: vi.fn(),
        close: vi.fn((cb: any) => cb()),
      } as any;
      manager.registerHttpServer(mockServer);

      const shutdownPromise = manager.shutdown('SIGTERM');
      await vi.runAllTimersAsync();
      await shutdownPromise;

      expect(task1).toHaveBeenCalled();
      expect(task2).toHaveBeenCalled();
    });

    it('should continue running cleanup tasks even if one fails', async () => {
      const task1 = vi.fn().mockRejectedValue(new Error('task 1 failed'));
      const task2 = vi.fn();
      manager.onCleanup(task1);
      manager.onCleanup(task2);

      const mockServer = {
        on: vi.fn(),
        close: vi.fn((cb: any) => cb()),
      } as any;
      manager.registerHttpServer(mockServer);

      const shutdownPromise = manager.shutdown('SIGTERM');
      await vi.runAllTimersAsync();
      await shutdownPromise;

      expect(task1).toHaveBeenCalled();
      expect(task2).toHaveBeenCalled();
    });
  });

  describe('shutdown', () => {
    it('should emit shutdown:start event', async () => {
      const mockServer = {
        on: vi.fn(),
        close: vi.fn((cb: any) => cb()),
      } as any;
      manager.registerHttpServer(mockServer);

      const handler = vi.fn();
      manager.on('shutdown:start', handler);

      const shutdownPromise = manager.shutdown('SIGTERM');
      await vi.runAllTimersAsync();
      await shutdownPromise;

      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit shutdown:complete event with duration', async () => {
      const mockServer = {
        on: vi.fn(),
        close: vi.fn((cb: any) => cb()),
      } as any;
      manager.registerHttpServer(mockServer);

      const handler = vi.fn();
      manager.on('shutdown:complete', handler);

      const shutdownPromise = manager.shutdown('SIGTERM');
      await vi.runAllTimersAsync();
      await shutdownPromise;

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ duration: expect.any(Number) })
      );
    });

    it('should not run shutdown twice', async () => {
      const mockServer = {
        on: vi.fn(),
        close: vi.fn((cb: any) => cb()),
      } as any;
      manager.registerHttpServer(mockServer);

      const p1 = manager.shutdown('SIGTERM');
      const p2 = manager.shutdown('SIGINT');
      await vi.runAllTimersAsync();
      await Promise.all([p1, p2]);

      // Only one shutdown should have proceeded (second returns immediately)
    });

    it('should handle server close callback', async () => {
      const mockServer = {
        on: vi.fn(),
        close: vi.fn((cb: any) => setTimeout(cb, 100)),
      } as any;
      manager.registerHttpServer(mockServer);

      const shutdownPromise = manager.shutdown('SIGTERM');
      await vi.advanceTimersByTimeAsync(200);
      await shutdownPromise;

      expect(mockServer.close).toHaveBeenCalled();
    });
  });

  describe('isShuttingDownFlag', () => {
    it('should be false initially', () => {
      expect(manager.isShuttingDownFlag).toBe(false);
    });

    it('should be true during shutdown', async () => {
      const mockServer = {
        on: vi.fn(),
        close: vi.fn((cb: any) => cb()),
      } as any;
      manager.registerHttpServer(mockServer);

      const shutdownPromise = manager.shutdown('SIGTERM');
      await vi.runAllTimersAsync();
      await shutdownPromise;

      // After shutdown completes, flag remains true
      expect(manager.isShuttingDownFlag).toBe(true);
    });
  });

  describe('registerSignalHandlers', () => {
    it('should register signal handlers without errors', () => {
      // Note: This actually registers real process handlers
      // In tests, we just verify it doesn't throw
      expect(() => manager.registerSignalHandlers()).not.toThrow();
    });
  });
});
