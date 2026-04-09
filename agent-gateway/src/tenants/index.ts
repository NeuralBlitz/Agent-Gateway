export interface Tenant {
  id: string;
  name: string;
  allowedProviders: string[];
  allowedChannels: string[];
  allowedTools?: string[];
  toolsEnabled?: boolean;
  maxDailyTokens?: number;
  createdAt: number;
}

export interface TenantRegistration {
  id: string;
  name: string;
  allowedProviders: string[];
  allowedChannels: string[];
  allowedTools?: string[];
  toolsEnabled?: boolean;
  maxDailyTokens?: number;
}

export interface ApiKeyInfo {
  key: string;
  keyId: string;
}

export interface UsageInfo {
  dailyTokens: number;
  dailyRequests: number;
}

export interface TenantStats {
  tenantCount: number;
  apiKeyCount: number;
}

interface ApiKeyRecord {
  key: string;
  tenantId: string;
  permissions: string[];
  revoked: boolean;
  expiresAt?: number;
}

export class TenantManager {
  private tenants = new Map<string, Tenant>();
  private apiKeys = new Map<string, ApiKeyRecord>();
  private usage = new Map<string, UsageInfo>();

  async registerTenant(reg: TenantRegistration): Promise<Tenant> {
    const tenant: Tenant = {
      ...reg,
      createdAt: Date.now(),
    };
    this.tenants.set(tenant.id, tenant);
    this.usage.set(tenant.id, { dailyTokens: 0, dailyRequests: 0 });
    return tenant;
  }

  getTenant(id: string): Tenant | undefined {
    return this.tenants.get(id);
  }

  listTenants(): Tenant[] {
    return Array.from(this.tenants.values());
  }

  removeTenant(id: string): boolean {
    const existed = this.tenants.delete(id);
    if (existed) {
      // Clean up API keys
      for (const [keyId, record] of this.apiKeys) {
        if (record.tenantId === id) {
          this.apiKeys.delete(keyId);
        }
      }
      this.usage.delete(id);
    }
    return existed;
  }

  createApiKey(
    tenantId: string,
    name: string,
    permissions: string[] = [],
    expiresAt?: number
  ): ApiKeyInfo {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
    const keyId = `key_${tenantId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const key = `agw_${tenantId}_${keyId}`;
    this.apiKeys.set(keyId, {
      key,
      tenantId,
      permissions,
      revoked: false,
      expiresAt,
    });
    return { key, keyId };
  }

  validateApiKey(key: string): { tenant: Tenant } | null {
    for (const record of this.apiKeys.values()) {
      if (record.key === key) {
        if (record.revoked) return null;
        if (record.expiresAt && Date.now() > record.expiresAt) return null;
        const tenant = this.tenants.get(record.tenantId);
        if (!tenant) return null;
        return { tenant };
      }
    }
    return null;
  }

  revokeApiKey(keyId: string): boolean {
    const record = this.apiKeys.get(keyId);
    if (!record) return false;
    record.revoked = true;
    return true;
  }

  getUsage(tenantId: string): UsageInfo | undefined {
    return this.usage.get(tenantId);
  }

  recordUsage(tenantId: string, tokens: number): void {
    const u = this.usage.get(tenantId);
    if (u) {
      u.dailyTokens += tokens;
      u.dailyRequests += 1;
    }
  }

  checkLimits(tenantId: string): { allowed: boolean; reason?: string } {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return { allowed: false, reason: 'Tenant not found' };
    if (!tenant.maxDailyTokens) return { allowed: true };
    const u = this.usage.get(tenantId);
    if (u && u.dailyTokens > tenant.maxDailyTokens) {
      return { allowed: false, reason: 'Daily token limit exceeded' };
    }
    return { allowed: true };
  }

  resetDailyUsage(tenantId?: string): void {
    if (tenantId) {
      const u = this.usage.get(tenantId);
      if (u) {
        u.dailyTokens = 0;
        u.dailyRequests = 0;
      }
    } else {
      for (const u of this.usage.values()) {
        u.dailyTokens = 0;
        u.dailyRequests = 0;
      }
    }
  }

  canUseProvider(tenantId: string, provider: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;
    if (tenant.allowedProviders.length === 0) return true;
    return tenant.allowedProviders.includes(provider);
  }

  canUseTool(tenantId: string, tool: string): boolean {
    const tenant = this.tenants.get(tenantId);
    if (!tenant) return false;
    if (tenant.toolsEnabled === false) return false;
    if (!tenant.allowedTools || tenant.allowedTools.length === 0) return true;
    return tenant.allowedTools.includes(tool);
  }

  getStats(): TenantStats {
    return {
      tenantCount: this.tenants.size,
      apiKeyCount: this.apiKeys.size,
    };
  }
}

export function createTenantManager(): TenantManager {
  return new TenantManager();
}
