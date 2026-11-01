import '../env';
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'error' },
            { emit: 'stdout', level: 'warn' },
          ]
        : [{ emit: 'stdout', level: 'error' }],
  });

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}

// Log slow queries in development if desired
if (process.env.NODE_ENV === 'development') {
  // @ts-expect-error Prisma event typing
  prisma.$on('query', (e: { query: string; params: string; duration: number }) => {
    if (e.duration > 200) {
      logger.warn({ message: 'Slow Database Query', query: e.query, durationMs: e.duration });
    }
  });
}
