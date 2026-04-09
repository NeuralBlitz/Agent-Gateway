# Webhook Manager

## Overview

The **Webhook Manager** module (`agent-gateway/src/webhook-manager/`) provides comprehensive outgoing webhook subscription management with delivery tracking, automatic retry logic, HMAC signature verification, and event filtering. It enables the gateway to notify external systems about internal events (session updates, agent completions, errors, etc.) via HTTP POST callbacks.

The module manages the full webhook lifecycle: creating subscriptions, dispatching events to subscribed URLs, retrying failed deliveries with exponential backoff, and maintaining delivery history for debugging and auditing. Every webhook delivery is signed with an HMAC-SHA256 signature that recipients can verify to ensure payload integrity.

### Key Capabilities

- **Subscription Management**: Create, delete, and list webhook subscriptions filtered by event type.
- **Event Filtering**: Subscriptions can listen to specific events or use `'*'` wildcard for all events.
- **HMAC Signing**: Every outbound webhook is signed with SHA-256; recipients can verify signatures via `WebhookManager.verifySignature()`.
- **Automatic Retries**: Failed deliveries are retried with exponential backoff (2^attempt seconds).
- **Delivery Tracking**: Full delivery history with status (`pending`, `delivered`, `failed`, `retrying`), attempt count, and error messages.
- **Configurable Timeouts**: Per-subscription or default HTTP timeout for delivery attempts.
- **Custom Headers**: Attach custom headers to webhook requests (e.g., for authentication).
- **Analytics**: Statistics on subscriptions and delivery success/failure rates.

---

## File Structure

```
agent-gateway/src/webhook-manager/
  index.ts              # Main implementation (WebhookManager class, factory)
  README.md             # This file
```

The module is self-contained in a single `index.ts` file. It depends on:
- `events` (`EventEmitter`) for delivery lifecycle events.
- `crypto` (`randomUUID`, `createHmac`) for ID generation and signature creation.
- `../infra/index.js` (the shared `logger` singleton) for info/error logging.

---

## Full API Documentation

### Interfaces

#### `WebhookSubscription`

| Property      | Type                  | Description                               |
|---------------|-----------------------|-------------------------------------------|
| `id`          | string                | UUID of the subscription                  |
| `url`         | string                | Destination URL for webhook POST requests |
| `events`      | string[]              | Event types to subscribe to               |
| `secret`      | string                | HMAC signing secret                       |
| `active`      | boolean               | Whether the subscription is active        |
| `createdAt`   | number                | Creation timestamp (epoch ms)             |
| `metadata`    | Record<string, any>?  | Arbitrary metadata                        |
| `headers`     | Record<string, string>? | Custom HTTP headers to include        |
| `maxRetries`  | number?               | Max delivery attempts (default: 3)        |
| `timeout`     | number?               | HTTP timeout in ms (default: 10000)       |

#### `WebhookDelivery`

| Property          | Type                                          | Description                             |
|-------------------|-----------------------------------------------|-----------------------------------------|
| `id`              | string                                        | Delivery UUID                           |
| `subscriptionId`  | string                                        | ID of the subscription                  |
| `event`           | string                                        | Event type being delivered              |
| `payload`         | any                                           | Event payload data                      |
| `status`          | `'pending' \| 'delivered' \| 'failed' \| 'retrying'` | Delivery status                |
| `attempts`        | number                                        | Number of delivery attempts             |
| `lastAttemptAt`   | number?                                       | Timestamp of last attempt               |
| `lastError`       | string?                                       | Last error message                      |
| `responseStatus`  | number?                                       | HTTP response status from recipient     |
| `createdAt`       | number                                        | Creation timestamp                      |

#### `WebhookManagerConfig`

| Property      | Type   | Default | Description                            |
|---------------|--------|---------|----------------------------------------|
| `maxRetries`  | number | `3`     | Default max retries per delivery       |
| `timeout`     | number | `10000` | Default HTTP timeout in milliseconds   |
| `historySize` | number | `100`   | Max delivery history per subscription  |

---

### Class: `WebhookManager`

Extends `EventEmitter`.

#### Constructor

```ts
constructor(config?: WebhookManagerConfig)
```

#### Methods

##### `createSubscription(url: string, events: string[], secret?: string, metadata?: Record<string, any>): WebhookSubscription`

Creates a new webhook subscription. If `secret` is not provided, a random UUID is generated.

```ts
const sub = manager.createSubscription(
  'https://example.com/webhooks',
  ['session:created', 'session:deleted'],
  'my-secret-key',
  { environment: 'production' }
);
```

##### `deleteSubscription(id: string): boolean`

Deletes a subscription and its delivery history. Returns `true` if the subscription existed.

##### `listSubscriptions(event?: string): WebhookSubscription[]`

Lists all subscriptions. If `event` is provided, filters to subscriptions that include that event (or `'*'`).

```ts
const sessionHooks = manager.listSubscriptions('session:created');
const allHooks = manager.listSubscriptions();
```

##### `async sendEvent(event: string, payload: any): Promise<WebhookDelivery[]>`

Dispatches an event to all active subscriptions that match the event type. Deliveries are performed asynchronously.

Returns an array of delivery records (initial status: `pending`).

```ts
const deliveries = await manager.sendEvent('session:created', {
  sessionId: 'sess-abc123',
  userId: 'user-456',
  channel: 'web',
});
```

##### `static verifySignature(secret: string, payload: string, signature: string): boolean`

Static method for recipients to verify an incoming webhook signature.

```ts
// On the recipient server:
const isValid = WebhookManager.verifySignature(
  secret,
  rawRequestBody,
  req.headers['x-webhook-signature'] as string
);
```

##### `getDeliveryHistory(subscriptionId: string, limit?: number): WebhookDelivery[]`

Returns the most recent delivery attempts for a subscription. Default limit is 20.

##### `getStats(): { totalSubscriptions, activeSubscriptions, totalDeliveries, successfulDeliveries, failedDeliveries }`

Returns aggregate statistics across all subscriptions and deliveries.

#### Private Methods

- **`deliver(subscription, delivery)`**: Performs the actual HTTP delivery with retries and exponential backoff.
- **`createSignature(secret, delivery)`**: Generates HMAC-SHA256 signature for a delivery.
- **`trimHistory(history)`**: Enforces the `historySize` limit by removing oldest entries.

---

### Factory Function

```ts
function createWebhookManager(config?: WebhookManagerConfig): WebhookManager
```

---

## Configuration Options

```ts
const manager = createWebhookManager({
  maxRetries: 5,          // Retry up to 5 times
  timeout: 5000,          // 5 second HTTP timeout
  historySize: 200,       // Keep 200 delivery records per subscription
});
```

---

## Usage Examples

### Basic Webhook Setup

```ts
import { createWebhookManager } from './index.js';

const manager = createWebhookManager();

// Create subscriptions
const sessionHook = manager.createSubscription(
  'https://monitoring.example.com/webhooks/sessions',
  ['session:created', 'session:deleted', 'session:updated']
);

const errorHook = manager.createSubscription(
  'https://monitoring.example.com/webhooks/errors',
  ['*']  // All events
);

// Send events
await manager.sendEvent('session:created', {
  sessionId: 'sess-123',
  userId: 'user-456',
});

await manager.sendEvent('agent:completed', {
  sessionId: 'sess-123',
  agentId: 'agent-789',
  outputTokens: 1500,
});
```

### Receiving and Verifying Webhooks (Recipient Side)

```ts
import express from 'express';
import { WebhookManager } from './index.js';

const app = express();
const WEBHOOK_SECRET = 'my-secret-key';

app.post('/webhooks', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-webhook-signature'] as string;
  const payload = req.body.toString('utf-8');

  if (!WebhookManager.verifySignature(WEBHOOK_SECRET, payload, signature)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = JSON.parse(payload);
  console.log('Received webhook:', event.event, event.data);

  // Process the event...
  res.status(200).json({ received: true });
});
```

### Wildcard Subscription

```ts
// Listen to ALL events
const auditHook = manager.createSubscription(
  'https://audit.example.com/webhooks/all',
  ['*'],
  'audit-secret'
);
```

### Custom Headers

```ts
const sub = manager.createSubscription(
  'https://partner.example.com/webhook',
  ['order:created'],
  'partner-secret'
);

// Add custom headers (mutate subscription)
// Note: headers are set at subscription creation via the subscription object
sub.headers = {
  'Authorization': 'Bearer partner-token',
  'X-Partner-ID': 'acme-corp',
};
```

### Delivery Event Listeners

```ts
manager.on('delivery:success', (delivery) => {
  console.log(`Delivered ${delivery.event} to subscription ${delivery.subscriptionId}`);
});

manager.on('delivery:failed', (delivery) => {
  console.error(`Failed to deliver ${delivery.event}: ${delivery.lastError}`);
  // Could trigger an alert or page here
});
```

### Subscription Management

```ts
// List all subscriptions for a specific event
const hooks = manager.listSubscriptions('session:created');

// Delete a subscription
manager.deleteSubscription(subscriptionId);

// Get delivery history
const history = manager.getDeliveryHistory(subscriptionId, 50);

// Get stats
const stats = manager.getStats();
console.log(`Active subscriptions: ${stats.activeSubscriptions}`);
console.log(`Delivery success rate: ${(stats.successfulDeliveries / stats.totalDeliveries * 100).toFixed(1)}%`);
```

---

## Webhook Delivery Format

Each webhook POST request has the following structure:

**Headers**:
```
Content-Type: application/json
X-Webhook-Event: session:created
X-Webhook-Delivery-Id: <delivery-uuid>
X-Webhook-Signature: <hmac-sha256-signature>
X-Webhook-Timestamp: <creation-timestamp>
```

**Body**:
```json
{
  "id": "<delivery-uuid>",
  "event": "session:created",
  "timestamp": 1712678400000,
  "data": { ... payload ... }
}
```

---

## Retry Logic

Delivery retries use exponential backoff: `2^attempt * 1000ms`.

| Attempt | Delay  |
|---------|--------|
| 1       | 2s     |
| 2       | 4s     |
| 3       | 8s     |

With `maxRetries: 5`:
| Attempt | Delay   |
|---------|---------|
| 4       | 16s     |
| 5       | 32s     |

If all retries fail, the delivery status is set to `failed` and the `delivery:failed` event is emitted.

---

## Integration Points

- **Event Bus** (`/home/runner/workspace/agent-gateway/src/eventbus/`): The webhook manager can be triggered by events from the global event bus, forwarding gateway events to external HTTP endpoints.
- **Session Manager** (`/home/runner/workspace/agent-gateway/src/session-manager/README.md`): Session lifecycle events (`session:created`, `session:updated`, `session:deleted`) are natural candidates for webhook notifications.
- **Message Bus** (`/home/runner/workspace/agent-gateway/src/message-bus/README.md`): The message bus can relay internal events to the webhook manager for external dispatch.
- **Event Store** (`/home/runner/workspace/agent-gateway/src/event-store/README.md`): Webhook delivery events can be persisted in the event store for full audit trails.
- **Infra Logger** (`/home/runner/workspace/agent-gateway/src/infra/`): Subscription creation and delivery failures are logged.

---

## Error Handling

- **Network Failures**: Delivery failures (connection errors, timeouts) are caught and retried. The `lastError` field contains the error message.
- **HTTP Errors**: Non-2xx responses are treated as failures and retried. The `responseStatus` field captures the HTTP status code.
- **Timeouts**: Uses `AbortSignal.timeout()` for HTTP request timeouts. Default is 10 seconds.
- **Max Retries Exceeded**: After all retries are exhausted, the delivery is marked as `failed` and logged via `logger.error()`.
- **Invalid URLs**: DNS resolution failures and invalid URL errors are caught and retried like any other network error.
- **Subscription Deletion**: Deleting a subscription does not cancel in-flight deliveries for that subscription.

---

## Security Considerations

1. **HMAC Signatures**: Every webhook is signed with HMAC-SHA256. Recipients must verify the signature before processing the payload.
2. **Secret Management**: The subscription `secret` should be stored securely and rotated periodically.
3. **HTTPS Only**: Webhook URLs should always use HTTPS to prevent man-in-the-middle attacks.
4. **Payload Integrity**: The signature covers `deliveryId.event.timestamp.payload`, ensuring all fields are tamper-proof.
5. **No Replay Protection**: The current implementation does not include nonce-based replay protection. Recipients should track delivery IDs to prevent duplicate processing.

---

## Related Documentation

- [Event Bus](/home/runner/workspace/agent-gateway/src/eventbus/) -- Source of gateway events that can trigger webhooks.
- [Session Manager](/home/runner/workspace/agent-gateway/src/session-manager/README.md) -- Session lifecycle events for webhook dispatch.
- [Message Bus](/home/runner/workspace/agent-gateway/src/message-bus/README.md) -- Internal pub/sub that can relay events to webhooks.
- [Event Store](/home/runner/workspace/agent-gateway/src/event-store/README.md) -- Persistent event audit trail.
- [Retry Handler](/home/runner/workspace/agent-gateway/src/retry-handler/README.md) -- General retry patterns (webhook retries are built-in).
- [Infra Logger](/home/runner/workspace/agent-gateway/src/infra/) -- Shared structured logger.

---

## Version History

| Version | Date       | Notes                                    |
|---------|------------|------------------------------------------|
| 1.0.0   | 2026-04-09 | Initial implementation                   |
