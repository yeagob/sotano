// The global difficulty (issue #352, docs/design/built/progression/DIFFICULTY.md): it starts at 1 and rises with the
// Roots' mastery level to 2 at level 100. It raises the chance of the harder colour tiers (tiers.ts `tierChances`) and
// the number of projections in a room (`moreEnemies`). The level is read once at run start by the game and passed in:
// nothing here reads the save. Pure rules: no three.js, no DOM, no events.

import type { Rng } from '../core/rng';
import { ROSTER } from '../content/tables/enemies';
import type { EnemyDef } from './types';

/** The mastery level at which the difficulty reaches its maximum. */
export const DIFFICULTY_MAX_LEVEL = 100;

/** The highest difficulty, reached at mastery level 100. */
export const MAX_DIFFICULTY = 2;

/** From this mastery level on the maximum difficulty counts for the Shadow's achievement (owner, #353). */
export const MAX_DIFFICULTY_FROM = 99;

const share = (level: number) => {
  const n = Number(level);
  return Number.isFinite(n) ? Math.min(DIFFICULTY_MAX_LEVEL, Math.max(0, n)) / DIFFICULTY_MAX_LEVEL : 0;
};

/** The difficulty of a run carved at a mastery level: 1 + min(level, 100) / 100, so 1 at level 0 and 2 at level 100. */
export const difficultyOf = (level: number): number => 1 + share(level);

/**
 * How many times the usual count of projections a room holds at a difficulty: 1 + 0.5 × (difficulty − 1),
 * so 1 at difficulty 1 (level 0) and 1.5 at difficulty 2 (level 100), linear in between.
 */
export const countMultiplier = (difficulty: number): number => 1 + 0.5 * Math.min(1, Math.max(0, difficulty - 1));

/** The chance, at the maximum difficulty, that a room holds a few more projections than its multiplier gives. */
export const SURGE_CHANCE = 0.1;

/** How many more projections a surge adds: 1 or 2, even odds. */
export const SURGE_MIN = 1;
export const SURGE_MAX = 2;

/** The surge's chance at a difficulty: SURGE_CHANCE × (difficulty − 1), none at difficulty 1, 10 % at difficulty 2. */
export const surgeChance = (difficulty: number): number => SURGE_CHANCE * Math.min(1, Math.max(0, difficulty - 1));

/**
 * The projections a room adds to its usual roster at a difficulty (SPAWNS-AND-WAVES §1.1). `base` is the roster the
 * floor's budget gave, drawn first and never changed; `rng` is the same room fork, so it continues after the base and
 * the usual roster stays the one of difficulty 1. At difficulty 1 nothing is drawn and nothing is added.
 *
 * - The target count is `base.length × countMultiplier(difficulty)`: its whole part is added for sure, its fraction is
 *   one more projection with that chance (one draw).
 * - Then the surge: one draw against `surgeChance(difficulty)`; on a hit one more draw picks 1 or 2 more projections.
 * - Each added projection is drawn from the ROSTER table as the base is: it must belong to the floor and cost no more
 *   than the room's budget (`maxCost`). At most 12 draws per added projection.
 * - The count never passes `cap × countMultiplier(difficulty)` (rounded down) plus the surge: `cap` is the room's usual
 *   cap (5 per cell, 7 a challenge wave).
 * - A quiet room (empty base) stays quiet.
 */
export function moreEnemies(
  rng: Rng, floor: number, base: readonly string[], difficulty: number, maxCost: number, cap: number,
  byId: ReadonlyMap<string, Pick<EnemyDef, 'id' | 'cost' | 'minFloor'>>,
): string[] {
  if (!base.length || difficulty <= 1) return [...base];
  const m = countMultiplier(difficulty);
  const target = base.length * m;
  let add = Math.floor(target) - base.length;
  if (rng.next() < target - Math.floor(target)) add++;
  let surge = 0;
  if (rng.next() < surgeChance(difficulty)) surge = rng.int(SURGE_MIN, SURGE_MAX);
  const limit = Math.max(base.length, Math.floor(cap * m)) + surge;
  const out = [...base];
  const want = Math.min(limit, base.length + add + surge);
  for (let guard = 0; out.length < want && guard < 12 * (want - base.length); guard++) {
    const id = ROSTER.roll(rng, { floor });
    const def = id ? byId.get(id) : undefined;
    if (!def || def.minFloor > floor || def.cost > maxCost) continue;
    out.push(def.id);
  }
  return out;
}
