import '../env';
import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma =
  global.__prisma ||
  new PrismaClient({
    // Errors are handled by the request/worker logger; do not dump SQL or raw provider diagnostics.
    log: [],
  });

if (process.env.NODE_ENV === 'development') {
  global.__prisma = prisma;
}
