# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based personal portfolio website for adamedison.com using the Pages Router architecture. The site is configured for static export and deployment on Netlify.

## Development Commands

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Build and export static site for Netlify deployment
npm run static

# Start production server
npm start

# Run linting
npm run lint

# Format code with Prettier
npm run format

# Check code formatting
npm run format:check
```

## Testing Commands

```bash
# Run all tests in the repository
npm run test:all
```

## Email Configuration

The contact form uses **Resend** for email delivery instead of traditional SMTP:

- **API Key**: Set `RESEND_API_KEY` in environment variables
- **From Address**: Uses `FROM_EMAIL` in environment variables
- **To Address**: Uses `TO_EMAIL` in environment variables
- **Reply-To**: Automatically set to the form submitter's email
- **Domain**: Requires domain verification in Resend dashboard for production use

## Architecture

### Framework & Stack

- **Next.js 15.3.4** with Pages Router (not App Router)
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Static export** configuration for Netlify deployment

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
- `package.json` - Contains `static` script for Netlify deployment
- `eslint.config.mjs` - ESLint configuration with Prettier integration
- `.prettierrc` - Prettier formatting configuration

## Styling System

- Uses **Tailwind CSS 4** with custom CSS variables
- Dark mode support via `prefers-color-scheme`
- Custom color system with `--background` and `--foreground` variables
- Geist font family integration via `next/font/google`

## Deployment

- **Platform**: Netlify
- **Build command**: `npm run static`
- **Publish directory**: `out/`
- Static export is configured for optimal performance

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