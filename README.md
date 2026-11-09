# OpenClaw on Replit

Personal AI assistant running on Replit with the gateway on port 3000.

## Access the Control UI

**The URL must include your own gateway authentication token in the hash fragment. Never commit or share a real token:**

```
http://localhost:3000/#token=YOUR_GATEWAY_TOKEN
```

⚠️ **Use a freshly generated token configured in your gateway.** A missing or invalid token can prevent WebSocket authentication. Rotate any token previously committed to the repository.

## Quick Start

### 1. Start the Gateway
```bash
bash start-openclaw.sh
```

### 2. Open the Webview
Click the webview for port 3000, then **append `#token=YOUR_GATEWAY_TOKEN`** to the URL.

Or run from the terminal:
```bash
openclaw dashboard
```
This prints the correct URL with the token baked in.

### 3. Configure a Model Provider
The gateway defaults to `openai/gpt-5.4` but **needs an API key** to respond:

```bash
export OPENAI_API_KEY="sk-..."
bash start-openclaw.sh
```

Or add to `~/.openclaw/openclaw.json`:
```json
{
  "gateway": { ... },
  "agent": {
    "model": "openai/gpt-5.4"
  }
}
```

## Configuration

### Gateway Config (`~/.openclaw/openclaw.json`)
| Field | Value | Purpose |
|---|---|---|
| `gateway.auth.token` | `<redacted; configure privately>` | Auth token for WebSocket |
| `gateway.port` | `3000` | Gateway port |
| `gateway.bind` | `"lan"` | Bind to all interfaces |
| `gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback` | `true` | Allows Replit's dynamic origins |

### Environment Variables
| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | OpenAI model API key |
| `ANTHROPIC_API_KEY` | Anthropic model API key |
| `OPENCLAW_PORT` | Override port (default: 3000) |

## Architecture

```
┌────────────────────────────────────────┐
│         Replit Webview (port 3000)     │
│                                        │
│  ┌──────────────┐  ┌────────────────┐  │
│  │  Control UI  │◄─┤  Gateway WS    │  │
│  │  (Lit+Vite)  │  │  + HTTP Server │  │
│  │              │  │  port 3000     │  │
│  └──────────────┘  └───────┬────────┘  │
│                            │           │
│  Plugins loaded:           │           │
│  • openai (model provider) │           │
│  • browser (tool)          │           │
│  • memory-core             │           │
│  • memory-wiki             │           │
│  • lobster (tool)          │           │
│                            │           │
│  Canvas: /__openclaw__/canvas/         │
│  MCP:    http://127.0.0.1:*/mcp        │
│  Health: /health → {"ok":true}         │
└────────────────────────────────────────┘
```

## File Layout

| Path | Purpose |
|---|---|
| `start-openclaw.sh` | Gateway launcher (Node 22 from Nix) |
| `.replit` | Replit config — runs `start-openclaw.sh` |
| `replit.nix` | Nix deps |
| `~/.openclaw/openclaw.json` | Gateway config |
| `~/.openclaw/workspace/` | Agent workspace directory |
| `openclaw-lrs-agents/` | OpenClaw source + built dist |

## Logs

- Gateway log: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- Runtime: stdout (visible in Replit console)

## Commands

```bash
bash start-openclaw.sh          # Start the gateway
openclaw dashboard              # Print access URL with token
openclaw status                 # Check gateway status
openclaw security audit         # Run security audit
```
