import { describe, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
const mocks = vi.hoisted(() => ({ findMeetings: vi.fn(), findTasks: vi.fn(), findSegments: vi.fn(), complete: vi.fn() }));
vi.mock('../../lib/prisma', () => ({ prisma: { meeting: { findMany: mocks.findMeetings }, actionItem: { findMany: mocks.findTasks }, transcriptSegment: { findMany: mocks.findSegments } } }));
vi.mock('../../lib/openai-client', () => ({ getOpenAI: () => ({ chat: { completions: { create: mocks.complete } } }) }));
vi.mock('../projects/projects.routes', () => ({ requireProject: vi.fn() }));
vi.mock('../../middleware/auth', () => ({ requireAuth: (req: express.Request, _res: express.Response, next: express.NextFunction) => { req.user = { userId: 'user', email: 'test@example.invalid' }; next(); } }));
vi.mock('../../middleware/workspace', () => ({ requireWorkspace: (req: express.Request, _res: express.Response, next: express.NextFunction) => { req.workspaceId = 'workspace'; next(); } }));
import { askRouter } from './ask.routes';

describe('Ask MeetFlow latest-context regression', () => {
  it('retains actual meeting dates, withdrawals, dependency descriptions and grounded citations', async () => {
    mocks.findMeetings.mockResolvedValue([
      { id: 'new', title: 'Third meeting', startAt: new Date('2026-11-03T10:00:00Z'), summary: { overview: 'Launch date TBD. AI summaries removed from launch.', decisions: ['December 15 no longer approved.'], keyPoints: [] } },
      { id: 'old', title: 'First meeting', startAt: new Date('2026-11-01T10:00:00Z'), summary: { overview: 'December 15 target.', decisions: [], keyPoints: [] } },
    ]);
    mocks.findTasks.mockResolvedValue([{ id: 'pilot', meetingId: 'new', title: 'Send pilot communications', status: 'TODO', description: 'Only after Daniel confirms QA sign-off.', assigneeName: 'Nina', dueDate: null }]);
    mocks.findSegments.mockResolvedValue([{ id: 'proof', meetingId: 'new', text: 'Launch date TBD.', startMs: null, speakerName: 'Daniel', meeting: { title: 'Third meeting', startAt: new Date('2026-11-03T10:00:00Z') } }]);
    mocks.complete.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ answer: 'Launch date is TBD. Nina must wait for Daniel’s QA sign-off.', sourceIds: ['summary:new', 'task:pilot', 'invented'] }) } }] });
    const app = express(); app.use(express.json()); app.use('/ask', askRouter);
    const response = await request(app).post('/ask').send({ projectId: '11111111-1111-4111-8111-111111111111', question: 'What is the current launch decision and pilot dependency?' });
    expect(response.status).toBe(200);
    expect(response.body.data.answer).toContain('TBD');
    expect(response.body.data.citations).toHaveLength(2);
    const payload = JSON.parse(mocks.complete.mock.calls[0][0].messages[1].content);
    expect(payload.sources[0].text).toContain('2026-11-03T10:00:00.000Z');
    expect(payload.sources.find((s: { id: string }) => s.id === 'task:pilot').text).toContain('Only after Daniel');
    expect(mocks.findMeetings).toHaveBeenCalledWith(expect.objectContaining({ where: { workspaceId: 'workspace', projectId: '11111111-1111-4111-8111-111111111111' }, orderBy: { startAt: 'desc' } }));
  });
});
