/**
 * Enterprise Data Pipeline Engine
 * ETL pipeline orchestration with stages, transforms,
 * error handling, backpressure, and monitoring.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { logger } from '../infra/index.js';

export type PipelineStageType = 'extract' | 'transform' | 'filter' | 'validate' | 'enrich' | 'aggregate' | 'load' | 'custom';

export interface PipelineStage {
  id: string;
  name: string;
  type: PipelineStageType;
  description?: string;
  /** Process function */
  process: (data: any, context: PipelineContext) => Promise<any>;
  /** Batch processing function */
  processBatch?: (data: any[], context: PipelineContext) => Promise<any[]>;
  /** Batch size threshold */
  batchSize?: number;
  /** Batch timeout in ms */
  batchTimeout?: number;
  /** Max retries on failure */
  maxRetries?: number;
  /** Retry delay in ms */
  retryDelay?: number;
  /** Whether to continue on error */
  continueOnError?: boolean;
  /** Error handler */
  onError?: (error: Error, data: any, context: PipelineContext) => void;
  /** Stage dependencies */
  dependsOn?: string[];
}

export interface PipelineContext {
  pipelineId: string;
  runId: string;
  stageId?: string;
  metadata: Record<string, any>;
  startTime: number;
  recordCount: number;
  errorCount: number;
}

export interface PipelineRun {
  id: string;
  pipelineId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  stages: Array<{ stageId: string; name: string; status: string; inputCount: number; outputCount: number; durationMs?: number; error?: string }>;
  totalInput: number;
  totalOutput: number;
  totalErrors: number;
  startTime: number;
  endTime?: number;
  metadata: Record<string, any>;
}

export interface PipelineDefinition {
  id: string;
  name: string;
  description?: string;
  stages: PipelineStage[];
  /** Max concurrent stage executions */
  maxConcurrency?: number;
  /** Global error handler */
  onError?: (error: Error, stage: PipelineStage, context: PipelineContext) => void;
  /** Completion callback */
  onComplete?: (run: PipelineRun) => void;
}

export class PipelineEngine extends EventEmitter {
  private pipelines: Map<string, PipelineDefinition> = new Map();
  private runs: Map<string, PipelineRun> = new Map();
  private maxRuns = 10000;

  /** Register a pipeline */
  register(pipeline: PipelineDefinition): void {
    this.pipelines.set(pipeline.id, pipeline);
    logger.info({ pipelineId: pipeline.id, name: pipeline.name, stages: pipeline.stages.length }, 'Pipeline registered');
    this.emit('pipeline:registered', pipeline);
  }

  /** Execute a pipeline */
  async execute(pipelineId: string, input: any[], metadata: Record<string, any> = {}): Promise<PipelineRun> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) throw new Error(`Pipeline not found: ${pipelineId}`);

    const run: PipelineRun = {
      id: `run-${randomUUID()}`,
      pipelineId,
      status: 'pending',
      stages: pipeline.stages.map((s) => ({ stageId: s.id, name: s.name, status: 'pending', inputCount: 0, outputCount: 0 })),
      totalInput: input.length,
      totalOutput: 0,
      totalErrors: 0,
      startTime: Date.now(),
      metadata,
    };

    this.runs.set(run.id, run);
    this.emit('pipeline:started', run);

    try {
      run.status = 'running';
      let currentData = [...input];

      for (let i = 0; i < pipeline.stages.length; i++) {
        const stage = pipeline.stages[i];
        const stageRun = run.stages[i];

        stageRun.status = 'running';
        stageRun.inputCount = currentData.length;
        const stageStart = Date.now();

        this.emit('stage:started', { run, stage, inputCount: currentData.length });

        try {
          const processed = await this.executeStage(stage, currentData, {
            pipelineId,
            runId: run.id,
            stageId: stage.id,
            metadata,
            startTime: run.startTime,
            recordCount: 0,
            errorCount: 0,
          });

          currentData = processed.filter((d: any) => d !== null && d !== undefined);
          stageRun.outputCount = currentData.length;
          stageRun.durationMs = Date.now() - stageStart;
          stageRun.status = 'completed';

          this.emit('stage:completed', {
            run,
            stage,
            inputCount: stageRun.inputCount,
            outputCount: stageRun.outputCount,
            duration: stageRun.durationMs,
          });
        } catch (err: any) {
          stageRun.status = 'failed';
          stageRun.error = err.message;
          stageRun.durationMs = Date.now() - stageStart;
          run.totalErrors++;

          this.emit('stage:failed', { run, stage, error: err });

          if (!stage.continueOnError) {
            if (pipeline.onError) pipeline.onError(err, stage, {
              pipelineId, runId: run.id, stageId: stage.id, metadata, startTime: run.startTime, recordCount: 0, errorCount: run.totalErrors,
            });

            run.status = 'failed';
            run.endTime = Date.now();
            run.totalOutput = currentData.length;
            this.emit('pipeline:failed', run);
            this.addRun(run);
            return run;
          }

          logger.warn({ stage: stage.name, error: err.message }, 'Stage failed, continuing');
        }
      }

      run.status = 'completed';
      run.totalOutput = currentData.length;
      run.endTime = Date.now();

      const totalDuration = run.endTime - run.startTime;
      logger.info(
        { runId: run.id, inputCount: run.totalInput, outputCount: run.totalOutput, errorCount: run.totalErrors, duration: totalDuration },
        'Pipeline completed',
      );

      this.emit('pipeline:completed', run);
      if (pipeline.onComplete) pipeline.onComplete(run);
    } catch (err: any) {
      run.status = 'failed';
      run.endTime = Date.now();
      this.emit('pipeline:failed', run);
    }

    this.addRun(run);
    return run;
  }

  /** Execute a single stage */
  private async executeStage(stage: PipelineStage, data: any[], context: PipelineContext): Promise<any[]> {
    const maxRetries = stage.maxRetries || 0;

    // Batch processing
    if (stage.processBatch && data.length > (stage.batchSize || 100)) {
      return this.executeInBatches(stage, data, context);
    }

    // Individual processing
    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const results: any[] = [];
        for (const item of data) {
          context.recordCount++;
          const result = await stage.process(item, context);
          if (result !== undefined && result !== null) results.push(result);
        }
        return results;
      } catch (err: any) {
        lastError = err;
        if (attempt < maxRetries) {
          const delay = stage.retryDelay || Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /** Execute stage in batches */
  private async executeInBatches(stage: PipelineStage, data: any[], context: PipelineContext): Promise<any[]> {
    const batchSize = stage.batchSize || 100;
    const results: any[] = [];

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      context.recordCount += batch.length;

      try {
        if (stage.processBatch) {
          const batchResults = await stage.processBatch(batch, context);
          results.push(...batchResults.filter((r: any) => r !== null && r !== undefined));
        } else {
          for (const item of batch) {
            const result = await stage.process(item, context);
            if (result !== null && result !== undefined) results.push(result);
          }
        }
      } catch (err: any) {
        if (stage.onError) {
          stage.onError(err, batch, context);
        }
        // Fall back to individual
        for (const item of batch) {
          try {
            const result = await stage.process(item, context);
            if (result !== null && result !== undefined) results.push(result);
          } catch {
            context.errorCount++;
          }
        }
      }
    }

    return results;
  }

  private addRun(run: PipelineRun): void {
    this.runs.set(run.id, run);
    if (this.runs.size > this.maxRuns) {
      const oldest = Array.from(this.runs.entries())
        .filter(([, r]) => r.status === 'completed' || r.status === 'failed')
        .sort(([, a], [, b]) => (a.endTime || 0) - (b.endTime || 0))[0];
      if (oldest) this.runs.delete(oldest[0]);
    }
  }

  /** Get a run */
  getRun(runId: string): PipelineRun | undefined {
    return this.runs.get(runId);
  }

  /** List runs */
  listRuns(pipelineId?: string, status?: PipelineRun['status'], limit: number = 100): PipelineRun[] {
    let runs = Array.from(this.runs.values());
    if (pipelineId) runs = runs.filter((r) => r.pipelineId === pipelineId);
    if (status) runs = runs.filter((r) => r.status === status);
    return runs.slice(-limit).reverse();
  }

  /** Cancel a run */
  cancelRun(runId: string): boolean {
    const run = this.runs.get(runId);
    if (!run || run.status !== 'running') return false;
    run.status = 'cancelled';
    run.endTime = Date.now();
    this.emit('pipeline:cancelled', run);
    return true;
  }

  /** Get pipeline stats */
  getStats(): {
    totalPipelines: number;
    totalRuns: number;
    completedRuns: number;
    failedRuns: number;
    avgDurationMs: number;
  } {
    const runs = Array.from(this.runs.values());
    const completed = runs.filter((r) => r.status === 'completed');
    const failed = runs.filter((r) => r.status === 'failed');
    const avgDuration = completed.length > 0
      ? completed.reduce((sum, r) => sum + ((r.endTime || 0) - r.startTime), 0) / completed.length
      : 0;

    return {
      totalPipelines: this.pipelines.size,
      totalRuns: runs.length,
      completedRuns: completed.length,
      failedRuns: failed.length,
      avgDurationMs: Math.round(avgDuration),
    };
  }
}

export function createPipelineEngine(): PipelineEngine {
  return new PipelineEngine();
}
