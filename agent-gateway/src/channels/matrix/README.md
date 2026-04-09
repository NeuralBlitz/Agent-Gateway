# Matrix Channel (`src/channels/matrix/`)

> **Matrix Client-Server API adapter — send and receive messages via Matrix protocol.**

---

## Overview

The `MatrixChannel` class implements the `Channel` interface for the Matrix Client-Server API (r0.6.0 / v3). Matrix is an open-source, federated messaging protocol that supports E2E encryption, rooms, bridging to other platforms, and is popular in privacy-conscious and open-source communities.

The adapter supports sending text messages, replies, notices, room management, and receiving events via Matrix's `/sync` endpoint.

---

## File Structure

```
matrix/
└── index.ts    # MatrixChannel implementation
```

---

## API Reference

### Constructor

```typescript
new MatrixChannel(config: {
  homeserverUrl: string;
  accessToken: string;
  userId?: string;
})
```

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| `homeserverUrl` | ✅ | — | Matrix homeserver URL (e.g., `https://matrix.org`) |
| `accessToken` | ✅ | — | Matrix access token |
| `userId` | ❌ | Retrieved from `/whoami` | Matrix user ID (e.g., `@bot:matrix.org`) |

### Methods

#### `sendMessage(roomId: string, text: string)`

Sends a text message to a Matrix room.

```typescript
await channel.sendMessage('!abcDEFghi:matrix.org', 'Hello, Matrix!');
```

Sends an `m.room.message` event with `msgtype: "m.text"`.

#### `sendReply(roomId: string, eventId: string, text: string)`

Sends a reply to a specific event in a room.

```typescript
await channel.sendReply('!abcDEFghi:matrix.org', '$event123', 'Replying to this message');
```

Uses `m.relates_to` with `m.in_reply_to` to create the reply relationship.

#### `sendNotice(roomId: string, text: string)`

Sends a notice (bot/automated message) to a room.

```typescript
await channel.sendNotice('!abcDEFghi:matrix.org', 'System maintenance in 5 minutes');
```

Sends with `msgtype: "m.notice"`. Notices are typically displayed differently from regular messages (e.g., not highlighted).

#### `joinRoom(roomIdOrAlias: string)`

Joins a Matrix room by ID or alias.

```typescript
await channel.joinRoom('#general:matrix.org');
await channel.joinRoom('!abcDEFghi:matrix.org');
```

#### `leaveRoom(roomId: string)`

Leaves a Matrix room.

```typescript
await channel.leaveRoom('!abcDEFghi:matrix.org');
```

#### `getRoomMembers(roomId: string)`

Retrieves the list of members in a room.

```typescript
const members = await channel.getRoomMembers('!abcDEFghi:matrix.org');
console.log(members.length); // Number of members
```

#### `createRoom(options?)`

Creates a new Matrix room with optional configuration.

```typescript
const room = await channel.createRoom({
  name: 'Bot Testing',
  topic: 'Test room for the bot',
  preset: 'trusted_private_chat',
});
console.log(room.room_id); // "!newRoomId:matrix.org"
```

#### `handleSyncEvent(syncResponse: unknown)`

Processes a Matrix `/sync` response and extracts new message events.

Iterates through `rooms.join[].timeline.events`, filtering for:
- `type === "m.room.message"`
- Events not sent by the bot itself
- Converts to `ChannelMessage` format

---

## Matrix API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/client/v3/rooms/{roomId}/send/m.room.message/{txnId}` | PUT | Send message |
| `/client/v3/join/{roomIdOrAlias}` | POST | Join room |
| `/client/v3/rooms/{roomId}/leave` | POST | Leave room |
| `/client/v3/sync` | GET | Sync events (long-polling) |
| `/client/v3/rooms/{roomId}/members` | GET | Get room members |
| `/client/v3/createRoom` | POST | Create room |
| `/client/v3/whoami` | GET | Get current user ID |
| `/client/v3/login` | POST | Login (if not using token) |

---

## Authentication

### Access Token

Matrix access tokens are obtained through:

1. **Login**: POST to `/client/v3/login` with username/password
2. **Registration**: POST to `/client/v3/register` for new accounts
3. **Existing token**: From an existing Matrix client's settings

Token format: Opaque string, e.g., `syT_abc123def456...`

### Setting the Token

```bash
# Via environment variable
export MATRIX_ACCESS_TOKEN="syT_abc123..."
export MATRIX_HOMESERVER_URL="https://matrix.org"

# Or in config file
{
  "channels": {
    "matrix": {
      "homeserverUrl": "https://matrix.org",
      "accessToken": "syT_abc..."
    }
  }
}
```

---

## Message Types

### m.text
Regular text message. The most common message type.

### m.notice
Automated/bot message. Displayed differently in most clients — not highlighted, shown in smaller text. Appropriate for:
- System notifications
- Status updates
- Bot announcements

### m.emote
Action message. Displayed as `/me waves` → `* BotName waves`

### m.room.message (with m.relates_to)
Reply message. Links to the original event via `m.in_reply_to`:

```json
{
  "msgtype": "m.text",
  "body": "> <@user:matrix.org> Original message\n\nMy reply",
  "m.relates_to": {
    "m.in_reply_to": {
      "event_id": "$original_event_id"
    }
  }
}
```

---

## Message Reception via /sync

Matrix uses the `/sync` endpoint for event reception:

1. Call `GET /sync?timeout=30000&since={token}` (long-polling, up to 30s)
2. Response contains all events since the `since` token
3. Iterate through `rooms.join[roomId].timeline.events`
4. Filter for `type === "m.room.message"` events
5. Skip events sent by the bot itself (via `sender` field)
6. Convert each event to `ChannelMessage` format
7. Update the `next_batch` token for the next sync call

### Sync Response Structure

```json
{
  "next_batch": "s1234_5678",
  "rooms": {
    "join": {
      "!abcDEF:matrix.org": {
        "timeline": {
          "events": [
            {
              "type": "m.room.message",
              "sender": "@user:matrix.org",
              "content": {
                "msgtype": "m.text",
                "body": "Hello bot!"
              },
              "event_id": "$event123",
              "origin_server_ts": 1704067200000
            }
          ],
          "limited": false,
          "prev_batch": "s1234_0000"
        }
      }
    }
  }
}
```

---

## Room IDs vs Aliases

Matrix has two ways to identify rooms:

| Type | Format | Description |
|------|--------|-------------|
| **Room ID** | `!abcDEFghi:matrix.org` | Unique, immutable identifier |
| **Room Alias** | `#general:matrix.org` | Human-readable, can change |

The adapter accepts both formats for joining rooms.

---

## Homeservers

Popular Matrix homeservers:

| Homeserver | URL | Notes |
|------------|-----|-------|
| **matrix.org** | `https://matrix.org` | Largest public homeserver |
| **gnu.one** | `https://gnu.one` | Privacy-focused |
| **Self-hosted** | Your own URL | Use Synapse or Dendrite |

For production, consider self-hosting with [Synapse](https://github.com/element-hq/synapse) or [Dendrite](https://github.com/matrix-org/dendrite).

---

## E2E Encryption

This adapter does **NOT** implement Matrix's E2E encryption (Megolm/Olm). Messages are sent and received as plaintext events.

If you need E2E encryption:
- Use a homeserver that supports appservice bots with encryption
- Integrate with [matrix-js-sdk](https://github.com/matrix-org/matrix-js-sdk) which handles encryption
- Note: Encryption requires the bot to be a full Matrix client with crypto storage

---

## Rate Limiting

Matrix homeservers enforce rate limits. The homeserver may return `M_LIMIT_EXCEEDED` errors with `retry_after_ms` fields.

Default Synapse limits:
- **Message sending**: ~10/second
- **Sync calls**: 1 concurrent sync per user
- **Room operations**: ~5/second

---

## Error Handling

| Error Code | Meaning | Behavior |
|------------|---------|----------|
| `M_FORBIDDEN` | Not invited to room | Logged at warn level |
| `M_NOT_FOUND` | Room doesn't exist | Logged at warn level |
| `M_UNKNOWN_TOKEN` | Invalid/expired token | Channel disabled, logged at error |
| `M_LIMIT_EXCEEDED` | Rate limited | Waits `retry_after_ms`, retries |
| `M_BAD_JSON` | Malformed request | Logged at error level |
| Network error | Homeserver unreachable | Logged at error level, retries with backoff |

---

## Related Documentation

- [`channels/`](../README.md) — Parent channels module
- [Matrix Specification](https://spec.matrix.org/latest/client-server-api/) — Official spec
- [Synapse](https://github.com/element-hq/synapse) — Reference homeserver
- [Element](https://element.io/) — Popular Matrix client
