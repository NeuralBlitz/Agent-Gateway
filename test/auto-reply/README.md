# Auto-Reply Tests

> **Tests for the automatic message reply pipeline**

This directory contains tests for the auto-reply subsystem of the OpenClaw workspace. These tests validate the end-to-end message processing pipeline from inbound message reception through AI response generation.

---

## Overview

Location: `/home/runner/workspace/test/auto-reply/`

The auto-reply pipeline processes incoming messages by:
1. Loading the user session
2. Building conversation context
3. Calling the AI provider
4. Returning the response through the channel

## Test Scope

| Scenario | Description |
|----------|-------------|
| Reply generation | AI generates appropriate responses |
| Session context | Conversation history is preserved |
| Tool execution | Agent tools execute correctly |
| Error recovery | Failures are handled gracefully |
| Timeout handling | Long requests are terminated properly |

## Running Tests

```bash
cd /home/runner/workspace
npx vitest run test/auto-reply/
```

## Writing Tests

Tests should verify the complete message flow:

```typescript
import { describe, it, expect } from 'vitest';

describe('Auto-Reply', () => {
  it('should generate a reply for a message', async () => {
    // Send message to gateway
    // Verify response is received
    // Verify response is non-empty
    // Verify session is updated
  });
});
```

## Integration Points

- **Gateway**: Message processing pipeline
- **Sessions**: Conversation context loading
- **Providers**: AI model API calls
- **Channels**: Message send/receive

## See Also

- Agent Gateway auto-reply tests: `/home/runner/workspace/agent-gateway/test/auto-reply/README.md`
- Auto-reply source: `/home/runner/workspace/openclaw-lrs-agents/src/auto-reply/`
