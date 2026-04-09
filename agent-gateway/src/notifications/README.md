# Notification System (`src/notifications/`)

> **Multi-channel notification system (email, Slack, webhook, SMS, PagerDuty) for system events, alerts, and operational updates in the Agent Gateway.**

---

## Table of Contents

1. [Overview](#overview)
2. [File Structure](#file-structure)
3. [Architecture](#architecture)
4. [Type Definitions](#type-definitions)
5. [Class API](#class-api)
6. [Configuration Options](#configuration-options)
7. [Usage Examples](#usage-examples)
8. [Notification Channels](#notification-channels)
9. [Delivery Mechanisms](#delivery-mechanisms)
10. [Quiet Hours and Deduplication](#quiet-hours-and-deduplication)
11. [Error Handling](#error-handling)
12. [Integration Points](#integration-points)
13. [Best Practices](#best-practices)
14. [Related Documentation](#related-documentation)

---

## Overview

The `notifications/` module provides a **unified multi-channel notification system** for the Agent Gateway. It abstracts away the delivery mechanism differences between channels (Slack, webhooks, email, SMS, PagerDuty) and provides a single API for sending notifications with:

- **Multi-channel delivery** -- Send to Slack, webhooks, email, SMS, and PagerDuty from one call
- **Notification types** -- Four severity levels: `info`, `warning`, `error`, `critical`
- **Quiet hours** -- Suppress non-critical notifications during configured quiet periods
- **Deduplication** -- Prevent notification flooding via time-window deduplication
- **Rate limiting** -- Maximum notifications per minute to prevent alert fatigue
- **Delivery tracking** -- Track delivery status and per-recipient errors
- **Event-driven** -- Extends `EventEmitter` for integration with monitoring pipelines
- **Statistics** -- Track notification counts by type and delivery error rates

This module is essential for:

- **System alerting** -- Notify operators of gateway health issues, failures, and recoveries
- **Operational visibility** -- Track deployments, configuration changes, and maintenance events
- **Security monitoring** -- Alert on suspicious activity, rate limit abuse, and moderation events
- **Compliance** -- Maintain an audit trail of important system events
- **On-call management** -- Route critical alerts to PagerDuty for immediate response

---

## File Structure

```
notifications/
└── index.ts          # NotificationSystem class, factory, type definitions
```

The module is implemented in a single file (~215 lines) containing the `NotificationSystem` class extending `EventEmitter`, with delivery methods for each channel, quiet hours logic, deduplication, and statistics tracking.

---

## Architecture

```
                    notify() call
                         │
                         ▼
            ┌────────────────────────┐
            │   Check Quiet Hours    │──► Skip if quiet (non-critical)
            └───────────┬────────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │   Check Deduplication  │──► Skip if duplicate within window
            └───────────┬────────────┘
                        │
                        ▼
            ┌────────────────────────┐
            │   Create Notification  │
            │   (unique ID, track    │
            │    delivery status)    │
            └───────────┬────────────┘
                        │
                ┌───────┴───────┐
                │               │
                ▼               ▼
        For each recipient    Deliver to channel
                │
                ▼
        ┌───────────────────────┐
        │  deliver() dispatch   │
        │                       │
        │  webhook --> POST     │
        │  slack --> POST       │
        │  email --> log        │
        │  sms --> log          │
        │  pagerduty --> log    │
        └───────────┬───────────┘
                    │
                    ▼
            Track delivery status
            (success or error per recipient)
                    │
                    ▼
            Emit notification:sent event
```

---

## Type Definitions

### NotificationChannel

```typescript
type NotificationChannel = 'email' | 'slack' | 'webhook' | 'sms' | 'pagerduty';
```

### NotificationRecipient

```typescript
interface NotificationRecipient {
  channel: NotificationChannel;
  address: string;  // email address, webhook URL, phone number, Slack webhook URL
  metadata?: Record<string, any>;
}
```

### Notification

```typescript
interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  recipients: NotificationRecipient[];
  data?: Record<string, any>;
  createdAt: number;
  delivered: boolean;
  deliveryErrors: Array<{
    channel: string;
    address: string;
    error: string;
  }>;
}
```

### NotificationConfig

```typescript
interface NotificationConfig {
  /** Default recipients for all notifications */
  defaultRecipients?: NotificationRecipient[];
  /** Max notifications per minute (default: 60) */
  rateLimitPerMinute?: number;
  /** Quiet hours window (default: { start: 0, end: 0 } = no quiet hours) */
  quietHours?: { start: number; end: number };
  /** Deduplication window in ms (default: 5 * 60 * 1000 = 5 minutes) */
  dedupWindowMs?: number;
}
```

---

## Class API

### `NotificationSystem` Class

```typescript
class NotificationSystem extends EventEmitter {
  constructor(config?: NotificationConfig)

  // Core notification
  notify(
    type: 'info' | 'warning' | 'error' | 'critical',
    title: string,
    message: string,
    recipients?: NotificationRecipient[],
    data?: Record<string, any>,
  ): Promise<Notification>

  // Convenience methods
  info(title: string, message: string, recipients?: NotificationRecipient[]): Promise<Notification>
  warning(title: string, message: string, recipients?: NotificationRecipient[]): Promise<Notification>
  error(title: string, message: string, recipients?: NotificationRecipient[]): Promise<Notification>
  critical(title: string, message: string, recipients?: NotificationRecipient[]): Promise<Notification>

  // Retrieval
  getRecent(limit?: number): Notification[]
  getStats(): {
    total: number;
    byType: Record<string, number>;
    deliveryErrors: number;
  }

  // Maintenance
  cleanup(): void
}

function createNotificationSystem(config?: NotificationConfig): NotificationSystem
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultRecipients` | `NotificationRecipient[]` | `[]` | Recipients used when no explicit recipients are provided |
| `rateLimitPerMinute` | `number` | `60` | Maximum notifications sent per minute (not enforced per-type) |
| `quietHours` | `{ start: number; end: number }` | `{ start: 0, end: 0 }` | Quiet hours in 24h format. `{ start: 0, end: 0 }` means no quiet hours |
| `dedupWindowMs` | `number` | `300000` (5 min) | Time window for deduplication. Identical notifications within this window are suppressed |

### Quiet Hours Configuration

Quiet hours suppress non-critical notifications during specified time ranges:

```typescript
// Quiet from 22:00 to 07:00 (overnight)
quietHours: { start: 22, end: 7 }

// Quiet from 18:00 to 09:00 (evening to morning)
quietHours: { start: 18, end: 9 }

// No quiet hours (always send)
quietHours: { start: 0, end: 0 }
```

Critical notifications **always bypass** quiet hours.

---

## Usage Examples

### Basic Setup

```typescript
import { createNotificationSystem } from '../notifications/index.js';

const notifications = createNotificationSystem({
  defaultRecipients: [
    {
      channel: 'slack',
      address: process.env.SLACK_WEBHOOK_URL,
    },
  ],
  quietHours: { start: 22, end: 7 },
  dedupWindowMs: 5 * 60 * 1000,
});
```

### Sending Notifications

```typescript
// Using convenience methods
await notifications.info('Deployment Started', 'Deploying version 2.1.0');
await notifications.warning('High Memory Usage', 'Heap usage at 85%');
await notifications.error('Database Connection Lost', 'Failed to connect to primary database');
await notifications.critical('Service Down', 'Gateway is not responding to health checks');

// Using the general notify method
await notifications.notify(
  'warning',
  'Rate Limit Approaching',
  'User user-123 has used 90% of their rate limit',
  [
    { channel: 'slack', address: process.env.SLACK_WEBHOOK_URL },
    { channel: 'webhook', address: 'https://monitoring.example.com/alerts' },
  ],
  { userId: 'user-123', usage: 90, limit: 1000 }
);
```

### Multi-Channel Delivery

```typescript
await notifications.critical(
  'Security Alert',
  'Multiple failed login attempts detected',
  [
    { channel: 'slack', address: process.env.SLACK_SECURITY_WEBHOOK },
    { channel: 'pagerduty', address: process.env.PAGERDUTY_SERVICE_KEY },
    { channel: 'email', address: 'security-team@company.com' },
    { channel: 'webhook', address: 'https://siem.company.com/api/events' },
  ],
  { sourceIp: '192.168.1.100', attempts: 15, window: '5 minutes' }
);
```

### Retrieving Recent Notifications

```typescript
const recent = notifications.getRecent(10);
// Returns the last 10 notifications

for (const n of recent) {
  console.log(`[${n.type}] ${n.title}: ${n.message}`);
  if (n.deliveryErrors.length > 0) {
    console.log(`  Errors: ${n.deliveryErrors.map(e => e.error).join(', ')}`);
  }
}
```

### Notification Statistics

```typescript
const stats = notifications.getStats();
console.log(stats);
// {
//   total: 150,
//   byType: {
//     info: 80,
//     warning: 40,
//     error: 25,
//     critical: 5,
//   },
//   deliveryErrors: 3
// }
```

### Periodic Cleanup

```typescript
// Clean up expired deduplication hashes periodically
setInterval(() => {
  notifications.cleanup();
}, 10 * 60 * 1000); // Every 10 minutes
```

### Event Listener Integration

```typescript
notifications.on('notification:sent', (notification) => {
  logger.info(
    { id: notification.id, type: notification.type, title: notification.title },
    'Notification sent',
  );

  // Push to dashboard
  dashboard.pushEvent('notification', {
    id: notification.id,
    type: notification.type,
    delivered: notification.delivered,
    errors: notification.deliveryErrors.length,
  });
});
```

---

## Notification Channels

### Slack

Delivers formatted messages as Slack attachments with color coding:

```typescript
private async deliverSlack(webhookUrl: string, payload: any): Promise<void> {
  const colorMap = {
    info: '#36a64f',     // Green
    warning: '#ffaa00',  // Yellow/Orange
    error: '#ff0000',    // Red
    critical: '#cc0000', // Dark Red
  };

  const slackPayload = {
    attachments: [{
      color: colorMap[payload.type] || '#888888',
      title: payload.title,
      text: payload.message,
      ts: Math.floor(new Date(payload.timestamp).getTime() / 1000),
    }],
  };

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(slackPayload),
    signal: AbortSignal.timeout(10000),
  });
}
```

**Setup**: Create an Incoming Webhook in your Slack workspace and use the webhook URL as the address.

### Webhook

Generic HTTP POST delivery:

```typescript
private async deliverWebhook(url: string, payload: any): Promise<void> {
  await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
}
```

The webhook receives the notification payload directly:

```json
{
  "type": "warning",
  "title": "High Memory Usage",
  "message": "Heap usage at 85%",
  "timestamp": "2024-04-09T12:00:00.000Z",
  "data": { "userId": "user-123", "usage": 85 }
}
```

### Email

Email delivery logs the notification (SMTP not configured):

```typescript
case 'email':
  logger.info({ to: recipient.address, ...payload }, 'Email notification (SMTP not configured)');
  break;
```

To implement actual email delivery, integrate an SMTP client (e.g., `nodemailer`) in the `deliver` method.

### SMS

SMS delivery logs the notification (SMS service not configured):

```typescript
case 'sms':
  logger.info({ channel: 'sms', to: recipient.address, ...payload }, 'Notification (integration not configured)');
  break;
```

To implement SMS, integrate a service like Twilio, AWS SNS, or similar.

### PagerDuty

PagerDuty delivery logs the notification (integration not configured):

```typescript
case 'pagerduty':
  logger.info({ channel: 'pagerduty', to: recipient.address, ...payload }, 'Notification (integration not configured)');
  break;
```

To implement PagerDuty, integrate the PagerDuty Events API v2.

---

## Delivery Mechanisms

### Timeout Configuration

All HTTP deliveries (Slack, webhook) use a 10-second timeout:

```typescript
signal: AbortSignal.timeout(10000),
```

This prevents notification delivery from blocking the request pipeline indefinitely.

### Slack Message Format

Slack notifications are sent as attachments with severity-based colors:

| Type | Color | Hex |
|------|-------|-----|
| `info` | Green | `#36a64f` |
| `warning` | Orange | `#ffaa00` |
| `error` | Red | `#ff0000` |
| `critical` | Dark Red | `#cc0000` |

---

## Quiet Hours and Deduplication

### Quiet Hours Logic

```typescript
private isAllowedToSend(type: Notification['type']): boolean {
  // Critical notifications always bypass quiet hours
  if (type === 'critical') return true;

  const qh = this.config.quietHours;
  if (qh.start === 0 && qh.end === 0) return true; // No quiet hours configured

  const hour = new Date().getHours();
  if (qh.start > qh.end) {
    // Overnight quiet hours (e.g., 22:00 - 07:00)
    return hour < qh.end || hour >= qh.start;
  } else {
    // Daytime quiet hours (e.g., 09:00 - 17:00)
    return hour < qh.start || hour >= qh.end;
  }
}
```

When a notification is suppressed during quiet hours:
- It is still created with empty recipients
- A debug log is written: `logger.debug({ type, title }, 'Notification suppressed (quiet hours)')`
- The `notification:sent` event is still emitted

### Deduplication Logic

```typescript
private hashNotification(type: string, title: string, message: string): string {
  return `${type}:${title}:${message.slice(0, 100)}`;
}

private isDuplicate(hash: string): boolean {
  const lastSent = this.recentHashes.get(hash);
  if (!lastSent) return false;
  return Date.now() - lastSent < this.config.dedupWindowMs;
}
```

The hash is constructed from type, title, and the first 100 characters of the message. Identical hashes within the deduplication window are suppressed.

**Example**: With `dedupWindowMs: 300000` (5 minutes):

```typescript
// First notification -- sent
await notifications.warning('High Memory', 'Memory usage at 85%');

// Same message within 5 minutes -- suppressed
await notifications.warning('High Memory', 'Memory usage at 85%');
// Logged: "Notification suppressed (duplicate)"

// Same message after 5 minutes -- sent again
await new Promise(r => setTimeout(r, 300001));
await notifications.warning('High Memory', 'Memory usage at 85%');
// Sent (dedup window expired)
```

---

## Error Handling

### Per-Recipient Error Tracking

Each recipient's delivery is attempted independently. If one fails, the error is recorded but other recipients continue:

```typescript
for (const recipient of targets) {
  try {
    await this.deliver(notification, recipient);
    notification.delivered = true;
  } catch (err: any) {
    notification.deliveryErrors.push({
      channel: recipient.channel,
      address: recipient.address,
      error: err.message,
    });
    logger.error({ recipient, err }, 'Failed to deliver notification');
  }
}
```

### Delivery Failure Scenarios

| Scenario | Error Message |
|----------|--------------|
| Slack webhook returns non-2xx | `Slack delivery failed: HTTP 404` |
| Webhook endpoint unavailable | `Webhook delivery failed: HTTP 503` |
| Network timeout | `The operation was aborted due to timeout` |
| Invalid URL | `Failed to parse URL` |
| Unknown channel type | `Unknown notification channel: xyz` |

### Notification Creation Even on Delivery Failure

Even if all deliveries fail, the notification object is still created and stored:

```typescript
this.notifications.push(notification);
this.recentHashes.set(hash, Date.now());
this.emit('notification:sent', notification);
```

The `deliveryErrors` array documents what went wrong, and the notification appears in `getRecent()` results.

---

## Integration Points

### With `src/health-checker/`

Monitor health status changes via notifications:

```typescript
healthChecker.on('check:failed', ({ name, failures }) => {
  if (failures >= 3) {
    notifications.warning(
      `Health Check Failing: ${name}`,
      `${failures} consecutive failures`,
    );
  }
});

healthChecker.on('status:changed', (status) => {
  if (status.overall === 'unhealthy') {
    notifications.critical('System Unhealthy', JSON.stringify(status.checks));
  }
});
```

### With `src/graceful-shutdown/`

Notify on shutdown events:

```typescript
shutdownManager.on('shutdown:start', () => {
  notifications.warning('Server Shutdown Initiated', 'Graceful shutdown has started');
});

shutdownManager.on('shutdown:complete', ({ duration }) => {
  notifications.info('Server Shutdown Complete', `Completed in ${duration}ms`);
});
```

### With `src/middleware/` (Rate Limiting)

Alert on rate limit abuse:

```typescript
let rateLimitAlertCount = 0;

// Intercept 429 responses
app.use((req, res, next) => {
  const originalStatus = res.status.bind(res);
  res.status = function(code: number) {
    if (code === 429) {
      rateLimitAlertCount++;
      if (rateLimitAlertCount >= 50) {
        notifications.warning(
          'High Rate Limiting Activity',
          `${rateLimitAlertCount} requests rate limited recently`,
        );
        rateLimitAlertCount = 0;
      }
    }
    return originalStatus(code);
  };
  next();
});
```

### With `src/moderation/`

Alert on blocked content:

```typescript
const result = await pipeline.moderate(content);

if (result.blocked) {
  notifications.warning(
    'Content Blocked',
    `Blocked by: ${result.results.filter(r => r.severity === 'block').map(r => r.reason).join(', ')}`,
  );
}
```

### With `src/infra/` (Logger)

All notification deliveries and failures are logged:

```typescript
logger.info({ to: recipient.address, ...payload }, 'Email notification (SMTP not configured)');
logger.error({ recipient, err }, 'Failed to deliver notification');
```

### With `src/dashboard/`

Push notifications to the dashboard in real-time:

```typescript
notifications.on('notification:sent', (n) => {
  dashboard.pushEvent('notifications', {
    id: n.id,
    type: n.type,
    title: n.title,
    delivered: n.delivered,
    errors: n.deliveryErrors.length,
    timestamp: n.createdAt,
  });
});
```

---

## Best Practices

1. **Configure default recipients** -- Set `defaultRecipients` at initialization so notifications have a delivery target without per-call specification.

2. **Use appropriate severity levels** -- Reserve `critical` for issues requiring immediate action. Use `warning` for issues that need attention but are not urgent.

3. **Set quiet hours for non-critical channels** -- Configure `{ start: 22, end: 7 }` to avoid waking up on-call engineers for non-urgent issues at night.

4. **Tune deduplication windows** -- The default 5-minute window prevents notification storms. Adjust based on your alerting frequency tolerance.

5. **Implement actual delivery for production** -- Email, SMS, and PagerDuty are stub implementations in this module. Integrate actual services (nodemailer, Twilio, PagerDuty Events API) before deploying to production.

6. **Monitor delivery errors** -- Use `getStats().deliveryErrors` to track delivery failures. High error rates indicate misconfigured recipients or delivery service outages.

7. **Periodically call cleanup()** -- The deduplication hash map grows over time. Call `cleanup()` periodically to remove expired entries.

8. **Use the `notification:sent` event** -- Rather than polling `getRecent()`, listen to the event for real-time notification tracking.

9. **Add metadata for context** -- The `data` field allows attaching structured context (user IDs, error codes, metrics) that downstream systems can use for filtering and enrichment.

10. **Test all channels** -- Send test notifications to each configured channel during setup and after configuration changes to verify delivery.

---

## Related Documentation

- [`src/health-checker/`](../health-checker/README.md) -- Health monitoring with notification integration
- [`src/graceful-shutdown/`](../graceful-shutdown/README.md) -- Shutdown notification integration
- [`src/dashboard/`](../dashboard/README.md) -- Real-time notification dashboard
- [`src/infra/`](../infra/README.md) -- Shared logging infrastructure
- [`src/moderation/`](../moderation/README.md) -- Content moderation alerts
