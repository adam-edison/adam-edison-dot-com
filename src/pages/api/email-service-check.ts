import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailServiceConfigurationValidator } from '@/shared/EmailServiceConfigurationValidator';
import { EmailServiceConfigurationFactory } from '@/shared/EmailServiceConfigurationFactory';
import { RequestValidator } from '@/shared/RequestValidator';
import { ApiErrorHandler } from '@/shared/ApiErrorHandler';
import { ServiceUnavailableError } from '@/shared/errors';

interface HealthyResponse {
  status: 'healthy';
}

export default function handler(req: NextApiRequest, res: NextApiResponse<HealthyResponse>) {
  const requestContext = ApiErrorHandler.createRequestContext(req);

  const methodValidation = RequestValidator.validateMethod(req, 'GET');
  if (!methodValidation.success) return ApiErrorHandler.handle(res, methodValidation.error, requestContext);

  const config = EmailServiceConfigurationFactory.fromEnv();
  const result = EmailServiceConfigurationValidator.validate(config);

  if (result.success) {
    return res.status(200).json({ status: 'healthy' });
  }

  const internalMessage = `Email service configuration validation failed: ${result.error.message}`;
  const clientMessage = 'Email service is not properly configured';
  const serviceError = new ServiceUnavailableError(clientMessage, { internalMessage });
  return ApiErrorHandler.handle(res, serviceError, requestContext);
}
