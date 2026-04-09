# Hook Tests

> **Tests for the lifecycle hook system**

This directory contains tests for the hook system that allows custom logic injection at any phase of the message processing pipeline.

---

## Overview

Location: `/home/runner/workspace/test/hooks/`

Hooks execute at defined lifecycle phases: `beforeMessage`, `beforeAgent`, `afterAgent`, `afterResponse`, and `onError`. These tests validate hook registration, priority ordering, error handling, and phase execution.

## Test Scope

| Scenario | Description |
|----------|-------------|
| Hook registration | Hooks register with name, phase, handler, priority |
| Priority ordering | Hooks execute in descending priority order |
| Error handling | Errors in hooks are caught and propagated |
| Phase execution | Each phase executes at the correct point |
| Global hooks | Singleton pattern works correctly |

## Running Tests

```bash
cd /home/runner/workspace
npx vitest run test/hooks/
```

## See Also

- Agent Gateway hook tests: `/home/runner/workspace/agent-gateway/test/hooks/README.md`
- Hook source: `/home/runner/workspace/agent-gateway/src/hooks/`
