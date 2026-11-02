import '../src/env';
import assert from 'node:assert/strict';
import { compareDecisions, decisionStatuses, type MemoryDecision } from '../src/services/decision-reconciliation';

// Read-only provider smoke test: synthetic inputs, no database access or writes.
const record = (id: string, day: number, text: string, originalStatus = 'CONFIRMED'): MemoryDecision => ({
  id, meetingId: `meeting-${day}`, title: text, description: text, originalStatus,
  meeting: { startAt: new Date(`2026-11-0${day}T10:00:00Z`) },
  evidence: [{ meetingId: `meeting-${day}`, quote: text }],
});
const first = [record('scope-1', 1, 'AI summaries are a stretch goal.'), record('date-1', 1, 'December 15 is our launch target.'), record('pilot-1', 1, 'Nina can send pilot communications only after Daniel confirms QA sign-off.', 'CONDITIONAL')];
const second = [record('date-2', 2, 'December 15 is no longer approved. Launch date TBD.'), record('scope-2', 2, 'AI summaries remain a stretch goal, with the implementation limited to English.')];
const third = [record('scope-3', 3, 'AI summaries are removed from launch scope.')];
try {
  const relationships = [...await compareDecisions(first, second), ...await compareDecisions([...first, ...second], third)];
  const statuses = decisionStatuses([...first, ...second, ...third], relationships.map((r) => ({ ...r, status: r.kind === 'CONFLICTING' ? 'PENDING' : r.kind })));
  console.log(JSON.stringify({ relationships, statuses: Object.fromEntries(statuses) }, null, 2));
  assert.equal(statuses.get('scope-1'), 'SUPERSEDED');
  assert.equal(statuses.get('scope-2'), 'SUPERSEDED');
  assert.equal(statuses.get('scope-3'), 'ACTIVE');
  assert(['SUPERSEDED', 'WITHDRAWN'].includes(statuses.get('date-1')!));
  assert.equal(statuses.get('date-2'), 'ACTIVE');
  assert.equal(statuses.get('pilot-1'), 'CONDITIONAL');
  assert(relationships.some((r) => r.kind === 'REVISED'));
  console.log(JSON.stringify({ passed: true, syntheticMeetings: 3, relationships, statuses: Object.fromEntries(statuses), databaseWrites: 0 }, null, 2));
} catch (error) {
  console.error('Decision memory provider smoke test failed or provider unavailable. No database writes or credentials printed.');
  if (error instanceof assert.AssertionError) console.error({ kind: 'assertion', actual: error.actual, expected: error.expected });
  else if (error && typeof error === 'object') console.error({ kind: error.constructor.name, status: 'status' in error && typeof error.status === 'number' ? error.status : undefined, code: 'code' in error && typeof error.code === 'string' && /^[a-z_]{1,80}$/.test(error.code) ? error.code : undefined, parameter: 'param' in error && typeof error.param === 'string' && /^[a-z_.]{1,80}$/.test(error.param) ? error.param : undefined });
  process.exitCode = 1;
}
