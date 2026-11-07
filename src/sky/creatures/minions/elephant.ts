// The elephant minions, the herd (docs/design/not-built/sky/guardians/ELEPHANT.md §3, §5, B5; minions/README.md).
//
// Young elephants wade out of the waterhole and walk the ground ring in file behind the oldest, at a steady pace,
// never climbing more than a step. Wild, they keep the herd's path: a player who stands in it or between two of
// them is shouldered aside after an ear flap (a knockback with the floor's telegraph). At the deity's trumpet the
// herd stops; when one of them is turned, the leader trumpets and the rest close ranks round it. An ally steps in
// front of a shove, lifts the player one terrace with its trunk, holds a channel's water back (when the floor has
// channels) and stands by the waterhole to answer the deity's trumpet. Nothing here hurts or drains.
//
// Every clock is the host's time; nothing draws randomness, so a fixed dt repeats exactly.

import type * as THREE from 'three';
import { pal } from '../../../content/palette';
import type { ModelPart } from '../../../enemies/types';
import { mindOf } from '../deities/elephant';
import { walk } from '../gaits';
import { REACTING, WILD } from '../minion';
import type { MinionCtx, MinionDef, MinionRule, Parts, Place, SkyActor, SkyFloorPlan, Vec3 } from '../../types';

/** B5: a steady 2 blocks a second, in water or out. Followers close the gap a little faster to keep the file. */
export const SPEED = 2;
const CATCH_UP = 2.4;
/** The herd's path: an arc of the ground ring at this radius, clear of the tusk line and of the waterhole. */
export const PATH_RADIUS = 21.5;
/** The arc, in degrees round the axis: from beside the waterhole (225°) round through +x to short of the tusk line (45°). */
const ARC_FROM = 250, ARC_TO = 20, ARC_STEPS = 6;
/** A calf this near the waterhole's centre (radius 2) is still in it. */
const WATERHOLE_OUT = 2.6;
/** Blocks between two elephants in file. */
const FILE_GAP = 1.6;
/** The shoulder: the player this near a wild minion, on the ground ring, is pushed 2 blocks away from the herd. */
export const SHOULDER_RANGE = 2.2;
export const SHOULDER_BLOCKS = 2;
export const SHOULDER_EVERY = 4;
/** An ally this near a wild minion takes its push: the shove does not start. */
export const CLEAR_RANGE = 2.5;
/** The floor's telegraph (the ear flap) and the herd closing ranks after a turn (B5 rule 6). */
const TELL = 1.1;
export const CLOSE_RANKS = 3;
/** The carry: a player in front of an ally this long is lifted one terrace (6 blocks), once every 6 s. */
export const CARRY_WAIT = 0.6;
export const CARRY_EVERY = 6;
const CARRY_TIME = 1;
const CARRY_NEAR = 1.5;
/** At most three allies stand by the waterhole to help (B4). */
export const HELPERS = 3;
/** Speed per block of a push (as the deity's). */
const PER_BLOCK = 2.5;
/** The minion's spray up a channel's foot (only on a floor with channels). */
const SPRAY_SECONDS = 3;
const SPRAY_EVERY = 10;

/** What the herd of one floor shares. */
interface Herd { wp: number; dir: 1 | -1; allies: Set<number>; closeUntil: number }
/** What one calf keeps. */
interface Calf { shoveAt: number; tellUntil: number; nearSince: number; carryAt: number; sprayAt: number; holding: number; wadeAt: number; wading: boolean }

const HERDS = new WeakMap<SkyFloorPlan, Herd>();
const CALVES = new WeakMap<SkyActor, Calf>();

function herdOf(plan: SkyFloorPlan): Herd {
  let h = HERDS.get(plan);
  if (!h) { h = { wp: 0, dir: 1, allies: new Set(), closeUntil: -Infinity }; HERDS.set(plan, h); }
  return h;
}

function calfOf(m: SkyActor): Calf {
  let c = CALVES.get(m);
  if (!c) { c = { shoveAt: -Infinity, tellUntil: -Infinity, nearSince: -1, carryAt: -Infinity, sprayAt: -Infinity, holding: -1, wadeAt: 0, wading: false }; CALVES.set(m, c); }
  return c;
}

const ground = (plan: SkyFloorPlan) => plan.y0 + 2;
const axis = (plan: SkyFloorPlan) => ({ x: plan.seat.x + 0.5, z: plan.seat.z + 0.5 });
const at = (id: number, x: number, y: number, z: number): Place => ({ id, kind: 'ground', x: Math.floor(x), y, z: Math.floor(z), w: 1, d: 1, tag: 0 });

/** The herd's path on a plan: ARC_STEPS + 1 places along the ground ring. */
export function pathOf(plan: SkyFloorPlan): Place[] {
  const a = axis(plan), span = ((ARC_TO - ARC_FROM) % 360 + 360) % 360;
  const out: Place[] = [];
  for (let k = 0; k <= ARC_STEPS; k++) {
    const deg = ARC_FROM + (span * k) / ARC_STEPS, th = (deg * Math.PI) / 180;
    out.push(at(-1000 - k, a.x + Math.cos(th) * PATH_RADIUS, ground(plan), a.z + Math.sin(th) * PATH_RADIUS));
  }
  return out;
}

/** Where a calf climbs out of the waterhole: three blocks from its centre toward the path's first place. */
function exitOf(plan: SkyFloorPlan): Place | null {
  const s = plan.spawns[0];
  if (!s) return null;
  const p0 = pathOf(plan)[0];
  const dx = p0.x - s.x, dz = p0.z - s.z, d = Math.hypot(dx, dz) || 1;
  return at(-2000, s.x + 0.5 + (dx / d) * 3, ground(plan), s.z + 0.5 + (dz / d) * 3);
}

const flat = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.z - b.z);
const stand = (m: SkyActor) => { m.body.vx = 0; m.body.vz = 0; };
const wild = (a: SkyActor) => a.side === 'wild' && (a.state === WILD || a.state === REACTING);

/** The wild herd of the floor, oldest (lowest id) first. */
function wildHerd(m: SkyActor, ctx: MinionCtx): SkyActor[] {
  return [m, ...ctx.others].filter(wild).sort((p, q) => p.id - q.id);
}

function onGroundRing(ctx: MinionCtx): boolean {
  const b = ctx.host.player().body;
  return b.onGround && Math.abs(b.y - ground(ctx.plan)) < 0.6;
}

// ───────────────────────── wild rules, in order (B5) ─────────────────────────

/** A calf in the waterhole wades out: it rises up the pool's side at its pace, then walks out over the bank. */
const wadeOut: MinionRule = (m, ctx) => {
  const s = ctx.plan.spawns[0], exit = exitOf(ctx.plan), calf = calfOf(m), b = m.body, now = ctx.host.time();
  const dt = Math.min(0.1, Math.max(0, now - calf.wadeAt));
  calf.wadeAt = now;
  if (!s || !exit) return false;
  const inPool = Math.hypot(b.x - (s.x + 0.5), b.z - (s.z + 0.5)) < WATERHOLE_OUT;
  if (!inPool || (!calf.wading && b.y > ground(ctx.plan) - 0.5)) { calf.wading = false; return false; }
  calf.wading = true;
  b.vx = 0; b.vy = 0; b.vz = 0;
  const g = ground(ctx.plan);
  if (b.y < g) { b.y = Math.min(g, b.y + SPEED * dt); return true; }
  const dx = exit.x + 0.5 - b.x, dz = exit.z + 0.5 - b.z, d = Math.hypot(dx, dz) || 1;
  const k = Math.min(d, SPEED * dt);
  b.x += (dx / d) * k; b.z += (dz / d) * k;
  b.onGround = true;
  return true;
};

/** Rule 5: at the deity's trumpet the herd stops for 2 s. */
const halt: MinionRule = (m, ctx) => {
  if (!ctx.deity || mindOf(ctx.deity).trumpetUntil <= ctx.host.time()) return false;
  stand(m);
  return true;
};

/** Rule 6: a calf is turned; the leader trumpets and the rest close ranks round it for 3 s, pushing no one. */
const closeRanks: MinionRule = (m, ctx) => {
  const herd = herdOf(ctx.plan), now = ctx.host.time();
  const list = wildHerd(m, ctx);
  const leader = list[0];
  for (const o of ctx.others) {
    if (o.side !== 'ally' || herd.allies.has(o.id)) continue;
    herd.allies.add(o.id);
    herd.closeUntil = now + TELL + CLOSE_RANKS;
    if (leader) {
      const b = leader.body;
      ctx.host.cue('elephant.call', b.x, b.y + b.h, b.z);
      ctx.host.fx('motes', b.x, b.y + b.h, b.z, 4);
    }
  }
  if (now >= herd.closeUntil || !leader) return false;
  if (m === leader) { stand(m); return true; }
  ctx.moveTo(m, at(-3000 - m.id, leader.body.x, ground(ctx.plan), leader.body.z), walk(CATCH_UP));
  return true;
};

/** A calf showing its ear flap stands still until the shove lands. */
const flapping: MinionRule = (m, ctx) => {
  if (calfOf(m).tellUntil <= ctx.host.time()) return false;
  stand(m);
  return true;
};

/** Rule 2: the player in the herd's path or between two of it is shouldered aside, away from the herd, unless an ally takes the push. */
const shoulder: MinionRule = (m, ctx) => {
  const now = ctx.host.time(), calf = calfOf(m);
  if (now - calf.shoveAt < SHOULDER_EVERY || !onGroundRing(ctx)) return false;
  const p = ctx.host.player().body;
  const list = wildHerd(m, ctx);
  // only the nearest calf shoves
  let nearest: SkyActor | null = null;
  for (const o of list) if (!nearest || flat(o.body, p) < flat(nearest.body, p)) nearest = o;
  if (nearest !== m || flat(m.body, p) > SHOULDER_RANGE) return false;
  if (ctx.others.some(o => o.side === 'ally' && flat(o.body, m.body) <= CLEAR_RANGE)) return false;
  let cx = 0, cz = 0;
  for (const o of list) { cx += o.body.x; cz += o.body.z; }
  cx /= list.length; cz /= list.length;
  let dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
  if (d < 1e-6) { dx = p.x - m.body.x; dz = p.z - m.body.z; d = Math.hypot(dx, dz) || 1; }
  calf.shoveAt = now;
  calf.tellUntil = now + TELL;
  stand(m);
  ctx.hinder('knockback', {
    from: { x: m.body.x, y: m.body.y + 0.5, z: m.body.z }, shape: 'line', radius: SHOULDER_RANGE + 1,
    dir: { x: dx / d, y: 0, z: dz / d }, strength: SHOULDER_BLOCKS * PER_BLOCK,
  });
  return true;
};

/** Rule 4: at a channel's foot a calf sprays water up it for 3 s (only where the floor has channels). */
const spray: MinionRule = (m, ctx) => {
  const now = ctx.host.time(), calf = calfOf(m);
  if (now - calf.sprayAt < SPRAY_EVERY) return false;
  for (const ch of ctx.plan.extra?.channels ?? []) {
    const foot = ch.bed[ch.bed.length - 1];
    if (!foot || Math.hypot(foot[0] + 0.5 - m.body.x, foot[2] + 0.5 - m.body.z) > 1.5) continue;
    calf.sprayAt = now;
    ctx.hinder('water-currents', { channel: ch, seconds: SPRAY_SECONDS, push: 3 });
    return true;
  }
  return false;
};

/** The walk in file: the oldest leads along the path and back; the others follow nose to tail. */
const inFile: MinionRule = (m, ctx) => {
  const list = wildHerd(m, ctx), herd = herdOf(ctx.plan), path = pathOf(ctx.plan);
  const leader = list[0];
  if (!leader || path.length === 0) return false;
  const target = path[herd.wp];
  if (m === leader) {
    if (ctx.moveTo(m, target, walk(SPEED))) {
      if (herd.wp + herd.dir < 0 || herd.wp + herd.dir >= path.length) herd.dir = herd.dir === 1 ? -1 : 1;
      herd.wp += herd.dir;
    }
    return true;
  }
  const rank = list.indexOf(m);
  const lb = leader.body;
  const dx = target.x + 0.5 - lb.x, dz = target.z + 0.5 - lb.z, d = Math.hypot(dx, dz) || 1;
  ctx.moveTo(m, at(-3000 - m.id, lb.x - (dx / d) * FILE_GAP * rank, ground(ctx.plan), lb.z - (dz / d) * FILE_GAP * rank), walk(CATCH_UP));
  return true;
};

// ───────────────────────── ally helps ─────────────────────────

/** Clear: an ally steps in front of a wild calf near the player, so the push goes to it instead. */
const clear: MinionRule = (m, ctx) => {
  const p = ctx.host.player().body;
  for (const o of ctx.others) {
    if (!wild(o) || flat(o.body, p) > SHOULDER_RANGE + 2 || flat(o.body, m.body) > 8) continue;
    const dx = p.x - o.body.x, dz = p.z - o.body.z, d = Math.hypot(dx, dz) || 1;
    if (flat(o.body, m.body) <= CLEAR_RANGE * 0.6) { stand(m); return true; }
    ctx.moveTo(m, at(-4000 - m.id, o.body.x + dx / d, ground(ctx.plan), o.body.z + dz / d), walk(CATCH_UP));
    return true;
  }
  return false;
};

/**
 * Carry: a player who stands in front of an ally for CARRY_WAIT is lifted by its trunk one terrace up (6 blocks,
 * one wall), once every 6 s; from the ground ring to the first terrace, from the first to the second. It lands
 * only on a cell that can be stood on.
 */
const carry: MinionRule = (m, ctx) => {
  const now = ctx.host.time(), calf = calfOf(m), pl = ctx.host.player(), p = pl.body, w = ctx.host.world();
  const level = Math.floor(p.y + 0.01);
  const near = p.onGround && flat(m.body, p) <= CARRY_NEAR && level <= ctx.plan.y0 + 8 && Math.abs(level - Math.floor(m.body.y + 0.01)) <= 1;
  if (!near) { calf.nearSince = -1; return false; }
  if (now - calf.carryAt < CARRY_EVERY) return false;
  if (calf.nearSince < 0) calf.nearSince = now;
  // the ally waits with the player while its trunk reaches
  if (now - calf.nearSince < CARRY_WAIT) { stand(m); return true; }
  const a = axis(ctx.plan);
  const dx = a.x - p.x, dz = a.z - p.z, d = Math.hypot(dx, dz) || 1;
  // the wall of the next ring in, then a cell 1.5 past its face, 6 up
  for (let r = 0.5; r < 6; r += 0.5) {
    const x = Math.floor(p.x + (dx / d) * r), z = Math.floor(p.z + (dz / d) * r);
    if (!w.solid(x, level, z)) continue;
    const tx = Math.floor(p.x + (dx / d) * (r + 1.5)), tz = Math.floor(p.z + (dz / d) * (r + 1.5)), ty = level + 6;
    if (w.solid(tx, ty, tz) || w.solid(tx, ty + 1, tz) || !w.solid(tx, ty - 1, tz)) return false;
    calf.carryAt = now;
    calf.nearSince = -1;
    pl.carry({ x: tx + 0.5, y: ty, z: tz + 0.5 }, CARRY_TIME);
    ctx.host.fx('motes', p.x, p.y + 1, p.z, 6);
    ctx.host.cue('elephant.lift', p.x, p.y + 1, p.z);
    return true;
  }
  return false;
};

/** Hold: an ally stands across a channel's bed on the ground ring or the first terrace and holds the water back. */
const hold: MinionRule = (m, ctx) => {
  const channels = ctx.plan.extra?.channels ?? [];
  if (channels.length === 0) return false;
  const w = ctx.host.world();
  let best: [number, number, number] | null = null, bestD = Infinity;
  for (const ch of channels) for (const c of ch.bed) {
    if (c[1] > ctx.plan.y0 + 8) continue;
    const d = Math.hypot(c[0] + 0.5 - m.body.x, c[2] + 0.5 - m.body.z);
    if (d < bestD) { bestD = d; best = c; }
  }
  if (!best) return false;
  const there = ctx.moveTo(m, at(-5000 - m.id, best[0] + 0.5, best[1], best[2] + 0.5), walk(SPEED));
  const i = w.idx(best[0], best[1], best[2]), calf = calfOf(m);
  if (there && calf.holding !== i) {
    if (calf.holding >= 0) ctx.release(m.id);
    calf.holding = i;
    ctx.protect([i], m.id);
  }
  return true;
};

/** Help: up to three allies stand by the waterhole and answer the deity's trumpet with their own (B4). */
const help: MinionRule = (m, ctx) => {
  const helpers = [m, ...ctx.others].filter(o => o.side === 'ally').sort((p, q) => p.id - q.id).slice(0, HELPERS);
  if (!helpers.includes(m)) return false;
  const exit = exitOf(ctx.plan);
  if (!exit) return false;
  const k = helpers.indexOf(m);
  ctx.moveTo(m, at(-6000 - k, exit.x + 0.5 + (k - 1) * 1.2, exit.y, exit.z + 0.5), walk(SPEED));
  return true;
};

// ───────────────────────── the model (docs/art/sky/elephant.md, pending owner review) ─────────────────────────

const part = (name: string, size: ModelPart['size'], pos: ModelPart['pos'], color: number, more: Partial<ModelPart> = {}): ModelPart =>
  ({ name, size, pos, color, ...more });

/** A calf about a block tall: a small round body, a head 1.6 times its width, sail ears, a short trunk. Faces +z. */
const PARTS: ModelPart[] = [
  part('body', [0.625, 0.5, 0.75], [0, 0.4375, 0], pal('plush.elephant.body')),
  part('legFL', [0.1875, 0.1875, 0.1875], [-0.1875, -0.28125, 0.25], pal('plush.elephant.dark'), { parent: 'body' }),
  part('legFR', [0.1875, 0.1875, 0.1875], [0.1875, -0.28125, 0.25], pal('plush.elephant.dark'), { parent: 'body' }),
  part('legBL', [0.1875, 0.1875, 0.1875], [-0.1875, -0.28125, -0.25], pal('plush.elephant.dark'), { parent: 'body' }),
  part('legBR', [0.1875, 0.1875, 0.1875], [0.1875, -0.28125, -0.25], pal('plush.elephant.dark'), { parent: 'body' }),
  part('head', [1, 0.75, 0.6875], [0, 0.4375, 0.25], pal('plush.elephant.body'), { parent: 'body' }),
  part('earL', [0.125, 0.6875, 0.625], [-0.5625, 0.0625, -0.0625], pal('plush.elephant.body'), { parent: 'head' }),
  part('earInL', [0.0625, 0.5, 0.4375], [0.09375, 0, 0.0625], pal('plush.elephant.ear'), { parent: 'earL', inlay: true }),
  part('earR', [0.125, 0.6875, 0.625], [0.5625, 0.0625, -0.0625], pal('plush.elephant.body'), { parent: 'head' }),
  part('earInR', [0.0625, 0.5, 0.4375], [-0.09375, 0, 0.0625], pal('plush.elephant.ear'), { parent: 'earR', inlay: true }),
  part('eyeL', [0.125, 0.125, 0.0625], [-0.25, 0.125, 0.375], pal('plush.elephant.eye'), { parent: 'head', inlay: true }),
  part('eyeR', [0.125, 0.125, 0.0625], [0.25, 0.125, 0.375], pal('plush.elephant.eye'), { parent: 'head', inlay: true }),
  part('trunk', [0.25, 0.125, 0.25], [0, -0.25, 0.375], pal('plush.elephant.body'), { parent: 'head' }),
  part('trunk2', [0.1875, 0.375, 0.1875], [0, -0.25, 0], pal('plush.elephant.hi'), { parent: 'trunk' }),
];

/** Seconds of each calf's slow motions, by its parts (the view, not the simulation: nothing here is read back). */
const CLOCKS = new WeakMap<Parts, number>();
const FRAME = 1 / 60;

/** Each positive hit: the ears flap slowly and the head lowers; turned (ratio 1), the trunk lifts and the ears open. */
export function reactModel(parts: Parts, ratio: number) {
  const t = (CLOCKS.get(parts) ?? 0) + FRAME;
  CLOCKS.set(parts, t);
  const set = (n: string, f: (o: THREE.Object3D) => void) => { const o = parts.get(n); if (o) f(o); };
  const flap = ratio >= 1 ? 0.6 : ratio > 0 ? 0.25 + 0.2 * Math.sin(2 * Math.PI * 0.6 * t) : 0.1 * Math.sin(2 * Math.PI * 0.3 * t);
  set('earL', o => { o.rotation.y = -flap; });
  set('earR', o => { o.rotation.y = flap; });
  set('head', o => { o.rotation.x = ratio >= 1 ? -0.1 : 0.3 * ratio; });
  set('trunk', o => { o.rotation.x = ratio >= 1 ? -2 : 0.1 * Math.sin(2 * Math.PI * 0.4 * t); });
  set('legFL', o => { o.rotation.x = 0.3 * Math.sin(2 * Math.PI * 1.2 * t); });
  set('legBR', o => { o.rotation.x = 0.3 * Math.sin(2 * Math.PI * 1.2 * t); });
  set('legFR', o => { o.rotation.x = -0.3 * Math.sin(2 * Math.PI * 1.2 * t); });
  set('legBL', o => { o.rotation.x = -0.3 * Math.sin(2 * Math.PI * 1.2 * t); });
}

export const elephantMinion: MinionDef = {
  animal: 'elephant',
  max: 5, wildMax: 3,
  // bubbles rise and a low rumble grows for 2 s, and a young elephant wades out; one every 15 s (B5)
  spawn: { where: 'waterhole', warning: 2, every: 15 },
  hitsToTurn: 5,
  gait: walk(SPEED),
  rules: [wadeOut, halt, closeRanks, flapping, shoulder, spray, inFile],
  ally: [
    { kind: 'clear', rule: clear },
    { kind: 'carry', rule: carry },
    { kind: 'hold', rule: hold },
    { kind: 'help', rule: help },
  ],
  model: { parts: PARTS, hw: 0.45, h: 1.2, react: reactModel },
};

