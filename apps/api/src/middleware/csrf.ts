import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';
// A custom header forces a CORS preflight on browser mutations, including multipart uploads.
// Origin checks also prevent login/logout CSRF. Non-browser clients must send the same header.
export function requireTrustedMutation(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    next();
    return;
  }
  const origin = req.get('origin');
  if (
    (origin && !config.corsOrigin.includes(origin)) ||
    req.get('x-meetflow-request') !== '1'
  ) {
    next(
      Object.assign(
        new Error(
          'This request could not be verified. Reload the page and try again.',
        ),
        { status: 403, code: 'UNTRUSTED_REQUEST' },
      ),
    );
    return;
  }
  next();
}
