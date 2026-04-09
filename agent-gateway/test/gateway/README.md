# Gateway Tests

> **Test suite for the Gateway core orchestrator in Agent Gateway**

This directory contains tests for the Gateway core -- the central orchestrator that manages the lifecycle of the entire system, including channel registration, provider registration, session management, event emission, and health monitoring.

---

## Table of Contents

- [Overview](#overview)
- [Test Scope](#test-scope)
- [Gateway Architecture](#gateway-architecture)
- [Test Files](#test-files)
- [Test Scenarios](#test-scenarios)
- [Mocking Strategy](#mocking-strategy)
- [Running Gateway Tests](#running-gateway-tests)
- [API Coverage](#api-coverage)
- [Writing New Gateway Tests](#writing-new-gateway-tests)
- [Integration Points](#integration-points)

---

## Overview

Location: `/home/runner/workspace/agent-gateway/test/gateway/`

The Gateway class is the central orchestrator of the Agent Gateway system. It is responsible for:

- Managing the complete lifecycle (start, stop, health checks)
- Registering and managing channel adapters
- Registering and managing AI providers
- Creating, finding, and deleting sessions
- Coordinating the event bus
- Emitting lifecycle events
- Health status reporting

The main test file is `/home/runner/workspace/agent-gateway/test/gateway.test.ts` with additional tests in this directory.

---

## Test Scope

| Component | Source Location | Test Coverage |
|-----------|----------------|---------------|
| `Gateway` class | `src/gateway/index.ts` | Full lifecycle, registration, sessions |
| `createGateway()` | `src/gateway/index.ts` | Factory function, options validation |
| Gateway options | `src/gateway/index.ts` | Host, port, config validation |
| Session management | `src/gateway/index.ts` | Create, find, delete sessions |
| Event emission | `src/gateway/index.ts` | started, stopped events |
| Health checks | `src/gateway/index.ts` | isHealthy() state transitions |

---

## Gateway Architecture

### Gateway Class Structure

```typescript
class Gateway extends EventEmitter {
  // Core state
  private config: GatewayConfig;
  private running: boolean;

  // Registries
  private channels: Map<string, Channel>;
  private providers: Map<string, Provider>;
  private sessions: Map<string, Session>;

  // Lifecycle
  async start(): Promise<void>;
  async stop(): Promise<void>;
  isHealthy(): boolean;

  // Channel management
  registerChannel(id: string, channel: Channel): void;
  unregisterChannel(id: string): void;
  getChannels(): Map<string, Channel>;

  // Provider management
  registerProvider(id: string, provider: Provider): void;
  unregisterProvider(id: string): void;
  getProviders(): Map<string, Provider>;

  // Session management
  createSession(channel: string, userId: string, provider: string): Session;
  getSession(sessionId: string): Session | undefined;
  deleteSession(sessionId: string): void;
  findOrCreateSession(channel, userId, provider, factory): Session;
}
```

### State Transitions

```
Created ──► start() ──► Running ──► stop() ──► Stopped
              │                         │
              ▼                         ▼
         isHealthy()=true         isHealthy()=false
         emit('started')          emit('stopped')
```

---

## Test Files

| File | Coverage |
|------|----------|
| `/home/runner/workspace/agent-gateway/test/gateway.test.ts` | Gateway creation, start/stop, registration, sessions, events |
| `/home/runner/workspace/agent-gateway/test/gateway/*.test.ts` | Additional gateway tests (this directory) |

---

## Test Scenarios

### Creation and Lifecycle

- Create gateway with default options
- Create gateway with custom host/port
- Start the gateway (should transition to healthy)
- Stop the gateway (should transition to unhealthy)
- Start/stop cycle (multiple cycles)
- Health check returns correct state

### Channel Registration

- Register a channel
- Unregister a channel
- List registered channels
- Register duplicate channel (should handle)
- Get channel by ID

### Provider Registration

- Register a provider
- Unregister a provider
- List registered providers
- Register duplicate provider (should handle)
- Get provider by ID

### Session Management

- Create a session with channel, userId, provider
- Find an existing session by ID
- Delete a session
- findOrCreateSession returns existing session
- findOrCreateSession creates new session when none exists

### Event Emission

- `started` event emitted on start
- `stopped` event emitted on stop
- Event listeners receive correct payload
- Multiple listeners for same event

---

## Mocking Strategy

### Minimal Mock Channel

```typescript
const mockChannel = {
  id: 'test',
  type: 'test',
  name: 'test',
  connected: false,
  config: {},
  connect: async () => { mockChannel.connected = true; },
  disconnect: async () => { mockChannel.connected = false; },
  sendMessage: async () => {},
  getUser: async () => null,
  getMe: async () => null,
  on: () => {},
};
```

### Minimal Mock Provider

```typescript
const mockProvider = {
  id: 'test',
  type: 'test',
  name: 'test',
  config: {},
  connect: async () => {},
  disconnect: async () => {},
  chat: async () => ({ id: '1', content: 'hi', model: 'test', finishReason: 'stop' }),
  chatWithTools: async () => ({ id: '1', content: 'hi', model: 'test', finishReason: 'stop' }),
};
```

### Port 0 for Dynamic Allocation

```typescript
// Always use port 0 in tests to avoid port conflicts
const gw = createGateway({ host: '0.0.0.0', port: 0 });
```

---

## Running Gateway Tests

```bash
cd /home/runner/workspace/agent-gateway

# Run gateway tests
npm run test -- gateway.test.ts
npm run test -- test/gateway/

# Run with coverage for gateway module
npm run test:coverage -- --include "src/gateway/**"

# Run specific test case
npm run test -- --grep "Gateway"
```

---

## API Coverage

The gateway tests cover all public API methods:

| Method | Test Coverage |
|--------|--------------|
| `createGateway(options)` | Default options, custom options |
| `gw.start()` | Successful start, event emission |
| `gw.stop()` | Successful stop, event emission |
| `gw.isHealthy()` | Healthy when running, unhealthy when stopped |
| `gw.registerChannel(id, ch)` | Registration, listing |
| `gw.registerProvider(id, p)` | Registration, listing |
| `gw.getChannels()` | Returns map of channels |
| `gw.getProviders()` | Returns map of providers |
| `gw.createSession(ch, uid, p)` | Session creation with correct fields |
| `gw.getSession(id)` | Returns session or undefined |
| `gw.deleteSession(id)` | Session removed |
| `gw.findOrCreateSession(...)` | Returns existing or creates new |

---

## Writing New Gateway Tests

### Example Test

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGateway } from '/home/runner/workspace/agent-gateway/src/gateway/index.js';

describe('Gateway - Advanced', () => {
  let gw: ReturnType<typeof createGateway>;

  beforeEach(() => {
    gw = createGateway({ host: '0.0.0.0', port: 0 });
  });

  afterEach(async () => {
    if (gw.isHealthy()) await gw.stop();
  });

  it('should handle rapid start/stop cycles', async () => {
    for (let i = 0; i < 10; i++) {
      await gw.start();
      expect(gw.isHealthy()).toBe(true);
      await gw.stop();
      expect(gw.isHealthy()).toBe(false);
    }
  });

  it('should maintain session isolation', () => {
    const s1 = gw.createSession('telegram', 'user1', 'openai');
    const s2 = gw.createSession('telegram', 'user2', 'openai');
    const s3 = gw.createSession('discord', 'user1', 'openai');

    expect(s1.id).not.toBe(s2.id);
    expect(s1.id).not.toBe(s3.id);
    expect(s2.id).not.toBe(s3.id);
  });
});
```

---

## Integration Points

The gateway integrates with:

| Component | Integration |
|-----------|-------------|
| **Server** | Gateway triggers HTTP + WebSocket server startup |
| **Channels** | Channel registration and connection lifecycle |
| **Providers** | Provider registration and availability checks |
| **Sessions** | Session creation, lookup, and deletion |
| **Event Bus** | Lifecycle event emission |
| **Hooks** | Gateway-level hook execution |
| **Observability** | Gateway metrics and health reporting |
| **Config** | Configuration loading and validation |
