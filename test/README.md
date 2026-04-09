# Test Suite

> **Test infrastructure for the OpenClaw workspace**

This directory contains tests for the OpenClaw workspace project. Tests are organized by subsystem to validate different aspects of the system including agents, authentication, edge cases, error handling, the gateway, infrastructure, performance, plugin SDK, rate limiting, and security.

---

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Directories](#test-directories)
- [Writing Tests](#writing-tests)
- [Test Conventions](#test-conventions)
- [CI/CD Integration](#cicd-integration)
- [Related Projects](#related-projects)

---

## Overview

This workspace-level test directory provides a testing foundation for the OpenClaw gateway deployment on Replit. The tests validate the integration between the gateway server, agent configuration, and the overall deployment infrastructure.

### Project Context

The OpenClaw workspace consists of:

- **Gateway Server**: Running on port 3000 (`/home/runner/workspace/index.ts`)
- **Agent Gateway**: Full-featured AI gateway at `/home/runner/workspace/agent-gateway/`
- **OpenClaw Source**: Agent source code at `/home/runner/workspace/openclaw-lrs-agents/`
- **Configuration**: Gateway config at `~/.openclaw/openclaw.json`

---

## Test Structure

```
/home/runner/workspace/test/
  README.md                     # This file
  agents/                       # Agent behavior and configuration tests
  auth/                         # Authentication and token tests
  edge-cases/                   # Boundary condition and unusual input tests
  error-handling/               # Error recovery and resilience tests
  gateway/                      # Gateway server integration tests
  infra/                        # Infrastructure and deployment tests
  performance/                  # Performance and load tests
  plugin-sdk/                   # Plugin system tests
  ratelimit/                    # Rate limiting tests
  security/                     # Security and vulnerability tests
```

---

## Running Tests

Tests in this workspace are designed to run against the live gateway deployment:

```bash
cd /home/runner/workspace

# Run all tests
npx vitest run test/

# Run specific subsystem
npx vitest run test/gateway/
npx vitest run test/security/

# Run with watch mode for development
npx vitest test/
```

---

## Test Directories

### `/home/runner/workspace/test/agents/`

Tests for agent behavior, configuration, and model interactions. Covers agent activation, model selection, and agent-specific settings.

### `/home/runner/workspace/test/auth/`

Tests for authentication and token management. Covers the gateway auth token (`ec907a1f86fd4601654abbb1e2c485b85b2a832ee0e314b4`), WebSocket authentication, and origin validation.

### `/home/runner/workspace/test/edge-cases/`

Tests for boundary conditions, unusual inputs, and uncommon scenarios that could cause unexpected behavior.

### `/home/runner/workspace/test/error-handling/`

Tests for error recovery, graceful degradation, and resilience. Covers network failures, provider errors, and configuration errors.

### `/home/runner/workspace/test/gateway/`

Tests for the gateway server running on port 3000. Covers health checks, WebSocket connectivity, and HTTP endpoints.

### `/home/runner/workspace/test/infra/`

Tests for deployment infrastructure including Nix configuration, Replit environment, and startup scripts.

### `/home/runner/workspace/test/performance/`

Tests for system performance including response latency, concurrent connections, and memory usage.

### `/home/runner/workspace/test/plugin-sdk/`

Tests for the plugin system including plugin loading, activation, and interface compliance.

### `/home/runner/workspace/test/ratelimit/`

Tests for rate limiting behavior including request throttling, per-user limits, and rate limit headers.

### `/home/runner/workspace/test/security/`

Tests for security controls including origin validation, token authentication, and input sanitization.

---

## Writing Tests

### Test File Convention

Test files should follow the naming convention `feature.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';

describe('FeatureName', () => {
  describe('happy path', () => {
    it('should work with valid input', async () => {
      // Arrange, Act, Assert
    });
  });

  describe('error cases', () => {
    it('should handle invalid input gracefully', async () => {
      // ...
    });
  });
});
```

### Testing the Live Gateway

When testing the running gateway server:

```typescript
import { describe, it, expect } from 'vitest';

const GATEWAY_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'ec907a1f86fd4601654abbb1e2c485b85b2a832ee0e314b4';

describe('Gateway Health', () => {
  it('should respond to health check', async () => {
    const response = await fetch(`${GATEWAY_URL}/health`);
    expect(response.ok).toBe(true);
    const body = await response.json();
    expect(body).toHaveProperty('ok', true);
  });
});
```

### Testing WebSocket

```typescript
import WebSocket from 'ws';

it('should connect via WebSocket with auth token', async () => {
  const ws = new WebSocket(
    `ws://localhost:3000/#token=${AUTH_TOKEN}`
  );

  await new Promise((resolve, reject) => {
    ws.on('open', resolve);
    ws.on('error', reject);
  });

  ws.close();
});
```

---

## Test Conventions

1. **Isolation**: Each test should be independently runnable
2. **Cleanup**: Restore state after each test
3. **Descriptive names**: Test names should describe the expected behavior
4. **Async handling**: Always await async operations
5. **Use port 3000**: The gateway runs on this port in the Replit environment
6. **Include auth token**: WebSocket tests must include the auth token in the URL hash

---

## CI/CD Integration

Tests are designed to run in the Replit environment. The test suite can be triggered:

- Manually via the Replit shell
- As part of deployment verification
- On configuration changes

---

## Related Projects

- **Agent Gateway tests**: `/home/runner/workspace/agent-gateway/test/README.md`
- **Agent Gateway docs**: `/home/runner/workspace/agent-gateway/docs/`
- **OpenClaw source**: `/home/runner/workspace/openclaw-lrs-agents/src/`
- **Main README**: `/home/runner/workspace/README.md`
