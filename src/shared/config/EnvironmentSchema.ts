import { z } from 'zod';

const RATE_LIMIT_WINDOW_PATTERN = /^[1-9]\d*\s*(ms|s|m|h|d)$/;

const positiveIntFromString = (min: number, max: number) => z.coerce.number().int().min(min).max(max);

const optionalBoolFromString = z
  .string()
  .optional()
  .transform((value) => value === 'true');

const rateLimitWindow = z.string().regex(RATE_LIMIT_WINDOW_PATTERN, 'must look like "10 s", "30 m", "1 h"');

export const ServerOnlyEnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  RESEND_API_KEY: z.string().min(1),
  FROM_EMAIL: z.string().email(),
  TO_EMAIL: z.string().email(),
  EMAIL_SENDER_NAME: z.string().min(1),
  EMAIL_RECIPIENT_NAME: z.string().min(1),
  SEND_EMAIL_ENABLED: optionalBoolFromString,

  TURNSTILE_SECRET_KEY: z.string().min(1),

  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  REDIS_PREFIX: z.string().min(1),

  RATE_LIMIT_REQUESTS: positiveIntFromString(1, 10_000),
  RATE_LIMIT_WINDOW: rateLimitWindow,
  GLOBAL_RATE_LIMIT_REQUESTS: positiveIntFromString(1, 100_000),
  GLOBAL_RATE_LIMIT_WINDOW: rateLimitWindow,

  SENTRY_DSN: z.string().url(),
  SENTRY_AUTH_TOKEN: z.string().min(1),
  SENTRY_ORG: z.string().min(1),
  SENTRY_PROJECT: z.string().min(1)
});

export const ClientEnvironmentSchema = z.object({
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_GITHUB_URL: z.string().url(),
  NEXT_PUBLIC_LINKEDIN_URL: z.string().url(),
  NEXT_PUBLIC_REPO_URL: z.string().url(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url()
});

export const EnvironmentSchema = ServerOnlyEnvironmentSchema.merge(ClientEnvironmentSchema);

export type ServerOnlyEnvironment = z.infer<typeof ServerOnlyEnvironmentSchema>;
export type ClientEnvironment = z.infer<typeof ClientEnvironmentSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;

export function formatZodIssues(prefix: string, issues: z.ZodIssue[]): Error {
  const problems = issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
  return new Error(`${prefix}:\n  ${problems.join('\n  ')}`);
}
