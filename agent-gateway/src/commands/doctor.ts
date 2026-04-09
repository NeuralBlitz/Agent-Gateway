import { logger } from '../infra/index.js';
import { getConfig } from '../config/index.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { fetch } from 'undici';

export const doctorCommand = {
  name: 'doctor',
  description: 'Run health checks on configuration, providers, channels, and system',
  options: [
    { name: 'verbose', type: 'boolean', description: 'Show detailed output', default: false },
  ],
  handler: async (_args: string[], options: any) => {
    const verbose = options.verbose === true || options.verbose === 'true';
    let issues = 0;
    let warnings = 0;
    let checks = 0;

    const pass = (msg: string) => { checks++; logger.info(`  ✅ ${msg}`); };
    const warn = (msg: string) => { warnings++; checks++; logger.warn(`  ⚠️  ${msg}`); };
    const fail = (msg: string) => { issues++; checks++; logger.error(`  ❌ ${msg}`); };

    logger.info('🏥 Agent Gateway Doctor');
    logger.info('');

    // Check 1: Config file
    const configPath = join(process.cwd(), 'agent-gateway.config.json');
    if (existsSync(configPath)) {
      try {
        const cfg = getConfig();
        const config = cfg.get();
        pass(`Config file exists and is valid (${configPath})`);
        if (verbose) {
          logger.info(`    Channels: ${config.channels.length} configured`);
          logger.info(`    Providers: ${config.providers.length} configured`);
          logger.info(`    Plugins: ${config.plugins.length} configured`);
        }
      } catch (err: any) {
        fail(`Config file is invalid: ${err.message}`);
      }
    } else {
      warn('No config file found (using defaults). Run `agent-gateway init` to create one.');
    }

    // Check 2: .env file
    const envPath = join(process.cwd(), '.env');
    if (existsSync(envPath)) {
      pass('.env file exists');
      if (verbose) {
        const envContent = readFileSync(envPath, 'utf-8');
        const keys = envContent.split('\n').filter(l => l.trim() && !l.startsWith('#')).length;
        logger.info(`    ${keys} environment variables configured`);
      }
    } else {
      warn('No .env file found. API keys must be set via environment variables.');
    }

    // Check 3: Skills directory
    const skillsDir = process.env.SKILLS_DIR || join(process.cwd(), 'skills');
    if (existsSync(skillsDir)) {
      pass(`Skills directory exists (${skillsDir})`);
      if (verbose) {
        const { execSync } = await import('child_process');
        try {
          const count = execSync(`find "${skillsDir}" -name "SKILL.md" | wc -l`).toString().trim();
          logger.info(`    ${count} skills available`);
        } catch {}
      }
    } else {
      warn(`Skills directory not found (${skillsDir}). Run will load skills if directory exists.`);
    }

    // Check 4: Node.js version
    const nodeVersion = process.version;
    const major = parseInt(nodeVersion.slice(1), 10);
    if (major >= 20) {
      pass(`Node.js version ${nodeVersion} (>= 20 required)`);
    } else {
      fail(`Node.js version ${nodeVersion} is too old (>= 20 required)`);
    }

    // Check 5: Port availability
    const port = parseInt(process.env.PORT || '3000', 10);
    try {
      const server = await import('net');
      const testServer = server.createServer();
      await new Promise<void>((resolve, reject) => {
        testServer.listen(port, '127.0.0.1', () => {
          testServer.close();
          resolve();
        });
        testServer.on('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            warn(`Port ${port} is already in use`);
          } else {
            fail(`Cannot bind to port ${port}: ${err.message}`);
          }
          resolve();
        });
      });
    } catch {
      // Port check is best-effort
    }

    // Check 6: Provider connectivity
    const configPath2 = join(process.cwd(), 'agent-gateway.config.json');
    if (existsSync(configPath2)) {
      const cfg = getConfig();
      const config = cfg.get();
      
      for (const prov of config.providers) {
        const apiKey = prov.settings?.apiKey || process.env[`${prov.type.toUpperCase()}_API_KEY`];
        if (apiKey) {
          pass(`Provider '${prov.name}' (${prov.type}) has API key configured`);
        } else {
          warn(`Provider '${prov.name}' (${prov.type}) has no API key`);
        }
      }
    }

    // Check 7: Channel tokens
    if (existsSync(configPath2)) {
      const cfg = getConfig();
      const config = cfg.get();
      
      for (const ch of config.channels) {
        const token = ch.settings?.botToken || ch.settings?.accessToken || 
          process.env[`${ch.type.toUpperCase()}_TOKEN`];
        if (token) {
          pass(`Channel '${ch.name}' (${ch.type}) has credentials configured`);
        } else {
          warn(`Channel '${ch.name}' (${ch.type}) has no credentials`);
        }
      }
    }

    // Summary
    logger.info('');
    logger.info(`📋 Results: ${checks} checks, ${issues} issues, ${warnings} warnings`);
    
    if (issues === 0 && warnings === 0) {
      logger.info('✨ Everything looks good!');
    } else if (issues > 0) {
      logger.error(`🚨 ${issues} issue(s) found that may prevent the gateway from starting.`);
      process.exit(1);
    } else {
      logger.warn(`⚡ ${warnings} warning(s) found. The gateway should start but may have limited functionality.`);
    }
  },
};
