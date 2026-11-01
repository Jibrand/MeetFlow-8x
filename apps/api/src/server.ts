import { createApp } from './app';
import { config } from './config';
import { logger } from './lib/logger';

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info({
    message: `MeetFlow API server listening on http://localhost:${config.port}`,
    port: config.port,
    environment: config.env,
  });
});

process.on('SIGTERM', () => {
  logger.info({ message: 'SIGTERM received, shutting down gracefully' });
  server.close(() => {
    logger.info({ message: 'Process terminated' });
  });
});
