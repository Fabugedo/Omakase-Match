import { defineConfig } from 'vitest/config';

// e2e tests boot the Nest app against the real database, so they're kept
// separate from the fast pure-unit tests and run via `npm run test:e2e`.
export default defineConfig({
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
