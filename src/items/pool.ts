// Item pools: weighted draws without replacement, from a seeded RNG stream.
// Each run owns its pools, so an item never shows up twice in the same run.

import type { Rng } from '../core/rng';
import type { ItemDef, PoolName } from './types';

export class ItemPools {
  private left = new Map<PoolName, Map<string, number>>();

  constructor(items: readonly ItemDef[], private rng: Rng) {
    for (const item of items) {
      for (const [pool, weight] of Object.entries(item.pools) as [PoolName, number][]) {
        if (!weight) continue;
        if (!this.left.has(pool)) this.left.set(pool, new Map());
        this.left.get(pool)!.set(item.id, weight);
      }
    }
  }

  /** Draws an item id from `pool` (falling back to 'treasure') and removes it from every pool. */
  draw(pool: PoolName): string | null {
    const p = this.left.get(pool)?.size ? this.left.get(pool)! : this.left.get('treasure');
    if (!p || !p.size) return null;
    let total = 0;
    for (const w of p.values()) total += w;
    let r = this.rng.next() * total;
    for (const [id, w] of p) {
      r -= w;
      if (r <= 0) { this.remove(id); return id; }
    }
    const last = [...p.keys()].pop()!;
    this.remove(last);
    return last;
  }

  /** Removes an item from every pool (e.g. because the player already has it). */
  remove(id: string) { for (const p of this.left.values()) p.delete(id); }

  size(pool: PoolName) { return this.left.get(pool)?.size ?? 0; }
}
