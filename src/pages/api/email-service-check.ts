import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailServiceConfigurationValidator } from '@/shared/EmailServiceConfigurationValidator';
import { EmailServiceConfigurationFactory } from '@/shared/EmailServiceConfigurationFactory';
import { RequestValidator } from '@/shared/RequestValidator';
import { ApiErrorHandler } from '@/shared/ApiErrorHandler';
import { RequestContext } from '@/shared/RequestContext';
import { ResponseTimeProtector } from '@/shared/ResponseTimeProtector';
import { ServiceUnavailableError } from '@/shared/errors';

interface HealthyResponse {
  status: 'healthy';
}

export default function handler(req: NextApiRequest, res: NextApiResponse<HealthyResponse>) {
  const requestContext = RequestContext.from(req);

  const methodValidation = RequestValidator.validateMethod(req, 'GET');
  if (!methodValidation.success)
    return ApiErrorHandler.handle(res, {
      error: methodValidation.error,
      timeProtector: new ResponseTimeProtector(),
      context: requestContext
    });

  const config = EmailServiceConfigurationFactory.fromEnv();
  const result = EmailServiceConfigurationValidator.validate(config);

  if (result.success) {
    return res.status(200).json({ status: 'healthy' });
  }

  const internalMessage = `Email service configuration validation failed: ${result.error.message}`;
  const clientMessage = 'Email service is not properly configured';
  const serviceError = new ServiceUnavailableError(clientMessage, { internalMessage });
  return ApiErrorHandler.handle(res, {
    error: serviceError,
    timeProtector: new ResponseTimeProtector(),
    context: requestContext
  });
}
