import type { NextApiRequest, NextApiResponse } from 'next';
import { CsrfService } from '@/features/contact/CsrfService';
import { BaseError } from '@/shared/errors/BaseError';

type CsrfTokenResponse = {
  token: string;
};

type ErrorResponse = {
  error: string;
};

/**
 * API endpoint to generate a CSRF token.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<CsrfTokenResponse | ErrorResponse>) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const csrfService = new CsrfService();
    const token = await csrfService.createToken();
    return res.status(200).json({ token });
  } catch (error) {
    const errorMessage = error instanceof BaseError ? error.message : 'An unexpected error occurred';
    return res.status(500).json({ error: errorMessage });
  }
}
