import { table, type Table } from '../../core/tables';
import type { Rng } from '../../core/rng';
import type { HeartKind } from '../heart-art';
import { ITEMS } from '../items';
import { RARE_HEARTS, type RareHeart } from './hearts';

export type HeartGift =
  | { kind: 'practice'; item: (typeof ITEMS)[number] }
  | { kind: 'hearts'; hearts: HeartKind[] };

type ListenerGiftKind = 'practice' | 'special' | 'red';
type CreatureGiftKind = HeartKind | 'none';

export const LISTENER_GIFT_TABLE = table<ListenerGiftKind>('listener-heart-gift', 'runtime', [
  { value: 'practice', weight: 15 },
  { value: 'special', weight: 75 },
  { value: 'red', weight: 10 },
]);

export const CREATURE_GIFT_TABLE = table<CreatureGiftKind>('creature-max-growth-gift', 'runtime', [
  { value: 'none', weight: 85 },
  ...RARE_HEARTS.map(heart => ({ value: heart as CreatureGiftKind, weight: 15 / RARE_HEARTS.length })),
]);

const HEALTH_PRACTICES = ITEMS.filter(item => item.stats?.some(stat => stat.stat === 'maxHearts'));
export const HEALTH_PRACTICE_TABLE = table<(typeof HEALTH_PRACTICES)[number]>('listener-heart-practice', 'runtime',
  HEALTH_PRACTICES.map(item => ({ value: item, weight: 1 })),
);
const SPECIAL_HEART_TABLE = table<RareHeart>('listener-special-heart', 'runtime',
  RARE_HEARTS.map(heart => ({ value: heart, weight: 1 })),
);
const SPECIAL_ALTERNATIVES: Record<RareHeart, Table<RareHeart>> = Object.fromEntries(
  RARE_HEARTS.map(heart => [
    heart,
    table<RareHeart>(`listener-special-heart-without-${heart}`, 'runtime',
      RARE_HEARTS.filter(candidate => candidate !== heart).map(value => ({ value, weight: 1 })),
    ),
  ]),
) as Record<RareHeart, Table<RareHeart>>;
export const SPECIAL_COUNT_TABLE = table<number>('listener-special-heart-count', 'runtime', [
  { value: 1, weight: 9 },
  { value: 2, weight: 1 },
]);
const GIFT_CONTEXT = { floor: 0 };

export const HEART_GIFT_TABLES: readonly Table<unknown>[] = [
  LISTENER_GIFT_TABLE,
  HEALTH_PRACTICE_TABLE,
  SPECIAL_HEART_TABLE,
  ...Object.values(SPECIAL_ALTERNATIVES),
  SPECIAL_COUNT_TABLE,
  CREATURE_GIFT_TABLE,
];

function roll<T>(source: Table<T>, rng: Rng): T {
  const result = source.roll(rng, GIFT_CONTEXT);
  if (result === undefined) throw new Error(`Heart gift table "${source.name}" has no available result`);
  return result;
}

export function rollListenerGift(rng: Rng): HeartGift {
  const kind = roll(LISTENER_GIFT_TABLE, rng);
  if (kind === 'practice') return { kind, item: roll(HEALTH_PRACTICE_TABLE, rng) };
  if (kind === 'red') return { kind: 'hearts', hearts: ['red', 'red'] };

  const count = roll(SPECIAL_COUNT_TABLE, rng);
  const first = roll(SPECIAL_HEART_TABLE, rng);
  const hearts: HeartKind[] = [first];
  if (count === 2) hearts.push(roll(SPECIAL_ALTERNATIVES[first], rng));
  return { kind: 'hearts', hearts };
}

export function rollCreatureGrowthHeart(rng: Rng): HeartKind | null {
  const result = roll(CREATURE_GIFT_TABLE, rng);
  return result === 'none' ? null : result;
}

export function claimCreatureGrowthGift(tags: Set<string>): boolean {
  if (tags.has('growth-gifted')) return false;
  tags.add('growth-gifted');
  return true;
}
