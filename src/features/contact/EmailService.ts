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
      return Result.failure(
        new EmailServiceError(`Email service configuration errors: ${validationResult.problems?.join(', ')}`, true)
      );
    }

    return Result.success(new EmailService(config));
  }

  async sendContactEmail(data: ContactFormServerData): Promise<Result<{ id: string }, EmailServiceError>> {
    if (!this.config.sendEmailEnabled) {
      return Result.failure(new EmailServiceError('Email sending is disabled', true));
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
        return Result.failure(new EmailServiceError(`Failed to send email: ${result.error.message}`, false));
      }

      return Result.success({ id: result.data!.id });
    } catch (error) {
      return Result.failure(
        new EmailServiceError(`Email service error: ${error instanceof Error ? error.message : 'Unknown error'}`, false)
      );
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
