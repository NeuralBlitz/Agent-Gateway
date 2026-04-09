# Documentation

> **Comprehensive documentation for the Agent Gateway project**

This directory contains the official documentation for Agent Gateway, a universal AI agent gateway that bridges messaging platforms to AI providers. The documentation is organized into thematic sections to help you find the right information regardless of your role -- whether you are a first-time user, an API consumer, a systems architect, or a plugin developer.

---

## Table of Contents

- [Overview](#overview)
- [Documentation Structure](#documentation-structure)
- [Getting Started](#getting-started)
- [API Reference](#api-reference)
- [Architecture](#architecture)
- [Channel Guides](#channel-guides)
- [Provider Guides](#provider-guides)
- [User Guides and Tutorials](#user-guides-and-tutorials)
- [Documentation Standards](#documentation-standards)
- [Contributing to Documentation](#contributing-to-documentation)
- [Versioning](#versioning)
- [Related Resources](#related-resources)

---

## Overview

Agent Gateway is a production-grade, self-hosted AI agent gateway with the following capabilities:

- **Multi-channel messaging**: Telegram, Discord, Slack, WhatsApp, Signal, Matrix
- **Multi-provider AI**: OpenAI, Anthropic, Google, Mistral, DeepSeek, Ollama
- **Tool-calling agents**: Built-in Bash, Filesystem, and Web Search tools
- **Plugin extensibility**: Custom channels, providers, tools, and hooks
- **Enterprise features**: Rate limiting, authentication, failover, caching, observability

This documentation covers every aspect of the system, from initial setup through advanced production deployment patterns.

---

## Documentation Structure

The documentation is organized into six main sections:

```
/home/runner/workspace/agent-gateway/docs/
  README.md                       # This file - documentation overview
  getting-started/
    README.md                     # Installation and first-run guide
  api/
    README.md                     # REST and WebSocket API reference
  architecture/
    README.md                     # System design and internal architecture
  channels/
    README.md                     # Channel adapter documentation
  providers/
    README.md                     # AI provider adapter documentation
  guides/
    README.md                     # Tutorials, how-tos, and best practices
```

Each section is designed to be self-contained while cross-referencing related content.

### Quick Navigation

| If you want to... | Go to... |
|-------------------|----------|
| Install and run for the first time | [getting-started/](/home/runner/workspace/agent-gateway/docs/getting-started/README.md) |
| Integrate via REST API or WebSocket | [api/](/home/runner/workspace/agent-gateway/docs/api/README.md) |
| Understand system design | [architecture/](/home/runner/workspace/agent-gateway/docs/architecture/README.md) |
| Configure a messaging channel | [channels/](/home/runner/workspace/agent-gateway/docs/channels/README.md) |
| Configure an AI provider | [providers/](/home/runner/workspace/agent-gateway/docs/providers/README.md) |
| Follow step-by-step tutorials | [guides/](/home/runner/workspace/agent-gateway/docs/guides/README.md) |

---

## Getting Started

The [getting-started](/home/runner/workspace/agent-gateway/docs/getting-started/README.md) section covers:

- System requirements and prerequisites
- Installation methods (npm, Docker, from source)
- Initial configuration with `agent-gateway init`
- Starting the gateway server
- Connecting your first channel (Telegram or Discord)
- Configuring your first AI provider (OpenAI or Anthropic)
- Sending a test message and verifying the end-to-end flow
- Next steps after your first successful run

### Minimum Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 20.0.0 | 22.x LTS |
| Memory | 256 MB | 512 MB+ |
| Disk | 100 MB | 500 MB+ (with sessions) |
| Network | Outbound HTTPS | Inbound webhooks for some channels |

---

## API Reference

The [api](/home/runner/workspace/agent-gateway/docs/api/README.md) section provides complete documentation for:

- **REST API endpoints**: Health checks, status, sessions, message sending, streaming
- **WebSocket API**: Real-time bidirectional communication, event types, message formats
- **Authentication**: API key authentication, token management
- **Error responses**: Standard error format, HTTP status codes
- **Rate limiting**: Headers, retry-after behavior
- **SSE Streaming**: Server-Sent Events for streaming responses
- **Prometheus metrics**: Available metrics, metric types, query examples

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/health` | GET | Liveness probe |
| `/healthz` | GET | Kubernetes liveness |
| `/ready` | GET | Readiness probe |
| `/metrics` | GET | Prometheus metrics |
| `/api/status` | GET | Gateway status overview |
| `/api/sessions` | GET | List active sessions |
| `/api/send` | POST | Send message to channel |
| `/api/stream` | POST | Send message with SSE streaming |
| `/api/traces` | GET | Recent distributed traces |
| `/ws` | WebSocket | Real-time communication |

---

## Architecture

The [architecture](/home/runner/workspace/agent-gateway/docs/architecture/README.md) section covers:

- **Layered architecture**: Channels, Gateway Core, Agents, Providers
- **Design patterns**: Adapter pattern, event-driven architecture, plugin system
- **Data flow**: Message lifecycle from inbound webhook to AI response
- **Session management**: Persistence backends (File, Database, Redis, In-Memory)
- **Plugin system**: Plugin types, manifest format, loading lifecycle
- **Observability**: Metrics, tracing, logging architecture
- **Resilience**: Circuit breakers, failover providers, load balancing
- **Security model**: Authentication, rate limiting, webhook validation

---

## Channel Guides

The [channels](/home/runner/workspace/agent-gateway/docs/channels/README.md) section documents each messaging platform adapter:

- **Telegram**: Bot setup, webhook vs polling, supported message types
- **Discord**: Bot setup, intents, gateway events, embeds
- **Slack**: App setup, OAuth scopes, block kit, events API
- **WhatsApp**: Meta developer account, phone number setup, webhooks, templates
- **Signal**: signal-cli integration, basic text messaging
- **Matrix**: Homeserver setup, room management, sync events

Each channel guide includes configuration examples, webhook setup instructions, and platform-specific features.

---

## Provider Guides

The [providers](/home/runner/workspace/agent-gateway/docs/providers/README.md) section documents each AI model provider:

- **OpenAI**: Chat completions, tool-use, model listing, streaming
- **Anthropic**: Messages API, tool_use blocks, streaming
- **Google (Gemini)**: generateContent, function calling, streaming
- **Mistral**: OpenAI-compatible API, tool-use
- **DeepSeek**: OpenAI-compatible API, tool-use
- **Ollama**: Local deployment, model management, /api/chat endpoint

Each provider guide covers API key configuration, supported models, tool-calling capabilities, and known limitations.

---

## User Guides and Tutorials

The [guides](/home/runner/workspace/agent-gateway/docs/guides/README.md) section provides step-by-step tutorials and best practices:

- Creating your first bot
- Setting up multi-channel support
- Configuring custom tools
- Writing custom hooks
- Building and deploying plugins
- Production deployment patterns
- Docker and Kubernetes configuration
- Monitoring and alerting setup
- Troubleshooting common issues

---

## Documentation Standards

All documentation in this directory follows these conventions:

### File Naming

- Use lowercase with hyphens: `getting-started.md`, `rate-limiting.md`
- Each directory should have a `README.md` as the entry point
- Use descriptive filenames: `telegram-setup.md` not `tg.md`

### Content Structure

Every documentation file should follow this structure:

```markdown
# Title

> One-sentence summary

## Overview
Brief description of what this document covers.

## Prerequisites
What you need before following this guide.

## Steps / API Reference / Concepts
The main content.

## Examples
Code examples with explanations.

## Troubleshooting
Common issues and their solutions.

## See Also
Links to related documentation.
```

### Code Examples

- Use language-specific code blocks: ````typescript`, ````bash`, ````json`
- Include complete, runnable examples where possible
- Use placeholder values for secrets: `"your-api-key-here"`
- Specify file paths using absolute paths for clarity

### Version Notes

- Mark version-specific behavior changes with callouts:
  ```
  > **Note**: This behavior changed in v1.2.0. See the migration guide.
  ```

---

## Contributing to Documentation

### Adding New Documentation

1. Create the file in the appropriate subdirectory
2. Follow the documentation standards above
3. Add cross-references from related documents
4. Update this README.md if adding a new section
5. Test all code examples

### Reviewing Documentation

Before submitting documentation changes:

1. Verify all links are valid
2. Test code examples against the current codebase
3. Check for typos and grammatical errors
4. Ensure consistency with existing documentation style
5. Verify version numbers and feature flags are accurate

### Documentation Gaps

Areas that need documentation (contributions welcome):

- [ ] Multi-provider failover configuration guide
- [ ] Load balancer setup for distributed deployments
- [ ] Custom channel adapter development tutorial
- [ ] Custom provider adapter development tutorial
- [ ] Plugin publishing and distribution guide
- [ ] Performance tuning and benchmarking
- [ ] Security hardening checklist
- [ ] Migration guides between major versions

---

## Versioning

This documentation corresponds to Agent Gateway **v1.0.0**. Documentation for different versions may diverge -- always check the version compatibility note at the top of each file.

| Version | Documentation Branch | Notes |
|---------|---------------------|-------|
| 1.0.x | main | Current stable |
| 0.x | (pre-release) | Legacy -- not maintained |

---

## Related Resources

- **Main README**: `/home/runner/workspace/agent-gateway/README.md` -- Project overview and quick start
- **Source code**: `/home/runner/workspace/agent-gateway/src/` -- Full source with inline JSDoc comments
- **Test suite**: `/home/runner/workspace/agent-gateway/test/` -- Tests serve as executable documentation
- **Package manifest**: `/home/runner/workspace/agent-gateway/package.json` -- Dependencies and scripts
- **Configuration schema**: Defined in `/home/runner/workspace/agent-gateway/src/config/index.ts`
- **Plugin SDK types**: `/home/runner/workspace/agent-gateway/src/plugin-sdk/index.ts`

### External Resources

- [Express.js Documentation](https://expressjs.com/) -- HTTP server framework
- [Zod Documentation](https://zod.dev/) -- Schema validation
- [Prometheus Client](https://github.com/siimon/prom-client) -- Metrics library
- [Vitest Documentation](https://vitest.dev/) -- Testing framework
