import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

function resolveEnvPath(): string | null {
  // 1. Check process.cwd() and parent directories
  let cwd = process.cwd();
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(cwd, '.env');
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
    const parent = path.dirname(cwd);
    if (parent === cwd) break;
    cwd = parent;
  }

  // 2. Check from current module directory and parent directories (works in src/ and dist/)
  try {
    const currentFile = fileURLToPath(import.meta.url);
    let dir = path.dirname(currentFile);
    for (let i = 0; i < 6; i++) {
      const candidate = path.join(dir, '.env');
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
        return candidate;
      }
      const parent = path.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
    // fallback if import.meta.url unavailable
  }

  return null;
}

export const resolvedEnvPath = resolveEnvPath();

if (resolvedEnvPath) {
  dotenv.config({ path: resolvedEnvPath });
} else {
  dotenv.config();
}

// Startup validation: Identify missing variables without exposing any secret values
const REQUIRED_VARS = ['DATABASE_URL'];
const missing = REQUIRED_VARS.filter((name) => !process.env[name] || process.env[name]?.trim() === '');

if (process.env.NODE_ENV !== 'test' && missing.length > 0) {
  console.error(`[FATAL] Startup validation failed: Missing required environment variable(s): ${missing.join(', ')}`);
  console.error(`[FATAL] Attempted .env location: ${resolvedEnvPath || 'None found'}`);
  console.error('[FATAL] Please ensure your root .env file contains these configuration variables.');
}
