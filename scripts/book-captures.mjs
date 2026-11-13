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
  recipe: 'the alembic and the potion it made: the alembic is placed by the floor generator (floors 2, 4, 6, 8)',
  paths: 'the practices tab of the inventory screen: the sandbox does not open the inventory yet',
  state: 'the banner of a state of being: shown only after three practices of one path, not in the sandbox',
  'boss-room': 'a boss room after its fight: the lit pedestal needs a defeated boss, which the sandbox cannot stage',
  chests: 'the locked chest with keyholes is a model the floor generator places; the sandbox cannot place it',
  // pages 3 to 6 filling all 22 slots (owner, 2026-11-13): not captured yet; BOOK-DATA §4 says what each must show
  sky: 'the sky above the great tree: the sandbox does not build the sky; it needs the real game started on the sky deck (?sky)',
  seal: 'a room sealed with a projection in it: the sandbox room has no doors to shut',
  omen: 'the cold motes of an omen gathering: not captured yet (an omen must be started and paused mid-gather)',
  'room-clear': 'a cleared room with what it left: not captured yet (the clear drop must be rolled and paused)',
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
  // a good intention (white and gold) in flight to a creature, a bad one (ember and black) to a block: the two kinds at a glance
  { name: 'polarity', floor: 0, rows: grid(11, 9), place: [B('dirt', 3, 0, 2, 3, 1, 2)], enemies: [{ def: 'rootling', at: [5, 0, 2] }],
    prep: `const n = (x, y, z) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
const [gx, gy, gz] = n(0.5, -0.9, -4.5), [bx, by, bz] = n(-0.5, -0.9, -4.5);
g.missiles.launch(...W(4.5, 1.4, 6.5), gx, gy, gz, 'positive'); g.missiles.launch(...W(3.5, 1.4, 6.5), bx, by, bz, 'negative'); S.sb.step(12);`,
    eye: [4, 1.62, 7.5], at: [4, 0.9, 3.5] },
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
    eye: [4.5, 3.0, 8.2], at: [4.5, 0.2, 4.5] },
  { name: 'water', floor: 3, rows: grid(11, 9), place: [E('water', 0, 0, 0, 10, 2, 8)],
    lab: { ticks: 30, actions: [] },
    eye: [5, 3.4, 7.8], at: [5, 0.6, 3] },
  // the Sanctuary's own screen with its words hidden (hideText): the two ways to sit, not the English around them
  { name: 'sanctuary', floor: 1, rows: grid(9, 9), sanctuary: true, hideText: '#sanctuary', eye: [4.5, 1.62, 7], at: [4.5, 1, 4] },
  { name: 'practice', floor: 0, rows: grid(9, 9).map((r, z) => z === 5 ? r.slice(0, 4) + 'T' + r.slice(5) : r), pedestal: 'grounding',
    eye: [4.5, 1.0, 7.4], at: [4.5, 1.0, 5] },
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
  // the way down itself: the hole in the floor, no window
  { name: 'way-down', floor: 0, rows: grid(9, 9), place: [C(3, -3, 2, 5, -1, 6)], eye: [4.5, 2.2, 8], at: [4.5, -1, 4] },
  // the toll window with its words hidden (hideText): the keys to give, not the English around them
  { name: 'toll', floor: 3, rows: grid(9, 9), toll: 3, keep: ['toll'], hideText: '#toll', eye: [4.5, 1.62, 7.5], at: [4.5, 1, 4] },
  // the four parts a projection can leave, one of each kind, lying together: the game's own part pickups, as a release drops them
  { name: 'parts', floor: 1, rows: grid(9, 9),
    prep: `const { PARTS } = await import('/src/content/parts.ts');
const at = [[4.1, 3.4], [4.6, 3.0], [5.2, 3.6], [5.7, 3.2]];
['flesh', 'heart', 'mind', 'essence'].forEach((kind, i) => g.pickups.add('part', ...W(at[i][0], 0, at[i][1]), g.room, null, 0, PARTS.find(p => p.kind === kind)));
S.sb.step(3);`,
    eye: [4.6, 0.9, 6.0], at: [4.7, 0.2, 3.6] },
  // a boss warmed almost to your side (warmth 0.95, as convert does for a projection), seen from about eight blocks
  { name: 'warm-boss', floor: 1, rows: grid(21, 15), enemies: [{ def: 'resistance', at: [10, 0, 6] }],
    prep: `const e = g.enemies.list.find(x => x.def === 'resistance' && x.alive); e.warmth = 0.95; S.sb.step(1);`,
    eye: [10.5, 1.62, 11], at: [10, 1.3, 6] },
  // a positive missile over lava: the white bomb's light bursts where it lands (the lava is the lesson's water and lava)
  { name: 'white-bomb', floor: 3, rows: grid(11, 9), place: [E('lava', 0, 0, 3, 6, 0, 7)],
    prep: `const n = (x, y, z) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
const [dx, dy, dz] = n(-1, -0.9, -3); g.missiles.launch(...W(5.5, 1.4, 7.5), dx, dy, dz, 'positive'); S.sb.step(24);`,
    eye: [5.5, 1.62, 8.4], at: [4.5, 0.4, 4] },
];

// Real-game lessons: the real game at a fixed seed, driven from its own console (S.floor, S.mastery, S.restart), with the
// camera at a place the game itself made (a laboratory or kitchen tile, the loose loot of the Roots, the rooms' minimap).
// `setup` runs first (async, with S and g), `pose` returns { eye, at } (room-free world coordinates) and optionally
// `only` (the DOM ids to keep, the game canvas hidden) and `clip` (the ids to crop to). No HUD unless the lesson is one.
const SEED = 'ROOTSBOOK';
// the player is set down in the room of the floor's station (the floor streams in around it, as on the way down)
const TO_ROOM = (floor, kind) => `const F = g.floors.get(${floor}), L = F.${kind}; if (!L) throw new Error('no ${kind} on floor ${floor}');
const rr = F.rooms.find(r => r.id === L.room) ?? F.rooms[0];
g.player.spawnAt((rr.x0 + rr.x1 + 1) / 2, rr.y0, (rr.z0 + rr.z1 + 1) / 2);`;
const TO_FLOOR = n => `const F = g.floors.get(${n}); if (!F) throw new Error('no floor ${n}'); const rr = F.rooms[0]; g.player.spawnAt((rr.x0 + rr.x1 + 1) / 2, rr.y0, (rr.z0 + rr.z1 + 1) / 2);`;
// waits in the page until the game has carved floor k (the next floor is carved as the player enters the one above)
const WAIT_FLOOR = k => `await new Promise(r => { const t = setInterval(() => { if (g.floors.get(${k})) { clearInterval(t); r(); } }, 100); setTimeout(() => { clearInterval(t); r(); }, 90000); });`;
const STATION = (kind, floor) => `const F = g.floors.get(${floor}); const L = F.${kind}; if (!L) throw new Error('no ${kind} on floor ${floor}');
const solid = (x, y, z) => g.world.solid(Math.floor(x), Math.floor(y), Math.floor(z));
let best = null;
for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
  let n = 0;
  for (let k = 1; k <= 4; k++) { if (solid(L.x + 0.5 + dx * k, L.y + 1, L.z + 0.5 + dz * k) || solid(L.x + 0.5 + dx * k, L.y + 2, L.z + 0.5 + dz * k)) break; n = k; }
  if (!best || n > best.n) best = { dx, dz, n };
}
return { eye: [L.x + 0.5 + best.dx * 2.6, L.y + 2.62, L.z + 0.5 + best.dz * 2.6], at: [L.x + 0.5, L.y + 1.0, L.z + 0.5] };`;
const REAL = [
  // the laboratory of floor 2 and the kitchen of floor 1: the floor's own tile, seen from 2.6 blocks
  { name: 'alembic', real: true, seed: SEED, setup: [[TO_ROOM(1, 'kitchen'), 1000], [WAIT_FLOOR(2), 2000], [TO_ROOM(2, 'laboratory'), 5000]], pose: STATION('laboratory', 2) },
  { name: 'kitchen', real: true, seed: SEED, setup: TO_ROOM(1, 'kitchen'), pose: STATION('kitchen', 1) },
  // the Roots at mastery 100: the loose keys, bombs and hearts the start room lays out
  { name: 'mastery', real: true, seed: SEED, settle: 4000, setup: `S.mastery(100); S.restart('${SEED}');`, pose: `
const F = g.floors.get(g.depth);
const P = g.pickups.list.filter(p => !p.taken && ['key', 'bomb', 'heart'].includes(p.type));
if (!P.length) throw new Error('no loose keys, bombs or hearts in the Roots');
const byRoom = new Map();
for (const p of P) byRoom.set(p.room, [...(byRoom.get(p.room) ?? []), p]);
const [roomId, list] = [...byRoom.entries()].sort((a, b) => b[1].length - a[1].length)[0];
const rr = F.rooms.find(r => r.id === roomId) ?? { z0: 0, z1: 0 };
const cx = list.reduce((a, p) => a + p.x, 0) / list.length, cy = list.reduce((a, p) => a + p.y, 0) / list.length, cz = list.reduce((a, p) => a + p.z, 0) / list.length;
const zSide = cz - rr.z0 > rr.z1 - cz ? -1 : 1;
g.player.spawnAt(cx, cy, cz + zSide * 3.6);
// the wall panels of the Roots are text in one language: they are hidden from this picture
if (g.tablets) g.tablets.group.visible = false;
return { eye: [cx, cy + 1.6, cz + zSide * 3.6], at: [cx, cy + 0.3, cz] };` },
  // the rooms of the Roots' ring, each walked once so the minimap shows them: the minimap alone, no 3D view
  { name: 'ring', real: true, seed: SEED, dpr: 3, only: ['minimap'], clip: ['#minimap'], setup: `
const F = g.floors.get(g.depth);
for (const rr of F.rooms) { g.player.spawnAt((rr.x0 + rr.x1 + 1) / 2, rr.y0, (rr.z0 + rr.z1 + 1) / 2); for (let i = 0; i < 3; i++) g.step(); }
const r0 = F.rooms[0];
g.player.spawnAt((r0.x0 + r0.x1 + 1) / 2, r0.y0, (r0.z0 + r0.z1 + 1) / 2);
for (let i = 0; i < 10; i++) g.step();`, pose: 'return { eye: [0, 0, 0], at: [0, 0, -1] };' },
];

const WEBP_QUALITY = [0.9, 0.8, 0.7, 0.6, 0.5];
const MAX_BYTES = 60 * 1024;
const OUT = [960, 540];
const FOV = 60;

const only = process.argv.slice(2);
const names = [...LESSONS, ...REAL].map(l => l.name);
for (const a of only) if (!names.includes(a) && !(a in PENDING)) { console.error(`book-captures: unknown image "${a}"`); process.exit(2); }
const jobs = [...LESSONS, ...REAL].filter(l => only.length === 0 || only.includes(l.name));
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
const setScene = async job => {
  const S = window.S, g = S.game;
  S.lang('en');
  g.simulateUnlocked = true;
  if (job.lab) S.sb.lab({ ...job.scenario, ticks: job.lab.ticks, report: [job.lab.ticks], actions: job.lab.actions });
  S.sb.pause(true);
  const rr = g.floors.get(g.depth).rooms[0];
  const o = [rr.x0, rr.y0, rr.z0];
  const W = (x, h, z) => [o[0] + x, o[1] + h, o[2] + z];
  if (job.prep) await new (async () => {}).constructor('S', 'W', 'g', job.prep)(S, W, g);
  if (job.toll) g.hud.openToll(g, job.toll);
  if (job.hideText) { const st = document.createElement('style'); st.textContent = `${job.hideText}, ${job.hideText} * { color: transparent !important; text-shadow: none !important; }`; document.head.appendChild(st); }
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

/** A real-game lesson: the game at its seed, set up and posed from the console, then shot with no HUD unless it keeps one. */
async function captureReal(browser, url, l) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: l.dpr ?? 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  try {
    await page.goto(`${url}?seed=${l.seed}`);
    await page.waitForFunction(() => window.S && window.S.game && window.S.game.player, null, { timeout: 120000, polling: 200 });
    // the game simulates (floors stream and carve as the player goes down) only when it is unlocked, as in the sandbox
    await page.evaluate(() => { window.S.game.simulateUnlocked = true; });
    // each setup step runs in the page, then the game streams for its wait
    const steps = typeof l.setup === 'string' ? [[l.setup, l.wait ?? 2500]] : l.setup;
    for (const [code, wait] of steps) {
      await page.evaluate(async code => { const AF = (async () => {}).constructor; await new AF('S', 'g', code)(window.S, window.S.game); }, code);
      await page.waitForTimeout(wait);
    }
    const clip = await page.evaluate(async ({ pose, only, clips }) => {
      const S = window.S, g = S.game;
      g.simulateUnlocked = true;
      const AF = (async () => {}).constructor;
      const r = await new AF('S', 'g', pose)(S, g);
      g.paused = true;
      const [ex, ey, ez] = r.eye, [ax, ay, az] = r.at;
      const dx = ax - ex, dy = ay - ey, dz = az - ez, horiz = Math.hypot(dx, dz) || 1;
      g.player.spawnAt(ex, ey - 1.62, ez);
      g.player.yaw = Math.atan2(-dx, -dz);
      g.player.pitch = Math.atan2(dy, horiz);
      g.camera.fov = 60; g.camera.updateProjectionMatrix();
      g.hands.scene.children.forEach(c => { c.visible = false; });
      if (only) {
        // only these ids show: the body is hidden, and their chain of parents shows with every other child of it hidden
        document.body.style.visibility = 'hidden';
        document.body.style.background = '#000';
        for (const id of only) {
          const chain = [];
          for (let el = document.getElementById(id); el && el !== document.body; el = el.parentElement) chain.push(el);
          for (const el of chain) {
            el.style.visibility = 'visible';
            for (const c of el.parentElement.children) if (!chain.includes(c)) c.style.visibility = 'hidden';
          }
        }
      } else {
        for (const el of [...document.body.children]) if (el.tagName !== 'SCRIPT' && el.id !== 'game') el.style.display = 'none';
      }
      if (!clips) return null;
      const rs = clips.map(sel => document.querySelector(sel)?.getBoundingClientRect()).filter(Boolean);
      const x0 = Math.min(...rs.map(q => q.left)) - 8, y0 = Math.min(...rs.map(q => q.top)) - 8;
      const x1 = Math.max(...rs.map(q => q.right)) + 8, y1 = Math.max(...rs.map(q => q.bottom)) + 8;
      return { x: Math.max(0, x0), y: Math.max(0, y0), width: x1 - x0, height: y1 - y0 };
    }, { pose: l.pose, only: l.only, clips: l.clip });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    await page.waitForTimeout(l.settle ?? 1500);
    const png = await page.screenshot({ type: 'png', ...(clip ? { clip } : {}) });
    const dpr = l.dpr ?? 1;
    const out = clip ? [Math.round(clip.width * dpr), Math.round(clip.height * dpr)] : OUT;
    const { bytes, q } = await encodeWebp(page, png, out);
    writeFileSync(join(outDir, `${l.name}.webp`), bytes);
    console.log(`+ ${l.name}  ${out[0]}x${out[1]}  ${(bytes.length / 1024).toFixed(1)} KB (quality ${q})${errors.length ? `  (page errors: ${errors.length})` : ''}`);
    if (errors.length) { console.log(errors.slice(0, 3).join('\n')); return 1; }
    return 0;
  } catch (e) {
    console.log(`✗ ${l.name}: ${String(e).split('\n')[0]}\n${errors.slice(0, 3).join('\n')}`);
    return 1;
  } finally {
    await page.close();
  }
}

const server = await createServer({ root, logLevel: 'error', server: { port: 0 } });
await server.listen();
const url = server.resolvedUrls.local[0];
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = 0;
try {
  for (const l of jobs) {
    if (l.real) { failed += await captureReal(browser, url, l); continue; }
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
