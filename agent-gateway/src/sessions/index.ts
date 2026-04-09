import { EventEmitter } from 'events';
import { logger } from '../infra/logger.js';
import type { ChatMessage } from '../providers/types.js';
import { mkdir, readFile, writeFile, readdir, unlink, rename } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export interface SessionData {
  id: string;
  channel: string;
  userId: string;
  provider: string;
  createdAt: number;
  updatedAt: number;
  metadata: Record<string, any>;
  messages: SessionMessage[];
  context: Record<string, any>;
}

export interface SessionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SessionOptions {
  id?: string;
  channel: string;
  userId: string;
  provider: string;
  metadata?: Record<string, any>;
  maxMessages?: number;
  persistence?: SessionPersistence;
}

export interface SessionPersistence {
  save(session: SessionData): Promise<void>;
  load(id: string): Promise<SessionData | null>;
  delete(id: string): Promise<void>;
  list(channel: string, userId: string): Promise<SessionData[]>;
}

export class InMemorySessionPersistence implements SessionPersistence {
  private sessions: Map<string, SessionData> = new Map();

  async save(session: SessionData): Promise<void> {
    session.updatedAt = Date.now();
    this.sessions.set(session.id, { ...session });
  }

  async load(id: string): Promise<SessionData | null> {
    return this.sessions.get(id) || null;
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async list(channel: string, userId: string): Promise<SessionData[]> {
    return Array.from(this.sessions.values()).filter(
      s => s.channel === channel && s.userId === userId
    );
  }
}

/**
 * File-backed session persistence.
 * Stores each session as a JSON file in a dedicated directory.
 * Safe for concurrent access — writes are atomic (write to tmp, then rename).
 */
export class FileSessionPersistence implements SessionPersistence {
  private dir: string;

  constructor(dir: string = '.agent-sessions') {
    this.dir = dir;
  }

  private filePath(id: string): string {
    return join(this.dir, `${id}.json`);
  }

  private async ensureDir(): Promise<void> {
    if (!existsSync(this.dir)) {
      await mkdir(this.dir, { recursive: true });
    }
  }

  async save(session: SessionData): Promise<void> {
    await this.ensureDir();
    session.updatedAt = Date.now();
    const tmpPath = this.filePath(session.id) + '.tmp';
    const finalPath = this.filePath(session.id);
    // Atomic write: write to .tmp then rename (POSIX atomic)
    await writeFile(tmpPath, JSON.stringify(session, null, 2), 'utf-8');
    await rename(tmpPath, finalPath);
  }

  async load(id: string): Promise<SessionData | null> {
    await this.ensureDir();
    const path = this.filePath(id);
    if (!existsSync(path)) return null;
    try {
      const content = await readFile(path, 'utf-8');
      return JSON.parse(content) as SessionData;
    } catch (err: any) {
      logger.warn({ err, id }, 'Failed to load session file, deleting corrupted file');
      try { await unlink(path); } catch {}
      return null;
    }
  }

  async delete(id: string): Promise<void> {
    await this.ensureDir();
    const path = this.filePath(id);
    if (existsSync(path)) {
      await unlink(path);
    }
  }

  async list(channel: string, userId: string): Promise<SessionData[]> {
    await this.ensureDir();
    const files = await readdir(this.dir);
    const results: SessionData[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const id = file.slice(0, -5);
      const data = await this.load(id);
      if (data && data.channel === channel && data.userId === userId) {
        results.push(data);
      }
    }
    return results;
  }
}

export class Session extends EventEmitter {
  readonly id: string;
  readonly channel: string;
  readonly userId: string;
  readonly provider: string;
  private _createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any>;
  context: Record<string, any>;
  private messages: SessionMessage[] = [];
  private maxMessages: number;
  private persistence?: SessionPersistence;
  private dirty: boolean = false;

  get createdAt(): Date { return this._createdAt; }

  constructor(options: SessionOptions) {
    super();
    this.id = options.id || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.channel = options.channel;
    this.userId = options.userId;
    this.provider = options.provider;
    this.metadata = options.metadata || {};
    this.context = {};
    this.maxMessages = options.maxMessages || 100;
    this.persistence = options.persistence;
    this._createdAt = new Date();
    this.updatedAt = new Date();
  }

  async addMessage(role: 'system' | 'user' | 'assistant', content: string): Promise<void> {
    const message: SessionMessage = {
      role,
      content,
      timestamp: Date.now(),
    };

    this.messages.push(message);

    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(-this.maxMessages);
    }

    this.dirty = true;
    this.emit('messageAdded', message);
    await this.persist();
  }

  getMessages(): ChatMessage[] {
    return this.messages.map(m => ({
      role: m.role,
      content: m.content,
    }));
  }

  getHistory(): SessionMessage[] {
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages = [];
    this.dirty = true;
    this.emit('messagesCleared');
    this.persist();
  }

  setContext(key: string, value: any): void {
    this.context[key] = value;
    this.dirty = true;
    this.emit('contextChanged', key, value);
  }

  getContext(key: string): any {
    return this.context[key];
  }

  clearContext(): void {
    this.context = {};
    this.dirty = true;
    this.emit('contextCleared');
  }

  getMetadata(key: string): any {
    return this.metadata[key];
  }

  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
    this.dirty = true;
    this.emit('metadataChanged', key, value);
  }

  async persist(): Promise<void> {
    if (this.persistence && this.dirty) {
      await this.persistence.save(this.toJSON());
      this.dirty = false;
    }
  }

  async loadFromPersistence(id: string): Promise<boolean> {
    if (!this.persistence) return false;

    const data = await this.persistence.load(id);
    if (!data) return false;

    this.messages = data.messages;
    this.context = data.context;
    this.metadata = data.metadata;
    this.updatedAt = new Date(data.updatedAt);
    this.dirty = false;

    return true;
  }

  toJSON(): SessionData {
    return {
      id: this.id,
      channel: this.channel,
      userId: this.userId,
      provider: this.provider,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
      metadata: this.metadata,
      messages: this.messages,
      context: this.context,
    };
  }

  static fromJSON(data: SessionData, options?: { persistence?: SessionPersistence }): Session {
    const session = new Session({
      id: data.id,
      channel: data.channel,
      userId: data.userId,
      provider: data.provider,
      metadata: data.metadata,
      persistence: options?.persistence,
    });

    session.messages = data.messages;
    session.context = data.context;
    session._createdAt = new Date(data.createdAt);
    session.updatedAt = new Date(data.updatedAt);
    session.dirty = false;

    return session;
  }
}

export class SessionManager extends EventEmitter {
  private sessions: Map<string, Session> = new Map();
  private persistence?: SessionPersistence;
  private defaultMaxMessages: number = 100;

  constructor(persistence?: SessionPersistence) {
    super();
    this.persistence = persistence;
  }

  async create(options: SessionOptions): Promise<Session> {
    const session = new Session({
      ...options,
      maxMessages: options.maxMessages || this.defaultMaxMessages,
      persistence: this.persistence,
    });

    this.sessions.set(session.id, session);
    session.on('messageAdded', () => this.emit('sessionUpdated', session));
    session.on('messagesCleared', () => this.emit('sessionUpdated', session));
    session.on('contextChanged', () => this.emit('sessionUpdated', session));

    logger.debug(`Created session: ${session.id}`);
    this.emit('sessionCreated', session);

    return session;
  }

  get(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  async getOrCreate(options: SessionOptions): Promise<Session> {
    if (this.persistence) {
      const existing = await this.persistence.load(options.id || '');
      if (existing) {
        const session = Session.fromJSON(existing, { persistence: this.persistence });
        this.sessions.set(session.id, session);
        return session;
      }
    }

    return this.create(options);
  }

  delete(id: string): boolean {
    const session = this.sessions.get(id);
    if (!session) return false;

    this.sessions.delete(id);
    
    if (this.persistence) {
      this.persistence.delete(id);
    }

    logger.debug(`Deleted session: ${id}`);
    this.emit('sessionDeleted', session);

    return true;
  }

  list(channel?: string, userId?: string): Session[] {
    return Array.from(this.sessions.values()).filter(s => {
      if (channel && s.channel !== channel) return false;
      if (userId && s.userId !== userId) return false;
      return true;
    });
  }

  async listFromPersistence(channel: string, userId: string): Promise<Session[]> {
    if (!this.persistence) return [];

    const data = await this.persistence.list(channel, userId);
    return data.map(d => Session.fromJSON(d, { persistence: this.persistence }));
  }

  clear(): void {
    this.sessions.clear();
    this.emit('sessionsCleared');
  }

  get count(): number {
    return this.sessions.size;
  }
}

export function createSessionManager(persistence?: SessionPersistence): SessionManager {
  return new SessionManager(persistence);
}