import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env if present
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().optional(),
  DIRECT_URL: z.string().optional(),
  API_VERSION: z.string().default('v1'),
  JWT_ACCESS_SECRET: z.string().default('dev-jwt-access-secret-min-32-chars-long!'),
  JWT_REFRESH_SECRET: z.string().default('dev-jwt-refresh-secret-min-32-chars-long!'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().default(7),
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const config = {
  env: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  corsOrigin: parsedEnv.data.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
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
  isProduction: parsedEnv.data.NODE_ENV === 'production',
  isTest: parsedEnv.data.NODE_ENV === 'test',
} as const;
