/**
 * Agent Error Classification & Graceful Degradation
 * 
 * Classifies errors from AI providers and tool execution into actionable categories
 * with retry strategies, fallback behavior, and user-facing messages.
 * 
 * Roadmap: Section 3.2 — Error Classification & Graceful Degradation
 */

import { logger } from '../infra/index.js';

// --- Error Types ---

export type AgentErrorType =
  | 'rate_limit'           // 429 — retry with exponential backoff
  | 'context_overflow'     // Token limit exceeded — compact or truncate
  | 'auth_failure'          // 401/403 — rotate credentials or alert
  | 'billing_error'         // Insufficient credits — fallback model
  | 'content_filter'        // Safety filter — retry with modified prompt
  | 'timeout'               // Provider didn't respond — retry or fallback
  | 'provider_error'        // 5xx — retry with backoff
  | 'tool_error'            // Tool execution failed — report to agent
  | 'connection_error'      // Network/DNS failure — retry
  | 'invalid_request'       // 400 — bad request, don't retry
  | 'unknown';              // Fall through to existing behavior

export interface AgentErrorClassification {
  type: AgentErrorType;
  retryable: boolean;
  backoffMs: number;
  maxRetries: number;
  shouldFallback: boolean;
  fallbackProvider?: string;
  userMessage?: string;
  shouldCompactContext: boolean;
  shouldRotateAuth: boolean;
  originalError: unknown;
}

// --- Error Classification Engine ---

export function classifyAgentError(error: unknown, context?: {
  provider?: string;
  model?: string;
  attempt?: number;
  availableProviders?: string[];
}): AgentErrorClassification {
  const base: Omit<AgentErrorClassification, 'type'> = {
    retryable: false,
    backoffMs: 1000,
    maxRetries: 3,
    shouldFallback: false,
    shouldCompactContext: false,
    shouldRotateAuth: false,
    originalError: error,
  };

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const status = extractStatusCode(error);

    // Rate limiting
    if ((status ?? 0) === 429 || message.includes('rate limit') || message.includes('too many requests') || message.includes('rate_limited')) {
      return {
        ...base,
        type: 'rate_limit',
        retryable: true,
        backoffMs: calculateRateLimitBackoff( context?.attempt || 0),
        maxRetries: 5,
        shouldFallback: true,
        userMessage: "I'm being rate-limited, trying a different model…",
      };
    }

    // Context overflow
    if (message.includes('context length') || message.includes('maximum context') || 
        message.includes('token limit') || message.includes('prompt too long') ||
        message.includes('context_overflow') || message.includes('input token')) {
      return {
        ...base,
        type: 'context_overflow',
        retryable: true,
        backoffMs: 0,
        maxRetries: 1,
        shouldFallback: false,
        shouldCompactContext: true,
        userMessage: undefined, // Auto-compact, no user message
      };
    }

    // Auth failure
    if (status === 401 || status === 403 || message.includes('authentication') || 
        message.includes('unauthorized') || message.includes('invalid api key') ||
        message.includes('forbidden') || message.includes('invalid_api_key')) {
      return {
        ...base,
        type: 'auth_failure',
        retryable: false,
        shouldFallback: true,
        shouldRotateAuth: true,
        userMessage: "Authentication issue, trying alternate credentials…",
      };
    }

    // Billing error
    if (message.includes('billing') || message.includes('insufficient') || 
        message.includes('quota exceeded') || message.includes('credit') ||
        message.includes('payment') || message.includes('account_disabled')) {
      return {
        ...base,
        type: 'billing_error',
        retryable: false,
        shouldFallback: true,
        userMessage: "My primary model is unavailable, using a backup…",
      };
    }

    // Content filter
    if (status === 400 && (message.includes('content filter') || message.includes('safety') || 
        message.includes('blocked') || message.includes('policy') || message.includes('inappropriate'))) {
      return {
        ...base,
        type: 'content_filter',
        retryable: true,
        backoffMs: 500,
        maxRetries: 1,
        shouldFallback: true,
        userMessage: undefined, // Rephrase internally
      };
    }

    // Timeout
    if (message.includes('timeout') || message.includes('timed out') || 
        message.includes('deadline') || error.name === 'AbortError') {
      return {
        ...base,
        type: 'timeout',
        retryable: true,
        backoffMs: calculateTimeoutBackoff(context?.attempt || 0),
        maxRetries: 3,
        shouldFallback: true,
        userMessage: "That took too long, trying again…",
      };
    }

    // Provider error (5xx)
    if ((status ?? 0) >= 500 || message.includes('internal server') || message.includes('service unavailable') ||
        message.includes('bad gateway') || message.includes('provider_error')) {
      return {
        ...base,
        type: 'provider_error',
        retryable: true,
        backoffMs: calculateProviderBackoff(context?.attempt || 0),
        maxRetries: 3,
        shouldFallback: context?.attempt ? context.attempt >= 2 : false,
        userMessage: "Having trouble with my AI provider…",
      };
    }

    // Invalid request
    if (status === 400 || message.includes('bad request') || message.includes('invalid_request')) {
      return {
        ...base,
        type: 'invalid_request',
        retryable: false,
        userMessage: "I couldn't process that request. Please try again.",
      };
    }

    // Connection error
    if (message.includes('connection') || message.includes('network') || 
        message.includes('econnrefused') || message.includes('dns') ||
        message.includes('fetch failed') || message.includes('socket')) {
      return {
        ...base,
        type: 'connection_error',
        retryable: true,
        backoffMs: 2000,
        maxRetries: 3,
        shouldFallback: true,
        userMessage: "Connection issue, retrying…",
      };
    }

    // Tool error
    if (message.includes('tool') || message.includes('function call') || 
        message.includes('tool_error') || message.includes('tool execution')) {
      return {
        ...base,
        type: 'tool_error',
        retryable: false,
        userMessage: undefined, // Report error to agent for retry
      };
    }
  }

  // Unknown error
  return {
    ...base,
    type: 'unknown',
    retryable: true,
    backoffMs: 1000,
    maxRetries: 2,
    shouldFallback: true,
    userMessage: "An unexpected error occurred. Please try again.",
  };
}

// --- Helper Functions ---

function extractStatusCode(error: unknown): number | undefined {
  if (error instanceof Error) {
    // Check for status code in error message or properties
    const match = error.message.match(/status[:\s]*(\d{3})/i);
    if (match) return parseInt(match[1], 10);
    
    // Check for status property
    if ('status' in error) return (error as any).status;
    if ('statusCode' in error) return (error as any).statusCode;
  }
  return undefined;
}

function calculateRateLimitBackoff(attempt: number): number {
  // Exponential backoff: 1s → 2s → 4s → 8s → 16s (capped at 60s)
  return Math.min(1000 * Math.pow(2, attempt), 60000);
}

function calculateTimeoutBackoff(attempt: number): number {
  // Exponential backoff: 2s → 4s → 8s (capped at 30s)
  return Math.min(2000 * Math.pow(2, attempt), 30000);
}

function calculateProviderBackoff(attempt: number): number {
  // Exponential backoff: 1s → 2s → 4s → 8s
  return 1000 * Math.pow(2, attempt);
}

// --- Error Recovery Strategy ---

export interface RecoveryAction {
  action: 'retry' | 'fallback' | 'compact' | 'rotate_auth' | 'abort' | 'report';
  delayMs: number;
  userMessage?: string;
}

export function getRecoveryAction(classification: AgentErrorClassification, context?: {
  availableProviders?: string[];
  fallbackProvider?: string;
}): RecoveryAction {
  const { type, retryable, shouldFallback, shouldCompactContext, shouldRotateAuth } = classification;

  // Context overflow → compact and retry
  if (shouldCompactContext) {
    return {
      action: 'compact',
      delayMs: 0,
    };
  }

  // Auth failure → rotate and retry
  if (shouldRotateAuth) {
    return {
      action: 'rotate_auth',
      delayMs: 500,
      userMessage: classification.userMessage,
    };
  }

  // Retryable error with remaining attempts
  if (retryable) {
    return {
      action: 'retry',
      delayMs: classification.backoffMs,
      userMessage: classification.userMessage,
    };
  }

  // Fallback to another provider
  if (shouldFallback && context?.availableProviders && context.availableProviders.length > 1) {
    return {
      action: 'fallback',
      delayMs: 200,
      userMessage: classification.userMessage,
    };
  }

  // Can't recover → report error
  return {
    action: 'report',
    delayMs: 0,
    userMessage: classification.userMessage || "I'm unable to process your request right now.",
  };
}

// --- Error Tracking ---

export interface ErrorStats {
  byType: Record<AgentErrorType, number>;
  totalErrors: number;
  totalRecovered: number;
  totalUnrecoverable: number;
  lastError?: {
    type: AgentErrorType;
    timestamp: number;
    provider?: string;
    message: string;
  };
}

export class ErrorTracker {
  private stats: ErrorStats = {
    byType: {
      rate_limit: 0,
      context_overflow: 0,
      auth_failure: 0,
      billing_error: 0,
      content_filter: 0,
      timeout: 0,
      provider_error: 0,
      tool_error: 0,
      connection_error: 0,
      invalid_request: 0,
      unknown: 0,
    },
    totalErrors: 0,
    totalRecovered: 0,
    totalUnrecoverable: 0,
  };

  recordError(classification: AgentErrorClassification, provider?: string, recovered: boolean = false): void {
    this.stats.byType[classification.type]++;
    this.stats.totalErrors++;

    if (recovered) {
      this.stats.totalRecovered++;
    } else if (!classification.retryable && !classification.shouldFallback) {
      this.stats.totalUnrecoverable++;
    }

    this.stats.lastError = {
      type: classification.type,
      timestamp: Date.now(),
      provider,
      message: classification.originalError instanceof Error 
        ? classification.originalError.message 
        : String(classification.originalError),
    };
  }

  getStats(): ErrorStats {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      byType: {
        rate_limit: 0,
        context_overflow: 0,
        auth_failure: 0,
        billing_error: 0,
        content_filter: 0,
        timeout: 0,
        provider_error: 0,
        tool_error: 0,
        connection_error: 0,
        invalid_request: 0,
        unknown: 0,
      },
      totalErrors: 0,
      totalRecovered: 0,
      totalUnrecoverable: 0,
    };
  }
}

// --- Integration with Agent Loop ---

/**
 * Enhanced agent error handler that integrates with the agent loop.
 * Call this from within the agent's catch block to get intelligent recovery.
 */
export async function handleAgentError(
  error: unknown,
  context: {
    provider?: string;
    model?: string;
    attempt: number;
    maxAttempts: number;
    availableProviders: string[];
    fallbackProvider?: string;
    errorTracker?: ErrorTracker;
  }
): Promise<{ shouldRetry: boolean; delayMs: number; userMessage?: string; action: string }> {
  const classification = classifyAgentError(error, {
    provider: context.provider,
    model: context.model,
    attempt: context.attempt,
    availableProviders: context.availableProviders,
  });

  // Track the error
  context.errorTracker?.recordError(classification, context.provider);

  // Get recovery action
  const recovery = getRecoveryAction(classification, {
    availableProviders: context.availableProviders,
    fallbackProvider: context.fallbackProvider,
  });

  // Log the error with classification
  logger.warn({
    errorType: classification.type,
    provider: context.provider,
    model: context.model,
    attempt: context.attempt,
    maxAttempts: context.maxAttempts,
    retryable: classification.retryable,
    recoveryAction: recovery.action,
    delayMs: recovery.delayMs,
  }, `Agent error: ${classification.type}`);

  // Determine if we should retry
  const shouldRetry = recovery.action === 'retry' && context.attempt < context.maxAttempts;

  return {
    shouldRetry,
    delayMs: recovery.delayMs,
    userMessage: recovery.userMessage,
    action: recovery.action,
  };
}

