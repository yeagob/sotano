// Intention polarity (docs/design/built/encounters/POLARITY.md, docs/reviews/polarity.md). A positive intention
// mends what it touches; a negative one harms it. These are the pure rules: no three.js, no DOM,
// no events. The game (game/game.ts) applies them inside the one damage pipeline, after the
// `actorDamage` hooks, so items see every step and cannot break the rules by accident.
//
// The bar (owner, 2026-11-26): converting and killing are one value. A hostile being's `hp` is its
// place on a bar from 0 to twice its maximum health, and it starts in the middle, at `maxHp`. Harm
// drains it toward 0, where the being dies; love fills it toward `2 × maxHp`, where it turns to your
// side. Both move it by the same amount, the hit's damage, so killing and converting cost the same,
// whatever the being's life.

import type { Faction } from '../entities/actors';

export type Polarity = 'positive' | 'negative';

/** The bar's top as a multiple of the being's maximum health: love converts at `BAR_TOP × maxHp`. */
export const BAR_TOP = 2;
/** Share of the damage a positive intention would deal that heals an ally instead. */
export const ALLY_HEAL = 0.5;
/** Share of its maximum health a projection has as an ally once it converts. */
export const TURN_HP = 0.5;

const EPS = 1e-9;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Where a hostile being's bar starts, and where an ally that relapses starts again: the middle. */
export const barStart = (maxHp: number) => maxHp;

/** The bar's top: the health at which love turns a hostile being. */
export const barTop = (maxHp: number) => BAR_TOP * maxHp;

/** The bar as a share, 0 (released) → 0.5 (the start) → 1 (converted). */
export const barShare = (hp: number, maxHp: number) => clamp01(hp / Math.max(EPS, barTop(maxHp)));

/** How far love has filled the upper half, 0 → 1 (the captive glow and the bar's warm part). */
export const barLove = (hp: number, maxHp: number) => clamp01((hp - maxHp) / Math.max(EPS, maxHp));

/**
 * What is left of the fight, 1 at the middle and 0 at either end. Every reading of "how much life is
 * left" on a projection (a boss's phases, a decree's strength, a wake-up) uses it, so love moves a
 * fight on as much as harm does. For health at or under the middle (any ally, or a being only harmed)
 * it is exactly `hp / maxHp`.
 */
export const barRest = (hp: number, maxHp: number) => 1 - clamp01(Math.abs(hp - maxHp) / Math.max(EPS, maxHp));

/** The bar is full: the being turns to your side (tolerant to float sums). */
export const isConverted = (hp: number, maxHp: number) => hp >= barTop(maxHp) - EPS;

/** The bar after one hit: harm takes `amount`, love adds it, never past either end. */
export const barAfter = (polarity: Polarity, hp: number, maxHp: number, amount: number) =>
  Math.max(0, Math.min(barTop(maxHp), polarity === 'positive' ? hp + amount : hp - amount));

/** Health a positive intention heals an ally by: half the damage, never past its maximum. */
export const allyHeal = (damage: number, hp: number, maxHp: number) =>
  Math.max(0, Math.min(damage * ALLY_HEAL, maxHp - hp));

/** Health a projection has as an ally once its bar is full: half its maximum. */
export const convertedHp = (maxHp: number) => maxHp * TURN_HP;

/** Where an ally's bar starts again when a negative intention turns it hostile: the middle. */
export const relapseHp = (maxHp: number) => barStart(maxHp);

/** Whether an intention of this polarity meets an actor: hostile projections always; allies when
 *  it is negative (it harms them) or when they are hurt (a positive one heals them). A healthy ally
 *  lets positive intentions pass (docs/reviews/polarity.md, ruling 6). */
export const meetsIntention = (faction: Faction, hp: number, maxHp: number, polarity: Polarity, responds?: Polarity) =>
  responds ? responds === polarity : faction === 'projection' || polarity === 'negative' || hp < maxHp;

/** An actor as an intention sees it, before the hit. `hostile`: the intention comes from the hostile side (the
 *  Shadow's bolts and strokes), not from the player. */
export interface HitState { polarity: Polarity; faction: Faction; hp: number; hostile?: boolean }

/** What the hit does: the harm it takes off the bar, the love it adds, and whether an ally relapses. A relapse
 *  comes first: with harm as well, the harm drains the bar from its middle. */
export interface HitResolution { harm: number; love: number; relapse: boolean }

/**
 * One intention hit, after the `actorDamage` hooks have had their say (`amount`). A negative
 * intention harms by the whole amount, and an ally it would bring to zero relapses instead of
 * dissolving. A hostile negative intention (friendly fire, issue #372) turns an ally at once and
 * harms it too. A positive intention adds the whole amount to a hostile being's bar: it never harms
 * one, so the route of light always ends in a conversion. (A positive intention on an ally heals it
 * before this point, in the game's `intentTouch`.) Plain harm on an ally (a bomb, a touch, a hostile
 * shot, lava) is resolved as a negative intention of the player's: it harms, and relapses at zero.
 */
export function resolveHit(s: HitState, amount: number): HitResolution {
  if (s.polarity === 'negative') {
    if (s.faction === 'self' && s.hostile) return { harm: amount, love: 0, relapse: true };
    if (s.faction === 'self' && s.hp - amount <= 0) return { harm: 0, love: 0, relapse: true };
    return { harm: amount, love: 0, relapse: false };
  }
  return { harm: 0, love: s.faction === 'projection' ? amount : 0, relapse: false };
}
