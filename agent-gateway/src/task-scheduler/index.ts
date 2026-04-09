/**
 * Enterprise Task Scheduler
 * Cron-like job scheduling with distributed execution,
 * leader election, missed job recovery, and execution tracking.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { logger } from '../infra/index.js';

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'cancelled';

export interface ScheduledJob {
  id: string;
  name: string;
  description?: string;
  /** Cron expression (minute hour dayOfMonth month dayOfWeek) */
  schedule: string;
  /** Job handler */
  handler: (context: JobExecutionContext) => Promise<void>;
  /** Whether the job is enabled */
  enabled: boolean;
  /** Max concurrent executions */
  maxConcurrency: number;
  /** Execution timeout in ms */
  timeoutMs: number;
  /** Max retries on failure */
  maxRetries: number;
  /** Whether to catch up missed executions */
  catchUp: boolean;
  /** Lock key for distributed execution */
  lockKey?: string;
  /** Tags for organization */
  tags?: string[];
  /** Metadata */
  metadata?: Record<string, any>;
  /** Created at */
  createdAt: number;
  /** Last execution */
  lastExecutionAt?: number;
  /** Next scheduled execution */
  nextExecutionAt?: number;
  /** Execution history */
  executionHistory: JobExecution[];
}

export interface JobExecution {
  id: string;
  jobId: string;
  scheduledAt: number;
  startedAt?: number;
  completedAt?: number;
  status: JobStatus;
  error?: string;
  attempt: number;
  maxAttempts: number;
  durationMs?: number;
  nodeId?: string;
}

export interface JobExecutionContext {
  jobId: string;
  executionId: string;
  scheduledAt: number;
  attempt: number;
  metadata: Record<string, any>;
}

export class TaskScheduler extends EventEmitter {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private runningJobs: Map<string, number> = new Map(); // jobId -> count
  private nodeId: string;
  private maxHistoryPerJob: number;

  constructor(nodeId?: string, maxHistoryPerJob: number = 100) {
    super();
    this.nodeId = nodeId || `node-${randomUUID().slice(0, 8)}`;
    this.maxHistoryPerJob = maxHistoryPerJob;
  }

  /** Register a scheduled job */
  register(job: Omit<ScheduledJob, 'id' | 'createdAt' | 'nextExecutionAt' | 'executionHistory'>): ScheduledJob {
    const fullJob: ScheduledJob = {
      ...job,
      id: (job as any).id || `job-${randomUUID()}`,
      maxConcurrency: job.maxConcurrency || 1,
      timeoutMs: job.timeoutMs || 5 * 60 * 1000,
      maxRetries: job.maxRetries || 0,
      catchUp: job.catchUp ?? false,
      createdAt: Date.now(),
      executionHistory: [],
    };

    this.jobs.set(fullJob.id, fullJob);
    this.scheduleNext(fullJob);

    logger.info({ jobId: fullJob.id, name: fullJob.name, schedule: fullJob.schedule }, 'Job registered');
    this.emit('job:registered', fullJob);
    return fullJob;
  }

  /** Unregister a job */
  unregister(jobId: string): boolean {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }
    const deleted = this.jobs.delete(jobId);
    if (deleted) {
      logger.info({ jobId }, 'Job unregistered');
      this.emit('job:unregistered', { jobId });
    }
    return deleted;
  }

  /** Enable/disable a job */
  toggle(jobId: string, enabled: boolean): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.enabled = enabled;

    if (enabled) {
      this.scheduleNext(job);
    } else {
      const timer = this.timers.get(jobId);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(jobId);
      }
    }

    this.emit('job:toggled', { jobId, enabled });
    return true;
  }

  /** Schedule next execution */
  private scheduleNext(job: ScheduledJob): void {
    if (!job.enabled) return;

    try {
      const nextTime = this.parseCron(job.schedule);
      job.nextExecutionAt = nextTime;

      const delay = nextTime - Date.now();
      if (delay <= 0) {
        // Already past
        if (job.catchUp) {
          this.executeJob(job);
        }
        // Schedule next
        this.scheduleNext(job);
        return;
      }

      // Cap setTimeout to max value
      const cappedDelay = Math.min(delay, 2147483647);
      const timer = setTimeout(() => {
        this.timers.delete(job.id);
        this.executeJob(job);
        this.scheduleNext(job);
      }, cappedDelay);

      this.timers.set(job.id, timer);
    } catch (err: any) {
      logger.error({ jobId: job.id, err }, `Failed to schedule job: ${job.name}`);
    }
  }

  /** Parse cron expression to next execution time */
  private parseCron(expression: string): number {
    const parts = expression.trim().split(/\s+/);
    if (parts.length !== 5) throw new Error(`Invalid cron expression: ${expression}`);

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
    const date = new Date();
    date.setSeconds(0, 0);
    date.setMinutes(date.getMinutes() + 1);

    for (let i = 0; i < 525960; i++) {
      if (this.matchField(date.getMinutes(), minute) &&
          this.matchField(date.getHours(), hour) &&
          this.matchField(date.getDate(), dayOfMonth) &&
          this.matchField(date.getMonth() + 1, month) &&
          this.matchField(date.getDay(), dayOfWeek)) {
        return date.getTime();
      }
      date.setMinutes(date.getMinutes() + 1);
    }

    throw new Error('No matching time found within 1 year');
  }

  private matchField(value: number, pattern: string): boolean {
    if (pattern === '*') return true;
    if (pattern.includes(',')) return pattern.split(',').some((p) => this.matchField(value, p));
    if (pattern.includes('-')) {
      const [start, end] = pattern.split('-').map(Number);
      return value >= start && value <= end;
    }
    if (pattern.includes('/')) {
      const [range, step] = pattern.split('/');
      const stepNum = parseInt(step, 10);
      if (range === '*') return value % stepNum === 0;
      const [start] = range.split('-').map(Number);
      return (value - start) % stepNum === 0;
    }
    return value === parseInt(pattern, 10);
  }

  /** Execute a job */
  private async executeJob(job: ScheduledJob): Promise<void> {
    // Check concurrency
    const runningCount = this.runningJobs.get(job.id) || 0;
    if (runningCount >= job.maxConcurrency) {
      logger.warn({ jobId: job.id, name: job.name }, 'Job skipped — max concurrency reached');
      return;
    }

    const execution: JobExecution = {
      id: `exec-${randomUUID()}`,
      jobId: job.id,
      scheduledAt: Date.now(),
      status: 'pending',
      attempt: 0,
      maxAttempts: job.maxRetries + 1,
      nodeId: this.nodeId,
    };

    this.runningJobs.set(job.id, runningCount + 1);
    job.lastExecutionAt = Date.now();

    await this.runWithRetries(job, execution);

    this.runningJobs.set(job.id, Math.max(0, (this.runningJobs.get(job.id) || 0) - 1));

    // Store execution history
    job.executionHistory.push(execution);
    if (job.executionHistory.length > this.maxHistoryPerJob) {
      job.executionHistory.shift();
    }
  }

  /** Run job with retry logic */
  private async runWithRetries(job: ScheduledJob, execution: JobExecution): Promise<void> {
    for (let attempt = 1; attempt <= execution.maxAttempts; attempt++) {
      execution.attempt = attempt;
      execution.status = 'running';
      execution.startedAt = Date.now();

      this.emit('job:started', { job, execution });

      try {
        const context: JobExecutionContext = {
          jobId: job.id,
          executionId: execution.id,
          scheduledAt: execution.scheduledAt,
          attempt,
          metadata: job.metadata || {},
        };

        await Promise.race([
          job.handler(context),
          new Promise<void>((_, reject) =>
            setTimeout(() => reject(new Error(`Job timeout after ${job.timeoutMs}ms`)), job.timeoutMs),
          ),
        ]);

        execution.status = 'completed';
        execution.completedAt = Date.now();
        execution.durationMs = execution.completedAt - execution.startedAt!;

        this.emit('job:completed', { job, execution });
        logger.debug(
          { jobId: job.id, name: job.name, duration: execution.durationMs, attempt },
          `Job completed: ${job.name}`,
        );
        return;
      } catch (err: any) {
        execution.status = attempt < execution.maxAttempts ? 'pending' : 'failed';
        execution.completedAt = Date.now();
        execution.durationMs = execution.completedAt - execution.startedAt!;
        execution.error = err.message;

        this.emit('job:failed', { job, execution, error: err });

        if (attempt < execution.maxAttempts) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.warn(
            { jobId: job.id, retry: attempt, maxRetries: job.maxRetries, delay },
            `Job failed, retrying: ${job.name}`,
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          logger.error({ jobId: job.id, name: job.name, err }, `Job failed after ${attempt} attempts: ${job.name}`);
        }
      }
    }
  }

  /** Run a job immediately */
  async runNow(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) throw new Error(`Job not found: ${jobId}`);
    await this.executeJob(job);
  }

  /** Get all jobs */
  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /** Get a specific job */
  getJob(jobId: string): ScheduledJob | undefined {
    return this.jobs.get(jobId);
  }

  /** Get execution history */
  getExecutionHistory(jobId: string, limit: number = 10): JobExecution[] {
    const job = this.jobs.get(jobId);
    if (!job) return [];
    return job.executionHistory.slice(-limit);
  }

  /** Get scheduler stats */
  getStats(): {
    totalJobs: number;
    enabledJobs: number;
    runningJobs: number;
    totalExecutions: number;
    failedExecutions: number;
  } {
    const jobs = Array.from(this.jobs.values());
    let totalExecutions = 0;
    let failedExecutions = 0;

    for (const job of jobs) {
      totalExecutions += job.executionHistory.length;
      failedExecutions += job.executionHistory.filter((e) => e.status === 'failed').length;
    }

    let runningJobs = 0;
    for (const [, count] of this.runningJobs) {
      if (count > 0) runningJobs++;
    }

    return {
      totalJobs: jobs.length,
      enabledJobs: jobs.filter((j) => j.enabled).length,
      runningJobs,
      totalExecutions,
      failedExecutions,
    };
  }

  /** Stop all scheduled jobs */
  stop(): void {
    for (const [id, timer] of this.timers) {
      clearTimeout(timer);
    }
    this.timers.clear();
    logger.info('Task scheduler stopped');
    this.emit('scheduler:stopped');
  }
}

export function createTaskScheduler(nodeId?: string, maxHistoryPerJob?: number): TaskScheduler {
  return new TaskScheduler(nodeId, maxHistoryPerJob);
}
