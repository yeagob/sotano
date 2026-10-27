import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// Shown on the pause card: the package version plus the UTC build time (YYMMDDHHmm),
// so every build and every deploy shows a new number.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const built = new Date().toISOString().replace(/[-:T]/g, '').slice(2, 12);

export default defineConfig({
  define: { APP_VERSION: JSON.stringify(`v${version} · ${built}`) },
  server: { port: 5174 },
  worker: { format: 'es' },
  // whole worlds of ten floors take a few seconds to carve: a generous default timeout
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 60000 },
} as any);
