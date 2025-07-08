import { Resend } from 'resend';
import validator from 'validator';
import { ContactFormServerData } from '@/lib/validations/contact';

// Create Resend client
export function createResendClient() {
  const { RESEND_API_KEY } = process.env;

  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }

  return new Resend(RESEND_API_KEY);
}

// Send email using Resend
export async function sendEmail(data: ContactFormServerData) {
  // Skip email sending if disabled (for testing)
  if (process.env.SEND_EMAIL_ENABLED === 'false') {
    return {
      data: { id: 'mock-email-id' },
      error: null
    };
  }

  const resend = createResendClient();
  const fromEmail = process.env.FROM_EMAIL;
  const toEmail = process.env.TO_EMAIL;

  if (!fromEmail) {
    throw new Error('From email not configured');
  }

  if (!toEmail) {
    throw new Error('To email not configured');
  }

  const result = await resend.emails.send({
    from: `Personal Website Contact Form <${fromEmail}>`,
    to: `Adam Edison <${toEmail}>`,
    replyTo: data.email,
    subject: `New Message from ${data.firstName} ${data.lastName}`,
    html: createEmailHTML(data),
    text: createEmailText(data)
  });

  return result;
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

// Create email text content
export function createEmailText(data: ContactFormServerData): string {
  return `
    New Contact Form Submission
    
    Name: ${data.firstName} ${data.lastName}
    Email: ${data.email}
    
    Message:
    ${data.message}
    
    Submitted: ${new Date().toLocaleString()}
  `;
}
