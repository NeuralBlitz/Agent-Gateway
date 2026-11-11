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


## Gateway launcher security and deployment review

The launcher no longer reads gateway credentials from local configuration or writes them to Control UI HTML. The browser must authenticate using the OpenClaw-supported `openclaw dashboard` flow, rather than a static secret baked into files served over HTTP.

Startup now refuses to run unless an OpenClaw configuration file exists or a gateway secret is explicitly supplied through the runtime environment. The previous `--allow-unconfigured` startup option was removed. OpenClaw remains responsible for validating credential correctness; this shell check is not a replacement for authentication.

The launcher retains the historical Replit `lan` bind setting for compatibility. Set `OPENCLAW_BIND=loopback` when a secure local tunnel or proxy architecture permits it; do not expose the LAN-bound admin Control UI without verified token/password authentication, trusted HTTPS ingress and origin restrictions. Set `OPENCLAW_NODE_BIN` and `OPENCLAW_DIR` only when the runtime layout differs.

The pull-request CI runs shell-syntax, refusal-to-start-without-configuration, and static HTML non-modification tests. It does not execute the actual Replit/OpenClaw deployment. A production rollout requires runtime authentication tests, ingress review, secret rotation if previously exposed, and deployment owner verification. See [Gateway security follow-up issue #10](https://github.com/NeuralBlitz/Agent-Gateway/issues/10).
