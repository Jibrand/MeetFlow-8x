import './env';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  API_VERSION: z.string().default('v1'),
  JWT_ACCESS_SECRET: z
    .string()
    .default('dev-jwt-access-secret-min-32-chars-long!'),
  JWT_REFRESH_SECRET: z
    .string()
    .default('dev-jwt-refresh-secret-min-32-chars-long!'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  REDIS_URL: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

if (
  parsedEnv.data.NODE_ENV === 'production' &&
  (parsedEnv.data.JWT_ACCESS_SECRET.length < 32 ||
    /^(dev-|your-|example|change)/i.test(parsedEnv.data.JWT_ACCESS_SECRET) ||
    !process.env.CORS_ORIGIN ||
    parsedEnv.data.CORS_ORIGIN.includes('*'))
) {
  throw new Error(
    'Production requires a private JWT_ACCESS_SECRET (32+ characters) and explicit CORS_ORIGIN allowlist.',
  );
}
if (
  parsedEnv.data.COOKIE_SAME_SITE === 'none' &&
  parsedEnv.data.NODE_ENV !== 'production'
) {
  throw new Error(
    'Cross-site cookies require the production HTTPS configuration.',
  );
}
const defaultCorsOrigins =
  parsedEnv.data.NODE_ENV === 'production'
    ? []
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];
const envCorsOrigins = (parsedEnv.data.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const resolvedCorsOrigins = Array.from(
  new Set([...defaultCorsOrigins, ...envCorsOrigins]),
);

export const config = {
  env: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  corsOrigin: resolvedCorsOrigins,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  directUrl: parsedEnv.data.DIRECT_URL,
  apiVersion: parsedEnv.data.API_VERSION,
  jwt: {
    accessSecret: parsedEnv.data.JWT_ACCESS_SECRET,
    refreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,
    accessTokenExpiresIn: parsedEnv.data.ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresDays: parsedEnv.data.REFRESH_TOKEN_EXPIRES_DAYS,
  },
  cookies: {
    sameSite: parsedEnv.data.COOKIE_SAME_SITE,
    secure: parsedEnv.data.NODE_ENV === 'production',
  },
  redis: {
    url: parsedEnv.data.REDIS_URL,
  },
  openai: {
    apiKey: parsedEnv.data.OPENAI_API_KEY,
    model: parsedEnv.data.OPENAI_MODEL,
  },
  isProduction: parsedEnv.data.NODE_ENV === 'production',
  isTest: parsedEnv.data.NODE_ENV === 'test',
} as const;
