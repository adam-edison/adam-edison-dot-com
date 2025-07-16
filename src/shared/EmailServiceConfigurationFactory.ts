import { EmailConfiguration } from '@/features/contact/EmailService';

export class EmailServiceConfigurationFactory {
  static fromEnv(env: NodeJS.ProcessEnv = process.env): EmailConfiguration {
    return {
      apiKey: env.RESEND_API_KEY || '',
      fromEmail: env.FROM_EMAIL || '',
      toEmail: env.TO_EMAIL || '',
      sendEmailEnabled: env.SEND_EMAIL_ENABLED === 'true',
      senderName: env.EMAIL_SENDER_NAME || '',
      recipientName: env.EMAIL_RECIPIENT_NAME || ''
    };
  }
}
