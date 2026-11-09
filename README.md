# OpenClaw on Replit

Personal AI assistant running on Replit with the gateway on port 3000.

## Access the Control UI

Start the gateway and use the dashboard command to obtain the authenticated Control UI URL:

```bash
bash start-openclaw.sh
openclaw dashboard
```

**Security:** Never commit gateway authentication tokens, authenticated dashboard URLs, API keys, or other credentials to this repository, documentation, screenshots, or issue reports. Obtain the current authenticated URL from the running CLI or deployment's secret-management interface. If a credential has ever been committed or exposed, revoke/rotate it in the running deployment and review repository history; deleting it from the latest README does not invalidate it or remove it from Git history.

## Quick Start

### 1. Start the Gateway

```bash
bash start-openclaw.sh
```

### 2. Open the Webview

Open the Replit webview for port 3000, then run:

```bash
openclaw dashboard
```

Use the authenticated URL produced by the CLI. Do not paste its token into source files or shared documentation.

### 3. Configure a Model Provider

The gateway requires credentials for the selected model provider. Supply API keys through the deployment's secret manager or another approved runtime secret store. Do not hardcode keys in source code or commit local environment files.

Example shell configuration (use your own secret-management mechanism):

```bash
export OPENAI_API_KEY="(set through a secure secret store)"
bash start-openclaw.sh
```

Or configure the provider in the runtime configuration file, ensuring all secrets are injected securely and the file is not committed.

## Configuration

Runtime configuration is stored at `~/.openclaw/openclaw.json`.

| Setting | Purpose |
|---|---|
| Gateway authentication token | Authenticates Control UI and WebSocket access; generate and store securely at runtime |
| Gateway port | Gateway listener port (default: 3000) |
| Gateway bind address | Network interface used by the gateway |
| Control UI origin policy | Browser-origin validation; keep the strictest compatible policy and avoid disabling protections as a convenience workaround |

Review the OpenClaw security guidance before exposing the gateway beyond a trusted local environment. Do not expose an unauthenticated gateway to public networks.

## Environment Variables

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | OpenAI model provider credential |
| `ANTHROPIC_API_KEY` | Anthropic model provider credential |
| `OPENCLAW_PORT` | Override the gateway port (default: 3000) |

## Architecture

```text
Replit Webview (port 3000)
  ├── Control UI (Lit + Vite)
  └── Gateway WebSocket + HTTP server
      ├── Model provider plugins
      ├── Browser and memory tools
      ├── Canvas
      ├── MCP endpoint
      └── Health endpoint (/health)
```

## File Layout

| Path | Purpose |
|---|---|
| `start-openclaw.sh` | Gateway launcher |
| `.replit` | Replit run configuration |
| `replit.nix` | Nix dependencies |
| `~/.openclaw/openclaw.json` | Runtime gateway configuration (keep secrets out of Git) |
| `~/.openclaw/workspace/` | Agent workspace directory |
| `openclaw-lrs-agents/` | OpenClaw source and built distribution |

## Logs

- Gateway log: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- Runtime output: stdout (visible in the Replit console)

Ensure logs do not record authentication tokens, API keys, or other secrets.

## Commands

```bash
bash start-openclaw.sh
openclaw dashboard
openclaw status
openclaw security audit
```
