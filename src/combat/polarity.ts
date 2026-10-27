// Intention polarity (docs/design/BESTIARY.md §1.1, docs/reviews/polarity.md). A positive intention
// mends what it touches; a negative one harms it. These are the pure rules: no three.js, no DOM,
// no events. The game (game/game.ts) applies them inside the one damage pipeline, after the
// `actorDamage` hooks, so items see every step and cannot break the rules by accident.

import type { Faction } from '../entities/actors';

export type Polarity = 'positive' | 'negative';

/** Share of an intention's damage a positive one deals to a hostile projection. */
export const POSITIVE_DAMAGE = 0.5;
/** Warmth a positive hit adds to a projection (0 → 1; full warmth turns it to your side). */
export const WARMTH_PER_HIT = 0.2;
/** Warmth a negative hit takes from a projection. It cools; it does not reset. */
export const WARMTH_COOL = 0.25;
/** Share of the damage a positive intention would deal that heals an ally instead. */
export const ALLY_HEAL = 0.5;
/** Share of its maximum health a projection has when it changes side (converted or relapsed). */
export const TURN_HP = 0.5;

const EPS = 1e-9;

/** Damage an intention deals, before any event: positive ones halve it against projections. */
export const intentDamage = (polarity: Polarity, damage: number) =>
  polarity === 'positive' ? damage * POSITIVE_DAMAGE : damage;

/**
 * The most health a hit may take from a projection, applied after the `actorDamage` hooks. A
 * positive intention never takes the last point: its warmth still fills, so the route of light
 * always ends in a conversion. Negative intentions have no limit (a kill is a release).
 */
export const intentCeiling = (polarity: Polarity, hp: number) =>
  polarity === 'positive' ? Math.max(0, hp - 1) : Infinity;

/** Warmth after one hit of this polarity. */
export const warmthAfter = (polarity: Polarity, warmth: number) =>
  polarity === 'positive' ? Math.min(1, warmth + WARMTH_PER_HIT) : Math.max(0, warmth - WARMTH_COOL);

/** Full warmth turns a projection to your side (tolerant to float sums: 0.2 five times is not exact). */
export const isWarm = (warmth: number) => warmth >= 1 - EPS;

/** Health a positive intention heals an ally by: half the damage, never past its maximum. */
export const allyHeal = (damage: number, hp: number, maxHp: number) =>
  Math.max(0, Math.min(damage * ALLY_HEAL, maxHp - hp));

/** Health a projection has once it converts: at least half its maximum, so one touch cannot undo it. */
export const convertedHp = (hp: number, maxHp: number) => Math.max(hp, maxHp * TURN_HP);

/** Health an ally returns with when a negative intention turns it hostile again (never below 1). */
export const relapseHp = (maxHp: number) => Math.max(1, maxHp * TURN_HP);

/** Whether an intention of this polarity meets an actor: hostile projections always; allies when
 *  it is negative (it harms them) or when they are hurt (a positive one heals them). A healthy ally
 *  lets positive intentions pass (docs/reviews/polarity.md, ruling 6). */
export const meetsIntention = (faction: Faction, hp: number, maxHp: number, polarity: Polarity) =>
  faction === 'projection' || polarity === 'negative' || hp < maxHp;

/** An enemy as an intention sees it, before the hit. */
export interface HitState { polarity: Polarity; warm: boolean; faction: Faction; hp: number; maxHp: number; warmth: number }

/** What the hit does: the warmth after it, the health it takes, and whether an ally relapses or a
 *  projection converts. */
export interface HitResolution { warmth: number; dealt: number; relapse: boolean; convert: boolean }

/**
 * One intention hit, after the `actorDamage` hooks have had their say (`amount`). Warmth moves first
 * (unless the stroke already warmed this target). An ally at zero under a negative intention relapses
 * instead of dissolving. A positive intention never takes a projection's last point. A projection
 * converts when a positive intention fills its warmth.
 */
export function resolveHit(s: HitState, amount: number): HitResolution {
  const warmth = s.warm ? warmthAfter(s.polarity, s.warmth) : s.warmth;
  if (s.polarity === 'negative' && s.faction === 'self' && s.hp - amount <= 0) return { warmth: 0, dealt: 0, relapse: true, convert: false };
  const dealt = Math.min(amount, intentCeiling(s.polarity, s.hp));
  const convert = s.polarity === 'positive' && s.faction === 'projection' && isWarm(warmth);
  return { warmth, dealt, relapse: false, convert };
}
