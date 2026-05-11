import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const sourceMapUploadConfigured = Boolean(
  process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
);

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  trailingSlash: true,
  eslint: {
    dirs: ['src', 'tests', 'scripts']
  },
  // Enable compression
  compress: true,
  // Optimize images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000 // 1 year
  },
  // Set custom headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/story/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/:path*.webp',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/:path*.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        source: '/resume.pdf',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  }
  // Production optimizations ready for future use
  // experimental: {
  //   optimizeCss: true  // Disabled due to critters module conflicts
  // }
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  tunnelRoute: '/monitoring',
  sourcemaps: { disable: !sourceMapUploadConfigured },
  disableLogger: true
});
