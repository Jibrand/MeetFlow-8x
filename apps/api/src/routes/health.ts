import { Router, Request, Response } from 'express';
import { HealthCheckResponse } from '@meetflow/contracts';
import { config } from '../config';

export const healthRouter = Router();

healthRouter.get('/', (req: Request, res: Response) => {
  const healthData: HealthCheckResponse = {
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: '1.0.0',
    services: {
      api: 'operational',
      database: config.databaseUrl ? 'connected' : 'not_configured',
    },
  };

  res.status(200).json({
    success: true,
    data: healthData,
    meta: {
      requestId: req.id,
      timestamp: new Date().toISOString(),
      version: 'v1',
    },
  });
});
