/**
 * SQLite-backed session persistence using libsql (SQLite-compatible, supports local + remote).
 * Provides much better performance and reliability than JSON files for production use.
 */

import { logger } from '../infra/index.js';
import type { SessionData, SessionPersistence } from '../sessions/index.js';

export interface DatabaseSessionConfig {
  /** Database URL. Default: file:.agent-sessions.db (local SQLite) */
  url?: string;
  /** authToken for remote libsql/Turso databases */
  authToken?: string;
  /** Table name (default: sessions) */
  tableName?: string;
}

export class DatabaseSessionPersistence implements SessionPersistence {
  private db: any;
  private tableName: string;

  constructor(config: DatabaseSessionConfig = {}) {
    this.tableName = config.tableName || 'sessions';
    this.db = null; // Lazy-initialized on first use
  }

  private async getDb(): Promise<any> {
    if (this.db) return this.db;

    const url = process.env.DATABASE_URL || 'file:.agent-sessions.db';
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    try {
      const { createClient } = await import('@libsql/client');
      this.db = createClient({ url, authToken });

      // Create table if not exists
      await this.db.execute(`
        CREATE TABLE IF NOT EXISTS ${this.tableName} (
          id TEXT PRIMARY KEY,
          channel TEXT NOT NULL,
          user_id TEXT NOT NULL,
          provider TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          metadata TEXT NOT NULL DEFAULT '{}',
          messages TEXT NOT NULL DEFAULT '[]',
          context TEXT NOT NULL DEFAULT '{}'
        )
      `);

      // Index for lookups
      await this.db.execute(`
        CREATE INDEX IF NOT EXISTS idx_${this.tableName}_user 
        ON ${this.tableName}(channel, user_id)
      `);

      logger.info({ url: url.replace(/\/\/.*@/, '//***@') }, 'Database session store initialized');
    } catch (err: any) {
      logger.warn({ err }, 'Failed to initialize database session store, falling back to file-based');
      return null;
    }

    return this.db;
  }

  async save(session: SessionData): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    session.updatedAt = Date.now();

    await db.execute({
      sql: `
        INSERT OR REPLACE INTO ${this.tableName} 
        (id, channel, user_id, provider, created_at, updated_at, metadata, messages, context)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        session.id,
        session.channel,
        session.userId,
        session.provider,
        session.createdAt,
        session.updatedAt,
        JSON.stringify(session.metadata),
        JSON.stringify(session.messages),
        JSON.stringify(session.context),
      ],
    });
  }

  async load(id: string): Promise<SessionData | null> {
    const db = await this.getDb();
    if (!db) return null;

    const result = await db.execute({
      sql: `SELECT * FROM ${this.tableName} WHERE id = ?`,
      args: [id],
    });

    if (!result.rows || result.rows.length === 0) return null;

    const row = result.rows[0];
    return this.rowToSession(row);
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    if (!db) return;

    await db.execute({
      sql: `DELETE FROM ${this.tableName} WHERE id = ?`,
      args: [id],
    });
  }

  async list(channel: string, userId: string): Promise<SessionData[]> {
    const db = await this.getDb();
    if (!db) return [];

    const result = await db.execute({
      sql: `SELECT * FROM ${this.tableName} WHERE channel = ? AND user_id = ? ORDER BY updated_at DESC`,
      args: [channel, userId],
    });

    return (result.rows || []).map((row: any) => this.rowToSession(row));
  }

  /** Delete sessions older than maxAgeMs (cleanup old data) */
  async cleanup(maxAgeMs: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const db = await this.getDb();
    if (!db) return 0;

    const cutoff = Date.now() - maxAgeMs;
    const result = await db.execute({
      sql: `DELETE FROM ${this.tableName} WHERE updated_at < ?`,
      args: [cutoff],
    });

    const deleted = result.rowsAffected || 0;
    if (deleted > 0) {
      logger.info({ deleted }, 'Cleaned up old sessions');
    }
    return deleted;
  }

  /** Get session count for monitoring */
  async count(): Promise<number> {
    const db = await this.getDb();
    if (!db) return 0;

    const result = await db.execute(`SELECT COUNT(*) as cnt FROM ${this.tableName}`);
    return (result.rows?.[0] as any)?.cnt || 0;
  }

  private rowToSession(row: any): SessionData {
    return {
      id: row.id as string,
      channel: row.channel as string,
      userId: row.user_id as string,
      provider: row.provider as string,
      createdAt: Number(row.created_at),
      updatedAt: Number(row.updated_at),
      metadata: JSON.parse(row.metadata as string),
      messages: JSON.parse(row.messages as string),
      context: JSON.parse(row.context as string),
    };
  }
}

export function createDatabaseSessionPersistence(config?: DatabaseSessionConfig): DatabaseSessionPersistence {
  return new DatabaseSessionPersistence(config);
}
