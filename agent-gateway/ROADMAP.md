# Agent Gateway — Scaling & Upgrade Roadmap

> A massive, comprehensive future plan for evolving Agent Gateway from a capable AI routing layer into a production-grade, enterprise-scale AI agent platform.

---

## Table of Contents

1. [Vision & Guiding Principles](#1--vision--guiding-principles)
2. [Current State Assessment](#2-current-state-assessment)
3. [Phase 1: Foundation Hardening (v1.1–v1.2)](#3-phase-1-foundation-hardening-v11v12)
4. [Phase 2: Scale & Multi-Instance (v1.3–v1.5)](#4-phase-2-scale--multi-instance-v13v15)
5. [Phase 3: Agent Platform (v2.0)](#5-phase-3-agent-platform-v20)
6. [Phase 4: Enterprise & Ecosystem (v2.1–v2.5)](#6-phase-4-enterprise--ecosystem-v21v25)
7. [Phase 5: Platform & Marketplace (v3.0)](#7-phase-5-platform--marketplace-v30)
8. [Cross-Cutting Work Streams](#8-cross-cutting-work-streams)
9. [Migration Guides](#9-migration-guides)
10. [Risk Register](#10-risk-register)
11. [Success Metrics](#11-success-metrics)

---

## 1 · Vision & Guiding Principles

### Vision

Transform Agent Gateway from a **simple AI routing layer** (6 channels × 6 providers, single-process, ~50-line agent loop) into a **production-grade, horizontally-scalable AI agent platform** capable of serving thousands of concurrent sessions across dozens of messaging channels and AI providers, with rich tool ecosystems, multi-tenant isolation, and enterprise-grade observability.

### Guiding Principles

| Principle | What It Means |
|---|---|
| **Backward compatible** | Existing `agent-gateway.config.json` and `.env` files continue to work across all minor versions |
| **Incremental adoption** | Every new feature is opt-in via config; defaults remain unchanged |
| **Small core, big ecosystem** | Keep the core lean; push capability into extensions/plugins |
| **Production-first** | Every feature ships with metrics, logging, and error handling from day one |
| **Type-safe end-to-end** | No `@ts-nocheck` in new code; strict mode everywhere; Zod runtime validation at boundaries |
| **Test infrastructure** | No feature merges without unit + integration tests; aim for 80%+ coverage on new code |

---

## 2 · Current State Assessment

### Strengths

- ✅ Clean layered architecture (Channel → Gateway → Agent → Provider)
- ✅ 6 channel adapters + 6 provider adapters with a uniform interface
- ✅ Tool-calling agent loop with 3 built-in tools (Bash, Filesystem, WebSearch)
- ✅ Session persistence with 4 backends (InMemory, File, Database, Redis)
- ✅ 9-phase hook system for lifecycle extensibility
- ✅ Plugin SDK for runtime extensibility (channels, providers, tools)
- ✅ Prometheus metrics + distributed tracing + structured logging
- ✅ REST API + WebSocket API + SSE streaming interfaces
- ✅ 50+ enterprise module stubs (auth, rate limiting, webhooks, GraphQL, etc.)
- ✅ Docker deployment with health checks
- ✅ 44 test files covering core, channels, providers, and enterprise modules

### Gaps (vs. State of the Art)

| Area | Current | Gap |
|---|---|---|
| **Agent loop** | ~50 lines, no error classification | No model fallback, no context overflow handling, no compaction, no auth profile rotation, no lane-based concurrency |
| **Channel coverage** | 6 (Signal is stub) | Missing 20+ channels that OpenClaw supports |
| **Provider coverage** | 6 | Missing xAI, Qwen, Groq, Together, LiteLLM, local LLM |
| **Streaming** | Basic SSE, OpenAI/Anthropic parsers only | No token-level streaming to channels, no partial replies, no progress indicators |
| **Multi-instance** | Single process, in-memory state | No distributed state, no leader election, no shared session store across instances |
| **Multi-tenant** | Stub tenant manager | No real tenant isolation, no usage quotas, no billing integration |
| **Plugin system** | Basic npm loading, 4 registration methods | No discovery, no manifest validation, no config schemas, no hot reload, no CLI from plugins |
| **Skills system** | None | No skill discovery, no markdown skill files, no install specs |
| **Voice/Media** | None | No TTS, no STT, no image/video understanding, no browser automation |
| **CLI** | 7 basic commands | No onboarding wizard, no doctor diagnostics, no daemon management, no update mechanism |
| **Security** | Basic API key auth | No DM pairing, no exec approvals, no sandbox mode, no secret encryption |
| **UI** | Basic `public/index.html` | No control dashboard, no session inspector, no real-time monitoring |
| **Testing** | 44 test files, single vitest config | No e2e test infrastructure, no boundary tests, no contract tests, no load testing |
| **TypeScript** | `@ts-nocheck` on gateway and channels | Type safety gaps in the two most critical modules |

---

## 3 · Phase 1: Foundation Hardening (v1.1–v1.2)

> **Goal:** Fix the foundations. Remove technical debt, add missing basics, and make the existing feature set production-reliable.

### 3.1 Remove `@ts-nocheck` & Achieve Full Type Safety

**Problem:** `src/gateway/index.ts` and `src/channels/` have `@ts-nocheck`, meaning the two most critical modules have zero compile-time type checking.

**Plan:**

| Step | Action | Effort |
|---|---|---|
| 1 | Define strict `GatewayOptions`, `ChannelMessage`, `Session` interfaces with no `any` types | 2 days |
| 2 | Replace `Record<string, any>` with typed `Metadata` and `Context` types throughout gateway | 3 days |
| 3 | Type all channel adapters with channel-specific config interfaces (TelegramConfig, DiscordConfig, etc.) | 3 days |
| 4 | Add strict null checks and eliminate implicit `any` returns | 2 days |
| 5 | Enable `strict: true` in `tsconfig.json` and fix all violations | 3 days |
| 6 | Add `@typescript-eslint/no-explicit-any` rule to ESLint | 1 day |

**Success criteria:** `tsc --noEmit` passes with zero errors. ESLint `no-explicit-any` passes.

### 3.2 Agent Loop — Error Classification & Graceful Degradation

**Problem:** The agent loop treats all errors the same. A rate limit error is handled identically to a model capacity error.

**Plan:**

```typescript
// NEW: Error classification system
type AgentErrorType =
  | 'rate_limit'        // 429 — retry with backoff
  | 'context_overflow' // Token limit exceeded — compact or truncate
  | 'auth_failure'      // 401 — rotate credentials or alert
  | 'billing_error'     // Insufficient credits — fallback model
  | 'content_filter'    // Safety filter — retry with modified prompt
  | 'timeout'           // Provider didn't respond — retry or fallback
  | 'provider_error'    // 5xx — retry with backoff
  | 'tool_error'        // Tool execution failed — report to agent
  | 'unknown';          // Fall through to existing behavior

function classifyAgentError(error: unknown): {
  type: AgentErrorType;
  retryable: boolean;
  backoffMs: number;
  shouldFallback: boolean;
  userMessage?: string;
}
```

**Error handling matrix:**

| Error Type | Retry? | Backoff | Fallback? | User Message |
|---|---|---|---|---|
| `rate_limit` | ✅ Yes | Exponential, 1s→60s | ✅ Next provider | "I'm being rate-limited, trying a different model…" |
| `context_overflow` | ✅ Yes | None | ❌ | (Auto-compact, no user message) |
| `auth_failure` | ❌ No | None | ✅ Next auth profile | "Authentication issue, trying alternate credentials…" |
| `billing_error` | ❌ No | None | ✅ Fallback model | "My primary model is unavailable, using a backup…" |
| `content_filter` | ✅ Yes | 500ms | ✅ Different provider | (Rephrase internally, no user message) |
| `timeout` | ✅ Yes | 2s→30s | ✅ Next provider | "That took too long, trying again…" |
| `provider_error` | ✅ Yes | Exponential | ✅ After 2 failures | "Having trouble with my AI provider…" |
| `tool_error` | ❌ No | None | ❌ | Report error to agent for retry |

### 3.3 Model Fallback & Provider Failover

**Problem:** If the configured provider fails, the entire request fails.

**Plan:**

```jsonc
// agent-gateway.config.json — NEW section
{
  "failover": {
    "enabled": true,
    "strategy": "ordered",    // "ordered" | "round-robin" | "weighted"
    "providers": [
      { "id": "openai",   "priority": 1, "weight": 100 },
      { "id": "anthropic", "priority": 2, "weight": 80 },
      { "id": "google",    "priority": 3, "weight": 60 },
      { "id": "ollama",    "priority": 4, "weight": 40 }
    ],
    "maxRetries": 3,
    "timeoutMs": 60000,
    "fallbackOnError": true,
    "fallbackOnContentFilter": true,
    "healthCheck": {
      "enabled": true,
      "intervalMs": 60000,
      "unhealthyThreshold": 3
    }
  }
}
```

**Implementation:**
- Wrap `FailoverProvider` class (already exists in `src/failover/index.ts` — needs the actual call-site integration)
- Track per-provider health scores in memory
- Emit `provider:failover` events on the EventBus for observability
- Prometheus metrics: `agw_failover_attempts_total`, `agw_provider_health_score`

### 3.4 Context Window Management & Message Compaction

**Problem:** No awareness of model context windows. If a session exceeds the limit, the provider returns an error and the user gets nothing.

**Plan:**

```typescript
// NEW: ContextManager integration into BaseAgent
interface ContextManagerConfig {
  maxTokens: number;           // Model's context window
  responseReserve: number;     // Tokens reserved for response (default: 4096)
  truncationStrategy: 'oldest-first' | 'summary';
  preserveSystemPrompt: boolean;
  preserveLatestMessages: number;  // Keep last N messages intact
}

// Model context window registry (expandable)
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000,
  'claude-sonnet-4-20250514': 200_000,
  'claude-opus-4-20250514': 200_000,
  'gemini-2.0-flash': 1_048_576,
  'gemini-2.0-pro': 2_000_000,
  'mistral-large-latest': 128_000,
  'deepseek-chat': 128_000,
  'llama3.1': 128_000,
};
```

**Compaction strategies:**
1. **Oldest-first** (default): Drop oldest messages until under limit
2. **Summary** (future): Call a small/cheap model to summarize older messages
3. **Intelligent** (future): Drop low-salience messages (tool calls with short results, redundant exchanges)

**Metrics:** `agw_context_tokens_used`, `agw_context_window_pct`, `agw_compactions_total`

### 3.5 Response Caching

**Problem:** Identical prompts hit the AI provider every time, burning tokens and adding latency.

**Plan:**

```typescript
// Enhance existing src/cache/index.ts
interface ResponseCacheConfig {
  enabled: boolean;
  backend: 'memory' | 'redis';
  maxSize: number;          // LRU max entries
  ttl: number;              // Seconds (default: 3600)
  cacheKeyStrategy: 'messages-only' | 'full-context';
  skipToolCalling: boolean; // Don't cache tool-calling responses (they vary)
}

// Cache key: SHA-256 of normalized messages + model + temperature
function makeCacheKey(messages: ChatMessage[], model: string, temperature: number): string
```

**Invalidation triggers:**
- Config change (model/provider switch)
- Session reset
- Manual API call `DELETE /api/cache`
- TTL expiry

### 3.6 Streaming — Token-Level Delivery to Channels

**Problem:** Responses are delivered as a single block after the full response is generated. Users see nothing until the AI is done "thinking."

**Plan:**

| Channel | Streaming Support | Implementation |
|---|---|---|
| REST API (SSE) | ✅ Already works | Use existing `createSSEResponse()` |
| WebSocket | ✅ Already works | Stream chunks as `message:partial` events |
| Telegram | ⚠️ Edit-in-place | Send message, then `editMessageText` every 200ms |
| Discord | ⚠️ Edit-in-place | Send message, then `edit()` every 200ms |
| Slack | ❌ Block-only | Slack doesn't support message edits at this rate; use block streaming |
| WhatsApp | ❌ Not supported | WhatsApp API doesn't support message editing |
| Signal | ❌ Not supported | Signal doesn't support message editing |
| Matrix | ⚠️ Edit-in-place | Matrix supports `m.relates_to` replacements |

**Rate limiting for streaming:**
- Minimum 200ms between edits (to avoid API rate limits)
- Maximum 50 edits per response (to prevent runaway costs)
- Coalesce small deltas into larger chunks

### 3.7 Session Persistence — Production Hardening

**Problem:** File-backed sessions use a naive write pattern (write to `.tmp`, then write to final path — not actually atomic since it doesn't use `rename()`).

**Plan:**

```typescript
// Fix FileSessionPersistence.save()
async save(session: SessionData): Promise<void> {
  await this.ensureDir();
  session.updatedAt = Date.now();
  const tmpPath = this.filePath(session.id) + '.tmp';
  const finalPath = this.filePath(session.id);
  await writeFile(tmpPath, JSON.stringify(session, null, 2), 'utf-8');
  await rename(tmpPath, finalPath);  // TRUE atomic operation on POSIX
}
```

**Additional session improvements:**
- Add session TTL/exiry config (auto-delete sessions older than N days)
- Add session size limits (max messages, max total size)
- Add session encryption for sensitive data (opt-in via `session.encrypted: true`)
- Add session compression for large sessions (gzip JSON before writing)
- Add session migration tool (`agent-gateway sessions migrate --from file --to redis`)

### 3.8 CLI — Essential Commands

**New commands for v1.1:**

| Command | Description |
|---|---|
| `agent-gateway doctor` | Run health checks: config validation, provider connectivity, channel status, port availability |
| `agent-gateway status` | One-line status: running/stopped, active sessions, connected channels, configured providers |
| `agent-gateway logs [--tail N] [--level LEVEL]` | Tail gateway logs with level filtering |
| `agent-gateway sessions list [--channel CH] [--user ID]` | List active sessions with message counts |
| `agent-gateway sessions reset <id>` | Reset a specific session |
| `agent-gateway sessions prune [--older-than DAYS]` | Delete old sessions |
| `agent-gateway models list` | List configured models with context windows |
| `agent-gateway models test <provider>` | Send a test message to verify provider connectivity |
| `agent-gateway update [--check] [--install]` | Self-update check and install |

### 3.9 Security Hardening

| Item | Current | Target |
|---|---|---|
| Auth | Basic API key + optional JWT | API key rotation, key scoping, IP allowlisting |
| Input validation | Zod on some routes | Zod on ALL routes, input size limits, content-type enforcement |
| Secrets | Plaintext in config | Encrypted secret store (AES-256-GCM with key from env var) |
| Rate limiting | Opt-in, basic | Default-on global + per-user rate limits with Redis backend |
| CORS | `Access-Control-Allow-Origin: *` | Configurable allowed origins, methods, headers |
| TLS | Config file paths only | Auto-generated self-signed certs for dev, Let's Encrypt for prod |
| Bash tool | `blockCommands` list | Allowlist mode (`allowedCommands`), mandatory `allowedDirs` |
| Audit | Enterprise module stub | Structured audit log for all config changes, auth events, tool executions |

### 3.10 Test Infrastructure

| Initiative | Details |
|---|---|
| Split vitest configs | Unit, integration, e2e, boundary, contract — separate configs with separate CI jobs |
| Boundary tests | Verify plugin/extension import isolation (no cross-importing between plugins) |
| Contract tests | Verify all channel adapters conform to the Channel interface |
| Load tests | `autocannon` or `k6` scripts for HTTP and WebSocket endpoints |
| Mock provider harness | In-memory mock of all 6 providers for deterministic testing |
| Mock channel harness | In-memory mock of all 6 channels for inbound/outbound testing |
| CI pipeline | GitHub Actions: lint → typecheck → unit → integration → e2e → load |

**Target:** 80%+ coverage on new code, 60%+ overall.

---

## 4 · Phase 2: Scale & Multi-Instance (v1.3–v1.5)

> **Goal:** Enable horizontal scaling. Run multiple gateway instances behind a load balancer with shared state.

### 4.1 Distributed Architecture

```
                    ┌─────────────┐
                    │  Load       │
                    │  Balancer   │
                    │  (nginx/ALB)│
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │ Gateway  │ │ Gateway  │ │ Gateway  │
        │ Node 1   │ │ Node 2   │ │ Node 3   │
        └────┬─────┘ └────┬─────┘ └────┬─────┘
             │            │            │
             └────────────┼────────────┘
                          ▼
              ┌───────────────────────┐
              │    Shared State       │
              │  ┌─────────────────┐  │
              │  │  Redis Cluster  │  │  ← Sessions, cache, rate limits, pub/sub
              │  └─────────────────┘  │
              │  ┌─────────────────┐  │
              │  │  PostgreSQL     │  │  ← Persistent sessions, audit log, config
              │  └─────────────────┘  │
              │  ┌─────────────────┐  │
              │  │  S3/MinIO       │  │  ← Session backups, media, logs
              │  └─────────────────┘  │
              └───────────────────────┘
```

### 4.2 Redis as the Coordination Layer

**What moves to Redis:**

| Component | Current | Redis-Backed |
|---|---|---|
| Sessions | InMemory or File | Redis Hash per session, TTL-based expiry |
| Cache | LRU memory or Redis | Redis with `EX` TTL, key prefix `agw:cache:` |
| Rate limiting | InMemory | Redis token bucket via `rate-limiter-flexible` |
| Pub/Sub | EventEmitter (local) | Redis Pub/Sub for cross-instance events |
| Distributed locks | None | Redlock for leader election, config writes |
| Presence | None | Redis keys with TTL for instance heartbeats |

**New config:**

```jsonc
{
  "cluster": {
    "enabled": true,
    "redis": {
      "url": "redis://localhost:6379",
      "cluster": false,
      "keyPrefix": "agw:"
    },
    "instanceId": "auto",          // Auto-generated UUID
    "instanceLabel": "gateway-1",  // Human-readable label
    "leaderElection": true,        // One instance handles cron, config writes
    "heartbeatIntervalMs": 5000,
    "heartbeatTtlMs": 15000
  }
}
```

### 4.3 Leader Election

**Why:** Some operations must be single-writer:
- Cron job execution (don't want 3 instances running the same job)
- Config file writes (prevent conflicting writes)
- Session compaction jobs
- Backup creation

**Implementation:**
```typescript
// Leader election via Redlock
class LeaderElection {
  private lock: Redlock;
  private isLeader: boolean = false;

  async tryAcquire(): Promise<boolean> {
    try {
      this.lock = await redlock.acquire(['agw:leader:lock'], 15000);
      this.isLeader = true;
      this.emit('became-leader');
      this.startRefreshLoop();
      return true;
    } catch {
      this.isLeader = false;
      return false;
    }
  }

  async release(): Promise<void> {
    await this.lock.release();
    this.isLeader = false;
    this.emit('lost-leadership');
  }
}
```

### 4.4 Session Distribution

**Problem:** With multiple instances, how does a message from a user land on the instance that holds their session?

**Solutions:**

| Strategy | How | Trade-off |
|---|---|---|
| **Sticky sessions** | Load balancer hashes `userId` → same instance | Simple, but breaks on instance failure |
| **Shared Redis sessions** | All instances read/write Redis for sessions | Simple, but adds latency per request |
| **Consistent hashing** | Hash ring maps `userId` → instance | Good balance, handles instance changes gracefully |
| **Broadcast + claim** | All instances receive message, one claims it | Most resilient, but more network traffic |

**Recommended:** Start with **shared Redis sessions** (simplest, works immediately). Add **consistent hashing** as an optimization for high-traffic deployments.

### 4.5 Rate Limiting at Scale

**Distributed rate limiting architecture:**

```
Request → Gateway Instance
  ↓
Local LRU check (fast path — already seen this key recently?)
  ↓ MISS
Redis check (authoritative)
  ↓
Token bucket decrement
  ↓
Allow / Reject
  ↓
Local LRU update (fast path for next request)
```

**Rate limit tiers:**

| Tier | Scope | Default | Configurable |
|---|---|---|---|
| Global | All requests across all instances | 1000 req/min | ✅ |
| Per-channel | Requests per channel type | 500 req/min | ✅ |
| Per-user | Requests per userId | 60 req/min | ✅ |
| Per-provider | API calls to each AI provider | 30 req/min | ✅ |
| Per-tool | Tool executions per session | 20/min | ✅ |

### 4.6 Config Distribution

**Problem:** In a multi-instance setup, who owns the config file?

**Solution:**

1. **Leader writes** — Only the leader instance can write to `agent-gateway.config.json`
2. **Follower reads** — All instances read from Redis config cache
3. **Watch + reload** — Leader detects config change → publishes to Redis Pub/Sub → all followers reload
4. **Conflict detection** — Config writes include a hash of the previous version; reject if mismatched

```
Config change via API → Leader instance
  ↓
Validate + hash check
  ↓
Write to file + Redis
  ↓
Publish 'config:changed' to Redis Pub/Sub
  ↓
All instances receive event → reload config
```

### 4.7 Health & Readiness at Scale

**New endpoints:**

| Endpoint | Description |
|---|---|
| `GET /healthz` | Liveness: is this instance alive? |
| `GET /readyz` | Readiness: is this instance connected to Redis, providers, channels? |
| `GET /healthz/cluster` | Cluster health: how many instances, who's leader, any degraded? |
| `GET /healthz/leader` | Is this instance the leader? |
| `GET /readyz/channels` | Are all configured channels connected? |
| `GET /readyz/providers` | Can all configured providers be reached? |

**Load balancer integration:**
- `/healthz` for liveness probe (remove from pool if dead)
- `/readyz` for readiness probe (don't send traffic until ready)

### 4.8 Observability at Scale

**New Prometheus metrics:**

| Metric | Type | Labels |
|---|---|---|
| `agw_cluster_instances` | Gauge | — |
| `agw_cluster_is_leader` | Gauge | `instance_id` |
| `agw_instance_uptime_seconds` | Gauge | `instance_id`, `instance_label` |
| `agw_distributed_lock_acquisitions_total` | Counter | `resource`, `result` |
| `agw_redis_command_duration_seconds` | Histogram | `command` |
| `agw_redis_errors_total` | Counter | `command` |
| `agw_pubsub_messages_total` | Counter | `topic`, `direction` |
| `agw_session_shard` | Gauge | `instance_id` |

**Distributed tracing enhancements:**
- Add `instance_id` to all spans
- Propagate trace context via Redis Pub/Sub messages
- Support OpenTelemetry OTLP export (in addition to in-memory tracer)
- Add span links for cross-instance message flows

### 4.9 Graceful Scaling

**Scale-up:**
1. New instance starts
2. Connects to Redis, registers itself in instance registry
3. Loads config from Redis cache
4. Connects channels and providers
5. Marks itself as ready (`/readyz` returns 200)
6. Load balancer starts sending traffic

**Scale-down:**
1. Instance receives SIGTERM
2. Stops accepting new connections
3. Finishes in-flight requests (grace period: 30s)
4. Unregisters from instance registry
5. Releases leader lock if holding it
6. Disconnects channels and providers
7. Exits

---

## 5 · Phase 3: Agent Platform (v2.0)

> **Goal:** Transform the simple agent loop into a full-featured agent platform with skills, memory, multi-agent orchestration, and advanced capabilities.

### 5.1 Skills System

Inspired by OpenClaw's approach: lightweight, markdown-based skill files that agents can discover and use.

**Structure:**
```
skills/
├── github/
│   └── SKILL.md        # YAML frontmatter + instructions
├── docker/
│   └── SKILL.md
├── database/
│   └── SKILL.md
└── web-automation/
    └── SKILL.md
```

**SKILL.md format:**
```yaml
---
name: github
description: "GitHub operations via gh CLI. Use when the user asks about repos, PRs, issues, or actions on GitHub."
metadata:
  openclaw:
    emoji: "🐙"
    requires: { bins: ["gh"] }
    install:
      - id: brew
        kind: brew
        formula: gh
        bins: [gh]
        label: "Install GitHub CLI (brew)"
    user-invocable: true
---
```

**How it works:**
1. Skills are discovered from `skills/` directories (bundled, workspace, managed)
2. Skills are formatted into the system prompt as `<available_skills>` XML blocks
3. Agent reads the full SKILL.md when it needs to use a skill (via the `read` tool)
4. Skills have no code execution — they're instructions for the LLM

**Built-in skills to ship:**

| Skill | Description | Requirements |
|---|---|---|
| `github` | GitHub operations via `gh` CLI | `gh` binary |
| `docker` | Docker container management | `docker` binary |
| `database` | SQL operations (PostgreSQL, SQLite, MySQL) | Database client |
| `git` | Git operations beyond basic bash | `git` binary |
| `web-automation` | Browser automation via Playwright | Playwright installed |
| `email` | Email reading and sending via IMAP/SMTP | Credentials configured |
| `calendar` | Calendar management via CalDAV | Calendar credentials |
| `file-management` | Advanced file operations (search, diff, patch) | Standard Unix tools |
| `code-review` | Code review patterns and best practices | None |
| `system-admin` | Linux system administration | Standard Unix tools |

### 5.2 Memory System

**Three-tier memory:**

| Tier | Purpose | Backend |
|---|---|---|
| **Short-term** | Current conversation context | Session messages (existing) |
| **Working** | Cross-session facts, user preferences | Redis/PostgreSQL with TTL |
| **Long-term** | Persistent knowledge, embeddings | Vector database (pgvector, LanceDB) |

**Working memory API:**
```typescript
interface WorkingMemory {
  set(key: string, value: any, ttl?: number): Promise<void>;
  get(key: string): Promise<any | null>;
  delete(key: string): Promise<void>;
  search(query: string, limit?: number): Promise<MemoryEntry[]>;
  list(namespace?: string): Promise<string[]>;
}
```

**Long-term memory (embeddings):**
```typescript
interface LongTermMemory {
  store(text: string, metadata: Record<string, any>): Promise<string>;
  search(query: string, limit?: number, threshold?: number): Promise<MemoryResult[]>;
  delete(id: string): Promise<void>;
  list(limit?: number): Promise<MemoryEntry[]>;
}
```

**Memory in system prompt:**
```xml
<user_memory>
  <preferences>
    <preference key="language">prefers TypeScript over JavaScript</preference>
    <preference key="timezone">America/New_York</preference>
  </preferences>
  <facts>
    <fact>user is working on a React project with Vite</fact>
    <fact>user deployed to Fly.io last week</fact>
  </facts>
</user_memory>
```

### 5.3 Multi-Agent Orchestration

**Problem:** A single agent loop can't handle complex, multi-step tasks that require different capabilities.

**Solution:** Hierarchical agent orchestration.

```
┌─────────────────────────────────────────────┐
│              Orchestrator Agent              │
│  (Routes tasks to specialized agents)        │
└──────────┬──────────────┬───────────────────┘
           │              │
    ┌──────▼──────┐ ┌─────▼──────┐
    │ Code Agent  │ │ Research   │
    │             │ │ Agent      │
    │ - Bash tool │ │ - Web      │
    │ - FS tool   │ │   Search   │
    │ - Git tool  │ │ - Fetch    │
    └─────────────┘ │ - Summarize│
                    └────────────┘
```

**Agent types:**

| Agent | Tools | Use Case |
|---|---|---|
| **General** | All tools | Default chat, simple tasks |
| **Code** | Bash, FS, Git | Programming, debugging |
| **Research** | WebSearch, Fetch | Information gathering |
| **Creative** | Image/Video/Music gen | Content creation |
| **Admin** | Bash, System tools | Server management |

**Routing rules:**
```jsonc
{
  "agentRouting": {
    "rules": [
      {
        "if": { "messageContains": ["code", "bug", "error", "function", "test"] },
        "routeTo": "code-agent"
      },
      {
        "if": { "messageContains": ["search", "find", "research", "who is", "what is"] },
        "routeTo": "research-agent"
      },
      {
        "if": { "messageContains": ["image", "generate", "create", "design"] },
        "routeTo": "creative-agent"
      }
    ],
    "default": "general-agent"
  }
}
```

### 5.4 Tool Ecosystem Expansion

**New built-in tools:**

| Tool | Description | Safety Level |
|---|---|---|
| `git` | Clone, commit, push, branch, diff, merge | Allowlist repos |
| `http_client` | Make HTTP requests (replaces web_search fetch) | URL allowlist |
| `database` | Run SQL queries against configured databases | Read-only by default |
| `email` | Send/receive email via IMAP/SMTP | Confirm before send |
| `calendar` | Read/create calendar events | Confirm before create |
| `image_generator` | Generate images via DALL-E, Fal, ComfyUI | Always allowed |
| `pdf_reader` | Extract text from PDF files | Read-only |
| `code_interpreter` | Run Python/JS code in sandbox | Sandboxed |
| `browser` | Playwright-controlled browser automation | URL allowlist |
| `cron_manager` | Create/manage scheduled jobs | Confirm before create |
| `notification` | Send notifications (email, webhook, push) | Confirm before send |
| `file_search` | Semantic search across file system | Read-only |

### 5.5 Advanced Prompt Engineering

**System prompt builder:**
```typescript
interface SystemPromptBuilder {
  // Base sections (always included)
  addIdentity(): this;              // "You are a helpful AI assistant..."
  addRuntimeInfo(): this;           // OS, arch, Node version, working directory
  addTimeContext(): this;           // Current time, user timezone
  addAvailableTools(): this;        // Tool names and descriptions
  addAvailableSkills(): this;       // Skills list with descriptions

  // Conditional sections
  addMemorySection(): this;         // User preferences, facts, history
  addSandboxInfo(): this;           // If running in sandbox
  addChannelGuidance(): this;       // Channel-specific formatting rules
  addOwnerInfo(): this;             // User identity (if configured)
  addReactionGuidance(): this;      // How to use emoji/reactions on channel
  addExtraPrompt(): this;           // User-defined extra system prompt

  // Override
  overrideWith(custom: string): this; // Replace entire prompt

  build(): string;
}
```

**Thinking levels:**
```jsonc
{
  "thinking": {
    "levels": {
      "off": "No extended thinking",
      "low": "Brief reasoning, concise responses",
      "medium": "Moderate reasoning for complex tasks (default)",
      "high": "Deep reasoning for difficult problems",
      "xhigh": "Maximum reasoning depth for expert-level tasks"
    },
    "default": "medium"
  }
}
```

**Inline directives in messages:**
- `think:high` — Override thinking level for this message
- `verbose:on` — Show detailed reasoning
- `exec:ask` — Require approval before executing commands
- `model:gpt-4o` — Override model for this message

### 5.6 Browser Automation

**Playwright integration:**
```typescript
interface BrowserTool {
  // Navigate
  goto(url: string): Promise<PageSnapshot>;
  // Interact
  click(selector: string): Promise<void>;
  fill(selector: string, text: string): Promise<void>;
  // Extract
  screenshot(): Promise<string>;  // Base64
  extractText(): Promise<string>;
  // Execute
  evaluate(script: string): Promise<any>;
}
```

**Safety:**
- URL allowlist (default: none, must be explicitly configured)
- Screenshot blur for sensitive data
- Session-scoped browser contexts (no cross-session data leakage)
- Auto-close browser after inactivity timeout

---

## 6 · Phase 4: Enterprise & Ecosystem (v2.1–v2.5)

> **Goal:** Make Agent Gateway a viable enterprise platform with multi-tenancy, billing, compliance, and a rich extension ecosystem.

### 6.1 True Multi-Tenancy

**Tenant model:**

```
┌─────────────────────────────────────────┐
│             Gateway Instance             │
│                                          │
│  ┌───────────┐ ┌───────────┐ ┌───────┐  │
│  │ Tenant A  │ │ Tenant B  │ │Tenant C│  │
│  │           │ │           │ │       │  │
│  │ Channels  │ │ Channels  │ │Chans  │  │
│ │ Providers │ │ Providers │ │Provs  │  │
│  │ Sessions  │ │ Sessions  │ │Sessions│  │
│  │ Tools     │ │ Tools     │ │ Tools  │  │
│  │ Quotas    │ │ Quotas    │ │ Quotas │  │
│  └───────────┘ └───────────┘ └───────┘  │
└─────────────────────────────────────────┘
```

**Tenant isolation:**
- Separate session namespaces (`tenant:{id}:session:{key}`)
- Separate rate limit buckets
- Separate provider/channel allowlists
- Separate tool access
- Separate usage tracking

**Tenant API:**
```
POST   /api/tenants              — Create tenant
GET    /api/tenants              — List tenants
GET    /api/tenants/:id          — Get tenant details
PATCH  /api/tenants/:id          — Update tenant
DELETE /api/tenants/:id          — Delete tenant
POST   /api/tenants/:id/api-keys — Create API key
GET    /api/tenants/:id/usage    — Usage statistics
PATCH  /api/tenants/:id/quota    — Adjust quota
```

**Quotas:**
```jsonc
{
  "quotas": {
    "maxSessions": 1000,
    "maxMessagesPerDay": 10000,
    "maxTokensPerDay": 5000000,
    "maxApiCallsPerDay": 5000,
    "maxToolsPerSession": 50,
    "maxSessionDuration": 3600,
    "allowedProviders": ["openai", "anthropic"],
    "allowedChannels": ["telegram", "slack"],
    "allowedTools": ["bash", "filesystem"],
    "sandboxRequired": true
  }
}
```

### 6.2 Billing & Usage Tracking

**Usage tracking per tenant:**
```typescript
interface UsageRecord {
  tenantId: string;
  date: string;           // YYYY-MM-DD
  messagesIn: number;
  messagesOut: number;
  tokensPrompt: number;
  tokensCompletion: number;
  apiCalls: number;
  toolExecutions: number;
  sessionCount: number;
  costUsd: number;        // Calculated from token usage + provider pricing
}
```

**Provider pricing integration:**
```jsonc
{
  "pricing": {
    "openai": {
      "gpt-4o": { "input": 0.0025, "output": 0.01, "unit": "per_1k_tokens" },
      "gpt-4o-mini": { "input": 0.00015, "output": 0.0006, "unit": "per_1k_tokens" }
    },
    "anthropic": {
      "claude-sonnet-4-20250514": { "input": 0.003, "output": 0.015, "unit": "per_1k_tokens" }
    }
  }
}
```

**Billing exports:**
- CSV export of usage records
- Webhook notifications for quota thresholds
- Integration with Stripe for metered billing (optional)

### 6.3 Plugin Marketplace

**Plugin registry:**
```
┌─────────────────────────────────────────────┐
│           Plugin Registry (Cloud)            │
│                                              │
│  Search → Install → Configure → Activate     │
│                                              │
│  Categories:                                 │
│  ├── Model Providers (xAI, Qwen, Groq...)    │
│  ├── Channels (WeChat, LINE, IRC...)         │
│  ├── Tools (Database, Email, Calendar...)    │
│  ├── Skills (GitHub, Docker, AWS...)         │
│  └── Services (Monitoring, Backup, Auth...)  │
└─────────────────────────────────────────────┘
```

**Plugin manifest v2:**
```jsonc
{
  "id": "openclaw-xai-provider",
  "name": "xAI Provider",
  "version": "1.0.0",
  "description": "Connect to xAI's Grok models",
  "author": "community",
  "homepage": "https://github.com/...",
  "license": "MIT",
  "type": "provider",
  "minHostVersion": ">=2.0.0",
  "auth": {
    "envVars": ["XAI_API_KEY"],
    "choices": [{ "id": "api_key", "label": "API Key" }]
  },
  "providers": [{ "id": "xai", "models": ["grok-2", "grok-2-vision"] }],
  "configSchema": { ... },
  "dependencies": { "openai": ">=4.0.0" },
  "tags": ["ai", "provider", "xai", "grok"]
}
```

**Plugin lifecycle:**
1. `discover()` — Scan for available plugins
2. `install()` — Download and install (npm/package)
3. `validate()` — Check manifest, dependencies, security
4. `configure()` — Set up API keys, settings
5. `activate()` — Load into runtime, register capabilities
6. `deactivate()` — Unregister, cleanup
7. `update()` — Check for and install updates

### 6.4 Webhook System

**Outbound webhooks:**
```jsonc
{
  "webhooks": {
    "subscriptions": [
      {
        "id": "wh_001",
        "url": "https://myapp.com/webhooks/agent-gateway",
        "events": ["message:inbound", "message:outbound", "session:created"],
        "secret": "whsec_...",
        "retry": { "maxAttempts": 3, "backoffMs": 1000 },
        "headers": { "X-Custom-Header": "value" },
        "active": true
      }
    ]
  }
}
```

**Inbound webhook handling:**
- Signature verification (HMAC-SHA256)
- Replay protection (timestamp + nonce)
- Rate limiting per webhook endpoint
- Dead letter queue for failed deliveries

### 6.5 Compliance & Audit

**Audit log:**
```typescript
interface AuditEvent {
  id: string;
  timestamp: Date;
  type: AuditEventType;
  actor: string;        // User, API key, system
  actorType: 'user' | 'api_key' | 'system';
  tenantId?: string;
  action: string;       // "config.update", "session.delete", "tool.execute"
  resource: string;     // What was affected
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  hash: string;         // SHA-256 of previous hash + this event (chain)
}
```

**Compliance features:**
- Immutable audit log (hash-chained events)
- Data retention policies (auto-delete after N days)
- Data export (GDPR right to access)
- Data deletion (GDPR right to be forgotten)
- Access logging (who accessed what, when)
- Configuration change tracking (diff-based)

### 6.6 Advanced Security

| Feature | Description |
|---|---|
| **OAuth2/OIDC** | Login via Google, GitHub, Microsoft, etc. |
| **SCIM** | User provisioning from identity providers |
| **IP Allowlisting** | Restrict API access to specific IP ranges |
| **API key rotation** | Automatic key rotation with overlap period |
| **Secret scanning** | Detect accidentally committed secrets |
| **Command approval workflows** | Multi-level approval for dangerous operations |
| **Session encryption** | Encrypt session data at rest |
| **Network policies** | Restrict outbound connections (SSRF prevention) |
| **Container security** | Non-root user, read-only filesystem, no capabilities |

### 6.7 Dashboard & Control UI

**Replace `public/index.html` with a proper dashboard:**

| Section | Features |
|---|---|
| **Overview** | Active sessions, message throughput, error rate, token usage, cost |
| **Sessions** | List, search, inspect, reset, delete sessions |
| **Channels** | Connection status, message counts, error rates, configuration |
| **Providers** | Latency, error rates, token usage, cost, failover status |
| **Tools** | Execution counts, success rates, average duration |
| **Tenants** | Per-tenant usage, quotas, active sessions |
| **Audit** | Searchable audit log, event timeline |
| **Config** | Live config editor with validation, change history |
| **Plugins** | Installed plugins, marketplace browser, install/update |
| **Alerts** | Active alerts, alert rules, notification channels |

**Technology:** Lit-based SPA (keeps dependency footprint small), served from the gateway itself.

---

## 7 · Phase 5: Platform & Marketplace (v3.0)

> **Goal:** Transform Agent Gateway into a platform where third parties can build, publish, and monetize extensions.

### 7.1 Extension SDK v2

**Comprehensive SDK:**
```typescript
// The full plugin API
interface ExtensionSDK {
  // Registration
  registerProvider(provider: ModelProvider): void;
  registerChannel(channel: ChannelAdapter): void;
  registerTool(tool: AgentTool): void;
  registerSkill(skill: SkillDefinition): void;
  registerHook(hook: LifecycleHook): void;
  registerService(service: LongRunningService): void;
  registerCliCommand(command: CliCommand): void;
  registerHttpRoute(route: HttpRoute): void;
  registerGatewayMethod(method: string, handler: Handler): void;

  // Providers
  registerSpeechProvider(provider: SpeechProvider): void;
  registerImageGenerationProvider(provider: ImageGenProvider): void;
  registerVideoGenerationProvider(provider: VideoGenProvider): void;
  registerWebSearchProvider(provider: WebSearchProvider): void;
  registerWebFetchProvider(provider: WebFetchProvider): void;
  registerMediaUnderstandingProvider(provider: MediaUnderstandingProvider): void;

  // Memory
  registerMemoryCapability(capability: MemoryCapability): void;
  registerMemoryEmbeddingProvider(adapter: EmbeddingProvider): void;

  // Utilities
  resolvePath(input: string): string;    // Config-relative path resolution
  getSecret(name: string): Promise<string>;  // Access encrypted secrets
  getLogger(name: string): Logger;       // Structured logging
  getConfig(): Readonly<GatewayConfig>;  // Read-only config access

  // Events
  on(event: string, handler: Handler): void;
  emit(event: string, data: any): void;
}
```

### 7.2 Developer Experience

| Tool | Purpose |
|---|---|
| `agent-gateway plugin create` | Scaffold a new extension from a template |
| `agent-gateway plugin test` | Run tests against a local gateway instance |
| `agent-gateway plugin publish` | Publish to the plugin registry |
| `agent-gateway plugin validate` | Validate manifest, config schema, security |
| Extension templates | Provider, channel, tool, skill, service templates |
| Local dev server | Hot-reload extension development |
| Extension debugger | Attach debugger to extension code |

### 7.3 API Gateway Mode

**Beyond messaging — expose AI capabilities as a general-purpose API:**

```
POST /v1/chat/completions    — OpenAI-compatible endpoint
POST /v1/messages            — Anthropic-compatible endpoint
POST /v1/generateContent     — Google-compatible endpoint
```

**Why:** Let any application that already speaks OpenAI/Anthropic API use Agent Gateway as a drop-in replacement, with the benefit of:
- Automatic failover across providers
- Built-in rate limiting and caching
- Usage tracking and cost attribution
- Hook-based request/response transformation

### 7.4 Edge Deployment

**Deploy gateway instances at the edge for low-latency AI:**

| Edge Platform | Use Case |
|---|---|
| Cloudflare Workers | Low-latency API gateway mode |
| Fly.io | Regional gateway instances |
| AWS Lambda | Serverless webhook handling |
| Vercel Edge | Edge-deployed Control UI |

**Edge config:**
```jsonc
{
  "edge": {
    "mode": "worker",       // "worker" | "lambda" | "container"
    "region": "auto",       // Auto-detect from environment
    "syncInterval": 30,     // Seconds between config syncs
    "localCache": true,     // Cache responses locally
    "fallbackOrigin": "https://gateway.example.com"
  }
}
```

---

## 8 · Cross-Cutting Work Streams

These work streams span multiple phases and require ongoing investment.

### 8.1 Documentation

| Artifact | Status | Target |
|---|---|---|
| API Reference (OpenAPI) | Stub | Complete, auto-generated from code |
| Channel Setup Guides | Partial | All 27+ channels documented |
| Provider Setup Guides | Partial | All 12+ providers documented |
| Plugin Development Guide | None | Complete SDK docs with examples |
| Deployment Guides | Docker only | Docker, Kubernetes, Fly.io, Render, AWS, GCP, Azure |
| Troubleshooting Guide | None | Common issues, diagnostics, solutions |
| Migration Guides | None | v1→v2, v2→v3 guides |
| Architecture Decision Records | None | ADR log for all major decisions |

### 8.2 Performance Engineering

| Initiative | Target | Measurement |
|---|---|---|
| Startup time | < 2 seconds cold, < 500ms warm | `time agent-gateway server` |
| Message latency (p50) | < 50ms (gateway overhead, not AI time) | `/api/send` to response |
| Message throughput | 1000 msg/sec per instance | Load test with k6 |
| Memory footprint | < 200MB idle, < 500MB under load | RSS measurement |
| Session load time (Redis) | < 5ms | Latency histogram |
| Cache hit rate | > 30% for repeated prompts | `agw_cache_hits_total` |
| Cold start (serverless) | < 500ms | Lambda/Worker cold start |

### 8.3 Reliability Engineering

| Initiative | Target |
|---|---|
| Availability | 99.9% (single instance), 99.99% (cluster) |
| RPO (Recovery Point Objective) | 5 minutes (sessions), 0 (config) |
| RTO (Recovery Time Objective) | 30 seconds (instance restart), 2 minutes (cluster failover) |
| Error budget | 43 minutes/month downtime allowed at 99.9% |
| Chaos testing | Regular failure injection: provider failures, Redis disconnects, channel drops |

### 8.4 Developer Experience

| Initiative | Details |
|---|---|
| CLI completions | Bash, zsh, fish shell completions for all commands |
| Error messages | Every error message includes actionable guidance |
| Debug mode | `--debug` flag enables verbose logging, stack traces, request/response dumps |
| Config validation | `agent-gateway config validate` checks config before apply |
| Interactive mode | `agent-gateway chat` — interactive terminal chat session |
| TUI | Terminal UI for monitoring and management |
| VS Code extension | Syntax highlighting for config files, inline docs |

---

## 9 · Migration Guides

### 9.1 v1.0 → v1.1 (Foundation Hardening)

**Breaking changes:** None. All changes are backward compatible.

**New config options:**
```jsonc
{
  "failover": { /* optional, defaults to disabled */ },
  "context": { /* optional, defaults to auto-detect */ },
  "cache": { /* optional, defaults to disabled */ },
  "streaming": { /* optional, defaults to per-channel best-effort */ }
}
```

**Deprecations:**
- `agent-gateway server` → `agent-gateway start` (alias preserved)
- `AGENT_CHANNELS` env var → `agent-gateway.config.json` channels array

### 9.2 v1.x → v2.0 (Agent Platform)

**Breaking changes:**
- `BaseAgent.run()` return type changes (adds `context`, `memory`, `skills` fields)
- Session file format changes (adds `transcript` field, `metadata` expansion)
- Plugin SDK v2 replaces v1 (v1 plugins still work via compatibility shim)

**Migration steps:**
1. Run `agent-gateway doctor` to check for compatibility issues
2. Update plugins to SDK v2 (v1 shim handles most automatically)
3. Run `agent-gateway sessions migrate` to convert session format
4. Review new config options in `agent-gateway config show --all`

### 9.3 v2.x → v3.0 (Platform)

**Breaking changes:**
- Multi-tenancy becomes the default data model (single-tenant is tenant with ID `default`)
- Plugin marketplace requires manifest v2 format
- API Gateway mode changes default port from 3000 to 18789

**Migration steps:**
1. Run `agent-gateway migrate v3` (automated migration tool)
2. Review tenant configuration (existing setup becomes tenant `default`)
3. Update plugins to manifest v2 format
4. Test API Gateway mode if using OpenAI-compatible endpoints

---

## 10 · Risk Register

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| **Breaking changes in provider APIs** | High | High | Abstract provider interface, versioned adapters, rapid response team |
| **Security vulnerability in channel SDK** | Critical | Medium | Regular dependency audits, sandbox mode, minimal SDK surface |
| **Redis becomes single point of failure** | High | Low | Redis Cluster, fallback to file sessions, graceful degradation |
| **Plugin ecosystem fragmentation** | Medium | Medium | Strict SDK versioning, compatibility guarantees, deprecation policy |
| **Performance regression in agent loop** | High | Medium | Performance tests in CI, benchmarks per release, profiling tools |
| **Dependency bloat** | Medium | High | Regular `npm audit`, dependency pruning, prefer small focused packages |
| **Multi-tenant isolation breach** | Critical | Low | Automated penetration testing, defense in depth, security audits |
| **Configuration complexity** | Medium | High | Sensible defaults, onboarding wizard, `doctor` command |
| **Vendor lock-in to specific AI providers** | Medium | Low | Provider abstraction layer, failover support, OpenAI-compatible mode |
| **Team capacity** | High | High | Prioritize ruthlessly, automate testing, clear contribution guidelines |

---

## 11 · Success Metrics

### Phase 1 (v1.1–v1.2) — Foundation

| Metric | Target | How Measured |
|---|---|---|
| TypeScript strict mode | ✅ Zero `@ts-nocheck` files | `tsc --noEmit` |
| Test coverage (new code) | 80%+ | `vitest --coverage` |
| Test coverage (overall) | 60%+ | `vitest --coverage` |
| Agent error recovery rate | 90% of transient errors auto-recovered | `agw_failover_attempts_total` |
| Cache hit rate | 20%+ | `agw_cache_hits_total` |
| CLI commands | 15+ | `agent-gateway --help` |
| Channel implementations | 6 full (Signal complete) | Manual testing |
| Provider implementations | 8+ | Manual testing |

### Phase 2 (v1.3–v1.5) — Scale

| Metric | Target | How Measured |
|---|---|---|
| Multi-instance support | ✅ 3+ instances with shared state | Integration tests |
| Session distribution | < 10ms cross-instance session load | Latency histogram |
| Cluster availability | 99.9% | Uptime monitoring |
| Max throughput | 1000 msg/sec per instance | k6 load test |
| Memory per instance | < 500MB under load | RSS monitoring |
| Config propagation delay | < 1 second across cluster | Pub/Sub latency test |
| Leader election time | < 5 seconds after leader failure | Chaos test |

### Phase 3 (v2.0) — Agent Platform

| Metric | Target | How Measured |
|---|---|---|
| Built-in skills | 10+ | `agent-gateway skills list` |
| Built-in tools | 12+ | `agent-gateway tools list` |
| Memory system | 3-tier (short/working/long) | Integration test |
| Multi-agent routing | ✅ Configurable agent routing | E2E test |
| Browser automation | ✅ Playwright integration | E2E test |
| Streaming to channels | 5+ channels supported | Manual testing |
| System prompt builder | ✅ Modular, overridable | Unit test |

### Phase 4 (v2.1–v2.5) — Enterprise

| Metric | Target | How Measured |
|---|---|---|
| Multi-tenant support | ✅ Full isolation | Integration test |
| Usage tracking | ✅ Per-tenant, per-provider | Dashboard metrics |
| Billing integration | Stripe optional | Manual test |
| Plugin marketplace | 20+ published plugins | Registry count |
| Compliance features | Audit log, data export, retention | Audit test |
| Dashboard | Full-featured web UI | Manual review |
| OAuth2/OIDC | ✅ 3+ providers supported | Integration test |

### Phase 5 (v3.0) — Platform

| Metric | Target | How Measured |
|---|---|---|
| Extension SDK v2 | ✅ Complete API surface | SDK docs |
| Developer tooling | CLI commands, templates, debugger | Manual review |
| API Gateway mode | ✅ OpenAI/Anthropic compatible endpoints | API test suite |
| Edge deployment | ✅ 2+ platforms supported | Deployment test |
| Total channel adapters | 20+ | Channel registry |
| Total provider adapters | 15+ | Provider registry |
| Community plugins | 50+ | Registry count |
| GitHub stars | 5,000+ | GitHub API |
| Monthly active installs | 1,000+ | Anonymous telemetry (opt-in) |

---

## Appendix A: Versioning Strategy

**CalVer + SemVer hybrid:**

| Version | Meaning |
|---|---|
| `1.0.0` | Initial release (current) |
| `1.1.0` | Foundation hardening — new features, no breaking changes |
| `1.2.0` | More hardening — streaming improvements |
| `1.3.0` | Multi-instance support begins |
| `1.5.0` | Full cluster support |
| `2.0.0` | Agent platform — breaking changes in agent API |
| `2.1.0` | Enterprise features |
| `2.5.0` | Full enterprise suite |
| `3.0.0` | Platform & marketplace |

**Deprecation policy:**
- Minor versions: no breaking changes
- Major versions: breaking changes allowed with migration guide
- Deprecated features: supported for 2 major versions after deprecation
- Security fixes: backported to all supported major versions

---

## Appendix B: Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Node.js 20+ | Ecosystem, performance, team familiarity |
| Language | TypeScript | Type safety, readability, ecosystem |
| Bundler | tsdown (rolldown) | Fast, ESM-first, small output |
| Test framework | Vitest | Fast, TypeScript-native, compatible with Vite |
| HTTP framework | Express 5 | Ecosystem maturity, middleware support |
| WebSocket | `ws` | Lightweight, performant, well-maintained |
| Metrics | Prometheus (`prom-client`) | Industry standard, Grafana integration |
| Config validation | Zod | TypeScript-first, great error messages |
| Logging | Pino | Structured, performant, ecosystem |
| Cache (memory) | `lru-cache` | Fast, simple, well-tested |
| Cache (distributed) | Redis + `ioredis` | Industry standard, clustering support |
| Rate limiting | `rate-limiter-flexible` | Distributed, multiple algorithms |
| Database (optional) | libsql/SQLite (embedded), PostgreSQL (cluster) | Embedded for single-instance, scalable for cluster |
| Plugin loading | Dynamic `import()` | Native ESM, no transpiler needed at runtime |

---

## Appendix C: Comparison with OpenClaw (What We Learn, What We Don't Copy)

### What We Learn From OpenClaw

| OpenClaw Feature | What We Adopt |
|---|---|---|
| 27+ channels | Gradually expand channel coverage, prioritizing demand |
| Extension system with manifests | Plugin discovery, manifest validation, config schemas |
| Skills as markdown | Lightweight skill system without code execution |
| Auth profile rotation | Model fallback with credential rotation |
| Context overflow handling | Compaction, truncation, intelligent message dropping |
| Lane-based concurrency | Session + global queues for parallelism |
| Exec approvals | Approval gates for dangerous tool executions |
| DM pairing | Default-reject for unknown senders |
| Onboarding wizard | `agent-gateway onboard` guided setup |
| Doctor command | `agent-gateway doctor` health diagnostics |
| Companion apps | Eventually, but not in Phase 1-2 |

### What We Don't Copy

| OpenClaw Approach | Our Decision | Why |
|---|---|---|
| Single-user trusted-operator | Multi-tenant from v2.0 | Enterprise market requires isolation |
| External agent runtime dependency | Build our own | Control, no vendor lock-in, customizable |
| Massive monorepo (5,000+ files) | Keep core lean, extensions separate | Easier to audit, understand, contribute |
| 50+ enterprise module stubs | Ship what works, stub what's planned | Avoid false advertising |
| jiti for TypeScript-on-the-fly | Dynamic `import()` of compiled code | Simpler, no transpiler at runtime |
| Complex respawn planning | Simple restart | Most deployments don't need respawn |

---

*This document is a living plan. It should be updated quarterly or whenever a major architectural decision changes the trajectory. Last updated: April 2026.*
