import { logger } from '../infra/index.js';
import { fetch } from 'undici';

export const statusCommand = {
  name: 'status',
  description: 'Show gateway status: running/stopped, sessions, channels, providers',
  options: [
    { name: 'port', type: 'string', description: 'Gateway port (default: 3000)', default: '3000' },
    { name: 'json', type: 'boolean', description: 'Output as JSON', default: false },
  ],
  handler: async (_args: string[], options: any) => {
    const port = parseInt(options.port || '3000', 10);
    const asJson = options.json === true || options.json === 'true';

    try {
      const response = await fetch(`http://localhost:${port}/api/status`, {
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        if (asJson) {
          console.log(JSON.stringify({ running: false, port }));
        } else {
          logger.error(`Gateway is not running on port ${port}`);
        }
        process.exit(1);
      }

      const status = await response.json() as any;

      // Also get health
      const healthResponse = await fetch(`http://localhost:${port}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      const health = await healthResponse.json() as any;

      if (asJson) {
        console.log(JSON.stringify({ running: true, ...status, health }, null, 2));
      } else {
        logger.info(`🟢 Agent Gateway is running on port ${port}`);
        logger.info(`   Uptime: ${Math.round(health.uptime)}s`);
        logger.info(`   Channels: ${status.channels.length} configured`);
        logger.info(`   Providers: ${status.providers.length} configured`);
        logger.info(`   Active sessions: ${status.sessionCount}`);
      }
    } catch (err: any) {
      if (asJson) {
        console.log(JSON.stringify({ running: false, port, error: err.message }));
      } else {
        logger.error(`Cannot connect to gateway on port ${port}: ${err.message}`);
        logger.info('   Is the gateway running? Try: agent-gateway server');
      }
      process.exit(1);
    }
  },
};
