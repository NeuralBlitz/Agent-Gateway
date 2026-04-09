# Agent Gateway

> **A Universal AI Agent Gateway — Bridge Any Messaging Platform to Any AI Provider**

Agent Gateway is a production-grade, self-hosted AI agent gateway that connects messaging platforms (Telegram, Discord, Slack, WhatsApp, Signal, Matrix) to AI model providers (OpenAI, Anthropic, Google, Mistral, DeepSeek, Ollama). It provides automatic tool-calling, persistent sessions, a plugin system, and full observability — all behind a clean REST API, WebSocket, and CLI.

---

## Table of Contents

- [Quick Start](#quick-start)
- [Architecture Overview](#architecture-overview)
- [Supported Channels](#supported-channels)
- [Supported AI Providers](#supported-ai-providers)
- [Built-in Tools](#built-in-tools)
- [Configuration](#configuration)
- [CLI Commands](#cli-commands)
- [REST API](#rest-api)
- [WebSocket API](#websocket-api)
- [Plugin System](#plugin-system)
- [Session Management](#session-management)
- [Observability](#observability)
- [Security](#security)
- [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [Development](#development)

---

## Quick Start

### Prerequisites

- **Node.js >= 20.0.0**
- **npm** or your preferred package manager

### Installation

```bash
# Clone and install dependencies
cd agent-gateway
npm install

# Initialize configuration
npm start -- init

# Start the gateway
npm start
```

### One-Line Docker Start

```bash
docker compose up -d
```

See [Docker Deployment](#docker-deployment) for full configuration options.

---

## Architecture Overview

Agent Gateway follows a layered adapter pattern that cleanly separates concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                     Messaging Platforms                         │
│   Telegram │ Discord │ Slack │ WhatsApp │ Signal │ Matrix       │
└─────────┬──────────┬────────┬──────────┬──────────┬─────────────┘
          │          │        │          │          │
          ▼          ▼        ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Channels Layer                           │
│   (Platform-specific adapters: webhook handling, formatting)    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Gateway Core                              │
│   Session management │ Tool registry │ Hook system │ Event bus  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Agents Layer                             │
│   BaseAgent: Tool-calling loop with max-steps, context mgmt     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Providers Layer                           │
│   OpenAI │ Anthropic │ Google │ Mistral │ DeepSeek │ Ollama     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                       AI Model APIs                             │
│   Chat completions, tool-use, streaming responses               │
└─────────────────────────────────────────────────────────────────┘
```

### Core Design Principles

1. **Adapter Pattern**: Every channel and provider implements a standard interface, making it trivial to add new ones.
2. **Tool-Calling Agents**: The BaseAgent implements an agentic loop — it calls the AI provider, executes returned tool calls, feeds results back, and repeats up to `maxSteps`.
3. **Plugin Extensibility**: Custom channels, providers, tools, and hooks can be loaded at runtime from npm packages.
4. **Resilience**: Circuit breakers, rate limiters, failover providers, and load balancers ensure uptime.
5. **Observability**: Prometheus metrics, distributed tracing, and structured logging provide production-grade visibility.

---

## Supported Channels

| Channel | Status | Features |
|---------|--------|----------|
| **Telegram** | ✅ Built-in | Text, photos, stickers, documents, webhooks, setWebhook |
| **Discord** | ✅ Built-in | Text, embeds, replies, reactions, DMs, gateway events |
| **Slack** | ✅ Built-in | Rich messages (blocks), reactions, conversations, events |
| **WhatsApp** | ✅ Built-in | Text, images, documents, templates, read receipts, webhooks |
| **Signal** | 🚧 Stub | Basic text messaging (requires signal-cli integration) |
| **Matrix** | ✅ Built-in | Rooms, replies, notices, room management, sync events |

Each channel adapter handles platform-specific message formatting, webhook/event processing, media types, and authentication. See `src/channels/` for implementation details.

---

## Supported AI Providers

| Provider | Status | API Type | Features |
|----------|--------|----------|----------|
| **OpenAI** | ✅ Built-in | Chat Completions | chat, chatWithTools, streaming, model listing |
| **Anthropic** | ✅ Built-in | Messages API | chat, chatWithTools (tool_use blocks), model listing |
| **Google** | ✅ Built-in | Gemini generateContent | chat, chatWithTools (functionCalling), model listing |
| **Mistral** | ✅ Built-in | OpenAI-compatible | chat, chatWithTools, model listing |
| **DeepSeek** | ✅ Built-in | OpenAI-compatible | chat, chatWithTools, model listing |
| **Ollama** | ✅ Built-in | Local `/api/chat` | chat, chatWithTools, model pull/delete, listing |

All providers implement the `Provider` interface from the Plugin SDK, ensuring consistent behavior. Providers support tool-calling for agent workflows.

---

## Built-in Tools

The gateway ships with three core tools that agents can invoke:

### Bash Tool
- Execute shell commands with safety guards
- Blocked dangerous commands (`rm -rf /`, etc.)
- Restricted to allowed directories
- 30-second timeout, 64KB output limit
- Toggle with `DISABLE_BASH_TOOL=true`

### Filesystem Tool
- Read, write, list, move, delete files and directories
- Restricted to allowed directories
- Max read: 256KB, Max write: 1MB
- Toggle with `DISABLE_FS_TOOL=true`

### Web Search Tool
- **DuckDuckGo**: No API key required, works out of the box
- **Google Custom Search**: Higher quality, requires `GOOGLE_CSE_ID` + `GOOGLE_SEARCH_API_KEY`
- `fetchUrl()`: Fetch and strip HTML from any URL
- Toggle with `DISABLE_WEB_SEARCH=true`

---

## Configuration

Configuration is loaded from multiple sources (in order of precedence):

1. **Environment Variables** (highest priority)
2. **JSON Config File** (`agent-gateway.config.json`)
3. **Defaults** (lowest priority)

### Key Environment Variables

| Variable | Description |
|----------|-------------|
| `HOST` | Server bind address (default: `0.0.0.0`) |
| `PORT` | Server port (default: `3000`) |
| `LOG_LEVEL` | Logging verbosity: `trace` | `debug` | `info` | `warn` | `error` (default: `info`) |
| `SYSTEM_PROMPT` | Default system prompt for all agents |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key |
| `GOOGLE_API_KEY` | Google/Gemini API key |
| `MISTRAL_API_KEY` | Mistral API key |
| `DEEPSEEK_API_KEY` | DeepSeek API key |
| `TELEGRAM_TOKEN` | Telegram Bot API token |
| `DISCORD_TOKEN` | Discord Bot token |
| `SLACK_TOKEN` | Slack Bot token |
| `WHATSAPP_TOKEN` | WhatsApp Meta API token |
| `WHATSAPP_PHONE_ID` | WhatsApp phone number ID |
| `DISABLE_BASH_TOOL` | Set `true` to disable bash tool |
| `DISABLE_FS_TOOL` | Set `true` to disable filesystem tool |
| `DISABLE_WEB_SEARCH` | Set `true` to disable web search tool |
| `AGENT_SESSIONS_DIR` | Directory for session storage |

### Config File Schema

```jsonc
{
  "host": "0.0.0.0",
  "port": 3000,
  "logLevel": "info",
  "channels": {
    "telegram": { "token": "your-token" },
    "discord": { "token": "your-token" }
  },
  "providers": {
    "openai": { "apiKey": "sk-...", "model": "gpt-4o" }
  },
  "systemPrompt": "You are a helpful assistant.",
  "agent": {
    "maxSteps": 10,
    "contextStrategy": "truncate"
  },
  "sessions": {
    "backend": "file",
    "ttl": 3600
  },
  "auth": {
    "enabled": true,
    "apiKey": "your-secret-key"
  },
  "rateLimit": {
    "global": { "points": 100, "duration": 60 },
    "perUser": { "points": 20, "duration": 60 }
  },
  "cache": {
    "enabled": true,
    "ttl": 300,
    "maxSize": 1000
  },
  "tools": {
    "allowedDirs": ["/home/user/workspace"]
  },
  "webhooks": {
    "secret": "your-webhook-secret"
  }
}
```

---

## CLI Commands

```bash
agent-gateway <command> [options]

Commands:
  init          Initialize a new project (creates config.json + .env.example)
  server        Start the gateway server (default command)
  config        Get/set/list configuration values
  channels      List/add/remove messaging channels
  providers     List/add/remove AI providers
  plugins       List/install/uninstall plugins
  version       Show version information
  help          Show this help message
```

### Examples

```bash
# Initialize a new project
agent-gateway init

# Start the server
agent-gateway server

# List active channels
agent-gateway channels list

# Add a new channel
agent-gateway channels add telegram --token "your-bot-token"

# List config
agent-gateway config list

# Check version
agent-gateway version
```

---

## REST API

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check (returns `{ status: "ok" }`) |
| `/healthz` | GET | Kubernetes-style health check |
| `/ready` | GET | Readiness probe |
| `/metrics` | GET | Prometheus metrics |
| `/api/status` | GET | Gateway status (channels, providers, sessions) |
| `/api/sessions` | GET | List all active sessions |
| `/api/send` | POST | Send a message to a channel programmatically |
| `/api/stream` | POST | Send a message with SSE streaming response |
| `/api/traces` | GET | Recent distributed traces |

### Sending a Message via API

```bash
curl -X POST http://localhost:3000/api/send \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "telegram",
    "chatId": "123456789",
    "message": "Hello, what is the weather?"
  }'
```

---

## WebSocket API

Connect to `ws://localhost:3000/ws` for real-time bidirectional communication.

### Message Format

```jsonc
{
  "type": "message",     // "message" | "ping" | "pong"
  "channel": "telegram", // Target channel
  "chatId": "123456",    // Chat identifier
  "content": "Hello!"    // Message content
}
```

### Events

- **`message`**: Send a message through a channel
- **`ping`/`pong`**: Keep-alive heartbeat
- **`response`**: Incoming responses from the agent
- **`error`**: Error notifications

---

## Plugin System

Agent Gateway supports runtime plugins that can extend virtually every aspect of the system.

### Plugin Types

| Type | Purpose |
|------|---------|
| **Channel** | Add support for new messaging platforms |
| **Provider** | Add support for new AI model providers |
| **Tool** | Add new tools agents can call |
| **Hook** | Inject custom logic at any lifecycle phase |

### Plugin Manifest

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "My custom plugin",
  "channels": [...],
  "providers": [...],
  "tools": [...],
  "hooks": [...]
}
```

### Installing Plugins

```bash
agent-gateway plugins install agent-gateway-plugin-myplugin
agent-gateway plugins list
agent-gateway plugins uninstall agent-gateway-plugin-myplugin
```

---

## Session Management

Sessions persist conversation history per user/channel so agents maintain context across messages.

### Backends

| Backend | Description | Best For |
|---------|-------------|----------|
| **File** | Atomic JSON files (tmp + rename) | Single-instance, development |
| **Database** | libsql/SQLite with indexes | Single-instance, structured data |
| **Redis** | Sorted sets with TTL | Distributed, high-throughput |
| **In-Memory** | Volatile Map (no persistence) | Testing, ephemeral |

### Configuration

```json
{
  "sessions": {
    "backend": "database",
    "ttl": 3600,
    "maxMessages": 50,
    "cleanupInterval": 300
  }
}
```

---

## Observability

### Prometheus Metrics

Available at `/metrics`:

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests by path/method |
| `http_request_duration_seconds` | Histogram | Request latency |
| `messages_total` | Counter | Total messages processed by channel |
| `api_calls_total` | Counter | API calls by provider |
| `tokens_used_total` | Counter | Estimated token usage |
| `active_sessions` | Gauge | Currently active sessions |
| `cache_hits_total` | Counter | Cache hit count |
| `cache_misses_total` | Counter | Cache miss count |
| `tool_executions_total` | Counter | Tool calls by name |
| `errors_total` | Counter | Error count by type |
| `uptime_seconds` | Gauge | Server uptime |

### Distributed Tracing

Lightweight in-memory tracing via the `Tracer` class:
- Spans are created for message processing, provider calls, tool executions
- View recent spans at `/api/traces`
- Filter error spans for debugging

---

## Security

- **API Key Authentication**: Optional auth module with API keys
- **Role-Based Access Control**: Admin, user, guest roles
- **Webhook Secret Validation**: HMAC verification for incoming webhooks
- **Rate Limiting**: Global, per-channel, and per-user limits
- **Tool Safety**: Bash commands are validated against blocklist; filesystem restricted to allowed directories
- **Password Hashing**: bcrypt-based password hashing for auth module

---

## Docker Deployment

### Using Docker Compose

```yaml
# docker-compose.yml
services:
  agent-gateway:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./agent-gateway.config.json:/app/agent-gateway.config.json
      - agent-sessions:/app/sessions
    env_file:
      - .env
    restart: unless-stopped

volumes:
  agent-sessions:
```

### Building the Image

```bash
docker build -t agent-gateway .
docker run -p 3000:3000 \
  -v $(pwd)/agent-gateway.config.json:/app/agent-gateway.config.json \
  -e OPENAI_API_KEY=sk-... \
  agent-gateway
```

---

## Project Structure

```
agent-gateway/
├── src/
│   ├── index.ts              # Main barrel export
│   ├── cli/                  # CLI entry point
│   ├── commands/             # CLI command implementations
│   ├── gateway/              # Core Gateway orchestrator
│   ├── server/               # Express HTTP + WebSocket server
│   ├── agents/               # BaseAgent with tool-calling loop
│   ├── channels/             # 6 messaging platform adapters
│   ├── providers/            # 6 AI provider adapters
│   ├── tools/                # Built-in agent tools
│   ├── sessions/             # Session persistence
│   ├── auto-reply/           # Automatic message reply handler
│   ├── plugin-sdk/           # Plugin type definitions
│   ├── plugins/              # Plugin loader
│   ├── hooks/                # Lifecycle hook system
│   ├── auth/                 # Authentication module
│   ├── ratelimit/            # Rate limiting
│   ├── webhooks/             # Webhook server
│   ├── streaming/            # SSE streaming support
│   ├── observability/        # Prometheus metrics + tracing
│   ├── config/               # Configuration management
│   ├── infra/                # Logger + error classes
│   ├── cache/                # Caching layer
│   ├── context/              # Token counting + context management
│   ├── failover/             # Failover + load balancing
│   ├── eventbus/             # Event pub/sub system
│   ├── resilience/           # Circuit breaker pattern
│   └── utils/                # Utility functions
├── test/                     # Test suite (Vitest)
├── docs/                     # Documentation
├── public/                   # Static web UI
├── dist/                     # Build output (ESM + CJS)
├── package.json
├── tsconfig.json
├── Dockerfile
└── docker-compose.yml
```

---

## Development

### Scripts

```bash
npm run dev       # Start dev server with tsx
npm run build     # Build ESM + CJS bundles
npm run test      # Run test suite
npm run test:coverage  # Run with coverage report
npm run lint      # Lint source files
npm start         # Start the CLI
```

### Adding a New Channel

1. Create `src/channels/mychannel/index.ts`
2. Implement the `Channel` interface from `plugin-sdk`
3. Register in `src/channels/index.ts` via `registerBuiltinChannels()`
4. Add factory case in `src/channels/factory.ts`

### Adding a New Provider

1. Create `src/providers/myprovider/index.ts`
2. Implement the `Provider` interface from `plugin-sdk`
3. Register in `src/providers/index.ts` via `registerBuiltinProviders()`
4. Add factory case in `src/providers/factory.ts`

### Adding a New Tool

1. Add the tool definition in `src/tools/registry.ts`
2. Implement the execution handler in `execute()` switch
3. Optionally create a dedicated file for complex tools

---

## License

See the project's LICENSE file for details.
