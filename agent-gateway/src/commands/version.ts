import { logger } from '../infra/index.js';
import { createRequire } from 'module';
import type { Command } from '../cli/index.js';

export const versionCommand: Command = {
  name: 'version',
  description: 'Show agent-gateway version',
  options: [],
  handler: async (_args: string[], _options: any) => {
    try {
      const require = createRequire(import.meta.url);
      const pkg = require('../../package.json');
      logger.info(`${pkg.name} v${pkg.version}`);
      logger.info(`Node ${process.version} on ${process.platform} ${process.arch}`);
    } catch {
      logger.info('agent-gateway v1.0.0');
    }
  },
};
