import type { NextApiRequest, NextApiResponse } from 'next';
import { logger } from '@/lib/logger';

interface ConfigCheckResponse {
  configured: boolean;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<ConfigCheckResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ configured: false });
  }

  const requiredEnvVars = [
    { name: 'RECAPTCHA_SECRET_KEY', value: process.env.RECAPTCHA_SECRET_KEY },
    { name: 'RESEND_API_KEY', value: process.env.RESEND_API_KEY },
    { name: 'FROM_EMAIL', value: process.env.FROM_EMAIL },
    { name: 'TO_EMAIL', value: process.env.TO_EMAIL }
  ];

  const missing = requiredEnvVars.filter((env) => !env.value).map((env) => env.name);

  if (missing.length > 0) {
    // Log missing configuration server-side only
    logger.error('Contact form configuration incomplete. Missing environment variables:', missing);

    return res.status(200).json({
      configured: false
    });
  }

  return res.status(200).json({
    configured: true
  });
}
