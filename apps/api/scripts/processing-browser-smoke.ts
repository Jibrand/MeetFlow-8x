import '../src/env';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { prisma } from '../src/lib/prisma';
import { config } from '../src/config';
import { generateAccessToken } from '../src/lib/security';
import {
  getMeetingProcessingQueue,
  closeMeetingProcessingQueue,
} from '../src/queues/meeting-processing.queue';
import { redactDiagnostics } from '../src/lib/logger';

const require = createRequire(
  new URL('../../dashboard/package.json', import.meta.url),
);
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
let createdId: string | undefined;
let captureFailure: (() => Promise<void>) | undefined;
try {
  const member = await prisma.workspaceMember.findFirst({
    include: { user: { select: { id: true, email: true } } },
  });
  if (!member) throw new Error('An existing test user/workspace is required.');
  const token = generateAccessToken({
    userId: member.user.id,
    email: member.user.email,
  });
  const api = async <T>(
    path: string,
    method = 'GET',
    body?: unknown,
  ): Promise<T> => {
    const response = await fetch(
      `http://localhost:${config.port}/api/v1${path}`,
      {
        method,
        headers: {
          Cookie: `meetflow_access_token=${token}`,
          'Content-Type': 'application/json',
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
        signal: AbortSignal.timeout(15_000),
      },
    );
    const json = (await response.json()) as { data: T };
    if (!response.ok)
      throw new Error(`Browser smoke API returned ${response.status}`);
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
  captureFailure = async () => {
    console.error(`Browser check stopped at ${page.url()}`);
    if (errors.length) console.error(`Browser errors: ${errors.join('; ')}`);
    await page.screenshot({
      path: resolve('../dashboard/test-results/pipeline-failure.png'),
      fullPage: true,
    });
  };
  await page.route(
    '**/api/v1/meetings?*',
    async (route: { continue: () => Promise<void> }) => {
      await new Promise((done) => setTimeout(done, 1500));
      await route.continue();
    },
  );
  const output = resolve('../dashboard/test-results');
  await mkdir(output, { recursive: true });
  for (const [path, label, filename] of [
    ['/', 'Loading meetings', 'pipeline-meetings.png'],
    ['/calendar', 'Loading calendar', 'pipeline-calendar.png'],
  ]) {
    await page.goto(`http://localhost:5173${path}`);
    await page
      .getByRole('status', { name: label })
      .waitFor({ timeout: 20_000 });
    const text = await page.locator('body').innerText();
    if (
      /Q4 Product Roadmap Sync|Sarah Connor|Verified Audio \(Native HTML5\)/.test(
        text,
      )
    )
      throw new Error('Seeded data appeared during browser loading.');
    await page
      .getByRole('status', { name: label })
      .waitFor({ state: 'hidden', timeout: 20_000 });
    await page.screenshot({ path: resolve(output, filename), fullPage: true });
    console.log(`${path}: skeleton then real backend page verified`);
  }
  const created = await api<{ id: string }>('/meetings', 'POST', {
    title: '[Verification] Browser pipeline check',
    startAt: new Date().toISOString(),
    transcript: {
      rawText:
        'Alice: The launch is approved.\nBob: I will send the release notes.',
      sourceFilename: 'browser-check.txt',
      sourceFormat: 'txt',
    },
  });
  createdId = created.id;
  const deadline = Date.now() + 330_000;
  let ready = false;
  while (Date.now() < deadline) {
    const status = await api<{ processingStatus: string; errorCode?: string }>(
      `/meetings/${createdId}/processing`,
    );
    if (status.processingStatus === 'FAILED')
      throw new Error(
        status.errorCode || 'Browser verification meeting failed.',
      );
    if (status.processingStatus === 'READY') {
      ready = true;
      break;
    }
    await new Promise((done) => setTimeout(done, 1000));
  }
  if (!ready)
    throw new Error('Browser verification meeting did not reach READY.');
  await page.route(
    `**/api/v1/meetings/${createdId}`,
    async (route: { continue: () => Promise<void> }) => {
      await new Promise((done) => setTimeout(done, 1500));
      await route.continue();
    },
  );
  await page.goto(`http://localhost:5173/meetings/${createdId}`);
  await page
    .getByRole('status', { name: 'Loading meeting details' })
    .waitFor({ timeout: 20_000 });
  await page
    .getByRole('heading', { name: '[Verification] Browser pipeline check' })
    .waitFor({ timeout: 20_000 });
  await page.screenshot({
    path: resolve(output, 'pipeline-detail.png'),
    fullPage: true,
  });
  await page.getByRole('tab', { name: /Transcript/ }).click();
  await page.getByText('The launch is approved.', { exact: true }).waitFor();
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  console.log(
    'Meeting Detail: real READY summary and transcript rendered without browser errors',
  );
  const job = await getMeetingProcessingQueue().getJob(
    `meeting-process-${createdId}`,
  );
  if (job && (await job.getState()) !== 'active') await job.remove();
  await api(`/meetings/${createdId}`, 'DELETE');
  createdId = undefined;
  console.log('Temporary browser verification meeting removed');
} catch (error) {
  await captureFailure?.();
  console.error(
    redactDiagnostics(
      error instanceof Error ? error.message : 'Browser check failed',
    ),
  );
  if (createdId)
    console.error(`Verification meeting retained for inspection: ${createdId}`);
  process.exitCode = 1;
} finally {
  await browser.close();
  await closeMeetingProcessingQueue();
  await prisma.$disconnect();
}
