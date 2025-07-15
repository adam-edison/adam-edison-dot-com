import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  trailingSlash: true,
  eslint: {
    dirs: ['src', 'tests', 'scripts']
  }
};

export default nextConfig;
