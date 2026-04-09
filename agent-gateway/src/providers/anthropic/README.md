# Anthropic Provider (`src/providers/anthropic/`)

> **Anthropic Messages API adapter — Claude Sonnet, Opus, and Haiku models.**

---

## Overview

The `AnthropicProvider` class implements the `Provider` interface for the Anthropic Messages API. It supports text completion, tool-calling (via `tool_use` content blocks), and model listing.

Claude models are known for their strong reasoning, long context windows, and excellent tool-calling capabilities. The Messages API has a different structure from OpenAI's format, which this adapter normalizes.

---

## File Structure

```
anthropic/
└── index.ts    # AnthropicProvider implementation
```

---

## API Reference

### Constructor

```typescript
new AnthropicProvider(config: {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
})
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `apiKey` | ✅ | — | Anthropic API key (`sk-ant-...`) |
| `model` | ❌ | `claude-sonnet-4-20250514` | Model identifier |
| `baseUrl` | ❌ | `https://api.anthropic.com/v1` | Custom API base URL |
| `temperature` | ❌ | `0.7` | Sampling temperature |
| `maxTokens` | ❌ | `4096` | Maximum response tokens |

### Methods

#### `chat(messages, options?)`

Text completion via the Messages API.

```typescript
const response = await provider.chat([
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'Explain quantum computing.' },
]);
```

Endpoint: `POST /v1/messages`

#### `chatWithTools(messages, tools, options?)`

Text completion with tool-calling. Claude returns tool calls as `tool_use` content blocks.

```typescript
const response = await provider.chatWithTools(
  [{ role: 'user', content: 'List files in /tmp' }],
  [{
    type: 'function',
    function: {
      name: 'bash',
      description: 'Execute shell command',
      parameters: { /* JSON Schema */ },
    },
  }]
);

// Tool calls are extracted from content blocks:
// response.content may contain:
// [{ type: "tool_use", id: "toolu_abc", name: "bash", input: { cmd: "ls" } }]
```

Endpoint: `POST /v1/messages` with `tools` parameter.

#### `listModels()`

Lists available Claude models.

```typescript
const models = await provider.listModels();
// [{ id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', contextWindow: 200000, ... }]
```

---

## API Details

### Request Format

```json
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 4096,
  "system": "You are a helpful assistant.",
  "messages": [
    { "role": "user", "content": "What's in /tmp?" }
  ],
  "tools": [
    {
      "name": "bash",
      "description": "Execute a shell command",
      "input_schema": {
        "type": "object",
        "properties": { "cmd": { "type": "string" } },
        "required": ["cmd"]
      }
    }
  ]
}
```

Note: Anthropic puts the system prompt in a separate `system` field, not in the messages array.

### Response Format

```json
{
  "id": "msg_abc123",
  "type": "message",
  "role": "assistant",
  "content": [
    {
      "type": "text",
      "text": "Let me check that for you."
    },
    {
      "type": "tool_use",
      "id": "toolu_abc123",
      "name": "bash",
      "input": { "cmd": "ls -la /tmp" }
    }
  ],
  "model": "claude-sonnet-4-20250514",
  "stop_reason": "tool_use",
  "usage": {
    "input_tokens": 25,
    "output_tokens": 50
  }
}
```

### Tool Result Format

```json
{
  "role": "user",
  "content": [
    {
      "type": "tool_result",
      "tool_use_id": "toolu_abc123",
      "content": "total 42\ndrwxrwxrwt ..."
    }
  ]
}
```

---

## Tool Calling

Anthropic's tool-calling uses content blocks rather than a separate field:

### Tool Definition
```json
{
  "name": "get_weather",
  "description": "Get weather for a city",
  "input_schema": {
    "type": "object",
    "properties": { "city": { "type": "string" } },
    "required": ["city"]
  }
}
```

### Tool Use in Response
The response `content` array contains mixed text and tool_use blocks:
```json
{
  "content": [
    { "type": "text", "text": "I'll check the weather." },
    {
      "type": "tool_use",
      "id": "toolu_abc",
      "name": "get_weather",
      "input": { "city": "San Francisco" }
    }
  ],
  "stop_reason": "tool_use"
}
```

The adapter parses this structure and extracts tool calls into the normalized `ToolCall` format.

### Multiple Tool Calls
Claude can return multiple tool_use blocks in a single response. The adapter collects all of them and returns them for parallel execution.

---

## Models

| Model | Context Window | Best For |
|-------|---------------|----------|
| `claude-sonnet-4-20250514` | 200K | Best balance of speed and quality |
| `claude-opus-4-20250514` | 200K | Most complex tasks |
| `claude-haiku-3-20240307` | 200K | Fast, cheap responses |
| `claude-3-5-sonnet-20241022` | 200K | Previous generation sonnet |

---

## Authentication

API key is passed in the `x-api-key` header:
```
x-api-key: sk-ant-api03-abc123...
```

Required headers:
- `x-api-key`: API key
- `anthropic-version`: API version (`2024-02-01`)
- `content-type`: `application/json`

---

## Rate Limits

| Tier | RPM | TPM |
|------|-----|-----|
| Free | 5 | 5K |
| Builder (pay-as-you-go) | 50 | 40K |
| Scale (committed use) | 1,000+ | 200K+ |

Rate limit headers:
- `anthropic-ratelimit-tokens-limit`: Total token limit
- `anthropic-ratelimit-tokens-remaining`: Remaining tokens
- `anthropic-ratelimit-tokens-reset`: Token reset time
- `anthropic-ratelimit-requests-limit`: Request limit
- `anthropic-ratelimit-requests-remaining`: Remaining requests
- `anthropic-ratelimit-requests-reset`: Request reset time

---

## Prompt Caching

Anthropic supports prompt caching for repeated system prompts. Cached prefixes reduce cost and latency. The adapter does not explicitly control caching — Anthropic handles it automatically based on prompt similarity.

---

## Error Handling

| Status | Error | Behavior |
|--------|-------|----------|
| 401 | Invalid API key | Logged at error, provider disabled |
| 400 | Bad request (invalid format) | Error thrown |
| 403 | Permission denied | Logged at error |
| 429 | Rate limited | Waits retry-after header, retries |
| 500 | Server error | Retries with exponential backoff |
| 529 | Overloaded (Claude-specific) | Retries with exponential backoff |

---

## Related Documentation

- [`providers/`](../README.md) — Parent providers module
- [Anthropic API Reference](https://docs.anthropic.com/en/api/messages) — Official docs
- [Tool Use Guide](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) — Tool calling details
