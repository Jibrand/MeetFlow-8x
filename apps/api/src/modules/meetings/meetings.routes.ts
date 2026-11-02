import { Router } from 'express';
import { meetingsController } from './meetings.controller';
import { requireAuth } from '../../middleware/auth';
import { requireWorkspace } from '../../middleware/workspace';
import { collaborationRouter } from './collaboration.routes';
import { mediaRouter } from './media.routes';

export const meetingsRouter = Router();

// All meeting endpoints require authenticated user and active workspace
meetingsRouter.use(requireAuth, requireWorkspace);
meetingsRouter.use(mediaRouter);
meetingsRouter.use(collaborationRouter);

meetingsRouter.post('/', (req, res, next) =>
  meetingsController.createMeeting(req, res, next),
);
meetingsRouter.get('/', (req, res, next) =>
  meetingsController.listMeetings(req, res, next),
);
meetingsRouter.get('/overview', (req, res, next) =>
  meetingsController.getOverviewStats(req, res, next),
);
meetingsRouter.get('/:id', (req, res, next) =>
  meetingsController.getMeeting(req, res, next),
);
meetingsRouter.patch('/:id', (req, res, next) =>
  meetingsController.updateMeeting(req, res, next),
);
meetingsRouter.delete('/:id', (req, res, next) =>
  meetingsController.deleteMeeting(req, res, next),
);

// Transcript & processing sub-resources
meetingsRouter.post('/:id/transcript', (req, res, next) =>
  meetingsController.uploadTranscript(req, res, next),
);
meetingsRouter.get('/:id/transcript', (req, res, next) =>
  meetingsController.getTranscript(req, res, next),
);
meetingsRouter.get('/:id/processing', (req, res, next) =>
  meetingsController.getProcessingStatus(req, res, next),
);
meetingsRouter.post('/:id/reprocess', (req, res, next) =>
  meetingsController.reprocessMeeting(req, res, next),
);
