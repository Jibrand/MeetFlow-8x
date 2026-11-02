import '../src/env';
import { config } from '../src/config';
import { prisma } from '../src/lib/prisma';
import { generateAccessToken } from '../src/lib/security';
import {
  getMeetingProcessingQueue,
  closeMeetingProcessingQueue,
} from '../src/queues/meeting-processing.queue';
import { redactDiagnostics } from '../src/lib/logger';

// Exercises the actual authenticated API, Neon, Redis, BullMQ worker and configured AI provider.
// Creates and removes only its own temporary meeting. Never prints cookies, keys, or environment values.
interface Status {
  processingStatus: string;
  stage: string;
  progress: number;
  attempts: number;
  errorCode: string | null;
}
const member = await prisma.workspaceMember.findFirst({
  include: { user: { select: { id: true, email: true } } },
});
let createdId: string | undefined;
let terminal = false;
try {
  if (!member)
    throw new Error(
      'A local test workspace and user must exist before running the smoke check.',
    );
  const token = generateAccessToken({
    userId: member.user.id,
    email: member.user.email,
  });
  async function api<T>(
    path: string,
    method = 'GET',
    body?: unknown,
  ): Promise<T> {
    const response = await fetch(
      `http://localhost:${config.port}/api/v1${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          Cookie: `meetflow_access_token=${token}`,
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(15_000),
      },
    );
    const result = (await response.json()) as {
      data: T;
      error?: { code: string; message: string };
    };
    if (!response.ok)
      throw new Error(
        `API ${method} ${path}: ${result.error?.code ?? response.status}`,
      );
    return result.data;
  }
  async function waitForTerminal(): Promise<Status> {
    let last = '';
    const deadline = Date.now() + 330_000;
    while (Date.now() < deadline) {
      const status = await api<Status>(`/meetings/${createdId}/processing`);
      const line = `${status.processingStatus} ${status.progress}% (attempt ${status.attempts})`;
      if (line !== last) {
        console.log(line);
        last = line;
      }
      if (
        status.processingStatus === 'READY' ||
        status.processingStatus === 'FAILED'
      )
        return status;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    throw new Error(
      'Meeting failed to reach a terminal state within the smoke-check deadline.',
    );
  }
  const created = await api<{ id: string; queueStatus: string }>(
    '/meetings',
    'POST',
    {
      title: '[Verification] Meeting-processing smoke test',
      startAt: new Date().toISOString(),
      timezone: 'UTC',
      transcript: {
        rawText:
          'Alice: I am the product manager. We agreed to ship the release on Friday.\nBob: I will send the release notes.\nAlice: The release is approved.',
        sourceFilename: 'pipeline-smoke.txt',
        sourceFormat: 'txt',
      },
    },
  );
  createdId = created.id;
  console.log(`Create: ${created.queueStatus}`);
  const first = await waitForTerminal();
  terminal = true;
  if (first.processingStatus === 'FAILED') {
    console.error(`Terminal failure: ${first.errorCode}`);
    process.exitCode = 1;
  } else {
    const detail = await api<{
      summary: { overview: string } | null;
      segments: unknown[];
      participants: { name: string; role?: string | null }[];
      actionItems: { id: string; title: string }[];
      processingJobs: { progress: number }[];
    }>(`/meetings/${createdId}`);
    if (
      !detail.summary?.overview ||
      detail.segments.length === 0 ||
      detail.processingJobs[0]?.progress !== 100
    )
      throw new Error(
        'READY is missing persisted summary, transcript segments, or completion progress.',
      );
    if (
      !detail.participants.some(
        (person) =>
          person.name.toLowerCase().includes('alice') &&
          person.role?.toLowerCase().includes('product'),
      ) ||
      !detail.participants.some((person) => person.name === 'Bob')
    )
      throw new Error('Automatic speakers/roles were not persisted.');
    console.log(
      'Persisted summary, transcript, automatic participants/role and 100% job: verified',
    );
    // Wait for BullMQ to acknowledge completion before testing its retained-job retry path.
    const queue = getMeetingProcessingQueue();
    for (let attempt = 0; attempt < 20; attempt++) {
      const job = await queue.getJob(`meeting-process-${createdId}`);
      if ((await job?.getState()) === 'completed') break;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    await api(`/meetings/${createdId}/reprocess`, 'POST');
    terminal = false;
    const retried = await waitForTerminal();
    terminal = true;
    if (retried.processingStatus !== 'READY')
      throw new Error(`Reprocessing failed: ${retried.errorCode}`);
    const repeated = await api<{
      actionItems: { title: string }[];
      participants: { name: string }[];
    }>(`/meetings/${createdId}`);
    if (
      new Set(repeated.participants.map((p) => p.name.toLowerCase())).size !==
        repeated.participants.length ||
      new Set(repeated.actionItems.map((a) => a.title.toLowerCase().trim()))
        .size !== repeated.actionItems.length
    )
      throw new Error('Reprocessing introduced duplicate participants/tasks.');
    console.log(
      'Retained completed job reprocessing: READY, no duplicate participants/tasks',
    );
  }
  if (terminal && createdId) {
    const job = await getMeetingProcessingQueue().getJob(
      `meeting-process-${createdId}`,
    );
    if (job && (await job.getState()) !== 'active') await job.remove();
    await api(`/meetings/${createdId}`, 'DELETE');
    console.log('Temporary verification meeting removed');
    createdId = undefined;
  }
} catch (error) {
  console.error(
    redactDiagnostics(
      error instanceof Error ? error.message : 'Smoke check failed',
    ),
  );
  if (createdId)
    console.error(`Verification meeting retained for inspection: ${createdId}`);
  process.exitCode = 1;
} finally {
  await closeMeetingProcessingQueue();
  await prisma.$disconnect();
}
