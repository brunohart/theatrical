import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    /**
     * Use 'forks' pool instead of default 'threads' to support
     * process.chdir() in init command tests. Worker threads don't
     * allow cwd changes — forked processes do.
     */
    pool: 'forks',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts'],
    },
  },
});
