/**
 * Enterprise Health Checker
 * Deep dependency health monitoring with configurable checks,
 * degradation thresholds, and automatic recovery attempts.
 */

import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  /** Whether this check is required for overall health */
  required?: boolean;
  /** Timeout in ms */
  timeout?: number;
  /** Recovery function to attempt fixing */
  recovery?: () => Promise<boolean>;
}

export interface HealthStatus {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: Record<string, { status: 'healthy' | 'unhealthy' | 'timeout'; duration: number; consecutiveFailures: number }>;
  uptime: number;
  timestamp: number;
  version?: string;
}

export class HealthChecker extends EventEmitter {
  private checks: Map<string, HealthCheck> = new Map();
  private lastStatus?: HealthStatus;
  private consecutiveFailures: Map<string, number> = new Map();
  private startTime = Date.now();

  constructor(private version?: string) {
    super();
  }

  /** Register a health check */
  register(check: HealthCheck): void {
    this.checks.set(check.name, check);
    this.consecutiveFailures.set(check.name, 0);
  }

  /** Unregister a health check */
  unregister(name: string): boolean {
    this.consecutiveFailures.delete(name);
    return this.checks.delete(name);
  }

  /** Run all health checks */
  async check(): Promise<HealthStatus> {
    const results: Record<string, { status: 'healthy' | 'unhealthy' | 'timeout'; duration: number; consecutiveFailures: number }> = {};
    let hasRequiredFailure = false;
    let hasDegraded = false;

    for (const [name, check] of this.checks) {
      const start = Date.now();
      const timeout = check.timeout || 5000;
      let healthy = false;

      try {
        healthy = await Promise.race([
          check.check(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Health check timeout')), timeout),
          ),
        ]);
      } catch {
        healthy = false;
      }

      const duration = Date.now() - start;
      const failures = this.consecutiveFailures.get(name) || 0;

      if (healthy) {
        results[name] = { status: 'healthy', duration, consecutiveFailures: 0 };
        this.consecutiveFailures.set(name, 0);

        // Emit recovery event if it was previously failing
        if (failures > 0) {
          logger.info({ check: name, failures }, `Health check recovered: ${name}`);
          this.emit('check:recovered', { name, failures });
        }
      } else {
        const newFailures = failures + 1;
        this.consecutiveFailures.set(name, newFailures);
        results[name] = { status: 'unhealthy', duration, consecutiveFailures: newFailures };

        if (check.required !== false) hasRequiredFailure = true;
        else hasDegraded = true;

        logger.warn({ check: name, failures: newFailures, duration }, `Health check failed: ${name}`);
        this.emit('check:failed', { name, failures: newFailures });

        // Attempt recovery
        if (check.recovery && newFailures >= 3) {
          try {
            const recovered = await check.recovery();
            if (recovered) {
              logger.info({ check: name }, `Recovery successful for: ${name}`);
              this.consecutiveFailures.set(name, 0);
              results[name] = { status: 'healthy', duration: Date.now() - start, consecutiveFailures: 0 };
              hasRequiredFailure = false;
              this.emit('check:recovered', { name, failures: newFailures });
            }
          } catch (err: any) {
            logger.error({ check: name, err }, `Recovery failed for: ${name}`);
          }
        }
      }
    }

    const overall: HealthStatus['overall'] = hasRequiredFailure
      ? 'unhealthy'
      : hasDegraded
      ? 'degraded'
      : 'healthy';

    this.lastStatus = {
      overall,
      checks: results,
      uptime: (Date.now() - this.startTime) / 1000,
      timestamp: Date.now(),
      version: this.version,
    };

    this.emit('status:changed', this.lastStatus);
    return this.lastStatus;
  }

  /** Get last health status */
  getLastStatus(): HealthStatus | undefined {
    return this.lastStatus;
  }

  /** Register default system checks */
  registerDefaults(): void {
    // Memory usage
    this.register({
      name: 'memory',
      required: false,
      timeout: 1000,
      check: async () => {
        const usage = process.memoryUsage();
        const heapUsedMB = usage.heapUsed / (1024 * 1024);
        return heapUsedMB < 2048; // Less than 2GB
      },
    });

    // Event loop lag
    this.register({
      name: 'event_loop',
      required: false,
      timeout: 2000,
      check: async () => {
        return new Promise<boolean>((resolve) => {
          const start = process.hrtime.bigint();
          setImmediate(() => {
            const lag = Number(process.hrtime.bigint() - start) / 1e6;
            resolve(lag < 100); // Less than 100ms lag
          });
        });
      },
    });

    // Disk space
    this.register({
      name: 'disk',
      required: false,
      timeout: 2000,
      check: async () => {
        try {
          const { statfs } = await import('fs/promises');
          const stats = await statfs(process.cwd());
          const availableGB = (stats.bavail * stats.bsize) / (1024 * 1024 * 1024);
          return availableGB > 0.5;
        } catch {
          return true;
        }
      },
    });

    // Database connectivity
    this.register({
      name: 'database',
      required: false,
      timeout: 3000,
      check: async () => {
        if (!process.env.DATABASE_URL) return true; // Not configured
        try {
          const { createClient } = await import('@libsql/client');
          const db = createClient({ url: process.env.DATABASE_URL });
          await db.execute('SELECT 1');
          return true;
        } catch {
          return false;
        }
      },
    });

    // Redis connectivity
    this.register({
      name: 'redis',
      required: false,
      timeout: 3000,
      check: async () => {
        if (!process.env.REDIS_URL) return true;
        try {
          const Redis = (await import('ioredis')).default;
          const redis = new Redis(process.env.REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
          await redis.ping();
          await redis.quit();
          return true;
        } catch {
          return false;
        }
      },
    });
  }
}

export function createHealthChecker(version?: string): HealthChecker {
  return new HealthChecker(version);
}
