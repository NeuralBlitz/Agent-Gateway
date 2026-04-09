import { describe, it, expect } from 'vitest';
import { Gateway, createGateway } from '../src/gateway/index.js';

describe('Gateway', () => {
  it('creates and starts', async () => {
    const gw = createGateway({ host: '0.0.0.0', port: 0 });
    expect(gw.isHealthy()).toBe(false);
    await gw.start();
    expect(gw.isHealthy()).toBe(true);
    await gw.stop();
    expect(gw.isHealthy()).toBe(false);
  });

  it('registers channels and providers', async () => {
    const gw = createGateway({ host: '0.0.0.0', port: 0 });
    const mockChannel = {
      id: 'test', type: 'test', name: 'test', connected: false,
      config: {},
      connect: async () => { (mockChannel as any).connected = true; },
      disconnect: async () => { (mockChannel as any).connected = false; },
      sendMessage: async () => {},
      getUser: async () => null,
      getMe: async () => null,
      on: () => {},
    };
    const mockProvider = {
      id: 'test', type: 'test', name: 'test', config: {},
      connect: async () => {},
      disconnect: async () => {},
      chat: async () => ({ id: '1', content: 'hi', model: 'test', finishReason: 'stop' as const }),
      chatWithTools: async () => ({ id: '1', content: 'hi', model: 'test', finishReason: 'stop' as const }),
    };

    gw.registerChannel('test', mockChannel as any);
    gw.registerProvider('test', mockProvider as any);

    expect(gw.getChannels().size).toBe(1);
    expect(gw.getProviders().size).toBe(1);
  });

  it('creates and finds sessions', async () => {
    const gw = createGateway({ host: '0.0.0.0', port: 0 });
    const session = gw.createSession('telegram', 'user1', 'openai');
    expect(session.channel).toBe('telegram');
    expect(session.userId).toBe('user1');

    const found = gw.getSession(session.id);
    expect(found).toBeDefined();
    expect(found?.id).toBe(session.id);

    gw.deleteSession(session.id);
    expect(gw.getSession(session.id)).toBeUndefined();
  });

  it('finds or creates session by channel+userId', async () => {
    const gw = createGateway({ host: '0.0.0.0', port: 0 });

    const session1 = gw.findOrCreateSession('telegram', 'user1', 'openai', () =>
      gw.createSession('telegram', 'user1', 'openai')
    );
    const session2 = gw.findOrCreateSession('telegram', 'user1', 'openai', () =>
      gw.createSession('telegram', 'user1', 'openai')
    );

    expect(session1.id).toBe(session2.id); // Same session returned
  });

  it('emits events on start/stop', async () => {
    const gw = createGateway({ host: '0.0.0.0', port: 0 });
    let started = false;
    let stopped = false;
    gw.on('started', () => { started = true; });
    gw.on('stopped', () => { stopped = true; });

    await gw.start();
    expect(started).toBe(true);
    await gw.stop();
    expect(stopped).toBe(true);
  });
});
