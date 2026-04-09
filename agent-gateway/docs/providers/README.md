# Provider Documentation

> **AI model provider adapters for Agent Gateway**

This document provides comprehensive documentation for all AI model provider adapters supported by Agent Gateway. Each provider adapter translates platform-specific AI APIs into the unified `Provider` interface used by the agent layer, enabling consistent tool-calling and chat capabilities regardless of the underlying model.

---

## Table of Contents

- [Overview](#overview)
- [Provider Interface](#provider-interface)
- [Provider Registry](#provider-registry)
- [Supported Providers](#supported-providers)
- [OpenAI Provider](#openai-provider)
- [Anthropic Provider](#anthropic-provider)
- [Google Provider](#google-provider)
- [Mistral Provider](#mistral-provider)
- [DeepSeek Provider](#deepseek-provider)
- [Ollama Provider](#ollama-provider)
- [Provider Factory](#provider-factory)
- [Adding Custom Providers](#adding-custom-providers)
- [Tool-Calling Support](#tool-calling-support)
- [Streaming Responses](#streaming-responses)
- [Model Listing](#model-listing)
- [Provider Comparison](#provider-comparison)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Failover Configuration](#failover-configuration)
- [Performance Tuning](#performance-tuning)
- [Testing Providers](#testing-providers)
- [Troubleshooting](#troubleshooting)

---

## Overview

Location: `/home/runner/workspace/agent-gateway/src/providers/`

Providers are the interface between the agent layer and external AI model APIs. Each provider adapter handles:

- API authentication and connection management
- Chat completion requests with provider-specific message formats
- Tool-calling with provider-specific tool definition schemas
- Streaming response parsing
- Model listing and availability checks
- Error handling and retry logic

All providers implement the standard `Provider` interface, ensuring consistent behavior across different AI backends.

---

## Provider Interface

```typescript
interface Provider {
  /** Unique provider identifier */
  id: string;

  /** Provider type (openai, anthropic, etc.) */
  type: string;

  /** Human-readable name */
  name: string;

  /** Provider-specific configuration */
  config: ProviderConfig;

  /** Establish connection to the provider API */
  connect(): Promise<void>;

  /** Disconnect from the provider API */
  disconnect(): Promise<void>;

  /** Send a chat request without tools */
  chat(messages: ChatMessage[], options?: any): Promise<ModelResponse>;

  /** Send a chat request with tool definitions */
  chatWithTools(
    messages: ChatMessage[],
    tools: Tool[],
    options?: any
  ): Promise<ModelResponse>;
}
```

### ChatMessage Format

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}
```

### ModelResponse Format

```typescript
interface ModelResponse {
  id: string;
  content?: string;
  model: string;
  finishReason: 'stop' | 'tool_calls' | 'length' | 'error';
  tool_calls?: ToolCall[];
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
```

---

## Provider Registry

Providers are registered through `registerBuiltinProviders()`:

```typescript
import { registerBuiltinProviders } from '/home/runner/workspace/agent-gateway/src/providers/index.js';

registerBuiltinProviders();
// Registers: openai, anthropic, google, mistral, deepseek, ollama
```

Individual providers can be created via the factory:

```typescript
import { createProvider } from './providers/index.js';

const openai = createProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
});
```

---

## Supported Providers

| Provider | Type | Status | API Compatibility | Tool-Calling |
|----------|------|--------|-------------------|--------------|
| **OpenAI** | `openai` | Built-in | Chat Completions | Yes |
| **Anthropic** | `anthropic` | Built-in | Messages API | Yes |
| **Google** | `google` | Built-in | Gemini generateContent | Yes |
| **Mistral** | `mistral` | Built-in | OpenAI-compatible | Yes |
| **DeepSeek** | `deepseek` | Built-in | OpenAI-compatible | Yes |
| **Ollama** | `ollama` | Built-in | Local `/api/chat` | Yes |

---

## OpenAI Provider

**Implementation**: `/home/runner/workspace/agent-gateway/src/providers/openai/`

### Configuration

```jsonc
{
  "providers": {
    "openai": {
      "apiKey": "sk-your-openai-key",
      "model": "gpt-4o",
      "baseUrl": "https://api.openai.com/v1"
    }
  }
}
```

### Environment Variable

```bash
export OPENAI_API_KEY="sk-..."
```

### Supported Models

| Model | Tool-Calling | Context Window | Notes |
|-------|--------------|----------------|-------|
| `gpt-4o` | Yes | 128K | Recommended default |
| `gpt-4o-mini` | Yes | 128K | Faster, cheaper |
| `o1` | Limited | 128K | Reasoning model |
| `o3-mini` | Limited | 128K | Compact reasoning |

### Tool-Calling Format

OpenAI uses the standard Chat Completions tool format:

```json
{
  "tools": [{
    "type": "function",
    "function": {
      "name": "getWeather",
      "description": "Get weather for a city",
      "parameters": {
        "type": "object",
        "properties": {
          "city": { "type": "string" }
        },
        "required": ["city"]
      }
    }
  }]
}
```

### Streaming

OpenAI supports streaming via SSE. The provider parses `data: {"choices":[{"delta":{"content":"Hello"}}]}` format.

---

## Anthropic Provider

**Implementation**: `/home/runner/workspace/agent-gateway/src/providers/anthropic/`

### Configuration

```jsonc
{
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-your-key",
      "model": "claude-sonnet-4-20250514",
      "maxTokens": 4096
    }
  }
}
```

### Environment Variable

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### Supported Models

| Model | Tool-Calling | Context Window | Notes |
|-------|--------------|----------------|-------|
| `claude-sonnet-4-20250514` | Yes | 200K | Recommended default |
| `claude-opus-4-20250514` | Yes | 200K | Most capable |
| `claude-haiku-4-20250514` | Yes | 200K | Fast, cost-effective |

### Tool-Calling Format

Anthropic uses `tool_use` and `tool_result` content blocks:

```json
{
  "tools": [{
    "name": "getWeather",
    "description": "Get weather for a city",
    "input_schema": {
      "type": "object",
      "properties": { "city": { "type": "string" } },
      "required": ["city"]
    }
  }]
}
```

Response includes `tool_use` blocks:

```json
{
  "content": [
    {
      "type": "tool_use",
      "id": "toolu_01abc",
      "name": "getWeather",
      "input": { "city": "London" }
    }
  ]
}
```

### Streaming

Anthropic streaming uses SSE with `message_delta` events containing partial content and `tool_use` blocks.

---

## Google Provider

**Implementation**: `/home/runner/workspace/agent-gateway/src/providers/google/`

### Configuration

```jsonc
{
  "providers": {
    "google": {
      "apiKey": "your-google-key",
      "model": "gemini-2.0-flash"
    }
  }
}
```

### Environment Variable

```bash
export GOOGLE_API_KEY="..."
```

### Supported Models

| Model | Tool-Calling | Context Window | Notes |
|-------|--------------|----------------|-------|
| `gemini-2.0-flash` | Yes | 1M | Recommended default |
| `gemini-2.5-pro` | Yes | 1M | Most capable |

### Tool-Calling Format

Google uses `functionCalling` in generateContent:

```json
{
  "tools": [{
    "functionDeclarations": [{
      "name": "getWeather",
      "description": "Get weather for a city",
      "parameters": {
        "type": "OBJECT",
        "properties": { "city": { "type": "STRING" } },
        "required": ["city"]
      }
    }]
  }]
}
```

---

## Mistral Provider

**Implementation**: `/home/runner/workspace/agent-gateway/src/providers/mistral/`

### Configuration

```jsonc
{
  "providers": {
    "mistral": {
      "apiKey": "your-mistral-key",
      "model": "mistral-large-latest"
    }
  }
}
```

### Environment Variable

```bash
export MISTRAL_API_KEY="..."
```

### API Compatibility

Mistral implements an OpenAI-compatible API, so the provider internally reuses the OpenAI adapter logic with a different base URL (`https://api.mistral.ai/v1`).

### Supported Models

| Model | Tool-Calling | Context Window |
|-------|--------------|----------------|
| `mistral-large-latest` | Yes | 128K |
| `mistral-small-latest` | Yes | 32K |

---

## DeepSeek Provider

**Implementation**: `/home/runner/workspace/agent-gateway/src/providers/deepseek/`

### Configuration

```jsonc
{
  "providers": {
    "deepseek": {
      "apiKey": "your-deepseek-key",
      "model": "deepseek-chat"
    }
  }
}
```

### Environment Variable

```bash
export DEEPSEEK_API_KEY="..."
```

### API Compatibility

DeepSeek also implements an OpenAI-compatible API. The provider uses the same adapter pattern as Mistral with `https://api.deepseek.com/v1` as the base URL.

### Supported Models

| Model | Tool-Calling | Context Window | Notes |
|-------|--------------|----------------|-------|
| `deepseek-chat` | Yes | 64K | Chat model |
| `deepseek-reasoner` | Limited | 64K | Reasoning model |

---

## Ollama Provider

**Implementation**: `/home/runner/workspace/agent-gateway/src/providers/ollama/`

### Configuration

```jsonc
{
  "providers": {
    "ollama": {
      "baseUrl": "http://localhost:11434",
      "model": "llama3"
    }
  }
}
```

### Setup

1. Install Ollama: `curl -fsSL https://ollama.com/install.sh | sh`
2. Pull a model: `ollama pull llama3`
3. Start Ollama: `ollama serve`
4. Configure the provider with the local URL

### Features

| Feature | Supported | Notes |
|---------|-----------|-------|
| Chat | Yes | Via `/api/chat` endpoint |
| Tool-calling | Yes | Supported by most models |
| Model listing | Yes | Via `/api/tags` |
| Model pull | Yes | Automatic download |
| Model delete | Yes | Via API |
| Streaming | Yes | NDJSON streaming |

### Advantages

- **No API key required**: Self-hosted, no usage limits
- **Privacy**: All processing happens locally
- **Cost**: Free (hardware cost only)
- **Model variety**: Hundreds of models available

### Limitations

- **Hardware requirements**: GPU recommended for good performance
- **Model quality**: Generally behind proprietary models
- **Tool-calling**: Varies by model; not all models support it

---

## Provider Factory

```typescript
import { createProvider } from '/home/runner/workspace/agent-gateway/src/providers/index.js';

const provider = createProvider('openai', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
});

await provider.connect();
const response = await provider.chat([
  { role: 'user', content: 'Hello!' }
]);
```

---

## Adding Custom Providers

1. **Implement the `Provider` interface**:

```typescript
import { BaseProvider } from 'agent-gateway/plugin-sdk';

export class MyProvider extends BaseProvider {
  async connect(): Promise<void> {
    // Initialize connection
  }

  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    // Call your API
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse> {
    // Call with tool definitions
  }
}
```

2. **Package as a plugin** with a manifest
3. **Install** via `agent-gateway plugins install`
4. **Configure** in `agent-gateway.config.json`

---

## Tool-Calling Support

All built-in providers support tool-calling, which is essential for the agent workflow:

### How Tool-Calling Works

1. Agent sends messages + tool definitions to provider
2. Provider returns a response with `tool_calls` (if the model decides to use tools)
3. Agent executes tools and sends results back
4. Provider processes tool results and generates final response

### Tool Schema Translation

Each provider translates the internal tool schema to its native format:

| Provider | Schema Format |
|----------|--------------|
| OpenAI | `tools[].function.{name,description,parameters}` |
| Anthropic | `tools[].{name,description,input_schema}` |
| Google | `tools[].functionDeclarations[].{name,description,parameters}` |
| Mistral | Same as OpenAI |
| DeepSeek | Same as OpenAI |
| Ollama | Varies by model |

---

## Streaming Responses

All providers support streaming token-by-token responses:

### Stream Callback Pattern

```typescript
import { streamToCallback } from '/home/runner/workspace/agent-gateway/src/streaming/index.js';

await provider.chat(messages, {
  stream: true,
  onToken: (token) => process.stdout.write(token),
});
```

### Stream-to-String Pattern

```typescript
import { streamToString } from '/home/runner/workspace/agent-gateway/src/streaming/index.js';

const fullResponse = await streamToString(provider, messages);
```

---

## Model Listing

All providers support listing available models:

```typescript
const models = await provider.listModels?.();
// ['gpt-4o', 'gpt-4o-mini', 'o1', ...]
```

Ollama additionally supports model management:

```typescript
await provider.pullModel?.('llama3');
await provider.deleteModel?.('old-model');
```

---

## Provider Comparison

| Feature | OpenAI | Anthropic | Google | Mistral | DeepSeek | Ollama |
|---------|--------|-----------|--------|---------|----------|--------|
| **Tool-Calling** | Excellent | Excellent | Good | Good | Good | Model-dependent |
| **Context Window** | 128K | 200K | 1M | 128K | 64K | Varies |
| **Streaming** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Pricing** | Pay-per-token | Pay-per-token | Pay-per-token | Pay-per-token | Pay-per-token | Free (self-hosted) |
| **API Stability** | High | High | Medium | Medium | Medium | Varies |
| **Response Quality** | Excellent | Excellent | Very Good | Good | Good | Good |

---

## Error Handling

### Common Provider Errors

| Error | Causes | Resolution |
|-------|--------|------------|
| `INVALID_API_KEY` | Wrong or expired key | Regenerate API key |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Implement backoff, use failover |
| `MODEL_NOT_FOUND` | Invalid model name | Check available models |
| `CONTEXT_TOO_LONG` | Messages exceed context window | Use context truncation strategy |
| `PROVIDER_UNAVAILABLE` | Service outage | Use failover provider |

### Provider Error Classes

```typescript
import { ProviderError } from '/home/runner/workspace/agent-gateway/src/infra/index.js';

// Thrown when provider API returns an error
class ProviderError extends GatewayError {
  constructor(message: string, public providerId: string, public statusCode?: number);
}
```

---

## Rate Limiting

### Provider-Specific Limits

| Provider | RPM (Free) | RPM (Paid) | TPM |
|----------|------------|------------|-----|
| OpenAI | 3-600 | 500-50K | Varies |
| Anthropic | 5-50 | 50-1000 | Varies |
| Google | 15-60 | 360-1000 | Varies |
| Mistral | 10 | 100 | Varies |
| DeepSeek | 10 | 100 | Varies |

### Configuring Rate Limits

```jsonc
{
  "rateLimit": {
    "perProvider": {
      "openai": { "points": 50, "duration": 60 },
      "anthropic": { "points": 10, "duration": 60 }
    }
  }
}
```

---

## Failover Configuration

Configure automatic failover between providers:

```typescript
import { FailoverProvider, createFailoverProvider }
  from '/home/runner/workspace/agent-gateway/src/failover/index.js';

const failover = createFailoverProvider({
  primary: createProvider('openai', { apiKey: process.env.OPENAI_API_KEY }),
  fallbacks: [
    createProvider('anthropic', { apiKey: process.env.ANTHROPIC_API_KEY }),
    createProvider('google', { apiKey: process.env.GOOGLE_API_KEY }),
  ],
  fallbackOn: ['rate_limit', 'timeout', 'error'],
});
```

---

## Performance Tuning

### Connection Pooling

Most providers benefit from connection reuse. The gateway maintains persistent HTTP connections through `undici`.

### Request Batching

When multiple independent requests are needed, use parallel execution:

```typescript
const results = await Promise.all([
  provider.chat(messages1),
  provider.chat(messages2),
]);
```

### Context Window Optimization

- Use `contextStrategy: "truncate"` to automatically truncate old messages
- Set `maxMessages` in session config to limit history
- Use token estimation to maximize context utilization

---

## Testing Providers

```bash
cd /home/runner/workspace/agent-gateway

# Run provider tests
npm run test -- providers

# Run specific provider test
npm run test -- openai.test.ts
```

Tests cover:
- Provider creation and connection
- Chat completion
- Tool-calling roundtrip
- Streaming responses
- Error handling
- Model listing

---

## Troubleshooting

### "Invalid API Key"

Verify the key format:
- OpenAI keys start with `sk-`
- Anthropic keys start with `sk-ant-`
- Google keys are alphanumeric strings

### "Rate Limit Exceeded"

1. Implement exponential backoff
2. Use failover providers
3. Reduce request frequency
4. Contact provider support for limit increases

### "Context Too Long"

1. Use `contextStrategy: "truncate"` in agent config
2. Reduce `maxMessages` in session config
3. Use a model with a larger context window
4. Implement summarization of old messages

### "Model Not Found"

1. Check the model name in the provider's documentation
2. List available models via the API
3. Verify the model is available in your tier/region
