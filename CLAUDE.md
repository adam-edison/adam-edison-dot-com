# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based personal portfolio website for adamedison.com using the Pages Router architecture. The site includes API routes for contact form functionality and is deployed on Netlify.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Build for Netlify deployment
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Check TypeScript types
npm run build:check

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Run unit tests only (fast, no external dependencies)
npm run test

# Run unit tests (explicit)
npm run test:unit

# Run integration tests (requires Redis configuration in .env.local)
npm run test:integration

# Run all tests (unit + integration)
npm run test:all

# Run e2e tests
npm run test:e2e

# Run manual integration tests (requires email service credentials)
npm run test:manual

# Run manual tests with actual email sending (requires RESEND_API_KEY, FROM_EMAIL, TO_EMAIL)
# RESEND_API_KEY=your_key FROM_EMAIL=from@domain.com TO_EMAIL=to@domain.com npm run test:manual
```

## Email Configuration

The contact form uses **Resend** for email delivery instead of traditional SMTP:

- **API Key**: Set `RESEND_API_KEY` in environment variables
- **From Address**: Uses `FROM_EMAIL` in environment variables
- **To Address**: Uses `TO_EMAIL` in environment variables
- **Sender Name**: Uses `EMAIL_SENDER_NAME` in environment variables (displays in email headers)
- **Recipient Name**: Uses `EMAIL_RECIPIENT_NAME` in environment variables (displays in email headers)
- **Reply-To**: Automatically set to the form submitter's email
- **Domain**: Requires domain verification in Resend dashboard for production use

## Turnstile Configuration

The contact form uses Cloudflare Turnstile for spam protection:

- **Enabled**: Set `TURNSTILE_ENABLED` to `'true'` to enable Turnstile (defaults to disabled)
- **Site Key**: Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in environment variables
- **Secret Key**: Set `TURNSTILE_SECRET_KEY` in environment variables
- **Mode**: Checkbox mode with VPN-friendly configuration
- **Features**:
  - Manual retry control (`retry: 'never'`)
  - User-controlled refresh (`refresh-timeout: 'manual'`)
  - Loads on page render (`execution: 'render'`)
  - Better for VPN users with clear feedback

## Rate Limiting Configuration

The contact form uses configurable rate limiting with three layers:

**Per-IP Rate Limiting:**

- **Requests**: Set `CONTACT_IP_RATE_LIMIT_REQUESTS` in environment variables
- **Window**: Set `CONTACT_IP_RATE_LIMIT_WINDOW` in environment variables

**Global Rate Limiting:**

- **Requests**: Set `CONTACT_GLOBAL_RATE_LIMIT_REQUESTS` in environment variables
- **Window**: Set `CONTACT_GLOBAL_RATE_LIMIT_WINDOW` in environment variables

**Per-Email Rate Limiting:**

- **Requests**: Set `CONTACT_EMAIL_RATE_LIMIT_REQUESTS` in environment variables
- **Window**: Set `CONTACT_EMAIL_RATE_LIMIT_WINDOW` in environment variables

**Redis**: Requires `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

## Social Media Configuration

Social media links are configurable through environment variables:

- **GitHub URL**: Set `NEXT_PUBLIC_GITHUB_URL` in environment variables
- **LinkedIn URL**: Set `NEXT_PUBLIC_LINKEDIN_URL` in environment variables
- **Repository URL**: Set `NEXT_PUBLIC_REPO_URL` in environment variables (for "View Source Code" link)

## Architecture

### Framework & Stack

- **Next.js 15.3.4** with Pages Router (not App Router)
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Server-side rendering** support for API routes and dynamic content

### Project Structure

```
src/
├── components/      # Reusable React components
│   ├── GitHubIcon.tsx
│   ├── HeaderBanner.tsx
│   ├── HeroSection.tsx
│   ├── LinkedInIcon.tsx
│   ├── MainHeader.tsx
│   ├── NavLink.tsx
│   ├── SocialIconLink.tsx
│   └── icons/
│       └── TechIcon.tsx
├── constants/       # Application constants
│   └── socialLinks.ts
├── pages/           # Next.js pages (Pages Router)
│   ├── _app.tsx     # App wrapper component
│   ├── _document.tsx # Document wrapper
│   ├── index.tsx    # Home page
│   ├── resume.tsx   # Resume page
│   └── api/         # API routes
│       └── hello.ts
└── styles/
    └── globals.css  # Global styles with Tailwind
```

### Key Configuration Files

- `next.config.ts` - Next.js configuration with React Strict Mode
- `tsconfig.json` - TypeScript config with `@/*` path mapping to `./src/*`
- `package.json` - Contains build scripts for Netlify deployment
- `netlify.toml` - Netlify deployment configuration
- `eslint.config.mjs` - ESLint configuration with Prettier integration
- `.prettierrc` - Prettier formatting configuration

## Styling System

- Uses **Tailwind CSS 4** with custom CSS variables
- Dark mode support via `prefers-color-scheme`
- Custom color system with `--background` and `--foreground` variables
- Geist font family integration via `next/font/google`

## Deployment

- **Platform**: Netlify
- **Build command**: `npm run build`
- **Publish directory**: `.next/`
- Uses Netlify's Next.js runtime for server-side rendering and API routes

## SEO Considerations

The project includes `SearchEngineOptimization.md` with comprehensive SEO guidelines including:

- Meta tags and Open Graph setup
- Structured data (JSON-LD)
- Performance optimization
- Mobile-first design
- Accessibility requirements

## Code Quality & Formatting

- **ESLint**: Integrated with Next.js rules and Prettier
- **Prettier**: Configured with single quotes, 120 character line width, no trailing commas
- **TypeScript**: Strict mode enabled
- All code is automatically formatted on save and enforced via ESLint

### Prettier Configuration

```json
{
  "trailingComma": "none",
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "printWidth": 120,
  "bracketSpacing": true
}
```

## Code Preferences

**Component Architecture:**

- Small, focused components with single responsibilities
- Reusable components organized in `/src/components/`
- Props interfaces defined with TypeScript for type safety
- Functional components with clear, descriptive names

**Navigation & Routing:**

- Always use `Link` from `next/link` for internal navigation instead of `<a>` tags
- Use `<a>` tags only for external links with `target="_blank"` and `rel="noopener noreferrer"`

**Images:**

- Always use `Image` from `next/image` instead of `<img>` tags for better performance and optimization

**External Links:**

- For external social media and website links, use regular `<a>` tags with proper security attributes

**Code Organization:**

- Constants extracted to `/src/constants/` for reusability
- Clean separation of concerns between components, pages, and utilities
- DRY principle applied consistently
- Semantic HTML with proper accessibility attributes (`aria-label`, etc.)

**Styling:**

- Tailwind CSS classes for consistent styling
- Responsive design with mobile-first approach
- Hover states and transitions for interactive elements
- Color scheme using CSS custom properties

**Commit Messages:**

- Never include Claude Code references, branding, or co-authored-by lines in commit messages
- Keep commit messages clean and professional without AI tool attribution

## Development Notes

- Uses Pages Router architecture (not App Router)
- Path aliases configured (`@/*` maps to `./src/*`)
- Resume PDF available in `/public/resume.pdf`
- Run `npm run lint` to check for code quality issues
- Run `npm run format` to auto-format code before commits

## Stable State Verification

After making a set of changes, always verify stable state by running these commands in order:

1. `npm run format` - Auto-format code
2. `npm run lint` - Check for linting issues
3. `npm check:types` - Check for TypeScript type errors
4. `npm run build` - Ensure project builds successfully (includes type checking)
5. `npm run test:unit` - Run unit tests
6. `npm run test:integration` - Run integration tests
7. `npm run test:e2e` - Run end-to-end tests

All commands must pass before considering changes complete and ready for commit.
