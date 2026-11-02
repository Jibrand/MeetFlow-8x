import '../src/env';

// Isolate a producer outage without stopping the user's working Redis or API.
process.env.REDIS_URL = 'redis://127.0.0.1:1';
const { prisma } = await import('../src/lib/prisma');
const { enqueueMeetingProcessing, closeMeetingProcessingQueue } =
  await import('../src/queues/meeting-processing.queue');
const { redactDiagnostics } = await import('../src/lib/logger');
let createdId: string | undefined;
try {
  const member = await prisma.workspaceMember.findFirst();
  if (!member) throw new Error('A test workspace/user must exist.');
  const meeting = await prisma.meeting.create({
    data: {
      workspaceId: member.workspaceId,
      createdById: member.userId,
      title: '[Verification] Redis dispatch failure',
      startAt: new Date(),
      processingStatus: 'QUEUED',
    },
  });
  createdId = meeting.id;
  const started = Date.now();
  const result = await enqueueMeetingProcessing({
    meetingId: meeting.id,
    workspaceId: member.workspaceId,
  });
  const saved = await prisma.meeting.findUniqueOrThrow({
    where: { id: meeting.id },
    include: { processingJobs: true },
  });
  if (
    result.status !== 'REDIS_UNAVAILABLE' ||
    saved.processingStatus !== 'FAILED' ||
    !saved.processingJobs[0]?.errorCode?.startsWith('REDIS_UNAVAILABLE')
  ) {
    throw new Error(
      'Producer outage did not produce a durable, actionable FAILED state.',
    );
  }
  console.log(
    `Redis outage: FAILED with useful error after ${Date.now() - started}ms; no stranded QUEUED state`,
  );
} catch (error) {
  console.error(
    redactDiagnostics(
      error instanceof Error ? error.message : 'Failure check failed',
    ),
  );
  process.exitCode = 1;
} finally {
  await closeMeetingProcessingQueue();
  if (createdId) {
    await prisma.meeting.delete({ where: { id: createdId } });
    console.log('Temporary failure-check meeting removed');
  }
  await prisma.$disconnect();
}
