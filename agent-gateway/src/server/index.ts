import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer as createHttpServer, Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { join } from 'path';
import { existsSync } from 'fs';
import 'dotenv/config';
import { logger } from '../infra/index.js';
import { Gateway } from '../gateway/index.js';
import { AutoReply } from '../auto-reply/index.js';
import { SessionManager, FileSessionPersistence } from '../sessions/index.js';
import { getGlobalHooks } from '../hooks/index.js';
import { BaseAgent } from '../agents/index.js';
import { ToolRegistry, createToolRegistry } from '../tools/registry.js';
import { PluginLoader, createPluginLoader } from '../plugins/loader.js';
import { createSSEResponse, streamToCallback } from '../streaming/index.js';
import { metricsMiddleware, getMetrics, recordMessage } from '../observability/metrics.js';
import { trace, getTracer } from '../observability/tracing.js';
import { getEventBus, publishMessageEvent } from '../eventbus/index.js';
import { ContextManager, createContextManager } from '../context/index.js';
import { Auth } from '../auth/index.js';
import { AuthManager, createAuthManager } from '../auth/enterprise.js';
import { RateLimiter, Throttler } from '../ratelimit/index.js';
import { RateLimitManager, createRateLimitManager } from '../middleware/rate-limit.js';
import { ValidationManager, createValidationManager } from '../middleware/validation.js';
import { createResponseCache } from '../cache/index.js';
import { FailoverProvider, createFailoverProvider } from '../failover/index.js';
import { createAuditLogger, auditLogin, auditMessageSend, getAuditLogger } from '../audit/index.js';
import { createSecretManager } from '../secrets/index.js';
import { createAdminRouter, type AdminDeps } from '../admin/index.js';
import { createModerationPipeline, type ModerationPipeline } from '../moderation/index.js';
import { createFeatureFlagManager } from '../feature-flags/index.js';
import { createMessageQueue } from '../queue/index.js';
import { createRuleEngine } from '../rule-engine/index.js';
import { createWorkflowEngine } from '../workflow/index.js';
import { createBackupManager } from '../backup/index.js';
import { createConversationAnalytics } from '../analytics/index.js';
import { createNotificationSystem } from '../notifications/index.js';
import { createConfigReloader } from '../config/reloader.js';
import { createConnectionPool } from '../connection-pool/index.js';
import { createServiceRegistry } from '../service-registry/index.js';
import { createResponseTransformer } from '../response-transformer/index.js';
import { createGraphQLGateway } from '../graphql/index.js';
import { createOpenApiGenerator } from '../openapi/index.js';
import { createEmbeddingStore } from '../embedding-store/index.js';
import { createDistributedLockManager } from '../distributed-lock/index.js';
import { createErrorHandler } from '../error-handler/index.js';
import { createRequestLogger } from '../request-logger/index.js';
import { createConfigManager } from '../config-manager/index.js';
import { createWebhookManager } from '../webhook-manager/index.js';
import { createApiGateway } from '../api-gateway/index.js';
import { createApiKeyManager } from '../api-key-manager/index.js';
import { createSessionManager as createEnterpriseSessionManager, MemorySessionStore } from '../session-manager/index.js';
import { createContentModerator } from '../content-moderator/index.js';
import { createRealTimeDashboard } from '../dashboard/index.js';
import { createApiVersionManager } from '../api-version-manager/index.js';
import { createApiVersionManager as createApiVersionManager2 } from '../api-version-manager/index.js';
import { createCacheManager } from '../cache-manager/index.js';
import { createConnectionManager } from '../connection-manager/index.js';
import { createCronScheduler } from '../cron/index.js';
import { createHealthChecker } from '../health-checker/index.js';
import { createShutdownManager } from '../graceful-shutdown/index.js';
import { createMiddlewarePipeline, Middleware } from '../middleware-pipeline/index.js';
import { createResponseTransformer } from '../response-transformer/index.js';
import { createGraphQLGateway } from '../graphql/index.js';
import { createOpenApiGenerator } from '../openapi/index.js';
import { createEmbeddingStore } from '../embedding-store/index.js';
import { createDistributedLockManager } from '../distributed-lock/index.js';
import { createErrorHandler } from '../error-handler/index.js';
import { createRequestLogger } from '../request-logger/index.js';
import { createConfigManager } from '../config-manager/index.js';
import { createWebhookManager } from '../webhook-manager/index.js';
import { createAdvancedRateLimiter } from '../advanced-rate-limiter/index.js';
import { createApiGateway } from '../api-gateway/index.js';
import { createApiKeyManager } from '../api-key-manager/index.js';
import { createSessionManager as createEnterpriseSessionManager, MemorySessionStore } from '../session-manager/index.js';
import { createContentModerator } from '../content-moderator/index.js';
import { createRealTimeDashboard } from '../dashboard/index.js';
import { createCacheManager } from '../cache-manager/index.js';
import { createConnectionManager } from '../connection-manager/index.js';
import { createDataTransformer } from '../data-transformer/index.js';
import { createEventStore } from '../event-store/index.js';
import { InputSanitizer } from '../input-sanitizer/index.js';
import { Paginator } from '../pagination/index.js';
import { createSchemaRegistry } from '../schema-registry/index.js';
import { createMessageBus } from '../message-bus/index.js';
import { createObservabilityEngine } from '../observability-engine/index.js';
import { createRateLimitEngine } from '../rate-limit-engine/index.js';
import { createRequestDeduplicator } from '../request-deduplicator/index.js';
import { createRequestTracker } from '../request-tracker/index.js';
import { createResourceLocker } from '../resource-locker/index.js';
import { withRetry, withTimeout, createBulkhead } from '../retry-handler/index.js';
import { createSearchEngine } from '../search-engine/index.js';
import { createSecurityScanner } from '../security-scanner/index.js';
import { createTaskScheduler } from '../task-scheduler/index.js';
import { createFeatureFlagManager as createFeatureToggleManager } from '../feature-flags/index.js';
import { register } from 'prom-client';
import { createSkillsEngine } from '../skills-engine/index.js';
import { createDataTransformer } from '../data-transformer/index.js';
import { createEventStore } from '../event-store/index.js';
import { InputSanitizer } from '../input-sanitizer/index.js';
import { Paginator } from '../pagination/index.js';
import { createSchemaRegistry } from '../schema-registry/index.js';
import { createMessageBus } from '../message-bus/index.js';
import { createObservabilityEngine } from '../observability-engine/index.js';
import { createRateLimitEngine } from '../rate-limit-engine/index.js';
import { createRequestDeduplicator } from '../request-deduplicator/index.js';
import { createRequestTracker } from '../request-tracker/index.js';
import { createResourceLocker } from '../resource-locker/index.js';
import { withRetry, withTimeout, createBulkhead } from '../retry-handler/index.js';
import { createSearchEngine } from '../search-engine/index.js';
import { createSecurityScanner } from '../security-scanner/index.js';
import { createTaskScheduler } from '../task-scheduler/index.js';
import { createFeatureFlagManager as createFeatureToggleManager } from '../feature-flags/index.js';
import { register } from 'prom-client';
import { createSkillsEngine } from '../skills-engine/index.js';
import type { Channel } from '../channels/index.js';
import type { Provider } from '../providers/index.js';
import type { GatewayConfig } from '../config/index.js';
import type { ChatMessage } from '../providers/types.js';

export interface ServerOptions {
  host: string;
  port: number;
  gateway: Gateway;
  sessionManager: SessionManager;
  autoReply: AutoReply;
  config: GatewayConfig;
  staticDir?: string;
  /** Optional tenant manager for multi-tenant mode */
  tenantManager?: TenantManager;
  /** Optional response cache */
  responseCache?: ReturnType<typeof createResponseCache>;
  /** Optional context manager */
  contextManager?: ContextManager;
  /** Optional enterprise auth manager */
  authManager?: AuthManager;
  /** Optional rate limit manager */
  rateLimitManager?: RateLimitManager;
  /** Optional validation manager */
  validationManager?: ValidationManager;
  moderationPipeline?: ModerationPipeline;
  /** Optional feature flag manager */
  featureFlags?: ReturnType<typeof createFeatureFlagManager>;
  /** Optional message queue */
  messageQueue?: ReturnType<typeof createMessageQueue>;
  /** Optional rule engine */
  ruleEngine?: ReturnType<typeof createRuleEngine>;
  /** Optional workflow engine */
  workflowEngine?: ReturnType<typeof createWorkflowEngine>;
  /** Optional backup manager */
  backupManager?: ReturnType<typeof createBackupManager>;
  /** Optional conversation analytics */
  analytics?: ReturnType<typeof createConversationAnalytics>;
  /** Optional API version manager */
  apiVersionManager?: ReturnType<typeof createApiVersionManager>;
  /** Optional notification system */
  notifications?: ReturnType<typeof createNotificationSystem>;
  /** Optional connection pool */
  connectionPool?: ReturnType<typeof createConnectionPool>;
  /** Optional service registry */
  serviceRegistry?: ReturnType<typeof createServiceRegistry>;
  middlewarePipeline?: ReturnType<typeof createMiddlewarePipeline>;
  /** Optional response transformer */
  responseTransformer?: ReturnType<typeof createResponseTransformer>;
  /** Optional GraphQL gateway */
  graphQLGateway?: ReturnType<typeof createGraphQLGateway>;
  /** Optional OpenAPI generator */
  openApiGenerator?: ReturnType<typeof createOpenApiGenerator>;
  /** Optional embedding store */
  embeddingStore?: ReturnType<typeof createEmbeddingStore>;
  /** Optional distributed lock manager */
  distributedLock?: ReturnType<typeof createDistributedLockManager>;
  /** Optional error handler */
  errorHandler?: ReturnType<typeof createErrorHandler>;
  /** Optional request logger */
  requestLogger?: ReturnType<typeof createRequestLogger>;
  /** Optional config manager */
  configManager?: ReturnType<typeof createConfigManager>;
  /** Optional webhook manager */
  webhookManager?: ReturnType<typeof createWebhookManager>;
  /** Optional advanced rate limiter */
  advancedRateLimiter?: ReturnType<typeof createAdvancedRateLimiter>;
  /** Optional enterprise audit logger */
  enterpriseAuditLogger?: ReturnType<typeof createAuditLogger>;
  /** Optional API gateway */
  apiGateway?: ReturnType<typeof createApiGateway>;
  /** Optional API key manager */
  apiKeyManager?: ReturnType<typeof createApiKeyManager>;
  /** Optional API proxy */
  apiProxy?: ReturnType<typeof createApiProxy>;
  /** Optional enterprise session manager */
  enterpriseSessionManager?: ReturnType<typeof createEnterpriseSessionManager>;
  /** Optional content moderator */
  contentModerator?: ReturnType<typeof createContentModerator>;
  /** Optional enterprise rate limiter */
  enterpriseRateLimiter?: ReturnType<typeof createRateLimiter>;
  /** Optional secret manager (alt) */
  secretManager2?: ReturnType<typeof createSecretManager>;
  /** Optional tenant manager (alt) */
  tenantManager2?: ReturnType<typeof createTenantManager>;
  /** Optional real-time dashboard */
  dashboard?: ReturnType<typeof createRealTimeDashboard>;
  /** Optional API version manager (alt) */
  apiVersionManager2?: ReturnType<typeof createApiVersionManager2>;
  /** Optional cache manager */
  cacheManager?: ReturnType<typeof createCacheManager>;
  /** Optional connection manager */
  connectionManager?: ReturnType<typeof createConnectionManager>;
  /** Optional cron scheduler */
  cronScheduler?: ReturnType<typeof createCronScheduler>;
  /** Optional data transformer */
  dataTransformer?: ReturnType<typeof createDataTransformer>;
  /** Optional event store */
  eventStore?: ReturnType<typeof createEventStore>;
  /** Optional feature toggle manager */
  featureToggleManager?: ReturnType<typeof createFeatureToggleManager>;
  /** Optional message bus */
  messageBus?: ReturnType<typeof createMessageBus>;
  /** Optional observability engine */
  observabilityEngine?: ReturnType<typeof createObservabilityEngine>;
  /** Optional rate limit engine */
  rateLimitEngine?: ReturnType<typeof createRateLimitEngine>;
  /** Optional request deduplicator */
  requestDeduplicator?: ReturnType<typeof createRequestDeduplicator>;
  /** Optional request tracker */
  requestTracker?: ReturnType<typeof createRequestTracker>;
  /** Optional resource locker */
  resourceLocker?: ReturnType<typeof createResourceLocker>;
  /** Optional bulkhead */
  bulkhead?: ReturnType<typeof createBulkhead>;
  /** Optional schema registry */
  schemaRegistry?: ReturnType<typeof createSchemaRegistry>;
  /** Optional search engine */
  searchEngine?: ReturnType<typeof createSearchEngine>;
  /** Optional security scanner */
  securityScanner?: ReturnType<typeof createSecurityScanner>;
  /** Optional task scheduler */
  taskScheduler?: ReturnType<typeof createTaskScheduler>;
  /** Optional skills engine */
  skillsEngine?: ReturnType<typeof createSkillsEngine>;
}

export class AgentServer {
  private app: Express;
  private httpServer: HttpServer;
  private wsServer: WebSocketServer;
  private options: ServerOptions;
  private isRunning = false;

  constructor(options: ServerOptions) {
    this.options = options;
    this.app = express();
    this.httpServer = createHttpServer(this.app);
    this.wsServer = new WebSocketServer({ server: this.httpServer, path: '/ws' });
  }

  async start(): Promise<void> {
    // Middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Metrics middleware (automatic request timing)
    this.app.use(metricsMiddleware);

    // Idempotency middleware (deduplicate retries)

    // Input sanitization middleware (opt-in via env)
    const sanitizeEnabled = process.env.INPUT_SANITIZATION === '1';
    if (sanitizeEnabled) {
      this.app.use((req: Request, _res: Response, next: NextFunction) => {
        if (req.body && typeof req.body === 'object') {
          const sanitized: Record<string, any> = {};
          for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string') {
              // Apply command sanitization to all string fields (blocks shell metacharacters)
              sanitized[key] = InputSanitizer.sanitizeCommand(value);
            } else {
              sanitized[key] = value;
            }
          }
          req.body = sanitized;
        }
        next();
      });
    }

    // Webhook paths bypass sanitization (need raw payloads)
    const webhookPaths = new Set(['/webhook/telegram', '/webhook/discord', '/webhook/slack', '/webhook/whatsapp', '/webhook/signal', '/webhook/matrix']);

    // CORS headers (configurable for prod, permissive for dev)
    this.app.use((_req, res, next) => {
      const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
        ? process.env.CORS_ALLOWED_ORIGINS.split(',').map((o) => o.trim())
        : ['*'];

      const origin = _req.headers.origin;
      if (allowedOrigins.includes('*') || (origin && allowedOrigins.includes(origin))) {
        res.header('Access-Control-Allow-Origin', allowedOrigins.includes('*') ? '*' : (origin || ''));
      }
      res.header('Access-Control-Allow-Methods', process.env.CORS_ALLOWED_METHODS || 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', process.env.CORS_ALLOWED_HEADERS || 'Content-Type, Authorization, X-API-Key');

      // Allow credentials if not using wildcard origin
      if (!allowedOrigins.includes('*')) {
        res.header('Access-Control-Allow-Credentials', 'true');
      }

      if (_req.method === 'OPTIONS') {
        // Preflight cache
        res.header('Access-Control-Max-Age', process.env.CORS_MAX_AGE || '86400');
        res.sendStatus(204);
        return;
      }
      next();
    });

    // --- Validation middleware (Zod schemas) ---
    if (this.options.validationManager) {
      this.app.use(this.options.validationManager.middleware());
    }

    // --- Enterprise auth (JWT + OAuth2/OIDC, opt-in) ---
    if (this.options.authManager) {
      this.app.use(this.options.authManager.jwtMiddleware());
      logger.info('Enterprise JWT auth middleware active');
    } else {
      // --- Basic auth middleware (opt-in via env) ---
      const authEnabled = process.env.AUTH_ENABLED === '1';
      const authApiKey = process.env.AUTH_API_KEY;
      if (authEnabled && authApiKey) {
        const auth = new Auth({ apiKey: authApiKey, sessionDuration: parseInt(process.env.AUTH_SESSION_DURATION || '3600000', 10) });

        // Create a default admin user if configured
        const adminUser = process.env.AUTH_ADMIN_USER;
        const adminPass = process.env.AUTH_ADMIN_PASS;
        if (adminUser && adminPass) {
          auth.registerUser(adminUser, adminPass, ['admin']);
        }

        // Register API key from env
        if (process.env.AUTH_API_KEY_USER) {
          const user = auth.registerUser(process.env.AUTH_API_KEY_USER, '', ['admin']);
          auth.createApiKey(process.env.AUTH_API_KEY_USER);
        }

        // Public paths that don't require auth

        this.app.use((req: Request, res: Response, next: NextFunction) => {
          if (publicPaths.has(req.path)) return next();

          // Check API key header
          const apiKey = req.headers['x-api-key'] as string | undefined;
          if (apiKey && apiKey === authApiKey) return next();

          // Check tenant API key
          if (apiKey && this.options.tenantManager) {
            const tenantResult = this.options.tenantManager.validateApiKey(apiKey);
            if (tenantResult) {
              (req as any).tenant = tenantResult.tenant;
              (req as any).apiKey = tenantResult.apiKey;
              return next();
            }
          }

          // Check Bearer token
          const authHeader = req.headers['authorization'] as string | undefined;
          if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.slice(7);
            auth.verifyToken(token).then((user) => {
              if (user) {
                (req as any).user = user;
                next();
              } else {
                res.status(401).json({ error: 'Invalid or expired token' });
              }
            }).catch(() => {
              res.status(500).json({ error: 'Auth verification failed' });
            });
            return;
          }

          res.status(401).json({ error: 'Authentication required. Provide X-API-Key header or Bearer token.' });
        });
      }
    }

    // --- Enterprise rate limiting (opt-in) ---
    if (this.options.rateLimitManager) {
      this.app.use(this.options.rateLimitManager.middleware());
      logger.info('Enterprise rate limit middleware active');
    } else {
      // --- Basic rate limiting (opt-in via env) ---
      const rateLimitEnabled = process.env.RATE_LIMIT_ENABLED === '1';
      let rateLimiter: RateLimiter | undefined;
      if (rateLimitEnabled) {
        rateLimiter = new RateLimiter({
          global: {
            points: parseInt(process.env.RATE_LIMIT_GLOBAL || '100', 10),
            duration: parseInt(process.env.RATE_LIMIT_DURATION || '60', 10),
          },
        });

        this.app.use((req: Request, res: Response, next: NextFunction) => {
          if (!rateLimiter) return next();

          const key = req.ip || req.socket.remoteAddress || 'unknown';
          rateLimiter.check(key).then((result) => {
            res.set({
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': String(result.remaining),
              'X-RateLimit-Reset': String(result.resetAt),
            });

            if (!result.allowed) {
              res.set('Retry-After', String(result.retryAfter ?? 0));
              res.status(429).json({ error: 'Rate limit exceeded', retryAfter: result.retryAfter });
              return;
            }
            next();
          }).catch(() => next());
        });
      }
    }

    // --- Routes ---

    // Health checks
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({ ok: true, uptime: process.uptime(), gateway: this.options.gateway.isHealthy() });
    });

    this.app.get('/healthz', (_req: Request, res: Response) => {
      res.send('ok');
    });

    this.app.get('/ready', (_req: Request, res: Response) => {
      const ready = this.isRunning && this.options.gateway.isHealthy();
      if (ready) {
        res.send('ok');
      } else {
        res.status(503).send('not ready');
      }
    });

    // Prometheus metrics
    this.app.get('/metrics', async (_req: Request, res: Response) => {
      res.set('Content-Type', register.contentType);
      res.send(await getMetrics());
    });

    // Tracing debug endpoint
    this.app.get('/api/traces', (_req: Request, res: Response) => {
      const tracer = getTracer();
      const limit = parseInt((_req.query.limit as string) || '100', 10);
      res.json({ traces: tracer.getRecentSpans(limit) });
    });

    this.app.get('/api/traces/errors', (_req: Request, res: Response) => {
      const tracer = getTracer();
      const limit = parseInt((_req.query.limit as string) || '50', 10);
      res.json({ errors: tracer.getErrorSpans(limit) });
    });

    // API: events (for debugging)
    this.app.get('/api/events', (_req: Request, res: Response) => {
      const bus = getEventBus();
      const type = _req.query.type as string;
      const limit = parseInt((_req.query.limit as string) || '100', 10);
      if (type) {
        res.json({ events: bus.getEvents(type as any, limit) });
      } else {
        res.json({ events: bus.getRecentEvents(limit) });
      }
    });

    this.app.get('/api/events/dead-letters', (_req: Request, res: Response) => {
      const bus = getEventBus();
      res.json({ deadLetters: bus.getDeadLetters() });
    });

    // API: context window stats
    this.app.get('/api/context', (_req: Request, res: Response) => {
      const model = (_req.query.model as string) || 'gpt-4o';
      const manager = createContextManager();
      const sampleMessages: ChatMessage[] = [];
      const stats = manager.getStats(sampleMessages, model);
      res.json({ model, ...stats, knownModels: Object.keys(require('../context/index.js')?.MODEL_CONTEXT_WINDOWS || {}) });
    });

    // API: gateway status
    this.app.get('/api/status', (_req: Request, res: Response) => {
      res.json({
        running: this.isRunning,
        channels: Array.from(this.options.gateway.getChannels().keys()),
        providers: Array.from(this.options.gateway.getProviders().keys()),
        sessionCount: this.options.sessionManager.list().length,
      });
    });

    // API: sessions
    this.app.get('/api/sessions', (_req: Request, res: Response) => {
      const sessions = this.options.sessionManager.list().map((s) => ({
        id: s.id,
        channel: s.channel,
        userId: s.userId,
        messageCount: s.getMessages().length,
        createdAt: s.createdAt,
      }));
      res.json({ sessions });
    });

    this.app.delete('/api/sessions/:id', (req: Request, res: Response) => {
      const id = typeof req.params.id === 'string' ? req.params.id : '';
      if (!id) {
        res.status(400).json({ error: 'session ID required' });
        return;
      }
      const deleted = this.options.sessionManager.delete(id);
      if (deleted) {
        res.json({ ok: true });
      } else {
        res.status(404).json({ error: 'session not found' });
      }
    });

    // --- Tenant API routes ---
    if (this.options.tenantManager) {
      this.app.post('/api/tenants', async (req: Request, res: Response) => {
        try {
          const tenant = await this.options.tenantManager!.registerTenant(req.body);
          res.status(201).json({ tenant });
        } catch (err: any) {
          res.status(400).json({ error: err.message });
        }
      });

      this.app.get('/api/tenants/:id', (req: Request, res: Response) => {
        const tenant = this.options.tenantManager!.getTenant(req.params.id as string);
        if (!tenant) {
          res.status(404).json({ error: 'tenant not found' });
          return;
        }
        res.json({ tenant });
      });

      this.app.post('/api/tenants/:id/api-keys', async (req: Request, res: Response) => {
        try {
          const { name, permissions, expiresAt } = req.body;
          const result = this.options.tenantManager!.createApiKey(req.params.id as string, name, permissions, expiresAt);
          res.status(201).json(result);
        } catch (err: any) {
          res.status(400).json({ error: err.message });
        }
      });

      this.app.delete('/api/tenants/:id/api-keys/:keyId', (req: Request, res: Response) => {
        const revoked = this.options.tenantManager!.revokeApiKey(req.params.keyId as string);
        res.json({ ok: revoked });
      });

      this.app.get('/api/tenants/:id/usage', (req: Request, res: Response) => {
        const usage = this.options.tenantManager!.getUsage(req.params.id as string);
        if (!usage) {
          res.status(404).json({ error: 'tenant usage not found' });
          return;
        }
        res.json({ usage });
      });
    }

    // --- Context management API ---
    this.app.post('/api/context/fit', (req: Request, res: Response) => {
      if (!this.options.contextManager) {
        res.status(503).json({ error: 'Context manager not configured' });
        return;
      }
      const { messages, model } = req.body;
      if (!messages) {
        res.status(400).json({ error: 'messages required' });
        return;
      }
      const result = this.options.contextManager.fitToContext(messages, model);
      res.json(result);
    });

    // --- Cache management API ---
    if (this.options.responseCache) {
      this.app.get('/api/cache/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.responseCache!.stats() });
      });

      this.app.delete('/api/cache', (_req: Request, res: Response) => {
        this.options.responseCache!.invalidateAll();
        res.json({ ok: true });
      });
    }

    // --- Enterprise Auth API ---
    if (this.options.authManager) {
      this.app.post('/api/auth/login', async (req: Request, res: Response) => {
        const { username, password } = req.body;
        if (!username || !password) {
          res.status(400).json({ error: 'username and password required' });
          return;
        }
        const result = await this.options.authManager!.authenticate(username, password);
        if (result.success) {
          await auditLogin(result.user!.id, req.ip);
          res.json({ token: result.token, user: result.user });
        } else {
          res.status(401).json({ error: result.error });
        }
      });

      this.app.post('/api/auth/refresh', async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        if (!refreshToken) {
          res.status(400).json({ error: 'refreshToken required' });
          return;
        }
        const result = await this.options.authManager!.refreshToken(refreshToken);
        if (result.success) {
          res.json({ token: result.token });
        } else {
          res.status(401).json({ error: result.error });
        }
      });

      this.app.post('/api/auth/logout', async (req: Request, res: Response) => {
        const { refreshToken } = req.body;
        if (refreshToken) {
          await this.options.authManager!.revokeRefreshToken(refreshToken);
        }
        res.json({ ok: true });
      });

      this.app.get('/api/auth/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.authManager!.getStats() });
      });
    }

    // --- Audit API ---
    const audit = getAuditLogger();
    this.app.get('/api/audit/recent', (req: Request, res: Response) => {
      const limit = parseInt((req.query.limit as string) || '100', 10);
      res.json({ events: audit.getRecent(limit) });
    });

    this.app.get('/api/audit/search', (req: Request, res: Response) => {
      const { type, actor, tenantId } = req.query;
      const limit = parseInt((req.query.limit as string) || '100', 10);
      if (type) {
        res.json({ events: audit.searchByType(type as any, limit) });
      } else if (actor) {
        res.json({ events: audit.searchByActor(actor as string, limit) });
      } else if (tenantId) {
        res.json({ events: audit.searchByTenant(tenantId as string, limit) });
      } else {
        res.status(400).json({ error: 'type, actor, or tenantId query param required' });
      }
    });

    this.app.get('/api/audit/verify', (_req: Request, res: Response) => {
      res.json({ integrity: audit.verifyChain() });
    });

    this.app.get('/api/audit/stats', (_req: Request, res: Response) => {
      res.json({ stats: audit.getStats() });
    });

    // --- Secrets API ---
    const secrets = createSecretManager();
    this.app.post('/api/secrets', async (req: Request, res: Response) => {
      const { name, value, allowedRoles } = req.body;
      if (!name || !value) {
        res.status(400).json({ error: 'name and value required' });
        return;
      }
      await secrets.set(name, value, allowedRoles || ['admin']);
      res.json({ ok: true });
    });

    this.app.get('/api/secrets', (_req: Request, res: Response) => {
      res.json({ secrets: secrets.list() });
    });

    this.app.get('/api/secrets/stats', (_req: Request, res: Response) => {
      res.json({ stats: secrets.getStats() });
    });

    this.app.delete('/api/secrets/:name', async (req: Request, res: Response) => {
      const deleted = await secrets.delete(req.params.name);
      res.json({ ok: deleted });
    });

    // --- Feature Flags API ---
    if (this.options.featureFlags) {
      this.app.get('/api/flags', (_req: Request, res: Response) => {
        res.json({ flags: this.options.featureFlags!.listFlags() });
      });

      this.app.get('/api/flags/:key', (req: Request, res: Response) => {
        const ctx = { tenantId: req.query.tenantId as string, userId: req.query.userId as string };
        const result = this.options.featureFlags!.evaluate(req.params.key, ctx);
        res.json({ key: req.params.key, ...result });
      });

      this.app.post('/api/flags/:key/toggle', (req: Request, res: Response) => {
        const { enabled } = req.body;
        this.options.featureFlags!.toggle(req.params.key, enabled);
        res.json({ ok: true });
      });

      this.app.post('/api/flags/:key/rollout', (req: Request, res: Response) => {
        const { percentage } = req.body;
        this.options.featureFlags!.setRollout(req.params.key, percentage);
        res.json({ ok: true });
      });

      this.app.get('/api/flags/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.featureFlags!.getStats() });
      });
    }

    // --- Rule Engine API ---
    if (this.options.ruleEngine) {
      this.app.get('/api/rules', (req: Request, res: Response) => {
        const category = req.query.category as string;
        res.json({ rules: this.options.ruleEngine!.getRules(category) });
      });

      this.app.post('/api/rules', (req: Request, res: Response) => {
        const rule = req.body;
        this.options.ruleEngine!.addRule(rule);
        res.status(201).json({ ok: true, ruleId: rule.id });
      });

      this.app.delete('/api/rules/:id', (req: Request, res: Response) => {
        const removed = this.options.ruleEngine!.removeRule(req.params.id);
        res.json({ ok: removed });
      });

      this.app.post('/api/rules/evaluate', (req: Request, res: Response) => {
        const results = this.options.ruleEngine!.evaluate(req.body);
        res.json({ results });
      });

      this.app.get('/api/rules/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.ruleEngine!.getStats() });
      });
    }

    // --- Workflow API ---
    if (this.options.workflowEngine) {
      this.app.post('/api/workflows/:id/start', async (req: Request, res: Response) => {
        try {
          const execution = await this.options.workflowEngine!.start(req.params.id, req.body.context);
          res.status(201).json({ executionId: execution.id, status: execution.status });
        } catch (err: any) {
          res.status(400).json({ error: err.message });
        }
      });

      this.app.get('/api/workflows/executions/:id', (req: Request, res: Response) => {
        const exec = this.options.workflowEngine!.getExecution(req.params.id);
        if (!exec) {
          res.status(404).json({ error: 'execution not found' });
          return;
        }
        res.json({ execution: exec });
      });

      this.app.post('/api/workflows/executions/:id/cancel', (req: Request, res: Response) => {
        this.options.workflowEngine!.cancel(req.params.id);
        res.json({ ok: true });
      });

      this.app.post('/api/workflows/executions/:id/pause', (req: Request, res: Response) => {
        this.options.workflowEngine!.pause(req.params.id);
        res.json({ ok: true });
      });

      this.app.post('/api/workflows/executions/:id/resume', (req: Request, res: Response) => {
        this.options.workflowEngine!.resume(req.params.id);
        res.json({ ok: true });
      });

      this.app.get('/api/workflows/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.workflowEngine!.getStats() });
      });
    }

    // --- Queue API ---
    if (this.options.messageQueue) {
      this.app.post('/api/queue/:topic/publish', (req: Request, res: Response) => {
        const msg = this.options.messageQueue!.publish(req.params.topic, req.body, {
          priority: req.body.priority || 0,
        });
        res.status(201).json({ messageId: msg.id });
      });

      this.app.get('/api/queue/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.messageQueue!.getStats() });
      });

      this.app.post('/api/queue/:topic/dead-letters/:id/retry', (req: Request, res: Response) => {
        this.options.messageQueue!.retryDeadLetter(req.params.topic, req.params.id);
        res.json({ ok: true });
      });
    }

    // --- Backup API ---
    if (this.options.backupManager) {
      this.app.post('/api/backup/create', async (req: Request, res: Response) => {
        try {
          const backup = await this.options.backupManager!.createBackup(req.body || {});
          res.status(201).json({ backupId: backup.id });
        } catch (err: any) {
          res.status(500).json({ error: err.message });
        }
      });

      this.app.get('/api/backup/list', (_req: Request, res: Response) => {
        res.json({ backups: this.options.backupManager!.listBackups() });
      });

      this.app.post('/api/backup/:id/restore', async (req: Request, res: Response) => {
        try {
          await this.options.backupManager!.restore(req.params.id);
          res.json({ ok: true });
        } catch (err: any) {
          res.status(500).json({ error: err.message });
        }
      });

      this.app.delete('/api/backup/:id', async (req: Request, res: Response) => {
        const deleted = await this.options.backupManager!.deleteBackup(req.params.id);
        res.json({ ok: deleted });
      });
    }

    // --- Analytics API ---
    if (this.options.analytics) {
      this.app.get('/api/analytics/summary', (req: Request, res: Response) => {
        const range = (req.query.range as string) || '24h';
        res.json({ summary: this.options.analytics!.getSummary(range) });
      });

      this.app.get('/api/analytics/trends', (req: Request, res: Response) => {
        const buckets = parseInt((req.query.buckets as string) || '24', 10);
        res.json({ trends: this.options.analytics!.getTrends(buckets) });
      });

      this.app.get('/api/analytics/providers', (_req: Request, res: Response) => {
        res.json({ providers: this.options.analytics!.getProviderStats() });
      });
    }

    // --- Moderation API ---
    if (this.options.moderationPipeline) {
      this.app.post('/api/moderate', async (req: Request, res: Response) => {
        const { content } = req.body;
        if (!content) {
          res.status(400).json({ error: 'content required' });
          return;
        }
        const result = this.options.moderationPipeline!.moderate(content);
        res.json(result);
      });
    }

    // --- Health API ---
    if (this.options.healthChecker) {
      this.app.get('/api/health/check', async (_req: Request, res: Response) => {
        const status = await this.options.healthChecker!.check();
        res.json(status);
      });
    }

    // --- Notifications API ---
    if (this.options.notifications) {
      this.app.post('/api/notify', (req: Request, res: Response) => {
        const { type, title, message } = req.body;
        if (!type || !title || !message) {
          res.status(400).json({ error: 'type, title, and message required' });
          return;
        }
        this.options.notifications!.notify(type, title, message, req.body.recipients, req.body.data);
        res.json({ ok: true });
      });

      this.app.get('/api/notifications/recent', (req: Request, res: Response) => {
        const limit = parseInt((req.query.limit as string) || '50', 10);
        res.json({ notifications: this.options.notifications!.getRecent(limit) });
      });

      this.app.get('/api/notifications/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.notifications!.getStats() });
      });
    }

    // --- Admin API ---
    if (this.options.healthChecker) {
      const adminDeps: AdminDeps = {
        gateway: this.options.gateway,
        sessionManager: this.options.sessionManager,
        analytics: this.options.analytics,
      };
      this.app.use('/api/admin', createAdminRouter(adminDeps));
    }

    // --- Connection Pool API ---
    if (this.options.connectionPool) {
      this.app.get('/api/pool/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.connectionPool!.getStats() });
      });
    }

    // --- Service Registry API ---
    if (this.options.serviceRegistry) {
      this.app.get('/api/services', (_req: Request, res: Response) => {
        res.json({ services: this.options.serviceRegistry!.getServices() });
      });
      this.app.get('/api/services/:name', (req: Request, res: Response) => {
        res.json({ service: this.options.serviceRegistry!.getService(req.params.name) });
      });
      this.app.get('/api/services/:name/instances', (req: Request, res: Response) => {
        res.json({ instances: this.options.serviceRegistry!.getHealthyInstances(req.params.name) });
      });
    }

    // --- GraphQL API ---
    if (this.options.graphQLGateway) {
      this.app.post('/api/graphql', async (req: Request, res: Response) => {
        try {
          const result = await this.options.graphQLGateway!.execute(req.body.query, req.body.variables, req);
          res.json(result);
        } catch (err: any) {
          res.status(400).json({ errors: [{ message: err.message }] });
        }
      });
      this.app.get('/api/graphql/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.graphQLGateway!.getStats() });
      });
    }

    // --- OpenAPI Spec ---
    if (this.options.openApiGenerator) {
      this.app.get('/api/openapi.json', (_req: Request, res: Response) => {
        res.json(this.options.openApiGenerator!.generate());
      });
      this.app.get('/api/openapi.yaml', (_req: Request, res: Response) => {
        res.set('Content-Type', 'text/yaml');
        res.send(this.options.openApiGenerator!.generateYaml());
      });
    }

    // --- Embedding Store API ---
    if (this.options.embeddingStore) {
      this.app.post('/api/embeddings/search', async (req: Request, res: Response) => {
        const { query, limit, threshold, tags } = req.body;
        if (query) {
          const results = await this.options.embeddingStore!.searchByText(query, async () => [], limit, threshold, tags);
          res.json({ results });
        } else {
          res.status(400).json({ error: 'query required' });
        }
      });
      this.app.get('/api/embeddings/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.embeddingStore!.getStats() });
      });
    }

    // --- Distributed Lock API ---
    if (this.options.distributedLock) {
      this.app.get('/api/locks', (_req: Request, res: Response) => {
        res.json({ locks: this.options.distributedLock!.getActiveLocks() });
      });
    }

    // --- Error Handler API ---
    this.app.post('/api/errors/report', async (req: Request, res: Response) => {
      if (this.options.errorHandler) {
        const report = this.options.errorHandler.createReport(req.body.error);
        res.json({ report });
      } else {
        res.status(503).json({ error: 'Error handler not configured' });
      }
    });

    // --- Request Logger API ---
    if (this.options.requestLogger) {
      this.app.get('/api/logs', (req: Request, res: Response) => {
        const limit = parseInt((req.query.limit as string) || '100', 10);
        res.json({ logs: this.options.requestLogger!.getRecent(limit) });
      });
      this.app.get('/api/logs/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.requestLogger!.getStats() });
      });
    }

    // --- Config Manager API ---
    if (this.options.configManager) {
      this.app.get('/api/config/:key', (req: Request, res: Response) => {
        res.json({ key: req.params.key, value: this.options.configManager!.get(req.params.key) });
      });
      this.app.get('/api/config', (_req: Request, res: Response) => {
        res.json({ config: this.options.configManager!.getAll() });
      });
      this.app.put('/api/config/:key', (req: Request, res: Response) => {
        this.options.configManager!.set(req.params.key, req.body.value, 'api');
        res.json({ ok: true });
      });
    }

    // --- Webhook Manager API ---
    if (this.options.webhookManager) {
      this.app.post('/api/webhooks', (req: Request, res: Response) => {
        const { url, events, secret } = req.body;
        const sub = this.options.webhookManager!.createSubscription(url, events, secret);
        res.status(201).json({ subscription: sub });
      });
      this.app.get('/api/webhooks', (req: Request, res: Response) => {
        res.json({ subscriptions: this.options.webhookManager!.listSubscriptions() });
      });
      this.app.delete('/api/webhooks/:id', (req: Request, res: Response) => {
        const deleted = this.options.webhookManager!.deleteSubscription(req.params.id);
        res.json({ ok: deleted });
      });
      this.app.get('/api/webhooks/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.webhookManager!.getStats() });
      });
    }

    // --- Advanced Rate Limiter API ---
    if (this.options.advancedRateLimiter) {
      this.app.post('/api/rate-limit/check', async (req: Request, res: Response) => {
        const { key, max, window } = req.body;
        const result = await this.options.advancedRateLimiter!.check(key, { max, window });
        res.json(result);
      });
    }

    // --- Enterprise Audit API ---
    if (this.options.enterpriseAuditLogger) {
      this.app.get('/api/enterprise/audit/recent', (req: Request, res: Response) => {
        const limit = parseInt((req.query.limit as string) || '100', 10);
        res.json({ events: this.options.enterpriseAuditLogger!.getRecent(limit) });
      });
      this.app.get('/api/enterprise/audit/verify', (_req: Request, res: Response) => {
        res.json({ integrity: this.options.enterpriseAuditLogger!.verifyChain() });
      });
    }

    // --- API Gateway API ---
    if (this.options.apiGateway) {
      this.app.get('/api/api-gateway/routes', (_req: Request, res: Response) => {
        res.json({ routes: this.options.apiGateway!.listRoutes() });
      });
      this.app.get('/api/api-gateway/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.apiGateway!.getStats() });
      });
      this.app.get('/api/api-gateway/logs', (req: Request, res: Response) => {
        const limit = parseInt((req.query.limit as string) || '100', 10);
        res.json({ logs: this.options.apiGateway!.getLogs(limit) });
      });
    }

    // --- API Key Manager API ---
    this.app.post('/api/api-keys', (req: Request, res: Response) => {
      const { name, scopes, tenantId, userId, expiresAt } = req.body;
      if (!name) {
        res.status(400).json({ error: 'name required' });
        return;
      }
      const result = this.options.apiKeyManager!.create({ name, scopes, tenantId, userId, expiresAt });
      res.status(201).json({ key: result.key, keyId: result.apiKey.id });
    });

    this.app.get('/api/api-keys', (req: Request, res: Response) => {
      const filter: any = {};
      if (req.query.tenantId) filter.tenantId = req.query.tenantId;
      if (req.query.userId) filter.userId = req.query.userId;
      res.json({ keys: this.options.apiKeyManager!.list(filter) });
    });

    this.app.get('/api/api-keys/stats', (_req: Request, res: Response) => {
      res.json({ stats: this.options.apiKeyManager!.getStats() });
    });

    this.app.post('/api/api-keys/:id/rotate', (req: Request, res: Response) => {
      const result = this.options.apiKeyManager!.rotate(req.params.id, req.body);
      res.json({ key: result.key, keyId: result.apiKey.id });
    });

    this.app.delete('/api/api-keys/:id', (req: Request, res: Response) => {
      const revoked = this.options.apiKeyManager!.revoke(req.params.id);
      res.json({ ok: revoked });
    });

    // --- API Proxy API ---
    if (this.options.apiProxy) {
      this.app.post('/api/proxy/execute', async (req: Request, res: Response) => {
        try {
          const { upstreamUrl, timeout, maxRetries, delayMs } = req.body;
          const result = await this.options.apiProxy!.proxy(upstreamUrl, req, timeout);
          res.json(result);
        } catch (err: any) {
          res.status(502).json({ error: err.message });
        }
      });
      this.app.get('/api/proxy/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.apiProxy!.getStats() });
      });
    }

    // --- Enterprise Session Manager API ---
    if (this.options.enterpriseSessionManager) {
      this.app.get('/api/enterprise/sessions', async (req: Request, res: Response) => {
        const filter: any = {};
        if (req.query.userId) filter.userId = req.query.userId;
        if (req.query.tenantId) filter.tenantId = req.query.tenantId;
        const sessions = await this.options.enterpriseSessionManager!.list(filter);
        res.json({ sessions });
      });
      this.app.get('/api/enterprise/sessions/:id', async (req: Request, res: Response) => {
        const session = await this.options.enterpriseSessionManager!.get(req.params.id);
        if (!session) {
          res.status(404).json({ error: 'session not found' });
          return;
        }
        res.json({ session });
      });
      this.app.get('/api/enterprise/sessions/:id/messages', async (req: Request, res: Response) => {
        const messages = await this.options.enterpriseSessionManager!.getMessages(req.params.id);
        res.json({ messages });
      });
    }

    // --- Content Moderator API ---
    if (this.options.contentModerator) {
      this.app.post('/api/content/moderate', (req: Request, res: Response) => {
        const { text } = req.body;
        if (!text) {
          res.status(400).json({ error: 'text required' });
          return;
        }
        res.json(this.options.contentModerator!.moderate(text));
      });
    }

    // --- Enterprise Rate Limiter API ---
    if (this.options.enterpriseRateLimiter) {
      this.app.post('/api/enterprise/rate-limit/check', async (req: Request, res: Response) => {
        const { key } = req.body;
        const result = await this.options.enterpriseRateLimiter!.check(key);
        res.json(result);
      });
    }

    // --- Enterprise Health API ---
    if (this.options.healthChecker2) {
      this.app.get('/api/enterprise/health', async (_req: Request, res: Response) => {
        const status = await this.options.healthChecker2!.check();
        res.json(status);
      });
    }

    // --- Enterprise Secret Manager API ---
    if (this.options.secretManager2) {
      this.app.post('/api/enterprise/secrets', async (req: Request, res: Response) => {
        const { name, value } = req.body;
        if (!name || !value) {
          res.status(400).json({ error: 'name and value required' });
          return;
        }
        await this.options.secretManager2!.set(name, value);
        res.json({ ok: true });
      });
      this.app.get('/api/enterprise/secrets', (_req: Request, res: Response) => {
        res.json({ secrets: this.options.secretManager2!.list() });
      });
      this.app.delete('/api/enterprise/secrets/:name', (req: Request, res: Response) => {
        const deleted = this.options.secretManager2!.delete(req.params.name);
        res.json({ ok: deleted });
      });
    }

    // --- Enterprise Tenant Manager API ---
    if (this.options.tenantManager2) {
      this.app.post('/api/enterprise/tenants', async (req: Request, res: Response) => {
        const tenant = await this.options.tenantManager2!.create(req.body);
        res.status(201).json({ tenant });
      });
      this.app.get('/api/enterprise/tenants', (req: Request, res: Response) => {
        const status = req.query.status as any;
        res.json({ tenants: this.options.tenantManager2!.list(status) });
      });
      this.app.get('/api/enterprise/tenants/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.tenantManager2!.getStats() });
      });
    }

    // --- Idempotency API ---
    if (this.options.idempotencyManager2) {
      this.app.get('/api/idempotency/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.idempotencyManager2!.getStats() });
      });
    }

    // --- Dashboard ---
    if (this.options.dashboard) {
      this.app.get('/api/dashboard/clients', (_req: Request, res: Response) => {
        res.json({ clients: this.options.dashboard!.getClientCount() });
      });
    }

    // --- API Version Manager (alt) ---
    if (this.options.apiVersionManager2) {
      this.app.get('/api/enterprise/versions', (_req: Request, res: Response) => {
        res.json({ versions: this.options.apiVersionManager2!.getVersions() });
      });
    }

    // --- Cache Manager API ---
    if (this.options.cacheManager) {
      this.app.get('/api/cache/:key', async (req: Request, res: Response) => {
        const val = await this.options.cacheManager!.get(req.params.key);
        res.json({ key: req.params.key, value: val });
      });
      this.app.delete('/api/cache/:key', async (req: Request, res: Response) => {
        await this.options.cacheManager!.delete(req.params.key);
        res.json({ ok: true });
      });
      this.app.get('/api/cache/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.cacheManager!.getStats() });
      });
    }

    // --- Connection Manager API ---
    if (this.options.connectionManager) {
      this.app.get('/api/connections/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.connectionManager!.getAllStats() });
      });
    }

    // --- Cron API ---
    if (this.options.cronScheduler) {
      this.app.get('/api/cron/jobs', (_req: Request, res: Response) => {
        res.json({ jobs: this.options.cronScheduler!.getJobs() });
      });
      this.app.get('/api/cron/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.cronScheduler!.getStats() });
      });
      this.app.post('/api/cron/jobs/:id/run', async (req: Request, res: Response) => {
        await this.options.cronScheduler!.runNow(req.params.id);
        res.json({ ok: true });
      });
    }

    // --- Data Transformer API ---
    if (this.options.dataTransformer) {
      this.app.post('/api/transform', (req: Request, res: Response) => {
        const result = this.options.dataTransformer!.transform(req.body);
        res.json(result);
      });
      this.app.post('/api/transform/array', (req: Request, res: Response) => {
        const result = this.options.dataTransformer!.transformArray(req.body);
        res.json(result);
      });
    }

    // --- Feature Toggle API ---
    if (this.options.featureToggleManager) {
      this.app.get('/api/features/toggles', (_req: Request, res: Response) => {
        res.json({ toggles: this.options.featureToggleManager!.list() });
      });
      this.app.get('/api/features/toggles/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.featureToggleManager!.getStats() });
      });
    }

    // --- Message Bus API ---
    if (this.options.messageBus) {
      this.app.get('/api/bus/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.messageBus!.getStats() });
      });
    }

    // --- Observability Engine API ---
    if (this.options.observabilityEngine) {
      this.app.get('/api/observability/metrics', async (_req: Request, res: Response) => {
        res.set('Content-Type', 'text/plain');
        res.send(await this.options.observabilityEngine!.exportPrometheus());
      });
      this.app.get('/api/observability/traces', (_req: Request, res: Response) => {
        res.json({ traces: this.options.observabilityEngine!.exportTraces() });
      });
      this.app.get('/api/observability/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.observabilityEngine!.getStats() });
      });
    }

    // --- Pipeline Engine API ---
    if (this.options.pipelineEngine) {
      this.app.get('/api/pipeline-engine/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.pipelineEngine!.getStats() });
      });
    }

    // --- Rate Limit Engine API ---
    if (this.options.rateLimitEngine) {
      this.app.get('/api/rate-limit-engine/rules', (_req: Request, res: Response) => {
        res.json({ rules: this.options.rateLimitEngine!.listRules() });
      });
      this.app.get('/api/rate-limit-engine/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.rateLimitEngine!.getStats() });
      });
    }

    // --- Request Deduplicator API ---
    if (this.options.requestDeduplicator) {
      this.app.get('/api/dedup/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.requestDeduplicator!.getStats() });
      });
    }

    // --- Request Tracker API ---
    if (this.options.requestTracker) {
      this.app.get('/api/tracker/recent', (req: Request, res: Response) => {
        const limit = parseInt((req.query.limit as string) || '100', 10);
        res.json({ traces: this.options.requestTracker!.getRecent(limit) });
      });
      this.app.get('/api/tracker/errors', (req: Request, res: Response) => {
        const limit = parseInt((req.query.limit as string) || '50', 10);
        res.json({ errors: this.options.requestTracker!.getErrors(limit) });
      });
      this.app.get('/api/tracker/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.requestTracker!.getStats() });
      });
    }

    // --- Resource Locker API ---
    if (this.options.resourceLocker) {
      this.app.get('/api/locks', (_req: Request, res: Response) => {
        res.json({ locks: this.options.resourceLocker!.getLocks() });
      });
      this.app.get('/api/locks/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.resourceLocker!.getStats() });
      });
    }

    // --- Bulkhead API ---
    if (this.options.bulkhead) {
      this.app.get('/api/bulkhead/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.bulkhead!.getStats() });
      });
    }

    // --- Search Engine API ---
    if (this.options.searchEngine) {
      this.app.post('/api/search/:index', (req: Request, res: Response) => {
        const results = this.options.searchEngine!.search(req.params.index, req.body);
        res.json({ results });
      });
      this.app.get('/api/search/indexes', (_req: Request, res: Response) => {
        res.json({ indexes: this.options.searchEngine!.listIndexes() });
      });
    }

    // --- Security Scanner API ---
    if (this.options.securityScanner) {
      this.app.post('/api/security/scan', (req: Request, res: Response) => {
        const result = this.options.securityScanner!.scanRequest(req.body);
        res.json(result);
      });
      this.app.get('/api/security/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.securityScanner!.getStats() });
      });
    }

    // --- Task Scheduler API ---
    if (this.options.taskScheduler) {
      this.app.get('/api/tasks/jobs', (_req: Request, res: Response) => {
        res.json({ jobs: this.options.taskScheduler!.getJobs() });
      });
      this.app.get('/api/tasks/stats', (_req: Request, res: Response) => {
        res.json({ stats: this.options.taskScheduler!.getStats() });
      });
    }

    // API: send a message manually (for testing / web UI)
    this.app.post('/api/send', async (req: Request, res: Response) => {
      const { channel, userId, content } = req.body;
      if (!channel || !userId || !content) {
        res.status(400).json({ error: 'channel, userId, and content are required' });
        return;
      }
      const ch = this.options.gateway.getChannels().get(channel);
      if (!ch) {
        res.status(404).json({ error: `channel '${channel}' not found` });
        return;
      }
      try {
        await auditMessageSend(userId, channel, content);

        // Fire inbound webhook for API sends
        this.options.webhookManager?.sendEvent('message:inbound', {
          channel,
          userId,
          content,
          source: 'api',
          timestamp: Date.now(),
        }).catch((err) => logger.warn({ err }, 'Webhook delivery failed (api send)'));

        await this.options.autoReply.handleMessage(ch, {
          id: `api_${Date.now()}`,
          content,
          author: { id: userId, name: userId },
          channel: ch.name,
          timestamp: new Date(),
        });

        // Fire outbound webhook for API sends
        this.options.webhookManager?.sendEvent('message:outbound', {
          channel,
          userId,
          source: 'api',
          timestamp: Date.now(),
        }).catch((err) => logger.warn({ err }, 'Webhook delivery failed (api response)'));

        res.json({ ok: true });
      } catch (err: any) {
        logger.error({ err }, 'API send failed');
        res.status(500).json({ error: err.message });
      }
    });

    // API: streaming response (SSE)
    this.app.post('/api/stream', async (req: Request, res: Response) => {
      const { channel, userId, content } = req.body;
      if (!channel || !userId || !content) {
        res.status(400).json({ error: 'channel, userId, and content are required' });
        return;
      }

      const ch = this.options.gateway.getChannels().get(channel);
      const provider = Array.from(this.options.gateway.getProviders().values())[0];

      if (!provider) {
        res.status(503).json({ error: 'No provider configured' });
        return;
      }

      // Check if provider supports streaming
      const streamingProvider = provider as any;
      if (typeof streamingProvider.chatStream !== 'function') {
        // Fall back to non-streaming
        res.status(400).json({ error: 'Streaming not supported by current provider' });
        return;
      }

      const sse = createSSEResponse(res);

      try {
        // Get or create session
        const sessionKey = `${channel}:${userId}`;
        let session = this.options.sessionManager.get(sessionKey);
        if (!session) {
          session = await this.options.sessionManager.create({
            channel,
            userId,
            provider: Array.from(this.options.gateway.getProviders().keys())[0] || 'default',
          });
        }

        // Add user message
        await session.addMessage('user', content);

        // Build message context
        const messages = session.getMessages() as ChatMessage[];

        // Stream response
        const agent = this.options.gateway.getAgent('default');
        const stream = agent && agent.tools.length > 0 && typeof streamingProvider.chatStreamWithTools === 'function'
          ? streamingProvider.chatStreamWithTools(messages, agent.tools)
          : streamingProvider.chatStream(messages);

        await streamToCallback(stream, async (chunk) => {
          sse.write(chunk);
          if (chunk.done) {
            // Save assistant response
            if (chunk.content) {
              await session?.addMessage('assistant', chunk.content);
            }
          }
        });

        sse.done();
      } catch (err: any) {
        logger.error({ err }, 'Streaming failed');
        sse.error(err.message);
      }
    });

    // --- Remaining module routes ---

    // Connection Manager
    this.app.post('/api/connections/pool', async (req: Request, res: Response) => {
      try {
        const { url, type, maxPoolSize, minPoolSize } = req.body;
        if (!url || !type) { res.status(400).json({ error: 'url and type required' }); return; }
        const connManager = this.options.connectionManager;
        if (!connManager) { res.status(501).json({ error: 'Connection manager not available' }); return; }
        const pool = await connManager.createPool({ url, type, maxPoolSize, minPoolSize });
        res.json({ ok: true, poolId: pool.id });
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });
    this.app.get('/api/connections/pools', (_req: Request, res: Response) => {
      const cm = this.options.connectionManager;
      res.json({ pools: cm ? cm.getAllStats() : [] });
    });

    // Security Scanner
    this.app.post('/api/security/scan', (req: Request, res: Response) => {
      const scanner = this.options.securityScanner;
      if (!scanner) { res.status(501).json({ error: 'Security scanner not available' }); return; }
      const result = scanner.scanRequest({ ...req.body, ip: req.ip, headers: req.headers });
      res.json(result);
    });
    this.app.post('/api/security/block', (req: Request, res: Response) => {
      const scanner = this.options.securityScanner;
      if (!scanner) { res.status(501).json({ error: 'Security scanner not available' }); return; }
      scanner.blockIp(req.body.ip);
      res.json({ ok: true });
    });
    this.app.get('/api/security/stats', (_req: Request, res: Response) => {
      const scanner = this.options.securityScanner;
      res.json(scanner ? scanner.getStats() : {});
    });

    // Message Bus
    this.app.post('/api/bus/publish', async (req: Request, res: Response) => {
      const bus = this.options.messageBus;
      if (!bus) { res.status(501).json({ error: 'Message bus not available' }); return; }
      const msg = await bus.publish(req.body.topic, req.body.payload, req.body.headers);
      res.json({ ok: true, messageId: msg.id });
    });
    this.app.get('/api/bus/history', (req: Request, res: Response) => {
      const bus = this.options.messageBus;
      if (!bus) { res.json({ history: [] }); return; }
      res.json({ history: bus.getHistory(req.query.topic as string, 100) });
    });
    this.app.get('/api/bus/stats', (_req: Request, res: Response) => {
      const bus = this.options.messageBus;
      res.json(bus ? bus.getStats() : {});
    });

    // Observability Engine
    this.app.get('/api/observability/metrics', async (_req: Request, res: Response) => {
      const engine = this.options.observabilityEngine;
      if (!engine) { res.json({}); return; }
      res.set('Content-Type', 'text/plain');
      res.send(engine.exportPrometheus());
    });
    this.app.get('/api/observability/traces', (_req: Request, res: Response) => {
      const engine = this.options.observabilityEngine;
      res.json(engine ? engine.exportTraces() : {});
    });
    this.app.get('/api/observability/alerts', (_req: Request, res: Response) => {
      const engine = this.options.observabilityEngine;
      res.json(engine ? { active: engine.alerts.getActiveAlerts(), all: engine.alerts.getAlerts() } : {});
    });
    this.app.get('/api/observability/health', (_req: Request, res: Response) => {
      const engine = this.options.observabilityEngine;
      res.json(engine ? { healthScore: engine.getHealthScore(), stats: engine.getStats() } : {});
    });

    // Task Scheduler
    this.app.post('/api/scheduler/jobs', async (req: Request, res: Response) => {
      const scheduler = this.options.taskScheduler;
      if (!scheduler) { res.status(501).json({ error: 'Task scheduler not available' }); return; }
      const { name, schedule, handler } = req.body;
      if (!name || !schedule) { res.status(400).json({ error: 'name and schedule required' }); return; }
      const job = scheduler.register({ name, schedule, handler: async () => { logger.info({ job: name }, 'Scheduled job executed'); } });
      res.json({ ok: true, jobId: job.id });
    });
    this.app.post('/api/scheduler/jobs/:id/run', async (req: Request, res: Response) => {
      const scheduler = this.options.taskScheduler;
      if (!scheduler) { res.status(501).json({ error: 'Task scheduler not available' }); return; }
      await scheduler.runNow(req.params.id);
      res.json({ ok: true });
    });
    this.app.get('/api/scheduler/jobs', (_req: Request, res: Response) => {
      const scheduler = this.options.taskScheduler;
      res.json({ jobs: scheduler ? scheduler.getJobs() : [] });
    });
    this.app.get('/api/scheduler/stats', (_req: Request, res: Response) => {
      const scheduler = this.options.taskScheduler;
      res.json(scheduler ? scheduler.getStats() : {});

    });
    // --- Skills Engine API ---
    this.app.get('/api/skills/search', (req: Request, res: Response) => {
      const engine = this.options.skillsEngine;
      if (!engine) { res.status(501).json({ error: 'Skills engine not available' }); return; }
      const query = (req.query.q as string) || '';
      const limit = parseInt((req.query.limit as string) || '50', 10);
      const category = req.query.category as string;
      const level = req.query.level as string;
      res.json({ results: engine.search(query, { limit, category, level }) });
    });

    this.app.get('/api/skills', (req: Request, res: Response) => {
      const engine = this.options.skillsEngine;
      if (!engine) { res.status(501).json({ error: 'Skills engine not available' }); return; }
      const offset = parseInt((req.query.offset as string) || '0', 10);
      const limit = parseInt((req.query.limit as string) || '50', 10);
      res.json({ skills: engine.list(offset, limit), total: engine.count() });
    });

    this.app.get('/api/skills/categories', (_req: Request, res: Response) => {
      const engine = this.options.skillsEngine;
      if (!engine) { res.json({ categories: [] }); return; }
      res.json({ categories: engine.getCategories() });
    });

    this.app.get('/api/skills/levels', (_req: Request, res: Response) => {
      const engine = this.options.skillsEngine;
      if (!engine) { res.json({ levels: [] }); return; }
      res.json({ levels: engine.getLevels() });
    });

    this.app.get('/api/skills/stats', (_req: Request, res: Response) => {
      const engine = this.options.skillsEngine;
      if (!engine) { res.json({}); return; }
      res.json({ stats: engine.getStats() });
    });

    this.app.post('/api/skills/inject', (req: Request, res: Response) => {
      const engine = this.options.skillsEngine;
      if (!engine) { res.status(501).json({ error: 'Skills engine not available' }); return; }
      const { query, category, maxSkills } = req.body;
      if (!query) { res.status(400).json({ error: 'query required' }); return; }
      const injected = engine.injectIntoPrompt(query, { category, maxSkills });
      res.json({ injected, length: injected.length });
    });

    this.app.get('/api/skills/:id', (req: Request, res: Response) => {
      const engine = this.options.skillsEngine;
      if (!engine) { res.status(501).json({ error: 'Skills engine not available' }); return; }
      const skill = engine.get(req.params.id);
      if (!skill) { res.status(404).json({ error: 'skill not found' }); return; }
      res.json({ skill });
    });
    this.app.post('/api/sanitize', (req: Request, res: Response) => {
      const { input, rules } = req.body;
      if (!input || !rules) { res.status(400).json({ error: 'input and rules required' }); return; }
    });

    // Pagination helper
    this.app.post('/api/paginate', (req: Request, res: Response) => {
      const { data, params, mode } = req.body;
      if (!data || !params) { res.status(400).json({ error: 'data and params required' }); return; }
      try {
        const result = mode === 'cursor' ? Paginator.cursor(data, params, params.cursorField || 'id') : Paginator.offset(data, params);
        res.json(result);
      } catch (err: any) { res.status(500).json({ error: err.message }); }
    });

    // OpenAPI spec
    this.app.get('/api/openapi', (_req: Request, res: Response) => {
      // openapi module not available
      const generator = createOpenApiGenerator({ title: 'Agent Gateway API', version: '1.0.0', description: 'Enterprise AI Agent Gateway API' });
      generator.addServer(`http://localhost:${this.options.port}`);
      generator.addBearerAuth();
      generator.addCommonResponses();
      res.json(generator.generate());
    });

    // Schema Registry
    this.app.post('/api/schemas', (req: Request, res: Response) => {
      if (!this.options.schemaRegistry) { res.status(501).json({ error: 'Schema registry not available' }); return; }
      this.options.schemaRegistry.register(req.body);
      res.json({ ok: true });
    });
    this.app.get('/api/schemas/:name/:version', (req: Request, res: Response) => {
      if (!this.options.schemaRegistry) { res.status(501).json({ error: 'Schema registry not available' }); return; }
      const schema = this.options.schemaRegistry.getVersion(req.params.name, req.params.version);
      res.json(schema || {});
    });
    this.app.get('/api/schemas/:name/versions', (req: Request, res: Response) => {
      if (!this.options.schemaRegistry) { res.json({ versions: [] }); return; }
      res.json({ versions: this.options.schemaRegistry.getVersions(req.params.name) });
    });
    this.app.post('/api/schemas/:name/validate', (req: Request, res: Response) => {
      if (!this.options.schemaRegistry) { res.status(501).json({ error: 'Schema registry not available' }); return; }
      const result = this.options.schemaRegistry.validate(req.params.name, req.query.version as string, req.body);
      res.json(result);
    });

    // Event Store
    this.app.post('/api/events/append', async (req: Request, res: Response) => {
      if (!this.options.eventStore) { res.status(501).json({ error: 'Event store not available' }); return; }
      const event = await this.options.eventStore.append(req.body);
      res.json({ ok: true, eventId: event.id, version: event.version });
    });
    this.app.get('/api/events/:aggregateId', (req: Request, res: Response) => {
      if (!this.options.eventStore) { res.json({ events: [] }); return; }
      res.json({ events: this.options.eventStore.getEvents(req.params.aggregateId, parseInt(req.query.fromVersion as string || '0', 10)) });
    });
    this.app.get('/api/events/stats', (_req: Request, res: Response) => {
      res.json(this.options.eventStore ? this.options.eventStore.getStats() : {});
    });

    // Pipeline Engine
    this.app.post('/api/pipelines/:id/execute', async (req: Request, res: Response) => {
      const engine = this.options.pipelineEngine;
      if (!engine) { res.status(501).json({ error: 'Pipeline engine not available' }); return; }
      const run = await engine.execute(req.params.id, req.body.input || [], req.body.metadata || {});
      res.json({ ok: true, runId: run.id, status: run.status });
    });
    this.app.get('/api/pipelines/:id/runs', (req: Request, res: Response) => {
      const engine = this.options.pipelineEngine;
      if (!engine) { res.json({ runs: [] }); return; }
      res.json({ runs: engine.listRuns(req.params.id, undefined, 50) });
    });

    // Rate Limit Engine
    this.app.post('/api/rate-limit/rules', (req: Request, res: Response) => {
      const rlEngine = this.options.rateLimitEngine;
      if (!rlEngine) { res.status(501).json({ error: 'Rate limit engine not available' }); return; }
      rlEngine.registerRule(req.body);
      res.json({ ok: true });
    });
    this.app.get('/api/rate-limit/rules', (_req: Request, res: Response) => {
      const rlEngine = this.options.rateLimitEngine;
      res.json({ rules: rlEngine ? rlEngine.listRules() : [] });
    });

    // Advanced Rate Limiter
    this.app.get('/api/rate-limiter/stats', (_req: Request, res: Response) => {
      const rl = this.options.advancedRateLimiter;
      res.json(rl ? rl.getStats() : {});
    });

    // Request Deduplicator
    this.app.get('/api/deduplicator/stats', (_req: Request, res: Response) => {
      const dedup = this.options.requestDeduplicator;
      res.json(dedup ? dedup.getStats() : {});
    });

    // Request Logger
    this.app.get('/api/request-logs', (req: Request, res: Response) => {
      const rl = this.options.requestLogger;
      if (!rl) { res.json({ logs: [] }); return; }
      res.json({ logs: rl.getRecent(100) });
    });

    // Request Tracker
    this.app.get('/api/request-traces', (_req: Request, res: Response) => {
      const tracker = this.options.requestTracker;
      res.json(tracker ? { traces: tracker.getRecent(100) } : {});
    });

    // Resource Locker
    this.app.post('/api/locks/acquire', async (req: Request, res: Response) => {
      const locker = this.options.resourceLocker;
      if (!locker) { res.status(501).json({ error: 'Resource locker not available' }); return; }
      const lock = await locker.writeLock(req.body.resource, req.body.ownerId, req.body.ttl);
      res.json({ ok: true, lockId: lock.id, expiresAt: lock.expiresAt });
    });
    this.app.post('/api/locks/release', (req: Request, res: Response) => {
      const locker = this.options.resourceLocker;
      if (!locker) { res.status(501).json({ error: 'Resource locker not available' }); return; }
      const released = locker.release(req.body.resource, req.body.lockId);
      res.json({ ok: released });
    });
    this.app.get('/api/locks', (_req: Request, res: Response) => {
      const locker = this.options.resourceLocker;
      res.json(locker ? { locks: locker.getLocks() } : {});
    });

    // Search Engine
    this.app.post('/api/search/index', (req: Request, res: Response) => {
      const engine = this.options.searchEngine;
      if (!engine) { res.status(501).json({ error: 'Search engine not available' }); return; }
      if (!engine['indexes'].has(req.body.indexName)) {
        engine.createIndex(req.body.indexName, req.body.fields || [{ name: 'content', type: 'text' }]);
      }
      engine.index(req.body.indexName, { id: req.body.document.id || `doc-${Date.now()}`, ...req.body.document });
      res.json({ ok: true });
    });
    this.app.post('/api/search/query', (req: Request, res: Response) => {
      const engine = this.options.searchEngine;
      if (!engine) { res.status(501).json({ error: 'Search engine not available' }); return; }
      const result = engine.search(req.body.indexName, req.body.query);
      res.json(result);
    });
    this.app.get('/api/search/indexes', (_req: Request, res: Response) => {
      const engine = this.options.searchEngine;
      res.json({ indexes: engine ? engine.listIndexes() : [] });
    });

    // Connection Pool
    this.app.get('/api/pool/stats', (_req: Request, res: Response) => {
      const pool = this.options.connectionPool;
      res.json(pool ? pool.getStats() : {});
    });

    // Cron Scheduler
    this.app.post('/api/cron/jobs', (req: Request, res: Response) => {
      const cron = this.options.cronScheduler;
      if (!cron) { res.status(501).json({ error: 'Cron scheduler not available' }); return; }
      const job = cron.register(req.body);
      res.json({ ok: true, jobId: job.id });
    });
    this.app.post('/api/cron/jobs/:id/run', async (req: Request, res: Response) => {
      const cron = this.options.cronScheduler;
      if (!cron) { res.status(501).json({ error: 'Cron scheduler not available' }); return; }
      await cron.runNow(req.params.id);
      res.json({ ok: true });
    });
    this.app.get('/api/cron/jobs', (_req: Request, res: Response) => {
      const cron = this.options.cronScheduler;
      res.json({ jobs: cron ? cron.getJobs() : [] });
    });
    this.app.get('/api/cron/stats', (_req: Request, res: Response) => {
      const cron = this.options.cronScheduler;
      res.json(cron ? cron.getStats() : {});
    });

    // Workflow Engine
    this.app.post('/api/workflows/execute', async (req: Request, res: Response) => {
      const engine = this.options.workflowEngine;
      if (!engine) { res.status(501).json({ error: 'Workflow engine not available' }); return; }
      const run = await engine.execute(req.body.workflowId, req.body.input || [], req.body.metadata || {});
      res.json({ ok: true, runId: run.id, status: run.status });
    });
    this.app.get('/api/workflows/stats', (_req: Request, res: Response) => {
      const engine = this.options.workflowEngine;
      res.json(engine ? engine.getStats() : {});
    });

    // Data Transformer
    this.app.post('/api/transform', (req: Request, res: Response) => {
      // data-transformer module not available
      const transformer = createDataTransformer(req.body.config);
      const { result, errors } = transformer.transform(req.body.data);
      res.json({ result, errors });
    });

    // Notification System
    this.app.post('/api/notify', async (req: Request, res: Response) => {
      const notifications = this.options.notifications;
      if (!notifications) { res.status(501).json({ error: 'Notification system not available' }); return; }
      const notif = await notifications.notify(req.body.type, req.body.title, req.body.message, req.body.recipients);
      res.json({ ok: true, notificationId: notif.id });
    });
    this.app.get('/api/notifications/recent', (req: Request, res: Response) => {
      const notifications = this.options.notifications;
      res.json({ notifications: notifications ? notifications.getRecent(50) : [] });
    });

    // Feature Toggle
    this.app.post('/api/feature-toggles', (req: Request, res: Response) => {
      const toggles = this.options.featureToggleManager;
      if (!toggles) { res.status(501).json({ error: 'Feature toggle manager not available' }); return; }
      const toggle = toggles.create(req.body);
      res.json({ ok: true, key: toggle.key });
    });
    this.app.get('/api/feature-toggles/evaluate', (req: Request, res: Response) => {
      const toggles = this.options.featureToggleManager;
      if (!toggles) { res.json({}); return; }
      res.json(toggles.evaluateAll(req.query as any));
    });

    // Embedding Store
    this.app.post('/api/embeddings/add', async (req: Request, res: Response) => {
      const store = this.options.embeddingStore;
      if (!store) { res.status(501).json({ error: 'Embedding store not available' }); return; }
      const record = await store.add(req.body.text, req.body.embedding, req.body.metadata || {}, req.body.tags || []);
      res.json({ ok: true, id: record.id });
    });
    this.app.post('/api/embeddings/search', (req: Request, res: Response) => {
      const store = this.options.embeddingStore;
      if (!store) { res.status(501).json({ error: 'Embedding store not available' }); return; }
      const results = store.search(req.body.embedding, req.body.limit || 10, req.body.threshold || 0, req.body.tags);
      res.json({ results });
    });

    // Service Registry
    this.app.post('/api/services/register', (req: Request, res: Response) => {
      const registry = this.options.serviceRegistry;
      if (!registry) { res.status(501).json({ error: 'Service registry not available' }); return; }
      registry.register(req.body);
      res.json({ ok: true });
    });
    this.app.get('/api/services/health', (req: Request, res: Response) => {
      const registry = this.options.serviceRegistry;
      if (!registry) { res.json({}); return; }
      const svc = registry.getService(req.query.name as string);
      res.json(svc);
    });

    // API Key Manager
    this.app.post('/api/api-keys/create', (req: Request, res: Response) => {
      const manager = this.options.apiKeyManager;
      if (!manager) { res.status(501).json({ error: 'API key manager not available' }); return; }
      const { key, apiKey } = manager.create(req.body);
      res.json({ ok: true, key, apiKey });
    });
    this.app.post('/api/api-keys/validate', (req: Request, res: Response) => {
      const manager = this.options.apiKeyManager;
      if (!manager) { res.status(501).json({ error: 'API key manager not available' }); return; }
      const result = manager.validate(req.body.key);
      res.json(result);
    });
    this.app.get('/api/api-keys/list', (req: Request, res: Response) => {
      const manager = this.options.apiKeyManager;
      res.json({ keys: manager ? manager.list() : [] });
    });

    // Session Manager (enterprise)
    this.app.post('/api/sessions/create', async (req: Request, res: Response) => {
      const sessionMgr = this.options.enterpriseSessionManager;
      if (!sessionMgr) { res.status(501).json({ error: 'Session manager not available' }); return; }
      const session = await sessionMgr.create(req.body);
      res.json({ ok: true, sessionId: session.id });
    });
    this.app.get('/api/sessions/:id/messages', async (req: Request, res: Response) => {
      const sessionMgr = this.options.enterpriseSessionManager;
      if (!sessionMgr) { res.json({ messages: [] }); return; }
      res.json({ messages: await sessionMgr.getMessages(req.params.id) });
    });
    // Webhook routes for channels
    this.setupWebhookRoutes();

    // Static file serving (for a future web UI)
    const staticDir = this.options.staticDir;
    if (staticDir && existsSync(staticDir)) {
      this.app.use(express.static(staticDir));
      // SPA fallback — serve index.html for any non-API route
      this.app.use((_req: Request, res: Response) => {
        const indexPath = join(staticDir, 'index.html');
        if (existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(404).json({ error: 'not found' });
        }
      });
    }

    // Global error handler
    this.app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      logger.error({ err }, 'Unhandled server error');
      res.status(500).json({ error: 'internal server error' });
    });

    // WebSocket connections
    this.wsServer.on('connection', (ws: WebSocket) => {
      logger.info('WebSocket client connected');
      ws.on('message', (data: Buffer) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleWsMessage(ws, msg);
        } catch {
          ws.send(JSON.stringify({ type: 'error', message: 'invalid JSON' }));
        }
      });
      ws.on('close', () => logger.info('WebSocket client disconnected'));
      ws.on('error', (err) => logger.error({ err }, 'WebSocket error'));
    });

    // Start listening
    return new Promise((resolve, reject) => {
      const { host, port } = this.options;
      this.httpServer.listen(port, host, () => {
        this.isRunning = true;
        logger.info(`Agent gateway listening on ${host}:${port}`);
        logger.info(`  Status:   http://${host}:${port}/api/status`);
        logger.info(`  WebSocket: ws://${host}:${port}/ws`);
        resolve();
      }).on('error', reject);
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    // Close all WebSocket clients
    for (const client of this.wsServer.clients) {
      client.close();
    }

    return new Promise((resolve) => {
      this.httpServer.close(() => {
        logger.info('HTTP server closed');
        resolve();
      });
    });
  }

  // --- Webhook route registration ---

  private setupWebhookRoutes(): void {
    const channels = this.options.gateway.getChannels();

    for (const [id, channel] of channels) {
      // Telegram: /webhook/telegram/:botId
      if (channel.type === 'telegram') {
        const botPrefix = (channel as any).config?.botToken?.split(':')[0] ?? id;
        this.app.post(`/webhook/telegram/${botPrefix}`, async (req: Request, res: Response) => {
          try {
            // Telegram sends updates as { update_id, message, ... }
            const update = req.body;
            if ((channel as any).handleWebhookUpdate) {
              await (channel as any).handleWebhookUpdate(update);
            }
            res.json({ ok: true });
          } catch (err: any) {
            logger.error({ err }, 'Telegram webhook failed');
            res.status(500).json({ ok: false, error: err.message });
          }
        });
      }

      // Discord: /webhook/discord/:channelId
      if (channel.type === 'discord') {
        this.app.post('/webhook/discord/:channelId', async (req: Request, res: Response) => {
          try {
            const data = req.body;
            // Discord interactions API sends a ping on setup
            if (data.type === 1) {
              res.json({ type: 1 }); // PONG
              return;
            }
            if ((channel as any).handleGatewayEvent) {
              await (channel as any).handleGatewayEvent('INTERACTION_CREATE', data);
            }
            res.json({ ok: true });
          } catch (err: any) {
            logger.error({ err }, 'Discord webhook failed');
            res.status(500).json({ error: err.message });
          }
        });
      }

      // Slack: /webhook/slack/events
      if (channel.type === 'slack') {
        this.app.post('/webhook/slack/events', async (req: Request, res: Response) => {
          try {
            // Slack URL verification challenge
            if (req.body.type === 'url_verification') {
              res.json({ challenge: req.body.challenge });
              return;
            }
            if ((channel as any).handleWebhookEvent) {
              await (channel as any).handleWebhookEvent(req.body);
            }
            res.sendStatus(200);
          } catch (err: any) {
            logger.error({ err }, 'Slack webhook failed');
            res.status(500).json({ error: err.message });
          }
        });
      }

      // WhatsApp: /webhook/whatsapp
      if (channel.type === 'whatsapp') {
        // Verification GET (Facebook/Meta)
        this.app.get('/webhook/whatsapp', (req: Request, res: Response) => {
          const mode = req.query['hub.mode'];
          const token = req.query['hub.verify_token'];
          const challenge = req.query['hub.challenge'];
          const expectedToken = (channel as any).config?.verifyToken;
          if (mode === 'subscribe' && token === expectedToken) {
            logger.info('WhatsApp webhook verified');
            res.send(String(challenge));
          } else {
            res.sendStatus(403);
          }
        });
        // Event POST
        this.app.post('/webhook/whatsapp', async (req: Request, res: Response) => {
          try {
            if ((channel as any).handleWebhookEvent) {
              await (channel as any).handleWebhookEvent(req.body);
            }
            res.sendStatus(200);
          } catch (err: any) {
            logger.error({ err }, 'WhatsApp webhook failed');
            res.status(500).json({ error: err.message });
          }
        });
      }
    }
  }

  // --- WebSocket message handling ---

  private handleWsMessage(ws: WebSocket, msg: any): void {
    const { type, id, channel, userId, content } = msg;

    switch (type) {
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', id }));
        break;

      case 'message': {
        // Direct message via WebSocket (for web UI or testing)
        if (!channel || !userId || !content) {
          ws.send(JSON.stringify({ type: 'error', id, message: 'channel, userId, content required' }));
          return;
        }
        const ch = this.options.gateway.getChannels().get(channel);
        if (!ch) {
          ws.send(JSON.stringify({ type: 'error', id, message: `channel '${channel}' not found` }));
          return;
        }
        this.options.autoReply
          .handleMessage(ch, {
            id: `ws_${Date.now()}`,
            content,
            author: { id: userId, name: userId },
            channel: ch.name,
            timestamp: new Date(),
          })
          .then(() => {
            ws.send(JSON.stringify({ type: 'message:ok', id }));
          })
          .catch((err) => {
            ws.send(JSON.stringify({ type: 'error', id, message: err.message }));
          });
        break;
      }

      default:
        ws.send(JSON.stringify({ type: 'error', id, message: `unknown type: ${type}` }));
    }
  }
}

/**
 * Convenience: create and fully configure an AgentServer from a GatewayConfig.
 * This is the main entry point for starting the gateway as a standalone process.
 */
export async function createAndStartServer(options: {
  host: string;
  port: number;
  channels: Map<string, Channel>;
  providers: Map<string, Provider>;
  config: GatewayConfig;
  staticDir?: string;
}): Promise<AgentServer> {
  const { host, port, channels, providers, config, staticDir } = options;

  // 1. Gateway
  const gateway = new Gateway({ host, port, config });

  // 2. Sessions — file-backed persistence
  const sessionsDir = process.env.AGENT_SESSIONS_DIR ?? '.agent-sessions';
  const persistence = new FileSessionPersistence(sessionsDir);
  const sessionManager = new SessionManager(persistence);

  // 3. Hooks
  const hooks = getGlobalHooks();

  // 4. Register channels
  for (const [id, channel] of channels) {
    gateway.registerChannel(id, channel);
    await channel.connect();
  }

  // 5. Register providers — optionally chain as failover
  const providerList = Array.from(providers.values());
  const firstProvider = providerList[0];
  const firstProviderName = Array.from(providers.keys())[0];

  for (const [id, provider] of providers) {
    gateway.registerProvider(id, provider);
    await provider.connect();
  }

  // 5b. Failover — if multiple providers configured, wrap first in a failover chain
  const useFailover = process.env.PROVIDER_FAILOVER === '1' && providerList.length > 1;
  let effectiveProvider = firstProvider;
  if (useFailover) {
    const failover = createFailoverProvider({
      providers: providerList.map((p) => ({ provider: p, priority: 0 })),
      maxRetries: 2,
      timeoutMs: 30000,
      fallbackOnError: true,
      fallbackOnContentFilter: false,
    });
    effectiveProvider = failover;
    logger.info(`Provider failover chain active with ${providerList.length} providers`);
  }

  // 5c. Response cache
  const useCache = process.env.RESPONSE_CACHE_ENABLED === '1';
  const responseCache = useCache ? createResponseCache({
    maxSize: parseInt(process.env.CACHE_MAX_SIZE || '10000', 10),
    ttl: parseInt(process.env.CACHE_TTL || '3600', 10),
    backend: (process.env.REDIS_URL ? 'redis' : 'memory') as 'redis' | 'memory',
  }) : null;

  // 5d. Context manager
  const contextManager = createContextManager({
    maxTokens: parseInt(process.env.MAX_CONTEXT_TOKENS || '128000', 10),
    responseReserve: parseInt(process.env.CONTEXT_RESPONSE_RESERVE || '4096', 10),
    truncationStrategy: (process.env.TRUNCATION_STRATEGY as 'oldest-first' | 'summary') || 'oldest-first',
    preserveSystemPrompt: true,
    preserveLatest: parseInt(process.env.PRESERVE_LATEST_MESSAGES || '2', 10),
  });

  // 6. Tenant management (opt-in)
  const useTenants = process.env.MULTI_TENANT === '1';
  const tenantManager = useTenants ? createTenantManager() : null;

  // Wire tenant API key validation into existing auth
  if (useTenants && tenantManager) {
    // Seed default tenant if env vars provided
    const defaultTenantId = process.env.DEFAULT_TENANT_ID || 'default';
    const defaultTenantName = process.env.DEFAULT_TENANT_NAME || 'Default';
    await tenantManager.registerTenant({
      id: defaultTenantId,
      name: defaultTenantName,
      allowedProviders: Array.from(providers.keys()),
      allowedChannels: Array.from(channels.keys()),
      maxSessions: parseInt(process.env.TENANT_MAX_SESSIONS || '100', 10),
      toolsEnabled: true,
    });
    logger.info(`Default tenant registered: ${defaultTenantId}`);
  }

  // 6. Tool Registry — bash, filesystem, web search
  const toolRegistry = createToolRegistry({
    bash: { enabled: process.env.DISABLE_BASH_TOOL !== '1' },
    filesystem: { enabled: process.env.DISABLE_FS_TOOL !== '1' },
    websearch: { enabled: process.env.DISABLE_WEB_SEARCH !== '1' },
  });

  // 7. Agent — with tools for tool-calling
  if (providerList.length === 0) {
    logger.warn('No providers configured — auto-reply will not work');
  }

  const systemPrompt = process.env.SYSTEM_PROMPT ||
    'You are a helpful AI assistant with access to tools. You can execute bash commands, read/write files, and search the web. Use tools when appropriate to help the user.';

  const agent = effectiveProvider
    ? new BaseAgent({
        name: 'default',
        provider: effectiveProvider,
        systemPrompt,
        tools: toolRegistry.list(),
        maxSteps: parseInt(process.env.AGENT_MAX_STEPS || '10', 10),
        responseCache: responseCache ?? undefined,
        contextManager,
      })
    : null;

  if (agent) {
    gateway.registerAgent('default', agent);
    logger.info('Agent registered with tools: ' + toolRegistry.list().map((t) => t.name).join(', '));
  }

  // 7b. Plugin loader
  const pluginLoader = createPluginLoader(gateway);
  const pluginNames = config.plugins || [];
  if (pluginNames.length > 0) {
    await pluginLoader.loadAll(pluginNames);
  }

  // 8. AutoReply
  const autoReply = new AutoReply(
    { enabled: true, provider: firstProviderName, systemPrompt, cooldown: 0 },
    effectiveProvider ?? providerList[0] ?? null,
    sessionManager,
    hooks,
    agent ?? undefined,
    responseCache,
  );

  // Wire channel messages → auto-reply + event bus + webhooks
  for (const [, channel] of channels) {
    (channel as any).on('message', async (message: any) => {
      try {
        // Publish inbound event
        publishMessageEvent({
          channel: channel.name,
          userId: message.author?.id || 'unknown',
          content: message.content || '',
          messageId: message.id,
          direction: 'inbound',
          sessionId: message.sessionId,
        });

        // Fire inbound webhook
        webhookManager?.sendEvent('message:inbound', {
          channel: channel.name,
          userId: message.author?.id || 'unknown',
          content: message.content || '',
          messageId: message.id,
          timestamp: Date.now(),
        }).catch((err) => logger.warn({ err }, 'Webhook delivery failed (inbound)'));

        await autoReply.handleMessage(channel, message);

        // Publish outbound event
        publishMessageEvent({
          channel: channel.name,
          userId: message.author?.id || 'unknown',
          content: '(response)',
          messageId: `response_${message.id}`,
          direction: 'outbound',
          sessionId: message.sessionId,
        });

        // Fire outbound webhook
        webhookManager?.sendEvent('message:outbound', {
          channel: channel.name,
          userId: message.author?.id || 'unknown',
          messageId: `response_${message.id}`,
          timestamp: Date.now(),
        }).catch((err) => logger.warn({ err }, 'Webhook delivery failed (outbound)'));
      } catch (err: any) {
        logger.error({ err }, 'Auto-reply failed for channel message');
        const bus = getEventBus();
        bus.publish({
          type: 'message:failed',
          data: { channel: channel.name, error: err.message, messageId: message.id },
          metadata: { channel: channel.name, userId: message.author?.id },
        }).catch(() => {});
      }
    });
  }

  // 9. Start gateway
  await gateway.start();

  // 9b. Enterprise auth manager (opt-in via AUTH_JWT_SECRET)
  const authManager = process.env.AUTH_JWT_SECRET
    ? createAuthManager({
        jwtSecret: process.env.AUTH_JWT_SECRET,
        accessTokenTtl: parseInt(process.env.AUTH_ACCESS_TOKEN_TTL || '3600', 10),
        refreshTokenTtl: parseInt(process.env.AUTH_REFRESH_TOKEN_TTL || '604800', 10),
        apiKeyAuth: process.env.AUTH_API_KEY_AUTH !== '0',
        allowAnonymous: process.env.AUTH_ALLOW_ANONYMOUS === '1',
        oauthProviders: process.env.AUTH_OAUTH_PROVIDERS ? JSON.parse(process.env.AUTH_OAUTH_PROVIDERS) : [],
      })
    : null;

  if (authManager) {
    logger.info('Enterprise auth manager initialized');
  }

  // 9c. Enterprise rate limit manager (opt-in via RATE_LIMIT_ENTERPRISE)
  const rateLimitManager = process.env.RATE_LIMIT_ENTERPRISE === '1'
    ? createRateLimitManager({
        rules: RateLimitManager.defaultRules(),
        redisUrl: process.env.REDIS_URL,
      })
    : null;

  if (rateLimitManager) {
    logger.info('Enterprise rate limit manager initialized');
  }

  // 9d. Validation manager
  const validationManager = createValidationManager();

  // 9e. Audit logger startup event
  const audit = getAuditLogger();
  audit.log({
    type: 'system:start',
    actor: 'system',
    actorType: 'system',
    data: { host, port, channels: Array.from(channels.keys()), providers: Array.from(providers.keys()) },
  }).catch(() => {});

  const moderationPipeline = process.env.MODERATION_ENABLED === '1'
    ? createModerationPipeline({
        enabled: true,
        blockThreshold: parseFloat(process.env.MODERATION_BLOCK_THRESHOLD || '0.8'),
        logFlagged: true,
        redactPII: process.env.MODERATION_REDACT_PII !== '0',
      })
    : null;

  if (moderationPipeline) {
  }

  // 9g. Feature flags
  const featureFlags = createFeatureFlagManager();
  featureFlags.register({ key: 'streaming', type: 'boolean', enabled: true });
  featureFlags.register({ key: 'tool-calling', type: 'boolean', enabled: true });
  featureFlags.register({ key: 'multi-tenant', type: 'boolean', enabled: useTenants });
  logger.info('Feature flag manager initialized');

  // 9h. Message queue (opt-in via QUEUE_ENABLED)
  const messageQueue = process.env.QUEUE_ENABLED === '1'
    ? createMessageQueue({
        maxMessagesPerTopic: parseInt(process.env.QUEUE_MAX_PER_TOPIC || '10000', 10),
        maxAttempts: parseInt(process.env.QUEUE_MAX_ATTEMPTS || '3', 10),
        visibilityTimeoutMs: parseInt(process.env.QUEUE_VISIBILITY_TIMEOUT || '30000', 10),
      })
    : null;

  if (messageQueue) {
    await messageQueue.start();
    logger.info('Message queue started');
  }

  // 9i. Rule engine (opt-in via RULE_ENGINE_ENABLED)
  const ruleEngine = process.env.RULE_ENGINE_ENABLED === '1'
    ? createRuleEngine()
    : null;

  if (ruleEngine) {
    logger.info('Rule engine initialized');
  }

  // 9j. Workflow engine (opt-in via WORKFLOW_ENABLED)
  const workflowEngine = process.env.WORKFLOW_ENABLED === '1'
    ? createWorkflowEngine()
    : null;

  if (workflowEngine) {
    logger.info('Workflow engine initialized');
  }

  // 9k. Backup manager (opt-in via BACKUP_ENABLED)
  const backupManager = process.env.BACKUP_ENABLED === '1'
    ? createBackupManager({
        backupDir: process.env.BACKUP_DIR || '.backups',
        encryptionKey: process.env.BACKUP_ENCRYPTION_KEY,
        maxBackups: parseInt(process.env.BACKUP_MAX || '10', 10),
      })
    : null;

  if (backupManager) {
    logger.info('Backup manager initialized');
  }

  // 9l. Conversation analytics
  const analytics = createConversationAnalytics(50000);

  // 9m. API version manager
  const apiVersionManager = createApiVersionManager();

  // 9n. Notification system (opt-in via NOTIFICATION_ENABLED)
  const notifications = process.env.NOTIFICATION_ENABLED === '1'
    ? createNotificationSystem({
        defaultRecipients: process.env.NOTIFICATION_RECIPIENTS?.split(',') || ['admin'],
        quietHours: { enabled: process.env.QUIET_HOURS_ENABLED === '1', start: '22:00', end: '07:00' },
      })
    : null;

  if (notifications) {
    notifications.info('Gateway Startup', `Agent gateway starting on ${host}:${port}`);
    logger.info('Notification system initialized');
  }

  // 9o. Health checker
  const healthChecker = createHealthChecker();

  // 9p. Shutdown manager
  const shutdownManager = createShutdownManager({
    timeout: parseInt(process.env.SHUTDOWN_TIMEOUT || '30000', 10),
  });

  // 9q. Connection pool
  const connectionPool = process.env.CONNECTION_POOL_ENABLED === '1'
    ? createConnectionPool({ create: async () => ({}), destroy: async () => {}, validate: async () => true }, { max: parseInt(process.env.CONNECTION_POOL_MAX || '20', 10) })
    : null;

  // 9q. Service registry
  const serviceRegistry = process.env.SERVICE_REGISTRY_ENABLED === '1'
    ? createServiceRegistry()
    : null;

  const middlewarePipeline = createMiddlewarePipeline();
  middlewarePipeline.use(Middleware.requestId());
  middlewarePipeline.use(Middleware.cors(['*']));
  middlewarePipeline.use(Middleware.securityHeaders());

  // 9t. Response transformer
  const responseTransformer = createResponseTransformer({ includeTiming: true });

  // 9u. GraphQL gateway
  const graphQLGateway = process.env.GRAPHQL_ENABLED === '1'
    ? createGraphQLGateway()
    : null;

  // 9v. OpenAPI generator
  const openApiGenerator = createOpenApiGenerator({
    title: 'Agent Gateway API',
    version: '1.0.0',
    description: 'Universal AI Agent Gateway API',
  });
  openApiGenerator.addBearerAuth();

  // 9x. Distributed lock manager
  const distributedLock = process.env.DISTRIBUTED_LOCK_ENABLED === '1'
    ? createDistributedLockManager({ redisUrl: process.env.REDIS_URL })
    : null;

  // 9y. Error handler
  const errorHandler = createErrorHandler(true);

  // 9z. Request logger
  const requestLogger = process.env.REQUEST_LOG_ENABLED === '1'
    ? createRequestLogger({ sampleRate: 1.0 })
    : null;

  // 9aa. Config manager
  const configManager = createConfigManager({ watchFile: true });
  configManager.load();

  // 9ab. Webhook manager
  const webhookManager = process.env.WEBHOOK_MGR_ENABLED === '1'
    ? createWebhookManager({ maxRetries: 3, timeout: 10000 })
    : null;

  // 9ac. Advanced rate limiter
  const advancedRateLimiter = process.env.ADVANCED_RATE_LIMIT_ENABLED === '1'
    ? createAdvancedRateLimiter(process.env.REDIS_URL)
    : null;

  // 9ad. Enterprise audit logger
  const enterpriseAuditLogger = createAuditLogger();

  // 9ae. API gateway
  const apiGateway = process.env.API_GATEWAY_ENABLED === '1'
    ? createApiGateway()
    : null;

  // 9af. API key manager
  const apiKeyManager = createApiKeyManager();

  // 9ag. API proxy
  const apiProxy = process.env.API_PROXY_ENABLED === '1'
    ? createApiProxy()
    : null;

  // 9ah. Enterprise session manager
  const enterpriseSessionManager = process.env.ENTERPRISE_SESSIONS_ENABLED === '1'
    ? createEnterpriseSessionManager(new MemorySessionStore())
    : null;

  // 9ai. Content moderator
  const contentModerator = process.env.CONTENT_MOD_ENABLED === '1'
    ? createContentModerator({ blockThreshold: 0.8 })
    : null;

  // 9aj. Additional enterprise modules (always available)
  const connectionManager = createConnectionManager();
  const embeddingStore = createEmbeddingStore();
  const cronScheduler = createCronScheduler();
  const dataTransformer = createDataTransformer({ name: 'default', operations: [] });
  const securityScanner = createSecurityScanner({ detectSqlInjection: true, detectXss: true, detectPathTraversal: true, detectCommandInjection: true });
  const messageBus = createMessageBus();
  const observabilityEngine = createObservabilityEngine();
  observabilityEngine.metrics.register({ name: 'http_requests_total', type: 'counter', description: 'Total HTTP requests', labelNames: ['method', 'path'] });
  observabilityEngine.metrics.register({ name: 'http_request_duration_seconds', type: 'histogram', description: 'HTTP request duration', labelNames: ['method', 'path'] });
  const taskScheduler = createTaskScheduler(`node-${Math.random().toString(36).slice(2, 8)}`);
  const skillsEngine = createSkillsEngine({
    skillsDir: process.env.SKILLS_DIR || join(process.cwd(), 'skills'),
    maxSkillsPerPrompt: parseInt(process.env.MAX_SKILLS_PER_PROMPT || '5', 10),
    watch: process.env.SKILLS_WATCH === '1',
    cacheInMemory: true,
    buildIndex: true,
  });
  await skillsEngine.load();
  const requestDeduplicator = createRequestDeduplicator({ maxConcurrent: 1000 });
  const requestTracker = createRequestTracker();
  const resourceLocker = createResourceLocker();
  const searchEngine = createSearchEngine();
  const rateLimitEngine = createRateLimitEngine(process.env.REDIS_URL);
  const notificationSystem = createNotificationSystem();
  const featureToggleManager = createFeatureToggleManager();
  const eventStore = createEventStore();
  const schemaRegistry = createSchemaRegistry();

  // 9aj. Enterprise rate limiter
  const enterpriseRateLimiter = process.env.ENTERPRISE_RATE_LIMIT_ENABLED === '1'
    ? createRateLimiter({ max: 100, window: 60 })
    : null;

  // 9ak. Shutdown manager (alt)
  const shutdownManager2 = process.env.SHUTDOWN_MGR_ENABLED === '1'
    ? createShutdownManager({ timeout: 30000 })
    : null;

  // 9al. Health checker (alt)
  const healthChecker2 = createHealthChecker();

  // 9am. Secret manager (alt)
  const secretManager2 = process.env.SECRET_MGR_ENABLED === '1'
    ? createSecretManager()
    : null;

  // 9an. Tenant manager (alt)
  const tenantManager2 = process.env.TENANT_MGR_ENABLED === '1'
    ? createTenantManager()
    : null;

  // 9ap. Real-time dashboard
  const dashboard = process.env.DASHBOARD_ENABLED === '1'
    ? createRealTimeDashboard()
    : null;

  // 9aq. API version manager (alt)
  const apiVersionManager2 = createApiVersionManager2();

  // 9ar. Cache manager
  const cacheManager = process.env.CACHE_MGR_ENABLED === '1'
    ? createCacheManager()
    : null;

  // 9be. Bulkhead
  const bulkhead = process.env.BULKHEAD_ENABLED === '1'
    ? createBulkhead(parseInt(process.env.BULKHEAD_MAX_CONCURRENT || '10', 10))
    : null;

  // 10. Create and start HTTP server
  const server = new AgentServer({
    host,
    port,
    gateway,
    sessionManager,
    autoReply,
    config,
    staticDir,
    tenantManager,
    responseCache,
    contextManager,
    authManager,
    rateLimitManager,
    validationManager,
    moderationPipeline,
    featureFlags,
    messageQueue,
    ruleEngine,
    workflowEngine,
    backupManager,
    analytics,
    apiVersionManager,
    notifications,
    connectionPool,
    serviceRegistry,
    middlewarePipeline,
    responseTransformer,
    graphQLGateway,
    openApiGenerator,
    embeddingStore,
    distributedLock,
    errorHandler,
    requestLogger,
    configManager,
    webhookManager,
    advancedRateLimiter,
    enterpriseAuditLogger,
    apiGateway,
    apiKeyManager,
    apiProxy,
    enterpriseSessionManager,
    contentModerator,
    enterpriseRateLimiter,
    secretManager2,
    tenantManager2,
    dashboard,
    apiVersionManager2,
    cacheManager,
    connectionManager,
    cronScheduler,
    dataTransformer,
    featureToggleManager,
    messageBus,
    observabilityEngine,
    rateLimitEngine,
    requestDeduplicator,
    requestTracker,
    resourceLocker,
    bulkhead,
    searchEngine,
    securityScanner,
    taskScheduler,
    skillsEngine,
    eventStore,
    schemaRegistry,
  });

  await server.start();

  return server;
}
