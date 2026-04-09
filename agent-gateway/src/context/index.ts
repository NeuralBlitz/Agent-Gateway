/**
 * Context window management and token counting.
 * Handles prompt length tracking, context truncation, and model-specific limits.
 */

import { logger } from '../infra/index.js';
import type { ChatMessage } from '../providers/types.js';

/** Token counts for known models (approximate) */
const MODEL_CONTEXT_WINDOWS: Record<string, number> = {
  // OpenAI
  'gpt-4o': 128_000,
  'gpt-4o-mini': 128_000,
  'gpt-4-turbo': 128_000,
  'gpt-4': 8192,
  'gpt-3.5-turbo': 16_385,
  'o1': 200_000,
  'o1-mini': 128_000,
  // Anthropic
  'claude-sonnet-4-20250514': 200_000,
  'claude-opus-4-20250514': 200_000,
  'claude-3-5-sonnet': 200_000,
  'claude-3-5-haiku': 200_000,
  'claude-3-opus': 200_000,
  // Google
  'gemini-2.0-flash': 1_048_576,
  'gemini-2.0-flash-exp': 1_048_576,
  'gemini-2.0-pro': 2_000_000,
  'gemini-1.5-pro': 2_000_000,
  // Mistral
  'mistral-large-latest': 128_000,
  'mistral-small-latest': 32_000,
  // DeepSeek
  'deepseek-chat': 128_000,
  'deepseek-coder': 128_000,
  // Ollama (varies by model)
  'llama3': 8192,
  'llama3.1': 128_000,
  'llama3.2': 128_000,
  'llama3.3': 128_000,
  'mistral': 8192,
  'mixtral': 32_000,
};

export interface ContextManagerConfig {
  /** Maximum tokens to use for the conversation (default: model's context window) */
  maxTokens?: number;
  /** Reserve tokens for the response (default: 4096) */
  responseReserve?: number;
  /** Strategy for truncation: 'oldest-first' or 'summary' */
  truncationStrategy?: 'oldest-first' | 'summary';
  /** Whether to always keep the first message (system prompt) */
  preserveSystemPrompt?: boolean;
  /** Whether to always keep the latest message */
  preserveLatest?: number;
}

/**
 * Estimate token count for text.
 * Uses a rough heuristic: ~4 chars per token for English.
 * For production, use tiktoken or a proper tokenizer.
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Rough heuristic: English text ~4 chars/token
  // This is approximate — actual count varies by model
  const charCount = text.length;
  const wordCount = text.split(/\s+/).length;
  // Use average of char-based and word-based estimates
  return Math.round((charCount / 4 + wordCount * 1.3) / 2);
}

/**
 * Get the context window size for a model.
 */
export function getModelContextWindow(model: string): number {
  // Exact match
  if (MODEL_CONTEXT_WINDOWS[model]) return MODEL_CONTEXT_WINDOWS[model];

  // Prefix match
  for (const [key, value] of Object.entries(MODEL_CONTEXT_WINDOWS)) {
    if (model.startsWith(key)) return value;
  }

  // Default to 128K for unknown models (safe default)
  return 128_000;
}

/**
 * Count tokens in a list of messages.
 */
export function countMessageTokens(messages: ChatMessage[]): number {
  let total = 0;
  for (const msg of messages) {
    total += estimateTokens(msg.content);
    // Each message has overhead: role + content formatting
    total += 4; // role overhead
    if (msg.name) total += estimateTokens(msg.name) + 1;
  }
  // Conversation-level overhead
  total += 2;
  return total;
}

/**
 * Context manager — ensures messages fit within the model's context window.
 */
export class ContextManager {
  private config: Required<ContextManagerConfig>;

  constructor(config: ContextManagerConfig = {}) {
    this.config = {
      maxTokens: config.maxTokens || 128_000,
      responseReserve: config.responseReserve || 4096,
      truncationStrategy: config.truncationStrategy || 'oldest-first',
      preserveSystemPrompt: config.preserveSystemPrompt ?? true,
      preserveLatest: config.preserveLatest ?? 2,
    };
  }

  /**
   * Truncate messages to fit within the context window.
   * Returns the truncated message list and token counts.
   */
  fitToContext(
    messages: ChatMessage[],
    model: string,
  ): { messages: ChatMessage[]; promptTokens: number; availableTokens: number } {
    const contextWindow = Math.min(this.config.maxTokens, getModelContextWindow(model));
    const maxPromptTokens = contextWindow - this.config.responseReserve;

    const totalTokens = countMessageTokens(messages);

    if (totalTokens <= maxPromptTokens) {
      // No truncation needed
      return { messages, promptTokens: totalTokens, availableTokens: maxPromptTokens - totalTokens };
    }

    logger.warn(
      { totalTokens, maxPromptTokens, model, strategy: this.config.truncationStrategy },
      'Context window exceeded, truncating messages',
    );

    const truncated = this.truncate(messages, maxPromptTokens);
    const finalTokens = countMessageTokens(truncated);

    return {
      messages: truncated,
      promptTokens: finalTokens,
      availableTokens: maxPromptTokens - finalTokens,
    };
  }

  /**
   * Truncate messages using the configured strategy.
   */
  private truncate(messages: ChatMessage[], maxTokens: number): ChatMessage[] {
    if (messages.length === 0) return [];

    // Separate system, middle, and latest messages
    const systemMessages = this.config.preserveSystemPrompt
      ? messages.filter((m) => m.role === 'system')
      : [];

    const nonSystemMessages = messages.filter((m) => m.role !== 'system');
    const keepCount = Math.min(this.config.preserveLatest, nonSystemMessages.length);
    const latestMessages = nonSystemMessages.slice(-keepCount);
    const middleMessages = nonSystemMessages.slice(0, -keepCount);

    if (this.config.truncationStrategy === 'oldest-first') {
      // Remove oldest messages first
      let result = [...systemMessages, ...middleMessages, ...latestMessages];

      while (countMessageTokens(result) > maxTokens && middleMessages.length > 0) {
        middleMessages.shift();
        result = [...systemMessages, ...middleMessages, ...latestMessages];
      }

      return result;
    }

    // Summary strategy (placeholder — could call a summarization model)
    // For now, just drop oldest
    let result = [...systemMessages, ...middleMessages, ...latestMessages];
    while (countMessageTokens(result) > maxTokens && middleMessages.length > 0) {
      middleMessages.shift();
      result = [...systemMessages, ...middleMessages, ...latestMessages];
    }

    return result;
  }

  /**
   * Get context usage stats for a message list.
   */
  getStats(messages: ChatMessage[], model: string): {
    totalTokens: number;
    contextWindow: number;
    usagePercent: number;
    messageCount: number;
  } {
    const contextWindow = Math.min(this.config.maxTokens, getModelContextWindow(model));
    const totalTokens = countMessageTokens(messages);

    return {
      totalTokens,
      contextWindow,
      usagePercent: (totalTokens / contextWindow) * 100,
      messageCount: messages.length,
    };
  }
}

export function createContextManager(config?: ContextManagerConfig): ContextManager {
  return new ContextManager(config);
}
