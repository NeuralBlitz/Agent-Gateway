/**
 * Enterprise Audit Logging
 * Structured audit trails with retention policies, tamper-evident hashing,
 * and searchable event history.
 */

import { createHash, createHmac } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { logger } from '../infra/index.js';

// --- Types ---

export type AuditEventType =
  | 'auth:login'
  | 'auth:logout'
  | 'auth:api-key-created'
  | 'auth:api-key-revoked'
  | 'auth:user-created'
  | 'auth:user-disabled'
  | 'message:send'
  | 'message:receive'
  | 'session:create'
  | 'session:delete'
  | 'config:change'
  | 'plugin:install'
  | 'plugin:uninstall'
  | 'admin:action'
  | 'system:start'
  | 'system:stop'
  | 'system:error'
  | 'rate:limited'
  | 'security:blocked';

export interface AuditEvent {
  /** Unique event ID */
  id: string;
  /** Event type */
  type: AuditEventType;
  /** Timestamp */
  timestamp: number;
  /** Actor (user ID, API key, or 'system') */
  actor: string;
  /** Actor type */
  actorType: 'user' | 'api-key' | 'system' | 'anonymous';
  /** Tenant ID (if multi-tenant) */
  tenantId?: string;
  /** Source IP */
  sourceIp?: string;
  /** User agent */
  userAgent?: string;
  /** Event details */
  data: Record<string, any>;
  /** Previous state (for config changes) */
  previousState?: Record<string, any>;
  /** Chain hash for tamper detection */
  previousHash: string;
  /** Event hash */
  hash: string;
}

export interface AuditConfig {
  /** Max events to keep in memory (default: 100000) */
  maxInMemory?: number;
  /** Whether to write to disk (default: true) */
  persistToDisk?: boolean;
  /** Directory for audit log files */
  logDir?: string;
  /** Rotation: max events per file (default: 10000) */
  rotationSize?: number;
  /** Retention: delete files older than this (ms, default: 90 days) */
  retentionMs?: number;
  /** HMAC secret for tamper-evident hashing */
  hmacSecret?: string;
}

export class AuditLogger {
  private config: Required<AuditConfig>;
  private events: AuditEvent[] = [];
  private lastHash: string = '0000000000000000000000000000000000000000000000000000000000000000';
  private currentFileCount = 0;
  private currentFileIndex = 1;

  constructor(config: AuditConfig = {}) {
    this.config = {
      maxInMemory: config.maxInMemory || 100000,
      persistToDisk: config.persistToDisk ?? true,
      logDir: config.logDir || '.audit-logs',
      rotationSize: config.rotationSize || 10000,
      retentionMs: config.retentionMs || 90 * 24 * 60 * 60 * 1000,
      hmacSecret: config.hmacSecret || process.env.AUDIT_HMAC_SECRET || 'default-secret-change-me',
    };
  }

  /** Log an audit event */
  async log(event: Omit<AuditEvent, 'id' | 'timestamp' | 'previousHash' | 'hash'>): Promise<AuditEvent> {
    const timestamp = Date.now();
    const previousHash = this.lastHash;

    const fullEvent: AuditEvent = {
      ...event,
      id: `${timestamp}-${Math.random().toString(36).slice(2, 10)}`,
      timestamp,
      previousHash,
      hash: '',
    };

    // Compute tamper-evident hash
    fullEvent.hash = this.computeHash(fullEvent);
    this.lastHash = fullEvent.hash;

    // Store in memory
    this.events.push(fullEvent);
    if (this.events.length > this.config.maxInMemory) {
      this.events.shift();
    }

    // Persist to disk
    if (this.config.persistToDisk) {
      this.currentFileCount++;
      if (this.currentFileCount >= this.config.rotationSize) {
        this.currentFileIndex++;
        this.currentFileCount = 0;
      }

      try {
        const logDir = this.config.logDir;
        const { mkdirSync, existsSync } = await import('fs');
        if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });

        const filePath = join(logDir, `audit-${this.currentFileIndex}.jsonl`);
        await writeFile(filePath, JSON.stringify(fullEvent) + '\n', { flag: 'a' });
      } catch (err: any) {
        logger.error({ err }, 'Failed to write audit log');
      }
    }

    // Log to standard logger for real-time monitoring
    logger.info(
      { audit: true, type: event.type, actor: event.actor, tenantId: event.tenantId },
      `AUDIT: ${event.type}`,
    );

    return fullEvent;
  }

  /** Get recent events */
  getRecent(limit: number = 100): AuditEvent[] {
    return this.events.slice(-limit);
  }

  /** Search events by type */
  searchByType(type: AuditEventType, limit: number = 100): AuditEvent[] {
    return this.events.filter((e) => e.type === type).slice(-limit);
  }

  /** Search events by actor */
  searchByActor(actor: string, limit: number = 100): AuditEvent[] {
    return this.events.filter((e) => e.actor === actor).slice(-limit);
  }

  /** Search events by tenant */
  searchByTenant(tenantId: string, limit: number = 100): AuditEvent[] {
    return this.events.filter((e) => e.tenantId === tenantId).slice(-limit);
  }

  /** Search events by time range */
  searchByTimeRange(from: number, to: number, limit: number = 1000): AuditEvent[] {
    return this.events.filter((e) => e.timestamp >= from && e.timestamp <= to).slice(0, limit);
  }

  /** Verify chain integrity (detect tampering) */
  verifyChain(): { valid: boolean; firstInvalidIndex?: number } {
    let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';

    for (let i = 0; i < this.events.length; i++) {
      const event = this.events[i];

      if (event.previousHash !== prevHash) {
        return { valid: false, firstInvalidIndex: i };
      }

      const expectedHash = this.computeHash(event);
      if (event.hash !== expectedHash) {
        return { valid: false, firstInvalidIndex: i };
      }

      prevHash = event.hash;
    }

    return { valid: true };
  }

  /** Get stats */
  getStats(): { totalEvents: number; eventTypes: Record<string, number>; oldestEvent?: number } {
    const eventTypes: Record<string, number> = {};
    for (const event of this.events) {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    }

    return {
      totalEvents: this.events.length,
      eventTypes,
      oldestEvent: this.events[0]?.timestamp,
    };
  }

  /** Rotate old log files */
  async rotateOldFiles(): Promise<number> {
    const { readdir, stat, unlink } = await import('fs/promises');
    const { join } = await import('path');
    const { existsSync } = await import('fs');

    if (!existsSync(this.config.logDir)) return 0;

    const files = await readdir(this.config.logDir);
    const cutoff = Date.now() - this.config.retentionMs;
    let deleted = 0;

    for (const file of files) {
      if (!file.startsWith('audit-')) continue;
      const filePath = join(this.config.logDir, file);
      const stats = await stat(filePath);
      if (stats.mtimeMs < cutoff) {
        await unlink(filePath);
        deleted++;
      }
    }

    if (deleted > 0) {
      logger.info({ deleted }, 'Rotated old audit log files');
    }

    return deleted;
  }

  private computeHash(event: Omit<AuditEvent, 'hash'>): string {
    const content = JSON.stringify({
      id: event.id,
      type: event.type,
      timestamp: event.timestamp,
      actor: event.actor,
      actorType: event.actorType,
      tenantId: event.tenantId,
      sourceIp: event.sourceIp,
      data: event.data,
      previousHash: event.previousHash,
    });

    return createHmac('sha256', this.config.hmacSecret).update(content).digest('hex');
  }
}

let globalAuditLogger: AuditLogger | null = null;

export function getAuditLogger(): AuditLogger {
  if (!globalAuditLogger) {
    globalAuditLogger = new AuditLogger();
  }
  return globalAuditLogger;
}

export function createAuditLogger(config?: AuditConfig): AuditLogger {
  const logger = new AuditLogger(config);
  globalAuditLogger = logger;
  return logger;
}

/** Convenience: log common events */
export async function auditLogin(userId: string, sourceIp?: string): Promise<void> {
  const audit = getAuditLogger();
  await audit.log({
    type: 'auth:login',
    actor: userId,
    actorType: 'user',
    sourceIp,
    data: { method: 'password' },
  });
}

export async function auditApiKeyCreated(userId: string, keyName: string): Promise<void> {
  const audit = getAuditLogger();
  await audit.log({
    type: 'auth:api-key-created',
    actor: userId,
    actorType: 'user',
    data: { keyName },
  });
}

export async function auditMessageSend(userId: string, channel: string, content: string): Promise<void> {
  const audit = getAuditLogger();
  await audit.log({
    type: 'message:send',
    actor: userId,
    actorType: 'user',
    data: { channel, contentLength: content.length },
  });
}

export async function auditConfigChange(userId: string, key: string, previousState?: any): Promise<void> {
  const audit = getAuditLogger();
  await audit.log({
    type: 'config:change',
    actor: userId,
    actorType: 'user',
    data: { key },
    previousState,
  });
}
