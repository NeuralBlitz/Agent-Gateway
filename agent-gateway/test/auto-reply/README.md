# Auto-Reply Tests

> **Test suite for the automatic reply pipeline in Agent Gateway**

This directory contains tests for the auto-reply subsystem, which handles the end-to-end message processing pipeline from inbound message reception through AI response generation and outbound delivery. Tests cover templating, context management, reply routing, and the core reply execution logic.

---

## Table of Contents

- [Overview](#overview)
- [Test Scope](#test-scope)
- [Auto-Reply Architecture](#auto-reply-architecture)
- [Test Files](#test-files)
- [Test Scenarios](#test-scenarios)
- [Mocking Strategy](#mocking-strategy)
- [Running Auto-Reply Tests](#running-auto-reply-tests)
- [Writing New Tests](#writing-new-tests)
- [Integration Points](#integration-points)

---

## Overview

Location: `/home/runner/workspace/agent-gateway/test/auto-reply/`

The auto-reply system is the core message processing pipeline. When a message arrives from any channel, the auto-reply system:

1. Loads the user session and conversation history
2. Builds the conversation context
3. Sends the context to the configured AI provider
4. Processes the provider response (including tool calls)
5. Saves the updated session
6. Sends the response back through the channel

This pipeline integrates with the agent layer, session manager, tool registry, hook system, and all channel/provider adapters.

---

## Test Scope

The auto-reply tests cover the following components:

| Component | Source Location | Purpose |
|-----------|----------------|---------|
| `AutoReply` class | `src/auto-reply/index.ts` | Core reply orchestrator |
| `createAutoReply()` | `src/auto-reply/index.ts` | Factory function |
| Reply templating | `src/auto-reply/templating.ts` | Prompt template processing |
| Context building | `src/context/index.ts` | Conversation context management |
| Reply runtime | `src/auto-reply/reply.runtime.ts` | Runtime reply execution |
| Session integration | `src/sessions/index.ts` | Session loading and saving |

---

## Auto-Reply Architecture

### Message Processing Flow

```
Inbound Message
       │
       ▼
┌──────────────────┐
│ Load Session     │──► SessionManager.findOrCreateSession()
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Build Context    │──► ContextManager.buildContext()
│ (message history │    - System prompt
│  + system prompt)│    - Conversation history
└────────┬─────────┘    - Tool definitions
         │
         ▼
┌──────────────────┐
│ Execute Hooks    │──► Hooks.execute('beforeAgent')
│ (beforeAgent)    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Call Provider    │──► Provider.chatWithTools()
│ (agent loop)     │    - Execute tool calls if returned
│                  │    - Repeat until final response
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Execute Hooks    │──► Hooks.execute('afterAgent')
│ (afterAgent)     │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Save Session     │──► SessionManager.save()
│ (update history) │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ Send Response    │──► Channel.sendMessage()
│ (via channel)    │
└──────────────────┘
```

### Agent Tool-Calling Loop

```
Agent sends messages + tools to provider
       │
       ▼
Provider returns response
       │
       ├── content: "Final text response" ──► Done
       │
       └── tool_calls: [call1, call2] ──► Execute tools
                                               │
                                               ▼
                                     Feed tool results back
                                               │
                                               ▼
                                     Repeat until final response
                                     or maxSteps reached
```

---

## Test Files

Tests for auto-reply are located in:

| File | Coverage |
|------|----------|
| `/home/runner/workspace/agent-gateway/test/auto-reply/*.test.ts` | Auto-reply pipeline tests (this directory) |
| `/home/runner/workspace/agent-gateway/test/tools.test.ts` | Tool execution within reply pipeline |
| `/home/runner/workspace/agent-gateway/test/hooks.test.ts` | Hook execution within reply pipeline |

---

## Test Scenarios

### Reply Generation

- Reply is generated with correct context
- System prompt is included in all requests
- Conversation history is preserved across messages
- New messages are appended to history

### Tool Execution

- Tools are executed when provider returns tool calls
- Tool results are fed back to the provider
- Maximum tool calls per message is enforced
- Tool execution errors are handled gracefully

### Session Management

- Session is loaded before processing
- Session is saved after processing
- Message history is truncated when exceeding maxMessages
- New sessions are created for unknown users

### Context Management

- Context is built from session history
- Token estimation is accurate
- Context truncation preserves recent messages
- System prompt is always included

### Error Handling

- Provider errors are caught and logged
- Timeout errors are handled
- Session save failures do not crash the pipeline
- Channel send failures are retried

---

## Mocking Strategy

### Mock Provider

```typescript
import { vi } from 'vitest';

const mockProvider = {
  id: 'test',
  type: 'test',
  name: 'test',
  config: {},
  connect: vi.fn(),
  disconnect: vi.fn(),
  chat: vi.fn().mockResolvedValue({
    id: '1',
    content: 'Hello from test provider!',
    model: 'test',
    finishReason: 'stop' as const,
  }),
  chatWithTools: vi.fn().mockResolvedValue({
    id: '1',
    content: 'Tool response!',
    model: 'test',
    finishReason: 'stop' as const,
  }),
};
```

### Mock Channel

```typescript
const mockChannel = {
  id: 'test',
  type: 'test',
  name: 'test',
  connected: true,
  config: {},
  connect: vi.fn(),
  disconnect: vi.fn(),
  sendMessage: vi.fn().mockResolvedValue(undefined),
  getUser: vi.fn(async () => null),
  getMe: vi.fn(async () => null),
  on: vi.fn(),
};
```

### Mock Session Persistence

```typescript
const mockPersistence = {
  load: vi.fn().mockResolvedValue({
    messages: [],
    metadata: {},
  }),
  save: vi.fn().mockResolvedValue(undefined),
};
```

---

## Running Auto-Reply Tests

```bash
cd /home/runner/workspace/agent-gateway

# Run auto-reply tests
npm run test -- auto-reply

# Run with verbose output
npm run test -- auto-reply --reporter=verbose

# Run specific test file
npm run test -- auto-reply/reply.test.ts
```

---

## Writing New Tests

### Test Reply Pipeline

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { createAutoReply } from '/home/runner/workspace/agent-gateway/src/auto-reply/index.js';

describe('AutoReply', () => {
  let autoReply: ReturnType<typeof createAutoReply>;

  beforeEach(() => {
    autoReply = createAutoReply({
      provider: mockProvider,
      sessionManager: mockSessionManager,
      hooks: mockHooks,
      systemPrompt: 'You are a helpful assistant.',
      maxSteps: 10,
    });
  });

  it('should generate a reply for a message', async () => {
    const result = await autoReply.reply({
      channel: 'test',
      userId: 'user1',
      content: 'Hello!',
    });

    expect(result.content).toBeDefined();
    expect(mockProvider.chatWithTools).toHaveBeenCalled();
    expect(mockChannel.sendMessage).toHaveBeenCalled();
  });

  it('should handle tool calls in the response', async () => {
    mockProvider.chatWithTools.mockResolvedValueOnce({
      id: '1',
      tool_calls: [{ id: 'call1', name: 'bash', arguments: '{"cmd":"ls"}' }],
      model: 'test',
      finishReason: 'tool_calls' as const,
    });
    mockProvider.chatWithTools.mockResolvedValueOnce({
      id: '2',
      content: 'Files listed successfully.',
      model: 'test',
      finishReason: 'stop' as const,
    });

    const result = await autoReply.reply({
      channel: 'test',
      userId: 'user1',
      content: 'List files',
    });

    expect(result.content).toBe('Files listed successfully.');
  });
});
```

---

## Integration Points

The auto-reply system integrates with:

| Component | Integration Point |
|-----------|-------------------|
| **Session Manager** | Load/save conversation history |
| **Agent Layer** | Tool-calling loop execution |
| **Provider** | AI model API calls |
| **Channel** | Message send/receive |
| **Hooks** | Lifecycle hook execution |
| **Tool Registry** | Tool discovery and execution |
| **Context Manager** | Conversation context building |
| **Observability** | Metrics and tracing |
| **Cache** | Response caching |
| **Rate Limiter** | Rate limit enforcement |
