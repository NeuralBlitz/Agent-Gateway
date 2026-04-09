/**
 * Provider failover and load balancing.
 * Supports fallback chains, round-robin, and health-aware routing across multiple AI providers.
 */

import { logger } from '../infra/index.js';
import { classifyAgentError, type AgentErrorClassification } from '../agent-error/index.js';
import type { Provider, ChatMessage, ModelResponse, Tool } from '../providers/types.js';

export interface FailoverConfig {
  /** Ordered list of provider IDs to try (first = primary) */
  providers: string[];
  /** Max retries before giving up */
  maxRetries?: number;
  /** Timeout per provider attempt in ms */
  timeoutMs?: number;
  /** Whether to try next provider on error */
  fallbackOnError?: boolean;
  /** Whether to try next provider on content_filter finish reason */
  fallbackOnContentFilter?: boolean;
}

export interface LoadBalancerConfig {
  /** Strategy: 'round-robin', 'least-loaded', or 'weighted' */
  strategy?: 'round-robin' | 'least-loaded' | 'weighted';
  /** Weights per provider (only used with 'weighted' strategy) */
  weights?: Record<string, number>;
  /** Whether to exclude unhealthy providers */
  excludeUnhealthy?: boolean;
}

interface ProviderStats {
  totalCalls: number;
  errorCount: number;
  lastError?: number;
  lastSuccess?: number;
  avgLatency: number;
  inFlight: number;
  healthy: boolean;
  /** Last error classification for intelligent routing */
  lastErrorClassification?: AgentErrorClassification;
}

/**
 * FailoverProvider — wraps multiple providers with automatic fallback.
 * If the primary fails, tries the next in the chain.
 */
export class FailoverProvider implements Provider {
  id: string;
  type: string = 'failover';
  name: string;
  config: any;

  private providerMap: Map<string, Provider>;
  private failoverConfig: FailoverConfig;
  private stats: Map<string, ProviderStats> = new Map();

  constructor(
    id: string,
    name: string,
    providerMap: Map<string, Provider>,
    failoverConfig: FailoverConfig,
  ) {
    this.id = id;
    this.name = name;
    this.providerMap = providerMap;
    this.failoverConfig = failoverConfig;

    // Initialize stats
    for (const providerId of failoverConfig.providers) {
      this.stats.set(providerId, {
        totalCalls: 0,
        errorCount: 0,
        avgLatency: 0,
        inFlight: 0,
        healthy: true,
      });
    }
  }

  async connect(): Promise<void> {
    for (const providerId of this.failoverConfig.providers) {
      const provider = this.providerMap.get(providerId);
      if (provider) {
        try {
          await provider.connect();
        } catch (err: any) {
          logger.warn({ provider: providerId }, `Failover: failed to connect ${providerId}: ${err.message}`);
        }
      }
    }
  }

  async disconnect(): Promise<void> {
    for (const provider of this.providerMap.values()) {
      await provider.disconnect();
    }
  }

  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    const maxRetries = this.failoverConfig.maxRetries ?? this.failoverConfig.providers.length;
    let lastError: Error | undefined;
    let lastClassification: AgentErrorClassification | undefined;

    for (let i = 0; i < Math.min(maxRetries, this.failoverConfig.providers.length); i++) {
      const providerId = this.failoverConfig.providers[i];
      const provider = this.providerMap.get(providerId);

      if (!provider) {
        logger.warn({ provider: providerId }, 'Failover: provider not found');
        continue;
      }

      // Skip unhealthy providers
      const stats = this.stats.get(providerId);
      if (stats && !stats.healthy) {
        logger.warn({ provider: providerId }, 'Failover: skipping unhealthy provider');
        continue;
      }

      if (stats) stats.inFlight++;

      const start = Date.now();

      try {
        const response = await this.callWithTimeout(provider, messages);

        if (stats) {
          stats.inFlight--;
          stats.totalCalls++;
          stats.lastSuccess = Date.now();
          stats.avgLatency = (stats.avgLatency * (stats.totalCalls - 1) + (Date.now() - start)) / stats.totalCalls;
          stats.lastErrorClassification = undefined;
        }

        logger.debug({ provider: providerId, latency: Date.now() - start }, 'Failover: call succeeded');
        return response;
      } catch (err: any) {
        if (stats) {
          stats.inFlight--;
          stats.totalCalls++;
          stats.errorCount++;
          stats.lastError = Date.now();
          stats.avgLatency = (stats.avgLatency * (stats.totalCalls - 1) + (Date.now() - start)) / stats.totalCalls;
        }

        // Classify the error for intelligent fallback
        lastClassification = classifyAgentError(err, {
          provider: providerId,
          attempt: i,
          availableProviders: this.failoverConfig.providers,
        });

        if (stats) stats.lastErrorClassification = lastClassification;

        lastError = err;
        logger.warn({
          provider: providerId,
          errorType: lastClassification.type,
          retryable: lastClassification.retryable,
          shouldFallback: lastClassification.shouldFallback,
          err: err.message,
        }, `Failover: ${providerId} failed (${lastClassification.type})`);

        // If error classification says don't fallback, throw immediately
        if (!this.failoverConfig.fallbackOnError && !lastClassification.shouldFallback) {
          throw err;
        }

        // If auth failure, mark this provider as unhealthy (likely bad creds)
        if (lastClassification.type === 'auth_failure') {
          this.setHealthy(providerId, false);
        }

        // If context_overflow, there's no point trying another provider with same messages
        if (lastClassification.type === 'context_overflow') {
          logger.warn('Failover: context_overflow, not trying other providers');
          throw err;
        }
      }
    }

    logger.error({ attempts: this.failoverConfig.providers.length }, 'Failover: all providers exhausted');
    throw lastError || new Error('All failover providers failed');
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse> {
    const maxRetries = this.failoverConfig.maxRetries ?? this.failoverConfig.providers.length;
    let lastError: Error | undefined;
    let lastClassification: AgentErrorClassification | undefined;

    for (let i = 0; i < Math.min(maxRetries, this.failoverConfig.providers.length); i++) {
      const providerId = this.failoverConfig.providers[i];
      const provider = this.providerMap.get(providerId);

      if (!provider) continue;

      const stats = this.stats.get(providerId);
      if (stats && !stats.healthy) {
        logger.warn({ provider: providerId }, 'Failover: skipping unhealthy provider');
        continue;
      }

      try {
        const response = await this.callWithTimeoutTools(provider, messages, tools);

        // Check if we should fallback on content_filter
        if (response.finishReason === 'content_filter' && this.failoverConfig.fallbackOnContentFilter) {
          logger.warn({ provider: providerId }, 'Failover: content_filter, trying next provider');
          continue;
        }

        if (stats) {
          stats.lastErrorClassification = undefined;
        }

        return response;
      } catch (err: any) {
        lastClassification = classifyAgentError(err, {
          provider: providerId,
          attempt: i,
          availableProviders: this.failoverConfig.providers,
        });

        if (stats) stats.lastErrorClassification = lastClassification;

        lastError = err;
        logger.warn({
          provider: providerId,
          errorType: lastClassification.type,
          err: err.message,
        }, `Failover: ${providerId} failed with tools (${lastClassification.type})`);

        if (!this.failoverConfig.fallbackOnError && !lastClassification.shouldFallback) throw err;

        if (lastClassification.type === 'auth_failure' && stats) {
          this.setHealthy(providerId, false);
        }
      }
    }

    throw lastError || new Error('All failover providers failed with tools');
  }

  private async callWithTimeout(provider: Provider, messages: ChatMessage[]): Promise<ModelResponse> {
    const timeout = this.failoverConfig.timeoutMs || 60000;
    return new Promise<ModelResponse>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Provider timeout after ${timeout}ms`)), timeout);
      provider.chat(messages)
        .then((result) => { clearTimeout(timer); resolve(result); })
        .catch((err) => { clearTimeout(timer); reject(err); });
    });
  }

  private async callWithTimeoutTools(provider: Provider, messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse> {
    const timeout = this.failoverConfig.timeoutMs || 60000;
    return new Promise<ModelResponse>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Provider timeout after ${timeout}ms`)), timeout);
      provider.chatWithTools(messages, tools)
        .then((result) => { clearTimeout(timer); resolve(result); })
        .catch((err) => { clearTimeout(timer); reject(err); });
    });
  }

  /** Get health stats for all providers */
  getStats(): Record<string, ProviderStats> {
    const result: Record<string, ProviderStats> = {};
    for (const [id, stats] of this.stats) {
      result[id] = { ...stats };
    }
    return result;
  }

  /** Mark a provider as healthy/unhealthy */
  setHealthy(providerId: string, healthy: boolean): void {
    const stats = this.stats.get(providerId);
    if (stats) stats.healthy = healthy;
  }
}

/**
 * LoadBalancerProvider — distributes requests across providers.
 */
export class LoadBalancerProvider implements Provider {
  id: string;
  type: string = 'loadbalancer';
  name: string;
  config: any;

  private providerMap: Map<string, Provider>;
  private lbConfig: LoadBalancerConfig;
  private stats: Map<string, ProviderStats> = new Map();
  private roundRobinIndex = 0;

  constructor(
    id: string,
    name: string,
    providerMap: Map<string, Provider>,
    lbConfig: LoadBalancerConfig,
  ) {
    this.id = id;
    this.name = name;
    this.providerMap = providerMap;
    this.lbConfig = lbConfig;

    for (const providerId of providerMap.keys()) {
      this.stats.set(providerId, {
        totalCalls: 0,
        errorCount: 0,
        avgLatency: 0,
        inFlight: 0,
        healthy: true,
      });
    }
  }

  async connect(): Promise<void> {
    for (const provider of this.providerMap.values()) {
      await provider.connect();
    }
  }

  async disconnect(): Promise<void> {
    for (const provider of this.providerMap.values()) {
      await provider.disconnect();
    }
  }

  async chat(messages: ChatMessage[]): Promise<ModelResponse> {
    const providerId = this.selectProvider();
    const provider = this.providerMap.get(providerId);
    if (!provider) throw new Error(`Provider not found: ${providerId}`);

    const stats = this.stats.get(providerId);
    if (stats) stats.inFlight++;

    const start = Date.now();
    try {
      const response = await provider.chat(messages);

      if (stats) {
        stats.inFlight--;
        stats.totalCalls++;
        stats.lastSuccess = Date.now();
        stats.avgLatency = (stats.avgLatency * (stats.totalCalls - 1) + (Date.now() - start)) / stats.totalCalls;
      }

      return response;
    } catch (err: any) {
      if (stats) {
        stats.inFlight--;
        stats.totalCalls++;
        stats.errorCount++;
        stats.lastError = Date.now();
      }
      throw err;
    }
  }

  async chatWithTools(messages: ChatMessage[], tools: Tool[]): Promise<ModelResponse> {
    const providerId = this.selectProvider();
    const provider = this.providerMap.get(providerId);
    if (!provider) throw new Error(`Provider not found: ${providerId}`);

    return provider.chatWithTools(messages, tools);
  }

  private selectProvider(): string {
    const providerIds = Array.from(this.providerMap.keys());

    // Filter unhealthy providers if configured
    const available = this.lbConfig.excludeUnhealthy
      ? providerIds.filter((id) => this.stats.get(id)?.healthy ?? true)
      : providerIds;

    if (available.length === 0) return providerIds[0];

    switch (this.lbConfig.strategy || 'round-robin') {
      case 'round-robin': {
        const selected = available[this.roundRobinIndex % available.length];
        this.roundRobinIndex++;
        return selected;
      }

      case 'least-loaded': {
        return available.reduce((best, id) => {
          const stats = this.stats.get(id);
          const bestStats = this.stats.get(best);
          return stats && bestStats && stats.inFlight < bestStats.inFlight ? id : best;
        }, available[0]);
      }

      case 'weighted': {
        const weights = this.lbConfig.weights || {};
        const totalWeight = available.reduce((sum, id) => sum + (weights[id] || 1), 0);
        let random = Math.random() * totalWeight;

        for (const id of available) {
          random -= weights[id] || 1;
          if (random <= 0) return id;
        }
        return available[available.length - 1];
      }

      default:
        return available[0];
    }
  }

  getStats(): Record<string, ProviderStats> {
    const result: Record<string, ProviderStats> = {};
    for (const [id, stats] of this.stats) {
      result[id] = { ...stats };
    }
    return result;
  }
}

export function createFailoverProvider(
  id: string,
  name: string,
  providers: Map<string, Provider>,
  config: FailoverConfig,
): FailoverProvider {
  return new FailoverProvider(id, name, providers, config);
}

export function createLoadBalancerProvider(
  id: string,
  name: string,
  providers: Map<string, Provider>,
  config: LoadBalancerConfig,
): LoadBalancerProvider {
  return new LoadBalancerProvider(id, name, providers, config);
}
