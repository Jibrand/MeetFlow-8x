type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  message: string;
  requestId?: string;
  [key: string]: unknown;
}

function formatLog(level: LogLevel, payload: LogPayload) {
  const timestamp = new Date().toISOString();
  return JSON.stringify({
    timestamp,
    level,
    ...payload,
  });
}

export const logger = {
  info: (payload: LogPayload) => {
    console.log(formatLog('info', payload));
  },
  warn: (payload: LogPayload) => {
    console.warn(formatLog('warn', payload));
  },
  error: (payload: LogPayload) => {
    console.error(formatLog('error', payload));
  },
  debug: (payload: LogPayload) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatLog('debug', payload));
    }
  },
};
