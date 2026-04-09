# Agents (`src/agents/`)

> **BaseAgent with tool-calling loop — the core AI agent implementation.**

---

## Overview

The `agents/` module implements the `BaseAgent` class, which is the core AI agent implementation in Agent Gateway. The BaseAgent implements an **agentic tool-calling loop** — it calls an AI provider with tool definitions, executes any tool calls returned by the model, feeds the results back, and repeats until the model produces a final text response or a maximum step count is reached.

This is what transforms a simple chatbot into an "agent" capable of taking actions: executing shell commands, reading/writing files, searching the web, and any custom tools provided by plugins.

---

## File Structure

```
agents/
└── index.ts    # BaseAgent class + createAgent() factory
```

---

## The `BaseAgent` Class

### Constructor Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `provider` | `Provider` | The AI provider adapter (OpenAI, Anthropic, etc.) |
| `tools` | `Tool[]` | Array of tool definitions available to the agent |
| `systemPrompt` | `string` | System prompt prepended to conversations |
| `maxSteps` | `number` | Maximum iterations of the tool-calling loop (default: 10) |
| `contextStrategy` | `string` | How to handle context window limits (`"truncate"`, `"summarize"`, `"error"`) |
| `model` | `string` | Model identifier to use (e.g., `"gpt-4o"`) |
| `temperature` | `number` | Sampling temperature (default: 0.7) |

### The Tool-Calling Loop

The `run()` method implements the core agentic loop:

```
┌─────────────────────────────────────────────────┐
│                  run(messages)                   │
│                                                  │
│  Step 1: Call provider.chatWithTools(messages)   │
│           │                                      │
│           ▼                                      │
│  Step 2: Does response have tool_calls?          │
│           │                                      │
│     ┌─────┴─────┐                               │
│     │           │                                │
│    Yes         No                                │
│     │           │                                │
│     ▼           ▼                                │
│  Step 3:    Return text                         │
│  For each    response                            │
│  tool_call:                                      │
│     │                                            │
│     ▼                                            │
│  Execute tool (name, args)                       │
│     │                                            │
│     ▼                                            │
│  Append tool result to                         │
│  messages                                       │
│     │                                            │
│     ▼                                            │
│  Step 4: steps++                                 │
│     │                                            │
│     ▼                                            │
│  Step 5: steps < maxSteps?                      │
│     │                                            │
│  ┌──┴───┐                                       │
│  Yes    No                                       │
│  │      │                                        │
│  │      ▼                                        │
│  │   Return partial                             │
│  │   response                                    │
│  │                                               │
│  └──► Go to Step 1                               │
└─────────────────────────────────────────────────┘
```

### Loop Steps in Detail

#### Step 1: Provider Call
```typescript
const response = await this.provider.chatWithTools(messages, this.tools);
```

Calls the AI provider with the current message history and tool definitions. The provider may return:
- A **text response** (final answer)
- A **tool_calls array** (requests to execute tools)
- Both (tool calls followed by text)

**Fallback**: If the provider doesn't support `chatWithTools()`, the agent falls back to `chat()` and manually parses tool calls from the text response.

#### Step 2: Tool Call Detection
The agent checks if the response contains tool calls. The format varies by provider:
- **OpenAI**: `response.choices[0].message.tool_calls`
- **Anthropic**: Content blocks of type `tool_use`
- **Google**: `functionCalls` in the response
- **Others**: Provider-specific format

If no tool calls are found, the text response is returned immediately and the loop terminates.

#### Step 3: Tool Execution
For each tool call:
```typescript
const result = await this.toolRegistry.execute(toolName, toolArgs);
```

The tool is looked up by name in the registry and executed with the provided arguments. Results are:
- **Success**: The tool's output (string)
- **Error**: An error message string

#### Step 4: Accumulate
Tool results are appended to the message history in the format expected by the provider:
```typescript
messages.push({
  role: 'tool',
  content: result,
  tool_call_id: toolCall.id,
});
```

This allows the provider to understand what each tool returned and generate the next response accordingly.

#### Step 5: Loop Control
The step counter is incremented. If `steps < maxSteps`, the loop continues. Otherwise, a partial response is returned with a warning that the step limit was reached.

---

## Public API

### `run(messages: ChatMessage[]): Promise<ModelResponse>`

The main entry point. Accepts an array of chat messages (with system prompt, user messages, and previous tool results) and returns the final model response.

```typescript
const response = await agent.run([
  { role: 'system', content: 'You are a helpful assistant.' },
  { role: 'user', content: 'What files are in /tmp?' },
]);
console.log(response.content);
```

### `addTool(tool: Tool): void`

Dynamically adds a tool to the agent's toolkit at runtime.

```typescript
agent.addTool({
  name: 'calculator',
  description: 'Perform mathematical calculations',
  parameters: { expression: { type: 'string' } },
  execute: async (args) => String(eval(args.expression)),
});
```

### `removeTool(name: string): boolean`

Removes a tool from the agent's toolkit. Returns `true` if the tool existed and was removed.

### `getTools(): Tool[]`

Returns the current list of registered tools.

### `setSystemPrompt(prompt: string): void`

Updates the system prompt. Takes effect on the next `run()` call.

### `setModel(model: string): void`

Changes the model used for provider calls. Useful for A/B testing or fallback scenarios.

---

## The `createAgent()` Factory

```typescript
function createAgent(options: AgentOptions): BaseAgent
```

A convenience factory that creates a BaseAgent with sensible defaults:

| Option | Default | Description |
|--------|---------|-------------|
| `provider` | **required** | The AI provider to use |
| `tools` | `[]` | Tool registry or tool array |
| `systemPrompt` | `"You are a helpful assistant."` | System prompt |
| `maxSteps` | `10` | Maximum tool-calling iterations |
| `contextStrategy` | `"truncate"` | Context overflow handling |
| `model` | Provider default | Model identifier |
| `temperature` | `0.7` | Sampling temperature |

---

## Context Management

When conversations grow large, the agent may exceed the provider's context window. The `contextStrategy` parameter controls behavior:

| Strategy | Behavior |
|----------|----------|
| `truncate` | Remove oldest messages first (default) |
| `summarize` | Attempt to summarize old messages (requires provider support) |
| `error` | Throw an error when context window is exceeded |

Context management is delegated to the `ContextManager` in `src/context/`, which handles token counting and message trimming.

---

## Error Handling

### Provider Errors
If the provider call fails, the agent:
1. Logs the error via infrastructure logger
2. Returns an error message as the response
3. Does NOT retry (retries are handled at the provider or failover level)

### Tool Execution Errors
If a tool throws during execution:
1. The error is caught and converted to a string message
2. The error message is fed back to the provider as the tool result
3. The loop continues — the agent can attempt to recover or try a different approach

### Max Steps Reached
When `maxSteps` is reached:
1. A warning is logged
2. The agent returns whatever response the provider has given so far
3. If no text response exists, a generic "I couldn't complete this task" message is returned

---

## Provider Fallback for Tool Calling

Not all providers support native tool-calling. The BaseAgent handles this gracefully:

1. **Primary**: Call `provider.chatWithTools()` if available
2. **Fallback 1**: Call `provider.chat()` and parse tool calls from text (e.g., `{"tool": "bash", "args": {"cmd": "ls"}}`)
3. **Fallback 2**: If no tool calls can be parsed, treat as a text-only response

This means the same agent works with both tool-capable and non-tool-capable providers.

---

## Performance Considerations

### Parallel Tool Execution
When a provider returns multiple independent tool calls, the agent can execute them in parallel using `Promise.all()`. This is controlled by the `parallelTools` option (default: `true`).

Tools that have side effects or depend on each other should declare `parallel: false` in their definition.

### Token Efficiency
The agent tracks token usage across the loop and can:
- Warn when approaching context limits
- Truncate messages proactively
- Report total tokens used in the response metadata

---

## Usage Examples

### Basic Agent
```typescript
import { createAgent } from 'agent-gateway';
import { OpenAIProvider } from 'agent-gateway/providers/openai';

const agent = createAgent({
  provider: new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY }),
  systemPrompt: 'You are a helpful coding assistant.',
  maxSteps: 5,
});

const response = await agent.run([
  { role: 'user', content: 'Explain what a closure is in JavaScript.' },
]);
```

### Agent with Tools
```typescript
import { ToolRegistry, createAgent, OpenAIProvider } from 'agent-gateway';

const registry = new ToolRegistry({ allowedDirs: ['/home/user'] });
const provider = new OpenAIProvider({ apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4o' });

const agent = createAgent({
  provider,
  tools: registry,
  maxSteps: 15,
  systemPrompt: 'You can execute shell commands and read files to help answer questions.',
});

const response = await agent.run([
  { role: 'user', content: 'What Node.js packages are installed?' },
]);
```

### Dynamic Tool Addition
```typescript
const agent = createAgent({ provider: myProvider });

agent.addTool({
  name: 'get_weather',
  description: 'Get current weather for a city',
  parameters: {
    city: { type: 'string', description: 'City name' },
  },
  execute: async ({ city }) => fetchWeather(city),
});
```

---

## Integration Points

| Module | Relationship |
|--------|-------------|
| [`providers/`](../providers/README.md) | Agent calls providers for AI completions |
| [`tools/`](../tools/README.md) | Agent executes tools returned by the provider |
| [`gateway/`](../gateway/README.md) | Gateway routes messages to the agent |
| [`auto-reply/`](../auto-reply/README.md) | AutoReply connects channel messages to the agent |
| [`context/`](../context/README.md) | Context window management |
| [`failover/`](../failover/README.md) | Provider fallback for agent calls |
| [`hooks/`](../hooks/README.md) | beforeTool/afterTool hooks fired during execution |
| [`observability/`](../observability/README.md) | Metrics for tool executions and provider calls |

---

## Related Documentation

- [`providers/`](../providers/README.md) — AI provider adapters called by the agent
- [`tools/`](../tools/README.md) — Built-in tools the agent can execute
- [`tool registry`](../tools/README.md#toolregistry) — Tool management
- [`gateway/`](../gateway/README.md) — Central orchestrator
- [`auto-reply/`](../auto-reply/README.md) — Message handler that uses the agent
- [`context/`](../context/README.md) — Context window management
- [`hooks/`](../hooks/README.md) — Lifecycle hooks
