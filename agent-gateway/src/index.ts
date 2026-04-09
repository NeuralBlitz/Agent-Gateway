// CLI
export { runCli, runMain } from './cli/index.js';
export type { Command, CommandHandler, CliOptions } from './cli/index.js';

// Gateway
export { Gateway, createGateway } from './gateway/index.js';
export type { GatewayOptions, Session as GatewaySession, Message as GatewayMessage } from './gateway/index.js';

// Config
export { Config, getConfig, loadConfig, GatewayConfigSchema } from './config/index.js';
export type { GatewayConfig } from './config/index.js';

// Infra
export { logger, createLogger, setLogLevel, childLogger, GatewayError, ChannelError, ProviderError, PluginError } from './infra/index.js';

// Channels
export { createChannel, registerChannel, getChannelHandler, listChannels, registerBuiltinChannels } from './channels/index.js';
export type { Channel, ChannelUser, ChannelBot, ChannelMessage } from './channels/index.js';
export { TelegramChannel, DiscordChannel, SlackChannel, WhatsAppChannel, SignalChannel, MatrixChannel } from './channels/index.js';

// Providers
export { createProvider, registerProvider, getProviderHandler, listProviders, registerBuiltinProviders } from './providers/index.js';
export type { Provider, ProviderConfig, ChatMessage, Tool as ProviderTool, ModelResponse, ToolCall, ModelInfo } from './providers/index.js';
export { OpenAIProvider, AnthropicProvider, GoogleProvider, MistralProvider, DeepSeekProvider, OllamaProvider } from './providers/index.js';

// Agents
export { BaseAgent, createAgent } from './agents/index.js';
export type { Agent as AgentInterface, AgentOptions, AgentResult, ToolCallResult, Tool as AgentTool } from './agents/index.js';

// Sessions
export { Session, SessionManager, InMemorySessionPersistence, FileSessionPersistence, createSessionManager } from './sessions/index.js';
export type { SessionData, SessionMessage, SessionOptions, SessionPersistence } from './sessions/index.js';
export { DatabaseSessionPersistence, createDatabaseSessionPersistence } from './sessions/database.js';
export type { DatabaseSessionConfig } from './sessions/database.js';
export { RedisSessionPersistence, createRedisSessionPersistence } from './sessions/redis.js';
export type { RedisSessionConfig } from './sessions/redis.js';

// Hooks
export { Hooks, getGlobalHooks, registerGlobalHook, createHook } from './hooks/index.js';
export type { HookContext, HookHandler, Hook, HookPhase } from './hooks/index.js';

// Auto-Reply
export { AutoReply, createAutoReply } from './auto-reply/index.js';
export type { AutoReplyConfig, AutoReplyContext } from './auto-reply/index.js';

// Rate Limit (original)
export { RateLimiter, Throttler } from './ratelimit/index.js';
export type { RateLimitConfig } from './ratelimit/index.js';

// Webhooks (incoming server + retry system)
export { WebhookServer, createWebhookServer } from './webhooks/index.js';
export type { WebhookConfig, WebhookHandler, WebhookServerOptions } from './webhooks/index.js';
export { createWebhookRetrySystem } from './webhooks/retry.js';

// Auth (basic)
export { Auth, createAuth } from './auth/index.js';
export type { AuthUser, AuthRole, AuthConfig, AuthResult } from './auth/index.js';

// Auth Enterprise (JWT + OAuth2)
export { createAuthManager } from './auth/enterprise.js';
export type { AuthManager as EnterpriseAuthManager, AuthToken, OAuthProvider } from './auth/enterprise.js';

// Plugin SDK
export type { PluginManifest, Plugin, PluginContext } from './plugin-sdk/index.js';
export { BaseChannel, BaseProvider, createPluginContext } from './plugin-sdk/index.js';

// Server
export { AgentServer, createAndStartServer } from './server/index.js';
export type { ServerOptions } from './server/index.js';

// Streaming
export { parseOpenAIStream, parseAnthropicStream, streamToCallback, streamToString, createSSEResponse } from './streaming/index.js';
export type { StreamChunk, StreamToolCall, StreamCallback } from './streaming/index.js';

// Tools
export { BashTool, createBashTool } from './tools/index.js';
export { FileSystemTool, createFileSystemTool } from './tools/index.js';
export { WebSearchTool, createWebSearchTool } from './tools/index.js';
export { ToolRegistry, createToolRegistry } from './tools/index.js';

// Enterprise Modules
export { createAdminRouter } from './admin/index.js';
export type { AdminDeps } from './admin/index.js';

export { createAdvancedRateLimiter } from './advanced-rate-limiter/index.js';

export { createConversationAnalytics } from './analytics/index.js';
export type { ConversationMetric, AnalyticsSummary, TrendData } from './analytics/index.js';

export { createApiGateway } from './api-gateway/index.js';
export type { RouteConfig, RequestLog as ApiGatewayRequestLog } from './api-gateway/index.js';

export { createApiKeyManager } from './api-key-manager/index.js';
export type { ApiKey as ApiKeyManagerKey, ApiKeyCreateOptions, ApiKeyValidationResult } from './api-key-manager/index.js';

export { createApiVersionManager } from './api-version-manager/index.js';

export { createAuditLogger, getAuditLogger } from './audit/index.js';
export type { AuditEvent, AuditEventType } from './audit/index.js';

export { createBackupManager } from './backup/index.js';
export type { BackupConfig, BackupMetadata } from './backup/index.js';

export { createCacheManager } from './cache-manager/index.js';
export type { CacheConfig, CacheEntry, CacheStats } from './cache-manager/index.js';

export { createConfigManager } from './config-manager/index.js';
export type { ConfigManager, ConfigChangeEvent, ConfigManagerOptions } from './config-manager/index.js';

export { createConnectionManager } from './connection-manager/index.js';
export type { ConnectionConfig, Connection, ConnectionPool as ConnectionPoolDef } from './connection-manager/index.js';

export { createConnectionPool } from './connection-pool/index.js';
export type { PoolConfig, PoolStats, ConnectionFactory } from './connection-pool/index.js';

export { createContentModerator } from './content-moderator/index.js';
export type { ModerationConfig as ContentModerationConfig, ModerationResult as ContentModerationResult } from './content-moderator/index.js';

export { ContextManager, createContextManager, estimateTokens, countMessageTokens, getModelContextWindow } from './context/index.js';
export type { ContextManagerConfig } from './context/index.js';

export { createCronScheduler } from './cron/index.js';
export type { CronJob, CronExecution } from './cron/index.js';

export { createRealTimeDashboard } from './dashboard/index.js';
export type { DashboardChannel } from './dashboard/index.js';

export { createDataTransformer } from './data-transformer/index.js';
export type { TransformConfig, TransformOperation } from './data-transformer/index.js';

export { createDistributedLockManager } from './distributed-lock/index.js';
export type { DistributedLockConfig, DistributedLock } from './distributed-lock/index.js';

export { createEmbeddingStore } from './embedding-store/index.js';
export type { EmbeddingStoreConfig, EmbeddingRecord, SearchResult as EmbeddingSearchResult } from './embedding-store/index.js';

export { createErrorHandler, ErrorCodes } from './error-handler/index.js';
export type { ErrorReport, ErrorCode, ErrorCategory } from './error-handler/index.js';

export { createEventStore } from './event-store/index.js';
export type { DomainEvent, Snapshot, EventStoreConfig } from './event-store/index.js';

export { EventBus, getEventBus, createEventBus, publishMessageEvent } from './eventbus/index.js';
export type { GatewayEvent, GatewayEventType, EventHandler, EventSubscription } from './eventbus/index.js';

export { FailoverProvider, LoadBalancerProvider, createFailoverProvider, createLoadBalancerProvider } from './failover/index.js';
export type { FailoverConfig, LoadBalancerConfig } from './failover/index.js';

export { createFeatureFlagManager } from './feature-flags/index.js';
export type { FeatureFlag, FlagEvaluationContext } from './feature-flags/index.js';

export { createShutdownManager } from './graceful-shutdown/index.js';
export type { ShutdownConfig } from './graceful-shutdown/index.js';

export { createGraphQLGateway } from './graphql/index.js';
export type { GraphQLQuery, GraphQLMutation, GraphQLSubscription, GraphQLService } from './graphql/index.js';

export { createHealthChecker } from './health-checker/index.js';
export type { HealthCheck, HealthStatus } from './health-checker/index.js';

export { InputSanitizer } from './input-sanitizer/index.js';

export { createMessageBus } from './message-bus/index.js';
export type { BusMessage, MessageHandler } from './message-bus/index.js';

export { RateLimitManager, createRateLimitManager } from './middleware/index.js';
export { createValidationManager } from './middleware/index.js';

export { createMiddlewarePipeline, Middleware } from './middleware-pipeline/index.js';
export type { MiddlewareFn, MiddlewareContext } from './middleware-pipeline/index.js';

export { createModerationPipeline } from './moderation/index.js';
export type { ModerationConfig, ModerationPipeline } from './moderation/index.js';

export { createNotificationSystem } from './notifications/index.js';
export type { NotificationConfig, NotificationRecipient } from './notifications/index.js';

export { recordHttpRequest, recordMessage, recordApiCall, recordSessionCount, recordCacheHit, recordToolExecution, recordError, getMetrics, resetMetrics, metricsMiddleware } from './observability/index.js';
export { Tracer, getTracer, trace } from './observability/index.js';

export { createObservabilityEngine } from './observability-engine/index.js';
export type { MetricDefinition, AlertRule, Alert } from './observability-engine/index.js';

export { createOpenApiGenerator } from './openapi/index.js';
export type { OpenApiInfo, OpenApiComponent } from './openapi/index.js';

export { Paginator } from './pagination/index.js';
export type { PageResult, PageInfo, PaginationParams } from './pagination/index.js';

export { createPipelineEngine } from './pipeline-engine/index.js';
export type { PipelineDefinition, PipelineRun, PipelineStage } from './pipeline-engine/index.js';

export { createPluginLoader } from './plugins/index.js';
export type { PluginLoaderConfig } from './plugins/index.js';

export { createMessageQueue } from './queue/index.js';
export type { QueueConfig, QueueMessage, MessageHandler as QueueMessageHandler } from './queue/index.js';

export { createRateLimitEngine } from './rate-limit-engine/index.js';
export type { RateLimitRule, RateLimitContext, RateLimitResult, RateLimitAlgorithm } from './rate-limit-engine/index.js';

export { createRequestDeduplicator } from './request-deduplicator/index.js';
export type { DeduplicationConfig, DeduplicationStats } from './request-deduplicator/index.js';

export { createRequestLogger } from './request-logger/index.js';
export type { RequestLoggerConfig, RequestLogEntry } from './request-logger/index.js';

export { createRequestTracker } from './request-tracker/index.js';
export type { RequestTrace } from './request-tracker/index.js';

export { createResourceLocker } from './resource-locker/index.js';
export type { ResourceLock, LockMode } from './resource-locker/index.js';

export { createResponseTransformer } from './response-transformer/index.js';
export type { TransformerOptions, ResponseEnvelope, ErrorResponse } from './response-transformer/index.js';

export { withRetry, withTimeout, createBulkhead, Bulkhead } from './retry-handler/index.js';
export type { RetryConfig } from './retry-handler/index.js';

export { createRuleEngine } from './rule-engine/index.js';
export type { Rule, RuleCondition, RuleEvaluationResult, RuleEngineConfig } from './rule-engine/index.js';

export { createSchemaRegistry } from './schema-registry/index.js';
export type { SchemaDefinition, SchemaCompatibilityResult } from './schema-registry/index.js';

export { createSearchEngine } from './search-engine/index.js';
export type { SearchQuery, SearchResult as EngineSearchResult, SearchDocument, SearchIndex, SearchField } from './search-engine/index.js';

export { createSecretManager } from './secrets/index.js';
export type { SecretManagerConfig, SecretEntry } from './secrets/index.js';

export { createSecurityScanner } from './security-scanner/index.js';
export type { SecurityConfig, ThreatDetection, IpReputation, ThreatLevel } from './security-scanner/index.js';

export { createServiceRegistry } from './service-registry/index.js';
export type { ServiceConfig, ServiceInstance } from './service-registry/index.js';

export { createSessionManager as createSessionManagerV2 } from './session-manager/index.js';
export type { SessionConfig, Session as SessionV2, SessionMessage as SessionMessageV2 } from './session-manager/index.js';

export { createTaskScheduler } from './task-scheduler/index.js';
// Agent Error Classification
export { classifyAgentError, getRecoveryAction, ErrorTracker, handleAgentError } from './agent-error/index.js';
export type { AgentErrorType, AgentErrorClassification, RecoveryAction, ErrorStats } from './agent-error/index.js';

export { createSkillsEngine } from './skills-engine/index.js';
export type { SkillEngineConfig, Skill, SkillMetadata, SkillSearchResult } from './skills-engine/index.js';
export { createPluginInstaller } from './marketplace/installer.js';
export { PluginRegistry, createPluginRegistry } from './marketplace/registry.js';
export type { ScheduledJob, JobExecution, JobExecutionContext } from './task-scheduler/index.js';

export { createTenantManager } from './tenant-manager/index.js';
export type { Tenant, TenantSettings, TenantQuotas, TenantUsage } from './tenant-manager/index.js';

export { LruCache, debounce, throttle, deepClone, flatten, unflatten } from './utils/index.js';

export { createWebhookManager } from './webhook-manager/index.js';
export type { WebhookSubscription, WebhookDelivery } from './webhook-manager/index.js';

export { createWorkflowEngine } from './workflow/index.js';
export type { WorkflowDefinition, WorkflowExecution, WorkflowStep } from './workflow/index.js';

// Default export — CLI runner
import { runCli } from './cli/index.js';
export default runCli;
