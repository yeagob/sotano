// Item pools (docs/architecture/RNG.md §3.4).
//
// Pedestal items are part of the run's structure: at run start every treasure and vault room
// of every floor gets its item **reserved**, in (floor, room) order, from the `reserve` fork.
// Anything that draws an item later (chests, effects, the console) takes from what is neither
// reserved nor taken, on the runtime `loot` stream, so it can never change a pedestal.
// If a pool is exhausted, draws fall back to any unused item, then to any item at all: a
// pedestal is never empty.

import type { Rng } from '../core/rng';
import type { ItemDef, PoolName } from './types';

export class ItemPools {
  private weights = new Map<PoolName, Map<string, number>>();
  private reserved = new Map<string, string>();   // key (e.g. room id) → item id
  private reservedIds = new Set<string>();
  private taken = new Set<string>();
  private all: string[];

  constructor(items: readonly ItemDef[]) {
    this.all = items.map(i => i.id);
    for (const item of items) {
      for (const [pool, weight] of Object.entries(item.pools) as [PoolName, number][]) {
        if (!weight) continue;
        if (!this.weights.has(pool)) this.weights.set(pool, new Map());
        this.weights.get(pool)!.set(item.id, weight);
      }
    }
  }

  /** Reserve one item per slot, in order, from a single fork (run start). */
  reserve(slots: readonly { key: string; pool: PoolName }[], rng: Rng) {
    for (const s of slots) {
      const id = this.pick(s.pool, rng, id => !this.reservedIds.has(id));
      this.reserved.set(s.key, id);
      this.reservedIds.add(id);
    }
  }

  /** The item reserved for a slot (falls back if the player already holds it). */
  reservedFor(key: string): string | undefined { return this.reserved.get(key); }

  /** A runtime draw: never a reserved or taken item; marks it taken. */
  drawRuntime(pool: PoolName, rng: Rng): string {
    const id = this.pick(pool, rng, id => !this.reservedIds.has(id) && !this.taken.has(id));
    this.taken.add(id);
    return id;
  }

  /** The player got this item (from anywhere): it won't be drawn again at runtime. */
  remove(id: string) { this.taken.add(id); }

  isTaken(id: string) { return this.taken.has(id); }

  size(pool: PoolName) {
    return [...(this.weights.get(pool)?.keys() ?? [])].filter(id => !this.reservedIds.has(id) && !this.taken.has(id)).length;
  }

  /** Weighted pick (one uniform draw) from a pool, falling back to treasure, then any unused item, then anything. */
  private pick(pool: PoolName, rng: Rng, ok: (id: string) => boolean): string {
    const u = rng.next();
    for (const p of [pool, 'treasure'] as PoolName[]) {
      const entries = [...(this.weights.get(p) ?? new Map()).entries()].filter(([id]) => ok(id));
      const total = entries.reduce((s, [, w]) => s + w, 0);
      if (!entries.length || total <= 0) continue;
      let r = u * total;
      for (const [id, w] of entries) { r -= w; if (r < 0) return id; }
      return entries[entries.length - 1][0];
    }
    const unused = this.all.filter(ok);
    return unused.length ? unused[Math.floor(u * unused.length)] : this.all[Math.floor(u * this.all.length)];
  }
}
