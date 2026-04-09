# Architecture Documentation

> **System design, internal architecture, and design patterns of Agent Gateway**

This document describes the internal architecture of Agent Gateway, covering the layered design, core components, data flow patterns, plugin system, observability infrastructure, resilience mechanisms, and deployment topology. Use this reference to understand how the system works internally, plan customizations, or design extensions.

---

## Table of Contents

- [Overview](#overview)
- [System Architecture Diagram](#system-architecture-diagram)
- [Layered Architecture](#layered-architecture)
- [Design Patterns](#design-patterns)
- [Message Lifecycle](#message-lifecycle)
- [Component Deep Dive](#component-deep-dive)
- [Plugin System Architecture](#plugin-system-architecture)
- [Session Management Architecture](#session-management-architecture)
- [Observability Architecture](#observability-architecture)
- [Resilience Architecture](#resilience-architecture)
- [Security Architecture](#security-architecture)
- [Data Flow Patterns](#data-flow-patterns)
- [Concurrency Model](#concurrency-model)
- [Deployment Topology](#deployment-topology)
- [Scalability Considerations](#scalability-considerations)
- [Performance Characteristics](#performance-characteristics)

---

## Overview

Agent Gateway is built on a **layered adapter pattern** that cleanly separates concerns between messaging platforms, the gateway core, AI agents, and model providers. Each layer communicates through well-defined interfaces, enabling independent development, testing, and replacement of components.

The codebase lives in `/home/runner/workspace/agent-gateway/src/` and follows a modular directory structure where each major subsystem has its own directory with an `index.ts` barrel file.

### Key Design Goals

1. **Extensibility**: Any channel, provider, tool, or hook can be added via plugins
2. **Resilience**: Circuit breakers, failover, retry, and rate limiting ensure uptime
3. **Observability**: Metrics, tracing, and structured logging provide production visibility
4. **Type safety**: Full TypeScript coverage with Zod runtime validation
5. **Performance**: Async-first design with parallel execution support

---

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        Messaging Platforms (External)                     │
│   ┌──────────┐ ┌─────────┐ ┌───────┐ ┌──────────┐ ┌──────┐ ┌─────────┐  │
│   │ Telegram │ │ Discord │ │ Slack │ │ WhatsApp │ │Signal│ │ Matrix  │  │
│   └────┬─────┘ └────┬────┘ └───┬───┘ └────┬─────┘ └──┬───┘ └────┬────┘  │
└────────┼────────────┼──────────┼──────────┼────────────┼──────────┼──────┘
         │            │          │          │            │          │
         ▼            ▼          ▼          ▼            ▼          ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         Channels Layer (src/channels/)                    │
│   Platform-specific adapters: webhook handling, message formatting, auth  │
│                                                                          │
│   Each channel implements the Channel interface:                          │
│   connect() | disconnect() | sendMessage() | on()                        │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       Gateway Core (src/gateway/)                         │
│                                                                          │
│   ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────────┐  │
│   │ Event Bus    │ │ Hook System  │ │ Tool        │ │ Session Manager │  │
│   │ (EventEmitter│ │ (before/     │ │ Registry    │ │ (File/DB/Redis) │  │
│   │  + pub/sub)  │ │  after hooks)│ │ (Bash/FS/   │ │                 │  │
│   │              │ │              │ │  WebSearch) │ │                 │  │
│   └──────────────┘ └──────────────┘ └─────────────┘ └─────────────────┘  │
│                                                                          │
│   ┌──────────────┐ ┌──────────────┐ ┌─────────────┐ ┌─────────────────┐  │
│   │ Rate Limiter │ │ Auth Module  │ │ Cache       │ │ Response        │  │
│   │ (global/     │ │ (API keys,   │ │ (LRU,       │ │ Transformer     │  │
│   │  per-user)   │ │  RBAC)       │ │  TTL)       │ │                 │  │
│   └──────────────┘ └──────────────┘ └─────────────┘ └─────────────────┘  │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          Agents Layer (src/agents/)                       │
│                                                                          │
│   BaseAgent: Tool-calling loop with max-steps, context management         │
│   - Receive message + context                                            │
│   - Call provider with tool definitions                                  │
│   - Execute tool calls, feed results back                                │
│   - Repeat until final response or maxSteps reached                      │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       Providers Layer (src/providers/)                    │
│                                                                          │
│   ┌────────┐ ┌───────────┐ ┌────────┐ ┌────────┐ ┌──────────┐ ┌──────┐  │
│   │ OpenAI │ │ Anthropic │ │ Google │ │ Mistral│ │ DeepSeek │ │Ollama│  │
│   └────────┘ └───────────┘ └────────┘ └────────┘ └──────────┘ └──────┘  │
│                                                                          │
│   Each provider implements the Provider interface:                        │
│   chat() | chatWithTools() | listModels()                                │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        AI Model APIs (External)                           │
│   Chat completions, tool-use, streaming responses                        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Layered Architecture

### Layer 1: Channels

The channels layer adapts messaging platform APIs to a uniform internal interface.

**Location**: `/home/runner/workspace/agent-gateway/src/channels/`

**Responsibilities**:
- Receive inbound messages (via webhooks or long-polling)
- Format outbound messages for platform-specific rendering
- Handle platform authentication and token management
- Normalize message formats (text, media, attachments)
- Emit channel-specific events through the Event Bus

**Interface** (`Channel`):

```typescript
interface Channel {
  id: string;
  type: string;
  name: string;
  connected: boolean;
  config: Record<string, any>;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(chatId: string, content: string, options?: any): Promise<void>;
  getUser(userId: string): Promise<ChannelUser | null>;
  getMe(): Promise<ChannelBot | null>;
  on(event: string, handler: Function): void;
}
```

**Built-in implementations**:
- `TelegramChannel`: Bot API with webhooks and long-polling
- `DiscordChannel`: Gateway WebSocket with intents and events
- `SlackChannel`: Events API with Block Kit formatting
- `WhatsAppChannel`: Cloud API with phone number ID
- `SignalChannel`: Stub for signal-cli integration
- `MatrixChannel`: Client-Server API with sync loops

### Layer 2: Gateway Core

The gateway core orchestrates all subsystems and manages the message processing pipeline.

**Location**: `/home/runner/workspace/agent-gateway/src/gateway/`

**Responsibilities**:
- Lifecycle management (start, stop, health checks)
- Channel and provider registry
- Session creation and lookup
- Event bus coordination
- Hook execution at lifecycle phases
- Tool registry management
- Server startup (HTTP + WebSocket)

### Layer 3: Agents

The agents layer implements the AI tool-calling loop.

**Location**: `/home/runner/workspace/agent-gateway/src/agents/`

**Responsibilities**:
- Maintain conversation context (message history)
- Call the AI provider with tool definitions
- Parse and execute tool calls from provider responses
- Feed tool results back to the provider
- Repeat until the provider returns a final text response
- Enforce `maxSteps` to prevent infinite loops

### Layer 4: Providers

The providers layer adapts AI model APIs to a uniform interface.

**Location**: `/home/runner/workspace/agent-gateway/src/providers/`

**Responsibilities**:
- Send chat requests to AI providers
- Support tool-calling with provider-specific formats
- Handle streaming responses
- List available models
- Manage API keys and connection state

**Interface** (`Provider`):

```typescript
interface Provider {
  id: string;
  type: string;
  name: string;
  config: ProviderConfig;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  chat(messages: ChatMessage[], options?: any): Promise<ModelResponse>;
  chatWithTools(messages: ChatMessage[], tools: Tool[], options?: any): Promise<ModelResponse>;
}
```

---

## Design Patterns

### Adapter Pattern

Every channel and provider implements a standard interface, making it trivial to add new integrations:

```
External API ──► Adapter ──► Standard Interface ──► Gateway Core
```

### Event-Driven Architecture

The system uses an `EventEmitter`-based event bus (`src/eventbus/`) for loose coupling:

- Channels emit `message:received` events
- The gateway listens and processes them through the agent pipeline
- Agents emit `response:generated` events
- Channels listen and send responses back

### Plugin Extensibility

The plugin system (`src/plugins/`, `src/plugin-sdk/`) allows runtime extension:

- Plugins are loaded from npm packages or local directories
- Each plugin declares a manifest with its provided components
- The plugin loader instantiates and registers components

### Circuit Breaker Pattern

The `CircuitBreaker` (`src/resilience/circuit-breaker.js`) protects against cascading failures:

```
CLOSED ──(failures exceed threshold)──► OPEN
  ▲                                        │
  │                                        │ (after resetTimeout)
  │                                        ▼
  └──────────(success)──────────── HALF-OPEN
```

### Strategy Pattern

Session persistence uses the strategy pattern with interchangeable backends:
- `InMemorySessionPersistence`
- `FileSessionPersistence`
- `DatabaseSessionPersistence`
- `RedisSessionPersistence`

---

## Message Lifecycle

1. **Inbound**: Platform sends a message via webhook or polling
2. **Channel Adapter**: `TelegramChannel` receives and normalizes the message
3. **Event Emission**: `message:received` event published to Event Bus
4. **Hook Execution**: `beforeMessage` hooks run (can modify or reject)
5. **Session Lookup**: Load or create session for this channel+user
6. **Context Building**: Build conversation context from session history
7. **Agent Processing**: `BaseAgent` enters the tool-calling loop
   - Call provider with context + tool definitions
   - If tool calls returned: execute tools, feed results back, repeat
   - If final response: exit loop
8. **Hook Execution**: `afterResponse` hooks run (can modify or log)
9. **Session Update**: Save updated message history to session
10. **Outbound**: Channel adapter sends response to the platform
11. **Metrics**: Record message, API call, token usage metrics

---

## Component Deep Dive

### Event Bus (`src/eventbus/`)

A pub/sub system built on `emittery` for typed events:

```typescript
interface GatewayEvent {
  type: GatewayEventType; // 'message:received' | 'response:sent' | etc.
  channel?: string;
  userId?: string;
  sessionId?: string;
  payload: any;
  timestamp: number;
}
```

### Hook System (`src/hooks/`)

Lifecycle hooks execute at defined phases:

| Phase | Timing | Purpose |
|-------|--------|---------|
| `beforeMessage` | After message received, before processing | Validation, enrichment, rejection |
| `beforeAgent` | Before agent processing | Context modification, provider selection |
| `afterAgent` | After agent processing | Response transformation |
| `afterResponse` | Before sending response | Logging, enrichment |
| `onError` | On any error | Error handling, alerting |

Hooks execute in priority order (highest first).

### Tool Registry (`src/tools/`)

Manages agent tools with execution:

| Tool | Purpose | Safety |
|------|---------|--------|
| BashTool | Shell command execution | Command blocklist, directory restrictions, timeout, output limit |
| FileSystemTool | File operations | Directory restrictions, size limits |
| WebSearchTool | Web search and URL fetch | DuckDuckGo (no key) or Google CSE |

---

## Plugin System Architecture

### Plugin Types

| Type | Extends | Example |
|------|---------|---------|
| Channel | `BaseChannel` | Custom messaging platform |
| Provider | `BaseProvider` | Custom AI model provider |
| Tool | Tool definition + handler | Custom agent tool |
| Hook | Hook definition | Custom lifecycle logic |

### Plugin Manifest

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "Description",
  "main": "dist/index.js",
  "channels": [{"id": "mychannel", "class": "MyChannel"}],
  "providers": [{"id": "myprovider", "class": "MyProvider"}],
  "tools": [{"name": "myTool", "handler": "myToolHandler"}],
  "hooks": [{"name": "myHook", "phase": "beforeMessage"}]
}
```

### Loading Lifecycle

1. `PluginLoader` discovers plugins from config
2. For each plugin: load manifest, resolve dependencies, instantiate classes
3. Register components with their respective registries
4. Emit `plugin:loaded` event

---

## Session Management Architecture

### Persistence Backends

| Backend | Storage | Consistency | Best For |
|---------|---------|-------------|----------|
| File | JSON files (atomic write via tmp+rename) | Eventual | Development, single instance |
| Database | libsql/SQLite with indexes | Strong | Single instance, structured |
| Redis | Sorted sets with TTL | Strong | Distributed, high-throughput |
| In-Memory | JavaScript Map | Volatile | Testing, ephemeral |

### Session Key Resolution

Sessions are keyed by `(channel, userId)` combination. The `SessionManager`:

1. Receives `channel + userId`
2. Looks up existing session
3. Creates new session if not found
4. Returns session reference with message history

### Message Storage

Each session stores:
- Message history (up to `maxMessages`)
- Metadata (channel, userId, provider, timestamps)
- Context window state (for token-based truncation)

---

## Observability Architecture

### Three Pillars

1. **Metrics** (`src/observability/metrics.js`): Prometheus counters, histograms, gauges
2. **Tracing** (`src/observability/tracing.js`): In-memory distributed tracing with spans
3. **Logging** (`src/infra/logger`): Pino structured logging with child loggers

### Metrics Collection

```
Request ─► metricsMiddleware ─► recordHttpRequest() ─► Prometheus Registry
Message ─► recordMessage() ─► counter increment by channel
API Call ─► recordApiCall() ─► counter increment by provider
Tool ─► recordToolExecution() ─► counter increment by tool name
Error ─► recordError() ─► counter increment by type
```

### Tracing

The `Tracer` class manages spans in a tree structure:

```typescript
class Tracer {
  startSpan(name: string, parent?: Span): Span;
  endSpan(span: Span, status?: 'ok' | 'error', error?: Error): void;
  getRecentTraces(limit?: number): Trace[];
  getErrorTraces(limit?: number): Trace[];
}
```

---

## Resilience Architecture

### Circuit Breaker

Protects external service calls (providers, channels):

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;    // Failures before opening
  resetTimeout: number;        // ms before half-open
  halfOpenMaxCalls: number;    // Test calls in half-open
}
```

### Failover Provider

When a provider fails, automatically switch to a backup:

```typescript
const failover = new FailoverProvider({
  primary: openaiProvider,
  fallbacks: [anthropicProvider, googleProvider],
  fallbackOn: ['rate_limit', 'timeout', 'error'],
});
```

### Load Balancer

Distribute requests across multiple provider instances:

```typescript
const lb = new LoadBalancerProvider({
  providers: [openai1, openai2, openai3],
  strategy: 'round-robin', // or 'least-loaded'
});
```

### Rate Limiting

Multi-level rate limiting:

- **Global**: Total requests across all users
- **Per-user**: Requests per individual user
- **Per-channel**: Requests per channel type
- **Per-provider**: API calls per AI provider

---

## Security Architecture

### Authentication

- API key authentication via Bearer tokens
- WebSocket authentication via query parameter
- Role-based access control (admin, user, guest)
- bcrypt password hashing for user accounts

### Input Validation

- Zod schema validation on all API request bodies
- Command blocklist for Bash tool
- Directory restrictions for Filesystem tool
- Webhook secret validation (HMAC verification)

### Network Security

- Tool execution sandboxing (allowed directories only)
- Output size limits (64KB for bash, 256KB for file reads)
- Timeout enforcement on all external calls
- Rate limiting on all endpoints

---

## Data Flow Patterns

### Synchronous Flow (REST POST /api/send)

```
Client ─► REST API ─► Gateway ─► Session ─► Agent ─► Provider ─► Agent ─► Channel ─► Client
```

### Asynchronous Flow (Webhook)

```
Platform ─► Webhook ─► Channel ─► EventBus ─► Gateway ─► Agent ─► Provider ─► Agent ─► Channel ─► Platform
```

### Streaming Flow (SSE)

```
Client ─► REST API ─► Gateway ─► Agent ─► Provider (streaming) ─► SSE events ─► Client
```

---

## Concurrency Model

- **Async-first**: All I/O operations are asynchronous
- **Event loop**: Node.js single-threaded event loop handles concurrent connections
- **Parallel execution**: Parallel workflow steps use `Promise.all`
- **Session isolation**: Each session processes messages independently
- **Channel concurrency**: Each channel adapter manages its own connection pool

---

## Deployment Topology

### Single Instance

```
┌────────────────────┐
│   Agent Gateway    │
│   (all components) │
│                    │
│   ┌──────────────┐ │
│   │ File Sessions│ │
│   └──────────────┘ │
└────────────────────┘
```

### Distributed with Redis

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  Gateway A  │  │  Gateway B  │  │  Gateway C  │
│             │  │             │  │             │
│ ┌─────────┐ │  │ ┌─────────┐ │  │ ┌─────────┐ │
│ │Sessions │◄─┼──┤│Sessions │◄─┼──┤│Sessions │ │
│ └────┬────┘ │  │ └────┬────┘ │  │ └────┬────┘ │
└──────┼──────┘  └──────┼──────┘  └──────┼──────┘
       └────────────────┼────────────────┘
                        ▼
              ┌─────────────────┐
              │    Redis        │
              │  (shared state) │
              └─────────────────┘
```

### Kubernetes Deployment

```yaml
services:
  agent-gateway:
    replicas: 3
    ports:
      - "3000:3000"
    env:
      - SESSIONS_BACKEND=redis
      - REDIS_URL=redis://redis:6379
    livenessProbe:
      httpGet: { path: /healthz, port: 3000 }
    readinessProbe:
      httpGet: { path: /ready, port: 3000 }
```

---

## Scalability Considerations

### Horizontal Scaling

- Use Redis or Database session backend for shared state
- Configure load balancer for provider distribution
- Deploy multiple instances behind a reverse proxy

### Bottlenecks

1. **Provider API limits**: Rate limits from OpenAI, Anthropic, etc.
2. **Session I/O**: File-based sessions do not scale horizontally
3. **In-memory tracing**: Traces are lost on restart; use external tracing for production
4. **Single-threaded CPU**: Node.js handles I/O well but CPU-bound operations block

### Optimization Strategies

- Use Database or Redis sessions for production
- Enable response caching for repeated queries
- Use failover providers for availability
- Monitor Prometheus metrics for capacity planning

---

## Performance Characteristics

| Operation | Latency | Notes |
|-----------|---------|-------|
| Health check | < 1ms | In-memory check |
| Session lookup | < 1ms (memory) / < 10ms (Redis) | Depends on backend |
| Provider call | 500ms - 10s | Depends on model and token count |
| Tool execution | < 100ms | Bash: up to 30s timeout |
| Message end-to-end | 1s - 15s | Dominated by provider latency |
| WebSocket message | < 5ms | In-process routing |
| Metrics recording | < 0.1ms | Counter increment |
