import { describe, it, expect } from 'vitest';
import { transcriptParserService } from './transcript-parser.service';

describe('TranscriptParserService', () => {
  it('parses Format A: Timestamp + Speaker correctly', () => {
    const raw = `
[00:00:05] Sarah: We should launch next Friday.
[00:00:12] Alex: I agree, the backend migration is ready.
[00:00:25] Sarah: Let's confirm testing by Wednesday.
    `.trim();

    const res = transcriptParserService.parse(raw);
    expect(res.detectedFormat).toBe('timestamp_speaker');
    expect(res.totalSegments).toBe(3);
    expect(res.speakers).toEqual(['Sarah', 'Alex']);
    expect(res.segments[0]).toEqual({
      sequence: 1,
      speakerName: 'Sarah',
      startMs: 5000,
      endMs: 12000,
      text: 'We should launch next Friday.',
    });
    expect(res.segments[1]).toEqual({
      sequence: 2,
      speakerName: 'Alex',
      startMs: 12000,
      endMs: 25000,
      text: 'I agree, the backend migration is ready.',
    });
  });

  it('parses Format B: Speaker + Timestamp correctly', () => {
    const raw = `
Sarah (00:00:05): We should launch next Friday.
Alex (00:00:12): I agree.
    `.trim();

    const res = transcriptParserService.parse(raw);
    expect(res.detectedFormat).toBe('speaker_timestamp');
    expect(res.totalSegments).toBe(2);
    expect(res.speakers).toEqual(['Sarah', 'Alex']);
    expect(res.segments[0].speakerName).toBe('Sarah');
    expect(res.segments[0].startMs).toBe(5000);
    expect(res.segments[0].text).toBe('We should launch next Friday.');
  });

  it('parses Format C: Speaker without timestamp correctly', () => {
    const raw = `
Sarah: We should launch next Friday.
Alex: I agree with that timeline.
Sarah: Great, let's schedule a kickoff.
    `.trim();

    const res = transcriptParserService.parse(raw);
    expect(res.detectedFormat).toBe('speaker_only');
    expect(res.totalSegments).toBe(3);
    expect(res.speakers).toEqual(['Sarah', 'Alex']);
    expect(res.segments[0]).toEqual({
      sequence: 1,
      speakerName: 'Sarah',
      startMs: null,
      endMs: null,
      text: 'We should launch next Friday.',
    });
  });

  it('parses Format D: SubRip (.srt) subtitles correctly', () => {
    const srt = `
1
00:00:01,000 --> 00:00:04,500
Sarah: We should launch next Friday.

2
00:00:05,000 --> 00:00:08,250
Alex: The infrastructure is validated.
    `.trim();

    const res = transcriptParserService.parse(srt, 'srt');
    expect(res.detectedFormat).toBe('srt');
    expect(res.totalSegments).toBe(2);
    expect(res.speakers).toEqual(['Sarah', 'Alex']);
    expect(res.segments[0]).toEqual({
      sequence: 1,
      speakerName: 'Sarah',
      startMs: 1000,
      endMs: 4500,
      text: 'We should launch next Friday.',
    });
    expect(res.segments[1]).toEqual({
      sequence: 2,
      speakerName: 'Alex',
      startMs: 5000,
      endMs: 8250,
      text: 'The infrastructure is validated.',
    });
  });

  it('parses Format D: WebVTT (.vtt) cues with voice tags correctly', () => {
    const vtt = `
WEBVTT

00:00:02.000 --> 00:00:05.500
<v Sarah>Welcome everyone to our sync.</v>

00:00:06.000 --> 00:00:09.000
<v Alex>Thanks Sarah, glad to be here.</v>
    `.trim();

    const res = transcriptParserService.parse(vtt, 'vtt');
    expect(res.detectedFormat).toBe('vtt');
    expect(res.totalSegments).toBe(2);
    expect(res.speakers).toEqual(['Sarah', 'Alex']);
    expect(res.segments[0].startMs).toBe(2000);
    expect(res.segments[0].endMs).toBe(5500);
    expect(res.segments[0].speakerName).toBe('Sarah');
    expect(res.segments[0].text).toBe('Welcome everyone to our sync.');
  });

  it('parses Format E: Plain text paragraphs without identifiable speakers', () => {
    const plain = `
The team discussed the upcoming Q4 goals.
We focused on customer onboarding metrics and latency improvements.
    `.trim();

    const res = transcriptParserService.parse(plain);
    expect(res.detectedFormat).toBe('plain_text');
    expect(res.speakers).toEqual([]);
    expect(res.segments.length).toBe(2);
    expect(res.segments[0].speakerName).toBeNull();
    expect(res.segments[0].startMs).toBeNull();
    expect(res.segments[0].endMs).toBeNull();
  });

  it('handles multiline turns without dropping text', () => {
    const raw = `
[00:00:01] Sarah: Let me give an update on the roadmap.
We have finished the first three milestones.
The remaining items are in review.
[00:00:15] Alex: Sounds good.
    `.trim();

    const res = transcriptParserService.parse(raw);
    expect(res.totalSegments).toBe(2);
    expect(res.segments[0].text).toBe(
      'Let me give an update on the roadmap. We have finished the first three milestones. The remaining items are in review.'
    );
  });

  it('preserves text with colons inside messages without falsely splitting', () => {
    const raw = `
Sarah: Please note: the deployment deadline is 5:00 PM EST.
Alex: Noted: we will be prepared.
    `.trim();

    const res = transcriptParserService.parse(raw);
    expect(res.totalSegments).toBe(2);
    expect(res.segments[0].speakerName).toBe('Sarah');
    expect(res.segments[0].text).toBe('Please note: the deployment deadline is 5:00 PM EST.');
  });
});
