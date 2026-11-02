import { mkdirSync } from 'node:fs';
import { createReadStream } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpeg from 'ffmpeg-static';
import { resolvedEnvPath } from '../env';
import { getOpenAI } from '../lib/openai-client';
const execute = promisify(execFile);
export const mediaDirectory = path.resolve(process.env.MEDIA_STORAGE_DIR || path.join(path.dirname(resolvedEnvPath || path.resolve('.env')), '.local-media'));
mkdirSync(mediaDirectory, { recursive: true });
export const mediaExtensions = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm', '.ogg', '.flac'];
export function mediaPath(key: string): string {
  if (!/^[\da-f-]{36}\.(mp3|mp4|mpeg|mpga|m4a|wav|webm|ogg|flac)$/i.test(key)) throw new Error('Invalid media storage key.');
  return path.join(mediaDirectory, key);
}
export async function removeMedia(key: string): Promise<void> { await rm(mediaPath(key), { force: true }); }
const stamp = (seconds: number) => {
  const ms = Math.max(0, Math.round(seconds * 1000));
  return `${String(Math.floor(ms / 3600000)).padStart(2, '0')}:${String(Math.floor(ms / 60000) % 60).padStart(2, '0')}:${String(Math.floor(ms / 1000) % 60).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`;
};

export async function transcribeMedia(key: string, onProgress: (done: number, total: number) => Promise<void>): Promise<{ rawText: string; durationSeconds: number }> {
  const executable = process.env.FFMPEG_PATH || ffmpeg;
  if (!executable) throw new Error('MEDIA_DECODER_UNAVAILABLE: Install FFmpeg or configure FFMPEG_PATH.');
  const work = await mkdtemp(path.join(mediaDirectory, 'transcribe-'));
  try {
    const format = ({ '.mp4': 'mov', '.m4a': 'mov', '.webm': 'matroska', '.mpga': 'mp3' } as Record<string, string>)[path.extname(key)] || path.extname(key).slice(1);
    try {
      await execute(executable, ['-nostdin', '-v', 'error', '-protocol_whitelist', 'file,pipe', '-f', format, '-i', mediaPath(key), '-map', '0:a:0', '-vn', '-ac', '1', '-ar', '16000', '-c:a', 'libmp3lame', '-b:a', '64k', '-f', 'segment', '-segment_time', '900', '-segment_list', path.join(work, 'chunks.csv'), '-segment_list_type', 'csv', '-reset_timestamps', '1', path.join(work, 'chunk-%05d.mp3')], { timeout: 600_000, maxBuffer: 1024 * 1024, windowsHide: true });
    } catch { throw new Error('MEDIA_DECODE_FAILED: Recording is invalid, has no audio track, or FFmpeg is unavailable.'); }
    const chunks = (await readFile(path.join(work, 'chunks.csv'), 'utf8')).trim().split(/\r?\n/).filter(Boolean).map((line) => {
      const [filename, start, end] = line.split(',');
      return { filename: path.basename(filename.replaceAll('"', '')), start: Number(start), end: Number(end) };
    });
    if (!chunks.length) throw new Error('MEDIA_DECODE_FAILED: No audio chunks were produced.');
    const cues: string[] = [];
    for (const [index, chunk] of chunks.entries()) {
      const result = await getOpenAI().audio.transcriptions.create({ file: createReadStream(path.join(work, chunk.filename)), model: process.env.OPENAI_TRANSCRIPTION_MODEL || 'gpt-transcribe' });
      if (result.text.trim()) cues.push(`${stamp(chunk.start)} --> ${stamp(chunk.end)}\n${result.text.trim()}`);
      await onProgress(index + 1, chunks.length);
    }
    if (!cues.length) throw new Error('NO_TRANSCRIPT_AVAILABLE: No speech was detected in the recording.');
    // Chunk time ranges are actual FFmpeg boundaries. No speaker names or word alignment are invented.
    return { rawText: `WEBVTT\n\n${cues.join('\n\n')}`, durationSeconds: Math.ceil(chunks[chunks.length - 1].end) };
  } finally {
    // work was created inside mediaDirectory by mkdtemp; never remove uploaded originals here.
    const relative = path.relative(mediaDirectory, path.resolve(work));
    if (!relative.startsWith('..') && !path.isAbsolute(relative)) await rm(work, { recursive: true, force: true });
  }
}
