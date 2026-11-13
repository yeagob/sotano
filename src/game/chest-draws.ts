// What a chest gives when it is opened, and what a pedestal offers, as pure draws (docs/architecture/RNG.md §7). The
// game hands in the stream or fork to draw from and the practice draw of its pool, so the same code runs in the game
// and in the tests that check that floors 1 to 3 draw the same at every mastery level.

import type { Rng } from '../core/rng';
import { CHEST_CONTENTS, CHEST_RARE } from '../content/tables/chests';
import { EXTRA_PRACTICE_BAND } from '../content/tables/roots-mastery';
import type { ItemDef } from '../items/types';
import type { PickupKind } from './events';

/** One thing a chest gives: a pickup kind, or a practice (`def`) of the pool. */
export interface ChestPiece { readonly type: PickupKind | 'item'; readonly def: ItemDef | null }

export interface ChestRoll {
  /** The floor the chest is on (its contents table reads it). */
  readonly floor: number;
  readonly luck: number;
  /** A free chest of the Roots (REWARDS §5): the draws it gives, inclusive. Absent: one to three, as any chest. */
  readonly draws?: { readonly min: number; readonly max: number };
  /** One practice from the pool, in `band` when the chest is the Roots'. Returns null when the pool gives nothing. */
  readonly practice: (rng: Rng, band?: readonly [number, number]) => ItemDef | null;
}

/**
 * The contents of one opened chest. Draw order: the number of draws, then each draw's kind (a practice at most once, a
 * rare extra practice only if none came). A Roots chest's practices are drawn in the gentle band (★ to ★★★).
 */
export function rollChestContents(rng: Rng, o: ChestRoll): ChestPiece[] {
  const out: ChestPiece[] = [];
  const n = o.draws ? rng.int(o.draws.min, o.draws.max) : 1 + (rng.chance(0.4) ? 1 : 0) + (rng.chance(0.15) ? 1 : 0);
  const band = o.draws ? [EXTRA_PRACTICE_BAND.min, EXTRA_PRACTICE_BAND.max] as const : undefined;
  let practice = false;
  for (let i = 0; i < n; i++) {
    const what = CHEST_CONTENTS.roll(rng, { floor: o.floor, luck: o.luck }) ?? 'key';
    const def = what === 'item' && !practice ? o.practice(rng, band) : null;
    if (def) { practice = true; out.push({ type: 'item', def }); }
    else out.push({ type: what === 'item' ? 'key' : what, def: null });
  }
  if (!practice && rng.chance(CHEST_RARE)) {
    const def = o.practice(rng, band);
    if (def) out.push({ type: 'item', def });
  }
  return out;
}

/**
 * A pedestal's offer: its reserved item, unless the player already holds it, then a fresh draw (`redraw`). Returns the
 * item id to show, or null when the pedestal has none.
 */
export function offerPedestal(reserved: string | null, held: (id: string) => boolean, redraw: () => string): string | null {
  if (reserved && held(reserved)) return redraw();
  return reserved;
}
