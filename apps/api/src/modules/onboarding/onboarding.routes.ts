import { Router } from 'express';
import { onboardingController } from './onboarding.controller';
import { requireAuth } from '../../middleware/auth';

export const onboardingRouter = Router();

onboardingRouter.use(requireAuth);

onboardingRouter.get('/', (req, res, next) => onboardingController.getStatus(req, res, next));
onboardingRouter.patch('/', (req, res, next) => onboardingController.updateProgress(req, res, next));
onboardingRouter.post('/workspace', (req, res, next) => onboardingController.saveWorkspace(req, res, next));
onboardingRouter.post('/complete', (req, res, next) => onboardingController.complete(req, res, next));
