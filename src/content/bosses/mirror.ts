// The Shadow's mirror (issue #339, docs/design/built/bosses/SHADOW.md "The mirror"): what the floor 9 keystone
// copies from the practices the player holds when the fight starts. Pure: practice ids in, numbers out. It never
// runs an item's code (items are written against the player, ItemApi); it reads the practices' stat modifiers
// and this file's table, so a practice that only makes sense for the player can never act through the boss.

import { BASE_STATS, computeStats, type StatMod, type StatName } from '../../core/stats';
import { HEART } from '../../entities/actors';
import { BLAST_ACTOR_DAMAGE } from '../../game/bomb';
import type { WeaponId } from '../../game/events';
import { copyMods, type ItemDef, type Req, type StatModSpec, type SynergyDef } from '../../items/types';
import { ITEM_BY_ID } from '../items';
import { SYNERGIES } from '../synergies';

/** Why a practice is not mirrored. Each reason is one row of the "Skipped" list in the Shadow's design. */
export type SkipWhy =
  | 'nourish'  // grows with meals or potions: the Shadow eats and drinks nothing
  | 'tables'   // brewing, cooking, the recipe book: crafting has no meaning in a fight
  | 'miracle'  // a miracle that is neither a shot nor a movement: stopping time, walking through walls, turning lava
  | 'loot'     // luck, keys, rewards of cleared rooms, chests and blasts
  | 'life'     // a checkpoint, healing from allies: its life is your health at entry and nothing else
  | 'defence'  // heart containers, invulnerability, answers to contact or blasts: already in your health at entry
  | 'world'    // blocks, mining, carrying, kicking, throwing, fire and lava underfoot, shots through blocks
  | 'body'     // crouching: the Shadow's body does not change its height
  | 'shot'     // a shot behaviour its cold bolts cannot carry (bounces off blocks, intentions in flight)
  | 'foes'     // works on other projections: the Shadow's only foe is you
  | 'control'; // would take control of your body (freeze you, make you run)

/** One practice in the mirror. `copied`: the same effect with the same numbers, on its shot, its bombs or its
 *  body. `adapted`: the effect translated to a boss verb (a weapon stroke, a strand, a ring). `skipped`: not mirrored. */
export type MirrorRule =
  | { how: 'copied' | 'adapted'; strands?: readonly number[]; damage?: number; scale?: number; harmless?: boolean; lead?: boolean; seed?: boolean; blast?: number; landing?: boolean; burst?: boolean }
  | { how: 'skipped'; why: SkipWhy };

const C = { how: 'copied' } as const;
const A = { how: 'adapted' } as const;
const S = (why: SkipWhy): MirrorRule => ({ how: 'skipped', why });

/**
 * Every practice of the catalogue, classified. A practice missing here fails tests/shadow-mirror.test.ts, so a new
 * practice can never change the boss silently. `strands` adds strands (their damage share) to each shot, `damage`
 * adds to its damage before converting and `scale` multiplies it, `harmless` makes its shots and strokes deal
 * nothing (its bombs still hurt), `lead` aims where you will be, `seed` makes every fifth shot burn, `blast` adds
 * damage to its bomb blasts, `landing` sends a ring from its feet when it lands from a long jump, `burst` sends one
 * when it is hurt.
 */
export const MIRROR_RULES: Readonly<Record<string, MirrorRule>> = {
  acceptance: S('defence'),
  affirmation: S('world'),
  ahamoment: S('foes'),
  apprenticeship: S('tables'),
  arttherapy: S('world'),
  balasana: S('body'),
  bilateral: C,
  boltfromtheblue: { how: 'adapted', blast: 6 },
  bookofsecrets: S('tables'),
  bounceback: S('shot'),
  boundaries: { how: 'adapted', harmless: true },
  boxbreathing: S('defence'),
  breakingbread: S('nourish'),
  catharsis: S('world'),
  chunking: { how: 'adapted', strands: [0.5, 0.5] },
  constellation: S('foes'),
  controlledburn: { how: 'adapted', blast: 4 },
  deepfocus: C,
  dialectic: { how: 'adapted', strands: [0.5, 0.5] },
  discharge: { how: 'adapted', landing: true },
  distillation: S('nourish'),
  dowsing: S('world'),
  drlauncher: C,
  dualprocess: { how: 'copied', strands: [0.6] },
  exposure: S('world'),
  eyecontact: { how: 'adapted', lead: true },
  fartlek: C,
  firewalking: S('world'),
  flow: C,
  forgiveness: S('defence'),
  furoshiki: S('world'),
  grace: S('nourish'),
  gratitude: S('loot'),
  grounding: S('world'),
  habitstack: S('world'),
  harahachibu: S('nourish'),
  herbalism: S('nourish'),
  irimi: C,
  kairos: S('miracle'),
  kaizen: S('world'),
  kiai: A,
  kindling: { how: 'adapted', burst: true },
  kinship: S('life'),
  lionsmane: C,
  luciddream: S('miracle'),
  manthinketh: C,
  meditations: C,
  'menders-thread': S('defence'),
  mindfuleating: S('nourish'),
  mindset: C,
  nothingpersonal: S('defence'),
  nourishment: S('nourish'),
  occamsrazor: A,
  omens: S('loot'),
  posttraumatic: S('world'),
  pressurevalve: C,
  prometheus: { how: 'adapted', seed: true },
  rapport: S('world'),
  reframing: { how: 'adapted', scale: 1.25 },
  resonance: S('shot'),
  ruleofthree: C,
  satori: C,
  secondbrain: S('world'),
  selfcompassion: S('defence'),
  selfefficacy: S('control'),
  selfreliance: C,
  senecaletters: S('world'),
  serendipity: S('loot'),
  sleephygiene: S('defence'),
  socratic: S('loot'),
  solvecoagula: S('miracle'),
  spagyric: S('nourish'),
  spiralgrowth: C,
  stoic: C,
  taoteching: S('world'),
  teaceremony: S('nourish'),
  thinkwaitfast: S('defence'),
  thoughtstopping: S('control'),
  triangulation: { how: 'copied', strands: [0.6, 0.6] },
  'triple-jump': C,
  tummo: { how: 'adapted', damage: 1.5 },
  visualization: C,
  waymark: S('life'),
};

/** The stats the mirror reads. Any other stat of a mirrored practice (mining, luck, carry…) has nothing to act on. */
export const MIRROR_STATS: readonly StatName[] = [
  'damage', 'fireRate', 'shotSpeed', 'range', 'size', 'moveSpeed', 'run', 'jump', 'airJumps', 'dash', 'missile', 'bombRadius', 'bombDamage', 'triad', 'spiral',
];

// ── the conversion (SHADOW.md, "Health"): both sides need the same number of comparable hits ──
/** The Shadow's life for one point of your health: two of your base shots (3.5 each) take a heart (8 points) of
 *  its life, as two of its base strands (4 points each) take a heart of yours. 7/8: a heart is 7 of its life. */
export const LIFE_PER_POINT = (2 * BASE_STATS.damage) / HEART;
/** Points of your health one point of your damage is worth on its side: the inverse, 8/7 (your 3.5 is its 4). */
export const POINTS_PER_DAMAGE = 1 / LIFE_PER_POINT;
/** The Shadow's life from your health in points (hearts and layers) as you enter: the same hearts as yours. */
export const shadowLife = (points: number) => Math.max(1, points) * LIFE_PER_POINT;

// ── the cadence (SHADOW.md, "Not a stream"): it fires as you do, then lets the room breathe ──
/** Shots in one volley, each the full fan of strands, at your own fire interval. */
export const VOLLEY_SHOTS = 3;
/** Seconds between the last shot of a volley and the tell of the next: drawn each time in [MIN, the fight's
 *  maximum], and the maximum drawn once per fight in MAX, both from the fight's own fork (`'boss', 'idle'`). */
export const IDLE = { min: 1, max: [2, 4] } as const;
/** The beat: seconds between its tell and the first shot of a volley, aimed where you stood when the tell began. */
export const BEAT = 0.45;
/** The base bolt speed of a projection's shot (blocks a second), times your shot speed: slower than yours, to be read. */
const BOLT_SPEED = 9;
/** Blocks its volley reaches: your intention's 0.5 s straight flight and its drop, times your range and shot speed. */
const RANGE = 12;
const RUN = 1.45;
const TRIAD_SHARE = 0.7;
const SPIRAL_SHARE = 0.4;
/** A ground jump: 1.25 blocks for the base jump stat, under a projection's gravity (26 blocks/s²). */
const JUMP_V = Math.sqrt(2 * 26 * 1.25);
/** The dash Irimi gives you: 4.5 blocks in a quarter second, and its cooldown. */
export const DASH = { dist: 4.5, seconds: 0.25, cooldown: 1.2 } as const;

export interface MirrorShot {
  /** Damage of a full strand to you, in points. */
  damage: number;
  /** Seconds between two shots of a volley (your fire interval). */
  interval: number;
  /** Damage share of each strand of a shot, the full one first. */
  strands: number[];
  speed: number;
  radius: number;
  /** Blocks it fires from. */
  range: number;
  /** It aims where you will be (Eye Contact). */
  lead: boolean;
  /** Every fifth shot is a fire seed: +5 of your damage, converted (Prometheus). */
  seed: boolean;
}

/** What the Shadow fights with: one snapshot, taken when the fight starts and never changed after. */
export interface Mirror {
  /** The practices mirrored (held and not skipped), in the order the player gained them. */
  practices: string[];
  weapon: WeaponId;
  shot: MirrorShot;
  /** Its shots and strokes deal nothing (Boundaries): its body and its bombs remain. */
  harmless: boolean;
  /** Its top speed, times its own. */
  move: number;
  /** Speed of its jump (blocks a second up) and the jumps it may make in the air before landing. */
  jump: number;
  airJumps: number;
  /** It dashes as you do (Irimi). */
  dash: boolean;
  /** It may launch a bomb as a missile (Dr. Launcher). */
  missile: boolean;
  /** Its bombs, the player's own (game/bomb.ts): radius in blocks, block damage at the centre, points to every actor. */
  bomb: { radius: number; blocks: number; damage: number };
  /** A ring from its feet when it lands from a long jump (Discharge), and when it is hurt (Kindling). */
  landing: boolean;
  burst: boolean;
  /** Seconds its beam charges: yours (2.7 ÷ fire rate), never under 0.8 so it is always read. */
  charge: number;
}

function resolve(held: readonly ItemDef[]): SynergyDef[] {
  const has = (id: string) => held.some(d => d.id === id);
  const count = (tag: string) => held.filter(d => d.tags?.includes(tag)).length;
  const meets = (r: Req) => (typeof r === 'string' ? has(r) : count(r.tag) >= (r.count ?? 1));
  return SYNERGIES.filter(s => s.requires.every(meets));
}

/**
 * The mirror of a set of held practices. Skipped practices are left out before anything is read, so they count
 * toward no synergy or state of being either; the synergies are those the mirrored practices meet, as the
 * inventory resolves them, and the weapon is chosen as the inventory chooses it (highest priority, latest wins).
 * No cap beyond your own power: equality is the point (issue #339). Unknown ids are ignored.
 */
export function mirrorOf(held: readonly string[]): Mirror {
  const defs = held.map(id => ITEM_BY_ID.get(id)).filter((d): d is ItemDef => !!d && MIRROR_RULES[d.id] !== undefined && MIRROR_RULES[d.id].how !== 'skipped');
  const synergies = resolve(defs);
  const mods: StatMod[] = [];
  const copies = new Map<string, number>();
  const take = (id: string, list: readonly StatModSpec[]) => { for (const m of list) if (MIRROR_STATS.includes(m.stat)) mods.push({ ...m, source: id }); };
  // each held copy adds its own modifiers, as in the inventory (Triple Jump's second copy adds one jump)
  for (const d of defs) { const k = copies.get(d.id) ?? 0; copies.set(d.id, k + 1); take(d.id, copyMods(d, k)); }
  for (const syn of synergies) take(syn.id, copyMods(syn));
  const s = computeStats(mods);

  let weapon: { id: WeaponId; priority: number } | null = null;
  for (const e of [...defs, ...synergies]) if (e.weapon && (!weapon || e.weapon.priority >= weapon.priority)) weapon = e.weapon;

  let extra = 0, scale = 1, blast = 0;
  const flags = { harmless: false, lead: false, seed: false, landing: false, burst: false };
  let strands = [1];
  // a practice's own effect counts once, however many copies are held
  for (const id of copies.keys()) {
    const r = MIRROR_RULES[id];
    if (r.how === 'skipped') continue;
    strands.push(...(r.strands ?? []));
    extra += r.damage ?? 0;
    scale *= r.scale ?? 1;
    blast += r.blast ?? 0;
    for (const k of Object.keys(flags) as (keyof typeof flags)[]) flags[k] ||= !!r[k];
  }
  if (s.triad >= 1) strands = strands.flatMap(k => [k * TRIAD_SHARE, k * TRIAD_SHARE, k * TRIAD_SHARE]);
  if (s.spiral >= 1) strands.push(SPIRAL_SHARE, SPIRAL_SHARE);
  strands = strands.sort((a, b) => b - a);

  return {
    practices: defs.map(d => d.id),
    weapon: weapon?.id ?? 'intent',
    shot: {
      damage: (s.damage + extra) * scale * POINTS_PER_DAMAGE,
      interval: 1 / s.fireRate,
      strands,
      speed: BOLT_SPEED * s.shotSpeed,
      radius: 0.12 * s.size,
      range: RANGE * s.range * s.shotSpeed,
      lead: flags.lead,
      seed: flags.seed,
    },
    harmless: flags.harmless,
    move: s.moveSpeed * (s.run >= 1 ? RUN : 1),
    jump: JUMP_V * Math.sqrt(s.jump),
    airJumps: Math.floor(s.airJumps),
    dash: s.dash >= 1,
    missile: s.missile >= 1,
    // the same blast as yours, unconverted (the owner's rule: its bombs are exactly yours), plus its own upgrades
    bomb: { radius: s.bombRadius, blocks: s.bombDamage, damage: BLAST_ACTOR_DAMAGE + blast },
    landing: flags.landing,
    burst: flags.burst,
    charge: Math.max(BEAM.minLead, 2.7 / s.fireRate),
  };
}

// ── its weapons and rings (cold versions of yours, each telegraphed in the attack ramp) ──
/** The blade: a stroke in front of it when you are within its reach (2.5 blocks times your size, at most 3.5, as yours). */
export const bladeReach = (m: Mirror) => Math.min(3.5, 2.5 * m.shot.radius / 0.12);
export const BLADE = { lead: 0.4, live: 0.15, width: 0.6 } as const;
/** The beam: a line 12 blocks long, charged for `Mirror.charge` seconds, live for one. */
export const BEAM = { length: 12, width: 0.35, live: 1, minLead: 0.8 } as const;
/** The great cut: a ring that grows from its feet to about six blocks, low enough to jump. */
export const GREATCUT = { lead: 1.4, live: 0.5, r: 0.8, grow: 10, width: 0.4, height: 1 } as const;
/** A stroke's damage, as your weapons' (combat/weapons.ts): the blade three shots, the great cut four, the beam's ticks three. */
export const strokeDamage = (m: Mirror, weapon: WeaponId) => m.shot.damage * (weapon === 'greatcut' ? 4 : 3);
/** Seconds between two blade strokes: yours (one each 1 ÷ (0.8 × fire rate)). */
export const bladeEvery = (m: Mirror) => m.shot.interval / 0.8;
/** The missile flies to 24 blocks and never starts closer than 5 (its own blast would be on it). */
export const MISSILE = { near: 5, far: 24 } as const;
/** Discharge and Kindling: a ring of 3 blocks (2.5 for Kindling), 4 of your damage points, converted. */
export const RING = { landing: 3, burst: 2.5, damage: 4 * POINTS_PER_DAMAGE, lead: 0.2, live: 0.25, every: 2 } as const;
