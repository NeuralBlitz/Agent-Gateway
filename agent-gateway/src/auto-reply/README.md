# Auto-Reply (`src/auto-reply/`)

> **Automatic message reply handler — connects channel messages to the agent's tool-calling loop.**

---

## Overview

The `auto-reply/` module implements the `AutoReply` class, which is the glue between messaging channels and the AI agent. When a user sends a message on any channel, the AutoReply handler:

1. Receives the normalized `ChannelMessage`
2. Checks cooldowns and pattern matching rules
3. Routes the message to the appropriate agent
4. Sends the AI response back through the originating channel

It's the component that makes the gateway "automatic" — no manual intervention needed to respond to messages.

---

## File Structure

```
auto-reply/
└── index.ts    # AutoReply class implementation
```

---

## The `AutoReply` Class

### Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `gateway` | `Gateway` | Central gateway instance |
| `agent` | `BaseAgent` | The AI agent to process messages |
| `config` | `AutoReplyConfig` | Configuration options |

### AutoReplyConfig

```typescript
interface AutoReplyConfig {
  /** Cooldown between responses to the same user (ms) */
  cooldown?: number;

  /** Patterns to include (regex strings) */
  includePatterns?: string[];

  /** Patterns to exclude (regex strings) */
  excludePatterns?: string[];

  /** Whether to use agent tool-calling or simple provider chat */
  useAgent?: boolean;

  /** Default response when agent is unavailable */
  fallbackResponse?: string;
}
```

---

## Message Processing Pipeline

### Step 1: Message Reception

The AutoReply is connected to channels during startup. Each channel calls the AutoReply's `handleMessage()` method when a new message arrives:

```typescript
channel.start((message) => autoReply.handleMessage(message));
```

### Step 2: Bot Message Filtering

Messages from bots (including the agent's own messages) are ignored to prevent infinite loops:

```typescript
if (message.from.isBot) {
  return; // Ignore bot messages
}
```

### Step 3: Cooldown Check

Per-user cooldowns prevent spam:

```typescript
if (this.isInCooldown(message.from.id)) {
  return; // User is in cooldown period
}
```

### Step 4: Pattern Matching

Messages are filtered through include/exclude patterns:

```typescript
// If include patterns are set, message must match at least one
if (this.includePatterns.length > 0) {
  if (!this.includePatterns.some(p => new RegExp(p).test(message.text))) {
    return; // Message doesn't match include patterns
  }
}

// If exclude patterns are set, message must not match any
if (this.excludePatterns.some(p => new RegExp(p).test(message.text))) {
  return; // Message matches an exclude pattern
}
```

### Step 5: Agent or Provider Call

Depending on configuration, the message is processed either through:

**Agent mode** (tool-calling loop):
```typescript
const session = await this.gateway.findOrCreateSession(
  message.channelType,
  message.from.id,
);
const messages = session.getMessages();
const response = await this.agent.run(messages);
```

**Simple mode** (direct provider chat):
```typescript
const response = await this.provider.chat(messages);
```

### Step 6: Response Delivery

The AI response is sent back through the originating channel:

```typescript
await channel.sendMessage(message.chatId, response.content, {
  replyTo: message.id,
});
```

### Step 7: Cooldown Activation

After responding, the user is placed in cooldown:

```typescript
this.setCooldown(message.from.id, this.config.cooldown);
```

---

## Hook Integration

The AutoReply fires lifecycle hooks at key points:

### `beforeMessage`
Fired before processing begins. Handlers can:
- Modify the incoming message
- Short-circuit by returning a response directly
- Log or track the message

```typescript
await hooks.fire('beforeMessage', { message, channel });
```

### `afterResponse`
Fired after the AI response is generated. Handlers can:
- Modify the response before sending
- Add additional content
- Log or track the response

```typescript
await hooks.fire('afterResponse', { message, response, channel });
```

### `onError`
Fired when an error occurs. Handlers can:
- Provide a fallback response
- Customize the error message shown to users
- Log or alert on errors

```typescript
await hooks.fire('onError', { message, error, channel });
```

---

## Cooldown System

The cooldown system prevents users from overwhelming the agent:

```typescript
class AutoReply {
  private cooldowns = new Map<string, number>(); // userId → expiry timestamp

  isInCooldown(userId: string): boolean {
    const expiry = this.cooldowns.get(userId);
    if (!expiry) return false;
    if (Date.now() < expiry) return true;
    this.cooldowns.delete(userId); // Expired
    return false;
  }

  setCooldown(userId: string, duration: number): void {
    this.cooldowns.set(userId, Date.now() + duration);
  }
}
```

Default cooldown: 0 (disabled). Set via config:

```json
{
  "autoReply": {
    "cooldown": 5000
  }
}
```

---

## Pattern Matching

Include and exclude patterns are regular expressions that filter messages:

### Include Patterns
Only messages matching at least one include pattern are processed:

```json
{
  "autoReply": {
    "includePatterns": ["^!", "^/", "^bot\\b"]
  }
}
```

This would only process messages starting with `!`, `/`, or containing `bot` as a word.

### Exclude Patterns
Messages matching any exclude pattern are ignored:

```json
{
  "autoReply": {
    "excludePatterns": ["^/roll", "^/dice"]
  }
}
```

This would ignore dice roll commands while processing other messages.

---

## Error Handling

When message processing fails:

1. The error is caught and logged
2. The `onError` hook is fired
3. If a fallback response is configured, it's sent to the user
4. Otherwise, a generic error message is sent

### Fallback Response

```json
{
  "autoReply": {
    "fallbackResponse": "I'm having trouble right now. Please try again later."
  }
}
```

---

## Integration Points

| Module | Relationship |
|--------|-------------|
| [`channels/`](../channels/README.md) | AutoReply receives messages from channels |
| [`agents/`](../agents/README.md) | AutoReply routes messages to the agent |
| [`gateway/`](../gateway/README.md) | AutoReply uses Gateway for session management |
| [`hooks/`](../hooks/README.md) | AutoReply fires beforeMessage/afterResponse/onError hooks |
| [`providers/`](../providers/README.md) | AutoReply can call providers directly (simple mode) |

---

## Usage Example

```typescript
import { AutoReply, Gateway, BaseAgent } from 'agent-gateway';

const autoReply = new AutoReply(gateway, agent, {
  cooldown: 3000,
  excludePatterns: ['^/roll', '^/stats'],
  useAgent: true,
});

// Connect channels to auto-reply
for (const [id, channel] of gateway.channels) {
  channel.start((message) => autoReply.handleMessage(message));
}
```

---

## Related Documentation

- [`gateway/`](../gateway/README.md) — Gateway used for session management
- [`agents/`](../agents/README.md) — Agent that processes messages
- [`channels/`](../channels/README.md) — Channels that feed messages to AutoReply
- [`hooks/`](../hooks/README.md) — Lifecycle hooks fired by AutoReply
