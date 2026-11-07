// The elephant deity, guardian of sky floor 3 (docs/design/not-built/sky/guardians/ELEPHANT.md B2–B4, B3b).
//
// A great grey head on a small plush body, floating one block over the Basin. Everything here is data run by the
// deity machine (src/sky/creatures/deity.ts) and small functions that read the plan and the player:
//
//   - Memory (B2): where the player stood longest in the last 10 s. Trunk spray, Memory stone and Dust bath aim there.
//   - Listening (B2): the ears fan open for 1.5 s when the player climbs onto a new level.
//   - The rim (B2): a hit counts only when the player's eye sees the small body over the rim, or the head while the
//     trunk is raised (Trunk spray, Trumpet, Trunk lift). Anything else puffs.
//   - Ten attacks (B3 and B3b), by stage. The deity's telegraph (1.1 s) is the body's tell and its sound; an attack
//     that runs a hindrance then shows that hindrance's own warning before it acts. The marks of the attacks that
//     need no hindrance (Memory stone, Dust bath, Low rumble, Heavy water, Trunk lift) are drawn from the first frame
//     of the telegraph, and each lands after the doc's longer telegraph: 0.2 s more for a drain, 0.5 s for the capture.
//   - Recovering is the long drink (Drinking, 2.5 s): the model shows the trunk down in the pool.
//
// Nothing here takes health. Drains go through ctx.drain (the spirit gate); the capture holds the player and takes
// one practice. Everything is stepped by dt, with no randomness of its own, so a fixed dt repeats exactly.

import type * as THREE from 'three';
import { MAT } from '../../../content/materials';
import { pal } from '../../../content/palette';
import type { MarkPaint, Shape as HazardShape } from '../../../enemies/attacks';
import type { ModelPart } from '../../../enemies/types';
import type { MessageKey } from '../../../i18n/locales/en';
import { hazardOwner } from '../../hindrances/runner';
import {
  CAPTURE_TIME, ExceptionKind, TELEGRAPH, type AttackDef, type Cell, type Channel, type CustomState, type DeityCtx,
  type DeityDef, type DeityRule, type Parts, type SkyActor, type SkyCue, type Vec3,
} from '../../types';

// ───────────────────────── numbers (ELEPHANT.md B2–B4, B9: every one a target) ─────────────────────────

export const HITS = 36;
export const RECOVER = 2.5;
export const REST: readonly [number, number, number] = [3, 2.5, 2];
/** Levitation over the seat (the water line): the small body hangs from 27, the head reaches about 30. */
export const HOVER = 1;
/** The whole hall: the elephant hears the floor (radius 24) from its Basin. */
export const SIGHT = 30;
export const LISTENING = 'Listening';
export const LISTEN = 1.5;
/** Memory: the last 10 s, sampled every 0.1 s. */
export const MEMORY = 10;
const MEMORY_STEP = 0.1;
/** Speed per block of a push (knock.ts: about one block of slide for each 2.5). */
const PER_BLOCK = 2.5;
/** Within this horizontal distance of the axis: the rim (radius 4) and 7 blocks beyond it. */
export const TRUNK_REACH = 11;
export const SPRAY_SECONDS = 6;
export const SPRAY_PUSH = 3;
export const SWAT_BLOCKS = 3;
export const STONE_SECONDS = 8;
export const TRUMPET_BLOCKS = 1.5;
/** The trunk stays raised (the head open to hits) this long after a spray or a trumpet. */
export const RAISED_AFTER = 1.5;
export const MUD_RADIUS = 2;
export const MUD_SECONDS = 5;
export const MUD_SLOW = 0.5;
export const DUST_RADIUS = 2;
export const DUST_SPIRIT = 16;
export const FAN_SECONDS = 2.5;
export const FAN_SPEED = 2.5;
export const RUMBLE_SPIRIT = 12;
export const RUMBLE_SPEED = 7;
export const HEAVY_SPIRIT = 14;
/** Cells a second the grey runs down a bed (provisional: the doc gives no speed). */
export const HEAVY_SPEED = 4;
export const LIFT_RADIUS = 2;
/** A capture comes at most once every 30 s (guardians §6.6). */
export const CAPTURE_GAP = 30;
/** The doc's telegraphs beyond the floor's 1.1 s: a drain 0.2 s longer, the capture 0.5 s (guardians §6.6). */
export const DRAIN_EXTRA = 0.2;
export const CAPTURE_EXTRA = 0.5;
/** A synthetic bed (no channels built yet): cells along the terrace through the aim, starting this far before it. */
const BED_BEFORE = 2;
const BED_LENGTH = 8;
/** The tusk line's angle round the axis, the (+, +) diagonal: where the low rumble starts. */
const TUSK_ANGLE = Math.PI / 4;
/** A block overhead within this many cells shelters the player from what falls (lobs stop at solid blocks). */
const ROOF = 8;

const MARK_PAINT: MarkPaint = { tell: 'sky.elephant.mark', live: 'plush.elephant.dark', reach: 'sky.elephant.mark', motes: ['sky.elephant.mark', 'plush.elephant.hi'] };
const DUST_PAINT: MarkPaint = { tell: 'mat.palestone.dark', live: 'mat.palestone.outline', reach: 'mat.palestone.dark', motes: ['mat.palestone.hi', 'mat.palestone.base'] };
const RUMBLE_PAINT: MarkPaint = { tell: 'plush.elephant.dark', live: 'plush.elephant.eye', reach: 'plush.elephant.dark', motes: ['plush.elephant.body', 'plush.elephant.dark'] };
const HEAVY_PAINT: MarkPaint = { tell: 'sky.elephant.heavy', live: 'plush.elephant.dark', reach: 'sky.elephant.heavy', motes: ['sky.elephant.heavy', 'plush.elephant.dark'] };
export const ELEPHANT_PAINTS: readonly MarkPaint[] = [MARK_PAINT, DUST_PAINT, RUMBLE_PAINT, HEAVY_PAINT];

export const WON_TOAST: MessageKey = 'toast.sky3.won';
export const LIFT_TOAST: MessageKey = 'toast.sky3.lift';

// ───────────────────────── the mind: what one elephant remembers and has under way ─────────────────────────

export type ElephantAttack = 'trunk-spray' | 'trunk-swat' | 'memory-stone' | 'trumpet' | 'mud-wallow' | 'dust-bath' | 'ear-fan'
  | 'low-rumble' | 'heavy-water' | 'trunk-lift';

/** One telegraph on show: its attack, where it aims, and whether a positive hit on the deity answered it. */
interface Run { attack: AttackDef; kind: ElephantAttack; aim: Vec3; bed: Channel | null; answered: boolean; owner: number }

type Pending =
  | { kind: 'dust-bath'; at: Vec3; left: number; owner: number }
  | { kind: 'low-rumble'; r: number; y: number; angle: number; travelled: number; left: number; drained: boolean; mote: number }
  | { kind: 'heavy-water'; bed: Cell[]; front: number; left: number; drained: boolean; owner: number }
  | { kind: 'trunk-lift'; at: Vec3; left: number; cancelled: boolean; owner: number };

export interface ElephantMind {
  clock: number;
  /** Memory: one feet-cell key per sample (−1 while airborne), oldest first. */
  samples: number[];
  sampleT: number;
  /** The player's standing level when last seen (Listening fires when it changes). */
  level: number | null;
  run: Run | null;
  pending: Pending[];
  /** Transient stones the elephant dropped (restored when it is won). */
  stones: number[];
  raisedUntil: number;
  lastCapture: number;
  /** Host time until which the herd stops for the trumpet (the minions read it). */
  trumpetUntil: number;
  rallying: boolean;
  /** The pose the model shows (a state or a telegraph's pose) and for how long. */
  pose: string;
  poseT: number;
  yaw: number;
}

const MINDS = new WeakMap<SkyActor, ElephantMind>();

export function mindOf(d: SkyActor): ElephantMind {
  let m = MINDS.get(d);
  if (!m) {
    m = {
      clock: 0, samples: [], sampleT: 0, level: null, run: null, pending: [], stones: [], raisedUntil: -Infinity,
      lastCapture: -Infinity, trumpetUntil: -Infinity, rallying: false, pose: 'Idle', poseT: 0, yaw: 0,
    };
    MINDS.set(d, m);
  }
  return m;
}

/** The mind the model poses from: the elephant that ticked last (there is one elephant deity per realm). */
let LIVE: ElephantMind | null = null;

// ───────────────────────── geometry of the floor ─────────────────────────

const axisOf = (ctx: DeityCtx) => ({ x: ctx.plan.seat.x + 0.5, z: ctx.plan.seat.z + 0.5 });

function feetOf(ctx: DeityCtx): Vec3 {
  const b = ctx.host.player().body;
  return { x: b.x, y: b.y, z: b.z };
}

/** The centre of a feet cell. */
const centre = (x: number, y: number, z: number): Vec3 => ({ x: x + 0.5, y, z: z + 0.5 });

function radiusOf(ctx: DeityCtx, p: { x: number; z: number }): number {
  const a = axisOf(ctx);
  return Math.hypot(p.x - a.x, p.z - a.z);
}

/** The unit direction from the axis to a point (+x at the axis itself). */
function outward(ctx: DeityCtx, p: { x: number; z: number }): [number, number] {
  const a = axisOf(ctx);
  const dx = p.x - a.x, dz = p.z - a.z, d = Math.hypot(dx, dz);
  return d > 1e-6 ? [dx / d, dz / d] : [1, 0];
}

/** A solid block over the player's head within ROOF cells (a lob, dust or a trunk from above stops on it). */
function roofed(ctx: DeityCtx): boolean {
  const b = ctx.host.player().body, w = ctx.host.world();
  const x = Math.floor(b.x), z = Math.floor(b.z), y0 = Math.floor(b.y + b.h);
  for (let y = y0; y < y0 + ROOF; y++) if (w.solid(x, y, z)) return true;
  return false;
}

/** A feet cell that stands on ground: not solid, with a solid cell under it. */
function standable(ctx: DeityCtx, x: number, y: number, z: number): boolean {
  const w = ctx.host.world();
  return !w.solid(x, y, z) && w.solid(x, y - 1, z);
}

/**
 * The bed through a point: one of the plan's channels when the floor has them (the channel whose bed passes
 * nearest, within 3), or else a synthetic bed of feet cells along the terrace through the point (the floor's
 * channels are not built yet, F3): up to BED_LENGTH cells clockwise round the axis, from BED_BEFORE before it.
 */
export function bedThrough(ctx: DeityCtx, at: Vec3): Channel | null {
  const channels = ctx.plan.extra?.channels ?? [];
  let best: Channel | null = null, bestD = 3;
  for (const ch of channels) for (const [x, , z] of ch.bed) {
    const d = Math.hypot(x + 0.5 - at.x, z + 0.5 - at.z);
    if (d < bestD) { bestD = d; best = ch; }
  }
  if (best) return best;
  const [ox, oz] = outward(ctx, at);
  const tx = -oz, tz = ox;
  const y = Math.floor(at.y + 0.01);
  const bed: Cell[] = [];
  for (let k = -BED_BEFORE; k < BED_LENGTH - BED_BEFORE; k++) {
    const x = Math.floor(at.x + tx * k), z = Math.floor(at.z + tz * k);
    const last = bed[bed.length - 1];
    if (last && last[0] === x && last[2] === z) continue;
    if (!standable(ctx, x, y, z)) {
      if (k < 0) { bed.length = 0; continue; }
      break;
    }
    bed.push([x, y, z]);
  }
  return bed.length >= 2 ? { id: -1, head: bed[0], bed, nest: -1 } : null;
}

/** The ground cells round a point on its own level, within `r` (the patch of mud); never a player block, never wet. */
export function patchAt(ctx: DeityCtx, at: Vec3, r: number): number[] {
  const w = ctx.host.world();
  const y = Math.floor(at.y + 0.01) - 1;
  const out: number[] = [];
  const x0 = Math.floor(at.x - r), x1 = Math.floor(at.x + r), z0 = Math.floor(at.z - r), z1 = Math.floor(at.z + r);
  for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
    if (Math.hypot(x + 0.5 - at.x, z + 0.5 - at.z) > r + 0.01) continue;
    if (!w.solid(x, y, z) || w.solid(x, y + 1, z) || w.elemAt(x, y + 1, z) !== 0) continue;
    const i = w.idx(x, y, z);
    if (w.kindAt(i) === ExceptionKind.Placed) continue;
    out.push(i);
  }
  return out;
}

/** The feet cell of the player now, or of the ground under them. */
function groundOf(ctx: DeityCtx): Vec3 {
  const b = ctx.host.player().body, w = ctx.host.world();
  const x = Math.floor(b.x), z = Math.floor(b.z);
  let y = Math.floor(b.y + 0.01);
  for (let k = 0; k < 6 && !w.solid(x, y - 1, z); k++) y--;
  return centre(x, y, z);
}

// ───────────────────────── Memory ─────────────────────────

/** A feet cell as one non-negative number (no world needed: Memory only counts where the player stood). */
const SPAN = 8192, OFF = 4096;
const keyOf = (x: number, y: number, z: number) => ((x + OFF) * SPAN + (y + OFF)) * SPAN + (z + OFF);

function sample(ctx: DeityCtx, m: ElephantMind, dt: number) {
  m.sampleT += dt;
  const b = ctx.host.player().body;
  while (m.sampleT >= MEMORY_STEP - 1e-9) {
    m.sampleT -= MEMORY_STEP;
    m.samples.push(b.onGround ? keyOf(Math.floor(b.x), Math.floor(b.y + 0.01), Math.floor(b.z)) : -1);
    if (m.samples.length > Math.round(MEMORY / MEMORY_STEP)) m.samples.shift();
  }
}

/** Where the player stood longest in the last 10 s; a tie goes to the later place. Null before any sample. */
export function remembered(ctx: DeityCtx, m: ElephantMind = mindOf(ctx.deity)): Vec3 | null {
  const count = new Map<number, number>();
  const last = new Map<number, number>();
  m.samples.forEach((k, i) => {
    if (k < 0) return;
    count.set(k, (count.get(k) ?? 0) + 1);
    last.set(k, i);
  });
  let best = -1, bestN = 0, bestLast = -1;
  for (const [k, n] of count) {
    const l = last.get(k) ?? -1;
    if (n > bestN || (n === bestN && l > bestLast)) { best = k; bestN = n; bestLast = l; }
  }
  if (best < 0) return null;
  return centre(Math.floor(best / (SPAN * SPAN)) - OFF, (Math.floor(best / SPAN) % SPAN) - OFF, (best % SPAN) - OFF);
}

// ───────────────────────── marks (hazards in the sky's tints never strike) ─────────────────────────

function sketch(ctx: DeityCtx, owner: number, shapes: readonly HazardShape[], lead: number, live: number, paint: MarkPaint) {
  const hz = ctx.host.hazards();
  for (const shape of shapes) hz.add(owner, 'neutral', 'sky', { lead, live, damage: 0, shape, tint: paint });
}

const ringAt = (p: Vec3, r: number): HazardShape => ({ kind: 'ring', x: p.x, y: p.y, z: p.z, r, grow: 0, width: 0.15, height: 0.4 });

/** The seconds of telegraph still to run, plus the attack's own extra. */
function leadOf(ctx: DeityCtx, extra: number): number {
  return Math.max(0, ctx.def.telegraph - ctx.deity.t) + extra;
}

// ───────────────────────── the run: what each telegraph aims at and draws ─────────────────────────

function begin(ctx: DeityCtx, m: ElephantMind, attack: AttackDef) {
  const kind = attack.id as ElephantAttack;
  const player = groundOf(ctx);
  const memory = remembered(ctx, m) ?? player;
  const owner = hazardOwner();
  const run: Run = { attack, kind, aim: player, bed: null, answered: false, owner };
  switch (kind) {
    case 'trunk-spray':
      run.aim = memory;
      run.bed = bedThrough(ctx, memory);
      if (run.bed) {
        const [hx, hy, hz] = run.bed.head;
        ctx.host.fx('motes', hx + 0.5, hy + 0.3, hz + 0.5, 4);
      }
      break;
    case 'memory-stone':
      run.aim = memory;
      sketch(ctx, owner, [ringAt(memory, 0.6)], leadOf(ctx, 0), 0.4, MARK_PAINT);
      break;
    case 'dust-bath':
      run.aim = memory;
      sketch(ctx, owner, [ringAt(memory, DUST_RADIUS)], leadOf(ctx, DRAIN_EXTRA), 0.5, DUST_PAINT);
      break;
    case 'low-rumble': {
      // the ring along the player's terrace: drawn round the axis at their radius, on their level
      const a = axisOf(ctx);
      sketch(ctx, owner, [ringAt({ x: a.x, y: player.y, z: a.z }, radiusOf(ctx, player))], leadOf(ctx, DRAIN_EXTRA), 0.3, RUMBLE_PAINT);
      break;
    }
    case 'heavy-water': {
      run.bed = bedThrough(ctx, player);
      const bed = run.bed?.bed ?? [];
      if (bed.length >= 2) {
        const [x0, y, z0] = bed[0], [x1, , z1] = bed[bed.length - 1];
        sketch(ctx, owner, [{ kind: 'line', x0: x0 + 0.5, z0: z0 + 0.5, x1: x1 + 0.5, z1: z1 + 0.5, y, width: 0.3 }], leadOf(ctx, DRAIN_EXTRA), 0.5, HEAVY_PAINT);
      }
      break;
    }
    case 'trunk-lift':
      sketch(ctx, owner, [ringAt(player, LIFT_RADIUS)], leadOf(ctx, CAPTURE_EXTRA), 0.3, RUMBLE_PAINT);
      break;
    default:
      break;
  }
  m.run = run;
}

/** Whether the trunk is up now: the head is open to hits (B2, the rim). */
export function trunkRaised(m: ElephantMind): boolean {
  const k = m.run?.kind;
  if (k === 'trunk-spray' || k === 'trumpet' || k === 'trunk-lift') return true;
  if (m.pending.some(p => p.kind === 'trunk-lift' && !p.cancelled)) return true;
  return m.clock < m.raisedUntil;
}

/** The attacks a positive hit on the deity answers during their telegraph (B3 Trumpet, B3b Ear fan, Low rumble, Trunk lift). */
const ANSWERED_ON_BODY: ReadonlySet<ElephantAttack> = new Set<ElephantAttack>(['trumpet', 'ear-fan', 'low-rumble', 'trunk-lift']);

// ───────────────────────── what lands after the telegraph ─────────────────────────

function advance(ctx: DeityCtx, m: ElephantMind, dt: number) {
  const keep: Pending[] = [];
  for (const p of m.pending) if (step(ctx, m, p, dt)) keep.push(p);
  m.pending = keep;
}

/** One tick of something under way; false once it is done. */
function step(ctx: DeityCtx, m: ElephantMind, p: Pending, dt: number): boolean {
  const host = ctx.host, b = host.player().body;
  if (p.kind === 'dust-bath') {
    p.left -= dt;
    if (p.left > 1e-9) return true;
    host.fx('motes', p.at.x, p.at.y + 0.5, p.at.z, 10);
    host.hazards().clear(p.owner);
    const inside = Math.hypot(b.x - p.at.x, b.z - p.at.z) <= DUST_RADIUS + b.hw && Math.abs(b.y - p.at.y) <= 1.5;
    if (inside && !roofed(ctx)) ctx.drain(DUST_SPIRIT);
    return false;
  }
  if (p.kind === 'low-rumble') {
    if (p.left > 1e-9) { p.left -= dt; return true; }
    const a = axisOf(ctx);
    const before = p.angle;
    const turn = (RUMBLE_SPEED / Math.max(1, p.r)) * dt;
    p.angle += turn;
    p.travelled += turn;
    p.mote -= dt;
    if (p.mote <= 0) {
      p.mote += 0.1;
      host.fx('motes', a.x + Math.cos(p.angle) * p.r, p.y + 0.2, a.z + Math.sin(p.angle) * p.r, 2);
    }
    if (!p.drained) {
      // the edge passes the player when their angle lies in the arc it swept this tick
      const pa = Math.atan2(b.z - a.z, b.x - a.x);
      const ahead = (((pa - before) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      if (ahead <= turn) {
        p.drained = true;
        if (onOriginalGround(ctx, p.y)) ctx.drain(RUMBLE_SPIRIT);
      }
    }
    return p.travelled < 2 * Math.PI;
  }
  if (p.kind === 'heavy-water') {
    if (p.left > 1e-9) { p.left -= dt; return true; }
    const w = host.world();
    const prev = Math.floor(p.front);
    p.front += HEAVY_SPEED * dt;
    const to = Math.min(p.bed.length - 1, Math.floor(p.front));
    for (let k = prev; k <= to; k++) {
      const [x, y, z] = p.bed[k];
      // a dam (any block in the bed) stops the grey there
      if (w.solid(x, y, z)) { host.hazards().clear(p.owner); return false; }
      host.fx('puff', x + 0.5, y + 0.2, z + 0.5, 2);
      if (!p.drained && b.onGround && Math.floor(b.x) === x && Math.floor(b.z) === z && Math.floor(b.y + 0.01) === y) {
        p.drained = true;
        ctx.drain(HEAVY_SPIRIT);
      }
    }
    if (p.front >= p.bed.length) { host.hazards().clear(p.owner); return false; }
    return true;
  }
  // the trunk lift: the ring closes
  p.left -= dt;
  if (p.left > 1e-9 && !p.cancelled) return true;
  host.hazards().clear(p.owner);
  if (p.cancelled) return false;
  const inside = Math.hypot(b.x - p.at.x, b.z - p.at.z) <= 1 && Math.abs(b.y - p.at.y) <= 1.2;
  if (inside && !roofed(ctx) && !host.player().held) capture(ctx, m);
  return false;
}

/** On the terrace's original ground at level y, or in its dry beds: grounded, not on a player block, not in water. */
function onOriginalGround(ctx: DeityCtx, y: number): boolean {
  const b = ctx.host.player().body, w = ctx.host.world();
  if (!b.onGround) return false;
  const x = Math.floor(b.x), z = Math.floor(b.z), fy = Math.floor(b.y + 0.01);
  if (fy !== Math.floor(y + 0.01)) return false;
  if (w.elemAt(x, fy, z) !== 0) return false;
  return w.kindAt(w.idx(x, fy - 1, z)) !== ExceptionKind.Placed;
}

/** The trunk curls round the player: held for CAPTURE_TIME and one practice taken (guardians §6.6). */
function capture(ctx: DeityCtx, m: ElephantMind) {
  const host = ctx.host, b = host.player().body;
  m.lastCapture = m.clock;
  host.player().hold(CAPTURE_TIME);
  host.takeRandomPractice();
  host.fx('motes', b.x, b.y + 1, b.z, 8);
  host.cue('elephant.lift', b.x, b.y + 1, b.z);
  host.toast(LIFT_TOAST);
}

// ───────────────────────── the attacks ─────────────────────────

const tell = (part: string, pose: string, cue: string): AttackDef['telegraph'] => ({ tell: part, pose, cue: `elephant.${cue}` as SkyCue });

const runOf = (ctx: DeityCtx): Run | null => mindOf(ctx.deity).run;

/** A muffled or answered attack: the ears fold back with a few motes, and nothing else happens. */
function foldBack(ctx: DeityCtx) {
  const b = ctx.deity.body;
  ctx.host.fx('motes', b.x, b.y + b.h * 0.7, b.z, 4);
}

/** The gust's line: along the terrace (tangent to the axis), toward the nearest channel axis (the spouts are on the four axes). */
function fanDirection(ctx: DeityCtx, p: Vec3): [number, number] {
  const a = axisOf(ctx);
  const th = Math.atan2(p.z - a.z, p.x - a.x);
  const target = Math.round(th / (Math.PI / 2)) * (Math.PI / 2);
  const s = target >= th ? 1 : -1;
  return [-Math.sin(th) * s, Math.cos(th) * s];
}

/** The radius of the wall the player's terrace stands against (the inner edge of their ring), or 3 short of them. */
function innerEdge(ctx: DeityCtx, p: Vec3): number {
  const a = axisOf(ctx), w = ctx.host.world();
  const [ox, oz] = outward(ctx, p);
  const r0 = radiusOf(ctx, p), y = Math.floor(p.y + 0.01);
  for (let r = r0; r > 0; r -= 0.5) if (w.solid(Math.floor(a.x + ox * r), y, Math.floor(a.z + oz * r))) return r;
  return Math.max(0, r0 - 3);
}

/** Memory stone: a one-block stone lands on the remembered place (or on the first block over it) for 8 s. */
function dropStone(ctx: DeityCtx, m: ElephantMind, at: Vec3) {
  const w = ctx.host.world(), host = ctx.host, b = host.player().body;
  const x = Math.floor(at.x), z = Math.floor(at.z);
  let y = Math.floor(ctx.deity.body.y + ctx.deity.body.h);
  while (y > ctx.plan.y0 && !w.solid(x, y - 1, z)) y--;
  // it lands on the player: a push, never harm (decided, owner, 2026-11-03), and no stone inside them
  if (Math.abs(b.x - (x + 0.5)) < 0.5 + b.hw && Math.abs(b.z - (z + 0.5)) < 0.5 + b.hw && b.y < y + 1 && b.y + b.h > y) {
    const [ox, oz] = outward(ctx, b);
    host.player().push(ox * PER_BLOCK, PER_BLOCK * 0.5, oz * PER_BLOCK);
    host.fx('puff', x + 0.5, y + 0.5, z + 0.5, 6);
    host.cue('elephant.thud', x + 0.5, y, z + 0.5);
    return;
  }
  if (w.solid(x, y, z)) return;
  if (w.setTransient(x, y, z, MAT.palestone, host.time() + STONE_SECONDS, ctx.deity.id)) {
    m.stones.push(w.idx(x, y, z));
    host.fx('pop', x + 0.5, y + 0.5, z + 0.5);
    host.cue('elephant.thud', x + 0.5, y, z + 0.5);
  }
}

export const ELEPHANT_ATTACKS: readonly AttackDef[] = [
  {
    id: 'trunk-spray', stage: 0, telegraph: tell('trunk', 'curl-up', 'water'),
    act(ctx) {
      const m = mindOf(ctx.deity);
      m.raisedUntil = m.clock + RAISED_AFTER;
      const channel = runOf(ctx)?.bed ?? bedThrough(ctx, groundOf(ctx));
      if (channel) ctx.hinder('water-currents', { channel, seconds: SPRAY_SECONDS, push: SPRAY_PUSH });
    },
  },
  {
    id: 'trunk-swat', stage: 0, telegraph: tell('trunk', 'swing-back', 'swat'),
    act(ctx) {
      const p = feetOf(ctx);
      if (radiusOf(ctx, p) > TRUNK_REACH) { foldBack(ctx); return; }
      const [ox, oz] = outward(ctx, p);
      const from = { x: p.x - ox * 0.5, y: p.y + 0.5, z: p.z - oz * 0.5 };
      ctx.hinder('knockback', { from, shape: 'line', radius: 1.5, dir: { x: ox, y: 0, z: oz }, strength: SWAT_BLOCKS * PER_BLOCK });
    },
  },
  {
    id: 'mud-wallow', stage: 0, telegraph: tell('trunk', 'blow', 'squelch'),
    act(ctx) {
      const cells = patchAt(ctx, groundOf(ctx), MUD_RADIUS);
      if (cells.length) ctx.hinder('dense-ground', { cells, seconds: MUD_SECONDS, slow: MUD_SLOW });
    },
  },
  {
    id: 'dust-bath', stage: 0, spirit: DUST_SPIRIT, telegraph: tell('trunk', 'sweep', 'hiss'),
    act(ctx) {
      const run = runOf(ctx);
      mindOf(ctx.deity).pending.push({ kind: 'dust-bath', at: run?.aim ?? groundOf(ctx), left: DRAIN_EXTRA, owner: run?.owner ?? hazardOwner() });
    },
  },
  {
    id: 'memory-stone', stage: 1, telegraph: tell('trunk', 'lift-stone', 'stone'),
    act(ctx) {
      dropStone(ctx, mindOf(ctx.deity), runOf(ctx)?.aim ?? groundOf(ctx));
    },
  },
  {
    id: 'ear-fan', stage: 1, telegraph: tell('ears', 'beat', 'whoosh'),
    act(ctx) {
      if (runOf(ctx)?.answered) { foldBack(ctx); return; }
      const p = feetOf(ctx);
      const [dx, dz] = fanDirection(ctx, p);
      const y = p.y + 0.9;
      ctx.hinder('wind', {
        from: { x: p.x - dx * 3, y, z: p.z - dz * 3 }, to: { x: p.x + dx * 4, y, z: p.z + dz * 4 },
        radius: 1.2, strength: FAN_SPEED, seconds: FAN_SECONDS,
      });
    },
  },
  {
    id: 'low-rumble', stage: 1, spirit: RUMBLE_SPIRIT, telegraph: tell('trunk', 'press', 'rumble'),
    act(ctx) {
      if (runOf(ctx)?.answered) { foldBack(ctx); return; }
      const p = groundOf(ctx);
      mindOf(ctx.deity).pending.push({
        kind: 'low-rumble', r: radiusOf(ctx, p), y: p.y, angle: TUSK_ANGLE, travelled: 0, left: DRAIN_EXTRA, drained: false, mote: 0,
      });
    },
  },
  {
    id: 'trumpet', stage: 2, telegraph: tell('trunk', 'raise', 'trumpet'),
    act(ctx) {
      const m = mindOf(ctx.deity);
      m.raisedUntil = m.clock + RAISED_AFTER;
      m.trumpetUntil = ctx.host.time() + 2;
      const b = ctx.deity.body;
      // muffled: the ring still sounds, but it does not push
      if (runOf(ctx)?.answered) { foldBack(ctx); return; }
      const p = feetOf(ctx);
      const [ox, oz] = outward(ctx, p);
      const r = innerEdge(ctx, p) + 0.6;
      ctx.host.fx('motes', b.x, b.y + b.h, b.z, 6);
      ctx.hinder('knockback', {
        from: { x: ctx.plan.seat.x + 0.5 + ox * r, y: Math.floor(p.y + 0.01) + 0.5, z: ctx.plan.seat.z + 0.5 + oz * r },
        shape: 'ring', radius: 6, strength: TRUMPET_BLOCKS * PER_BLOCK,
      });
    },
  },
  {
    id: 'heavy-water', stage: 2, spirit: HEAVY_SPIRIT, telegraph: tell('head', 'lower', 'toll'),
    act(ctx) {
      const run = runOf(ctx);
      const bed = run?.bed?.bed ?? [];
      if (bed.length < 2) return;
      mindOf(ctx.deity).pending.push({ kind: 'heavy-water', bed: [...bed], front: 0, left: DRAIN_EXTRA, drained: false, owner: run?.owner ?? hazardOwner() });
    },
  },
  {
    id: 'trunk-lift', stage: 2, telegraph: tell('tip', 'reach', 'note'),
    act(ctx) {
      const m = mindOf(ctx.deity), run = runOf(ctx);
      const owner = run?.owner ?? hazardOwner();
      const at = run?.aim ?? groundOf(ctx);
      const late = m.clock - m.lastCapture < CAPTURE_GAP;
      if (run?.answered || late || ctx.host.player().held || radiusOf(ctx, at) > TRUNK_REACH) {
        ctx.host.hazards().clear(owner);
        foldBack(ctx);
        return;
      }
      m.pending.push({ kind: 'trunk-lift', at, left: CAPTURE_EXTRA, cancelled: false, owner });
    },
  },
];

// ───────────────────────── the rules and the guard ─────────────────────────

const memoryRule: DeityRule = {
  id: 'memory',
  tick(ctx, dt) {
    const m = mindOf(ctx.deity);
    m.clock += dt;
    sample(ctx, m, dt);
    const a = ctx.attack ?? null;
    if (!a) m.run = null;
    else if (!m.run || m.run.attack !== a) begin(ctx, m, a);
    advance(ctx, m, dt);
    // the trumpet of a rally: the herd stops and turns to the waterhole (B5 rule 5)
    const state = ctx.deity.state;
    if (state !== 'Hurt') {
      const rallying = state === 'Rallying';
      if (rallying && !m.rallying) {
        m.trumpetUntil = ctx.host.time() + 2;
        const b = ctx.deity.body;
        ctx.host.cue('elephant.trumpet', b.x, b.y + b.h, b.z);
      }
      m.rallying = rallying;
    }
    const name = m.run ? m.run.attack.telegraph.pose : state;
    if (name !== m.pose) { m.pose = name; m.poseT = 0; } else m.poseT += dt;
    const p = ctx.host.player().body, b = ctx.deity.body;
    m.yaw = Math.atan2(p.x - b.x, p.z - b.z);
    LIVE = m;
  },
  aim(ctx) { return remembered(ctx); },
};

/** Listening: the player climbs onto a new level while the elephant waits; its ears fan open (B2). */
const listenRule: DeityRule = {
  id: 'listen',
  tick(ctx) {
    const m = mindOf(ctx.deity), b = ctx.host.player().body;
    if (!b.onGround) return;
    const level = Math.floor(b.y + 0.01);
    const was = m.level;
    m.level = level;
    if (was === null || was === level || ctx.attack) return;
    if (ctx.deity.state === 'Watching' || ctx.deity.state === 'Idle') ctx.go(LISTENING);
  },
};

const LISTENING_STATE: CustomState = {
  name: LISTENING,
  next: ctx => (ctx.deity.t >= LISTEN ? 'Watching' : null),
};

/** No solid block between the player's eye and the point (the end cells do not count). */
export function inLine(ctx: DeityCtx, to: Vec3): boolean {
  const eye = ctx.host.player().eye, w = ctx.host.world();
  const n = Math.max(1, Math.ceil(Math.hypot(to.x - eye.x, to.y - eye.y, to.z - eye.z) / 0.2));
  const ex = Math.floor(eye.x), ey = Math.floor(eye.y), ez = Math.floor(eye.z);
  const tx = Math.floor(to.x), ty = Math.floor(to.y), tz = Math.floor(to.z);
  for (let k = 1; k < n; k++) {
    const t = k / n;
    const x = Math.floor(eye.x + (to.x - eye.x) * t), y = Math.floor(eye.y + (to.y - eye.y) * t), z = Math.floor(eye.z + (to.z - eye.z) * t);
    if ((x === ex && y === ey && z === ez) || (x === tx && y === ty && z === tz)) continue;
    if (w.solid(x, y, z)) return false;
  }
  return true;
}

/** The small body's centre and the head's upper half, for the rim's line (the model's boxes, feet at the body's y). */
export const BODY_Y = 0.7;
export const HEAD_Y = 2.5;

/**
 * The rim: true (the hit puffs) unless the player's eye sees the small body over the rim, or the head while the
 * trunk is raised. A positive hit on the deity also answers the telegraph on show when that attack's answer is on
 * the body (Trumpet, Ear fan, Low rumble, Trunk lift: muffled, folded back, lifted, curled back).
 */
export function rimGuard(d: SkyActor, ctx: DeityCtx): boolean {
  const m = mindOf(d);
  if (!m.run && ctx.attack) begin(ctx, m, ctx.attack);
  if (m.run && ANSWERED_ON_BODY.has(m.run.kind) && !m.run.answered) {
    m.run.answered = true;
    if (m.run.kind === 'trunk-lift') ctx.host.hazards().clear(m.run.owner);
  }
  for (const p of m.pending) if (p.kind === 'trunk-lift') p.cancelled = true;
  const b = d.body;
  if (inLine(ctx, { x: b.x, y: b.y + BODY_Y, z: b.z })) return false;
  return !(trunkRaised(m) && inLine(ctx, { x: b.x, y: b.y + HEAD_Y, z: b.z }));
}

// ───────────────────────── won (section 6: it sets its weight down) ─────────────────────────

function settle(ctx: DeityCtx) {
  const m = mindOf(ctx.deity), w = ctx.host.world(), hz = ctx.host.hazards();
  if (m.run) hz.clear(m.run.owner);
  for (const p of m.pending) if ('owner' in p) hz.clear(p.owner);
  m.pending = [];
  m.run = null;
  // the stones it dropped dissolve with the weight it set down
  for (const i of m.stones) if (w.kindAt(i) === ExceptionKind.Transient) w.restore(i);
  m.stones = [];
  const b = ctx.deity.body;
  ctx.host.fx('gold', b.x, b.y + b.h / 2, b.z, 12);
  ctx.host.cue('elephant.settle', b.x, b.y + b.h, b.z);
}

// ───────────────────────── the model (docs/art/sky/elephant.md, pending owner review) ─────────────────────────

const part = (name: string, size: ModelPart['size'], pos: ModelPart['pos'], color: number, more: Partial<ModelPart> = {}): ModelPart =>
  ({ name, size, pos, color, ...more });

/**
 * A small plush body (one block wide) under a head 2.2 times as wide, ears like sails with a mauve felt inside, a
 * trunk of three segments hanging from a pivot under the face, two short ivory tusks, small dark eyes. Feet at the
 * origin; the face toward +z; every part is a child of the body, so turning the body turns the elephant. Every box
 * is a whole number of texels (1/16).
 */
const BODY: ModelPart[] = [
  part('body', [1, 0.875, 1.125], [0, 0.6875, 0], pal('plush.elephant.body')),
  part('legFL', [0.3125, 0.3125, 0.3125], [-0.3125, -0.4375, 0.375], pal('plush.elephant.dark'), { parent: 'body' }),
  part('legFR', [0.3125, 0.3125, 0.3125], [0.3125, -0.4375, 0.375], pal('plush.elephant.dark'), { parent: 'body' }),
  part('legBL', [0.3125, 0.3125, 0.3125], [-0.3125, -0.4375, -0.375], pal('plush.elephant.dark'), { parent: 'body' }),
  part('legBR', [0.3125, 0.3125, 0.3125], [0.3125, -0.4375, -0.375], pal('plush.elephant.dark'), { parent: 'body' }),
];
const HEAD: ModelPart[] = [
  part('head', [2.1875, 1.6875, 1.5], [0, 1.3125, 0.25], pal('plush.elephant.body'), { parent: 'body' }),
  part('brow', [1.875, 0.25, 0.0625], [0, 0.5, 0.78125], pal('plush.elephant.hi'), { parent: 'head', inlay: true }),
  part('earL', [0.1875, 1.875, 1.5], [-1.1875, -0.0625, -0.25], pal('plush.elephant.body'), { parent: 'head' }),
  part('earInL', [0.0625, 1.5, 1.125], [-0.125, 0, 0.0625], pal('plush.elephant.ear'), { parent: 'earL', inlay: true }),
  part('earR', [0.1875, 1.875, 1.5], [1.1875, -0.0625, -0.25], pal('plush.elephant.body'), { parent: 'head' }),
  part('earInR', [0.0625, 1.5, 1.125], [0.125, 0, 0.0625], pal('plush.elephant.ear'), { parent: 'earR', inlay: true }),
  part('eyeL', [0.1875, 0.1875, 0.0625], [-0.5625, 0.25, 0.78125], pal('plush.elephant.eye'), { parent: 'head', inlay: true }),
  part('eyeR', [0.1875, 0.1875, 0.0625], [0.5625, 0.25, 0.78125], pal('plush.elephant.eye'), { parent: 'head', inlay: true }),
  part('tuskL', [0.125, 0.125, 0.4375], [-0.375, -0.625, 0.9375], pal('plush.elephant.tusk'), { parent: 'head', tilt: 0.35 }),
  part('tuskR', [0.125, 0.125, 0.4375], [0.375, -0.625, 0.9375], pal('plush.elephant.tusk'), { parent: 'head', tilt: 0.35 }),
  part('trunk', [0.5, 0.25, 0.5], [0, -0.5, 0.8125], pal('plush.elephant.body'), { parent: 'head' }),
  part('trunk2', [0.4375, 0.5625, 0.4375], [0, -0.375, 0], pal('plush.elephant.body'), { parent: 'trunk' }),
  part('trunk3', [0.375, 0.5, 0.375], [0, -0.5, 0], pal('plush.elephant.hi'), { parent: 'trunk2' }),
  part('tip', [0.3125, 0.25, 0.3125], [0, -0.375, 0.0625], pal('plush.elephant.dark'), { parent: 'trunk3' }),
];

/** Radians the ears stand open from the head at rest. */
const EAR_OUT = 0.5;

/** Trunk angles round x by pose (negative raises it forward and up). */
const TRUNK: Readonly<Record<string, number>> = {
  'curl-up': -2.2, raise: -2.7, 'lift-stone': -1.8, 'swing-back': 0.7, blow: 0.15, sweep: -0.4,
  press: 0.05, lower: 0.1, reach: -0.7, beat: -0.2, Won: 0.2,
};

/** Each frame: the pose of the state or the telegraph on show, then the sign of progress (the ears hang looser). */
export function poseModel(parts: Parts, ratio: number, m: ElephantMind | null = LIVE) {
  const t = m?.clock ?? 0, pt = m?.poseT ?? 0, name = m?.pose ?? 'Idle';
  const set = (n: string, f: (o: THREE.Object3D) => void) => {
    const o = parts.get(n);
    if (o) f(o);
  };
  // the ears open to listen, to rally and to trumpet; beat to fan (1.5 Hz, under the 3 Hz rule); flap once when hurt
  let open = 0;
  if (name === LISTENING || name === 'Rallying' || name === 'raise') open = 0.7;
  else if (name === 'beat') open = 0.35 + 0.35 * Math.sin(2 * Math.PI * 1.5 * pt);
  else if (name === 'Hurt') open = 0.5 * Math.sin(Math.PI * Math.min(1, pt / 0.3));
  // at rest the ears stand out from the head like sails, swung forward by EAR_OUT
  const hang = 0.35 * ratio;
  set('earL', o => { o.rotation.y = EAR_OUT + open; o.rotation.z = hang; });
  set('earR', o => { o.rotation.y = -(EAR_OUT + open); o.rotation.z = -hang; });
  // the trunk: its telegraph's pose, the long drink, a slow swing at rest
  let trunk = TRUNK[name] ?? 0.12 * Math.sin(2 * Math.PI * 0.4 * t);
  if (name === 'sweep') trunk += 0.4 * Math.sin(2 * Math.PI * 1.2 * pt);
  if (name === 'Recovering') trunk = 0.05 + 0.05 * Math.sin(2 * Math.PI * 0.5 * t);
  set('trunk', o => { o.rotation.x = trunk; });
  set('trunk2', o => { o.rotation.x = trunk < -1 ? -0.4 : 0.1; });
  // the head lowers for the heavy water and the rumble; the body sways from foot to foot while it waits
  const low = name === 'lower' ? 0.3 : name === 'press' ? 0.15 : name === 'Won' ? 0.12 : 0;
  set('head', o => { o.rotation.x = low; });
  const sway = name === 'Idle' || name === 'Watching' ? 0.05 * Math.sin(2 * Math.PI * 0.5 * t) : 0;
  set('body', o => { o.rotation.z = sway; o.rotation.y = m?.yaw ?? 0; });
}

// ───────────────────────── the deity ─────────────────────────

export const elephantDeity: DeityDef = {
  animal: 'elephant', floor: 3,
  hits: HITS,
  telegraph: TELEGRAPH[2],
  recover: RECOVER,
  rest: REST,
  sight: SIGHT,
  hover: HOVER,
  teleport: false,
  guard: rimGuard,
  attacks: ELEPHANT_ATTACKS,
  states: [LISTENING_STATE],
  rules: [memoryRule, listenRule],
  // allies in the waterhole answer the trumpet with their own: one hit every 6 s (B4); allies alone may win slowly
  // (B8), so the cap is the whole count
  ally: { act: 'trumpet', every: 6, cap: HITS },
  knock: 'sweep',
  won: { toast: WON_TOAST, play: settle },
  model: { body: BODY, head: HEAD, hw: 1.1, h: 3, progress: (parts, ratio) => poseModel(parts, ratio) },
};
