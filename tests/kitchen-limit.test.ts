import { describe, expect, it } from 'vitest';
import { COOKS, cook, isOut, newKitchen } from '../src/game/kitchen';

describe('the kitchen cooks three times per run', () => {
  it('a new kitchen has three cooks, and the third one empties it', () => {
    const k = newKitchen();
    expect(COOKS).toBe(3);
    expect(isOut(k)).toBe(false);
    expect(cook(k)).toBe(true);
    expect(cook(k)).toBe(true);
    expect(cook(k)).toBe(true);
    expect(isOut(k)).toBe(true);
  });

  it('a spent kitchen refuses to cook, and refusing spends nothing', () => {
    const k = newKitchen();
    for (let i = 0; i < COOKS; i++) cook(k);
    expect(cook(k)).toBe(false);
    expect(cook(k)).toBe(false);
    expect(k.cooks).toBe(0);
  });
});
