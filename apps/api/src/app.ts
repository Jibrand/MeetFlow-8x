import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { requestIdMiddleware } from './middleware/request-id';
import { notFoundHandler, errorHandler } from './middleware/error-handler';
import { apiRouter } from './routes';
import { logger } from './lib/logger';

export function createApp(): Express {
  const app = express();

  // Security headers
  app.use(helmet());

  // Cookie parser
  app.use(cookieParser());

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin || config.corsOrigin.includes(origin) || config.corsOrigin.includes('*')) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
    })
  );

  // Body parsers with sensible size limits
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Attach unique Request ID
  app.use(requestIdMiddleware);

  // Structured request logging (safe logging: no passwords, no tokens)
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info({
        message: 'HTTP Request',
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs: duration,
      });
    });
    next();
  });

  // Interactive API Documentation Route
  app.get(['/api/docs', '/api/docs/'], (_req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html>
  <head>
    <title>MeetFlow AI API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23D97706'><path d='M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z'/></svg>">
    <link href="https://fonts.googleapis.com/css?family=Inter:300,400,600,700" rel="stylesheet">
    <style>body { margin: 0; padding: 0; }</style>
  </head>
  <body>
    <redoc spec-url='/api/openapi.yaml'></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"> </script>
  </body>
</html>`);
  });

  // Serve raw OpenAPI yaml
  app.get('/api/openapi.yaml', (_req, res) => {
    import('node:fs').then(({ readFileSync, existsSync }) => {
      import('node:path').then(({ resolve }) => {
        const specPath = resolve(process.cwd(), '../../docs/api/openapi.yaml');
        const altPath = resolve(process.cwd(), 'docs/api/openapi.yaml');
        const targetPath = existsSync(specPath) ? specPath : altPath;
        if (existsSync(targetPath)) {
          res.setHeader('Content-Type', 'text/yaml');
          res.send(readFileSync(targetPath, 'utf8'));
        } else {
          res.status(404).send('OpenAPI specification file not found.');
        }
      });
    });
  });

  // API router
  app.use('/api', apiRouter);

  // Fallback 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  return app;
}
