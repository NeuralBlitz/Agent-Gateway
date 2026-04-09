/**
 * Enterprise API Gateway / Router
 * Request routing, transformation, rate limiting, caching,
 * and load balancing at the API layer.
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { logger } from '../infra/index.js';

export interface RouteConfig {
  /** Route path pattern (supports wildcards: /api/*, /users/:id) */
  path: string;
  /** HTTP methods */
  methods: string[];
  /** Target upstream URL */
  upstream?: string;
  /** Whether to require auth */
  requireAuth?: boolean;
  /** Required permissions */
  permissions?: string[];
  /** Rate limit (requests per window) */
  rateLimit?: { max: number; window: number };
  /** Cache TTL (seconds) */
  cacheTtl?: number;
  /** Request transformation */
  transformRequest?: (req: any) => Promise<any>;
  /** Response transformation */
  transformResponse?: (res: any) => Promise<any>;
  /** Timeout (ms) */
  timeout?: number;
  /** Retry config */
  retries?: { max: number; delayMs: number };
  /** Circuit breaker name */
  circuitBreaker?: string;
  /** Whether to log requests */
  logRequests?: boolean;
  /** Custom handler (bypasses upstream proxy) */
  handler?: (req: any, res: any) => Promise<void>;
}

export interface RequestLog {
  id: string;
  method: string;
  path: string;
  statusCode: number;
  latencyMs: number;
  timestamp: number;
  upstream?: string;
  cached: boolean;
  retryCount: number;
}

export class ApiGateway extends EventEmitter {
  private routes: RouteConfig[] = [];
  private cache: Map<string, { data: any; expiresAt: number }> = new Map();
  private requestLog: RequestLog[] = [];
  private maxLogSize = 10000;

  /** Register a route */
  register(config: RouteConfig): void {
    this.routes.push(config);
    logger.info({ path: config.path, methods: config.methods }, 'Route registered');
  }

  /** Register multiple routes */
  registerAll(configs: RouteConfig[]): void {
    for (const config of configs) this.register(config);
  }

  /** Find matching route for a request */
  matchRoute(method: string, path: string): RouteConfig | null {
    for (const route of this.routes) {
      if (!route.methods.includes(method.toUpperCase()) && !route.methods.includes('*')) continue;
      if (this.pathMatches(route.path, path)) return route;
    }
    return null;
  }

  /** Check if a request path matches a route pattern */
  private pathMatches(pattern: string, path: string): boolean {
    // Convert route pattern to regex
    const regex = pattern
      .replace(/\*/g, '.*')
      .replace(/:([^/]+)/g, '[^/]+')
      .replace(/\//g, '\\/');
    return new RegExp(`^${regex}$`).test(path);
  }

  /** Extract path parameters from a matched route */
  extractParams(pattern: string, path: string): Record<string, string> {
    const params: Record<string, string> = {};
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i] || '';
      }
    }

    return params;
  }

  /** Generate a cache key */
  private cacheKey(method: string, path: string, headers?: Record<string, string>): string {
    const content = `${method}:${path}:${JSON.stringify(headers || {})}`;
    return createHash('sha256').update(content).digest('hex').slice(0, 16);
  }

  /** Get from cache */
  getFromCache(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  /** Set in cache */
  setInCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, { data, expiresAt: Date.now() + ttl * 1000 });

    // Cleanup expired entries
    if (this.cache.size > 10000) {
      const now = Date.now();
      for (const [k, v] of this.cache) {
        if (now > v.expiresAt) this.cache.delete(k);
      }
    }
  }

  /** Log a request */
  logRequest(log: Omit<RequestLog, 'id' | 'timestamp'>): void {
    const entry: RequestLog = { ...log, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() };
    this.requestLog.push(entry);
    if (this.requestLog.length > this.maxLogSize) {
      this.requestLog.shift();
    }
    this.emit('request:logged', entry);
  }

  /** Get request logs */
  getLogs(limit: number = 100, path?: string, status?: number): RequestLog[] {
    let logs = this.requestLog.slice(-limit);
    if (path) logs = logs.filter((l) => l.path.startsWith(path));
    if (status) logs = logs.filter((l) => l.statusCode === status);
    return logs;
  }

  /** Get gateway stats */
  getStats(): {
    totalRoutes: number;
    cacheSize: number;
    totalRequests: number;
    avgLatencyMs: number;
    errorRate: number;
    cacheHitRate: number;
  } {
    const totalRequests = this.requestLog.length;
    const avgLatency = totalRequests > 0
      ? this.requestLog.reduce((sum, l) => sum + l.latencyMs, 0) / totalRequests
      : 0;
    const errors = this.requestLog.filter((l) => l.statusCode >= 400).length;
    const cached = this.requestLog.filter((l) => l.cached).length;

    return {
      totalRoutes: this.routes.length,
      cacheSize: this.cache.size,
      totalRequests,
      avgLatencyMs: Math.round(avgLatency),
      errorRate: totalRequests > 0 ? errors / totalRequests : 0,
      cacheHitRate: totalRequests > 0 ? cached / totalRequests : 0,
    };
  }

  /** Clear cache */
  clearCache(pattern?: string): number {
    let cleared = 0;
    for (const [key] of this.cache) {
      if (!pattern || key.includes(pattern)) {
        this.cache.delete(key);
        cleared++;
      }
    }
    return cleared;
  }

  /** List all routes */
  listRoutes(): Array<{ path: string; methods: string[]; upstream?: string; cacheTtl?: number; requireAuth?: boolean }> {
    return this.routes.map((r) => ({
      path: r.path,
      methods: r.methods,
      upstream: r.upstream,
      cacheTtl: r.cacheTtl,
      requireAuth: r.requireAuth,
    }));
  }
}

export function createApiGateway(): ApiGateway {
  return new ApiGateway();
}
