import '../src/env';
import { Redis } from 'ioredis';
import { Queue } from 'bullmq';
import { prisma } from '../src/lib/prisma';
import { redactDiagnostics } from '../src/lib/logger';

// Read-only: never print environment values, transcript text, or meeting titles.
console.log(`Database configured: ${Boolean(process.env.DATABASE_URL)}`);
console.log(`Redis configured: ${Boolean(process.env.REDIS_URL)}`);
console.log(`AI configured: ${Boolean(process.env.OPENAI_API_KEY)}`);
if (process.env.REDIS_URL) {
  const redis = new Redis(process.env.REDIS_URL, {
    lazyConnect: true,
    connectTimeout: 3000,
    maxRetriesPerRequest: 1,
    retryStrategy: () => null,
  });
  let connectionError: Error | undefined;
  redis.on('error', (error) => {
    connectionError ??= error;
  });
  try {
    await redis.connect();
    console.log(`Redis: ${await redis.ping()}`);
    const queue = new Queue('meeting-processing', { connection: redis });
    try {
      const counts = await queue.getJobCounts(
        'waiting',
        'active',
        'delayed',
        'failed',
        'completed',
      );
      console.log(
        `Queue: ${Object.entries(counts)
          .map(([state, count]) => `${state}=${count}`)
          .join(', ')}`,
      );
      console.log(`Workers connected: ${(await queue.getWorkers()).length}`);
    } finally {
      await queue.close();
    }
  } catch (error) {
    console.error(
      'Redis: unavailable. Check REDIS_URL, TLS, network, and Redis service.',
    );
    console.error(
      redactDiagnostics(
        connectionError?.message ??
          (error instanceof Error
            ? error.message
            : 'Unknown connection failure'),
      ),
    );
    process.exitCode = 1;
  } finally {
    redis.disconnect();
  }
}
try {
  const statuses = await prisma.meeting.groupBy({
    by: ['processingStatus'],
    _count: true,
  });
  console.log(
    `Database meetings: ${statuses.map((row) => `${row.processingStatus}=${row._count}`).join(', ') || 'none'}`,
  );
  const jobs = await prisma.meetingProcessingJob.groupBy({
    by: ['status', 'stage'],
    _count: true,
  });
  console.log(
    `Database jobs: ${jobs.map((row) => `${row.status}/${row.stage}=${row._count}`).join(', ') || 'none'}`,
  );
} catch {
  console.error(
    'Database: unavailable. Check DATABASE_URL and schema migrations.',
  );
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
