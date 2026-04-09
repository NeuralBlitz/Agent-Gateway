/**
 * Enterprise Session Manager
 * Advanced session management with persistence, TTL,
 * concurrent session limits, and session analytics.
 */

import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import { logger } from '../infra/index.js';

export interface Session {
  id: string;
  userId: string;
  tenantId?: string;
  channel: string;
  provider: string;
  metadata: Record<string, any>;
  messages: SessionMessage[];
  context: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  lastActivityAt: number;
  expiresAt?: number;
  messageCount: number;
  tokenCount: number;
}

export interface SessionMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  tokenCount?: number;
  toolCalls?: any[];
}

export interface SessionConfig {
  /** Max messages per session (default: 100) */
  maxMessages?: number;
  /** Session TTL in ms (default: 24h) */
  sessionTtlMs?: number;
  /** Max sessions per user (default: 10) */
  maxSessionsPerUser?: number;
  /** Auto-cleanup interval (ms, default: 5min) */
  cleanupIntervalMs?: number;
}

export interface SessionStore {
  save(session: Session): Promise<void>;
  load(id: string): Promise<Session | null>;
  delete(id: string): Promise<void>;
  list(filter?: { userId?: string; tenantId?: string; channel?: string }): Promise<Session[]>;
  count(filter?: { userId?: string; tenantId?: string }): Promise<number>;
}

/** In-memory session store */
export class MemorySessionStore implements SessionStore {
  private sessions: Map<string, Session> = new Map();

  async save(session: Session): Promise<void> { this.sessions.set(session.id, { ...session }); }
  async load(id: string): Promise<Session | null> { return this.sessions.get(id) || null; }
  async delete(id: string): Promise<void> { this.sessions.delete(id); }
  async list(filter?: { userId?: string; tenantId?: string; channel?: string }): Promise<Session[]> {
    let sessions = Array.from(this.sessions.values());
    if (filter?.userId) sessions = sessions.filter((s) => s.userId === filter.userId);
    if (filter?.tenantId) sessions = sessions.filter((s) => s.tenantId === filter.tenantId);
    if (filter?.channel) sessions = sessions.filter((s) => s.channel === filter.channel);
    return sessions;
  }
  async count(filter?: { userId?: string; tenantId?: string }): Promise<number> {
    const sessions = await this.list(filter);
    return sessions.length;
  }
}

export class SessionManager extends EventEmitter {
  private config: Required<SessionConfig>;
  private store: SessionStore;
  private cleanupTimer?: ReturnType<typeof setInterval>;

  constructor(store: SessionStore, config: SessionConfig = {}) {
    super();
    this.store = store;
    this.config = {
      maxMessages: config.maxMessages || 100,
      sessionTtlMs: config.sessionTtlMs || 24 * 60 * 60 * 1000,
      maxSessionsPerUser: config.maxSessionsPerUser || 10,
      cleanupIntervalMs: config.cleanupIntervalMs || 5 * 60 * 1000,
    };

    // Start cleanup
    this.cleanupTimer = setInterval(() => this.cleanup(), this.config.cleanupIntervalMs);
  }

  /** Create a new session */
  async create(data: {
    userId: string;
    tenantId?: string;
    channel: string;
    provider: string;
    metadata?: Record<string, any>;
  }): Promise<Session> {
    // Check session limit
    const userCount = await this.store.count({ userId: data.userId });
    if (userCount >= this.config.maxSessionsPerUser) {
      throw new Error(`Max sessions per user (${this.config.maxSessionsPerUser}) exceeded`);
    }

    const session: Session = {
      id: `sess-${randomUUID()}`,
      userId: data.userId,
      tenantId: data.tenantId,
      channel: data.channel,
      provider: data.provider,
      metadata: data.metadata || {},
      messages: [],
      context: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastActivityAt: Date.now(),
      expiresAt: Date.now() + this.config.sessionTtlMs,
      messageCount: 0,
      tokenCount: 0,
    };

    await this.store.save(session);
    this.emit('session:created', session);
    logger.debug({ sessionId: session.id, userId: session.userId }, 'Session created');
    return session;
  }

  /** Get a session */
  async get(id: string): Promise<Session | null> {
    const session = await this.store.load(id);
    if (!session) return null;

    // Check expiration
    if (session.expiresAt && Date.now() > session.expiresAt) {
      await this.store.delete(id);
      return null;
    }

    return session;
  }

  /** Add a message to a session */
  async addMessage(sessionId: string, message: Omit<SessionMessage, 'timestamp'>): Promise<Session> {
    const session = await this.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    const fullMessage: SessionMessage = { ...message, timestamp: Date.now() };
    session.messages.push(fullMessage);

    // Enforce max messages
    if (session.messages.length > this.config.maxMessages) {
      // Keep system message and latest messages
      const systemMsgs = session.messages.filter((m) => m.role === 'system');
      const nonSystem = session.messages.filter((m) => m.role !== 'system');
      const keep = nonSystem.slice(-this.config.maxMessages + systemMsgs.length);
      session.messages = [...systemMsgs, ...keep];
    }

    session.messageCount++;
    session.tokenCount += message.tokenCount || 0;
    session.updatedAt = Date.now();
    session.lastActivityAt = Date.now();

    // Extend expiration on activity
    session.expiresAt = Date.now() + this.config.sessionTtlMs;

    await this.store.save(session);
    this.emit('session:updated', session);
    return session;
  }

  /** Get messages for a session */
  async getMessages(sessionId: string): Promise<SessionMessage[]> {
    const session = await this.get(sessionId);
    return session?.messages || [];
  }

  /** Delete a session */
  async delete(id: string): Promise<boolean> {
    const session = await this.get(id);
    if (!session) return false;

    await this.store.delete(id);
    this.emit('session:deleted', session);
    return true;
  }

  /** List sessions */
  async list(filter?: { userId?: string; tenantId?: string; channel?: string }): Promise<Session[]> {
    return this.store.list(filter);
  }

  /** Update session metadata */
  async updateMetadata(sessionId: string, metadata: Record<string, any>): Promise<Session> {
    const session = await this.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    Object.assign(session.metadata, metadata);
    session.updatedAt = Date.now();
    await this.store.save(session);
    return session;
  }

  /** Set session context */
  async setContext(sessionId: string, key: string, value: any): Promise<Session> {
    const session = await this.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    session.context[key] = value;
    session.updatedAt = Date.now();
    await this.store.save(session);
    return session;
  }

  /** Clear messages from a session */
  async clearMessages(sessionId: string): Promise<Session> {
    const session = await this.get(sessionId);
    if (!session) throw new Error(`Session not found: ${sessionId}`);

    // Keep system messages
    session.messages = session.messages.filter((m) => m.role === 'system');
    session.updatedAt = Date.now();
    await this.store.save(session);
    return session;
  }

  /** Cleanup expired sessions */
  private async cleanup(): Promise<void> {
    const now = Date.now();
    const sessions = await this.store.list();
    let cleaned = 0;

    for (const session of sessions) {
      if (session.expiresAt && now > session.expiresAt) {
        await this.store.delete(session.id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug({ cleaned }, 'Session cleanup completed');
    }
  }

  /** Get stats */
  async getStats(): Promise<{
    totalSessions: number;
    totalMessages: number;
    avgMessagesPerSession: number;
    activeSessions: number;
  }> {
    const sessions = await this.store.list();
    const totalMessages = sessions.reduce((sum, s) => sum + s.messageCount, 0);
    const active = sessions.filter((s) => !s.expiresAt || s.expiresAt > Date.now()).length;

    return {
      totalSessions: sessions.length,
      totalMessages,
      avgMessagesPerSession: sessions.length > 0 ? totalMessages / sessions.length : 0,
      activeSessions: active,
    };
  }

  /** Close the manager */
  close(): void {
    if (this.cleanupTimer) clearInterval(this.cleanupTimer);
  }
}

export function createSessionManager(store?: SessionStore, config?: SessionConfig): SessionManager {
  return new SessionManager(store || new MemorySessionStore(), config);
}
