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
