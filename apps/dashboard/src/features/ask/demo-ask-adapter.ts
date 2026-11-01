import { SEEDED_MEETINGS } from '../../data/seeded-meetings';
import { getMergedActionItems } from '../meeting-detail/lib/action-items-store';

export interface AskCitation {
  meetingId: string;
  meetingTitle: string;
  timestampSeconds?: number;
  quote?: string;
}

export interface AskResponse {
  answer: string;
  citations: AskCitation[];
}

/**
 * Isolated deterministic response engine for Demo Mode.
 * Answers natural language queries accurately based on actual seeded meeting archives,
 * summaries, transcripts, and action items.
 * Easily swappable with a real AI endpoint in Phase 06.
 */
export async function queryDemoAssistant(question: string): Promise<AskResponse> {
  // Simulate natural assistant latency
  await new Promise((resolve) => setTimeout(resolve, 600));

  const q = question.toLowerCase().trim();

  // 1. Key decisions query
  if (q.includes('decision') || q.includes('decide') || q.includes('agreed')) {
    const decisions: { text: string; meeting: typeof SEEDED_MEETINGS[0] }[] = [];
    SEEDED_MEETINGS.forEach((m) => {
      m.summary?.decisions?.forEach((d) => {
        decisions.push({ text: d, meeting: m });
      });
    });

    const items = decisions.slice(0, 4);
    const answer = `Here are key decisions recorded across your recent meetings:\n\n` +
      items.map((i, idx) => `${idx + 1}. **${i.text}** (from *${i.meeting.title}*)`).join('\n\n');

    const citations: AskCitation[] = items.map((i) => ({
      meetingId: i.meeting.id,
      meetingTitle: i.meeting.title,
      quote: i.text,
      timestampSeconds: 0,
    }));

    return { answer, citations };
  }

  // 2. Open action items / tasks query
  if (q.includes('task') || q.includes('action') || q.includes('open') || q.includes('todo') || q.includes('assigned')) {
    const allActions = getMergedActionItems();
    const openTasks = allActions.filter((t) => !t.completed).slice(0, 5);

    if (openTasks.length === 0) {
      return {
        answer: 'All assigned action items across your meetings are currently marked as completed! No pending deliverables.',
        citations: [],
      };
    }

    const answer = `You currently have **${openTasks.length} open action items** needing attention:\n\n` +
      openTasks.map((t, idx) => {
        const assignee = t.assigneeName ? ` (Assigned to **${t.assigneeName}**)` : '';
        const due = t.dueDate ? ` — Due: ${t.dueDate}` : '';
        return `${idx + 1}. **${t.title}**${assignee}${due}`;
      }).join('\n\n');

    const citations: AskCitation[] = openTasks.map((t) => ({
      meetingId: t.meetingId,
      meetingTitle: t.meetingTitle || 'Meeting Call',
      timestampSeconds: t.timestampSeconds || 0,
      quote: t.title,
    }));

    return { answer, citations };
  }

  // 3. Database / migration / Neon query
  if (q.includes('database') || q.includes('migration') || q.includes('neon') || q.includes('prisma')) {
    const engMeeting = SEEDED_MEETINGS.find((m) => m.id === 'meet-01');
    const answer = `In the **Engineering Architecture** review, the team approved adopting **Neon serverless PostgreSQL** with connection pooling. The API middleware pipeline enforces 1MB body limits and structured JSON telemetry.\n\nDavid Kim and Sarah Connor are leading database indexing and Prisma composite key optimizations.`;

    const citations: AskCitation[] = engMeeting ? [
      {
        meetingId: engMeeting.id,
        meetingTitle: engMeeting.title,
        timestampSeconds: 25,
        quote: 'The connection pooler in Neon will handle our burst traffic without exhausting server connections.',
      },
    ] : [];

    return { answer, citations };
  }

  // 4. Engineering review / architecture query
  if (q.includes('engineering') || q.includes('architecture') || q.includes('event pipeline')) {
    const m = SEEDED_MEETINGS.find((m) => m.id === 'meet-01');
    const answer = `During the **Engineering Architecture** call, Jibran, Sarah Connor, Alex Vance, and David Kim locked down serverless connection pooling via Neon. Audio sync offset thresholds were set to 250ms for sub-second transcript precision.`;

    const citations: AskCitation[] = m ? [
      {
        meetingId: m.id,
        meetingTitle: m.title,
        timestampSeconds: 0,
        quote: 'Welcome everyone. Today we need to lock down the data architecture for MeetFlow AI...',
      },
    ] : [];

    return { answer, citations };
  }

  // 5. Security / compliance / SOC2 query
  if (q.includes('security') || q.includes('compliance') || q.includes('soc2') || q.includes('acme')) {
    const secMeeting = SEEDED_MEETINGS.find((m) => m.id === 'meet-07') || SEEDED_MEETINGS[0];
    const answer = `In customer discovery with enterprise stakeholders, questions centered around **SOC2 Type II compliance**, data encryption at rest via AES-256, and meeting audio retention periods. Single Sign-On (SAML/Okta) was confirmed on the near-term roadmap.`;

    const citations: AskCitation[] = [
      {
        meetingId: secMeeting.id,
        meetingTitle: secMeeting.title,
        timestampSeconds: 30,
        quote: 'Security compliance walkthrough, SOC2 data privacy controls, and API token hashing.',
      },
    ];

    return { answer, citations };
  }

  // 6. Blocker / retrospective query
  if (q.includes('blocker') || q.includes('risk') || q.includes('retrospective')) {
    return {
      answer: `Key blockers highlighted in recent syncs include:\n\n1. Webhook retry spikes during high-load intervals.\n2. Audio streaming boundary jitter under weak mobile network packet loss.\n\nThe team resolved to implement exponential backoff jitter in the ingestion service.`,
      citations: [
        {
          meetingId: 'meet-01',
          meetingTitle: 'Engineering Architecture: Neon Serverless & Event Pipelines',
          timestampSeconds: 63,
          quote: 'We need to handle network packet drops gracefully without losing transcript turn context.',
        },
      ],
    };
  }

  // 7. Honest fallback for unknown questions
  return {
    answer: `I could not find specific recorded discussions matching "${question}" in your current seeded meeting transcripts.\n\nTry asking about:\n- *"What were the key decisions?"*\n- *"Which tasks are still open?"*\n- *"What happened in the engineering review?"*\n- *"Who owns the database migration?"*\n- *"What enterprise security questions were discussed?"*`,
    citations: [],
  };
}
