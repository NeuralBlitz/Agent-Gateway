# Google Provider (`src/providers/google/`)

> **Google Gemini generateContent API adapter — Gemini Pro, Flash, and Ultra models.**

---

## Overview

The `GoogleProvider` class implements the `Provider` interface for the Google Gemini API via the `generateContent` endpoint. It supports text completion, tool-calling (via `functionCalling`), and model listing.

Gemini models are known for their native multimodal capabilities (images, video, text), large context windows, and competitive performance.

---

## File Structure

```
google/
└── index.ts    # GoogleProvider implementation
```

---

## API Reference

### Constructor

```typescript
new GoogleProvider(config: {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  maxTokens?: number;
})
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `apiKey` | ✅ | — | Google AI Studio API key |
| `model` | ❌ | `gemini-2.0-flash` | Model identifier |
| `baseUrl` | ❌ | `https://generativelanguage.googleapis.com/v1beta` | Custom API base URL |
| `temperature` | ❌ | `0.7` | Sampling temperature |
| `maxTokens` | ❌ | `8192` | Maximum response tokens |

### Methods

#### `chat(messages, options?)`

Text completion via Gemini generateContent API.

```typescript
const response = await provider.chat([
  { role: 'user', content: 'Explain the theory of relativity.' },
]);
```

Endpoint: `POST /v1beta/models/{model}:generateContent`

#### `chatWithTools(messages, tools, options?)`

Text completion with function calling.

```typescript
const response = await provider.chatWithTools(
  [{ role: 'user', content: "What's the weather in Tokyo?" }],
  [{
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get weather for a city',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string' } },
        required: ['city'],
      },
    },
  }]
);

// Function calls are extracted from the response
if (response.tool_calls) {
  const call = response.tool_calls[0];
  console.log(call.function.name); // "get_weather"
  console.log(JSON.parse(call.function.arguments)); // { city: "Tokyo" }
}
```

Endpoint: `POST /v1beta/models/{model}:generateContent` with `tools` configuration.

#### `listModels()`

Lists available Gemini models via the models list endpoint.

```typescript
const models = await provider.listModels();
// [{ id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', contextWindow: 1048576, ... }]
```

Endpoint: `GET /v1beta/models`

---

## API Details

### Request Format

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [
        { "text": "What files are in /tmp?" }
      ]
    }
  ],
  "tools": [
    {
      "function_declarations": [
        {
          "name": "bash",
          "description": "Execute a shell command",
          "parameters": {
            "type": "object",
            "properties": { "cmd": { "type": "string" } },
            "required": ["cmd"]
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "temperature": 0.7,
    "maxOutputTokens": 8192
  }
}
```

### Response Format

```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          { "text": "Let me check that for you." }
        ]
      },
      "finishReason": "STOP",
      "avgLogprobs": -0.1
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 25,
    "candidatesTokenCount": 10,
    "totalTokenCount": 35
  }
}
```

### Function Call Response

```json
{
  "candidates": [
    {
      "content": {
        "role": "model",
        "parts": [
          {
            "functionCall": {
              "name": "bash",
              "args": { "cmd": "ls -la /tmp" }
            }
          }
        ]
      },
      "finishReason": "STOP"
    }
  ]
}
```

---

## Message Format Conversion

The Gemini API uses a different message structure than the OpenAI format. The adapter converts:

### OpenAI → Gemini
```typescript
// OpenAI format
{ role: 'system', content: 'You are helpful.' }
{ role: 'user', content: 'Hello!' }
{ role: 'assistant', content: 'Hi there!' }
{ role: 'tool', content: 'result', tool_call_id: 'abc' }

// Converted to Gemini format
{
  contents: [
    { role: 'user', parts: [{ text: 'Hello!' }] },
    { role: 'model', parts: [{ text: 'Hi there!' }] },
    { role: 'user', parts: [{ functionResponse: { name: 'tool', response: 'result' } }] }
  ],
  systemInstruction: { parts: [{ text: 'You are helpful.' }] }
}
```

System prompts are sent as `systemInstruction` rather than as a message. Tool results are sent as `functionResponse` parts.

---

## Models

| Model | Context Window | Best For |
|-------|---------------|----------|
| `gemini-2.0-flash` | 1M | Fast, cost-effective, multimodal |
| `gemini-2.0-flash-lite` | 1M | Cheapest option |
| `gemini-1.5-pro` | 2M | Complex reasoning, long context |
| `gemini-1.5-flash` | 1M | Good balance |

---

## Authentication

API key is passed as a query parameter:
```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSy...
```

---

## Rate Limits

Gemini API rate limits:

| Model | RPM | TPM | RPD |
|-------|-----|-----|-----|
| Gemini 2.0 Flash | 1,000 | 4M | 1,500 |
| Gemini 1.5 Pro | 360 | 4M | 360 |
| Gemini 1.5 Flash | 1,000 | 4M | 1,500 |

- **RPM**: Requests per minute
- **TPM**: Tokens per minute
- **RPD**: Requests per day

---

## Safety Settings

Gemini supports configurable safety settings for:
- `HARM_CATEGORY_HATE_SPEECH`
- `HARM_CATEGORY_DANGEROUS_CONTENT`
- `HARM_CATEGORY_SEXUALLY_EXPLICIT`
- `HARM_CATEGORY_HARASSMENT`

Blocking thresholds:
- `BLOCK_NONE` — Allow all
- `BLOCK_ONLY_HIGH` — Block only high probability
- `BLOCK_MEDIUM_AND_ABOVE` — Block medium and above
- `BLOCK_LOW_AND_ABOVE` — Block low and above

The adapter does not configure safety settings by default — they can be passed via the `options` parameter.

---

## Error Handling

| Status | Error | Behavior |
|--------|-------|----------|
| 400 | Invalid request | Error thrown with details |
| 401 | Invalid API key | Logged at error, provider disabled |
| 403 | API not enabled | Logged at error |
| 404 | Model not found | Error thrown |
| 429 | Rate limited | Waits retry-after, retries |
| 500 | Server error | Retries with exponential backoff |
| 503 | Service unavailable | Retries with exponential backoff |

---

## Related Documentation

- [`providers/`](../README.md) — Parent providers module
- [Gemini API Reference](https://ai.google.dev/api/generate-content) — Official docs
- [Function Calling](https://ai.google.dev/docs/function_calling) — Tool calling guide
