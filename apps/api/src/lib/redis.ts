import { Redis } from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

export function createRedisConnection(
  customName = 'meetflow-redis',
  producer = false,
): Redis {
  const redisUrl = config.redis.url || process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error(
      'REDIS_URL environment variable is required for background queue processing. ' +
        'Please specify REDIS_URL in your .env file (e.g. redis://127.0.0.1:6379 or Upstash/Redis Cloud URL).',
    );
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: producer ? 1 : null,
    enableOfflineQueue: !producer,
    connectTimeout: 3000,
    enableReadyCheck: false,
    retryStrategy(times) {
      if (producer && times > 1) return null;
      const delay = Math.min(times * 500, 5000);
      return delay;
    },
    connectionName: customName,
  });

  let unavailable = false;
  client.on('error', (err) => {
    if (!unavailable)
      logger.error(`Redis connection unavailable (${customName})`, {
        error: err.message,
      });
    unavailable = true;
  });

  client.on('ready', () => {
    unavailable = false;
    logger.info(`Redis connected (${customName})`);
  });

  return client;
}

export function isRedisConfigured(): boolean {
  return Boolean(config.redis.url || process.env.REDIS_URL);
}
