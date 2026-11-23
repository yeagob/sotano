import { HEART } from './actors';
import type { HeartKind } from '../content/heart-art';

export type LayerKind = 'blue' | 'black' | 'stone' | 'berserker';
export interface HeartLayer { kind: LayerKind; hp: number }
export interface BloodRegen { left: number; t: number }
export const HEALTH_UNIT = HEART / 100;
export const MAX_TOTAL_HEARTS = 12;
export const STAR_SECONDS = 30;
export const BLOOD_SECONDS = 120;
export const BLOOD_BUDGET = 200 * HEALTH_UNIT;
export const BLOOD_RATE = 3 * HEALTH_UNIT;
export const BERSERK_DAMAGE = 1.5;
export const BERSERK_SPEED = 1.5;
export const BERSERK_JUMP = 1.5;
export const BERSERK_RANGE = 0.3;

export const isLayer = (k: HeartKind): k is LayerKind => k === 'blue' || k === 'black' || k === 'stone' || k === 'berserker';
export const stoneHalve = (amount: number) => Math.floor(amount / HEALTH_UNIT / 2 + 1e-6) * HEALTH_UNIT;
export const heartCount = (hp: number, layers: readonly HeartLayer[]) => Math.ceil(hp / HEART - 1e-9) + layers.length;
export const heartSlots = (maxHearts: number, layers: readonly HeartLayer[]) => maxHearts + layers.length;
/** Containers and extra hearts together stay within MAX_TOTAL_HEARTS: a new heart needs room. */
export const hasHeartRoom = (maxHearts: number, layers: readonly HeartLayer[]) => heartSlots(Math.floor(maxHearts), layers) < MAX_TOTAL_HEARTS;
/**
 * Whether a heart of this kind would be taken now (`Game.collectHeart`): a red one needs missing health; a layer, or a
 * blood heart at full health (which opens a slot), needs room for one more heart.
 */
export function heartFits(kind: HeartKind, hp: number, maxHp: number, maxHearts: number, layers: readonly HeartLayer[]): boolean {
  const slot = kind === 'blood' && hp >= maxHp;
  if (kind === 'red' && hp >= maxHp) return false;
  return !((isLayer(kind) || slot) && !hasHeartRoom(maxHearts, layers));
}
/** The stat source of heart containers that a blood heart opened at full health (#146). Cleared on a new run. */
export const BLOOD_SLOT_SOURCE = 'bloodHeart';
export function landHit(layers: HeartLayer[], amount: number, halve = true): { rest: number; dealt: number; lost: LayerKind[]; halved: boolean } {
  const halved = halve && layers.at(-1)?.kind === 'stone';
  let rest = halved ? stoneHalve(amount) : amount;
  const dealt = rest;
  const lost: LayerKind[] = [];
  while (rest > 1e-9 && layers.length) {
    const top = layers[layers.length - 1];
    const d = Math.min(top.hp, rest);
    top.hp -= d; rest -= d;
    if (top.hp <= 1e-9) { layers.pop(); lost.push(top.kind); }
  }
  return { rest: Math.max(0, rest), dealt, lost, halved };
}
export function tickBlood(r: BloodRegen, dt: number, hp: number, maxHp: number): { heal: number; done: boolean } {
  const room = Math.max(0, maxHp - hp);
  const heal = Math.min(BLOOD_RATE * Math.min(dt, r.t), r.left, room);
  r.left -= heal; r.t -= dt;
  return { heal, done: r.t <= 0 || r.left <= 1e-9 || hp + heal >= maxHp - 1e-9 };
}

export const berserk = (layers: readonly HeartLayer[]) => layers.some(l => l.kind === 'berserker');

/**
 * The black heart's toxic aura (#178, docs/design/built/player/hearts/BLACK.md): while the player
 * holds at least one black heart, every hostile projection within TOXIC_RADIUS blocks of the player
 * takes TOXIC_DAMAGE once every TOXIC_PERIOD seconds. One aura however many black hearts are held.
 * It never touches blocks, the player, allies (converted projections), creatures or presences.
 */
export const TOXIC_RADIUS = 2;
export const TOXIC_PERIOD = 1;
export const TOXIC_DAMAGE = 3;
/** Seconds between the aura's soot motes on its edge (decoration, not a pulse). */
export const TOXIC_MOTE_EVERY = 0.2;

export const toxic = (layers: readonly HeartLayer[]) => layers.some(l => l.kind === 'black');

/** What the aura reads of an actor: an `Enemy` fits, and so does the player. */
export interface ToxicCandidate {
  kind: string;
  faction: string;
  alive: boolean;
  spawning: number;
  body: { x: number; y: number; z: number; h: number; hw: number };
  spec?: { kind?: string };
}

/**
 * True when the aura centred at (x, y, z) (the player's body centre) hurts `a`: a living, hostile
 * projection, not a creature, whose centre is within TOXIC_RADIUS plus its own half-width.
 */
export function toxicHits(a: ToxicCandidate, x: number, y: number, z: number): boolean {
  if (a.kind !== 'projection' || a.faction !== 'projection' || !a.alive || a.spawning > 0) return false;
  if (a.spec?.kind === 'creature') return false;
  const b = a.body;
  return Math.hypot(b.x - x, b.y + b.h / 2 - y, b.z - z) <= TOXIC_RADIUS + b.hw;
}
