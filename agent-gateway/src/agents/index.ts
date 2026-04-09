export interface Agent {
  id: string;
  name: string;
  provider: Provider;
  systemPrompt?: string;
  tools: Tool[];
  maxSteps?: number;
  useToolSchema?: boolean;
}

export interface AgentOptions {
  name: string;
  provider: Provider;
  systemPrompt?: string;
  tools?: Tool[];
  maxSteps?: number;
  useToolSchema?: boolean;
  /** Enable intelligent error recovery */
  errorRecovery?: boolean;
  /** Max retries per step */
  maxRetriesPerStep?: number;
  /** Response cache to avoid redundant API calls */
  responseCache?: import('../cache/index.js').ResponseCache;
  /** Context manager for window handling */
  contextManager?: import('../context/index.js').ContextManager;
}

export interface AgentResult {
  messages: ChatMessage[];
  toolCalls: ToolCallResult[];
  finishReason: string;
  /** Errors encountered during execution */
  errors: AgentError[];
  /** Whether context was compacted */
  contextCompacted: boolean;
}

export interface AgentError {
  type: string;
  message: string;
  step: number;
  retryable: boolean;
  recovered: boolean;
  timestamp: number;
}

export interface ToolCallResult {
  tool: string;
  args: Record<string, any>;
  result: any;
  success: boolean;
  error?: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  name?: string;
  toolCalls?: ToolCall[];
  toolCallId?: string;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute(params: Record<string, any>): Promise<any>;
}

import type { Provider } from '../providers/types.js';
import { classifyAgentError, getRecoveryAction, ErrorTracker } from '../agent-error/index.js';
import { logger } from '../infra/index.js';

export class BaseAgent implements Agent {
  id: string;
  name: string;
  provider: Provider;
  systemPrompt?: string;
  tools: Tool[];
  maxSteps?: number;
  useToolSchema?: boolean;
  private errorRecovery: boolean;
  private maxRetriesPerStep: number;
  private errorTracker: ErrorTracker;
  private responseCache?: import('../cache/index.js').ResponseCache;
  private contextManager?: import('../context/index.js').ContextManager;

  constructor(options: AgentOptions) {
    this.id = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.name = options.name;
    this.provider = options.provider;
    this.systemPrompt = options.systemPrompt;
    this.tools = options.tools || [];
    this.maxSteps = options.maxSteps;
    this.useToolSchema = options.useToolSchema;
    this.errorRecovery = options.errorRecovery ?? true;
    this.maxRetriesPerStep = options.maxRetriesPerStep ?? 3;
    this.errorTracker = new ErrorTracker();
    this.responseCache = options.responseCache;
    this.contextManager = options.contextManager;
  }

  /**
   * Run the agent loop with intelligent error recovery.
   * 
   * Error handling matrix (Roadmap 3.2):
   * - rate_limit → retry with exponential backoff, fallback to next provider
   * - context_overflow → compact messages, retry
   * - auth_failure → rotate credentials, fallback
   * - billing_error → fallback to cheaper model
   * - content_filter → retry with modified prompt
   * - timeout → retry with longer timeout
   * - provider_error → retry with backoff, fallback after 2 failures
   * - tool_error → report to agent for retry
   * - connection_error → retry with backoff
   */
  async run(initialMessages: ChatMessage[]): Promise<AgentResult> {
    const messages = [...initialMessages];
    const toolCalls: ToolCallResult[] = [];
    const errors: AgentError[] = [];
    let finishReason = 'max_steps';
    let contextCompacted = false;

    const systemMessage: ChatMessage = this.systemPrompt
      ? { role: 'system', content: this.systemPrompt }
      : { role: 'system', content: 'You are a helpful AI assistant. You have access to tools. Use them when appropriate to complete tasks.' };

    messages.unshift(systemMessage);

    const maxIterations = this.maxSteps || 10;

    for (let i = 0; i < maxIterations; i++) {
      let response;
      let stepErrors = 0;

      // Use chatWithTools if we have tools and the provider supports it
      const useTools = this.useToolSchema !== false && this.tools.length > 0;

      for (let retry = 0; retry <= this.maxRetriesPerStep; retry++) {
        try {
          // Try response cache (only for non-tool-calling calls with a single provider)
          if (!useTools && this.responseCache && retry === 0) {
            const cached = await this.responseCache.get(messages, this.provider.id, 1.0);
            if (cached) {
              logger.debug('Agent: served from response cache');
              response = cached;
              if (retry > 0) {
                this.errorTracker.recordError(
                  { type: 'unknown', originalError: 'retried', retryable: true } as any,
                  this.provider.name || this.provider.id,
                  true
                );
              }
              break;
            }
          }

          if (useTools) {
            response = await this.provider.chatWithTools(messages, this.tools);
          } else {
            response = await this.provider.chat(messages);
          }

          // Cache successful response (only non-tool-calling)
          if (!useTools && this.responseCache && retry === 0) {
            await this.responseCache.set(messages, this.provider.id, 1.0, response);
          }

          // Success — record recovery if this was a retry
          if (retry > 0) {
            this.errorTracker.recordError(
              { type: 'unknown', originalError: 'retried', retryable: true } as any,
              this.provider.name || this.provider.id,
              true
            );
          }
          break;
        } catch (err: any) {
          stepErrors++;

          if (!this.errorRecovery) {
            // No recovery — re-throw
            errors.push({
              type: 'unknown',
              message: err.message,
              step: i,
              retryable: false,
              recovered: false,
              timestamp: Date.now(),
            });
            throw err;
          }

          // Classify the error
          const classification = classifyAgentError(err, {
            provider: this.provider.name || this.provider.id,
            attempt: retry,
          });

          // Track the error
          this.errorTracker.recordError(classification, this.provider.name || this.provider.id, false);

          // Get recovery action
          const recovery = getRecoveryAction(classification, {
            availableProviders: [this.provider.name || this.provider.id],
          });

          // Log the recovery action
          logger.warn({
            errorType: classification.type,
            retry: retry,
            maxRetries: this.maxRetriesPerStep,
            recoveryAction: recovery.action,
            delayMs: recovery.delayMs,
          }, `Agent step ${i} error recovery: ${recovery.action}`);

          // Execute recovery action
          if (recovery.action === 'compact') {
            // Context overflow — compact messages
            const compacted = this.compactContext(messages);
            if (compacted) {
              contextCompacted = true;
              continue; // Retry with compacted context
            }
          }

          if (recovery.action === 'retry' && retry < this.maxRetriesPerStep) {
            // Wait for backoff period
            if (recovery.delayMs > 0) {
              await new Promise(resolve => setTimeout(resolve, recovery.delayMs));
            }
            continue; // Retry
          }

          // Can't recover at this step — record error and continue to next iteration
          errors.push({
            type: classification.type,
            message: err.message,
            step: i,
            retryable: classification.retryable,
            recovered: false,
            timestamp: Date.now(),
          });

          // If this was the last retry attempt, break and try next iteration
          break;
        }
      }

      if (!response) {
        // All retries failed — try to finish with what we have
        if (messages.length > 1) {
          finishReason = 'error_recovery';
          break;
        }
        throw new Error(`Agent failed after ${this.maxRetriesPerStep} retries at step ${i}`);
      }

      messages.push({
        role: 'assistant',
        content: response.content,
        toolCalls: response.toolCalls,
      });

      if (response.finishReason === 'stop') {
        finishReason = 'completed';
        break;
      }

      // Process tool calls
      if (response.toolCalls && response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          const tool = this.tools.find((t) => t.name === toolCall.function.name);

          if (!tool) {
            toolCalls.push({
              tool: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments || '{}'),
              result: null,
              success: false,
              error: `Tool not found: ${toolCall.function.name}`,
            });
            messages.push({
              role: 'user',
              content: `Error: Tool '${toolCall.function.name}' not found`,
              toolCallId: toolCall.id,
            });
            continue;
          }

          try {
            const args = JSON.parse(toolCall.function.arguments || '{}');
            const result = await tool.execute(args);

            toolCalls.push({
              tool: toolCall.function.name,
              args,
              result: typeof result === 'string' ? result : JSON.stringify(result),
              success: true,
            });

            messages.push({
              role: 'user',
              content: typeof result === 'string' ? result : JSON.stringify(result),
              toolCallId: toolCall.id,
            });
          } catch (error: any) {
            toolCalls.push({
              tool: toolCall.function.name,
              args: JSON.parse(toolCall.function.arguments || '{}'),
              result: null,
              success: false,
              error: error.message,
            });

            messages.push({
              role: 'user',
              content: `Tool error: ${error.message}`,
              toolCallId: toolCall.id,
            });
          }
        }
      } else {
        finishReason = 'completed';
        break;
      }
    }

    return { 
      messages, 
      toolCalls, 
      finishReason,
      errors,
      contextCompacted,
    };
  }

  /**
   * Compact context messages when approaching token limits.
   * Uses the ContextManager if available, otherwise falls back to ad-hoc oldest-first removal.
   */
  private compactContext(messages: ChatMessage[]): boolean {
    if (messages.length <= 3) return false; // Can't compact further

    if (this.contextManager) {
      // Use proper ContextManager
      const model = this.provider.id || 'gpt-4o';
      const result = this.contextManager.fitToContext(messages, model);
      if (result.messages.length < messages.length) {
        messages.length = 0;
        messages.push(...result.messages);
        logger.debug({
          originalTokens: result.promptTokens,
          availableTokens: result.availableTokens,
        }, 'ContextManager: compacted messages');
        return true;
      }
      return false;
    }

    // Fallback: ad-hoc oldest-first removal
    for (let i = 1; i < messages.length - 2; i++) {
      if (messages[i].role !== 'system') {
        logger.debug({ step: i, role: messages[i].role }, 'Compacting context: removing message');
        messages.splice(i, 1);
        return true;
      }
    }

    return false;
  }

  /**
   * Get error tracking statistics.
   */
  getErrorStats() {
    return this.errorTracker.getStats();
  }

  /**
   * Reset error tracking statistics.
   */
  resetErrorStats() {
    this.errorTracker.reset();
  }

  addTool(tool: Tool): void {
    this.tools.push(tool);
  }

  removeTool(name: string): void {
    this.tools = this.tools.filter(t => t.name !== name);
  }
}

export function createAgent(options: AgentOptions): Agent {
  return new BaseAgent(options);
}
