/**
 * Integration tests — channel adapters, provider adapters, cross-module interactions.
 * Run: npm run test:integration
 */
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: [
      'test/channels/**/*.test.ts',
      'test/providers/**/*.test.ts',
      'test/auto-reply/**/*.test.ts',
      'test/webhooks/**/*.test.ts',
      'test/enterprise.test.ts',
      'test/auth-enterprise.test.ts',
      'test/tenants.test.ts',
    ],
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
    hookTimeout: 30000,
    testTimeout: 30000,
  },
});
