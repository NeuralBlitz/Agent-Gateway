# Failover (`src/failover/`)

> **Failover chains and load balancing — provider redundancy and traffic distribution.**

---

## Overview

The `failover/` module provides two patterns for provider resilience and scaling:

1. **FailoverProvider**: An ordered fallback chain — if the primary provider fails, automatically try the next one.
2. **LoadBalancerProvider**: Distribute requests across multiple providers using configurable strategies (round-robin, least-loaded, weighted).

These patterns ensure high availability and optimal resource utilization when running Agent Gateway with multiple AI providers.

---

## File Structure

```
failover/
└── index.ts    # FailoverProvider + LoadBalancerProvider
```

---

## FailoverProvider

### Overview

The `FailoverProvider` wraps multiple providers in an ordered chain. When the primary provider fails, it automatically tries the next provider in sequence.

### Configuration

```typescript
new FailoverProvider([
  { provider: openaiProvider, timeout: 10000 },
  { provider: anthropicProvider, timeout: 15000 },
  { provider: googleProvider, timeout: 10000 },
]);
```

| Parameter | Description |
|-----------|-------------|
| `provider` | The provider to try |
| `timeout` | Max ms to wait before considering this provider failed |

### Execution Flow

```
Request → Provider 1 (primary)
             │
        ┌────┴────┐
        │         │
     Success    Failed/Timeout
        │         │
        │         ▼
        │    Provider 2 (fallback)
        │         │
        │    ┌────┴────┐
        │    │         │
        │ Success    Failed
        │    │         │
        │    │         ▼
        │    Provider 3 (last resort)
        │         │
        ▼    ┌────┴────┐
    Return  │         │
   Response Success  Failed → Throw last error
```

### Implementation

```typescript
class FailoverProvider implements Provider {
  id = 'failover';
  type = 'failover';

  constructor(
    private providers: Array<{ provider: Provider; timeout: number }>
  ) {}

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ModelResponse> {
    const errors: Error[] = [];

    for (const { provider, timeout } of this.providers) {
      try {
        return await pTimeout(
          provider.chat(messages, options),
          { timeout }
        );
      } catch (error) {
        errors.push(error as Error);
        logger.warn(
          { provider: provider.id, error: error.message },
          'Provider failed, trying next'
        );
      }
    }

    throw new Error(
      `All ${this.providers.length} providers failed. Last error: ${errors[errors.length - 1]?.message}`
    );
  }
}
```

### Health Tracking

The FailoverProvider tracks per-provider health:

```typescript
interface ProviderHealth {
  totalRequests: number;
  failedRequests: number;
  lastFailure: Date | null;
  consecutiveFailures: number;
  errorRate: number; // failedRequests / totalRequests
}
```

Providers with high error rates can be temporarily skipped:

```typescript
// Skip providers with > 80% error rate in last 10 requests
const healthyProviders = this.providers.filter(({ provider }) => {
  const health = this.getHealth(provider.id);
  return health.errorRate < 0.8;
});
```

### Use Cases

| Scenario | Configuration |
|----------|--------------|
| **Cost optimization** | Primary: Ollama (free), Fallback: OpenAI (paid) |
| **High availability** | Primary: OpenAI, Fallback: Anthropic, Last: Google |
| **Quality priority** | Primary: Claude Opus, Fallback: GPT-4o, Last: Gemini |
| **Regional resilience** | Primary: US endpoint, Fallback: EU endpoint |

---

## LoadBalancerProvider

### Overview

The `LoadBalancerProvider` distributes requests across multiple providers using configurable strategies. This spreads the load, reduces per-provider rate limiting, and enables A/B testing.

### Load Balancing Strategies

| Strategy | Description | Best For |
|----------|-------------|----------|
| `round-robin` | Cycle through providers in order | Even distribution |
| `least-loaded` | Choose provider with fewest active requests | Latency optimization |
| `weighted` | Distribute based on configured weights | Cost/quality tradeoffs |
| `random` | Random selection | Simple distribution |

### Configuration

```typescript
new LoadBalancerProvider(
  [
    { provider: openaiProvider, weight: 3 },
    { provider: anthropicProvider, weight: 1 },
    { provider: ollamaProvider, weight: 2 },
  ],
  'weighted' // Strategy
);
```

### Round-Robin Strategy

```
Request 1 → Provider A
Request 2 → Provider B
Request 3 → Provider C
Request 4 → Provider A
Request 5 → Provider B
...
```

Simple, fair distribution. Works well when all providers have similar capacity.

### Least-Loaded Strategy

```
Request 1 → Provider A (0 active)
Request 2 → Provider B (0 active)
Request 3 → Provider A (1 active, B also 1, C also 0 → C)
Request 4 → Provider C (1 active, all equal → A)
```

Chooses the provider with the fewest currently active requests. Best for minimizing latency when providers have different response speeds.

### Weighted Strategy

```
Provider A (weight: 3) → Gets 3 out of every 6 requests (50%)
Provider B (weight: 1) → Gets 1 out of every 6 requests (17%)
Provider C (weight: 2) → Gets 2 out of every 6 requests (33%)
```

Distributes based on configured weights. Useful for:
- Sending most traffic to cheap providers (Ollama)
- Sending some traffic to premium providers (Claude Opus) for quality sampling
- Gradual migration between providers

### Implementation

```typescript
class LoadBalancerProvider implements Provider {
  id = 'load-balancer';
  type = 'load-balancer';

  private currentIndex = 0;
  private activeRequests = new Map<string, number>();

  constructor(
    private providers: Array<{ provider: Provider; weight?: number }>,
    private strategy: 'round-robin' | 'least-loaded' | 'weighted' | 'random' = 'round-robin'
  ) {}

  private selectProvider(): Provider {
    switch (this.strategy) {
      case 'round-robin':
        return this.selectRoundRobin();
      case 'least-loaded':
        return this.selectLeastLoaded();
      case 'weighted':
        return this.selectWeighted();
      case 'random':
        return this.selectRandom();
    }
  }

  private selectRoundRobin(): Provider {
    const provider = this.providers[this.currentIndex % this.providers.length].provider;
    this.currentIndex++;
    return provider;
  }

  private selectLeastLoaded(): Provider {
    return this.providers
      .sort((a, b) => (this.activeRequests.get(a.provider.id) || 0) - (this.activeRequests.get(b.provider.id) || 0))
      [0].provider;
  }

  private selectWeighted(): Provider {
    const totalWeight = this.providers.reduce((sum, p) => sum + (p.weight || 1), 0);
    let random = Math.random() * totalWeight;

    for (const { provider, weight } of this.providers) {
      random -= weight || 1;
      if (random <= 0) return provider;
    }
    return this.providers[0].provider;
  }

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ModelResponse> {
    const provider = this.selectProvider();
    const active = (this.activeRequests.get(provider.id) || 0) + 1;
    this.activeRequests.set(provider.id, active);

    try {
      return await provider.chat(messages, options);
    } finally {
      this.activeRequests.set(provider.id, active - 1);
    }
  }
}
```

---

## Provider Health Monitoring

Both failover and load balancer track per-provider health:

```typescript
interface ProviderStats {
  id: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatency: number;
  activeRequests: number;
  errorRate: number;
  lastUsed: Date;
}
```

### `getStats()`

Returns statistics for all providers:

```typescript
const stats = balancer.getStats();
// [
//   {
//     id: 'openai',
//     totalRequests: 1500,
//     successfulRequests: 1485,
//     failedRequests: 15,
//     avgLatency: 1200,
//     activeRequests: 3,
//     errorRate: 0.01,
//     lastUsed: new Date(),
//   }
// ]
```

---

## Combining Patterns

Failover and load balancing can be combined:

```typescript
// Load balance across two failover chains
const lb = new LoadBalancerProvider([
  {
    provider: new FailoverProvider([
      { provider: openaiProvider, timeout: 10000 },
      { provider: ollamaProvider, timeout: 15000 },
    ]),
    weight: 3,
  },
  {
    provider: new FailoverProvider([
      { provider: anthropicProvider, timeout: 10000 },
      { provider: googleProvider, timeout: 10000 },
    ]),
    weight: 1,
  },
], 'weighted');
```

This setup:
1. 75% of traffic goes to the OpenAI→Ollama chain
2. 25% goes to the Anthropic→Google chain
3. Within each chain, automatic failover occurs on failure

---

## Related Documentation

- [`providers/`](../providers/README.md) — Providers being balanced/failed over
- [``](../README.md) — Circuit breaker that complements failover
- [`agents/`](../agents/README.md) — Agents that use providers
- [`config/`](../config/README.md) — Configuration for provider chains
