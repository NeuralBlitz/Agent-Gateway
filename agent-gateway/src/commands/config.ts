import { logger } from '../infra/index.js';
import { getConfig } from '../config/index.js';
import type { Command } from '../cli/index.js';

export const configCommand: Command = {
  name: 'config',
  description: 'Manage agent-gateway configuration',
  options: [
    { name: 'get', type: 'string', description: 'Get config value by dot-path key' },
    { name: 'set', type: 'string', description: 'Set config value (key=value)' },
    { name: 'list', type: 'boolean', description: 'List all configuration' },
  ],
  handler: async (_args: string[], options: any) => {
    const cfg = getConfig();
    const config = cfg.get();

    if (options.list) {
      // Print config without sensitive values
      const safe = JSON.parse(JSON.stringify(config));
      for (const ch of safe.channels || []) {
        if (ch.settings) {
          for (const k of Object.keys(ch.settings)) {
            if (k.toLowerCase().includes('token') || k.toLowerCase().includes('key') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('password')) {
              ch.settings[k] = '***';
            }
          }
        }
      }
      for (const p of safe.providers || []) {
        if (p.settings) {
          for (const k of Object.keys(p.settings)) {
            if (k.toLowerCase().includes('key') || k.toLowerCase().includes('token') || k.toLowerCase().includes('secret') || k.toLowerCase().includes('password')) {
              p.settings[k] = '***';
            }
          }
        }
      }
      logger.info(JSON.stringify(safe, null, 2));
    } else if (options.get) {
      const keys = options.get.split('.');
      let val: any = config;
      for (const k of keys) {
        val = val?.[k];
      }
      if (val !== undefined) {
        logger.info(JSON.stringify(val, null, 2));
      } else {
        logger.error(`Key '${options.get}' not found`);
      }
    } else if (options.set) {
      const eqIdx = options.set.indexOf('=');
      if (eqIdx === -1) {
        logger.error('Usage: agent-gateway config --set key=value');
        return;
      }
      const key = options.set.slice(0, eqIdx);
      const rawVal = options.set.slice(eqIdx + 1);
      // Try to parse as JSON for numbers/bools
      let val: any = rawVal;
      try { val = JSON.parse(rawVal); } catch {}

      // Deep set
      const keys = key.split('.');
      let obj: any = config;
      for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = val;
      cfg.set(config);
      cfg.save();
      logger.info(`Saved: ${key} = ${JSON.stringify(val)}`);
    } else {
      logger.info('Usage: agent-gateway config [--list|--get <key>|--set <key>=<value>]');
    }
  },
};
