// Captures one in-game screenshot per entity of the bestiary (docs/design/built/bestiary/README.md).
//
// Each entity is spawned in the creative sandbox (?sandbox=<inline scenario>) on a floor of its own
// range, facing the player, the world is paused and stepped a fixed number of ticks, and the game
// canvas is saved as docs/design/built/bestiary/img/<id>.png. The sandbox is deterministic (fixed seed, fixed step),
// so the same build gives the same images.
//
//   npm run bestiary                     capture every entity listed below
//   npm run bestiary -- doubt boss ...   capture the named ids only
//
// Needs Playwright with Chromium (npx playwright install chromium), like scripts/sandbox.mjs.

import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = join(root, 'docs/design/built/bestiary/img');

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { ({ chromium } = await import('playwright').catch(() => { console.error('bestiary: Playwright is needed (npm i -D playwright && npx playwright install chromium)'); process.exit(2); })); }

// [id, floor]: the id is the entity's id in src/content (enemies, creatures, bosses, presences).
// The floor is inside the entity's range, so its room takes that floor's band, rock and palette.
const SUBJECTS = [
  // projections (src/content/enemies, src/content/presences/boundary.ts)
  ['autopilot', 1], ['avoidance', 1], ['craving', 1], ['critic', 1], ['distraction', 1], ['doubt', 1],
  ['impulse', 1], ['panic', 1], ['procrastination', 2], ['procrastination-b', 2], ['procrastination-c', 2],
  ['alarm', 3], ['comparison', 3], ['gloom', 3], ['margin', 3], ['perfectionism', 3], ['resentment', 3],
  ['rumination', 3], ['scarcity', 3], ['second-guessing', 3], ['undertow', 3], ['noise', 4],
  ['backlog', 5], ['dogma', 5], ['reactivity', 5], ['shoulds', 5], ['sulk', 5],
  ['dread', 6], ['not-yet', 6], ['paralysis', 6], ['tribunal', 6],
  ['burnout', 7], ['hall-of-mirrors', 7], ['pretence', 7], ['shortcut', 7], ['spark', 7],
  ['cynicism', 9], ['isolation', 9], ['numbness', 9], ['what-if', 9],

  // friendly creatures (src/content/creatures)
  ['wonder', 0], ['rootling', 0], ['mossling', 0], ['chirper', 1], ['delver', 1], ['leafling', 1],
  ['star-mite', 1], ['bubbler', 3], ['ferryback', 3], ['drifter', 5], ['inkmite', 5],
  ['cinderwalker', 7], ['huddler', 9],
  // bosses (src/content/bosses)
  ['resistance', 1], ['inertia', 1], ['insatiable', 1], ['overwhelm', 3], ['hoard', 3], ['downpour', 3],
  ['threshold-guardian', 5], ['verdict', 6], ['grudge', 6], ['old-rule', 6], ['furnace', 7],
  ['impostor', 7], ['many-faces', 7], ['shadow', 9],
  // presences (src/content/presences)
  ['listener', 1], ['gardener', 1],
];

const only = process.argv.slice(2);
const jobs = SUBJECTS.filter(([id]) => only.length === 0 || only.includes(id));
if (jobs.length === 0) { console.error('bestiary: no matching ids'); process.exit(2); }
mkdirSync(imgDir, { recursive: true });

// A plain room: the subject stands east of the player, who faces it. Bosses need a larger room and more distance
// to fit in the frame.
const BOSSES = new Set(['resistance', 'inertia', 'insatiable', 'overwhelm', 'hoard', 'downpour', 'threshold-guardian', 'verdict', 'grudge', 'old-rule', 'furnace', 'impostor', 'many-faces', 'shadow']);
// Small subjects (the creatures and the two smallest projections) are shot from three tiles away, or they are a dot.
const CLOSE = new Set(['wonder', 'rootling', 'mossling', 'chirper', 'delver', 'leafling', 'star-mite', 'bubbler', 'ferryback', 'drifter', 'inkmite', 'cinderwalker', 'huddler', 'noise', 'distraction']);
const rows = (cols, n) => Array.from({ length: n }, () => '.'.repeat(cols));
const scenarioFor = (id, floor) => {
  const boss = BOSSES.has(id);
  const close = CLOSE.has(id);
  const [cols, n, at, enemy] = boss ? [21, 15, [5, 0, 7], [13, 0, 7]] : close ? [11, 9, [5, 0, 4], [8, 0, 4]] : [11, 9, [3, 0, 4], [7, 0, 4]];
  return {
    id: `bestiary-${id}`,
    note: `Bestiary capture of ${id}`,
    floor,
    seed: 1,
    rows: rows(cols, n),
    player: at,
    enemies: [{ def: id, at: enemy }],
    god: true,
  };
};

const server = await createServer({ root, logLevel: 'error', server: { port: 0 } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = 0;
try {
  for (const [id, floor] of jobs) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const scenario = encodeURIComponent(JSON.stringify(scenarioFor(id, floor)));
    await page.goto(`${url}?sandbox=${scenario}`);
    try {
      await page.waitForFunction(() => window.S && window.S.sb, null, { timeout: 120000, polling: 200 });
      await page.evaluate(() => {
        // the title card and the debug readout stay out of the frame: the capture is the room and the creature
        window.S.game.simulateUnlocked = true;
        document.querySelectorAll('#overlay, #debug, #toast').forEach(el => { el.style.display = 'none'; });
        // the player faces east, along the row, at the creature (forward is (-sin yaw, -cos yaw))
        window.S.game.player.yaw = -Math.PI / 2;
        window.S.sb.pause(true);
        window.S.sb.step(2);
      });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: join(imgDir, `${id}.png`) });
      console.log(`+ ${id}${errors.length ? `  (page errors: ${errors.length})` : ''}`);
      if (errors.length) { failed++; console.log(errors.slice(0, 3).join('\n')); }
    } catch (e) {
      failed++;
      console.log(`✗ ${id}: ${String(e).split('\n')[0]}\n${errors.slice(0, 3).join('\n')}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(`bestiary: ${jobs.length - failed} captured, ${failed} failed`);
process.exit(failed ? 1 : 0);
