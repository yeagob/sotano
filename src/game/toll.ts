import type { Carried } from '../entities/player';

export function handTollIds(hand: readonly Carried[]): string[] {
  return hand.map((_, i) => `hand:${i}`);
}
