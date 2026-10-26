import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5174 },
  worker: { format: 'es' },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
} as any);
