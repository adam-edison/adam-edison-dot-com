export function shouldInitSentry(dsn: string | undefined): dsn is string {
  if (process.env.NEXT_PUBLIC_SENTRY_DISABLED === 'true') return false;
  if (!dsn) return false;
  return true;
}
