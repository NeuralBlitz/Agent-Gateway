# Sessions (`src/sessions/`)

> **Session persistence — in-memory, file-based, database, and Redis backends for conversation history.**

---

## Overview

The `sessions/` module manages persistent conversation history for Agent Gateway. Sessions ensure that when a user sends multiple messages, the AI remembers the context of the conversation.

The module provides four persistence backends:
- **In-Memory**: Volatile, no persistence (testing/development)
- **File**: Atomic JSON file writes (simple, single-instance)
- **Database**: libsql/SQLite with indexes (structured, queryable)
- **Redis**: Sorted sets with TTL (distributed, high-throughput)

---

## File Structure

```
sessions/
├── index.ts       # Session class + SessionManager + file/in-memory persistence
├── database.ts    # DatabaseSessionPersistence (libsql/SQLite)
└── redis.ts       # RedisSessionPersistence (ioredis)
```

---

## Session Class

### Overview

The `Session` class represents a single conversation between a user and the AI on a specific channel. It extends `EventEmitter` for event-driven updates.

### State

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Composite key: `${channelId}:${userId}` |
| `channelId` | `string` | Channel identifier (e.g., "telegram") |
| `userId` | `string` | User identifier |
| `messages` | `ChatMessage[]` | Conversation history |
| `metadata` | `object` | Session metadata (created, updated, message count) |
| `context` | `object` | Additional context (e.g., user preferences) |

### Methods

#### `addMessage(message: ChatMessage)`
Adds a message to the conversation history and emits a `message:added` event.

#### `getMessages(limit?)`
Returns conversation history, optionally limited to the N most recent messages.

#### `clearMessages()`
Removes all messages but keeps the session alive.

#### `save()`
Persists the session to the configured backend.

#### `destroy()`
Removes the session from memory and the persistence backend.

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `message:added` | `{ message }` | New message added to history |
| `saved` | — | Session persisted to backend |
| `destroyed` | — | Session removed |
| `error` | `{ error }` | Error during save/load |

---

## SessionManager

### Overview

The `SessionManager` handles CRUD operations for sessions and coordinates with the persistence backend.

### Methods

#### `getOrCreateSession(channelId, userId)`
Finds an existing session or creates a new one.

#### `getSession(sessionId)`
Retrieves a session by ID from the in-memory cache.

#### `saveSession(session)`
Persists a session to the backend.

#### `deleteSession(sessionId)`
Removes a session from memory and the backend.

#### `listSessions()`
Returns all active sessions.

#### `cleanup()`
Removes expired sessions based on TTL.

---

## Persistence Backends

### In-Memory (`InMemorySessionPersistence`)

- **Storage**: JavaScript `Map`
- **Persistence**: None — lost on restart
- **Best for**: Testing, development, ephemeral deployments

```typescript
class InMemorySessionPersistence {
  private store = new Map<string, SessionData>();

  async save(session: SessionData): Promise<void> {
    this.store.set(session.id, session);
  }

  async load(id: string): Promise<SessionData | null> {
    return this.store.get(id) || null;
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }

  async list(): Promise<SessionData[]> {
    return Array.from(this.store.values());
  }
}
```

### File (`FileSessionPersistence`)

- **Storage**: JSON files in `AGENT_SESSIONS_DIR`
- **Persistence**: Atomic writes via temp file + rename
- **Best for**: Single-instance deployments, simple setups

```typescript
class FileSessionPersistence {
  private dir: string;

  async save(session: SessionData): Promise<void> {
    const tmpFile = `${this.dir}/${session.id}.tmp`;
    const finalFile = `${this.dir}/${session.id}.json`;
    await fs.writeFile(tmpFile, JSON.stringify(session, null, 2));
    await fs.rename(tmpFile, finalFile); // Atomic
  }

  async load(id: string): Promise<SessionData | null> {
    try {
      const data = await fs.readFile(`${this.dir}/${id}.json`, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}
```

**Atomic Write Process**:
1. Write to `session-id.tmp`
2. Rename `session-id.tmp` → `session-id.json`
3. If the process crashes during step 1, the `.tmp` file is ignored on next load

### Database (`DatabaseSessionPersistence`)

- **Storage**: libsql/SQLite
- **Persistence**: SQL with indexes
- **Best for**: Single-instance with queryable data, Turso cloud sync

#### Schema

```sql
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  messages TEXT NOT NULL,
  metadata TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessions_channel_user ON sessions(channel_id, user_id);
CREATE INDEX idx_sessions_updated_at ON sessions(updated_at);
```

#### Features
- Automatic cleanup of old sessions via `cleanup()` method
- Supports both local SQLite and Turso cloud databases
- Messages stored as JSON in a TEXT column

### Redis (`RedisSessionPersistence`)

- **Storage**: Redis sorted sets + hashes
- **Persistence**: Configurable Redis persistence (RDB/AOF)
- **Best for**: Distributed deployments, high-throughput

#### Data Structure

```
# Session data stored as hash
HSET session:{id} messages '{"..."}' metadata '{"..."}' channel_id "telegram" user_id "123"

# TTL for automatic expiration
EXPIRE session:{id} 3600

# Sorted set for user session lookups
ZADD user:sessions:{userId} {timestamp} {sessionId}
```

#### Features
- **TTL-based expiration**: Sessions automatically expire after configured TTL
- **Pipeline writes**: Batch operations for efficiency
- **Sorted sets**: Efficient user session lookups and listing

#### Configuration

```typescript
new RedisSessionPersistence({
  host: 'localhost',
  port: 6379,
  password: 'optional',
  db: 0,
  keyPrefix: 'agent-gateway:',
  ttl: 3600, // Session TTL in seconds
});
```

---

## Session Configuration

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

| Setting | Default | Description |
|---------|---------|-------------|
| `backend` | `"file"` | Persistence backend: `"memory"`, `"file"`, `"database"`, `"redis"` |
| `ttl` | `3600` | Session time-to-live in seconds |
| `maxMessages` | `50` | Maximum messages per session before trimming |
| `cleanupInterval` | `300` | How often to run cleanup (seconds) |

---

## Context Window Management

When sessions grow large, the agent's context manager trims messages:
1. **Oldest-first**: Remove the oldest messages first
2. **System prompt always preserved**
3. **Most recent messages prioritized** for retention

---

## Session Lifecycle

```
User sends first message
         │
         ▼
  SessionManager.getOrCreateSession()
         │
         ▼
  Backend.load(id) → null (not found)
         │
         ▼
  New Session created (id = "channel:user")
         │
         ▼
  Message added to session.history
         │
         ▼
  Agent processes → Response added
         │
         ▼
  Session.save() → Backend.save(session)
         │
         ▼
  On TTL expiry: Session auto-deleted (Redis)
         │
         ▼
  Periodic cleanup() removes stale sessions
```

---

## Related Documentation

- [`gateway/`](../gateway/README.md) — Gateway creates and manages sessions
- [`context/`](../context/README.md) — Context window management for session messages
- [`server/`](../server/README.md) — REST API for listing sessions
- [`config/`](../config/README.md) — Session configuration options
