// The Shadow's summons (issue #372, docs/design/built/bosses/SHADOW.md "Its summons"): it calls the beings you made
// your friends in this run, hostile, one at a time. Pure: which beings, in what order, and how often. The Shadow
// (shadow.ts) asks the game to announce each one near it; the game spawns it through its one spawn path.

import { wobble } from '../../enemies/behaviours';
import type { EnemyDef } from '../../enemies/types';

/** Seconds into the fight before its first summon: after its first breath, once you have seen it copy you. */
export const SUMMON_FIRST = 4;
/** Seconds between two summons: at least this, plus a seeded share of SUMMON_SPREAD (7 to 10 s). */
export const SUMMON_EVERY = 7;
export const SUMMON_SPREAD = 3;
/** Live summons at most (alive and hostile, or still in their omen): the fight stays one against you, with company. */
export const SUMMON_CAP = 3;

/** The friend lists a summon pool is drawn from: the tally's ids by kind (game/ally-tally.ts `defs`). */
export interface FriendLists { defs(kind: 'projection' | 'mended'): readonly string[] }

/**
 * Every friend of the run that can be summoned, one entry per friend (two Doubts befriended are two entries), the
 * projections first, then the mended allies, each in the order they were made. Only projections come: a deity is
 * never a being of the dungeon, a boss is one per floor with its floor's life, and a creature is no pattern and has
 * no omen to come through. An id the catalogue does not know as a projection is left out.
 */
export function summonPool(tally: FriendLists, byId: ReadonlyMap<string, EnemyDef>): string[] {
  return [...tally.defs('projection'), ...tally.defs('mended')].filter(id => {
    const d = byId.get(id);
    return !!d && (d.kind ?? 'projection') === 'projection';
  });
}

/** The n-th summon (from 0): the pool in turn, so every kind comes before any comes twice more than its count. */
export const summonAt = (pool: readonly string[], n: number): string | null => (pool.length ? pool[n % pool.length] : null);

/** Seconds from the n-th summon to the next one, seeded by the Shadow's id: never random. */
export const summonGap = (id: number, n: number) => SUMMON_EVERY + wobble(id, n, 61) * SUMMON_SPREAD;
