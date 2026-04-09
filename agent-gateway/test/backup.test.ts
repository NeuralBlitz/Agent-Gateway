import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createBackupManager } from '../src/backup/index.js';
import { existsSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('BackupManager', () => {
  const backupDir = join(tmpdir(), 'agw-backup-test-' + Date.now());

  beforeEach(() => {
    if (!existsSync(backupDir)) mkdirSync(backupDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(backupDir)) rmSync(backupDir, { recursive: true, force: true });
  });

  describe('createBackup', () => {
    it('should create a backup', async () => {
      const manager = createBackupManager({ backupDir, maxBackups: 10 });
      const backup = await manager.createBackup({ sessions: [{ id: 's1' }] });

      expect(backup.id).toBeDefined();
      expect(backup.createdAt).toBeGreaterThan(0);
    });
  });

  describe('listBackups', () => {
    it('should list created backups', async () => {
      const manager = createBackupManager({ backupDir, maxBackups: 10 });
      await manager.createBackup({ data: 'backup1' });
      await manager.createBackup({ data: 'backup2' });

      const backups = await manager.listBackups();
      expect(backups.length).toBe(2);
    });
  });

  describe('restore', () => {
    it('should restore a backup', async () => {
      const manager = createBackupManager({ backupDir, maxBackups: 10 });
      const original = { sessions: [{ id: 's1', messages: ['hello'] }] };
      const backup = await manager.createBackup(original);

      const restored = await manager.restore(backup.id);
      expect(restored.sessions).toHaveLength(1);
      expect(restored.sessions[0].id).toBe('s1');
    });
  });

  describe('deleteBackup', () => {
    it('should delete a backup', async () => {
      const manager = createBackupManager({ backupDir, maxBackups: 10 });
      const backup = await manager.createBackup({ data: 'delete me' });

      const before = await manager.listBackups();
      expect(before.length).toBe(1);
      const deleted = await manager.deleteBackup(backup.id);
      expect(deleted).toBe(true);

      const after = await manager.listBackups();
      expect(after.length).toBe(0);
    });
  });

  describe('maxBackups cleanup', () => {
    it('should remove oldest backups beyond limit', async () => {
      const manager = createBackupManager({ backupDir, maxBackups: 3 });

      for (let i = 0; i < 5; i++) {
        await manager.createBackup({ index: i });
      }

      const backups = await manager.listBackups();
      expect(backups.length).toBeLessThanOrEqual(3);
    });
  });

  describe('encrypted backup', () => {
    it('should create and restore encrypted backup', async () => {
      const manager = createBackupManager({
        backupDir,
        maxBackups: 10,
        encryptionKey: '0000000000000000000000000000000000000000000000000000000000000001',
      });

      const backup = await manager.createBackup({ secret: 'sensitive' });
      expect(backup.encrypted).toBe(true);

      const restored = await manager.restore(backup.id);
      expect(restored.secret).toBe('sensitive');
    });
  });
});
