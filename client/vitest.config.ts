import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { conditions: ['pratinidhi-source'] },
  test: { include: ['test/**/*.test.ts'] },
});
