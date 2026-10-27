// The sandbox lab, headless (docs/architecture/SANDBOX.md): serves the game with Vite, opens
// ?sandbox=<scenario>&lab in Chromium (Playwright) and prints the report each scenario's script gives.
//
//   npm run sandbox -- water-flow fire-crates   print these reports
//   npm run sandbox -- --file my.json           an ad-hoc scenario from a file (or '{"rows":…}' inline)
//   npm run sandbox -- --all                    every scenario: save its report, list what changed
//   npm run sandbox -- --check                  every scenario against its saved report (exit 1 on a diff)

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const scenarios = join(root, 'src/sandbox/scenarios');
const reports = join(root, 'src/sandbox/reports');

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { ({ chromium } = await import('playwright').catch(() => { console.error('sandbox: Playwright is needed (npm i -D playwright && npx playwright install chromium)'); process.exit(2); })); }

const args = process.argv.slice(2);
const all = args.includes('--all'), check = args.includes('--check');
const ids = (all || check) ? readdirSync(scenarios).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort() : [];
const jobs = ids.map(id => ({ id, param: id }));
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--all' || a === '--check') continue;
  if (a === '--file') { const f = args[++i]; jobs.push({ id: f, param: readFileSync(f, 'utf8') }); continue; }
  jobs.push({ id: a.startsWith('{') ? 'inline' : a, param: a });
}
if (!jobs.length) { console.error('sandbox: name a scenario, --file, --all or --check'); process.exit(2); }

const server = await createServer({ root, logLevel: 'error', server: { port: 0 } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = 0;
try {
  for (const job of jobs) {
    const page = await browser.newPage();
    const logs = [];
    page.on('pageerror', e => logs.push(String(e)));
    await page.goto(`${url}?sandbox=${encodeURIComponent(job.param)}&lab`);
    const result = await page.waitForFunction(() => window.__lab, null, { timeout: 120000, polling: 100 })
      .then(h => h.jsonValue()).catch(() => null);
    await page.close();
    if (!result) { failed++; console.log(`✗ ${job.id}: no report\n${logs.join('\n')}`); continue; }
    if (result.errors.length) failed++;
    if (!all && !check) { process.stdout.write(result.report); continue; }
    const file = join(reports, `${job.id}.txt`);
    const saved = existsSync(file) ? readFileSync(file, 'utf8') : null;
    if (saved === result.report) { console.log(`= ${job.id}`); continue; }
    if (check) { failed++; console.log(`≠ ${job.id}\n${diff(saved ?? '', result.report)}`); continue; }
    mkdirSync(reports, { recursive: true });
    writeFileSync(file, result.report);
    console.log(`${saved === null ? '+' : '≠'} ${job.id}${saved === null ? '' : '\n' + diff(saved, result.report)}`);
  }
} finally {
  await browser.close();
  await server.close();
}
process.exit(failed ? 1 : 0);

/** The lines that differ, with their line numbers (reports are short; a plain line diff is enough). */
function diff(a, b) {
  const x = a.split('\n'), y = b.split('\n'), out = [];
  for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) {
    if (x[i] !== undefined) out.push(`  ${i + 1}- ${x[i]}`);
    if (y[i] !== undefined) out.push(`  ${i + 1}+ ${y[i]}`);
  }
  return out.join('\n');
}
