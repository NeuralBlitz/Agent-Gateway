# Gateway (`src/gateway/`)

> **The central orchestrator — manages sessions, channels, providers, and message routing.**

---

## Overview

The `Gateway` class is the beating heart of Agent Gateway. It is the central orchestrator that ties together all subsystems: messaging channels, AI providers, agents, and session management. Every message that flows through the system passes through the Gateway.

The Gateway extends Node.js `EventEmitter`, making it a hub for event-driven communication. It emits events for every significant action, enabling plugins and custom code to react to system activity.

---

## File Structure

```
gateway/
└── index.ts    # Gateway class implementation
```

---

## The `Gateway` Class

### Inheritance

```typescript
class Gateway extends EventEmitter
```

The Gateway extends `EventEmitter` to provide built-in pub/sub capabilities for system events.

### Core State

| Property | Type | Description |
|----------|------|-------------|
| `sessions` | `Map<string, Session>` | Active conversation sessions |
| `channels` | `Map<string, Channel>` | Registered messaging channel adapters |
| `providers` | `Map<string, Provider>` | Registered AI provider adapters |
| `agents` | `Map<string, BaseAgent>` | Registered agent instances |
| `config` | `GatewayConfig` | Current configuration |
| `running` | `boolean` | Whether the gateway is currently active |

### Constructor

```typescript
constructor(config: GatewayConfig)
```

Accepts a validated `GatewayConfig` object. The gateway does not start automatically — call `start()` to begin.

---

## Public API

### Lifecycle

#### `start()`
```typescript
async start(): Promise<void>
```

Initializes the gateway for operation. This method:
- Validates that at least one channel and one provider are registered
- Initializes session management
- Emits `gateway:start` event
- Sets `running = true`

#### `stop()`
```typescript
async stop(): Promise<void>
```

Gracefully shuts down the gateway:
- Stops all channels (unregisters webhooks, stops polling)
- Flushes pending session data
- Emits `gateway:stop` event
- Sets `running = false`

### Registration

#### `registerChannel(id: string, channel: Channel)`
```typescript
registerChannel(id: string, channel: Channel): void
```

Registers a messaging channel adapter by ID (e.g., `"telegram"`, `"discord"`). Channels must implement the `Channel` interface from the plugin SDK.

#### `registerProvider(id: string, provider: Provider)`
```typescript
registerProvider(id: string, provider: Provider): void
```

Registers an AI provider adapter by ID (e.g., `"openai"`, `"anthropic"`). Providers must implement the `Provider` interface.

#### `registerAgent(id: string, agent: BaseAgent)`
```typescript
registerAgent(id: string, agent: BaseAgent): void
```

Registers an agent instance. Agents are the entities that process messages and execute tools.

### Session Management

#### `createSession(channelId: string, userId: string, options?)`
```typescript
createSession(channelId: string, userId: string, options?: SessionOptions): Session
```

Creates a new conversation session for a specific channel/user combination. Sessions carry conversation history and metadata.

#### `findOrCreateSession(channelId: string, userId: string)`
```typescript
findOrCreateSession(channelId: string, userId: string): Session
```

Looks up an existing session or creates a new one. This is the primary method used by the auto-reply handler.

#### `getSession(sessionId: string)`
```typescript
getSession(sessionId: string): Session | undefined
```

Retrieves a session by its ID.

#### `deleteSession(sessionId: string)`
```typescript
deleteSession(sessionId: string): boolean
```

Deletes a session. Returns `true` if the session existed and was deleted.

### Message Handling

#### `handleMessage(channelId: string, userId: string, message: string, options?)`
```typescript
async handleMessage(
  channelId: string,
  userId: string,
  message: string,
  options?: MessageOptions
): Promise<string>
```

The primary message processing method:
1. Finds or creates a session for the channel/user
2. Adds the message to session history
3. Routes to the appropriate agent
4. Returns the agent's response

Emits events: `message:received`, `message:processed`, `message:error`.

### Status

#### `getStatus()`
```typescript
getStatus(): {
  running: boolean;
  channels: string[];
  providers: string[];
  agents: string[];
  sessionCount: number;
}
```

Returns a status object summarizing the gateway's current state.

---

## Events

The Gateway emits the following events:

| Event | Payload | Description |
|-------|---------|-------------|
| `gateway:start` | — | Gateway started |
| `gateway:stop` | — | Gateway stopped |
| `message:received` | `{ channelId, userId, message }` | New message received |
| `message:processed` | `{ channelId, userId, response }` | Message processed successfully |
| `message:error` | `{ channelId, userId, error }` | Error during message processing |
| `session:created` | `{ sessionId, channelId, userId }` | New session created |
| `session:deleted` | `{ sessionId }` | Session deleted |
| `channel:registered` | `{ id, channel }` | Channel registered |
| `provider:registered` | `{ id, provider }` | Provider registered |
| `agent:registered` | `{ id, agent }` | Agent registered |

---

## Message Flow

```
User Message
     │
     ▼
┌─────────────┐
│   Channel   │  (Telegram, Discord, etc.)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Gateway   │  handleMessage()
│             │  ┌─────────────────────┐
│             │  │  findOrCreateSession│
│             │  └────────┬────────────┘
│             │           │
│             │           ▼
│             │  ┌─────────────────────┐
│             │  │     Session         │
│             │  │  (add to history)   │
│             │  └────────┬────────────┘
│             │           │
│             │           ▼
│             │  ┌─────────────────────┐
│             │  │     Agent           │
│             │  │  (tool-calling loop)│
│             │  └────────┬────────────┘
│             │           │
│             │           ▼
│             │  ┌─────────────────────┐
│             │  │    Provider         │
│             │  │  (OpenAI, etc.)     │
│             │  └─────────────────────┘
│             │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Channel   │  (send response back)
└─────────────┘
```

---

## Session Key Format

Sessions are keyed by a composite key: `${channelId}:${userId}`. This ensures that:
- Each user has an independent session per channel
- Conversations don't bleed between Telegram and Discord
- Group chats and DMs are tracked separately

---

## Error Handling

The Gateway wraps all message processing in try-catch blocks. Errors during message handling:
1. Emit a `message:error` event
2. Log the error via the infrastructure logger
3. Do NOT crash the gateway — it continues processing subsequent messages

For unrecoverable errors (configuration errors during `start()`), the gateway throws synchronously.

---

## Thread Safety

The Gateway uses JavaScript's single-threaded event loop for consistency. Session operations on the same key are serialized by the event loop. For distributed deployments, use the Redis session backend.

---

## Usage Example

```typescript
import { Gateway, Config } from 'agent-gateway';

const config = getConfig();
const gateway = new Gateway(config);

// Register a channel
const telegram = createChannel('telegram', { token: '...' });
gateway.registerChannel('telegram', telegram);

// Register a provider
const openai = createProvider('openai', { apiKey: '...' });
gateway.registerProvider('openai', openai);

// Start and process messages
await gateway.start();
const response = await gateway.handleMessage('telegram', 'user123', 'Hello!');
console.log(response);

// Shutdown
await gateway.stop();
```

---

## Related Documentation

- [`server/`](../server/README.md) — How the server creates and uses the Gateway
- [`channels/`](../channels/README.md) — Channel adapters registered with the Gateway
- [`providers/`](../providers/README.md) — Providers registered with the Gateway
- [`agents/`](../agents/README.md) — Agents that process messages
- [`sessions/`](../sessions/README.md) — Session management
- [`hooks/`](../hooks/README.md) — Lifecycle hooks fired by the Gateway
- [`eventbus/`](../eventbus/README.md) — Event system for Gateway events
