// The koala minions (docs/design/not-built/sky/guardians/KOALA.md B5; docs/design/not-built/sky/minions/README.md).
// Sleepy until disturbed, then quick to grab. Each rule is one of B5's, in its order; the first that acts wins the
// tick (minion.ts). A koala climbs any face and hangs under a branch (its gait), never crosses a gap (it routes
// through walks, steps and climbs, so round by the trunks), drops onto the player passing under it after a swing
// (the koala-hug hindrance: its telegraph is the swing), and holds them until shaken off. An ally holds the thin
// branch ahead of the player, clears a koala about to drop, or climbs to the Fork and hugs the deity.

import { pal } from '../../../content/palette';
import type { ModelPart } from '../../../enemies/types';
import { nearest, route } from '../../floors/graph';
import { cellsOfTags } from '../../hindrances/fading-platforms';
import { ridden } from '../../hindrances/koala-hug';
import { hazardOwner } from '../../hindrances/runner';
import type { Move, MinionCtx, MinionDef, MinionRule, Parts, Place, SkyActor } from '../../types';
import { climbFace, compose, hangUnder, walk } from '../gaits';

/** B5 targets. */
export const WAKE_RANGE = 4;
export const STRETCH = 1;
export const DOZE_RANGE = 6;
export const DOZE_AFTER = 10;
export const HUG_SECONDS = 2;
export const CURL = 6;
/** A wild koala follows the player only this close (provisional: B5 has it hang near the player's path). */
export const CHASE = 8;
/** Seconds of the swing (the floor's telegraph) plus the hug: a dropping koala does nothing else meanwhile. */
const SWING = 1.2;
/** The most allies that hug the deity at once (B4). */
export const HUGGERS = 2;
/** It never crosses a gap: these moves only (no jump, no build). */
const MOVES: readonly Move[] = ['walk', 'step', 'climb', 'drop'];
/** Seconds between route searches. */
const REROUTE = 1;

/** B5 movement: climbs any face at 2 blocks a second, hangs under a branch, walks slowly on flat ground. */
export const KOALA_GAIT = compose(climbFace(0.5), hangUnder(), walk(1.2));

interface Memo {
  lastT: number;
  dt: number;
  stretch: number;
  away: number;
  curl: number;
  /** Seconds left of a swing and hug in progress. */
  dropping: number;
  /** The tag it holds (an ally's hold), and the owner it protects it with. */
  holding: number;
  owner: number;
  helper: boolean;
  path: number[] | null;
  pathTo: number;
  pathAge: number;
}
const MEMO = new WeakMap<SkyActor, Memo>();
export function koalaMemo(m: SkyActor): Memo {
  let k = MEMO.get(m);
  if (!k) {
    k = { lastT: m.t, dt: 0, stretch: 0, away: 0, curl: 0, dropping: 0, holding: 0, owner: hazardOwner(), helper: false, path: null, pathTo: -1, pathAge: 0 };
    MEMO.set(m, k);
  }
  return k;
}

/** This tick's seconds, read from the machine's clock (it restarts at each state); the same for every rule of a tick. */
function tickOf(m: SkyActor): number {
  const k = koalaMemo(m);
  if (m.t !== k.lastT) {
    k.dt = m.t > k.lastT ? m.t - k.lastT : m.t;
    k.lastT = m.t;
  }
  return k.dt;
}

const flat = (m: SkyActor, x: number, z: number) => Math.hypot(m.body.x - x, m.body.z - z);
const playerOf = (ctx: MinionCtx) => ctx.host.player().body;

/** Moves toward `to` along the floor graph, never by a jump or a gap; true once there. */
function travel(m: SkyActor, ctx: MinionCtx, to: Place, dt: number): boolean {
  const k = koalaMemo(m), b = m.body;
  k.pathAge += dt;
  if (!k.path || k.pathTo !== to.id || k.pathAge >= REROUTE) {
    const from = nearest(ctx.plan.graph, b.x, b.y, b.z);
    k.path = from ? route(ctx.plan.graph, from.id, to.id, MOVES) : null;
    k.pathTo = to.id;
    k.pathAge = 0;
  }
  const next = k.path && k.path.length > 1 ? ctx.plan.graph.places[k.path[1]] : to;
  const there = ctx.moveTo(m, next ?? to);
  return there && next === to;
}

/** The place nearest the player that a koala may stand on (never the moss: it does not walk on the ground). */
function nearPlayer(ctx: MinionCtx): Place | null {
  const p = playerOf(ctx);
  return nearest(ctx.plan.graph, p.x, p.y, p.z, ['branch', 'thick', 'ledge', 'top', 'spawn', 'nest', 'seat']);
}

// ───────────────────────── the wild koala's rules (B5 1–6) ─────────────────────────

/** Curled asleep beside an ally that cleared it, for 6 s. */
const curled: MinionRule = m => {
  const k = koalaMemo(m);
  if (k.curl <= 0) return false;
  k.curl -= tickOf(m);
  return true;
};

/** 1. Asleep until the player comes within 4, then it wakes with a stretch. */
const sleep: MinionRule = (m, ctx) => {
  if (m.state !== 'Asleep') return false;
  tickOf(m);
  const p = playerOf(ctx);
  if (flat(m, p.x, p.z) <= WAKE_RANGE && Math.abs(p.y - m.body.y) <= WAKE_RANGE) {
    ctx.go(m, 'Wild');
    koalaMemo(m).stretch = STRETCH;
    ctx.host.cue('koala.stretch', m.body.x, m.body.y + m.body.h, m.body.z);
  }
  return true;
};

const stretching: MinionRule = m => {
  const k = koalaMemo(m);
  if (k.stretch <= 0) return false;
  k.stretch -= tickOf(m);
  return true;
};

/** 4. A koala that dropped holds the player while its hug lasts: it rides on them. */
const holding: MinionRule = (m, ctx) => {
  const k = koalaMemo(m);
  if (k.dropping <= 0) return false;
  k.dropping -= tickOf(m);
  const p = playerOf(ctx);
  if (k.dropping < HUG_SECONDS && ridden() && flat(m, p.x, p.z) <= 2) {
    m.body.x = p.x; m.body.y = p.y + p.h * 0.5; m.body.z = p.z;
    m.body.vx = 0; m.body.vy = 0; m.body.vz = 0;
  }
  return true;
};

/** 3. The player passes under it within a block sideways (or walks into it): it swings by one arm, then drops. */
const drop: MinionRule = (m, ctx) => {
  if (ridden()) return false;
  const p = playerOf(ctx), b = m.body;
  const side = flat(m, p.x, p.z);
  const below = side <= 1 + p.hw && p.y < b.y - 0.5 && b.y - p.y <= 5;
  const touching = side <= b.hw + p.hw + 0.2 && Math.abs(p.y - b.y) <= 1;
  if (!below && !touching) return false;
  const hits = m.hits;
  koalaMemo(m).dropping = SWING + HUG_SECONDS;
  ctx.hinder('koala-hug', {
    from: { x: b.x, y: b.y, z: b.z }, seconds: HUG_SECONDS,
    loose: () => m.hits > hits || m.side === 'ally' || koalaMemo(m).curl > 0,
  });
  tickOf(m);
  return true;
};

/** 6. Back to sleep where it is after 10 s with the player never within 6. */
const doze: MinionRule = (m, ctx) => {
  const k = koalaMemo(m), p = playerOf(ctx);
  const dt = tickOf(m);
  if (flat(m, p.x, p.z) <= DOZE_RANGE && Math.abs(p.y - m.body.y) <= DOZE_RANGE) { k.away = 0; return false; }
  k.away += dt;
  if (k.away < DOZE_AFTER) return false;
  k.away = 0;
  ctx.go(m, 'Asleep');
  return true;
};

/** 2 and 5. Climbs toward the player's way, round by the trunks, and hangs where a branch is over it. */
const approach: MinionRule = (m, ctx) => {
  const p = playerOf(ctx);
  // far from the player it waits where it is (and dozes off, rule 6)
  if (flat(m, p.x, p.z) > CHASE || Math.abs(p.y - m.body.y) > CHASE) return true;
  const to = nearPlayer(ctx);
  if (!to) return false;
  travel(m, ctx, to, tickOf(m) || 0);
  return true;
};

// ───────────────────────── the ally's helps (B5) ─────────────────────────

/** Clear: it grabs a wild koala about to drop, and both curl up asleep for 6 s. */
const clear: MinionRule = (m, ctx) => {
  const k = koalaMemo(m);
  if (k.curl > 0) { k.curl -= tickOf(m); return true; }
  const target = ctx.others.find(o => o.side === 'wild' && koalaMemo(o).dropping > HUG_SECONDS && flat(m, o.body.x, o.body.z) <= 8);
  if (!target) return false;
  const dt = tickOf(m);
  if (flat(m, target.body.x, target.body.z) <= 1.5 && Math.abs(target.body.y - m.body.y) <= 2) {
    const t = koalaMemo(target);
    t.curl = CURL; t.dropping = 0;
    k.curl = CURL;
    ctx.go(target, 'Asleep');
    ctx.host.fx('motes', target.body.x, target.body.y + 0.5, target.body.z, 6);
    ctx.host.cue('koala.curl', target.body.x, target.body.y, target.body.z);
    return true;
  }
  const at = nearest(ctx.plan.graph, target.body.x, target.body.y, target.body.z);
  if (at) travel(m, ctx, at, dt);
  return true;
};

/** Help: at most two allies climb to the Fork and hug the deity (minion.ts adds its hits; the guard is lifted). */
const help: MinionRule = (m, ctx) => {
  const d = ctx.deity, k = koalaMemo(m);
  if (!d || d.side === 'ally') { k.helper = false; return false; }
  if (!k.helper) {
    if (ctx.others.filter(o => o.side === 'ally' && koalaMemo(o).helper).length >= HUGGERS) return false;
    k.helper = true;
  }
  const dt = tickOf(m);
  if (flat(m, d.body.x, d.body.z) <= 1.5 && Math.abs(m.body.y - d.body.y) <= d.body.h) return true;
  travel(m, ctx, ctx.plan.seat, dt);
  return true;
};

/** Hold: it hangs under the thin branch nearest ahead of the player; a branch it holds does not fade. */
const hold: MinionRule = (m, ctx) => {
  const k = koalaMemo(m), p = playerOf(ctx), w = ctx.host.world();
  const under = w.layout.tagAt(Math.floor(p.x), Math.floor(p.y - 0.05), Math.floor(p.z));
  const thin = new Set(ctx.plan.platforms.filter(t => !t.fixed).map(t => t.tag));
  let best: Place | null = null, bestD = Infinity;
  for (const pl of ctx.plan.graph.places) {
    if (pl.kind !== 'branch' || !thin.has(pl.tag) || pl.tag === under) continue;
    const d = Math.hypot(pl.x + 0.5 - p.x, pl.y - p.y, pl.z + 0.5 - p.z);
    if (d < bestD) { bestD = d; best = pl; }
  }
  if (!best) return false;
  const dt = tickOf(m);
  const there = flat(m, best.x + 0.5, best.z + 0.5) <= 1.5 && Math.abs(m.body.y - best.y) <= 2.5;
  if (!there) { travel(m, ctx, best, dt); return true; }
  if (k.holding !== best.tag) {
    if (k.holding) ctx.release(k.owner);
    k.holding = best.tag;
    ctx.protect(cellsOfTags(w, [best.tag]), k.owner);
  }
  return true;
};

// ───────────────────────── the model (pending owner review) ─────────────────────────

const T = 1 / 16;
const box = (size: [number, number, number], pos: [number, number, number], color: number, more: Partial<ModelPart> = {}): ModelPart =>
  ({ size: size.map(v => v * T) as [number, number, number], pos: pos.map(v => v * T) as [number, number, number], color, ...more });

/** A small koala, about a block tall: a 7-texel body under a 15-texel head, round ears, a big dark nose. */
function minionModel(): ModelPart[] {
  const fur = pal('plush.koala.base'), cream = pal('plush.koala.cream');
  return [
    box([7, 6, 6], [0, 4, 0], fur, { name: 'body' }),
    box([4, 4, 1], [0, 4, 3.5], cream, { name: 'chest', inlay: true }),
    box([2, 5, 2], [-4.5, 5, 1], fur, { name: 'armL' }),
    box([2, 5, 2], [4.5, 5, 1], fur, { name: 'armR' }),
    box([15, 9, 11], [0, 11.5, 0], fur, { name: 'head' }),
    box([5, 5, 2], [-7.5, 16, 0], pal('plush.koala.hi'), { name: 'earL' }),
    box([5, 5, 2], [7.5, 16, 0], pal('plush.koala.hi'), { name: 'earR' }),
    box([3, 4, 2], [0, 10.5, 6.5], pal('plush.koala.nose'), { name: 'nose' }),
    box([2, 1, 1], [-3.5, 13, 6], pal('plush.koala.lid'), { name: 'lidL', inlay: true }),
    box([2, 1, 1], [3.5, 13, 6], pal('plush.koala.lid'), { name: 'lidR', inlay: true }),
  ];
}

/** B5: each positive hit makes it blink and loosen its grip; turned (ratio 1), its arms open and its ears lift. */
export function minionReact(parts: Parts, ratio: number) {
  const r = Math.max(0, Math.min(1, ratio));
  const l = parts.get('armL'), a = parts.get('armR');
  if (l) l.rotation.z = 0.9 * r;
  if (a) a.rotation.z = -0.9 * r;
  for (const k of ['lidL', 'lidR']) { const lid = parts.get(k); if (lid) lid.scale.y = 1 + 1.5 * r; }
  for (const [k, s] of [['earL', 1], ['earR', -1]] as const) { const e = parts.get(k); if (e) e.rotation.z = s * 0.3 * (r >= 1 ? 1 : 0); }
}

export const koalaMinion: MinionDef = {
  animal: 'koala',
  max: 6, wildMax: 6,
  // B5: a new sleeping koala appears 20 s after one leaves its cluster, with a rustle and a curled shape for 1.5 s
  spawn: { where: 'clusters', warning: 1.5, every: 20, asleep: true },
  hitsToTurn: 3,
  gait: KOALA_GAIT,
  rules: [curled, sleep, stretching, holding, drop, doze, approach],
  ally: [
    { kind: 'clear', rule: clear },
    { kind: 'help', rule: help },
    { kind: 'hold', rule: hold },
  ],
  model: { parts: minionModel(), hw: 0.45, h: 1.1, react: minionReact },
};
