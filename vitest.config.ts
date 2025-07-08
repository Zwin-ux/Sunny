import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'gemini-cli'],
    environment: 'jsdom', // Use jsdom for React component testing
  },
});