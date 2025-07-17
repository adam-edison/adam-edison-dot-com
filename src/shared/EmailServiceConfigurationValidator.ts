import { z } from 'zod';
import { EmailConfiguration } from '@/features/contact/EmailService';
import { Result } from '@/shared/Result';
import { ValidationError } from '@/shared/errors';

const EmailConfigurationSchema = z.object({
  apiKey: z.string().min(1).describe('RESEND_API_KEY'),
  fromEmail: z.string().email().describe('FROM_EMAIL'),
  toEmail: z.string().email().describe('TO_EMAIL'),
  sendEmailEnabled: z.boolean().describe('SEND_EMAIL_ENABLED'),
  senderName: z.string().min(1).describe('EMAIL_SENDER_NAME'),
  recipientName: z.string().min(1).describe('EMAIL_RECIPIENT_NAME')
});

export class EmailServiceConfigurationValidator {
  static validate(config: EmailConfiguration): Result<void, ValidationError> {
    const result = EmailConfigurationSchema.safeParse(config);
    if (result.success) return Result.success();

    const problems = result.error.errors.map((err) => {
      const fieldName = err.path[0] as keyof typeof EmailConfigurationSchema.shape;
      const envVar = EmailConfigurationSchema.shape[fieldName]?.description || fieldName;
      return `${envVar}: ${err.message}`;
    });

    const errorMessage = `Email service configuration validation failed: ${problems.join(', ')}`;

    const validationError = new ValidationError(errorMessage, {
      internalMessage: errorMessage,
      details: result.error.errors
    });

    return Result.failure(validationError);
  }
}
