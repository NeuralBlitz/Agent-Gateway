# Webhook Tests

> **Tests for webhook handling and delivery**

This directory contains tests for the webhook subsystem that handles inbound HTTP callbacks from messaging platforms and external services.

---

## Overview

Location: `/home/runner/workspace/test/webhooks/`

The webhook system receives platform callbacks (from Telegram, Discord, Slack, WhatsApp), verifies signatures, parses payloads, and routes messages to the appropriate channel handler. Tests cover signature verification, payload parsing, channel routing, and delivery retry.

## Test Scope

| Scenario | Description |
|----------|-------------|
| Webhook server | Server starts, stops, routes correctly |
| Signature verification | Valid signatures pass, invalid rejected |
| Payload parsing | JSON, form, multipart bodies parse correctly |
| Channel routing | Messages route to correct handler |
| Delivery retry | Failed deliveries retry with backoff |
| Error handling | Malformed requests return appropriate errors |

## Running Tests

```bash
cd /home/runner/workspace
npx vitest run test/webhooks/
```

## See Also

- Agent Gateway webhook tests: `/home/runner/workspace/agent-gateway/test/webhooks/README.md`
- Webhook source: `/home/runner/workspace/agent-gateway/src/webhooks/`
