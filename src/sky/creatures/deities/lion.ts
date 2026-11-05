// The lion deity, guardian of sky floor 4 (docs/design/not-built/sky/guardians/LION.md, B2–B4; B4 builds it).
// Data for the deity machine (deity.ts) plus the lion's own parts: Basking, the pacing in the air, the glides of
// the Pounce and the Scruff hold (the lion drives its body itself: `anchored` is false), facing the roar, a
// positive hit during a telegraph that softens it, and the Stare-down, a gaze that builds while the player looks
// away and drains spirit only when it is full. Nothing here takes health: every act is a hindrance, a drain
// through the spirit gate or a capture. Every number is the document's target, provisional until the owner tunes it.

import type * as THREE from 'three';
import { pal, type PalToken } from '../../../content/palette';
import type { ModelPart } from '../../../enemies/types';
import { BOB, BOB_HZ, deityOf, reachOf, type Deity } from '../deity';
import { HELP_RANGE } from '../minion';
import {
  CAPTURE_TIME, ExceptionKind, MIN_TELEGRAPH, TELEGRAPH, type AttackDef, type CustomState, type DeityCtx, type DeityDef,
  type DeityRule, type Parts, type Place, type SkyActor, type TelegraphSpec, type Vec3,
} from '../../types';

// ───────────────────────── targets (B2, B3, B3b, B9) ─────────────────────────

/** Watching starts within this distance. */
export const SIGHT = 14;
/** Blocks over the Sunning Ledge. */
export const HOVER = 1;
/** The pacing in the air: blocks each way, blocks a second. */
export const PACE = 3;
export const PACE_SPEED = 1;
/** The least time a basking lion stays curled before it watches. */
export const BASK = 4;
/** Seconds of a glide out (the pounce, the scruff hold): the length of the ring's own warning, so it lands with it. */
export const GLIDE = MIN_TELEGRAPH;
/** Blocks a second on the glide back to the ledge. */
export const RETURN_SPEED = 6;
/** Seconds beside the player before the machine's Recovering (2 s) takes over: 2.5 s in all after a glide. */
export const LANDED = 0.5;

export const ROAR = { speed: 8, reach: 12, hold: 1.5 } as const;
export const CROSSWIND = { seconds: 3, soft: 1, strength: 2.5, radius: 1.5, half: 4 } as const;
export const POUNCE = { ring: 2, height: 0.8, push: 5, short: 1.5, reach: 24 } as const;
export const FLARE = { fan: 15 * Math.PI / 180, strength: 4, over: 2, max: 24 } as const;
export const LONG_GRASS = { radius: 3, seconds: 5, slow: 0.5 } as const;
export const SCRAPE = { depth: 2, keep: 2, seconds: 3, column: 40 } as const;
export const DUSK = { speed: 8, reach: 12, height: 0.8, spirit: 14 } as const;
/** Noon sun: its drain, the shade's reach overhead, and the glare after the yawn (1.0 + 0.2 = the 1.2 s drain telegraph). */
export const NOON = { spirit: 16, shade: 3, glare: 0.2 } as const;
/** Scruff hold: the ring round the player and the lion's stop short of them. */
export const SCRUFF = { ring: 2, short: 0.9 } as const;
/** Stare-down (owner, 2026-11-05, provisional): seconds of looking away, the fall when looking back, the cone that
 *  counts as looking, the drain telegraph at its end, and the drain. */
export const STARE = { build: 5, fall: 1, cone: 30 * Math.PI / 180, warn: 1.2, spirit: 12 } as const;
/** Facing the roar: seconds of aim on the lion during the telegraph that halve the ring (paralysis' AIM_HOLD). */
export const FACE_HOLD = 0.5;

// ───────────────────────── the lion's mind, by actor ─────────────────────────

interface Glide { from: Vec3; to: Vec3; t: number; len: number; out: boolean }

interface Mind {
  deity: Deity;
  /** The last state that was not the Hurt overlay. */
  state: string;
  clock: number;
  pace: number;
  /** Seconds in the current custom state (Basking, Pouncing, Scruffing, Glaring). */
  st: number;
  glide: Glide | null;
  /** Where it hangs after a glide out (beside the player, or against a wall), until it goes home. */
  away: Vec3 | null;
  /** The telegraph seen last, and what the player did during it. */
  tell: TelegraphSpec | null;
  faced: number;
  soothed: boolean;
  stare: number;
  /** The player looked back since the stare last built: the purr plays once. */
  calmed: boolean;
  growl: number;
  motes: number;
  shine: number;
  blink: number;
  /** Allies whose rub has skipped a roar. */
  rubbed: Set<number>;
  noon: Place | null;
  scruffAt: Vec3 | null;
  taken: boolean;
  /** Radians the lion turns to the player. */
  yaw: number;
}

const MINDS = new WeakMap<SkyActor, Mind>();
/** The mind the machine ticked last: the system calls `progress` right after the same deity's update, so the
 *  model reads it once and only then (a lion that did not tick this frame poses at rest). */
let ticked: Mind | null = null;

function mindOf(ctx: DeityCtx): Mind {
  let m = MINDS.get(ctx.deity);
  if (!m) {
    const deity = deityOf(ctx.deity);
    if (!deity) throw new Error('the lion has no machine');
    // the lion paces and glides: it moves its own body from the first tick on
    deity.anchored = false;
    m = {
      deity, state: ctx.deity.state, clock: 0, pace: 0, st: 0, glide: null, away: null, tell: null, faced: 0,
      soothed: false, stare: 0, calmed: true, growl: 0, motes: 0, shine: 0, blink: 0, rubbed: new Set(), noon: null,
      scruffAt: null, taken: false, yaw: 0,
    };
    MINDS.set(ctx.deity, m);
  }
  return m;
}

/** A new telegraph resets what the player did during the last one. */
function syncTell(m: Mind) {
  const tell = m.deity.telegraphing;
  if (tell !== null && tell !== m.tell) { m.faced = 0; m.soothed = false; }
  m.tell = tell;
}

// ───────────────────────── reading the floor ─────────────────────────

const unit = (x: number, z: number): [number, number] => { const l = Math.hypot(x, z); return l > 1e-6 ? [x / l, z / l] : [1, 0]; };
const headOf = (b: SkyActor['body']): Vec3 => ({ x: b.x, y: b.y + b.h * 0.62, z: b.z });
const LEDGES: readonly Place['kind'][] = ['ledge', 'seat', 'top', 'nest'];

/** The place of the plan whose top the player stands on (within a block of its height), of these kinds. */
export function placeOfPlayer(ctx: DeityCtx, kinds: readonly Place['kind'][] = LEDGES): Place | null {
  const b = ctx.host.player().body;
  let best: Place | null = null;
  for (const p of ctx.plan.graph.places) {
    if (!kinds.includes(p.kind)) continue;
    const x0 = p.x - ((p.w - 1) >> 1), x1 = p.x + (p.w >> 1), z0 = p.z - ((p.d - 1) >> 1), z1 = p.z + (p.d >> 1);
    if (b.x < x0 || b.x >= x1 + 1 || b.z < z0 || b.z >= z1 + 1 || Math.abs(b.y - p.y) > 1) continue;
    if (!best || Math.abs(b.y - p.y) < Math.abs(b.y - best.y)) best = p;
  }
  return best;
}

/** Whether the player's aim holds `at` within `cone` radians of the view's centre. */
export function looksAt(ctx: DeityCtx, at: Vec3, cone: number): boolean {
  const pl = ctx.host.player();
  const dx = at.x - pl.eye.x, dy = at.y - pl.eye.y, dz = at.z - pl.eye.z;
  const d = Math.hypot(dx, dy, dz), a = Math.hypot(pl.aim.x, pl.aim.y, pl.aim.z);
  if (d < 1e-6 || a < 1e-6) return false;
  return (dx * pl.aim.x + dy * pl.aim.y + dz * pl.aim.z) / (d * a) >= Math.cos(cone);
}

/** No solid cell between the lion's eyes and the player's (a block, a ledge or the thorn tree's trunk breaks it). */
export function inSightLine(ctx: DeityCtx): boolean {
  const w = ctx.host.world(), e = headOf(ctx.deity.body), p = ctx.host.player().eye;
  const n = Math.max(1, Math.ceil(Math.hypot(p.x - e.x, p.y - e.y, p.z - e.z) / 0.25));
  for (let k = 2; k < n - 1; k++) {
    const t = k / n;
    if (w.solid(Math.floor(e.x + (p.x - e.x) * t), Math.floor(e.y + (p.y - e.y) * t), Math.floor(e.z + (p.z - e.z) * t))) return false;
  }
  return true;
}

/** A point of a glide: straight across; on the way out it keeps high and drops at the end (it pounces from
 *  above, clear of its own ledge's edge), on the way back it rises first. */
function glidePoint(a: Vec3, b: Vec3, u: number, out: boolean): Vec3 {
  const v = out ? u * u * u : 1 - (1 - u) ** 3;
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * v, z: a.z + (b.z - a.z) * u };
}

/** Where a glide from `from` to `to` ends: before the first solid cell in its path (a wall of player blocks stops
 *  it there, as the built charge stops at a block), or at `to`. */
export function glideEnd(ctx: DeityCtx, from: Vec3, to: Vec3): { at: Vec3; wall: boolean } {
  const w = ctx.host.world();
  const n = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.z - from.z) / 0.25));
  let last = from;
  for (let k = 1; k <= n; k++) {
    const q = glidePoint(from, to, k / n, true);
    for (const dy of [0.25, 1]) {
      if (w.solid(Math.floor(q.x), Math.floor(q.y + dy), Math.floor(q.z))) return { at: last, wall: true };
    }
    last = q;
  }
  return { at: to, wall: false };
}

function startGlide(m: Mind, from: Vec3, to: Vec3, len: number, out: boolean) {
  m.glide = { from: { ...from }, to: { ...to }, t: 0, len: Math.max(0.05, len), out };
  m.away = out ? { ...to } : null;
}

/** An ally of the pride rubbing its head on the lion: each one skips the next roar once (B4). */
function allyRubs(ctx: DeityCtx, m: Mind): boolean {
  const d = ctx.deity.body;
  for (const a of ctx.minions) {
    if (a.side !== 'ally' || m.rubbed.has(a.id)) continue;
    if (Math.hypot(a.body.x - d.x, a.body.z - d.z) > HELP_RANGE || Math.abs(a.body.y - d.y) > d.h + HELP_RANGE) continue;
    m.rubbed.add(a.id);
    return true;
  }
  return false;
}

/** A softened telegraph: the attack goes out in a huff. */
function huff(ctx: DeityCtx) {
  const b = ctx.deity.body;
  ctx.host.fx('puff', b.x, b.y + b.h * 0.6, b.z, 4);
  ctx.host.cue('lion.huff', b.x, b.y + b.h, b.z);
}

const feetLevel = (ctx: DeityCtx): number =>
  placeOfPlayer(ctx, [...LEDGES, 'ground', 'spawn', 'route'])?.y ?? Math.floor(ctx.host.player().body.y + 1e-3);

// ───────────────────────── the attacks (B3, B3b) ─────────────────────────

const tell = (part: string, pose: string, cue: string): TelegraphSpec => ({ tell: part, pose, cue: `lion.${cue}` });

/** 1. Roar (paralysis): a ring round the lion, spreading at the level of the ground the player stands on. */
export const roar: AttackDef = {
  id: 'roar', stage: 0, telegraph: tell('mane', 'lift', 'roar'),
  act(ctx) {
    const m = mindOf(ctx);
    if (m.soothed || allyRubs(ctx, m)) { huff(ctx); return; }
    const b = ctx.deity.body;
    ctx.hinder('paralysis', { from: { x: b.x, y: feetLevel(ctx), z: b.z }, speed: ROAR.speed, radius: ROAR.reach * reachOf(ctx, roar), hold: ROAR.hold });
  },
};

/** 2. Crosswind (wind): a gust across the player's ledge toward its nearest edge. */
export const crosswind: AttackDef = {
  id: 'crosswind', stage: 0, telegraph: tell('tail', 'lash', 'whistle'),
  act(ctx) {
    const m = mindOf(ctx), pb = ctx.host.player().body;
    const place = placeOfPlayer(ctx);
    let dir: [number, number];
    if (place) {
      const x0 = place.x - ((place.w - 1) >> 1), x1 = place.x + (place.w >> 1) + 1;
      const z0 = place.z - ((place.d - 1) >> 1), z1 = place.z + (place.d >> 1) + 1;
      const edges: [number, [number, number]][] = [[pb.x - x0, [-1, 0]], [x1 - pb.x, [1, 0]], [pb.z - z0, [0, -1]], [z1 - pb.z, [0, 1]]];
      edges.sort((a, c) => a[0] - c[0]);
      dir = edges[0][1];
    } else {
      dir = unit(pb.x - ctx.deity.body.x, pb.z - ctx.deity.body.z);
    }
    const y = pb.y + pb.h / 2;
    ctx.hinder('wind', {
      from: { x: pb.x - dir[0] * CROSSWIND.half, y, z: pb.z - dir[1] * CROSSWIND.half },
      to: { x: pb.x + dir[0] * CROSSWIND.half, y, z: pb.z + dir[1] * CROSSWIND.half },
      radius: CROSSWIND.radius, strength: CROSSWIND.strength, seconds: m.soothed ? CROSSWIND.soft : CROSSWIND.seconds,
    });
  },
};

/** 3. Pounce: the lion glides to the player's ledge and lands beside them; the landing ring pushes. */
export const pounce: AttackDef = {
  id: 'pounce', stage: 1, telegraph: tell('body', 'crouch', 'crouch'),
  act(ctx) {
    const m = mindOf(ctx), b = ctx.deity.body, pb = ctx.host.player().body;
    const [ux, uz] = unit(b.x - pb.x, b.z - pb.z);
    const want = { x: pb.x + ux * POUNCE.short, y: pb.y + 0.5, z: pb.z + uz * POUNCE.short };
    if (Math.hypot(want.x - b.x, want.z - b.z) > POUNCE.reach) { huff(ctx); return; }
    const from = { x: b.x, y: b.y, z: b.z };
    const end = glideEnd(ctx, from, want);
    startGlide(m, from, end.at, GLIDE, true);
    if (!m.soothed && !end.wall) {
      ctx.hinder('lion-ring', { from: { x: end.at.x, y: pb.y, z: end.at.z }, speed: ROAR.speed, radius: POUNCE.ring, height: POUNCE.height, push: POUNCE.push });
    }
    ctx.host.cue('lion.leap', b.x, b.y, b.z);
    ctx.go('Pouncing');
  },
};

/** 4. Mane flare: three sun bolts in a fan, each a push along its line; a block in the line stops it. */
export const maneFlare: AttackDef = {
  id: 'mane-flare', stage: 2, telegraph: tell('mane', 'fluff', 'flare'),
  act(ctx) {
    const b = ctx.deity.body, pb = ctx.host.player().body, from = headOf(b);
    const a0 = Math.atan2(pb.z - b.z, pb.x - b.x);
    const r = Math.min(FLARE.max, Math.hypot(pb.x - b.x, pb.z - b.z) + FLARE.over);
    for (const da of [-FLARE.fan, 0, FLARE.fan]) {
      ctx.hinder('knockback', { from, shape: 'line', radius: r, dir: { x: Math.cos(a0 + da), y: 0, z: Math.sin(a0 + da) }, strength: FLARE.strength });
    }
  },
};

/** 5. Long grass (dense ground): the top cells round the player's cell, never past the ledge's edge nor on a placed block. */
export const longGrass: AttackDef = {
  id: 'long-grass', stage: 0, telegraph: tell('body', 'sink', 'rustle'),
  act(ctx) {
    const w = ctx.host.world(), pb = ctx.host.player().body;
    const cx = Math.floor(pb.x), cz = Math.floor(pb.z), y = Math.floor(pb.y - 0.05);
    const cells: number[] = [];
    const r = LONG_GRASS.radius;
    for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dz * dz > r * r) continue;
      const x = cx + dx, z = cz + dz;
      if (!w.solid(x, y, z) || w.solid(x, y + 1, z)) continue;
      const i = w.idx(x, y, z);
      if (w.kindAt(i) === ExceptionKind.Placed) continue;
      cells.push(i);
    }
    if (cells.length === 0) { huff(ctx); return; }
    ctx.hinder('dense-ground', { cells, seconds: LONG_GRASS.seconds, slow: LONG_GRASS.slow });
  },
};

/** The strip of the player's ledge on the lion's side, `SCRAPE.depth` deep, down its rock's column; null when the
 *  far side could not keep `SCRAPE.keep` by `SCRAPE.keep` cells (Scrape is then not played: the lion huffs). */
export function scrapeCells(ctx: DeityCtx): number[] | null {
  const place = placeOfPlayer(ctx, ['ledge', 'top', 'seat']);
  if (!place || place.tag === 0) return null;
  const w = ctx.host.world(), b = ctx.deity.body;
  const x0 = place.x - ((place.w - 1) >> 1), x1 = place.x + (place.w >> 1);
  const z0 = place.z - ((place.d - 1) >> 1), z1 = place.z + (place.d >> 1);
  const dx = b.x - (place.x + 0.5), dz = b.z - (place.z + 0.5);
  const alongX = Math.abs(dx) >= Math.abs(dz);
  const across = alongX ? place.w : place.d;
  if (across - SCRAPE.depth < SCRAPE.keep || (alongX ? place.d : place.w) < SCRAPE.keep) return null;
  const cells: number[] = [];
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const inStrip = alongX
      ? (dx > 0 ? x > x1 - SCRAPE.depth : x < x0 + SCRAPE.depth)
      : (dz > 0 ? z > z1 - SCRAPE.depth : z < z0 + SCRAPE.depth);
    if (!inStrip) continue;
    for (let y = place.y - 1, k = 0; k < SCRAPE.column && w.solid(x, y, z) && w.layout.tagAt(x, y, z) === place.tag; y--, k++) {
      cells.push(w.idx(x, y, z));
    }
  }
  return cells.length > 0 ? cells : null;
}

/** 7. Scrape (fading platforms): the strip on the lion's side turns to mist, then reforms. */
export const scrape: AttackDef = {
  id: 'scrape', stage: 1, telegraph: tell('legHL', 'rake', 'tick'),
  act(ctx) {
    const cells = scrapeCells(ctx);
    if (!cells) { huff(ctx); return; }
    ctx.hinder('fading-platforms', { tags: [], cells, seconds: SCRAPE.seconds });
  },
};

/** 8. Dusk call: three rings, from the Sunning Ledge and each shade rock; any ring that touches drains once. */
export const duskCall: AttackDef = {
  id: 'dusk-call', stage: 1, spirit: DUSK.spirit, telegraph: tell('body', 'chest', 'breath'),
  act(ctx) {
    const m = mindOf(ctx), s = ctx.plan.seat;
    const sources: Vec3[] = [{ x: s.x + 0.5, y: s.y, z: s.z + 0.5 }];
    if (!m.soothed) for (const p of ctx.plan.spawns) sources.push({ x: p.x + 0.5, y: p.y, z: p.z + 0.5 });
    const radius = DUSK.reach * reachOf(ctx, duskCall);
    for (const from of sources) {
      ctx.hinder('lion-ring', { from, speed: DUSK.speed, radius, height: DUSK.height, push: 0, touch: () => ctx.drain(DUSK.spirit) });
    }
  },
};

/** Whether the player stands in the sun on `place`: on its top, with no solid block within `NOON.shade` above. */
export function inSun(ctx: DeityCtx, place: Place): boolean {
  const w = ctx.host.world(), pb = ctx.host.player().body;
  if (!pb.onGround || placeOfPlayer(ctx, [place.kind]) !== place || Math.abs(pb.y - place.y) > 0.6) return false;
  const x = Math.floor(pb.x), y = Math.floor(pb.y + 1e-3), z = Math.floor(pb.z);
  for (let k = 1; k <= NOON.shade; k++) if (w.solid(x, y + k, z)) return false;
  return true;
}

/** 9. Noon sun: the glare on the player's ledge; whoever is still in the sun when it ends drains. */
export const noonSun: AttackDef = {
  id: 'noon-sun', stage: 2, spirit: NOON.spirit, telegraph: tell('head', 'yawn', 'hum'),
  act(ctx) {
    const m = mindOf(ctx);
    // played only where a drop, a shade or a neighbouring ledge is open: on the plain there is no drop to take
    m.noon = placeOfPlayer(ctx);
    if (!m.noon || m.soothed) { m.noon = null; huff(ctx); return; }
    ctx.go('Glaring');
  },
};

/** 10. Scruff hold: a glide to the player and a ring that closes round them; inside it, they are captured. */
export const scruffHold: AttackDef = {
  id: 'scruff-hold', stage: 2, telegraph: tell('body', 'crouch', 'purr'),
  act(ctx) {
    const m = mindOf(ctx), b = ctx.deity.body, pb = ctx.host.player().body;
    m.scruffAt = null;
    m.taken = false;
    if (m.soothed) { huff(ctx); return; }
    const [ux, uz] = unit(b.x - pb.x, b.z - pb.z);
    const want = { x: pb.x + ux * SCRUFF.short, y: pb.y + 0.3, z: pb.z + uz * SCRUFF.short };
    if (Math.hypot(want.x - b.x, want.z - b.z) > POUNCE.reach) { huff(ctx); return; }
    const from = { x: b.x, y: b.y, z: b.z };
    const end = glideEnd(ctx, from, want);
    startGlide(m, from, end.at, GLIDE, true);
    if (!end.wall) {
      m.scruffAt = { x: pb.x, y: pb.y, z: pb.z };
      ctx.hinder('paralysis', { from: m.scruffAt, speed: SCRUFF.ring / 0.1, radius: SCRUFF.ring, hold: CAPTURE_TIME });
    }
    ctx.host.cue('lion.leap', b.x, b.y, b.z);
    ctx.go('Scruffing');
  },
};

export const LION_ATTACKS: readonly AttackDef[] = [roar, crosswind, longGrass, pounce, scrape, duskCall, maneFlare, noonSun, scruffHold];

// ───────────────────────── states ─────────────────────────

/** Basking replaces Idle: curled in the sun, at least `BASK` seconds, until the player is within sight. */
const basking: CustomState = {
  name: 'Basking', replaces: 'Idle',
  enter: ctx => { mindOf(ctx).st = 0; },
  tick: (ctx, dt) => { mindOf(ctx).st += dt; },
  next: ctx => (mindOf(ctx).st >= BASK && ctx.distance() <= SIGHT ? 'Watching' : null),
};

/** Beside the player after a glide out, then the machine's Recovering (2 s more). */
const landed = (name: string, tick?: (ctx: DeityCtx, m: Mind) => void): CustomState => ({
  name,
  enter: ctx => { mindOf(ctx).st = 0; },
  tick: (ctx, dt) => { const m = mindOf(ctx); m.st += dt; tick?.(ctx, m); },
  next: ctx => (mindOf(ctx).st >= GLIDE + LANDED ? 'Recovering' : null),
});

const pouncing = landed('Pouncing');

const scruffing = landed('Scruffing', (ctx, m) => {
  const c = m.scruffAt;
  if (!c || m.taken || m.st < GLIDE + 0.1) return;
  const pl = ctx.host.player();
  if (!pl.held || Math.hypot(pl.body.x - c.x, pl.body.z - c.z) > SCRUFF.ring + 0.3) return;
  // held where they stand by the ring that closed: the lion takes them by the scruff, and keeps one practice
  m.taken = true;
  if (ctx.host.takeRandomPractice()) ctx.host.toast('toast.skyLionScruff');
  ctx.host.cue('lion.purr', c.x, c.y + 1, c.z);
});

/** The glare after the yawn: the end of Noon sun's warning; at its end, the sun drains a player still in it. */
const glaring: CustomState = {
  name: 'Glaring',
  enter: ctx => { const m = mindOf(ctx); m.st = 0; m.shine = 0; },
  tick: (ctx, dt) => {
    const m = mindOf(ctx);
    m.st += dt;
    m.shine -= dt;
    if (m.noon && m.shine <= 0) { m.shine += 0.1; glare(ctx, m.noon); }
  },
  next: ctx => {
    const m = mindOf(ctx);
    if (m.st < NOON.glare) return null;
    if (m.noon && !m.soothed && inSun(ctx, m.noon)) ctx.drain(NOON.spirit);
    m.noon = null;
    return 'Recovering';
  },
};

/** The light on a ledge turns white-gold: a shimmer over each of its top cells in the sun. */
function glare(ctx: DeityCtx, place: Place) {
  const w = ctx.host.world();
  const x0 = place.x - ((place.w - 1) >> 1), z0 = place.z - ((place.d - 1) >> 1);
  for (let x = x0; x < x0 + place.w; x++) for (let z = z0; z < z0 + place.d; z++) {
    let shade = false;
    for (let k = 1; k <= NOON.shade; k++) if (w.solid(x, place.y + k, z)) shade = true;
    if (!shade) ctx.host.fx('shimmer', x + 0.5, place.y + 0.05, z + 0.5, 1);
  }
}

// ───────────────────────── rules ─────────────────────────

/** The lion's own rule: the body (basking, pacing, glides), the telegraph's answers, and the Stare-down. */
const lionRule: DeityRule = {
  id: 'lion',
  tick(ctx, dt) {
    const m = mindOf(ctx);
    ticked = m;
    m.clock += dt;
    const st = ctx.deity.state;
    if (st !== 'Hurt') m.state = st;
    syncTell(m);
    const b = ctx.deity.body;
    const looking = looksAt(ctx, headOf(b), STARE.cone);
    // facing the roar: the player's aim on the lion during its telegraph
    if (looking && (m.tell === roar.telegraph || m.tell === duskCall.telegraph)) m.faced += dt;
    if (m.tell === noonSun.telegraph) {
      m.shine -= dt;
      const place = placeOfPlayer(ctx);
      if (place && m.shine <= 0) { m.shine += 0.25; glare(ctx, place); }
    }
    stare(ctx, m, dt, looking);
    moveBody(ctx, m, dt);
    const pb = ctx.host.player().body;
    m.yaw = Math.atan2(pb.x - b.x, pb.z - b.z);
    if (m.blink > 0) m.blink = Math.max(0, m.blink - dt);
  },
  // a positive hit during a telegraph softens the attack; one while the stare builds makes the lion blink and look away
  worth(ctx) {
    const m = mindOf(ctx);
    syncTell(m);
    if (m.deity.telegraphing !== null || m.state === 'Glaring') m.soothed = true;
    if (m.stare > 0) { m.stare = 0; m.blink = 0.3; }
    return 1;
  },
  scale(ctx, attack) {
    if (attack !== roar && attack !== duskCall) return 1;
    return mindOf(ctx).faced >= FACE_HOLD ? 0.5 : 1;
  },
};

/** The Stare-down (B3b 6): builds while the player looks away in the lion's line of sight, holds when the line is
 *  broken or the player is held, falls back when they look; full, it drains through the gate and starts again.
 *  A refused drain (the gate's spacing) keeps the stare full, its warning showing, until the gate allows it. */
function stare(ctx: DeityCtx, m: Mind, dt: number, looking: boolean) {
  if (m.deity.won) { m.stare = 0; return; }
  const eye = headOf(ctx.deity.body), pl = ctx.host.player();
  if (looking) {
    if (m.stare > 0 && !m.calmed) { m.calmed = true; ctx.host.cue('lion.purr', eye.x, eye.y, eye.z); }
    m.stare = Math.max(0, m.stare - dt * STARE.build / STARE.fall);
    return;
  }
  if (m.state !== 'Watching' || pl.held || !inSightLine(ctx)) return;
  m.calmed = false;
  const was = m.stare;
  m.stare = Math.min(STARE.build, m.stare + dt);
  m.growl -= dt;
  if (m.growl <= 0) { m.growl += 1; ctx.host.cue('lion.growl', eye.x, eye.y, eye.z); }
  if (was < STARE.build - STARE.warn && m.stare >= STARE.build - STARE.warn) ctx.host.cue('lion.flare', eye.x, eye.y, eye.z);
  // the lines from the eyes: motes along the stare, more of them as it builds
  m.motes -= dt;
  if (m.motes <= 0) {
    m.motes += 0.3;
    const n = 1 + Math.floor(m.stare);
    for (let k = 1; k <= n; k++) {
      const t = k / (n + 1);
      ctx.host.fx('motes', eye.x + (pl.eye.x - eye.x) * t, eye.y + (pl.eye.y - eye.y) * t, eye.z + (pl.eye.z - eye.z) * t, 1);
    }
  }
  if (m.stare >= STARE.build && m.deity.drainNow(STARE.spirit)) {
    m.stare = 0;
    ctx.host.cue('lion.stare', eye.x, eye.y, eye.z);
  }
}

/** The lion's body: a glide when one runs, hanging where it landed while it recovers there, else home over the
 *  Sunning Ledge, pacing in the air while it watches, with the levitation's bob. */
function moveBody(ctx: DeityCtx, m: Mind, dt: number) {
  const b = ctx.deity.body, s = ctx.plan.seat;
  const bob = BOB * Math.sin(2 * Math.PI * BOB_HZ * m.clock);
  const beside = m.state === 'Pouncing' || m.state === 'Scruffing' || m.state === 'Recovering';
  if (!beside && m.away) {
    // back to the ledge along the same line
    const home = { x: s.x + 0.5 + paceOffset(m), y: s.y + HOVER, z: s.z + 0.5 };
    startGlide(m, { x: b.x, y: b.y, z: b.z }, home, Math.hypot(home.x - b.x, home.y - b.y, home.z - b.z) / RETURN_SPEED, false);
  }
  if (m.glide) {
    const g = m.glide;
    g.t = Math.min(g.len, g.t + dt);
    const q = glidePoint(g.from, g.to, g.t / g.len, g.out);
    b.x = q.x; b.y = q.y; b.z = q.z;
    if (g.t >= g.len) m.glide = null;
  } else if (m.away) {
    b.x = m.away.x; b.z = m.away.z; b.y = m.away.y + bob;
  } else {
    if (m.state === 'Watching') m.pace += dt * PACE_SPEED;
    const tx = s.x + 0.5 + paceOffset(m), tz = s.z + 0.5, ty = s.y + HOVER + bob;
    const dx = tx - b.x, dy = ty - b.y, dz = tz - b.z, d = Math.hypot(dx, dy, dz);
    const k = d > 1e-9 ? Math.min(1, (RETURN_SPEED * dt) / d) : 1;
    b.x += dx * k; b.y += dy * k; b.z += dz * k;
  }
  b.vx = 0; b.vy = 0; b.vz = 0;
  b.onGround = false;
}

/** The pacing: a triangle wave, `PACE` blocks each way along the ledge's x, at `PACE_SPEED`. */
function paceOffset(m: Mind): number {
  const period = 4 * PACE;
  const u = ((m.pace % period) + period) % period;
  return u < PACE ? u : u < 3 * PACE ? 2 * PACE - u : u - 4 * PACE;
}

/** What the lion's mind holds now, for tests and the debug readout. */
export function lionReadout(d: SkyActor): { stare: number; faced: number; soothed: boolean; away: boolean } | null {
  const m = MINDS.get(d);
  return m ? { stare: m.stare, faced: m.faced, soothed: m.soothed, away: m.away !== null || m.glide !== null } : null;
}

// ───────────────────────── the model (docs/art/sky/lion.md, pending owner review) ─────────────────────────

const T = 1 / 16;
const c = (t: PalToken) => pal(t);

/** A plush lion: a small soft body (16 texels wide) under a giant head whose mane is 36 texels across (2.25 times),
 *  framed as a sunburst by four rays. Everything hangs from `body`, so the whole lion turns to face the player.
 *  About 3 blocks tall. */
export const LION_BODY: readonly ModelPart[] = [
  { name: 'body', size: [16 * T, 14 * T, 20 * T], pos: [0, 12 * T, 0], color: c('plush.lion.felt.base') },
  { name: 'belly', parent: 'body', size: [12 * T, 4 * T, 16 * T], pos: [0, -6 * T, 0], color: c('plush.lion.felt.hi') },
  { name: 'legFL', parent: 'body', size: [5 * T, 6 * T, 5 * T], pos: [-5 * T, -9 * T, 7 * T], color: c('plush.lion.felt.dark') },
  { name: 'legFR', parent: 'body', size: [5 * T, 6 * T, 5 * T], pos: [5 * T, -9 * T, 7 * T], color: c('plush.lion.felt.dark') },
  { name: 'legHL', parent: 'body', size: [5 * T, 6 * T, 5 * T], pos: [-5 * T, -9 * T, -7 * T], color: c('plush.lion.felt.dark') },
  { name: 'legHR', parent: 'body', size: [5 * T, 6 * T, 5 * T], pos: [5 * T, -9 * T, -7 * T], color: c('plush.lion.felt.dark') },
  { name: 'tail', parent: 'body', size: [2 * T, 2 * T, 10 * T], pos: [0, 2 * T, -15 * T], color: c('plush.lion.felt.dark') },
  { name: 'tuft', parent: 'tail', size: [4 * T, 4 * T, 4 * T], pos: [0, 0, -6 * T], color: c('plush.lion.mane.dark') },
];

export const LION_HEAD: readonly ModelPart[] = [
  { name: 'head', parent: 'body', size: [24 * T, 22 * T, 20 * T], pos: [0, 18 * T, 8 * T], color: c('plush.lion.felt.base') },
  { name: 'mane', parent: 'head', size: [36 * T, 34 * T, 10 * T], pos: [0, T, -7 * T], color: c('plush.lion.mane.base') },
  { name: 'ray', parent: 'mane', size: [8 * T, 8 * T, 8 * T], pos: [-16 * T, 15 * T, 0], rot: [0, 0, Math.PI / 4], color: c('plush.lion.mane.dark') },
  { name: 'ray', parent: 'mane', size: [8 * T, 8 * T, 8 * T], pos: [16 * T, 15 * T, 0], rot: [0, 0, Math.PI / 4], color: c('plush.lion.mane.dark') },
  { name: 'ray', parent: 'mane', size: [8 * T, 8 * T, 8 * T], pos: [-16 * T, -15 * T, 0], rot: [0, 0, Math.PI / 4], color: c('plush.lion.mane.dark') },
  { name: 'ray', parent: 'mane', size: [8 * T, 8 * T, 8 * T], pos: [16 * T, -15 * T, 0], rot: [0, 0, Math.PI / 4], color: c('plush.lion.mane.dark') },
  { name: 'earL', parent: 'head', size: [6 * T, 6 * T, 4 * T], pos: [-8 * T, 12 * T, 2 * T], color: c('plush.lion.felt.dark') },
  { name: 'earR', parent: 'head', size: [6 * T, 6 * T, 4 * T], pos: [8 * T, 12 * T, 2 * T], color: c('plush.lion.felt.dark') },
  { name: 'muzzle', parent: 'head', size: [14 * T, 8 * T, 4 * T], pos: [0, -6 * T, 12 * T], color: c('plush.lion.muzzle') },
  { name: 'nose', parent: 'muzzle', size: [6 * T, 3 * T, 2 * T], pos: [0, 2 * T, 2 * T], color: c('plush.lion.nose'), inlay: true },
  { name: 'eyeL', parent: 'head', size: [4 * T, 4 * T, T], pos: [-6 * T, 3 * T, 10 * T + T / 2], color: c('plush.lion.eye'), inlay: true },
  { name: 'eyeR', parent: 'head', size: [4 * T, 4 * T, T], pos: [6 * T, 3 * T, 10 * T + T / 2], color: c('plush.lion.eye'), inlay: true },
];

/** What the model shows: the telegraph's pose, the state, the stare and the hits. */
export interface LionPose {
  /** hits / target, 0 → 1: the mane, wide and bristling, lies softer and softer (B4). */
  ratio: number;
  /** The telegraph's pose (`TelegraphSpec.pose`), or null. */
  pose: string | null;
  state: string;
  /** 0 → 1 of the stare; in its last warning the eyes flare and the mane brightens. */
  stare: number;
  blink: number;
  yaw: number;
  clock: number;
}

const BODY_Y = 12 * T;

/** Poses the parts of a lion model (pure: the same pose gives the same parts). */
export function poseLion(parts: Parts, p: LionPose) {
  const body = parts.get('body'), head = parts.get('head'), mane = parts.get('mane'), tail = parts.get('tail');
  if (!body || !head || !mane || !tail) return;
  let maneK = 1.12 - 0.14 * Math.min(1, Math.max(0, p.ratio));
  let bodyY = BODY_Y, bodySy = 1, headTilt = 0, tailYaw = 0, tailPitch = 0.3, legRake = 0;
  // slow motions only: nothing here moves faster than 2 Hz
  const flick = Math.sin(p.clock * 2 * Math.PI * 0.8);
  switch (p.pose) {
    case 'lift': maneK *= 1.2; break;
    case 'fluff': maneK *= 1.3; break;
    case 'lash': tailYaw = 0.7 * Math.sin(p.clock * 2 * Math.PI * 1.8); break;
    case 'crouch': bodySy = 0.82; bodyY -= 2 * T; headTilt = 0.15; tailPitch = 0.6; break;
    case 'sink': bodyY -= 4 * T; tailYaw = 0.25 * flick; break;
    case 'rake': legRake = -0.6 * Math.abs(Math.sin(p.clock * 2 * Math.PI)); break;
    case 'chest': bodySy = 1.1; maneK *= 1.1; headTilt = -0.15; break;
    case 'yawn': headTilt = -0.4; break;
    default:
      if (p.state === 'Basking') { headTilt = 0.3; tailYaw = 0.35 * flick; }
      else if (p.state === 'Recovering') headTilt = 0.25;
      else if (p.state === 'Hurt') maneK *= 1.15;
  }
  const warn = STARE.warn / STARE.build;
  const flare = Math.max(0, (p.stare - (1 - warn)) / warn);
  if (p.stare > 0) maneK *= 1 + 0.08 * p.stare;
  body.position.y = bodyY;
  body.scale.set(1, bodySy, 1);
  body.rotation.y = p.state === 'Basking' ? 0 : p.yaw;
  head.rotation.x = headTilt;
  mane.scale.set(maneK, maneK, 1);
  tail.rotation.set(tailPitch, tailYaw, 0);
  parts.get('legHL')?.rotation.set(legRake, 0, 0);
  parts.get('legHR')?.rotation.set(legRake, 0, 0);
  const eyeH = p.blink > 0 ? 0.2 : 1 + 0.5 * flare;
  for (const e of [parts.get('eyeL'), parts.get('eyeR')]) e?.scale.set(1 + 0.5 * flare, eyeH, 1);
  // the mane brightens in the stare's last warning: the mane's own lighter felt, never the light's gold
  const mat = (mane as THREE.Mesh).material as THREE.MeshLambertMaterial | undefined;
  mat?.color?.setHex(pal(flare > 0 ? 'plush.lion.mane.hi' : 'plush.lion.mane.base'));
}

// ───────────────────────── the deity ─────────────────────────

export const lionDeity: DeityDef = {
  animal: 'lion', floor: 4,
  hits: 42,
  telegraph: TELEGRAPH[3],
  recover: 2,
  rest: [3, 2.5, 2],
  sight: SIGHT,
  hover: HOVER,
  teleport: false,
  attacks: LION_ATTACKS,
  states: [basking, pouncing, scruffing, glaring],
  rules: [lionRule],
  // B4: an ally adds a hit every 5 s while it stays; the floor's cap is a third of the target (provisional)
  ally: { act: 'rub', every: 5, cap: 14 },
  knock: 'paw',
  won: {
    toast: 'toast.skyLionWon',
    // its attitude changes (provisional, owner 2026-11-03): the pride lies down (its wild minions go Calm, minion.ts),
    // the stare ends, and the lion settles over its ledge, purring
    play: ctx => {
      const b = ctx.deity.body;
      mindOf(ctx).stare = 0;
      ctx.host.fx('gold', b.x, b.y + b.h * 0.6, b.z, 12);
      ctx.host.cue('lion.purr', b.x, b.y + b.h, b.z);
    },
  },
  model: {
    body: LION_BODY,
    head: LION_HEAD,
    hw: 18 * T,
    h: 3,
    progress: (parts, ratio) => {
      const m = ticked;
      ticked = null;
      poseLion(parts, {
        ratio,
        pose: m?.deity.telegraphing?.pose ?? (m?.state === 'Glaring' ? 'yawn' : null),
        state: m?.state ?? 'Basking',
        stare: m ? m.stare / STARE.build : 0,
        blink: m?.blink ?? 0,
        yaw: m?.yaw ?? 0,
        clock: m?.clock ?? 0,
      });
    },
  },
};
