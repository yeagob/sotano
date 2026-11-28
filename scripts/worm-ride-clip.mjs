// A gameplay clip of the deep desert's worm (issue #354, docs/design/built/levels/worm-desert/WORM.md), recorded with
// its metadata (.claude/skills/sotano-recordings/SKILL.md): the test bench's Secret zones > Desert, God mode on, the
// crack telegraph, the leap, onto the back, the climb to the head, positive intentions until it is tame, a ride to the
// desert's edge (the invisible wall), and the dismount. The run and the clip go to .local (git-ignored):
//
//   node scripts/worm-ride-clip.mjs [SEED]
//
// The player's hands are driven through the game's own input (keys held, the cast button held through the input's
// mouse state, since a headless browser has no pointer lock) and the view is turned by setting the player's yaw and
// pitch. Two moves are placed by the script and noted in the steps: the step onto the back (the leap is not jumped onto
// by hand here) and, when the climb stalls, the last plate before the head.

import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { startRecording } from './recording.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEED = process.argv[2] ?? 'TMMG-Q8HF';
const { chromium } = createRequire(import.meta.url)('playwright');

const server = await createServer({ root, logLevel: 'error', server: { port: 0 } });
await server.listen();
const base = server.resolvedUrls.local[0];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const url = `${base}?test&seed=${encodeURIComponent(SEED)}`;

const rec = await startRecording(browser, {
  feature: 'worm-desert',
  slug: 'ride-and-dismount',
  issue: 354,
  title: 'Ride the deep desert\'s worm to the edge and dismount',
  description: 'From the test bench\'s Desert button with God mode on: the crack telegraph, the leap, onto the back, the climb to the head, good intentions until the worm is tame, a ride to the desert\'s edge where it is held by the invisible wall, then the dismount. Passes when the worm is tame, has met the edge, and the dismount gives Prescience.',
  url,
  seed: SEED,
  designDoc: 'docs/design/built/levels/worm-desert/WORM.md',
  viewport: { width: 960, height: 540 },
  marketing: true,
});
const page = rec.page;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const game = (fn, arg) => page.evaluate(fn, arg);

// what the screen shows: each new toast, card and notice text, as it appears
const seen = new Map();
let watching = true;
const watch = (async () => {
  while (watching) {
    try {
      const now = await page.evaluate(() => {
        const read = id => { const e = document.getElementById(id); if (!e) return ''; const c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && Number(c.opacity) > 0.1 ? (e.textContent ?? '').trim() : ''; };
        return { toast: read('toast'), banner: read('banner'), achievement: read('achievement'), boss: read('boss') };
      });
      for (const [name, text] of Object.entries(now)) if (text && seen.get(name) !== text) { seen.set(name, text); rec.element(name, text); }
    } catch { /* the page is between frames */ }
    await sleep(200);
  }
})();

/** Polls the game until `cond` holds, or fails after `ms`. */
async function until(what, cond, ms, arg) {
  const end = Date.now() + ms;
  for (;;) {
    if (await page.evaluate(cond, arg)) return;
    if (Date.now() > end) {
      const state = await page.evaluate(() => {
        const g = window.S.game, b = g.player.body, w = g.worm;
        return { worm: w?.state, rider: w?.rider?.seg ?? null, playing: g.input.playing, screen: g.hud.screenOpen, paused: g.paused, x: Math.round(b.x), y: Math.round(b.y), z: Math.round(b.z), ground: b.onGround, deep: !!g.dw?.terrain?.deepAt(b.x, b.z) };
      }).catch(() => null);
      throw new Error(`timed out waiting for ${what} (${JSON.stringify(state)})`);
    }
    await sleep(100);
  }
}

let result = 'pass', failure = null;
try {
  await page.waitForFunction(() => window.S?.game?.worm !== undefined, null, { timeout: 120_000 });
  rec.step('the run is loaded (?test, a fixed seed)');
  // play without the pointer: the game reads the input as engaged
  await game(() => { const g = window.S.game; g.hud.closeScreen?.(g); g.input.engaged = true; });

  rec.step('open the test bench, turn God mode on, press Secret zones > Desert');
  await page.click('#testbench-tab');
  await page.locator('#testbench button', { hasText: /God mode|Modo dios/ }).first().click();
  await page.locator('#testbench button', { hasText: /^(Desert|Desierto)$/ }).first().click();
  await page.click('#testbench header button');
  await game(() => { const g = window.S.game; g.input.engaged = true; g.hud.closeScreen?.(g); });
  await sleep(1500);

  rec.step('walk into the basin');
  await game(() => { const p = window.S.game.player; p.yaw = Math.PI; p.pitch = -0.05; });
  await page.keyboard.down('KeyW');
  await sleep(1500);
  await page.keyboard.up('KeyW');

  await until('the crack telegraph', () => window.S.game.worm.state === 'telegraph', 30_000);
  rec.step('the sand cracks in a line toward the leap point');
  await rec.shot('telegraph');
  // look along the crack line, toward where the worm will leap from
  await game(() => { const g = window.S.game, w = g.worm, b = g.player.body; g.player.yaw = Math.atan2(-(w.emerge[0] - b.x), -(w.emerge[1] - b.z)); g.player.pitch = -0.25; });
  await until('the leap', () => window.S.game.worm.state === 'breach', 30_000);
  rec.step('the worm leaps out of the sand toward the player');
  await sleep(600);
  await rec.shot('leap');
  await until('the worm swimming', () => window.S.game.worm.state === 'cruise', 30_000);
  // the body follows the head through the leap's arch: board once the whole back swims level over the sand
  await until('the back level over the sand', () => { const tops = window.S.game.worm.segments.map(s => s.top); return tops.length > 0 && Math.max(...tops) - Math.min(...tops) < 3.5; }, 40_000);
  rec.step('the whole body has come out of the leap and swims level');

  rec.step('onto the back (placed by the script on the eighth plate)');
  await game(() => { const g = window.S.game, s = g.worm.segments[7], b = g.player.body; g.player.spawnAt(s.x, s.top + 1.5, s.z); g.player.yaw = Math.atan2(-s.hx, -s.hz); g.player.pitch = -0.2; void b; });
  await until('a rider on the back', () => (window.S.game.worm.rider?.seg ?? -1) >= 0, 10_000);

  rec.step('climb plate by plate toward the head (walk and jump)');
  await page.keyboard.down('KeyW');
  const climbEnd = Date.now() + 25_000;
  while (Date.now() < climbEnd) {
    const seg = await game(() => { const g = window.S.game, w = g.worm, s = w.segments[0]; if (s) g.player.yaw = Math.atan2(-(s.x - g.player.body.x), -(s.z - g.player.body.z)); return w.rider?.seg ?? -1; });
    if (seg === 0) break;
    await page.keyboard.press('Space');
    await sleep(350);
  }
  await page.keyboard.up('KeyW');
  if ((await game(() => window.S.game.worm.rider?.seg ?? -1)) !== 0) {
    rec.step('the climb stalled: the script sets the rider on the plate behind the head, then walks onto the head');
    await game(() => { const g = window.S.game, s = g.worm.segments[1]; g.player.spawnAt(s.x, s.top + 0.5, s.z); g.player.yaw = Math.atan2(-s.hx, -s.hz); });
    await page.keyboard.down('KeyW');
    for (let i = 0; i < 30 && (await game(() => window.S.game.worm.rider?.seg ?? -1)) !== 0; i++) { await page.keyboard.press('Space'); await sleep(300); }
    await page.keyboard.up('KeyW');
  }
  await until('the rider on the head', () => window.S.game.worm.rider?.seg === 0, 10_000);
  await rec.shot('head');

  rec.step('fire good intentions at the head until it is tame');
  await game(() => { const g = window.S.game; g.player.pitch = -1.35; g.input.mouse.add(0); });
  await until('a tame worm', () => window.S.game.worm.tamed, 60_000);
  await game(() => { window.S.game.input.mouse.delete(0); window.S.game.player.pitch = -0.1; });
  rec.step('the worm is tame');
  await rec.shot('tame');

  rec.step('ride it: steer outward to the desert\'s edge and along the wall');
  await game(() => { const g = window.S.game, w = g.worm, h = w.head; g.player.yaw = Math.atan2(-(h.x - w.cx), -(h.z - w.cz)); g.player.pitch = -0.15; });
  await page.keyboard.down('KeyW');
  await until('the edge of the desert', () => window.S.game.worm.heldAtEdge, 90_000);
  rec.step('the worm meets the desert\'s edge: the invisible wall holds it, it slides along the rim');
  await sleep(4000);
  await rec.shot('edge');
  await page.keyboard.up('KeyW');

  rec.step('dismount: jump off the head');
  await page.keyboard.press('Space');
  await until('the dismount', () => window.S.game.worm.rewarded, 10_000);
  await sleep(2500);
  await rec.shot('dismount');
  const holds = await game(() => window.S.game.inventory.items.some(i => i.def.id === 'prescience'));
  if (!holds) throw new Error('the dismount did not give Prescience');
  rec.step('Prescience is held; the worm dives');
  await sleep(2500);
} catch (e) {
  result = 'fail';
  failure = e instanceof Error ? e.message : String(e);
} finally {
  watching = false;
  await watch;
  const meta = await rec.finish({ result, failure });
  console.log(JSON.stringify({ dir: rec.relativeDir, result: meta.result, failure: meta.failure, seconds: meta.durationSeconds }));
  await browser.close();
  await server.close();
}
process.exit(result === 'pass' ? 0 : 1);
