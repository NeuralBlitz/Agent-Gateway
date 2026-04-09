# CLI (`src/cli/`)

> **Command-line interface entry point — argument parsing and command dispatch.**

---

## Overview

The `cli/` module is the entry point for the `agent-gateway` CLI binary. It parses command-line arguments from `process.argv`, dispatches to the appropriate command handler, and provides help text and usage information.

This module is intentionally thin — it delegates all actual work to the command implementations in `src/commands/`.

---

## File Structure

```
cli/
└── index.ts    # CLI parser, dispatcher, and help text
```

---

## Architecture

### Core Interfaces

#### `Command`
```typescript
interface Command {
  name: string;
  description: string;
  usage: string;
  handler: CommandHandler;
}
```

Represents a single CLI command with its metadata and handler function.

#### `CommandHandler`
```typescript
type CommandHandler = (args: string[], options: CliOptions) => Promise<void>;
```

A function that receives parsed arguments and options, and performs the command's action.

#### `CliOptions`
```typescript
interface CliOptions {
  config?: string;    // Path to config file
  verbose?: boolean;  // Enable verbose logging
  // ... other global options
}
```

Global options that apply across all commands.

### Parsing and Dispatch

The CLI parser:
1. Extracts the command name from `argv[2]`
2. Looks up the command in the registry
3. Passes remaining arguments (`argv[3:]`) to the handler
4. If no command matches, prints help text

### Help System

When invoked without arguments or with `help`, the CLI prints a formatted help message listing all available commands with their descriptions and usage strings.

---

## Registered Commands

| Command | Source File | Description |
|---------|-------------|-------------|
| `init` | `commands/init.ts` | Initialize a new project |
| `server` | `commands/server.ts` | Start the gateway server |
| `config` | `commands/config.ts` | Manage configuration values |
| `channels` | `commands/channels.ts` | Manage messaging channels |
| `providers` | `commands/providers.ts` | Manage AI providers |
| `plugins` | `commands/plugins.ts` | Manage plugins |
| `version` | `commands/version.ts` | Show version information |

---

## Usage

```bash
# Default command (starts server)
agent-gateway

# Explicit server command
agent-gateway server

# With global options
agent-gateway --config ./my-config.json server

# Help
agent-gateway help
agent-gateway --help
```

---

## Extending the CLI

To add a new command:

1. Create a command handler in `src/commands/mycommand.ts`:
```typescript
export const myCommand: CommandHandler = async (args, options) => {
  // Implementation
};
```

2. Register it in `src/cli/index.ts`:
```typescript
import { myCommand } from '../commands/mycommand';

const commands = {
  // ... existing commands
  mycommand: {
    name: 'mycommand',
    description: 'Does something useful',
    usage: 'agent-gateway mycommand [options]',
    handler: myCommand,
  },
};
```

---

## Error Handling

The CLI wraps command execution in a try-catch block. Unhandled errors are caught and printed with a stack trace before exiting with a non-zero status code. Known error types (from `src/infra/`) produce formatted error messages.

---

## Related Documentation

- [`commands/`](../commands/README.md) — Command implementations
- [`config/`](../config/README.md) — Configuration management
- [`server/`](../server/README.md) — Server startup
