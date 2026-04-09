# Channel Tests

> **Tests for messaging channel adapters**

This directory contains tests for messaging channel integrations in the OpenClaw workspace. Tests verify channel connectivity, message formatting, and platform-specific behavior.

---

## Overview

Location: `/home/runner/workspace/test/channels/`

Channel adapters handle communication with external messaging platforms (Telegram, Discord, Slack, WhatsApp, Signal, Matrix). These tests validate channel behavior in the live deployment environment.

## Test Scope

| Scenario | Description |
|----------|-------------|
| Channel connectivity | Channels connect and stay connected |
| Message sending | Messages format correctly for each platform |
| Message receiving | Inbound messages parse correctly |
| Media handling | Photos, documents, and files process correctly |
| Error recovery | Channel errors are handled gracefully |

## Running Tests

```bash
cd /home/runner/workspace
npx vitest run test/channels/
```

## Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('Channel - Telegram', () => {
  it('should send and receive messages', async () => {
    // Test message flow through channel
  });
});
```

## See Also

- Agent Gateway channel tests: `/home/runner/workspace/agent-gateway/test/channels/README.md`
- Channel docs: `/home/runner/workspace/agent-gateway/docs/channels/README.md`
