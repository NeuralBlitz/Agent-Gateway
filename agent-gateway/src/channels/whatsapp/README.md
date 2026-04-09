# WhatsApp Channel (`src/channels/whatsapp/`)

> **Meta Graph API v18 adapter — send and receive messages via WhatsApp Business.**

---

## Overview

The `WhatsAppChannel` class implements the `Channel` interface for the Meta WhatsApp Business Platform (Graph API v18). It supports sending text messages, images, documents, and template messages, as well as handling incoming webhook events from Meta's servers.

WhatsApp Business API requires a Meta for Developers account and is designed for business-to-consumer communication at scale.

---

## File Structure

```
whatsapp/
└── index.ts    # WhatsAppChannel implementation
```

---

## API Reference

### Constructor

```typescript
new WhatsAppChannel(config: {
  token: string;
  phoneNumberId: string;
  baseUrl?: string;
})
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `token` | ✅ | — | Meta Access Token |
| `phoneNumberId` | ✅ | — | WhatsApp Business phone number ID |
| `baseUrl` | ❌ | `https://graph.facebook.com/v18.0` | Custom Graph API base URL |

### Methods

#### `sendMessage(phoneNumber: string, text: string)`

Sends a text message to a WhatsApp user.

```typescript
await channel.sendMessage('+1234567890', 'Hello from Agent Gateway!');
```

Uses the [`/messages`](https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages) endpoint.

#### `sendImage(phoneNumber: string, imageUrl: string | Buffer, caption?: string)`

Sends an image message with an optional caption.

```typescript
await channel.sendImage('+1234567890', 'https://example.com/image.jpg', 'Check this out!');
```

Supports both URL (uploaded to a publicly accessible location) and binary data.

#### `sendDocument(phoneNumber: string, documentUrl: string | Buffer, filename: string)`

Sends a document/file to a user.

```typescript
await channel.sendDocument('+1234567890', Buffer.from(pdfData), 'report.pdf');
```

#### `sendTemplate(phoneNumber: string, templateName: string, language: string, variables?: string[])`

Sends a pre-approved template message. Templates are required for outbound messages to users who haven't messaged the business in the last 24 hours.

```typescript
await channel.sendTemplate('+1234567890', 'welcome_message', 'en', ['John']);
```

#### `markAsRead(messageId: string)`

Marks a message as read (blue double-check marks).

```typescript
await channel.markAsRead('wamid.HBgL...');
```

#### `handleWebhookEvent(body: unknown)`

Processes an incoming WhatsApp webhook from Meta and converts it to a `ChannelMessage`.

Handles event types:
- **Text messages**: `messages[0].type === "text"`
- **Image messages**: `messages[0].type === "image"`
- **Document messages**: `messages[0].type === "document"`
- **Audio messages**: `messages[0].type === "audio"`
- **Status updates**: `statuses` array (delivered, read, failed)

---

## Meta Graph API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/{phone-number-id}/messages` | POST | Send message |
| `/{phone-number-id}/messages` | GET | Get message status |
| `/media` | POST | Upload media |
| `/media/{media-id}` | GET | Download media |
| `/phone-numbers` | GET | Get phone number info |

Base URL: `https://graph.facebook.com/v18.0`

---

## Authentication

### Required Credentials

1. **Access Token**: From Meta for Developers dashboard
   - System User token (recommended for production)
   - Or User token (for testing)

2. **Phone Number ID**: The WhatsApp Business phone number identifier
   - Found in the WhatsApp Business Platform app settings
   - Format: Numeric string (e.g., `123456789012345`)

### Getting Credentials

1. Go to [developers.facebook.com](https://developers.facebook.com/)
2. Create a Business App (or use existing)
3. Add the **WhatsApp** product
4. Set up a phone number for the Business Account
5. Generate an Access Token in the API Setup page
6. Find your Phone Number ID in the WhatsApp > API Settings page

---

## Message Types

### Text Messages
Plain text up to 4096 characters. Longer messages are automatically split.

### Image Messages
- JPEG or PNG format
- Max 5MB
- Optional caption (max 1024 characters)

### Document Messages
- PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX
- Max 100MB
- Required filename for display

### Template Messages
Pre-approved message templates for outbound communication:
- Must be approved by Meta before use
- Can include variable substitution
- Support buttons and call-to-action URLs

---

## The 24-Hour Window

WhatsApp enforces a **24-hour customer service window**:

| Scenario | Can Send |
|----------|----------|
| User messaged you within 24h | ✅ Any message type |
| User hasn't messaged in 24h+ | ❌ Only template messages |
| Template approved | ✅ Can initiate conversation |

When the 24-hour window closes, the bot can only send pre-approved template messages until the user initiates a new conversation.

---

## Webhook Processing

### Webhook Structure

Meta sends webhooks with this structure:

```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "BUSINESS_ACCOUNT_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "1234567890",
          "phone_number_id": "0987654321"
        },
        "messages": [{
          "from": "1234567890",
          "id": "wamid.HBgL...",
          "timestamp": "1704067200",
          "type": "text",
          "text": { "body": "Hello!" }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### Webhook Validation

Meta signs webhook requests with an `X-Hub-Signature-256` header. The adapter validates this signature against the configured webhook secret to prevent forged requests.

### Webhook Verification

When first configuring the webhook URL, Meta sends a GET request for verification:
```
GET /webhook/whatsapp?hub.mode=subscribe&hub.challenge=CHALLENGE&hub.verify_token=TOKEN
```

The server responds with the challenge value to complete verification.

---

## Rate Limits

WhatsApp Business Platform rate limits:

| Endpoint | Limit |
|----------|-------|
| Send messages | 80 messages/second per phone number |
| Upload media | 50 requests/second |
| Phone numbers | 50 requests/second |

Business tiers determine the messaging tier limit:
- **Tier 1**: 1K unique users/24h
- **Tier 2**: 10K unique users/24h
- **Tier 3**: 100K unique users/24h
- **Tier 4**: Unlimited

---

## Message Status Events

WhatsApp sends status updates as separate webhook events:

| Status | Description |
|--------|-------------|
| `sent` | Message left the sender's phone |
| `delivered` | Message arrived on recipient's phone |
| `read` | Recipient opened the message |
| `failed` | Message failed to deliver |

The adapter logs status events but does not take automatic action on them.

---

## Error Handling

| Error | Behavior |
|-------|----------|
| Invalid token | 401 response, channel disabled at startup |
| Invalid phone number ID | 400 response, logged at error level |
| User not found | Message dropped, warning logged |
| 24-hour window closed | Template required, logged at warn level |
| Rate limited | Waits `Retry-After`, retries |
| Template not found | Error logged, message not sent |
| Media upload failed | Error logged, fallback to text-only |

---

## Related Documentation

- [`channels/`](../README.md) — Parent channels module
- [WhatsApp Business Platform Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/) — Official reference
- [Meta for Developers](https://developers.facebook.com/) — App management
