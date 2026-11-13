// Captures the lesson images of the book (docs/design/not-built/levels/roots/BOOK-DATA.md §4): one staged
// scene and one camera pose per image, taken from the game itself in the creative sandbox at a fixed seed,
// written to public/book/lesson/<name>.webp. No HUD and no held hand unless the lesson is about them.
//
//   npm run book:captures                 every lesson image that can be staged (see PENDING below)
//   npm run book:captures -- blocks dig   the named images only
//
// Each entry is a sandbox room (rows, blocks, liquids, creatures), an optional lab script run first (thrown
// cubes, bombs, damage, timed reactions; the lab's ticks run in the same fixed step), an optional short
// JS prep (a missile in flight, a creature grown, the toll window open), and the camera: the eye (room-local
// [col, eye height, row]) and the point it looks at. The same build gives the same images.
//
// Needs Playwright with Chromium (npx playwright install chromium), like scripts/sandbox.mjs.

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public/book/lesson');

let chromium;
try { ({ chromium } = createRequire(import.meta.url)('playwright')); }
catch { ({ chromium } = await import('playwright').catch(() => { console.error('book-captures: Playwright is needed (npm i -D playwright && npx playwright install chromium)'); process.exit(2); })); }

// Lesson images that the sandbox cannot stage yet. Each is named here with its reason and is not captured;
// tests/book-images.test.ts lists the same ids as pending, so the gap is explicit, never faked.
const PENDING = {
  ring: 'the minimap of the whole Roots needs a real run of floor 0; the sandbox is one room',
  drink: 'a flask on top of the hand: the sandbox hand carries blocks and parts, not potions',
  alembic: 'the alembic is placed by the floor generator on floors 2, 4, 6 and 8; the sandbox cannot place it',
  kitchen: 'the kitchen is placed by the floor generator on floors 1, 3, 5 and 7; the sandbox cannot place it',
  recipe: 'the alembic and the potion it made: the alembic is placed by the floor generator (floors 2, 4, 6, 8)',
  paths: 'the practices tab of the inventory screen: the sandbox does not open the inventory yet',
  state: 'the banner of a state of being: shown only after three practices of one path, not in the sandbox',
  'white-bomb': 'a white bomb over lava needs a polarity-coloured explosion the sandbox cannot drop yet',
  'boss-room': 'a boss room after its fight: the lit pedestal needs a defeated boss, which the sandbox cannot stage',
  parts: 'the four parts of a released projection: parts are rolled on release; the sandbox has no part pickup hook',
  chests: 'the locked chest with keyholes is a model the floor generator places; the sandbox cannot place it',
  // pages 3 to 6 filling all 22 slots (owner, 2026-11-13): not captured yet; BOOK-DATA §4 says what each must show
  sky: 'the sky above the great tree: the sandbox does not build the sky; it needs the real game started on the sky deck (?sky)',
  'warm-boss': 'a boss nearly warmed to your side: not captured yet (a sandbox boss room with its warmth set, like convert)',
  seal: 'a room sealed with a projection in it: the sandbox room has no doors to shut',
  omen: 'the cold motes of an omen gathering: not captured yet (an omen must be started and paused mid-gather)',
  'room-clear': 'a cleared room with what it left: not captured yet (the clear drop must be rolled and paused)',
  mastery: 'loose keys, bombs and hearts the Roots lay out at a high mastery: needs a real run of floor 0 at that level',
};

// Room helpers: rows are z (north to south), each row is x (west to east). '.' is air.
const grid = (w, d) => Array.from({ length: d }, () => '.'.repeat(w));
const B = (block, x0, h0, z0, x1, h1, z1) => ({ at: [x0, h0, z0, x1, h1, z1], block });
const C = (x0, h0, z0, x1, h1, z1) => ({ at: [x0, h0, z0, x1, h1, z1], clear: true });
const E = (element, x0, h0, z0, x1, h1, z1) => ({ at: [x0, h0, z0, x1, h1, z1], element });

// The lessons. `eye` is [col, eye height above the floor, row], `at` the point looked at (room-local).
// `hud` keeps the HUD, `hand` keeps the held hand, `clip` crops to the union of these elements, `sanctuary`
// and `toll` open that screen, `keep` leaves those DOM ids visible, `lab` is the lab script (ticks, actions),
// `prep` is JS run in the page with `S` (the sandbox console), `W` (room-local to world) and `g` (the game).
const LESSONS = [
  { name: 'blocks', floor: 0, rows: grid(11, 9), place: [B('dirt', 2, 0, 2, 3, 1, 2), B('stone', 4, 0, 2, 5, 1, 2), B('crate', 6, 0, 2, 7, 1, 2), B('dirt', 8, 0, 2, 8, 1, 2)],
    eye: [5, 1.62, 7.5], at: [5, 1, 2],
    prep: `const m = g.missiles.launch(...W(5, 1.4, 7.5), 0, -0.04, -1, 'positive'); S.sb.step(14);` },
  { name: 'polarity', floor: 0, hud: true, dpr: 3, clip: ['#hearts-box', '#polarity'], rows: grid(11, 9), place: [B('crate', 4, 0, 3, 6, 1, 3)],
    eye: [5, 1.62, 7.5], at: [5, 1, 3] },
  { name: 'step', floor: 0, rows: grid(11, 9), place: [B('stone', 3, 0, 2, 9, 1, 2), B('dirt', 5, 0, 3, 5, 0, 3), B('dirt', 5, 0, 6, 5, 0, 6)],
    eye: [5.5, 2.62, 6.5], at: [5.5, 1.0, 2.5] },
  { name: 'dig', floor: 0, rows: grid(9, 9), place: [B('stone', 0, 0, 3, 8, 1, 3), B('dirt', 3, 0, 3, 5, 1, 3)],
    eye: [4.5, 1.62, 6.5], at: [4.5, 1, 3.5] },
  { name: 'behind-wall', floor: 0, rows: grid(9, 9), place: [B('stone', 0, 0, 3, 8, 1, 3), C(3, 0, 3, 5, 1, 3), B('crate', 1, 0, 1, 1, 0, 1), B('stone', 7, 0, 1, 7, 1, 1)],
    eye: [4.5, 1.62, 6.5], at: [4.5, 0.9, 0.5] },
  { name: 'mend', floor: 0, rows: grid(11, 9), place: [B('dirt', 2, 0, 2, 8, 1, 2)],
    lab: { ticks: 3, actions: [{ t: 0, do: 'damage', at: [5, 0, 2], amount: 4, kind: 'intent' }] },
    prep: `const m = g.missiles.launch(...W(5, 1.4, 7.5), 0, -0.05, -1, 'positive'); S.sb.step(10);`,
    eye: [5, 1.62, 7.5], at: [5, 0.8, 2] },
  { name: 'pit', floor: 0, rows: grid(11, 9), place: [C(3, -2, 1, 5, -1, 6), B('dirt', 4, -2, 4, 4, -1, 4)],
    eye: [4.5, 1.62, 8.5], at: [4.5, -0.5, 3] },
  { name: 'bridge', floor: 0, rows: grid(11, 9), place: [C(2, -2, 0, 5, -1, 8), B('dirt', 1, -1, 4, 3, -1, 4)],
    eye: [1.5, 1.62, 8.5], at: [4.5, -0.5, 3.5] },
  { name: 'counters', floor: 0, hud: true, dpr: 3, rows: grid(11, 9), clip: ['#keys', '#bombs'],
    prep: `g.collect('key', 3); g.collect('bomb', 2); S.sb.step(2);`,
    eye: [5, 1.62, 7.5], at: [5, 1, 3] },
  { name: 'bomb', floor: 0, rows: grid(9, 9), place: [B('obsidian', 1, 0, 2, 7, 1, 2)],
    lab: { ticks: 1, actions: [{ t: 0, do: 'bomb', at: [4, 0, 3], fuse: 600 }] },
    eye: [4.5, 1.62, 6.5], at: [4.5, 0.6, 2.5] },
  { name: 'kick', floor: 0, rows: grid(9, 9),
    lab: { ticks: 14, actions: [{ t: 0, do: 'cube', block: 'crate', at: [4, 0, 5], v: [0, 0.8, -6] }] },
    eye: [4.5, 1.62, 7.5], at: [4.5, 0.8, 3.5] },
  { name: 'crates', floor: 0, rows: grid(9, 9), place: [B('crate', 4, 0, 3, 4, 0, 3)],
    lab: { ticks: 40, actions: [{ t: 0, do: 'break', at: [4, 0, 3] }] },
    eye: [4.5, 1.0, 4.2], at: [4.5, 0.3, 3.2] },
  { name: 'lava', floor: 3, rows: grid(11, 9), place: [E('lava', 0, 0, 4, 4, 0, 8), E('water', 5, 0, 4, 9, 0, 8)],
    lab: { ticks: 200, actions: [] },
    eye: [3, 2.2, 1.5], at: [4.5, 0.5, 6] },
  { name: 'water', floor: 3, rows: grid(11, 9), place: [E('water', 0, 0, 0, 10, 2, 8)],
    lab: { ticks: 30, actions: [] },
    eye: [5, 1.6, 6.5], at: [5, 1.4, 1] },
  { name: 'sanctuary', floor: 1, rows: grid(9, 9), sanctuary: true, eye: [4.5, 1.62, 7], at: [4.5, 1, 4] },
  { name: 'practice', floor: 0, rows: grid(9, 9).map((r, z) => z === 5 ? r.slice(0, 4) + 'T' + r.slice(5) : r), pedestal: 'grounding',
    eye: [4.5, 1.62, 8], at: [4.5, 1.2, 5.5] },
  { name: 'convert', floor: 1, rows: grid(9, 9), enemies: [{ def: 'doubt', at: [4, 0, 4] }],
    prep: `const e = g.enemies.list.find(x => x.def === 'doubt' && x.alive); e.warmth = 0.95; S.sb.step(1);`,
    eye: [4.5, 1.62, 7.5], at: [4.5, 0.9, 4.5] },
  { name: 'throw', floor: 1, rows: grid(9, 9), enemies: [{ def: 'doubt', at: [4, 0, 2] }],
    lab: { ticks: 15, actions: [{ t: 0, do: 'cube', block: 'obsidian', at: [4, 0, 6], v: [0, 0.6, -8] }] },
    eye: [4.5, 1.62, 7.5], at: [4.5, 0.9, 3.5] },
  { name: 'creatures', floor: 0, rows: grid(9, 9), place: [B('dirt', 5, 0, 4, 5, 0, 4)],
    enemies: [{ def: 'mossling', at: [4, 0, 4] }],
    prep: `const e = g.enemies.list.find(x => x.def === 'mossling' && x.alive); e.body.y = W(0, 0, 0)[1] - 0.5; S.sb.step(1);`,
    eye: [3.5, 1.62, 7.5], at: [4.5, 0.3, 4.5] },
  { name: 'grow', floor: 0, rows: grid(9, 9), enemies: [{ def: 'rootling', at: [4, 0, 4] }],
    prep: `const e = g.enemies.list.find(x => x.def === 'rootling' && x.alive); e.scale = 3; S.sb.step(1);`,
    eye: [4.5, 1.62, 7.5], at: [4.5, 0.9, 4.5] },
  { name: 'way-down', floor: 0, rows: grid(9, 9), place: [C(3, -2, 3, 5, -1, 5)], toll: 1, keep: ['toll'],
    eye: [4.5, 1.62, 7.5], at: [4.5, -1, 4] },
  { name: 'toll', floor: 3, rows: grid(9, 9), toll: 3, keep: ['toll'], eye: [4.5, 1.62, 7.5], at: [4.5, 1, 4] },
];

const WEBP_QUALITY = [0.9, 0.8, 0.7, 0.6, 0.5];
const MAX_BYTES = 60 * 1024;
const OUT = [960, 540];
const FOV = 60;

const only = process.argv.slice(2);
const names = LESSONS.map(l => l.name);
for (const a of only) if (!names.includes(a) && !(a in PENDING)) { console.error(`book-captures: unknown image "${a}"`); process.exit(2); }
const jobs = LESSONS.filter(l => only.length === 0 || only.includes(l.name));
if (jobs.length === 0) { console.error('book-captures: no matching images'); process.exit(2); }
for (const [name, why] of Object.entries(PENDING)) if (only.length === 0 || only.includes(name)) console.log(`- ${name}: pending (${why})`);
mkdirSync(outDir, { recursive: true });

const scenarioOf = l => ({
  id: `lesson-${l.name}`,
  note: `Book lesson capture ${l.name}`,
  floor: l.floor,
  seed: 1,
  rows: l.rows,
  ...(l.place ? { place: l.place } : {}),
  ...(l.enemies ? { enemies: l.enemies } : {}),
  ...(l.pedestal ? { pedestal: l.pedestal } : {}),
  god: true,
});

// Runs in the page: the room's origin, the lab script, the prep, the camera, and the HUD and hand flags.
const setScene = job => {
  const S = window.S, g = S.game;
  S.lang('en');
  g.simulateUnlocked = true;
  if (job.lab) S.sb.lab({ ...job.scenario, ticks: job.lab.ticks, report: [job.lab.ticks], actions: job.lab.actions });
  S.sb.pause(true);
  const rr = g.floors.get(g.depth).rooms[0];
  const o = [rr.x0, rr.y0, rr.z0];
  const W = (x, h, z) => [o[0] + x, o[1] + h, o[2] + z];
  if (job.prep) new Function('S', 'W', 'g', job.prep)(S, W, g);
  if (job.toll) g.hud.openToll(g, job.toll);
  if (job.sanctuary) g.openSanctuary(() => {});
  const [ex, ey, ez] = W(...job.eye);
  const [ax, ay, az] = W(...job.at);
  const dx = ax - ex, dy = ay - ey, dz = az - ez, horiz = Math.hypot(dx, dz) || 1;
  g.player.spawnAt(ex, ey - 1.62, ez);
  g.player.yaw = Math.atan2(-dx, -dz);
  g.player.pitch = Math.atan2(dy, horiz);
  g.camera.fov = job.fov ?? 60;
  g.camera.updateProjectionMatrix();
  g.hands.scene.children.forEach(c => { c.visible = !!job.hand; });
  const keep = new Set(['game', ...(job.keep ?? [])]);
  if (job.sanctuary) keep.add('sanctuary');
  for (const el of [...document.body.children]) {
    if (el.tagName === 'SCRIPT' || keep.has(el.id)) continue;
    if (!job.hud && !job.sanctuary) el.style.display = 'none';
    else if (job.sanctuary) el.style.display = 'none';
  }
  const clip = job.clip ? job.clip.map(sel => document.querySelector(sel)?.getBoundingClientRect()).filter(Boolean) : null;
  if (!clip || clip.length === 0) return null;
  const x0 = Math.min(...clip.map(r => r.left)) - 10, y0 = Math.min(...clip.map(r => r.top)) - 10;
  const x1 = Math.max(...clip.map(r => r.right)) + 10, y1 = Math.max(...clip.map(r => r.bottom)) + 10;
  return { x: Math.max(0, x0), y: Math.max(0, y0), width: x1 - x0, height: y1 - y0 };
};



/** The picture as a WebP at `out` (width, height) at the first quality that fits 60 KB. */
async function encodeWebp(page, png, out) {
  for (const q of WEBP_QUALITY) {
    const data = await page.evaluate(async ({ b64, q, w, h }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);
      return c.toDataURL('image/webp', q).split(',')[1];
    }, { b64: png.toString('base64'), q, w: out[0], h: out[1] });
    const bytes = Buffer.from(data, 'base64');
    if (bytes.length <= MAX_BYTES || q === WEBP_QUALITY.at(-1)) return { bytes, q };
  }
}

const server = await createServer({ root, logLevel: 'error', server: { port: 0 } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = 0;
try {
  for (const l of jobs) {
    const job = { ...l, scenario: scenarioOf(l) };
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: l.dpr ?? 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(`${url}?sandbox=${encodeURIComponent(JSON.stringify(job.scenario))}`);
    try {
      await page.waitForFunction(() => window.S && window.S.sb, null, { timeout: 120000, polling: 200 });
      const clip = await page.evaluate(`(${setScene.toString()})(${JSON.stringify(job)})`);
      await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
      await page.waitForTimeout(1500);
      const png = await page.screenshot({ type: 'png', ...(clip ? { clip } : {}) });
      const dpr = l.dpr ?? 1;
      const out = clip ? [Math.round(clip.width * dpr), Math.round(clip.height * dpr)] : OUT;
      const { bytes, q } = await encodeWebp(page, png, out);
      writeFileSync(join(outDir, `${l.name}.webp`), bytes);
      console.log(`+ ${l.name}  ${out[0]}x${out[1]}  ${(bytes.length / 1024).toFixed(1)} KB (quality ${q})${errors.length ? `  (page errors: ${errors.length})` : ''}`);
      if (errors.length) { failed++; console.log(errors.slice(0, 3).join('\n')); }
    } catch (e) {
      failed++;
      console.log(`✗ ${l.name}: ${String(e).split('\n')[0]}\n${errors.slice(0, 3).join('\n')}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  await server.close();
}
console.log(`book-captures: ${jobs.length - failed} captured, ${failed} failed`);
process.exit(failed ? 1 : 0);
