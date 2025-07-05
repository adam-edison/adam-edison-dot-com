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

## Environment Setup

### Required Environment Variables

The contact form requires several environment variables to function properly. Copy `.env.example` to `.env.local` and configure the following:

#### Email Configuration with Resend

The contact form uses [Resend](https://resend.com) for email delivery, which is simpler and more reliable than traditional SMTP:

```env
RESEND_API_KEY=your-resend-api-key-here
FROM_EMAIL=your-contact@email.com
```

**Resend Setup:**

1. **Create a Resend account** at [resend.com](https://resend.com)
2. **Verify your domain** (required for production):
   - Go to your Resend dashboard
   - Add your domain (e.g., `adamedison.com`)
   - Add the provided DNS records (SPF, DKIM, DMARC) to your domain
   - Wait for verification (usually takes a few minutes)
3. **Get your API key**:
   - Go to [API Keys](https://resend.com/api-keys) in your Resend dashboard
   - Create a new API key
   - Copy the key and add it to your `.env.local` file
4. **Set your contact email**:
   - This is where contact form submissions will be sent
   - Can be any email address you have access to

**Important Notes:**
- The `replyTo` field is automatically set to the form submitter's email
- Free tier includes 3,000 emails per month

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

### Why Resend?

Resend was chosen over traditional SMTP providers for several reasons:

- **Simpler Setup**: No complex SMTP configuration or app passwords needed
- **Better Deliverability**: Higher email delivery rates than Gmail SMTP
- **Developer-Friendly**: Built specifically for developers with clean APIs
- **Domain Verification**: Easy DNS setup with clear instructions
- **Reply-To Support**: Proper reply-to headers for form responses
- **Free Tier**: 3,000 emails per month at no cost

### Testing the Contact Form

1. Ensure all environment variables are set
2. Start the development server: `npm run dev`
3. Navigate to `/contact`
4. Fill out and submit the form
5. Check your configured email address for the message

### Security Notes

- Never commit `.env.local` to version control (it is already in `.gitignore`)
- Keep your Resend API key secure and never expose it in client-side code
- Keep your reCAPTCHA secret key secure
- The contact form includes rate limiting and input sanitization
- Resend automatically handles SPF, DKIM, and DMARC authentication

## Deploy on Netlify

Netlify is connected via GitHub, where the build command is:

```bash
npm run static
```

And the published directory is set to:

```bash
out
```
