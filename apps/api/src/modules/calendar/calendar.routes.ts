import { Router } from 'express';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { CodeChallengeMethod } from 'google-auth-library';
import { z } from 'zod';
import { config } from '../../config';
import { prisma } from '../../lib/prisma';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspace';
import { calendarClient, calendarConfigured, calendarRedirect, encryptToken, syncCalendar, disconnectCalendar } from './calendar.service';

export const calendarRouter = Router();
const cookieName = 'meetflow_calendar_oauth';
const cookieOptions = { httpOnly: true, secure: config.isProduction, sameSite: 'lax' as const, path: '/api/v1/integrations/calendar', maxAge: 600_000 };
const frontend = () => new URL('/settings', process.env.FRONTEND_URL || config.corsOrigin[0]);
const State = z.object({ state: z.string(), verifier: z.string(), userId: z.string(), workspaceId: z.string() });
calendarRouter.get('/callback', async (req, res) => {
  try {
    const query = z.object({ code: z.string().max(4096).optional(), state: z.string().max(512).optional(), error: z.string().optional() }).parse(req.query);
    const cookie = z.string().parse(req.cookies?.[cookieName]);
    const state = State.parse(jwt.verify(cookie, config.jwt.accessSecret, { audience: 'calendar-oauth' }));
    res.clearCookie(cookieName, { ...cookieOptions, maxAge: undefined });
    if (!query.state || query.state.length !== state.state.length || !timingSafeEqual(Buffer.from(query.state), Buffer.from(state.state))) throw new Error('Invalid OAuth state.');
    if (!await prisma.workspaceMember.findUnique({ where: { userId_workspaceId: { userId: state.userId, workspaceId: state.workspaceId } } })) throw new Error('Workspace access has changed.');
    const destination = frontend();
    if (query.error || !query.code) { destination.searchParams.set('calendar', 'denied'); res.redirect(destination.href); return; }
    const { tokens } = await calendarClient().getToken({ code: query.code, codeVerifier: state.verifier, redirect_uri: calendarRedirect() });
    if (!tokens.refresh_token) throw new Error('Google did not provide offline access. Reconnect and approve consent.');
    await prisma.calendarConnection.upsert({ where: { userId_workspaceId_provider: { userId: state.userId, workspaceId: state.workspaceId, provider: 'google' } },
      create: { userId: state.userId, workspaceId: state.workspaceId, provider: 'google', encryptedRefreshToken: encryptToken(tokens.refresh_token), encryptedAccessToken: tokens.access_token ? encryptToken(tokens.access_token) : null, expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null },
      update: { encryptedRefreshToken: encryptToken(tokens.refresh_token), encryptedAccessToken: tokens.access_token ? encryptToken(tokens.access_token) : null, expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null, syncError: null, syncToken: null, lastSyncedAt: null },
    });
    destination.searchParams.set('calendar', 'connected'); res.redirect(destination.href);
  } catch { const destination = frontend(); destination.searchParams.set('calendar', 'error'); res.redirect(destination.href); }
});
calendarRouter.use(requireAuth, requireWorkspace);
calendarRouter.get('/', async (req, res, next) => {
  try {
    const connection = await prisma.calendarConnection.findUnique({ where: { userId_workspaceId_provider: { userId: req.user!.userId, workspaceId: req.workspaceId!, provider: 'google' } }, select: { lastSyncedAt: true, syncError: true } });
    res.json({ success: true, data: { configured: calendarConfigured(), connected: Boolean(connection), lastSyncedAt: connection?.lastSyncedAt, syncing: connection?.syncError?.startsWith('SYNCING:') ?? false, error: connection?.syncError?.startsWith('SYNCING:') ? null : connection?.syncError } });
  } catch (error) { next(error); }
});
calendarRouter.post('/authorize', async (req, res, next) => {
  try {
    z.object({}).strict().parse(req.body);
    const client = calendarClient(); const verifier = await client.generateCodeVerifierAsync();
    const state = randomBytes(32).toString('hex');
    res.cookie(cookieName, jwt.sign({ state, verifier: verifier.codeVerifier, userId: req.user!.userId, workspaceId: req.workspaceId! }, config.jwt.accessSecret, { expiresIn: '10m', audience: 'calendar-oauth' }), cookieOptions);
    res.json({ success: true, data: { url: client.generateAuthUrl({ access_type: 'offline', prompt: 'consent', scope: ['https://www.googleapis.com/auth/calendar.readonly'], state, code_challenge: verifier.codeChallenge, code_challenge_method: CodeChallengeMethod.S256 }) } });
  } catch (error) { next(error); }
});
for (const action of ['sync', 'disconnect'] as const) calendarRouter.post(`/${action}`, async (req, res, next) => {
  try {
    z.object({}).strict().parse(req.body);
    const connection = await prisma.calendarConnection.findUnique({ where: { userId_workspaceId_provider: { userId: req.user!.userId, workspaceId: req.workspaceId!, provider: 'google' } }, select: { id: true } });
    if (!connection) throw Object.assign(new Error('Connect Google Calendar first.'), { status: 404, code: 'CALENDAR_NOT_CONNECTED' });
    const data = action === 'sync' ? await syncCalendar(connection.id) : await disconnectCalendar(connection.id).then(() => ({ disconnected: true }));
    res.json({ success: true, data });
  } catch (error) { next(error); }
});
