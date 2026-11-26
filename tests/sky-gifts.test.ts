import { describe, expect, it } from 'vitest';
import { ITEM_BY_ID, ITEMS } from '../src/content/items';
import guardingTheCentre from '../src/content/items/guarding-the-centre';
import likeWater from '../src/content/items/like-water';
import selfDistancing from '../src/content/items/self-distancing';
import shield from '../src/content/items/shield';
import tripleJump from '../src/content/items/triple-jump';
import { SYNERGIES } from '../src/content/synergies';
import { computeStats } from '../src/core/stats';
import { isSkyGift } from '../src/items/pool';
import { copyMods } from '../src/items/types';
import { validateCatalogue, validateItem } from '../src/items/validate';
import { DEITIES } from '../src/sky/creatures/deities';
import { ANIMALS } from '../src/sky/types';

const NEW_GIFTS = [selfDistancing, guardingTheCentre, likeWater, shield];
const statsOf = (item: typeof shield) => computeStats(copyMods(item, 0).map(s => ({ ...s, source: item.id })));

describe('the five deity gifts', () => {
  it('are the practice of distance, the freezing sphere, the water, the Shield and the triple jump, in floor order', () => {
    expect(ANIMALS.map(a => DEITIES[a].won.gift)).toEqual(['self-distancing', 'guarding-the-centre', 'like-water', 'shield', 'triple-jump']);
    for (const a of ANIMALS) expect(ITEM_BY_ID.get(DEITIES[a].won.gift!)).toBeDefined();
  });

  it('validate, and the whole catalogue validates with them', () => {
    for (const item of [...NEW_GIFTS, tripleJump]) expect(validateItem(item)).toEqual([]);
    expect(validateCatalogue(ITEMS, SYNERGIES)).toEqual([]);
  });

  it('are in the catalogue under their ids, and each is a sky gift only', () => {
    for (const item of [...NEW_GIFTS, tripleJump]) {
      expect(ITEM_BY_ID.get(item.id)).toBe(item);
      expect(Object.keys(item.pools)).toEqual(['sky']);
      expect(isSkyGift(item)).toBe(true);
    }
  });

  it('the replaced gifts are gone from the catalogue', () => {
    for (const id of ['still-sitting', 'co-regulation', 'long-memory', 'assertive-roar', 'open-field']) expect(ITEM_BY_ID.has(id)).toBe(false);
  });

  it('have the quality of their floor: panda 1, koala 2, elephant 3, lion 4; the triple jump keeps its 3', () => {
    expect(NEW_GIFTS.map(g => g.quality)).toEqual([1, 2, 3, 4]);
    expect(tripleJump.quality).toBe(3);
  });

  it('turn on the stats the game reads: distance damage, the sphere and the Shield; the water is a hook with an id', () => {
    expect(statsOf(selfDistancing).flightDamage).toBe(1);
    expect(statsOf(guardingTheCentre).freezeSphere).toBe(1);
    expect(statsOf(shield).airShield).toBe(1);
    expect(computeStats([]).airShield).toBe(0);
    expect(likeWater.hooks?.map(h => [h.event, h.id])).toEqual([['intentHit', 'water']]);
  });

  it('the Shield comes from the lion only', () => {
    expect(ANIMALS.filter(a => DEITIES[a].won.gift === 'shield')).toEqual(['lion']);
    expect(ITEMS.filter(i => i.stats?.some(s => s.stat === 'airShield'))).toEqual([shield]);
  });
});
