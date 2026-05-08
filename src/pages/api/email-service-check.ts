import type { NextApiRequest, NextApiResponse } from 'next';
import { Configuration } from '@/shared/config/Configuration';
import { RequestValidator } from '@/shared/RequestValidator';
import { ApiErrorHandler } from '@/shared/ApiErrorHandler';
import { RequestContext } from '@/shared/RequestContext';

interface HealthyResponse {
  status: 'healthy';
}

export default function handler(req: NextApiRequest, res: NextApiResponse<HealthyResponse>) {
  const requestContext = RequestContext.from(req);

  const methodValidation = RequestValidator.validateMethod(req, 'GET');
  if (!methodValidation.success) return ApiErrorHandler.handle(res, methodValidation.error, requestContext);

  Configuration.get();
  return res.status(200).json({ status: 'healthy' });
}
