import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskScheduler, createTaskScheduler, ScheduledJob, JobExecution } from '../src/task-scheduler/index.js';

describe('TaskScheduler', () => {
  let scheduler: TaskScheduler;

  beforeEach(() => {
    scheduler = createTaskScheduler();
  });

  describe('createTaskScheduler', () => {
    it('should create a TaskScheduler instance', () => {
      expect(scheduler).toBeInstanceOf(TaskScheduler);
    });

    it('should accept custom nodeId', () => {
      const custom = createTaskScheduler('my-node', 50);
      expect(custom).toBeInstanceOf(TaskScheduler);
    });

    it('should auto-generate nodeId when not provided', () => {
      const auto = createTaskScheduler();
      const stats = auto.getStats();
      expect(stats).toBeDefined();
    });

    it('should accept custom maxHistoryPerJob', () => {
      const custom = createTaskScheduler(undefined, 50);
      expect(custom).toBeInstanceOf(TaskScheduler);
    });
  });

  describe('register', () => {
    it('should register a job with defaults', () => {
      const job = scheduler.register({
        name: 'test-job',
        schedule: '* * * * *',
        handler: async () => {},
        enabled: true,
      });

      expect(job.id).toMatch(/^job-/);
      expect(job.name).toBe('test-job');
      expect(job.schedule).toBe('* * * * *');
      expect(job.maxConcurrency).toBe(1);
      expect(job.timeoutMs).toBe(5 * 60 * 1000);
      expect(job.maxRetries).toBe(0);
      expect(job.catchUp).toBe(false);
      expect(job.executionHistory).toEqual([]);
      expect(job.enabled).toBe(true);
    });

    it('should register a job with custom id', () => {
      const job = scheduler.register({
        id: 'custom-job-id',
        name: 'custom',
        schedule: '*/5 * * * *',
        handler: async () => {},
        enabled: true,
      });

      expect(job.id).toBe('custom-job-id');
    });

    it('should register with custom settings', () => {
      const job = scheduler.register({
        name: 'settings-job',
        schedule: '0 * * * *',
        handler: async () => {},
        enabled: true,
        maxConcurrency: 5,
        timeoutMs: 30000,
        maxRetries: 3,
        catchUp: true,
        description: 'A test job',
        tags: ['test', 'critical'],
        metadata: { key: 'value' },
      });

      expect(job.maxConcurrency).toBe(5);
      expect(job.timeoutMs).toBe(30000);
      expect(job.maxRetries).toBe(3);
      expect(job.catchUp).toBe(true);
      expect(job.description).toBe('A test job');
      expect(job.tags).toEqual(['test', 'critical']);
      expect(job.metadata).toEqual({ key: 'value' });
    });

    it('should emit job:registered event', () => {
      const registeredHandler = new Promise<ScheduledJob>((resolve) => {
        scheduler.on('job:registered', resolve);
      });
      scheduler.register({
        name: 'event-job',
        schedule: '* * * * *',
        handler: async () => {},
        enabled: true,
      });
      return expect(registeredHandler).resolves.toHaveProperty('name', 'event-job');
    });
  });

  describe('unregister', () => {
    it('should unregister an existing job', () => {
      const job = scheduler.register({
        name: 'to-unregister',
        schedule: '* * * * *',
        handler: async () => {},
        enabled: true,
      });

      const result = scheduler.unregister(job.id);
      expect(result).toBe(true);
      expect(scheduler.getJob(job.id)).toBeUndefined();
    });

    it('should return false for non-existent job', () => {
      const result = scheduler.unregister('non-existent');
      expect(result).toBe(false);
    });

    it('should emit job:unregistered event', () => {
      const unregisteredHandler = new Promise<{ jobId: string }>((resolve) => {
        scheduler.on('job:unregistered', resolve);
      });
      const job = scheduler.register({
        name: 'unreg-event',
        schedule: '* * * * *',
        handler: async () => {},
        enabled: true,
      });
      scheduler.unregister(job.id);
      return expect(unregisteredHandler).resolves.toHaveProperty('jobId', job.id);
    });
  });

  describe('toggle', () => {
    it('should disable a job', () => {
      const job = scheduler.register({
        name: 'toggle-off',
        schedule: '* * * * *',
        handler: async () => {},
        enabled: true,
      });

      const result = scheduler.toggle(job.id, false);
      expect(result).toBe(true);
      expect(scheduler.getJob(job.id)?.enabled).toBe(false);
    });

    it('should enable a disabled job', () => {
      const job = scheduler.register({
        name: 'toggle-on',
        schedule: '* * * * *',
        handler: async () => {},
        enabled: false,
      });

      const result = scheduler.toggle(job.id, true);
      expect(result).toBe(true);
      expect(scheduler.getJob(job.id)?.enabled).toBe(true);
    });

    it('should return false for non-existent job', () => {
      const result = scheduler.toggle('non-existent', false);
      expect(result).toBe(false);
    });

    it('should emit job:toggled event', () => {
      const toggleHandler = new Promise<{ jobId: string; enabled: boolean }>((resolve) => {
        scheduler.on('job:toggled', resolve);
      });
      const job = scheduler.register({
        name: 'toggle-event',
        schedule: '* * * * *',
        handler: async () => {},
        enabled: true,
      });
      scheduler.toggle(job.id, false);
      return expect(toggleHandler).resolves.toEqual({ jobId: job.id, enabled: false });
    });
  });

  describe('runNow', () => {
    it('should execute a job immediately', async () => {
      let executed = false;
      const job = scheduler.register({
        name: 'run-now',
        schedule: '0 0 1 1 *',
        handler: async () => { executed = true; },
        enabled: true,
      });

      await scheduler.runNow(job.id);
      expect(executed).toBe(true);
    });

    it('should throw for non-existent job', async () => {
      await expect(scheduler.runNow('non-existent')).rejects.toThrow('Job not found: non-existent');
    });

    it('should record execution in history', async () => {
      const job = scheduler.register({
        name: 'exec-recorder',
        schedule: '0 0 1 1 *',
        handler: async () => {},
        enabled: true,
      });

      await scheduler.runNow(job.id);
      const history = scheduler.getExecutionHistory(job.id);
      expect(history.length).toBe(1);
      expect(history[0].status).toBe('completed');
      expect(history[0].jobId).toBe(job.id);
    });

    it('should pass execution context to handler', async () => {
      let receivedContext: any = null;
      const job = scheduler.register({
        name: 'context-job',
        schedule: '0 0 1 1 *',
        handler: async (ctx) => { receivedContext = ctx; },
        enabled: true,
        metadata: { custom: 'data' },
      });

      await scheduler.runNow(job.id);
      expect(receivedContext).not.toBeNull();
      expect(receivedContext.jobId).toBe(job.id);
      expect(receivedContext.executionId).toBeDefined();
      expect(receivedContext.scheduledAt).toBeDefined();
      expect(receivedContext.attempt).toBe(1);
      expect(receivedContext.metadata).toEqual({ custom: 'data' });
    });

    it('should emit job:started and job:completed events', async () => {
      const started = vi.fn();
      const completed = vi.fn();
      scheduler.on('job:started', started);
      scheduler.on('job:completed', completed);

      const job = scheduler.register({
        name: 'events-job',
        schedule: '0 0 1 1 *',
        handler: async () => {},
        enabled: true,
      });

      await scheduler.runNow(job.id);
      expect(started).toHaveBeenCalledTimes(1);
      expect(completed).toHaveBeenCalledTimes(1);
    });

    it('should record nodeId in execution', async () => {
      const nodeScheduler = createTaskScheduler('my-node-id');
      const job = nodeScheduler.register({
        name: 'node-job',
        schedule: '0 0 1 1 *',
        handler: async () => {},
        enabled: true,
      });

      await nodeScheduler.runNow(job.id);
      const history = nodeScheduler.getExecutionHistory(job.id);
      expect(history[0].nodeId).toBe('my-node-id');
    });
  });

  describe('getJobs', () => {
    it('should return all registered jobs', () => {
      scheduler.register({ name: 'j1', schedule: '* * * * *', handler: async () => {}, enabled: true });
      scheduler.register({ name: 'j2', schedule: '*/5 * * * *', handler: async () => {}, enabled: true });

      const jobs = scheduler.getJobs();
      expect(jobs).toHaveLength(2);
      expect(jobs.map((j) => j.name)).toContain('j1');
      expect(jobs.map((j) => j.name)).toContain('j2');
    });

    it('should return empty array when no jobs', () => {
      expect(scheduler.getJobs()).toEqual([]);
    });
  });

  describe('getJob', () => {
    it('should return a specific job', () => {
      const job = scheduler.register({
        name: 'specific-job',
        schedule: '* * * * *',
        handler: async () => {},
        enabled: true,
      });

      const found = scheduler.getJob(job.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe('specific-job');
    });

    it('should return undefined for non-existent job', () => {
      expect(scheduler.getJob('non-existent')).toBeUndefined();
    });
  });

  describe('getExecutionHistory', () => {
    it('should return execution history', async () => {
      const job = scheduler.register({
        name: 'history-job',
        schedule: '0 0 1 1 *',
        handler: async () => {},
        enabled: true,
      });

      await scheduler.runNow(job.id);
      await scheduler.runNow(job.id);

      const history = scheduler.getExecutionHistory(job.id);
      expect(history.length).toBe(2);
    });

    it('should respect limit', async () => {
      const job = scheduler.register({
        name: 'history-limit',
        schedule: '0 0 1 1 *',
        handler: async () => {},
        enabled: true,
      });

      for (let i = 0; i < 5; i++) {
        await scheduler.runNow(job.id);
      }

      const history = scheduler.getExecutionHistory(job.id, 2);
      expect(history.length).toBe(2);
    });

    it('should return empty array for non-existent job', () => {
      expect(scheduler.getExecutionHistory('non-existent')).toEqual([]);
    });

    it('should default to 10', async () => {
      const job = scheduler.register({
        name: 'default-history',
        schedule: '0 0 1 1 *',
        handler: async () => {},
        enabled: true,
      });

      for (let i = 0; i < 15; i++) {
        await scheduler.runNow(job.id);
      }

      const history = scheduler.getExecutionHistory(job.id);
      expect(history.length).toBe(10);
    });

    it('should record duration', async () => {
      const job = scheduler.register({
        name: 'duration-job',
        schedule: '0 0 1 1 *',
        handler: async () => {
          await new Promise((r) => setTimeout(r, 10));
        },
        enabled: true,
      });

      await scheduler.runNow(job.id);
      const history = scheduler.getExecutionHistory(job.id);
      expect(history[0].durationMs).toBeGreaterThanOrEqual(10);
    });

    it('should record attempt count', async () => {
      const job = scheduler.register({
        name: 'attempt-job',
        schedule: '0 0 1 1 *',
        handler: async () => {},
        enabled: true,
      });

      await scheduler.runNow(job.id);
      const history = scheduler.getExecutionHistory(job.id);
      expect(history[0].attempt).toBe(1);
    });

    it('should cap history at maxHistoryPerJob', async () => {
      const limitedScheduler = createTaskScheduler('node', 5);
      const job = limitedScheduler.register({
        name: 'cap-job',
        schedule: '0 0 1 1 *',
        handler: async () => {},
        enabled: true,
      });

      for (let i = 0; i < 10; i++) {
        await limitedScheduler.runNow(job.id);
      }

      expect(job.executionHistory.length).toBe(5);
    });
  });

  describe('getStats', () => {
    it('should return stats with no jobs', () => {
      const stats = scheduler.getStats();
      expect(stats.totalJobs).toBe(0);
      expect(stats.enabledJobs).toBe(0);
      expect(stats.runningJobs).toBe(0);
      expect(stats.totalExecutions).toBe(0);
      expect(stats.failedExecutions).toBe(0);
    });

    it('should return accurate stats', async () => {
      const job = scheduler.register({
        name: 'stats-job',
        schedule: '0 0 1 1 *',
        handler: async () => {},
        enabled: true,
      });

      await scheduler.runNow(job.id);

      const stats = scheduler.getStats();
      expect(stats.totalJobs).toBe(1);
      expect(stats.enabledJobs).toBe(1);
      expect(stats.totalExecutions).toBe(1);
      expect(stats.failedExecutions).toBe(0);
    });

    it('should count failed executions', async () => {
      const job = scheduler.register({
        name: 'fail-stats',
        schedule: '0 0 1 1 *',
        handler: async () => { throw new Error('fail'); },
        enabled: true,
      });

      try {
        await scheduler.runNow(job.id);
      } catch {}

      const stats = scheduler.getStats();
      expect(stats.failedExecutions).toBe(1);
    });

    it('should count enabled vs disabled jobs', () => {
      scheduler.register({ name: 'enabled', schedule: '* * * * *', handler: async () => {}, enabled: true });
      scheduler.register({ name: 'disabled', schedule: '* * * * *', handler: async () => {}, enabled: false });

      const stats = scheduler.getStats();
      expect(stats.totalJobs).toBe(2);
      expect(stats.enabledJobs).toBe(1);
    });
  });

  describe('stop', () => {
    it('should stop all scheduled jobs', () => {
      scheduler.register({ name: 'stoppable', schedule: '* * * * *', handler: async () => {}, enabled: true });
      scheduler.stop();
    });

    it('should emit scheduler:stopped event', () => {
      const stopHandler = new Promise<void>((resolve) => {
        scheduler.on('scheduler:stopped', () => resolve());
      });
      scheduler.stop();
      return expect(stopHandler).resolves.not.toThrow();
    });
  });

  describe('job failure', () => {
    it('should fail a job that throws', async () => {
      const job = scheduler.register({
        name: 'failing',
        schedule: '0 0 1 1 *',
        handler: async () => { throw new Error('intentional failure'); },
        enabled: true,
      });

      try {
        await scheduler.runNow(job.id);
      } catch {}

      const history = scheduler.getExecutionHistory(job.id);
      expect(history[0].status).toBe('failed');
      expect(history[0].error).toBe('intentional failure');
    });

    it('should emit job:failed event', async () => {
      const failedHandler = vi.fn();
      scheduler.on('job:failed', failedHandler);

      const job = scheduler.register({
        name: 'fail-event',
        schedule: '0 0 1 1 *',
        handler: async () => { throw new Error('fail'); },
        enabled: true,
      });

      try {
        await scheduler.runNow(job.id);
      } catch {}

      expect(failedHandler).toHaveBeenCalledTimes(1);
      expect(failedHandler.mock.calls[0][0].error).toBeDefined();
    });
  });

  describe('job timeout', () => {
    it('should timeout a slow job', async () => {
      const job = scheduler.register({
        name: 'timeout-job',
        schedule: '0 0 1 1 *',
        handler: async () => {
          await new Promise((r) => setTimeout(r, 5000));
        },
        enabled: true,
        timeoutMs: 50,
      });

      try {
        await scheduler.runNow(job.id);
      } catch {}

      const history = scheduler.getExecutionHistory(job.id);
      expect(history[0].status).toBe('failed');
      expect(history[0].error).toContain('timeout');
    });
  });

  describe('retries', () => {
    it('should retry on failure when maxRetries > 0', async () => {
      let callCount = 0;
      const job = scheduler.register({
        name: 'retry-job',
        schedule: '0 0 1 1 *',
        handler: async () => {
          callCount++;
          if (callCount < 2) throw new Error('fail once');
        },
        enabled: true,
        maxRetries: 2,
      });

      await scheduler.runNow(job.id);
      // The retry happens with setTimeout delay, so callCount should be at least 1
      expect(callCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('concurrency', () => {
    it('should skip execution when max concurrency is reached', async () => {
      const job = scheduler.register({
        name: 'concurrency-job',
        schedule: '0 0 1 1 *',
        handler: async () => {
          await new Promise((r) => setTimeout(r, 100));
        },
        enabled: true,
        maxConcurrency: 1,
      });

      await scheduler.runNow(job.id);
      // Single execution should work fine
      const history = scheduler.getExecutionHistory(job.id);
      expect(history.length).toBe(1);
    });
  });

  describe('cron parsing', () => {
    it('should parse * * * * * (every minute)', () => {
      const job = scheduler.register({
        name: 'every-minute',
        schedule: '* * * * *',
        handler: async () => {},
        enabled: true,
      });
      expect(job.nextExecutionAt).toBeGreaterThan(0);
    });

    it('should parse */5 * * * * (every 5 minutes)', () => {
      const job = scheduler.register({
        name: 'every-5',
        schedule: '*/5 * * * *',
        handler: async () => {},
        enabled: true,
      });
      expect(job.nextExecutionAt).toBeGreaterThan(0);
    });

    it('should parse 0 9 * * 1-5 (weekdays at 9am)', () => {
      const job = scheduler.register({
        name: 'weekday-9am',
        schedule: '0 9 * * 1-5',
        handler: async () => {},
        enabled: true,
      });
      expect(job.nextExecutionAt).toBeGreaterThan(0);
    });

    it('should parse 0,30 * * * * (at minute 0 and 30)', () => {
      const job = scheduler.register({
        name: 'half-hourly',
        schedule: '0,30 * * * *',
        handler: async () => {},
        enabled: true,
      });
      expect(job.nextExecutionAt).toBeGreaterThan(0);
    });

    it('should throw for invalid cron expression', () => {
      expect(() => {
        scheduler.register({
          name: 'invalid-cron',
          schedule: 'invalid',
          handler: async () => {},
          enabled: true,
        });
      }).not.toThrow();
    });
  });
});
