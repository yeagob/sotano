// Layered stats, recomputed from scratch (see docs/TECHNICAL.md §4.3).
// value = clamp((base + Σ adds) × Π multipliers, min, max) → final overrides
//
// Everything the player can do is driven by a stat here, so any item can change it:
// shooting, moving, jumping, how many blocks you carry, how hard you kick or throw,
// which blocks shatter just by walking into them, and which ones your head breaks.

import { fmtNum, t } from '../i18n';

export type StatName =
  | 'damage' | 'fireRate' | 'shotSpeed' | 'range' | 'gravity' | 'size' | 'luck' | 'mining'
  | 'moveSpeed' | 'jump' | 'airJumps' | 'wallJumps' | 'reach'
  | 'carry' | 'kick' | 'throw' | 'crush' | 'headbutt'
  | 'maxHearts' | 'invuln' | 'bombRadius' | 'bombDamage' | 'breath' | 'missile' | 'dash' | 'run' | 'crouch' | 'lavaWalk'
  | 'twinCast' | 'triad' | 'spiral' | 'recipes' | 'walkSlow' | 'magnet' | 'flightDamage' | 'freezeSphere' | 'airShield'
  | 'prescience';

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
  airJumps: 0,     // jumps you may make in the air before landing (floored; at most 3: two Triple Jump copies, SKY.md §9)
  wallJumps: 0,    // the last of the airJumps that need a solid block touching your side (floored; Wall Jump, WALL-JUMP.md; 0 = none)
  reach: 4,        // reach for placing blocks, in blocks (4 = 20% less than the old 5; issue #162)
  carry: 2,        // how many blocks you can hold (floored): one per hand
  kick: 1,         // kick strength multiplier
  throw: 1,        // throw strength multiplier
  crush: 0,        // block damage per second of contact with the blocks around you (0 = none)
  headbutt: -1,    // highest block tier your head breaks when you jump into it (-1 = none)
  maxHearts: 3,    // heart containers (each holds 8 damage points, drawn in quarters)
  invuln: 1,       // seconds of invulnerability after being hit
  bombRadius: 2.6, // blocks
  bombDamage: 40,  // damage to blocks at the centre of a bomb
  breath: 8,       // seconds you can stay with your head under water before you start drowning
  missile: 0,      // 1 = a quick double tap of the fire control launches a bomb as a missile (0 = it does not)
  dash: 0,         // 1 = a double tap of a direction dashes 4.5 blocks that way (Irimi, DASH.md; 0 = no dash)
  run: 0,          // 1 = holding the run control moves 45% faster (Fartlek; 0 = no running)
  crouch: 0,       // 1 = holding the crouch control makes the body a block shorter and slower (Child's Pose; 0 = no crouch)
  lavaWalk: 0,     // seconds you may walk on lava before it burns you (Post-Traumatic Growth: 2 per copy); 0 = none
  twinCast: 0,     // 1 = your two hands take turns casting; each shot leaves from the other hand (Bilateral Stimulation)
  triad: 0,        // 1 = each intention flies as three strands in a widening triangle (Rule of Three)
  spiral: 0,       // 1 = each intention flies as three strands on a turning helix (Spiral Growth)
  recipes: 0,      // 1 = the Recipe Book opens (Book of Secrets, src/game/recipe-book.ts; 0 = its key and tab do nothing)
  walkSlow: 0,     // 1 = crouched on the ground, the whole world runs at half speed (Walk Slowly, src/game/time-scale.ts; 0 = no slow)
  magnet: 0,
  flightDamage: 0,
  freezeSphere: 0,
  airShield: 0,
  prescience: 0,   // 1 = the minimap shows every room of the floor and where its practices lie (Prescience, src/game/minimap.ts)
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
  airJumps: [0, 3],
  wallJumps: [0, 3],
  carry: [1, 9],
  kick: [0.2, 6],
  throw: [0.2, 6],
  crush: [0, 200],
  headbutt: [-1, 3],
  maxHearts: [1, 12],
  invuln: [0.2, 5],
  bombRadius: [1, 8],
  magnet: [0, 8],
  bombDamage: [5, 500],
  breath: [1, 120],
  missile: [0, 1],
  dash: [0, 1],
  run: [0, 1],
  crouch: [0, 1],
  lavaWalk: [0, 6],
  twinCast: [0, 1],
  triad: [0, 1],
  spiral: [0, 1],
  recipes: [0, 1],
  walkSlow: [0, 1],
  flightDamage: [0, 1],
  freezeSphere: [0, 1],
  airShield: [0, 1],
  prescience: [0, 1],
};

const times = (v: number) => t('unit.times', { n: fmtNum(v, 2) });
const blocks = (v: number, digits: number) => t('unit.blocks', { n: fmtNum(v, digits), count: v });

/** How the stats panel shows each stat, in the player's language (labels are `stat.<name>`). */
const STAT_FMT: Record<StatName, (v: number) => string> = {
  damage: v => fmtNum(v, 2),
  fireRate: v => t('unit.perSecond', { n: fmtNum(v, 2) }),
  shotSpeed: times,
  range: times,
  gravity: times,
  size: times,
  mining: v => fmtNum(v, 2),
  luck: v => fmtNum(v, 1),
  moveSpeed: times,
  jump: times,
  airJumps: v => fmtNum(Math.floor(v), 0),
  wallJumps: v => fmtNum(Math.floor(v), 0),
  reach: v => blocks(v, 1),
  carry: v => blocks(Math.floor(v), 0),
  kick: times,
  throw: times,
  crush: v => (v <= 0 ? t('unit.crushNone') : t('unit.crushRate', { n: fmtNum(v, 0) })),
  headbutt: v => (v < 0 ? t('unit.crushNone') : t('unit.crushTier', { n: Math.floor(v) })),
  maxHearts: v => fmtNum(Math.floor(v), 0),
  invuln: v => t('unit.seconds', { n: fmtNum(v, 1) }),
  bombRadius: v => blocks(v, 1),
  magnet: v => (v <= 0 ? t('unit.crushNone') : blocks(v, 1)),
  bombDamage: v => fmtNum(v, 0),
  breath: v => t('unit.seconds', { n: fmtNum(v, 1) }),
  missile: v => (v < 1 ? t('unit.crushNone') : t('unit.missileOn')),
  dash: v => (v < 1 ? t('unit.crushNone') : t('unit.dashOn')),
  run: v => (v < 1 ? t('unit.crushNone') : t('unit.runOn')),
  crouch: v => (v < 1 ? t('unit.crushNone') : t('unit.crouchOn')),
  lavaWalk: v => (v < 1 ? t('unit.crushNone') : t('unit.seconds', { n: fmtNum(v, 1) })),
  twinCast: v => (v < 1 ? t('unit.off') : t('unit.alternate')),
  triad: v => (v < 1 ? t('unit.off') : t('unit.on')),
  spiral: v => (v < 1 ? t('unit.off') : t('unit.on')),
  recipes: v => (v < 1 ? t('unit.off') : t('unit.on')),
  walkSlow: v => (v < 1 ? t('unit.off') : t('unit.on')),
  flightDamage: v => (v < 1 ? t('unit.off') : t('unit.on')),
  freezeSphere: v => (v < 1 ? t('unit.off') : t('unit.on')),
  airShield: v => (v < 1 ? t('unit.off') : t('unit.on')),
  prescience: v => (v < 1 ? t('unit.off') : t('unit.on')),
};

export const statLabel = (n: StatName) => t(`stat.${n}`);
export const fmtStat = (n: StatName, v: number) => STAT_FMT[n](v);

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
