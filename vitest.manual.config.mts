import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [tsconfigPaths(), react()],
    test: {
      environment: 'jsdom',
      include: ['**/*.manual.test.ts'],
      exclude: ['**/node_modules/**'],
      globals: true,
      env
    }
  };
});
