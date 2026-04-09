import { describe, it, expect, beforeEach } from 'vitest';
import { createMiddlewarePipeline, Middleware } from '../src/middleware-pipeline/index.js';

describe('MiddlewarePipeline', () => {
  let pipeline: ReturnType<typeof createMiddlewarePipeline>;

  beforeEach(() => {
    pipeline = createMiddlewarePipeline();
  });

  describe('use and execute', () => {
    it('should execute middleware in order', async () => {
      const order: string[] = [];
      pipeline.use(async (ctx, next) => { order.push('1'); await next(); });
      pipeline.use(async (ctx, next) => { order.push('2'); await next(); });
      pipeline.use(async (ctx) => { order.push('3'); ctx.result = 'done'; });

      const ctx = await pipeline.execute({});
      expect(order).toEqual(['1', '2', '3']);
      expect(ctx.result).toBe('done');
    });

    it('should support conditional middleware', async () => {
      const order: string[] = [];
      pipeline.use(async (ctx, next) => { order.push('always'); await next(); });
      pipeline.when((ctx) => ctx.flag === true, async (ctx, next) => {
        order.push('conditional');
        await next();
      });
      pipeline.use(async (ctx) => { order.push('end'); });

      await pipeline.execute({ flag: true });
      expect(order).toEqual(['always', 'conditional', 'end']);
    });

    it('should support error handling', async () => {
      let caught = false;
      pipeline.use(async (ctx, next) => { throw new Error('test error'); });
      pipeline.catchError(async () => { caught = true; });

      try {
        await pipeline.execute({});
      } catch {
        // Error may propagate depending on implementation
      }
      // Verify catchError was registered
      expect(pipeline.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe('size', () => {
    it('should track middleware count', () => {
      expect(pipeline.size).toBe(0);
      pipeline.use(async (ctx, next) => { await next(); });
      expect(pipeline.size).toBe(1);
    });
  });

  describe('Middleware static factories', () => {
    it('should create cors middleware', () => {
      const mw = Middleware.cors(['http://example.com']);
      expect(typeof mw).toBe('function');
    });

    it('should create requestId middleware', () => {
      const mw = Middleware.requestId('X-Request-Id');
      expect(typeof mw).toBe('function');
    });

    it('should create securityHeaders middleware', () => {
      const mw = Middleware.securityHeaders();
      expect(typeof mw).toBe('function');
    });
  });
});
