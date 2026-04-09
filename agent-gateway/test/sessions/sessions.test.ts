import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Session, SessionManager, InMemorySessionPersistence } from '../../src/sessions/index.js';

describe('Session', () => {
  let session: Session;

  beforeEach(() => {
    session = new Session({
      id: 'test-session',
      channel: 'telegram',
      userId: '123456',
      provider: 'openai',
    });
  });

  describe('constructor', () => {
    it('should create session with correct properties', () => {
      expect(session.id).toBe('test-session');
      expect(session.channel).toBe('telegram');
      expect(session.userId).toBe('123456');
      expect(session.provider).toBe('openai');
      expect(session.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('addMessage', () => {
    it('should add message to session', async () => {
      await session.addMessage('user', 'Hello');
      await session.addMessage('assistant', 'Hi there!');

      const messages = session.getMessages();
      expect(messages).toHaveLength(2);
      expect(messages[0]).toEqual({ role: 'user', content: 'Hello' });
      expect(messages[1]).toEqual({ role: 'assistant', content: 'Hi there!' });
    });

    it('should emit messageAdded event', async () => {
      const handler = vi.fn();
      session.on('messageAdded', handler);

      await session.addMessage('user', 'Test message');

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'user', content: 'Test message' })
      );
    });

    it('should limit message history', async () => {
      const limitedSession = new Session({
        id: 'limited',
        channel: 'telegram',
        userId: '123',
        provider: 'openai',
        maxMessages: 3,
      });

      await limitedSession.addMessage('user', '1');
      await limitedSession.addMessage('user', '2');
      await limitedSession.addMessage('user', '3');
      await limitedSession.addMessage('user', '4');
      await limitedSession.addMessage('user', '5');

      const messages = limitedSession.getMessages();
      expect(messages).toHaveLength(3);
      expect(messages[0].content).toBe('3');
    });
  });

  describe('getHistory', () => {
    it('should return message history', async () => {
      await session.addMessage('user', 'First');
      await session.addMessage('assistant', 'Second');

      const history = session.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].timestamp).toBeDefined();
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages', async () => {
      await session.addMessage('user', 'Test');
      session.clearMessages();

      expect(session.getMessages()).toHaveLength(0);
    });
  });

  describe('context', () => {
    it('should set and get context', () => {
      session.setContext('theme', 'dark');
      expect(session.getContext('theme')).toBe('dark');
    });

    it('should clear context', () => {
      session.setContext('key', 'value');
      session.clearContext();
      expect(session.getContext('key')).toBeUndefined();
    });
  });

  describe('metadata', () => {
    it('should set and get metadata', () => {
      session.setMetadata('source', 'web');
      expect(session.getMetadata('source')).toBe('web');
    });
  });

  describe('toJSON/fromJSON', () => {
    it('should serialize and deserialize', async () => {
      await session.addMessage('user', 'Hello');
      session.setContext('key', 'value');

      const json = session.toJSON();
      const restored = Session.fromJSON(json);

      expect(restored.id).toBe(session.id);
      expect(restored.channel).toBe(session.channel);
      expect(restored.getMessages()).toHaveLength(1);
    });
  });
});

describe('SessionManager', () => {
  let manager: SessionManager;
  let persistence: InMemorySessionPersistence;

  beforeEach(() => {
    persistence = new InMemorySessionPersistence();
    manager = new SessionManager(persistence);
  });

  describe('create', () => {
    it('should create new session', async () => {
      const session = await manager.create({
        channel: 'telegram',
        userId: '123',
        provider: 'openai',
      });

      expect(session).toBeInstanceOf(Session);
      expect(manager.get(session.id)).toBe(session);
    });

    it('should emit sessionCreated event', async () => {
      const handler = vi.fn();
      manager.on('sessionCreated', handler);

      await manager.create({ channel: 'telegram', userId: '123', provider: 'openai' });

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should retrieve session by id', async () => {
      const session = await manager.create({ channel: 'telegram', userId: '123', provider: 'openai' });
      const retrieved = manager.get(session.id);
      expect(retrieved).toBe(session);
    });

    it('should return undefined for unknown session', () => {
      expect(manager.get('unknown')).toBeUndefined();
    });
  });

  describe('delete', () => {
    it('should delete session', async () => {
      const session = await manager.create({ channel: 'telegram', userId: '123', provider: 'openai' });
      const deleted = manager.delete(session.id);

      expect(deleted).toBe(true);
      expect(manager.get(session.id)).toBeUndefined();
    });

    it('should emit sessionDeleted event', async () => {
      const session = await manager.create({ channel: 'telegram', userId: '123', provider: 'openai' });
      const handler = vi.fn();
      manager.on('sessionDeleted', handler);

      manager.delete(session.id);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should list sessions by channel and user', async () => {
      await manager.create({ channel: 'telegram', userId: '123', provider: 'openai' });
      await manager.create({ channel: 'telegram', userId: '456', provider: 'openai' });
      await manager.create({ channel: 'discord', userId: '123', provider: 'openai' });

      const telegramSessions = manager.list('telegram');
      expect(telegramSessions).toHaveLength(2);

      const userSessions = manager.list('telegram', '123');
      expect(userSessions).toHaveLength(1);
    });
  });

  describe('getOrCreate', () => {
    it('should return existing session if found', async () => {
      const existing = await manager.create({ id: 'existing', channel: 'telegram', userId: '123', provider: 'openai' });
      const found = await manager.getOrCreate({ id: 'existing', channel: 'telegram', userId: '123', provider: 'openai' });
      expect(found.id).toBe(existing.id);
    });

    it('should create new session if not found', async () => {
      const found = await manager.getOrCreate({ id: 'new-session', channel: 'telegram', userId: '789', provider: 'openai' });
      expect(found.id).toBe('new-session');
    });
  });

  describe('clear', () => {
    it('should clear all sessions', async () => {
      await manager.create({ channel: 'telegram', userId: '123', provider: 'openai' });
      await manager.create({ channel: 'discord', userId: '456', provider: 'openai' });

      manager.clear();

      expect(manager.count).toBe(0);
    });
  });
});

describe('InMemorySessionPersistence', () => {
  let persistence: InMemorySessionPersistence;

  beforeEach(() => {
    persistence = new InMemorySessionPersistence();
  });

  describe('save/load', () => {
    it('should save and load session', async () => {
      const sessionData = {
        id: 'test-1',
        channel: 'telegram',
        userId: '123',
        provider: 'openai',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        metadata: {},
        messages: [{ role: 'user', content: 'Hello', timestamp: Date.now() }],
        context: {},
      };

      await persistence.save(sessionData);
      const loaded = await persistence.load('test-1');

      expect(loaded).toEqual(sessionData);
    });
  });

  describe('delete', () => {
    it('should delete session', async () => {
      const sessionData = { id: 'test-del', channel: 'telegram', userId: '123', provider: 'openai', createdAt: Date.now(), updatedAt: Date.now(), metadata: {}, messages: [], context: {} };
      await persistence.save(sessionData);
      await persistence.delete('test-del');

      const loaded = await persistence.load('test-del');
      expect(loaded).toBeNull();
    });
  });

  describe('list', () => {
    it('should list sessions by channel and user', async () => {
      await persistence.save({ id: '1', channel: 'telegram', userId: '123', provider: 'openai', createdAt: Date.now(), updatedAt: Date.now(), metadata: {}, messages: [], context: {} });
      await persistence.save({ id: '2', channel: 'telegram', userId: '123', provider: 'openai', createdAt: Date.now(), updatedAt: Date.now(), metadata: {}, messages: [], context: {} });
      await persistence.save({ id: '3', channel: 'discord', userId: '123', provider: 'openai', createdAt: Date.now(), updatedAt: Date.now(), metadata: {}, messages: [], context: {} });

      const list = await persistence.list('telegram', '123');
      expect(list).toHaveLength(2);
    });
  });
});