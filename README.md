# adam-edison-dot-com

Source code for adamedison.com

## Technologies

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/
docs/pages/api-reference/create-next-app).

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local` with your actual values (see [Environment Setup](#environment-setup) below).

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `pages/index.tsx`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.ts`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/pages/building-your-application/routing/api-routes) instead of React pages.

This project uses [`next/font`](https://nextjs.org/docs/pages/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Setup

### Required Environment Variables

The contact form requires several environment variables to function properly. Copy `.env.example` to `.env.local` and configure the following:

#### Email Configuration

For email functionality, you'll need SMTP credentials. Gmail is recommended for development:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
CONTACT_EMAIL=your-contact@email.com
```

**Gmail Setup:**

1. Enable 2-factor authentication on your Google account
2. Go to [Google App Passwords](https://support.google.com/accounts/answer/185833)
3. Generate an app password for "Mail"
4. Use this app password (not your regular password) in `SMTP_PASS`

#### reCAPTCHA Configuration

The contact form uses Google reCAPTCHA v3 for spam protection:

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-recaptcha-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
RECAPTCHA_SCORE_THRESHOLD=0.5
```

**reCAPTCHA Setup:**

1. Go to [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin/create)
2. Create a new site with reCAPTCHA v3
3. Add your domain(s) (for development, add `localhost`)
4. Copy the site key and secret key to your `.env.local` file

### Development vs Production

- **Development**: Use `localhost` in reCAPTCHA domains
- **Production**: Update reCAPTCHA domains to include your actual domain
- **Environment Files**: Use `.env.local` for development, configure environment variables in your hosting platform for production

### Email Providers

While Gmail is used in the example, you can use any SMTP provider:

- **Gmail**: `smtp.gmail.com:587` (requires app password)
- **Outlook**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **SendGrid**: `smtp.sendgrid.net:587`
- **Mailgun**: `smtp.mailgun.org:587`

### Testing the Contact Form

1. Ensure all environment variables are set
2. Start the development server: `npm run dev`
3. Navigate to `/contact`
4. Fill out and submit the form
5. Check your configured email address for the message

### Security Notes

- Never commit `.env.local` to version control (it is already in `.gitignore`)
- Use app passwords for Gmail (not your regular password)
- Keep your reCAPTCHA secret key secure
- The contact form includes rate limiting and input sanitization

## Deploy on Netlify

Netlify is connected via GitHub, where the build command is:

```bash
npm run static
```

And the published directory is set to:

```bash
out
```
