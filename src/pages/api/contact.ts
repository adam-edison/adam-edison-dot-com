import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import validator from 'validator';
import { contactFormSubmissionSchema, contactFormServerSchema, ContactFormServerData } from '@/lib/validations/contact';

// Rate limiting map (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

// Simple rate limiting function
function rateLimit(ip: string, maxRequests: number = 5, windowMs: number = 60000): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  if (now - userLimit.lastReset > windowMs) {
    userLimit.count = 1;
    userLimit.lastReset = now;
    return false;
  }

  if (userLimit.count >= maxRequests) {
    return true;
  }

  userLimit.count++;
  return false;
}

// Verify reCAPTCHA token
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    throw new Error('reCAPTCHA secret key not configured');
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `secret=${secretKey}&response=${token}`
    });

    const data = await response.json();

    if (!data.success) {
      console.error('reCAPTCHA verification failed:', data['error-codes']);
      return false;
    }

    // Check score for reCAPTCHA v3 (score between 0.0 and 1.0)
    const scoreThreshold = parseFloat(process.env.RECAPTCHA_SCORE_THRESHOLD || '0.5');
    if (data.score && data.score < scoreThreshold) {
      console.error('reCAPTCHA score too low:', data.score);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return false;
  }
}

// Create email transporter
function createEmailTransporter() {
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
function sanitizeInput(input: string): string {
  return validator.escape(input.trim());
}

// Create email HTML content
function createEmailHTML(data: ContactFormServerData): string {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get client IP for rate limiting
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;

    // Apply rate limiting
    if (rateLimit(ip)) {
      return res.status(429).json({ message: 'Too many requests. Please try again later.' });
    }

    // Validate request body structure
    const validationResult = contactFormSubmissionSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.error('Contact form validation failed:', validationResult.error.errors);
      return res.status(400).json({
        message: 'Invalid form data',
        errors: validationResult.error.errors
      });
    }

    const { recaptchaToken, ...formData } = validationResult.data;

    // Verify reCAPTCHA
    const isValidRecaptcha = await verifyRecaptcha(recaptchaToken);
    if (!isValidRecaptcha) {
      console.error('reCAPTCHA verification failed');
      return res.status(400).json({ message: 'reCAPTCHA verification failed' });
    }

    // Sanitize form data
    const sanitizedData = {
      firstName: sanitizeInput(formData.firstName),
      lastName: sanitizeInput(formData.lastName),
      email: sanitizeInput(formData.email),
      confirmEmail: sanitizeInput(formData.confirmEmail),
      message: sanitizeInput(formData.message)
    };

    // Validate sanitized data
    const serverValidationResult = contactFormServerSchema.safeParse(sanitizedData);
    if (!serverValidationResult.success) {
      console.error('Server validation failed after sanitization:', serverValidationResult.error.errors);
      return res.status(400).json({
        message: 'Invalid form data after sanitization',
        errors: serverValidationResult.error.errors
      });
    }

    const contactEmail = process.env.CONTACT_EMAIL;
    if (!contactEmail) {
      throw new Error('Contact email not configured');
    }

    // Create email transporter and send email
    const transporter = createEmailTransporter();
    await transporter.sendMail({
      from: `"Adam Edison - Contact Form" <${process.env.SMTP_USER}>`,
      to: contactEmail,
      replyTo: sanitizedData.email,
      subject: `New Contact Form Submission from ${sanitizedData.firstName} ${sanitizedData.lastName}`,
      html: createEmailHTML(sanitizedData),
      text: `
        New Contact Form Submission
        
        Name: ${sanitizedData.firstName} ${sanitizedData.lastName}
        Email: ${sanitizedData.email}
        
        Message:
        ${sanitizedData.message}
        
        Submitted: ${new Date().toLocaleString()}
      `
    });

    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact form error:', error);

    if (error instanceof Error) {
      // Don't expose internal error details to client
      if (error.message.includes('configuration') || error.message.includes('not configured')) {
        return res.status(500).json({ message: 'Server configuration error' });
      }
    }

    res.status(500).json({ message: 'Failed to send message. Please try again later.' });
  }
}
