# Telegram Channel (`src/channels/telegram/`)

> **Telegram Bot API adapter — send and receive messages via Telegram.**

---

## Overview

The `TelegramChannel` class implements the `Channel` interface for the Telegram Bot API. It handles sending text messages, photos, stickers, and documents, as well as receiving webhook updates from Telegram's servers.

Telegram is one of the most popular channels in Agent Gateway due to its simple Bot API, rich media support, and widespread global adoption.

---

## File Structure

```
telegram/
└── index.ts    # TelegramChannel implementation
```

---

## API Reference

### Constructor

```typescript
new TelegramChannel(config: { token: string; parseMode?: string })
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `token` | ✅ | — | Bot API token from @BotFather |
| `parseMode` | ❌ | `"MarkdownV2"` | Default parse mode for messages |

### Methods

#### `sendMessage(chatId: string, text: string, options?)`

Sends a text message to a Telegram chat.

```typescript
await channel.sendMessage('123456789', 'Hello, *world*!', {
  parseMode: 'MarkdownV2',
  replyTo: '987654321',
});
```

Uses the [`sendMessage`](https://core.telegram.org/bots/api#sendmessage) Bot API endpoint.

#### `sendPhoto(chatId: string, photo: string | Buffer, caption?)`

Sends a photo to a Telegram chat.

```typescript
await channel.sendPhoto('123456789', Buffer.from(imageData), 'Photo caption');
```

Supports both file IDs (string) and binary data (Buffer).

#### `sendSticker(chatId: string, sticker: string)`

Sends a sticker by its file ID.

```typescript
await channel.sendSticker('123456789', 'CAACAgIAAxkBAAIBZ...');
```

#### `sendDocument(chatId: string, document: string | Buffer, caption?)`

Sends a document/file to a chat.

```typescript
await channel.sendDocument('123456789', Buffer.from(pdfData), 'Report.pdf');
```

#### `setWebhook(url: string, secretToken?: string)`

Registers a webhook URL with Telegram. After setting, Telegram will POST all updates to this URL instead of requiring polling.

```typescript
await channel.setWebhook('https://example.com/webhook/telegram/bot123', 'my-secret');
```

#### `handleWebhookUpdate(body: unknown)`

Processes an incoming webhook POST body and converts it to a normalized `ChannelMessage`.

Supports all Telegram update types:
- **Message**: Regular text messages
- **Photo**: Messages with photos
- **Document**: Messages with files
- **Sticker**: Messages with stickers
- **Reply**: Messages that are replies to other messages

#### `getMe()`

Returns the bot's user info. Useful for verifying the token is valid.

```typescript
const bot = await channel.getMe();
console.log(bot.username); // "my_bot"
```

#### `start(onMessage)` / `stop()`

Starts/stops message reception. In webhook mode, this is a no-op (webhooks are handled by the HTTP server). In polling mode, starts periodic `getUpdates()` calls.

---

## Telegram API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `https://api.telegram.org/bot{token}/sendMessage` | POST | Send text message |
| `https://api.telegram.org/bot{token}/sendPhoto` | POST | Send photo |
| `https://api.telegram.org/bot{token}/sendSticker` | POST | Send sticker |
| `https://api.telegram.org/bot{token}/sendDocument` | POST | Send document |
| `https://api.telegram.org/bot{token}/getMe` | GET | Get bot info |
| `https://api.telegram.org/bot{token}/setWebhook` | POST | Register webhook URL |
| `https://api.telegram.org/bot{token}/getUpdates` | GET | Poll for updates |
| `https://api.telegram.org/bot{token}/getFile` | GET | Get file download link |

All requests use `undici` fetch with the bot token in the URL path.

---

## Message Parsing

Telegram supports three parse modes:

| Parse Mode | Description | Example |
|------------|-------------|---------|
| `MarkdownV2` | Telegram's markdown v2 (recommended) | `\*bold\* \_italic\_` |
| `HTML` | HTML tags | `<b>bold</b> <i>italic</i>` |
| `Markdown` | Legacy markdown (deprecated) | `*bold* _italic_` |

The adapter defaults to `MarkdownV2` for its richer feature set. When sending AI responses, the adapter automatically escapes special characters if parse mode is MarkdownV2.

---

## Webhook Processing

When Telegram sends an update to the webhook:

1. The HTTP server receives the POST at `/webhook/telegram/:botId`
2. The request is routed to `handleWebhookUpdate()`
3. The update type is determined (`message`, `edited_message`, `channel_post`, etc.)
4. For message updates, a `ChannelMessage` is constructed:
   ```typescript
   {
     id: String(update.message.message_id),
     channelType: 'telegram',
     chatId: String(update.message.chat.id),
     from: {
       id: String(update.message.from.id),
       username: update.message.from.username,
       displayName: update.message.from.first_name,
       isBot: update.message.from.is_bot,
     },
     text: update.message.text,
     replyTo: update.message.reply_to_message?.message_id,
     attachments: update.message.photo ? [...] : [],
     raw: update,
     timestamp: new Date(update.message.date * 1000),
   }
   ```
5. The message is passed to the Gateway's auto-reply handler

---

## Rate Limits

Telegram enforces these limits for bots:
- **30 messages/second** across all chats
- **20 messages/minute** to the same chat
- **Broadcast**: 1 message/second to different chats (up to 30/second total)

The adapter does NOT implement client-side rate limiting — it relies on Telegram's API to return 429 responses, which are logged and retried with exponential backoff.

---

## Getting a Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow the instructions
3. Choose a name and username for your bot
4. BotFather returns a token like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`
5. Set the token as `TELEGRAM_TOKEN` in your `.env` file

### BotFather Commands

| Command | Description |
|---------|-------------|
| `/newbot` | Create a new bot |
| `/token` | Regenerate the bot token |
| `/setdescription` | Set bot description |
| `/setabouttext` | Set bot about text |
| `/setuserpic` | Set bot profile picture |
| `/setcommands` | Set bot command list |
| `/deletebot` | Delete the bot |

---

## Error Handling

| Error | Behavior |
|-------|----------|
| Invalid token | Logs error at startup, channel not registered |
| 429 Too Many Requests | Logs warning, retries after `Retry-After` seconds |
| Chat not found | Logs warning, message dropped |
| Bot blocked by user | Logs warning, subsequent messages to this user are skipped |
| Network error | Logs error, retries with exponential backoff |

---

## Related Documentation

- [`channels/`](../README.md) — Parent channels module
- [`types.ts`](../types.ts) — Channel type definitions
- [`server/`](../../server/README.md) — HTTP server with webhook routes
- [Telegram Bot API Docs](https://core.telegram.org/bots/api) — Official API reference
