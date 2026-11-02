type LogLevel = 'info' | 'warn' | 'error' | 'debug';
interface LogPayload {
  message: string;
  [key: string]: unknown;
}

export function redactDiagnostics(text: string): string {
  let safe = text
    .replace(
      /\b(?:redis|rediss|postgres|postgresql):\/\/\S+/gi,
      '[REDACTED: connection URL]',
    )
    .replace(/\bsk-[\w-]+/g, '[REDACTED: API key]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]');
  for (const [key, value] of Object.entries(process.env)) {
    if (
      /SECRET|PASSWORD|TOKEN|API_KEY|DATABASE_URL|DIRECT_URL|REDIS_URL/.test(
        key,
      ) &&
      value &&
      value.length >= 8
    ) {
      safe = safe.split(value).join('[REDACTED: credential]');
    }
  }
  return safe;
}

function log(
  level: LogLevel,
  input: string | LogPayload,
  context: Record<string, unknown> = {},
): void {
  if (level === 'debug' && process.env.DEBUG_LOGS !== '1') return;
  const payload: LogPayload =
    typeof input === 'string' ? { message: input, ...context } : input;
  const output =
    level === 'error'
      ? console.error
      : level === 'warn'
        ? console.warn
        : level === 'debug'
          ? console.debug
          : console.log;
  if (process.env.NODE_ENV === 'production') {
    output(
      redactDiagnostics(
        JSON.stringify({
          level,
          ...payload,
          ...(payload.error instanceof Error
            ? { error: payload.error.message, stack: payload.error.stack }
            : {}),
        }),
      ),
    );
    return;
  }
  const details = Object.entries(payload)
    .filter(
      ([key, value]) =>
        !['message', 'stack', 'requestId'].includes(key) &&
        value != null &&
        typeof value !== 'object',
    )
    .map(([key, value]) => `${key}: ${String(value)}`);
  const error = payload.error instanceof Error ? payload.error : undefined;
  output(
    redactDiagnostics(
      `[${level === 'warn' || level === 'info' ? 'status' : level}] ${payload.message}${details.length ? ` — ${details.join(', ')}` : ''}${error ? ` — ${error.message}` : ''}`,
    ),
  );
  if (level === 'error' && (error?.stack || payload.stack))
    output(redactDiagnostics(String(error?.stack || payload.stack)));
}

export const logger = {
  info: (input: string | LogPayload, context?: Record<string, unknown>) =>
    log('info', input, context),
  warn: (input: string | LogPayload, context?: Record<string, unknown>) =>
    log('warn', input, context),
  error: (input: string | LogPayload, context?: Record<string, unknown>) =>
    log('error', input, context),
  debug: (input: string | LogPayload, context?: Record<string, unknown>) =>
    log('debug', input, context),
};
