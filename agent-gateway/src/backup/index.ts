// @ts-nocheck
/**
 * Enterprise Backup & Restore
 * Automated backups of sessions, config, secrets, and audit logs
 * with encryption and cloud storage support.
 */

import { createGzip, createGunzip } from 'zlib';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { writeFile, readFile, mkdir, readdir, stat, unlink } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { logger } from '../infra/index.js';

export interface BackupConfig {
  /** Backup directory */
  backupDir?: string;
  /** Encryption key for backups (32 bytes hex) */
  encryptionKey?: string;
  /** Max backups to keep (default: 30) */
  maxBackups?: number;
  /** Backup interval in ms (default: 24h) */
  intervalMs?: number;
}

export interface BackupMetadata {
  id: string;
  createdAt: number;
  size: number;
  encrypted: boolean;
  components: string[];
  compression: 'gzip';
}

export class BackupManager {
  private config: Required<BackupConfig>;
  private backups: BackupMetadata[] = [];

  constructor(config: BackupConfig = {}) {
    this.config = {
      backupDir: config.backupDir || '.backups',
      encryptionKey: config.encryptionKey || process.env.BACKUP_ENCRYPTION_KEY || '',
      maxBackups: config.maxBackups || 30,
      intervalMs: config.intervalMs || 24 * 60 * 60 * 1000,
    };

    if (!existsSync(this.config.backupDir)) {
      mkdirSync(this.config.backupDir, { recursive: true });
    }
  }

  /** Create a full backup */
  async createBackup(data: Record<string, any>): Promise<BackupMetadata> {
    const id = `backup-${Date.now()}-${randomBytes(4).toString('hex')}`;
    const filePath = join(this.config.backupDir, `${id}.json.gz`);
    const metaPath = join(this.config.backupDir, `${id}.meta.json`);

    const components = Object.keys(data);
    const content = JSON.stringify(data, null, 2);

    // Compress with gzip
    const gzip = createGzip();
    let compressed: Buffer;

    if (this.config.encryptionKey) {
      // Compress then encrypt
      const compressedStream = content.pipe ? content : Buffer.from(content);
      compressed = await this.compressAndEncrypt(Buffer.from(content));
    } else {
      // Just compress
      compressed = await this.compress(Buffer.from(content));
    }

    await writeFile(filePath, compressed);

    const metadata: BackupMetadata = {
      id,
      createdAt: Date.now(),
      size: compressed.length,
      encrypted: !!this.config.encryptionKey,
      components,
      compression: 'gzip',
    };

    await writeFile(metaPath, JSON.stringify(metadata, null, 2));
    this.backups.push(metadata);

    // Cleanup old backups
    await this.cleanupOldBackups();

    logger.info({ id, size: compressed.length, components }, 'Backup created');
    return metadata;
  }

  /** Restore from a backup */
  async restore(backupId: string): Promise<Record<string, any>> {
    const filePath = join(this.config.backupDir, `${backupId}.json.gz`);

    if (!existsSync(filePath)) {
      throw new Error(`Backup not found: ${backupId}`);
    }

    const compressed = await readFile(filePath);
    let content: Buffer;

    if (this.config.encryptionKey) {
      content = await this.decryptAndDecompress(compressed);
    } else {
      content = await this.decompress(compressed);
    }

    const data = JSON.parse(content.toString('utf-8'));
    logger.info({ backupId, components: Object.keys(data) }, 'Backup restored');
    return data;
  }

  /** List available backups */
  async listBackups(): Promise<BackupMetadata[]> {
    if (!existsSync(this.config.backupDir)) return [];

    const files = await readdir(this.config.backupDir);
    const metaFiles = files.filter((f) => f.endsWith('.meta.json'));

    const backups: BackupMetadata[] = [];
    for (const metaFile of metaFiles) {
      try {
        const content = await readFile(join(this.config.backupDir, metaFile), 'utf-8');
        backups.push(JSON.parse(content));
      } catch {
        // Skip corrupted meta files
      }
    }

    // Sort by creation date, newest first
    backups.sort((a, b) => b.createdAt - a.createdAt);
    this.backups = backups;
    return backups;
  }

  /** Delete a backup */
  async deleteBackup(backupId: string): Promise<boolean> {
    const filePath = join(this.config.backupDir, `${backupId}.json.gz`);
    const metaPath = join(this.config.backupDir, `${backupId}.meta.json`);

    let deleted = false;
    if (existsSync(filePath)) {
      await unlink(filePath);
      deleted = true;
    }
    if (existsSync(metaPath)) {
      await unlink(metaPath);
    }

    this.backups = this.backups.filter((b) => b.id !== backupId);
    return deleted;
  }

  /** Start automatic backup schedule */
  startAutoBackup(dataFn: () => Promise<Record<string, any>>): ReturnType<typeof setInterval> {
    return setInterval(async () => {
      try {
        const data = await dataFn();
        await this.createBackup(data);
      } catch (err: any) {
        logger.error({ err }, 'Automatic backup failed');
      }
    }, this.config.intervalMs);
  }

  /** Cleanup old backups beyond max limit */
  private async cleanupOldBackups(): Promise<number> {
    const backups = await this.listBackups();
    let deleted = 0;

    for (let i = this.config.maxBackups; i < backups.length; i++) {
      await this.deleteBackup(backups[i].id);
      deleted++;
    }

    if (deleted > 0) {
      logger.info({ deleted }, 'Cleaned up old backups');
    }

    return deleted;
  }

  private async compress(data: Buffer): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const gzip = createGzip();
    gzip.on('data', (chunk) => chunks.push(chunk));
    await new Promise<void>((resolve, reject) => {
      gzip.on('end', resolve);
      gzip.on('error', reject);
      gzip.end(data);
    });
    return Buffer.concat(chunks);
  }

  private async decompress(data: Buffer): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const gunzip = createGunzip();
    gunzip.on('data', (chunk) => chunks.push(chunk));
    await new Promise<void>((resolve, reject) => {
      gunzip.on('end', resolve);
      gunzip.on('error', reject);
      gunzip.end(data);
    });
    return Buffer.concat(chunks);
  }

  private async compressAndEncrypt(data: Buffer): Promise<Buffer> {
    const compressed = await this.compress(data);
    const iv = randomBytes(16);
    const key = Buffer.from(this.config.encryptionKey, 'hex');
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([iv, cipher.update(compressed), cipher.final(), cipher.getAuthTag()]);
    return encrypted;
  }

  private async decryptAndDecompress(data: Buffer): Promise<Buffer> {
    const iv = data.slice(0, 16);
    const authTag = data.slice(-16);
    const encrypted = data.slice(16, -16);
    const key = Buffer.from(this.config.encryptionKey, 'hex');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    const compressed = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return this.decompress(compressed);
  }
}

export function createBackupManager(config?: BackupConfig): BackupManager {
  return new BackupManager(config);
}
