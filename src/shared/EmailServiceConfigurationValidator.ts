import { z } from 'zod';
import { logger } from './Logger';

const EmailServiceConfigurationSchema = z.object({
  RESEND_API_KEY: z
    .string({ required_error: 'RESEND_API_KEY is not configured' })
    .min(1, 'RESEND_API_KEY is not configured'),
  FROM_EMAIL: z.string({ required_error: 'FROM_EMAIL is not configured' }).min(1, 'FROM_EMAIL is not configured'),
  TO_EMAIL: z.string({ required_error: 'TO_EMAIL is not configured' }).min(1, 'TO_EMAIL is not configured'),
  EMAIL_SENDER_NAME: z
    .string({ required_error: 'EMAIL_SENDER_NAME is not configured' })
    .min(1, 'EMAIL_SENDER_NAME is not configured'),
  EMAIL_RECIPIENT_NAME: z
    .string({ required_error: 'EMAIL_RECIPIENT_NAME is not configured' })
    .min(1, 'EMAIL_RECIPIENT_NAME is not configured'),
  SEND_EMAIL_ENABLED: z
    .string({ required_error: 'SEND_EMAIL_ENABLED must be set to "true"' })
    .refine((val) => val === 'true', 'SEND_EMAIL_ENABLED must be set to "true"')
});

export interface EmailServiceConfigurationResult {
  configured: boolean;
  problems?: string[];
}

export class EmailServiceConfigurationValidator {
  validate(env: Record<string, string | undefined>): EmailServiceConfigurationResult {
    const result = EmailServiceConfigurationSchema.safeParse(env);

    if (!result.success) {
      const problems = result.error.errors.map((err) => err.message);
      logger.error('Email service configuration validation failed:', problems);
      return {
        configured: false,
        problems
      };
    }

    return {
      configured: true
    };
  }
}
