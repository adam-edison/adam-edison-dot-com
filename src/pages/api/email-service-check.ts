import type { NextApiRequest, NextApiResponse } from 'next';
import { EmailServiceConfigurationValidator } from '@/shared/EmailServiceConfigurationValidator';
import { EmailServiceConfigurationFactory } from '@/shared/EmailServiceConfigurationFactory';
import { TurnstileService } from '@/features/contact/TurnstileService';
import { RequestValidator } from '@/shared/RequestValidator';
import { ApiErrorHandler } from '@/shared/ApiErrorHandler';
import { RequestContext } from '@/shared/RequestContext';
import { ResponseTimeProtector } from '@/shared/ResponseTimeProtector';

interface ServiceStatusResponse {
  status: 'healthy' | 'degraded' | 'error';
  services: {
    email: {
      enabled: boolean;
      ready: boolean;
    };
    turnstile: {
      enabled: boolean;
      ready: boolean;
      siteKey?: string;
    };
  };
}

export default function handler(req: NextApiRequest, res: NextApiResponse<ServiceStatusResponse>) {
  const requestContext = RequestContext.from(req);

  const methodValidation = RequestValidator.validateMethod(req, 'GET');
  if (!methodValidation.success)
    return ApiErrorHandler.handle(res, {
      error: methodValidation.error,
      timeProtector: new ResponseTimeProtector(),
      context: requestContext
    });

  // Check Email Service
  const emailConfig = EmailServiceConfigurationFactory.fromEnv();
  const emailResult = EmailServiceConfigurationValidator.validate(emailConfig);

  // Check Turnstile Service
  const turnstileEnabled = TurnstileService.isEnabled();
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  let turnstileReady = false;

  if (turnstileEnabled) {
    const turnstileServiceResult = TurnstileService.fromEnv();
    turnstileReady = turnstileServiceResult.success;
  }

  const emailReady = emailResult.success;
  const overallHealthy = emailReady && (!turnstileEnabled || turnstileReady);

  const response: ServiceStatusResponse = {
    status: overallHealthy ? 'healthy' : 'degraded',
    services: {
      email: {
        enabled: true, // Email is always required
        ready: emailReady
      },
      turnstile: {
        enabled: turnstileEnabled,
        ready: turnstileReady,
        ...(turnstileEnabled && turnstileSiteKey ? { siteKey: turnstileSiteKey } : {})
      }
    }
  };

  return res.status(200).json(response);
}
