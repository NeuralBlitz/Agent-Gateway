# Cohere Provider (`src/providers/cohere/`)

> **Cohere AI provider adapter -- connects to Command and Command-R models with chat and tool calling support.**

---

## Overview

The `CohereProvider` class implements the `Provider` interface for Cohere's AI API. It supports Cohere's native chat endpoint (Command and Command-R model families) with both standard chat completion and tool-calling capabilities.

Cohere specializes in enterprise-grade language models optimized for RAG (Retrieval-Augmented Generation), tool use, and multilingual understanding. The Command-R and Command-R+ models are specifically designed for advanced tool calling and agentic workflows.

Key characteristics:

- **Cohere native API format** -- Unlike OpenAI-compatible providers, this adapter uses Cohere's own `/v1/chat` endpoint with its specific request/response format (`message`, `chat_history`, `tool_calls`).
- **Tool calling** -- Full support for Cohere's tool calling system with parameter definitions and structured tool call responses.
- **Message history as chat_history** -- Converts the gateway's `ChatMessage[]` format to Cohere's `chat_history` + `message` format.
- **Token billing metadata** -- Returns token usage from Cohere's `meta.billed_units` field.

---

## File Structure

```
cohere/
└── index.ts    # CohereProvider implementation with Cohere API v1 integration
```

---

## API Reference

### Types

#### `CohereConfig`

Configuration object passed to `createCohereProvider`.

```typescript
export interface CohereConfig {
  /** Cohere API key */
  apiKey: string;
  /** Custom API base URL */
  baseUrl?: string;
  /** Model identifier (e.g., 'command-r-plus', 'command-r', 'command') */
  model?: string;
  /** Maximum tokens in the response */
  maxTokens?: number;
  /** Sampling temperature (0.0 to 1.0) */
  temperature?: number;
}
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `apiKey` | Yes | -- | Cohere API key (from Cohere dashboard) |
| `baseUrl` | No | `'https://api.cohere.ai/v1'` | Custom API base URL (for proxies/testing) |
| `model` | No | `'command-r-plus'` | Model identifier |
| `maxTokens` | No | `4096` | Maximum tokens in the generated response |
| `temperature` | No | `0.7` | Sampling temperature (0.0 = deterministic, 1.0 = creative) |

---

### Factory Function

#### `createCohereProvider(id, config)`

Creates and returns a new `CohereProvider` instance.

```typescript
function createCohereProvider(
  id: string,
  config: CohereConfig
): CohereProvider
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique identifier for this provider instance |
| `config` | `CohereConfig` | Cohere API configuration |

**Example:**

```typescript
import { createCohereProvider } from './providers/cohere/index.js';

const cohere = createCohereProvider('cohere-1', {
  apiKey: process.env.COHERE_API_KEY!,
  model: 'command-r-plus',
  temperature: 0.5,
});
```

---

### Class: `CohereProvider`

Implements the [`Provider`](/home/runner/workspace/agent-gateway/src/providers/types.ts) interface.

#### Constructor

```typescript
new CohereProvider(id: string, config: CohereConfig)
```

Initializes the provider with the given configuration. Does **not** connect automatically -- call `connect()` separately (though `connect()` is a no-op for this provider).

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique provider identifier |
| `type` | `string` | Always `'cohere'` |
| `name` | `string` | Always `'Cohere'` |
| `config` | `CohereConfig` | The active configuration |

#### Methods

##### `connect()`

No-op connection method (Cohere uses stateless HTTP, no persistent connection).

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

1. Converts all messages except the last to Cohere's `chat_history` format:
   - `role: 'assistant'` becomes `role: 'CHATBOT'`
   - All other roles become `role: 'USER'`
2. The last message becomes the `message` field.
3. POSTs to `/v1/chat` with the formatted request.
4. Parses the response and maps to `ModelResponse`.

**Message Format Conversion:**

```typescript
// Gateway format:
[
  { role: 'system', content: 'You are helpful.' },
  { role: 'user', content: 'What is TypeScript?' },
  { role: 'assistant', content: 'TypeScript is...' },
  { role: 'user', content: 'Thanks!' },
]

// Converted to Cohere format:
{
  message: 'Thanks!',
  chat_history: [
    { role: 'USER', message: 'What is TypeScript?' },
    { role: 'CHATBOT', message: 'TypeScript is...' },
  ],
}
```

**Request Format:**

```json
{
  "model": "command-r-plus",
  "message": "What is TypeScript?",
  "chat_history": [
    { "role": "USER", "message": "Hello" },
    { "role": "CHATBOT", "message": "Hi there!" }
  ],
  "temperature": 0.7,
  "max_tokens": 4096
}
```

**Response Format:**

```json
{
  "generation_id": "gen-abc123",
  "text": "TypeScript is a typed superset...",
  "model": "command-r-plus",
  "finish_reason": "COMPLETE",
  "meta": {
    "billed_units": {
      "input_tokens": 25,
      "output_tokens": 150
    }
  }
}
```

**Mapped to ModelResponse:**

```typescript
{
  id: 'gen-abc123',
  content: 'TypeScript is a typed superset...',
  model: 'command-r-plus',
  finishReason: 'stop',  // 'COMPLETE' -> 'stop'
  usage: {
    promptTokens: 25,
    completionTokens: 150,
    totalTokens: 175,
  },
}
```

**Example:**

```typescript
const response = await cohere.chat([
  { role: 'system', content: 'You are a helpful coding assistant.' },
  { role: 'user', content: 'Explain the difference between interface and type in TypeScript.' },
]);

console.log(response.content);    // Generated text
console.log(response.usage?.totalTokens); // Token usage
console.log(response.finishReason);       // 'stop' or 'length'
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
  parameters: {
    properties: Record<string, any>;
    required?: string[];
    [key: string]: any;
  };
}
```

**Converted to Cohere Tool Format:**

```json
{
  "tools": [
    {
      "name": "get_weather",
      "description": "Get weather for a city",
      "parameter_definitions": {
        "city": {
          "description": "The city name",
          "type": "string",
          "required": true
        }
      }
    }
  ]
}
```

**Request with Tools:**

```json
{
  "model": "command-r-plus",
  "message": "What's the weather in Tokyo?",
  "chat_history": [],
  "temperature": 0.7,
  "max_tokens": 4096,
  "tools": [
    {
      "name": "get_weather",
      "description": "Get weather for a city",
      "parameter_definitions": {
        "city": {
          "description": "The city name",
          "type": "string",
          "required": true
        }
      }
    }
  ]
}
```

**Response with Tool Calls:**

```json
{
  "generation_id": "gen-xyz789",
  "text": "Let me check the weather for you.",
  "tool_calls": [
    {
      "name": "get_weather",
      "parameters": { "city": "Tokyo" }
    }
  ]
}
```

**Mapped to ModelResponse:**

```typescript
{
  id: 'gen-xyz789',
  content: 'Let me check the weather for you.',
  model: 'command-r-plus',
  finishReason: 'tool_calls',
  toolCalls: [
    {
      id: 'tc_0',
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
const response = await cohere.chatWithTools(
  [
    { role: 'user', content: 'What files are in /tmp?' },
  ],
  [
    {
      name: 'list_files',
      description: 'List files in a directory',
      parameters: {
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
    console.log(`Call tool: ${call.function.name}`);
    console.log(`Arguments: ${call.function.arguments}`);
  }
}
```

---

### Events

The `CohereProvider` does not extend `EventEmitter` and does not emit events. It uses the infrastructure logger for logging.

---

## Models

Cohere offers several models through this provider:

| Model | ID | Context | Best For |
|-------|-----|---------|----------|
| **Command R+** | `command-r-plus` | 128K | Best quality, advanced tool use, RAG |
| **Command R** | `command-r` | 128K | Fast tool use, cost-effective |
| **Command** | `command` | 4K | General text generation |
| **Command Light** | `command-light` | 4K | Faster, lower-cost generation |
| **Command R 03-2024** | `command-r-03-2024` | 128K | Latest Command R version |
| **Command R+ 04-2024** | `command-r-plus-04-2024` | 128K | Latest Command R+ version |

The default model is `command-r-plus`. Override with the `model` config option.

---

## Authentication

The API key is passed in the `Authorization` header:

```
Authorization: Bearer <your-cohere-api-key>
```

### Getting an API Key

1. Sign up at [Cohere Dashboard](https://dashboard.cohere.com/)
2. Navigate to **API Keys** in the left sidebar
3. Copy your API key (trial or production)
4. Store it securely (environment variable, secrets manager)

---

## Configuration Examples

### Basic Setup

```typescript
const cohere = createCohereProvider('cohere-main', {
  apiKey: process.env.COHERE_API_KEY!,
});
```

### Custom Model and Temperature

```typescript
const cohere = createCohereProvider('cohere-fast', {
  apiKey: process.env.COHERE_API_KEY!,
  model: 'command-r',
  temperature: 0.3,
  maxTokens: 2048,
});
```

### Using a Proxy/Custom Base URL

```typescript
const cohere = createCohereProvider('cohere-proxy', {
  apiKey: process.env.COHERE_API_KEY!,
  baseUrl: 'https://my-proxy.example.com/v1',
});
```

### Full Configuration with All Options

```typescript
const cohere = createCohereProvider('cohere-1', {
  apiKey: process.env.COHERE_API_KEY!,
  baseUrl: process.env.COHERE_BASE_URL || 'https://api.cohere.ai/v1',
  model: process.env.COHERE_MODEL || 'command-r-plus',
  maxTokens: parseInt(process.env.COHERE_MAX_TOKENS || '4096', 10),
  temperature: parseFloat(process.env.COHERE_TEMPERATURE || '0.7'),
});
```

---

## Integration Points

### With Provider Interface

The Cohere provider implements the `Provider` interface from [`/home/runner/workspace/agent-gateway/src/providers/types.ts`](/home/runner/workspace/agent-gateway/src/providers/types.ts):

```typescript
interface Provider {
  id: string;
  type: string;         // 'cohere'
  name: string;         // 'Cohere'
  config: ProviderConfig;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  chat(messages: ChatMessage[]): Promise<ModelResponse>;
  chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse>;
}
```

### With Other Providers

The Cohere provider can be used interchangeably with other providers in the gateway:
- [`/home/runner/workspace/agent-gateway/src/providers/openai/`](/home/runner/workspace/agent-gateway/src/providers/openai/)
- [`/home/runner/workspace/agent-gateway/src/providers/anthropic/`](/home/runner/workspace/agent-gateway/src/providers/anthropic/)
- [`/home/runner/workspace/agent-gateway/src/providers/google/`](/home/runner/workspace/agent-gateway/src/providers/google/)
- [`/home/runner/workspace/agent-gateway/src/providers/groq/`](/home/runner/workspace/agent-gateway/src/providers/groq/)
- [`/home/runner/workspace/agent-gateway/src/providers/mistral/`](/home/runner/workspace/agent-gateway/src/providers/mistral/)
- [`/home/runner/workspace/agent-gateway/src/providers/deepseek/`](/home/runner/workspace/agent-gateway/src/providers/deepseek/)
- [`/home/runner/workspace/agent-gateway/src/providers/ollama/`](/home/runner/workspace/agent-gateway/src/providers/ollama/)

### With Channels

Messages from any channel (Discord, Slack, Teams, IRC, etc.) can be routed to the Cohere provider:
- [`/home/runner/workspace/agent-gateway/src/channels/`](/home/runner/workspace/agent-gateway/src/channels/)

### With Marketplace

The Cohere provider can be packaged and distributed as a plugin through the marketplace:
- [`/home/runner/workspace/agent-gateway/src/marketplace/`](/home/runner/workspace/agent-gateway/src/marketplace/)

---

## Error Handling

| Scenario | HTTP Status | Behavior |
|----------|-------------|----------|
| Invalid API key | 401 | Throws `Cohere API error: 401 - {"message":"invalid api key"}` |
| Rate limited | 429 | Throws error with rate limit details |
| Model not found | 4xx | Throws error with model details |
| Token limit exceeded | 4xx | Throws error with token count details |
| Server error | 5xx | Throws error with response body |
| Network error | -- | Throws the underlying network error |

All errors include the HTTP status code and the raw response body from the Cohere API for debugging.

---

## Cohere API Specifics

### Message Role Mapping

Cohere's API uses different role names than the standard OpenAI format:

| Gateway Role | Cohere Role |
|--------------|-------------|
| `system` | (passed in `chat_history` as `USER` or `CHATBOT`) |
| `user` | `USER` |
| `assistant` | `CHATBOT` |

Note: System messages are not a distinct role in Cohere's chat endpoint. They are typically prepended to the conversation history or included in the message context.

### Finish Reason Mapping

| Cohere `finish_reason` | Gateway `finishReason` |
|------------------------|----------------------|
| `COMPLETE` | `stop` |
| `MAX_TOKENS` | `length` |
| `ERROR` | (error thrown) |

### Tool Call ID Generation

Cohere's API does not return explicit tool call IDs. This adapter generates sequential IDs in the format `tc_0`, `tc_1`, etc., based on the index in the `tool_calls` array.

---

## Limitations

- **No streaming** -- The adapter uses the non-streaming `/v1/chat` endpoint. Streaming responses are not supported.
- **No model listing** -- The provider does not support listing available models from the API.
- **System messages** -- Cohere's chat endpoint does not have a native `system` role; system prompts should be included in the user message or conversation context.
- **No vision support** -- Cohere Command models do not support image inputs.
- **No native retooling** -- After tool execution results, the caller must manage the conversation history manually to continue the tool-use loop.

---

## Security Considerations

- **API key protection** -- The Cohere API key is a sensitive credential. Store it in environment variables or a secrets manager, never in source code.
- **Data privacy** -- Cohere may log API requests for debugging. Review Cohere's data handling policy for sensitive data.
- **Base URL override** -- When using a custom `baseUrl`, ensure the proxy is trusted and secures the API key in transit.

---

## Related Documentation

- [`/home/runner/workspace/agent-gateway/src/providers/`](/home/runner/workspace/agent-gateway/src/providers/) -- Parent providers module
- [`/home/runner/workspace/agent-gateway/src/providers/types.ts`](/home/runner/workspace/agent-gateway/src/providers/types.ts) -- Provider type definitions
- [Cohere API Reference](https://docs.cohere.com/reference/chat) -- Official Cohere chat API docs
- [Cohere Tool Calling Guide](https://docs.cohere.com/docs/tool-use) -- Tool use documentation
- [Cohere Dashboard](https://dashboard.cohere.com/) -- API key management
- [Command R+ Model Card](https://docs.cohere.com/docs/command-r-plus) -- Model details and capabilities
