import { describe, expect, it } from 'vitest';
import { getMeetingSummaryTemplates } from './summary-templates';
import type { MeetingItem } from '../../../types/meeting';

describe('Real summary templates', () => {
  it('does not invent summary content or citations when backend data is empty', () => {
    const templates = getMeetingSummaryTemplates({
      actionItems: [],
    } as unknown as MeetingItem);
    expect(
      Object.values(templates).every(
        (template) => template.sections.length === 0,
      ),
    ).toBe(true);
  });
  it('uses saved facts without fabricated speakers or timestamps in any template', () => {
    const templates = getMeetingSummaryTemplates({
      summary: {
        executiveSummary: 'Real overview',
        keyTakeaways: ['Real takeaway'],
        decisions: ['Real decision'],
      },
    } as MeetingItem);
    for (const template of Object.values(templates)) {
      expect(template.sections.flatMap((section) => section.items)).toEqual([
        { text: 'Real overview' },
        { text: 'Real takeaway' },
        { text: 'Real decision' },
      ]);
    }
  });
});
