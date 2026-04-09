# Context (`src/context/`)

> **Token counting and context window management — prevent exceeding provider context limits.**

---

## Overview

The `context/` module manages AI provider context windows. When conversation history grows beyond what a model can handle, the ContextManager ensures that messages are trimmed or summarized to fit within the provider's context window.

This is a critical component — exceeding the context window causes provider API errors, while being too aggressive with trimming loses important conversation context.

---

## File Structure

```
context/
└── index.ts    # ContextManager implementation
```

---

## The `ContextManager` Class

### Core Functions

| Function | Description |
|----------|-------------|
| `estimateTokens(text)` | Heuristic token count for a string |
| `countMessageTokens(message)` | Token count for a ChatMessage |
| `getModelContextWindow(model)` | Context window size for a model |
| `fitToContext(messages, model)` | Trim messages to fit context window |

---

## Token Estimation

### `estimateTokens(text: string): number`

A lightweight heuristic for estimating token count without calling the provider's tokenizer:

```typescript
function estimateTokens(text: string): number {
  // Rough approximation:
  // - English: ~1 token per 4 characters
  // - Code: ~1 token per 3 characters
  // This is intentionally approximate for speed
  const words = text.split(/\s+/).length;
  return Math.ceil(words * 1.3); // ~1.3 tokens per word average
}
```

This is NOT exact — it's designed to be fast and avoid grossly exceeding limits. For precise counting, use the provider's own tokenizer.

### `countMessageTokens(message: ChatMessage): number`

Counts tokens for a full chat message:

```typescript
function countMessageTokens(message: ChatMessage): number {
  let tokens = 4; // Base tokens per message
  tokens += estimateTokens(message.role);
  tokens += estimateTokens(message.content);
  if (message.name) tokens += estimateTokens(message.name);
  if (message.tool_calls) {
    for (const call of message.tool_calls) {
      tokens += estimateTokens(call.function.name);
      tokens += estimateTokens(call.function.arguments);
    }
  }
  return tokens;
}
```

---

## Model Context Window Lookup

### `getModelContextWindow(model: string): number`

Returns the context window size for a known model:

```typescript
const CONTEXT_WINDOWS: Record<string, number> = {
  // OpenAI
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000,
  'gpt-4-turbo': 128_000,
  'gpt-3.5-turbo': 16_385,

  // Anthropic
  'claude-sonnet-4-20250514': 200_000,
  'claude-opus-4-20250514': 200_000,
  'claude-haiku-3-20240307': 200_000,

  // Google
  'gemini-2.0-flash': 1_048_576,
  'gemini-1.5-pro': 2_097_152,

  // Mistral
  'mistral-large-latest': 128_000,
  'open-mixtral-8x22b': 64_000,

  // DeepSeek
  'deepseek-chat': 128_000,
  'deepseek-coder': 128_000,

  // Ollama (varies by model)
  'llama3': 8_192,
  'mistral': 8_192,
  'mixtral': 32_768,
};

function getModelContextWindow(model: string): number {
  // Check exact match first
  if (CONTEXT_WINDOWS[model]) return CONTEXT_WINDOWS[model];

  // Check partial match (for model versions like gpt-4o-2024-05-13)
  for (const [key, size] of Object.entries(CONTEXT_WINDOWS)) {
    if (model.includes(key)) return size;
  }

  // Default fallback
  return 8_192; // Conservative default
}
```

---

## Context Fitting

### `fitToContext(messages: ChatMessage[], model: string, strategy?: string): ChatMessage[]`

Trims messages to fit within the model's context window.

### Strategies

| Strategy | Behavior |
|----------|----------|
| `truncate` | Remove oldest messages first (default) |
| `summarize` | Attempt to summarize old messages (requires provider support) |
| `error` | Throw an error if context window is exceeded |

### Truncate Strategy

The most common strategy — removes oldest messages until the conversation fits:

```typescript
function fitToContext(
  messages: ChatMessage[],
  model: string,
  strategy: 'truncate' | 'summarize' | 'error' = 'truncate'
): ChatMessage[] {
  const maxTokens = getModelContextWindow(model);
  // Reserve some tokens for the response (~25% of context window)
  const availableTokens = Math.floor(maxTokens * 0.75);

  // Always keep system prompt and most recent message
  const systemPrompt = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');

  let totalTokens = countMessageTokens([...userMessages]);

  // Remove oldest messages until we fit
  while (totalTokens > availableTokens && userMessages.length > 2) {
    const removed = userMessages.shift();
    if (removed) {
      totalTokens -= countMessageTokens(removed);
    }
  }

  const result = systemPrompt ? [systemPrompt, ...userMessages] : userMessages;
  return result;
}
```

### Summarize Strategy

Attempts to summarize old messages using the provider itself:

```typescript
async function summarizeMessages(
  oldMessages: ChatMessage[],
  provider: Provider
): Promise<string> {
  const summaryPrompt = {
    role: 'system' as const,
    content: 'Summarize this conversation in 3-5 sentences.',
  };
  const response = await provider.chat([summaryPrompt, ...oldMessages]);
  return response.content;
}
```

The summarized content replaces the old messages, preserving the gist of the conversation while using far fewer tokens.

---

## Context Window Safety Margins

The ContextManager reserves a safety margin within the context window:

```
┌─────────────────────────────────────────────────┐
│          Total Context Window (e.g., 128K)       │
│  ┌───────────────────┬─────────────────────────┐ │
│  │  Messages (75%)   │  Response Reserve (25%) │ │
│  └───────────────────┴─────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

Only 75% of the context window is used for input messages, reserving 25% for the provider's response. This prevents "context window exceeded" errors when the provider generates a long response.

---

## Token Count by Message Role

Different roles have different token overhead:

| Role | Overhead |
|------|----------|
| `system` | +2 tokens |
| `user` | +1 token |
| `assistant` | +1 token |
| `tool` | +3 tokens (includes tool_call_id) |

---

## Integration with Agent

The agent calls the context manager before each provider call:

```typescript
// In BaseAgent.run():
const fittedMessages = contextManager.fitToContext(
  messages,
  this.model,
  this.contextStrategy
);

const response = await this.provider.chatWithTools(fittedMessages, this.tools);
```

---

## Context Window Comparison

| Model | Context Window | Approximate Messages* |
|-------|---------------|----------------------|
| GPT-3.5-turbo | 16K | ~40 messages |
| GPT-4o | 128K | ~300 messages |
| Claude Sonnet 4 | 200K | ~500 messages |
| Gemini 1.5 Pro | 2M | ~5,000 messages |
| Llama 3 (Ollama) | 8K | ~20 messages |
| Mistral | 8K | ~20 messages |

*Based on average message size of ~40 tokens

---

## Related Documentation

- [`agents/`](../agents/README.md) — Agent that uses context manager
- [`sessions/`](../sessions/README.md) — Sessions that hold message history
- [`providers/`](../providers/README.md) — Providers with varying context windows
