import { describe, expect, it } from 'vitest';
import { COOKS, cook, isOut, mealOf, newKitchen } from '../src/game/kitchen';
import { POTIONS } from '../src/content/potions';
import { PART_KINDS } from '../src/content/parts';

describe('the kitchen', () => {
  it('flesh makes the half-heart meal; heart, mind and essence the one-heart meal', () => {
    expect(mealOf('flesh')).toBe('meal-small');
    for (const k of PART_KINDS.filter(k => k !== 'flesh')) expect(mealOf(k)).toBe('meal-hearty');
    expect(POTIONS['meal-small']).toMatchObject({ heal: 4, duration: { kind: 'instant' } });
    expect(POTIONS['meal-hearty']).toMatchObject({ heal: 8, duration: { kind: 'instant' } });
  });

  it('cooks three times and then is out', () => {
    const k = newKitchen();
    expect(COOKS).toBe(3);
    expect([cook(k), cook(k), cook(k)]).toEqual([true, true, true]);
    expect(isOut(k)).toBe(true);
    expect(cook(k)).toBe(false);
    expect(k.cooks).toBe(0);
  });
});

describe('the drink hint', () => {
  it('exists in English and Spanish and takes the key', async () => {
    const { EN: en } = await import('../src/i18n/locales/en');
    const { ES: es } = await import('../src/i18n/locales/es');
    expect(JSON.stringify(en)).toContain("Drink it with {key}");
    expect(JSON.stringify(es)).toContain('Bébetelo con {key}');
  });
});
