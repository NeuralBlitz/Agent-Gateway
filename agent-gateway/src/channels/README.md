# Channels (`src/channels/`)

> **Messaging platform adapters — connect Telegram, Discord, Slack, WhatsApp, Signal, and Matrix.**

---

## Overview

The `channels/` module provides six messaging platform adapters, each implementing a common `Channel` interface. These adapters are the entry point for all user messages into the Agent Gateway and the exit point for all AI responses back to users.

Each channel adapter handles platform-specific concerns: authentication, message formatting, media handling, webhook processing, and rate limiting — normalizing everything into a unified `ChannelMessage` format that the rest of the gateway can work with.

---

## File Structure

```
channels/
├── index.ts       # Barrel export + registerBuiltinChannels()
├── types.ts       # Channel, ChannelUser, ChannelBot, ChannelMessage, ChannelEvents
├── factory.ts     # createChannel() switch factory
├── telegram/      # Telegram Bot API adapter
│   └── index.ts
├── discord/       # Discord REST API v10 adapter
│   └── index.ts
├── slack/         # Slack Web API adapter
│   └── index.ts
├── whatsapp/      # Meta Graph API v18 adapter
│   └── index.ts
├── signal/        # Signal stub (requires signal-cli)
│   └── index.ts
└── matrix/        # Matrix Client-Server API adapter
    └── index.ts
```

---

## Core Types

### `Channel` Interface

Every channel adapter implements this interface:

```typescript
interface Channel {
  /** Unique identifier for this channel instance */
  id: string;

  /** Channel type identifier */
  type: string;

  /** Send a text message to a chat */
  sendMessage(chatId: string, text: string, options?: SendMessageOptions): Promise<MessageResult>;

  /** Handle incoming webhook/event data */
  handleEvent?(data: unknown): Promise<ChannelMessage | null>;

  /** Start receiving messages (polling or webhook setup) */
  start?(onMessage: (message: ChannelMessage) => void): Promise<void>;

  /** Stop receiving messages and cleanup resources */
  stop?(): Promise<void>;

  /** Get channel-specific metadata */
  getInfo?(): Promise<ChannelInfo>;
}
```

### `ChannelMessage`

The normalized message format that all channels produce:

```typescript
interface ChannelMessage {
  /** Unique message ID within the channel */
  id: string;

  /** Channel type that produced this message */
  channelType: string;

  /** The chat/conversation identifier */
  chatId: string;

  /** The user who sent the message */
  from: ChannelUser;

  /** Message text content */
  text?: string;

  /** Attached media or documents */
  attachments?: Attachment[];

  /** Whether this is a reply to another message */
  replyTo?: string;

  /** Raw platform data (for advanced use) */
  raw: unknown;

  /** Timestamp of the message */
  timestamp: Date;
}
```

### `ChannelUser`

```typescript
interface ChannelUser {
  id: string;
  username?: string;
  displayName?: string;
  isBot?: boolean;
}
```

### `ChannelBot`

Represents the bot's identity on a channel:

```typescript
interface ChannelBot {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
}
```

### `SendMessageOptions`

```typescript
interface SendMessageOptions {
  /** Reply to a specific message */
  replyTo?: string;

  /** Parse mode (markdown, html, plain) */
  parseMode?: string;

  /** Embed or rich content data */
  embed?: unknown;

  /** File attachment */
  attachment?: {
    data: Buffer | string;
    filename: string;
    mimeType: string;
  };
}
```

### `MessageResult`

```typescript
interface MessageResult {
  /** Platform-specific message ID */
  id: string;

  /** Whether the message was sent successfully */
  success: boolean;

  /** Error message if failed */
  error?: string;
}
```

---

## Channel Registry

### `registerBuiltinChannels(gateway, config)`

This function lazy-loads and registers all built-in channel adapters:

```typescript
export function registerBuiltinChannels(gateway: Gateway, config: GatewayConfig): void {
  // Telegram
  if (config.channels.telegram?.token) {
    const channel = createChannel('telegram', config.channels.telegram);
    gateway.registerChannel('telegram', channel);
  }

  // Discord, Slack, WhatsApp, Signal, Matrix...
  // Each only registered if credentials are present in config
}
```

Channels are **lazy-loaded** — the adapter module is only imported when the channel is actually configured. This keeps startup fast when you're only using a subset of channels.

---

## The `createChannel()` Factory

```typescript
function createChannel(type: string, config: ChannelConfig): Channel
```

A switch factory that instantiates the correct channel adapter:

```typescript
switch (type) {
  case 'telegram':
    return new TelegramChannel(config);
  case 'discord':
    return new DiscordChannel(config);
  case 'slack':
    return new SlackChannel(config);
  case 'whatsapp':
    return new WhatsAppChannel(config);
  case 'signal':
    return new SignalChannel(config);
  case 'matrix':
    return new MatrixChannel(config);
  default:
    throw new Error(`Unknown channel type: ${type}`);
}
```

---

## Channel Adapters

### Telegram (`telegram/`)

**API**: Telegram Bot API via `undici` fetch

#### Capabilities
| Feature | Support |
|---------|---------|
| Text messages | ✅ |
| Photos | ✅ `sendPhoto()` |
| Stickers | ✅ `sendSticker()` |
| Documents | ✅ `sendDocument()` |
| Webhooks | ✅ `handleWebhookUpdate()` |
| Set webhook | ✅ `setWebhook(url)` |
| Bot info | ✅ `getMe()` |

#### Authentication
Requires a Bot API token from [@BotFather](https://t.me/BotFather):
```
Token format: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

#### Message Reception
Supports two modes:
- **Webhook mode**: Set via `setWebhook()`. Telegram POSTs updates to your server.
- **Polling mode**: Periodically call `getUpdates()` (less common for production).

#### Message Formatting
- MarkdownV2 parse mode for rich text
- HTML parse mode for backward compatibility

---

### Discord (`discord/`)

**API**: Discord REST API v10

#### Capabilities
| Feature | Support |
|---------|---------|
| Text messages | ✅ `sendMessage()` |
| Embeds | ✅ `sendEmbed()` |
| Replies | ✅ `sendReply()` |
| Reactions | ✅ `addReaction()` |
| Delete messages | ✅ `deleteMessage()` |
| DMs | ✅ `createDM()` |
| Gateway events | ✅ `handleGatewayEvent()` |

#### Authentication
Requires a Bot token from the [Discord Developer Portal](https://discord.com/developers/applications):
```
Token format: Bot MTE...xyz (the "Bot " prefix is required)
```

#### Message Reception
Discord uses Gateway events (WebSocket) for real-time message reception. The adapter handles:
- `MESSAGE_CREATE` events
- Rate limits via Discord's `X-RateLimit-*` headers
- Message content intent requirements

#### Rich Content
Supports Discord embeds for structured responses:
```json
{
  "title": "Weather Report",
  "description": "Current conditions...",
  "color": 3447003,
  "fields": [...]
}
```

---

### Slack (`slack/`)

**API**: Slack Web API

#### Capabilities
| Feature | Support |
|---------|---------|
| Text messages | ✅ `sendMessage()` |
| Rich messages | ✅ `sendRichMessage()` (Block Kit) |
| Get user info | ✅ `getUser()` |
| Reactions | ✅ `addReaction()` |
| Open conversations | ✅ `openConversation()` |
| List channels | ✅ `listChannels()` (conversations.list) |
| Handle events | ✅ `handleWebhookEvent()` |

#### Authentication
Requires a Slack Bot token from [api.slack.com](https://api.slack.com):
```
Token format: xoxb-... (Bot token)
```

#### Block Kit
Slack's rich message format uses Block Kit:
```json
{
  "blocks": [
    { "type": "header", "text": { "type": "plain_text", "text": "Title" } },
    { "type": "section", "text": { "type": "mrkdwn", "text": "*Bold* text" } },
    { "type": "actions", "elements": [...] }
  ]
}
```

---

### WhatsApp (`whatsapp/`)

**API**: Meta Graph API v18

#### Capabilities
| Feature | Support |
|---------|---------|
| Text messages | ✅ `sendMessage()` |
| Images | ✅ `sendImage()` |
| Documents | ✅ `sendDocument()` |
| Templates | ✅ `sendTemplate()` |
| Read receipts | ✅ `markAsRead()` |
| Webhook events | ✅ `handleWebhookEvent()` |

#### Authentication
Requires:
- **Access Token**: From Meta for Developers dashboard
- **Phone Number ID**: The WhatsApp Business phone ID

#### Message Types
- **Text**: Plain text messages
- **Image**: JPEG/PNG with optional caption
- **Document**: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- **Template**: Pre-approved message templates for outbound

#### Webhook Validation
WhatsApp webhooks include:
- `object: "whatsapp_business_account"`
- `entry[].changes[].value.messages[]`
- Signature validation via `X-Hub-Signature-256`

---

### Signal (`signal/`)

**Status**: 🚧 Stub Implementation

#### Current State
The Signal channel is a **stub** that logs all operations but does not actually communicate. Full Signal support requires:

1. **signal-cli** installed on the system
2. **D-Bus** or **JSON-RPC** interface to signal-cli
3. **Registered phone number**

#### Stub Methods
| Method | Current Behavior |
|--------|-----------------|
| `sendMessage()` | Logs message, returns null |
| `sendGroupMessage()` | Logs message, returns null |
| `joinGroup()` | Logs group ID, returns null |
| `leaveGroup()` | Logs group ID, returns null |

#### Future Integration
A full implementation would wrap the signal-cli JSON-RPC API:
```bash
signal-cli -u +1234567890 receive
signal-cli -u +1234567890 send -m "Hello" +0987654321
```

---

### Matrix (`matrix/`)

**API**: Matrix Client-Server API (r0.6.0 / v3)

#### Capabilities
| Feature | Support |
|---------|---------|
| Text messages | ✅ `sendMessage()` |
| Replies | ✅ `sendReply()` |
| Notices | ✅ `sendNotice()` (bot messages) |
| Join rooms | ✅ `joinRoom()` |
| Leave rooms | ✅ `leaveRoom()` |
| Room members | ✅ `getRoomMembers()` |
| Create rooms | ✅ `createRoom()` |
| Sync events | ✅ `handleSyncEvent()` |

#### Authentication
Requires:
- **Homeserver URL**: e.g., `https://matrix.org`
- **Access Token**: From Matrix login or registration

#### Message Types
- **m.text**: Regular text messages
- **m.notice**: Bot/automated messages (not highlighted)
- **m.emote**: Action messages (`/me waves`)
- **m.file**: File attachments
- **m.image**: Image attachments

#### Reply Support
Matrix replies use `m.relates_to` with `m.in_reply_to`:
```json
{
  "msgtype": "m.text",
  "body": "Reply text",
  "m.relates_to": {
    "m.in_reply_to": { "event_id": "$original_event_id" }
  }
}
```

#### Sync-Based Reception
Matrix uses the `/sync` endpoint for real-time events. The adapter:
1. Calls `/sync?timeout=30000` (long-polling)
2. Processes `rooms.join[].timeline.events`
3. Filters for `m.room.message` events
4. Ignores messages from the bot itself

---

## Adding a Custom Channel

To implement a new channel adapter:

### 1. Create the adapter file
```typescript
// src/channels/mychannel/index.ts
import { Channel, ChannelMessage, ChannelUser } from '../types';

export class MyChannel implements Channel {
  id: string;
  type = 'mychannel';

  constructor(private config: MyChannelConfig) {
    this.id = `mychannel-${Date.now()}`;
  }

  async sendMessage(chatId: string, text: string): Promise<MessageResult> {
    // Send message via your platform's API
    return { id: 'msg-123', success: true };
  }

  async start(onMessage: (msg: ChannelMessage) => void): Promise<void> {
    // Set up webhook listener or polling
    // Call onMessage() for each incoming message
  }

  async stop(): Promise<void> {
    // Cleanup: close connections, remove webhooks
  }

  async handleEvent(data: unknown): Promise<ChannelMessage | null> {
    // Convert platform-specific event to ChannelMessage
    return {
      id: data.message_id,
      channelType: 'mychannel',
      chatId: data.chat_id,
      from: { id: data.user_id, username: data.username },
      text: data.text,
      raw: data,
      timestamp: new Date(data.timestamp),
    };
  }
}
```

### 2. Register in factory
Add a case to `createChannel()` in `factory.ts` and register in `registerBuiltinChannels()`.

### 3. Export from index
Add the export to the barrel in `index.ts`.

---

## Channel Comparison

| Feature | Telegram | Discord | Slack | WhatsApp | Signal | Matrix |
|---------|----------|---------|-------|----------|--------|--------|
| **Text** | ✅ | ✅ | ✅ | ✅ | 🚧 | ✅ |
| **Images** | ✅ | ✅ | ✅ | ✅ | 🚧 | ✅ |
| **Files** | ✅ | ✅ | ✅ | ✅ | 🚧 | ✅ |
| **Rich content** | ✅ | ✅ (embeds) | ✅ (blocks) | ✅ (templates) | 🚧 | ✅ (notices) |
| **Replies** | ✅ | ✅ | ✅ | ✅ | 🚧 | ✅ |
| **Reactions** | ❌ | ✅ | ✅ | ❌ | 🚧 | ❌ |
| **Webhooks** | ✅ | ✅ | ✅ | ✅ | 🚧 | ✅ (sync) |
| **Groups** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (rooms) |
| **Status** | ✅ Full | ✅ Full | ✅ Full | ✅ Full | 🚧 Stub | ✅ Full |

---

## Error Handling

All channel adapters follow consistent error handling:

1. **Network errors**: Caught and logged, retry attempted if appropriate
2. **Authentication errors**: Logged at error level, channel marked as inactive
3. **Rate limits**: Respected via platform-specific headers/responses, with backoff
4. **Invalid messages**: Logged at warn level, silently dropped

---

## Rate Limiting

Each channel respects the platform's native rate limits:
- **Telegram**: 30 messages/second for bots, tracked via response headers
- **Discord**: 50 requests/5s per route, tracked via `X-RateLimit-*` headers
- **Slack**: Tiered limits per method, tracked via `Retry-After` header
- **WhatsApp**: 80 messages/second per phone number
- **Matrix**: Per-homeserver limits, typically ~100 requests/minute

---

## Related Documentation

- [`gateway/`](../gateway/README.md) — Gateway where channels are registered
- [`providers/`](../providers/README.md) — The other side of the message pipeline
- [`server/`](../server/README.md) — HTTP server that hosts webhook routes for channels
- [`webhooks/`](../webhooks/README.md) — Webhook server for channel events
- [`auto-reply/`](../auto-reply/README.md) — Handler that connects channel messages to agents
- [`plugin-sdk/`](../plugin-sdk/README.md) — Channel interface definitions for plugins
