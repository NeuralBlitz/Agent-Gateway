# Channels Overview

Agent Gateway supports multiple messaging platforms out of the box. This document covers each channel's features and configuration.

## Supported Channels

| Channel | Status | Features |
|---------|--------|----------|
| Telegram | ✅ Stable | Messages, photos, documents, stickers, buttons, webhooks |
| Discord | ✅ Stable | Messages, embeds, reactions, DM, webhooks |
| Slack | ✅ Stable | Messages, blocks, reactions, channels, webhooks |
| WhatsApp | ✅ Stable | Messages, images, documents, templates, webhooks |
| Signal | ✅ Stable | Messages, groups, webhooks |
| Matrix | ✅ Stable | Messages, rooms, reactions, state |

## Telegram

### Installation

No additional packages required.

### Configuration

```json
{
  "type": "telegram",
  "name": "my-bot",
  "enabled": true,
  "settings": {
    "botToken": "YOUR_BOT_TOKEN",
    "webhookUrl": "https://your-domain.com/webhook/telegram",
    "secretToken": "YOUR_SECRET_TOKEN"
  }
}
```

### Features

- **Messages**: Send and receive text messages
- **Photos**: Send and receive images
- **Documents**: Send and receive files
- **Stickers**: Send stickers
- **Buttons**: Inline keyboard buttons
- **Webhooks**: Receive updates via webhook
- **Commands**: Bot commands support

### Methods

```typescript
import { createTelegramChannel } from 'agent-gateway/channels/telegram';

const channel = createTelegramChannel('main', 'My Bot', {
  botToken: process.env.TELEGRAM_BOT_TOKEN
});

await channel.connect();

// Send message
await channel.sendMessage('123456789', 'Hello!');

// Send photo
await channel.sendPhoto('123456789', 'https://example.com/image.jpg', 'Caption');

// Send sticker
await channel.sendSticker('123456789', 'CAACAgIAAxk...');

// Set webhook
await channel.setWebhook('https://your-domain.com/webhook', 'secret-token');
```

## Discord

### Installation

No additional packages required.

### Configuration

```json
{
  "type": "discord",
  "name": "my-bot",
  "enabled": true,
  "settings": {
    "botToken": "YOUR_DISCORD_BOT_TOKEN",
    "intents": 513
  }
}
```

### Features

- **Messages**: Send and receive text messages
- **Embeds**: Rich embed messages
- **Reactions**: Add/remove reactions
- **DM**: Direct messages
- **Webhooks**: Gateway events

### Methods

```typescript
import { createDiscordChannel } from 'agent-gateway/channels/discord';

const channel = createDiscordChannel('main', 'My Bot', {
  botToken: process.env.DISCORD_BOT_TOKEN
});

await channel.connect();

// Send message
await channel.sendMessage('channel-id', 'Hello!');

// Send embed
await channel.sendEmbed('channel-id', {
  title: 'Hello',
  description: 'This is an embed',
  color: 0x00FF00
});

// Send reply
await channel.sendReply('message-id', 'channel-id', 'Replying to you!');

// Create DM
const dmChannelId = await channel.createDM('user-id');
```

## Slack

### Installation

No additional packages required.

### Configuration

```json
{
  "type": "slack",
  "name": "my-app",
  "enabled": true,
  "settings": {
    "botToken": "xoxb-...",
    "signingSecret": "YOUR_SIGNING_SECRET",
    "appToken": "xapp-..."
  }
}
```

### Features

- **Messages**: Send and receive messages
- **Rich Messages**: Block kit support
- **Reactions**: Add emoji reactions
- **Channels**: Public and private channels
- **Webhooks**: Event handling

### Methods

```typescript
import { createSlackChannel } from 'agent-gateway/channels/slack';

const channel = createSlackChannel('main', 'My App', {
  botToken: process.env.SLACK_BOT_TOKEN
});

await channel.connect();

// Send message
await channel.sendMessage('channel-id', 'Hello!');

// Send rich message
await channel.sendRichMessage('channel-id', [
  {
    type: 'section',
    text: { type: 'mrkdwn', text: 'Hello *world*!' }
  }
]);

// Add reaction
await channel.addReaction('channel-id', '1234567890', 'thumbsup');

// Open conversation
const dmChannelId = await channel.openConversation('user-id');
```

## WhatsApp

### Installation

No additional packages required.

### Configuration

```json
{
  "type": "whatsapp",
  "name": "my-business",
  "enabled": true,
  "settings": {
    "phoneNumberId": "YOUR_PHONE_NUMBER_ID",
    "accessToken": "YOUR_ACCESS_TOKEN",
    "businessAccountId": "YOUR_BUSINESS_ACCOUNT_ID"
  }
}
```

### Features

- **Messages**: Text messages
- **Images**: Send images with captions
- **Documents**: Send documents
- **Templates**: Send message templates
- **Webhooks**: Receive incoming messages
- **Read Status**: Mark messages as read

### Methods

```typescript
import { createWhatsAppChannel } from 'agent-gateway/channels/whatsapp';

const channel = createWhatsAppChannel('main', 'My Business', {
  phoneNumberId: process.env.WHATSAPP_PHONE_ID,
  accessToken: process.env.WHATSAPP_TOKEN
});

await channel.connect();

// Send message
await channel.sendMessage('1234567890', 'Hello!');

// Send image
await channel.sendImage('1234567890', 'https://example.com/image.jpg', 'Check this out!');

// Send template
await channel.sendTemplate('1234567890', 'hello_template', [
  { type: 'body', parameters: [{ type: 'text', parameter_name: 'name', text: 'John' }] }
]);

// Mark as read
await channel.markAsRead('message-id');
```

## Signal

### Installation

No additional packages required.

### Configuration

```json
{
  "type": "signal",
  "name": "my-signal",
  "enabled": true,
  "settings": {
    "signalService": "https://signal.org",
    "phoneNumber": "+1234567890",
    "accountId": "YOUR_ACCOUNT_ID",
    "signalingKey": "YOUR_SIGNALING_KEY"
  }
}
```

### Features

- **Messages**: Send and receive messages
- **Groups**: Group messaging
- **Webhooks**: External message handling

### Methods

```typescript
import { createSignalChannel } from 'agent-gateway/channels/signal';

const channel = createSignalChannel('main', 'My Signal', {
  signalService: 'https://signal.org',
  phoneNumber: process.env.SIGNAL_PHONE,
  accountId: process.env.SIGNAL_ACCOUNT_ID,
  signalingKey: process.env.SIGNAL_KEY
});

await channel.connect();

// Send message
await channel.sendMessage('+1234567890', 'Hello!');

// Send group message
await channel.sendGroupMessage('group-id', 'Hello everyone!');

// Join group
await channel.joinGroup('group-id');
```

## Matrix

### Installation

No additional packages required.

### Configuration

```json
{
  "type": "matrix",
  "name": "my-matrix",
  "enabled": true,
  "settings": {
    "homeserver": "https://matrix.org",
    "userId": "@mybot:matrix.org",
    "accessToken": "YOUR_ACCESS_TOKEN"
  }
}
```

### Features

- **Messages**: Send and receive messages
- **Rooms**: Room management
- **Reactions**: Add reactions
- **State**: State management
- **Webhooks**: Event handling

### Methods

```typescript
import { createMatrixChannel } from 'agent-gateway/channels/matrix';

const channel = createMatrixChannel('main', 'My Matrix', {
  homeserver: process.env.MATRIX_HOMESERVER,
  userId: process.env.MATRIX_USER_ID,
  accessToken: process.env.MATRIX_TOKEN
});

await channel.connect();

// Send message
await channel.sendMessage('!room:matrix.org', 'Hello!');

// Send reply
await channel.sendReply('!room:matrix.org', 'event-id', 'Replying to you!');

// Join room
await channel.joinRoom('!room:matrix.org');

// Create room
const roomId = await channel.createRoom('My Room', 'Room topic');
```

## Adding Custom Channels

To add a custom channel, implement the `Channel` interface:

```typescript
import { Channel, ChannelMessage, ChannelUser, ChannelBot, ChannelConfig, EventEmitter } from 'agent-gateway/channels';

class MyCustomChannel extends EventEmitter implements Channel {
  id: string;
  type: string = 'my-custom';
  name: string = 'My Custom';
  connected: boolean = false;
  config: ChannelConfig;

  constructor(id: string, name: string, config: MyCustomConfig) {
    super();
    this.id = id;
    this.config = config;
  }

  async connect(): Promise<void> {
    // Initialize connection
    this.connected = true;
    this.emit('ready');
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async sendMessage(userId: string, content: string): Promise<void> {
    // Send message implementation
  }

  async getUser(userId: string): Promise<ChannelUser | null> {
    // Return user info
    return { id: userId, name: 'User' };
  }

  async getMe(): Promise<ChannelBot | null> {
    // Return bot info
    return { id: 'bot', name: 'Bot' };
  }
}
```

Then register it:

```typescript
import { registerChannel } from 'agent-gateway/channels';

registerChannel('my-custom', async (config) => {
  return new MyCustomChannel('my-custom', 'My Custom', config);
});
```