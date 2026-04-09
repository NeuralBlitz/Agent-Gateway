# Groq Provider (`src/providers/groq/`)

> **Groq AI provider adapter -- ultra-fast inference with Llama, Mixtral, and Gemma models via OpenAI-compatible API.**

---

## Overview

The `GroqProvider` class implements the `Provider` interface for Groq's inference API. Groq provides exceptionally fast inference using their custom LPU (Language Processing Unit) hardware architecture, making it ideal for latency-sensitive applications.

Groq's API is **OpenAI-compatible**, meaning it uses the same `/chat/completions` endpoint format as OpenAI's API. This makes the Groq provider largely interchangeable with the OpenAI provider while offering access to open-weight models like Llama 3, Mixtral, and Gemma at significantly lower latencies.

Key characteristics:

- **OpenAI-compatible API** -- Uses the same endpoint structure as OpenAI, enabling drop-in replacement with a different `baseUrl` and `apiKey`.
- **Ultra-low latency** -- Groq's LPU architecture delivers inference speeds 10-20x faster than GPU-based providers for comparable models.
- **Open-weight models** -- Access to Llama 3, Mixtral 8x7b, Gemma, and other open models without self-hosting.
- **Full tool calling** -- Supports function/tool calling via the standard OpenAI tool call format.
- **Usage tracking** -- Returns detailed token usage statistics from Groq's API.

---

## File Structure

```
groq/
└── index.ts    # GroqProvider implementation with Groq OpenAI-compatible API integration
```

---

## API Reference

### Types

#### `GroqConfig`

Configuration object passed to `createGroqProvider`.

```typescript
export interface GroqConfig {
  /** Groq API key */
  apiKey: string;
  /** Custom API base URL */
  baseUrl?: string;
  /** Model identifier (e.g., 'llama-3.3-70b-versatile', 'mixtral-8x7b-32768') */
  model?: string;
  /** Maximum tokens in the response */
  maxTokens?: number;
  /** Sampling temperature (0.0 to 1.0) */
  temperature?: number;
}
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `apiKey` | Yes | -- | Groq API key (from Groq console) |
| `baseUrl` | No | `'https://api.groq.com/openai/v1'` | Custom API base URL (for proxies/testing) |
| `model` | No | `'llama-3.3-70b-versatile'` | Model identifier |
| `maxTokens` | No | -- | Maximum tokens in the generated response (not set by default) |
| `temperature` | No | `0.7` | Sampling temperature (0.0 = deterministic, 1.0 = creative) |

---

### Factory Function

#### `createGroqProvider(id, config)`

Creates and returns a new `GroqProvider` instance.

```typescript
function createGroqProvider(
  id: string,
  config: GroqConfig
): GroqProvider
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique identifier for this provider instance |
| `config` | `GroqConfig` | Groq API configuration |

**Example:**

```typescript
import { createGroqProvider } from './providers/groq/index.js';

const groq = createGroqProvider('groq-1', {
  apiKey: process.env.GROQ_API_KEY!,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.5,
});
```

---

### Class: `GroqProvider`

Implements the [`Provider`](/home/runner/workspace/agent-gateway/src/providers/types.ts) interface.

#### Constructor

```typescript
new GroqProvider(id: string, config: GroqConfig)
```

Initializes the provider with the given configuration. Does **not** connect automatically -- call `connect()` separately (though `connect()` is a no-op for this provider).

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique provider identifier |
| `type` | `string` | Always `'groq'` |
| `name` | `string` | Always `'Groq'` |
| `config` | `GroqConfig` | The active configuration |

#### Methods

##### `connect()`

No-op connection method (Groq uses stateless HTTP, no persistent connection).

```typescript
async connect(): Promise<void>
```

Logs a connection message and resolves immediately.

##### `disconnect()`

No-op disconnection method.

```typescript
async disconnect(): Promise<void>
```

Logs a disconnection message and resolves immediately.

##### `chat(messages)`

Performs a chat completion without tool calling.

```typescript
async chat(messages: ChatMessage[]): Promise<ModelResponse>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `messages` | `ChatMessage[]` | Array of chat messages in the gateway's standard format |

**Returns:** A `ModelResponse` with the generated text.

**Behavior:**

1. Maps messages to Groq's OpenAI-compatible format.
2. POSTs to `/openai/v1/chat/completions`.
3. Extracts the first choice from the response.
4. Maps to the gateway's `ModelResponse` format.

**Request Format:**

```json
{
  "model": "llama-3.3-70b-versatile",
  "messages": [
    { "role": "system", "content": "You are helpful." },
    { "role": "user", "content": "What is Groq?" }
  ],
  "temperature": 0.7
}
```

**Response Format:**

```json
{
  "id": "chatcmpl-abc123",
  "object": "chat.completion",
  "created": 1704067200,
  "model": "llama-3.3-70b-versatile",
  "choices": [{
    "index": 0,
    "message": {
      "role": "assistant",
      "content": "Groq is an AI inference company..."
    },
    "finish_reason": "stop"
  }],
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 50,
    "total_tokens": 75
  }
}
```

**Mapped to ModelResponse:**

```typescript
{
  id: 'chatcmpl-abc123',
  content: 'Groq is an AI inference company...',
  model: 'llama-3.3-70b-versatile',
  finishReason: 'stop',
  usage: {
    promptTokens: 25,
    completionTokens: 50,
    totalTokens: 75,
  },
}
```

**Example:**

```typescript
const response = await groq.chat([
  { role: 'system', content: 'You are a helpful AI assistant.' },
  { role: 'user', content: 'Explain what makes Groq different from other AI providers.' },
]);

console.log(response.content);    // Generated text
console.log(response.usage?.totalTokens); // Token usage
console.log(response.model);      // Model used
```

---

##### `chatWithTools(messages, tools)`

Performs a chat completion with tool calling support.

```typescript
async chatWithTools(
  messages: ChatMessage[],
  tools: Tool[]
): Promise<ModelResponse>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `messages` | `ChatMessage[]` | Array of chat messages |
| `tools` | `Tool[]` | Array of tool definitions available to the model |

**Returns:** A `ModelResponse` that may contain `toolCalls` if the model decides to invoke tools.

**Tool Definition Format (Gateway):**

```typescript
interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
}
```

**Converted to Groq/OpenAI Tool Format:**

```json
{
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get weather for a city",
        "parameters": {
          "type": "object",
          "properties": {
            "city": { "type": "string", "description": "City name" }
          },
          "required": ["city"]
        }
      }
    }
  ]
}
```

**Full Request with Tools:**

```json
{
  "model": "llama-3.3-70b-versatile",
  "messages": [
    { "role": "user", "content": "What's the weather in Tokyo?" }
  ],
  "temperature": 0.7,
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "get_weather",
        "description": "Get current weather for a city",
        "parameters": {
          "type": "object",
          "properties": {
            "city": { "type": "string", "description": "City name" }
          },
          "required": ["city"]
        }
      }
    }
  ]
}
```

**Response with Tool Calls:**

```json
{
  "id": "chatcmpl-xyz789",
  "model": "llama-3.3-70b-versatile",
  "choices": [{
    "message": {
      "role": "assistant",
      "content": null,
      "tool_calls": [{
        "id": "call_abc123",
        "type": "function",
        "function": {
          "name": "get_weather",
          "arguments": "{\"city\":\"Tokyo\"}"
        }
      }]
    },
    "finish_reason": "tool_calls"
  }],
  "usage": {
    "prompt_tokens": 50,
    "completion_tokens": 30,
    "total_tokens": 80
  }
}
```

**Mapped to ModelResponse:**

```typescript
{
  id: 'chatcmpl-xyz789',
  content: '',
  model: 'llama-3.3-70b-versatile',
  finishReason: 'tool_calls',
  usage: {
    promptTokens: 50,
    completionTokens: 30,
    totalTokens: 80,
  },
  toolCalls: [
    {
      id: 'call_abc123',
      type: 'function',
      function: {
        name: 'get_weather',
        arguments: '{"city":"Tokyo"}',
      },
    },
  ],
}
```

**Example:**

```typescript
const response = await groq.chatWithTools(
  [
    { role: 'user', content: 'List files in /home/user/documents' },
  ],
  [
    {
      name: 'list_directory',
      description: 'List files in a directory',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path' },
        },
        required: ['path'],
      },
    },
  ]
);

if (response.toolCalls) {
  for (const call of response.toolCalls) {
    const args = JSON.parse(call.function.arguments);
    console.log(`Calling ${call.function.name} with path: ${args.path}`);
    // Execute the tool and send results back...
  }
}
```

---

### Events

The `GroqProvider` does not extend `EventEmitter` and does not emit events. It uses the infrastructure logger for logging.

---

## Available Models

Groq offers several models optimized for different use cases:

| Model ID | Context Window | Best For | Speed |
|----------|---------------|----------|-------|
| `llama-3.3-70b-versatile` | 128K | General purpose, complex reasoning | Very Fast |
| `llama-3.1-8b-instant` | 128K | Fast responses, simple tasks | Extremely Fast |
| `llama-3.2-90b-vision-preview` | 128K | Multimodal (vision) tasks | Fast |
| `llama-3.2-11b-vision-preview` | 128K | Multimodal (vision) tasks | Very Fast |
| `mixtral-8x7b-32768` | 32K | Multilingual, code generation | Very Fast |
| `gemma2-9b-it` | 8K | Lightweight tasks, summarization | Extremely Fast |
| `llama-3.1-70b-versatile` | 128K | Complex reasoning, tool use | Fast |
| `llama-3.1-8b-instant` | 8K | Ultra-fast simple queries | Extremely Fast |

The default model is `llama-3.3-70b-versatile`. Override with the `model` config option.

**Note:** Model availability changes frequently. Check [Groq's documentation](https://console.groq.com/docs/models) for the latest list.

---

## Authentication

The API key is passed in the `Authorization` header:

```
Authorization: Bearer gsk_abc123def456...
```

### Getting an API Key

1. Sign up at [Groq Console](https://console.groq.com/)
2. Navigate to **API Keys** in the left sidebar
3. Click **Create API Key**
4. Name your key and copy the value (it starts with `gsk_`)
5. Store it securely

Groq offers generous free-tier quotas, making it accessible for development and moderate production use.

---

## Configuration Examples

### Basic Setup

```typescript
const groq = createGroqProvider('groq-main', {
  apiKey: process.env.GROQ_API_KEY!,
});
```

### Fast Model for Low Latency

```typescript
const groq = createGroqProvider('groq-fast', {
  apiKey: process.env.GROQ_API_KEY!,
  model: 'llama-3.1-8b-instant',
  temperature: 0.3,
});
```

### Tool-Calling Optimized

```typescript
const groq = createGroqProvider('groq-tools', {
  apiKey: process.env.GROQ_API_KEY!,
  model: 'llama-3.3-70b-versatile',
  temperature: 0.1,
  maxTokens: 4096,
});
```

### Using a Custom Base URL (Proxy)

```typescript
const groq = createGroqProvider('groq-proxy', {
  apiKey: process.env.GROQ_API_KEY!,
  baseUrl: 'https://my-proxy.example.com/openai/v1',
});
```

### Full Configuration with Environment Variables

```typescript
const groq = createGroqProvider('groq-1', {
  apiKey: process.env.GROQ_API_KEY!,
  baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  maxTokens: process.env.GROQ_MAX_TOKENS
    ? parseInt(process.env.GROQ_MAX_TOKENS, 10)
    : undefined,
  temperature: process.env.GROQ_TEMPERATURE
    ? parseFloat(process.env.GROQ_TEMPERATURE)
    : 0.7,
});
```

---

## Integration Points

### With Provider Interface

The Groq provider implements the `Provider` interface from [`/home/runner/workspace/agent-gateway/src/providers/types.ts`](/home/runner/workspace/agent-gateway/src/providers/types.ts):

```typescript
interface Provider {
  id: string;
  type: string;         // 'groq'
  name: string;         // 'Groq'
  config: ProviderConfig;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  chat(messages: ChatMessage[]): Promise<ModelResponse>;
  chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse>;
}
```

### With Other Providers

The Groq provider is fully interchangeable with other OpenAI-compatible providers:
- [`/home/runner/workspace/agent-gateway/src/providers/openai/`](/home/runner/workspace/agent-gateway/src/providers/openai/)
- [`/home/runner/workspace/agent-gateway/src/providers/mistral/`](/home/runner/workspace/agent-gateway/src/providers/mistral/)
- [`/home/runner/workspace/agent-gateway/src/providers/deepseek/`](/home/runner/workspace/agent-gateway/src/providers/deepseek/)
- [`/home/runner/workspace/agent-gateway/src/providers/anthropic/`](/home/runner/workspace/agent-gateway/src/providers/anthropic/)
- [`/home/runner/workspace/agent-gateway/src/providers/cohere/`](/home/runner/workspace/agent-gateway/src/providers/cohere/)
- [`/home/runner/workspace/agent-gateway/src/providers/google/`](/home/runner/workspace/agent-gateway/src/providers/google/)
- [`/home/runner/workspace/agent-gateway/src/providers/ollama/`](/home/runner/workspace/agent-gateway/src/providers/ollama/)

### With Channels

Messages from any channel can be routed to Groq for fast inference:
- [`/home/runner/workspace/agent-gateway/src/channels/`](/home/runner/workspace/agent-gateway/src/channels/)

### With Marketplace

Groq can be configured as a plugin through the marketplace system:
- [`/home/runner/workspace/agent-gateway/src/marketplace/`](/home/runner/workspace/agent-gateway/src/marketplace/)

---

## Error Handling

| Scenario | HTTP Status | Behavior |
|----------|-------------|----------|
| Invalid API key | 401 | Throws `Groq API error: 401 - {"error":{"message":"Invalid API Key"}}` |
| Rate limited | 429 | Throws error with rate limit details |
| Model not found | 404 | Throws error with model details |
| Invalid request body | 400 | Throws error with validation details |
| Context length exceeded | 400 | Throws error with token count details |
| Server error | 5xx | Throws error with response body |
| Network error | -- | Throws the underlying network error |

All errors include the HTTP status code and the raw response body from the Groq API for debugging.

**Example error handling:**

```typescript
try {
  const response = await groq.chat([{ role: 'user', content: 'Hello' }]);
} catch (err) {
  if (err.message.includes('429')) {
    console.error('Rate limited. Wait and retry.');
  } else if (err.message.includes('401')) {
    console.error('Invalid API key. Check GROQ_API_KEY.');
  } else {
    console.error('Groq error:', err.message);
  }
}
```

---

## Groq API Specifics

### OpenAI Compatibility

Groq's API is designed to be a drop-in replacement for OpenAI's API:

| Feature | Groq Support |
|---------|-------------|
| `/chat/completions` endpoint | Yes |
| OpenAI message format | Yes |
| Tool/function calling | Yes |
| `stream: true` | Supported by API, but **not implemented** in this adapter |
| `response_format` (JSON mode) | Supported by API, but **not implemented** in this adapter |
| `seed` (reproducible outputs) | Supported by API, but **not exposed** in this adapter |

### Rate Limits

Groq enforces rate limits based on requests per minute (RPM) and tokens per minute (TPM):

| Tier | RPM | TPM |
|------|-----|-----|
| Free | 30 | 14,400 |
| Pay-as-you-go | 1,000+ | 500,000+ |

Limits vary by model. Check the [Groq console](https://console.groq.com/) for current limits.

### Token Usage

Groq provides detailed token usage in every response:

```json
{
  "usage": {
    "prompt_tokens": 25,
    "completion_tokens": 150,
    "total_tokens": 175
  }
}
```

This is mapped directly to the `ModelResponse.usage` field.

---

## Limitations

- **No streaming** -- The adapter uses the non-streaming `/chat/completions` endpoint. Groq's API supports streaming, but this adapter does not implement it.
- **No model listing** -- The provider does not support listing available models from the API.
- **No response_format** -- JSON mode / structured output is not exposed.
- **No top_p / stop sequences** -- These generation parameters from the base `ProviderConfig` are not implemented in this adapter.
- **No system message distinction** -- System messages are passed as-is but Groq models may handle them differently than OpenAI models.
- **No image input** -- While some Groq models support vision, this adapter does not pass image content.

---

## Performance Characteristics

Groq's LPU architecture offers significant speed advantages:

| Metric | Groq (Llama 3 70B) | Typical GPU (Llama 3 70B) |
|--------|--------------------|--------------------------|
| Time to first token | ~100ms | ~500ms - 2s |
| Token throughput | ~300 tokens/sec | ~30-60 tokens/sec |
| Latency (1000 token response) | ~3-4 seconds | ~15-30 seconds |

This makes Groq ideal for:
- **Real-time chat** -- Near-instant responses improve user experience.
- **Iterative tool calling** -- Fast round-trips for multi-step tool use.
- **High-throughput processing** -- Process many requests with lower queue times.

---

## Security Considerations

- **API key protection** -- The Groq API key is a sensitive credential (prefixed with `gsk_`). Store it in environment variables or a secrets manager.
- **HTTPS only** -- All Groq API requests use HTTPS. Never use HTTP in production.
- **Base URL override** -- When using a custom `baseUrl`, ensure the proxy is trusted and secures the API key in transit.
- **Data retention** -- Review Groq's data handling policy to understand how API requests are stored and used.

---

## Related Documentation

- [`/home/runner/workspace/agent-gateway/src/providers/`](/home/runner/workspace/agent-gateway/src/providers/) -- Parent providers module
- [`/home/runner/workspace/agent-gateway/src/providers/types.ts`](/home/runner/workspace/agent-gateway/src/providers/types.ts) -- Provider type definitions
- [Groq Console](https://console.groq.com/) -- API key management and dashboard
- [Groq API Documentation](https://console.groq.com/docs) -- Official API reference
- [Groq Models](https://console.groq.com/docs/models) -- Available models and capabilities
- [Groq Quickstart](https://console.groq.com/docs/quickstart) -- Getting started guide
