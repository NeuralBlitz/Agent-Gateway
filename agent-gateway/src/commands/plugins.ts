import { logger } from '../infra/index.js';
import { getConfig } from '../config/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { Command } from '../cli/index.js';

const execAsync = promisify(exec);

export const pluginsCommand: Command = {
  name: 'plugins',
  description: 'List and manage plugins',
  options: [
    { name: 'list', type: 'boolean', description: 'List configured plugins' },
    { name: 'install', type: 'string', description: 'Install a plugin from npm' },
    { name: 'uninstall', type: 'string', description: 'Uninstall a plugin' },
  ],
  handler: async (_args: string[], options: any) => {
    const cfg = getConfig();
    const config = cfg.get();

    if (options.list || (!options.install && !options.uninstall)) {
      if (config.plugins.length === 0) {
        logger.info('No plugins configured.');
        logger.info('Plugins are npm packages that provide channels, providers, or tools.');
      } else {
        logger.info(`Configured plugins (${config.plugins.length}):`);
        for (const p of config.plugins) {
          logger.info(`  • ${p}`);
        }
      }
      return;
    }

    if (options.install) {
      const pkgName = options.install;
      logger.info(`Installing ${pkgName}...`);
      try {
        await execAsync(`npm install ${pkgName}`);
        if (!config.plugins.includes(pkgName)) {
          config.plugins.push(pkgName);
          cfg.set(config);
          cfg.save();
        }
        logger.info(`Installed and registered: ${pkgName}`);
        logger.info('Restart the gateway to load plugins.');
      } catch (err: any) {
        logger.error({ err }, `Failed to install ${pkgName}`);
      }
      return;
    }

    if (options.uninstall) {
      const pkgName = options.uninstall;
      const idx = config.plugins.indexOf(pkgName);
      if (idx === -1) {
        logger.error(`Plugin not found: ${pkgName}`);
        return;
      }
      config.plugins.splice(idx, 1);
      cfg.set(config);
      cfg.save();
      try {
        await execAsync(`npm uninstall ${pkgName}`);
        logger.info(`Uninstalled and removed: ${pkgName}`);
      } catch (err: any) {
        logger.error({ err }, `Failed to uninstall ${pkgName}`);
      }
    }
  },
};
