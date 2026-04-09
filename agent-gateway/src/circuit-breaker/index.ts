export class CircuitOpenError extends Error {
  constructor(message = 'Circuit is open') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  recoveryTimeoutMs?: number;
}

export interface CircuitBreakerStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreaker {
  execute<T>(fn: () => Promise<T>): Promise<T>;
  getState(): CircuitState;
  open(): void;
  reset(): void;
  getStats(): CircuitBreakerStats;
}

export function createCircuitBreaker(
  name: string,
  options: CircuitBreakerOptions = {}
): CircuitBreaker {
  const { failureThreshold = 5, recoveryTimeoutMs = 30000 } = options;

  let state: CircuitState = 'closed';
  let failureCount = 0;
  let stats: CircuitBreakerStats = {
    totalCalls: 0,
    successfulCalls: 0,
    failedCalls: 0,
  };

  return {
    async execute<T>(fn: () => Promise<T>): Promise<T> {
      if (state === 'open') {
        throw new CircuitOpenError();
      }

      stats.totalCalls++;
      try {
        const result = await fn();
        stats.successfulCalls++;
        failureCount = 0;
        return result;
      } catch (error) {
        stats.failedCalls++;
        failureCount++;
        if (failureCount >= failureThreshold) {
          state = 'open';
        }
        throw error;
      }
    },
    getState() {
      return state;
    },
    open() {
      state = 'open';
    },
    reset() {
      state = 'closed';
      failureCount = 0;
    },
    getStats() {
      return stats;
    },
  };
}
