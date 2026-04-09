# Architecture Overview

Agent Gateway is built with a modular, layered architecture that separates concerns and provides maximum flexibility.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Applications                         │
│  (Telegram, Discord, Slack, WhatsApp, Custom HTTP Clients)     │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Gateway Server                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    Request Handler                        │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌────────────┐  │  │
│  │  │ Router  │  │ Auth    │  │ Rate    │  │ Webhook    │  │  │
│  │  │         │  │ Check   │  │ Limiter │  │ Handler    │  │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐
│   Channels        │  │   Providers      │  │   Sessions        │
│                   │  │                   │  │                   │
│ ┌───────────────┐ │  │ ┌───────────────┐ │  │ ┌───────────────┐ │
│ │   Telegram    │ │  │ │   OpenAI      │ │  │ │  In-Memory    │ │
│ │   Discord     │ │  │ │   Anthropic   │ │  │ │  Persistence  │ │
│ │   Slack       │ │  │ │   Google      │ │  │ └───────────────┘ │
│ │   WhatsApp    │ │  │ │   Mistral     │ │  └───────────────────┘
│ │   Signal      │ │  │ │   DeepSeek    │ │
│ │   Matrix      │ │  │ │   Ollama      │ │
│ └───────────────┘ │  │ └───────────────┘ │
└───────────────────┘  └───────────────────┘
```

## Core Components

### 1. Gateway Layer

The gateway is the central orchestrator that coordinates all components:

- **Message Routing**: Routes messages between channels and providers
- **Session Management**: Maintains conversation state
- **Authentication**: Validates requests and manages sessions
- **Rate Limiting**: Enforces usage limits
- **Hooks Execution**: Runs lifecycle hooks

#### Key Classes

| Class | Description |
|-------|-------------|
| `Gateway` | Main gateway server |
| `SessionManager` | Manages user sessions |
| `RateLimiter` | Enforces rate limits |
| `Hooks` | Manages lifecycle hooks |

### 2. Channel Layer

Channels are adapters for different messaging platforms. Each channel:

- Connects to its platform (Telegram, Discord, etc.)
- Converts platform-specific messages to standard format
- Handles platform-specific features (buttons, embeds, etc.)

#### Channel Interface

```typescript
interface Channel {
  id: string;
  type: string;
  name: string;
  connected: boolean;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(userId: string, content: string): Promise<void>;
  getUser(userId: string): Promise<ChannelUser | null>;
  getMe(): Promise<ChannelBot | null>;
}
```

### 3. Provider Layer

Providers are adapters for different AI services. Each provider:

- Connects to its API (OpenAI, Anthropic, etc.)
- Normalizes API responses
- Handles authentication and retries

#### Provider Interface

```typescript
interface Provider {
  id: string;
  type: string;
  name: string;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  chat(messages: ChatMessage[]): Promise<ModelResponse>;
  chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse>;
}
```

### 4. Session Layer

Sessions maintain conversation state for each user:

- Message history
- Context variables
- Metadata
- Persistence options

### 5. Hooks Layer

Hooks provide extensibility at key lifecycle points:

- `beforeMessage` - Before processing a message
- `afterMessage` - After processing a message
- `beforeResponse` - Before generating a response
- `afterResponse` - After generating a response
- `beforeTool` - Before executing a tool
- `afterTool` - After executing a tool
- `onError` - On any error
- `onSessionStart` - When a session starts
- `onSessionEnd` - When a session ends

## Data Flow

### Incoming Message Flow

```
1. Channel receives message
   │
   ▼
2. Gateway validates (auth, rate limit)
   │
   ▼
3. Execute 'beforeMessage' hooks
   │
   ▼
4. Get or create session
   │
   ▼
5. Add message to session
   │
   ▼
6. Call AI provider with messages
   │
   ▼
7. Execute 'afterResponse' hooks
   │
   ▼
8. Send response via channel
   │
   ▼
9. Update session with response
   │
   ▼
10. Execute 'afterMessage' hooks
```

### Request/Response Cycle

```
User → Channel → Gateway → Hooks → Session → Provider
                                    ↑         │
                                    └─────────┘
                          Response ←──┘
```

## Design Principles

### 1. Separation of Concerns

Each layer has a single responsibility:
- Channels handle platform-specific logic
- Providers handle AI API calls
- Gateway coordinates everything
- Hooks provide extensibility

### 2. Dependency Injection

Components are loosely coupled:
- Gateway doesn't know about specific channels
- Channels don't know about specific providers
- Everything communicates through interfaces

### 3. Extensibility

The system is designed to be extended:

- **Add new channels** by implementing `Channel` interface
- **Add new providers** by implementing `Provider` interface
- **Add new hooks** by registering with `Hooks` system
- **Add new features** by extending existing classes

### 4. Error Handling

Robust error handling at every layer:

- Channel errors don't crash the gateway
- Provider errors trigger retry logic
- Hook errors don't stop message processing

## Security

### Authentication

- API key validation
- JWT token support
- Session-based authentication

### Rate Limiting

- Global limits
- Per-channel limits
- Per-user limits

### Input Validation

- Zod-based configuration schema
- Message content validation
- Parameter sanitization

## Performance

### Optimization Strategies

- **Lazy Loading**: Channels/providers loaded on demand
- **Connection Pooling**: Reuse connections where possible
- **Caching**: Cache user data and API responses
- **Async Processing**: Non-blocking message handling

### Scalability

The architecture supports horizontal scaling:

- Stateless gateway instances
- Shared session storage
- Distributed rate limiting

## Extension Points

### Custom Channels

Implement the `Channel` interface to add a new messaging platform:

```typescript
class CustomChannel implements Channel {
  // Implement all required methods
}
```

### Custom Providers

Implement the `Provider` interface to add a new AI provider:

```typescript
class CustomProvider implements Provider {
  // Implement all required methods
}
```

### Custom Hooks

Register hooks to modify behavior:

```typescript
hooks.register({
  name: 'my-hook',
  phase: 'beforeMessage',
  handler: async (context) => {
    // Custom logic
  }
});
```

### Custom Persistence

Implement `SessionPersistence` for custom storage:

```typescript
class MyPersistence implements SessionPersistence {
  async save(session: SessionData): Promise<void> { /* ... */ }
  async load(id: string): Promise<SessionData | null> { /* ... */ }
  async delete(id: string): Promise<void> { /* ... */ }
  async list(channel: string, userId: string): Promise<SessionData[]> { /* ... */ }
}
```

## File Structure

```
src/
├── cli/           # Command-line interface
├── gateway/       # Gateway server implementation
├── channels/      # Channel implementations
│   ├── telegram/
│   ├── discord/
│   └── ...
├── providers/     # Provider implementations
│   ├── openai/
│   ├── anthropic/
│   └── ...
├── sessions/     # Session management
├── hooks/         # Hook system
├── ratelimit/    # Rate limiting
├── webhooks/     # Webhook server
├── auto-reply/   # Auto-reply feature
├── auth/         # Authentication
├── config/       # Configuration
└── infra/        # Infrastructure (logging, errors)
```