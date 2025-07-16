import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailServiceConfigurationValidator } from '@/shared/EmailServiceConfigurationValidator';
import { EmailServiceConfigurationFactory } from '@/shared/EmailServiceConfigurationFactory';

interface EmailServiceCheckResponse {
  configured: boolean;
}

interface ErrorResponse {
  error: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<EmailServiceCheckResponse | ErrorResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = EmailServiceConfigurationFactory.fromEnv();
  const result = EmailServiceConfigurationValidator.validate(config);

  return res.status(200).json({
    configured: result.configured
  });
}
