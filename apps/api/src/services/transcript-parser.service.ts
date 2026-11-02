/**
 * Smart Transcript Parser Service
 * Version: 1.0.0
 *
 * Deterministic multi-format transcript parser supporting:
 * - Format A: Timestamp + Speaker: [00:00:05] Sarah: We should launch next Friday.
 * - Format B: Speaker + Timestamp: Sarah (00:00:05): We should launch next Friday.
 * - Format C: Speaker without timestamp: Sarah: We should launch next Friday.
 * - Format D: SubRip (.srt) and WebVTT (.vtt) cues and timestamps.
 * - Format E: Plain text paragraphs preserving sequential order.
 *
 * Rules:
 * - Deterministic parsing.
 * - Preserve original speaker names.
 * - Preserve timestamps normalized to milliseconds.
 * - Support multiline turns.
 * - Preserve conversation order.
 * - Avoid splitting text containing colons (e.g. "Note: remember this").
 * - Never fabricate speaker identities or timestamps.
 */

export interface ParsedSegment {
  sequence: number;
  speakerName: string | null;
  startMs: number | null;
  endMs: number | null;
  text: string;
}

export interface ParseResult {
  parserVersion: string;
  sourceFormat: string;
  detectedFormat: 'srt' | 'vtt' | 'timestamp_speaker' | 'speaker_timestamp' | 'speaker_only' | 'plain_text';
  speakers: string[];
  totalSegments: number;
  segments: ParsedSegment[];
}

export class TranscriptParserService {
  public static readonly VERSION = '1.0.0';

  /**
   * Parse transcript raw text according to format detection or explicit format hint.
   */
  public parse(rawText: string, formatHint?: string): ParseResult {
    const cleaned = (rawText || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
    if (!cleaned) {
      return {
        parserVersion: TranscriptParserService.VERSION,
        sourceFormat: formatHint || 'txt',
        detectedFormat: 'plain_text',
        speakers: [],
        totalSegments: 0,
        segments: [],
      };
    }

    const hint = (formatHint || '').toLowerCase();

    // 1. Check for WebVTT
    if (hint.includes('vtt') || cleaned.startsWith('WEBVTT')) {
      const segments = this.parseWebVTT(cleaned);
      return this.buildResult(segments, 'vtt', 'vtt');
    }

    // 2. Check for SubRip (SRT)
    if (hint.includes('srt') || this.isSRT(cleaned)) {
      const segments = this.parseSRT(cleaned);
      return this.buildResult(segments, 'srt', 'srt');
    }

    // 3. Line-based transcript parsing (Format A, B, C, or E)
    const lineResult = this.parseLineBasedTranscript(cleaned);
    return this.buildResult(lineResult.segments, hint || 'txt', lineResult.detectedFormat);
  }

  /**
   * Check if text conforms to SRT structure (index number followed by --> timestamp arrow)
   */
  private isSRT(text: string): boolean {
    const srtTimeRegex = /\d{1,2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{1,2}:\d{2}:\d{2}[,\.]\d{3}/;
    return srtTimeRegex.test(text);
  }

  /**
   * Parse SubRip (.srt) format
   */
  private parseSRT(text: string): ParsedSegment[] {
    const blocks = text.split(/\n\s*\n+/);
    const segments: ParsedSegment[] = [];
    let sequence = 1;

    for (const block of blocks) {
      const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length < 2) continue;

      let timeLineIdx = 0;
      // First line might be sequence number
      if (/^\d+$/.test(lines[0]) && lines.length >= 2) {
        timeLineIdx = 1;
      }

      const timeLine = lines[timeLineIdx];
      const match = timeLine.match(/(\d{1,2}:\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,\.]\d{3})/);
      if (!match) continue;

      const startMs = this.timeStringToMs(match[1]);
      const endMs = this.timeStringToMs(match[2]);

      const textLines = lines.slice(timeLineIdx + 1);
      const rawText = textLines.join(' ').replace(/<[^>]+>/g, '').trim();
      if (!rawText) continue;

      const { speaker, text: cleanText } = this.extractSpeaker(rawText);

      segments.push({
        sequence: sequence++,
        speakerName: speaker,
        startMs,
        endMs,
        text: cleanText,
      });
    }

    return segments;
  }

  /**
   * Parse WebVTT (.vtt) format
   */
  private parseWebVTT(text: string): ParsedSegment[] {
    // Strip header
    const cleanText = text.replace(/^WEBVTT[^\n]*\n+/i, '').replace(/NOTE[^\n]*\n+/gi, '');
    const blocks = cleanText.split(/\n\s*\n+/);
    const segments: ParsedSegment[] = [];
    let sequence = 1;

    for (const block of blocks) {
      const lines = block.trim().split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      let timeLineIdx = 0;
      if (!lines[0].includes('-->') && lines.length > 1 && lines[1].includes('-->')) {
        timeLineIdx = 1;
      }

      const timeLine = lines[timeLineIdx];
      if (!timeLine || !timeLine.includes('-->')) continue;

      const match = timeLine.match(/(\d{1,2}:)?(\d{2}:\d{2}[,\.]\d{3})\s*-->\s*(\d{1,2}:)?(\d{2}:\d{2}[,\.]\d{3})/);
      if (!match) continue;

      const startMs = this.timeStringToMs(timeLine.split('-->')[0].trim());
      const endMs = this.timeStringToMs(timeLine.split('-->')[1].trim().split(/\s+/)[0]);

      const textLines = lines.slice(timeLineIdx + 1);
      let content = textLines.join(' ');

      // Extract WebVTT voice tag <v Speaker Name>Text</v>
      let speaker: string | null = null;
      const vMatch = content.match(/<v\s+([^>]+)>([\s\S]*?)<\/v>/i);
      if (vMatch) {
        speaker = vMatch[1].trim();
        content = vMatch[2];
      } else {
        content = content.replace(/<[^>]+>/g, '');
        const extracted = this.extractSpeaker(content);
        speaker = extracted.speaker;
        content = extracted.text;
      }

      content = content.trim();
      if (!content) continue;

      segments.push({
        sequence: sequence++,
        speakerName: speaker,
        startMs,
        endMs,
        text: content,
      });
    }

    return segments;
  }

  /**
   * Parse line-based transcripts supporting:
   * Format A: [00:00:05] Sarah: We should launch next Friday.
   * Format B: Sarah (00:00:05): We should launch next Friday.
   * Format C: Sarah: We should launch next Friday.
   * Format E: Plain text paragraphs.
   */
  private parseLineBasedTranscript(text: string): {
    segments: ParsedSegment[];
    detectedFormat: 'timestamp_speaker' | 'speaker_timestamp' | 'speaker_only' | 'plain_text';
  } {
    const rawLines = text.split('\n');
    const segments: ParsedSegment[] = [];

    // Format A regex: ^\[(\d{1,2}:(?:\d{2}:)?\d{2}(?:\.\d{1,3})?)\]\s*([^:\n]{1,60}):\s*(.*)$
    const formatARegex = /^\[(\d{1,2}:(?:\d{2}:)?\d{2}(?:\.\d{1,3})?)\]\s*([^:\n]{1,60}):\s*(.*)$/i;

    // Format B regex: ^([^(\n]{1,60})\s*[\(\[](\d{1,2}:(?:\d{2}:)?\d{2}(?:\.\d{1,3})?)[\)\]]:?\s*(.*)$/i;
    const formatBRegex = /^([^(\[\n]{1,60})\s*[\(\[](\d{1,2}:(?:\d{2}:)?\d{2}(?:\.\d{1,3})?)[\)\]]:?\s*(.*)$/i;

    // Format C regex: ^([A-Z][a-zA-Z0-9\s\.\-]{1,50}):\s+(.*)$
    const formatCRegex = /^([A-Z][a-zA-Z0-9\s\.\-]{1,50}):\s+(.+)$/;

    let formatACount = 0;
    let formatBCount = 0;
    let formatCCount = 0;

    for (const line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (formatARegex.test(trimmed)) formatACount++;
      else if (formatBRegex.test(trimmed)) formatBCount++;
      else if (formatCRegex.test(trimmed)) formatCCount++;
    }

    let detectedFormat: 'timestamp_speaker' | 'speaker_timestamp' | 'speaker_only' | 'plain_text' = 'plain_text';
    if (formatACount > 0 && formatACount >= formatBCount && formatACount >= formatCCount) {
      detectedFormat = 'timestamp_speaker';
    } else if (formatBCount > 0 && formatBCount >= formatCCount) {
      detectedFormat = 'speaker_timestamp';
    } else if (formatCCount > 0) {
      detectedFormat = 'speaker_only';
    }

    let currentSegment: ParsedSegment | null = null;
    let sequence = 1;

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].trim();
      if (!line) continue;

      let matched = false;

      // Try Format A: [00:00:05] Sarah: Hello
      const matchA = line.match(formatARegex);
      if (matchA) {
        if (currentSegment) segments.push(currentSegment);
        const startMs = this.timeStringToMs(matchA[1]);
        currentSegment = {
          sequence: sequence++,
          speakerName: matchA[2].trim(),
          startMs,
          endMs: null,
          text: matchA[3].trim(),
        };
        matched = true;
      }

      // Try Format B: Sarah (00:00:05): Hello
      if (!matched) {
        const matchB = line.match(formatBRegex);
        if (matchB) {
          if (currentSegment) segments.push(currentSegment);
          const startMs = this.timeStringToMs(matchB[2]);
          currentSegment = {
            sequence: sequence++,
            speakerName: matchB[1].trim(),
            startMs,
            endMs: null,
            text: matchB[3].trim(),
          };
          matched = true;
        }
      }

      // Try Format C: Sarah: Hello
      if (!matched && (detectedFormat === 'speaker_only' || detectedFormat === 'plain_text')) {
        const matchC = line.match(formatCRegex);
        // Avoid matching common prose labels like "Note: ..." or "Step 1: ..." unless recognized as speaker turn
        const possibleSpeaker = matchC ? matchC[1].trim() : '';
        const isExcludedLabel = /^(Note|Summary|P\.S\.|Warning|Notice|Example|Decision|Topic|Agenda|Action Item|Q|A|Step\s*\d+)$/i.test(
          possibleSpeaker
        );

        if (matchC && !isExcludedLabel) {
          if (currentSegment) segments.push(currentSegment);
          currentSegment = {
            sequence: sequence++,
            speakerName: possibleSpeaker,
            startMs: null,
            endMs: null,
            text: matchC[2].trim(),
          };
          matched = true;
        }
      }

      // If no speaker matched:
      if (!matched) {
        if (currentSegment && detectedFormat !== 'plain_text') {
          // Multiline turn continuation
          currentSegment.text += ' ' + line;
        } else {
          // Format E: plain text paragraph
          if (currentSegment) segments.push(currentSegment);
          currentSegment = {
            sequence: sequence++,
            speakerName: null,
            startMs: null,
            endMs: null,
            text: line,
          };
        }
      }
    }

    if (currentSegment) {
      segments.push(currentSegment);
    }

    // Estimate missing endMs where consecutive timestamps exist
    for (let i = 0; i < segments.length - 1; i++) {
      if (segments[i].startMs !== null && segments[i].endMs === null) {
        const nextStart = segments[i + 1].startMs;
        if (nextStart !== null && nextStart > (segments[i].startMs as number)) {
          segments[i].endMs = nextStart;
        }
      }
    }

    return { segments, detectedFormat };
  }

  /**
   * Helper: extract "Speaker: Message" if present in cue text
   */
  private extractSpeaker(text: string): { speaker: string | null; text: string } {
    const match = text.match(/^([A-Z][a-zA-Z0-9\s\.\-]{1,50}):\s+(.+)$/);
    if (match) {
      return {
        speaker: match[1].trim(),
        text: match[2].trim(),
      };
    }
    return { speaker: null, text: text.trim() };
  }

  /**
   * Normalize timestamps to milliseconds
   * Supports:
   * 00:00:05.123 -> 5123
   * 00:00:05,123 -> 5123
   * 01:23:45 -> 5025000
   * 02:30 -> 150000
   */
  public timeStringToMs(timeStr: string): number | null {
    if (!timeStr) return null;
    const clean = timeStr.trim().replace(',', '.');
    const parts = clean.split(':');

    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const seconds = parseFloat(parts[2]);
      if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) return null;
      return Math.round((hours * 3600 + minutes * 60 + seconds) * 1000);
    } else if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10);
      const seconds = parseFloat(parts[1]);
      if (isNaN(minutes) || isNaN(seconds)) return null;
      return Math.round((minutes * 60 + seconds) * 1000);
    }
    return null;
  }

  /**
   * Consolidate results and extract distinct speakers
   */
  private buildResult(
    segments: ParsedSegment[],
    sourceFormat: string,
    detectedFormat: ParseResult['detectedFormat']
  ): ParseResult {
    const speakers = Array.from(
      new Set(segments.map((s) => s.speakerName).filter((s): s is string => Boolean(s)))
    );

    return {
      parserVersion: TranscriptParserService.VERSION,
      sourceFormat,
      detectedFormat,
      speakers,
      totalSegments: segments.length,
      segments,
    };
  }
}

export const transcriptParserService = new TranscriptParserService();
