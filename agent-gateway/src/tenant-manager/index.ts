/**
 * Enterprise Tenant Manager
 * Multi-tenant isolation with per-tenant configuration,
 * quotas, billing, and resource limits.
 */

import { EventEmitter } from 'events';
import { randomUUID, createHash } from 'crypto';
import { logger } from '../infra/index.js';

export interface Tenant {
  id: string;
  name: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'deleted';
  settings: TenantSettings;
  quotas: TenantQuotas;
  usage: TenantUsage;
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

export interface TenantSettings {
  systemPrompt?: string;
  allowedModels: string[];
  allowedChannels: string[];
  allowedTools: string[];
  enableStreaming: boolean;
  enableWebSearch: boolean;
  enableFileAccess: boolean;
  enableBash: boolean;
  maxConcurrentSessions: number;
  webhookUrl?: string;
  timezone?: string;
  locale?: string;
}

export interface TenantQuotas {
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  maxTokensPerDay: number;
  maxSessions: number;
  maxStorageBytes: number;
  maxApiKeys: number;
}

export interface TenantUsage {
  requestsToday: number;
  tokensToday: number;
  activeSessions: number;
  storageBytes: number;
  apiKeys: number;
  lastActivityAt: number;
}

export interface TenantApiKey {
  id: string;
  tenantId: string;
  name: string;
  keyHash: string;
  permissions: string[];
  createdAt: number;
  expiresAt?: number;
  lastUsedAt?: number;
  revoked: boolean;
}

const DEFAULT_QUOTAS: Record<string, TenantQuotas> = {
  free: { maxRequestsPerMinute: 10, maxRequestsPerDay: 1000, maxTokensPerDay: 50000, maxSessions: 5, maxStorageBytes: 10 * 1024 * 1024, maxApiKeys: 1 },
  starter: { maxRequestsPerMinute: 60, maxRequestsPerDay: 10000, maxTokensPerDay: 500000, maxSessions: 20, maxStorageBytes: 100 * 1024 * 1024, maxApiKeys: 5 },
  pro: { maxRequestsPerMinute: 300, maxRequestsPerDay: 100000, maxTokensPerDay: 5000000, maxSessions: 100, maxStorageBytes: 1024 * 1024 * 1024, maxApiKeys: 20 },
  enterprise: { maxRequestsPerMinute: 1000, maxRequestsPerDay: 1000000, maxTokensPerDay: 50000000, maxSessions: 1000, maxStorageBytes: 10 * 1024 * 1024 * 1024, maxApiKeys: 100 },
};

export class TenantManager extends EventEmitter {
  private tenants: Map<string, Tenant> = new Map();
  private apiKeys: Map<string, TenantApiKey> = new Map();

  /** Create a new tenant */
  async create(data: {
    name: string;
    plan?: Tenant['plan'];
    settings?: Partial<TenantSettings>;
    metadata?: Record<string, any>;
  }): Promise<Tenant> {
    const id = randomUUID();
    const plan = data.plan || 'free';

    const tenant: Tenant = {
      id,
      name: data.name,
      plan,
      status: 'active',
      settings: {
        allowedModels: ['gpt-4o', 'gpt-4o-mini'],
        allowedChannels: ['webchat'],
        allowedTools: ['bash', 'filesystem', 'web_search'],
        enableStreaming: true,
        enableWebSearch: true,
        enableFileAccess: true,
        enableBash: true,
        maxConcurrentSessions: 10,
        ...data.settings,
      },
      quotas: { ...DEFAULT_QUOTAS[plan] },
      usage: {
        requestsToday: 0,
        tokensToday: 0,
        activeSessions: 0,
        storageBytes: 0,
        apiKeys: 0,
        lastActivityAt: Date.now(),
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: data.metadata,
    };

    this.tenants.set(id, tenant);
    logger.info({ tenantId: id, name: tenant.name, plan }, 'Tenant created');
    this.emit('tenant:created', tenant);
    return tenant;
  }

  /** Get a tenant */
  get(id: string): Tenant | undefined {
    return this.tenants.get(id);
  }

  /** Update tenant settings */
  update(id: string, updates: Partial<Pick<Tenant, 'settings' | 'plan' | 'metadata'>>): Tenant | null {
    const tenant = this.tenants.get(id);
    if (!tenant) return null;

    if (updates.plan && updates.plan !== tenant.plan) {
      tenant.plan = updates.plan;
      tenant.quotas = { ...DEFAULT_QUOTAS[updates.plan] };
    }

    if (updates.settings) {
      Object.assign(tenant.settings, updates.settings);
    }

    if (updates.metadata) {
      Object.assign(tenant.metadata || {}, updates.metadata);
    }

    tenant.updatedAt = Date.now();
    this.emit('tenant:updated', tenant);
    return tenant;
  }

  /** Suspend a tenant */
  suspend(id: string): boolean {
    const tenant = this.tenants.get(id);
    if (!tenant) return false;
    tenant.status = 'suspended';
    tenant.updatedAt = Date.now();
    this.emit('tenant:suspended', tenant);
    logger.warn({ tenantId: id }, 'Tenant suspended');
    return true;
  }

  /** Activate a tenant */
  activate(id: string): boolean {
    const tenant = this.tenants.get(id);
    if (!tenant) return false;
    tenant.status = 'active';
    tenant.updatedAt = Date.now();
    this.emit('tenant:activated', tenant);
    return true;
  }

  /** Check if a tenant is within quotas */
  checkQuota(tenantId: string, tokens: number = 0): { allowed: boolean; reason?: string } {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return { allowed: false, reason: 'Tenant not found' };
    if (tenant.status !== 'active') return { allowed: false, reason: `Tenant is ${tenant.status}` };

    if (tenant.usage.requestsToday >= tenant.quotas.maxRequestsPerDay) {
      return { allowed: false, reason: 'Daily request limit exceeded' };
    }
    if (tenant.usage.tokensToday + tokens >= tenant.quotas.maxTokensPerDay) {
      return { allowed: false, reason: 'Daily token limit exceeded' };
    }
    if (tenant.usage.activeSessions >= tenant.quotas.maxSessions) {
      return { allowed: false, reason: 'Max concurrent sessions exceeded' };
    }

    return { allowed: true };
  }

  /** Record usage */
  recordUsage(tenantId: string, tokens: number = 0): void {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return;

    tenant.usage.requestsToday++;
    tenant.usage.tokensToday += tokens;
    tenant.usage.lastActivityAt = Date.now();
  }

  /** Reset daily usage */
  resetDailyUsage(): void {
    for (const tenant of this.tenants.values()) {
      tenant.usage.requestsToday = 0;
      tenant.usage.tokensToday = 0;
    }
    logger.info('Daily usage reset for all tenants');
  }

  /** Create API key for tenant */
  createApiKey(tenantId: string, name: string, permissions: string[] = ['*'], expiresAt?: number): { key: string; apiKey: TenantApiKey } {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) throw new Error('Tenant not found');
    if (tenant.usage.apiKeys >= tenant.quotas.maxApiKeys) throw new Error('Max API keys exceeded');

    const plaintextKey = `agw_${tenantId}_${randomUUID()}`;
    const keyHash = createHash('sha256').update(plaintextKey).digest('hex');

    const apiKey: TenantApiKey = {
      id: randomUUID(),
      tenantId,
      name,
      keyHash,
      permissions,
      createdAt: Date.now(),
      expiresAt,
      revoked: false,
    };

    this.apiKeys.set(keyHash, apiKey);
    tenant.usage.apiKeys++;
    tenant.updatedAt = Date.now();

    return { key: plaintextKey, apiKey };
  }

  /** Validate API key */
  validateApiKey(key: string): { tenant: Tenant; apiKey: TenantApiKey } | null {
    const keyHash = createHash('sha256').update(key).digest('hex');
    const apiKey = this.apiKeys.get(keyHash);

    if (!apiKey || apiKey.revoked) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < Date.now()) {
      apiKey.revoked = true;
      return null;
    }

    const tenant = this.tenants.get(apiKey.tenantId);
    if (!tenant || tenant.status !== 'active') return null;

    apiKey.lastUsedAt = Date.now();
    return { tenant, apiKey };
  }

  /** List tenants */
  list(status?: Tenant['status']): Tenant[] {
    return Array.from(this.tenants.values()).filter(
      (t) => !status || t.status === status
    );
  }

  /** Get stats */
  getStats(): {
    totalTenants: number;
    byPlan: Record<string, number>;
    byStatus: Record<string, number>;
    totalApiKeys: number;
  } {
    const byPlan: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    for (const t of this.tenants.values()) {
      byPlan[t.plan] = (byPlan[t.plan] || 0) + 1;
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    }

    return {
      totalTenants: this.tenants.size,
      byPlan,
      byStatus,
      totalApiKeys: this.apiKeys.size,
    };
  }
}

export function createTenantManager(): TenantManager {
  return new TenantManager();
}
