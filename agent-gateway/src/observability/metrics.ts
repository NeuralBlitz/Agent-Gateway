/**
 * Observability layer — metrics, tracing, and Prometheus scraping.
 * Collects request counts, latencies, error rates, token usage, and more.
 */

import { Counter, Histogram, Gauge, register } from 'prom-client';
import { logger } from '../infra/index.js';

// --- Metrics ---

/** HTTP request counter */
const httpRequestsTotal: Counter<string> = new Counter({
  name: 'agw_http_requests_total',
  help: 'Total HTTP requests by method, route, and status code',
  labelNames: ['method', 'route', 'status'],
});

/** HTTP request latency histogram */
const httpRequestDuration: Histogram<string> = new Histogram({
  name: 'agw_http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route'],
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 30],
});

/** Message counter by channel */
const messagesTotal: Counter<string> = new Counter({
  name: 'agw_messages_total',
  help: 'Total messages processed by channel and direction',
  labelNames: ['channel', 'direction'], // direction: inbound/outbound
});

/** API provider call counter */
const apiCallsTotal: Counter<string> = new Counter({
  name: 'agw_api_calls_total',
  help: 'Total API calls to AI providers',
  labelNames: ['provider', 'model', 'status'],
});

/** API latency histogram */
const apiCallDuration: Histogram<string> = new Histogram({
  name: 'agw_api_call_duration_seconds',
  help: 'AI provider API call duration in seconds',
  labelNames: ['provider', 'model'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
});

/** Token usage counter */
const tokensTotal: Counter<string> = new Counter({
  name: 'agw_tokens_total',
  help: 'Total tokens consumed (prompt + completion)',
  labelNames: ['provider', 'model', 'type'], // type: prompt/completion
});

/** Active sessions gauge */
const activeSessions: Gauge<string> = new Gauge({
  name: 'agw_active_sessions',
  help: 'Number of active sessions',
  labelNames: ['channel'],
});

/** Cache hit/miss counter */
const cacheHitsTotal: Counter<string> = new Counter({
  name: 'agw_cache_hits_total',
  help: 'Cache hits and misses',
  labelNames: ['result'], // hit/miss
});

/** Tool execution counter */
const toolExecutionsTotal: Counter<string> = new Counter({
  name: 'agw_tool_executions_total',
  help: 'Tool executions by name and success/failure',
  labelNames: ['tool', 'result'], // result: success/error
});

/** Error counter */
const errorsTotal: Counter<string> = new Counter({
  name: 'agw_errors_total',
  help: 'Total errors by type and source',
  labelNames: ['type', 'source'],
});

/** Uptime gauge */
const uptimeSeconds: Gauge<string> = new Gauge({
  name: 'agw_uptime_seconds',
  help: 'Gateway uptime in seconds',
});

// Start uptime tracking
const startTime: number = Date.now();
const uptimeInterval: NodeJS.Timeout = setInterval(() => {
  uptimeSeconds.set((Date.now() - startTime) / 1000);
}, 5000);

// --- Helpers ---

export function recordHttpRequest(method: string, route: string, status: number, durationMs: number): void {
  httpRequestsTotal.labels(method, route, String(status)).inc();
  httpRequestDuration.labels(method, route).observe(durationMs / 1000);
}

export function recordMessage(channel: string, direction: 'inbound' | 'outbound'): void {
  messagesTotal.labels(channel, direction).inc();
}

export function recordApiCall(provider: string, model: string, status: string, durationMs: number, usage?: { promptTokens: number; completionTokens: number }): void {
  apiCallsTotal.labels(provider, model, status).inc();
  apiCallDuration.labels(provider, model).observe(durationMs / 1000);

  if (usage) {
    tokensTotal.labels(provider, model, 'prompt').inc(usage.promptTokens);
    tokensTotal.labels(provider, model, 'completion').inc(usage.completionTokens);
  }
}

export function recordSessionCount(channel: string, count: number): void {
  activeSessions.labels(channel).set(count);
}

export function recordCacheHit(hit: boolean): void {
  cacheHitsTotal.labels(hit ? 'hit' : 'miss').inc();
}

export function recordToolExecution(tool: string, success: boolean): void {
  toolExecutionsTotal.labels(tool, success ? 'success' : 'error').inc();
}

export function recordError(type: string, source: string): void {
  errorsTotal.labels(type, source).inc();
}

/** Get Prometheus metrics as text */
export async function getMetrics(): Promise<string> {
  return register.metrics();
}

/** Reset all metrics (useful for testing) */
export function resetMetrics(): void {
  register.clear();
}

/** Express middleware for automatic request timing */
export function metricsMiddleware(req: any, _res: any, next: () => void): void {
  const start = Date.now();
  const originalEnd = _res.end.bind(_res);

  _res.end = function (...args: any[]) {
    const duration = Date.now() - start;
    const route = req.route?.path || req.path || 'unknown';
    recordHttpRequest(req.method, route, _res.statusCode, duration);
    originalEnd(...args);
  };

  next();
}

export function getMetricsRegistry(): typeof register {
  return register;
}

// Graceful cleanup on exit
process.on('SIGTERM', () => {
  clearInterval(uptimeInterval);
});

process.on('SIGINT', () => {
  clearInterval(uptimeInterval);
});

export {
  httpRequestsTotal,
  httpRequestDuration,
  messagesTotal,
  apiCallsTotal,
  apiCallDuration,
  tokensTotal,
  activeSessions,
  cacheHitsTotal,
  toolExecutionsTotal,
  errorsTotal,
  uptimeSeconds,
};
