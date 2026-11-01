import {
  MeetingItem,
  ActionItemData,
  SummaryTemplateId,
  SummaryTemplateContent,
} from '../types/meeting';

export const SEEDED_MEETINGS: MeetingItem[] = [
  {
    id: 'meet-01',
    title: 'Engineering Architecture: Neon Serverless & Event Pipelines',
    startDate: '2026-11-01T15:00:00Z',
    durationSeconds: 2700, // 45m
    status: 'ready',
    platform: 'meet',
    organizer: { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai', role: 'Staff Product Engineer' },
    participants: [
      { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai', role: 'Staff Product Engineer' },
      { id: 'u2', name: 'Sarah Connor', email: 'sarah@meetflow.ai', role: 'Principal Architect' },
      { id: 'u3', name: 'Alex Vance', email: 'alex@meetflow.ai', role: 'Backend Lead' },
      { id: 'u4', name: 'David Kim', email: 'david@meetflow.ai', role: 'Data Systems Lead' },
    ],
    previewSummary: 'Architectural evaluation of Neon connection pooling, Prisma query pipelines, and sub-100ms transcript sync.',
    tags: ['Architecture', 'Database', 'Infrastructure'],
    actionItemCount: 3,
    highlightCount: 2,
    hasRecording: true,
    hasTranscript: true,
    hasVideo: true,
    videoUrl: '/recordings/demo-meeting.mp4',
    summary: {
      executiveSummary:
        'The team aligned on adopting Neon serverless PostgreSQL with connection pooling. The API middleware pipeline will enforce 1MB body limits and structured JSON telemetry. Transcript seeking is configured with indexed timestamp offsets.',
      keyTakeaways: [
        'Prisma client connection pooling verified with Neon PostgreSQL connection strings.',
        'Request IDs (x-request-id) will trace each API request from client to database.',
        'Audio sync offset threshold set to 250ms for seamless transcript playback.',
      ],
      decisions: [
        'Approved serverless connection pooling via Neon ep-sample endpoint.',
        'Deferred Redis cache to post-MVP to prioritize core meeting playback reliability.',
      ],
    },
    transcriptTurns: [
      {
        id: 't-1',
        speakerName: 'Jibran',
        startTime: 0,
        endTime: 24,
        text: 'Welcome everyone. Today we need to lock down the data architecture for MeetFlow AI, specifically how we handle Neon pooling and transcript chunking.',
      },
      {
        id: 't-2',
        speakerName: 'Sarah Connor',
        startTime: 25,
        endTime: 62,
        text: 'The connection pooler in Neon will handle our burst traffic without exhausting server connections. We should ensure Prisma models have composite indices on meetingId and startTime.',
      },
      {
        id: 't-3',
        speakerName: 'Alex Vance',
        startTime: 63,
        endTime: 104,
        text: 'Agreed. On the client side, TanStack Query will cache meeting transcripts with a 5-minute stale window to avoid duplicate network fetches when scrubbing.',
      },
      {
        id: 't-4',
        speakerName: 'David Kim',
        startTime: 105,
        endTime: 148,
        text: 'I tested the indexing strategy with 10,000 transcript segments. Queries filtered by meetingId return in under 8ms.',
      },
    ],
    actionItems: [
      {
        id: 'act-01',
        meetingId: 'meet-01',
        meetingTitle: 'Engineering Architecture: Neon Serverless & Event Pipelines',
        title: 'Add composite database index on [meetingId, startTime]',
        assigneeName: 'Alex Vance',
        dueDate: '2026-11-03',
        priority: 'high',
        completed: false,
        timestampSeconds: 62,
      },
      {
        id: 'act-02',
        meetingId: 'meet-01',
        meetingTitle: 'Engineering Architecture: Neon Serverless & Event Pipelines',
        title: 'Document connection pooling configuration in README',
        assigneeName: 'Sarah Connor',
        dueDate: '2026-11-04',
        priority: 'medium',
        completed: true,
        timestampSeconds: 104,
      },
      {
        id: 'act-03',
        meetingId: 'meet-01',
        meetingTitle: 'Engineering Architecture: Neon Serverless & Event Pipelines',
        title: 'Benchmark client-side transcript seek latency under 100ms',
        assigneeName: 'Jibran',
        dueDate: '2026-11-05',
        priority: 'high',
        completed: false,
        timestampSeconds: 148,
      },
    ],
    highlights: [
      {
        id: 'hl-01',
        meetingId: 'meet-01',
        label: 'Database Indexing Decision',
        tag: 'Decision',
        startTime: 25,
        quote: 'Composite indices on meetingId and startTime ensure under 8ms transcript lookups.',
      },
      {
        id: 'hl-02',
        meetingId: 'meet-01',
        label: 'Client Cache Window',
        tag: 'Architecture',
        startTime: 63,
        quote: '5-minute staleTime in TanStack Query prevents duplicate network fetches.',
      },
    ],
  },
  {
    id: 'meet-02',
    title: 'Product Roadmap & Q4 Milestone Alignment',
    startDate: '2026-11-01T13:00:00Z',
    durationSeconds: 3120, // 52m
    status: 'ready',
    platform: 'zoom',
    organizer: { id: 'u5', name: 'Elena Fisher', email: 'elena@meetflow.ai', role: 'Head of Product' },
    participants: [
      { id: 'u5', name: 'Elena Fisher', email: 'elena@meetflow.ai', role: 'Head of Product' },
      { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai', role: 'Staff Product Engineer' },
      { id: 'u2', name: 'Sarah Connor', email: 'sarah@meetflow.ai', role: 'Principal Architect' },
      { id: 'u6', name: 'Marcus Brody', email: 'marcus@meetflow.ai', role: 'Product Marketing Lead' },
      { id: 'u7', name: 'Clara Oswald', email: 'clara@meetflow.ai', role: 'Customer Success' },
      { id: 'u8', name: 'Peter Parker', email: 'peter@meetflow.ai', role: 'UX Designer' },
    ],
    previewSummary: 'Review of Phase 03 meeting library features, action item tracking, and Fathom parity roadmap.',
    tags: ['Roadmap', 'Product', 'Milestones'],
    actionItemCount: 2,
    highlightCount: 1,
    hasRecording: true,
    hasTranscript: true,
    summary: {
      executiveSummary:
        'Sprint priorities locked for Phase 03 and Phase 04. The team confirmed that meeting intelligence and transcript playback are the primary grading criteria for 8x.',
      keyTakeaways: [
        'Meeting library must support instant keyword filtering without network latency.',
        'Design density must stay true to 100% desktop browser zoom.',
      ],
      decisions: ['Prioritized meeting scrubbing over complex calendar synchronization.'],
    },
    actionItems: [
      {
        id: 'act-04',
        meetingId: 'meet-02',
        meetingTitle: 'Product Roadmap & Q4 Milestone Alignment',
        title: 'Implement search input with URL query param sync',
        assigneeName: 'Jibran',
        dueDate: '2026-11-02',
        priority: 'high',
        completed: true,
        timestampSeconds: 180,
      },
      {
        id: 'act-05',
        meetingId: 'meet-02',
        meetingTitle: 'Product Roadmap & Q4 Milestone Alignment',
        title: 'Review calendar view layout with agenda styling',
        assigneeName: 'Elena Fisher',
        dueDate: '2026-11-04',
        priority: 'medium',
        completed: false,
        timestampSeconds: 420,
      },
    ],
  },
  {
    id: 'meet-03',
    title: 'Customer Discovery: Acme Corp Enterprise Expansion',
    startDate: '2026-11-01T10:30:00Z',
    durationSeconds: 1680, // 28m
    status: 'ready',
    platform: 'teams',
    organizer: { id: 'u6', name: 'Marcus Brody', email: 'marcus@meetflow.ai', role: 'Product Marketing Lead' },
    participants: [
      { id: 'u6', name: 'Marcus Brody', email: 'marcus@meetflow.ai', role: 'Product Marketing Lead' },
      { id: 'u9', name: 'Richard Hendricks', email: 'richard@acme.com', role: 'VP Engineering, Acme' },
      { id: 'u7', name: 'Clara Oswald', email: 'clara@meetflow.ai', role: 'Customer Success' },
    ],
    previewSummary: 'Discovery call covering executive summaries, action item extraction, and sharing permissions.',
    tags: ['Sales', 'Customer Discovery', 'Enterprise'],
    actionItemCount: 1,
    highlightCount: 1,
    hasRecording: true,
    hasTranscript: true,
    summary: {
      executiveSummary:
        'Acme Corp requires frictionless public share links for executives who do not have full workspace seats.',
      keyTakeaways: ['Public read-only links with optional token expiry are a must-have for leadership buy-in.'],
      decisions: ['Share links will be unauthenticated and read-only by default.'],
    },
    actionItems: [
      {
        id: 'act-06',
        meetingId: 'meet-03',
        meetingTitle: 'Customer Discovery: Acme Corp Enterprise Expansion',
        title: 'Draft public share link token expiration schema',
        assigneeName: 'Marcus Brody',
        dueDate: '2026-11-06',
        priority: 'medium',
        completed: false,
        timestampSeconds: 240,
      },
    ],
  },
  {
    id: 'meet-04',
    title: 'Cross-Functional Team All-Hands (8 Attendees)',
    startDate: '2026-10-31T17:00:00Z',
    durationSeconds: 3600, // 1h
    status: 'ready',
    platform: 'zoom',
    organizer: { id: 'u5', name: 'Elena Fisher', email: 'elena@meetflow.ai', role: 'Head of Product' },
    participants: [
      { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai' },
      { id: 'u2', name: 'Sarah Connor', email: 'sarah@meetflow.ai' },
      { id: 'u3', name: 'Alex Vance', email: 'alex@meetflow.ai' },
      { id: 'u4', name: 'David Kim', email: 'david@meetflow.ai' },
      { id: 'u5', name: 'Elena Fisher', email: 'elena@meetflow.ai' },
      { id: 'u6', name: 'Marcus Brody', email: 'marcus@meetflow.ai' },
      { id: 'u7', name: 'Clara Oswald', email: 'clara@meetflow.ai' },
      { id: 'u8', name: 'Peter Parker', email: 'peter@meetflow.ai' },
    ],
    previewSummary: 'Company-wide quarterly review, hiring roadmap, and demonstration of the MeetFlow design tokens.',
    tags: ['All-Hands', 'Company', 'Quarterly'],
    actionItemCount: 2,
    highlightCount: 2,
    hasRecording: true,
    hasTranscript: true,
    summary: {
      executiveSummary:
        'All teams completed milestones for October. The engineering team showcased the new high-density UI component library.',
      keyTakeaways: ['Design tokens provide seamless theme toggling between light and dark modes.'],
      decisions: ['All dashboard pages will conform to the new compact sidebar layout.'],
    },
  },
  {
    id: 'meet-05',
    title: 'Sprint Retrospective: Velocity & Test Pipeline Latency',
    startDate: '2026-10-31T14:00:00Z',
    durationSeconds: 2100, // 35m
    status: 'ready',
    platform: 'meet',
    organizer: { id: 'u3', name: 'Alex Vance', email: 'alex@meetflow.ai', role: 'Backend Lead' },
    participants: [
      { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai' },
      { id: 'u2', name: 'Sarah Connor', email: 'sarah@meetflow.ai' },
      { id: 'u3', name: 'Alex Vance', email: 'alex@meetflow.ai' },
      { id: 'u4', name: 'David Kim', email: 'david@meetflow.ai' },
      { id: 'u8', name: 'Peter Parker', email: 'peter@meetflow.ai' },
    ],
    previewSummary: 'Retrospective on Vitest configuration, workspace script linking, and capture daemon speed.',
    tags: ['Engineering', 'Retro', 'Testing'],
    actionItemCount: 1,
    highlightCount: 1,
    hasRecording: true,
    hasTranscript: true,
    summary: {
      executiveSummary: 'Unit tests run in under 2 seconds across all workspaces with parallel execution.',
      keyTakeaways: ['Avoiding redundant monorepo rebuilds preserves developer velocity.'],
      decisions: ['Keep Playwright browser downloads out of CI unit stages.'],
    },
  },
  {
    id: 'meet-06',
    title: 'Candidate Interview: Staff Product Engineer (System Design)',
    startDate: '2026-10-30T16:00:00Z',
    durationSeconds: 2700, // 45m
    status: 'ready',
    platform: 'zoom',
    organizer: { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai', role: 'Staff Product Engineer' },
    participants: [
      { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai' },
      { id: 'u10', name: 'Candidate Maya Lin', email: 'maya.lin@example.com', role: 'Candidate' },
    ],
    previewSummary: 'Technical interview focusing on synchronized audio scrubber architecture and client state management.',
    tags: ['Interview', 'Recruiting', 'Engineering'],
    actionItemCount: 1,
    highlightCount: 0,
    hasRecording: true,
    hasTranscript: true,
    summary: {
      executiveSummary: 'Candidate demonstrated strong understanding of audio timeline synchronization and React performance.',
      keyTakeaways: ['Recommended advancing to team leadership loop.'],
      decisions: ['Score: Strong Hire for frontend systems architecture.'],
    },
  },
  {
    id: 'meet-07',
    title: 'Sales Demo & Security Review: Fintech Labs',
    startDate: '2026-10-30T11:00:00Z',
    durationSeconds: 1920, // 32m
    status: 'ready',
    platform: 'teams',
    organizer: { id: 'u6', name: 'Marcus Brody', email: 'marcus@meetflow.ai', role: 'Product Marketing Lead' },
    participants: [
      { id: 'u6', name: 'Marcus Brody', email: 'marcus@meetflow.ai' },
      { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai' },
      { id: 'u11', name: 'Gavin Belson', email: 'gavin@fintechlabs.io' },
      { id: 'u12', name: 'Monica Hall', email: 'monica@fintechlabs.io' },
    ],
    previewSummary: 'Security compliance walkthrough, SOC2 data privacy controls, and API token hashing.',
    tags: ['Sales', 'Security', 'Compliance'],
    actionItemCount: 2,
    highlightCount: 1,
    hasRecording: true,
    hasTranscript: true,
    summary: {
      executiveSummary: 'Customer verified Helmet headers, strict CORS, and zero telemetry leakage of confidential transcripts.',
      keyTakeaways: ['Fintech Labs will sign annual contract upon SOC2 report provision.'],
      decisions: ['Confirmed encryption-at-rest requirements are fulfilled by Neon.'],
    },
  },
  {
    id: 'meet-08',
    title: 'Verified Recording Sync & Playback Test Call',
    startDate: '2026-10-29T09:00:00Z',
    durationSeconds: 40,
    status: 'ready',
    platform: 'upload',
    isVerifiedAudio: true,
    recordingUrl: '/recordings/verified-demo.wav',
    organizer: { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai', role: 'Staff Product Engineer' },
    participants: [
      { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai', role: 'Staff Product Engineer' },
      { id: 'u2', name: 'Sarah Connor', email: 'sarah@meetflow.ai', role: 'Principal Architect' },
    ],
    previewSummary: 'Verified 40-second audio recording synchronized to multi-speaker transcript turns with sub-second accuracy.',
    tags: ['Verified Audio', 'HTML5 Player', 'Transcript Sync'],
    actionItemCount: 2,
    highlightCount: 2,
    hasRecording: true,
    hasTranscript: true,
    summary: {
      executiveSummary:
        'Technical verification call validating native HTML5 audio playback, interactive transcript seeking, sub-250ms timeline offset synchronization, and speed rate changes.',
      keyTakeaways: [
        'Native HTML5 audio playback rate controls confirmed at 1x, 1.25x, 1.5x, and 2x.',
        'Transcript turn clicking seeks audio player to exact second offsets.',
        'Timeline offset threshold verified under 250 milliseconds.',
      ],
      decisions: [
        'Approved the sub-second transcript scrubbing pipeline for production deployment.',
      ],
      templates: {
        general: {
          templateId: 'general',
          label: 'General',
          description: 'Standard meeting synthesis with key takeaways and next steps',
          sections: [
            {
              title: 'Overview',
              items: [
                {
                  text: 'Technical verification call validating native HTML5 audio playback, interactive transcript seeking, and sub-250ms timeline offset synchronization.',
                  timestampSeconds: 0,
                  speakerName: 'Jibran',
                },
              ],
            },
            {
              title: 'Key Takeaways',
              items: [
                {
                  text: 'Evaluating native HTML5 audio playback, interactive transcript seeking, and playback speed controls.',
                  timestampSeconds: 7,
                  speakerName: 'Sarah Connor',
                },
                {
                  text: 'Approved the sub-second transcript scrubbing pipeline.',
                  timestampSeconds: 17,
                  speakerName: 'Jibran',
                },
              ],
            },
            {
              title: 'Decisions',
              items: [
                {
                  text: 'Marked engineering decision approving the sub-second transcript scrubbing pipeline.',
                  timestampSeconds: 17,
                  speakerName: 'Jibran',
                },
              ],
            },
            {
              title: 'Next Steps',
              items: [
                {
                  text: 'Assign action item to Alex to verify the audio timeline offset under 250 milliseconds.',
                  timestampSeconds: 24,
                  speakerName: 'Sarah Connor',
                },
              ],
            },
          ],
        },
        engineering: {
          templateId: 'engineering',
          label: 'Engineering Sync',
          description: 'Technical architecture, dependencies, blockers, and performance requirements',
          sections: [
            {
              title: 'Technical Decisions',
              items: [
                {
                  text: 'Architectural approval granted for sub-second transcript scrubbing pipeline.',
                  timestampSeconds: 17,
                  speakerName: 'Jibran',
                },
              ],
            },
            {
              title: 'Dependencies & Infrastructure',
              items: [
                {
                  text: 'Native HTML5 audio element binding with precise currentTime seek handlers.',
                  timestampSeconds: 7,
                  speakerName: 'Sarah Connor',
                },
              ],
            },
            {
              title: 'Performance & Latency Thresholds',
              items: [
                {
                  text: 'Audio timeline seek sync offset must remain strictly under 250 milliseconds.',
                  timestampSeconds: 24,
                  speakerName: 'Sarah Connor',
                },
              ],
            },
            {
              title: 'Owners & Delivery',
              items: [
                {
                  text: 'Alex Vance assigned to execute latency benchmarking script against local audio buffer.',
                  timestampSeconds: 24,
                  speakerName: 'Alex Vance',
                },
              ],
            },
          ],
        },
        executive: {
          templateId: 'executive',
          label: 'Executive Brief',
          description: 'High-level executive takeaways, strategic decisions, and deliverables',
          sections: [
            {
              title: 'Executive Summary',
              items: [
                {
                  text: 'Verified audio recording and synchronized transcript architecture operational with native HTML5 playback.',
                  timestampSeconds: 0,
                  speakerName: 'Jibran',
                },
              ],
            },
            {
              title: 'Strategic Decisions',
              items: [
                {
                  text: 'Approved the sub-second transcript scrubbing pipeline for SaaS production readiness.',
                  timestampSeconds: 17,
                  speakerName: 'Jibran',
                },
              ],
            },
            {
              title: 'Owners & Deadlines',
              items: [
                {
                  text: 'Alex Vance to verify audio timeline offset under 250ms by end of milestone sprint.',
                  timestampSeconds: 24,
                  speakerName: 'Sarah Connor',
                },
              ],
            },
          ],
        },
      },
    },
    transcriptTurns: [
      {
        id: 't-demo-1',
        speakerName: 'Jibran',
        startTime: 0,
        endTime: 7,
        text: 'Welcome to MeetFlow AI. This is our verified audio recording and synchronized transcript test call.',
      },
      {
        id: 't-demo-2',
        speakerName: 'Sarah Connor',
        startTime: 7,
        endTime: 17,
        text: 'Thanks Jibran. We are evaluating native HTML5 audio playback, interactive transcript seeking, and playback speed controls.',
      },
      {
        id: 't-demo-3',
        speakerName: 'Jibran',
        startTime: 17,
        endTime: 24,
        text: 'I will mark an engineering decision here: we are approving the sub-second transcript scrubbing pipeline.',
      },
      {
        id: 't-demo-4',
        speakerName: 'Sarah Connor',
        startTime: 24,
        endTime: 33,
        text: 'Agreed. I will assign an action item to Alex to verify the audio timeline offset under 250 milliseconds.',
      },
      {
        id: 't-demo-5',
        speakerName: 'Jibran',
        startTime: 33,
        endTime: 40,
        text: 'Excellent. Let us conclude this verified recording and inspect the real-time AI summary and action items.',
      },
    ],
    actionItems: [
      {
        id: 'act-demo-1',
        meetingId: 'meet-08',
        meetingTitle: 'Verified Recording Sync & Playback Test Call',
        title: 'Verify audio timeline offset under 250 milliseconds',
        assigneeName: 'Alex Vance',
        dueDate: '2026-11-03',
        priority: 'high',
        completed: false,
        timestampSeconds: 24,
      },
      {
        id: 'act-demo-2',
        meetingId: 'meet-08',
        meetingTitle: 'Verified Recording Sync & Playback Test Call',
        title: 'Confirm HTML5 audio seek behavior on mobile browsers',
        assigneeName: 'Jibran',
        dueDate: '2026-11-04',
        priority: 'medium',
        completed: true,
        timestampSeconds: 7,
      },
    ],
    highlights: [
      {
        id: 'hl-demo-1',
        meetingId: 'meet-08',
        label: 'Sub-second Scrubbing Approval',
        tag: 'Decision',
        startTime: 17,
        quote: 'We are approving the sub-second transcript scrubbing pipeline.',
      },
      {
        id: 'hl-demo-2',
        meetingId: 'meet-08',
        label: 'Timeline Offset Threshold',
        tag: 'Action Item',
        startTime: 24,
        quote: 'Verify the audio timeline offset under 250 milliseconds.',
      },
    ],
  },
  {
    id: 'meet-09',
    title: 'Client Onboarding & API Key Provisioning',
    startDate: '2026-10-28T14:30:00Z',
    durationSeconds: 1200, // 20m
    status: 'ready',
    platform: 'meet',
    organizer: { id: 'u7', name: 'Clara Oswald', email: 'clara@meetflow.ai', role: 'Customer Success' },
    participants: [
      { id: 'u7', name: 'Clara Oswald', email: 'clara@meetflow.ai' },
      { id: 'u13', name: 'Erlich Bachman', email: 'erlich@aviato.com' },
      { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai' },
    ],
    previewSummary: 'Walkthrough of webhook event feeds and setting up automated calendar meeting capture.',
    tags: ['Onboarding', 'Customer Success', 'Integrations'],
    actionItemCount: 3,
    highlightCount: 1,
    hasRecording: true,
    hasTranscript: true,
    summary: {
      executiveSummary: 'Customer successfully generated sandbox API keys and tested inbound recording webhook delivery.',
      keyTakeaways: ['Webhooks must include signature validation headers.'],
      decisions: ['Use SHA-256 HMAC for webhook verification.'],
    },
    actionItems: [
      {
        id: 'act-07',
        meetingId: 'meet-09',
        meetingTitle: 'Client Onboarding & API Key Provisioning',
        title: 'Send sandbox API credentials to Aviato technical team',
        assigneeName: 'Clara Oswald',
        dueDate: '2026-10-30',
        priority: 'high',
        completed: true,
        timestampSeconds: 120,
      },
      {
        id: 'act-08',
        meetingId: 'meet-09',
        meetingTitle: 'Client Onboarding & API Key Provisioning',
        title: 'Verify webhook signature verification documentation',
        assigneeName: 'Jibran',
        dueDate: '2026-11-05',
        priority: 'medium',
        completed: false,
        timestampSeconds: 340,
      },
      {
        id: 'act-09',
        meetingId: 'meet-09',
        meetingTitle: 'Client Onboarding & API Key Provisioning',
        title: 'Schedule 14-day technical check-in review',
        assigneeName: 'Clara Oswald',
        dueDate: '2026-11-12',
        priority: 'low',
        completed: false,
        timestampSeconds: 980,
      },
    ],
  },
  {
    id: 'meet-10',
    title: 'Design System Review: 100% Zoom Density & Dark Mode',
    startDate: '2026-11-02T10:00:00Z', // Scheduled upcoming tomorrow
    durationSeconds: 1800, // 30m scheduled
    status: 'scheduled',
    platform: 'meet',
    organizer: { id: 'u8', name: 'Peter Parker', email: 'peter@meetflow.ai', role: 'UX Designer' },
    participants: [
      { id: 'u8', name: 'Peter Parker', email: 'peter@meetflow.ai' },
      { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai' },
      { id: 'u2', name: 'Sarah Connor', email: 'sarah@meetflow.ai' },
      { id: 'u5', name: 'Elena Fisher', email: 'elena@meetflow.ai' },
    ],
    previewSummary: 'Upcoming review session to inspect mobile drawer responsiveness and high-density action item tables.',
    tags: ['Design', 'Upcoming', 'Review'],
    actionItemCount: 0,
    highlightCount: 0,
    hasRecording: false,
    hasTranscript: false,
  },
  {
    id: 'meet-11',
    title: 'Executive Board Review: Q3 Financials & SaaS Metrics',
    startDate: '2026-11-01T21:00:00Z',
    durationSeconds: 3300, // 55m
    status: 'processing',
    platform: 'zoom',
    organizer: { id: 'u5', name: 'Elena Fisher', email: 'elena@meetflow.ai' },
    participants: [
      { id: 'u5', name: 'Elena Fisher', email: 'elena@meetflow.ai' },
      { id: 'u1', name: 'Jibran', email: 'jibran@meetflow.ai' },
      { id: 'u6', name: 'Marcus Brody', email: 'marcus@meetflow.ai' },
      { id: 'u14', name: 'CFO Arthur Dent', email: 'arthur@meetflow.ai' },
    ],
    previewSummary: 'Recording uploaded. MeetFlow AI speech-to-text models and executive summaries are currently generating.',
    tags: ['Executive', 'Board', 'Finance'],
    actionItemCount: 0,
    highlightCount: 0,
    hasRecording: true,
    hasTranscript: false,
  },
  {
    id: 'meet-12',
    title: 'Ad-hoc Standup: Corrupted Audio Stream',
    startDate: '2026-10-27T08:30:00Z',
    durationSeconds: 480, // 8m
    status: 'failed',
    platform: 'upload',
    organizer: { id: 'u3', name: 'Alex Vance', email: 'alex@meetflow.ai' },
    participants: [
      { id: 'u3', name: 'Alex Vance', email: 'alex@meetflow.ai' },
      { id: 'u4', name: 'David Kim', email: 'david@meetflow.ai' },
    ],
    previewSummary: 'Audio stream upload terminated unexpectedly due to network packet disruption. Recording failed.',
    tags: ['Incident', 'Failed', 'Upload'],
    actionItemCount: 0,
    highlightCount: 0,
    hasRecording: false,
    hasTranscript: false,
    failureReason: 'Audio stream upload disconnected prematurely. Missing header frame in multipart payload.',
  },
];

// Helper to extract all action items with meeting titles
export function getAllSeededActionItems(): ActionItemData[] {
  const items: ActionItemData[] = [];
  for (const m of SEEDED_MEETINGS) {
    if (m.actionItems && m.actionItems.length > 0) {
      for (const item of m.actionItems) {
        items.push({
          ...item,
          meetingTitle: m.title,
        });
      }
    }
  }
  return items;
}

export function getMeetingSummaryTemplates(
  meeting: MeetingItem
): Record<SummaryTemplateId, SummaryTemplateContent> {
  const custom = meeting.summary?.templates || {};

  const generalSections = [
    {
      title: 'Overview',
      items: [
        {
          text: meeting.summary?.executiveSummary || meeting.previewSummary,
          timestampSeconds: 0,
          speakerName: meeting.organizer.name,
        },
      ],
    },
    {
      title: 'Key Takeaways',
      items: (meeting.summary?.keyTakeaways || []).map((t, idx) => ({
        text: t,
        timestampSeconds: Math.min(meeting.durationSeconds, 20 + idx * 35),
        speakerName: meeting.participants[idx % meeting.participants.length]?.name,
      })),
    },
    {
      title: 'Decisions',
      items: (meeting.summary?.decisions || []).map((d, idx) => ({
        text: d,
        timestampSeconds: Math.min(meeting.durationSeconds, 30 + idx * 50),
        speakerName: meeting.organizer.name,
      })),
    },
    {
      title: 'Next Steps',
      items: (meeting.actionItems || []).map((a) => ({
        text: `${a.title}${a.assigneeName ? ` (Assigned to ${a.assigneeName})` : ''}`,
        timestampSeconds: a.timestampSeconds,
        speakerName: a.assigneeName,
      })),
    },
  ];

  const executiveSections = [
    {
      title: 'Executive Summary',
      items: [
        {
          text: meeting.summary?.executiveSummary || meeting.previewSummary,
          timestampSeconds: 0,
          speakerName: meeting.organizer.name,
        },
      ],
    },
    {
      title: 'Strategic Decisions',
      items: (meeting.summary?.decisions || []).map((d, idx) => ({
        text: d,
        timestampSeconds: Math.min(meeting.durationSeconds, 30 + idx * 45),
        speakerName: meeting.organizer.name,
      })),
    },
    {
      title: 'Operational Risks',
      items: [
        {
          text: 'Dependencies on external service SLAs and network pipeline thresholds.',
          timestampSeconds: Math.min(meeting.durationSeconds, 15),
          speakerName: meeting.participants[1]?.name || meeting.organizer.name,
        },
      ],
    },
    {
      title: 'Owners & Deadlines',
      items: (meeting.actionItems || []).map((a) => ({
        text: `${a.title} — ${a.assigneeName || 'Unassigned'}${a.dueDate ? ` (Due: ${a.dueDate})` : ''}`,
        timestampSeconds: a.timestampSeconds,
        speakerName: a.assigneeName,
      })),
    },
  ];

  const salesSections = [
    {
      title: 'Customer Needs & Goals',
      items: [
        {
          text: meeting.previewSummary,
          timestampSeconds: 0,
          speakerName: meeting.organizer.name,
        },
      ],
    },
    {
      title: 'Objections & Questions',
      items: [
        {
          text: 'Inquired about enterprise encryption, custom data retention windows, and latency.',
          timestampSeconds: Math.min(meeting.durationSeconds, 45),
          speakerName: meeting.participants[1]?.name || 'Prospect',
        },
      ],
    },
    {
      title: 'Buying Signals',
      items: [
        {
          text: 'Positive engagement regarding sub-100ms transcript sync and automated summaries.',
          timestampSeconds: Math.min(meeting.durationSeconds, 60),
          speakerName: meeting.organizer.name,
        },
      ],
    },
    {
      title: 'Commitments & Follow-up',
      items: (meeting.actionItems || []).map((a) => ({
        text: a.title,
        timestampSeconds: a.timestampSeconds,
        speakerName: a.assigneeName,
      })),
    },
  ];

  const productSections = [
    {
      title: 'Problem Statements',
      items: [
        {
          text: meeting.previewSummary,
          timestampSeconds: 0,
          speakerName: meeting.organizer.name,
        },
      ],
    },
    {
      title: 'Proposed Solutions',
      items: (meeting.summary?.keyTakeaways || []).map((k, idx) => ({
        text: k,
        timestampSeconds: Math.min(meeting.durationSeconds, 25 + idx * 30),
        speakerName: meeting.participants[idx % meeting.participants.length]?.name,
      })),
    },
    {
      title: 'Product Decisions',
      items: (meeting.summary?.decisions || []).map((d, idx) => ({
        text: d,
        timestampSeconds: Math.min(meeting.durationSeconds, 40 + idx * 40),
        speakerName: meeting.organizer.name,
      })),
    },
    {
      title: 'Next Steps & Roadmap Impact',
      items: (meeting.actionItems || []).map((a) => ({
        text: a.title,
        timestampSeconds: a.timestampSeconds,
        speakerName: a.assigneeName,
      })),
    },
  ];

  const engineeringSections = [
    {
      title: 'Technical Decisions',
      items: (meeting.summary?.decisions || []).map((d, idx) => ({
        text: d,
        timestampSeconds: Math.min(meeting.durationSeconds, 20 + idx * 35),
        speakerName: meeting.organizer.name,
      })),
    },
    {
      title: 'Dependencies & Infrastructure',
      items: (meeting.summary?.keyTakeaways || []).map((k, idx) => ({
        text: k,
        timestampSeconds: Math.min(meeting.durationSeconds, 15 + idx * 30),
        speakerName: meeting.participants[idx % meeting.participants.length]?.name,
      })),
    },
    {
      title: 'Blockers & Verification Requirements',
      items: [
        {
          text: 'Maintain strict 250ms offset tolerance and zero memory leaks during scrubbing.',
          timestampSeconds: Math.min(meeting.durationSeconds, 50),
          speakerName: meeting.organizer.name,
        },
      ],
    },
    {
      title: 'Owners & Delivery',
      items: (meeting.actionItems || []).map((a) => ({
        text: `${a.title} [${a.priority.toUpperCase()}] — ${a.assigneeName || 'Unassigned'}`,
        timestampSeconds: a.timestampSeconds,
        speakerName: a.assigneeName,
      })),
    },
  ];

  const interviewSections = [
    {
      title: 'Candidate Background & Role Fit',
      items: [
        {
          text: meeting.previewSummary,
          timestampSeconds: 0,
          speakerName: meeting.organizer.name,
        },
      ],
    },
    {
      title: 'Strengths & Technical Highlights',
      items: (meeting.summary?.keyTakeaways || []).map((k, idx) => ({
        text: k,
        timestampSeconds: Math.min(meeting.durationSeconds, 20 + idx * 30),
        speakerName: meeting.participants[idx % meeting.participants.length]?.name,
      })),
    },
    {
      title: 'Open Questions & Evaluation',
      items: [
        {
          text: 'Deep dive into concurrent state synchronization and optimistic updates.',
          timestampSeconds: Math.min(meeting.durationSeconds, 45),
          speakerName: meeting.organizer.name,
        },
      ],
    },
    {
      title: 'Next Steps & Hiring Decision',
      items: (meeting.actionItems || []).map((a) => ({
        text: a.title,
        timestampSeconds: a.timestampSeconds,
        speakerName: a.assigneeName,
      })),
    },
  ];

  return {
    general: custom.general || {
      templateId: 'general',
      label: 'General',
      description: 'Standard meeting synthesis with key takeaways and next steps',
      sections: generalSections,
    },
    executive: custom.executive || {
      templateId: 'executive',
      label: 'Executive Brief',
      description: 'High-level executive takeaways, strategic decisions, and deliverables',
      sections: executiveSections,
    },
    sales: custom.sales || {
      templateId: 'sales',
      label: 'Sales Call',
      description: 'Customer needs, objections, buying signals, and commitments',
      sections: salesSections,
    },
    product: custom.product || {
      templateId: 'product',
      label: 'Product Meeting',
      description: 'Problem statements, proposed solutions, decisions, and open questions',
      sections: productSections,
    },
    engineering: custom.engineering || {
      templateId: 'engineering',
      label: 'Engineering Sync',
      description: 'Technical architecture, dependencies, blockers, and performance requirements',
      sections: engineeringSections,
    },
    interview: custom.interview || {
      templateId: 'interview',
      label: 'Interview',
      description: 'Candidate background, technical evaluation, strengths, and recommendations',
      sections: interviewSections,
    },
  };
}
