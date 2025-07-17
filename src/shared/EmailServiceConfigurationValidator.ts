import { z } from 'zod';
import { logger } from './Logger';
import { EmailConfiguration } from '@/features/contact/EmailService';

const EmailConfigurationSchema = z.object({
  apiKey: z.string().min(1).describe('RESEND_API_KEY'),
  fromEmail: z.string().email().describe('FROM_EMAIL'),
  toEmail: z.string().email().describe('TO_EMAIL'),
  sendEmailEnabled: z.boolean().describe('SEND_EMAIL_ENABLED'),
  senderName: z.string().min(1).describe('EMAIL_SENDER_NAME'),
  recipientName: z.string().min(1).describe('EMAIL_RECIPIENT_NAME')
});

export interface EmailServiceConfigurationResult {
  configured: boolean;
  problems?: string[];
}

export class EmailServiceConfigurationValidator {
  static validate(config: EmailConfiguration): EmailServiceConfigurationResult {
    const result = EmailConfigurationSchema.safeParse(config);

    if (result.success) return { configured: true };

    const problems = result.error.errors.map((err) => {
      const fieldName = err.path[0] as keyof typeof EmailConfigurationSchema.shape;
      const envVar = EmailConfigurationSchema.shape[fieldName]?.description || fieldName;
      return `${envVar}: ${err.message}`;
    });

    logger.error('Email service configuration validation failed:', problems);

    return {
      configured: false,
      problems
    };
  }
}
