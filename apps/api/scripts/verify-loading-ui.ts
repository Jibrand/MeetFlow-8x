import '../src/env';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { prisma } from '../src/lib/prisma';
import { generateAccessToken } from '../src/lib/security';

const require = createRequire(
  new URL('../../dashboard/package.json', import.meta.url),
);
const { chromium } = require('@playwright/test');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const member = await prisma.workspaceMember.findFirst({
    include: { user: { select: { id: true, email: true } } },
  });
  if (!member) throw new Error('An existing local user/workspace is required.');
  const token = generateAccessToken({
    userId: member.user.id,
    email: member.user.email,
  });
  const output = resolve('../dashboard/test-results');
  await mkdir(output, { recursive: true });
  const pages = [
    ['/', 'Loading meetings', 'meetings'],
    ['/calendar', 'Loading calendar', 'calendar'],
    [
      '/meetings/00000000-0000-4000-8000-000000000000',
      'Loading meeting details',
      'detail',
    ],
    ['/actions', 'Loading action items', 'actions'],
    ['/overview', 'Loading overview', 'overview'],
  ];
  for (const [path, label, name] of pages) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      reducedMotion: 'reduce',
      colorScheme: 'light',
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
    let release!: () => void;
    const pending = new Promise<void>((done) => {
      release = done;
    });
    await context.route(
      '**/api/v1/**',
      async (route: {
        request(): { url(): string };
        continue(): Promise<void>;
      }) => {
        if (
          /\/api\/v1\/(meetings|action-items)(\/|\?|$)/.test(
            route.request().url(),
          )
        )
          await pending;
        await route.continue().catch(() => {});
      },
    );
    try {
      const page = await context.newPage();
      await page.goto(`http://localhost:5173${path}`);
      const skeleton = page.getByRole('status', { name: label, exact: true });
      try {
        await skeleton.waitFor({ timeout: 20_000 });
      } catch (error) {
        await page.screenshot({
          path: resolve(output, `loading-${name}-failure.png`),
          fullPage: true,
        });
        console.error(`Loading verification stopped at ${page.url()}`);
        throw error;
      }
      const count = await skeleton.locator('[data-skeleton]').count();
      if (!count) throw new Error(`No skeleton shapes on ${name}.`);
      const color = await skeleton
        .locator('[data-skeleton]')
        .first()
        .evaluate(
          (element: HTMLElement) => getComputedStyle(element).backgroundColor,
        );
      if (color === 'rgba(0, 0, 0, 0)' || color === 'rgb(255, 255, 255)')
        throw new Error(`Invisible skeleton on ${name}.`);
      await page.screenshot({
        path: resolve(output, `loading-${name}.png`),
        fullPage: true,
      });
      console.log(`${name}: visible loading state (${count} shapes, ${color})`);
    } finally {
      release();
      await context.close();
    }
  }
} finally {
  await browser.close();
  await prisma.$disconnect();
}
