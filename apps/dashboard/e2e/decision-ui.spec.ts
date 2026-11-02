import { test, expect } from '@playwright/test';

const meetingId = '11111111-1111-4111-8111-111111111111';
const projectId = '22222222-2222-4222-8222-222222222222';
test('calendar and meeting panels remain usable in desktop/mobile and light/dark themes', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const date = '2026-11-02T10:00:00Z';
  const tasks = Array.from({ length: 24 }, (_, i) => ({ id: `task-${i}`, meetingId, workspaceId: 'workspace', projectId, title: `Follow up ${i}`, status: 'TODO', priority: 'MEDIUM', source: 'AI_EXTRACTED', createdAt: date, updatedAt: date }));
  await page.route('**/api/**', async (route) => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api(?:\/v1)?/, '');
    let data: unknown = [];
    if (path === '/auth/me') data = { user: { id: 'admin', name: 'Test Admin', email: 'admin@example.invalid', role: 'ADMIN' }, workspace: { id: 'workspace', name: 'Test workspace', role: 'OWNER' }, onboarding: { completed: true, currentStep: 5 } };
    else if (path === '/meetings') data = { meetings: [], pagination: { total: 0, totalPages: 0 } };
    else if (path === `/meetings/${meetingId}`) data = { id: meetingId, projectId, workspaceId: 'workspace', title: 'Decision review', startAt: date, timezone: 'UTC', meetingStatus: 'COMPLETED', processingStatus: 'READY', sourceType: 'TRANSCRIPT_UPLOAD', durationSeconds: 0, participants: [], actionItems: tasks, segments: [{ id: 'segment', sequence: 0, text: 'Launch date TBD.', speakerName: 'Daniel', startMs: null, endMs: null }], summary: { overview: 'Launch date TBD.', keyPoints: [], decisions: ['Launch date TBD.'], topics: [] }, transcripts: [], createdAt: date, updatedAt: date };
    else if (path.endsWith('/highlights')) data = Array.from({ length: 24 }, (_, i) => ({ id: `highlight-${i}`, meetingId, label: `Highlight ${i}`, quote: 'Launch date TBD.', tag: 'Decision', startTime: 0, hasTimestamp: false }));
    else if (path.endsWith('/intelligence')) data = { decisions: [], conflicts: [], actions: [], reconciliation: null };
    else if (path === '/action-items') data = tasks;
    await route.fulfill({ contentType: 'application/json', body: JSON.stringify({ success: true, data }) });
  });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'dark']) {
      await page.goto('/calendar');
      await page.evaluate((value) => { localStorage.setItem('meetflow-ui-theme', value); }, theme);
      await page.reload();
      await expect(page.getByText('No meetings scheduled', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Next month', exact: true })).toBeVisible();
      expect(await page.getByRole('button', { name: /Create meeting on/ }).count()).toBeGreaterThan(27);
      await expect(page.locator('nav').getByText('AI Actions', { exact: true })).toHaveCount(0);
      await page.goto(`/meetings/${meetingId}`);
      await expect(page.getByText('Decision review', { exact: true })).toBeVisible();
      await expect(page.getByText('Create Clip', { exact: true })).toHaveCount(0);
      const highlights = page.getByRole('region', { name: 'Highlights', exact: true });
      const actions = page.getByRole('region', { name: 'Action items', exact: true });
      await expect(highlights).toBeVisible(); await expect(actions).toBeVisible();
      for (const region of [highlights, actions]) {
        expect(await region.evaluate((el) => el.scrollHeight > el.clientHeight && getComputedStyle(el).overflowY === 'auto')).toBe(true);
        await region.evaluate((el) => { el.scrollTop = 300; });
        await expect.poll(() => region.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `test-results/decision-ui-${width}-${theme}.png`, fullPage: true });
    }
  }
  expect(errors).toEqual([]);
});
