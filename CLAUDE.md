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
```

## Architecture

### Framework & Stack
- **Next.js 15.3.4** with Pages Router (not App Router)
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Static export** configuration for Netlify deployment

### Project Structure
```
src/
├── pages/           # Next.js pages (Pages Router)
│   ├── _app.tsx     # App wrapper component
│   ├── _document.tsx # Document wrapper
│   ├── index.tsx    # Home page
│   └── api/         # API routes
└── styles/
    └── globals.css  # Global styles with Tailwind
```

### Key Configuration Files
- `next.config.ts` - Next.js configuration with React Strict Mode
- `tsconfig.json` - TypeScript config with `@/*` path mapping to `./src/*`
- `package.json` - Contains `static` script for Netlify deployment

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

## Development Notes

- Uses Pages Router architecture (not App Router)
- TypeScript strict mode enabled
- Path aliases configured (`@/*` maps to `./src/*`)
- Resume PDF available in `/public/resume.pdf`
- ESLint configuration for code quality