/**
 * End-to-end tests — full server lifecycle, real HTTP/WebSocket calls.
 * Run: npm run test:e2e
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/e2e/**/*.test.ts', 'test/integration/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/test/**',
        '**/tests/**',
      ],
    },
    setupFiles: ['./test/setup.ts'],
    hookTimeout: 60000,
    testTimeout: 60000,
  },
});
