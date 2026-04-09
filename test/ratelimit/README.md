# Rate Limit Tests

> **Tests for rate limiting behavior**

This directory contains tests for rate limiting in the OpenClaw workspace deployment.

---

## Overview

Location: `/home/runner/workspace/test/ratelimit/`

Tests validate rate limit enforcement, per-user limits, and rate limit headers in API responses.

## Test Scope

| Scenario | Description |
|----------|-------------|
| Rate limit enforcement | Requests exceeding limits are rejected |
| Per-user limits | Each user has independent rate limit |
| Rate limit headers | X-RateLimit-* headers present in responses |
| Recovery | Rate limits reset after window expires |

## Running Tests

```bash
cd /home/runner/workspace
npx vitest run test/ratelimit/
```

## See Also

- Agent Gateway rate limit tests: `/home/runner/workspace/agent-gateway/test/ratelimit/README.md`
