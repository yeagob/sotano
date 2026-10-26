// Layered stats, recomputed from scratch (see docs/TECHNICAL.md §4.3).
// value = clamp((base + Σ adds) × Π multipliers, min, max) → final overrides

export type StatName =
  | 'damage' | 'fireRate' | 'shotSpeed' | 'range' | 'gravity' | 'size' | 'luck' | 'mining'
  | 'moveSpeed' | 'jump' | 'reach';

export type StatLayer = 'add' | 'mul' | 'final';

export interface StatMod {
  stat: StatName;
  layer: StatLayer;
  value: number;
  source: string;
}

export type Stats = Record<StatName, number>;

export const BASE_STATS: Stats = {
  damage: 3.5,     // damage per intention
  fireRate: 2.7,   // shots per second
  shotSpeed: 1,    // relative (1 = 16 blocks/s)
  range: 1,        // relative (1 = 0.5 s straight before dropping)
  gravity: 1,      // relative (1 = 22 blocks/s²)
  size: 1,         // relative (radius 0.12)
  luck: 0,
  mining: 1,       // damage multiplier against blocks
  moveSpeed: 1,    // relative (1 = 4.6 blocks/s)
  jump: 1,         // relative (1 ≈ 1.25 blocks)
  reach: 5,        // reach for placing blocks
};

export const STAT_LIMITS: Partial<Record<StatName, [number, number]>> = {
  damage: [0.5, 999],
  fireRate: [0.3, 30],
  shotSpeed: [0.3, 4],
  range: [0.2, 6],
  gravity: [0, 6],
  size: [0.3, 5],
  mining: [0.1, 100],
  moveSpeed: [0.3, 3],
  jump: [0.5, 4],
};

export function computeStats(mods: readonly StatMod[], base: Stats = BASE_STATS): Stats {
  const out = { ...base };
  const add: Partial<Stats> = {};
  const mul: Partial<Stats> = {};
  const fin: Partial<Stats> = {};
  for (const m of mods) {
    if (m.layer === 'add') add[m.stat] = (add[m.stat] ?? 0) + m.value;
    else if (m.layer === 'mul') mul[m.stat] = (mul[m.stat] ?? 1) * m.value;
    else fin[m.stat] = m.value; // the last override wins
  }
  for (const k of Object.keys(out) as StatName[]) {
    let v = (out[k] + (add[k] ?? 0)) * (mul[k] ?? 1);
    const lim = STAT_LIMITS[k];
    if (lim) v = Math.min(lim[1], Math.max(lim[0], v));
    if (fin[k] !== undefined) v = fin[k]!;
    out[k] = v;
  }
  return out;
}

/** Cached container: marked dirty when items/effects change, recomputed on read. */
export class StatSheet {
  private mods: StatMod[] = [];
  private cache: Stats | null = null;

  add(mod: StatMod) { this.mods.push(mod); this.cache = null; }
  clear() { this.mods = []; this.cache = null; }
  removeSource(source: string) { this.mods = this.mods.filter(m => m.source !== source); this.cache = null; }
  get all(): Stats { return (this.cache ??= computeStats(this.mods)); }
  get<K extends StatName>(k: K) { return this.all[k]; }
}
