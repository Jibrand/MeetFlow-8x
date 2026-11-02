import '../src/env';
import { randomUUID } from 'node:crypto';
import { prisma } from '../src/lib/prisma';
import { config } from '../src/config';
import { generateAccessToken } from '../src/lib/security';

const ids = Array.from({ length: 10 }, () => randomUUID());
try {
  const member = await prisma.workspaceMember.findFirst({
    include: { user: { select: { id: true, email: true } } },
  });
  if (!member) throw new Error('An existing local workspace is required.');
  const title = `Pagination verification ${randomUUID()}`;
  await prisma.meeting.createMany({
    data: ids.map((id) => ({
      id,
      title,
      workspaceId: member.workspaceId,
      createdById: member.userId,
    })),
  });
  const token = generateAccessToken({
    userId: member.userId,
    email: member.user.email,
  });
  const read = async (page: number, extra = '') => {
    const response = await fetch(
      `http://localhost:${config.port}/api/v1/meetings?limit=9&page=${page}&search=${encodeURIComponent(title)}${extra}`,
      {
        headers: {
          Cookie: `meetflow_access_token=${token}`,
          'x-workspace-id': member.workspaceId,
        },
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!response.ok)
      throw new Error(`Pagination request failed (${response.status}).`);
    return (await response.json()).data as {
      meetings: { id: string }[];
      pagination: { total: number; totalPages: number };
    };
  };
  const [first, second, filtered] = await Promise.all([
    read(1),
    read(2),
    read(1, '&viewStatus=ready'),
  ]);
  const all = [...first.meetings, ...second.meetings].map(
    (meeting) => meeting.id,
  );
  if (
    first.meetings.length !== 9 ||
    second.meetings.length !== 1 ||
    first.pagination.total !== 10 ||
    first.pagination.totalPages !== 2 ||
    new Set(all).size !== 10 ||
    all.some((id) => !ids.includes(id))
  )
    throw new Error('Page bounds, total or deterministic pagination failed.');
  if (filtered.pagination.total !== 0 || filtered.meetings.length !== 0)
    throw new Error('Status filtering must happen before pagination.');
  console.log(
    'Real Neon pagination: 9 + 1 records, accurate total, no overlap, server filtering verified',
  );
} finally {
  await prisma.meeting.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
}
