import { EventEmitter } from 'events';
import { logger } from '../infra/logger.js';

export type HookPhase = 
  | 'beforeMessage' 
  | 'afterMessage' 
  | 'beforeResponse' 
  | 'afterResponse'
  | 'beforeTool'
  | 'afterTool'
  | 'onError'
  | 'onSessionStart'
  | 'onSessionEnd';

export interface HookContext {
  channel?: string;
  userId?: string;
  sessionId?: string;
  provider?: string;
  message?: any;
  response?: any;
  tool?: string;
  toolArgs?: Record<string, any>;
  toolResult?: any;
  error?: Error;
  metadata: Record<string, any>;
}

export type HookHandler = (context: HookContext) => Promise<void> | void;

export interface Hook {
  name: string;
  phase: HookPhase;
  handler: HookHandler;
  priority?: number;
  enabled?: boolean;
}

export class Hooks extends EventEmitter {
  private hooks: Map<HookPhase, Hook[]> = new Map();
  private enabled: boolean = true;

  constructor() {
    super();
    this.initializePhases();
  }

  private initializePhases(): void {
    const phases: HookPhase[] = [
      'beforeMessage',
      'afterMessage',
      'beforeResponse',
      'afterResponse',
      'beforeTool',
      'afterTool',
      'onError',
      'onSessionStart',
      'onSessionEnd',
    ];

    for (const phase of phases) {
      this.hooks.set(phase, []);
    }
  }

  register(hook: Hook): void {
    const phaseHooks = this.hooks.get(hook.phase) || [];
    phaseHooks.push(hook);
    phaseHooks.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    this.hooks.set(hook.phase, phaseHooks);
    logger.debug(`Registered hook: ${hook.name} for phase: ${hook.phase}`);
  }

  unregister(name: string): boolean {
    let found = false;
    for (const [phase, hooks] of this.hooks) {
      const beforeCount = hooks.length;
      const filtered = hooks.filter(h => h.name !== name);
      if (filtered.length < beforeCount) found = true;
      this.hooks.set(phase, filtered);
    }
    return found;
  }

  async execute(phase: HookPhase, context: HookContext): Promise<void> {
    if (!this.enabled) return;

    const phaseHooks = this.hooks.get(phase) || [];

    for (const hook of phaseHooks) {
      if (hook.enabled === false) continue;

      try {
        await hook.handler(context);
      } catch (error: any) {
        logger.error(`Hook ${hook.name} failed: ${error.message}`);
        context.error = error;
        // Only trigger onError if we're not already in onError phase (prevent infinite recursion)
        if (phase !== 'onError') {
          await this.execute('onError', context);
        }
      }
    }
  }

  enable(): void {
    this.enabled = true;
    logger.info('Hooks enabled');
  }

  disable(): void {
    this.enabled = false;
    logger.info('Hooks disabled');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getHooks(phase?: HookPhase): Hook[] {
    if (phase) {
      return this.hooks.get(phase) || [];
    }
    return Array.from(this.hooks.values()).flat();
  }

  clear(): void {
    this.initializePhases();
    logger.info('All hooks cleared');
  }

  /** List all registered hooks */
  list(): Hook[] {
    return Array.from(this.hooks.values()).flat();
  }
}

const globalHooks = new Hooks();

export function createHooks(): Hooks {
  return new Hooks();
}

export function getGlobalHooks(): Hooks {
  return globalHooks;
}

export function registerGlobalHook(hook: Hook): void {
  globalHooks.register(hook);
}

export function createHook(name: string, phase: HookPhase, handler: HookHandler, priority?: number): Hook {
  return { name, phase, handler, priority };
}