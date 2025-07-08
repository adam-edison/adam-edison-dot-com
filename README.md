# adam-edison-dot-com

Source code for [adamedison.com](https://adamedison.com) - a personal portfolio website built with Next.js.

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy environment template:
   ```bash
   cp .env.example .env.local
   ```
4. Configure environment variables (see [Configuration](#configuration) below)
5. Start development server:
   ```bash
   npm run dev
   ```

The development server runs on [http://localhost:3000](http://localhost:3000) with [Turbopack](https://turbo.build/pack) for fast builds and hot reload.

## Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run format:check # Check format without writing changes

# Testing
npm run test         # Run unit tests
npm run test:unit    # Run unit tests (explicit)
npm run test:integration # Run integration tests (requires Redis)
npm run test:e2e     # Run end-to-end tests with Playwright
npm run test:all     # Run all tests (unit + integration + e2e)
npm run test:manual  # Run manual integration tests (requires email config)
```

## Configuration

### Required Environment Variables

Copy `.env.example` to `.env.local` and configure these services:

#### Email Service (Resend)

```env
RESEND_API_KEY=your-resend-api-key-here
FROM_EMAIL=your-contact@email.com
```

1. Create account at [resend.com](https://resend.com)
2. Verify your domain (add DNS records)
3. Generate API key from dashboard
4. Set contact email address

#### Spam Protection (reCAPTCHA)

```env
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_SECRET_KEY=your-secret-key
RECAPTCHA_SCORE_THRESHOLD=0.5
```

1. Visit [Google reCAPTCHA Console](https://www.google.com/recaptcha/admin/create)
2. Create reCAPTCHA v3 site
3. Add domain (use `localhost` for development)
4. Copy site key and secret key

#### Rate Limiting (Upstash Redis)

```env
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token
```

Optional rate limit configuration:
```env
RATE_LIMIT_REQUESTS=5
RATE_LIMIT_WINDOW=10 m
GLOBAL_RATE_LIMIT_REQUESTS=10
GLOBAL_RATE_LIMIT_WINDOW=1 h
```

1. Create account at [upstash.com](https://upstash.com)
2. Create Redis database
3. Copy REST URL and token from dashboard

## Testing

### Test Types

- **Unit Tests**: Fast, isolated component testing (no external dependencies)
- **Integration Tests**: API and database integration (requires Redis configuration)
- **E2E Tests**: Full browser automation with Playwright
- **Manual Tests**: Email service testing (requires full environment setup)

### Running Tests

```bash
# Quick feedback loop
npm run test:unit

# Full test suite
npm run test:all

# Integration only (needs Redis)
npm run test:integration

# Browser testing
npm run test:e2e

# Email testing (needs Resend config)
npm run test:manual
```

### Test Environment

Integration tests use higher rate limits for stability. Tests automatically clean up Redis keys to prevent interference between runs.

For detailed test scenarios, see [MANUAL-TESTING.md](./MANUAL-TESTING.md).

## Technologies

### Core Stack

- **[Next.js 15.3.4](https://nextjs.org)** - React framework with App Router
- **[React 19.0.0](https://react.dev)** - UI library
- **[TypeScript 5](https://www.typescriptlang.org)** - Type safety
- **[Tailwind CSS 4](https://tailwindcss.com)** - Utility-first CSS framework

### UI Components & Styling

- **[Radix UI](https://radix-ui.com)** - Accessible component primitives
- **[Lucide React](https://lucide.dev)** - Icon library
- **[GSAP](https://greensock.com/gsap)** - Animation library
- **[Tailwind Merge](https://github.com/dcastil/tailwind-merge)** - Utility class merging

### Forms & Validation

- **[React Hook Form](https://react-hook-form.com)** - Form management
- **[Zod](https://zod.dev)** - Schema validation
- **[Hookform Resolvers](https://github.com/react-hook-form/resolvers)** - Form validation integration

### Communication & Security

- **[Resend](https://resend.com)** - Email delivery service
- **[reCAPTCHA](https://www.google.com/recaptcha)** - Spam protection
- **[Upstash](https://upstash.com)** - Redis for rate limiting

### Testing & Development

- **[Vitest](https://vitest.dev)** - Unit and integration testing
- **[Playwright](https://playwright.dev)** - End-to-end testing
- **[Testing Library](https://testing-library.com)** - React testing utilities
- **[ESLint](https://eslint.org)** - Code linting
- **[Prettier](https://prettier.io)** - Code formatting

## Architecture

### Contact Form Features

- **Email Delivery**: Powered by Resend with domain verification
- **Spam Protection**: reCAPTCHA v3 with configurable score threshold
- **Rate Limiting**: Dual-layer protection (per-IP + global) using Upstash Redis
- **Form Validation**: Client and server-side validation with Zod schemas
- **Error Handling**: Graceful degradation with detailed error messages

### Rate Limiting Strategy

- **Per-IP Limits**: Prevent individual abuse (default: 5 requests/10 minutes)
- **Global Limits**: Protect against distributed attacks (default: 10 requests/hour)
- **Sliding Window**: Smooth rate limiting without sudden resets
- **Fail-Open**: Service remains available if Redis is unavailable

### Why These Technologies?

- **Resend**: Better deliverability than SMTP, developer-friendly API
- **Upstash**: Serverless Redis perfect for Next.js/Vercel deployments
- **reCAPTCHA v3**: Invisible spam protection with risk scoring
- **Zod**: Type-safe validation that works client and server-side

## Deployment

### Environment Setup

- **Development**: Use `localhost` in reCAPTCHA domains
- **Production**: Update reCAPTCHA domains to include your actual domain
- **Environment Files**: Use `.env.local` for development, configure environment variables in your hosting platform

### Netlify Deployment

This project is configured for Netlify with automatic GitHub integration. Next.js APIs are automatically converted to Netlify Functions.

See [Next.js on Netlify documentation](https://docs.netlify.com/frameworks/next-js/overview/) for details.

### Security Best Practices

- Never commit `.env.local` to version control (already in `.gitignore`)
- Keep all API keys secure and never expose in client-side code
- Use environment variables for all sensitive configuration
- The contact form includes input sanitization and rate limiting
- Resend handles SPF, DKIM, and DMARC authentication automatically

## Development

Built with Next.js Pages Router, this project uses modern web development best practices with comprehensive testing and security features.

For component development, the project uses Radix UI for accessibility and Tailwind CSS for styling. Forms are managed with React Hook Form and validated with Zod schemas.

Animation is handled by GSAP for smooth, professional interactions.
