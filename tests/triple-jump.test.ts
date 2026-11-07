import { describe, expect, it } from 'vitest';
import { ITEM_BY_ID, ITEMS } from '../src/content/items';
import tripleJump from '../src/content/items/triple-jump';
import { SYNERGIES } from '../src/content/synergies';
import { Rng } from '../src/core/rng';
import { computeStats } from '../src/core/stats';
import { ItemPools, isSkyGift } from '../src/items/pool';
import type { PoolName } from '../src/items/types';
import { validateCatalogue, validateItem } from '../src/items/validate';

// SKY.md §9 and §16.4 TJ: the Triple Jump is a sky gift, never drawn at random.
const DRAWN: PoolName[] = ['treasure', 'boss', 'vault'];

describe('the Triple Jump item', () => {
  it('validates, and the whole catalogue validates with it', () => {
    expect(validateItem(tripleJump)).toEqual([]);
    expect(validateCatalogue(ITEMS, SYNERGIES)).toEqual([]);
  });

  it('is in the catalogue under its id, and its only pool is the sky pool', () => {
    expect(ITEM_BY_ID.get('triple-jump')).toBe(tripleJump);
    expect(Object.keys(tripleJump.pools)).toEqual(['sky']);
    expect(isSkyGift(tripleJump)).toBe(true);
  });

  it('gives two air jumps on the airJumps stat (base 0)', () => {
    expect(computeStats((tripleJump.stats ?? []).map(s => ({ ...s, source: 'triple-jump' }))).airJumps).toBe(2);
  });

  it('the validator refuses the sky pool beside any other pool', () => {
    const mixed = { ...tripleJump, pools: { sky: 1, treasure: 1 } };
    expect(validateItem(mixed).some(e => e.includes('sky pool'))).toBe(true);
  });

  it('is never drawn by any pool, even after every other item has been used up', () => {
    const pools = new ItemPools(ITEMS);
    const rng = new Rng(7);
    expect(pools.size('sky' as PoolName)).toBe(0);
    for (let i = 0; i < 3 * ITEMS.length; i++) {
      for (const p of DRAWN) expect(pools.drawRuntime(p, rng)).not.toBe('triple-jump');
    }
  });

  it('leaves every pedestal reservation as it is without the gift (same seed, same items)', () => {
    const slots = Array.from({ length: 12 }, (_, i) => ({ key: `room${i}`, pool: DRAWN[i % DRAWN.length] }));
    const withGift = ITEMS;
    const without = ITEMS.filter(i => i.id !== 'triple-jump');
    for (let seed = 1; seed <= 50; seed++) {
      const a = new ItemPools(withGift), b = new ItemPools(without);
      a.reserve(slots, new Rng(seed));
      b.reserve(slots, new Rng(seed));
      for (const s of slots) {
        expect(a.reservedFor(s.key)).toBe(b.reservedFor(s.key));
        expect(a.reservedFor(s.key)).not.toBe('triple-jump');
      }
    }
  });
});
