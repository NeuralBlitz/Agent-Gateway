# Hooks (`src/hooks/`)

> **Lifecycle hook system — inject custom logic at 9 phases of the message processing pipeline.**

---

## Overview

The `hooks/` module implements a lifecycle hook system that allows custom logic to be injected at key points in the message processing pipeline. Hooks are used by plugins, configuration, and internal modules to observe, modify, or short-circuit system behavior without modifying core code.

There are **9 hook phases** covering the entire message lifecycle, from reception through response delivery.

---

## File Structure

```
hooks/
└── index.ts    # Hooks class + global hooks singleton
```

---

## Hook Phases

| Phase | When Fired | Payload | Typical Use |
|-------|-----------|---------|-------------|
| `beforeMessage` | Before processing an incoming message | `{ message, channel }` | Filter messages, modify content, short-circuit |
| `afterMessage` | After message is added to session | `{ message, session }` | Log message, update external systems |
| `beforeResponse` | Before sending AI response to user | `{ message, response }` | Modify response, add disclaimers |
| `afterResponse` | After response is sent | `{ message, response, channel }` | Log response, update analytics |
| `beforeTool` | Before executing a tool | `{ toolName, args, session }` | Validate args, modify args, audit |
| `afterTool` | After tool execution | `{ toolName, args, result }` | Modify result, cache, audit |
| `onError` | When an error occurs | `{ message, error, channel, phase }` | Custom error handling, alerting |
| `onSessionStart` | When a new session is created | `{ session }` | Initialize external state |
| `onSessionEnd` | When a session is destroyed | `{ session }` | Save analytics, cleanup |

---

## The `Hooks` Class

### Hook Handler

```typescript
type HookHandler<T> = (payload: T) => Promise<void | HookResult>;

interface HookResult {
  /** If true, stop processing and return this result */
  stop?: boolean;

  /** Response to return if stopped */
  response?: string;

  /** Modified payload to pass to next handler */
  modified?: unknown;
}
```

### Registration

```typescript
class Hooks {
  /**
   * Register a hook handler for a phase
   * @param phase The lifecycle phase
   * @param handler The handler function
   * @param priority Execution order (lower = earlier, default: 0)
   */
  register(phase: HookPhase, handler: HookHandler, priority?: number): void;
}
```

Handlers within each phase are sorted by priority. Lower priority handlers execute first.

### Execution

```typescript
/**
 * Fire all handlers for a phase
 * @param phase The lifecycle phase
 * @param payload The payload to pass to handlers
 * @returns Combined result from all handlers
 */
async fire<T>(phase: HookPhase, payload: T): Promise<HookResult>;
```

Execution behavior:
1. All handlers for the phase are executed in priority order
2. If any handler returns `{ stop: true }`, remaining handlers are skipped
3. Results from all handlers are merged
4. Errors in handlers are caught, logged, and do NOT stop execution

---

## Hook Result Semantics

### `beforeMessage` Hook

```typescript
hooks.register('beforeMessage', async ({ message, channel }) => {
  // Short-circuit: respond directly without processing through agent
  if (message.text === '/ping') {
    return { stop: true, response: 'Pong!' };
  }

  // Modify the message
  return { modified: { ...message, text: message.text.trim() } };
});
```

Use cases:
- Command handling (e.g., `/help`, `/status`)
- Message sanitization
- User authorization checks
- Rate limiting

### `afterResponse` Hook

```typescript
hooks.register('afterResponse', async ({ message, response, channel }) => {
  // Append a signature
  response.content += '\n\n— Sent by Agent Gateway';

  // Log to external service
  await analytics.track({
    userId: message.from.id,
    channel: channel.id,
    responseLength: response.content.length,
  });
});
```

Use cases:
- Response formatting
- Analytics tracking
- External logging

### `beforeTool` / `afterTool` Hooks

```typescript
hooks.register('beforeTool', async ({ toolName, args }) => {
  // Validate tool arguments before execution
  if (toolName === 'bash' && args.cmd.includes('rm')) {
    return { stop: true, response: 'rm commands are not allowed.' };
  }
});

hooks.register('afterTool', async ({ toolName, result }) => {
  // Cache tool results for reuse
  cache.set(`${toolName}:${hash(result)}`, result);
});
```

Use cases:
- Tool argument validation
- Tool result caching
- Tool execution auditing

### `onError` Hook

```typescript
hooks.register('onError', async ({ error, message, channel }) => {
  // Send alert to admin
  await notifyAdmin(`Error processing message from ${message.from.id}: ${error.message}`);

  // Provide custom fallback response
  return { response: 'Sorry, I encountered an error. Please try again later.' };
});
```

Use cases:
- Error alerting
- Custom fallback responses
- Error transformation

### `onSessionStart` / `onSessionEnd` Hooks

```typescript
hooks.register('onSessionStart', async ({ session }) => {
  // Initialize external CRM with new session
  await crm.createSession(session.id, session.userId);
});

hooks.register('onSessionEnd', async ({ session }) => {
  // Save session summary to analytics
  await analytics.saveSessionSummary({
    id: session.id,
    messageCount: session.messages.length,
    duration: Date.now() - session.createdAt.getTime(),
  });
});
```

Use cases:
- External system initialization
- Session analytics
- Resource cleanup

---

## Global Hooks Singleton

The module exports a global hooks singleton:

```typescript
// Get the global hooks instance
const hooks = getHooks();

// Or use the default export
import { hooks } from 'agent-gateway/hooks';
```

This ensures all modules (AutoReply, Gateway, Agent, etc.) share the same hook registry.

---

## Configuration-Based Hooks

Hooks can be configured in the config file:

```json
{
  "hooks": {
    "beforeMessage": [
      {
        "type": "filter",
        "pattern": "^/roll",
        "action": "short-circuit",
        "response": "🎲 You rolled a {1-6}!"
      }
    ],
    "onError": [
      {
        "type": "notify",
        "webhook": "https://hooks.slack.com/services/...",
        "message": "Agent Gateway error: {error.message}"
      }
    ]
  }
}
```

Built-in hook handlers:
- **filter**: Filter messages by regex pattern
- **notify**: Send notifications on errors
- **log**: Log messages/responses to file
- **transform**: Modify messages/responses

---

## Hook Execution Order

Within each phase, handlers execute in priority order:

```
Phase: beforeMessage
  Priority -100: System hooks (internal filtering)
  Priority   0:  Default (user-registered handlers)
  Priority 100: Plugin handlers
  Priority 200: Final processing hooks
```

If no priority is specified, handlers are registered at priority `0`.

---

## Error Handling in Hooks

Hook handler errors are caught and do NOT crash the system:

```typescript
try {
  for (const handler of handlers) {
    const result = await handler(payload);
    if (result?.stop) {
      return result; // Short-circuit
    }
  }
} catch (error) {
  logger.error({ hook: phase, error }, 'Hook execution failed');
  // Continue to next handler
}
```

Errors are:
1. Logged at the error level with the hook phase and handler info
2. Skipped (the handler's result is not included)
3. Non-fatal — remaining handlers continue executing

---

## Hook vs EventBus

The hook system differs from the EventBus in key ways:

| Aspect | Hooks | EventBus |
|--------|-------|----------|
| **Purpose** | Modify/control behavior | Observe/track behavior |
| **Execution** | Synchronous, in-pipeline | Asynchronous, decoupled |
| **Return values** | Can short-circuit | No return values |
| **Timing** | At specific pipeline points | Anytime |
| **Use case** | Filtering, transformation | Analytics, logging, debugging |

Use **hooks** when you need to change system behavior. Use **EventBus** when you need to observe events.

---

## Related Documentation

- [`plugin-sdk/`](../plugin-sdk/README.md) — Plugin hook interface
- [`auto-reply/`](../auto-reply/README.md) — Where beforeMessage/afterResponse/onError are fired
- [`gateway/`](../gateway/README.md) — Where onSessionStart/onSessionEnd are fired
- [`agents/`](../agents/README.md) — Where beforeTool/afterTool are fired
- [`eventbus/`](../eventbus/README.md) — Complementary pub/sub system
