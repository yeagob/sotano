import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// Shown on the pause card: the package version plus the UTC build time (YYMMDDHHmm),
// so every build and every deploy shows a new number.
const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const releaseVersion = version.replace(/-f(\d+)$/, '.f$1');
const built = new Date().toISOString().replace(/[-:T]/g, '').slice(2, 12);
// The branch the build comes from, for the development logs (src/debug/devlog.ts): Vercel's, then
// GitHub Actions'. Empty when unknown, which keeps the logs off outside development builds.
const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || '';

export default defineConfig({
  define: {
    APP_VERSION: JSON.stringify(`v${releaseVersion} · ${built}`),
    DEVLOG_BRANCH: JSON.stringify(branch),
  },
  server: { port: 5174 },
  worker: { format: 'es' },
  // whole worlds of ten floors take a few seconds to carve: a generous default timeout
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 60000 },
} as any);
