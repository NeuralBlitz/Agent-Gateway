import { describe, it, expect, beforeEach } from 'vitest';
import { AuthManager, createAuthManager } from '../src/auth/enterprise.js';

describe('AuthManager', () => {
  let manager: AuthManager;

  beforeEach(() => {
    manager = createAuthManager({
      jwtSecret: 'test-secret-key-for-testing-purposes-only-32-bytes',
      apiKeyAuth: true,
    });
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const user = await manager.createUser('alice', 'password123', 'user');
      expect(user.username).toBe('alice');
      expect(user.role).toBe('user');
    });

    it('should throw if user already exists', async () => {
      await manager.createUser('alice', 'password123');
      await expect(manager.createUser('alice', 'other')).rejects.toThrow('User already exists');
    });
  });

  describe('authenticate', () => {
    it('should authenticate with correct password', async () => {
      await manager.createUser('alice', 'password123', 'user');
      const result = await manager.authenticate('alice', 'password123');
      expect(result.success).toBe(true);
      expect(result.user?.username).toBe('alice');
      expect(result.token).toBeDefined();
    });

    it('should reject wrong password', async () => {
      await manager.createUser('alice', 'password123');
      const result = await manager.authenticate('alice', 'wrong');
      expect(result.success).toBe(false);
    });

    it('should reject unknown user', async () => {
      const result = await manager.authenticate('nobody', 'password');
      expect(result.success).toBe(false);
    });
  });

  describe('API keys', () => {
    it('should create and validate an API key', async () => {
      const user = await manager.createUser('alice', 'password123', 'user');
      const { key } = await manager.createApiKey(user.id, 'test-key', ['chat']);
      expect(key).toMatch(/^agw_key_/);

      // authenticate via API key should work
      const result = await manager.authenticateApiKey(key);
      expect(result.success).toBe(true);
    });

    it('should reject revoked API key', async () => {
      const user = await manager.createUser('alice', 'password123');
      const { key, keyId } = await manager.createApiKey(user.id, 'key');
      await manager.revokeApiKey(keyId);

      const result = await manager.authenticateApiKey(key);
      expect(result.success).toBe(false);
    });

    it('should reject invalid API key', async () => {
      const result = await manager.authenticateApiKey('invalid-key');
      expect(result.success).toBe(false);
    });
  });

  describe('token management', () => {
    it('should generate and verify JWT token', async () => {
      const user = await manager.createUser('alice', 'password123', 'user');
      const token = await manager.generateToken(user);
      expect(token.accessToken).toBeDefined();
      expect(token.refreshToken).toBeDefined();
      expect(token.tokenType).toBe('Bearer');
    });

    it('should refresh token', async () => {
      const user = await manager.createUser('alice', 'password123');
      const token = await manager.generateToken(user);
      const result = await manager.refreshToken(token.refreshToken);
      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
    });

    it('should reject invalid refresh token', async () => {
      const result = await manager.refreshToken('bogus');
      expect(result.success).toBe(false);
    });

    it('should revoke refresh token', async () => {
      const user = await manager.createUser('alice', 'password123');
      const token = await manager.generateToken(user);
      await manager.revokeRefreshToken(token.refreshToken);
      const result = await manager.refreshToken(token.refreshToken);
      expect(result.success).toBe(false);
    });
  });

  describe('permissions', () => {
    it('admin has all permissions', () => {
      const user = { id: '1', username: 'admin', role: 'admin' as const, disabled: false, createdAt: 0 };
      expect(manager.hasPermission(user, 'chat')).toBe(true);
      expect(manager.hasPermission(user, 'admin-only')).toBe(true);
    });

    it('user has chat permission', () => {
      const user = { id: '1', username: 'user', role: 'user' as const, disabled: false, createdAt: 0 };
      expect(manager.hasPermission(user, 'chat')).toBe(true);
      expect(manager.hasPermission(user, 'sessions:read')).toBe(true);
      expect(manager.hasPermission(user, 'admin-only')).toBe(false);
    });

    it('readonly has limited permissions', () => {
      const user = { id: '1', username: 'ro', role: 'readonly' as const, disabled: false, createdAt: 0 };
      expect(manager.hasPermission(user, 'sessions:read')).toBe(true);
      expect(manager.hasPermission(user, 'chat')).toBe(false);
    });

    it('disabled user has no permissions', () => {
      const user = { id: '1', username: 'disabled', role: 'admin' as const, disabled: true as boolean, createdAt: 0 };
      expect(manager.hasPermission(user as any, 'chat')).toBe(false);
    });
  });

  describe('stats', () => {
    it('should return correct stats', async () => {
      await manager.createUser('alice', 'password123');
      const user = await manager.createUser('bob', 'password123');
      await manager.createApiKey(user.id, 'key1');
      await manager.createApiKey(user.id, 'key2');

      const stats = manager.getStats();
      expect(stats.userCount).toBe(2);
      expect(stats.activeApiKeys).toBe(2);
      expect(stats.activeSessions).toBe(0);
    });
  });
});
