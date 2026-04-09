import { describe, it, expect } from 'vitest';
import { createConversationAnalytics } from '../src/analytics/index.js';

describe('ConversationAnalytics', () => {
  let analytics: ReturnType<typeof createConversationAnalytics>;

  beforeEach(() => {
    analytics = createConversationAnalytics(1000);
  });

  describe('record', () => {
    it('should record a metric', () => {
      analytics.record({
        timestamp: Date.now(),
        channel: 'telegram',
        userId: 'user-1',
        sessionId: 's1',
        inputLength: 50,
        outputLength: 100,
        inputTokens: 10,
        outputTokens: 20,
        latencyMs: 500,
        toolCalls: 2,
        toolErrors: 0,
        finishedSuccessfully: true,
        provider: 'openai',
        model: 'gpt-4o',
      });

      expect(analytics.getMetricCount()).toBe(1);
    });
  });

  describe('getSummary', () => {
    it('should return aggregated stats', () => {
      for (let i = 0; i < 5; i++) {
        analytics.record({
          timestamp: Date.now(),
          channel: i % 2 === 0 ? 'telegram' : 'discord',
          userId: `user-${i}`,
          sessionId: `s-${i}`,
          inputLength: 50,
          outputLength: 100,
          inputTokens: 10 + i,
          outputTokens: 20 + i,
          latencyMs: 200 + i * 50,
          toolCalls: i,
          toolErrors: 0,
          finishedSuccessfully: true,
          provider: 'openai',
          model: 'gpt-4o',
        });
      }

      expect(analytics.getMetricCount()).toBe(5);
      const summary = analytics.getSummary();
      expect(summary.totalConversations).toBe(5);
      expect(summary.totalTokens).toBeGreaterThan(0);
      expect(summary.avgLatencyMs).toBeGreaterThan(0);
      expect(summary.topChannels.length).toBeGreaterThan(0);
    });
  });

  describe('getTrends', () => {
    it('should return trend data', () => {
      const now = Date.now();
      for (let i = 0; i < 24; i++) {
        analytics.record({
          timestamp: now - (23 - i) * 3600000,
          channel: 'telegram',
          userId: 'u1',
          sessionId: `s-${i}`,
          inputLength: 50,
          outputLength: 100,
          inputTokens: 50 + i * 5,
          outputTokens: 25 + i * 3,
          latencyMs: 200,
          toolCalls: 0,
          toolErrors: 0,
          finishedSuccessfully: true,
          provider: 'openai',
          model: 'gpt-4o',
        });
      }

      const trends = analytics.getTrends(24);
      expect(trends.conversations.length).toBe(24);
    });
  });

  describe('getProviderStats', () => {
    it('should return provider breakdown', () => {
      analytics.record({
        timestamp: Date.now(),
        channel: 'test',
        userId: 'u1',
        sessionId: 's1',
        inputLength: 50,
        outputLength: 100,
        inputTokens: 100,
        outputTokens: 50,
        latencyMs: 300,
        toolCalls: 1,
        toolErrors: 0,
        finishedSuccessfully: true,
        provider: 'anthropic',
        model: 'claude-sonnet-4',
      });

      const stats = analytics.getProviderStats();
      expect(stats.length).toBeGreaterThan(0);
    });
  });
});
