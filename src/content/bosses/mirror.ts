// The Shadow's mirror (issue #339, docs/design/built/bosses/SHADOW.md "The mirror"): what the floor 9 keystone
// copies from the practices the player holds when the fight starts. Pure: practice ids in, numbers out. It never
// runs an item's code (items are written against the player, ItemApi); it reads the practices' stat modifiers
// and this file's table, so a practice that only makes sense for the player can never act through the boss.

import { BASE_STATS, computeStats, type StatMod, type StatName } from '../../core/stats';
import type { WeaponId } from '../../game/events';
import type { ItemDef, Req, SynergyDef } from '../../items/types';
import { ITEM_BY_ID } from '../items';
import { SYNERGIES } from '../synergies';

/** Why a practice is not mirrored. Each reason is one row of the "Skipped" list in the Shadow's design. */
export type SkipWhy =
  | 'nourish'  // grows with meals or potions: the Shadow eats and drinks nothing
  | 'tables'   // brewing, cooking, the recipe book: crafting has no meaning in a fight
  | 'miracle'  // a miracle (milagros): stopping time, walking through walls, a missile, turning lava
  | 'loot'     // luck, keys, rewards of cleared rooms and chests
  | 'life'     // a checkpoint, healing from allies: the Shadow's life is not the mirror's to change (#315)
  | 'defence'  // heart containers, invulnerability, contact or blast protection, answers to being hurt (#315)
  | 'world'    // blocks, mining, carrying, kicking, throwing, fire and lava underfoot
  | 'bombs'    // bomb blasts: the Shadow carries no bombs
  | 'body'     // crouching, jumping, falls: the Shadow's body has none of these verbs
  | 'shot'     // a shot behaviour its cold bolts cannot carry (bounces, splits, homing, seeds)
  | 'foes'     // works on other projections: the Shadow's only foe is you
  | 'control'; // would take control of your body (freeze you, make you run)

/** One practice in the mirror. `copied`: the same effect with the same numbers, on its shot or its body.
 *  `adapted`: the effect translated to a boss verb (a weapon stroke, a dodge, a top speed). `skipped`: not mirrored. */
export type MirrorRule =
  | { how: 'copied' | 'adapted'; strands?: readonly number[]; damage?: number; harmless?: boolean }
  | { how: 'skipped'; why: SkipWhy };

const C = { how: 'copied' } as const;
const A = { how: 'adapted' } as const;
const S = (why: SkipWhy): MirrorRule => ({ how: 'skipped', why });

/**
 * Every practice of the catalogue, classified. A practice missing here fails tests/shadow-mirror.test.ts, so a new
 * practice can never change the boss silently. `strands` adds strands (their damage share) to each volley,
 * `damage` adds to its damage before scaling, `harmless` makes its shot and strokes deal nothing.
 */
export const MIRROR_RULES: Readonly<Record<string, MirrorRule>> = {
  acceptance: S('defence'),
  affirmation: S('world'),
  ahamoment: S('foes'),
  apprenticeship: S('tables'),
  arttherapy: S('world'),
  balasana: S('body'),
  bilateral: C,
  boltfromtheblue: S('bombs'),
  bookofsecrets: S('tables'),
  bounceback: S('shot'),
  boundaries: { how: 'adapted', harmless: true },
  boxbreathing: S('defence'),
  breakingbread: S('nourish'),
  catharsis: S('world'),
  chunking: S('shot'),
  constellation: S('foes'),
  controlledburn: S('bombs'),
  deepfocus: C,
  dialectic: S('shot'),
  discharge: S('body'),
  distillation: S('nourish'),
  dowsing: S('shot'),
  drlauncher: S('miracle'),
  dualprocess: { how: 'copied', strands: [0.6] },
  exposure: S('world'),
  eyecontact: S('shot'),
  fartlek: A,
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
  irimi: A,
  kairos: S('miracle'),
  kaizen: S('world'),
  kiai: A,
  kindling: S('defence'),
  kinship: S('life'),
  lionsmane: S('body'),
  luciddream: S('miracle'),
  manthinketh: C,
  meditations: C,
  'menders-thread': S('defence'),
  mindfuleating: S('nourish'),
  mindset: S('body'),
  nothingpersonal: S('defence'),
  nourishment: S('nourish'),
  occamsrazor: A,
  omens: S('loot'),
  posttraumatic: S('world'),
  pressurevalve: S('bombs'),
  prometheus: S('shot'),
  rapport: S('world'),
  reframing: S('shot'),
  resonance: S('shot'),
  ruleofthree: C,
  satori: C,
  secondbrain: S('world'),
  selfcompassion: S('defence'),
  selfefficacy: S('control'),
  selfreliance: C,
  senecaletters: S('world'),
  serendipity: S('bombs'),
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
  'triple-jump': S('body'),
  tummo: { how: 'adapted', damage: 1.5 },
  visualization: C,
  waymark: S('life'),
};

/** The stats the mirror reads. Any other stat of a mirrored practice (mining, range, luck…) has nothing to act on. */
export const MIRROR_STATS: readonly StatName[] = ['damage', 'fireRate', 'shotSpeed', 'size', 'moveSpeed', 'run', 'dash', 'triad', 'spiral'];

// ── caps (docs/design/built/bosses/SHADOW.md, "Caps"): a strong build still meets a fight it can win ──
/** Damage of one full strand, in points: the player's damage scaled so the base 3.5 gives 4 (half a heart). */
export const STRAND_DAMAGE: readonly [number, number] = [2, 8];
const DAMAGE_PER_POINT = 4 / BASE_STATS.damage;
/** Volleys a second: 0.35 of the player's fire rate (the base 2.7 gives about one a second). */
export const VOLLEY_RATE: readonly [number, number] = [0.6, 1.6];
const RATE_SHARE = 0.35;
/** Strands in one volley, the full one first. */
export const MAX_STRANDS = 5;
/** Damage points a second its volleys can deal at most (a heart and a half): over it, damage drops first, then rate. */
export const MAX_DPS = 12;
/** Bolt speed in blocks a second: 9 for the base shot speed. */
export const BOLT_SPEED: readonly [number, number] = [6, 13];
/** Bolt radius in blocks: the enemy bolt's 0.12 times the player's size. */
export const BOLT_RADIUS: readonly [number, number] = [0.12, 0.3];
/** Its top speed against the boss's own: the player's move speed (and running's 1.45) within these bounds. */
export const MOVE: readonly [number, number] = [0.7, 1.5];
/** The beat: seconds between its tell and the volley, aimed where you stood when the tell began. */
export const BEAT = 0.45;
/** The dash a mirrored Irimi gives its dodge: 4.5 blocks, as yours, and a shorter cooldown. */
export const DASH = { dist: 4.5, seconds: 0.25, cooldown: 1.2 } as const;
const RUN = 1.45;
const TRIAD_SHARE = 0.7;
const SPIRAL_SHARE = 0.4;

export interface MirrorShot {
  /** Damage of a full strand, in points. */
  damage: number;
  /** Volleys a second. */
  rate: number;
  /** Damage share of each strand of a volley, the full one first. */
  strands: number[];
  speed: number;
  radius: number;
}

/** What the Shadow fights with: one snapshot, taken when the fight starts and never changed after. */
export interface Mirror {
  /** The practices mirrored (held and not skipped), in the order the player gained them. */
  practices: string[];
  weapon: WeaponId;
  shot: MirrorShot;
  /** Its shot and strokes deal nothing (Boundaries): it keeps only its body. */
  harmless: boolean;
  /** Its top speed, times its own. */
  move: number;
  /** Its dodge is a dash (Irimi). */
  dash: boolean;
  /** Seconds its beam charges: yours (2.7 ÷ fire rate), never under 0.8 so it is always read. */
  charge: number;
}

const clamp = (v: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, v));

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
 * Unknown ids are ignored.
 */
export function mirrorOf(held: readonly string[]): Mirror {
  const defs = held.map(id => ITEM_BY_ID.get(id)).filter((d): d is ItemDef => !!d && MIRROR_RULES[d.id] !== undefined && MIRROR_RULES[d.id].how !== 'skipped');
  const synergies = resolve(defs);
  const mods: StatMod[] = [];
  for (const e of [...defs, ...synergies]) for (const m of e.stats ?? []) if (MIRROR_STATS.includes(m.stat)) mods.push({ ...m, source: e.id });
  const s = computeStats(mods);

  let weapon: { id: WeaponId; priority: number } | null = null;
  for (const e of [...defs, ...synergies]) if (e.weapon && (!weapon || e.weapon.priority >= weapon.priority)) weapon = e.weapon;

  let extra = 0, harmless = false;
  let strands = [1];
  for (const d of defs) {
    const r = MIRROR_RULES[d.id];
    if (r.how === 'skipped') continue;
    strands.push(...(r.strands ?? []));
    extra += r.damage ?? 0;
    harmless ||= !!r.harmless;
  }
  if (s.triad >= 1) strands = strands.flatMap(k => [k * TRIAD_SHARE, k * TRIAD_SHARE, k * TRIAD_SHARE]);
  if (s.spiral >= 1) strands.push(SPIRAL_SHARE, SPIRAL_SHARE);
  strands = strands.sort((a, b) => b - a).slice(0, MAX_STRANDS);

  let damage = clamp((s.damage + extra) * DAMAGE_PER_POINT, STRAND_DAMAGE);
  let rate = clamp(s.fireRate * RATE_SHARE, VOLLEY_RATE);
  const total = strands.reduce((a, k) => a + k, 0);
  if (damage * total * rate > MAX_DPS) damage = Math.max(STRAND_DAMAGE[0], MAX_DPS / (total * rate));
  if (damage * total * rate > MAX_DPS) rate = MAX_DPS / (total * damage);

  return {
    practices: defs.map(d => d.id),
    weapon: weapon?.id ?? 'intent',
    shot: { damage, rate, strands, speed: clamp(9 * s.shotSpeed, BOLT_SPEED), radius: clamp(0.12 * s.size, BOLT_RADIUS) },
    harmless,
    move: clamp(s.moveSpeed * (s.run >= 1 ? RUN : 1), MOVE),
    dash: s.dash >= 1,
    charge: clamp(2.7 / s.fireRate, [BEAM.minLead, BEAM.maxLead]),
  };
}

// ── its weapons (cold versions of yours, each telegraphed in the attack ramp) ──
/** The blade: a stroke in front of it when you are within its reach (2.5 blocks times your size, at most 3.5). */
export const bladeReach = (m: Mirror) => Math.min(3.5, 2.5 * m.shot.radius / 0.12);
export const BLADE = { lead: 0.4, live: 0.15, width: 0.6, every: 1.5 } as const;
/** The beam: a line 12 blocks long, charged for `Mirror.charge` seconds, live for one. */
export const BEAM = { length: 12, width: 0.35, live: 1, rest: 2.5, minLead: 0.8, maxLead: 2 } as const;
/** The great cut: a ring that grows from its feet to about six blocks, low enough to jump, a heart at most. */
export const GREATCUT = { lead: 1.4, live: 0.5, r: 0.8, grow: 10, width: 0.4, height: 1, damage: 8, rest: 4 } as const;
/** A stroke's damage: the beam hits once for half again a strand, never over a heart. */
export const strokeDamage = (m: Mirror, weapon: WeaponId) => (weapon === 'greatcut' ? GREATCUT.damage : weapon === 'beam' ? Math.min(8, m.shot.damage * 1.5) : m.shot.damage);
