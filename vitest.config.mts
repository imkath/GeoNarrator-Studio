import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
  },
  resolve: {
    // fileURLToPath, not .pathname: the latter keeps %20 and breaks the alias
    // whenever the checkout lives in a folder with a space in its name.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
