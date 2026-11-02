import { Router } from 'express';
import { healthRouter } from './health';
import { authRouter } from '../modules/auth/auth.routes';
import { usersRouter } from '../modules/users/users.routes';
import { workspacesRouter } from '../modules/workspaces/workspaces.routes';
import { onboardingRouter } from '../modules/onboarding/onboarding.routes';
import { meetingsRouter } from '../modules/meetings/meetings.routes';
import { actionItemsRouter } from '../modules/action-items/action-items.routes';
import { askRouter } from '../modules/ask/ask.routes';
import { calendarRouter } from '../modules/calendar/calendar.routes';

export const apiRouter = Router();

// Root health check endpoint
apiRouter.use('/health', healthRouter);

// Versioned API namespace (/api/v1)
const v1Router = Router();

v1Router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'MeetFlow AI API',
      version: 'v1',
      description: 'Production meeting intelligence engine backend API',
    },
    meta: {
      requestId: req.id,
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
});

v1Router.use('/auth', authRouter);
v1Router.use('/users', usersRouter);
v1Router.use('/workspaces', workspacesRouter);
v1Router.use('/onboarding', onboardingRouter);
v1Router.use('/meetings', meetingsRouter);
v1Router.use('/action-items', actionItemsRouter);
v1Router.use('/ask', askRouter);
v1Router.use('/integrations/calendar', calendarRouter);

// Primary versioned route: /api/v1/*
apiRouter.use('/v1', v1Router);

// Alias root namespaces for convenience: /api/auth/* -> v1Router
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/workspaces', workspacesRouter);
apiRouter.use('/onboarding', onboardingRouter);
apiRouter.use('/meetings', meetingsRouter);
apiRouter.use('/action-items', actionItemsRouter);
