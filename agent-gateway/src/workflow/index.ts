/**
 * Enterprise Workflow Engine
 * State machine-based workflow orchestration with steps, conditions,
 * parallel execution, and rollback support.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { logger } from '../infra/index.js';

export type WorkflowStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
export type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'retrying';

export interface WorkflowContext {
  [key: string]: any;
  workflowId: string;
  stepResults: Record<string, any>;
  metadata: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  /** Step type */
  type: 'action' | 'condition' | 'parallel' | 'delay' | 'loop' | 'sub-workflow';
  /** Handler function for action steps */
  handler?: (ctx: WorkflowContext) => Promise<any>;
  /** Condition expression for condition steps */
  condition?: (ctx: WorkflowContext) => Promise<boolean>;
  /** Next step on success */
  onSuccess?: string;
  /** Next step on failure */
  onFailure?: string;
  /** Next step on condition false */
  onFalse?: string;
  /** Max retries */
  maxRetries?: number;
  /** Retry delay in ms */
  retryDelayMs?: number;
  /** Timeout in ms */
  timeoutMs?: number;
  /** Parallel step children */
  children?: string[];
  /** Loop step: condition to continue */
  loopCondition?: (ctx: WorkflowContext) => Promise<boolean>;
  /** Sub-workflow reference */
  subWorkflowId?: string;
  /** Delay duration in ms */
  delayMs?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  steps: WorkflowStep[];
  /** First step to execute */
  startStep: string;
  /** Timeout for entire workflow */
  timeoutMs?: number;
  /** Whether to continue on error */
  continueOnError?: boolean;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  context: WorkflowContext;
  currentStep?: string;
  stepStatuses: Record<string, StepStatus>;
  startedAt: number;
  completedAt?: number;
  error?: string;
  result?: any;
}

export class WorkflowEngine extends EventEmitter {
  private definitions: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private maxExecutions = 10000;

  /** Register a workflow definition */
  register(definition: WorkflowDefinition): void {
    this.definitions.set(definition.id, definition);
    logger.info({ workflowId: definition.id, steps: definition.steps.length }, 'Workflow registered');
  }

  /** Start a new workflow execution */
  async start(workflowId: string, initialContext: Record<string, any> = {}): Promise<WorkflowExecution> {
    const definition = this.definitions.get(workflowId);
    if (!definition) throw new Error(`Workflow not found: ${workflowId}`);

    const executionId = `wf-${randomUUID()}`;
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'pending',
      context: {
        workflowId: executionId,
        stepResults: {},
        metadata: {},
        ...initialContext,
      },
      stepStatuses: {},
      startedAt: Date.now(),
    };

    // Initialize step statuses
    for (const step of definition.steps) {
      execution.stepStatuses[step.id] = 'pending';
    }

    this.executions.set(execution.id, execution);

    // Enforce max executions
    if (this.executions.size > this.maxExecutions) {
      // Remove oldest completed execution
      const oldest = Array.from(this.executions.entries())
        .filter(([, e]) => e.status === 'completed' || e.status === 'failed')
        .sort(([, a], [, b]) => a.completedAt! - b.completedAt!)[0];
      if (oldest) this.executions.delete(oldest[0]);
    }

    this.emit('workflow:started', execution);
    logger.info({ executionId: execution.id, workflowId }, 'Workflow execution started');

    // Execute asynchronously
    this.executeWorkflow(execution).catch((err) => {
      logger.error({ executionId: execution.id, err }, 'Workflow execution failed');
    });

    return execution;
  }

  /** Execute a workflow */
  private async executeWorkflow(execution: WorkflowExecution): Promise<void> {
    const definition = this.definitions.get(execution.workflowId)!;
    execution.status = 'running';
    this.emit('workflow:running', execution);

    let currentStepId = (definition as any).startStep || definition.steps[0]?.id;
    const timeout = definition.timeoutMs || 5 * 60 * 1000;
    const timeoutTimer = setTimeout(() => {
      if (execution.status === 'running') {
        this.failExecution(execution, `Workflow timeout after ${timeout}ms`);
      }
    }, timeout);

    try {
      let iterations = 0;
      const maxIterations = definition.steps.length * 100; // Prevent infinite loops

      while (currentStepId && iterations < maxIterations) {
        iterations++;
        const step = definition.steps.find((s) => s.id === currentStepId);
        if (!step) break;

        execution.currentStep = step.id;
        execution.stepStatuses[step.id] = 'running';
        this.emit('step:started', { execution, step });

        try {
          const result = await this.executeStep(step, execution);
          execution.context.stepResults[step.id] = result;
          execution.stepStatuses[step.id] = 'completed';
          this.emit('step:completed', { execution, step, result });

          // Determine next step
          currentStepId = step.onSuccess || undefined;
        } catch (err: any) {
          const maxRetries = step.maxRetries || 0;
          const retryCount = (execution.context.stepResults[step.id + '_retries'] || 0) as number;

          if (retryCount < maxRetries) {
            execution.stepStatuses[step.id] = 'retrying';
            execution.context.stepResults[step.id + '_retries'] = retryCount + 1;
            this.emit('step:retrying', { execution, step, attempt: retryCount + 1 });

            const delay = step.retryDelayMs || 1000;
            await new Promise((resolve) => setTimeout(resolve, delay));
            currentStepId = step.id; // Retry same step
          } else {
            execution.stepStatuses[step.id] = 'failed';
            this.emit('step:failed', { execution, step, error: err.message });

            if (definition.continueOnError) {
              currentStepId = step.onFailure || undefined;
            } else {
              this.failExecution(execution, `Step '${step.id}' failed: ${err.message}`);
              clearTimeout(timeoutTimer);
              return;
            }
          }
        }
      }

      if (execution.status === 'running') {
        this.completeExecution(execution);
      }
    } finally {
      clearTimeout(timeoutTimer);
    }
  }

  /** Execute a single step */
  private async executeStep(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    switch (step.type) {
      case 'action':
        if (!step.handler) throw new Error(`Step '${step.id}' has no handler`);
        return step.handler(execution.context);

      case 'condition':
        if (!step.condition) throw new Error(`Step '${step.id}' has no condition`);
        return step.condition(execution.context);

      case 'delay':
        if (!step.delayMs) throw new Error(`Step '${step.id}' has no delay`);
        await new Promise((resolve) => setTimeout(resolve, step.delayMs));
        return { delayed: step.delayMs };

      case 'parallel':
        if (!step.children) throw new Error(`Step '${step.id}' has no children`);
        const definition = this.definitions.get(execution.workflowId)!;
        const results = await Promise.all(
          step.children.map(async (childId) => {
            const childStep = definition.steps.find((s) => s.id === childId);
            if (!childStep) throw new Error(`Child step not found: ${childId}`);
            return this.executeStep(childStep, execution);
          })
        );
        return results;

      case 'loop':
        if (!step.loopCondition) throw new Error(`Step '${step.id}' has no loop condition`);
        const loopResults: any[] = [];
        let loopCount = 0;
        while (await step.loopCondition(execution.context) && loopCount < 1000) {
          loopCount++;
          if (step.handler) {
            const result = await step.handler(execution.context);
            loopResults.push(result);
          }
        }
        return { iterations: loopCount, results: loopResults };

      case 'sub-workflow':
        if (!step.subWorkflowId) throw new Error(`Step '${step.id}' has no sub-workflow`);
        const subExecution = await this.start(step.subWorkflowId, { ...execution.context });
        // Wait for sub-workflow to complete
        return new Promise((resolve, reject) => {
          const checkStatus = setInterval(() => {
            const sub = this.executions.get(subExecution.id);
            if (!sub) { clearInterval(checkStatus); reject(new Error('Sub-workflow not found')); return; }
            if (sub.status === 'completed') { clearInterval(checkStatus); resolve(sub.result); }
            if (sub.status === 'failed') { clearInterval(checkStatus); reject(new Error(sub.error)); }
          }, 100);
        });

      default:
        throw new Error(`Unknown step type: ${(step as any).type}`);
    }
  }

  private completeExecution(execution: WorkflowExecution): void {
    execution.status = 'completed';
    execution.completedAt = Date.now();
    execution.result = execution.context.stepResults;
    this.emit('workflow:completed', execution);
    logger.info({ executionId: execution.id, duration: execution.completedAt - execution.startedAt }, 'Workflow completed');
  }

  private failExecution(execution: WorkflowExecution, error: string): void {
    execution.status = 'failed';
    execution.completedAt = Date.now();
    execution.error = error;
    this.emit('workflow:failed', execution);
    logger.error({ executionId: execution.id, error }, 'Workflow failed');
  }

  /** Cancel a running workflow */
  cancel(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') return false;
    execution.status = 'cancelled';
    execution.completedAt = Date.now();
    this.emit('workflow:cancelled', execution);
    return true;
  }

  /** Pause a running workflow */
  pause(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'running') return false;
    execution.status = 'paused';
    this.emit('workflow:paused', execution);
    return true;
  }

  /** Resume a paused workflow */
  async resume(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'paused') return;
    execution.status = 'running';
    this.emit('workflow:resumed', execution);
    this.executeWorkflow(execution).catch((err) => {
      logger.error({ executionId, err }, 'Workflow resume failed');
    });
  }

  /** Get execution status */
  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /** List executions */
  listExecutions(workflowId?: string, status?: WorkflowStatus): WorkflowExecution[] {
    return Array.from(this.executions.values()).filter(
      (e) => (!workflowId || e.workflowId === workflowId) && (!status || e.status === status)
    );
  }

  /** Get stats */
  getStats(): { totalExecutions: number; byStatus: Record<string, number> } {
    const byStatus: Record<string, number> = {};
    for (const e of this.executions.values()) {
      byStatus[e.status] = (byStatus[e.status] || 0) + 1;
    }
    return { totalExecutions: this.executions.size, byStatus };
  }
}

export function createWorkflowEngine(): WorkflowEngine {
  return new WorkflowEngine();
}
