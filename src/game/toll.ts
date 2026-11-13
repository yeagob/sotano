import type { Carried } from '../entities/player';
import { HEART } from '../entities/actors';
import type { HeartLayer } from '../entities/hearts';

export function handTollIds(hand: readonly Carried[]): string[] {
  return hand.map((_, i) => `hand:${i}`);
}

export function tollIndex(at: string | undefined): number | null {
  const i = Number(at);
  return at !== undefined && Number.isInteger(i) && i >= 0 && String(i) === at ? i : null;
}

/** The health base heart `i` holds, in damage points: its own part of the health, never rounded up or down. */
export const baseFill = (hp: number, i: number) => Math.max(0, Math.min(HEART, hp - i * HEART));

/**
 * One tile per heart the toll can take, each one separately: `heart:i` for every base heart that holds health
 * (none while the player has a single base heart left, which must stay), then `layer:j` for every bonus heart.
 */
export function heartTollIds(hp: number, layers: readonly HeartLayer[], maxHearts: number): string[] {
  const base = maxHearts > 1 ? Array.from({ length: Math.ceil(hp / HEART - 1e-9) }, (_, i) => `heart:${i}`) : [];
  return [...base, ...layers.map((_, j) => `layer:${j}`)];
}

/** What giving the chosen hearts does: the health left, the base capacity left, and which bonus hearts go. */
export interface HeartToll {
  /** Health left, in damage points. */
  hp: number;
  /** Base heart containers left. */
  maxHearts: number;
  /** Bonus heart indexes to remove (into `layers`), each one whole. */
  layers: number[];
  /** Health given with the base hearts, in damage points. */
  lost: number;
}

/**
 * The payment of these hearts, or null when it cannot be paid: a base heart that is not there, a payment that
 * would leave no base heart container, or one that would leave no health. Bonus hearts never touch base health.
 */
export function heartTollPlan(hp: number, maxHearts: number, layers: readonly HeartLayer[], base: readonly number[], bonus: readonly number[]): HeartToll | null {
  const count = Math.ceil(hp / HEART - 1e-9);
  if (base.some(i => i >= count) || bonus.some(j => j >= layers.length)) return null;
  if (new Set(base).size !== base.length || new Set(bonus).size !== bonus.length) return null;
  if (maxHearts - base.length < 1) return null;
  const lost = base.reduce((sum, i) => sum + baseFill(hp, i), 0);
  const left = hp - lost;
  if (left <= 1e-9) return null;
  return { hp: left, maxHearts: maxHearts - base.length, layers: [...bonus], lost };
}

/** The base and bonus indexes of the heart tiles a player chose (`heart:i` and `layer:j`). */
export function splitHeartPicks(ids: Iterable<string>): { base: number[]; bonus: number[] } {
  const base: number[] = [], bonus: number[] = [];
  for (const id of ids) {
    const [kind, at] = id.split(':'), i = tollIndex(at);
    if (i === null) continue;
    if (kind === 'heart') base.push(i);
    else if (kind === 'layer') bonus.push(i);
  }
  return { base, bonus };
}
