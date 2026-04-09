# Session Tests

> **Tests for conversation session management**

This directory contains tests for the session management subsystem that maintains conversation state across messages.

---

## Overview

Location: `/home/runner/workspace/test/sessions/`

Sessions persist conversation history per user per channel, enabling the AI agent to maintain context across interactions. Tests validate session creation, persistence, TTL, and message history management.

## Test Scope

| Scenario | Description |
|----------|-------------|
| Session creation | Sessions create with correct fields |
| Session persistence | Sessions survive process restart |
| Message history | Messages append and truncate correctly |
| TTL expiration | Expired sessions clean up properly |
| Session isolation | Different users have separate sessions |

## Running Tests

```bash
cd /home/runner/workspace
npx vitest run test/sessions/
```

## See Also

- Agent Gateway session tests: `/home/runner/workspace/agent-gateway/test/sessions/README.md`
- Session source: `/home/runner/workspace/agent-gateway/src/sessions/`
