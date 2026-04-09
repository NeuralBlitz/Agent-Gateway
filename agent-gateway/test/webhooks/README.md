# Webhook Tests

> **Test suite for webhook handling in Agent Gateway**

This directory contains tests for the webhook server and webhook management subsystem. Tests cover webhook registration, validation, signature verification, message delivery, retry logic, and webhook lifecycle management.

---

## Table of Contents

- [Overview](#overview)
- [Test Scope](#test-scope)
- [Webhook Architecture](#webhook-architecture)
- [Test Files](#test-files)
- [Test Scenarios](#test-scenarios)
- [Mocking Strategy](#mocking-strategy)
- [Running Webhook Tests](#running-webhook-tests)
- [Signature Verification](#signature-verification)
- [Retry Logic](#retry-logic)
- [Writing New Webhook Tests](#writing-new-webhook-tests)
- [Integration Points](#integration-points)

---

## Overview

Location: `/home/runner/workspace/agent-gateway/test/webhooks/`

The webhook system handles inbound HTTP callbacks from messaging platforms (Telegram, Discord, Slack, WhatsApp) and external services. It provides:

- A webhook HTTP server for receiving platform callbacks
- Signature/secret verification for webhook authenticity
- Payload parsing and normalization
- Routing to the appropriate channel handler
- Delivery tracking and retry for outbound webhooks
- Webhook lifecycle management (create, update, delete)

---

## Test Scope

| Component | Source Location | Test Coverage |
|-----------|----------------|---------------|
| `WebhookServer` class | `src/webhooks/index.ts` | HTTP server, routing, validation |
| `createWebhookServer()` | `src/webhooks/index.ts` | Factory function |
| Webhook handlers | `src/webhooks/index.ts` | Platform-specific handlers |
| Webhook manager | `src/webhook-manager/index.ts` | Registration, lifecycle |
| Webhook validation | `src/webhooks/index.ts` | Signature verification |
| Webhook delivery | `src/webhook-manager/index.ts` | Outbound delivery, retry |

---

## Webhook Architecture

### Inbound Webhook Flow

```
Platform (Telegram/Discord/Slack/etc.)
       │
       ▼ HTTP POST
┌──────────────────────────────────────┐
│          Webhook Server              │
│                                      │
│  1. Verify signature/HMAC secret     │
│  2. Parse request body               │
│  3. Route to channel handler         │
│  4. Channel normalizes message       │
│  5. Emit to Event Bus                │
│                                      │
│  Response: 200 OK                    │
└──────────────────────────────────────┘
       │
       ▼
   Event Bus ──► Gateway ──► Agent ──► Response
```

### Outbound Webhook Flow

```
Internal Event
       │
       ▼
┌──────────────────────────────────────┐
│         Webhook Manager              │
│                                      │
│  1. Find matching webhook            │
│  2. Build payload                    │
│  3. Sign with secret                 │
│  4. POST to target URL               │
│  5. Retry on failure                 │
│  6. Record delivery status           │
│                                      │
└──────────────────────────────────────┘
```

### Signature Verification

```
Incoming Request
       │
       ▼
Extract signature from header
       │
       ▼
Compute HMAC(secret, body)
       │
       ▼
Compare: computed === received
       │
       ├── Match ──► Process payload
       │
       └── No Match ──► Return 401 Unauthorized
```

---

## Test Files

| File | Coverage |
|------|----------|
| `/home/runner/workspace/agent-gateway/test/webhooks/*.test.ts` | Webhook server and manager tests (this directory) |
| `/home/runner/workspace/agent-gateway/test/channels/` | Channel webhook handling |

---

## Test Scenarios

### Webhook Server

- Server starts on configured port
- Server stops cleanly
- Routes are registered for each channel
- Unknown routes return 404
- Malformed requests return 400

### Signature Verification

- Valid signature passes verification
- Invalid signature is rejected (401)
- Missing signature is rejected (401)
- Different signing algorithms supported (HMAC, JWT)

### Payload Parsing

- JSON body parsed correctly
- Form-urlencoded body parsed correctly
- Multipart form data parsed correctly
- Oversized body rejected (max size limit)

### Channel Routing

- Telegram webhooks route to Telegram handler
- Discord webhooks route to Discord handler
- Slack webhooks route to Slack handler
- WhatsApp webhooks route to WhatsApp handler
- Unknown channels return error

### Outbound Delivery

- Webhook delivers to target URL
- Delivery includes correct payload
- Failed delivery retries with backoff
- Max retries enforced
- Delivery status tracked

### Webhook Lifecycle

- Create webhook with URL and secret
- Update webhook configuration
- Delete webhook
- List active webhooks
- Webhook validation on creation

---

## Mocking Strategy

### Mock HTTP Server

```typescript
import { vi } from 'vitest';

// Use supertest or mock HTTP for webhook testing
const mockServer = {
  listen: vi.fn().mockImplementation((port, cb) => cb()),
  close: vi.fn().mockImplementation((cb) => cb()),
};

vi.mock('express', () => ({
  default: vi.fn(() => ({
    use: vi.fn(),
    post: vi.fn(),
    get: vi.fn(),
    listen: mockServer.listen,
    close: mockServer.close,
  })),
}));
```

### Mock Platform Webhook Payloads

```typescript
// Telegram webhook payload
const telegramWebhook = {
  update_id: 123456789,
  message: {
    message_id: 1,
    from: { id: 12345, username: 'user1' },
    chat: { id: 67890, type: 'private' },
    text: 'Hello bot!',
    date: 1712345678,
  },
};

// Discord webhook payload
const discordWebhook = {
  type: 0,
  content: 'Hello bot!',
  channel_id: '123456789',
  author: { id: '987654321', username: 'user1' },
  timestamp: '2024-01-01T00:00:00.000Z',
};

// Slack webhook payload
const slackWebhook = {
  token: 'verification-token',
  team_id: 'T123',
  event: {
    type: 'message',
    text: 'Hello bot!',
    user: 'U123',
    channel: 'C123',
    ts: '1712345678.000100',
  },
};
```

---

## Running Webhook Tests

```bash
cd /home/runner/workspace/agent-gateway

# Run webhook tests
npm run test -- webhooks

# Run specific test file
npm run test -- webhooks/webhook-server.test.ts

# Run with coverage for webhooks module
npm run test:coverage -- --include "src/webhooks/**"
```

---

## Signature Verification

### HMAC Verification Test

```typescript
import { describe, it, expect } from 'vitest';
import { createHash } from 'node:crypto';

describe('Webhook Signature Verification', () => {
  const secret = 'webhook-secret';

  function createHmacSignature(body: string, secret: string): string {
    return createHash('sha256')
      .update(secret + body)
      .digest('hex');
  }

  it('should verify a valid HMAC signature', async () => {
    const body = JSON.stringify({ message: 'test' });
    const signature = createHmacSignature(body, secret);

    const isValid = verifyWebhookSignature(body, signature, secret);
    expect(isValid).toBe(true);
  });

  it('should reject an invalid signature', async () => {
    const body = JSON.stringify({ message: 'test' });
    const invalidSignature = 'invalid-signature';

    const isValid = verifyWebhookSignature(body, invalidSignature, secret);
    expect(isValid).toBe(false);
  });

  it('should reject missing signature', async () => {
    const body = JSON.stringify({ message: 'test' });

    const isValid = verifyWebhookSignature(body, '', secret);
    expect(isValid).toBe(false);
  });
});
```

---

## Retry Logic

Webhook delivery uses exponential backoff for retries:

```typescript
interface DeliveryAttempt {
  url: string;
  payload: any;
  attempt: number;
  maxAttempts: number;
  status?: number;
  error?: string;
  nextRetryAt?: number;
}

async function deliverWithRetry(
  url: string,
  payload: any,
  secret: string,
  maxAttempts = 3
): Promise<DeliveryResult> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': sign(payload, secret),
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return { success: true, attempt };
      }
    } catch (err) {
      if (attempt === maxAttempts) {
        return { success: false, attempt, error: err.message };
      }
      // Exponential backoff
      await sleep(1000 * Math.pow(2, attempt - 1));
    }
  }
  return { success: false, attempt: maxAttempts, error: 'Max retries exceeded' };
}
```

### Retry Tests

```typescript
describe('Webhook Delivery Retry', () => {
  it('should retry on failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('Network error'));
    fetchMock.mockResolvedValueOnce({ ok: true });

    const result = await deliverWithRetry(
      'https://example.com/webhook',
      { event: 'message' },
      'secret',
      3
    );

    expect(result.success).toBe(true);
    expect(result.attempt).toBe(2);
  });

  it('should fail after max retries', async () => {
    fetchMock.mockRejectedValue(new Error('Network error'));

    const result = await deliverWithRetry(
      'https://example.com/webhook',
      { event: 'message' },
      'secret',
      3
    );

    expect(result.success).toBe(false);
    expect(result.attempt).toBe(3);
  });
});
```

---

## Writing New Webhook Tests

### Checklist

- [ ] Test server start and stop
- [ ] Test route registration
- [ ] Test signature verification (valid, invalid, missing)
- [ ] Test payload parsing (JSON, form, multipart)
- [ ] Test channel routing
- [ ] Test error handling (404, 400, 401, 500)
- [ ] Test outbound delivery
- [ ] Test outbound retry logic
- [ ] Test webhook lifecycle (create, update, delete, list)
- [ ] Test max body size enforcement
- [ ] Test concurrent webhook deliveries

### Example

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createWebhookServer } from '/home/runner/workspace/agent-gateway/src/webhooks/index.js';

describe('WebhookServer', () => {
  let server: ReturnType<typeof createWebhookServer>;

  beforeEach(async () => {
    server = createWebhookServer({
      port: 0, // Dynamic port
      secret: 'test-secret',
    });
    await server.start();
  });

  afterEach(async () => {
    await server.stop();
  });

  it('should start and stop', async () => {
    expect(server.isRunning()).toBe(true);
    await server.stop();
    expect(server.isRunning()).toBe(false);
  });

  it('should reject requests without valid signature', async () => {
    const response = await fetch(`http://localhost:${server.port}/webhook/telegram`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'test' }),
    });

    expect(response.status).toBe(401);
  });

  it('should accept requests with valid signature', async () => {
    const body = JSON.stringify({ message: 'test' });
    const signature = createHmacSignature(body, 'test-secret');

    const response = await fetch(`http://localhost:${server.port}/webhook/telegram`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body,
    });

    expect(response.status).toBe(200);
  });
});
```

---

## Integration Points

The webhook system integrates with:

| Component | Integration |
|-----------|-------------|
| **Channels** | Webhooks route to channel handlers |
| **Event Bus** | Parsed messages emitted as events |
| **Gateway** | Events trigger message processing |
| **Security** | Signature verification for authenticity |
| **Observability** | Webhook delivery metrics |
| **Webhook Manager** | Outbound webhook delivery |
| **Server** | Shares HTTP server with REST API |
