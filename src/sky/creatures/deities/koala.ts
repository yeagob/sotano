// The koala deity, guardian of sky floor 2 (docs/design/not-built/sky/guardians/KOALA.md, B2–B4, section 6).
// Data for the one deity machine (deity.ts): Asleep once, Stirring, the Clinging guard after each attack from the
// second stage (an ally hugging it lifts the guard), a doze, teleport far when the player reaches it, the four
// attacks of B3 and the six special attacks of B3b (provisional), and the letting go of section 6 when won.
// Every attack goes through a hindrance with its own telegraph after the koala's; a drain goes through ctx.drain
// (the spirit gate) when it lands; a capture holds the player and takes one practice. Nothing here takes health.

import { pal } from '../../../content/palette';
import type { ModelPart } from '../../../enemies/types';
import { cellUnderFeet } from '../../hindrances/effects';
import { cellsOfTags } from '../../hindrances/fading-platforms';
import { ridden } from '../../hindrances/koala-hug';
import {
  CAPTURE_TIME, TELEGRAPH, type AttackDef, type CustomState, type DeityCtx, type DeityDef, type DeityRule, type Parts,
  type Place, type SkyActor, type Stage, type TelegraphSpec, type Vec3,
} from '../../types';
import { HELP_RANGE } from '../minion';

/** B2: Stirring starts when the player comes within 12 blocks, and lasts 1.5 s. */
export const STIR_RANGE = 12;
export const STIR = 1.5;
/** B2: the guard, from the second stage, after each attack. */
export const CLING = 2.5;
/** B2: the doze (Recovering). */
export const DOZE = 2;
/** Teleport far when the player comes this close to the koala (B2: when they reach the Fork). Provisional gap. */
export const TELEPORT_NEAR = 3;
export const TELEPORT_GAP = 20;
/** guardians §6.6: a capture comes at most once every 30 s. */
export const CAPTURE_GAP = 30;
/** B3b drains (provisional, owner 2026-11-05). */
export const HAZE_SPIRIT = 8;
export const BELLOW_SPIRIT = 10;
export const LULLABY_SPIRIT = 18;
/** The seconds a hindrance's own telegraph adds after the koala's (ctx.hinder runs at MIN_TELEGRAPH). */
const HINDER_TELL = 0.8;

const GUARD = 'Clinging';
const DOZING = 'Dozing';
const STIRRING = 'Stirring';

/** What the koala's file keeps for its deity between frames. */
interface Memo {
  clock: number;
  /** The underlying state as last seen (Hurt is an overlay) and its clock. */
  core: string;
  lastT: number;
  /** Positive hits when the current attack's telegraph began: more since then is the answer to it. */
  startHits: number;
  clinging: boolean;
  /** The stage whose rally has been played. */
  rallied: Stage;
  lastTeleport: number;
  lastCapture: number;
  /** Until this clock the koala floats in to the player (Hold fast): never Clinging meanwhile. */
  floating: number;
}
const MEMO = new WeakMap<SkyActor, Memo>();
function memo(d: SkyActor): Memo {
  let m = MEMO.get(d);
  if (!m) {
    m = { clock: 0, core: '', lastT: 0, startHits: 0, clinging: false, rallied: 0, lastTeleport: -Infinity, lastCapture: -Infinity, floating: -Infinity };
    MEMO.set(d, m);
  }
  return m;
}

// ───────────────────────── reading the floor ─────────────────────────

const feet = (ctx: DeityCtx): Vec3 => {
  const b = ctx.host.player().body;
  return { x: b.x, y: b.y, z: b.z };
};
/** The centre of the player's cell, at their feet. */
const cellCentre = (ctx: DeityCtx): Vec3 => {
  const b = ctx.host.player().body;
  return { x: Math.floor(b.x) + 0.5, y: Math.floor(b.y + 0.05), z: Math.floor(b.z) + 0.5 };
};
/** The platform tag under the player's feet in the formula (0 on a placed block or in the air). */
function tagUnder(ctx: DeityCtx): number {
  const b = ctx.host.player().body;
  return ctx.host.world().layout.tagAt(Math.floor(b.x), Math.floor(b.y - 0.05), Math.floor(b.z));
}
/** A spiral branch's tag (thin or thick): its platform names a branch place. */
function isBranch(ctx: DeityCtx, tag: number): boolean {
  const pl = ctx.plan.platforms.find(p => p.tag === tag);
  const at = pl && pl.place >= 0 ? ctx.plan.graph.places[pl.place] : undefined;
  return !!at && (at.kind === 'branch' || at.kind === 'thick');
}
const isThin = (ctx: DeityCtx, tag: number) => ctx.plan.platforms.some(p => p.tag === tag && !p.fixed);
/** The nearest place of these kinds whose tag passes `ok`, or null. */
function nearestPlace(ctx: DeityCtx, kinds: readonly Place['kind'][], ok: (tag: number) => boolean): Place | null {
  const f = feet(ctx);
  let best: Place | null = null, bestD = Infinity;
  for (const p of ctx.plan.graph.places) {
    if (!kinds.includes(p.kind) || !ok(p.tag)) continue;
    const d = Math.hypot(p.x + 0.5 - f.x, p.y - f.y, p.z + 0.5 - f.z);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}
/** The tag's walking cells: solid, with air above. */
function topCells(ctx: DeityCtx, tag: number): number[] {
  const w = ctx.host.world();
  return cellsOfTags(w, [tag]).filter(i => { const [x, y, z] = w.coords(i); return !w.solid(x, y + 1, z); });
}
/** A positive intention landed on the koala since this attack's telegraph began. */
const answered = (ctx: DeityCtx) => ctx.deity.hits > memo(ctx.deity).startHits;
/** An ally koala hugs the deity: it is close enough to help (minion.ts HELP_RANGE). */
export function allyHugs(ctx: DeityCtx): boolean {
  const d = ctx.deity.body;
  return ctx.minions.some(m => m.side === 'ally' && !m.parked
    && Math.hypot(m.body.x - d.x, m.body.z - d.z) <= HELP_RANGE && Math.abs(m.body.y - d.y) <= d.h + HELP_RANGE);
}
/** The attack does not come: the koala's soft sound and a puff at its body. */
function fizzle(ctx: DeityCtx, cue: 'grunt' | 'yawn' | 'blink') {
  const b = ctx.deity.body;
  ctx.host.fx('puff', b.x, b.y + b.h * 0.6, b.z, 4);
  ctx.host.cue(`koala.${cue}`, b.x, b.y + b.h, b.z);
}

// ───────────────────────── the attacks (B3, B3b) ─────────────────────────

const tell = (part: string, pose: string, cue: string): TelegraphSpec => ({ tell: part, pose, cue: `koala.${cue}` });

/** 1. Let-go: the thin branch under the player, or the nearest one on their way, turns to mist for 4 s. */
const letGo: AttackDef = {
  id: 'let-go', stage: 0, telegraph: tell('armR', 'tap', 'tap'),
  act(ctx) {
    const under = tagUnder(ctx);
    const tag = isThin(ctx, under) ? under : nearestPlace(ctx, ['branch'], t => isThin(ctx, t))?.tag;
    if (tag === undefined) return fizzle(ctx, 'blink');
    ctx.hinder('fading-platforms', { tags: [tag], seconds: 4 });
  },
};

/** The player's cell and two cells round it that can be stood on, chosen with the deity's fork. */
export function leafMarks(ctx: DeityCtx): Vec3[] {
  const w = ctx.host.world(), c = cellCentre(ctx);
  const cx = Math.floor(c.x), cy = c.y, cz = Math.floor(c.z);
  const ok = (x: number, z: number) => w.solid(x, cy - 1, z) && !w.solid(x, cy, z);
  const out: Vec3[] = [c];
  const near: Vec3[] = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    if ((dx || dz) && ok(cx + dx, cz + dz)) near.push({ x: cx + dx + 0.5, y: cy, z: cz + dz + 0.5 });
  }
  while (out.length < 3 && near.length) out.push(near.splice(ctx.rng.int(0, near.length - 1), 1)[0]);
  return out;
}

/** 2. Leaf drop: three bundles onto marks round the player; one that lands shoves them down, no damage. */
const leafDrop: AttackDef = {
  id: 'leaf-drop', stage: 0, telegraph: tell('body', 'shake', 'shake'),
  act(ctx) { ctx.hinder('koala-lob', { marks: leafMarks(ctx), ride: 0 }); },
};

/** 5. Scent mark: the walking cells of the thick branch (or limb) nearest the player, within 5, are dense for 5 s. */
const scentMark: AttackDef = {
  id: 'scent-mark', stage: 0, telegraph: tell('chest', 'rub', 'rub'),
  act(ctx) {
    const thick = nearestPlace(ctx, ['thick'], () => true);
    const w = ctx.host.world(), f = feet(ctx);
    const cells = thick ? topCells(ctx, thick.tag).filter(i => { const [x, , z] = w.coords(i); return Math.hypot(x + 0.5 - f.x, z + 0.5 - f.z) <= 5; }) : [];
    if (cells.length === 0) return fizzle(ctx, 'blink');
    ctx.hinder('dense-ground', { cells, seconds: 5, slow: 0.5 });
  },
};

/** 6. Eucalyptus haze: a circle of radius 2 round the player; inside it when it bursts drains 8. */
const haze: AttackDef = {
  id: 'haze', stage: 0, spirit: HAZE_SPIRIT, telegraph: tell('nose', 'chew', 'chew'),
  act(ctx) {
    if (ridden()) return fizzle(ctx, 'yawn');
    ctx.hinder('koala-haze', { at: feet(ctx), radius: 2, drain: () => { if (!ridden()) ctx.drain(HAZE_SPIRIT); } });
  },
};

/** 3. Hug: the cube cage round the player's cell, for 4 s (cube-cage.ts never closes it over a drop). */
const hug: AttackDef = {
  id: 'hug', stage: 1, telegraph: tell('armL', 'open', 'open'),
  act(ctx) { ctx.hinder('cube-cage', { around: cellCentre(ctx), seconds: 4 }); },
};

/** 7. Joey ride: a mark on the player's cell; the joey that lands rides them for 4 s (half-height jumps). */
const joey: AttackDef = {
  id: 'joey', stage: 1, telegraph: tell('head', 'joey', 'joey'),
  act(ctx) {
    // it never adds to a minion's hug
    if (ridden()) return fizzle(ctx, 'blink');
    ctx.hinder('koala-lob', { marks: [cellCentre(ctx)], ride: 4 });
  },
};

/** 8. Bellow: a ring from the Fork's axis at the player's height, 7 a second out to 14, 0.8 high; drains 10. */
const bellow: AttackDef = {
  id: 'bellow', stage: 1, spirit: BELLOW_SPIRIT, telegraph: tell('chest', 'swell', 'rumble'),
  act(ctx) {
    if (answered(ctx) || ridden()) return fizzle(ctx, 'grunt');
    const s = ctx.plan.seat;
    ctx.hinder('koala-bellow', {
      from: { x: s.x + 0.5, y: feet(ctx).y, z: s.z + 0.5 }, speed: 7, radius: 14, height: 0.8,
      drain: () => { if (!ridden()) ctx.drain(BELLOW_SPIRIT); },
    });
  },
};

/** 4. Sleepy sigh: a gust along the player's line toward the central gap, 2 s at 2 blocks a second. */
const sigh: AttackDef = {
  id: 'sigh', stage: 2, telegraph: tell('nose', 'inhale', 'inhale'),
  act(ctx) {
    if (answered(ctx)) return fizzle(ctx, 'yawn');
    const f = feet(ctx), s = ctx.plan.seat;
    let dx = s.x + 0.5 - f.x, dz = s.z + 0.5 - f.z;
    const d = Math.hypot(dx, dz);
    if (d < 1) return fizzle(ctx, 'yawn');
    dx /= d; dz /= d;
    const y = f.y + 0.9;
    ctx.hinder('wind', { from: { x: f.x - dx * 4, y, z: f.z - dz * 4 }, to: { x: f.x + dx * 4, y, z: f.z + dz * 4 }, radius: 1.5, strength: 2, seconds: 2 });
  },
};

/** 9. Lullaby: the branch under the player glows; still on its wood at the end drains 18. Never a branch with no way off. */
const lullaby: AttackDef = {
  id: 'lullaby', stage: 2, spirit: LULLABY_SPIRIT, telegraph: tell('head', 'sway', 'hum'),
  act(ctx) {
    const tag = tagUnder(ctx);
    if (ridden() || !isBranch(ctx, tag)) return fizzle(ctx, 'yawn');
    const f = feet(ctx);
    const wayOff = ctx.plan.graph.places.some(p => p.tag !== tag && p.kind !== 'ground'
      && Math.hypot(p.x + 0.5 - f.x, p.z + 0.5 - f.z) <= 4 && Math.abs(p.y - f.y) <= 3);
    if (!wayOff) return fizzle(ctx, 'yawn');
    const cells = topCells(ctx, tag);
    if (!cells.includes(cellUnderFeet(ctx.host))) return fizzle(ctx, 'yawn');
    ctx.hinder('koala-lullaby', { cells, drain: () => { if (!ridden()) ctx.drain(LULLABY_SPIRIT); } });
  },
};

/** 10. Hold fast: a ring of claws closes on the player's cell; in it when it closes, the koala holds them 3 s and keeps a practice. */
const holdFast: AttackDef = {
  id: 'hold-fast', stage: 2, telegraph: tell('armL', 'open', 'mmm'),
  act(ctx) {
    const m = memo(ctx.deity);
    // no capture while the player is held in any way, within 30 s of the last one
    if (ctx.host.player().held || ridden() || m.clock - m.lastCapture < CAPTURE_GAP) return fizzle(ctx, 'blink');
    const hits = ctx.deity.hits, b = ctx.deity.body;
    m.floating = m.clock + HINDER_TELL + CAPTURE_TIME;
    ctx.hinder('koala-hold', {
      around: cellCentre(ctx), radius: 2, from: { x: b.x, y: b.y + b.h / 2, z: b.z },
      stopped: () => ctx.deity.hits > hits,
      capture: () => {
        m.lastCapture = m.clock;
        ctx.host.player().hold(CAPTURE_TIME);
        ctx.host.takeRandomPractice();
        const p = ctx.host.player().body;
        ctx.host.cue('koala.grab', p.x, p.y + p.h, p.z);
        ctx.host.toast('toast.skyKoalaHoldFast');
      },
    });
  },
};

export const KOALA_ATTACKS: readonly AttackDef[] = [letGo, leafDrop, scentMark, haze, hug, joey, bellow, sigh, lullaby, holdFast];

// ───────────────────────── the states (B2) ─────────────────────────

const asleep: CustomState = {
  name: 'Asleep', replaces: 'Idle', once: true,
  next: ctx => (ctx.distance() <= STIR_RANGE || ctx.deity.hits > 0 ? STIRRING : null),
};
const stirring: CustomState = {
  name: STIRRING,
  enter: ctx => { const b = ctx.deity.body; ctx.host.cue('koala.stir', b.x, b.y + b.h, b.z); },
  next: ctx => (ctx.deity.t >= STIR ? 'Watching' : null),
};
/** After each attack: the guard from the second stage (2.5 s), straight to the doze in the first. */
const clinging: CustomState = {
  name: GUARD, replaces: 'Recovering',
  enter: ctx => {
    const m = memo(ctx.deity);
    m.clinging = ctx.stage >= 1 && m.clock >= m.floating;
    if (m.clinging) { const b = ctx.deity.body; ctx.host.cue('koala.cling', b.x, b.y + b.h, b.z); }
  },
  next: ctx => (!memo(ctx.deity).clinging || ctx.deity.t >= CLING ? DOZING : null),
  exit: ctx => { memo(ctx.deity).clinging = false; },
};
/** The koala's Recovering: it dozes for a moment, then rallies if a stage changed meanwhile. */
const dozing: CustomState = {
  name: DOZING,
  next: ctx => (ctx.deity.t < ctx.def.recover ? null : ctx.stage > memo(ctx.deity).rallied ? 'Rallying' : 'Watching'),
};

/** Notes the state changes, wakes the clusters at a rally, and teleports far when the player reaches the koala. */
const watch: DeityRule = {
  id: 'koala',
  tick(ctx, dt) {
    const m = memo(ctx.deity), a = ctx.deity;
    m.clock += dt;
    const state = a.state === 'Hurt' ? m.core : a.state;
    if (state !== m.core || a.t < m.lastT) {
      if (state === 'Attacking') m.startHits = a.hits;
      if (state === 'Rallying') {
        m.rallied = ctx.stage;
        // B2 Rallying: the sleeping minions wake
        for (const k of ctx.minions) if (k.state === 'Asleep') { k.state = 'Wild'; k.t = 0; }
      }
    }
    m.core = state;
    m.lastT = a.t;
    if (state !== 'Watching' || m.clock - m.lastTeleport < TELEPORT_GAP) return;
    const p = ctx.host.player().body, d = a.body;
    if (Math.hypot(p.x - d.x, p.z - d.z) <= TELEPORT_NEAR && Math.abs(p.y - d.y) <= 3) {
      m.lastTeleport = m.clock;
      ctx.go('Teleporting');
    }
  },
};

// ───────────────────────── the model (pending owner review) ─────────────────────────

const T = 1 / 16;
const box = (size: [number, number, number], pos: [number, number, number], color: number, more: Partial<ModelPart> = {}): ModelPart =>
  ({ size: size.map(v => v * T) as [number, number, number], pos: pos.map(v => v * T) as [number, number, number], color, ...more });

/** A koala hugging its upright branch: a small plush body (16 texels wide) under a head 2.2 times as wide. Feet at 0. */
function koalaModel() {
  const fur = pal('plush.koala.base'), dark = pal('plush.koala.dark'), hi = pal('plush.koala.hi'), cream = pal('plush.koala.cream');
  const body: ModelPart[] = [
    box([4, 48, 4], [0, 24, -9], pal('mat.skywood.base'), { name: 'branch' }),
    box([16, 16, 14], [0, 12, 0], fur, { name: 'body' }),
    box([10, 10, 1], [0, 12, 7.5], cream, { name: 'chest', inlay: true }),
    box([6, 5, 7], [-5, 2.5, 2], dark, { name: 'legL' }),
    box([6, 5, 7], [5, 2.5, 2], dark, { name: 'legR' }),
    box([4, 12, 4], [-9, 16, -4], fur, { name: 'armL', rot: [-0.6, 0, 0.25] }),
    box([4, 12, 4], [9, 16, -4], fur, { name: 'armR', rot: [-0.6, 0, -0.25] }),
    box([3, 2, 3], [-6, 18, -9], pal('plush.koala.claw'), { name: 'clawL' }),
    box([3, 2, 3], [6, 18, -9], pal('plush.koala.claw'), { name: 'clawR' }),
  ];
  const head: ModelPart[] = [
    box([35, 26, 26], [0, 35, 1], fur, { name: 'head' }),
    box([12, 12, 4], [-18, 47, 0], hi, { name: 'earL' }),
    box([12, 12, 4], [18, 47, 0], hi, { name: 'earR' }),
    box([8, 8, 1], [-18, 47, 2.5], cream, { name: 'earInL', inlay: true }),
    box([8, 8, 1], [18, 47, 2.5], cream, { name: 'earInR', inlay: true }),
    box([8, 11, 4], [0, 32, 15], pal('plush.koala.nose'), { name: 'nose' }),
    box([5, 2, 1], [-8, 38, 14.5], pal('plush.koala.lid'), { name: 'lidL', inlay: true }),
    box([5, 2, 1], [8, 38, 14.5], pal('plush.koala.lid'), { name: 'lidR', inlay: true }),
    box([20, 1, 1], [0, 22.5, 14.5], pal('plush.koala.outline'), { name: 'chin', inlay: true }),
  ];
  return { body, head };
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
/** B4 progress: the grip loosens, one arm, then the other, then only the claws hold; the lids lift a little. */
export function koalaProgress(parts: Parts, ratio: number) {
  const l = parts.get('armL'), r = parts.get('armR');
  if (l) l.rotation.z = 0.25 + 1.1 * clamp01(ratio * 3);
  if (r) r.rotation.z = -0.25 - 1.1 * clamp01(ratio * 3 - 1);
  const open = 1 + 1.5 * clamp01(ratio * 3 - 2);
  for (const k of ['lidL', 'lidR']) { const lid = parts.get(k); if (lid) lid.scale.y = open; }
}

const MODEL = koalaModel();

export const koalaDeity: DeityDef = {
  animal: 'koala', floor: 2,
  hits: 30,
  telegraph: TELEGRAPH[1],
  recover: DOZE,
  rest: [3, 2.5, 2],
  // the floor's radius: a player anywhere on the floor is watched once the koala is awake
  sight: 22,
  hover: 1,
  teleport: true,
  guard: (d, ctx) => memo(d).clinging && !allyHugs(ctx),
  attacks: KOALA_ATTACKS,
  states: [asleep, stirring, clinging, dozing],
  rules: [watch],
  // B4: an ally hugging it adds one hit every 4 s. The floor's cap is not in the document: a third of the target (provisional).
  ally: { act: 'hug', every: 4, cap: 10 },
  knock: 'hug',
  won: {
    toast: 'toast.skyKoalaWon',
    play(ctx) {
      // section 6 (provisional): it lets go of its branch; whether the branches then give way is open
      const b = ctx.deity.body;
      ctx.host.fx('gold', b.x, b.y + b.h / 2, b.z, 12);
      ctx.host.fx('motes', b.x, b.y + b.h, b.z, 10);
      ctx.host.cue('koala.letgo', b.x, b.y + b.h, b.z);
    },
  },
  model: { body: MODEL.body, head: MODEL.head, hw: 1.1, h: 3.4, progress: koalaProgress },
};
