import { beforeEach, describe, expect, it, vi } from 'vitest';
import { compareDecisions, decisionStatuses, validateRelationships, persistReconciliation, type MemoryDecision } from './decision-reconciliation';
const complete = vi.hoisted(() => vi.fn());
vi.mock('../lib/openai-client', () => ({ getOpenAI: () => ({ chat: { completions: { create: complete } } }) }));
const decision = (id: string, day: number, description: string, originalStatus = 'CONFIRMED'): MemoryDecision => ({
  id, meetingId: `meeting-${day}`, title: description, description, originalStatus,
  evidence: [{ quote: description, meetingId: `meeting-${day}` }], meeting: { startAt: new Date(`2026-11-${String(day).padStart(2, '0')}T10:00:00Z`) },
});
const relation = (previousDecisionId: string, newDecisionId: string, kind: 'SUPERSEDED' | 'REVISED' | 'CONFLICTING' | 'REAFFIRMED' = 'SUPERSEDED') => ({ previousDecisionId, newDecisionId, kind, explanation: 'The later meeting explicitly changes this decision.' });
beforeEach(() => complete.mockReset());
describe('cross-meeting decision reconciliation', () => {
  it('compares two CONFIRMED statements even when titles and wording differ', async () => {
    complete.mockResolvedValue({ choices: [{ message: { content: JSON.stringify({ relationships: [relation('a', 'c')] }) } }] });
    const records = [decision('a', 1, 'AI summaries are a stretch goal.'), decision('c', 3, 'AI summaries are removed from launch scope.')];
    const result = await compareDecisions(records.slice(0, 1), records.slice(1));
    expect(result).toEqual([relation('a', 'c')]);
    expect(decisionStatuses(records, result.map((r) => ({ ...r, status: r.kind })))).toEqual(new Map([['a', 'SUPERSEDED'], ['c', 'ACTIVE']]));
    const sent = JSON.parse(complete.mock.calls[0][0].messages[1].content);
    expect(sent.saved[0].evidence[0].quote).toContain('stretch goal');
    expect(sent.fresh[0].meeting.startAt).toBe('2026-11-03T10:00:00.000Z');
  });
  it('keeps three-meeting revisions and withdrawn launch targets in chronological history', () => {
    const records = [decision('c', 3, 'December 15 is no longer approved. Launch date TBD.'), decision('a', 1, 'December 15 is our launch target.'), decision('b', 2, 'The launch target is revised to December 20.')];
    const relationships = validateRelationships(records, [relation('b', 'a', 'REVISED'), relation('c', 'b')]);
    expect(relationships.map((r) => [r.previousDecisionId, r.newDecisionId, r.kind])).toEqual([['a', 'b', 'REVISED'], ['b', 'c', 'SUPERSEDED']]);
    const statuses = decisionStatuses(records, relationships.map((r) => ({ ...r, status: r.kind })));
    expect([...statuses]).toEqual([['c', 'ACTIVE'], ['a', 'SUPERSEDED'], ['b', 'SUPERSEDED']]);
    expect(records[0].description).toContain('TBD');
  });
  it('retires intermediate revisions when a replacement references an earlier ancestor', () => {
    const rows = [decision('a', 1, 'Stretch goal'), decision('b', 2, 'English only stretch goal'), decision('c', 3, 'Removed from launch scope')];
    const statuses = decisionStatuses(rows, [{ ...relation('a', 'b'), status: 'REVISED' }, { ...relation('a', 'c'), status: 'SUPERSEDED' }]);
    expect([...statuses]).toEqual([['a', 'SUPERSEDED'], ['b', 'SUPERSEDED'], ['c', 'ACTIVE']]);
  });
  it.each(['CONDITIONAL', 'PROPOSED', 'ESTIMATE', 'SUGGESTION'])('%s cannot supersede an approved decision', (status) => {
    const records = [decision('a', 1, 'Pilot approved'), decision('b', 2, 'Nina can send pilot communications only after Daniel confirms QA sign-off.', status)];
    const relationships = validateRelationships(records, [relation('a', 'b')]);
    expect(relationships[0].kind).toBe('CONFLICTING');
    const statuses = decisionStatuses(records, relationships.map((r) => ({ ...r, status: 'PENDING' })));
    expect(statuses.get('a')).toBe('ACTIVE');
    expect(statuses.get('b')).toBe(status);
  });
  it('requires review for equal meeting dates and rejects unknown IDs/self-links/duplicates', () => {
    const records = [decision('a', 1, 'Target A'), decision('b', 1, 'Target B')];
    expect(validateRelationships(records, [relation('a', 'b'), relation('b', 'a'), relation('a', 'missing'), relation('a', 'a')])).toEqual([{ ...relation('a', 'b'), kind: 'CONFLICTING' }]);
  });
  it('preserves a dismissed conflict and restores authority after review', () => {
    const records = [decision('a', 1, 'Target A'), decision('b', 2, 'Target B')];
    expect(decisionStatuses(records, [{ ...relation('a', 'b'), status: 'DISMISSED' }]).get('a')).toBe('ACTIVE');
    expect(decisionStatuses(records, [{ ...relation('a', 'b'), status: 'CONFIRMED' }]).get('b')).toBe('ACTIVE');
  });
  it('fails visibly on unavailable/malformed semantic comparison instead of publishing a false empty result', async () => {
    complete.mockRejectedValue(new Error('provider unavailable'));
    await expect(compareDecisions([decision('a', 1, 'Target A')], [decision('b', 2, 'Target B')])).rejects.toThrow('provider unavailable');
    complete.mockResolvedValue({ choices: [{ message: { content: '{}' } }] });
    await expect(compareDecisions([decision('a', 1, 'Target A')], [decision('b', 2, 'Target B')])).rejects.toThrow();
  });
  it('persists history and current status without modifying source evidence or overriding a review', async () => {
    const rows = [decision('a', 1, 'Launch December 15'), decision('b', 2, 'Launch TBD')];
    const tx = { decisionConflict: { updateMany: vi.fn(), upsert: vi.fn(), findMany: vi.fn().mockResolvedValue([{ ...relation('a', 'b'), status: 'SUPERSEDED' }]) }, decision: { updateMany: vi.fn() } };
    await persistReconciliation(tx as unknown as Parameters<typeof persistReconciliation>[0], 'project', rows, [relation('a', 'b')]);
    expect(tx.decisionConflict.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: {}, create: expect.objectContaining({ status: 'SUPERSEDED', projectId: 'project' }) }));
    expect(tx.decision.updateMany).toHaveBeenCalledWith({ where: { id: 'a', projectId: 'project', status: { not: 'SUPERSEDED' } }, data: { status: 'SUPERSEDED' } });
    expect(rows[0].evidence).toEqual([{ quote: 'Launch December 15', meetingId: 'meeting-1' }]);
  });
});
