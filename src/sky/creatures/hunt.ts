import { nearest } from '../floors/graph';
import { TELEGRAPH, type MinionCtx, type Place, type MinionRule, type SkyActor, type SkyCue, type SkyFloorPlan } from '../types';
import { arrived } from './gaits';

export const HUNT_RANGE = 40;
export const HARASS_GAP = 1.2;
export const HARASS_TELLS = 3;

export interface HarassSpec {
  reach: number;
  every: number;
  strength: number;
  cue: SkyCue;
}

const hash = (id: number) => (Math.imul(id ^ 0x9e3779b9, 2654435761) >>> 0) / 4294967296;

export const RESTING: readonly string[] = ['Idle', 'Asleep', 'Basking', 'Grazing', 'Won'];

export const awake = (ctx: MinionCtx) => !!ctx.deity && !RESTING.includes(ctx.deity.state);

export const hunter = (m: SkyActor, share: number) => hash(m.id) < share;

export function hunt(share: number, near = 1.5): MinionRule {
  return (m, ctx) => {
    if (!hunter(m, share) || !awake(ctx)) return false;
    const p = ctx.host.player().body, b = m.body;
    const d = Math.hypot(p.x - b.x, p.z - b.z);
    if (d > HUNT_RANGE || (d <= near && Math.abs(p.y - b.y) <= 1.5)) return false;
    const node = nearest(ctx.plan.graph, p.x, p.y, p.z);
    const via = node && !arrived(m, node) && Math.hypot(node.x + 0.5 - p.x, node.z + 0.5 - p.z) < d;
    const to: Place = via && node
      ? node
      : { id: -2, kind: 'ground', x: Math.floor(p.x), y: Math.floor(p.y + 1e-3), z: Math.floor(p.z), w: 1, d: 1, tag: 0 };
    ctx.moveTo(m, to);
    return true;
  };
}

interface Swing { ready: number; until: number }
const SWINGS = new WeakMap<SkyActor, Swing>();
const FLOORS = new WeakMap<SkyFloorPlan, number[]>();

function slots(ctx: MinionCtx, now: number): number[] {
  let list = FLOORS.get(ctx.plan);
  if (!list) { list = []; FLOORS.set(ctx.plan, list); }
  const tell = TELEGRAPH[ctx.plan.index - 1] ?? TELEGRAPH[0];
  for (let i = list.length - 1; i >= 0; i--) if (now - list[i] > tell) list.splice(i, 1);
  return list;
}

export function harass(spec: HarassSpec): MinionRule {
  return (m, ctx) => {
    const now = ctx.host.time(), b = m.body, p = ctx.host.player().body;
    let s = SWINGS.get(m);
    if (!s) { s = { ready: now + spec.every * hash(m.id + 7), until: -1 }; SWINGS.set(m, s); }
    if (now < s.until) { b.vx = 0; b.vz = 0; return true; }
    if (now < s.ready) return false;
    const d = Math.hypot(p.x - b.x, p.z - b.z);
    if (d > spec.reach || Math.abs(p.y - b.y) > 2) return false;
    const taken = slots(ctx, now);
    if (taken.length >= HARASS_TELLS || (taken.length && now - taken[taken.length - 1] < HARASS_GAP)) return false;
    taken.push(now);
    const dir = d > 1e-3 ? { x: (p.x - b.x) / d, y: 0, z: (p.z - b.z) / d } : { x: 1, y: 0, z: 0 };
    ctx.hinder('knockback', { from: { x: b.x, y: Math.floor(p.y + 1e-3), z: b.z }, shape: 'line', dir, radius: d + 1, strength: spec.strength });
    ctx.host.cue(spec.cue, b.x, b.y + b.h, b.z);
    s.ready = now + spec.every;
    s.until = now + 1;
    b.vx = 0; b.vz = 0;
    return true;
  };
}
