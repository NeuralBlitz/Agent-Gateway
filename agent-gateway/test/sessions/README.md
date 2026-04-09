# Session Tests

> **Test suite for session management in Agent Gateway**

This directory contains tests for the session management subsystem, which maintains conversation state across messages. Tests cover session creation, persistence backends (File, Database, Redis, In-Memory), TTL expiration, message history management, and session lifecycle.

---

## Table of Contents

- [Overview](#overview)
- [Test Scope](#test-scope)
- [Session Architecture](#session-architecture)
- [Test Files](#test-files)
- [Test Scenarios](#test-scenarios)
- [Persistence Backend Tests](#persistence-backend-tests)
- [Mocking Strategy](#mocking-strategy)
- [Running Session Tests](#running-session-tests)
- [Session Key Resolution](#session-key-resolution)
- [Writing New Session Tests](#writing-new-session-tests)
- [Integration Points](#integration-points)

---

## Overview

Location: `/home/runner/workspace/agent-gateway/test/sessions/`

Sessions maintain conversation state per user per channel, enabling the AI agent to have context-aware conversations. Each session stores:

- Message history (up to a configurable maximum)
- Session metadata (channel, userId, provider, timestamps)
- Context window state (for token-based truncation)

Sessions persist across messages so the agent remembers previous interactions within the same conversation.

---

## Test Scope

| Component | Source Location | Test Coverage |
|-----------|----------------|---------------|
| `Session` class | `src/sessions/index.ts` | Session data model |
| `SessionManager` | `src/sessions/index.ts` | Session lifecycle management |
| `InMemorySessionPersistence` | `src/sessions/index.ts` | Volatile storage |
| `FileSessionPersistence` | `src/sessions/index.ts` | File-based JSON storage |
| `DatabaseSessionPersistence` | `src/sessions/database.ts` | libsql/SQLite storage |
| `RedisSessionPersistence` | `src/sessions/redis.ts` | Redis sorted set storage |
| Session persistence interface | `src/sessions/index.ts` | Contract definition |
| Session key resolution | `src/config/sessions/` | Key derivation |

---

## Session Architecture

### Session Data Model

```typescript
interface Session {
  id: string;
  channel: string;
  userId: string;
  provider: string;
  messages: SessionMessage[];
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, any>;
}

interface SessionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  timestamp: number;
}
```

### Session Manager

```typescript
class SessionManager {
  private persistence: SessionPersistence;
  private options: SessionOptions;

  async createSession(channel: string, userId: string, provider: string): Promise<Session>;
  async getSession(id: string): Promise<Session | undefined>;
  async saveSession(session: Session): Promise<void>;
  async deleteSession(id: string): Promise<void>;
  async listSessions(filter?: { channel?: string; userId?: string }): Promise<Session[]>;
  async cleanupExpired(): Promise<number>;
}
```

### Persistence Backends

```
SessionPersistence (interface)
  ├── InMemorySessionPersistence  -- JavaScript Map (volatile)
  ├── FileSessionPersistence      -- Atomic JSON files (tmp + rename)
  ├── DatabaseSessionPersistence  -- libsql/SQLite with indexes
  └── RedisSessionPersistence     -- Sorted sets with TTL
```

### Session Key Resolution

Sessions are keyed by `(channel, userId)`:

```
"telegram:user:123456789"  ──► Session for Telegram user 123456789
"discord:user:987654321"   ──► Session for Discord user 987654321
"slack:user:U123ABC"       ──► Session for Slack user U123ABC
```

---

## Test Files

| File | Coverage |
|------|----------|
| `/home/runner/workspace/agent-gateway/test/sessions/*.test.ts` | Session tests (this directory) |
| `/home/runner/workspace/agent-gateway/test/gateway.test.ts` | Session creation via gateway |

---

## Test Scenarios

### Session Lifecycle

- Create session with channel, userId, provider
- Get existing session by ID
- Delete session
- Update session (append messages)
- List sessions with filters

### Persistence Tests

#### In-Memory

- Session survives in memory during process
- Session lost on process restart (by design)
- Fast read/write (no I/O)

#### File-Based

- Session persisted to JSON file
- Atomic writes (tmp file + rename)
- Session survives process restart
- Read/write latency acceptable
- File permissions are secure

#### Database

- Session stored in SQLite/libsql
- Indexed lookups by channel+userId
- Session survives process restart
- Concurrent access handled

#### Redis

- Session stored in Redis sorted set
- TTL-based expiration
- Session survives process restart
- Distributed access across instances

### TTL and Expiration

- Expired sessions are cleaned up
- TTL is configurable
- Cleanup runs on schedule
- Expired sessions return undefined

### Message History

- Messages appended to history
- History truncated at maxMessages
- Recent messages preserved over old ones
- System message always included

---

## Persistence Backend Tests

### File Backend

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { FileSessionPersistence } from '/home/runner/workspace/agent-gateway/src/sessions/index.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

describe('FileSessionPersistence', () => {
  let tempDir: string;
  let persistence: FileSessionPersistence;

  beforeEach(async () => {
    tempDir = fs.mkdtempSync('/tmp/sessions-test-');
    persistence = new FileSessionPersistence({ directory: tempDir });
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true });
  });

  it('should save and load a session', async () => {
    const session = createTestSession('sess-1', 'telegram', 'user1');
    await persistence.save(session);

    const loaded = await persistence.load('sess-1');
    expect(loaded).toBeDefined();
    expect(loaded?.id).toBe('sess-1');
  });

  it('should survive process restart', async () => {
    const session = createTestSession('sess-1', 'telegram', 'user1');
    await persistence.save(session);

    // New instance simulates restart
    const persistence2 = new FileSessionPersistence({ directory: tempDir });
    const loaded = await persistence2.load('sess-1');
    expect(loaded?.id).toBe('sess-1');
  });

  it('should use atomic writes', async () => {
    // Verify tmp file + rename pattern
    const session = createTestSession('sess-1', 'telegram', 'user1');
    await persistence.save(session);

    const files = fs.readdirSync(tempDir);
    expect(files).not.toContain(expect.stringMatching(/\.tmp$/));
    expect(files).toContain('sess-1.json');
  });
});
```

### Redis Backend

```typescript
describe('RedisSessionPersistence', () => {
  let persistence: RedisSessionPersistence;

  beforeEach(async () => {
    persistence = createRedisSessionPersistence({
      url: 'redis://localhost:6379',
      ttl: 3600,
    });
  });

  afterEach(async () => {
    await persistence.clear?.();
  });

  it('should save and load a session', async () => {
    const session = createTestSession('sess-1', 'telegram', 'user1');
    await persistence.save(session);

    const loaded = await persistence.load('sess-1');
    expect(loaded?.id).toBe('sess-1');
  });
});
```

---

## Mocking Strategy

### Mock File System

```typescript
import { vi } from 'vitest';

const mockFs = {
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue(JSON.stringify(testSession)),
  rename: vi.fn().mockResolvedValue(undefined),
  unlink: vi.fn().mockResolvedValue(undefined),
  readdir: vi.fn().mockResolvedValue(['sess-1.json']),
  stat: vi.fn().mockResolvedValue({ isFile: () => true }),
};

vi.mock('node:fs/promises', () => ({ default: mockFs }));
```

### Mock Redis

```typescript
const mockRedis = {
  set: vi.fn().mockResolvedValue('OK'),
  get: vi.fn().mockResolvedValue(JSON.stringify(testSession)),
  del: vi.fn().mockResolvedValue(1),
  zadd: vi.fn().mockResolvedValue(1),
  zrangebyscore: vi.fn().mockResolvedValue([JSON.stringify(testSession)]),
  expire: vi.fn().mockResolvedValue(1),
};

vi.mock('ioredis', () => ({
  default: vi.fn().mockImplementation(() => mockRedis),
}));
```

---

## Running Session Tests

```bash
cd /home/runner/workspace/agent-gateway

# Run session tests
npm run test -- sessions

# Run specific backend tests
npm run test -- sessions/file-persistence.test.ts
npm run test -- sessions/redis-persistence.test.ts

# Run with coverage for sessions module
npm run test:coverage -- --include "src/sessions/**"
```

---

## Session Key Resolution

The session key is derived from channel and userId:

```typescript
function deriveSessionKey(channel: string, userId: string): string {
  return `${channel}:${userId}`;
}

// Examples
deriveSessionKey('telegram', '123456789');  // 'telegram:123456789'
deriveSessionKey('discord', '987654321');   // 'discord:987654321'
deriveSessionKey('slack', 'U123ABC');       // 'slack:U123ABC'
```

---

## Writing New Session Tests

### Checklist

- [ ] Test session creation with all fields
- [ ] Test session retrieval by ID
- [ ] Test session deletion
- [ ] Test session update (message append)
- [ ] Test persistence for each backend
- [ ] Test session survives restart (file/DB/Redis)
- [ ] Test TTL expiration
- [ ] Test message history truncation
- [ ] Test list with filters
- [ ] Test concurrent session access
- [ ] Test error handling (I/O errors, connection failures)

### Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager, InMemorySessionPersistence }
  from '/home/runner/workspace/agent-gateway/src/sessions/index.js';

describe('SessionManager', () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager(
      new InMemorySessionPersistence(),
      { maxMessages: 50, ttl: 3600 }
    );
  });

  it('should create a session', async () => {
    const session = await manager.createSession('telegram', 'user1', 'openai');

    expect(session.id).toBeDefined();
    expect(session.channel).toBe('telegram');
    expect(session.userId).toBe('user1');
    expect(session.provider).toBe('openai');
    expect(session.messages).toEqual([]);
  });

  it('should append messages to session', async () => {
    const session = await manager.createSession('telegram', 'user1', 'openai');
    session.messages.push({
      role: 'user',
      content: 'Hello!',
      timestamp: Date.now(),
    });
    await manager.saveSession(session);

    const loaded = await manager.getSession(session.id);
    expect(loaded?.messages.length).toBe(1);
  });
});
```

---

## Integration Points

The session system integrates with:

| Component | Integration |
|-----------|-------------|
| **Gateway** | Session creation and lookup |
| **Auto-Reply** | Session load before, save after processing |
| **Agent Layer** | Message history from session context |
| **Context Manager** | Session messages for context building |
| **Cleanup** | Periodic expired session cleanup |
| **Backup** | Session data backup |
| **Observability** | Session count metrics |
