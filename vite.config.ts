import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5174 },
  worker: { format: 'es' },
  // whole worlds of ten floors take a few seconds to carve: a generous default timeout
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 60000 },
} as any);
