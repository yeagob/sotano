// Layered stats, recomputed from scratch (see docs/TECHNICAL.md §4.3).
// value = clamp((base + Σ adds) × Π multipliers, min, max) → final overrides
//
// Everything the player can do is driven by a stat here, so any item can change it:
// shooting, moving, jumping, how many blocks you carry, how hard you kick or throw,
// and which blocks shatter just by walking into them.

export type StatName =
  | 'damage' | 'fireRate' | 'shotSpeed' | 'range' | 'gravity' | 'size' | 'luck' | 'mining'
  | 'moveSpeed' | 'jump' | 'reach'
  | 'carry' | 'kick' | 'throw' | 'crush'
  | 'maxHearts' | 'invuln' | 'bombRadius' | 'bombDamage';

export type StatLayer = 'add' | 'mul' | 'final';

export interface StatMod {
  stat: StatName;
  layer: StatLayer;
  value: number;
  source: string;
}

export type Stats = Record<StatName, number>;

export const BASE_STATS: Stats = {
  damage: 3.5,     // damage per intention to actors (projections)
  fireRate: 2.7,   // shots per second
  shotSpeed: 1,    // relative (1 = 16 blocks/s)
  range: 1,        // relative (1 = 0.5 s straight before dropping)
  gravity: 1,      // relative (1 = 22 blocks/s²)
  size: 1,         // relative (radius 0.12)
  luck: 0,
  mining: 3.5,     // damage per intention to blocks (separate from `damage`, which hurts actors)
  moveSpeed: 1,    // relative (1 = 4.6 blocks/s)
  jump: 1,         // relative jump height (1 ≈ 1.25 blocks)
  reach: 5,        // reach for placing blocks
  carry: 1,        // how many blocks you can hold (floored)
  kick: 1,         // kick strength multiplier
  throw: 1,        // throw strength multiplier
  crush: -1,       // highest block tier that shatters on contact (-1 = none)
  maxHearts: 3,    // heart containers (each holds 8 damage points, drawn in quarters)
  invuln: 1,       // seconds of invulnerability after being hit
  bombRadius: 2.6, // blocks
  bombDamage: 40,  // damage to blocks at the centre of a bomb
};

export const STAT_LIMITS: Partial<Record<StatName, [number, number]>> = {
  damage: [0.5, 999],
  fireRate: [0.3, 30],
  shotSpeed: [0.3, 4],
  range: [0.2, 6],
  gravity: [0, 6],
  size: [0.3, 5],
  mining: [0.35, 350],
  moveSpeed: [0.3, 3],
  jump: [0.3, 5],
  carry: [1, 9],
  kick: [0.2, 6],
  throw: [0.2, 6],
  crush: [-1, 3],
  maxHearts: [1, 12],
  invuln: [0.2, 5],
  bombRadius: [1, 8],
  bombDamage: [5, 500],
};

/** How the stats panel shows each stat. `fmt` turns the value into text. */
export const STAT_INFO: Record<StatName, { label: string; fmt: (v: number) => string }> = {
  damage: { label: 'Damage', fmt: v => v.toFixed(2) },
  fireRate: { label: 'Fire rate', fmt: v => `${v.toFixed(2)}/s` },
  shotSpeed: { label: 'Shot speed', fmt: v => `×${v.toFixed(2)}` },
  range: { label: 'Range', fmt: v => `×${v.toFixed(2)}` },
  gravity: { label: 'Drop', fmt: v => `×${v.toFixed(2)}` },
  size: { label: 'Size', fmt: v => `×${v.toFixed(2)}` },
  mining: { label: 'Mining', fmt: v => v.toFixed(2) },
  luck: { label: 'Luck', fmt: v => v.toFixed(1) },
  moveSpeed: { label: 'Speed', fmt: v => `×${v.toFixed(2)}` },
  jump: { label: 'Jump', fmt: v => `×${v.toFixed(2)}` },
  reach: { label: 'Reach', fmt: v => `${v.toFixed(1)} blocks` },
  carry: { label: 'Carry', fmt: v => `${Math.floor(v)} block${Math.floor(v) === 1 ? '' : 's'}` },
  kick: { label: 'Kick', fmt: v => `×${v.toFixed(2)}` },
  throw: { label: 'Throw', fmt: v => `×${v.toFixed(2)}` },
  crush: { label: 'Crush', fmt: v => (v < 0 ? 'none' : `tier ≤ ${Math.floor(v)}`) },
  maxHearts: { label: 'Hearts', fmt: v => `${Math.floor(v)}` },
  invuln: { label: 'Recovery', fmt: v => `${v.toFixed(1)} s` },
  bombRadius: { label: 'Bomb radius', fmt: v => `${v.toFixed(1)} blocks` },
  bombDamage: { label: 'Bomb power', fmt: v => v.toFixed(0) },
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
    // safety layer: a broken modifier must never poison the game with NaN or Infinity
    if (!Number.isFinite(v)) {
      const culprits = mods.filter(m => m.stat === k).map(m => `${m.source} ${m.layer} ${m.value}`);
      console.error(`[stats] ${k} became ${v}; using the base value. Modifiers: ${culprits.join(', ')}`);
      v = base[k];
    }
    out[k] = v;
  }
  return out;
}

/** Stats whose value differs between two sheets (for "what did this item change?"). */
export function diffStats(before: Stats, after: Stats): { stat: StatName; from: number; to: number }[] {
  return (Object.keys(after) as StatName[])
    .filter(k => Math.abs(after[k] - before[k]) > 1e-9)
    .map(k => ({ stat: k, from: before[k], to: after[k] }));
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
