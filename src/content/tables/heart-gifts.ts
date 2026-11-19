import { table, type Table } from '../../core/tables';
import type { Rng } from '../../core/rng';
import type { HeartKind } from '../heart-art';
import { ITEMS } from '../items';
import type { RareHeart } from './hearts';

/**
 * The kinds a friendly creature's growth gift and The Listener's special heart can give: the five
 * kinds that predate the black heart. Black is a drop only (`RARE_HEARTS`) until the owner gives it
 * a gift weight (issue #154), so these tables keep their previous weights and kinds.
 */
export const GIFT_HEART_KINDS: readonly RareHeart[] = ['blue', 'stone', 'blood', 'star', 'berserker'];

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

// 7.5% of maximum-size reaches give one special heart (owner decision on #172: any floor, half the old 15%)
export const CREATURE_GIFT_TABLE = table<CreatureGiftKind>('creature-max-growth-gift', 'runtime', [
  { value: 'none', weight: 185 },
  ...GIFT_HEART_KINDS.map(heart => ({ value: heart as CreatureGiftKind, weight: 15 / GIFT_HEART_KINDS.length })),
]);

const HEALTH_PRACTICES = ITEMS.filter(item => item.stats?.some(stat => stat.stat === 'maxHearts'));
export const HEALTH_PRACTICE_TABLE = table<(typeof HEALTH_PRACTICES)[number]>('listener-heart-practice', 'runtime',
  HEALTH_PRACTICES.map(item => ({ value: item, weight: 1 })),
);
const SPECIAL_HEART_TABLE = table<RareHeart>('listener-special-heart', 'runtime',
  GIFT_HEART_KINDS.map(heart => ({ value: heart, weight: 1 })),
);
const SPECIAL_ALTERNATIVES: Record<RareHeart, Table<RareHeart>> = Object.fromEntries(
  GIFT_HEART_KINDS.map(heart => [
    heart,
    table<RareHeart>(`listener-special-heart-without-${heart}`, 'runtime',
      GIFT_HEART_KINDS.filter(candidate => candidate !== heart).map(value => ({ value, weight: 1 })),
    ),
  ]),
) as Record<RareHeart, Table<RareHeart>>;
export const SPECIAL_COUNT_TABLE = table<number>('listener-special-heart-count', 'runtime', [
  { value: 1, weight: 9 },
  { value: 2, weight: 1 },
]);
const GIFT_CONTEXT = { floor: 0 };

// The Trickster's trade (docs/design/built/presences/TRICKSTER.md): one heart for one practice of quality three. Four
// draws in five give a practice of quality three that is not a health practice; one in five gives the health practice
// of quality three (the only one with a maximum-health stat today). Weights are proposed, pending the owner's ruling.
type TricksterKind = 'health' | 'practice';
export const TRICKSTER_DEAL_TABLE = table<TricksterKind>('trickster-deal', 'runtime', [
  { value: 'practice', weight: 4 },
  { value: 'health', weight: 1 },
]);
const QUALITY_THREE = ITEMS.filter(item => item.quality === 3);
const TRICKSTER_HEALTH = QUALITY_THREE.filter(item => item.stats?.some(stat => stat.stat === 'maxHearts'));
const TRICKSTER_PRACTICE = QUALITY_THREE.filter(item => !TRICKSTER_HEALTH.includes(item));
export const TRICKSTER_HEALTH_TABLE = table<(typeof ITEMS)[number]>('trickster-health-practice', 'runtime',
  TRICKSTER_HEALTH.map(item => ({ value: item, weight: 1 })),
);
export const TRICKSTER_PRACTICE_TABLE = table<(typeof ITEMS)[number]>('trickster-practice', 'runtime',
  TRICKSTER_PRACTICE.map(item => ({ value: item, weight: 1 })),
);

// The Echo's gift (docs/design/built/presences/ECHO.md): one key or one bomb, an even draw (proposed, pending the owner's ruling).
export const ECHO_GIFT_TABLE = table<'key' | 'bomb'>('echo-gift', 'runtime', [
  { value: 'key', weight: 1 },
  { value: 'bomb', weight: 1 },
]);

// The Wanderer's gift (docs/design/not-built/presences/WANDERER.md, proposed pending the owner's ruling): a tier 1 gift.
// Three draws in four give a practice of quality one; one in four gives one special heart (an even draw of the five kinds).
type WandererKind = 'practice' | 'heart';
export const WANDERER_GIFT_TABLE = table<WandererKind>('wanderer-gift', 'runtime', [
  { value: 'practice', weight: 3 },
  { value: 'heart', weight: 1 },
]);
const QUALITY_ONE = ITEMS.filter(item => item.quality === 1);
export const WANDERER_PRACTICE_TABLE = table<(typeof ITEMS)[number]>('wanderer-practice', 'runtime',
  QUALITY_ONE.map(item => ({ value: item, weight: 1 })),
);
export const WANDERER_HEART_TABLE = table<RareHeart>('wanderer-heart', 'runtime',
  GIFT_HEART_KINDS.map(heart => ({ value: heart, weight: 1 })),
);

// The Child's gift (docs/design/built/presences/CHILD.md, proposed pending the owner's ruling): what it made from the
// player's blocks. Three draws in four give a practice of quality one; one in four gives one special heart (an even draw
// of the five kinds). The Listener's table is unchanged.
type ChildKind = 'practice' | 'heart';
export const CHILD_GIFT_TABLE = table<ChildKind>('child-gift', 'runtime', [
  { value: 'practice', weight: 3 },
  { value: 'heart', weight: 1 },
]);
export const CHILD_PRACTICE_TABLE = table<(typeof ITEMS)[number]>('child-practice', 'runtime',
  QUALITY_ONE.map(item => ({ value: item, weight: 1 })),
);
export const CHILD_HEART_TABLE = table<RareHeart>('child-heart', 'runtime',
  GIFT_HEART_KINDS.map(heart => ({ value: heart, weight: 1 })),
);

// The Witness's gift (docs/design/built/presences/WITNESS.md, proposed pending the owner's ruling): the last gift of the
// depths, tier 2. Three draws in four give a practice of quality two; one in four gives one special heart (an even draw
// of the five kinds).
type TierTwoKind = 'practice' | 'heart';
export const WITNESS_GIFT_TABLE = table<TierTwoKind>('witness-gift', 'runtime', [
  { value: 'practice', weight: 3 },
  { value: 'heart', weight: 1 },
]);
const QUALITY_TWO = ITEMS.filter(item => item.quality === 2);
export const WITNESS_PRACTICE_TABLE = table<(typeof ITEMS)[number]>('witness-practice', 'runtime',
  QUALITY_TWO.map(item => ({ value: item, weight: 1 })),
);
export const WITNESS_HEART_TABLE = table<RareHeart>('witness-heart', 'runtime',
  GIFT_HEART_KINDS.map(heart => ({ value: heart, weight: 1 })),
);

// The Boatman's gift (docs/design/built/presences/BOATMAN.md, proposed pending the owner's ruling): the tier 2 gift of
// the far island. The same weights as the Witness's, its own tables.
export const BOATMAN_GIFT_TABLE = table<TierTwoKind>('boatman-gift', 'runtime', [
  { value: 'practice', weight: 3 },
  { value: 'heart', weight: 1 },
]);
export const BOATMAN_PRACTICE_TABLE = table<(typeof ITEMS)[number]>('boatman-practice', 'runtime',
  QUALITY_TWO.map(item => ({ value: item, weight: 1 })),
);
export const BOATMAN_HEART_TABLE = table<RareHeart>('boatman-heart', 'runtime',
  GIFT_HEART_KINDS.map(heart => ({ value: heart, weight: 1 })),
);

export const HEART_GIFT_TABLES: readonly Table<unknown>[] = [
  LISTENER_GIFT_TABLE,
  HEALTH_PRACTICE_TABLE,
  SPECIAL_HEART_TABLE,
  ...Object.values(SPECIAL_ALTERNATIVES),
  SPECIAL_COUNT_TABLE,
  CREATURE_GIFT_TABLE,
  TRICKSTER_DEAL_TABLE,
  TRICKSTER_HEALTH_TABLE,
  TRICKSTER_PRACTICE_TABLE,
  ECHO_GIFT_TABLE,
  WANDERER_GIFT_TABLE,
  WANDERER_PRACTICE_TABLE,
  WANDERER_HEART_TABLE,
  CHILD_GIFT_TABLE,
  CHILD_PRACTICE_TABLE,
  CHILD_HEART_TABLE,
  WITNESS_GIFT_TABLE,
  WITNESS_PRACTICE_TABLE,
  WITNESS_HEART_TABLE,
  BOATMAN_GIFT_TABLE,
  BOATMAN_PRACTICE_TABLE,
  BOATMAN_HEART_TABLE,
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

/** The practice the Trickster gives for a heart (TRICKSTER_DEAL_TABLE, then the practice pool of that outcome). */
export function rollTricksterPractice(rng: Rng): (typeof ITEMS)[number] {
  return roll(roll(TRICKSTER_DEAL_TABLE, rng) === 'health' ? TRICKSTER_HEALTH_TABLE : TRICKSTER_PRACTICE_TABLE, rng);
}

/** The key or bomb the Echo gives (ECHO_GIFT_TABLE). */
export function rollEchoGift(rng: Rng): 'key' | 'bomb' {
  return roll(ECHO_GIFT_TABLE, rng);
}

/** The Wanderer's gift (WANDERER_GIFT_TABLE): a practice of quality one, or one special heart. */
export function rollWandererGift(rng: Rng): { kind: 'item'; item: (typeof ITEMS)[number] } | { kind: 'heart'; heart: RareHeart } {
  if (roll(WANDERER_GIFT_TABLE, rng) === 'practice') return { kind: 'item', item: roll(WANDERER_PRACTICE_TABLE, rng) };
  return { kind: 'heart', heart: roll(WANDERER_HEART_TABLE, rng) };
}

/** The Child's gift (CHILD_GIFT_TABLE): a practice of quality one, or one special heart. */
export function rollChildGift(rng: Rng): { kind: 'item'; item: (typeof ITEMS)[number] } | { kind: 'heart'; heart: RareHeart } {
  if (roll(CHILD_GIFT_TABLE, rng) === 'practice') return { kind: 'item', item: roll(CHILD_PRACTICE_TABLE, rng) };
  return { kind: 'heart', heart: roll(CHILD_HEART_TABLE, rng) };
}

/** The Witness's gift (WITNESS_GIFT_TABLE): a practice of quality two, or one special heart. */
export function rollWitnessGift(rng: Rng): { kind: 'item'; item: (typeof ITEMS)[number] } | { kind: 'heart'; heart: RareHeart } {
  if (roll(WITNESS_GIFT_TABLE, rng) === 'practice') return { kind: 'item', item: roll(WITNESS_PRACTICE_TABLE, rng) };
  return { kind: 'heart', heart: roll(WITNESS_HEART_TABLE, rng) };
}

/** The Boatman's gift (BOATMAN_GIFT_TABLE): a practice of quality two, or one special heart. */
export function rollBoatmanGift(rng: Rng): { kind: 'item'; item: (typeof ITEMS)[number] } | { kind: 'heart'; heart: RareHeart } {
  if (roll(BOATMAN_GIFT_TABLE, rng) === 'practice') return { kind: 'item', item: roll(BOATMAN_PRACTICE_TABLE, rng) };
  return { kind: 'heart', heart: roll(BOATMAN_HEART_TABLE, rng) };
}

// The Elder's lesson (docs/design/built/presences/ELDER.md, proposed pending owner ruling): the path the player chose
// gives one practice that carries that path's tag. Three draws in four are of quality one, one in four of quality two;
// a quality with no practice of that path falls back to the other one (the Will has no quality-one practice today).
export const ELDER_LESSON_TABLE = table<1 | 2>('elder-lesson-quality', 'runtime', [
  { value: 1, weight: 3 },
  { value: 2, weight: 1 },
]);

export function rollElderLesson(rng: Rng, path: string): (typeof ITEMS)[number] {
  const pool = (quality: 1 | 2) => ITEMS.filter(item => item.quality === quality && item.tags?.includes(path));
  let quality = roll(ELDER_LESSON_TABLE, rng);
  if (pool(quality).length === 0) quality = quality === 1 ? 2 : 1;
  return rng.pick(pool(quality));
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
