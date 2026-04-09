# Analytics Module

## Overview

The Analytics module provides comprehensive conversation-level analytics for the Agent Gateway. It tracks usage patterns, response quality metrics, token consumption, provider performance, and generates actionable insights through statistical summaries and trend analysis.

This module is designed for operators, product managers, and platform engineers who need to understand how the gateway is being used, identify performance bottlenecks, estimate costs, and make data-driven decisions about capacity planning, provider selection, and user experience improvements.

The module operates entirely in-memory with a configurable circular buffer, making it lightweight and suitable for single-node deployments. For long-term analytics storage, events should be exported to a dedicated time-series database or data warehouse.

---

## File Structure

```
analytics/
  index.ts          # Main module: ConversationAnalytics class and factory function
```

The module is self-contained in a single `index.ts` file that exports the `ConversationAnalytics` class, supporting TypeScript interfaces, and a convenience factory function.

---

## Class / Function API

### Types

#### `ConversationMetric`

Represents a single data point for a conversation interaction.

```typescript
export interface ConversationMetric {
  timestamp: number;           // Unix timestamp (ms) when the interaction occurred
  channel: string;             // Channel name (e.g., "slack", "discord", "webchat")
  userId: string;              // User identifier
  sessionId: string;           // Session identifier
  inputLength: number;         // Character count of user input
  outputLength: number;        // Character count of AI response
  inputTokens: number;         // Token count for user input
  outputTokens: number;        // Token count for AI response
  latencyMs: number;           // End-to-end latency in milliseconds
  toolCalls: number;           // Number of tool calls made
  toolErrors: number;          // Number of tool call errors
  finishedSuccessfully: boolean; // Whether the conversation completed without error
  provider: string;            // AI provider name (e.g., "openai", "anthropic")
  model: string;               // Model identifier (e.g., "gpt-4", "claude-3")
}
```

#### `AnalyticsSummary`

Aggregated summary of conversation metrics over a time range.

```typescript
export interface AnalyticsSummary {
  totalConversations: number;     // Total conversations in the range
  totalTokens: number;            // Total input + output tokens
  avgLatencyMs: number;           // Average end-to-end latency
  avgInputLength: number;         // Average input character count
  avgOutputLength: number;        // Average output character count
  toolCallRate: number;           // Average tool calls per conversation
  toolErrorRate: number;          // Tool errors / total tool calls
  successRate: number;            // Fraction of conversations that succeeded
  topChannels: Array<{ channel: string; count: number }>;  // Top 10 channels by usage
  topUsers: Array<{ userId: string; count: number }>;      // Top 10 users by activity
  peakHours: Array<{ hour: number; count: number }>;       // Top 5 busiest hours (0-23)
  tokenCostEstimate: number;       // Estimated cost based on GPT-4 pricing
}
```

#### `TrendData`

Time-bucketed trend data for charting and visualization.

```typescript
export interface TrendData {
  period: string;           // Time period label (e.g., "24h")
  conversations: number[];  // Conversation count per bucket
  tokens: number[];         // Token count per bucket
  latency: number[];        // Average latency per bucket
}
```

### `ConversationAnalytics` Class

| Method | Signature | Description |
|--------|-----------|-------------|
| `constructor` | `(maxMetrics?: number)` | Creates a new analytics tracker. `maxMetrics` defaults to 100,000. Uses a circular buffer -- oldest metrics are dropped when capacity is reached. |
| `record` | `(metric: ConversationMetric) => void` | Records a conversation metric. Automatically evicts oldest entries when `maxMetrics` is exceeded. |
| `getSummary` | `(timeRange?: { from: number; to: number }) => AnalyticsSummary` | Generates an aggregated summary. If `timeRange` is provided, only metrics within that window are included. |
| `getTrends` | `(buckets?: number) => TrendData` | Returns trend data for the last 24 hours, divided into the specified number of buckets (default: 24, i.e., hourly). |
| `getProviderStats` | `() => Array<{ provider, model, count, avgLatencyMs, avgTokens, successRate }>` | Returns per-provider/per-model performance statistics. |
| `clearOlderThan` | `(ageMs: number) => number` | Removes metrics older than the specified age. Returns the number of removed entries. |
| `getMetricCount` | `() => number` | Returns the current number of stored metrics. |

### Factory Function

```typescript
export function createConversationAnalytics(maxMetrics?: number): ConversationAnalytics
```

Convenience factory that creates a `ConversationAnalytics` instance.

---

## Configuration Options

### Constructor Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxMetrics` | `number` | `100000` | Maximum number of metrics to store in memory. Acts as a circular buffer. |

### Cost Estimation

The `tokenCostEstimate` in `AnalyticsSummary` uses hardcoded GPT-4 pricing:
- Input tokens: $2.50 per 1 million tokens
- Output tokens: $10.00 per 1 million tokens

This is a rough estimate and should be calibrated for the actual models in use.

---

## Usage Examples

### Basic Setup and Recording

```typescript
import { createConversationAnalytics } from './src/analytics/index.js';

const analytics = createConversationAnalytics(50000);

// Record a conversation metric after each interaction
analytics.record({
  timestamp: Date.now(),
  channel: 'slack',
  userId: 'user-42',
  sessionId: 'sess-abc123',
  inputLength: 150,
  outputLength: 500,
  inputTokens: 40,
  outputTokens: 350,
  latencyMs: 2500,
  toolCalls: 2,
  toolErrors: 0,
  finishedSuccessfully: true,
  provider: 'openai',
  model: 'gpt-4-turbo',
});
```

### Generating a Summary

```typescript
// Summary of all recorded metrics
const summary = analytics.getSummary();
console.log(`Total conversations: ${summary.totalConversations}`);
console.log(`Average latency: ${summary.avgLatencyMs}ms`);
console.log(`Success rate: ${(summary.successRate * 100).toFixed(1)}%`);
console.log(`Estimated token cost: $${summary.tokenCostEstimate.toFixed(2)}`);

// Summary for a specific time range
const oneHourAgo = Date.now() - 60 * 60 * 1000;
const recentSummary = analytics.getSummary({ from: oneHourAgo, to: Date.now() });
```

### Getting Trend Data

```typescript
// Hourly trends for the last 24 hours (default)
const hourlyTrends = analytics.getTrends(24);
console.log(hourlyTrends.conversations); // [12, 8, 5, 3, ...]
console.log(hourlyTrends.latency);       // [2500, 2800, 2200, ...]

// 15-minute buckets (96 buckets in 24 hours)
const fineGrained = analytics.getTrends(96);
```

### Provider Performance Comparison

```typescript
const providerStats = analytics.getProviderStats();

for (const stat of providerStats) {
  console.log(
    `${stat.provider}/${stat.model}: ` +
    `count=${stat.count}, ` +
    `avgLatency=${stat.avgLatencyMs}ms, ` +
    `avgTokens=${stat.avgTokens}, ` +
    `successRate=${(stat.successRate * 100).toFixed(1)}%`
  );
}
// Example output:
// openai/gpt-4-turbo: count=1500, avgLatency=2300ms, avgTokens=400, successRate=98.5%
// anthropic/claude-3-sonnet: count=800, avgLatency=1800ms, avgTokens=380, successRate=99.1%
```

### Cleaning Old Data

```typescript
// Remove metrics older than 1 hour
const removed = analytics.clearOlderThan(60 * 60 * 1000);
console.log(`Removed ${removed} old metrics`);
```

### Integration with Express Route

```typescript
import express from 'express';
import { createConversationAnalytics } from './src/analytics/index.js';

const app = express();
const analytics = createConversationAnalytics();

// Admin endpoint to view analytics
app.get('/admin/analytics/summary', (_req, res) => {
  res.json(analytics.getSummary());
});

app.get('/admin/analytics/trends', (req, res) => {
  const buckets = parseInt(req.query.buckets as string) || 24;
  res.json(analytics.getTrends(buckets));
});

app.get('/admin/analytics/providers', (_req, res) => {
  res.json(analytics.getProviderStats());
});
```

---

## Integration Points

| Module | Integration |
|--------|-------------|
| `../infra` | Uses `logger` for operational logging |
| API Gateway | Metrics should be recorded by the gateway after each request/response cycle |
| API Proxy | The proxy layer can record tool calls, errors, and latency metrics |
| Admin Module | Admin endpoints can expose analytics summaries and trends |
| Provider Manager | Provider selection and performance data feeds into analytics |

---

## Data Flow

```
[User Message] --> [Gateway Routes] --> [Provider] --> [Response]
                                                   |
                                          [Record Metric]
                                                   |
                                          [ConversationAnalytics.record()]
                                                   |
                                    +-----------------------------+
                                    |  In-Memory Metric Store     |
                                    |  (Circular Buffer, 100K)    |
                                    +-----------------------------+
                                                   |
                                    +-----------------------------+
                                    |  Analytics API              |
                                    |  - getSummary()             |
                                    |  - getTrends()              |
                                    |  - getProviderStats()       |
                                    +-----------------------------+
```

---

## Error Handling

- **Empty dataset**: When no metrics have been recorded, `getSummary()` returns a summary with all zero values and empty arrays. `getTrends()` returns empty arrays.
- **Circular buffer overflow**: When `maxMetrics` is exceeded, the oldest metric is silently removed. No error is thrown.
- **Division by zero**: The module guards against division by zero in all aggregations (`toolErrorRate`, `successRate`, `avgLatencyMs`).

---

## Performance Characteristics

- **Memory**: Each `ConversationMetric` is approximately 300-400 bytes. At 100,000 metrics, this uses roughly 30-40 MB of RAM.
- **`record()`**: O(1) amortized (push to array, occasional shift).
- **`getSummary()`**: O(n) where n is the number of metrics in the time range. Involves multiple passes for aggregation.
- **`getTrends()`**: O(n) -- single pass through all metrics to bucket them.
- **`getProviderStats()`**: O(n) -- single pass to aggregate by provider:model key.

For high-throughput gateways processing thousands of requests per second, consider:
1. Sampling (record every Nth request)
2. Periodic export to an external time-series database (Prometheus, InfluxDB)
3. Reducing `maxMetrics` to control memory

---

## Metrics Tracked

The module tracks the following dimensions per conversation:

| Dimension | Description | Use Case |
|-----------|-------------|----------|
| `channel` | Communication channel | Identify which channels drive most traffic |
| `userId` | User identifier | Detect power users, abuse patterns |
| `inputTokens` / `outputTokens` | Token consumption | Cost estimation, capacity planning |
| `latencyMs` | End-to-end latency | SLA monitoring, provider comparison |
| `toolCalls` / `toolErrors` | Tool usage | Agent effectiveness, debugging |
| `finishedSuccessfully` | Outcome | Overall system reliability |
| `provider` / `model` | AI backend | Provider performance comparison |

---

## Related Documentation

- [Admin Module](../admin/README.md) — Admin endpoints that can expose analytics data
- [API Gateway Module](../api-gateway/README.md) — Where metrics are collected from
- [Advanced Rate Limiter](../advanced-rate-limiter/README.md) — Complementary traffic management
- [Audit Module](../audit/README.md) — Security audit trails vs. usage analytics
