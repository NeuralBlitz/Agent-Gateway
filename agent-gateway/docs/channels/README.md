# Channel Documentation

> **Messaging platform adapters for Agent Gateway**

This document provides comprehensive documentation for all messaging channel adapters supported by Agent Gateway. Each channel adapter translates platform-specific APIs into the unified `Channel` interface used by the gateway core, enabling consistent message processing regardless of the source platform.

---

## Table of Contents

- [Overview](#overview)
- [Channel Interface](#channel-interface)
- [Channel Registry](#channel-registry)
- [Supported Channels](#supported-channels)
- [Telegram Channel](#telegram-channel)
- [Discord Channel](#discord-channel)
- [Slack Channel](#slack-channel)
- [WhatsApp Channel](#whatsapp-channel)
- [Signal Channel](#signal-channel)
- [Matrix Channel](#matrix-channel)
- [Channel Factory](#channel-factory)
- [Adding Custom Channels](#adding-custom-channels)
- [Channel Lifecycle](#channel-lifecycle)
- [Message Format Normalization](#message-format-normalization)
- [Media Support](#media-support)
- [Webhook Configuration](#webhook-configuration)
- [Error Handling](#error-handling)
- [Testing Channels](#testing-channels)
- [Channel Comparison](#channel-comparison)
- [Troubleshooting](#troubleshooting)

---

## Overview

Location: `/home/runner/workspace/agent-gateway/src/channels/`

Channels are the entry points for all inbound messages and the exit points for all outbound responses. Each channel adapter handles:

- Platform-specific authentication and connection setup
- Inbound message reception (webhooks or polling)
- Message format normalization to the internal standard format
- Outbound message formatting for platform-specific rendering
- Platform-specific events (reactions, edits, deletions)
- Connection lifecycle management (connect, disconnect, reconnect)

---

## Channel Interface

All channels implement the standard `Channel` interface defined in the Plugin SDK:

```typescript
interface Channel {
  /** Unique channel identifier */
  id: string;

  /** Channel type (telegram, discord, etc.) */
  type: string;

  /** Human-readable name */
  name: string;

  /** Whether the channel is currently connected */
  connected: boolean;

  /** Channel-specific configuration */
  config: Record<string, any>;

  /** Establish connection to the platform */
  connect(): Promise<void>;

  /** Disconnect from the platform */
  disconnect(): Promise<void>;

  /** Send a message to a specific chat */
  sendMessage(chatId: string, content: string, options?: any): Promise<void>;

  /** Get user information by ID */
  getUser(userId: string): Promise<ChannelUser | null>;

  /** Get the bot's own information */
  getMe(): Promise<ChannelBot | null>;

  /** Subscribe to platform events */
  on(event: string, handler: Function): void;
}
```

---

## Channel Registry

Channels are registered through the `registerBuiltinChannels()` function in `/home/runner/workspace/agent-gateway/src/channels/index.ts`:

```typescript
import { registerBuiltinChannels } from './channels/index.js';

registerBuiltinChannels();
// Registers: telegram, discord, slack, whatsapp, signal, matrix
```

Individual channels can be created via the factory:

```typescript
import { createChannel } from './channels/index.js';

const telegram = createChannel('telegram', { token: 'your-bot-token' });
```

---

## Supported Channels

| Channel | Type | Status | Primary Use |
|---------|------|--------|-------------|
| **Telegram** | `telegram` | Built-in | Personal bots, group chats, channels |
| **Discord** | `discord` | Built-in | Community bots, server automation |
| **Slack** | `slack` | Built-in | Enterprise bots, workspace automation |
| **WhatsApp** | `whatsapp` | Built-in | Business messaging, customer support |
| **Signal** | `signal` | Stub | Privacy-focused messaging |
| **Matrix** | `matrix` | Built-in | Federated, self-hosted messaging |

---

## Telegram Channel

**Implementation**: `/home/runner/workspace/agent-gateway/src/channels/telegram/`

### Configuration

```jsonc
{
  "channels": {
    "telegram": {
      "token": "your-bot-token-from-botfather"
    }
  }
}
```

### Setup

1. Open Telegram and message `@BotFather`
2. Send `/newbot` and follow the prompts
3. Copy the token and add it to your config
4. Set the webhook (automatic on connect) or use long polling

### Features

| Feature | Supported | Notes |
|---------|-----------|-------|
| Text messages | Yes | Full Unicode support |
| Photos | Yes | Sent as photo with caption |
| Stickers | Yes | Forwarded to AI with description |
| Documents | Yes | File metadata included |
| Inline keyboards | Yes | Via response options |
| Commands | Yes | `/start`, `/help`, custom commands |
| Group chats | Yes | Bot must be added as admin |
| Channels | Yes | Bot must be channel admin |
| Webhooks | Yes | Automatic setup on connect |
| Long polling | Yes | Fallback when webhook unavailable |

### Message Format

Inbound Telegram messages are normalized to:

```json
{
  "channel": "telegram",
  "chatId": "123456789",
  "userId": "123456789",
  "content": "Hello bot!",
  "type": "text",
  "timestamp": 1712345678000
}
```

---

## Discord Channel

**Implementation**: `/home/runner/workspace/agent-gateway/src/channels/discord/`

### Configuration

```jsonc
{
  "channels": {
    "discord": {
      "token": "your-discord-bot-token"
    }
  }
}
```

### Setup

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application and bot
3. Copy the bot token
4. Enable required intents (Message Content, Guild Members)
5. Invite the bot to your server

### Features

| Feature | Supported | Notes |
|---------|-----------|-------|
| Text messages | Yes | DMs and guild channels |
| Embeds | Yes | Rich formatted responses |
| Replies | Yes | Thread replies to messages |
| Reactions | Yes | Incoming reaction events |
| DMs | Yes | Direct messages |
| Gateway events | Yes | Real-time event streaming |
| Slash commands | Yes | Application commands |
| Attachments | Yes | Images, files |

### Intents Required

- `Guilds` -- Always required
- `GuildMessages` -- For channel messages
- `MessageContent` -- For reading message content (Privileged)
- `DirectMessages` -- For DMs (optional)

---

## Slack Channel

**Implementation**: `/home/runner/workspace/agent-gateway/src/channels/slack/`

### Configuration

```jsonc
{
  "channels": {
    "slack": {
      "token": "xoxb-your-slack-bot-token"
    }
  }
}
```

### Setup

1. Go to [Slack API](https://api.slack.com/apps)
2. Create a new app with bot permissions
3. Subscribe to `app_mention` and `message.im` events
4. Set the Events Request URL to your gateway's webhook endpoint
5. Install the app to your workspace

### Features

| Feature | Supported | Notes |
|---------|-----------|-------|
| Rich messages | Yes | Block Kit formatting |
| Reactions | Yes | Emoji reaction events |
| Conversations | Yes | DMs and channels |
| Threads | Yes | Thread replies |
| Events API | Yes | Webhook-based events |
| Mentions | Yes | Bot mention triggers response |
| Interactive components | Yes | Buttons, select menus |

### Required Scopes

- `chat:write` -- Send messages
- `channels:read` -- Read channel info
- `im:read` -- Read DMs
- `app_mentions:read` -- Detect bot mentions

---

## WhatsApp Channel

**Implementation**: `/home/runner/workspace/agent-gateway/src/channels/whatsapp/`

### Configuration

```jsonc
{
  "channels": {
    "whatsapp": {
      "token": "your-whatsapp-cloud-api-token",
      "phoneId": "your-phone-number-id"
    }
  }
}
```

### Setup

1. Create a Meta Developer account
2. Create a WhatsApp Business app
3. Get a phone number ID
4. Generate a Cloud API access token
5. Configure the webhook URL in Meta dashboard

### Features

| Feature | Supported | Notes |
|---------|-----------|-------|
| Text messages | Yes | Full text support |
| Images | Yes | Sent as media messages |
| Documents | Yes | PDFs, docs, etc. |
| Templates | Yes | Pre-approved message templates |
| Read receipts | Yes | Message status updates |
| Webhooks | Yes | Required for inbound messages |
| Interactive messages | Yes | Buttons, list messages |

---

## Signal Channel

**Implementation**: `/home/runner/workspace/agent-gateway/src/channels/signal/`

### Status: Stub

The Signal channel is currently a stub implementation. Full integration requires:

- `signal-cli` installed and configured on the host
- JSON-RPC interface enabled
- Phone number registration and verification

### Planned Features

| Feature | Status |
|---------|--------|
| Text messages | Stub |
| Attachments | Not implemented |
| Group chats | Not implemented |

### Integration Path

To complete the Signal integration:

1. Install `signal-cli` on the host machine
2. Register a phone number
3. Enable the JSON-RPC daemon
4. Implement the channel adapter to communicate with signal-cli
5. Handle inbound messages via the REST API or WebSocket

---

## Matrix Channel

**Implementation**: `/home/runner/workspace/agent-gateway/src/channels/matrix/`

### Configuration

```jsonc
{
  "channels": {
    "matrix": {
      "homeserver": "https://matrix.org",
      "userId": "@bot:matrix.org",
      "accessToken": "your-access-token",
      "deviceId": "agent-gateway"
    }
  }
}
```

### Setup

1. Register a Matrix user (or use an existing account)
2. Generate an access token
3. Configure the homeserver URL
4. The bot joins rooms and syncs events via long-polling

### Features

| Feature | Supported | Notes |
|---------|-----------|-------|
| Rooms | Yes | Join multiple rooms |
| Replies | Yes | In-reply-to relationships |
| Notices | Yes | Bot notification messages |
| Room management | Yes | Invite, kick, ban events |
| Sync events | Yes | Real-time state sync |
| Rich content | Yes | Formatted messages (HTML/Markdown) |

---

## Channel Factory

The channel factory creates channel instances from configuration:

```typescript
import { createChannel } from '/home/runner/workspace/agent-gateway/src/channels/index.js';

const channel = createChannel('telegram', {
  token: process.env.TELEGRAM_TOKEN,
});

await channel.connect();
```

Factory registration is done through `registerChannel()`:

```typescript
import { registerChannel } from './channels/index.js';

registerChannel('mychannel', (config) => new MyChannel(config));
```

---

## Adding Custom Channels

Custom channels are implemented via the Plugin SDK:

1. Create a class extending `BaseChannel`:

```typescript
import { BaseChannel, type ChannelMessage } from 'agent-gateway/plugin-sdk';

export class MyChannel extends BaseChannel {
  async connect(): Promise<void> {
    // Establish connection to your platform
    this.connected = true;
    this.emit('connected');
  }

  async disconnect(): Promise<void> {
    // Clean up connection
    this.connected = false;
  }

  async sendMessage(chatId: string, content: string): Promise<void> {
    // Send message to the platform
  }

  // Handle inbound messages and emit to the event bus
  private handleMessage(platformMessage: any): void {
    const message: ChannelMessage = {
      channel: this.id,
      chatId: platformMessage.chat_id,
      userId: platformMessage.user_id,
      content: platformMessage.text,
      type: 'text',
      timestamp: Date.now(),
    };
    this.emit('message', message);
  }
}
```

2. Package as a plugin with a manifest
3. Install via `agent-gateway plugins install`
4. Configure in `agent-gateway.config.json`

---

## Channel Lifecycle

### Connection Flow

```
createChannel() ─► connect() ─► authenticate ─► start listener ─► emit 'connected'
                                                                    │
                                                                    ▼
                                                          ┌─────────────────┐
                                                          │ Ready to receive│
                                                          │    messages     │
                                                          └─────────────────┘
```

### Disconnection Flow

```
disconnect() ─► stop listener ─► cleanup ─► emit 'disconnected'
```

### Reconnection

Channels should implement automatic reconnection for transient failures:
- Exponential backoff with max retries
- Emit `reconnecting` and `reconnected` events
- Buffer outbound messages during disconnection

---

## Message Format Normalization

All channels normalize inbound messages to a standard format:

```typescript
interface ChannelMessage {
  channel: string;     // Channel type identifier
  chatId: string;      // Platform-specific chat ID
  userId: string;      // Platform-specific user ID
  content: string;     // Message text content
  type: 'text' | 'image' | 'document' | 'sticker' | 'video' | 'audio' | 'location';
  timestamp: number;   // Unix timestamp
  attachments?: Array<{
    url: string;
    type: string;
    mimeType?: string;
    size?: number;
    filename?: string;
  }>;
  replyTo?: string;    // Message ID being replied to
  metadata?: Record<string, any>; // Platform-specific extras
}
```

---

## Media Support

| Channel | Text | Images | Documents | Audio | Video | Stickers |
|---------|------|--------|-----------|-------|-------|----------|
| Telegram | Yes | Yes | Yes | Yes | Yes | Yes |
| Discord | Yes | Yes | Yes | Yes | Yes | Yes |
| Slack | Yes | Yes | Yes | Yes | Yes | Yes |
| WhatsApp | Yes | Yes | Yes | Yes | Yes | No |
| Signal | Stub | -- | -- | -- | -- | -- |
| Matrix | Yes | Yes | Yes | Yes | Yes | No |

---

## Webhook Configuration

Channels that support webhooks (Telegram, Discord, Slack, WhatsApp) require inbound connectivity:

### Ngrok (Development)

```bash
ngrok http 3000
# Copy the HTTPS URL and set as webhook URL in platform dashboard
```

### Production

1. Use a domain with valid TLS certificate
2. Configure reverse proxy to forward to port 3000
3. Set webhook URL in platform dashboard
4. Verify webhook signature (HMAC where supported)

---

## Error Handling

### Connection Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `INVALID_TOKEN` | Wrong or expired token | Regenerate token in platform dashboard |
| `NETWORK_ERROR` | Connectivity issue | Check firewall, DNS, proxy settings |
| `RATE_LIMITED` | Too many connection attempts | Wait and retry with backoff |
| `WEBHOOK_FAILED` | Could not set webhook URL | Verify URL is publicly accessible with TLS |

### Message Errors

| Error | Cause | Resolution |
|-------|-------|------------|
| `CHAT_NOT_FOUND` | Invalid chat ID | Verify the chat ID format |
| `MESSAGE_TOO_LONG` | Content exceeds platform limit | Split message or use documents |
| `USER_BLOCKED_BOT` | User blocked the bot | Handle gracefully, do not retry |

---

## Testing Channels

Run channel-specific tests:

```bash
cd /home/runner/workspace/agent-gateway
npm run test -- channels
```

Test coverage includes:
- Channel creation and connection
- Message sending
- Message receiving and normalization
- Error handling
- Reconnection logic

---

## Channel Comparison

| Feature | Telegram | Discord | Slack | WhatsApp | Signal | Matrix |
|---------|----------|---------|-------|----------|--------|--------|
| **Cost** | Free | Free | Free tier | Per-conversation | Free | Free |
| **Setup Complexity** | Low | Medium | Medium | High | High | Medium |
| **Webhook Support** | Yes | Yes (Gateway) | Yes | Yes | No (polling) | No (polling) |
| **Media Richness** | High | High | Medium | Medium | Low | High |
| **Group Support** | Yes | Yes | Yes | Yes | Yes | Yes |
| **Bot Commands** | Yes | Slash cmds | Slash cmds | Templates | None | None |

---

## Troubleshooting

### Telegram: "401 Unauthorized"

The bot token is invalid or expired. Regenerate from BotFather.

### Discord: "Disallowed Intents"

Enable the required intents in the Discord Developer Portal under Bot settings.

### Slack: "invalid_auth"

The Slack token format is incorrect. Ensure it starts with `xoxb-`.

### WhatsApp: "Invalid phone number ID"

Verify the phone number ID matches the one in your Meta Developer dashboard.

### Matrix: "M_UNKNOWN_TOKEN"

The access token has expired. Re-authenticate with the Matrix server.

### All Channels: Messages Not Received

1. Verify the channel is connected (`GET /api/status`)
2. Check the gateway logs for connection errors
3. Verify webhook URLs are correctly configured
4. Ensure the bot is added to the relevant chat/channel
