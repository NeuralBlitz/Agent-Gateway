# OpenAI Provider (`src/providers/openai/`)

> **OpenAI Chat Completions API adapter — gpt-4o, gpt-4, gpt-3.5-turbo, and more.**

---

## Overview

The `OpenAIProvider` class implements the `Provider` interface for the OpenAI Chat Completions API. It supports text completion, tool-calling (function calling), streaming, and model listing.

OpenAI is the most commonly used provider in Agent Gateway and serves as the reference implementation for the OpenAI-compatible API format used by Mistral and DeepSeek providers.

---

## File Structure

```
openai/
└── index.ts    # OpenAIProvider implementation
```

---

## API Reference

### Constructor

```typescript
new OpenAIProvider(config: {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  organization?: string;
  temperature?: number;
  maxTokens?: number;
})
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `apiKey` | ✅ | — | OpenAI API key (`sk-...`) |
| `model` | ❌ | `gpt-4o` | Model identifier |
| `baseUrl` | ❌ | `https://api.openai.com/v1` | Custom API base URL |
| `organization` | ❌ | — | Organization ID for billing |
| `temperature` | ❌ | `0.7` | Default sampling temperature |
| `maxTokens` | ❌ | — | Maximum tokens in response |

### Methods

#### `chat(messages, options?)`

Simple text completion via the Chat Completions API.

```typescript
const response = await provider.chat([
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'What is TypeScript?' },
]);
```

Endpoint: `POST /v1/chat/completions`

#### `chatWithTools(messages, tools, options?)`

Text completion with function calling support.

```typescript
const response = await provider.chatWithTools(
  [
    { role: 'user', content: 'What files are in /tmp?' },
  ],
  [
    {
      type: 'function',
      function: {
        name: 'bash',
        description: 'Execute a shell command',
        parameters: {
          type: 'object',
          properties: { cmd: { type: 'string' } },
          required: ['cmd'],
        },
      },
    },
  ]
);

// Response may contain tool_calls:
if (response.tool_calls) {
  for (const call of response.tool_calls) {
    console.log(call.function.name); // "bash"
    console.log(JSON.parse(call.function.arguments)); // { cmd: "ls /tmp" }
  }
}
```

Endpoint: `POST /v1/chat/completions` with `tools` parameter.

#### `chatStream(messages, options?)`

Streaming text completion via SSE.

```typescript
for await (const chunk of provider.chatStream([
  { role: 'user', content: 'Write a story' },
])) {
  process.stdout.write(chunk);
}
```

Uses `stream: true` in the API request. Returns an async generator yielding text chunks.

#### `chatStreamWithTools(messages, tools, options?)`

Streaming completion with tool-calling. Yields text chunks and tool call objects.

#### `listModels()`

Lists available models from the OpenAI API.

```typescript
const models = await provider.listModels();
// [{ id: 'gpt-4o', name: 'GPT-4o', contextWindow: 128000, ... }]
```

Endpoint: `GET /v1/models`

---

## API Details

### Request Format

```json
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "You are helpful." },
    { "role": "user", "content": "Hello!" }
  ],
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather for a city",
        "parameters": {
          "type": "object",
          "properties": { "city": { "type": "string" } },
          "required": ["city"]
        }
      }
    }
  ],
  "temperature": 0.7,
  "max_tokens": 4096
}
```

### Response Format

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1704067200,
  "model": "gpt-4o-2024-05-13",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "The weather is sunny.",
      "tool_calls": []
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 10,
    "total_tokens": 35
  }
}
```

---

## Tool Calling (Function Calling)

OpenAI's function calling format:

### Tool Definition
```json
{
  "type": "function",
  "function": {
    "name": "bash",
    "description": "Execute shell command",
    "parameters": {
      "type": "object",
      "properties": {
        "cmd": { "type": "string", "description": "The command" }
      },
      "required": ["cmd"]
    }
  }
}
```

### Tool Call in Response
```json
{
  "choices": [{
    "message": {
      "role": "assistant",
      "content": null,
      "tool_calls": [{
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "bash",
          "arguments": "{\"cmd\":\"ls -la /tmp\"}"
        }
      }]
    },
    "finish_reason": "tool_calls"
  }]
}
```

### Tool Result (for follow-up call)
```json
{
  "role": "tool",
  "tool_call_id": "call_abc123",
  "content": "total 42\ndrwxrwxrwt ..."
}
```

---

## Models

Popular OpenAI models:

| Model | Context Window | Best For |
|-------|---------------|----------|
| `gpt-4o` | 128K | General purpose, multimodal |
| `gpt-4o-mini` | 128K | Cost-effective general purpose |
| `gpt-4-turbo` | 128K | Complex reasoning |
| `gpt-3.5-turbo` | 16K | Fast, cheap responses |
| `o1` | 200K | Complex reasoning (no tool calling) |
| `o1-mini` | 128K | Faster complex reasoning |

---

## Authentication

API key is passed in the `Authorization` header:
```
Authorization: Bearer sk-proj-abc123...
```

Optional organization ID:
```
OpenAI-Organization: org-abc123
```

---

## Rate Limits

Rate limits depend on the account tier and usage tier:

| Tier | RPM (requests/min) | TPM (tokens/min) |
|------|-------------------|-----------------|
| Free | 3 | 40K |
| Tier 1 | 200 | 40K |
| Tier 2 | 300 | 150K |
| Tier 3 | 1,000 | 300K |
| Tier 4 | 2,000 | 600K |
| Tier 5 | 10,000 | 2M |

On 429 responses, the adapter retries after the `Retry-After` header value.

---

## Error Handling

| Status | Error | Behavior |
|--------|-------|----------|
| 401 | Invalid API key | Logged at error, provider disabled |
| 403 | Account issue | Logged at error |
| 404 | Model not found | Error thrown |
| 429 | Rate limited | Waits `Retry-After`, retries |
| 500 | Server error | Retries with exponential backoff |
| 503 | Overloaded | Retries with exponential backoff |

---

## Related Documentation

- [`providers/`](../README.md) — Parent providers module
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference/chat) — Official docs
- [Function Calling Guide](https://platform.openai.com/docs/guides/function-calling) — Tool calling guide
