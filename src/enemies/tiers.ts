// Colour tiers of a projection (issue #338, docs/design/built/projections/TIERS.md): Black is the
// projection as its file gives it, Yellow is tougher, harder, faster and jumps higher, Red is the
// elite with the highest numbers. A tier is a layer over any definition, rolled from the room's seed
// when the projection spawns. Pure rules: no three.js, no DOM, no events.

import { pal } from '../content/palette';
import type { Enemy, EnemyDef, ModelPart } from './types';
import { TX } from './types';

export type Tier = 'black' | 'yellow' | 'red';
export const TIERS: readonly Tier[] = ['black', 'yellow', 'red'];

/** What a tier multiplies: health, every damage it deals (touch, strikes, shots, bursts), its own
 *  speed, and its jump (the height of its hop and its leap; the flow field reads `climbOf`). */
export interface TierMultipliers { hp: number; damage: number; speed: number; jump: number }

export const TIER_MULTIPLIERS: Readonly<Record<Tier, Readonly<TierMultipliers>>> = {
  black: { hp: 1, damage: 1, speed: 1, jump: 1 },
  yellow: { hp: 1.5, damage: 1.25, speed: 1.15, jump: 2 },
  red: { hp: 2.25, damage: 1.5, speed: 1.3, jump: 3 },
};

/**
 * The multipliers of a definition for a tier. Every definition shares the same numbers today; the
 * definition is the seam for the bosses' tier variants (#315), which call this same function.
 */
export function tierMultipliers(_def: Pick<EnemyDef, 'id' | 'kind'>, tier: Tier): TierMultipliers {
  return { ...TIER_MULTIPLIERS[tier] };
}

/** The numbers a projection spawns with in a tier (health rounded like the rooted multiplier). */
export function tierStats(def: Pick<EnemyDef, 'id' | 'kind' | 'hp' | 'speed' | 'contactDamage'>, tier: Tier, hp = def.hp) {
  const m = tierMultipliers(def, tier);
  return { hp: Math.round(hp * m.hp), speed: def.speed * m.speed, contactDamage: def.contactDamage * m.damage, jump: m.jump, damage: m.damage };
}

/** Blocks a walker can step up or down in one move: the whole part of its jump (1 for Black). */
export const climbOf = (jump: number) => Math.max(1, Math.floor(jump));

/**
 * The global difficulty. There is no difficulty setting in the game: this one number scales the
 * Yellow and Red chances, 1 is the base, 0 makes every projection Black. It is a constant on purpose
 * (not the mastery level or a save value), so a seed always plays the same tiers. Open for the owner.
 */
export const BASE_DIFFICULTY = 1;
export const GLOBAL_DIFFICULTY = BASE_DIFFICULTY;

/** The deepest floor of the depths: the chances stop growing there. */
const DEEPEST = 9;
const YELLOW_BASE = 0.05, YELLOW_STEP = 0.025, YELLOW_CAP = 0.5;
const RED_STEP = 0.015, RED_CAP = 0.3;

/**
 * The chance that a projection spawns Yellow or Red on a floor at a difficulty:
 * yellow = d × (5 % + 2.5 % × (floor − 1)), red = d × 1.5 % × (floor − 1), the floor clamped to 1–9,
 * capped at 50 % and 30 %. Floor 1 at base difficulty: 5 % Yellow, 0 % Red; floor 9: 25 % and 12 %.
 * The Roots (floor 0) and anything above them never roll a tier.
 */
export function tierChances(floor: number, difficulty = GLOBAL_DIFFICULTY): { yellow: number; red: number } {
  if (floor < 1 || difficulty <= 0) return { yellow: 0, red: 0 };
  const k = Math.min(floor, DEEPEST) - 1;
  return {
    yellow: Math.min(YELLOW_CAP, difficulty * (YELLOW_BASE + YELLOW_STEP * k)),
    red: Math.min(RED_CAP, difficulty * RED_STEP * k),
  };
}

/** The tier of one uniform roll `u` in [0, 1): Red below its chance, Yellow in the next band, else Black. */
export function rollTier(u: number, chances: { yellow: number; red: number }): Tier {
  if (u < chances.red) return 'red';
  if (u < chances.red + chances.yellow) return 'yellow';
  return 'black';
}

/** A forkable seeded generator (core/rng.ts RunRandom). */
interface Forks { fork(...path: (string | number)[]): { next(): number } }

/**
 * The tier a projection spawns with: one roll on its own fork of the run's seed,
 * `fork('floor', floor, 'room', room, 'tier', seq)` (`room` is the room id modulo ROOM_ID_STRIDE,
 * `seq` the spawn's number, as for the rooted roll), so the same seed gives the same tiers and no
 * other roll of the run moves. Bosses and creatures are always Black.
 */
export function spawnTier(rng: Forks, floor: number, room: number, seq: number, def: Pick<EnemyDef, 'kind'>, difficulty = GLOBAL_DIFFICULTY): Tier {
  if (def.kind === 'boss' || def.kind === 'creature') return 'black';
  return rollTier(rng.fork('floor', floor, 'room', room, 'tier', seq).next(), tierChances(floor, difficulty));
}

/**
 * The tier's mark (DECISIONS §14.6): upright thorns on top of the head, never a glow of the whole
 * body (that is the ally's sign). Yellow: two short warning-yellow thorns with a gap between them,
 * like horns. Red: a crown of three attack-red thorns, the middle one the tallest. The outline (a gap
 * in the middle or a peak) tells them apart in greyscale and for colour-blind players. Black has none. The thorns ride on the part named 'head' when there is one (they follow its tilt), else on
 * the highest part over the body's middle line.
 */
export function tierMarks(def: Pick<EnemyDef, 'size' | 'model'>, tier: Tier): ModelPart[] {
  if (tier === 'black') return [];
  const head = def.model.find(p => p.name === 'head' && !p.parent);
  // without a head: the highest part over the body's middle line (an ear or a wing tip off to one side is not the crown)
  const roof = (p: ModelPart) => p.pos[1] + p.size[1] / 2;
  let top: ModelPart | undefined;
  for (const p of def.model) if (!p.parent && Math.abs(p.pos[0]) <= p.size[0] / 2 && (!top || roof(p) > roof(top))) top = p;
  const [ax, ay, az] = head ? [0, head.size[1] / 2, 0] : top ? [0, roof(top), top.pos[2]] : [0, def.size[1], 0];
  const color = pal(tier === 'red' ? 'attack.red.base' : 'attack.warn.base');
  // a spike 2 texels thick and `h` tall, turned 45° so an edge faces you, `x` texels off the middle,
  // its foot one texel sunk into the top (pointed and straight-edged: never round, never a heart)
  const thorn = (x: number, h: number): ModelPart => ({
    size: [2 * TX, h * TX, 2 * TX], pos: [ax + x * TX, ay + (h / 2 - 1) * TX, az], color, glow: true,
    rot: [0, Math.PI / 4, 0], name: 'tier', ...(head ? { parent: 'head' } : {}),
  });
  if (tier === 'yellow') return [thorn(-3, 4), thorn(3, 4)];
  return [thorn(-4, 4), thorn(0, 7), thorn(4, 4)];
}

/** Seconds the other projections of a room hold still when a Red one is released (DEEPER-BEHAVIOUR). */
export const FALTER_SECONDS = 1.5;

/**
 * Who falters when `released` is destroyed: when the strongest form of a pattern is let go, the
 * hostile projections left in its room lose their conviction for a moment. Only a Red release does
 * it; bosses never falter, and allies are not hostile.
 */
export function falterTargets(list: readonly Enemy[], released: Enemy): Enemy[] {
  if (released.tier !== 'red') return [];
  return list.filter(o => o !== released && o.alive && o.room === released.room && o.faction === 'projection'
    && o.spec.kind !== 'boss' && o.spawning <= 0);
}
