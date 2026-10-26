// Weighted tables: every random choice in the game reads one (docs/architecture/RNG.md §4).
//
// Structure tables are rolled at carve time with a frozen context ({ floor }) and never see
// luck or the player. Runtime tables may scale weights with luck. Both roll against a single
// uniform `u` drawn first, so the same seed and the same context always give the same pick.

import type { Rng } from './rng';

export interface TableEntry<T> {
  value: T;
  weight: number;
  minFloor?: number;
  maxFloor?: number;
  /** Runtime tables only: weight × (1 + luck × this). */
  luck?: number;
}

export interface RollContext { floor: number; luck?: number }

export class Table<T> {
  constructor(readonly name: string, readonly entries: readonly TableEntry<T>[], readonly kind: 'structure' | 'runtime') {}

  /** Entries available in this context, with their effective weights. */
  weights(ctx: RollContext): { value: T; w: number }[] {
    const luck = this.kind === 'runtime' ? Math.max(0, ctx.luck ?? 0) : 0;
    return this.entries
      .filter(e => (e.minFloor ?? -Infinity) <= ctx.floor && ctx.floor <= (e.maxFloor ?? Infinity))
      .map(e => ({ value: e.value, w: e.weight * (1 + luck * (e.luck ?? 0)) }))
      .filter(e => e.w > 0);
  }

  /** Pick against a fixed uniform u in [0, 1). */
  pickU(u: number, ctx: RollContext): T | undefined {
    const ws = this.weights(ctx);
    const total = ws.reduce((s, e) => s + e.w, 0);
    if (!ws.length || total <= 0) return undefined;
    let r = u * total;
    for (const e of ws) { r -= e.w; if (r < 0) return e.value; }
    return ws[ws.length - 1].value;
  }

  roll(rng: Rng, ctx: RollContext): T | undefined { return this.pickU(rng.next(), ctx); }
}

export const table = <T>(name: string, kind: 'structure' | 'runtime', entries: TableEntry<T>[]) => new Table(name, entries, kind);
