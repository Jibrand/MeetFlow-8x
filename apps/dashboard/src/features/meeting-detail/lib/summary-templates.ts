import {
  MeetingItem,
  SummaryTemplateContent,
  SummaryTemplateId,
} from '../../../types/meeting';

const labels: Record<SummaryTemplateId, string> = {
  general: 'General',
  executive: 'Executive Brief',
  engineering: 'Engineering Sync',
  product: 'Product Meeting',
  sales: 'Sales Call',
  interview: 'Interview',
};

// Reformat real persisted facts only. No invented risks, people, deadlines, or evidence timestamps.
export function getMeetingSummaryTemplates(
  meeting: MeetingItem,
): Record<SummaryTemplateId, SummaryTemplateContent> {
  return Object.fromEntries(
    Object.entries(labels).map(([id, label]) => {
      const templateId = id as SummaryTemplateId;
      return [
        id,
        meeting.summary?.templates?.[templateId] ?? {
          templateId,
          label,
          description: 'Summary from this meeting transcript',
          sections: [
            {
              title: 'Overview',
              items: meeting.summary?.executiveSummary
                ? [{ text: meeting.summary.executiveSummary }]
                : [],
            },
            {
              title: 'Key Takeaways',
              items: (meeting.summary?.keyTakeaways ?? []).map((text) => ({
                text,
              })),
            },
            {
              title: 'Decisions',
              items: (meeting.summary?.decisions ?? []).map((text) => ({
                text,
              })),
            },
            {
              title: 'Next Steps',
              items: (meeting.actionItems ?? []).map((item) => ({
                text: item.title,
                speakerName: item.assigneeName,
                timestampSeconds: item.timestampSeconds,
              })),
            },
          ].filter((section) => section.items.length > 0),
        },
      ];
    }),
  ) as Record<SummaryTemplateId, SummaryTemplateContent>;
}
