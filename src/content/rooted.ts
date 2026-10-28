export const ROOTED_CHANCE: Readonly<Record<number, number>> = {
  1: 0, 2: 0.03, 3: 0.05, 4: 0.07, 5: 0.09, 6: 0.11, 7: 0.13, 8: 0.15, 9: 0.18,
};

export const ROOTED_HP = 1.4;

export function rootedChance(floor: number): number {
  return ROOTED_CHANCE[floor] ?? 0;
}
