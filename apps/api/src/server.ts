import './env';
import { createApp } from './app';
import { config } from './config';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { startMeetingProcessingWorker } from './workers/meeting-processing.worker';
import {
  closeMeetingProcessingQueue,
  reconcileMeetingProcessing,
} from './queues/meeting-processing.queue';

// Development must have a consumer without requiring a second, easily missed command.
const worker =
  config.env === 'development' ? startMeetingProcessingWorker() : null;
let reconciling = false;
async function reconcile() {
  if (reconciling) return;
  reconciling = true;
  try {
    await reconcileMeetingProcessing();
  } catch (error) {
    logger.error('Meeting queue reconciliation failed', { error });
  } finally {
    reconciling = false;
  }
}
const reconciliationTimer = setInterval(() => {
  void reconcile();
}, 15_000);
reconciliationTimer.unref();
void reconcile();

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info({
    message: `MeetFlow API server listening on http://localhost:${config.port}`,
    port: config.port,
    environment: config.env,
  });
});
server.on('error', (error: NodeJS.ErrnoException) => {
  logger.error('API could not start', {
    code: error.code,
    error: error.message,
  });
  process.exit(1);
});

async function gracefulShutdown(signal: string) {
  clearInterval(reconciliationTimer);
  logger.info({ message: `${signal} received, shutting down gracefully` });
  server.close(async () => {
    try {
      await worker?.close();
      await worker?.disconnect();
      await closeMeetingProcessingQueue();
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
