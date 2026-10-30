import type { Carried } from '../entities/player';

export function handTollIds(hand: readonly Carried[]): string[] {
  return hand.map((_, i) => `hand:${i}`);
}

export function tollIndex(at: string | undefined): number | null {
  const i = Number(at);
  return at !== undefined && Number.isInteger(i) && i >= 0 && String(i) === at ? i : null;
}
