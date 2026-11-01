import './env';
import { createApp } from './app';
import { config } from './config';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info({
    message: `MeetFlow API server listening on http://localhost:${config.port}`,
    port: config.port,
    environment: config.env,
  });
});

async function gracefulShutdown(signal: string) {
  logger.info({ message: `${signal} received, shutting down gracefully` });
  server.close(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore
    }
    logger.info({ message: 'HTTP server closed and database disconnected' });
    process.exit(0);
  });

  // Force close after 3 seconds if connections linger
  setTimeout(() => {
    logger.warn({ message: 'Forcing shutdown after timeout' });
    process.exit(1);
  }, 3000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
