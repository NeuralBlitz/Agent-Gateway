# Providers (`src/providers/`)

> **AI provider adapters — connect to OpenAI, Anthropic, Google, Mistral, DeepSeek, and Ollama.**

---

## Overview

The `providers/` module provides six AI provider adapters, each implementing a common `Provider` interface. These adapters are the bridge between Agent Gateway's agent loop and the various AI model APIs.

Each provider handles API-specific authentication, request formatting, response parsing, and tool-calling protocol differences — normalizing everything into a unified `ModelResponse` format that the agent can work with regardless of which provider is behind the scenes.

---

## File Structure

```
providers/
├── index.ts       # Barrel export + registerBuiltinProviders()
├── types.ts       # Provider, ChatMessage, ToolCall, Tool, ModelResponse, ModelInfo
├── factory.ts     # createProvider() switch factory
├── openai/        # OpenAI Chat Completions API
│   └── index.ts
├── anthropic/     # Anthropic Messages API
│   └── index.ts
├── google/        # Google Gemini generateContent API
│   └── index.ts
├── mistral/       # Mistral AI (OpenAI-compatible API)
│   └── index.ts
├── deepseek/      # DeepSeek (OpenAI-compatible API)
│   └── index.ts
└── ollama/        # Ollama local API (/api/chat)
    └── index.ts
```

---

## Core Types

### `Provider` Interface

Every provider implements this interface:

```typescript
interface Provider {
  /** Unique identifier for this provider */
  id: string;

  /** Provider type identifier */
  type: string;

  /** Simple text completion */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ModelResponse>;

  /** Text completion with tool-calling support */
  chatWithTools?(
    messages: ChatMessage[],
    tools: Tool[],
    options?: ChatOptions
  ): Promise<ModelResponseWithTools>;

  /** Streaming text completion */
  chatStream?(
    messages: ChatMessage[],
    options?: ChatOptions
  ): AsyncGenerator<string>;

  /** Streaming with tool-calling support */
  chatStreamWithTools?(
    messages: ChatMessage[],
    tools: Tool[],
    options?: ChatOptions
  ): AsyncGenerator<string | ToolCall>;

  /** List available models */
  listModels?(): Promise<ModelInfo[]>;
}
```

### `ChatMessage`

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;       // For tool results
  tool_calls?: ToolCall[];  // For assistant messages with tool calls
  tool_call_id?: string;    // For tool result messages
}
```

### `ToolCall`

```typescript
interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;  // JSON string of arguments
  };
}
```

### `Tool`

```typescript
interface Tool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: object;  // JSON Schema
  };
}
```

### `ModelResponse`

```typescript
interface ModelResponse {
  content: string;
  role: string;
  model?: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason?: string;
}
```

### `ModelResponseWithTools`

```typescript
interface ModelResponseWithTools extends ModelResponse {
  tool_calls?: ToolCall[];
}
```

### `ModelInfo`

```typescript
interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  pricing?: {
    input: number;   // per 1K tokens
    output: number;  // per 1K tokens
  };
}
```

---

## Provider Registry

### `registerBuiltinProviders(gateway, config)`

Lazy-loads and registers all built-in provider adapters:

```typescript
export function registerBuiltinProviders(gateway: Gateway, config: GatewayConfig): void {
  if (config.providers.openai?.apiKey) {
    const provider = createProvider('openai', config.providers.openai);
    gateway.registerProvider('openai', provider);
  }
  // Anthropic, Google, Mistral, DeepSeek, Ollama...
  // Each only registered if credentials are present
}
```

Providers are **lazy-loaded** — the adapter module is only imported when configured. This keeps startup fast when using a single provider.

---

## The `createProvider()` Factory

```typescript
function createProvider(type: string, config: ProviderConfig): Provider
```

A switch factory that instantiates the correct provider:

```typescript
switch (type) {
  case 'openai':
    return new OpenAIProvider(config);
  case 'anthropic':
    return new AnthropicProvider(config);
  case 'google':
    return new GoogleProvider(config);
  case 'mistral':
    return new MistralProvider(config);
  case 'deepseek':
    return new DeepSeekProvider(config);
  case 'ollama':
    return new OllamaProvider(config);
  default:
    throw new Error(`Unknown provider type: ${type}`);
}
```

---

## Provider Comparison

| Feature | OpenAI | Anthropic | Google | Mistral | DeepSeek | Ollama |
|---------|--------|-----------|--------|---------|----------|--------|
| **API Type** | Chat Completions | Messages | Gemini | OpenAI-compatible | OpenAI-compatible | Local `/api/chat` |
| **Tool Calling** | ✅ function calling | ✅ tool_use blocks | ✅ functionCalling | ✅ | ✅ | ✅ |
| **Streaming** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Model Listing** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Local/Offline** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Model Management** | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ pull/delete |
| **Auth** | API key | API key | API key | API key | API key | None (local) |

---

## Adding a Custom Provider

To implement a new provider:

### 1. Create the adapter file
```typescript
// src/providers/myprovider/index.ts
import { Provider, ChatMessage, Tool, ModelResponse, ModelResponseWithTools } from '../types';

export class MyProvider implements Provider {
  id = 'myprovider';
  type = 'myprovider';

  constructor(private config: MyProviderConfig) {}

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ModelResponse> {
    // Call your AI provider's API
    const response = await fetch('https://api.myprovider.com/v1/chat', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages, model: this.config.model }),
    });
    const data = await response.json();

    // Parse and return normalized response
    return {
      content: data.choices[0].message.content,
      role: 'assistant',
      model: data.model,
      usage: data.usage,
    };
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponseWithTools> {
    // Similar to chat() but include tool definitions and parse tool_calls
    // ...
  }

  async listModels(): Promise<ModelInfo[]> {
    // Return available models
    return [{ id: 'my-model', name: 'My Model', contextWindow: 8192, maxTokens: 4096 }];
  }
}
```

### 2. Register in factory and `registerBuiltinProviders()`

---

## Tool-Calling Protocol Differences

Each provider has a different tool-calling format:

### OpenAI
```json
{
  "choices": [{
    "message": {
      "tool_calls": [{
        "id": "call_abc",
        "type": "function",
        "function": { "name": "bash", "arguments": "{\"cmd\":\"ls\"}" }
      }]
    }
  }]
}
```

### Anthropic
```json
{
  "content": [
    { "type": "text", "text": "Let me check..." },
    {
      "type": "tool_use",
      "id": "tool_abc",
      "name": "bash",
      "input": { "cmd": "ls" }
    }
  ]
}
```

### Google
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "functionCall": { "name": "bash", "args": { "cmd": "ls" } }
      }]
    }
  }]
}
```

The provider adapters normalize these into the common `ToolCall` format.

---

## Error Handling

All providers follow consistent error handling:

| Error Type | Behavior |
|------------|----------|
| Invalid API key | Logged at error level, provider marked as inactive |
| Rate limit (429) | Waits `Retry-After`, retries with exponential backoff |
| Model not found | Error thrown, logged at error level |
| Context window exceeded | Error thrown, agent handles via context strategy |
| Network error | Error thrown, retries with exponential backoff |
| API downtime | Error thrown, failover provider can route to backup |

---

## Provider-Specific Configuration

### OpenAI
```json
{
  "providers": {
    "openai": {
      "apiKey": "sk-...",
      "model": "gpt-4o",
      "baseUrl": "https://api.openai.com/v1"  // Optional custom URL
    }
  }
}
```

### Anthropic
```json
{
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-...",
      "model": "claude-sonnet-4-20250514"
    }
  }
}
```

### Google
```json
{
  "providers": {
    "google": {
      "apiKey": "AIza...",
      "model": "gemini-2.0-flash"
    }
  }
}
```

### Ollama
```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434",
      "model": "llama3"
    }
  }
}
```

---

## Related Documentation

- [`gateway/`](../gateway/README.md) — Gateway where providers are registered
- [`agents/`](../agents/README.md) — Agent that calls provider methods
- [`channels/`](../channels/README.md) — The other side of the message pipeline
- [`failover/`](../failover/README.md) — Provider fallback and load balancing
- [`streaming/`](../streaming/README.md) — SSE streaming with provider responses
- [`observability/`](../observability/README.md) — Metrics for provider API calls
- [`cache/`](../cache/README.md) — Response caching for provider calls
