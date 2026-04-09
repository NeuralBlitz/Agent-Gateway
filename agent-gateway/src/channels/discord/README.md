# Discord Channel (`src/channels/discord/`)

> **Discord REST API v10 adapter — send and receive messages via Discord.**

---

## Overview

The `DiscordChannel` class implements the `Channel` interface for Discord's REST API v10. It supports sending text messages, rich embeds, replies, reactions, and handling Discord Gateway events for real-time message reception.

Discord's API is more complex than Telegram's but offers richer features like embeds, threads, and fine-grained permissions.

---

## File Structure

```
discord/
└── index.ts    # DiscordChannel implementation
```

---

## API Reference

### Constructor

```typescript
new DiscordChannel(config: { token: string; baseUrl?: string })
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `token` | ✅ | — | Discord Bot token |
| `baseUrl` | ❌ | `https://discord.com/api/v10` | Custom API base URL |

### Methods

#### `sendMessage(channelId: string, text: string, options?)`

Sends a text message to a Discord channel.

```typescript
await channel.sendMessage('123456789012345678', 'Hello, Discord!');
```

Uses the [`/channels/{id}/messages`](https://discord.com/developers/docs/resources/channel#create-message) endpoint.

#### `sendEmbed(channelId: string, embed: DiscordEmbed, content?)`

Sends a rich embed message with structured content.

```typescript
await channel.sendEmbed('123456789', {
  title: 'Weather Report',
  description: 'Current conditions in your area',
  color: 0x0099ff,
  fields: [
    { name: 'Temperature', value: '72°F', inline: true },
    { name: 'Humidity', value: '45%', inline: true },
  ],
  timestamp: new Date().toISOString(),
});
```

#### `sendReply(channelId: string, messageId: string, text: string)`

Sends a reply to a specific Discord message.

```typescript
await channel.sendReply('channel-id', 'message-id-to-reply-to', 'Replied!');
```

Uses Discord's `message_reference` field to create a threaded reply.

#### `addReaction(channelId: string, messageId: string, emoji: string)`

Adds a reaction emoji to a message.

```typescript
await channel.addReaction('channel-id', 'message-id', '👍');
```

#### `deleteMessage(channelId: string, messageId: string)`

Deletes a message from a channel. Requires bot to have Manage Messages permission.

```typescript
await channel.deleteMessage('channel-id', 'message-id');
```

#### `createDM(userId: string)`

Opens a DM channel with a user.

```typescript
const dmChannel = await channel.createDM('user-id');
console.log(dmChannel.id); // DM channel ID for sending messages
```

#### `handleGatewayEvent(event: DiscordGatewayEvent)`

Processes a Discord Gateway event (from WebSocket) and converts it to a `ChannelMessage`.

Handles event types:
- `MESSAGE_CREATE`: New messages
- `MESSAGE_UPDATE`: Message edits
- `MESSAGE_DELETE`: Message deletions (logged, no action)

#### `getInfo()`

Returns channel metadata including bot username and avatar.

---

## Discord API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/channels/{id}/messages` | POST | Send message |
| `/channels/{id}/messages` | GET | Get channel messages |
| `/channels/{id}/messages/{id}` | DELETE | Delete message |
| `/channels/{id}/messages/{id}/reactions/{emoji}` | PUT | Add reaction |
| `/users/@me/channels` | POST | Create DM channel |
| `/users/@me` | GET | Get current bot user |
| `/webhooks/{id}/{token}` | POST | Webhook message sending |

Base URL: `https://discord.com/api/v10`

---

## Authentication

Discord bot tokens have a specific format:
```
Bot MTEyMzQ1Njc4OTAxMjM0NTY3OA.GxYzAb.cdefghijklmnopqrstuvwxyz123456
```

The `Bot ` prefix is **required** and must be included in the `Authorization` header.

### Getting a Bot Token

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Go to "Bot" in the left sidebar
4. Click "Reset Token" or "View Token"
5. Enable required **Privileged Gateway Intents**:
   - **Message Content Intent**: Required to read message content
   - **Server Members Intent**: Required to see user nicknames
6. Copy the token

### Required Intents

For the bot to function properly, enable these intents in the Developer Portal:

| Intent | Required For |
|--------|-------------|
| **Guild Messages** | Receiving messages in servers |
| **Message Content** | Reading what users type |
| **Guild Members** | User nickname resolution |

---

## Message Reception

Discord uses a **Gateway WebSocket** connection for real-time events. The adapter:

1. Connects to `wss://gateway.discord.gg/?v=10&encoding=json`
2. Authenticates with the bot token
3. Receives events in real-time
4. Filters for `MESSAGE_CREATE` events
5. Ignores messages from bots (including itself)
6. Converts to `ChannelMessage` format

### Gateway Event Structure

```json
{
  "t": "MESSAGE_CREATE",
  "d": {
    "id": "123456789012345678",
    "channel_id": "987654321098765432",
    "author": {
      "id": "111222333444555666",
      "username": "user123",
      "discriminator": "0",
      "global_name": "User Display"
    },
    "content": "Hello bot!",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "referenced_message": null
  }
}
```

---

## Rich Embeds

Discord embeds support extensive formatting:

```typescript
interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;  // Decimal color (e.g., 0x0099ff = 39423)
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  author?: { name: string; url?: string; icon_url?: string };
  fields?: { name: string; value: string; inline?: boolean }[];
}
```

The AI agent can generate embeds dynamically based on the response content, creating visually rich responses.

---

## Rate Limits

Discord enforces strict rate limits with headers:

| Header | Description |
|--------|-------------|
| `X-RateLimit-Limit` | Max requests per window |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-RateLimit-Reset` | Window reset timestamp (Unix ms) |
| `X-RateLimit-Scope` | `user`, `global`, or `channel` |

Default limits:
- **50 messages/5s** per channel
- **5 global requests/5s** (across all channels)

On 429 responses, the adapter waits for `Retry-After` milliseconds before retrying.

---

## Permissions

The bot needs these permissions in each server:

| Permission | Required For |
|------------|-------------|
| **Send Messages** | Posting responses |
| **Read Message History** | Understanding context |
| **Add Reactions** | Reaction features |
| **Manage Messages** | Deleting messages |
| **Embed Links** | Sending embeds |
| **Attach Files** | Sending attachments |
| **Use External Emojis** | Custom emoji reactions |

---

## Error Handling

| HTTP Status | Meaning | Behavior |
|-------------|---------|----------|
| 400 | Bad Request | Logs error, message dropped |
| 401 | Unauthorized | Invalid token, channel disabled |
| 403 | Forbidden | Missing permissions, logged |
| 404 | Not Found | Channel doesn't exist |
| 429 | Rate Limited | Waits `Retry-After`, retries |
| 5xx | Server Error | Logs error, retries with backoff |

---

## Related Documentation

- [`channels/`](../README.md) — Parent channels module
- [`types.ts`](../types.ts) — Channel type definitions
- [Discord API Docs](https://discord.com/developers/docs/intro) — Official reference
- [Discord Developer Portal](https://discord.com/developers/applications) — Bot management
