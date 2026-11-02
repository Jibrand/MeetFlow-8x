import { prisma } from '../lib/prisma';

export async function markProcessingFailed(
  meetingId: string,
  errorCode: string,
  expectedUpdatedAt?: Date,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const changed = await tx.meeting.updateMany({
      where: {
        id: meetingId,
        processingStatus: {
          in: ['QUEUED', 'PARSING', 'ANALYZING', 'FINALIZING'],
        },
        ...(expectedUpdatedAt ? { updatedAt: expectedUpdatedAt } : {}),
      },
      data: { processingStatus: 'FAILED' },
    });
    // A worker may have completed since the watchdog snapshot. Never overwrite READY.
    if (!changed.count) return;
    await tx.meetingProcessingJob.upsert({
      where: { jobId: `meeting-process-${meetingId}` },
      update: {
        status: 'FAILED',
        stage: 'FAILED',
        errorCode,
        completedAt: new Date(),
      },
      create: {
        meetingId,
        jobId: `meeting-process-${meetingId}`,
        status: 'FAILED',
        stage: 'FAILED',
        errorCode,
        completedAt: new Date(),
      },
    });
  });
}

export function processingErrorCode(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  const status =
    typeof error === 'object' && error !== null && 'status' in error
      ? error.status
      : undefined;
  if (message.includes('NO_TRANSCRIPT'))
    return 'NO_TRANSCRIPT_AVAILABLE: Upload a non-empty transcript before retrying.';
  if (message.startsWith('MEDIA_')) return message;
  if (message.includes('OPENAI_API_KEY'))
    return 'AI_NOT_CONFIGURED: Configure OPENAI_API_KEY on the worker, then retry.';
  if (status === 401 || status === 403)
    return 'AI_AUTH_FAILED: Check the worker API key and model access, then retry.';
  if (status === 429)
    return 'AI_RATE_LIMITED: Check provider quota and billing, then retry.';
  if (/timeout|timed out|abort/i.test(message))
    return 'AI_TIMEOUT: The analysis request timed out. Retry processing.';
  if (/schema|JSON|empty response|Invalid.*date/i.test(message))
    return 'AI_INVALID_RESPONSE: The provider returned invalid meeting intelligence. Retry processing.';
  return 'PROCESSING_FAILED: Processing could not finish after retries. Check worker diagnostics and retry.';
}
