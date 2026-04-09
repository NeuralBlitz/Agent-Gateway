# Test Suite

> **Comprehensive test suite for Agent Gateway**

This directory contains the complete test suite for Agent Gateway, covering unit tests, integration tests, and end-to-end tests. The tests validate all major subsystems including channels, providers, agents, sessions, hooks, authentication, rate limiting, and webhooks.

---

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Configuration](#test-configuration)
- [Test Directories](#test-directories)
- [Test Files](#test-files)
- [Testing Patterns](#testing-patterns)
- [Mocking Strategy](#mocking-strategy)
- [Test Coverage](#test-coverage)
- [Continuous Integration](#continuous-integration)
- [Writing New Tests](#writing-new-tests)
- [Debugging Tests](#debugging-tests)
- [Performance Testing](#performance-testing)
- [Testing Best Practices](#testing-best-practices)

---

## Overview

The Agent Gateway test suite uses [Vitest](https://vitest.dev/) as the testing framework and is organized by subsystem. Tests are located in `/home/runner/workspace/agent-gateway/test/` (for the agent-gateway project) and `/home/runner/workspace/test/` (for workspace-level tests).

### Test Categories

| Category | Purpose | Location |
|----------|---------|----------|
| Unit tests | Test individual functions and classes in isolation | `test/*.test.ts` |
| Integration tests | Test interactions between components | `test/*/` subdirectories |
| E2E tests | Test complete user flows | `test/*.test.ts` with `e2e` config |
| Performance tests | Validate system performance under load | `test/performance/` |
| Security tests | Validate security controls | `test/security/` |
| Edge case tests | Test boundary conditions and error paths | `test/edge-cases/` |

---

## Test Structure

```
/home/runner/workspace/agent-gateway/test/
  setup.ts                        # Global test setup and mocks
  gateway.test.ts                 # Gateway core tests
  hooks.test.ts                   # Hook system tests
  tools.test.ts                   # Tool registry tests
  workflow.test.ts                # Workflow engine tests
  auth-enterprise.test.ts         # Enterprise auth tests
  cron.test.ts                    # Cron scheduler tests
  enterprise.test.ts              # Enterprise feature tests
  health.test.ts                  # Health check tests
  message-bus.test.ts             # Message bus tests
  moderation.test.ts              # Content moderation tests
  notifications.test.ts           # Notification system tests
  queue.test.ts                   # Message queue tests
  request-deduplicator.test.ts    # Request deduplication tests
  request-logger.test.ts          # Request logging tests
  request-tracker.test.ts         # Request tracking tests
  resource-locker.test.ts         # Resource locking tests
  response-transformer.test.ts    # Response transformation tests
  rule-engine.test.ts             # Rule engine tests
  security-scanner.test.ts        # Security scanner tests
  tenants.test.ts                 # Multi-tenant tests
  api-versioning.test.ts          # API versioning tests
  analytics.test.ts               # Analytics tests
  backup.test.ts                  # Backup manager tests
  cache-manager.test.ts           # Cache manager tests
  circuit-breaker.test.ts         # Circuit breaker tests
  config-manager.test.ts          # Config manager tests
  connection-pool.test.ts         # Connection pool tests
  error-handler.test.ts           # Error handler tests
  feature-flags.test.ts           # Feature flags tests
  auth/                           # Auth tests (directory)
  auto-reply/                     # Auto-reply tests (directory)
  channels/                       # Channel tests (directory)
  gateway/                        # Gateway tests (directory)
  hooks/                          # Hook tests (directory)
  providers/                      # Provider tests (directory)
  ratelimit/                      # Rate limit tests (directory)
  sessions/                       # Session tests (directory)
  webhooks/                       # Webhook tests (directory)
```

---

## Running Tests

### All Tests

```bash
cd /home/runner/workspace/agent-gateway
npm run test
```

### Watch Mode

```bash
npm run test -- --watch
```

### Run Specific Test File

```bash
npm run test -- gateway.test.ts
npm run test -- workflow.test.ts
npm run test -- hooks.test.ts
```

### Run by Pattern

```bash
npm run test -- --grep "Gateway"
npm run test -- --grep "Workflow"
```

### Run Unit Tests Only

```bash
npm run test:unit
```

### Run E2E Tests Only

```bash
npm run test:e2e
```

### With Coverage

```bash
npm run test:coverage
```

Coverage report output:

```
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered
-------------------|---------|----------|---------|---------|----------
All files          |   85.2  |   78.4   |   82.1  |   85.8  |
 gateway/          |   92.3  |   85.7   |   90.0  |   92.8  |
 hooks/            |   88.5  |   80.0   |   85.7  |   89.1  |
 workflow/         |   78.9  |   72.3   |   76.2  |   79.4  |
```

---

## Test Configuration

### Vitest Configuration

Located at `/home/runner/workspace/agent-gateway/vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', 'test/'],
    },
  },
});
```

### Test Setup

Located at `/home/runner/workspace/agent-gateway/test/setup.ts`:

```typescript
import { beforeAll, afterAll, afterEach, vi } from 'vitest';

beforeAll(() => {
  vi.setConfig({ hookTimeout: 10000, testTimeout: 30000 });
});

afterAll(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

// Global fetch mock
global.fetch = vi.fn();

// Global crypto mock
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomBytes: (size: number) => { /* ... */ },
    getRandomValues: (arr: Uint8Array) => { /* ... */ },
  },
});
```

---

## Test Directories

### `/home/runner/workspace/agent-gateway/test/auth/`

Authentication and authorization tests including API key validation, RBAC, token management, and OAuth flows.

### `/home/runner/workspace/agent-gateway/test/auto-reply/`

Auto-reply pipeline tests including templating, context management, and response generation.

### `/home/runner/workspace/agent-gateway/test/channels/`

Channel adapter tests for all supported messaging platforms.

### `/home/runner/workspace/agent-gateway/test/gateway/`

Gateway core tests including lifecycle management, channel/provider registration, and session management.

### `/home/runner/workspace/agent-gateway/test/hooks/`

Hook system tests including registration, execution order, error handling, and lifecycle phases.

### `/home/runner/workspace/agent-gateway/test/providers/`

Provider adapter tests for all supported AI providers.

### `/home/runner/workspace/agent-gateway/test/ratelimit/`

Rate limiting tests including global, per-user, and per-channel rate limits.

### `/home/runner/workspace/agent-gateway/test/sessions/`

Session management tests including persistence backends, TTL, and message history.

### `/home/runner/workspace/agent-gateway/test/webhooks/`

Webhook server tests including validation, delivery, retry, and signature verification.

---

## Test Files

Key test files and what they cover:

| File | Coverage |
|------|----------|
| `gateway.test.ts` | Gateway creation, start/stop, channel/provider registration, session management, event emission |
| `hooks.test.ts` | Hook creation, registration, priority ordering, error handling, global hooks singleton |
| `workflow.test.ts` | Workflow registration, execution, conditional branching, delay steps, cancellation, stats |
| `tools.test.ts` | Tool registry, Bash tool, Filesystem tool, Web Search tool, execution and safety |
| `auth-enterprise.test.ts` | Enterprise auth including OAuth, token management, role-based access |
| `circuit-breaker.test.ts` | Circuit breaker state transitions, failure thresholds, half-open behavior |
| `request-deduplicator.test.ts` | Request coalescing, active count tracking, promise sharing |
| `cron.test.ts` | Cron job scheduling, execution, error handling |
| `enterprise.test.ts` | Enterprise features including multi-tenancy, advanced rate limiting |
| `health.test.ts` | Health check endpoints, liveness and readiness probes |
| `security-scanner.test.ts` | Security scanning, threat detection, IP reputation |
| `tenants.test.ts` | Multi-tenant management, API key provisioning, usage tracking |
| `api-versioning.test.ts` | API version management, route versioning |
| `backup.test.ts` | Backup creation, restoration, scheduling |
| `cache-manager.test.ts` | Cache management, TTL, invalidation |
| `config-manager.test.ts` | Dynamic configuration management, change events |
| `connection-pool.test.ts` | Connection pooling, acquisition, release |
| `error-handler.test.ts` | Error handling, categorization, reporting |
| `feature-flags.test.ts` | Feature flag management, evaluation |
| `message-bus.test.ts` | Message bus, publish/subscribe |
| `moderation.test.ts` | Content moderation, severity levels |
| `notifications.test.ts` | Notification system, delivery |
| `queue.test.ts` | Message queue, processing |
| `request-logger.test.ts` | Request logging, filtering |
| `request-tracker.test.ts` | Request tracking, tracing |
| `resource-locker.test.ts` | Distributed resource locking |
| `response-transformer.test.ts` | Response transformation, error formatting |
| `rule-engine.test.ts` | Rule evaluation, conditions |
| `analytics.test.ts` | Conversation analytics, trends |

---

## Testing Patterns

### Arrange-Act-Assert

```typescript
it('should create and start the gateway', async () => {
  // Arrange
  const gw = createGateway({ host: '0.0.0.0', port: 0 });

  // Act
  await gw.start();

  // Assert
  expect(gw.isHealthy()).toBe(true);

  // Cleanup
  await gw.stop();
});
```

### Mock Dependencies

```typescript
import { vi } from 'vitest';

vi.mock('../src/providers/openai/index.js', () => ({
  OpenAIProvider: vi.fn().mockImplementation(() => ({
    id: 'openai',
    connect: vi.fn(),
    chat: vi.fn().mockResolvedValue({ id: '1', content: 'hi', model: 'test', finishReason: 'stop' }),
  })),
}));
```

### Test Helpers

```typescript
function waitForExecution(executionId: string, maxMs = 500): Promise<void> {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = setInterval(() => {
      const exec = engine.getExecution(executionId);
      if (exec && exec.status !== 'pending' && exec.status !== 'running') {
        clearInterval(check);
        resolve();
      } else if (Date.now() - start > maxMs) {
        clearInterval(check);
        resolve();
      }
    }, 20);
  });
}
```

---

## Mocking Strategy

### Global Mocks

Defined in `setup.ts`:
- `global.fetch` -- Mocked to prevent real HTTP calls
- `globalThis.crypto` -- Mocked for deterministic random values

### Module Mocks

Use `vi.mock()` at the top of test files:

```typescript
vi.mock('express', () => ({
  default: vi.fn(() => ({
    use: vi.fn(),
    get: vi.fn(),
    post: vi.fn(),
    listen: vi.fn((port, cb) => cb()),
  })),
}));
```

### Inline Mocks

```typescript
const mockChannel = {
  id: 'test',
  type: 'test',
  name: 'test',
  connected: false,
  config: {},
  connect: vi.fn(async () => { mockChannel.connected = true; }),
  disconnect: vi.fn(async () => { mockChannel.connected = false; }),
  sendMessage: vi.fn(),
  getUser: vi.fn(async () => null),
  getMe: vi.fn(async () => null),
  on: vi.fn(),
};
```

---

## Test Coverage

### Coverage Goals

| Subsystem | Target | Current |
|-----------|--------|---------|
| Gateway Core | 90%+ | 92% |
| Hooks | 85%+ | 88% |
| Channels | 80%+ | 82% |
| Providers | 80%+ | 81% |
| Sessions | 85%+ | 87% |
| Workflow | 75%+ | 78% |
| Auth | 85%+ | 86% |
| Rate Limit | 80%+ | 83% |
| Webhooks | 80%+ | 81% |

### Generating Coverage Reports

```bash
npm run test:coverage
```

Open the HTML report:

```bash
open coverage/index.html
```

---

## Continuous Integration

Tests run automatically on every pull request. The CI pipeline:

1. Install dependencies
2. Run TypeScript type checking
3. Run linter
4. Run test suite with coverage
5. Upload coverage report
6. Block merge if coverage drops below threshold

---

## Writing New Tests

### File Naming

Use the convention `feature.test.ts` for test files.

### Test Structure

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MyFeature } from '../src/feature/index.js';

describe('MyFeature', () => {
  let feature: MyFeature;

  beforeEach(() => {
    feature = new MyFeature();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('creation', () => {
    it('should create with defaults', () => {
      expect(feature).toBeDefined();
    });
  });

  describe('behavior', () => {
    it('should perform the expected action', async () => {
      const result = await feature.doSomething();
      expect(result).toBe('expected');
    });

    it('should handle errors gracefully', async () => {
      await expect(feature.doSomethingFailing()).rejects.toThrow('expected error');
    });
  });
});
```

### Testing Guidelines

1. **One assertion per test**: Each test should verify one behavior
2. **Descriptive names**: Test names should describe the expected behavior
3. **Isolation**: Tests should not depend on each other
4. **Cleanup**: Use `afterEach` to restore mocks and clear state
5. **Async handling**: Always await async operations in tests
6. **Use `port: 0`**: For network tests, use port 0 for dynamic port allocation

---

## Debugging Tests

### Run in Debug Mode

```bash
NODE_OPTIONS='--inspect-brk' npm run test -- --run
```

### Filter Tests

```bash
npm run test -- --grep "specific test name"
```

### Verbose Output

```bash
npm run test -- --reporter=verbose
```

### Watch Mode for TDD

```bash
npm run test -- --watch
```

---

## Performance Testing

Performance tests are located in `/home/runner/workspace/test/performance/` and cover:

- Message throughput under concurrent load
- Session persistence latency
- Provider API response times
- Rate limiting overhead
- Memory usage under sustained load

Run performance tests:

```bash
npm run test -- performance
```

---

## Testing Best Practices

1. **Test behavior, not implementation**: Assert on observable outcomes, not internal state
2. **Use realistic data**: Test with data that matches production patterns
3. **Test error paths**: Happy path tests are not enough; test failures too
4. **Avoid test interdependence**: Each test should be independently runnable
5. **Keep tests fast**: Unit tests should complete in milliseconds
6. **Use factories**: Create test objects through factory functions, not direct construction
7. **Test boundaries**: Test min/max values, empty inputs, null values
8. **Mock external services**: Never make real API calls in tests
9. **Clean up resources**: Close connections, delete temp files, restore mocks
10. **Document test intent**: The test name should clearly state what is being verified
