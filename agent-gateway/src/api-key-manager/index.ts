/**
 * Enterprise API Key Manager
 * Full lifecycle API key management with scopes, rotation,
 * usage tracking, and automatic expiration.
 */

import { randomBytes, createHash } from 'crypto';
import { EventEmitter } from 'events';
import { logger } from '../infra/index.js';

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  scopes: string[];
  tenantId?: string;
  userId?: string;
  createdAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  usageCount: number;
  revoked: boolean;
  metadata?: Record<string, any>;
}

export interface ApiKeyCreateOptions {
  name: string;
  scopes?: string[];
  tenantId?: string;
  userId?: string;
  expiresAt?: number;
  metadata?: Record<string, any>;
}

export interface ApiKeyValidationResult {
  valid: boolean;
  key?: ApiKey;
  error?: string;
}

export class ApiKeyManager extends EventEmitter {
  private keys: Map<string, ApiKey> = new Map();
  private keyHashes: Map<string, string> = new Map(); // hash -> keyId

  /** Create a new API key */
  create(options: ApiKeyCreateOptions): { key: string; apiKey: ApiKey } {
    const plaintext = `agw_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(plaintext).digest('hex');
    const keyId = randomBytes(8).toString('hex');

    const apiKey: ApiKey = {
      id: keyId,
      name: options.name,
      keyHash,
      scopes: options.scopes || ['*'],
      tenantId: options.tenantId,
      userId: options.userId,
      createdAt: Date.now(),
      expiresAt: options.expiresAt,
      usageCount: 0,
      revoked: false,
      metadata: options.metadata,
    };

    this.keys.set(keyId, apiKey);
    this.keyHashes.set(keyHash, keyId);

    this.emit('key:created', apiKey);
    logger.info({ keyId, name: apiKey.name, scopes: apiKey.scopes }, 'API key created');

    return { key: plaintext, apiKey };
  }

  /** Validate an API key */
  validate(plaintext: string): ApiKeyValidationResult {
    const keyHash = createHash('sha256').update(plaintext).digest('hex');
    const keyId = this.keyHashes.get(keyHash);

    if (!keyId) {
      return { valid: false, error: 'Invalid API key' };
    }

    const apiKey = this.keys.get(keyId);
    if (!apiKey) {
      return { valid: false, error: 'Key not found' };
    }

    if (apiKey.revoked) {
      return { valid: false, error: 'API key has been revoked' };
    }

    if (apiKey.expiresAt && Date.now() > apiKey.expiresAt) {
      return { valid: false, error: 'API key has expired' };
    }

    // Update usage
    apiKey.lastUsedAt = Date.now();
    apiKey.usageCount++;

    return { valid: true, key: apiKey };
  }

  /** Check if a key has a specific scope */
  hasScope(keyId: string, scope: string): boolean {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) return false;
    return apiKey.scopes.includes('*') || apiKey.scopes.includes(scope);
  }

  /** Revoke an API key */
  revoke(keyId: string): boolean {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) return false;

    apiKey.revoked = true;
    this.keyHashes.delete(apiKey.keyHash);

    this.emit('key:revoked', apiKey);
    logger.info({ keyId, name: apiKey.name }, 'API key revoked');
    return true;
  }

  /** Rotate an API key (revoke old, create new) */
  rotate(keyId: string, options?: { name?: string }): { key: string; apiKey: ApiKey } {
    const oldKey = this.keys.get(keyId);
    if (!oldKey) throw new Error('Key not found');

    // Revoke old key
    this.revoke(keyId);

    // Create new key with same settings
    const newKey = this.create({
      name: options?.name || `${oldKey.name} (rotated)`,
      scopes: oldKey.scopes,
      tenantId: oldKey.tenantId,
      userId: oldKey.userId,
      metadata: { ...oldKey.metadata, rotatedFrom: keyId },
    });

    this.emit('key:rotated', { oldKey, newKey: newKey.apiKey });
    return newKey;
  }

  /** List all API keys */
  list(filter?: { tenantId?: string; userId?: string; revoked?: boolean }): ApiKey[] {
    let keys = Array.from(this.keys.values());

    if (filter?.tenantId) keys = keys.filter((k) => k.tenantId === filter.tenantId);
    if (filter?.userId) keys = keys.filter((k) => k.userId === filter.userId);
    if (filter?.revoked !== undefined) keys = keys.filter((k) => k.revoked === filter.revoked);

    // Don't return keyHashes in list
    return keys.map(({ keyHash, ...rest }) => rest as ApiKey);
  }

  /** Get a specific key */
  get(keyId: string): ApiKey | undefined {
    const key = this.keys.get(keyId);
    if (!key) return undefined;
    const { keyHash, ...rest } = key;
    return rest as ApiKey;
  }

  /** Get stats */
  getStats(): {
    total: number;
    active: number;
    revoked: number;
    expired: number;
    totalUsage: number;
  } {
    const keys = Array.from(this.keys.values());
    const now = Date.now();

    return {
      total: keys.length,
      active: keys.filter((k) => !k.revoked && (!k.expiresAt || k.expiresAt > now)).length,
      revoked: keys.filter((k) => k.revoked).length,
      expired: keys.filter((k) => k.expiresAt && k.expiresAt <= now).length,
      totalUsage: keys.reduce((sum, k) => sum + k.usageCount, 0),
    };
  }

  /** Cleanup expired and revoked keys */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [keyId, key] of this.keys) {
      if (key.revoked || (key.expiresAt && key.expiresAt < now)) {
        this.keyHashes.delete(key.keyHash);
        this.keys.delete(keyId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug({ cleaned }, 'API key cleanup completed');
    }

    return cleaned;
  }
}

export function createApiKeyManager(): ApiKeyManager {
  return new ApiKeyManager();
}
