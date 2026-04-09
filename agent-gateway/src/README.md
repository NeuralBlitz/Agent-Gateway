# Source Code (`src/`)

> **The complete source code for Agent Gateway — 56 TypeScript files across 30+ modules.**

This directory contains the entire runtime implementation of Agent Gateway. The codebase is organized around a layered adapter architecture where messaging platform adapters (channels) feed into a central gateway orchestrator, which delegates to AI provider adapters through an agentic tool-calling loop.

---

## Directory Structure

```
src/
├── index.ts                  # Main barrel export (default: runCli)
├── cli/                      # CLI entry point and argument parser
│   └── index.ts
├── commands/                 # CLI command implementations (7 commands)
│   ├── index.ts              # Barrel re-export
│   ├── server.ts             # Start the gateway
│   ├── config.ts             # Get/set/list configuration
│   ├── channels.ts           # List/add/remove channels
│   ├── providers.ts          # List/add/remove providers
│   ├── plugins.ts            # List/install/uninstall plugins
│   ├── init.ts               # Scaffold config.json + .env.example
│   └── version.ts            # Print version info
├── gateway/                  # Core Gateway class (central orchestrator)
│   └── index.ts
├── server/                   # Express HTTP + WebSocket server
│   └── index.ts
├── agents/                   # BaseAgent with tool-calling loop
│   └── index.ts
├── channels/                 # 6 messaging platform adapters
│   ├── index.ts              # Barrel export + registerBuiltinChannels()
│   ├── types.ts              # Channel, ChannelUser, ChannelBot, ChannelMessage
│   ├── factory.ts            # createChannel() switch factory
│   ├── telegram/             # Telegram Bot API adapter
│   ├── discord/              # Discord REST API v10 adapter
│   ├── slack/                # Slack Web API adapter
│   ├── whatsapp/             # Meta Graph API v18 adapter
│   ├── signal/               # Signal stub (requires signal-cli)
│   └── matrix/               # Matrix Client-Server API adapter
├── providers/                # 6 AI provider adapters
│   ├── index.ts              # Barrel export + registerBuiltinProviders()
│   ├── types.ts              # Provider, ChatMessage, ToolCall, ModelResponse
│   ├── factory.ts            # createProvider() switch factory
│   ├── openai/               # OpenAI Chat Completions API
│   ├── anthropic/            # Anthropic Messages API
│   ├── google/               # Google Gemini generateContent API
│   ├── mistral/              # Mistral (OpenAI-compatible)
│   ├── deepseek/             # DeepSeek (OpenAI-compatible)
│   └── ollama/               # Ollama local API
├── tools/                    # Built-in agent tools
│   ├── registry.ts           # ToolRegistry manager
│   ├── bash.ts               # Shell command execution
│   ├── filesystem.ts         # File read/write/list/delete/move
│   └── websearch.ts          # Web search + URL fetching
├── sessions/                 # Session persistence
│   ├── index.ts              # Session class + SessionManager + file/in-memory
│   ├── database.ts           # libsql/SQLite persistence
│   └── redis.ts              # Redis persistence with ioredis
├── auto-reply/               # Automatic message reply handler
│   └── index.ts
├── plugin-sdk/               # Plugin type definitions and base classes
│   └── index.ts
├── plugins/                  # Runtime plugin loader
│   └── loader.ts
├── hooks/                    # Lifecycle hook system (9 phases)
│   └── index.ts
├── auth/                     # Authentication and authorization
│   └── index.ts
├── ratelimit/                # Rate limiting and throttling
│   └── index.ts
├── webhooks/                 # Standalone webhook HTTP server
│   └── index.ts
├── streaming/                # SSE streaming support
│   └── index.ts
├── observability/            # Prometheus metrics + distributed tracing
│   ├── metrics.ts            # Prometheus metrics + Express middleware
│   └── tracing.ts            # In-memory span tracing
├── config/                   # Configuration management with Zod validation
│   └── index.ts
├── infra/                    # Logging + custom error classes
│   ├── index.ts              # Barrel export
│   └── logger.ts             # Pino-based logger
├── cache/                    # Response caching (LRU + Redis)
│   └── index.ts
├── context/                  # Token counting + context window management
│   └── index.ts
├── failover/                 # Failover chains + load balancing
│   └── index.ts
├── eventbus/                 # Event pub/sub system (24 event types)
│   └── index.ts
├──                # Circuit breaker pattern
│   └── circuit-breaker.ts
└── utils/                    # Utility functions
    └── index.ts
```

---

## Entry Point

The main entry point is `src/index.ts`, which acts as a **barrel file** — it re-exports all public APIs from every module. This allows consumers to import any part of the gateway from a single import path:

```typescript
import { Gateway, Config, BaseAgent, createAndStartServer, runCli } from 'agent-gateway';
```

The **default export** is `runCli`, which is the function invoked when running the `agent-gateway` CLI binary.

---

## Architecture Layers

### 1. CLI Layer (`cli/` + `commands/`)
The command-line interface parses `argv` and dispatches to subcommands. Each command is a self-contained module that interacts with the rest of the system through the public API.

### 2. Server Layer (`server/`)
An Express 5 HTTP server that provides:
- Health and readiness endpoints
- Prometheus metrics endpoint
- REST API for status, sessions, and message sending
- SSE streaming endpoint
- WebSocket endpoint (`/ws`)
- Webhook routes for all channels

### 3. Gateway Core (`gateway/`)
The `Gateway` class is the central orchestrator. It:
- Manages a registry of channels, providers, and agents
- Creates and manages sessions per user/channel combination
- Routes incoming messages through the auto-reply handler
- Emits events for every significant action

### 4. Agent Layer (`agents/`)
The `BaseAgent` implements the agentic tool-calling loop:
1. Call the AI provider with the user message + tool definitions
2. If the provider returns tool calls, execute each tool
3. Feed tool results back to the provider
4. Repeat until no more tool calls or `maxSteps` is reached
5. Return the final text response

### 5. Channel Layer (`channels/`)
Six messaging platform adapters, each implementing the `Channel` interface:
- Handle sending messages (text, media, rich content)
- Handle receiving messages (via polling or webhooks)
- Normalize platform-specific data into a common `ChannelMessage` format

### 6. Provider Layer (`providers/`)
Six AI provider adapters, each implementing the `Provider` interface:
- `chat()` — Simple text completion
- `chatWithTools()` — Completion with tool-calling support
- `listModels()` — List available models
- Some support streaming, model management (Ollama), etc.

### 7. Infrastructure Layer
Cross-cutting concerns that support the entire system:
- **Config**: Zod-validated configuration
- **Infra**: Logger (pino) and custom error classes
- **Cache**: LRU/Redis response caching
- **Auth**: User authentication and API key management
- **RateLimit**: Rate limiting and throttling
- **Hooks**: Lifecycle hook system
- **Observability**: Metrics and tracing
- **EventBus**: Pub/sub event system
- **Resilience**: Circuit breaker pattern
- **Failover**: Provider fallback and load balancing

---

## Key Design Patterns

### Adapter Pattern
Every channel and provider implements a standard TypeScript interface, making them interchangeable. The factory functions (`createChannel`, `createProvider`) instantiate the correct adapter based on configuration.

### Event-Driven Architecture
The `Gateway`, `Session`, and `AutoReply` classes all extend `EventEmitter`. The `EventBus` provides a global pub/sub system with 24 event types for decoupled communication between modules.

### Plugin System
The plugin SDK defines interfaces for channels, providers, tools, and hooks. The `PluginLoader` dynamically imports npm packages at startup and registers their exports with the gateway.

### Resilience Patterns
- **Circuit Breaker**: Wraps provider calls to fail fast when a provider is down
- **Rate Limiter**: Token-bucket based limiting at global, channel, and user levels
- **Failover Provider**: Chains providers with automatic fallback
- **Load Balancer**: Distributes load across multiple providers

---

## Type System

The codebase uses strict TypeScript with ES2022 target. Key type definitions live in:
- `src/channels/types.ts` — Channel-related types
- `src/providers/types.ts` — Provider-related types
- `src/plugin-sdk/index.ts` — Plugin system types

All configuration is validated at runtime using **Zod** schemas, providing type-safe access to config values throughout the codebase.

---

## Related Documentation

- [`cli/`](../cli/README.md) — CLI entry point
- [`commands/`](../commands/README.md) — CLI commands
- [`gateway/`](../gateway/README.md) — Gateway orchestrator
- [`server/`](../server/README.md) — HTTP/WebSocket server
- [`agents/`](../agents/README.md) — BaseAgent tool-calling
- [`channels/`](../channels/README.md) — Channel adapters
- [`providers/`](../providers/README.md) — Provider adapters
- [`tools/`](../tools/README.md) — Built-in tools
- [`sessions/`](../sessions/README.md) — Session persistence
- [`hooks/`](../hooks/README.md) — Lifecycle hooks
- [`observability/`](../observability/README.md) — Metrics and tracing
- [`config/`](../config/README.md) — Configuration
- [`plugin-sdk/`](../plugin-sdk/README.md) — Plugin SDK
- [`plugins/`](../plugins/README.md) — Plugin loader
- [`auth/`](../auth/README.md) — Authentication
- [`ratelimit/`](../ratelimit/README.md) — Rate limiting
- [`cache/`](../cache/README.md) — Caching
- [`context/`](../context/README.md) — Context management
- [`failover/`](../failover/README.md) — Failover and load balancing
- [`eventbus/`](../eventbus/README.md) — Event system
- [``](../README.md) — Circuit breaker
- [`auto-reply/`](../auto-reply/README.md) — Auto-reply handler
- [`streaming/`](../streaming/README.md) — SSE streaming
- [`webhooks/`](../webhooks/README.md) — Webhook server
- [`infra/`](../infra/README.md) — Logging and errors
- [`utils/`](../utils/README.md) — Utilities
