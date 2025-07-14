import { Resend } from 'resend';
import { ContactFormServerData } from './ContactFormValidator';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TemplateRenderer } from '@/shared/TemplateRenderer';

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

  static fromEnv(): EmailService {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL;
    const toEmail = process.env.TO_EMAIL;
    const sendEmailEnabled = process.env.SEND_EMAIL_ENABLED !== 'false';
    const senderName = process.env.EMAIL_SENDER_NAME;
    const recipientName = process.env.EMAIL_RECIPIENT_NAME;

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    if (!fromEmail) {
      throw new Error('From email not configured');
    }

    if (!toEmail) {
      throw new Error('To email not configured');
    }

    if (!senderName) {
      throw new Error('EMAIL_SENDER_NAME is not configured');
    }

    if (!recipientName) {
      throw new Error('EMAIL_RECIPIENT_NAME is not configured');
    }

    const config: EmailConfiguration = {
      apiKey,
      fromEmail,
      toEmail,
      sendEmailEnabled,
      senderName,
      recipientName
    };

    return new EmailService(config);
  }

  async sendContactEmail(data: ContactFormServerData): Promise<EmailSendResult> {
    if (!this.config.sendEmailEnabled) {
      return this.createMockEmailResponse();
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

  private createMockEmailResponse(): EmailSendResult {
    return {
      data: { id: 'mock-email-id' },
      error: null
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

export const emailService = EmailService.fromEnv();
