import { Resend } from 'resend';
import { ContactFormServerData } from './ContactFormValidator';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TemplateRenderer } from '@/shared/TemplateRenderer';
import { EmailServiceConfigurationValidator } from '@/shared/EmailServiceConfigurationValidator';

export interface EmailConfiguration {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
  sendEmailEnabled: boolean;
  senderName: string;
  recipientName: string;
}

export interface EmailSendResult {
  data: { id: string } | null;
  error: Error | null;
}

export class EmailService {
  private readonly resend: Resend;
  private readonly config: EmailConfiguration;
  private readonly htmlTemplate: string;
  private readonly textTemplate: string;

  constructor(config: EmailConfiguration) {
    this.config = config;
    this.resend = new Resend(config.apiKey);

    const templatesDir = join(process.cwd(), 'src', 'features', 'contact', 'templates');
    this.htmlTemplate = readFileSync(join(templatesDir, 'contact-email.html'), 'utf-8');
    this.textTemplate = readFileSync(join(templatesDir, 'contact-email.txt'), 'utf-8');
  }

  getConfiguration(): EmailConfiguration {
    return { ...this.config };
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env, validator = new EmailServiceConfigurationValidator()): EmailService {
    const validationResult = validator.validate(env);

    if (!validationResult.configured) {
      const errors = validationResult.problems || ['Email service configuration validation failed'];
      throw new Error(`Email service configuration errors: ${errors.join(', ')}`);
    }

    const config = this.extractEnvironmentVariables(env);
    return new EmailService(config);
  }

  private static extractEnvironmentVariables(env: NodeJS.ProcessEnv): EmailConfiguration {
    return {
      apiKey: env.RESEND_API_KEY!,
      fromEmail: env.FROM_EMAIL!,
      toEmail: env.TO_EMAIL!,
      sendEmailEnabled: env.SEND_EMAIL_ENABLED === 'true',
      senderName: env.EMAIL_SENDER_NAME!,
      recipientName: env.EMAIL_RECIPIENT_NAME!
    };
  }

  async sendContactEmail(data: ContactFormServerData): Promise<EmailSendResult> {
    if (!this.config.sendEmailEnabled) {
      return this.createEmailDisabledResponse();
    }

    const result = await this.resend.emails.send({
      from: `${this.config.senderName} <${this.config.fromEmail}>`,
      to: `${this.config.recipientName} <${this.config.toEmail}>`,
      replyTo: data.email,
      subject: `New Message from ${data.firstName} ${data.lastName}`,
      html: this.createEmailHTML(data),
      text: this.createEmailText(data)
    });

    return result;
  }

  private createEmailDisabledResponse(): EmailSendResult {
    return {
      data: null,
      error: new Error('SEND_EMAIL_ENABLED is false')
    };
  }

  private createEmailHTML(data: ContactFormServerData): string {
    return TemplateRenderer.render(this.htmlTemplate, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      message: data.message.replace(/\n/g, '<br>'),
      submittedAt: new Date().toLocaleString()
    });
  }

  private createEmailText(data: ContactFormServerData): string {
    return TemplateRenderer.render(this.textTemplate, {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      message: data.message,
      submittedAt: new Date().toLocaleString()
    });
  }
}
