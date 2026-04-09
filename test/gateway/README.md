# Gateway Tests

> **Tests for the gateway server integration**

This directory contains tests for the gateway server running on port 3000 in the OpenClaw workspace.

---

## Overview

Location: `/home/runner/workspace/test/gateway/`

Tests validate the live gateway server including health checks, WebSocket connectivity, HTTP endpoints, and overall server behavior.

## Test Scope

| Scenario | Description |
|----------|-------------|
| Health checks | `/health` endpoint returns correct status |
| Server lifecycle | Server starts and stops cleanly |
| WebSocket | WebSocket connections establish correctly |
| HTTP endpoints | REST endpoints respond as expected |

## Running Tests

```bash
cd /home/runner/workspace
npx vitest run test/gateway/
```

## See Also

- Agent Gateway gateway tests: `/home/runner/workspace/agent-gateway/test/gateway/README.md`
