import { logger } from '../infra/index.js';
import { fetch } from 'undici';
import { existsSync, rmSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export const sessionsCommand = {
  name: 'sessions',
  description: 'Manage sessions: list, reset, prune',
  options: [
    { name: 'port', type: 'string', description: 'Gateway port (default: 3000)', default: '3000' },
    { name: 'list', type: 'boolean', description: 'List active sessions' },
    { name: 'reset', type: 'string', description: 'Reset a specific session by ID' },
    { name: 'prune', type: 'boolean', description: 'Delete old sessions' },
    { name: 'older-than', type: 'string', description: 'Prune sessions older than N days (default: 30)', default: '30' },
    { name: 'channel', type: 'string', description: 'Filter by channel' },
    { name: 'user', type: 'string', description: 'Filter by user ID' },
    { name: 'json', type: 'boolean', description: 'Output as JSON', default: false },
  ],
  handler: async (args: string[], options: any) => {
    const port = parseInt(options.port || '3000', 10);
    const asJson = options.json === true || options.json === 'true';

    // Reset a specific session
    if (options.reset) {
      try {
        const response = await fetch(`http://localhost:${port}/api/sessions/${options.reset}`, {
          method: 'DELETE',
          signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
          logger.error(`Failed to reset session: ${response.statusText}`);
          process.exit(1);
        }

        if (asJson) {
          console.log(JSON.stringify({ ok: true, sessionId: options.reset }));
        } else {
          logger.info(`Session ${options.reset} has been reset`);
        }
      } catch (err: any) {
        logger.error(`Cannot connect to gateway: ${err.message}`);
        process.exit(1);
      }
      return;
    }

    // Prune old sessions
    if (options.prune || options['older-than']) {
      const days = parseInt(options['older-than'] || '30', 10);
      const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

      // Prune file-based sessions
      const sessionsDir = process.env.AGENT_SESSIONS_DIR || join(process.cwd(), '.agent-sessions');
      if (existsSync(sessionsDir)) {
        let pruned = 0;
        const files = readdirSync(sessionsDir);
        for (const file of files) {
          if (!file.endsWith('.json')) continue;
          const filePath = join(sessionsDir, file);
          try {
            const stat = statSync(filePath);
            if (stat.mtimeMs < cutoff) {
              rmSync(filePath);
              pruned++;
            }
          } catch {}
        }

        if (asJson) {
          console.log(JSON.stringify({ pruned, directory: sessionsDir, olderThanDays: days }));
        } else {
          logger.info(`Pruned ${pruned} sessions older than ${days} days from ${sessionsDir}`);
        }
      } else {
        if (asJson) {
          console.log(JSON.stringify({ pruned: 0, error: 'Sessions directory not found' }));
        } else {
          logger.warn(`Sessions directory not found: ${sessionsDir}`);
        }
      }

      // Also prune via API if gateway is running
      try {
        const response = await fetch(`http://localhost:${port}/api/sessions`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ olderThan: cutoff }),
          signal: AbortSignal.timeout(10000),
        });
        if (response.ok) {
          const result = await response.json() as any;
          if (asJson) {
            console.log(JSON.stringify({ apiPruned: result.deleted || 0 }));
          } else {
            logger.info(`API pruned ${result.deleted || 0} sessions`);
          }
        }
      } catch {
        // Gateway not running, skip API prune
      }
      return;
    }

    // List sessions (default)
    try {
      let url = `http://localhost:${port}/api/sessions`;
      const params: string[] = [];
      if (options.channel) params.push(`channel=${options.channel}`);
      if (options.user) params.push(`userId=${options.user}`);
      if (params.length > 0) url += `?${params.join('&')}`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        logger.error(`Failed to list sessions: ${response.statusText}`);
        process.exit(1);
      }

      const data = await response.json() as any;
      const sessions = data.sessions || [];

      if (asJson) {
        console.log(JSON.stringify({ sessions, total: sessions.length }, null, 2));
      } else if (sessions.length === 0) {
        logger.info('No active sessions');
      } else {
        logger.info(`Active sessions (${sessions.length}):`);
        for (const s of sessions) {
          const age = Date.now() - (s.createdAt || 0);
          const ageStr = age < 60000 ? `${Math.round(age / 1000)}s ago` :
                         age < 3600000 ? `${Math.round(age / 60000)}m ago` :
                         `${Math.round(age / 3600000)}h ago`;
          logger.info(`  ${s.id.slice(0, 16)}... | ${s.channel} | ${s.userId} | ${s.messageCount} msgs | ${ageStr}`);
        }
      }
    } catch (err: any) {
      logger.error(`Cannot connect to gateway: ${err.message}`);
      process.exit(1);
    }
  },
};
