import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

// Only bounded database work belongs here. Provider/decoder calls stay outside.
// A retry always opens a new transaction; never reuse an expired tx client.
export async function processingTransaction<T>(
  work: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await prisma.$transaction(work, {
        maxWait: 5_000,
        timeout: 15_000,
      });
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? error.code
          : undefined;
      if (attempt >= 2 || !['P2028', 'P2034'].includes(String(code)))
        throw error;
      await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
    }
  }
}
