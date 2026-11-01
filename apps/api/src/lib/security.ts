import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Response } from 'express';
import { config } from '../config';

const SALT_ROUNDS = 12;

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessTokenExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    return jwt.verify(token, config.jwt.accessSecret) as AccessTokenPayload;
  } catch {
    return null;
  }
}

export function generateOpaqueToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(40).toString('hex');
  const hash = hashToken(token);
  return { token, hash };
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export const COOKIE_ACCESS_TOKEN = 'meetflow_access_token';
export const COOKIE_REFRESH_TOKEN = 'meetflow_refresh_token';

export function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
): void {
  const isProd = config.isProduction;

  // Access Token: 15 minutes, accessible on all API routes
  res.cookie(COOKIE_ACCESS_TOKEN, accessToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: config.cookies.sameSite,
    path: '/',
    maxAge: 15 * 60 * 1000, // 15 mins
  });

  // Refresh Token: 7 days, narrowly scoped to auth endpoint where practical
  res.cookie(COOKIE_REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: isProd,
    sameSite: config.cookies.sameSite,
    path: '/',
    maxAge: config.jwt.refreshTokenExpiresDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(COOKIE_ACCESS_TOKEN, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.cookies.sameSite,
    path: '/',
  });
  res.clearCookie(COOKIE_REFRESH_TOKEN, {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.cookies.sameSite,
    path: '/',
  });
}
