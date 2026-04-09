# Tools (`src/tools/`)

> **Built-in agent tools — bash execution, filesystem operations, and web search.**

---

## Overview

The `tools/` module provides the built-in tools that agents can invoke during the tool-calling loop. These tools transform the AI from a simple text generator into an agent capable of taking real actions: executing shell commands, reading and writing files, and searching the web.

All tools are managed by the `ToolRegistry`, which provides a unified interface for tool discovery, conversion to provider-specific formats, and execution.

---

## File Structure

```
tools/
├── registry.ts    # ToolRegistry manager
├── bash.ts        # BashTool — shell command execution
├── filesystem.ts  # FileSystemTool — file operations
└── websearch.ts   # WebSearchTool — web search + URL fetching
```

---

## ToolRegistry

The `ToolRegistry` is the central manager for all tools available to agents.

### Constructor

```typescript
new ToolRegistry(config: {
  allowedDirs: string[];
  disableBash?: boolean;
  disableFs?: boolean;
  disableWebSearch?: boolean;
})
```

### Methods

#### `toProviderTools()`

Converts registered tools to the OpenAI function-calling format for provider API requests.

```typescript
const tools = registry.toProviderTools();
// [
//   {
//     type: 'function',
//     function: {
//       name: 'bash',
//       description: 'Execute a shell command',
//       parameters: { type: 'object', properties: { cmd: { type: 'string' } } }
//     }
//   },
//   ...
// ]
```

#### `execute(name: string, args: object)`

Executes a tool by name with the provided arguments.

```typescript
const result = await registry.execute('bash', { cmd: 'ls -la /tmp' });
const result = await registry.execute('read_file', { path: '/tmp/data.txt' });
const result = await registry.execute('web_search', { query: 'latest AI news' });
```

### Built-in Tools Registration

The registry automatically registers these tools at construction:

| Tool Name | Source | Description |
|-----------|--------|-------------|
| `bash` | `BashTool` | Execute shell commands |
| `read_file` | `FileSystemTool` | Read file contents |
| `write_file` | `FileSystemTool` | Write file contents |
| `list_directory` | `FileSystemTool` | List directory contents |
| `make_directory` | `FileSystemTool` | Create a directory |
| `delete_file` | `FileSystemTool` | Delete a file |
| `move_file` | `FileSystemTool` | Move/rename a file |
| `web_search` | `WebSearchTool` | Search the web |
| `fetch_url` | `WebSearchTool` | Fetch and read a URL |

---

## BashTool

### Capabilities

Execute shell commands with safety guards.

### Tool Definition

```json
{
  "name": "bash",
  "description": "Execute a shell command and return the output",
  "parameters": {
    "type": "object",
    "properties": {
      "cmd": { "type": "string", "description": "The shell command to execute" }
    },
    "required": ["cmd"]
  }
}
```

### Safety Features

#### Blocked Commands
These commands are always rejected:
- `rm -rf /` and variants
- `mkfs` (filesystem formatting)
- `dd if=/dev/zero` (disk wiping)
- `:> /etc/passwd` (file truncation)
- Any command matching known destructive patterns

#### Allowed Directories
Commands are restricted to specific directories. The working directory is set to the first allowed directory.

#### Timeout
Commands are killed after 30 seconds if they haven't completed.

#### Output Limit
Output is truncated to 64KB. If output exceeds this limit, a truncation notice is appended.

### Execution

```typescript
const tool = new BashTool({ allowedDirs: ['/home/user/workspace'] });
const result = await tool.execute({ cmd: 'ls -la' });
// "total 42\ndrwxr-xr-x ..."
```

### Environment

The tool runs with:
- `PATH` inherited from the parent process
- `HOME` set to the system home directory
- `cwd` set to the first allowed directory
- No shell profile loading (non-interactive shell)

---

## FileSystemTool

### Capabilities

Read, write, list, create, move, and delete files and directories.

### Tool Definitions

#### `read_file`
```json
{
  "name": "read_file",
  "description": "Read the contents of a file",
  "parameters": {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "Path to the file" }
    },
    "required": ["path"]
  }
}
```
Max read: 256KB. Larger files are truncated with a notice.

#### `write_file`
```json
{
  "name": "write_file",
  "description": "Write content to a file, creating it if it doesn't exist",
  "parameters": {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "Path to the file" },
      "content": { "type": "string", "description": "Content to write" }
    },
    "required": ["path", "content"]
  }
}
```
Max write: 1MB. Larger writes are rejected.

#### `list_directory`
```json
{
  "name": "list_directory",
  "description": "List files and directories in a path",
  "parameters": {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "Path to list" }
    },
    "required": ["path"]
  }
}
```
Returns a formatted listing similar to `ls -la`.

#### `make_directory`
```json
{
  "name": "make_directory",
  "description": "Create a new directory",
  "parameters": {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "Path for the new directory" }
    },
    "required": ["path"]
  }
}
```

#### `delete_file`
```json
{
  "name": "delete_file",
  "description": "Delete a file",
  "parameters": {
    "type": "object",
    "properties": {
      "path": { "type": "string", "description": "Path to the file to delete" }
    },
    "required": ["path"]
  }
}
```

#### `move_file`
```json
{
  "name": "move_file",
  "description": "Move or rename a file",
  "parameters": {
    "type": "object",
    "properties": {
      "source": { "type": "string", "description": "Source path" },
      "destination": { "type": "string", "description": "Destination path" }
    },
    "required": ["source", "destination"]
  }
}
```

### Directory Validation

All paths are validated against `allowedDirs` before any operation:
- The path must be within one of the allowed directories
- Path traversal (`../`) outside allowed dirs is blocked
- Symlinks are followed but still validated against allowed dirs

---

## WebSearchTool

### Capabilities

Search the web and fetch URL contents.

### Tool Definitions

#### `web_search`
```json
{
  "name": "web_search",
  "description": "Search the web for information",
  "parameters": {
    "type": "object",
    "properties": {
      "query": { "type": "string", "description": "Search query" },
      "numResults": { "type": "number", "description": "Number of results (default: 5)" }
    },
    "required": ["query"]
  }
}
```

#### `fetch_url`
```json
{
  "name": "fetch_url",
  "description": "Fetch and read the contents of a URL",
  "parameters": {
    "type": "object",
    "properties": {
      "url": { "type": "string", "description": "URL to fetch" }
    },
    "required": ["url"]
  }
}
```

### Search Engines

| Engine | API Key Required | Quality |
|--------|-----------------|---------|
| **DuckDuckGo** | No | Good for general search |
| **Google Custom Search** | Yes (`GOOGLE_CSE_ID` + `GOOGLE_SEARCH_API_KEY`) | Best quality |

The adapter tries Google Custom Search first if credentials are available, falling back to DuckDuckGo.

### URL Fetching

`fetch_url()` downloads the page content and:
- Strips HTML tags
- Normalizes whitespace
- Truncates to a reasonable size (prevents massive page downloads)
- Handles redirects
- Sets a reasonable User-Agent

---

## Adding Custom Tools

Tools can be added via plugins or directly in the registry:

```typescript
registry.addTool({
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: {
    type: 'object',
    properties: {
      city: { type: 'string', description: 'City name' },
      units: { type: 'string', enum: ['celsius', 'fahrenheit'] },
    },
    required: ['city'],
  },
  execute: async ({ city, units = 'celsius' }) => {
    const response = await fetch(`https://api.weather.com/${city}?units=${units}`);
    return response.text();
  },
});
```

---

## Tool Execution Metrics

Every tool execution is tracked by the observability module:
- **Count**: `tool_executions_total` by tool name
- **Duration**: Time taken for each execution
- **Errors**: Failed executions with error type

---

## Related Documentation

- [`agents/`](../agents/README.md) — Agent that executes tools
- [`tool registry`](./registry.ts) — Tool management
- [`plugin-sdk/`](../plugin-sdk/README.md) — Tool interface for plugins
- [`observability/`](../observability/README.md) — Metrics for tool execution
