# Streaming (`src/streaming/`)

> **SSE streaming support — stream AI responses in real-time via Server-Sent Events.**

---

## Overview

The `streaming/` module provides utilities for streaming AI responses in real-time using Server-Sent Events (SSE). Instead of waiting for the complete response, chunks are sent to the client as they are generated, providing a responsive user experience similar to ChatGPT's streaming interface.

The module handles parsing streaming responses from OpenAI and Anthropic APIs and provides utilities for creating SSE responses for Express HTTP endpoints.

---

## File Structure

```
streaming/
└── index.ts    # Streaming utilities and SSE response helpers
```

---

## Stream Parsing

### `parseOpenAIStream(response: Response)`

Parses an OpenAI streaming response into an async generator of text chunks.

```typescript
async function* parseOpenAIStream(response: Response): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;

        const parsed = JSON.parse(data);
        const chunk = parsed.choices?.[0]?.delta?.content;
        if (chunk) yield chunk;
      }
    }
  }
}
```

**OpenAI SSE Format**:
```
data: {"id":"chatcmpl-123","choices":[{"delta":{"content":"Hello"},"index":0}]}

data: {"id":"chatcmpl-123","choices":[{"delta":{"content":" world"},"index":0}]}

data: [DONE]
```

### `parseAnthropicStream(response: Response)`

Parses an Anthropic streaming response into an async generator of text chunks.

```typescript
async function* parseAnthropicStream(response: Response): AsyncGenerator<string> {
  // Similar SSE parsing logic for Anthropic's event stream format
}
```

**Anthropic SSE Format**:
```
event: content_block_delta
data: {"type": "content_block_delta", "delta": {"type": "text_delta", "text": "Hello"}}

event: content_block_delta
data: {"type": "content_block_delta", "delta": {"type": "text_delta", "text": " world"}}

event: message_stop
data: {"type": "message_stop"}
```

---

## SSE Response Utilities

### `streamToCallback(stream: AsyncGenerator<string>, callback: (chunk: string) => void)`

Consumes a stream and calls a callback for each chunk.

```typescript
await streamToCallback(
  parseOpenAIStream(response),
  (chunk) => {
    process.stdout.write(chunk);
  }
);
```

### `streamToString(stream: AsyncGenerator<string>)`

Consumes a stream and returns the complete string.

```typescript
const fullResponse = await streamToString(parseOpenAIStream(response));
```

Useful when you need the final response in addition to streaming chunks.

### `createSSEResponse(stream: AsyncGenerator<string>, req: Request, res: Response)`

Creates an Express SSE response that streams chunks to the client.

```typescript
app.post('/api/stream', async (req, res) => {
  const stream = provider.chatStream(req.body.messages);
  await createSSEResponse(stream, req, res);
});
```

**SSE Response Format**:
```
event: chunk
data: {"content": "Hello"}

event: chunk
data: {"content": " world"}

event: done
data: {"complete": true}
```

---

## SSE Endpoint

The `/api/stream` endpoint provides SSE streaming for client applications:

### Request

```json
{
  "channel": "telegram",
  "chatId": "123456",
  "message": "Write a long story about a robot."
}
```

### Response

Content-Type: `text/event-stream`

```
event: chunk
data: {"content": "Once"}

event: chunk
data: {"content": " upon"}

event: chunk
data: {"content": " a"}

event: chunk
data: {"content": " time"}

event: chunk
data: {"content": ", there"}

event: chunk
data: {"content": " was"}

event: chunk
data: {"content": " a"}

event: chunk
data: {"content": " friendly"}

event: chunk
data: {"content": " robot"}

event: chunk
data: {"content": " named"}

event: chunk
data: {"content": " Bolt"}

event: chunk
data: {"content": ".\n"}

event: chunk
data: {"content": "..."}

event: done
data: {"complete": true, "sessionId": "telegram:123456"}
```

---

## Client-Side Usage

### Browser JavaScript

```javascript
const eventSource = new EventSource('/api/stream');
// Note: EventSource only supports GET. For POST, use fetch with ReadableStream.

// Using fetch + ReadableStream:
const response = await fetch('/api/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello!' }),
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n');
  buffer = lines.pop() || '';

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      if (data.content) {
        process.stdout.write(data.content);
      }
    }
  }
}
```

### Node.js

```javascript
const response = await fetch('http://localhost:3000/api/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ message: 'Hello!' }),
});

for await (const chunk of response.body) {
  const text = new TextDecoder().decode(chunk);
  const lines = text.split('\n');
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data.content);
    }
  }
}
```

---

## Provider Streaming Support

| Provider | Supports Streaming | Notes |
|----------|-------------------|-------|
| **OpenAI** | ✅ | Via `stream: true` parameter |
| **Anthropic** | ✅ | Via stream parameter |
| **Google** | ✅ | Via `generationConfig` settings |
| **Mistral** | ✅ | OpenAI-compatible streaming |
| **DeepSeek** | ✅ | OpenAI-compatible streaming |
| **Ollama** | ✅ | Via `stream: true` parameter |

---

## WebSocket Streaming

In addition to SSE, the gateway also supports streaming over WebSocket (`/ws`). WebSocket streaming is bidirectional, allowing the client to send follow-up messages while a response is still streaming.

---

## Benefits of Streaming

| Benefit | Description |
|---------|-------------|
| **Perceived latency** | Users see output immediately instead of waiting for the full response |
| **Interruptibility** | Users can stop a streaming response mid-way if it's going wrong |
| **Resource efficiency** | No need to buffer the entire response in memory |
| **UX quality** | Provides a ChatGPT-like experience |

---

## Error Handling

Streaming errors are handled gracefully:

1. If the stream breaks mid-response, an `event: error` is sent
2. Partial responses already sent to the client remain visible
3. The error is logged at the error level

```
event: error
data: {"message": "Stream interrupted", "partial": true}
```

---

## Related Documentation

- [`server/`](../server/README.md) — Where the SSE endpoint is hosted
- [`providers/`](../providers/README.md) — Providers that generate streaming responses
- [`agents/`](../agents/README.md) — Agents that can optionally use streaming
