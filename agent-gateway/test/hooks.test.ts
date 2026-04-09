import { describe, it, expect } from 'vitest';
import { Hooks, createHook, getGlobalHooks, registerGlobalHook } from '../src/hooks/index.js';

describe('Hooks', () => {
  it('creates and registers hooks', () => {
    const hooks = new Hooks();
    const executed: string[] = [];

    hooks.register(createHook('test1', 'beforeMessage', async () => { executed.push('test1'); }));
    hooks.register(createHook('test2', 'beforeMessage', async () => { executed.push('test2'); }));

    expect(hooks.isEnabled()).toBe(true);
  });

  it('executes hooks in priority order', async () => {
    const hooks = new Hooks();
    const executed: string[] = [];

    hooks.register(createHook('low', 'beforeMessage', async () => { executed.push('low'); }, 1));
    hooks.register(createHook('high', 'beforeMessage', async () => { executed.push('high'); }, 10));
    hooks.register(createHook('mid', 'beforeMessage', async () => { executed.push('mid'); }, 5));

    await hooks.execute('beforeMessage', {});
    expect(executed).toEqual(['high', 'mid', 'low']);
  });

  it('unregisters hooks', () => {
    const hooks = new Hooks();
    hooks.register(createHook('temp', 'beforeMessage', async () => {}));
    expect(hooks.unregister('temp')).toBe(true);
  });

  it('handles errors in hooks', async () => {
    const hooks = new Hooks();
    const errors: Error[] = [];

    hooks.register(createHook('failing', 'beforeMessage', async () => { throw new Error('oops'); }));
    hooks.register(createHook('onError', 'onError', async (ctx) => { if (ctx.error) errors.push(ctx.error); }));

    await hooks.execute('beforeMessage', {});
    expect(errors.length).toBe(1);
    expect(errors[0].message).toBe('oops');
  });

  it('clears all hooks', () => {
    const hooks = new Hooks();
    hooks.register(createHook('h1', 'beforeMessage', async () => {}));
    hooks.register(createHook('h2', 'afterResponse', async () => {}));
    hooks.clear();
  });

  it('global hooks singleton works', () => {
    const hooks1 = getGlobalHooks();
    const hooks2 = getGlobalHooks();
    expect(hooks1).toBe(hooks2); // Same instance
  });

  it('registers global hooks', () => {
    const hooks = getGlobalHooks();
    const initialCount = hooks.list().length;

    registerGlobalHook(createHook('global-test', 'beforeMessage', async () => {}));
    expect(hooks.list().length).toBe(initialCount + 1);
  });
});
