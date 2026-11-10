import { describe, expect, it } from 'vitest';
import { Rng, RunRandom } from '../src/core/rng';
import {
  claimCreatureGrowthGift,
  CREATURE_GIFT_TABLE,
  LISTENER_GIFT_TABLE,
  rollCreatureGrowthHeart,
  rollListenerGift,
} from '../src/content/tables/heart-gifts';
import { RARE_HEARTS } from '../src/content/tables/hearts';

describe('The Listener’s reward', () => {
  it('always yields one max-health practice, a special-heart reward, or two red hearts at 15/75/10', () => {
    const weights = LISTENER_GIFT_TABLE.weights({ floor: 1 });
    expect(weights.reduce((sum, entry) => sum + entry.w, 0)).toBe(100);
    expect(Object.fromEntries(weights.map(entry => [entry.value, entry.w]))).toEqual({
      practice: 15,
      special: 75,
      red: 10,
    });

    const rng = new Rng(421);
    const counts = { practice: 0, special: 0, red: 0 };
    const samples = 20000;
    for (let i = 0; i < samples; i++) {
      const gift = rollListenerGift(rng);
      if (gift.kind === 'practice') {
        counts.practice++;
        expect(gift.item.stats?.some(stat => stat.stat === 'maxHearts')).toBe(true);
      } else if (gift.hearts[0] === 'red') {
        counts.red++;
        expect(gift.hearts).toEqual(['red', 'red']);
      } else {
        counts.special++;
        expect(gift.hearts.every(heart => RARE_HEARTS.includes(heart as typeof RARE_HEARTS[number]))).toBe(true);
        if (gift.hearts.length === 2) expect(new Set(gift.hearts).size).toBe(2);
      }
    }
    expect(counts.practice / samples).toBeCloseTo(0.15, 1);
    expect(counts.special / samples).toBeCloseTo(0.75, 1);
    expect(counts.red / samples).toBeCloseTo(0.10, 1);
  });

  it('keeps the double-special-heart reward rare and its two types distinct', () => {
    const rng = new Rng(8401);
    const counts = { special: 0, twoSpecial: 0 };
    const samples = 20000;
    for (let i = 0; i < samples; i++) {
      const gift = rollListenerGift(rng);
      if (gift.kind === 'hearts' && gift.hearts[0] !== 'red') {
        counts.special++;
        if (gift.hearts.length === 2) counts.twoSpecial++;
      }
    }
    expect(counts.special / samples).toBeCloseTo(0.75, 1);
    expect(counts.twoSpecial / counts.special).toBeCloseTo(0.1, 1);
  });

  it('is deterministic for the run seed', () => {
    const draw = (seed: number) => {
      const rng = new Rng(seed);
      return Array.from({ length: 100 }, () => rollListenerGift(rng));
    };
    expect(draw(42)).toEqual(draw(42));
  });
});

describe('first-floor creature growth gifts', () => {
  it('offers only a special heart on 15% of maximum-growth reaches', () => {
    const weights = CREATURE_GIFT_TABLE.weights({ floor: 0 });
    expect(weights.reduce((sum, entry) => sum + entry.w, 0)).toBe(100);
    expect(weights.find(entry => entry.value === 'none')?.w).toBe(85);
    expect(weights.filter(entry => entry.value !== 'none').reduce((sum, entry) => sum + entry.w, 0)).toBe(15);

    const rng = new Rng(512);
    for (let i = 0; i < 1000; i++) {
      const heart = rollCreatureGrowthHeart(rng);
      if (heart !== null) expect(RARE_HEARTS).toContain(heart);
    }
  });

  it('matches the 15% rate over a deterministic sample', () => {
    const rng = new Rng(9163);
    const samples = 20000;
    let gifts = 0;
    for (let i = 0; i < samples; i++) if (rollCreatureGrowthHeart(rng) !== null) gifts++;
    expect(gifts / samples).toBeCloseTo(0.15, 1);
  });

  it('claims the maximum-growth roll once, whether or not a heart was awarded', () => {
    const tags = new Set<string>();
    expect(claimCreatureGrowthGift(tags)).toBe(true);
    expect(tags.has('growth-gifted')).toBe(true);
    expect(claimCreatureGrowthGift(tags)).toBe(false);
  });

  it('uses the gifts stream independently from Listener reward drops', () => {
    const first = new RunRandom(531).stream('gifts');
    const secondRun = new RunRandom(531);
    for (let i = 0; i < 20; i++) secondRun.stream('drops').next();
    const second = secondRun.stream('gifts');
    expect(rollCreatureGrowthHeart(first)).toBe(rollCreatureGrowthHeart(second));
  });
});
