# Commands (`src/commands/`)

> **CLI command implementations — the actual work behind each CLI subcommand.**

---

## Overview

The `commands/` module contains the implementations for all CLI subcommands. Each command is a self-contained module that interacts with the Agent Gateway system through its public APIs. Commands are registered with the CLI parser in `src/cli/` and dispatched based on the first positional argument.

There are **7 commands** covering the full operational surface of the gateway: initialization, server startup, configuration management, channel management, provider management, plugin management, and version display.

---

## File Structure

```
commands/
├── index.ts       # Barrel re-export of all commands
├── server.ts      # serverCommand — start the gateway
├── config.ts      # configCommand — get/set/list configuration
├── channels.ts    # channelsCommand — list/add/remove channels
├── providers.ts   # providersCommand — list/add/remove providers
├── plugins.ts     # pluginsCommand — list/install/uninstall plugins
├── init.ts        # initCommand — scaffold project files
└── version.ts     # versionCommand — display version information
```

---

## Commands

### `init` — Project Initialization

**File**: `init.ts`

Scaffolds a new Agent Gateway project by creating configuration files in the current directory.

#### What It Creates

| File | Description |
|------|-------------|
| `agent-gateway.config.json` | Default configuration file with all options commented |
| `.env.example` | Environment variable template with placeholders for API keys |

#### Behavior

- Checks if files already exist to avoid overwriting
- If a file exists, prompts for confirmation before overwriting
- Prints next-step instructions after successful initialization

#### Usage

```bash
agent-gateway init
```

#### Output

```
✓ Created agent-gateway.config.json
✓ Created .env.example

Next steps:
  1. Edit .env and add your API keys
  2. Run: agent-gateway server
```

---

### `server` — Start the Gateway

**File**: `server.ts`

The most important command — it starts the entire Agent Gateway system.

#### What It Does

1. **Loads configuration** from config file and environment variables
2. **Creates the Gateway** instance with the loaded config
3. **Builds channels** from configuration (Telegram, Discord, Slack, etc.)
4. **Builds providers** from configuration (OpenAI, Anthropic, etc.)
5. **Creates the SessionManager** with the configured backend
6. **Sets up lifecycle hooks** from configuration
7. **Registers channels and providers** with the Gateway
8. **Creates the ToolRegistry** with built-in tools
9. **Creates the BaseAgent** with provider, tools, and system prompt
10. **Loads plugins** from configuration
11. **Creates the AutoReply** handler
12. **Starts the HTTP server** (Express + WebSocket)
13. **Registers graceful shutdown** handlers (SIGINT, SIGTERM)

#### Options

| Option | Env Variable | Default | Description |
|--------|-------------|---------|-------------|
| `--host` | `HOST` | `0.0.0.0` | Server bind address |
| `--port` | `PORT` | `3000` | Server port |
| `--config` | — | — | Path to config file |
| `--log-level` | `LOG_LEVEL` | `info` | Logging verbosity |

#### Graceful Shutdown

The server command registers handlers for `SIGINT` (Ctrl+C) and `SIGTERM` (kill) that:
1. Stop accepting new connections
2. Flush pending session data to storage
3. Stop all channel polling/webhooks
4. Shut down the HTTP server
5. Exit with code 0

#### Usage

```bash
agent-gateway server
agent-gateway server --port 8080 --log-level debug
agent-gateway server --config ./my-config.json
```

---

### `config` — Configuration Management

**File**: `config.ts`

Get, set, and list configuration values with support for nested keys and sensitive value masking.

#### Subcommands

| Subcommand | Description |
|------------|-------------|
| `config list` | Display all configuration values |
| `config get <key>` | Get a specific configuration value |
| `config set <key> <value>` | Set a configuration value |

#### Sensitive Value Masking

Values for keys containing `key`, `token`, `secret`, `password`, or `api` are automatically masked:

```bash
agent-gateway config list
# Output:
#   providers.openai.apiKey: "sk-****...****"
#   channels.telegram.token: "****...****"
```

#### Deep Key Access

Configuration values can be accessed using dot-notation for nested objects:

```bash
agent-gateway config get providers.openai.model
# Output: "gpt-4o"

agent-gateway config set agent.maxSteps 20
```

#### Usage

```bash
agent-gateway config list
agent-gateway config get host
agent-gateway config set logLevel debug
```

---

### `channels` — Channel Management

**File**: `channels.ts`

List, add, and remove messaging channel adapters.

#### Subcommands

| Subcommand | Description |
|------------|-------------|
| `channels list` | Display all registered channels |
| `channels add <type> [options]` | Add a new channel |
| `channels remove <id>` | Remove a channel |

#### Supported Channel Types

| Type | Required Options | Description |
|------|-----------------|-------------|
| `telegram` | `--token` | Telegram Bot API token |
| `discord` | `--token` | Discord Bot token |
| `slack` | `--token` | Slack Bot token |
| `whatsapp` | `--token`, `--phoneId` | WhatsApp Meta API token and phone ID |
| `signal` | — | Signal (stub, requires signal-cli) |
| `matrix` | `--homeserver`, `--token` | Matrix homeserver URL and access token |

#### Usage

```bash
agent-gateway channels list

agent-gateway channels add telegram --token "your-bot-token"
agent-gateway channels add discord --token "your-discord-token"
agent-gateway channels add slack --token "xoxb-your-token"

agent-gateway channels remove telegram
```

#### Validation

The `add` command validates:
- Required options are present
- Token format looks correct (basic pattern matching)
- Channel ID is not already in use

---

### `providers` — Provider Management

**File**: `providers.ts`

List, add, and remove AI provider adapters.

#### Subcommands

| Subcommand | Description |
|------------|-------------|
| `providers list` | Display all registered providers |
| `providers add <type> [options]` | Add a new provider |
| `providers remove <id>` | Remove a provider |

#### Supported Provider Types

| Type | Required Options | API Type |
|------|-----------------|----------|
| `openai` | `--apiKey` | Chat Completions |
| `anthropic` | `--apiKey` | Messages API |
| `google` | `--apiKey` | Gemini generateContent |
| `mistral` | `--apiKey` | OpenAI-compatible |
| `deepseek` | `--apiKey` | OpenAI-compatible |
| `ollama` | `--baseUrl` | Local `/api/chat` |

#### Optional Parameters

| Option | Description |
|--------|-------------|
| `--model` | Model identifier (default varies by provider) |
| `--baseUrl` | Custom API base URL (for self-hosted/proxy setups) |
| `--temperature` | Default sampling temperature |
| `--maxTokens` | Maximum tokens in response |

#### Usage

```bash
agent-gateway providers list

agent-gateway providers add openai --apiKey "sk-..." --model "gpt-4o"
agent-gateway providers add anthropic --apiKey "sk-ant-..." --model "claude-sonnet-4-20250514"
agent-gateway providers add ollama --baseUrl "http://localhost:11434" --model "llama3"

agent-gateway providers remove openai
```

---

### `plugins` — Plugin Management

**File**: `plugins.ts`

List, install, and uninstall npm plugin packages.

#### Subcommands

| Subcommand | Description |
|------------|-------------|
| `plugins list` | Display installed plugins |
| `plugins install <package>` | Install a plugin from npm |
| `plugins uninstall <package>` | Remove an installed plugin |

#### How It Works

- **Install**: Runs `npm install <package>` in the gateway's directory, then loads and validates the plugin manifest
- **Uninstall**: Runs `npm uninstall <package>` and removes plugin registrations
- **List**: Reads the plugin registry and displays all active plugins with their manifests

#### Plugin Naming Convention

Plugins should follow the naming convention `agent-gateway-plugin-<name>` for discoverability:

```bash
agent-gateway plugins install agent-gateway-plugin-mycustomtool
agent-gateway plugins install agent-gateway-plugin-slack-advanced
```

#### Usage

```bash
agent-gateway plugins list

agent-gateway plugins install agent-gateway-plugin-custom-tools
agent-gateway plugins uninstall agent-gateway-plugin-custom-tools
```

---

### `version` — Version Display

**File**: `version.ts`

Displays version information for the gateway and its runtime environment.

#### Output

```
Agent Gateway v1.0.0
Node.js v22.11.0
Platform: linux x64
```

#### Information Displayed

| Field | Source | Description |
|-------|--------|-------------|
| Version | `package.json` | Gateway package version |
| Node.js | `process.version` | Node.js runtime version |
| Platform | `process.platform` | OS platform (linux, darwin, win32) |
| Architecture | `process.arch` | CPU architecture (x64, arm64) |

#### Usage

```bash
agent-gateway version
```

---

## Command Interface

All commands implement a consistent interface:

```typescript
interface Command {
  name: string;        // Command name for dispatch
  description: string; // Human-readable description
  usage: string;       // Usage string for help text
  handler: CommandHandler; // The actual implementation
}

type CommandHandler = (args: string[], options: CliOptions) => Promise<void>;
```

### Argument Parsing

Commands receive raw `args: string[]` and parse them themselves using simple positional parsing:
- First arg: subcommand name (`list`, `add`, `get`, `set`, etc.)
- Remaining args: subcommand-specific parameters
- Flags: `--flag=value` or `--flag value` format

### Output

Commands write to `stdout` for normal output and `stderr` for errors. They use the infrastructure logger for debug/trace level messages.

### Exit Codes

| Code | Meaning |
|------|--------|
| `0` | Success |
| `1` | General error (invalid args, missing config, etc.) |
| `2` | Operation failed (network error, file exists, etc.) |

---

## Error Handling

Commands wrap their execution in try-catch blocks and:
1. Print user-friendly error messages to stderr
2. Log full error details via the infrastructure logger
3. Exit with appropriate error code

Common errors:
- Missing required arguments
- Invalid configuration
- Network failures (plugin install)
- File conflicts (init with existing files)

---

## Related Documentation

- [`cli/`](../cli/README.md) — CLI entry point that dispatches to these commands
- [`config/`](../config/README.md) — Configuration management used by config/commands/channels/providers commands
- [`server/`](../server/README.md) — Server startup used by the server command
- [`plugins/`](../plugins/README.md) — Plugin loading used by the plugins command
- [`channels/`](../channels/README.md) — Channel registration used by the channels command
- [`providers/`](../providers/README.md) — Provider registration used by the providers command
