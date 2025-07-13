import type { NextApiRequest, NextApiResponse } from 'next';
import { ConfigChecker } from '@/shared/ConfigChecker';

interface ConfigCheckResponse {
  configured: boolean;
}

interface ErrorResponse {
  error: string;
}

export default function handler(req: NextApiRequest, res: NextApiResponse<ConfigCheckResponse | ErrorResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const result = ConfigChecker.checkContactFormRequirements();

  return res.status(200).json({
    configured: result.configured
  });
}
