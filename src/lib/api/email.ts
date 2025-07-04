import nodemailer from 'nodemailer';
import validator from 'validator';
import { ContactFormServerData } from '@/lib/validations/contact';

// Create email transporter
export function createEmailTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('Email configuration is incomplete');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: parseInt(SMTP_PORT),
    secure: parseInt(SMTP_PORT) === 465, // true for 465, false for other ports
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return validator.escape(input.trim());
}

// Create email HTML content
export function createEmailHTML(data: ContactFormServerData): string {
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
            <strong>Email (click to reply):</strong> ${data.email}
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

// Create email text content
export function createEmailText(data: ContactFormServerData): string {
  return `
    New Contact Form Submission
    
    Name: ${data.firstName} ${data.lastName}
    Email (click to reply): ${data.email}
    
    Message:
    ${data.message}
    
    Submitted: ${new Date().toLocaleString()}
  `;
}
