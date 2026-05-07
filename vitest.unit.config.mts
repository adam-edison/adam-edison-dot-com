import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['**/*.unit.test.{js,mjs,cjs,ts,mts,cts}'],
    exclude: ['**/tests/e2e/**', '**/node_modules/**'],
    globals: true,
    setupFiles: ['./tests/setup/unit.setup.ts']
  }
});
