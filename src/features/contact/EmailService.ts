import { Resend } from 'resend';
import { ContactFormServerData } from './ContactFormValidator';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TemplateRenderer } from '@/shared/TemplateRenderer';
import { EmailServiceConfigurationValidator } from '@/shared/EmailServiceConfigurationValidator';
import { EmailServiceConfigurationFactory } from '@/shared/EmailServiceConfigurationFactory';
import { Result } from '@/shared/Result';
import { EmailServiceError } from '@/shared/errors';

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

  private constructor(config: EmailConfiguration) {
    this.config = config;
    this.resend = new Resend(config.apiKey);

    const templatesDir = join(process.cwd(), 'src', 'features', 'contact', 'templates');
    this.htmlTemplate = readFileSync(join(templatesDir, 'contact-email.html'), 'utf-8');
    this.textTemplate = readFileSync(join(templatesDir, 'contact-email.txt'), 'utf-8');
  }

  getConfiguration(): EmailConfiguration {
    return { ...this.config };
  }

  static fromEnv(env: NodeJS.ProcessEnv = process.env): Result<EmailService, EmailServiceError> {
    const config = EmailServiceConfigurationFactory.fromEnv(env);
    const validationResult = EmailServiceConfigurationValidator.validate(config);

    if (!validationResult.configured) {
      const clientMessage = 'Unable to send messages at this time. Please try again later.';
      const problemList = validationResult.problems?.join(', ');
      const internalMessage = `Email service configuration errors: ${problemList}`;
      const configError = new EmailServiceError(clientMessage, { internalMessage, isConfigError: true });

      return Result.failure(configError);
    }

    const emailService = new EmailService(config);
    return Result.success(emailService);
  }

  async sendContactEmail(data: ContactFormServerData): Promise<Result<{ id: string }, EmailServiceError>> {
    if (!this.config.sendEmailEnabled) {
      const clientMessage = 'Unable to send messages at this time. Please try again later.';
      const internalMessage = 'Email sending is disabled in configuration';
      const disabledError = new EmailServiceError(clientMessage, { internalMessage, isConfigError: true });

      return Result.failure(disabledError);
    }

    try {
      const result = await this.resend.emails.send({
        from: `${this.config.senderName} <${this.config.fromEmail}>`,
        to: `${this.config.recipientName} <${this.config.toEmail}>`,
        replyTo: data.email,
        subject: `New Message from ${data.firstName} ${data.lastName}`,
        html: this.createEmailHTML(data),
        text: this.createEmailText(data)
      });

      if (result.error) {
        const clientMessage = 'Unable to send your message at this time. Please try again later.';
        const internalMessage = `Failed to send email via Resend API: ${result.error.message}`;
        const emailServiceError = new EmailServiceError(clientMessage, { internalMessage, isConfigError: false });

        return Result.failure(emailServiceError);
      }

      return Result.success({ id: result.data!.id });
    } catch (error) {
      const clientMessage = 'Unable to send your message at this time. Please try again later.';
      const errorDetails = error instanceof Error ? error.message : 'Unknown error';
      const internalMessage = `Email service error: ${errorDetails}`;
      const emailServiceError = new EmailServiceError(clientMessage, { internalMessage, isConfigError: false });

      return Result.failure(emailServiceError);
    }
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
