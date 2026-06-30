import 'dotenv/config';
import { z } from 'zod';

/**
 * Environment configuration, validated once at startup (Constitution Principle IV:
 * typed, validated boundaries). DATABASE_URL and ANTHROPIC_API_KEY are optional for now
 * so the app boots before Postgres / the AI step exist; they are tightened to required
 * in their respective implementation phases.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1).optional(),
  // AI provider (US4). Optional — unset means AI-off (deterministic fallback).
  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default('gemini-2.5-flash'),
  // Allowed browser origin for CORS (e.g. the deployed frontend URL). Unset = allow all.
  CORS_ORIGIN: z.string().min(1).optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Never print secret values — only which keys failed validation.
  console.error(
    '❌ Invalid environment variables:',
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
