import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { EventEmitter } from 'events';
import { 
  Hooks, 
  Hook, 
  HookPhase, 
  HookContext, 
  HookHandler,
  createHooks, 
  getGlobalHooks, 
  registerGlobalHook, 
  createHook 
} from '../../src/hooks/index.js';

describe('Hooks', () => {
  let hooks: Hooks;

  beforeEach(() => {
    hooks = new Hooks();
  });

  describe('constructor and initialization', () => {
    it('should create instance with all phases initialized', () => {
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

      phases.forEach(phase => {
        const phaseHooks = hooks.getHooks(phase);
        expect(phaseHooks).toEqual([]);
        expect(phaseHooks).toBeInstanceOf(Array);
      });
    });

    it('should initialize as enabled by default', () => {
      expect(hooks.isEnabled()).toBe(true);
    });

    it('should extend EventEmitter', () => {
      expect(hooks).toBeInstanceOf(EventEmitter);
    });

    it('should create empty hooks map for all phases', () => {
      const allHooks = hooks.getHooks();
      expect(allHooks).toEqual([]);
    });

    it('should allow getting hooks for each specific phase', () => {
      expect(hooks.getHooks('beforeMessage')).toEqual([]);
      expect(hooks.getHooks('afterMessage')).toEqual([]);
      expect(hooks.getHooks('beforeResponse')).toEqual([]);
      expect(hooks.getHooks('afterResponse')).toEqual([]);
      expect(hooks.getHooks('beforeTool')).toEqual([]);
      expect(hooks.getHooks('afterTool')).toEqual([]);
      expect(hooks.getHooks('onError')).toEqual([]);
      expect(hooks.getHooks('onSessionStart')).toEqual([]);
      expect(hooks.getHooks('onSessionEnd')).toEqual([]);
    });
  });

  describe('register', () => {
    it('should register a hook to the correct phase', () => {
      const handler: HookHandler = vi.fn();
      const hook: Hook = {
        name: 'test-hook',
        phase: 'beforeMessage',
        handler,
      };

      hooks.register(hook);

      const registeredHooks = hooks.getHooks('beforeMessage');
      expect(registeredHooks).toHaveLength(1);
      expect(registeredHooks[0].name).toBe('test-hook');
    });

    it('should register multiple hooks to different phases', () => {
      const handler1: HookHandler = vi.fn();
      const handler2: HookHandler = vi.fn();
      
      hooks.register({ name: 'hook1', phase: 'beforeMessage', handler: handler1 });
      hooks.register({ name: 'hook2', phase: 'afterMessage', handler: handler2 });

      expect(hooks.getHooks('beforeMessage')).toHaveLength(1);
      expect(hooks.getHooks('afterMessage')).toHaveLength(1);
      expect(hooks.getHooks('beforeResponse')).toHaveLength(0);
    });

    it('should register multiple hooks to the same phase', () => {
      const handler1: HookHandler = vi.fn();
      const handler2: HookHandler = vi.fn();
      const handler3: HookHandler = vi.fn();

      hooks.register({ name: 'hook1', phase: 'beforeMessage', handler: handler1 });
      hooks.register({ name: 'hook2', phase: 'beforeMessage', handler: handler2 });
      hooks.register({ name: 'hook3', phase: 'beforeMessage', handler: handler3 });

      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks).toHaveLength(3);
    });

    it('should sort hooks by priority in descending order', () => {
      const handlerLow: HookHandler = vi.fn();
      const handlerHigh: HookHandler = vi.fn();
      const handlerMedium: HookHandler = vi.fn();

      hooks.register({ name: 'low-priority', phase: 'beforeMessage', handler: handlerLow, priority: 10 });
      hooks.register({ name: 'high-priority', phase: 'beforeMessage', handler: handlerHigh, priority: 100 });
      hooks.register({ name: 'medium-priority', phase: 'beforeMessage', handler: handlerMedium, priority: 50 });

      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks[0].name).toBe('high-priority');
      expect(phaseHooks[1].name).toBe('medium-priority');
      expect(phaseHooks[2].name).toBe('low-priority');
    });

    it('should default priority to 0 when not specified', () => {
      const handler1: HookHandler = vi.fn();
      const handler2: HookHandler = vi.fn();

      hooks.register({ name: 'no-priority', phase: 'beforeMessage', handler: handler1 });
      hooks.register({ name: 'explicit-zero', phase: 'beforeMessage', handler: handler2, priority: 0 });

      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks).toHaveLength(2);
    });

    it('should handle hooks with negative priority', () => {
      const handler: HookHandler = vi.fn();

      hooks.register({ name: 'negative-priority', phase: 'beforeMessage', handler, priority: -50 });

      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks[0].priority).toBe(-50);
    });

    it('should allow registration to all different phases', () => {
      const handler: HookHandler = vi.fn();
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

      phases.forEach(phase => {
        hooks.register({ name: `hook-${phase}`, phase, handler });
      });

      phases.forEach(phase => {
        expect(hooks.getHooks(phase)).toHaveLength(1);
      });
    });

    it('should preserve handler reference after registration', () => {
      const handler: HookHandler = vi.fn();
      const hook: Hook = {
        name: 'handler-test',
        phase: 'beforeMessage',
        handler,
      };

      hooks.register(hook);

      const registeredHooks = hooks.getHooks('beforeMessage');
      expect(registeredHooks[0].handler).toBe(handler);
    });
  });

  describe('unregister', () => {
    it('should remove a hook by name from a specific phase', () => {
      const handler: HookHandler = vi.fn();
      hooks.register({ name: 'test-hook', phase: 'beforeMessage', handler });

      hooks.unregister('test-hook');

      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks).toHaveLength(0);
    });

    it('should remove hook from all phases', () => {
      const handler: HookHandler = vi.fn();
      const phases: HookPhase[] = ['beforeMessage', 'afterMessage', 'beforeResponse'];

      phases.forEach(phase => {
        hooks.register({ name: 'multi-phase-hook', phase, handler });
      });

      hooks.unregister('multi-phase-hook');

      phases.forEach(phase => {
        expect(hooks.getHooks(phase)).toHaveLength(0);
      });
    });

    it('should not affect other hooks when removing one', () => {
      const handler1: HookHandler = vi.fn();
      const handler2: HookHandler = vi.fn();

      hooks.register({ name: 'hook1', phase: 'beforeMessage', handler: handler1 });
      hooks.register({ name: 'hook2', phase: 'beforeMessage', handler: handler2 });

      hooks.unregister('hook1');

      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks).toHaveLength(1);
      expect(phaseHooks[0].name).toBe('hook2');
    });

    it('should handle unregistering non-existent hook gracefully', () => {
      expect(() => hooks.unregister('non-existent')).not.toThrow();
    });

    it('should handle empty hooks when unregistering', () => {
      expect(() => hooks.unregister('any-hook')).not.toThrow();
    });

    it('should unregister only the specified name', () => {
      const handler1: HookHandler = vi.fn();
      const handler2: HookHandler = vi.fn();
      const handler3: HookHandler = vi.fn();

      hooks.register({ name: 'hook1', phase: 'beforeMessage', handler: handler1 });
      hooks.register({ name: 'hook2', phase: 'beforeMessage', handler: handler2 });
      hooks.register({ name: 'hook3', phase: 'beforeMessage', handler: handler3 });

      hooks.unregister('hook2');

      const remainingHooks = hooks.getHooks('beforeMessage');
      expect(remainingHooks).toHaveLength(2);
      expect(remainingHooks.map(h => h.name)).toEqual(['hook1', 'hook3']);
    });
  });

  describe('execute', () => {
    it('should execute all hooks for a given phase', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      hooks.register({ name: 'hook1', phase: 'beforeMessage', handler: handler1 });
      hooks.register({ name: 'hook2', phase: 'beforeMessage', handler: handler2 });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(handler1).toHaveBeenCalledWith(context);
      expect(handler2).toHaveBeenCalledWith(context);
    });

    it('should execute hooks in priority order', async () => {
      const executionOrder: string[] = [];
      const handler1 = vi.fn(() => { executionOrder.push('low'); });
      const handler2 = vi.fn(() => { executionOrder.push('high'); });
      const handler3 = vi.fn(() => { executionOrder.push('medium'); });

      hooks.register({ name: 'low', phase: 'beforeMessage', handler: handler1, priority: 10 });
      hooks.register({ name: 'high', phase: 'beforeMessage', handler: handler2, priority: 100 });
      hooks.register({ name: 'medium', phase: 'beforeMessage', handler: handler3, priority: 50 });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(executionOrder).toEqual(['high', 'medium', 'low']);
    });

    it('should pass context to hook handlers', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'context-test', phase: 'beforeMessage', handler });

      const context: HookContext = {
        channel: 'telegram',
        userId: '12345',
        sessionId: 'session-1',
        metadata: { test: true },
      };

      await hooks.execute('beforeMessage', context);

      expect(handler).toHaveBeenCalledWith(context);
    });

    it('should skip disabled hooks during execution', async () => {
      const enabledHandler = vi.fn();
      const disabledHandler = vi.fn();

      hooks.register({ name: 'enabled-hook', phase: 'beforeMessage', handler: enabledHandler, enabled: true });
      hooks.register({ name: 'disabled-hook', phase: 'beforeMessage', handler: disabledHandler, enabled: false });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(enabledHandler).toHaveBeenCalled();
      expect(disabledHandler).not.toHaveBeenCalled();
    });

    it('should not execute when hooks are globally disabled', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'test-hook', phase: 'beforeMessage', handler });

      hooks.disable();
      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(handler).not.toHaveBeenCalled();
    });

    it('should execute when hooks are re-enabled', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'test-hook', phase: 'beforeMessage', handler });

      hooks.disable();
      hooks.enable();
      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(handler).toHaveBeenCalled();
    });

    it('should handle async handlers', async () => {
      const asyncHandler = vi.fn(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      hooks.register({ name: 'async-hook', phase: 'beforeMessage', handler: asyncHandler });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(asyncHandler).toHaveBeenCalled();
    });

    it('should execute for all phases correctly', async () => {
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
        const handler = vi.fn();
        hooks.register({ name: `hook-${phase}`, phase, handler });

        const context: HookContext = { metadata: {} };
        await hooks.execute(phase, context);

        expect(handler).toHaveBeenCalled();
      }
    });

    it('should handle returning void from handler', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'void-handler', phase: 'beforeMessage', handler });

      const context: HookContext = { metadata: {} };
      const result = await hooks.execute('beforeMessage', context);

      expect(result).toBeUndefined();
    });

    it('should handle empty phase execution', async () => {
      const context: HookContext = { metadata: {} };
      const result = await hooks.execute('beforeMessage', context);

      expect(result).toBeUndefined();
    });
  });

  describe('enable/disable', () => {
    it('should enable hooks', () => {
      hooks.disable();
      expect(hooks.isEnabled()).toBe(false);

      hooks.enable();
      expect(hooks.isEnabled()).toBe(true);
    });

    it('should disable hooks', () => {
      expect(hooks.isEnabled()).toBe(true);
      
      hooks.disable();
      expect(hooks.isEnabled()).toBe(false);
    });

    it('should not execute any hooks when disabled', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      hooks.register({ name: 'hook1', phase: 'beforeMessage', handler: handler1 });
      hooks.register({ name: 'hook2', phase: 'afterMessage', handler: handler2 });

      hooks.disable();

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);
      await hooks.execute('afterMessage', context);

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should allow toggling multiple times', () => {
      hooks.disable();
      hooks.disable();
      expect(hooks.isEnabled()).toBe(false);

      hooks.enable();
      hooks.enable();
      expect(hooks.isEnabled()).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should catch errors in hook handlers and continue execution', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Hook error');
      });
      const afterErrorHandler = vi.fn();

      hooks.register({ name: 'error-hook', phase: 'beforeMessage', handler: errorHandler });
      hooks.register({ name: 'after-error-hook', phase: 'beforeMessage', handler: afterErrorHandler });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(errorHandler).toHaveBeenCalled();
      expect(afterErrorHandler).toHaveBeenCalled();
    });

    it('should set error in context when hook fails', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Test error');
      });

      hooks.register({ name: 'failing-hook', phase: 'beforeMessage', handler: errorHandler });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(context.error).toBeDefined();
      expect(context.error?.message).toBe('Test error');
    });

    it('should execute onError phase when hook fails', async () => {
      const failingHandler = vi.fn(() => {
        throw new Error('Test error');
      });
      const errorHandler = vi.fn();

      hooks.register({ name: 'failing-hook', phase: 'beforeMessage', handler: failingHandler });
      hooks.register({ name: 'error-handler', phase: 'onError', handler: errorHandler });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(errorHandler).toHaveBeenCalledWith(context);
    });

    it('should execute onError hooks when hook fails', async () => {
      const failingHandler = vi.fn(() => {
        throw new Error('Test error');
      });
      const errorHandler = vi.fn();

      hooks.register({ name: 'failing-hook', phase: 'beforeMessage', handler: failingHandler });
      hooks.register({ name: 'error-handler', phase: 'onError', handler: errorHandler });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(errorHandler).toHaveBeenCalledWith(context);
    });

    it('should not crash when onError hook also fails (prevents infinite recursion)', async () => {
      const failingHandler = vi.fn(() => {
        throw new Error('Test error');
      });
      const onErrorHandler = vi.fn(() => {
        throw new Error('onError also failed');
      });

      hooks.register({ name: 'failing-hook', phase: 'beforeMessage', handler: failingHandler });
      hooks.register({ name: 'onError-hook', phase: 'onError', handler: onErrorHandler });

      const context: HookContext = { metadata: {} };
      // Should NOT throw (infinite recursion is prevented)
      await hooks.execute('beforeMessage', context);

      expect(failingHandler).toHaveBeenCalled();
      expect(onErrorHandler).toHaveBeenCalled();
      expect(context.error).toBeDefined();
    });

    it('should update error in context when multiple hooks fail', async () => {
      const firstErrorHandler = vi.fn(() => {
        throw new Error('First error');
      });
      const secondErrorHandler = vi.fn(() => {
        throw new Error('Second error');
      });

      hooks.register({ name: 'first-error', phase: 'beforeMessage', handler: firstErrorHandler });
      hooks.register({ name: 'second-error', phase: 'beforeMessage', handler: secondErrorHandler });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(context.error?.message).toBe('Second error');
    });

    it('should handle synchronous errors', async () => {
      const syncErrorHandler = vi.fn(() => {
        throw new Error('Sync error');
      });

      hooks.register({ name: 'sync-error-hook', phase: 'beforeMessage', handler: syncErrorHandler });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(context.error).toBeDefined();
    });

    it('should handle asynchronous errors', async () => {
      const asyncErrorHandler = vi.fn(async () => {
        throw new Error('Async error');
      });

      hooks.register({ name: 'async-error-hook', phase: 'beforeMessage', handler: asyncErrorHandler });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(context.error).toBeDefined();
    });

    it('should execute remaining hooks after error in one hook', async () => {
      const executionOrder: string[] = [];
      
      const handler1 = vi.fn(() => { executionOrder.push('handler1'); throw new Error('Error 1'); });
      const handler2 = vi.fn(() => { executionOrder.push('handler2'); });
      const handler3 = vi.fn(() => { executionOrder.push('handler3'); });

      hooks.register({ name: 'hook1', phase: 'beforeMessage', handler: handler1, priority: 3 });
      hooks.register({ name: 'hook2', phase: 'beforeMessage', handler: handler2, priority: 2 });
      hooks.register({ name: 'hook3', phase: 'beforeMessage', handler: handler3, priority: 1 });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(executionOrder).toEqual(['handler1', 'handler2', 'handler3']);
    });
  });

  describe('priority ordering', () => {
    it('should sort hooks with same priority by registration order', () => {
      const handler1: HookHandler = vi.fn();
      const handler2: HookHandler = vi.fn();

      hooks.register({ name: 'first', phase: 'beforeMessage', handler: handler1, priority: 50 });
      hooks.register({ name: 'second', phase: 'beforeMessage', handler: handler2, priority: 50 });

      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks[0].name).toBe('first');
      expect(phaseHooks[1].name).toBe('second');
    });

    it('should handle numeric priority values correctly', () => {
      const highPriority = 1000;
      const mediumPriority = 500;
      const lowPriority = 1;

      const handlerHigh: HookHandler = vi.fn();
      const handlerMedium: HookHandler = vi.fn();
      const handlerLow: HookHandler = vi.fn();

      hooks.register({ name: 'low', phase: 'beforeMessage', handler: handlerLow, priority: lowPriority });
      hooks.register({ name: 'high', phase: 'beforeMessage', handler: handlerHigh, priority: highPriority });
      hooks.register({ name: 'medium', phase: 'beforeMessage', handler: handlerMedium, priority: mediumPriority });

      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks[0].priority).toBe(1000);
      expect(phaseHooks[1].priority).toBe(500);
      expect(phaseHooks[2].priority).toBe(1);
    });

    it('should maintain priority ordering across multiple registrations', () => {
      const handlers: HookHandler[] = [];
      for (let i = 0; i < 10; i++) {
        handlers.push(vi.fn());
        hooks.register({ name: `hook-${i}`, phase: 'beforeMessage', handler: handlers[i], priority: i * 10 });
      }

      const phaseHooks = hooks.getHooks('beforeMessage');
      for (let i = 0; i < 10; i++) {
        expect(phaseHooks[i].name).toBe(`hook-${9 - i}`);
      }
    });
  });

  describe('getHooks', () => {
    it('should return hooks for specific phase', () => {
      const handler: HookHandler = vi.fn();
      hooks.register({ name: 'test-hook', phase: 'beforeMessage', handler });

      const beforeMessageHooks = hooks.getHooks('beforeMessage');
      expect(beforeMessageHooks).toHaveLength(1);
      expect(beforeMessageHooks[0].name).toBe('test-hook');
    });

    it('should return empty array for non-existent phase', () => {
      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks).toEqual([]);
    });

    it('should return all hooks when phase is not specified', () => {
      const handler: HookHandler = vi.fn();
      
      hooks.register({ name: 'hook1', phase: 'beforeMessage', handler });
      hooks.register({ name: 'hook2', phase: 'afterMessage', handler });
      hooks.register({ name: 'hook3', phase: 'onError', handler });

      const allHooks = hooks.getHooks();
      expect(allHooks).toHaveLength(3);
    });

    it('should return hooks with all their properties', () => {
      const handler: HookHandler = vi.fn();
      const hook: Hook = {
        name: 'full-hook',
        phase: 'beforeMessage',
        handler,
        priority: 75,
        enabled: true,
      };

      hooks.register(hook);

      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks[0]).toEqual(hook);
    });
  });

  describe('clear', () => {
    it('should remove all hooks', () => {
      const handler: HookHandler = vi.fn();
      
      hooks.register({ name: 'hook1', phase: 'beforeMessage', handler });
      hooks.register({ name: 'hook2', phase: 'afterMessage', handler });
      hooks.register({ name: 'hook3', phase: 'onError', handler });

      hooks.clear();

      expect(hooks.getHooks()).toEqual([]);
      expect(hooks.getHooks('beforeMessage')).toEqual([]);
      expect(hooks.getHooks('afterMessage')).toEqual([]);
      expect(hooks.getHooks('onError')).toEqual([]);
    });

    it('should reinitialize all phases after clear', () => {
      hooks.clear();

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

      phases.forEach(phase => {
        expect(hooks.getHooks(phase)).toEqual([]);
      });
    });

    it('should allow adding hooks after clear', () => {
      hooks.clear();

      const handler: HookHandler = vi.fn();
      hooks.register({ name: 'new-hook', phase: 'beforeMessage', handler });

      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks).toHaveLength(1);
    });
  });

  describe('HookContext', () => {
    it('should pass channel information in context', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'channel-hook', phase: 'beforeMessage', handler });

      const context: HookContext = {
        channel: 'telegram',
        userId: '12345',
        sessionId: 'session-1',
        provider: 'openai',
        metadata: {},
      };

      await hooks.execute('beforeMessage', context);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ channel: 'telegram' })
      );
    });

    it('should pass message in context for message phases', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'message-hook', phase: 'beforeMessage', handler });

      const testMessage = { text: 'Hello', from: 'user' };
      const context: HookContext = {
        message: testMessage,
        metadata: {},
      };

      await hooks.execute('beforeMessage', context);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ message: testMessage })
      );
    });

    it('should pass response in context for response phases', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'response-hook', phase: 'afterResponse', handler });

      const testResponse = { content: 'Response text' };
      const context: HookContext = {
        response: testResponse,
        metadata: {},
      };

      await hooks.execute('afterResponse', context);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ response: testResponse })
      );
    });

    it('should pass tool information in context for tool phases', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'tool-hook', phase: 'beforeTool', handler });

      const context: HookContext = {
        tool: 'calculator',
        toolArgs: { operation: 'add', a: 1, b: 2 },
        metadata: {},
      };

      await hooks.execute('beforeTool', context);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ tool: 'calculator' })
      );
    });

    it('should pass tool result in context for afterTool phase', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'tool-result-hook', phase: 'afterTool', handler });

      const context: HookContext = {
        tool: 'calculator',
        toolResult: { result: 3 },
        metadata: {},
      };

      await hooks.execute('afterTool', context);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ toolResult: { result: 3 } })
      );
    });

    it('should pass error in context for onError phase', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'error-context-hook', phase: 'onError', handler });

      const testError = new Error('Test error');
      const context: HookContext = {
        error: testError,
        metadata: {},
      };

      await hooks.execute('onError', context);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ error: testError })
      );
    });

    it('should pass metadata between hooks', async () => {
      const handler1 = vi.fn((context: HookContext) => {
        context.metadata.shared = 'value';
      });
      const handler2 = vi.fn();

      hooks.register({ name: 'hook1', phase: 'beforeMessage', handler: handler1 });
      hooks.register({ name: 'hook2', phase: 'beforeMessage', handler: handler2 });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(handler2).toHaveBeenCalledWith(
        expect.objectContaining({ metadata: { shared: 'value' } })
      );
    });
  });

  describe('createHooks factory', () => {
    it('should create a new Hooks instance', () => {
      const newHooks = createHooks();
      
      expect(newHooks).toBeInstanceOf(Hooks);
      expect(newHooks.isEnabled()).toBe(true);
    });

    it('should create independent Hooks instances', () => {
      const hooks1 = createHooks();
      const hooks2 = createHooks();

      hooks1.register({ name: 'hook1', phase: 'beforeMessage', handler: vi.fn() });

      expect(hooks1.getHooks('beforeMessage')).toHaveLength(1);
      expect(hooks2.getHooks('beforeMessage')).toHaveLength(0);
    });

    it('should create instances with all phases initialized', () => {
      const newHooks = createHooks();
      
      expect(newHooks.getHooks('beforeMessage')).toEqual([]);
      expect(newHooks.getHooks('afterMessage')).toEqual([]);
      expect(newHooks.getHooks('onError')).toEqual([]);
    });
  });

  describe('global hooks', () => {
    let globalHooksInstance: Hooks;

    beforeEach(() => {
      globalHooksInstance = getGlobalHooks();
      globalHooksInstance.clear();
    });

    it('should get global hooks instance', () => {
      const globalHooks = getGlobalHooks();
      
      expect(globalHooks).toBeInstanceOf(Hooks);
    });

    it('should return same global hooks instance', () => {
      const global1 = getGlobalHooks();
      const global2 = getGlobalHooks();
      
      expect(global1).toBe(global2);
    });

    it('should register global hook', () => {
      const handler: HookHandler = vi.fn();
      const hook: Hook = {
        name: 'global-hook',
        phase: 'beforeMessage',
        handler,
      };

      registerGlobalHook(hook);

      const phaseHooks = globalHooksInstance.getHooks('beforeMessage');
      expect(phaseHooks).toHaveLength(1);
      expect(phaseHooks[0].name).toBe('global-hook');
    });

    it('should execute global hooks', async () => {
      const handler = vi.fn();
      registerGlobalHook({ name: 'exec-global', phase: 'beforeMessage', handler });

      const context: HookContext = { metadata: {} };
      await globalHooksInstance.execute('beforeMessage', context);

      expect(handler).toHaveBeenCalled();
    });

    it('should allow multiple global hook registrations', () => {
      const handler1: HookHandler = vi.fn();
      const handler2: HookHandler = vi.fn();

      registerGlobalHook({ name: 'global1', phase: 'beforeMessage', handler: handler1 });
      registerGlobalHook({ name: 'global2', phase: 'afterMessage', handler: handler2 });

      expect(globalHooksInstance.getHooks('beforeMessage')).toHaveLength(1);
      expect(globalHooksInstance.getHooks('afterMessage')).toHaveLength(1);
    });
  });

  describe('createHook factory', () => {
    it('should create a hook with required properties', () => {
      const handler: HookHandler = vi.fn();
      const hook = createHook('test-hook', 'beforeMessage', handler);

      expect(hook.name).toBe('test-hook');
      expect(hook.phase).toBe('beforeMessage');
      expect(hook.handler).toBe(handler);
    });

    it('should create hook with priority when provided', () => {
      const handler: HookHandler = vi.fn();
      const hook = createHook('priority-hook', 'beforeMessage', handler, 75);

      expect(hook.priority).toBe(75);
    });

    it('should create hook without priority when not provided', () => {
      const handler: HookHandler = vi.fn();
      const hook = createHook('no-priority-hook', 'beforeMessage', handler);

      expect(hook.priority).toBeUndefined();
    });

    it('should create hook for all phases', () => {
      const handler: HookHandler = vi.fn();
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

      phases.forEach(phase => {
        const hook = createHook(`hook-${phase}`, phase, handler);
        expect(hook.phase).toBe(phase);
      });
    });

    it('should allow using created hook with Hooks.register', async () => {
      const handler = vi.fn();
      const hook = createHook('factory-hook', 'beforeMessage', handler, 50);

      const testHooks = new Hooks();
      testHooks.register(hook);

      const context: HookContext = { metadata: {} };
      await testHooks.execute('beforeMessage', context);

      expect(handler).toHaveBeenCalled();
    });

    it('should create hook with default enabled state', () => {
      const handler: HookHandler = vi.fn();
      const hook = createHook('enabled-hook', 'beforeMessage', handler);

      expect(hook.enabled).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined context metadata', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'metadata-edge', phase: 'beforeMessage', handler });

      const context: HookContext = { metadata: { key: 'value' } };
      await hooks.execute('beforeMessage', context);

      expect(handler).toHaveBeenCalledWith(context);
    });

    it('should handle context without optional fields', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'minimal-context', phase: 'beforeMessage', handler });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(handler).toHaveBeenCalledWith(context);
    });

    it('should handle very long hook names', () => {
      const longName = 'a'.repeat(1000);
      const handler: HookHandler = vi.fn();
      
      hooks.register({ name: longName, phase: 'beforeMessage', handler });

      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks[0].name).toHaveLength(1000);
    });

    it('should handle large number of hooks', () => {
      const handler: HookHandler = vi.fn();
      
      for (let i = 0; i < 100; i++) {
        hooks.register({ name: `hook-${i}`, phase: 'beforeMessage', handler, priority: i });
      }

      const phaseHooks = hooks.getHooks('beforeMessage');
      expect(phaseHooks).toHaveLength(100);
      expect(phaseHooks[0].name).toBe('hook-99');
    });

    it('should handle concurrent execute calls', async () => {
      const handler = vi.fn();
      hooks.register({ name: 'concurrent-hook', phase: 'beforeMessage', handler });

      const context: HookContext = { metadata: {} };
      
      await Promise.all([
        hooks.execute('beforeMessage', context),
        hooks.execute('beforeMessage', context),
        hooks.execute('beforeMessage', context),
      ]);

      expect(handler).toHaveBeenCalledTimes(3);
    });

    it('should handle hooks that modify context extensively', async () => {
      const handler1 = vi.fn((ctx: HookContext) => {
        ctx.metadata.step1 = true;
        ctx.metadata.data = { nested: { value: 1 } };
      });
      const handler2 = vi.fn((ctx: HookContext) => {
        ctx.metadata.step2 = true;
      });

      hooks.register({ name: 'hook1', phase: 'beforeMessage', handler: handler1 });
      hooks.register({ name: 'hook2', phase: 'beforeMessage', handler: handler2 });

      const context: HookContext = { metadata: {} };
      await hooks.execute('beforeMessage', context);

      expect(context.metadata.step1).toBe(true);
      expect(context.metadata.step2).toBe(true);
      expect(context.metadata.data).toEqual({ nested: { value: 1 } });
    });
  });
});

describe('Hook types', () => {
  describe('HookPhase', () => {
    it('should include all required phases', () => {
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

      phases.forEach(phase => {
        const hook: Hook = {
          name: 'test',
          phase,
          handler: vi.fn(),
        };
        expect(hook.phase).toBe(phase);
      });
    });
  });

  describe('HookHandler', () => {
    it('should allow synchronous handlers', () => {
      const syncHandler: HookHandler = (context) => {
        context.metadata.sync = true;
      };

      const context: HookContext = { metadata: {} };
      const result = syncHandler(context);

      expect(result).toBeUndefined();
      expect(context.metadata.sync).toBe(true);
    });

    it('should allow async handlers', async () => {
      const asyncHandler: HookHandler = async (context) => {
        await Promise.resolve();
        context.metadata.async = true;
      };

      const context: HookContext = { metadata: {} };
      await asyncHandler(context);

      expect(context.metadata.async).toBe(true);
    });
  });

  describe('Hook interface', () => {
    it('should allow optional priority', () => {
      const hook: Hook = {
        name: 'no-priority',
        phase: 'beforeMessage',
        handler: vi.fn(),
      };

      expect(hook.priority).toBeUndefined();
    });

    it('should allow optional enabled', () => {
      const hook: Hook = {
        name: 'no-enabled',
        phase: 'beforeMessage',
        handler: vi.fn(),
      };

      expect(hook.enabled).toBeUndefined();
    });

    it('should allow setting enabled to false explicitly', () => {
      const hook: Hook = {
        name: 'disabled',
        phase: 'beforeMessage',
        handler: vi.fn(),
        enabled: false,
      };

      expect(hook.enabled).toBe(false);
    });
  });

  describe('HookContext interface', () => {
    it('should allow partial context', () => {
      const context1: HookContext = { metadata: {} };
      const context2: HookContext = { 
        channel: 'discord', 
        userId: '123',
        metadata: {} 
      };

      expect(context1.metadata).toBeDefined();
      expect(context2.channel).toBe('discord');
    });

    it('should allow adding properties at runtime', () => {
      const context: HookContext = { metadata: {} };
      context.metadata.custom = 'value';
      (context as any).customProperty = 'test';

      expect(context.metadata.custom).toBe('value');
    });
  });
});