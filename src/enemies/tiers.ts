// Colour tiers of projections and bosses (issue #338, docs/design/built/projections/TIERS.md): Black is
// the being as its file gives it, Yellow is tougher, harder, faster and climbs higher, Red is the elite
// with the highest numbers. A tier is a layer over any definition, rolled from the room's seed when the
// being spawns. Bosses take the tier on their health only; the Shadow (#339) never takes one. Pure
// rules: no three.js, no DOM, no events.

import { pal, type PalToken } from '../content/palette';
import type { Enemy, EnemyDef, ModelPart } from './types';
import { TX } from './types';

export type Tier = 'black' | 'yellow' | 'red';
export const TIERS: readonly Tier[] = ['black', 'yellow', 'red'];

/** What a tier changes: health, every damage it deals (touch, strikes, shots, bursts) and its own speed
 *  as multipliers, and `climb`: blocks added to the tallest step it climbs and to the height of its leap. */
export interface TierMultipliers { hp: number; damage: number; speed: number; climb: number }

/** The projections' table (owner's numbers, #338 "Decisions"). */
export const TIER_MULTIPLIERS: Readonly<Record<Tier, Readonly<TierMultipliers>>> = {
  black: { hp: 1, damage: 1, speed: 1, climb: 0 },
  yellow: { hp: 1.5, damage: 1.25, speed: 1.2, climb: 1 },
  red: { hp: 2.5, damage: 1.5, speed: 1.4, climb: 2 },
};

/** The bosses' table: health only, so a boss's moves keep their designed reach and timing. */
export const BOSS_TIER_MULTIPLIERS: Readonly<Record<Tier, Readonly<TierMultipliers>>> = {
  black: TIER_MULTIPLIERS.black,
  yellow: { hp: 1.25, damage: 1, speed: 1, climb: 0 },
  red: { hp: 1.5, damage: 1, speed: 1, climb: 0 },
};

/** Beings that never take a tier: the Shadow mirrors the player, "as strong as you" (#339). */
export const TIERLESS: ReadonlySet<string> = new Set(['shadow']);

/** Whether a definition can take a tier: projections and bosses, never creatures nor the Shadow. */
export const tiered = (def: Pick<EnemyDef, 'id' | 'kind'>) => def.kind !== 'creature' && !TIERLESS.has(def.id);

/** The multipliers of a definition for a tier: the single source of the numbers, for projections and bosses. */
export function tierMultipliers(def: Pick<EnemyDef, 'id' | 'kind'>, tier: Tier): TierMultipliers {
  if (!tiered(def)) return { ...TIER_MULTIPLIERS.black };
  return { ...(def.kind === 'boss' ? BOSS_TIER_MULTIPLIERS : TIER_MULTIPLIERS)[tier] };
}

/** The numbers a being spawns with in a tier. `hp` is its base health (the rooted or the floor's boss health). */
export function tierStats(def: Pick<EnemyDef, 'id' | 'kind' | 'hp' | 'speed' | 'contactDamage'>, tier: Tier, hp = def.hp) {
  const m = tierMultipliers(def, tier);
  return { hp: Math.round(hp * m.hp), speed: def.speed * m.speed, contactDamage: def.contactDamage * m.damage, climb: m.climb, damage: m.damage };
}

/** Blocks a walker can step up or down in one move: one, plus its tier's climb. */
export const climbOf = (extra: number) => 1 + Math.max(0, Math.floor(extra));

/**
 * The flight time of a leap whose arc rises `extra` blocks higher than its base arc of `air` seconds.
 * The base lift is 13 × air under gravity 26 (behaviours.ts `leap`), so its apex is 3.25 air²; the same
 * lift-to-flight ratio over the higher apex gives √(air² + 52 extra / 169).
 */
export const leapAir = (air: number, extra: number) => extra > 0 ? Math.sqrt(air * air + 52 * extra / 169) : air;

/**
 * The difficulty at mastery level 0, the default of the formula. A run's difficulty comes from the Roots' mastery
 * level (#352, enemies/difficulty.ts `difficultyOf`: 1 + min(level, 100) / 100) and the game passes it in.
 * 0 makes everything Black.
 */
export const BASE_DIFFICULTY = 1;

/** The deepest floor of the descent: the chances stop growing there. */
export const DEEPEST_FLOOR = 13;

/**
 * The chance that a being spawns Yellow or Red on a floor at a difficulty (owner's numbers, #338):
 * yellow = d × (5 % + 2.5 % × (floor − 1)), 5 % on floor 1 to 35 % on floor 13;
 * red = d × 1.5 % × (floor − 3), never below 0: none on floors 1 to 3, 15 % on floor 13.
 * The floor is clamped to 13. The Roots (floor 0) and anything above them never roll a tier. When a high
 * difficulty would push the two past 100 %, Yellow gives way so Red keeps its share.
 */
export function tierChances(floor: number, difficulty = BASE_DIFFICULTY): { yellow: number; red: number } {
  if (floor < 1 || difficulty <= 0) return { yellow: 0, red: 0 };
  const f = Math.min(floor, DEEPEST_FLOOR);
  const red = Math.min(1, difficulty * 0.015 * Math.max(0, f - 3));
  const yellow = Math.min(1 - red, difficulty * (0.05 + 0.025 * (f - 1)));
  return { yellow, red };
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
 * The tier a being spawns with: one roll on its own fork of the run's seed,
 * `fork('floor', floor, 'room', room, 'tier', seq)` (`room` is the room id modulo ROOM_ID_STRIDE, `seq`
 * the spawn's number, as for the rooted roll), so the same seed gives the same tiers and no other roll
 * of the run moves. Creatures and the Shadow are always Black and draw nothing.
 */
export function spawnTier(rng: Forks, floor: number, room: number, seq: number, def: Pick<EnemyDef, 'id' | 'kind'>, difficulty = BASE_DIFFICULTY): Tier {
  if (!tiered(def)) return 'black';
  return rollTier(rng.fork('floor', floor, 'room', room, 'tier', seq).next(), tierChances(floor, difficulty));
}

// ───────────────────────── the look (DECISIONS §14.6) ─────────────────────────

/** A body ramp: the darkest parts of a model take `dark`, the middle `base`, the lightest `hi`. */
export interface BodyRamp { dark: PalToken; base: PalToken; hi: PalToken }

/** The hostile body of each tier (owner: Yellow a loud yellow, Red red). Black keeps its own husk. */
export const TIER_BODY: Readonly<Record<Exclude<Tier, 'black'>, BodyRamp>> = {
  yellow: { dark: 'tier.yellow.dark', base: 'tier.yellow.base', hi: 'tier.yellow.hi' },
  red: { dark: 'tier.red.dark', base: 'tier.red.base', hi: 'tier.red.hi' },
};

/**
 * The ally rule (owner, #338): an ally of any tier, converted or mended, is drawn in the full inversion
 * of its hostile colours, every channel 255 minus itself, on every part (body, eyes, tells, thorns), with
 * no glow tinted on top. The one place the rule lives: every allied draw goes through it.
 */
const RGB_MASK = (1 << 24) - 1;
export const allyColor = (hostile: number): number => RGB_MASK ^ (hostile & RGB_MASK);

/** A part that is the body: not a light (eyes, tells), not an inlay (sockets), not the tier's own mark. */
const isBody = (p: ModelPart) => !p.glow && !p.inlay && p.name !== 'tier';

const luma = (c: number) => 0.2126 * (c >> 16 & 255) + 0.7152 * (c >> 8 & 255) + 0.0722 * (c & 255);

/**
 * The model's body parts recoloured on a ramp, keeping their order of light: the model's body colours
 * are ranked by brightness, the darkest third takes `dark`, the lightest third `hi`, the rest `base`.
 * Eyes, tells, sockets and the tier's thorns keep their colour. Returns the parts in their order.
 */
export function paintBody(model: readonly ModelPart[], ramp: BodyRamp): ModelPart[] {
  const shades = [...new Set(model.filter(isBody).map(p => p.color))].sort((a, b) => luma(a) - luma(b));
  const role = (c: number): PalToken => {
    if (shades.length < 2) return ramp.base;
    const k = shades.indexOf(c) / (shades.length - 1);
    return k < 1 / 3 ? ramp.dark : k > 2 / 3 ? ramp.hi : ramp.base;
  };
  return model.map(p => isBody(p) ? { ...p, color: pal(role(p.color)) } : p);
}

/**
 * The colour-blind cue of a hostile tier (#108), its shape before its colour: upright thorns on top of
 * the head, in the tier's darkest tone. Yellow: two thorns with a gap between them, like horns. Red: a
 * crown of three, the middle one the tallest. The outline (a gap or a peak) tells them apart in greyscale
 * and for every colour-blind player, and a pointed, straight-edged mark is a hostile shape, so it never
 * reads as an ally (an ally's sign is the inversion of all its colours). Black has
 * none. The thorns ride on the part named 'head' when there is one (they follow its tilt), else on the
 * highest part over the body's middle line.
 */
export function tierMarks(def: Pick<EnemyDef, 'size' | 'model'>, tier: Tier): ModelPart[] {
  if (tier === 'black') return [];
  const head = def.model.find(p => p.name === 'head' && !p.parent);
  // without a head: the highest part over the body's middle line (an ear or a wing tip off to one side is not the crown)
  const roof = (p: ModelPart) => p.pos[1] + p.size[1] / 2;
  let top: ModelPart | undefined;
  for (const p of def.model) if (!p.parent && Math.abs(p.pos[0]) <= p.size[0] / 2 && (!top || roof(p) > roof(top))) top = p;
  const [ax, ay, az] = head ? [0, head.size[1] / 2, 0] : top ? [0, roof(top), top.pos[2]] : [0, def.size[1], 0];
  const color = pal(TIER_BODY[tier].dark);
  // a spike 2 texels thick and `h` tall, turned 45° so an edge faces you, `x` texels off the middle,
  // its foot one texel sunk into the top (pointed and straight-edged: never round, never a heart)
  const thorn = (x: number, h: number): ModelPart => ({
    size: [2 * TX, h * TX, 2 * TX], pos: [ax + x * TX, ay + (h / 2 - 1) * TX, az], color,
    rot: [0, Math.PI / 4, 0], name: 'tier', ...(head ? { parent: 'head' } : {}),
  });
  if (tier === 'yellow') return [thorn(-3, 4), thorn(3, 4)];
  return [thorn(-4, 4), thorn(0, 7), thorn(4, 4)];
}

/** The whole hostile model of a tier: the body in the tier's colour and its thorns. Black is the file's model. */
export function tierModel(def: Pick<EnemyDef, 'size' | 'model'>, tier: Tier): ModelPart[] {
  if (tier === 'black') return [...def.model];
  return [...paintBody(def.model, TIER_BODY[tier]), ...tierMarks(def, tier)];
}

// ───────────────────────── optional deeper behaviour (not the hotfix) ─────────────────────────

/**
 * The falter after a Red release (DEEPER-BEHAVIOUR, optional, pending the owner): OFF. The code is kept
 * so the owner can try it; nothing calls it with it on.
 */
export const FALTER_ENABLED = false;

/** Seconds the other projections of a room hold still when a Red one is released, when the falter is on. */
export const FALTER_SECONDS = 1.5;

/**
 * Who falters when `released` is destroyed, when the falter is on: the hostile projections left in its
 * room. Only a Red release does it; bosses never falter, and allies are not hostile.
 */
export function falterTargets(list: readonly Enemy[], released: Enemy, enabled = FALTER_ENABLED): Enemy[] {
  if (!enabled || released.tier !== 'red') return [];
  return list.filter(o => o !== released && o.alive && o.room === released.room && o.faction === 'projection'
    && o.spec.kind !== 'boss' && o.spawning <= 0);
}
