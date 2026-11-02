import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import {
  mediaDirectory,
  mediaExtensions,
  mediaPath,
  removeMedia,
} from '../../services/media.service';
import { prisma } from '../../lib/prisma';
import { CreateMeetingSchema } from './meetings.schema';
import { enqueueMeetingProcessing } from '../../queues/meeting-processing.queue';

const upload = multer({
  storage: multer.diskStorage({
    destination: mediaDirectory,
    filename: (_req, file, callback) =>
      callback(
        null,
        `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`,
      ),
  }),
  limits: {
    fileSize: 512 * 1024 * 1024,
    files: 1,
    fields: 1,
    fieldSize: 32_000,
  },
  fileFilter: (_req, file, callback) =>
    mediaExtensions.includes(path.extname(file.originalname).toLowerCase())
      ? callback(null, true)
      : callback(
          Object.assign(new Error('Unsupported recording format.'), {
            status: 400,
            code: 'INVALID_MEDIA_FORMAT',
          }),
        ),
}).single('file');
export const mediaRouter = Router();
// Mounted only behind meetingsRouter's authentication and workspace middleware.
mediaRouter.post(
  '/media',
  rateLimit({
    windowMs: 60_000,
    limit: 5,
    keyGenerator: (req) => req.user!.userId,
  }),
  (req, res, next) => {
    upload(req, res, (uploadError: unknown) => {
      void (async () => {
        let saved = false;
        try {
          if (uploadError)
            throw Object.assign(
              new Error(
                uploadError instanceof Error
                  ? uploadError.message
                  : 'Upload failed.',
              ),
              {
                status:
                  uploadError instanceof multer.MulterError &&
                  uploadError.code === 'LIMIT_FILE_SIZE'
                    ? 413
                    : 400,
                code: 'MEDIA_UPLOAD_FAILED',
              },
            );
          if (!req.file)
            throw Object.assign(
              new Error('Choose an audio or video recording.'),
              { status: 400 },
            );
          const fields = z.object({ metadata: z.string() }).parse(req.body);
          let metadata: unknown;
          try {
            metadata = JSON.parse(fields.metadata);
          } catch {
            throw Object.assign(new Error('Invalid meeting metadata.'), {
              status: 400,
            });
          }
          const input = CreateMeetingSchema.omit({ transcript: true }).parse(
            metadata,
          );
          const id = randomUUID();
          const video = req.file.mimetype.startsWith('video/');
          const created = await prisma.meeting.create({
            data: {
              id,
              workspaceId: req.workspaceId!,
              createdById: req.user!.userId,
              title: input.title,
              description: input.description,
              startAt: new Date(input.startAt),
              endAt: input.endAt ? new Date(input.endAt) : null,
              timezone: input.timezone,
              meetingStatus: 'COMPLETED',
              processingStatus: 'QUEUED',
              sourceType: video ? 'VIDEO_UPLOAD' : 'AUDIO_UPLOAD',
              mediaStorageKey: req.file.filename,
              mediaFilename: req.file.originalname,
              mediaMimeType: req.file.mimetype,
              recordingUrl: `/api/v1/meetings/${id}/media`,
              participants: {
                create: input.participants.map((participant) => ({
                  name: participant.name,
                  email: participant.email,
                  role: participant.role,
                })),
              },
            },
            include: { participants: true },
          });
          saved = true;
          const queue = await enqueueMeetingProcessing({
            meetingId: id,
            workspaceId: req.workspaceId!,
          });
          const { mediaStorageKey: _key, ...meeting } = created;
          res
            .status(201)
            .json({
              success: true,
              data: {
                ...meeting,
                processingStatus:
                  queue.status === 'REDIS_UNAVAILABLE' ? 'FAILED' : 'QUEUED',
                queueStatus: queue.status,
              },
            });
        } catch (error) {
          if (!saved && req.file)
            await removeMedia(req.file.filename).catch(() => {});
          next(error);
        }
      })();
    });
  },
);
mediaRouter.get('/:id/media', async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id);
    const meeting = await prisma.meeting.findFirst({
      where: { id, workspaceId: req.workspaceId! },
      select: { mediaStorageKey: true, mediaMimeType: true },
    });
    if (!meeting?.mediaStorageKey)
      throw Object.assign(new Error('Recording not found.'), { status: 404 });
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
    res.type(meeting.mediaMimeType || 'application/octet-stream');
    res.sendFile(mediaPath(meeting.mediaStorageKey), (error) => {
      if (error) next(error);
    });
  } catch (error) {
    next(error);
  }
});
