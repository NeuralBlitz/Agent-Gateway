export interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  required: boolean;
  timeout: number;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy';
}

export interface HealthStatus {
  overall: 'healthy' | 'unhealthy' | 'degraded';
  checks: Record<string, HealthCheckResult>;
}

export interface HealthChecker {
  register(check: HealthCheck): void;
  check(): Promise<HealthStatus>;
  unregister(name: string): boolean;
  getLastStatus(): HealthStatus | undefined;
}

export function createHealthChecker(): HealthChecker {
  const checks = new Map<string, HealthCheck>();
  let lastStatus: HealthStatus | undefined;

  return {
    register(check: HealthCheck) {
      checks.set(check.name, check);
    },
    async check(): Promise<HealthStatus> {
      const results: Record<string, HealthCheckResult> = {};
      let hasRequiredFailure = false;
      let hasOptionalFailure = false;

      for (const [name, { check: fn, required }] of checks) {
        try {
          const ok = await fn();
          results[name] = { status: ok ? 'healthy' : 'unhealthy' };
          if (!ok) {
            if (required) hasRequiredFailure = true;
            else hasOptionalFailure = true;
          }
        } catch {
          results[name] = { status: 'unhealthy' };
          if (required) hasRequiredFailure = true;
          else hasOptionalFailure = true;
        }
      }

      let overall: 'healthy' | 'unhealthy' | 'degraded';
      if (hasRequiredFailure) {
        overall = 'unhealthy';
      } else if (hasOptionalFailure) {
        overall = 'degraded';
      } else {
        overall = 'healthy';
      }

      lastStatus = { overall, checks: results };
      return lastStatus;
    },
    unregister(name: string): boolean {
      return checks.delete(name);
    },
    getLastStatus() {
      return lastStatus;
    },
  };
}
