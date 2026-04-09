# Mistral Provider (`src/providers/mistral/`)

> **Mistral AI API adapter — OpenAI-compatible format for Mistral models.**

---

## Overview

The `MistralProvider` class implements the `Provider` interface for the Mistral AI API. Mistral's API is OpenAI-compatible, which means the implementation reuses much of the same request/response format as the OpenAI provider while connecting to Mistral's own models.

Mistral models are known for their efficiency, strong performance in European languages, and competitive pricing.

---

## File Structure

```
mistral/
└── index.ts    # MistralProvider implementation
```

---

## API Reference

### Constructor

```typescript
new MistralProvider(config: {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
})
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `apiKey` | ✅ | — | Mistral API key |
| `model` | ❌ | `mistral-large-latest` | Model identifier |
| `baseUrl` | ❌ | `https://api.mistral.ai/v1` | Custom API base URL |
| `temperature` | ❌ | `0.7` | Sampling temperature |
| `maxTokens` | ❌ | — | Maximum response tokens |

### Methods

#### `chat(messages, options?)`

Text completion via Mistral's chat endpoint.

```typescript
const response = await provider.chat([
  { role: 'user', content: 'Hello!' },
]);
```

Endpoint: `POST /v1/chat/completions`

#### `chatWithTools(messages, tools, options?)`

Text completion with function calling.

```typescript
const response = await provider.chatWithTools(
  [{ role: 'user', content: 'Search for the latest news about AI' }],
  [{
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  }]
);
```

Mistral supports function calling with a format compatible with OpenAI's spec.

#### `listModels()`

Lists available Mistral models.

```typescript
const models = await provider.listModels();
// [{ id: 'mistral-large-latest', name: 'Mistral Large', contextWindow: 128000, ... }]
```

Endpoint: `GET /v1/models`

---

## API Details

### Request Format

OpenAI-compatible format:

```json
{
  "model": "mistral-large-latest",
  "messages": [
    { "role": "system", "content": "You are helpful." },
    { "role": "user", "content": "Hello!" }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "web_search",
        "description": "Search the web",
        "parameters": {
          "type": "object",
          "properties": { "query": { "type": "string" } },
          "required": ["query"]
        }
      }
    }
  ],
  "temperature": 0.7
}
```

### Response Format

Also OpenAI-compatible:

```json
{
  "id": "cmpl-abc123",
  "object": "chat.completion",
  "model": "mistral-large-latest",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Hello! How can I help you?",
      "tool_calls": []
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 14,
    "completion_tokens": 9,
    "total_tokens": 23
  }
}
```

---

## Models

| Model | Context Window | Best For |
|-------|---------------|----------|
| `mistral-large-latest` | 128K | Best performance, function calling |
| `mistral-small-latest` | 32K | Cost-effective |
| `open-mixtral-8x22b` | 64K | Sparse MoE, fast |
| `open-mistral-nemo` | 128K | Balanced performance |
| `codestral-latest` | 32K | Code generation |
| `mistral-embed` | 8K | Embeddings |

---

## Authentication

API key is passed in the `Authorization` header:
```
Authorization: Bearer your-api-key
```

---

## Rate Limits

| Tier | RPM | Concurrent |
|------|-----|-----------|
| Free | 10 | 4 |
| Paid (pay-as-you-go) | 100 | 20 |
| Enterprise | 1,000+ | 100+ |

Rate limit headers:
- `x-ratelimitbarring-per-minute`: Requests per minute limit
- On 429: `retry-after` header present

---

## Function Calling

Mistral supports function calling in the same format as OpenAI. Key models that support it:

| Model | Function Calling |
|-------|-----------------|
| `mistral-large-latest` | ✅ |
| `mistral-small-latest` | ✅ |
| `open-mixtral-8x22b` | ✅ |
| `open-mistral-nemo` | ✅ |
| `codestral-latest` | ❌ |
| `mistral-embed` | ❌ |

---

## Error Handling

| Status | Error | Behavior |
|--------|-------|----------|
| 401 | Invalid API key | Logged at error, provider disabled |
| 400 | Bad request | Error thrown with details |
| 404 | Model not found | Error thrown |
| 429 | Rate limited | Waits `retry-after`, retries |
| 500 | Server error | Retries with exponential backoff |
| 503 | Service unavailable | Retries with exponential backoff |

---

## Related Documentation

- [`providers/`](../README.md) — Parent providers module
- [Mistral API Reference](https://docs.mistral.ai/api/) — Official docs
- [Function Calling](https://docs.mistral.ai/capabilities/function_calling/) — Tool calling guide
