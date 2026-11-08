import { describe, expect, it } from 'vitest';
import { PALETTE } from '../src/content/palette';
import { castPolarityToken } from '../src/input/touch';

describe('touch fire button: polarity colour', () => {
  it('is the gold of the positive intention', () => {
    expect(castPolarityToken('positive')).toBe('light.gold');
  });

  it('is the ember of the negative intention', () => {
    expect(castPolarityToken('negative')).toBe('light.ember');
  });

  it('is always a palette token, and the two polarities differ', () => {
    const pos = castPolarityToken('positive'), neg = castPolarityToken('negative');
    expect(PALETTE[pos]).toBeDefined();
    expect(PALETTE[neg]).toBeDefined();
    expect(pos).not.toBe(neg);
  });
});
