import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailServiceConfigurationValidator } from '@/shared/EmailServiceConfigurationValidator';
import { EmailServiceConfigurationFactory } from '@/shared/EmailServiceConfigurationFactory';

interface HealthyResponse {
  status: 'healthy';
}

interface ErrorResponse {
  error: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<HealthyResponse | ErrorResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const config = EmailServiceConfigurationFactory.fromEnv();
  const result = EmailServiceConfigurationValidator.validate(config);

  if (result.success) {
    return res.status(200).json({ status: 'healthy' });
  }

  return res.status(503).json({ error: result.error.message });
}
