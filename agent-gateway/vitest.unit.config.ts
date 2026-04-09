/**
 * Unit tests — fast, isolated, no external dependencies.
 * Run: npm run test:unit
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.ts', 'src/**/*.test.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/e2e/**',
      '**/integration/**',
      // Exclude tests that require external services or heavy setup
      '**/channels/**',
      '**/providers/**',
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
        '**/channels/**',
        '**/providers/**',
      ],
    },
    setupFiles: ['./test/setup.ts'],
    hookTimeout: 10000,
    testTimeout: 10000,
  },
});
