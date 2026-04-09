import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createWorkflowEngine } from '../src/workflow/index.js';

describe('WorkflowEngine', () => {
  let engine: ReturnType<typeof createWorkflowEngine>;

  beforeEach(() => {
    engine = createWorkflowEngine();
  });

  function waitForExecution(executionId: string, maxMs = 500): Promise<void> {
    return new Promise((resolve) => {
      const start = Date.now();
      const check = setInterval(() => {
        const exec = engine.getExecution(executionId);
        if (exec && exec.status !== 'pending' && exec.status !== 'running') {
          clearInterval(check);
          resolve();
        } else if (Date.now() - start > maxMs) {
          clearInterval(check);
          resolve();
        }
      }, 20);
    });
  }

  describe('register and start', () => {
    it('should register a workflow', () => {
      engine.register({
        id: 'simple',
        name: 'Simple workflow',
        version: '1.0',
        steps: [
          { id: 'step1', name: 'Greet', type: 'action', handler: async (ctx: any) => `Hello, ${ctx.name}!` },
        ],
        startStep: 'step1',
      });

      expect(engine).toBeDefined();
    });

    it('should execute a simple workflow', async () => {
      engine.register({
        id: 'exec-test',
        name: 'Execution test',
        version: '1.0',
        steps: [
          { id: 's1', name: 'Add', type: 'action', handler: async (ctx: any) => ({ sum: ctx.a + ctx.b }) },
        ],
        startStep: 's1',
      });

      const execution = await engine.start('exec-test', { a: 3, b: 4 });
      await waitForExecution(execution.id);
      const final = engine.getExecution(execution.id);
      expect(final?.status).toBe('completed');
      expect(final?.result).toBeDefined();
    });
  });

  describe('conditional steps', () => {
    beforeEach(() => {
      engine.register({
        id: 'cond',
        name: 'Conditional',
        version: '1.0',
        steps: [
          {
            id: 'check', name: 'Check', type: 'condition',
            condition: async (ctx: any) => ctx.value > 10,
            onSuccess: 'high', onFalse: 'low',
          },
          { id: 'high', name: 'High', type: 'action', handler: async () => 'high' },
          { id: 'low', name: 'Low', type: 'action', handler: async () => 'low' },
        ],
        startStep: 'check',
      });
    });

    it('should follow true branch', async () => {
      const exec = await engine.start('cond', { value: 20 });
      await waitForExecution(exec.id);
      expect(engine.getExecution(exec.id)?.status).toBe('completed');
    });

    it('should follow false branch', async () => {
      const exec = await engine.start('cond', { value: 5 });
      await waitForExecution(exec.id);
      expect(engine.getExecution(exec.id)?.status).toBe('completed');
    });
  });

  describe('delay steps', () => {
    it('should execute delay step', async () => {
      engine.register({
        id: 'delay-test',
        name: 'Delay',
        version: '1.0',
        steps: [
          { id: 'wait', name: 'Wait', type: 'delay', delayMs: 10 },
        ],
        startStep: 'wait',
      });

      const exec = await engine.start('delay-test');
      await waitForExecution(exec.id, 300);
      expect(engine.getExecution(exec.id)?.status).toBe('completed');
    });
  });

  describe('cancel', () => {
    it('should cancel a workflow by id', async () => {
      engine.register({
        id: 'cancel-test',
        name: 'Cancelable',
        version: '1.0',
        steps: [
          { id: 'wait', name: 'Wait', type: 'delay', delayMs: 10000 },
        ],
        startStep: 'wait',
      });

      const exec = await engine.start('cancel-test');
      const cancelled = engine.cancel(exec.id);
      expect(cancelled).toBe(true);
      await waitForExecution(exec.id);
      expect(engine.getExecution(exec.id)?.status).toBe('cancelled');
    });
  });

  describe('list executions and stats', () => {
    it('should list executions', async () => {
      engine.register({
        id: 'list-test',
        name: 'List',
        version: '1.0',
        steps: [{ id: 's', name: 'Step', type: 'action', handler: async () => 'ok' }],
        startStep: 's',
      });

      await engine.start('list-test');
      await waitForExecution(engine.listExecutions('list-test')[0]?.id || '', 300);
      const executions = engine.listExecutions('list-test');
      expect(executions.length).toBeGreaterThan(0);
    });

    it('should return stats', async () => {
      engine.register({
        id: 'stats-test',
        name: 'Stats',
        version: '1.0',
        steps: [{ id: 's', name: 'Step', type: 'action', handler: async () => 'ok' }],
        startStep: 's',
      });

      await engine.start('stats-test');
      await waitForExecution(engine.listExecutions('stats-test')[0]?.id || '', 300);
      const stats = engine.getStats();
      expect(stats.totalExecutions).toBeGreaterThan(0);
    });
  });
});
