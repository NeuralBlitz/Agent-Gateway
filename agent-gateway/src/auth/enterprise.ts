/**
 * Enterprise Authentication System
 * JWT-based auth with OAuth2/OIDC support, role-based access control,
 * API key authentication, and session management.
 */

import { createHmac, randomBytes, createHash } from 'crypto';
import { logger } from '../infra/index.js';

// --- Types ---

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role: AuthRole;
  tenantId?: string;
  metadata?: Record<string, any>;
  createdAt: number;
  lastLoginAt?: number;
  disabled: boolean;
}

export type AuthRole = 'admin' | 'operator' | 'user' | 'readonly';

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface OAuthProvider {
  id: string;
  type: 'oidc' | 'google' | 'github' | 'microsoft';
  clientId: string;
  clientSecret: string;
  issuerUrl?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  userInfoUrl?: string;
  scopes: string[];
}

export interface AuthConfig {
  /** JWT signing secret (or path to private key) */
  jwtSecret: string;
  /** Access token TTL in seconds (default: 1h) */
  accessTokenTtl?: number;
  /** Refresh token TTL in seconds (default: 7d) */
  refreshTokenTtl?: number;
  /** OAuth providers */
  oauthProviders?: OAuthProvider[];
  /** Whether to allow API key auth */
  apiKeyAuth?: boolean;
  /** Whether to allow anonymous access */
  allowAnonymous?: boolean;
  /** Password hashing rounds */
  bcryptRounds?: number;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  token?: AuthToken;
  error?: string;
}

// --- Password Hashing ---

async function hashPassword(password: string, rounds: number = 12): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, rounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.compare(password, hash);
}

// --- JWT Token Management ---

async function createJwtToken(
  payload: Record<string, any>,
  secret: string,
  expiresIn: number,
): Promise<string> {
  const jwt = await import('jsonwebtoken');
  return jwt.sign(payload, secret, { expiresIn });
}

async function verifyJwtToken(token: string, secret: string): Promise<Record<string, any> | null> {
  const jwt = await import('jsonwebtoken');
  try {
    return jwt.verify(token, secret) as Record<string, any>;
  } catch {
    return null;
  }
}

// --- In-Memory Stores ---

interface StoredUser extends AuthUser {
  passwordHash?: string;
}

interface StoredApiKey {
  id: string;
  userId: string;
  keyHash: string;
  name: string;
  permissions: string[];
  createdAt: number;
  expiresAt?: number;
  revoked: boolean;
  lastUsedAt?: number;
}

interface StoredOAuthState {
  state: string;
  provider: string;
  redirectUri: string;
  expiresAt: number;
}

// --- Auth Manager ---

export class AuthManager {
  private config: Required<AuthConfig>;
  private users: Map<string, StoredUser> = new Map();
  private apiKeys: Map<string, StoredApiKey> = new Map();
  private refreshTokens: Map<string, { userId: string; expiresAt: number }> = new Map();
  private oauthStates: Map<string, StoredOAuthState> = new Map();

  constructor(config: AuthConfig) {
    this.config = {
      jwtSecret: config.jwtSecret,
      accessTokenTtl: config.accessTokenTtl || 3600,
      refreshTokenTtl: config.refreshTokenTtl || 7 * 24 * 3600,
      oauthProviders: config.oauthProviders || [],
      apiKeyAuth: config.apiKeyAuth ?? true,
      allowAnonymous: config.allowAnonymous ?? false,
      bcryptRounds: config.bcryptRounds || 12,
    };
  }

  // --- User Management ---

  async createUser(
    username: string,
    password: string,
    role: AuthRole = 'user',
    tenantId?: string,
  ): Promise<AuthUser> {
    if (this.users.has(username)) {
      throw new Error(`User already exists: ${username}`);
    }

    const passwordHash = await hashPassword(password, this.config.bcryptRounds);
    const user: StoredUser = {
      id: randomUUID(),
      username,
      role,
      tenantId,
      createdAt: Date.now(),
      disabled: false,
      passwordHash,
    };

    this.users.set(username, user);
    logger.info({ userId: user.id, username, role }, 'User created');
    return this.toPublicUser(user);
  }

  async authenticate(username: string, password: string): Promise<AuthResult> {
    const user = this.users.get(username);
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }
    if (user.disabled) {
      return { success: false, error: 'Account disabled' };
    }
    if (!user.passwordHash) {
      return { success: false, error: 'No password set for this account' };
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return { success: false, error: 'Invalid credentials' };
    }

    user.lastLoginAt = Date.now();
    const token = await this.generateToken(user);

    return { success: true, user: this.toPublicUser(user), token };
  }

  async authenticateApiKey(apiKey: string): Promise<AuthResult> {
    const keyHash = createHash('sha256').update(apiKey).digest('hex');
    const storedKey = this.apiKeys.get(keyHash);

    if (!storedKey) {
      return { success: false, error: 'Invalid API key' };
    }
    if (storedKey.revoked) {
      return { success: false, error: 'API key revoked' };
    }
    if (storedKey.expiresAt && storedKey.expiresAt < Date.now()) {
      return { success: false, error: 'API key expired' };
    }

    const user = Array.from(this.users.values()).find((u) => u.id === storedKey.userId);
    if (!user || user.disabled) {
      return { success: false, error: 'User not found or disabled' };
    }

    storedKey.lastUsedAt = Date.now();
    return { success: true, user: this.toPublicUser(user) };
  }

  async createApiKey(userId: string, name: string, permissions: string[] = ['*'], expiresAt?: number): Promise<{ key: string; keyId: string }> {
    const plaintextKey = `agw_key_${randomBytes(24).toString('hex')}`;
    const keyHash = createHash('sha256').update(plaintextKey).digest('hex');

    const apiKey: StoredApiKey = {
      id: randomUUID(),
      userId,
      keyHash,
      name,
      permissions,
      createdAt: Date.now(),
      expiresAt,
      revoked: false,
    };

    this.apiKeys.set(keyHash, apiKey);
    logger.info({ userId, name, keyId: apiKey.id }, 'API key created');

    return { key: plaintextKey, keyId: apiKey.id };
  }

  async revokeApiKey(keyId: string): Promise<boolean> {
    for (const [hash, key] of this.apiKeys) {
      if (key.id === keyId) {
        key.revoked = true;
        logger.info({ keyId }, 'API key revoked');
        return true;
      }
    }
    return false;
  }

  // --- Token Management ---

  async generateToken(user: AuthUser): Promise<AuthToken> {
    const accessToken = await createJwtToken(
      {
        sub: user.id,
        username: user.username,
        role: user.role,
        tenantId: user.tenantId,
        type: 'access',
      },
      this.config.jwtSecret,
      this.config.accessTokenTtl,
    );

    const refreshToken = randomBytes(32).toString('hex');
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + this.config.refreshTokenTtl * 1000,
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.accessTokenTtl,
      tokenType: 'Bearer',
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthResult> {
    const stored = this.refreshTokens.get(refreshToken);
    if (!stored || stored.expiresAt < Date.now()) {
      this.refreshTokens.delete(refreshToken);
      return { success: false, error: 'Invalid or expired refresh token' };
    }

    // Find user by ID
    const user = Array.from(this.users.values()).find((u) => u.id === stored.userId);
    if (!user || user.disabled) {
      return { success: false, error: 'User not found or disabled' };
    }

    const token = await this.generateToken(this.toPublicUser(user));
    return { success: true, user: this.toPublicUser(user), token };
  }

  async revokeRefreshToken(refreshToken: string): Promise<void> {
    this.refreshTokens.delete(refreshToken);
  }

  // --- OAuth2/OIDC ---

  createOAuthState(providerId: string, redirectUri: string): { authorizationUrl: string; state: string } {
    const provider = this.config.oauthProviders.find((p) => p.id === providerId);
    if (!provider) throw new Error(`OAuth provider not found: ${providerId}`);

    const state = randomBytes(16).toString('hex');
    this.oauthStates.set(state, {
      state,
      provider: providerId,
      redirectUri,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    const authUrl = provider.authorizationUrl || this.getDefaultAuthUrl(provider);
    const url = new URL(authUrl);
    url.searchParams.set('client_id', provider.clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('state', state);
    url.searchParams.set('scope', provider.scopes.join(' '));

    return { authorizationUrl: url.toString(), state };
  }

  async handleOAuthCallback(
    providerId: string,
    code: string,
    state: string,
    redirectUri: string,
  ): Promise<AuthResult> {
    const oauthState = this.oauthStates.get(state);
    if (!oauthState || oauthState.provider !== providerId || oauthState.expiresAt < Date.now()) {
      return { success: false, error: 'Invalid OAuth state' };
    }
    this.oauthStates.delete(state);

    const provider = this.config.oauthProviders.find((p) => p.id === providerId);
    if (!provider) return { success: false, error: 'Provider not found' };

    // Exchange code for token
    const tokenResponse = await fetch(provider.tokenUrl || this.getDefaultTokenUrl(provider), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: provider.clientId,
        client_secret: provider.clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      return { success: false, error: `OAuth token exchange failed: ${tokenResponse.status}` };
    }

    const tokenData = await tokenResponse.json() as any;

    // Get user info
    const userInfoResponse = await fetch(provider.userInfoUrl || this.getDefaultUserInfoUrl(provider), {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      return { success: false, error: 'Failed to fetch user info' };
    }

    const userInfo = await userInfoResponse.json() as any;

    // Find or create user
    const username = userInfo.login || userInfo.email || userInfo.sub;
    let user = this.users.get(username);

    if (!user) {
      // Create user from OAuth info
      user = {
        id: randomUUID(),
        username,
        email: userInfo.email,
        role: 'user',
        createdAt: Date.now(),
        disabled: false,
        metadata: { oauthProvider: providerId, oauthSub: userInfo.sub },
      };
      this.users.set(username, user);
    }

    user.lastLoginAt = Date.now();
    const token = await this.generateToken(this.toPublicUser(user));

    return { success: true, user: this.toPublicUser(user), token };
  }

  // --- Authorization ---

  hasPermission(user: AuthUser, requiredPermission: string): boolean {
    if (user.disabled) return false;
    if (user.role === 'admin') return true;

    const rolePermissions: Record<AuthRole, string[]> = {
      admin: ['*'],
      operator: ['chat', 'stream', 'sessions:read', 'sessions:write', 'metrics:read'],
      user: ['chat', 'stream', 'sessions:read'],
      readonly: ['sessions:read', 'metrics:read'],
    };

    const permissions = rolePermissions[user.role] || [];
    return permissions.includes('*') || permissions.includes(requiredPermission);
  }

  // --- Express Middleware ---

  /** JWT authentication middleware */
  jwtMiddleware(): (req: any, res: any, next: () => void) => Promise<void> {
    return async (req: any, res: any, next: () => void) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        if (this.config.allowAnonymous) {
          req.user = { id: 'anonymous', username: 'anonymous', role: 'readonly' as AuthRole, disabled: false, createdAt: 0 };
          next();
          return;
        }
        res.status(401).json({ error: 'Missing authorization header' });
        return;
      }

      const [scheme, token] = authHeader.split(' ');
      if (scheme !== 'Bearer') {
        res.status(401).json({ error: 'Invalid authorization scheme' });
        return;
      }

      // Try JWT first
      const payload = await verifyJwtToken(token, this.config.jwtSecret);
      if (payload) {
        const user: AuthUser = {
          id: payload.sub,
          username: payload.username,
          role: payload.role,
          tenantId: payload.tenantId,
          disabled: false,
          createdAt: 0,
        };
        req.user = user;
        next();
        return;
      }

      // Try API key
      if (this.config.apiKeyAuth) {
        const result = await this.authenticateApiKey(token);
        if (result.success && result.user) {
          req.user = result.user;
          next();
          return;
        }
      }

      res.status(401).json({ error: 'Invalid credentials' });
    };
  }

  /** Permission check middleware */
  requirePermission(permission: string): (req: any, res: any, next: () => void) => void {
    return (req: any, res: any, next: () => void) => {
      const user = req.user;
      if (!user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }
      if (!this.hasPermission(user, permission)) {
        res.status(403).json({ error: `Permission denied: ${permission}` });
        return;
      }
      next();
    };
  }

  // --- Stats ---

  getStats(): { userCount: number; activeApiKeys: number; activeSessions: number } {
    return {
      userCount: this.users.size,
      activeApiKeys: Array.from(this.apiKeys.values()).filter((k) => !k.revoked).length,
      activeSessions: this.refreshTokens.size,
    };
  }

  // --- Helpers ---

  private toPublicUser(user: StoredUser): AuthUser {
    const { passwordHash, ...publicUser } = user;
    return publicUser;
  }

  private getDefaultAuthUrl(provider: OAuthProvider): string {
    const urls: Record<string, string> = {
      google: 'https://accounts.google.com/o/oauth2/v2/auth',
      github: 'https://github.com/login/oauth/authorize',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    };
    return urls[provider.type] || provider.issuerUrl || '';
  }

  private getDefaultTokenUrl(provider: OAuthProvider): string {
    const urls: Record<string, string> = {
      google: 'https://oauth2.googleapis.com/token',
      github: 'https://github.com/login/oauth/access_token',
      microsoft: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    };
    return urls[provider.type] || '';
  }

  private getDefaultUserInfoUrl(provider: OAuthProvider): string {
    const urls: Record<string, string> = {
      google: 'https://www.googleapis.com/oauth2/v3/userinfo',
      github: 'https://api.github.com/user',
      microsoft: 'https://graph.microsoft.com/oidc/userinfo',
    };
    return urls[provider.type] || '';
  }
}

// Helper for random UUID
function randomUUID(): string {
  return `${Date.now()}-${randomBytes(8).toString('hex')}`;
}

export function createAuthManager(config: AuthConfig): AuthManager {
  return new AuthManager(config);
}
