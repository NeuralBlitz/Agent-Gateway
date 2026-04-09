# Providers Overview

Agent Gateway supports multiple AI providers. This document covers each provider's features and configuration.

## Supported Providers

| Provider | Status | Models | Tools | Vision |
|----------|--------|--------|-------|--------|
| OpenAI | ✅ Stable | GPT-4o, GPT-4, GPT-3.5 | ✅ | ✅ |
| Anthropic | ✅ Stable | Claude 4, Claude 3 | ✅ | ✅ |
| Google | ✅ Stable | Gemini 2.0, Gemini 1.5 | ✅ | ✅ |
| Mistral | ✅ Stable | Mistral Large, Small | ✅ | ✅ |
| DeepSeek | ✅ Stable | DeepSeek Chat, Coder | ✅ | ❌ |
| Ollama | ✅ Stable | Llama 3, Mistral, etc. | ⚠️ | ⚠️ |

## OpenAI

### Installation

No additional packages required.

### Configuration

```json
{
  "type": "openai",
  "name": "gpt-4",
  "enabled": true,
  "settings": {
    "apiKey": "sk-...",
    "model": "gpt-4o",
    "maxTokens": 4096,
    "temperature": 0.7,
    "topP": 1.0,
    "baseUrl": "https://api.openai.com/v1"
  }
}
```

### Features

- **Chat Completion**: Standard chat interface
- **Function Calling**: Tool execution
- **Vision**: Image understanding
- **Streaming**: Real-time responses
- **Models**: GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo

### Usage

```typescript
import { createProvider } from 'agent-gateway/providers';

const openai = createProvider('openai', 'gpt-4', {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o',
  temperature: 0.7
});

await openai.connect();

// Simple chat
const response = await openai.chat([
  { role: 'user', content: 'Hello!' }
]);

console.log(response.content);

// With tools
const toolsResponse = await openai.chatWithTools(
  [
    { role: 'user', content: 'What is the weather?' }
  ],
  [
    {
      name: 'get_weather',
      description: 'Get weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' }
        },
        required: ['location']
      }
    }
  ]
);

// Handle tool calls
if (toolsResponse.toolCalls) {
  for (const toolCall of toolsResponse.toolCalls) {
    console.log(`Call ${toolCall.function.name}:`, JSON.parse(toolCall.function.arguments));
  }
}
```

### Available Models

- `gpt-4o` - GPT-4 Omni (latest, fastest)
- `gpt-4o-mini` - Smaller, faster GPT-4
- `gpt-4-turbo` - GPT-4 Turbo
- `gpt-4` - GPT-4
- `gpt-3.5-turbo` - GPT-3.5 Turbo

## Anthropic

### Configuration

```json
{
  "type": "anthropic",
  "name": "claude-4",
  "enabled": true,
  "settings": {
    "apiKey": "sk-ant-...",
    "model": "claude-sonnet-4-20250514",
    "maxTokens": 4096,
    "temperature": 0.7,
    "baseUrl": "https://api.anthropic.com/v1"
  }
}
```

### Features

- **Chat Completion**: Standard chat interface
- **Tool Calling**: Claude tools
- **Vision**: Image understanding
- **Models**: Claude 4 Opus, Sonnet, Haiku

### Usage

```typescript
import { createProvider } from 'agent-gateway/providers';

const anthropic = createProvider('anthropic', 'claude-4', {
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-sonnet-4-20250514'
});

await openai.connect();

const response = await anthropic.chat([
  { role: 'user', content: 'Hello!' }
]);
```

### Available Models

- `claude-opus-4-20250514` - Claude 4 Opus (most capable)
- `claude-sonnet-4-20250514` - Claude 4 Sonnet (balanced)
- `claude-haiku-3-20240307` - Claude 3 Haiku (fastest)

## Google

### Configuration

```json
{
  "type": "google",
  "name": "gemini",
  "enabled": true,
  "settings": {
    "apiKey": "YOUR_API_KEY",
    "model": "gemini-2.0-flash-exp",
    "maxTokens": 2048,
    "temperature": 0.9,
    "baseUrl": "https://generativelanguage.googleapis.com/v1beta"
  }
}
```

### Features

- **Generation**: Text and image generation
- **Function Calling**: Tool execution
- **Vision**: Image understanding
- **Models**: Gemini 2.0, 1.5 Pro, 1.5 Flash

### Usage

```typescript
import { createProvider } from 'agent-gateway/providers';

const google = createProvider('google', 'gemini', {
  apiKey: process.env.GOOGLE_API_KEY,
  model: 'gemini-2.0-flash-exp'
});

const response = await google.chat([
  { role: 'user', content: 'Hello!' }
]);
```

### Available Models

- `gemini-2.0-flash-exp` - Gemini 2.0 Flash Experimental
- `gemini-1.5-pro` - Gemini 1.5 Pro
- `gemini-1.5-flash` - Gemini 1.5 Flash

## Mistral

### Configuration

```json
{
  "type": "mistral",
  "name": "mistral",
  "enabled": true,
  "settings": {
    "apiKey": "YOUR_API_KEY",
    "model": "mistral-large-latest",
    "maxTokens": 4096,
    "temperature": 0.7
  }
}
```

### Usage

```typescript
const mistral = createProvider('mistral', 'mistral', {
  apiKey: process.env.MISTRAL_API_KEY,
  model: 'mistral-large-latest'
});
```

### Available Models

- `mistral-large-latest` - Mistral Large
- `mistral-small-latest` - Mistral Small
- `mistral-medium-latest` - Mistral Medium

## DeepSeek

### Configuration

```json
{
  "type": "deepseek",
  "name": "deepseek",
  "enabled": true,
  "settings": {
    "apiKey": "YOUR_API_KEY",
    "model": "deepseek-chat",
    "maxTokens": 4096,
    "temperature": 0.7
  }
}
```

### Usage

```typescript
const deepseek = createProvider('deepseek', 'deepseek', {
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: 'deepseek-chat'
});
```

### Available Models

- `deepseek-chat` - DeepSeek Chat
- `deepseek-coder` - DeepSeek Coder (code-focused)

## Ollama

### Configuration

```json
{
  "type": "ollama",
  "name": "llama",
  "enabled": true,
  "settings": {
    "baseUrl": "http://localhost:11434",
    "model": "llama3",
    "temperature": 0.7
  }
}
```

### Features

- **Local Models**: Run models locally
- **Privacy**: No data leaves your machine
- **Custom Models**: Import any GGUF model

### Usage

```typescript
const ollama = createProvider('ollama', 'llama', {
  baseUrl: 'http://localhost:11434',
  model: 'llama3'
});

await ollama.connect();

// List available models
const models = await ollama.listModels();
console.log(models);

// Pull a model
await ollama.pullModel('llama3');

// Chat
const response = await ollama.chat([
  { role: 'user', content: 'Hello!' }
]);
```

### Available Models

Run `ollama list` to see locally available models. Common models:
- `llama3` - Meta Llama 3
- `llama3:70b` - Llama 3 70B
- `mistral` - Mistral 7B
- `codellama` - Code Llama
- `phi3` - Microsoft Phi-3

## Adding Custom Providers

To add a custom provider, implement the `Provider` interface:

```typescript
import { Provider, ProviderConfig, ChatMessage, ModelResponse, Tool } from 'agent-gateway/providers';

class MyCustomProvider implements Provider {
  id: string;
  type: string = 'my-custom';
  name: string = 'My Custom';
  config: ProviderConfig;

  constructor(id: string, config: MyCustomConfig) {
    this.id = id;
    this.config = config;
  }

  async connect(): Promise<void> {
    // Initialize connection
  }

  async disconnect(): Promise<void> {
    // Clean up
  }

  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    // Implement chat
    return {
      id: 'response-id',
      content: 'Response',
      model: 'my-model',
      finishReason: 'stop'
    };
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse> {
    // Implement tool calling
  }
}
```

Then register it:

```typescript
import { registerProvider } from 'agent-gateway/providers';

registerProvider('my-custom', async (config) => {
  return new MyCustomProvider('my-custom', config as MyCustomConfig);
});
```

## Provider Comparison

| Feature | OpenAI | Anthropic | Google | Mistral | DeepSeek | Ollama |
|---------|--------|-----------|--------|---------|----------|--------|
| Context | 128K | 200K | 1M | 128K | 64K | 8K-128K |
| Tools | ✅ | ✅ | ✅ | ✅ | ✅ | ⚠️ |
| Vision | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Price | $$ | $$ | $$ | $$ | $ | Free |
| Local | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |