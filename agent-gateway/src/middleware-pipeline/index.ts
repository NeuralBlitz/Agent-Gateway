// @ts-nocheck
/**
 * Enterprise Middleware Composition
 * Composable middleware pipeline with error handling,
 * conditional execution, and parallel branches.
 */

import { logger } from '../infra/index.js';

export type MiddlewareFn = (ctx: MiddlewareContext, next: () => Promise<void>) => Promise<void>;

export interface MiddlewareContext {
  [key: string]: any;
  request?: any;
  response?: any;
  user?: any;
  tenant?: any;
  startTime: number;
  errors: Error[];
}

export class MiddlewarePipeline {
  private middlewares: MiddlewareFn[] = [];

  /** Add middleware */
  use(fn: MiddlewareFn): this {
    this.middlewares.push(fn);
    return this;
  }

  /** Add conditional middleware */
  when(condition: (ctx: MiddlewareContext) => boolean, fn: MiddlewareFn): this {
    this.middlewares.push(async (ctx, next) => {
      if (condition(ctx)) {
        return fn(ctx, next);
      }
      return next();
    });
    return this;
  }

  /** Add error-handling middleware */
  catchError(handler: (error: Error, ctx: MiddlewareContext) => void | Promise<void>): this {
    this.middlewares.push(async (ctx, next) => {
      try {
        await next();
      } catch (error: any) {
        ctx.errors.push(error);
        await handler(error, ctx);
      }
    });
    return this;
  }

  /** Add timing middleware */
  withTiming(key: string = 'total'): this {
    this.middlewares.push(async (ctx, next) => {
      const start = Date.now();
      await next();
      const timing = ctx.timing || (ctx.timing = {});
      timing[key] = Date.now() - start;
    });
    return this;
  }

  /** Execute the pipeline */
  async execute(initialContext: Partial<MiddlewareContext> = {}): Promise<MiddlewareContext> {
    const ctx: MiddlewareContext = {
      startTime: Date.now(),
      errors: [],
      ...initialContext,
    };

    const run = async (index: number): Promise<void> => {
      if (index >= this.middlewares.length) return;

      const middleware = this.middlewares[index];
      await middleware(ctx, () => run(index + 1));
    };

    await run(0);
    return ctx;
  }

  /** Convert to Express middleware */
  toExpressMiddleware(): (req: any, res: any, next: () => void) => void {
    return async (req, res, next) => {
      try {
        const ctx = await this.execute({ request: req, response: res });
        Object.assign(req, ctx);
        next();
      } catch (error: any) {
        next(error);
      }
    };
  }

  /** Get middleware count */
  get size(): number {
    return this.middlewares.length;
  }
}

/** Create pre-built middleware functions */
export const Middleware = {
  /** Authentication check */
  auth: (validateFn: (req: any) => Promise<any>): MiddlewareFn => {
    return async (ctx, next) => {
      const user = await validateFn(ctx.request);
      ctx.user = user;
      await next();
    };
  },

  /** Tenant resolution */
  tenant: (resolveFn: (user: any) => Promise<any>): MiddlewareFn => {
    return async (ctx, next) => {
      if (ctx.user) {
        ctx.tenant = await resolveFn(ctx.user);
      }
      await next();
    };
  },

  /** Request validation */
  validate: (schema: any): MiddlewareFn => {
    return async (ctx, next) => {
      const result = schema.safeParse(ctx.request?.body);
      if (!result.success) {
        throw new Error(`Validation failed: ${result.error.errors.map((e: any) => e.message).join(', ')}`);
      }
      ctx.request.body = result.data;
      await next();
    };
  },

  /** Rate limit check */
  rateLimit: (checkFn: (ctx: MiddlewareContext) => Promise<{ allowed: boolean; retryAfter?: number }>): MiddlewareFn => {
    return async (ctx, next) => {
      const result = await checkFn(ctx);
      if (!result.allowed) {
        const error = new Error('Rate limit exceeded') as any;
        error.statusCode = 429;
        error.retryAfter = result.retryAfter;
        throw error;
      }
      await next();
    };
  },

  /** CORS headers */
  cors: (origins: string[] = ['*']): MiddlewareFn => {
    return async (ctx, next) => {
      const origin = ctx.request?.headers?.origin;
      const allowOrigin = origins.includes('*') || origins.includes(origin || '') ? origin || '*' : '';
      if (ctx.response) {
        ctx.response.setHeader('Access-Control-Allow-Origin', allowOrigin);
        ctx.response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        ctx.response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID, X-Idempotency-Key');
        ctx.response.setHeader('Access-Control-Max-Age', '86400');
      }
      await next();
    };
  },

  /** Request ID generation */
  requestId: (headerName: string = 'X-Request-ID'): MiddlewareFn => {
    return async (ctx, next) => {
      const requestId = ctx.request?.headers?.[headerName.toLowerCase()] || `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      ctx.requestId = requestId;
      if (ctx.response) ctx.response.setHeader('X-Request-ID', requestId);
      await next();
    };
  },

  /** Request logging */
  requestLog: (logFn: (ctx: MiddlewareContext) => void): MiddlewareFn => {
    return async (ctx, next) => {
      const start = Date.now();
      await next();
      ctx.duration = Date.now() - start;
      logFn(ctx);
    };
  },

  /** Compression hint */
  compression: (): MiddlewareFn => {
    return async (ctx, next) => {
      if (ctx.response) {
        ctx.response.setHeader('Content-Encoding', 'gzip');
        ctx.response.setHeader('Vary', 'Accept-Encoding');
      }
      await next();
    };
  },

  /** Security headers */
  securityHeaders: (): MiddlewareFn => {
    return async (ctx, next) => {
      if (ctx.response) {
        ctx.response.setHeader('X-Content-Type-Options', 'nosniff');
        ctx.response.setHeader('X-Frame-Options', 'DENY');
        ctx.response.setHeader('X-XSS-Protection', '1; mode=block');
        ctx.response.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        ctx.response.setHeader('Content-Security-Policy', "default-src 'self'");
        ctx.response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
      }
      await next();
    };
  },
};

export function createMiddlewarePipeline(): MiddlewarePipeline {
  return new MiddlewarePipeline();
}
