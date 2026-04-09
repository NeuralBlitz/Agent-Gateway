import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { logger } from '../infra/logger.js';

export interface AuthUser {
  id: string;
  username: string;
  roles: string[];
  metadata?: Record<string, any>;
}

export interface AuthRole {
  name: string;
  permissions: string[];
}

export interface AuthConfig {
  apiKey?: string;
  jwtSecret?: string;
  sessionDuration?: number;
  allowAnonymous?: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: string;
  error?: string;
}

export class Auth {
  private config: AuthConfig;
  private users: Map<string, AuthUser> = new Map();
  private roles: Map<string, AuthRole> = new Map();
  private apiKeys: Map<string, AuthUser> = new Map();
  private sessions: Map<string, { user: AuthUser; expiresAt: number }> = new Map();

  constructor(config: AuthConfig) {
    this.config = config;
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles(): void {
    this.roles.set('admin', {
      name: 'admin',
      permissions: ['*'],
    });

    this.roles.set('user', {
      name: 'user',
      permissions: ['read', 'write'],
    });

    this.roles.set('guest', {
      name: 'guest',
      permissions: ['read'],
    });
  }

  registerUser(username: string, password: string, roles?: string[]): AuthUser {
    const id = `user_${Date.now()}_${randomBytes(4).toString('hex')}`;
    const user: AuthUser = {
      id,
      username,
      roles: roles || ['guest'],
    };

    this.users.set(username, user);
    logger.info(`Registered user: ${username}`);
    return user;
  }

  async login(username: string, password: string): Promise<AuthResult> {
    const user = this.users.get(username);
    
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    const token = this.createSession(user);
    
    return {
      success: true,
      user,
      token,
    };
  }

  async loginWithApiKey(apiKey: string): Promise<AuthResult> {
    const user = this.apiKeys.get(apiKey);
    
    if (!user) {
      return { success: false, error: 'Invalid API key' };
    }

    const token = this.createSession(user);
    
    return {
      success: true,
      user,
      token,
    };
  }

  createApiKey(username: string): string {
    const user = this.users.get(username);
    
    if (!user) {
      throw new Error(`User not found: ${username}`);
    }

    const apiKey = `agw_${randomBytes(32).toString('hex')}`;
    this.apiKeys.set(apiKey, user);
    
    logger.info(`Created API key for user: ${username}`);
    return apiKey;
  }

  revokeApiKey(apiKey: string): boolean {
    const deleted = this.apiKeys.delete(apiKey);
    if (deleted) {
      logger.info(`Revoked API key`);
    }
    return deleted;
  }

  private createSession(user: AuthUser): string {
    const token = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (this.config.sessionDuration || 3600000);
    
    this.sessions.set(token, { user, expiresAt });
    
    return token;
  }

  async verifyToken(token: string): Promise<AuthUser | null> {
    const session = this.sessions.get(token);
    
    if (!session) {
      return null;
    }

    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }

    return session.user;
  }

  logout(token: string): boolean {
    return this.sessions.delete(token);
  }

  hasPermission(user: AuthUser, permission: string): boolean {
    for (const roleName of user.roles) {
      const role = this.roles.get(roleName);
      if (!role) continue;

      if (role.permissions.includes('*')) {
        return true;
      }

      if (role.permissions.includes(permission)) {
        return true;
      }
    }

    return false;
  }

  addRole(name: string, permissions: string[]): void {
    this.roles.set(name, { name, permissions });
  }

  assignRole(username: string, roleName: string): boolean {
    const user = this.users.get(username);
    if (!user) return false;

    if (!user.roles.includes(roleName)) {
      user.roles.push(roleName);
    }

    return true;
  }

  removeRole(username: string, roleName: string): boolean {
    const user = this.users.get(username);
    if (!user) return false;

    user.roles = user.roles.filter(r => r !== roleName);
    return true;
  }

  getUser(username: string): AuthUser | undefined {
    return this.users.get(username);
  }

  listUsers(): AuthUser[] {
    return Array.from(this.users.values());
  }

  listRoles(): AuthRole[] {
    return Array.from(this.roles.values());
  }

  cleanupSessions(): number {
    const now = Date.now();
    let count = 0;

    for (const [token, session] of this.sessions) {
      if (now > session.expiresAt) {
        this.sessions.delete(token);
        count++;
      }
    }

    if (count > 0) {
      logger.info(`Cleaned up ${count} expired sessions`);
    }

    return count;
  }
}

export function createAuth(config: AuthConfig): Auth {
  return new Auth(config);
}

export function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return timingSafeEqual(
    Buffer.from(hashPassword(password)),
    Buffer.from(hash)
  );
}