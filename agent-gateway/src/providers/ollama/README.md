# Ollama Provider (`src/providers/ollama/`)

> **Ollama local API adapter — run open-source models locally with full control.**

---

## Overview

The `OllamaProvider` class implements the `Provider` interface for the Ollama local API. Unlike all other providers, Ollama runs on your own machine — no API keys, no cloud costs, no internet required.

Ollama is unique in the provider lineup because it also supports **model management** — pulling and deleting models directly from the Ollama instance — in addition to standard chat and tool-calling capabilities.

---

## File Structure

```
ollama/
└── index.ts    # OllamaProvider implementation
```

---

## API Reference

### Constructor

```typescript
new OllamaProvider(config: {
  baseUrl?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
})
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `baseUrl` | ❌ | `http://localhost:11434` | Ollama server URL |
| `model` | ❌ | `llama3` | Default model name |
| `temperature` | ❌ | `0.7` | Sampling temperature |
| `maxTokens` | ❌ | — | Maximum response tokens |

Note: **No API key required** — Ollama runs locally and is open by default.

### Methods

#### `chat(messages, options?)`

Text completion via Ollama's chat endpoint.

```typescript
const response = await provider.chat([
  { role: 'user', content: 'What is the capital of France?' },
]);
```

Endpoint: `POST /api/chat`

#### `chatWithTools(messages, tools, options?)`

Text completion with tool-calling.

```typescript
const response = await provider.chatWithTools(
  [{ role: 'user', content: 'List files in /tmp' }],
  [{
    type: 'function',
    function: {
      name: 'bash',
      description: 'Execute shell command',
      parameters: {
        type: 'object',
        properties: { cmd: { type: 'string' } },
        required: ['cmd'],
      },
    },
  }]
);
```

Ollama supports function calling with models that have tool-use capabilities.

#### `listModels()`

Lists models available in the local Ollama instance.

```typescript
const models = await provider.listModels();
// [{ id: 'llama3', name: 'Llama 3', contextWindow: 8192, ... }]
```

Endpoint: `GET /api/tags`

#### `pullModel(model: string)`

Downloads a model from the Ollama model registry.

```typescript
await provider.pullModel('mistral');
// Ollama will download the mistral model in the background
```

Endpoint: `POST /api/pull`

#### `deleteModel(model: string)`

Deletes a model from local storage.

```typescript
await provider.deleteModel('llama3');
// Model is removed from local disk
```

Endpoint: `DELETE /api/delete`

---

## API Details

### Request Format

```json
{
  "model": "llama3",
  "messages": [
    { "role": "system", "content": "You are helpful." },
    { "role": "user", "content": "Hello!" }
  ],
  "stream": false,
  "options": {
    "temperature": 0.7,
    "num_predict": 4096
  },
  "tools": [
    {
      "type": "function",
      "function": {
        "name": "bash",
        "description": "Execute a shell command",
        "parameters": {
          "type": "object",
          "properties": { "cmd": { "type": "string" } },
          "required": ["cmd"]
        }
      }
    }
  ]
}
```

### Response Format

```json
{
  "model": "llama3",
  "created_at": "2024-01-01T00:00:00Z",
  "message": {
    "role": "assistant",
    "content": "Hello! How can I help you?",
    "tool_calls": []
  },
  "done": true,
  "total_duration": 5000000000,
  "load_duration": 1000000000,
  "prompt_eval_count": 20,
  "eval_count": 10,
  "eval_duration": 3000000000
}
```

---

## Installing Ollama

### Linux/macOS
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Docker
```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

### Starting the Server
```bash
ollama serve
```

### Pulling Your First Model
```bash
ollama pull llama3
ollama run llama3 "Hello, world!"
```

---

## Popular Models

| Model | Size | Context | Best For |
|-------|------|---------|----------|
| `llama3` | 4.7GB (8B) | 8K | General purpose |
| `llama3:70b` | 39GB (70B) | 8K | High quality |
| `mistral` | 4.1GB (7B) | 8K | Fast, good all-rounder |
| `mixtral` | 26GB (8x7B MoE) | 32K | Strong performance |
| `codellama` | 3.8GB (7B) | 16K | Code generation |
| `phi3` | 2.2GB (3.8B) | 4K | Lightweight |
| `gemma:7b` | 5.0GB (7B) | 8K | Google's open model |
| `qwen2` | 4.5GB (7B) | 32K | Strong multilingual |

---

## Hardware Requirements

| Model Size | Minimum RAM | Recommended GPU |
|------------|------------|----------------|
| 3B | 4GB | None (CPU OK) |
| 7B | 8GB | None (CPU OK) |
| 13B | 16GB | 6GB VRAM |
| 33B | 32GB | 12GB VRAM |
| 70B | 64GB | 24GB VRAM |

Ollama automatically uses GPU (CUDA, Metal) when available and falls back to CPU otherwise.

---

## Tool Calling

Ollama supports function calling for models that have been trained for it. The format is OpenAI-compatible:

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
          "properties": { "city": { "type": "string" } },
          "required": ["city"]
        }
      }
    }
  ]
}
```

Tool calls in response:
```json
{
  "message": {
    "role": "assistant",
    "tool_calls": [
      {
        "function": {
          "name": "get_weather",
          "arguments": "{\"city\": \"London\"}"
        }
      }
    ]
  },
  "done": true
}
```

---

## Configuration

### Custom Base URL
For remote Ollama instances or Docker containers:
```json
{
  "providers": {
    "ollama": {
      "baseUrl": "http://192.168.1.100:11434",
      "model": "llama3"
    }
  }
}
```

### Environment Variables
```bash
OLLAMA_HOST=0.0.0.0    # Listen on all interfaces
OLLAMA_MODELS=/path    # Custom model storage location
OLLAMA_KEEP_ALIVE=24h  # Keep models loaded in memory
```

---

## Advantages of Ollama

| Benefit | Description |
|---------|-------------|
| **No API costs** | Free, runs on your own hardware |
| **Privacy** | All data stays on your machine |
| **Offline** | Works without internet |
| **Model variety** | Hundreds of GGUF models available |
| **Fine-tuning** | Can run custom-finetuned models |
| **No rate limits** | Limited only by your hardware |

## Disadvantages

| Drawback | Description |
|----------|-------------|
| **Hardware dependent** | Quality depends on your GPU/CPU |
| **Slower** | Larger models are slower without enterprise GPUs |
| **Model quality** | Open-source models may lag behind proprietary ones |
| **Setup required** | Need to install and manage Ollama separately |

---

## Error Handling

| Error | Behavior |
|-------|----------|
| Connection refused | Ollama server not running, logged at error |
| Model not found | Error thrown, suggests running `ollama pull <model>` |
| Out of memory | Ollama handles this internally, may swap or fail |
| Timeout | Request timeout (default: 60s), logged at warn |
| Tool calling not supported | Model doesn't support tools, logged at warn |

---

## Related Documentation

- [`providers/`](../README.md) — Parent providers module
- [Ollama Website](https://ollama.com/) — Official site
- [Ollama GitHub](https://github.com/ollama/ollama) — Source code and docs
- [Ollama API Docs](https://github.com/ollama/ollama/blob/main/docs/api.md) — API reference
