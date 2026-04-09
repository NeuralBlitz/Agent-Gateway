export interface WorkflowNode {
  id: string;
  type: 'task' | 'condition' | 'parallel' | 'delay' | 'transform';
  config: Record<string, unknown>;
  next?: string;
  branches?: Record<string, string>;
}

export interface WorkflowEdge {
  from: string;
  to: string;
  condition?: (context: WorkflowContext) => boolean;
}

export interface WorkflowContext {
  data: Record<string, unknown>;
  variables: Record<string, unknown>;
  history: ExecutionStep[];
}

export interface ExecutionStep {
  nodeId: string;
  startTime: number;
  endTime?: number;
  result?: unknown;
  error?: string;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  entryPoint: string;
  variables: Record<string, unknown>;
}

export class WorkflowEngine {
  private definitions = new Map<string, WorkflowDefinition>();
  private executors = new Map<string, NodeExecutor>();

  registerDefinition(workflow: WorkflowDefinition): void {
    this.definitions.set(workflow.id, workflow);
  }

  registerExecutor(type: string, executor: NodeExecutor): void {
    this.executors.set(type, executor);
  }

  async execute(workflowId: string, initialData: Record<string, unknown>): Promise<WorkflowResult> {
    const workflow = this.definitions.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const context: WorkflowContext = {
      data: { ...initialData },
      variables: { ...workflow.variables },
      history: [],
    };

    let currentNodeId: string | undefined = workflow.entryPoint;
    
    while (currentNodeId) {
      const node = workflow.nodes.find(n => n.id === currentNodeId);
      if (!node) break;

      const step: ExecutionStep = {
        nodeId: node.id,
        startTime: Date.now(),
      };

      try {
        const executor = this.executors.get(node.type);
        if (!executor) {
          throw new Error(`No executor for node type: ${node.type}`);
        }

        const result = await executor.execute(node, context);
        step.result = result;
        step.endTime = Date.now();
        
        context.history.push(step);

        if (node.type === 'condition' && result !== undefined) {
          const branchKey = String(result);
          currentNodeId = node.branches?.[branchKey];
        } else if (node.next) {
          currentNodeId = node.next;
        } else {
          currentNodeId = undefined;
        }
      } catch (error) {
        step.endTime = Date.now();
        step.error = error instanceof Error ? error.message : String(error);
        context.history.push(step);
        
        return {
          success: false,
          error: step.error,
          context,
        };
      }
    }

    return { success: true, context };
  }

  getDefinition(id: string): WorkflowDefinition | undefined {
    return this.definitions.get(id);
  }

  listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.definitions.values());
  }
}

export interface WorkflowResult {
  success: boolean;
  error?: string;
  context: WorkflowContext;
}

export interface NodeExecutor {
  execute(node: WorkflowNode, context: WorkflowContext): Promise<unknown>;
}

export class TaskNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: WorkflowContext): Promise<unknown> {
    const { taskType, params } = node.config;
    
    switch (taskType) {
      case 'transform':
        return this.transform(context.data, params as Record<string, unknown>);
      case 'aggregate':
        return this.aggregate(context.data, params as Record<string, unknown>);
      case 'filter':
        return this.filter(context.data, params as Record<string, unknown>);
      default:
        return { executed: true, taskType, params };
    }
  }

  private transform(data: Record<string, unknown>, params: Record<string, unknown>): unknown {
    const { field, expression } = params;
    return { ...data, [field as string]: expression };
  }

  private aggregate(data: Record<string, unknown>, params: Record<string, unknown>): unknown {
    const items = data[params.source as string] as unknown[];
    if (!Array.isArray(items)) return data;
    
    const result = items.reduce((acc: Record<string, number>, item: unknown) => {
      const value = (item as Record<string, number>)[params.key as string] || 0;
      acc.sum = (acc.sum || 0) + value;
      acc.count = (acc.count || 0) + 1;
      return acc;
    }, {});
    
    result.avg = result.sum / result.count;
    return { ...data, [params.target as string]: result };
  }

  private filter(data: Record<string, unknown>, params: Record<string, unknown>): unknown {
    const items = data[params.source as string] as unknown[];
    if (!Array.isArray(items)) return data;
    
    const filtered = items.filter((item: unknown) => {
      const value = (item as Record<string, unknown>)[params.field as string];
      return value === params.value;
    });
    
    return { ...data, [params.target as string]: filtered };
  }
}

export class ConditionNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: WorkflowContext): Promise<unknown> {
    const { expression } = node.config;
    
    return this.evaluateExpression(expression as string, context);
  }

  private evaluateExpression(expr: string, context: WorkflowContext): unknown {
    const evaluate = new Function('data', 'variables', `with(data) { with(variables) { return ${expr}; } }`);
    try {
      return evaluate(context.data, context.variables);
    } catch {
      return false;
    }
  }
}

export class DelayNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: WorkflowContext): Promise<unknown> {
    const { durationMs } = node.config;
    await new Promise(resolve => setTimeout(resolve, durationMs as number));
    return { delayed: true, durationMs };
  }
}

export class ParallelNodeExecutor implements NodeExecutor {
  async execute(node: WorkflowNode, context: WorkflowContext): Promise<unknown> {
    const { branches } = node.config;
    const branchIds = branches as string[];
    
    const results = await Promise.all(
      branchIds.map(async (branchId) => ({ branchId, result: 'executed' }))
    );
    
    return { parallel: true, results };
  }
}

export function createWorkflowEngine(): WorkflowEngine {
  const engine = new WorkflowEngine();
  engine.registerExecutor('task', new TaskNodeExecutor());
  engine.registerExecutor('condition', new ConditionNodeExecutor());
  engine.registerExecutor('delay', new DelayNodeExecutor());
  engine.registerExecutor('parallel', new ParallelNodeExecutor());
  return engine;
}
