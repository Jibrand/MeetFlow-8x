import '../src/env';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { prisma } from '../src/lib/prisma';
import { generateAccessToken } from '../src/lib/security';
import { config } from '../src/config';
const require = createRequire(
  new URL('../../dashboard/package.json', import.meta.url),
);
const { chromium, expect } = require('@playwright/test');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const ids: string[] = [];
const sensitive: string[] = [];
try {
  const member = await prisma.workspaceMember.findFirst({
    include: { user: { select: { id: true, email: true } } },
  });
  if (!member) throw new Error('Existing local user/workspace required.');
  const auth = generateAccessToken({
    userId: member.userId,
    email: member.user.email,
  });
  sensitive.push(auth);
  const api = async <T>(
    path: string,
    method = 'GET',
    body?: unknown,
    anonymous = false,
  ): Promise<T> => {
    const response = await fetch(
      `http://localhost:${config.port}/api/v1${path}`,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(anonymous
            ? {}
            : {
                Cookie: `meetflow_access_token=${auth}`,
                'x-workspace-id': member.workspaceId,
              }),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(20_000),
      },
    );
    if (!response.ok)
      throw new Error(`Verification request failed (${response.status}).`);
    return (await response.json()).data as T;
  };
  const title = `Collaboration verification ${randomUUID().slice(0, 8)}`;
  const meeting = await prisma.meeting.create({
    data: {
      workspaceId: member.workspaceId,
      createdById: member.userId,
      title,
      processingStatus: 'READY',
      meetingStatus: 'COMPLETED',
      sourceType: 'TRANSCRIPT_UPLOAD',
      durationSeconds: 300,
      summary: {
        create: {
          overview:
            'The engineering team approved the release after reviewing reliability.',
          keyPoints: ['Reliability reviewed'],
          decisions: ['Release approved'],
          model: 'verification',
        },
      },
      segments: {
        create: Array.from({ length: 30 }, (_, i) => ({
          sequence: i,
          speakerName: 'Alice',
          text: `Segment ${i}: The engineering team approved the release and reviewed reliability.`,
          startMs: i * 10000,
          endMs: (i + 1) * 10000,
        })),
      },
      actionItems: {
        create: {
          workspaceId: member.workspaceId,
          title: 'Publish release notes',
          assigneeName: 'Alice',
        },
      },
    },
  });
  ids.push(meeting.id);
  const highlight = await api<{ id: string }>(
    `/meetings/${meeting.id}/highlights`,
    'POST',
    {
      label: 'Release decision',
      quote: 'The engineering team approved the release',
      tag: 'Decision',
      startTime: 100,
    },
  );
  await api(`/meetings/${meeting.id}/highlights/${highlight.id}`, 'PATCH', {
    label: 'Updated release decision',
  });
  const permissions = {
    allowSummary: true,
    allowHighlights: true,
    allowActions: true,
    allowTranscript: false,
  };
  let sharing = await api<{ token: string }>(
    `/meetings/${meeting.id}/sharing`,
    'POST',
    { action: 'enable', permissions },
  );
  sensitive.push(sharing.token);
  const publicData = await api<Record<string, unknown>>(
    `/public/meetings/${sharing.token}`,
    'GET',
    undefined,
    true,
  );
  if (
    Object.keys(publicData).some(
      (key) =>
        !['title', 'startAt', 'summary', 'highlights', 'actionItems'].includes(
          key,
        ),
    )
  )
    throw new Error('Public allowlist leaked an unexpected field.');
  const output = resolve('../dashboard/test-results');
  await mkdir(output, { recursive: true });
  const anonymous = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
  });
  const publicPage = await anonymous.newPage();
  let authRequests = 0;
  publicPage.on('request', (request: { url(): string }) => {
    if (request.url().includes('/api/v1/auth')) authRequests++;
  });
  await publicPage.goto(`http://localhost:5173/share/${sharing.token}`);
  await expect(
    publicPage.getByRole('heading', { name: title, exact: true }),
  ).toBeVisible();
  if (authRequests)
    throw new Error('Anonymous public page attempted authentication.');
  await expect(publicPage.locator('aside, audio, video')).toHaveCount(0);
  await expect(publicPage.getByText(/recording/i)).toHaveCount(0);
  await publicPage.screenshot({
    path: resolve(output, 'public-meeting.png'),
    fullPage: true,
  });
  await api(`/meetings/${meeting.id}/sharing`, 'POST', {
    action: 'update',
    permissions: {
      allowSummary: false,
      allowHighlights: false,
      allowActions: false,
      allowTranscript: true,
    },
  });
  const restricted = await api<Record<string, unknown>>(
    `/public/meetings/${sharing.token}`,
    'GET',
    undefined,
    true,
  );
  if (
    !restricted.segments ||
    restricted.summary ||
    restricted.highlights ||
    restricted.actionItems
  )
    throw new Error('Public section permissions were not enforced.');
  const oldToken = sharing.token;
  sharing = await api(`/meetings/${meeting.id}/sharing`, 'POST', {
    action: 'regenerate',
    permissions,
  });
  sensitive.push(sharing.token);
  const old = await fetch(
    `http://localhost:${config.port}/api/v1/public/meetings/${oldToken}`,
  );
  if (old.status !== 404 || sharing.token === oldToken)
    throw new Error('Regeneration failed to revoke the old link.');
  await api(`/meetings/${meeting.id}/sharing`, 'POST', { action: 'disable' });
  if (
    (
      await fetch(
        `http://localhost:${config.port}/api/v1/public/meetings/${sharing.token}`,
      )
    ).status !== 404
  )
    throw new Error('Disabled link remained public.');
  await api(`/meetings/${meeting.id}/sharing`, 'POST', { action: 'enable' });
  await api(`/public/meetings/${sharing.token}`, 'GET', undefined, true);
  await api(`/meetings/${meeting.id}/sharing`, 'POST', { action: 'revoke' });
  if (
    (
      await fetch(
        `http://localhost:${config.port}/api/v1/public/meetings/${sharing.token}`,
      )
    ).status !== 404
  )
    throw new Error('Revocation failed.');
  console.log(
    'Anonymous sharing: standalone page, no auth requests, explicit sections, disable/regenerate/revoke verified',
  );
  await Promise.all([
    api(`/meetings/${meeting.id}/summaries/engineering`, 'POST', {}),
    api(`/meetings/${meeting.id}/summaries/engineering`, 'POST', {}),
  ]);
  const generation = await prisma.meetingSummaryVariant.findUniqueOrThrow({
    where: { meetingId_type: { meetingId: meeting.id, type: 'engineering' } },
  });
  const deadline = Date.now() + 150_000;
  let ready = false;
  while (Date.now() < deadline) {
    const result = await api<{ status: string; content: unknown }>(
      `/meetings/${meeting.id}/summaries/engineering`,
    );
    if (result.status === 'FAILED')
      throw new Error('Live summary generation failed.');
    if (result.status === 'READY' && result.content) {
      ready = true;
      break;
    }
    await new Promise((done) => setTimeout(done, 1500));
  }
  if (!ready) throw new Error('Live summary generation did not finish.');
  await api(`/meetings/${meeting.id}/summaries/engineering`, 'POST', {});
  const saved = await prisma.meetingSummaryVariant.findUniqueOrThrow({
    where: { id: generation.id },
  });
  if (
    saved.generationId !== generation.generationId ||
    saved.status !== 'READY'
  )
    throw new Error('Cached summary requested a duplicate generation.');
  console.log(
    'Summary types: concurrent request deduplication, real worker/provider READY, persisted cached reuse verified',
  );
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    timezoneId: 'Pacific/Kiritimati',
    reducedMotion: 'reduce',
  });
  await context.addCookies([
    {
      name: 'meetflow_access_token',
      value: auth,
      url: 'http://localhost:4000',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error: Error) => errors.push(error.message));
  await page.goto(`http://localhost:5173/meetings/${meeting.id}`);
  await page
    .getByRole('button', { name: 'Open highlight: Updated release decision' })
    .click();
  await expect(
    page.getByRole('dialog').getByText('Transcript context'),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Add Moment', exact: true }).click();
  let modal = page.getByRole('dialog');
  await modal.getByLabel('Highlight title').fill('Persisted browser highlight');
  await modal.getByLabel('Highlight content').fill('Full browser content');
  await modal
    .getByRole('button', { name: 'Add Highlight', exact: true })
    .click();
  await page
    .getByRole('button', {
      name: 'Open highlight: Persisted browser highlight',
    })
    .click();
  await page
    .getByRole('button', { name: 'Edit highlight', exact: true })
    .click();
  modal = page.getByRole('dialog');
  await modal.getByLabel('Highlight title').fill('Edited browser highlight');
  await modal
    .getByRole('button', { name: 'Save Changes', exact: true })
    .click();
  const card = page
    .getByRole('button', { name: 'Open highlight: Edited browser highlight' })
    .locator('xpath=ancestor::div[contains(@class,"group")][1]');
  await card.getByTitle('Delete highlight', { exact: true }).click();
  const confirmation = page.getByRole('alertdialog');
  await expect(
    confirmation.getByRole('button', { name: 'Cancel', exact: true }),
  ).toBeFocused();
  await confirmation
    .getByRole('button', { name: 'Delete highlight', exact: true })
    .click();
  await expect(confirmation).toHaveCount(0);
  if (
    (await api<{ label: string }[]>(`/meetings/${meeting.id}/highlights`)).some(
      (h) => h.label === 'Edited browser highlight',
    )
  )
    throw new Error('Highlight delete did not persist.');
  await page
    .getByRole('button', {
      name: 'Select summary template. Current: General',
      exact: true,
    })
    .click();
  await page.getByRole('menuitem', { name: 'Engineering Sync' }).click();
  await expect(
    page.getByText('Generated from saved meeting intelligence'),
  ).toBeVisible();
  await page.getByRole('tab', { name: /Transcript/ }).click();
  await page.getByPlaceholder(/search transcript/i).fill('approved');
  const outerBefore = await page
    .locator('#main-content')
    .evaluate((element: HTMLElement) => element.scrollTop);
  for (let i = 0; i < 12; i++)
    await page.getByRole('button', { name: 'Next match', exact: true }).click();
  const outerAfter = await page
    .locator('#main-content')
    .evaluate((element: HTMLElement) => element.scrollTop);
  if (outerAfter !== outerBefore)
    throw new Error('Transcript navigation moved the outer page.');
  await expect(page.getByRole('button', { name: /Follow:/ })).toHaveCount(0);
  await page.goto('http://localhost:5173/calendar');
  const date =
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Kiritimati' })
      .format(new Date())
      .slice(0, 7) + '-15';
  await page
    .getByRole('button', { name: `Create meeting on ${date}`, exact: true })
    .click();
  modal = page.getByRole('dialog');
  await expect(modal.locator('input[type=date]')).toHaveValue(date);
  await expect(
    modal.getByLabel('Participants (Optional)', { exact: true }),
  ).toBeVisible();
  await modal
    .getByPlaceholder('e.g. Q4 Executive Product Strategy Sync')
    .fill('Calendar date verification');
  const createdResponse = page.waitForResponse(
    (response: { url(): string; request(): { method(): string } }) =>
      response.url().endsWith('/api/v1/meetings') &&
      response.request().method() === 'POST',
  );
  await modal
    .getByRole('button', { name: 'Schedule Meeting', exact: true })
    .click();
  const calendarMeeting = (await (await createdResponse).json()).data;
  ids.push(calendarMeeting.id);
  if (
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Pacific/Kiritimati' }).format(
      new Date(calendarMeeting.startAt),
    ) !== date
  )
    throw new Error('Selected calendar day shifted across time zones.');
  await page.goto('http://localhost:5173/');
  await page.getByRole('heading', { name: 'My Meetings' }).waitFor();
  await expect(
    page.getByRole('combobox', { name: 'Filter by Platform' }),
  ).toHaveCount(0);
  if (errors.length)
    throw new Error('Uncaught browser errors during verification.');
  console.log(
    'Browser: persistent highlight CRUD/modals, saved summary selection, transcript-only navigation, optional participants, UTC+14 calendar date and removed platform filter verified',
  );
} catch (error) {
  let message =
    error instanceof Error
      ? error.message
      : 'Collaboration verification failed';
  for (const value of sensitive)
    message = message.replaceAll(value, '[REDACTED: capability]');
  console.error(message);
  process.exitCode = 1;
} finally {
  await browser.close();
  await prisma.meeting.deleteMany({ where: { id: { in: ids } } });
  await prisma.$disconnect();
}
