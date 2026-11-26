import { describe, expect, it } from 'vitest';
import { ITEM_BY_ID, ITEMS } from '../src/content/items';
import assertiveRoar from '../src/content/items/assertive-roar';
import coRegulation from '../src/content/items/co-regulation';
import longMemory from '../src/content/items/long-memory';
import openField from '../src/content/items/open-field';
import stillSitting from '../src/content/items/still-sitting';
import { SYNERGIES } from '../src/content/synergies';
import { computeStats } from '../src/core/stats';
import { isSkyGift } from '../src/items/pool';
import { copyMods } from '../src/items/types';
import { validateCatalogue, validateItem } from '../src/items/validate';

const GIFTS = [stillSitting, coRegulation, longMemory, assertiveRoar, openField];

describe('the five deity gifts', () => {
  it('validate, and the whole catalogue validates with them', () => {
    for (const item of GIFTS) expect(validateItem(item)).toEqual([]);
    expect(validateCatalogue(ITEMS, SYNERGIES)).toEqual([]);
  });

  it('are in the catalogue under their ids, and each is a sky gift only', () => {
    for (const item of GIFTS) {
      expect(ITEM_BY_ID.get(item.id)).toBe(item);
      expect(Object.keys(item.pools)).toEqual(['sky']);
      expect(isSkyGift(item)).toBe(true);
    }
  });

  it('have the quality of their floor, panda 1 up to the lion and the horse at 4', () => {
    expect(GIFTS.map(g => g.quality)).toEqual([1, 2, 3, 4, 4]);
  });

  it('change the stats their effect line says, with positive values', () => {
    expect(computeStats(copyMods(stillSitting, 0).map(s => ({ ...s, source: 'still-sitting' }))).invuln).toBe(1.5);
    expect(computeStats(copyMods(coRegulation, 0).map(s => ({ ...s, source: 'co-regulation' }))).carry).toBe(3);
    expect(computeStats(copyMods(longMemory, 0).map(s => ({ ...s, source: 'long-memory' }))).damage).toBeCloseTo(3.5 * 1.2);
    const roar = computeStats(copyMods(assertiveRoar, 0).map(s => ({ ...s, source: 'assertive-roar' })));
    expect([roar.kick, roar.throw]).toEqual([1.5, 1.5]);
    expect(computeStats(copyMods(openField, 0).map(s => ({ ...s, source: 'open-field' }))).moveSpeed).toBeCloseTo(1.25);
  });
});
