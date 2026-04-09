# Provider Tests

> **Tests for AI model provider adapters**

This directory contains tests for AI provider integrations in the OpenClaw workspace. Tests verify provider connectivity, chat completion, tool-calling, and error handling.

---

## Overview

Location: `/home/runner/workspace/test/providers/`

Provider adapters connect to AI model APIs (OpenAI, Anthropic, Google, Mistral, DeepSeek, Ollama). These tests validate provider behavior in the live deployment environment.

## Test Scope

| Scenario | Description |
|----------|-------------|
| Provider connection | API keys validate and connect |
| Chat completion | Responses generate correctly |
| Tool-calling | Tools execute and return results |
| Streaming | Token-by-token streaming works |
| Error handling | Invalid keys, rate limits, timeouts handled |

## Running Tests

```bash
cd /home/runner/workspace
npx vitest run test/providers/
```

## See Also

- Agent Gateway provider tests: `/home/runner/workspace/agent-gateway/test/providers/README.md`
- Provider docs: `/home/runner/workspace/agent-gateway/docs/providers/README.md`
