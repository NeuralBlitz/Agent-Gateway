# DeepSeek Provider (`src/providers/deepseek/`)

> **DeepSeek API adapter — OpenAI-compatible format for DeepSeek models.**

---

## Overview

The `DeepSeekProvider` class implements the `Provider` interface for the DeepSeek API. DeepSeek's API is OpenAI-compatible, sharing the same request/response format as the OpenAI provider while connecting to DeepSeek's models.

DeepSeek models are known for their strong performance in coding tasks, mathematics, and competitive pricing.

---

## File Structure

```
deepseek/
└── index.ts    # DeepSeekProvider implementation
```

---

## API Reference

### Constructor

```typescript
new DeepSeekProvider(config: {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
})
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `apiKey` | ✅ | — | DeepSeek API key |
| `model` | ❌ | `deepseek-chat` | Model identifier |
| `baseUrl` | ❌ | `https://api.deepseek.com/v1` | Custom API base URL |
| `temperature` | ❌ | `0.7` | Sampling temperature |
| `maxTokens` | ❌ | — | Maximum response tokens |

### Methods

#### `chat(messages, options?)`

Text completion via DeepSeek's chat endpoint.

```typescript
const response = await provider.chat([
  { role: 'user', content: 'Solve x^2 + 2x + 1 = 0' },
]);
```

Endpoint: `POST /v1/chat/completions`

#### `chatWithTools(messages, tools, options?)`

Text completion with function calling.

```typescript
const response = await provider.chatWithTools(
  [{ role: 'user', content: 'Calculate 2^100' }],
  [{
    type: 'function',
    function: {
      name: 'calculator',
      description: 'Perform calculations',
      parameters: {
        type: 'object',
        properties: { expression: { type: 'string' } },
        required: ['expression'],
      },
    },
  }]
);
```

DeepSeek supports function calling in the OpenAI-compatible format.

#### `listModels()`

Lists available DeepSeek models.

```typescript
const models = await provider.listModels();
// [{ id: 'deepseek-chat', name: 'DeepSeek Chat', contextWindow: 128000, ... }]
```

Endpoint: `GET /v1/models`

---

## API Details

### Request Format

OpenAI-compatible:

```json
{
  "model": "deepseek-chat",
  "messages": [
    { "role": "system", "content": "You are a math expert." },
    { "role": "user", "content": "Solve x^2 + 2x + 1 = 0" }
  ],
  "temperature": 0.7,
  "max_tokens": 4096
}
```

### Response Format

OpenAI-compatible:

```json
{
  "id": "abc123",
  "object": "chat.completion",
  "created": 1704067200,
  "model": "deepseek-chat",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "This factors as (x+1)^2 = 0, so x = -1.",
      "tool_calls": []
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 15,
    "total_tokens": 35
  }
}
```

---

## Models

| Model | Context Window | Best For |
|-------|---------------|----------|
| `deepseek-chat` | 128K | General purpose, strong reasoning |
| `deepseek-coder` | 128K | Code generation and understanding |
| `deepseek-reasoner` | 128K | Complex reasoning (R1 model) |

---

## Authentication

API key is passed in the `Authorization` header:
```
Authorization: Bearer sk-...
```

---

## Rate Limits

DeepSeek rate limits vary by account tier. Contact DeepSeek for specific limits.

On 429 responses, the adapter waits for the `Retry-After` header value before retrying.

---

## Error Handling

| Status | Error | Behavior |
|--------|-------|----------|
| 401 | Invalid API key | Logged at error, provider disabled |
| 400 | Bad request | Error thrown |
| 404 | Model not found | Error thrown |
| 429 | Rate limited | Waits `Retry-After`, retries |
| 500 | Server error | Retries with exponential backoff |
| 503 | Service unavailable | Retries with exponential backoff |

---

## Related Documentation

- [`providers/`](../README.md) — Parent providers module
- [DeepSeek API Docs](https://platform.deepseek.com/api-docs/) — Official reference
