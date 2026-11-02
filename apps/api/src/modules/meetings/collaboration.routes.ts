import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { processingTransaction } from '../../services/processing-transaction';
import {
  requestSummaryVariant,
  readSummaryVariant,
  SummaryType,
} from '../../services/summary-variants';

const missing = () =>
  Object.assign(new Error('Meeting not found.'), { status: 404 });
const HighlightInput = z
  .object({
    label: z.string().trim().min(1).max(255),
    quote: z.string().max(30000).default(''),
    tag: z.string().trim().min(1).max(100).default('Important'),
    startTime: z.number().finite().min(0).max(10_000_000).nullable().optional(),
  })
  .strict();
const Permissions = z
  .object({
    allowSummary: z.boolean(),
    allowHighlights: z.boolean(),
    allowActions: z.boolean(),
    allowTranscript: z.boolean(),
  })
  .strict();
const mapHighlight = (h: {
  id: string;
  meetingId: string;
  note: string | null;
  quote: string;
  tags: string[];
  startTime: number | null;
}) => ({
  id: h.id,
  meetingId: h.meetingId,
  label: h.note || 'Highlight',
  quote: h.quote,
  tag: h.tags[0] || 'Important',
  startTime: h.startTime ?? 0,
  hasTimestamp: h.startTime !== null,
});
export const collaborationRouter = Router();
collaborationRouter.use('/:id/sharing', (_req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  next();
});
collaborationRouter.use('/:id/highlights', async (req, _res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    if (
      !(await prisma.meeting.findFirst({
        where: { id, workspaceId: req.workspaceId! },
        select: { id: true },
      }))
    )
      throw missing();
    next();
  } catch (error) {
    next(error);
  }
});
collaborationRouter.get('/:id/highlights', async (req, res, next) => {
  try {
    const highlights = await prisma.highlight.findMany({
      where: { meetingId: req.params.id, deletedAt: null },
      orderBy: [{ startTime: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ success: true, data: highlights.map(mapHighlight) });
  } catch (error) {
    next(error);
  }
});
collaborationRouter.post('/:id/highlights', async (req, res, next) => {
  try {
    const input = HighlightInput.parse(req.body);
    const item = await prisma.highlight.create({
      data: {
        meetingId: req.params.id,
        note: input.label,
        quote: input.quote,
        tags: [input.tag],
        startTime: input.startTime,
      },
    });
    res.status(201).json({ success: true, data: mapHighlight(item) });
  } catch (error) {
    next(error);
  }
});
collaborationRouter.patch(
  '/:id/highlights/:highlightId',
  async (req, res, next) => {
    try {
      const highlightId = z.string().uuid().parse(req.params.highlightId);
      const input = HighlightInput.partial().parse(req.body);
      const result = await prisma.highlight.updateMany({
        where: { id: highlightId, meetingId: req.params.id, deletedAt: null },
        data: {
          ...(input.label !== undefined ? { note: input.label } : {}),
          ...(input.quote !== undefined ? { quote: input.quote } : {}),
          ...(input.tag !== undefined ? { tags: [input.tag] } : {}),
          ...(input.startTime !== undefined
            ? { startTime: input.startTime }
            : {}),
        },
      });
      if (!result.count) throw missing();
      const item = await prisma.highlight.findUniqueOrThrow({
        where: { id: highlightId },
      });
      res.json({ success: true, data: mapHighlight(item) });
    } catch (error) {
      next(error);
    }
  },
);
collaborationRouter.delete(
  '/:id/highlights/:highlightId',
  async (req, res, next) => {
    try {
      const id = z.string().uuid().parse(req.params.highlightId);
      await prisma.highlight.updateMany({
        where: { id, meetingId: req.params.id },
        data: { deletedAt: new Date() },
      });
      res.json({ success: true, data: { deleted: true } });
    } catch (error) {
      next(error);
    }
  },
);

collaborationRouter.get('/:id/sharing', async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    if (
      !(await prisma.meeting.findFirst({
        where: { id, workspaceId: req.workspaceId! },
        select: { id: true },
      }))
    )
      throw missing();
    const link = await prisma.shareLink.findFirst({
      where: { meetingId: id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({
      success: true,
      data: link
        ? {
            token: link.token,
            enabled: link.isPublic,
            permissions: {
              allowSummary: link.allowSummary,
              allowHighlights: link.allowHighlights,
              allowActions: link.allowActions,
              allowTranscript: link.allowTranscript,
            },
          }
        : null,
    });
  } catch (error) {
    next(error);
  }
});
collaborationRouter.post('/:id/sharing', async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const input = z
      .object({
        action: z.enum(['enable', 'disable', 'regenerate', 'revoke', 'update']),
        permissions: Permissions.optional(),
      })
      .strict()
      .parse(req.body);
    const result = await processingTransaction(async (tx) => {
      const lock = await tx.meeting.updateMany({
        where: { id, workspaceId: req.workspaceId! },
        data: { updatedAt: new Date() },
      });
      if (!lock.count) throw missing();
      let link = await tx.shareLink.findFirst({
        where: { meetingId: id },
        orderBy: { createdAt: 'desc' },
      });
      if (input.action === 'revoke' || input.action === 'regenerate') {
        await tx.shareLink.deleteMany({ where: { meetingId: id } });
        link = null;
      }
      if (input.action === 'revoke') return null;
      if (!link && ['enable', 'regenerate'].includes(input.action))
        link = await tx.shareLink.create({
          data: {
            meetingId: id,
            token: randomBytes(32).toString('base64url'),
            ...input.permissions,
          },
        });
      else if (link)
        link = await tx.shareLink.update({
          where: { id: link.id },
          data: {
            ...(input.action === 'enable'
              ? { isPublic: true, expiresAt: null }
              : input.action === 'disable'
                ? { isPublic: false }
                : {}),
            ...input.permissions,
          },
        });
      return link
        ? {
            token: link.token,
            enabled: link.isPublic,
            permissions: {
              allowSummary: link.allowSummary,
              allowHighlights: link.allowHighlights,
              allowActions: link.allowActions,
              allowTranscript: link.allowTranscript,
            },
          }
        : null;
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
for (const method of ['get', 'post'] as const)
  collaborationRouter[method](
    '/:id/summaries/:type',
    async (req, res, next) => {
      try {
        const id = z.string().uuid().parse(req.params.id);
        const type = SummaryType.parse(req.params.type);
        if (
          !(await prisma.meeting.findFirst({
            where: { id, workspaceId: req.workspaceId! },
            select: { id: true },
          }))
        )
          throw missing();
        const input =
          method === 'post'
            ? z
                .object({ retry: z.boolean().default(false) })
                .strict()
                .parse(req.body)
            : { retry: false };
        const data =
          method === 'post'
            ? await requestSummaryVariant(
                id,
                req.workspaceId!,
                type,
                input.retry,
              )
            : await readSummaryVariant(id, type);
        res.json({ success: true, data });
      } catch (error) {
        next(error);
      }
    },
  );

export const publicMeetingsRouter = Router();
publicMeetingsRouter.get(
  '/:token',
  rateLimit({ windowMs: 60_000, limit: 60 }),
  async (req, res, next) => {
    try {
      const token = z
        .string()
        .regex(/^[A-Za-z0-9_-]{43}$/)
        .safeParse(req.params.token);
      if (!token.success) throw missing();
      const link = await prisma.shareLink.findUnique({
        where: { token: token.data },
      });
      if (!link?.isPublic || (link.expiresAt && link.expiresAt <= new Date()))
        throw missing();
      // Explicit allowlist: no workspace, emails, file URLs, private IDs or storage keys.
      const meeting = await prisma.meeting.findUniqueOrThrow({
        where: { id: link.meetingId },
        select: {
          title: true,
          startAt: true,
          ...(link.allowSummary
            ? {
                summary: {
                  select: { overview: true, keyPoints: true, decisions: true },
                },
              }
            : {}),
          ...(link.allowHighlights
            ? {
                highlights: {
                  where: { deletedAt: null },
                  select: {
                    note: true,
                    quote: true,
                    startTime: true,
                    tags: true,
                  },
                  orderBy: { createdAt: 'asc' },
                },
              }
            : {}),
          ...(link.allowActions
            ? {
                actionItems: {
                  select: {
                    title: true,
                    description: true,
                    status: true,
                    assigneeName: true,
                    dueDate: true,
                  },
                },
              }
            : {}),
          ...(link.allowTranscript
            ? {
                segments: {
                  select: { text: true, startMs: true, speakerName: true },
                  orderBy: { sequence: 'asc' },
                },
              }
            : {}),
        },
      });
      res.set({
        'Cache-Control': 'no-store',
        'Referrer-Policy': 'no-referrer',
        'X-Robots-Tag': 'noindex, nofollow',
      });
      res.json({ success: true, data: meeting });
    } catch (error) {
      next(error);
    }
  },
);
