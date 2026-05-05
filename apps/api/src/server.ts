import { createServer } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';

const app = createApp();
const server = createServer(app);

server.listen(env.port, () => {
  logger.info({ port: env.port }, `API listening on http://localhost:${env.port}`);
});

function shutdown(signal: NodeJS.Signals): void {
  logger.info({ signal }, 'Shutting down API server');

  server.close((err) => {
    if (err) {
      logger.error({ err }, 'Error while closing API server');
      process.exit(1);
    }

    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
