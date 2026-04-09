# Provider Tests

> **Test suite for AI model provider adapters in Agent Gateway**

This directory contains tests for all AI provider adapters supported by Agent Gateway. Tests verify provider creation, connection, chat completion, tool-calling, streaming responses, model listing, and error handling for each supported provider.

---

## Table of Contents

- [Overview](#overview)
- [Test Scope](#test-scope)
- [Supported Providers](#supported-providers)
- [Test Architecture](#test-architecture)
- [Test Scenarios](#test-scenarios)
- [Mocking Strategy](#mocking-strategy)
- [Running Provider Tests](#running-provider-tests)
- [Tool-Calling Tests](#tool-calling-tests)
- [Streaming Tests](#streaming-tests)
- [Writing New Provider Tests](#writing-new-provider-tests)
- [Integration Points](#integration-points)

---

## Overview

Location: `/home/runner/workspace/agent-gateway/test/providers/`

Provider adapters translate AI model APIs into the unified `Provider` interface. Each provider test file validates the complete provider lifecycle from creation through chat execution, tool-calling, and error handling.

---

## Test Scope

Each provider test covers:

| Category | Scenarios |
|----------|-----------|
| **Creation** | Factory function, configuration validation |
| **Connection** | Connect, disconnect, API key validation |
| **Chat** | Single message, multi-message conversation |
| **Tool-Calling** | Tool definitions, tool call response, tool result feeding |
| **Streaming** | Token-by-token streaming, stream completion |
| **Model Listing** | List available models |
| **Error Handling** | Invalid key, rate limit, model not found, timeout |

---

## Supported Providers

| Provider | Test File | Status |
|----------|-----------|--------|
| **OpenAI** | `openai.test.ts` | Full coverage |
| **Anthropic** | `anthropic.test.ts` | Full coverage |
| **Google** | `google.test.ts` | Full coverage |
| **Mistral** | `mistral.test.ts` | Full coverage |
| **DeepSeek** | `deepseek.test.ts` | Full coverage |
| **Ollama** | `ollama.test.ts` | Full coverage |

---

## Test Architecture

### Common Test Pattern

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createProvider } from '/home/runner/workspace/agent-gateway/src/providers/index.js';

describe('OpenAIProvider', () => {
  let provider: ReturnType<typeof createProvider>;

  beforeEach(() => {
    provider = createProvider('openai', {
      apiKey: 'test-key',
      model: 'gpt-4o',
    });
  });

  describe('creation', () => { /* ... */ });
  describe('connection', () => { /* ... */ });
  describe('chat', () => { /* ... */ });
  describe('tool-calling', () => { /* ... */ });
  describe('streaming', () => { /* ... */ });
  describe('errors', () => { /* ... */ });
});
```

---

## Test Scenarios

### Chat Completion Tests

- Send a single user message
- Send a conversation with system + user messages
- Response includes content, model, finishReason
- Response is correctly typed

### Tool-Calling Tests

- Send tools with chat request
- Provider returns tool_calls
- Feed tool results back
- Provider returns final text response after tools

### Streaming Tests

- Stream tokens one by one
- Complete stream event fires
- Stream error is handled

### Error Tests

- Invalid API key returns error
- Rate limit exceeded returns error
- Model not found returns error
- Network timeout returns error

---

## Mocking Strategy

### Mock HTTP Fetch

```typescript
import { vi } from 'vitest';

vi.mock('undici', () => ({
  fetch: vi.fn().mockImplementation(async (url: string, opts: any) => {
    const body = JSON.parse(opts.body);
    return {
      ok: true,
      json: async () => ({
        id: 'chatcmpl-123',
        choices: [{
          message: {
            role: 'assistant',
            content: 'Hello!',
          },
          finish_reason: 'stop',
        }],
        model: body.model,
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      }),
    };
  }),
}));
```

### Mock Tool-Calling Response

```typescript
vi.mocked(fetch).mockResolvedValueOnce({
  ok: true,
  json: async () => ({
    id: 'chatcmpl-456',
    choices: [{
      message: {
        role: 'assistant',
        content: null,
        tool_calls: [{
          id: 'call_abc',
          type: 'function',
          function: { name: 'getWeather', arguments: '{"city":"London"}' },
        }],
      },
      finish_reason: 'tool_calls',
    }],
  }),
});
```

---

## Running Provider Tests

```bash
cd /home/runner/workspace/agent-gateway

# Run all provider tests
npm run test -- providers

# Run specific provider
npm run test -- providers/openai.test.ts
npm run test -- providers/anthropic.test.ts

# Run with coverage for provider modules
npm run test:coverage -- --include "src/providers/**"
```

---

## Tool-Calling Tests

### OpenAI Tool-Calling

```typescript
it('should handle tool calls', async () => {
  const response = await provider.chatWithTools(
    [{ role: 'user', content: 'What is the weather in London?' }],
    [{
      name: 'getWeather',
      description: 'Get weather for a city',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string' } },
        required: ['city'],
      },
    }]
  );

  expect(response.finishReason).toBe('tool_calls');
  expect(response.tool_calls).toBeDefined();
  expect(response.tool_calls![0].name).toBe('getWeather');
});
```

### Tool Result Feeding

```typescript
it('should process tool results and return final response', async () => {
  // First call returns tool_calls
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      choices: [{ message: { tool_calls: [{ id: 'call1', function: { name: 'bash', arguments: '{"cmd":"ls"}' } }] }, finish_reason: 'tool_calls' }],
    }),
  });

  // Second call (with tool result) returns final response
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: 'Files: a.txt, b.txt' }, finish_reason: 'stop' }],
    }),
  });

  const r1 = await provider.chatWithTools(messages, tools);
  expect(r1.finishReason).toBe('tool_calls');

  const messagesWithResult = [
    ...messages,
    { role: 'assistant', tool_calls: r1.tool_calls },
    { role: 'tool', tool_call_id: 'call1', content: 'a.txt\nb.txt' },
  ];
  const r2 = await provider.chatWithTools(messagesWithResult, tools);
  expect(r2.finishReason).toBe('stop');
  expect(r2.content).toBe('Files: a.txt, b.txt');
});
```

---

## Streaming Tests

```typescript
it('should stream tokens', async () => {
  const tokens: string[] = [];

  await provider.chat(messages, {
    stream: true,
    onToken: (token: string) => tokens.push(token),
  });

  expect(tokens.length).toBeGreaterThan(0);
});
```

---

## Writing New Provider Tests

### Checklist

- [ ] Test provider creation with valid config
- [ ] Test provider creation with invalid config
- [ ] Test connection (connect/disconnect)
- [ ] Test basic chat completion
- [ ] Test multi-message conversation
- [ ] Test tool-calling request
- [ ] Test tool result processing
- [ ] Test streaming responses
- [ ] Test model listing (if supported)
- [ ] Test error handling (invalid key, rate limit, timeout)
- [ ] Test provider-specific edge cases

### Example

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createProvider } from '/home/runner/workspace/agent-gateway/src/providers/index.js';

describe('MyProvider', () => {
  let provider: ReturnType<typeof createProvider>;

  beforeEach(() => {
    vi.resetAllMocks();
    provider = createProvider('myprovider', {
      apiKey: 'test-key',
      model: 'my-model',
    });
  });

  describe('chat', () => {
    it('should return a response for a simple message', async () => {
      const response = await provider.chat([
        { role: 'user', content: 'Hello!' },
      ]);

      expect(response.id).toBeDefined();
      expect(response.content).toBeDefined();
      expect(response.model).toBe('my-model');
      expect(response.finishReason).toBe('stop');
    });
  });
});
```

---

## Integration Points

The provider tests validate integration with:

| Component | Integration |
|-----------|-------------|
| **Agent Layer** | Tool-calling loop uses provider API |
| **Auto-Reply** | Reply pipeline calls provider |
| **Failover** | Provider failover uses this interface |
| **Load Balancer** | Provider distribution |
| **Observability** | API call metrics recording |
| **Context Manager** | Token estimation for provider context windows |
| **Streaming** | SSE stream parsing |
| **Cache** | Response caching by provider |
