import { table, type Table } from '../../core/tables';
import type { Rng, RunRandom } from '../../core/rng';
import type { HeartKind } from '../heart-art';

export type RareHeart = Exclude<HeartKind, 'red'>;

export const HEART_CHANCE: Readonly<Record<RareHeart, readonly [number, number]>> = {
  blue: [0.08, 0.14],
  stone: [0.03, 0.06],
  blood: [0.04, 0.08],
  star: [0.02, 0.04],
  berserker: [0.005, 0.015],
};

export const RARE_HEARTS: readonly RareHeart[] = ['blue', 'stone', 'blood', 'star', 'berserker'];

export function floorHeartChances(rr: RunRandom, floor: number): Record<RareHeart, number> {
  const r = rr.fork('floor', Math.max(0, floor), 'hearts');
  const out = {} as Record<RareHeart, number>;
  for (const k of RARE_HEARTS) { const [lo, hi] = HEART_CHANCE[k]; out[k] = lo + (hi - lo) * r.next(); }
  return out;
}

export function heartTable(chances: Readonly<Record<RareHeart, number>>): Table<HeartKind> {
  const rare = RARE_HEARTS.reduce((s, k) => s + chances[k], 0);
  return table<HeartKind>('heart', 'runtime', [
    { value: 'red', weight: Math.max(0, 1 - rare) },
    ...RARE_HEARTS.map(k => ({ value: k as HeartKind, weight: chances[k] })),
  ]);
}

export const HEART_KIND = heartTable(Object.fromEntries(RARE_HEARTS.map(k => [k, (HEART_CHANCE[k][0] + HEART_CHANCE[k][1]) / 2])) as Record<RareHeart, number>);

export const rollHeart = (rng: Rng, chances: Readonly<Record<RareHeart, number>>, floor: number): HeartKind =>
  heartTable(chances).roll(rng, { floor }) ?? 'red';
