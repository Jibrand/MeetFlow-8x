import '../src/env';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { prisma } from '../src/lib/prisma';
import { transcriptParserService } from '../src/services/transcript-parser.service';
import { meetingAIService, MeetingIntelligenceResultSchema } from '../src/services/meeting-ai.service';
import { prepareExecution, persistExecution, reconcileProjectDecisions } from '../src/services/execution-intelligence';
import { validateRelationships, type MemoryDecision } from '../src/services/decision-reconciliation';

// Refuse every target except the isolated, explicitly named local regression DB.
const target = new URL(process.env.DATABASE_URL!);
assert(['localhost', '127.0.0.1'].includes(target.hostname) && target.pathname === '/meetflow_regression' && target.port === '15439', 'Isolated regression database required');
try {
  const resume = process.argv.includes('--verify-existing');
  const workspace = resume ? await prisma.workspace.findFirstOrThrow({ where: { name: 'Plutio regression' } }) : await prisma.workspace.create({ data: { name: 'Plutio regression', slug: `plutio-${Date.now()}` } });
  const company = resume ? await prisma.company.findFirstOrThrow({ where: { name: 'Plutio regression' } }) : await prisma.company.create({ data: { name: 'Plutio regression' } });
  const project = resume ? await prisma.project.findFirstOrThrow({ where: { companyId: company.id } }) : await prisma.project.create({ data: { companyId: company.id, name: 'Workspace 2.0 regression' } });
  const names = ['1_Product_Planning', '2_Engineering_Crisis', '3_Leadership_Decisions'];
  const saved = [];
  if (resume) {
    const rows = await prisma.meeting.findMany({ where: { projectId: project.id }, orderBy: { startAt: 'asc' }, include: { transcripts: true, summary: true, decisions: true, actionItems: true } });
    for (const meeting of rows) {
      const segments = transcriptParserService.parse(meeting.transcripts.map((t) => t.rawText).join('\n'), 'txt').segments;
      const proof = (value: unknown) => Array.isArray(value) ? value[0] as { quote?: string; sequence?: number } : undefined;
      const result = MeetingIntelligenceResultSchema.parse({ model: 'stored-extraction-replay', overview: meeting.summary!.overview,
        decisionRecords: meeting.decisions.map((d) => ({ title: d.title, description: d.description, status: d.originalStatus, quote: proof(d.evidence)?.quote, sourceSequence: proof(d.evidence)?.sequence })),
        actionItems: meeting.actionItems.map((t) => ({ title: t.title, description: t.description ?? '', assigneeName: t.assigneeName, dueDate: t.dueDate?.toISOString() ?? null, priority: t.priority.toLowerCase(), quote: proof(t.evidence)?.quote, sourceSequence: proof(t.evidence)?.sequence })) });
      saved.push({ meeting, result, segments });
    }
    console.log('Continuing verification of the already-ingested real-transcript dataset; replay uses stored extraction records.');
  }
  for (const [index, name] of (resume ? [] : names.entries())) {
    const rawText = await readFile(new URL(`../fixtures/plutio/meeting-${name}.txt`, import.meta.url), 'utf8');
    const meeting = await prisma.meeting.create({ data: { workspaceId: workspace.id, projectId: project.id, title: name, startAt: new Date(`2026-10-${28 + index}T14:00:00Z`), timezone: 'America/New_York', processingStatus: 'READY', sourceType: 'TRANSCRIPT_UPLOAD', transcripts: { create: { rawText, sourceFilename: name + '.txt', sourceFormat: 'txt' } } } });
    const segments = transcriptParserService.parse(rawText, 'txt').segments;
    const result = await meetingAIService.analyzeMeeting({ meetingTitle: meeting.title, meetingDate: meeting.startAt, timezone: meeting.timezone, segments });
    console.log(JSON.stringify({ meeting: index + 1, extractedDecisions: result.decisionRecords.length, extractedTasks: result.actionItems.length }));
    await prisma.meetingSummary.create({ data: { meetingId: meeting.id, overview: result.overview, keyPoints: result.keyPoints, decisions: result.decisions, topics: result.topics, model: result.model } });
    const prepared = await prepareExecution(project.id, result, meeting, segments);
    await prisma.$transaction(async (tx) => {
      await tx.project.update({ where: { id: project.id }, data: { updatedAt: new Date() } });
      await persistExecution(tx, meeting, result, segments, prepared);
    }, { timeout: 30_000 });
    saved.push({ meeting, result, segments });
  }
  let decisions = await prisma.decision.findMany({ where: { projectId: project.id }, include: { meeting: { select: { startAt: true } } } });
  const tasks = await prisma.actionItem.findMany({ where: { projectId: project.id } });
  const first = decisions.filter((d) => d.meetingId === saved[0].meeting.id);
  assert(first.length >= 3, 'Meeting 1 structured decisions must persist');
  const feasibility = tasks.find((t) => t.meetingId === saved[0].meeting.id && /feasibility/i.test(t.title));
  assert(feasibility && /Sarah/.test(feasibility.assigneeName ?? '') && feasibility.dueDate?.toISOString().slice(0, 10) === '2026-11-06', 'Sarah feasibility report must retain owner/date/provenance');
  assert(tasks.filter((t) => t.meetingId === saved[0].meeting.id).length >= 6, 'All six Meeting 1 deliverables must persist');
  assert(first.some((d) => /December 15/i.test(d.description) && ['WITHDRAWN', 'SUPERSEDED'].includes(d.status)), 'Provisional December 15 target must be withdrawn');
  assert(first.some((d) => /AI.*summar|summar.*AI/i.test(d.description) && d.status === 'SUPERSEDED'), 'Original AI stretch goal must be superseded');
  assert(decisions.some((d) => /TBD/i.test(d.description) && d.status === 'ACTIVE'), 'Current public launch must remain TBD');
  assert(decisions.some((d) => /AI.*summar|summar.*AI/i.test(d.description) && /remov|exclud|not (?:be )?includ/i.test(d.description) && d.status === 'ACTIVE'), 'AI summaries must be removed');
  assert(decisions.some((d) => /November 24|24.*November/i.test(d.description) && d.status === 'CONDITIONAL'), 'Pilot must remain conditional');
  assert(decisions.some((d) => /Nina|communication/i.test(d.description) && /Daniel|QA/i.test(d.description) && d.status === 'CONDITIONAL'), 'Pilot communications must preserve QA gate');
  for (const d of decisions) {
    assert(Array.isArray(d.evidence) && d.evidence.length > 0);
    const source = saved.find((s) => s.meeting.id === d.meetingId)!;
    assert(source && +d.meeting.startAt === +source.meeting.startAt, 'Saved October date must be retained');
    for (const proof of d.evidence as { quote: string; meetingId: string; sequence: number }[]) assert(proof.meetingId === d.meetingId && source.segments.some((s) => s.sequence === proof.sequence && s.text.includes(proof.quote)), 'Every quote must be verbatim source evidence');
  }
  // Reprocessing exact extraction is idempotent, including summaries/highlights.
  const before = { decisions: decisions.length, tasks: tasks.length, summaries: await prisma.meetingSummary.count(), highlights: await prisma.highlight.count() };
  for (const { meeting, result, segments } of saved) {
    const prepared = await prepareExecution(project.id, result, meeting, segments);
    await prisma.$transaction((tx) => persistExecution(tx, meeting, result, segments, prepared), { timeout: 30_000 });
  }
  assert.deepEqual({ decisions: await prisma.decision.count(), tasks: await prisma.actionItem.count(), summaries: await prisma.meetingSummary.count(), highlights: await prisma.highlight.count() }, before);
  // Inject the production bug and ensure full reconciliation resolves it without deletion.
  const publicDate = decisions.find((d) => /TBD/i.test(d.description))!;
  const aiRemoval = decisions.find((d) => /AI.*summar|summar.*AI/i.test(d.description) && /remov|exclud|not (?:be )?includ/i.test(d.description))!;
  const bad = await prisma.decisionConflict.upsert({ where: { previousDecisionId_newDecisionId: { previousDecisionId: publicDate.id, newDecisionId: aiRemoval.id } }, create: { projectId: project.id, previousDecisionId: publicDate.id, newDecisionId: aiRemoval.id, explanation: 'These decisions do not directly relate.', status: 'PENDING' }, update: { explanation: 'These decisions do not directly relate.', status: 'PENDING' } });
  await reconcileProjectDecisions(project.id);
  assert.equal((await prisma.decisionConflict.findUniqueOrThrow({ where: { id: bad.id } })).status, 'INVALIDATED');
  const conflicts = await prisma.decisionConflict.findMany({ where: { projectId: project.id, status: 'PENDING' }, include: { previousDecision: true, newDecision: true } });
  assert.equal(conflicts.length, 0, 'Compatible Plutio outcomes must not create conflicts');
  decisions = await prisma.decision.findMany({ where: { projectId: project.id }, include: { meeting: { select: { startAt: true } } } });
  assert.equal(await prisma.meeting.count(), 3, 'Source meetings remain intact');
  const unrelated = validateRelationships(decisions as MemoryDecision[], [{ previousDecisionId: publicDate.id, newDecisionId: aiRemoval.id, kind: 'CONFLICTING', sameSubject: false, incompatible: false, previousQuote: publicDate.description, newQuote: aiRemoval.description, explanation: 'Unrelated subjects.' }]);
  assert.equal(unrelated.length, 0);
  console.log(JSON.stringify({ passed: true, database: 'isolated local meetflow_regression', meetings: 3, decisions: decisions.length, tasks: tasks.length, falseConflicts: conflicts.length, reprocessingDuplicates: 0, legacyFalseConflict: 'INVALIDATED', productionWrites: 0 }));
} catch (error) {
  if (error instanceof assert.AssertionError) console.error('Regression assertion: ' + error.message);
  else {
    const issue = error as { name?: string; status?: number; issues?: { path: (string | number)[]; code: string }[]; message?: string };
    console.error(JSON.stringify({ kind: issue.name, status: issue.status, schemaIssues: issue.issues?.map((i) => ({ path: i.path, code: i.code })) }));
    let message = issue.message ?? '';
    for (const [name, value] of Object.entries(process.env)) if (/KEY|SECRET|PASSWORD|DATABASE_URL|DIRECT_URL/i.test(name) && value && value.length > 4) message = message.split(value).join('[REDACTED]');
    console.error(message.replace(/postgres(?:ql)?:\/\/[^\s]+/g, '[DATABASE_URL]').slice(0, 2500));
  }
  process.exitCode = 1;
} finally { await prisma.$disconnect(); }
