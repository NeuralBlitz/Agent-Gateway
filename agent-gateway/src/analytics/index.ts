/**
 * Enterprise Conversation Analytics
 * Tracks usage patterns, response quality, token consumption,
 * and generates actionable insights.
 */

import { logger } from '../infra/index.js';

export interface ConversationMetric {
  timestamp: number;
  channel: string;
  userId: string;
  sessionId: string;
  inputLength: number;
  outputLength: number;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  toolCalls: number;
  toolErrors: number;
  finishedSuccessfully: boolean;
  provider: string;
  model: string;
}

export interface AnalyticsSummary {
  totalConversations: number;
  totalTokens: number;
  avgLatencyMs: number;
  avgInputLength: number;
  avgOutputLength: number;
  toolCallRate: number;
  toolErrorRate: number;
  successRate: number;
  topChannels: Array<{ channel: string; count: number }>;
  topUsers: Array<{ userId: string; count: number }>;
  peakHours: Array<{ hour: number; count: number }>;
  tokenCostEstimate: number;
}

export interface TrendData {
  period: string;
  conversations: number[];
  tokens: number[];
  latency: number[];
}

export class ConversationAnalytics {
  private metrics: ConversationMetric[] = [];
  private maxMetrics: number;

  constructor(maxMetrics: number = 100000) {
    this.maxMetrics = maxMetrics;
  }

  /** Record a conversation metric */
  record(metric: ConversationMetric): void {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /** Generate analytics summary */
  getSummary(timeRange?: { from: number; to: number }): AnalyticsSummary {
    const filtered = timeRange
      ? this.metrics.filter((m) => m.timestamp >= timeRange!.from && m.timestamp <= timeRange!.to)
      : this.metrics;

    if (filtered.length === 0) {
      return {
        totalConversations: 0,
        totalTokens: 0,
        avgLatencyMs: 0,
        avgInputLength: 0,
        avgOutputLength: 0,
        toolCallRate: 0,
        toolErrorRate: 0,
        successRate: 0,
        topChannels: [],
        topUsers: [],
        peakHours: [],
        tokenCostEstimate: 0,
      };
    }

    // Aggregate
    const totalTokens = filtered.reduce((sum, m) => sum + m.inputTokens + m.outputTokens, 0);
    const avgLatency = filtered.reduce((sum, m) => sum + m.latencyMs, 0) / filtered.length;
    const avgInputLength = filtered.reduce((sum, m) => sum + m.inputLength, 0) / filtered.length;
    const avgOutputLength = filtered.reduce((sum, m) => sum + m.outputLength, 0) / filtered.length;
    const totalToolCalls = filtered.reduce((sum, m) => sum + m.toolCalls, 0);
    const totalToolErrors = filtered.reduce((sum, m) => sum + m.toolErrors, 0);
    const successful = filtered.filter((m) => m.finishedSuccessfully).length;

    // Top channels
    const channelCounts: Record<string, number> = {};
    for (const m of filtered) {
      channelCounts[m.channel] = (channelCounts[m.channel] || 0) + 1;
    }
    const topChannels = Object.entries(channelCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([channel, count]) => ({ channel, count }));

    // Top users
    const userCounts: Record<string, number> = {};
    for (const m of filtered) {
      userCounts[m.userId] = (userCounts[m.userId] || 0) + 1;
    }
    const topUsers = Object.entries(userCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, count }));

    // Peak hours
    const hourCounts: Record<number, number> = {};
    for (const m of filtered) {
      const hour = new Date(m.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    }
    const peakHours = Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Estimate token cost (rough: $2.50/1M input, $10/1M output for GPT-4)
    const totalInputTokens = filtered.reduce((sum, m) => sum + m.inputTokens, 0);
    const totalOutputTokens = filtered.reduce((sum, m) => sum + m.outputTokens, 0);
    const tokenCostEstimate = (totalInputTokens / 1000000) * 2.50 + (totalOutputTokens / 1000000) * 10;

    return {
      totalConversations: filtered.length,
      totalTokens,
      avgLatencyMs: Math.round(avgLatency),
      avgInputLength: Math.round(avgInputLength),
      avgOutputLength: Math.round(avgOutputLength),
      toolCallRate: filtered.length > 0 ? totalToolCalls / filtered.length : 0,
      toolErrorRate: totalToolCalls > 0 ? totalToolErrors / totalToolCalls : 0,
      successRate: filtered.length > 0 ? successful / filtered.length : 0,
      topChannels,
      topUsers,
      peakHours,
      tokenCostEstimate: Math.round(tokenCostEstimate * 100) / 100,
    };
  }

  /** Get trend data for a time period */
  getTrends(buckets: number = 24): TrendData {
    if (this.metrics.length === 0) {
      return { period: '24h', conversations: [], tokens: [], latency: [] };
    }

    const now = Date.now();
    const bucketSize = (24 * 60 * 60 * 1000) / buckets;

    const conversations = new Array(buckets).fill(0);
    const tokens = new Array(buckets).fill(0);
    const latency = new Array(buckets).fill(0);
    const latencyCounts = new Array(buckets).fill(0);

    for (const m of this.metrics) {
      const bucketIndex = Math.floor((now - m.timestamp) / bucketSize);
      if (bucketIndex >= 0 && bucketIndex < buckets) {
        conversations[buckets - 1 - bucketIndex]++;
        tokens[buckets - 1 - bucketIndex] += m.inputTokens + m.outputTokens;
        latency[buckets - 1 - bucketIndex] += m.latencyMs;
        latencyCounts[buckets - 1 - bucketIndex]++;
      }
    }

    // Average latency
    for (let i = 0; i < buckets; i++) {
      if (latencyCounts[i] > 0) {
        latency[i] = Math.round(latency[i] / latencyCounts[i]);
      }
    }

    return {
      period: '24h',
      conversations,
      tokens,
      latency,
    };
  }

  /** Get provider performance stats */
  getProviderStats(): Array<{
    provider: string;
    model: string;
    count: number;
    avgLatencyMs: number;
    avgTokens: number;
    successRate: number;
  }> {
    const stats: Record<string, { count: number; totalLatency: number; totalTokens: number; success: number }> = {};

    for (const m of this.metrics) {
      const key = `${m.provider}:${m.model}`;
      if (!stats[key]) {
        stats[key] = { count: 0, totalLatency: 0, totalTokens: 0, success: 0 };
      }
      stats[key].count++;
      stats[key].totalLatency += m.latencyMs;
      stats[key].totalTokens += m.inputTokens + m.outputTokens;
      if (m.finishedSuccessfully) stats[key].success++;
    }

    return Object.entries(stats).map(([key, s]) => ({
      provider: key.split(':')[0],
      model: key.split(':')[1],
      count: s.count,
      avgLatencyMs: Math.round(s.totalLatency / s.count),
      avgTokens: Math.round(s.totalTokens / s.count),
      successRate: s.success / s.count,
    }));
  }

  /** Clear old metrics */
  clearOlderThan(ageMs: number): number {
    const cutoff = Date.now() - ageMs;
    const before = this.metrics.length;
    this.metrics = this.metrics.filter((m) => m.timestamp >= cutoff);
    return before - this.metrics.length;
  }

  /** Get raw metrics count */
  getMetricCount(): number {
    return this.metrics.length;
  }
}

export function createConversationAnalytics(maxMetrics?: number): ConversationAnalytics {
  return new ConversationAnalytics(maxMetrics);
}
