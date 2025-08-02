import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    include: ['**/*.unit.test.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['**/tests/e2e/**', '**/node_modules/**'],
    globals: true,
    setupFiles: ['./tests/setup/dom.ts', './tests/setup/logger.ts']
  }
});
