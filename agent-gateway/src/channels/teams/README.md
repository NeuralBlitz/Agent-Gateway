# Microsoft Teams Channel (`src/channels/teams/`)

> **Microsoft Teams adapter via Bot Framework -- send and receive messages in Teams channels and 1:1 chats.**

---

## Overview

The `TeamsChannel` class implements the `Channel` interface for Microsoft Teams integration via the Microsoft Bot Framework. It authenticates using OAuth 2.0 client credentials flow to obtain access tokens, then communicates with the Teams Bot Service API to send and receive messages.

Microsoft Teams is a widely-used enterprise collaboration platform. This adapter enables AI agents to operate within Teams channels (team conversations) and direct 1:1 chats with users.

Key characteristics:

- **OAuth 2.0 authentication** -- Uses client credentials flow with Azure AD to obtain bearer tokens for API access.
- **Token caching with auto-refresh** -- Access tokens are cached in memory and refreshed before expiry (with a 5-minute safety buffer).
- **Webhook-based message reception** -- Unlike socket-based channels, Teams pushes messages to the bot via HTTP webhooks. The `handleWebhookUpdate()` method processes incoming webhook payloads.
- **Bot Framework REST API** -- Uses the Teams Bot Service API at `smba.trafficmanager.net/teams` for message operations.

---

## File Structure

```
teams/
└── index.ts    # TeamsChannel implementation with Bot Framework API integration
```

---

## API Reference

### Types

#### `TeamsConfig`

Configuration object passed to `createTeamsChannel`.

```typescript
export interface TeamsConfig {
  /** Azure AD Application (client) ID */
  appId: string;
  /** Azure AD Application secret / password */
  appPassword: string;
  /** Azure AD tenant ID (defaults to 'botframework.com') */
  tenantId?: string;
  /** Custom Bot Framework API base URL */
  baseUrl?: string;
}
```

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `appId` | Yes | -- | Microsoft Bot Framework App ID (from Azure portal) |
| `appPassword` | Yes | -- | Bot app password / client secret |
| `tenantId` | No | `'botframework.com'` | Azure AD tenant ID for token acquisition |
| `baseUrl` | No | `'https://smba.trafficmanager.net/teams'` | Bot Framework API base URL |

---

### Factory Function

#### `createTeamsChannel(id, name, config)`

Creates and returns a new `TeamsChannel` instance.

```typescript
function createTeamsChannel(
  id: string,
  name: string,
  config: TeamsConfig
): TeamsChannel
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | `string` | Unique identifier for this channel instance |
| `name` | `string` | Human-readable display name |
| `config` | `TeamsConfig` | Teams Bot Framework configuration |

**Example:**

```typescript
import { createTeamsChannel } from './channels/teams/index.js';

const teams = createTeamsChannel('teams-1', 'TeamsBot', {
  appId: 'YOUR_APP_ID',
  appPassword: 'YOUR_APP_SECRET',
  tenantId: 'YOUR_TENANT_ID',
});
```

---

### Class: `TeamsChannel`

Implements the [`Channel`](/home/runner/workspace/agent-gateway/src/channels/types.ts) interface and extends `EventEmitter`.

#### Constructor

```typescript
new TeamsChannel(id: string, name: string, config: TeamsConfig)
```

Initializes the channel with the given configuration. Does **not** connect automatically -- call `connect()` separately.

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique channel identifier |
| `type` | `string` | Always `'teams'` |
| `name` | `string` | Human-readable name |
| `connected` | `boolean` | Whether the channel is currently connected |
| `config` | `TeamsConfig` | The active configuration |

#### Methods

##### `connect()`

Authenticates with the Bot Framework and validates the connection.

```typescript
async connect(): Promise<void>
```

**Behavior:**

1. Obtains an OAuth 2.0 access token via `getAccessToken()`.
2. Calls `getMe()` to verify the bot identity.
3. If successful, sets `connected = true` and emits `ready`.
4. Logs the bot name on successful connection.

**Example:**

```typescript
await teams.connect();
console.log(teams.connected); // true
```

**Errors:** Throws if authentication fails or the bot identity cannot be verified.

---

##### `disconnect()`

Disconnects from the Teams Bot Framework.

```typescript
async disconnect(): Promise<void>
```

**Behavior:**

1. Sets `connected` to `false`.
2. Clears the cached access token.
3. Logs the disconnection.

**Example:**

```typescript
await teams.disconnect();
```

---

##### `sendMessage(userId, content)`

Sends a message to a Teams user or conversation.

```typescript
async sendMessage(userId: string, content: string): Promise<void>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | Conversation ID to send the message to |
| `content` | `string` | Message text (supports Markdown) |

**Behavior:**

1. Obtains a fresh access token (using cached token if still valid).
2. POSTs to `/v3/conversations/{userId}/activities` on the Bot Framework API.
3. Sends the message with type `message`, including `text`, `from`, and `recipient` fields.

**Example:**

```typescript
await teams.sendMessage('conversation-id-123', 'Hello from the AI bot!');

// With Markdown formatting:
await teams.sendMessage('conv-id', '**Bold text** and *italic text*');
```

**Endpoint:**

```
POST https://smba.trafficmanager.net/teams/v3/conversations/{conversationId}/activities
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "message",
  "text": "Hello from the AI bot!",
  "from": { "id": "<bot-id>", "name": "<bot-name>" },
  "recipient": { "id": "<user-id>" }
}
```

---

##### `getUser(userId)`

Retrieves information about a Teams user in a conversation.

```typescript
async getUser(userId: string): Promise<ChannelUser | null>
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | `string` | Conversation/member ID to look up |

**Returns:** A `ChannelUser` with `id`, `name`, and `username` (userPrincipalName), or `null` if the user cannot be found.

**Endpoint:**

```
GET https://smba.trafficmanager.net/teams/v3/conversations/{conversationId}/members
Authorization: Bearer <token>
```

**Example:**

```typescript
const user = await teams.getUser('conversation-id');
if (user) {
  console.log(user.name);        // Display name
  console.log(user.username);    // userPrincipalName (email)
}
```

---

##### `getMe()`

Returns the bot's own identity.

```typescript
async getMe(): Promise<ChannelBot | null>
```

**Returns:** A `ChannelBot` with `id`, `name`, and `username` (set to `config.appId`).

**Example:**

```typescript
const me = await teams.getMe();
// { id: 'teams-1', name: 'TeamsBot', username: 'YOUR_APP_ID' }
```

---

##### `handleWebhookUpdate(update)`

Processes an incoming Teams webhook event and emits a `ChannelMessage`.

```typescript
handleWebhookUpdate(update: any): void
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `update` | `any` | The webhook payload from the Teams Bot Framework |

**Behavior:**

1. Checks if `update.type === 'message'`.
2. Extracts message ID, content, author info, channel, and timestamp.
3. Constructs a `ChannelMessage` and emits the `message` event.

**Example (HTTP server integration):**

```typescript
import express from 'express';

const app = express();
app.use(express.json());

app.post('/api/teams/webhook', (req, res) => {
  teams.handleWebhookUpdate(req.body);
  res.status(200).send();
});
```

**Webhook Payload Structure:**

```json
{
  "type": "message",
  "id": "msg-12345",
  "text": "Hello bot!",
  "from": {
    "id": "user-abc123",
    "name": "John Doe"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "conversation": {
    "id": "conv-xyz789"
  },
  "channelId": "msteams"
}
```

---

### Internal Methods

##### `getAccessToken()` (private)

Obtains an OAuth 2.0 access token from Azure AD.

```typescript
private async getAccessToken(): Promise<string>
```

**Behavior:**

1. Checks if a cached token exists and is still valid (`Date.now() < tokenExpiry`).
2. If cached token is valid, returns it.
3. Otherwise, POSTs to Azure AD token endpoint with client credentials.
4. Stores the new token and calculates expiry time (with 300-second safety buffer).

**Token Endpoint:**

```
POST https://login.microsoftonline.com/{tenantId}/oauth2/v2.0/token
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_id={appId}
&client_secret={appPassword}
&scope=https://api.botframework.com/.default
```

---

### Events

The `TeamsChannel` extends `EventEmitter` and emits the following events:

| Event | Payload | When |
|-------|---------|------|
| `ready` | -- | After successful authentication and identity verification |
| `message` | `ChannelMessage` | When `handleWebhookUpdate()` processes a message-type webhook |
| `error` | `Error` | On connection or authentication failures |

**Example:**

```typescript
teams.on('ready', () => {
  console.log('Teams bot is ready to receive messages');
});

teams.on('message', (msg) => {
  console.log(`[${msg.channel}] ${msg.author.name}: ${msg.content}`);
  // Route to AI provider for response...
});

teams.on('error', (err) => {
  console.error('Teams error:', err.message);
});
```

---

## Authentication Flow

### Step 1: Register an Azure AD Application

1. Go to the [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** > **App registrations**
3. Click **New registration**
4. Enter a display name (e.g., "My AI Bot")
5. Select supported account types
6. Click **Register**
7. Note the **Application (client) ID** -- this is your `appId`

### Step 2: Create a Client Secret

1. In your app registration, go to **Certificates & secrets**
2. Click **New client secret**
3. Add a description and choose an expiry period
4. Click **Add**
5. **Immediately copy the secret value** -- this is your `appPassword` (it will be hidden after)

### Step 3: Create a Bot in Bot Framework

1. Go to the [Azure Bot Service](https://portal.azure.com/#create/Microsoft.BotService)
2. Create a new bot resource
3. Link it to your Azure AD application
4. Note the **Messaging endpoint** for webhook delivery

### Step 4: Add Teams Channel

1. In the Bot Framework portal, go to your bot
2. Add the **Microsoft Teams** channel
3. Configure the callback URL for webhook delivery

---

## Configuration Examples

### Basic Setup

```typescript
const teams = createTeamsChannel('teams-prod', 'TeamsBot', {
  appId: process.env.TEAMS_APP_ID!,
  appPassword: process.env.TEAMS_APP_PASSWORD!,
});
```

### Custom Tenant

```typescript
const teams = createTeamsChannel('teams-ent', 'EnterpriseTeams', {
  appId: process.env.TEAMS_APP_ID!,
  appPassword: process.env.TEAMS_APP_PASSWORD!,
  tenantId: 'your-tenant-guid-here',
});
```

### Azure Government Cloud

```typescript
const teams = createTeamsChannel('teams-gov', 'GovTeams', {
  appId: process.env.TEAMS_APP_ID!,
  appPassword: process.env.TEAMS_APP_PASSWORD!,
  baseUrl: 'https://smba.usgovcloudapi.net/teams',
});
```

### Full Configuration with Environment Variables

```typescript
const teams = createTeamsChannel('teams-1', 'TeamsBot', {
  appId: process.env.TEAMS_APP_ID!,
  appPassword: process.env.TEAMS_APP_SECRET!,
  tenantId: process.env.TEAMS_TENANT_ID || 'botframework.com',
  baseUrl: process.env.TEAMS_BASE_URL || 'https://smba.trafficmanager.net/teams',
});
```

---

## Integration Points

### With Channel Gateway

The Teams channel implements the `Channel` interface from [`/home/runner/workspace/agent-gateway/src/channels/types.ts`](/home/runner/workspace/agent-gateway/src/channels/types.ts):

```typescript
interface Channel {
  id: string;
  type: string;         // 'teams'
  name: string;
  connected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(userId: string, content: string): Promise<void>;
  getUser(userId: string): Promise<ChannelUser | null>;
  getMe(): Promise<ChannelBot | null>;
}
```

### Webhook Server Integration

Unlike socket-based channels (IRC, Discord), Teams requires an HTTP endpoint to receive messages. Typical integration:

```typescript
import express from 'express';
import { createTeamsChannel } from './channels/teams/index.js';

const app = express();
app.use(express.json());

const teams = createTeamsChannel('teams-1', 'TeamsBot', {
  appId: process.env.TEAMS_APP_ID!,
  appPassword: process.env.TEAMS_APP_SECRET!,
});

// Webhook endpoint for incoming Teams messages
app.post('/webhooks/teams', (req, res) => {
  teams.handleWebhookUpdate(req.body);
  res.sendStatus(200);
});

// Start bot and server
await teams.connect();
app.listen(3000);
```

### With Other Channels

Teams messages are normalized to the same `ChannelMessage` format as all other channels:
- [`/home/runner/workspace/agent-gateway/src/channels/discord/`](/home/runner/workspace/agent-gateway/src/channels/discord/)
- [`/home/runner/workspace/agent-gateway/src/channels/slack/`](/home/runner/workspace/agent-gateway/src/channels/slack/)
- [`/home/runner/workspace/agent-gateway/src/channels/telegram/`](/home/runner/workspace/agent-gateway/src/channels/telegram/)
- [`/home/runner/workspace/agent-gateway/src/channels/irc/`](/home/runner/workspace/agent-gateway/src/channels/irc/)

### With Providers

Messages received via Teams are routed to AI providers through the gateway's routing layer. See [`/home/runner/workspace/agent-gateway/src/providers/`](/home/runner/workspace/agent-gateway/src/providers/).

---

## Error Handling

| Scenario | HTTP Status | Behavior |
|----------|-------------|----------|
| Invalid app ID or secret | 401 | `getAccessToken()` throws "Failed to get Teams access token: 401" |
| Token expired/invalid | 401 | Token cache cleared, new token requested on next call |
| Conversation not found | 404 | `getUser()` returns `null` |
| Rate limited | 429 | Error propagated; caller should implement retry with backoff |
| Network error | -- | Caught in `connect()`, logged, and re-thrown |
| Webhook payload missing fields | -- | Defaults used: `id` becomes `teams_<timestamp>`, text defaults to `''` |

All errors are logged via the infrastructure logger.

---

## Token Management

The adapter implements automatic token caching:

- Tokens are stored in memory (`this.token`).
- Expiry is calculated as `Date.now() + (expires_in - 300) * 1000` (5-minute safety buffer).
- If a valid cached token exists, no network request is made.
- If the token is expired or missing, a new token is fetched.

This minimizes authentication overhead during high-throughput message sending.

---

## Limitations

- **No streaming** -- Teams Bot Framework API does not support streaming responses; messages are sent as complete units.
- **Webhook required for inbound** -- Unlike Discord/Slack which support real-time WebSocket connections, Teams requires a publicly accessible webhook endpoint.
- **No adaptive cards** -- This adapter sends plain text messages only; Teams Adaptive Cards are not supported.
- **No file sharing** -- File attachment handling is not implemented.
- **No team/channel listing** -- The adapter cannot enumerate Teams or channels; conversation IDs must be known.
- **No proactive messaging** -- The bot can only respond to conversations it has been added to.

---

## Security Considerations

- **Store secrets securely** -- The `appPassword` is a sensitive credential. Use Azure Key Vault, environment variables, or a secrets manager.
- **Validate webhook payloads** -- In production, verify the webhook signature to ensure requests originate from Microsoft.
- **Use HTTPS for webhook endpoint** -- The webhook URL must be TLS-secured.
- **Tenant isolation** -- If using a specific `tenantId`, the bot will only work within that Azure AD tenant.
- **Token exposure** -- Access tokens are bearer tokens; protect them in transit and at rest.

---

## Related Documentation

- [`/home/runner/workspace/agent-gateway/src/channels/`](/home/runner/workspace/agent-gateway/src/channels/) -- Parent channels module
- [`/home/runner/workspace/agent-gateway/src/channels/types.ts`](/home/runner/workspace/agent-gateway/src/channels/types.ts) -- Channel type definitions
- [Microsoft Bot Framework Docs](https://learn.microsoft.com/en-us/azure/bot-service/) -- Official Bot Framework documentation
- [Teams Bot Activity Types](https://learn.microsoft.com/en-us/microsoftteams/platform/bots/how-to/conversations/conversation-basics) -- Teams conversation basics
- [Azure AD OAuth 2.0](https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow) -- Client credentials flow
- [Bot Framework REST API](https://learn.microsoft.com/en-us/azure/bot-service/rest-api/bot-framework-rest-connector-api-reference) -- API reference
