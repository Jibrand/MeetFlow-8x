import '../src/env';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { createConnection } from 'node:net';

class ResetSafetyError extends Error {}
const localHosts = new Set(['localhost', '127.0.0.1', '[::1]']);
function localTarget(name: string, protocols: string[]): URL {
  const value = process.env[name];
  if (!value) throw new ResetSafetyError(`${name} must be configured; nothing was cleared.`);
  const url = new URL(value);
  if (!protocols.includes(url.protocol) || !localHosts.has(url.hostname)) {
    throw new ResetSafetyError(`${name} is not a verified loopback development target. Remote/shared databases are prohibited; nothing was cleared.`);
  }
  // Prevent libpq host overrides and ambiguous routing through URL options.
  const permitted = new Set(['schema', 'connection_limit', 'pool_timeout', 'connect_timeout', 'sslmode']);
  if ([...url.searchParams.keys()].some((key) => !permitted.has(key))) {
    throw new ResetSafetyError(`${name} contains unsupported connection options; nothing was cleared.`);
  }
  return url;
}
async function isListening(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = createConnection({ host: '127.0.0.1', port });
    socket.setTimeout(1500);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('error', () => { socket.destroy(); resolve(false); });
    socket.once('timeout', () => { socket.destroy(); resolve(false); });
  });
}
async function main() {
  if (process.env.NODE_ENV !== 'development') throw new ResetSafetyError('NODE_ENV must explicitly be development. Nothing was cleared.');
  const database = localTarget('DATABASE_URL', ['postgres:', 'postgresql:']);
  if (process.env.DIRECT_URL) {
    const direct = localTarget('DIRECT_URL', ['postgres:', 'postgresql:']);
    if (direct.hostname !== database.hostname || direct.port !== database.port || direct.pathname !== database.pathname) {
      throw new ResetSafetyError('DATABASE_URL and DIRECT_URL do not identify the same local database. Nothing was cleared.');
    }
  }
  const databaseName = decodeURIComponent(database.pathname.slice(1));
  if (!/^meetflow(?:[_-].+)?$/i.test(databaseName) || !/(?:^|[_-])(dev|development|local)(?:$|[_-])/i.test(databaseName)) {
    throw new ResetSafetyError('Database name must identify MeetFlow and dev/development/local (for example meetflow_dev). Nothing was cleared.');
  }
  localTarget('REDIS_URL', ['redis:']);
  if (await isListening(Number(process.env.PORT || 4000))) {
    throw new ResetSafetyError('Stop the local MeetFlow API before resetting (its port is listening). Nothing was cleared.');
  }
  console.log(`Verified local development target: ${database.hostname}:${database.port || '5432'}/${databaseName}`);
  const expected = `DELETE ${databaseName}`;
  let confirmation = process.argv.find((arg) => arg.startsWith('--confirm='))?.slice('--confirm='.length);
  if (!confirmation && stdin.isTTY) {
    const prompt = createInterface({ input: stdin, output: stdout });
    try { confirmation = await prompt.question(`Delete all application data? Type "${expected}": `); }
    finally { prompt.close(); }
  }
  if (confirmation !== expected) throw new ResetSafetyError('Explicit confirmation did not match. Nothing was cleared.');
  const prisma = new PrismaClient({ log: [] });
  const redis = new Redis(process.env.REDIS_URL!, { maxRetriesPerRequest: 1, enableOfflineQueue: false, lazyConnect: true, connectTimeout: 3000, retryStrategy: () => null });
  redis.on('error', () => {});
  let queue: Queue | undefined;
  let pausedBefore = false;
  let pausedByReset = false;
  let deletionStarted = false;
  let succeeded = false;
  try {
    // Connect to both stores and verify the DB before changing either one.
    const identity = await prisma.$queryRaw<{ database: string; address: string | null }[]>`SELECT current_database() AS database, inet_server_addr()::text AS address`;
    if (identity[0]?.database !== databaseName || !identity[0]?.address || !/^(127\.|::1$|::ffff:127\.)/.test(identity[0].address)) {
      throw new ResetSafetyError('PostgreSQL server identity is not a directly local development server. Nothing was cleared.');
    }
    await redis.connect();
    queue = new Queue('meeting-processing', { connection: redis });
    pausedBefore = await queue.isPaused();
    await queue.pause();
    pausedByReset = true;
    if ((await queue.getWorkers()).length || (await queue.getActiveCount())) {
      throw new ResetSafetyError('Stop all MeetFlow workers and wait for active jobs to finish, then retry. Nothing was cleared.');
    }
    deletionStarted = true;
    // The API and workers must remain stopped throughout this operation.
    // Obliterate only this application's queue namespace; never FLUSHDB/FLUSHALL.
    await queue.obliterate({ force: false });
    const cleared = await prisma.$transaction(async (tx) => {
      const counts: Record<string, number> = {};
      counts.decisionConflicts = (await tx.decisionConflict.deleteMany()).count;
      counts.decisionEvents = (await tx.decisionEvent.deleteMany()).count;
      counts.commitmentHistory = (await tx.commitmentHistory.deleteMany()).count;
      counts.aiActions = (await tx.aIAction.deleteMany()).count;
      counts.decisions = (await tx.decision.deleteMany()).count;
      counts.actionItems = (await tx.actionItem.deleteMany()).count;
      counts.summaryVariants = (await tx.meetingSummaryVariant.deleteMany()).count;
      counts.highlights = (await tx.highlight.deleteMany()).count;
      counts.shareLinks = (await tx.shareLink.deleteMany()).count;
      counts.processingJobs = (await tx.meetingProcessingJob.deleteMany()).count;
      counts.summaries = (await tx.meetingSummary.deleteMany()).count;
      counts.transcriptSegments = (await tx.transcriptSegment.deleteMany()).count;
      counts.transcripts = (await tx.meetingTranscript.deleteMany()).count;
      counts.participants = (await tx.meetingParticipant.deleteMany()).count;
      counts.meetings = (await tx.meeting.deleteMany()).count;
      // Retain connection credentials/settings, but detach deleted project context.
      await tx.calendarConnection.updateMany({ data: { projectId: null, syncToken: null, lastSyncedAt: null, syncError: null } });
      counts.projects = (await tx.project.deleteMany()).count;
      counts.companies = (await tx.company.deleteMany()).count;
      return counts;
    }, { timeout: 30000 });
    succeeded = true;
    console.log('Cleared records: ' + Object.entries(cleared).map(([name, count]) => `${name}=${count}`).join(', '));
    console.log('MeetFlow BullMQ jobs and queue keys cleared. No other Redis cache namespaces are used by this application.');
    console.log('Schema, migrations, admin/workspace identity, credentials and configuration preserved. Errors: 0. Restart API/workers and reload the app.');
  } finally {
    if (queue && pausedByReset) {
      if (succeeded || !deletionStarted) {
        if (!pausedBefore) await queue.resume();
        else await queue.pause();
      } else {
        await queue.pause();
        console.error('Reset incomplete; queue remains paused. Resolve the error and rerun before restarting services.');
      }
    }
    await queue?.close();
    redis.disconnect();
    await prisma.$disconnect();
  }
}
main().catch((error: unknown) => {
  if (error instanceof ResetSafetyError) console.error(error.message);
  // Do not print provider errors: they can contain credentials/connection strings.
  console.error('Reset refused or failed. Errors: 1. No credentials were printed. Check the target, stop API/workers, and retry with the documented local development setup.');
  process.exitCode = 1;
});
