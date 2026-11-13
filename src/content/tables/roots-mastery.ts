// The Roots' mastery table (docs/design/not-built/levels/roots/REWARDS.md §2-7): what floor 0 lays out for
// a mastery level from 0 to 100. A pure function of the level: no RNG, no save, no DOM. Floor 0 reads it
// when the Roots are carved (package C2), the crate chance reads its factor, and the achievement notice
// reads the gain lines of the new level (`gainsAt`).
//
// Each step is written once as the level it starts at, so every row of the table is a threshold and the
// table is monotonic by construction. A step is kept at every higher level.

import type { HeartKind } from '../heart-art';
import { CRATE_DROP, CRATE_DROP_MIN } from './crates';

export const MASTERY_MAX = 100;
/** The most a crate on floor 0 can give something: a crate never always gives. */
export const CRATE_CHANCE_CAP = 0.75;

/** A quality band in stars: 1 (★) to 4 (★★★★), the items' own scale (items/types.ts). */
export type Tier = 1 | 2 | 3 | 4;
export interface TierBand { readonly min: Tier; readonly max: Tier }

/** The practices the Roots lay on pedestals and the altar draw from (★ to ★★★, the gentle practices). */
export const EXTRA_PRACTICE_BAND: TierBand = { min: 1, max: 3 };

export interface RootsRewards {
  /** The level this table was read at, clamped to 0…100. */
  readonly level: number;
  /** Loose keys in the lesson rooms. Level 0 has none guaranteed (see `oneOfKeyOrBomb`). */
  readonly keys: number;
  /** Loose bombs. Level 0 has none guaranteed. */
  readonly bombs: number;
  /** Level 0 only: the floor lays exactly one of a key or a bomb, the choice drawn per seed. */
  readonly oneOfKeyOrBomb: boolean;
  /** Loose hearts, in the order the table adds them. */
  readonly hearts: readonly HeartKind[];
  /** Free chests (no key needed) in the lesson rooms, at most one a room. */
  readonly freeChests: number;
  /** Draws a free chest gives when opened, inclusive: 1 to 3, 2 to 4 from level 33, 3 to 5 from level 70. */
  readonly chestDraws: { readonly min: number; readonly max: number };
  /** Multiplies the floor's crate chance (see `rootsCrateChance`). */
  readonly crateFactor: number;
  /** Extra practices on pedestals in the Roots, each in EXTRA_PRACTICE_BAND. */
  readonly extraPractices: number;
  /** The altar in the start room, or null before level 80. Its band rises at 90. */
  readonly altar: TierBand | null;
  /** A second Sanctuary (a free chest with its own Boundary), from level 100. */
  readonly secondSanctuary: boolean;
}

/** The level at which each loose key starts (one more key each time): 1, 2, 3, 4, 5 and 6 keys. */
const KEYS_AT = [1, 6, 14, 22, 31, 37] as const;
/** Each loose bomb: 1, 2, 3, 4 and 5 of them. */
const BOMBS_AT = [1, 9, 19, 28, 38] as const;
/** Each free chest: one more from the level given. */
const CHESTS_AT = [4, 12, 17, 23, 29, 35] as const;
/** Each extra practice: one more from the level given. */
const PRACTICES_AT = [10, 25] as const;
/**
 * Each loose heart, in the order it is added (a second red comes at 16, and so on). Star hearts are halved (owner,
 * 2026-11-12): only the first one is ever laid, so the step that would give a second gives a second blood heart.
 */
const HEARTS_AT: readonly (readonly [number, HeartKind])[] = [
  [3, 'red'], [7, 'blue'], [13, 'stone'], [16, 'red'], [20, 'blood'],
  [26, 'star'], [32, 'blue'], [36, 'black'], [39, 'stone'], [40, 'blood'], [60, 'red'],
];
/** The crate factor, a step at each level given, up to level 40. From 41 it follows `crateFactorAt`. */
const CRATE_STEPS: readonly (readonly [number, number])[] = [
  [0, 0.2], [2, 0.3], [5, 0.4], [8, 0.5], [11, 0.6], [15, 0.7], [18, 0.8], [21, 0.9],
  [24, 1.0], [27, 1.1], [30, 1.2], [34, 1.3],
];
/** From this level the crate factor grows by 0.02 a level: 1.3 + 0.02 × (level − 40). */
const CRATE_FORMULA_FROM = 41;
const DRAWS_UP_AT = 33;
const DRAWS_UP_AGAIN_AT = 70;
const ALTAR_AT = 80;
const ALTAR_BEST_AT = 90;
const SANCTUARY_AT = 100;

/** Clamps a level to the table's range. Not a number reads as 0; a fraction is floored. */
export function clampLevel(level: number): number {
  const n = Number(level);
  return Number.isNaN(n) ? 0 : Math.min(MASTERY_MAX, Math.max(0, Math.floor(n)));
}

const round2 = (x: number) => Math.round(x * 100) / 100;

function crateFactorAt(level: number): number {
  if (level >= CRATE_FORMULA_FROM) return round2(1.3 + 0.02 * (level - 40));
  let factor = CRATE_STEPS[0][1];
  for (const [at, value] of CRATE_STEPS) if (level >= at) factor = value;
  return factor;
}

/** The free chests' draws at a level: 1 to 3, 2 to 4 from 33, 3 to 5 from 70. */
function chestDrawsAt(level: number): { readonly min: number; readonly max: number } {
  if (level >= DRAWS_UP_AGAIN_AT) return { min: 3, max: 5 };
  return level >= DRAWS_UP_AT ? { min: 2, max: 4 } : { min: 1, max: 3 };
}

/** What the Roots lay out at a mastery level. Pure: the same level always gives the same table. */
export function rootsRewards(level: number): RootsRewards {
  const L = clampLevel(level);
  const reached = (at: readonly number[]) => at.filter(a => a <= L).length;
  return {
    level: L,
    keys: reached(KEYS_AT),
    bombs: reached(BOMBS_AT),
    oneOfKeyOrBomb: L === 0,
    hearts: HEARTS_AT.filter(([at]) => at <= L).map(([, kind]) => kind),
    freeChests: reached(CHESTS_AT),
    chestDraws: chestDrawsAt(L),
    crateFactor: crateFactorAt(L),
    extraPractices: reached(PRACTICES_AT),
    altar: L >= ALTAR_BEST_AT ? { min: 2, max: 4 } : L >= ALTAR_AT ? { min: 1, max: 3 } : null,
    secondSanctuary: L >= SANCTUARY_AT,
  };
}

/**
 * The chance a crate broken inside floor 0's band gives something at a mastery level: the floor's own base
 * chance (`floorCrateChance`, between CRATE_DROP_MIN and CRATE_DROP) times the crate factor, never above the cap.
 */
export function rootsCrateChance(base: number, level: number): number {
  return Math.min(CRATE_CHANCE_CAP, base * rootsRewards(level).crateFactor);
}

/**
 * One line of the notice: the message key (docs/design/not-built/levels/roots/REWARDS.md §7, `mastery.gain.*`)
 * and its numeric parameters. `stars` is a quality (1 to 4): the caller formats it with `qualityStars`.
 * `lo` and `hi` are percentages.
 */
export interface GainLine { readonly key: string; readonly params: Readonly<Record<string, number>> }

/**
 * The lines that name what the Roots gained when the player reaches `level`: the difference between the table at
 * level - 1 and at level. A level with two changes gives both lines, named steps first and the crate line last.
 * Level 0 gains nothing, and so does a level above 100 (the cap names no step once none is left). Level 1 gives
 * the single `mastery.gain.both` line.
 */
export function gainsAt(level: number): GainLine[] {
  const L = clampLevel(level);
  if (L === 0 || Math.floor(level) > MASTERY_MAX) return [];
  const before = rootsRewards(L - 1);
  const now = rootsRewards(L);
  const lines: GainLine[] = [];
  if (before.oneOfKeyOrBomb && !now.oneOfKeyOrBomb) {
    lines.push({ key: 'mastery.gain.both', params: {} });
  } else {
    if (now.keys > before.keys) lines.push({ key: 'mastery.gain.key', params: { n: now.keys } });
    if (now.bombs > before.bombs) lines.push({ key: 'mastery.gain.bomb', params: { n: now.bombs } });
  }
  // A heart of a kind the Roots already lay gets its own line ("One more ... heart"), not the first-time one.
  for (const kind of now.hearts.slice(before.hearts.length)) {
    const again = before.hearts.includes(kind);
    lines.push({ key: again ? `mastery.gain.heartAgain.${kind}` : `mastery.gain.heart.${kind}`, params: {} });
  }
  if (now.freeChests > before.freeChests) lines.push({ key: 'mastery.gain.chest', params: { n: now.freeChests } });
  if (now.chestDraws.min !== before.chestDraws.min || now.chestDraws.max !== before.chestDraws.max) {
    lines.push({ key: 'mastery.gain.chestDraws', params: {} });
  }
  if (now.extraPractices > before.extraPractices) {
    lines.push({ key: 'mastery.gain.practice', params: { n: now.extraPractices, stars: EXTRA_PRACTICE_BAND.max } });
  }
  if (!before.altar && now.altar) {
    lines.push({ key: 'mastery.gain.altar', params: { stars: now.altar.max } });
  } else if (before.altar && now.altar && (before.altar.min !== now.altar.min || before.altar.max !== now.altar.max)) {
    lines.push({ key: 'mastery.gain.altarBest', params: { stars: now.altar.max } });
  }
  if (now.secondSanctuary && !before.secondSanctuary) lines.push({ key: 'mastery.gain.sanctuary', params: {} });
  if (now.crateFactor !== before.crateFactor) {
    const pct = (chance: number) => Math.round(chance * 100);
    lines.push({
      key: 'mastery.gain.crates',
      params: { lo: pct(rootsCrateChance(CRATE_DROP_MIN, L)), hi: pct(rootsCrateChance(CRATE_DROP, L)) },
    });
  }
  return lines;
}
