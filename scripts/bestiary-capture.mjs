// Captures one in-game screenshot per entity of the bestiary (docs/design/built/bestiary/README.md).
//
// Each entity is spawned in the creative sandbox (?sandbox=<inline scenario>) on a floor of its own
// range, facing the player, the world is paused and stepped a fixed number of ticks, and the game
// canvas is saved as docs/design/built/bestiary/img/<id>.png. The sandbox is deterministic (fixed seed, fixed step),
// so the same build gives the same images.
//
//   npm run bestiary                     capture every entity listed below (documentation screenshots)
//   npm run bestiary -- doubt boss ...   capture the named ids only
//
// Portrait mode (docs/design/not-built/levels/roots/BOOK-DATA.md §4) makes the square pictures the book's
// plates show, from the same game, with no HUD and no held hand:
//
//   npm run bestiary -- --portrait              the nineteen portraits of the book (BESTIARY_PORTRAITS)
//   npm run bestiary -- --portrait doubt rootling   the named portraits only
//
// The subject stands on a stone plinth (creatures and projections) in a plain room, the camera is a
// narrow lens placed so the subject's height fills about 72 per cent of the picture, the view is
// levelled on its centre, and the 720 × 720 frame is saved as public/book/bestiary/<id>.webp at 512 × 512.
//
// Needs Playwright with Chromium (npx playwright install chromium), like scripts/sandbox.mjs.

import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const imgDir = join(root, 'docs/design/built/bestiary/img');
const portraitDir = join(root, 'public/book/bestiary');

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

// The nineteen portraits of the book (src/content/book/images.ts, BESTIARY_PORTRAITS); the floor is the one above.
const PORTRAITS = ['doubt', 'critic', 'panic', 'resistance', 'inertia', 'insatiable', 'overwhelm', 'wonder',
  'rootling', 'mossling', 'chirper', 'delver', 'bubbler', 'ferryback', 'leafling', 'star-mite',
  'inkmite', 'cinderwalker', 'listener'];

const args = process.argv.slice(2);
const portrait = args.includes('--portrait');
const only = args.filter(a => a !== '--portrait');
const floorOf = new Map(SUBJECTS.map(([id, floor]) => [id, floor]));
const jobs = portrait
  ? (only.length === 0 ? PORTRAITS : only).map(id => [id, floorOf.get(id) ?? 1])
  : SUBJECTS.filter(([id]) => only.length === 0 || only.includes(id));
if (jobs.length === 0 || (portrait && jobs.some(([id]) => !floorOf.has(id)))) { console.error('bestiary: no matching ids'); process.exit(2); }
mkdirSync(portrait ? portraitDir : imgDir, { recursive: true });

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

// The portrait room: an 11 × 9 room (21 × 15 for a boss). A subject stands on a one-block plinth at the centre, so
// its middle sits near the eye of a player standing close (the camera then looks at it, not down on it); a boss
// stands on the floor. A hovering creature hovers at its own height above the plinth. The player is placed by the
// pose below, never in the frame.
const PORTRAIT_PLINTH = 'stone';
// The room's shell: one pale, even material, so the dark projections read against it and nothing else competes.
const PORTRAIT_SHELL = 'palestone';
const portraitScenario = (id, floor) => {
  const boss = BOSSES.has(id);
  const [cols, n] = boss ? [21, 15] : [11, 9];
  const at = [Math.floor(cols / 2), 0, Math.floor(n / 2)];
  const scenario = {
    id: `portrait-${id}`,
    shell: PORTRAIT_SHELL,
    note: `Book portrait of ${id}`,
    floor,
    seed: 1,
    rows: rows(cols, n),
    player: [1, 0, 1],
    enemies: [{ def: id, at: [at[0], boss ? 0 : 1, at[2]] }],
    god: true,
  };
  if (!boss) scenario.place = [{ at: [at[0], 0, at[2]], block: PORTRAIT_PLINTH }];
  return scenario;
};

// The side the camera comes from, as the subject's facing (0 = the camera on its south side, +z): a subject whose
// face is on its back is framed from the other side.
const PORTRAIT_SIDE = { overwhelm: Math.PI };

// Lens and framing: a 40 degree vertical lens, the subject's larger extent fills 72 per cent of the frame.
const PORTRAIT_FOV = 40, PORTRAIT_FILL = 0.72, PORTRAIT_PX = 720, PORTRAIT_OUT = 512;
// WebP quality: fixed, so a re-run is byte-identical; lowered only in steps when a file would exceed 60 KB.
const WEBP_QUALITY = [0.9, 0.8, 0.7];
const MAX_BYTES = 60 * 1024;

const server = await createServer({ root, logLevel: 'error', server: { port: 0 } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = 0;

/** Frames the subject: the camera on the subject's near side, levelled on its centre, the HUD and the hands removed. */
async function framePortrait(page, id) {
  return page.evaluate(({ id, fov, fill, side }) => {
    const g = window.S.game;
    const e = g.enemies.list.find(x => x.def === id && x.alive);
    if (!e) return { error: `no ${id} in the room` };
    // the picture's extent is the subject's drawn meshes (its wings, its legs), measured in world space
    // the subject turns to face the camera (the game turns a projection to its target the same way)
    const view = g.enemies.viewOf(e.id);
    view.group.rotation.y = side;
    view.group.updateMatrixWorld(true);
    let lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    view.group.traverse(o => {
      if (!o.isMesh || !o.visible) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const bb = o.geometry.boundingBox, m = o.matrixWorld.elements;
      for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z]) {
        const p = [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]];
        for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k], p[k]); hi[k] = Math.max(hi[k], p[k]); }
      }
    });
    const centre = [0, 1, 2].map(k => (lo[k] + hi[k]) / 2);
    const size = Math.max(hi[0] - lo[0], hi[1] - lo[1]);
    const floorY = g.player.body.y;
    const tan = Math.tan(fov * Math.PI / 360);
    const dist = size / (fill * 2 * tan);
    const eyeY = floorY + 1.62;
    g.camera.fov = fov;
    g.camera.updateProjectionMatrix();
    g.player.spawnAt(centre[0] + dist * Math.sin(side), floorY, centre[2] + dist * Math.cos(side));
    g.player.yaw = side;
    g.player.pitch = Math.atan2(centre[1] - eyeY, dist);
    g.hands.scene.children.forEach(c => { c.visible = false; });
    for (const el of [...document.body.children]) if (el.id !== 'game' && el.tagName !== 'SCRIPT') el.style.display = 'none';
    return { dist, size };
  }, { id, fov: PORTRAIT_FOV, fill: PORTRAIT_FILL, side: PORTRAIT_SIDE[id] ?? 0 });
}

/** The square frame as a 512 × 512 WebP at the first quality that fits 60 KB. */
async function encodeWebp(page, png) {
  for (const q of WEBP_QUALITY) {
    const data = await page.evaluate(async ({ b64, q, out }) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const c = document.createElement('canvas');
      c.width = c.height = out;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, out, out);
      return c.toDataURL('image/webp', q).split(',')[1];
    }, { b64: png.toString('base64'), q, out: PORTRAIT_OUT });
    const bytes = Buffer.from(data, 'base64');
    if (bytes.length <= MAX_BYTES || q === WEBP_QUALITY.at(-1)) return { bytes, q };
  }
}

try {
  for (const [id, floor] of jobs) {
    const page = await browser.newPage({ viewport: portrait ? { width: PORTRAIT_PX, height: PORTRAIT_PX } : { width: 1280, height: 720 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    const scenario = encodeURIComponent(JSON.stringify(portrait ? portraitScenario(id, floor) : scenarioFor(id, floor)));
    await page.goto(`${url}?sandbox=${scenario}`);
    try {
      await page.waitForFunction(() => window.S && window.S.sb, null, { timeout: 120000, polling: 200 });
      if (portrait) {
        await page.evaluate(() => {
          window.S.game.simulateUnlocked = true;
          window.S.sb.pause(true);
          window.S.sb.step(2);
        });
        const framed = await framePortrait(page, id);
        if (framed.error) throw new Error(framed.error);
        await page.waitForTimeout(3000);
        const png = await page.screenshot({ type: 'png' });
        const { bytes, q } = await encodeWebp(page, png);
        writeFileSync(join(portraitDir, `${id}.webp`), bytes);
        console.log(`+ ${id}  ${(bytes.length / 1024).toFixed(1)} KB (quality ${q}, subject ${framed.size.toFixed(2)} blocks at ${framed.dist.toFixed(2)})${errors.length ? `  (page errors: ${errors.length})` : ''}`);
      } else {
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
      }
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
