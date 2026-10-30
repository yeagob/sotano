import { describe, expect, it } from 'vitest';
import { LAST_FLOOR, tollOf } from '../src/content/levels';
import { PART_KINDS, PARTS } from '../src/content/parts';
import { handTollIds, tollIndex } from '../src/game/toll';

describe('the way down asks a toll', () => {
  it('reads only a plain, non-negative whole index: no sign, no fraction, no spare zeros', () => {
    expect(tollIndex('0')).toBe(0);
    expect(tollIndex('7')).toBe(7);
    for (const bad of ['-1', '1.5', '0.0', '01', '', 'x', undefined]) expect(tollIndex(bad), String(bad)).toBeNull();
  });

  it('lets a block or a part in the hand be given, one hand slot each', () => {
    for (const kind of PART_KINDS) {
      const part = PARTS.find(p => p.kind === kind)!;
      expect(handTollIds([part]), part.id).toEqual(['hand:0']);
    }
    const hand = [3, ...PART_KINDS.map(kind => PARTS.find(p => p.kind === kind)!)];
    expect(handTollIds(hand)).toEqual(['hand:0', 'hand:1', 'hand:2', 'hand:3', 'hand:4']);
    expect(handTollIds([])).toEqual([]);
  });

  it('asks one thing from the first level, one more each level, five from floor 4', () => {
    for (let k = 0; k <= 4; k++) expect(tollOf(k), `floor ${k}`).toEqual({ count: k + 1, practices: false });
  });

  it('asks practices from floor 5 on: one, two, three and four', () => {
    for (let k = 5; k <= 8; k++) expect(tollOf(k), `floor ${k}`).toEqual({ count: k - 4, practices: true });
  });

  it('is free from the last floor, which opens into silence, and above the roots', () => {
    expect(tollOf(LAST_FLOOR)).toBeNull();
    expect(tollOf(-1)).toBeNull();
  });
});
