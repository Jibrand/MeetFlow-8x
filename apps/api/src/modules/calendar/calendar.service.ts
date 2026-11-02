import { randomBytes, randomUUID, createCipheriv, createDecipheriv } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';

export const calendarRedirect = () => process.env.GOOGLE_REDIRECT_URI || `http://localhost:${process.env.PORT || 4000}/api/v1/integrations/calendar/callback`;
function encryptionKey(): Buffer {
  const text = process.env.CALENDAR_ENCRYPTION_KEY || '';
  const key = Buffer.from(text, /^[\da-f]{64}$/i.test(text) ? 'hex' : 'base64');
  if (key.length !== 32) throw Object.assign(new Error('Calendar encryption key must contain 32 random bytes.'), { status: 503, code: 'CALENDAR_NOT_CONFIGURED' });
  return key;
}
export function calendarConfigured(): boolean {
  try { encryptionKey(); return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET); } catch { return false; }
}
export function calendarClient(): OAuth2Client {
  if (!calendarConfigured()) throw Object.assign(new Error('Configure GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and CALENDAR_ENCRYPTION_KEY on the server before connecting Google Calendar.'), { status: 503, code: 'CALENDAR_NOT_CONFIGURED' });
  return new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, calendarRedirect());
}
export function encryptToken(token: string): string {
  const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((value) => value.toString('base64url')).join('.');
}
function decryptToken(value: string): string {
  const [iv, tag, bytes] = value.split('.').map((part) => Buffer.from(part, 'base64url'));
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), iv); decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(bytes), decipher.final()]).toString('utf8');
}
const Event = z.object({
  id: z.string(), status: z.string().optional(), summary: z.string().optional(), description: z.string().optional(),
  start: z.object({ dateTime: z.string().optional(), date: z.string().optional(), timeZone: z.string().optional() }).optional(),
  end: z.object({ dateTime: z.string().optional(), date: z.string().optional() }).optional(),
  attendees: z.array(z.object({ displayName: z.string().optional(), email: z.string().optional() })).optional(),
});
const EventPage = z.object({ items: z.array(Event).default([]), nextPageToken: z.string().optional(), nextSyncToken: z.string().optional() });
function providerStatus(error: unknown): unknown {
  if (typeof error !== 'object' || error === null) return undefined;
  if ('status' in error) return error.status;
  if ('response' in error && typeof error.response === 'object' && error.response !== null && 'status' in error.response) return error.response.status;
  return undefined;
}

export async function syncCalendar(connectionId: string): Promise<{ synced: number; busy?: boolean }> {
  const connection = await prisma.calendarConnection.findUniqueOrThrow({ where: { id: connectionId } });
  if (connection.syncError?.startsWith('SYNCING:') && Date.now() - connection.updatedAt.getTime() < 600_000) return { synced: 0, busy: true };
  const lease = `SYNCING:${randomUUID()}`;
  const claimed = await prisma.calendarConnection.updateMany({ where: { id: connectionId, updatedAt: connection.updatedAt }, data: { syncError: lease } });
  if (!claimed.count) return { synced: 0, busy: true };
  try {
    const client = calendarClient();
    client.setCredentials({ refresh_token: decryptToken(connection.encryptedRefreshToken), access_token: connection.encryptedAccessToken ? decryptToken(connection.encryptedAccessToken) : undefined, expiry_date: connection.expiresAt?.getTime() });
    await client.getAccessToken();
    if (client.credentials.access_token) await prisma.calendarConnection.update({ where: { id: connectionId }, data: { encryptedAccessToken: encryptToken(client.credentials.access_token), expiresAt: client.credentials.expiry_date ? new Date(client.credentials.expiry_date) : null } });
    let syncToken = connection.syncToken ?? undefined;
    let pageToken: string | undefined;
    let synced = 0;
    const seen: string[] = [];
    const from = new Date(Date.now() - 365 * 86400_000).toISOString();
    const until = new Date(Date.now() + 365 * 86400_000).toISOString();
    let fullSync = !syncToken;
    const deadline = Date.now() + 300_000;
    do {
      if (Date.now() > deadline) throw new Error('Calendar synchronization exceeded five minutes. Retry to continue.');
      let page: z.infer<typeof EventPage>;
      try {
        const result = await client.request({ url: `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(connection.calendarId)}/events`, timeout: 30_000, params: { maxResults: 250, singleEvents: true, showDeleted: true, ...(syncToken ? { syncToken } : { timeMin: from, timeMax: until }), ...(pageToken ? { pageToken } : {}) } });
        page = EventPage.parse(result.data);
      } catch (error) {
        if (syncToken && providerStatus(error) === 410) {
          syncToken = undefined; pageToken = undefined; fullSync = true; continue;
        }
        throw error;
      }
      for (const event of page.items) {
        seen.push(event.id);
        const unique = { calendarConnectionId_externalEventId: { calendarConnectionId: connectionId, externalEventId: event.id } };
        if (event.status === 'cancelled') {
          await prisma.meeting.updateMany({ where: { calendarConnectionId: connectionId, externalEventId: event.id }, data: { meetingStatus: 'CANCELLED' } });
          continue;
        }
        const start = event.start?.dateTime || (event.start?.date ? `${event.start.date}T00:00:00Z` : undefined);
        if (!start || !Number.isFinite(Date.parse(start))) continue;
        const end = event.end?.dateTime || (event.end?.date ? `${event.end.date}T00:00:00Z` : undefined);
        const participants = (event.attendees ?? []).slice(0, 200).map((attendee) => ({ name: attendee.displayName || attendee.email || 'Attendee', email: attendee.email }));
        const metadata = { title: (event.summary || 'Untitled calendar event').slice(0, 255), description: event.description, startAt: new Date(start), endAt: end ? new Date(end) : null, timezone: event.start?.timeZone || 'UTC', meetingStatus: 'SCHEDULED' as const };
        await prisma.meeting.upsert({ where: unique, create: { ...metadata, workspaceId: connection.workspaceId, createdById: connection.userId, sourceType: 'CALENDAR', calendarConnectionId: connectionId, externalEventId: event.id, participants: { create: participants } }, update: { ...metadata, participants: { deleteMany: {}, create: participants } } });
        synced++;
      }
      pageToken = page.nextPageToken;
      if (!pageToken) {
        // After a token reset, reconcile missing events only inside the full snapshot window.
        if (fullSync) await prisma.meeting.updateMany({ where: { calendarConnectionId: connectionId, startAt: { gte: new Date(from), lte: new Date(until) }, externalEventId: { notIn: seen } }, data: { meetingStatus: 'CANCELLED' } });
        await prisma.calendarConnection.updateMany({ where: { id: connectionId, syncError: lease }, data: { syncToken: page.nextSyncToken ?? null, lastSyncedAt: new Date(), syncError: null } });
      }
    } while (pageToken);
    logger.info('Google Calendar synchronized', { synced });
    return { synced };
  } catch (error) {
    logger.error('Google Calendar synchronization failed', { statusCode: providerStatus(error), code: 'CALENDAR_SYNC_FAILED' });
    await prisma.calendarConnection.updateMany({ where: { id: connectionId, syncError: lease }, data: { syncError: 'Calendar sync failed. Reconnect if consent expired, then retry.' } });
    throw Object.assign(new Error('Calendar synchronization failed. Check configuration or reconnect Google Calendar, then retry.'), { status: 502, code: 'CALENDAR_SYNC_FAILED' });
  }
}

export async function disconnectCalendar(id: string): Promise<void> {
  const connection = await prisma.calendarConnection.findUniqueOrThrow({ where: { id } });
  try { await calendarClient().revokeToken(decryptToken(connection.encryptedRefreshToken)); } catch { logger.warn('Google token could not be revoked; removing the local connection.'); }
  await prisma.calendarConnection.delete({ where: { id } });
}

let running = false;
export async function syncConnectedCalendars(): Promise<void> {
  if (running || !calendarConfigured()) return;
  running = true;
  try {
    const connections = await prisma.calendarConnection.findMany({ where: { OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: new Date(Date.now() - 300_000) } }] }, take: 20, orderBy: { lastSyncedAt: 'asc' }, select: { id: true } });
    for (const connection of connections) await syncCalendar(connection.id).catch(() => logger.warn('Calendar sync needs attention. Reconnect or retry in Settings.'));
  } finally { running = false; }
}
