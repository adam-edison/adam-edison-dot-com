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

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check

# Run unit tests only (pure functions, node env, no external dependencies)
npm run test

# Run unit tests (explicit)
npm run test:unit

# Run component tests (JSX rendering in jsdom)
npm run test:component

# Run integration tests (requires Redis configuration in .env.local)
npm run test:integration

# Run all tests (unit + component + integration + e2e)
npm run test:all

# Run e2e tests
npm run test:e2e

# Run boundary tests against real external services (Resend, Upstash)
# Normally only runs via the weekly cron workflow or manual workflow_dispatch
# RESEND_API_KEY=your_key FROM_EMAIL=from@domain.com TO_EMAIL=to@domain.com npm run test:boundary
```

## Environment Variables

`src/shared/config/EnvironmentSchema.ts` is the single source of truth for every env var the app reads. Add new vars there first; the runtime `Configuration` singleton, the build-time `scripts/check-env.ts` check, and the test factory all read from the same schema. Misconfigured deploys fail at boot with one aggregated error listing every missing or malformed var.

The sections below describe the role each var plays in the app; the schema enforces the actual format and bounds.

## Email Configuration

The contact form uses **Resend** for email delivery instead of traditional SMTP:

- **API Key**: Set `RESEND_API_KEY` in environment variables
- **From Address**: Uses `FROM_EMAIL` in environment variables
- **To Address**: Uses `TO_EMAIL` in environment variables
- **Sender Name**: Uses `EMAIL_SENDER_NAME` in environment variables (displays in email headers)
- **Recipient Name**: Uses `EMAIL_RECIPIENT_NAME` in environment variables (displays in email headers)
- **Send Toggle**: `SEND_EMAIL_ENABLED` (optional, defaults to `false`; only the literal string `'true'` enables sending)
- **Reply-To**: Automatically set to the form submitter's email
- **Domain**: Requires domain verification in Resend dashboard for production use

## Captcha Configuration

The contact form uses **Cloudflare Turnstile** for spam protection:

- **Site Key**: Set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` in environment variables
- **Secret Key**: Set `TURNSTILE_SECRET_KEY` in environment variables (required at boot via the schema; missing values fail the build, not a runtime 503)
- **Verification**: Server-side verification fails closed on every runtime error path (missing token, network errors, and rejected tokens all return 400)
- **Domain registration**: Register `adamedison.com` (and any preview domains) in the
  Cloudflare Turnstile dashboard to obtain the site key + secret key

## Rate Limiting Configuration

The contact form uses configurable rate limiting with two layers:

**Per-IP Rate Limiting:**

- **Requests**: Set `RATE_LIMIT_REQUESTS` in environment variables (positive integer, max 10,000)
- **Window**: Set `RATE_LIMIT_WINDOW` in environment variables, formatted like `'10 s'`, `'30 m'`, `'1 h'`

**Global Rate Limiting:**

- **Requests**: Set `GLOBAL_RATE_LIMIT_REQUESTS` in environment variables (positive integer, max 100,000)
- **Window**: Set `GLOBAL_RATE_LIMIT_WINDOW` in environment variables, formatted like `'10 s'`, `'30 m'`, `'1 h'`

**Redis**: Requires `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and `REDIS_PREFIX` (used to namespace dev/prod/test keys).

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

## Dependency Pinning Convention

- `next` and `eslint-config-next` must be **exact-pinned** (no caret/tilde) and bumped together in lockstep — they share an internal version contract that breaks when the two drift.
- Other runtime and dev dependencies use caret ranges (`^x.y.z`) by default so patch and minor updates flow through `npm install`.
- Security-driven bumps (e.g., CVE responses) may pin individual packages to exact versions when the CVE fix is the floor we want to guarantee. When this happens, the commit message documents the CVE rationale; the rest of the manifest keeps its existing pin style.

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

## Test Tier Strategy

Tests are organized into four tiers, each with a dedicated vitest config and file-name suffix. Pick the tier that matches what the test exercises:

- **unit** — pure functions in node env. File pattern: `*.unit.test.ts`. Config: `vitest.unit.config.mts`. Setup: `tests/setup/unit.setup.ts`. Fast, no DOM, no external dependencies.
- **component** — JSX rendering in jsdom env. File pattern: `*.component.test.{ts,tsx}`. Config: `vitest.component.config.mts`. Setup: `tests/setup/component.setup.ts` (jest-dom matchers + `cleanup`).
- **integration** — services with mocks or local stand-ins. File pattern: `*.integration.test.ts`. Config: `vitest.integration.config.mts`. Requires Redis configuration in `.env.local`.
- **boundary** — real external services (Resend, Upstash). File pattern: `*.boundary.test.ts`. Config: `vitest.boundary.config.mts`. **Runs only via the weekly cron workflow or manual `workflow_dispatch` trigger** — not part of `test:all`, not part of `dwa quality-check`, and never runs on PR CI.

`npm run test:all` runs the first three tiers plus e2e (boundary excluded by design).

## Stable State Verification

After making a set of changes, always verify stable state by running these commands in order:

1. `npm run format` - Auto-format code
2. `npm run lint` - Check for linting issues
3. `npm run build` - Ensure project builds successfully
4. `npm run test:unit` - Run unit tests
5. `npm run test:component` - Run component tests
6. `npm run test:integration` - Run integration tests
7. `npm run test:e2e` - Run end-to-end tests

All commands must pass before considering changes complete and ready for commit.
