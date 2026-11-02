import { Redis } from 'ioredis';
import { config } from '../config';
import { logger } from './logger';

export function createRedisConnection(customName = 'meetflow-redis'): Redis {
  const redisUrl = config.redis.url || process.env.REDIS_URL;

  if (!redisUrl) {
    throw new Error(
      'REDIS_URL environment variable is required for background queue processing. ' +
        'Please specify REDIS_URL in your .env file (e.g. redis://127.0.0.1:6379 or Upstash/Redis Cloud URL).'
    );
  }

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
    connectionName: customName,
  });

  client.on('error', (err) => {
    logger.error(`[Redis:${customName}] Connection error`, { error: err.message });
  });

  client.on('connect', () => {
    logger.info(`[Redis:${customName}] Connected to Redis server`);
  });

  return client;
}

export function isRedisConfigured(): boolean {
  return Boolean(config.redis.url || process.env.REDIS_URL);
}
