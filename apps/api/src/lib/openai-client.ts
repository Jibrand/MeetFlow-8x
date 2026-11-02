import OpenAI from 'openai';

let client: OpenAI | undefined;
export function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw Object.assign(new Error('OPENAI_API_KEY is not configured.'), { status: 503, code: 'AI_NOT_CONFIGURED' });
  return client ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: 90_000, maxRetries: 0 });
}
