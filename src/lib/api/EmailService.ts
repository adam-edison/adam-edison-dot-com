import { Resend } from 'resend';
import { ContactFormServerData } from '@/lib/validations/contact';

export interface EmailConfiguration {
  apiKey: string;
  fromEmail: string;
  toEmail: string;
  sendEmailEnabled: boolean;
}

export interface EmailSendResult {
  data: { id: string };
  error: null | Error;
}

export class EmailService {
  private readonly resend: Resend;
  private readonly config: EmailConfiguration;

  private constructor(config: EmailConfiguration) {
    this.config = config;
    this.resend = new Resend(config.apiKey);
  }

  static fromEnv(): EmailService {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.FROM_EMAIL;
    const toEmail = process.env.TO_EMAIL;
    const sendEmailEnabled = process.env.SEND_EMAIL_ENABLED !== 'false';

    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    if (!fromEmail) {
      throw new Error('From email not configured');
    }

    if (!toEmail) {
      throw new Error('To email not configured');
    }

    const config: EmailConfiguration = {
      apiKey,
      fromEmail,
      toEmail,
      sendEmailEnabled
    };

    return new EmailService(config);
  }

  async sendContactEmail(data: ContactFormServerData): Promise<EmailSendResult> {
    if (!this.config.sendEmailEnabled) {
      return this.createMockEmailResponse();
    }

    const result = await this.resend.emails.send({
      from: `Personal Website Contact Form <${this.config.fromEmail}>`,
      to: `Adam Edison <${this.config.toEmail}>`,
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
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>New Contact Form Submission</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f4f4f4; padding: 20px; border-radius: 5px; margin-bottom: 20px; }
          .field { margin-bottom: 15px; }
          .field strong { color: #2563eb; }
          .message { background-color: #f9f9f9; padding: 15px; border-left: 4px solid #2563eb; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>New Contact Form Submission</h2>
            <p>You've received a new message from your website contact form.</p>
          </div>
          
          <div class="field">
            <strong>Name:</strong> ${data.firstName} ${data.lastName}
          </div>
          
          <div class="field">
            <strong>Email:</strong> ${data.email}
          </div>
          
          <div class="field">
            <strong>Message:</strong>
            <div class="message">${data.message.replace(/\n/g, '<br>')}</div>
          </div>
          
          <div class="field">
            <strong>Submitted:</strong> ${new Date().toLocaleString()}
          </div>
        </div>
      </body>
    </html>
  `;
  }

  private createEmailText(data: ContactFormServerData): string {
    return `
    New Contact Form Submission
    
    Name: ${data.firstName} ${data.lastName}
    Email: ${data.email}
    
    Message:
    ${data.message}
    
    Submitted: ${new Date().toLocaleString()}
  `;
  }
}

export const emailService = EmailService.fromEnv();