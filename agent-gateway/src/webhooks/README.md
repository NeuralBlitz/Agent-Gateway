# Webhooks (`src/webhooks/`)

> **Standalone webhook HTTP server — receive incoming webhook events from messaging platforms.**

---

## Overview

The `webhooks/` module implements a standalone webhook HTTP server that receives incoming events from messaging platforms. While the main `AgentServer` can also handle webhooks, the `WebhookServer` provides a dedicated server that can be deployed separately for security or scaling reasons.

Webhook servers accept POST requests from platforms like Telegram, Discord, and Slack, parse the platform-specific format, convert to normalized `ChannelMessage` objects, and forward them to the gateway for processing.

---

## File Structure

```
webhooks/
└── index.ts    # WebhookServer implementation
```

---

## The `WebhookServer` Class

### Constructor

```typescript
new WebhookServer(config: {
  host?: string;
  port?: number;
  secret?: string;
})
```

| Parameter | Default | Description |
|-----------|---------|-------------|
| `host` | `"0.0.0.0"` | Server bind address |
| `port` | `3001` | Server port (different from main server) |
| `secret` | — | Shared secret for webhook validation |

### Why a Separate Server?

| Aspect | Main Server | Webhook Server |
|--------|------------|----------------|
| Port | 3000 | 3001 (configurable) |
| Purpose | User-facing API | Platform-to-platform communication |
| Authentication | API key | Platform-specific secrets |
| Exposure | Public internet | Only platform IPs |
| Scaling | Scale independently | Can scale separately |

---

## Webhook Routes

### Telegram

**Path**: `/webhook/telegram/:botId`

Receives Telegram Bot API webhook updates. Validates the request and routes to the appropriate Telegram channel handler.

```json
{
  "update_id": 123456,
  "message": {
    "message_id": 789,
    "from": { "id": 123456, "username": "user123" },
    "chat": { "id": 123456 },
    "text": "Hello!"
  }
}
```

### Discord

**Path**: `/webhook/discord/:channelId`

Receives Discord interaction webhook events.

```json
{
  "type": 0,
  "channel_id": "123456789",
  "message": {
    "content": "Hello!",
    "author": { "id": "123456", "username": "user123" }
  }
}
```

### Slack

**Path**: `/webhook/slack/events`

Receives Slack Event API callbacks.

```json
{
  "token": "xxx",
  "team_id": "T123",
  "event": {
    "type": "message",
    "channel": "C123",
    "user": "U123",
    "text": "Hello!",
    "ts": "1704067200.123456"
  }
}
```

---

## Request Processing Pipeline

### Step 1: Body Parsing
The server parses the request body as JSON. Content-Type must be `application/json`.

### Step 2: Secret Validation
If a secret is configured, the server validates the request signature:

- **Telegram**: Validates `X-Telegram-Bot-Api-Secret-Token` header
- **Discord**: Validates Discord's signature headers
- **Slack**: Validates `X-Slack-Signature` using the signing secret

Invalid signatures receive a 401 response.

### Step 3: Platform-Specific Parsing
The raw webhook body is converted to a normalized `ChannelMessage`:

```typescript
const message = channel.handleEvent(body);
```

### Step 4: Gateway Routing
The normalized message is passed to the gateway's message handler:

```typescript
await gateway.handleMessage(
  message.channelType,
  message.from.id,
  message.text,
);
```

### Step 5: Response
The webhook server responds to the platform with a 200 OK:

- **Telegram**: Responds with `{ "ok": true }` quickly to prevent retries
- **Discord**: Responds with 204 No Content
- **Slack**: Responds with 200 OK within 3 seconds (required by Slack)

---

## Security

### Secret Token Validation

Each webhook route can be configured with a secret:

```json
{
  "webhooks": {
    "secret": "my-shared-secret"
  }
}
```

Platforms sign their webhook requests with this secret. The server validates signatures before processing.

### IP Allowlisting

For production, consider restricting webhook access to known platform IP ranges:
- **Telegram**: Publish IP ranges at https://core.telegram.org/bots/webhooks
- **Slack**: Signs requests, no fixed IP ranges
- **Discord**: Signs requests, no fixed IP ranges

### HTTPS

Webhooks should always use HTTPS in production. The webhook server itself does NOT implement TLS — it relies on a reverse proxy (nginx, Caddy, etc.) to terminate TLS.

---

## Usage

### As Part of Main Server

The main `AgentServer` can register webhook routes directly. This is the most common setup:

```typescript
const server = new AgentServer(gateway, config);
// Webhook routes are automatically registered
await server.start();
```

### As Standalone Server

For separate deployment:

```typescript
import { WebhookServer, Gateway } from 'agent-gateway';

const webhookServer = new WebhookServer({
  port: 3001,
  secret: process.env.WEBHOOK_SECRET,
});

webhookServer.registerChannel('telegram', telegramChannel);
webhookServer.registerChannel('slack', slackChannel);

await webhookServer.start();
```

---

## Error Handling

| Error | Response | Behavior |
|-------|----------|----------|
| Invalid JSON | 400 Bad Request | Logged at warn level |
| Invalid signature | 401 Unauthorized | Logged at warn level |
| Missing channel | 404 Not Found | Logged at warn level |
| Processing error | 500 Internal Error | Logged at error level |
| Timeout | 504 Gateway Timeout | Platform will retry |

---

## Related Documentation

- [`server/`](../server/README.md) — Main server that can also host webhook routes
- [`channels/`](../channels/README.md) — Channels that process webhook events
- [`gateway/`](../gateway/README.md) — Gateway that routes processed messages
