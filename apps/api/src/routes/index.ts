import { Router } from 'express';
import { healthRouter } from './health';

export const apiRouter = Router();

// Root health check endpoint
apiRouter.use('/health', healthRouter);

// Versioned API namespace
const v1Router = Router();

v1Router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'MeetFlow AI API',
      version: 'v1',
      description: 'Meeting intelligence engine backend API',
    },
    meta: {
      requestId: req.id,
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
});

apiRouter.use('/v1', v1Router);
