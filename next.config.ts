import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';
import { ServerOnlyEnvironmentSchema } from './src/shared/config/EnvironmentSchema';

const sentryBuildConfigSchema = ServerOnlyEnvironmentSchema.pick({
  SENTRY_AUTH_TOKEN: true,
  SENTRY_ORG: true,
  SENTRY_PROJECT: true
}).required();

const sourceMapUploadConfigured = sentryBuildConfigSchema.safeParse(process.env).success;

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
  bundleSizeOptimizations: { excludeDebugStatements: true }
});
