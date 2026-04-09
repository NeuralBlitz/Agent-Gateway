import { BashTool, type BashToolResult, type BashToolConfig } from './bash.js';
import { FileSystemTool, type FileSystemConfig } from './filesystem.js';
import { WebSearchTool, type WebSearchConfig, type SearchResult } from './websearch.js';
import { logger } from '../infra/index.js';

/**
 * ToolRegistry — manages all available tools for the agent.
 * Each tool has a name, description, JSON schema for parameters, and an execute function.
 */
export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema
  execute: (params: Record<string, any>) => Promise<any>;
}

export interface ToolRegistryConfig {
  bash?: BashToolConfig & { enabled?: boolean };
  filesystem?: FileSystemConfig & { enabled?: boolean };
  websearch?: WebSearchConfig & { enabled?: boolean };
}

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private bashTool?: BashTool;
  private fsTool?: FileSystemTool;
  private webSearchTool?: WebSearchTool;

  constructor(config: ToolRegistryConfig = {}) {
    // Register built-in tools
    if (config.bash?.enabled !== false) {
      this.bashTool = new BashTool(config.bash);
      this.register(this.createBashToolDef());
    }

    if (config.filesystem?.enabled !== false) {
      this.fsTool = new FileSystemTool(config.filesystem);
      this.register(this.createFsToolDef());
    }

    if (config.websearch?.enabled !== false) {
      this.webSearchTool = new WebSearchTool(config.websearch);
      this.register(this.createWebSearchToolDef());
    }
  }

  /** Register a tool definition */
  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
    logger.debug({ tool: tool.name }, 'Registered tool');
  }

  /** Remove a tool */
  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  /** Get a tool by name */
  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  /** List all registered tools */
  list(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /** Get tool definitions for provider API (OpenAI format) */
  toProviderTools(): Array<{
    type: 'function';
    function: { name: string; description: string; parameters: Record<string, any> };
  }> {
    return this.list().map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));
  }

  /** Execute a tool by name with the given parameters */
  async execute(name: string, params: Record<string, any>): Promise<any> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }
    logger.debug({ tool: name, params }, 'Executing tool');
    return tool.execute(params);
  }

  // --- Built-in tool definitions ---

  private createBashToolDef(): ToolDefinition {
    return {
      name: 'bash',
      description: 'Execute a shell command and return its output. Use for running scripts, installing packages, git operations, etc.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'The shell command to execute' },
          cwd: { type: 'string', description: 'Working directory (optional)' },
        },
        required: ['command'],
      },
      execute: async (params: Record<string, any>) => {
        if (!this.bashTool) throw new Error('Bash tool not initialized');
        const result: BashToolResult = await this.bashTool.execute(
          params.command as string,
          params.cwd as string | undefined,
        );
        if (result.success) {
          let output = result.stdout;
          if (result.stderr) output += (output ? '\n' : '') + result.stderr;
          return { success: true, output, exitCode: result.exitCode };
        }
        return { success: false, output: result.stderr || result.error, exitCode: result.exitCode };
      },
    };
  }

  private createFsToolDef(): ToolDefinition {
    return {
      name: 'filesystem',
      description: 'Read, write, list, move, and delete files and directories.',
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['read', 'write', 'list', 'mkdir', 'delete', 'move'], description: 'The filesystem action to perform' },
          path: { type: 'string', description: 'File or directory path' },
          path2: { type: 'string', description: 'Destination path (for move)' },
          content: { type: 'string', description: 'File content (for write)' },
        },
        required: ['action', 'path'],
      },
      execute: async (params: Record<string, any>) => {
        if (!this.fsTool) throw new Error('Filesystem tool not initialized');
        const action = params.action as string;
        const path = params.path as string;
        switch (action) {
          case 'read':
            return this.fsTool.read(path);
          case 'write': {
            const content = params.content as string;
            if (!content && content !== '') throw new Error('content required for write');
            return this.fsTool.write(path, content);
          }
          case 'list':
            return this.fsTool.listDir(path);
          case 'mkdir':
            return this.fsTool.mkdir(path);
          case 'delete':
            await this.fsTool.delete(path);
            return { deleted: path };
          case 'move': {
            const path2 = params.path2 as string;
            if (!path2) throw new Error('path2 required for move');
            return this.fsTool.move(path, path2);
          }
          default:
            throw new Error(`Unknown filesystem action: ${action}`);
        }
      },
    };
  }

  private createWebSearchToolDef(): ToolDefinition {
    return {
      name: 'web_search',
      description: 'Search the web for information. Returns title, URL, and snippet for each result.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query' },
        },
        required: ['query'],
      },
      execute: async (params: Record<string, any>) => {
        if (!this.webSearchTool) throw new Error('Web search tool not initialized');
        return this.webSearchTool.search(params.query as string);
      },
    };
  }

  /** Fetch a URL — registered as a separate tool if needed */
  registerUrlFetcher(): void {
    if (!this.webSearchTool) {
      this.webSearchTool = new WebSearchTool();
    }
    this.register({
      name: 'fetch_url',
      description: 'Fetch the text content of a URL. Useful for reading web pages.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'The URL to fetch' },
          maxLength: { type: 'number', description: 'Maximum characters to return (default 10000)' },
        },
        required: ['url'],
      },
      execute: async (params: Record<string, any>) => {
        const url = params.url as string;
        const maxLength = params.maxLength as number | undefined;
        return this.webSearchTool!.fetchUrl(url, maxLength);
      },
    });
  }
}

export function createToolRegistry(config?: ToolRegistryConfig): ToolRegistry {
  return new ToolRegistry(config);
}
