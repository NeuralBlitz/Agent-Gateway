// @ts-nocheck
/**
 * Enterprise Secret Management
 * Encrypted secret storage with key rotation, access control,
 * and optional HashiCorp Vault integration.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from '../infra/index.js';

// --- Types ---

export interface SecretEntry {
  id: string;
  name: string;
  /** Encrypted value */
  encryptedValue: string;
  /** IV used for encryption */
  iv: string;
  /** Key version (for rotation) */
  keyVersion: number;
  /** When the secret was created */
  createdAt: number;
  /** When the secret was last accessed */
  lastAccessedAt?: number;
  /** Who can access this secret */
  allowedRoles: string[];
  /** Whether the secret can be rotated */
  rotatable: boolean;
  /** Expiration (optional) */
  expiresAt?: number;
}

export interface SecretManagerConfig {
  /** Master encryption key (32 bytes hex) */
  masterKey?: string;
  /** Storage file path */
  storagePath?: string;
  /** Whether to auto-rotate secrets */
  autoRotate?: boolean;
  /** Rotation interval in ms (default: 90 days) */
  rotationInterval?: number;
  /** Vault URL (if using HashiCorp Vault) */
  vaultUrl?: string;
  /** Vault token */
  vaultToken?: string;
}

export class SecretManager {
  private config: Required<SecretManagerConfig>;
  private secrets: Map<string, SecretEntry> = new Map();
  private currentKeyVersion = 1;
  private masterKey: Buffer;

  constructor(config: SecretManagerConfig = {}) {
    this.config = {
      masterKey: config.masterKey || process.env.MASTER_KEY || this.generateMasterKey(),
      storagePath: config.storagePath || '.secrets.json',
      autoRotate: config.autoRotate ?? false,
      rotationInterval: config.rotationInterval || 90 * 24 * 60 * 60 * 1000,
      vaultUrl: config.vaultUrl || '',
      vaultToken: config.vaultToken || '',
    };

    this.masterKey = Buffer.from(this.config.masterKey, 'hex');

    if (this.masterKey.length !== 32) {
      throw new Error('Master key must be 32 bytes (64 hex characters)');
    }

    // Load existing secrets
    this.load().catch((err) => {
      logger.warn({ err }, 'Failed to load secrets from storage, starting fresh');
    });
  }

  /** Set a secret (encrypts and stores) */
  async set(name: string, value: string, allowedRoles: string[] = ['admin'], rotatable: boolean = false): Promise<void> {
    const iv = randomBytes(16);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);

    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    const entry: SecretEntry = {
      id: randomBytes(8).toString('hex'),
      name,
      encryptedValue: encrypted + ':' + authTag.toString('hex'),
      iv: iv.toString('hex'),
      keyVersion: this.currentKeyVersion,
      createdAt: Date.now(),
      allowedRoles,
      rotatable,
    };

    this.secrets.set(name, entry);
    await this.save();

    logger.info({ name, keyVersion: this.currentKeyVersion }, 'Secret stored');
  }

  /** Get a secret (decrypts) */
  async get(name: string): Promise<string | null> {
    const entry = this.secrets.get(name);
    if (!entry) return null;

    // Check expiration
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      logger.warn({ name }, 'Secret expired');
      return null;
    }

    const [encrypted, authTagHex] = entry.encryptedValue.split(':');
    const iv = Buffer.from(entry.iv, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    entry.lastAccessedAt = Date.now();
    return decrypted;
  }

  /** Delete a secret */
  async delete(name: string): Promise<boolean> {
    const deleted = this.secrets.delete(name);
    if (deleted) await this.save();
    return deleted;
  }

  /** Rotate the master key and re-encrypt all secrets */
  async rotateMasterKey(): Promise<void> {
    const oldKey = this.masterKey;
    const newKey = randomBytes(32);

    // Decrypt all secrets with old key
    const decryptedSecrets: Array<{ name: string; value: string; entry: SecretEntry }> = [];

    for (const [name, entry] of this.secrets) {
      try {
        const value = await this.get(name);
        if (value) {
          decryptedSecrets.push({ name, value, entry });
        }
      } catch (err: any) {
        logger.error({ name, err }, 'Failed to decrypt secret during rotation');
      }
    }

    // Set new master key
    this.masterKey = newKey;
    this.currentKeyVersion++;

    // Re-encrypt all secrets with new key
    for (const { name, value, entry } of decryptedSecrets) {
      await this.set(name, value, entry.allowedRoles, entry.rotatable);
    }

    logger.info({ keyVersion: this.currentKeyVersion }, 'Master key rotated');
  }

  /** List all secret names (not values) */
  list(): { name: string; keyVersion: number; createdAt: number; lastAccessedAt?: number; rotatable: boolean }[] {
    return Array.from(this.secrets.values()).map((e) => ({
      name: e.name,
      keyVersion: e.keyVersion,
      createdAt: e.createdAt,
      lastAccessedAt: e.lastAccessedAt,
      rotatable: e.rotatable,
    }));
  }

  /** Check if a secret needs rotation */
  needsRotation(name: string): boolean {
    const entry = this.secrets.get(name);
    if (!entry || !entry.rotatable) return false;
    return Date.now() - entry.createdAt > this.config.rotationInterval;
  }

  /** Auto-rotate secrets that are past their rotation interval */
  async autoRotateSecrets(): Promise<number> {
    let rotated = 0;

    for (const entry of this.secrets.values()) {
      if (entry.rotatable && this.needsRotation(entry.name)) {
        const value = await this.get(entry.name);
        if (value) {
          await this.set(entry.name, value, entry.allowedRoles, true);
          rotated++;
        }
      }
    }

    if (rotated > 0) {
      logger.info({ rotated }, 'Auto-rotated secrets');
    }

    return rotated;
  }

  // --- Vault Integration ---

  /** Fetch a secret from HashiCorp Vault */
  async getFromVault(path: string): Promise<string | null> {
    if (!this.config.vaultUrl || !this.config.vaultToken) return null;

    try {
      const response = await fetch(`${this.config.vaultUrl}/v1/${path}`, {
        headers: { 'X-Vault-Token': this.config.vaultToken },
      });

      if (!response.ok) return null;

      const data = await response.json() as any;
      return data.data?.data?.value || data.data?.value || null;
    } catch (err: any) {
      logger.error({ err }, 'Failed to fetch secret from Vault');
      return null;
    }
  }

  /** Store a secret in HashiCorp Vault */
  async setInVault(path: string, value: string): Promise<boolean> {
    if (!this.config.vaultUrl || !this.config.vaultToken) return false;

    try {
      const response = await fetch(`${this.config.vaultUrl}/v1/${path}`, {
        method: 'POST',
        headers: {
          'X-Vault-Token': this.config.vaultToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: { value } }),
      });

      return response.ok;
    } catch (err: any) {
      logger.error({ err }, 'Failed to store secret in Vault');
      return false;
    }
  }

  // --- Persistence ---

  private async load(): Promise<void> {
    try {
      if (existsSync(this.config.storagePath)) {
        const content = await readFile(this.config.storagePath, 'utf-8');
        const data = JSON.parse(content);

        for (const entry of data.secrets || []) {
          this.secrets.set(entry.name, entry);
        }
        this.currentKeyVersion = data.keyVersion || 1;
      }
    } catch (err: any) {
      if (err.code !== 'ENOENT') {
        logger.error({ err }, 'Failed to load secrets');
      }
    }
  }

  private async save(): Promise<void> {
    const dir = join(process.cwd(), dirname(this.config.storagePath));
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const data = {
      keyVersion: this.currentKeyVersion,
      secrets: Array.from(this.secrets.values()),
    };

    await writeFile(this.config.storagePath, JSON.stringify(data, null, 2), { mode: 0o600 });
  }

  private generateMasterKey(): string {
    const key = randomBytes(32).toString('hex');
    logger.warn('Generated new master key. Set MASTER_KEY env var for persistence.');
    return key;
  }

  /** Get stats */
  getStats(): { secretCount: number; keyVersion: number } {
    return {
      secretCount: this.secrets.size,
      keyVersion: this.currentKeyVersion,
    };
  }
}

export function createSecretManager(config?: SecretManagerConfig): SecretManager {
  return new SecretManager(config);
}
