# Session Manager

## Overview

The **Session Manager** module (`agent-gateway/src/session-manager/`) provides advanced session lifecycle management with persistence, TTL-based expiration, concurrent session limits, message history capping, and session analytics. It is designed for managing conversational AI sessions that span multiple message exchanges between users and AI agents.

The module supports pluggable session stores via the `SessionStore` interface, with an in-memory implementation (`MemorySessionStore`) provided out of the box. Sessions track messages, context, token counts, and metadata, with automatic cleanup of expired sessions.

### Differences from `src/sessions/`

The agent gateway also contains a **sessions** module at [`/home/runner/workspace/agent-gateway/src/sessions/`](/home/runner/workspace/agent-gateway/src/sessions/). Key differences:

| Aspect | `src/session-manager/` | `src/sessions/` |
|--------|----------------------|-----------------|
| **Session Model** | Rich session with `userId`, `tenantId`, `messageCount`, `tokenCount`, `expiresAt`, `channel`, `provider` | Simpler session with `channel`, `userId`, `provider` |
| **Persistence** | Pluggable `SessionStore` interface (in-memory default) | `SessionPersistence` interface with in-memory and **file-backed** (`FileSessionPersistence`) options |
| **TTL** | Built-in TTL with automatic expiration and periodic cleanup | No built-in TTL; sessions persist until explicitly deleted |
| **Session Limits** | Enforces `maxSessionsPerUser` concurrent sessions | No session limits |
| **Message Roles** | Supports `system`, `user`, `assistant`, **`tool`** roles | Supports `system`, `user`, `assistant` (no `tool` role) |
| **Analytics** | `getStats()` returns total sessions, messages, average messages per session, active sessions | No analytics |
| **Automatic Cleanup** | Periodic timer-based cleanup of expired sessions | No automatic cleanup |
| **Token Tracking** | Tracks `tokenCount` per session and per message | No token tracking |
| **Message Capping** | Configurable `maxMessages` with intelligent system message preservation | Configurable `maxMessages` with simple slice |
| **Events** | Emits `session:created`, `session:updated`, `session:deleted` | Emits `sessionCreated`, `sessionUpdated`, `sessionDeleted`, `messageAdded`, etc. |

Use `session-manager/` for production gateway sessions with TTL, limits, and analytics. Use `sessions/` for simpler use cases or when file-based persistence is needed.

### Key Capabilities

- **Pluggable Stores**: Implement `SessionStore` for Redis, PostgreSQL, or any backend.
- **TTL with Auto-Cleanup**: Sessions expire after inactivity; periodic cleanup removes stale sessions.
- **Concurrent Session Limits**: Enforce maximum sessions per user.
- **Message History Capping**: Automatically cap message history while preserving system messages.
- **Token Counting**: Track token usage per session for billing and quota management.
- **Context Storage**: Key-value context attached to sessions for conversational state.
- **Session Analytics**: Built-in statistics for total sessions, messages, and activity.

---

## File Structure

```
agent-gateway/src/session-manager/
  index.ts              # Main implementation (SessionManager, MemorySessionStore, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `events` (`EventEmitter`) for session lifecycle events.
- `crypto` (`randomUUID`) for session ID generation.
- `../infra/index.js` (the shared `logger` singleton) for debug logging.

---

## Full API Documentation

### Interfaces

#### `Session`

```ts
interface Session {
  id: string;
  userId: string;
  tenantId?: string;
  channel: string;
  provider: string;
  metadata: Record<string, any>;
  messages: SessionMessage[];
  context: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  lastActivityAt: number;
  expiresAt?: number;
  messageCount: number;
  tokenCount: number;
}
```

#### `SessionMessage`

```ts
interface SessionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  tokenCount?: number;
  toolCalls?: any[];
}
```

#### `SessionConfig`

| Property            | Type   | Default      | Description                            |
|---------------------|--------|--------------|----------------------------------------|
| `maxMessages`       | number | `100`        | Maximum messages per session           |
| `sessionTtlMs`      | number | `86400000`   | Session TTL in milliseconds (24 hours) |
| `maxSessionsPerUser`| number | `10`         | Maximum concurrent sessions per user   |
| `cleanupIntervalMs` | number | `300000`     | Cleanup interval in milliseconds (5 min)|

#### `SessionStore`

```ts
interface SessionStore {
  save(session: Session): Promise<void>;
  load(id: string): Promise<Session | null>;
  delete(id: string): Promise<void>;
  list(filter?: { userId?: string; tenantId?: string; channel?: string }): Promise<Session[]>;
  count(filter?: { userId?: string; tenantId?: string }): Promise<number>;
}
```

---

### Class: `MemorySessionStore`

Default in-memory implementation of `SessionStore`. Supports filtering by `userId`, `tenantId`, and `channel`.

---

### Class: `SessionManager`

Extends `EventEmitter`.

#### Constructor

```ts
constructor(store: SessionStore, config?: SessionConfig)
```

#### Methods

##### `async create(data: { userId, tenantId?, channel, provider, metadata? }): Promise<Session>`

Creates a new session. Enforces `maxSessionsPerUser` limit. Auto-generates session ID (`sess-${uuid}`) and sets `expiresAt` based on TTL.

Emits `session:created`.

##### `async get(id: string): Promise<Session | null>`

Loads a session. Returns `null` if the session is expired (auto-deletes expired sessions on access).

##### `async addMessage(sessionId: string, message: Omit<SessionMessage, 'timestamp'>): Promise<Session>`

Adds a message to the session. Enforces `maxMessages` cap (preserves system messages, keeps most recent non-system messages). Updates `messageCount`, `tokenCount`, `lastActivityAt`, and extends `expiresAt`.

Emits `session:updated`.

##### `async getMessages(sessionId: string): Promise<SessionMessage[]>`

Returns all messages for a session. Returns empty array if session not found.

##### `async delete(id: string): Promise<boolean>`

Deletes a session. Returns `false` if session not found.

Emits `session:deleted`.

##### `async list(filter?: { userId?, tenantId?, channel? }): Promise<Session[]>`

Lists sessions matching the optional filter.

##### `async updateMetadata(sessionId: string, metadata: Record<string, any>): Promise<Session>`

Merges metadata into the session's existing metadata.

##### `async setContext(sessionId: string, key: string, value: any): Promise<Session>`

Sets a key-value pair in the session's context.

##### `async clearMessages(sessionId: string): Promise<Session>`

Clears all non-system messages from the session.

##### `async getStats(): Promise<{ totalSessions, totalMessages, avgMessagesPerSession, activeSessions }>`

Computes session analytics.

##### `close(): void`

Stops the cleanup timer.

---

### Factory Function

```ts
function createSessionManager(store?: SessionStore, config?: SessionConfig): SessionManager
```

Creates a `SessionManager` with the provided store (defaults to `MemorySessionStore`) and config.

---

## Configuration Options

```ts
const manager = createSessionManager(customStore, {
  maxMessages: 200,
  sessionTtlMs: 2 * 60 * 60 * 1000,     // 2 hours
  maxSessionsPerUser: 5,
  cleanupIntervalMs: 60_000,             // Every minute
});
```

---

## Usage Examples

### Basic Session Lifecycle

```ts
import { createSessionManager } from './index.js';

const manager = createSessionManager();

// Create
const session = await manager.create({
  userId: 'user-123',
  channel: 'web',
  provider: 'openai',
  metadata: { locale: 'en-US' },
});

// Add messages
await manager.addMessage(session.id, {
  role: 'user',
  content: 'Hello, how are you?',
  tokenCount: 8,
});

await manager.addMessage(session.id, {
  role: 'assistant',
  content: 'I am doing well, thank you!',
  tokenCount: 10,
});

// Get messages
const messages = await manager.getMessages(session.id);
console.log(messages);

// Delete
await manager.delete(session.id);
```

### Session with Context

```ts
await manager.setContext(session.id, 'lastIntent', 'greeting');
await manager.setContext(session.id, 'conversationState', 'active');
```

### Analytics

```ts
const stats = await manager.getStats();
console.log(`Active sessions: ${stats.activeSessions}`);
console.log(`Total messages: ${stats.totalMessages}`);
console.log(`Avg messages/session: ${stats.avgMessagesPerSession.toFixed(1)}`);
```

### Custom Store (Redis Example)

```ts
class RedisSessionStore implements SessionStore {
  constructor(private redis: RedisClient) {}

  async save(session: Session): Promise<void> {
    await this.redis.set(`session:${session.id}`, JSON.stringify(session));
  }

  async load(id: string): Promise<Session | null> {
    const data = await this.redis.get(`session:${id}`);
    return data ? JSON.parse(data) : null;
  }

  async delete(id: string): Promise<void> {
    await this.redis.del(`session:${id}`);
  }

  async list(filter?: { userId?: string; tenantId?: string; channel?: string }): Promise<Session[]> {
    // Scan all session keys and filter
    const keys = await this.redis.keys('session:*');
    const sessions = await Promise.all(keys.map((k) => this.redis.get(k).then(JSON.parse)));
    // Apply filters...
    return sessions;
  }

  async count(filter?: { userId?: string; tenantId?: string }): Promise<number> {
    const sessions = await this.list(filter);
    return sessions.length;
  }
}

const manager = createSessionManager(new RedisSessionStore(redisClient));
```

### Event Listening

```ts
manager.on('session:created', (session) => {
  console.log(`New session: ${session.id} for user ${session.userId}`);
});

manager.on('session:deleted', (session) => {
  console.log(`Session ended: ${session.id}`);
});
```

### Graceful Shutdown

```ts
process.on('SIGTERM', () => {
  manager.close();
  process.exit(0);
});
```

---

## Integration Points

- **Event Bus** (`/home/runner/workspace/agent-gateway/src/eventbus/`): Session lifecycle events (`session:created`, `session:updated`, `session:deleted`) can be published to the global event bus for observability.
- **Request Tracker** (`/home/runner/workspace/agent-gateway/src/request-tracker/`): Session IDs can be tagged on trace spans for correlating traces with sessions.
- **Message Bus** (`/home/runner/workspace/agent-gateway/src/message-bus/README.md`): Session events can be published as messages on the message bus for inter-module communication.
- **Event Store** (`/home/runner/workspace/agent-gateway/src/event-store/README.md`): Session message history can be persisted as domain events for event sourcing.
- **Infra Logger** (`/home/runner/workspace/agent-gateway/src/infra/`): Session creation and cleanup are logged via the shared logger.

---

## Error Handling

- **Session Not Found**: `get()`, `addMessage()`, `updateMetadata()`, `setContext()`, and `clearMessages()` all throw `Error("Session not found: ${sessionId}")` if the session does not exist.
- **Session Limit Exceeded**: `create()` throws `Error("Max sessions per user (${max}) exceeded")` if the user has reached their session limit.
- **Expired Sessions**: `get()` returns `null` for expired sessions (and auto-deletes them). No error is thrown.
- **Store Failures**: If the underlying `SessionStore` implementation throws (e.g., database connection failure), the error propagates to the caller.

---

## Message History Capping

When `maxMessages` is exceeded, the session manager:
1. Preserves all `system` role messages.
2. Keeps the most recent `maxMessages - systemMessageCount` non-system messages.
3. Discards older non-system messages.

This ensures that system prompts (which define agent behavior) are never lost, while conversation history is capped to control token costs.

---

## Related Documentation

- [Sessions Module](/home/runner/workspace/agent-gateway/src/sessions/) -- Simpler session management with file-backed persistence.
- [Event Bus](/home/runner/workspace/agent-gateway/src/eventbus/) -- Gateway-wide event publishing for session lifecycle events.
- [Message Bus](/home/runner/workspace/agent-gateway/src/message-bus/README.md) -- Internal pub/sub for inter-module session events.
- [Event Store](/home/runner/workspace/agent-gateway/src/event-store/README.md) -- Event sourcing for session message history.
- [Request Tracker](/home/runner/workspace/agent-gateway/src/request-tracker/README.md) -- Trace correlation with session IDs.
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
