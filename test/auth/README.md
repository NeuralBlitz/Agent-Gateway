# Auth Tests

> **Tests for authentication and token management**

This directory contains tests for the authentication subsystem of the OpenClaw workspace deployment.

---

## Overview

Location: `/home/runner/workspace/test/auth/`

Tests cover the gateway auth token, WebSocket authentication, and origin validation for the Replit deployment.

## Test Scope

| Scenario | Description |
|----------|-------------|
| Token validation | Auth token is correctly verified |
| WebSocket auth | WebSocket connections authenticate via hash fragment |
| Origin validation | Origin header is validated against allowed origins |
| Token format | Token format and extraction work correctly |

## Running Tests

```bash
cd /home/runner/workspace
npx vitest run test/auth/
```

## See Also

- Agent Gateway auth tests: `/home/runner/workspace/agent-gateway/test/auth/README.md`
