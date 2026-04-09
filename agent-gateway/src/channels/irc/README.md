# IRC Channel (`src/channels/irc/`)

> **IRC (Internet Relay Chat) adapter -- connect AI agents to IRC networks via raw socket connections.**

---

## Overview

The `IRCChannel` class implements the `Channel` interface for connecting to IRC (Internet Relay Chat) servers. It uses raw TCP/TLS socket connections to communicate with IRC networks, supporting standard IRC protocol operations including JOIN, PRIVMSG, PING/PONG, and message parsing.

IRC is one of the oldest chat protocols, still widely used in open-source communities, devops teams, and hobbyist channels. This adapter enables AI agents to participate in IRC channels, respond to messages, and interact with users in real-time.

Key characteristics:

- **Raw socket protocol** -- Unlike REST-based channels (Discord, Slack), IRC operates over persistent TCP/TLS connections with a line-based text protocol.
- **No official SDK** -- The adapter implements the IRC protocol (RFC 1459 / RFC 2812) directly using Node.js `net` and `tls` modules.
- **512-byte line limit** -- IRC messages are truncated to 450 characters to stay within the protocol's 512-byte maximum line length.
- **Event-driven** -- Incoming messages are parsed from raw IRC protocol lines and emitted as `ChannelMessage` events.

---

## File Structure

```
irc/
└── index.ts    # IRCChannel implementation with socket-based IRC protocol handling
```

---

## API Reference

### Types

#### `IRCConfig`

Configuration object passed to `createIRCChannel`.

```typescript
export interface IRCConfig {
  /** IRC server hostname (e.g., 'irc.libera.chat') */
  host: string;
  /** IRC server port (default 6667 for plain, 6697 for TLS) */
  port: number;
  /** Bot nickname on IRC */
  nick: string;
  /** List of channels to join on connect */
  channels: string[];
  /** Server password (optional, for password-protected servers) */
  password?: string;
  /** Enable SASL authentication */
  sasl?: boolean;
  /** Enable TLS/SSL encryption */
  tls?: boolean;
}
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `host` | Yes | -- | IRC server hostname (e.g., `irc.libera.chat`, `irc.oftc.net`) |
| `port` | Yes | -- | Server port (6667 plain, 6697 TLS) |
| `nick` | Yes | -- | Bot's IRC nickname |
| `channels` | Yes | -- | Array of channel names to auto-join (e.g., `['#dev', '#general']`) |
| `password` | No | `undefined` | Server password for PASS command |
| `sasl` | No | `false` | Enable SASL authentication mechanism |
| `tls` | No | `false` | Enable TLS/SSL encryption for the connection |

---

### Factory Function

#### `createIRCChannel(id, name, config)`

Creates and returns a new `IRCChannel` instance.

```typescript
function createIRCChannel(
  id: string,
  name: string,
  config: IRCConfig
): IRCChannel
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique identifier for this channel instance |
| `name` | `string` | Human-readable display name |
| `config` | `IRCConfig` | IRC connection configuration |

**Example:**

```typescript
import { createIRCChannel } from './channels/irc/index.js';

const irc = createIRCChannel('irc-1', 'LiberaChat', {
  host: 'irc.libera.chat',
  port: 6697,
  nick: 'MyAIBot',
  channels: ['#myproject', '#general'],
  tls: true,
});
```

---

### Class: `IRCChannel`

Implements the [`Channel`](/home/runner/workspace/agent-gateway/src/channels/types.ts) interface and extends `EventEmitter`.

#### Constructor

```typescript
new IRCChannel(id: string, name: string, config: IRCConfig)
```

Initializes the channel with the given configuration. Does **not** connect automatically -- call `connect()` separately.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique channel identifier |
| `type` | `string` | Always `'irc'` |
| `name` | `string` | Human-readable name |
| `connected` | `boolean` | Whether the channel is currently connected |
| `config` | `IRCConfig` | The active configuration |

#### Methods

##### `connect()`

Establishes a connection to the IRC server.

```typescript
async connect(): Promise<void>
```

**Behavior:**

1. Dynamically imports `net` or `tls` module based on `config.tls`.
2. Creates a socket connection to `host:port`.
3. Registers event handlers for `data`, `connect`, and `error`.
4. On socket `connect`, sends PASS (if configured), NICK, and USER commands.
5. On receiving numeric reply `001` (welcome), joins all configured channels and emits `ready`.

**Example:**

```typescript
await irc.connect();
console.log(irc.connected); // true after ready
```

**Errors:** Throws on connection failure (network unreachable, DNS failure, etc.).

---

##### `disconnect()`

Gracefully disconnects from the IRC server.

```typescript
async disconnect(): Promise<void>
```

**Behavior:**

1. Sends `QUIT :Goodbye` to the server.
2. Destroys the socket.
3. Sets `connected` to `false`.
4. Logs the disconnection.

**Example:**

```typescript
await irc.disconnect();
```

---

##### `sendMessage(userId, content)`

Sends a message to an IRC channel or user.

```typescript
async sendMessage(userId: string, content: string): Promise<void>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | Target channel name (e.g., `#general`) or user nickname |
| `content` | `string` | Message text to send |

**Behavior:**

- Splits multi-line content on `\n` and sends each non-empty line separately.
- Truncates each line to 450 characters to respect IRC's 512-byte line limit.
- Sends via `PRIVMSG` IRC command.

**Example:**

```typescript
await irc.sendMessage('#general', 'Hello from the AI bot!');

// Multi-line messages are split automatically:
await irc.sendMessage('#general', 'Line 1\nLine 2\nLine 3');
// Sends 3 separate PRIVMSG commands
```

---

##### `getUser(userId)`

Returns user information for a given nickname.

```typescript
async getUser(userId: string): Promise<ChannelUser | null>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | IRC nickname to look up |

**Returns:** A `ChannelUser` with `id` and `name` both set to the nickname. IRC protocol does not provide rich user profiles via a simple lookup, so this is a minimal representation.

**Example:**

```typescript
const user = await irc.getUser('someuser');
// { id: 'someuser', name: 'someuser' }
```

---

##### `getMe()`

Returns the bot's own identity on IRC.

```typescript
async getMe(): Promise<ChannelBot | null>
```

**Returns:** A `ChannelBot` with `id` and `name` both set to `config.nick`.

**Example:**

```typescript
const me = await irc.getMe();
// { id: 'MyAIBot', name: 'MyAIBot' }
```

---

### Events

The `IRCChannel` extends `EventEmitter` and emits the following events:

| Event | Payload | When |
|-------|---------|------|
| `ready` | -- | After successfully connecting and joining all configured channels |
| `message` | `ChannelMessage` | When a new message is received in a joined channel |
| `error` | `Error` | On socket-level errors |

**Example:**

```typescript
irc.on('ready', () => {
  console.log('IRC bot is ready and channels joined');
});

irc.on('message', (msg) => {
  console.log(`[${msg.channel}] ${msg.author.name}: ${msg.content}`);
  // Process and respond...
});

irc.on('error', (err) => {
  console.error('IRC error:', err.message);
});
```

---

## IRC Protocol Details

### Connection Sequence

```
Client                          Server
  |                               |
  |------ TCP/TLS connect ------->|
  |                               |
  |<--------- connect ------------|
  |                               |
  |------ PASS <password> ------->|  (if password configured)
  |------ NICK <nick> ----------->|
  |------ USER <nick> 0 * :AI Bot>|
  |                               |
  |<------ :server 001 <nick> ----|  (welcome message)
  |------ JOIN #channel1 ------->|
  |------ JOIN #channel2 ------->|
  |                               |
  |<------ 353 (names list) -----|
  |<------ 366 (end of names) ---|
```

### Message Parsing

Incoming IRC lines are parsed with regex:

```
^:(\S+)!\S+ PRIVMSG (\S+) :(.+)$
```

This captures:
- **Nick**: The sender's nickname
- **Target**: The channel or user receiving the message
- **Message**: The actual text content

### PING/PONG Handling

The adapter automatically responds to server PING messages to keep the connection alive:

```
Server: PING :irc.libera.chat
Client: PONG :irc.libera.chat
```

---

## Configuration Examples

### Basic (Plain Text, No TLS)

```typescript
const irc = createIRCChannel('irc-dev', 'DevChannel', {
  host: 'irc.example.com',
  port: 6667,
  nick: 'AIBot',
  channels: ['#dev'],
});
```

### TLS-Enabled Connection

```typescript
const irc = createIRCChannel('irc-secure', 'SecureChannel', {
  host: 'irc.libera.chat',
  port: 6697,
  nick: 'AIBot',
  channels: ['#myproject', '#general'],
  tls: true,
});
```

### Password-Protected Server

```typescript
const irc = createIRCChannel('irc-private', 'PrivateIRC', {
  host: 'irc.private-server.com',
  port: 6697,
  nick: 'AIBot',
  channels: ['#private'],
  password: 'serverpass123',
  tls: true,
});
```

### Environment Variable Configuration

```typescript
const irc = createIRCChannel('irc-1', 'IRC', {
  host: process.env.IRC_HOST!,
  port: parseInt(process.env.IRC_PORT || '6697', 10),
  nick: process.env.IRC_NICK || 'AIBot',
  channels: (process.env.IRC_CHANNELS || '#general').split(','),
  tls: process.env.IRC_TLS === 'true',
});
```

---

## Integration Points

### With Channel Gateway

The IRC channel integrates with the main gateway through the `Channel` interface defined in [`/home/runner/workspace/agent-gateway/src/channels/types.ts`](/home/runner/workspace/agent-gateway/src/channels/types.ts):

```typescript
// Channel interface compliance
interface Channel {
  id: string;
  type: string;         // 'irc'
  name: string;
  connected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(userId: string, content: string): Promise<void>;
  getUser(userId: string): Promise<ChannelUser | null>;
  getMe(): Promise<ChannelBot | null>;
}
```

### With Other Channels

IRC messages follow the same `ChannelMessage` format as all other channels, enabling consistent message handling across Discord, Slack, Teams, Telegram, Signal, WhatsApp, and Matrix.

See sibling channel adapters:
- [`/home/runner/workspace/agent-gateway/src/channels/discord/`](/home/runner/workspace/agent-gateway/src/channels/discord/)
- [`/home/runner/workspace/agent-gateway/src/channels/slack/`](/home/runner/workspace/agent-gateway/src/channels/slack/)
- [`/home/runner/workspace/agent-gateway/src/channels/telegram/`](/home/runner/workspace/agent-gateway/src/channels/telegram/)
- [`home/runner/workspace/agent-gateway/src/channels/signal/`](/home/runner/workspace/agent-gateway/src/channels/signal/)
- [`/home/runner/workspace/agent-gateway/src/channels/whatsapp/`](/home/runner/workspace/agent-gateway/src/channels/whatsapp/)
- [`/home/runner/workspace/agent-gateway/src/channels/matrix/`](/home/runner/workspace/agent-gateway/src/channels/matrix/)

### With Providers

Messages received via IRC are routed to AI providers (OpenAI, Anthropic, Cohere, etc.) through the gateway's message routing layer. See [`/home/runner/workspace/agent-gateway/src/providers/`](/home/runner/workspace/agent-gateway/src/providers/).

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Network unreachable | `connect()` throws the underlying error, logged via infra logger |
| DNS resolution failure | `connect()` throws, logged with error context |
| Socket error after connect | `connected` set to `false`, `error` event emitted |
| Server disconnect | Socket destroyed, `connected` set to `false` |
| Message exceeds 512 bytes | Automatically truncated to 450 characters per line |
| Own messages | Ignored (filtered by nick comparison in `handleLine`) |
| Empty lines | Skipped silently |

All errors are logged using the infrastructure logger from [`/home/runner/workspace/agent-gateway/src/infra/logger.js`](/home/runner/workspace/agent-gateway/src/infra/logger.js).

---

## Limitations

- **No CTCP support** -- Client-to-client protocol messages (VERSION, PING, etc.) are not explicitly handled.
- **No IRCv3 capabilities** -- Advanced IRCv3 features like message tags, account-notify, and extended-join are not implemented.
- **No WHOIS/WHO commands** -- User lookup returns minimal identity only.
- **No channel mode management** -- Bot cannot set +o, +v, or other channel modes.
- **No DCC support** -- Direct Client-to-Client file transfers are not supported.
- **No automatic reconnection** -- If the connection drops, the adapter does not automatically reconnect.
- **Message length** -- Hard-limited to 450 characters per line due to IRC's 512-byte protocol limit.

---

## Security Considerations

- **TLS recommended** -- Always use `tls: true` on public networks to prevent credential sniffing.
- **Nick collisions** -- IRC does not guarantee nick uniqueness; the bot should handle nick collision scenarios.
- **Channel flooding** -- Be mindful of IRC network flood limits; the gateway should rate-limit AI responses.
- **No message encryption** -- IRC messages (even on TLS) are visible to all channel participants and server operators.

---

## Related Documentation

- [`/home/runner/workspace/agent-gateway/src/channels/`](/home/runner/workspace/agent-gateway/src/channels/) -- Parent channels module
- [`/home/runner/workspace/agent-gateway/src/channels/types.ts`](/home/runner/workspace/agent-gateway/src/channels/types.ts) -- Channel type definitions
- [RFC 1459 -- IRC Protocol](https://datatracker.ietf.org/doc/html/rfc1459) -- Original IRC specification
- [RFC 2812 -- IRC Protocol (updated)](https://datatracker.ietf.org/doc/html/rfc2812) -- Updated IRC specification
- [Libera.Chat](https://libera.chat/) -- Popular IRC network for open-source projects
- [IRCv3 Specifications](https://ircv3.net/) -- Modern IRC extensions
