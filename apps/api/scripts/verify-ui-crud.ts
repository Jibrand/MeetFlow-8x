import '../src/env';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { prisma } from '../src/lib/prisma';
import { config } from '../src/config';
import { generateAccessToken } from '../src/lib/security';
import { redactDiagnostics } from '../src/lib/logger';
const require = createRequire(
  new URL('../../dashboard/package.json', import.meta.url),
);
const { chromium, expect } = require('@playwright/test');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const member = await prisma.workspaceMember.findFirst({
  include: { user: { select: { id: true, email: true } } },
});
let meetingId: string | undefined;
let captureFailure: (() => Promise<void>) | undefined;
try {
  if (!member) throw new Error('An existing local user/workspace is required.');
  const token = generateAccessToken({
    userId: member.user.id,
    email: member.user.email,
  });
  const api = async <T>(
    path: string,
    method = 'GET',
    body?: unknown,
  ): Promise<T> => {
    const before = Date.now();
    const response = await fetch(
      `http://localhost:${config.port}/api/v1${path}`,
      {
        method,
        headers: {
          Cookie: `meetflow_access_token=${token}`,
          'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(20_000),
      },
    );
    const json = (await response.json()) as {
      data: T;
      error?: { code: string };
    };
    if (!response.ok)
      throw new Error(
        `API ${method} failed: ${json.error?.code ?? response.status}`,
      );
    if (method === 'GET')
      console.log(`API ${path.split('?')[0]}: ${Date.now() - before}ms`);
    return json.data;
  };
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  await context.addCookies([
    {
      name: 'meetflow_access_token',
      value: token,
      url: 'http://localhost:4000',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
  const page = await context.newPage();
  const errors: string[] = [];
  page.on('pageerror', (error: Error) =>
    errors.push(redactDiagnostics(error.message)),
  );
  const output = resolve('../dashboard/test-results');
  await mkdir(output, { recursive: true });
  captureFailure = async () => {
    console.error(`UI stopped at ${page.url()}`);
    if (errors.length) console.error(`Browser errors: ${errors.join('; ')}`);
    await page.screenshot({
      path: resolve(output, 'crud-failure.png'),
      fullPage: true,
    });
  };
  const title = `UI CRUD ${randomUUID().slice(0, 8)}`;
  await api('/auth/me');
  await page.goto('http://localhost:5173/');
  await page
    .getByRole('heading', { name: 'My Meetings' })
    .waitFor({ timeout: 20_000 });
  await page.getByRole('button', { name: 'Add Meeting', exact: true }).click();
  const create = page.getByRole('dialog');
  await create
    .getByPlaceholder('e.g. Q4 Executive Product Strategy Sync')
    .fill(title);
  const chips = create.getByLabel('Participants', { exact: true });
  await chips.fill('Alice');
  await chips.press('Enter');
  await chips.fill('alice');
  await chips.press('Enter');
  await expect(
    create.getByRole('button', { name: 'Remove Alice', exact: true }),
  ).toHaveCount(1);
  await chips.fill('Bob');
  await chips.press('Enter');
  await chips.press('Backspace');
  await expect(
    create.getByRole('button', { name: 'Remove Bob', exact: true }),
  ).toHaveCount(0);
  await chips.fill('Cara');
  await chips.press('Enter');
  await create
    .getByRole('button', { name: 'Remove Cara', exact: true })
    .click();
  await chips.fill('Bob');
  await chips.press('Enter');
  const createdResponse = page.waitForResponse(
    (response: {
      url: () => string;
      request: () => { method: () => string };
    }) =>
      response.url().endsWith('/api/v1/meetings') &&
      response.request().method() === 'POST',
  );
  await create
    .getByRole('button', { name: 'Schedule Meeting', exact: true })
    .click();
  const created = await (await createdResponse).json();
  meetingId = created.data.id;
  await expect(
    page.getByRole('link', { name: title, exact: true }),
  ).toBeVisible();
  let raw = await api<{ title: string; participants: { name: string }[] }>(
    `/meetings/${meetingId}`,
  );
  if (
    raw.participants
      .map((p) => p.name)
      .sort()
      .join(',') !== 'Alice,Bob'
  )
    throw new Error('Created participants were not persisted in Neon.');
  console.log(
    'Create: Enter/duplicate prevention/Backspace/X and Neon persistence verified',
  );
  await page
    .getByRole('button', { name: `Edit ${title}`, exact: true })
    .click();
  let edit = page.getByRole('dialog', { name: 'Edit meeting' });
  await edit
    .getByLabel('Meeting title', { exact: true })
    .fill(`${title} edited`);
  await edit.getByRole('button', { name: 'Remove Alice', exact: true }).click();
  await edit.getByLabel('Participants', { exact: true }).fill('Dana');
  await edit.getByLabel('Participants', { exact: true }).press('Enter');
  await edit.getByRole('button', { name: 'Save Changes' }).click();
  await expect(
    page.getByRole('button', { name: `Edit ${title} edited`, exact: true }),
  ).toBeVisible();
  raw = await api(`/meetings/${meetingId}`);
  if (
    raw.title !== `${title} edited` ||
    raw.participants
      .map((p) => p.name)
      .sort()
      .join(',') !== 'Bob,Dana'
  )
    throw new Error('Edit did not persist title/participants.');
  console.log(
    'Edit: updated title and participant replacement verified in Neon',
  );
  const task = await api<{ id: string }>('/action-items', 'POST', {
    meetingId,
    title: 'UI verification task',
    assigneeName: 'Dana',
  });
  await page.goto('http://localhost:5173/actions');
  await page.reload();
  const checkbox = page.getByRole('checkbox', {
    name: 'Complete UI verification task',
    exact: true,
  });
  await expect(checkbox).toBeVisible();
  const taskUrl = `**/api/v1/action-items/${task.id}`;
  await page.route(
    taskUrl,
    async (route: { continue: () => Promise<void> }) => {
      await new Promise((done) => setTimeout(done, 1200));
      await route.continue();
    },
  );
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await expect(checkbox).toBeDisabled();
  await expect(page.getByRole('status', { name: 'Saving task' })).toBeVisible();
  await expect(checkbox).toBeEnabled({ timeout: 20_000 });
  await page.unroute(taskUrl);
  let saved = await api<{ actionItems: { id: string; status: string }[] }>(
    `/action-items?meetingId=${meetingId}`,
  );
  if (saved.actionItems.find((item) => item.id === task.id)?.status !== 'DONE')
    throw new Error('Checkbox did not persist DONE.');
  let fail = true;
  await page.route(
    taskUrl,
    async (route: {
      fulfill: (response: unknown) => Promise<void>;
      continue: () => Promise<void>;
    }) => {
      if (fail) {
        fail = false;
        await new Promise((done) => setTimeout(done, 700));
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'VERIFY_FAILURE',
              message: 'Verification failure: task not saved',
            },
          }),
        });
      } else await route.continue();
    },
  );
  await checkbox.click();
  await expect(checkbox).not.toBeChecked();
  await expect(checkbox).toBeChecked({ timeout: 20_000 });
  await expect(checkbox).toBeEnabled();
  await expect(
    page.getByText('Verification failure: task not saved'),
  ).toBeVisible();
  await page.unroute(taskUrl);
  saved = await api(`/action-items?meetingId=${meetingId}`);
  if (saved.actionItems.find((item) => item.id === task.id)?.status !== 'DONE')
    throw new Error('Failure changed the persisted task.');
  console.log(
    'Tasks: immediate optimistic change, pending lock, persistence and failure rollback verified',
  );
  await page.goto('http://localhost:5173/overview');
  const stats = await api<{ completedActionItems: number }>(
    '/meetings/overview',
  );
  await expect(
    page.getByRole('group', { name: 'Completed', exact: true }),
  ).toContainText(String(stats.completedActionItems));
  await page.screenshot({
    path: resolve(output, 'crud-overview.png'),
    fullPage: true,
  });
  await page.goto('http://localhost:5173/');
  await page
    .getByRole('button', { name: `Delete ${title} edited`, exact: true })
    .click();
  const modal = page.getByRole('alertdialog', { name: 'Delete meeting?' });
  await expect(
    modal.getByRole('button', { name: 'Cancel', exact: true }),
  ).toBeFocused();
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(
    page.getByRole('button', { name: `Delete ${title} edited`, exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: `Delete ${title} edited`, exact: true })
    .click();
  let failDelete = true;
  await page.route(
    `**/api/v1/meetings/${meetingId}`,
    async (route: {
      request: () => { method: () => string };
      fulfill: (response: unknown) => Promise<void>;
      continue: () => Promise<void>;
    }) => {
      if (route.request().method() === 'DELETE' && failDelete) {
        failDelete = false;
        await route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'VERIFY_FAILURE',
              message: 'Verification failure: meeting not deleted',
            },
          }),
        });
      } else {
        if (route.request().method() === 'DELETE')
          await new Promise((done) => setTimeout(done, 800));
        await route.continue();
      }
    },
  );
  await modal
    .getByRole('button', { name: 'Delete Meeting', exact: true })
    .click();
  await expect(modal.getByRole('alert')).toContainText('Verification failure');
  await modal
    .getByRole('button', { name: 'Delete Meeting', exact: true })
    .click();
  await expect(
    modal.getByRole('button', { name: 'Deleting…', exact: true }),
  ).toBeDisabled();
  await expect(modal).not.toBeVisible({ timeout: 20_000 });
  if (await prisma.meeting.findUnique({ where: { id: meetingId } }))
    throw new Error('Delete did not remove the Neon meeting.');
  if (await prisma.actionItem.count({ where: { meetingId } }))
    throw new Error('Delete left orphaned action items.');
  meetingId = undefined;
  console.log(
    'Delete: accessible focus/cancel/error/retry/loading and Neon cascade verified',
  );
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  console.log('CRUD/UI verification complete; no uncaught browser errors');
} catch (error) {
  await captureFailure?.();
  console.error(
    redactDiagnostics(
      error instanceof Error ? error.message : 'UI verification failed',
    ),
  );
  process.exitCode = 1;
} finally {
  if (meetingId) {
    await prisma.meeting.delete({ where: { id: meetingId } }).catch(() => {});
    console.log('Temporary CRUD meeting removed');
  }
  await browser.close();
  await prisma.$disconnect();
}
