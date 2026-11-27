/** The Mender's integration (MENDER.md; owner, #228, D9): one projection the player released on the Mender's floor comes
 *  back as an ally, once, with the Mender's gold seam. A release is final everywhere else; the Mender is the one exception,
 *  and it mends only what was released on its own floor. Pure: the choice reads the order of the releases, so it draws no
 *  randomness and moves no random stream. */

import type { Tier } from '../../enemies/tiers';

/** The tag of a mended ally: it draws the gold seam (enemies.ts) and is never mended twice. */
export const MENDED_TAG = 'mended';

/** The releases of one run, by floor, in the order they happened: projection ids, never bosses or presences. */
export class ReleaseLog {
  private byFloor = new Map<number, string[]>();
  /** The colour tier of each release, in the same order (tiers.ts): a mended ally keeps the tier it had. */
  private tiersByFloor = new Map<number, Tier[]>();

  record(floor: number, def: string, tier: Tier = 'black'): void {
    const list = this.byFloor.get(floor), tiers = this.tiersByFloor.get(floor);
    if (list && tiers) { list.push(def); tiers.push(tier); }
    else { this.byFloor.set(floor, [def]); this.tiersByFloor.set(floor, [tier]); }
  }

  on(floor: number): readonly string[] {
    return this.byFloor.get(floor) ?? [];
  }

  /** The tier of the last release on a floor (the one the Mender brings back), Black when none was. */
  lastTier(floor: number): Tier {
    const tiers = this.tiersByFloor.get(floor);
    return tiers?.length ? tiers[tiers.length - 1] : 'black';
  }

  clear(): void {
    this.byFloor.clear();
    this.tiersByFloor.clear();
  }
}

/** Whether a death is a release the Mender may bring back: a plain projection (not a boss), and not one already mended. */
export function countsAsRelease(kind: string | undefined, tags: ReadonlySet<string>): boolean {
  return kind !== 'boss' && !tags.has('presence') && !tags.has(MENDED_TAG);
}

/** The projection the Mender brings back: the last one released on its floor, or null when none was. */
export function projectionToMend(released: readonly string[]): string | null {
  return released.length ? released[released.length - 1] : null;
}

/** Seconds between the gold motes of a mended ally's seam: under 2 Hz, inside the 3 Hz rule (DECISIONS.md §14.4). */
export const MENDED_SEAM_S = 0.6;
