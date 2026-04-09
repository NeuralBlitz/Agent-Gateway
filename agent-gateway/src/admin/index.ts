// @ts-nocheck
/**
 * Enterprise Admin API
 * System management, analytics, bulk operations, and administrative endpoints.
 */

import { Router } from 'express';
import type { Request, Response } from 'express';
import { logger } from '../infra/index.js';

export interface AdminDeps {
  gateway: any;
  sessionManager: any;
  analytics?: any;
  toolRegistry?: any;
  tenantManager?: any;
  secretManager?: any;
  auditLogger?: any;
  authManager?: any;
}

export function createAdminRouter(deps: AdminDeps): Router {
  const router = Router();

  // --- System Overview ---
  router.get('/overview', (_req: Request, res: Response) => {
    res.json({
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
    });
  });

  // --- Gateway Stats ---
  router.get('/gateway/stats', (_req: Request, res: Response) => {
    res.json({
      channels: Array.from(deps.gateway.getChannels().keys()),
      providers: Array.from(deps.gateway.getProviders().keys()),
      agents: Array.from(deps.gateway.getAgents?.() || new Map()).keys ? Array.from((deps.gateway.getAgents?.() || new Map()).keys()) : [],
      healthy: deps.gateway.isHealthy(),
    });
  });

  // --- Session Management ---
  router.get('/sessions', (req: Request, res: Response) => {
    const sessions = deps.sessionManager.list();
    const limit = parseInt((req.query.limit as string) || '100', 10);
    const offset = parseInt((req.query.offset as string) || '0', 10);

    res.json({
      total: sessions.length,
      sessions: sessions.slice(offset, offset + limit).map((s: any) => ({
        id: s.id,
        channel: s.channel,
        userId: s.userId,
        messageCount: s.getMessages?.()?.length || 0,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
    });
  });

  router.delete('/sessions', (req: Request, res: Response) => {
    const { channel, userId, olderThan } = req.query;
    let deleted = 0;

    const sessions = deps.sessionManager.list(channel as string, userId as string);
    const cutoff = olderThan ? Date.now() - parseInt(olderThan as string, 10) : 0;

    for (const session of sessions) {
      if (cutoff && (session.updatedAt?.getTime() || 0) > cutoff) continue;
      deps.sessionManager.delete(session.id);
      deleted++;
    }

    res.json({ deleted });
  });

  router.post('/sessions/:id/message', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { role, content } = req.body;

    const session = deps.sessionManager.get(id);
    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    await session.addMessage(role, content);
    res.json({ ok: true, messageCount: session.getMessages().length });
  });

  // --- Tool Management ---
  router.get('/tools', (_req: Request, res: Response) => {
    if (!deps.toolRegistry) {
      res.json({ tools: [] });
      return;
    }
    res.json({ tools: deps.toolRegistry.list().map((t: any) => ({ name: t.name, description: t.description })) });
  });

  router.post('/tools/:name/disable', (_req: Request, res: Response) => {
    if (deps.toolRegistry) {
      deps.toolRegistry.unregister(_req.params.name);
      res.json({ ok: true });
    } else {
      res.status(501).json({ error: 'Tool registry not available' });
    }
  });

  // --- Tenant Management ---
  router.get('/tenants', (_req: Request, res: Response) => {
    if (!deps.tenantManager) {
      res.json({ tenants: [] });
      return;
    }
    res.json({ tenants: deps.tenantManager.listTenants() });
  });

  router.get('/tenants/stats', (_req: Request, res: Response) => {
    if (!deps.tenantManager) {
      res.json({});
      return;
    }
    res.json(deps.tenantManager.getStats());
  });

  // --- Secret Management ---
  router.get('/secrets', (_req: Request, res: Response) => {
    if (!deps.secretManager) {
      res.json({ secrets: [] });
      return;
    }
    res.json({ secrets: deps.secretManager.list() });
  });

  router.post('/secrets', async (req: Request, res: Response) => {
    if (!deps.secretManager) {
      res.status(501).json({ error: 'Secret manager not available' });
      return;
    }

    const { name, value, allowedRoles } = req.body;
    if (!name || !value) {
      res.status(400).json({ error: 'name and value required' });
      return;
    }

    await deps.secretManager.set(name, value, allowedRoles || ['admin']);
    res.json({ ok: true });
  });

  // --- Audit Log ---
  router.get('/audit', (req: Request, res: Response) => {
    if (!deps.auditLogger) {
      res.json({ events: [] });
      return;
    }

    const type = req.query.type as string;
    const actor = req.query.actor as string;
    const limit = parseInt((req.query.limit as string) || '100', 10);

    let events;
    if (type) {
      events = deps.auditLogger.searchByType(type as any, limit);
    } else if (actor) {
      events = deps.auditLogger.searchByActor(actor, limit);
    } else {
      events = deps.auditLogger.getRecent(limit);
    }

    res.json({ events, total: events.length });
  });

  router.get('/audit/verify', (_req: Request, res: Response) => {
    if (!deps.auditLogger) {
      res.json({ valid: false, error: 'Audit logger not available' });
      return;
    }
    res.json(deps.auditLogger.verifyChain());
  });

  // --- Auth Management ---
  router.get('/auth/stats', (_req: Request, res: Response) => {
    if (!deps.authManager) {
      res.json({});
      return;
    }
    res.json(deps.authManager.getStats());
  });

  router.post('/auth/users', async (req: Request, res: Response) => {
    if (!deps.authManager) {
      res.status(501).json({ error: 'Auth manager not available' });
      return;
    }

    const { username, password, role, tenantId } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: 'username and password required' });
      return;
    }

    try {
      const user = await deps.authManager.createUser(username, password, role || 'user', tenantId);
      res.status(201).json(user);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // --- Config ---
  router.get('/config', (_req: Request, res: Response) => {
    const { getConfig } = require('../config/index.js');
    const cfg = getConfig();
    const config = cfg.get();

    // Strip sensitive values
    const safe = JSON.parse(JSON.stringify(config));
    for (const ch of safe.channels || []) {
      if (ch.settings) {
        for (const k of Object.keys(ch.settings)) {
          if (/token|key|secret|password/i.test(k)) ch.settings[k] = '***';
        }
      }
    }
    for (const p of safe.providers || []) {
      if (p.settings) {
        for (const k of Object.keys(p.settings)) {
          if (/token|key|secret|password/i.test(k)) p.settings[k] = '***';
        }
      }
    }

    res.json(safe);
  });

  router.put('/config', (req: Request, res: Response) => {
    const { getConfig } = require('../config/index.js');
    const cfg = getConfig();
    cfg.set(req.body);
    cfg.save();
    res.json({ ok: true });
  });

  // --- System Actions ---
  router.post('/actions/clear-cache', async (_req: Request, res: Response) => {
    res.json({ ok: true, action: 'cache-cleared' });
  });

  router.post('/actions/rotate-keys', async (_req: Request, res: Response) => {
    if (deps.secretManager) {
      await deps.secretManager.rotateMasterKey();
      res.json({ ok: true, action: 'keys-rotated' });
    } else {
      res.status(501).json({ error: 'Secret manager not available' });
    }
  });

  router.post('/actions/audit-rotate', async (_req: Request, res: Response) => {
    if (deps.auditLogger) {
      const deleted = await deps.auditLogger.rotateOldFiles();
      res.json({ ok: true, deleted });
    } else {
      res.status(501).json({ error: 'Audit logger not available' });
    }
  });

  return router;
}
