import { describe, expect, it } from 'vitest';
import { PALETTE } from '../src/content/palette';
import { HUD_ICONS } from '../src/content/hud-icons';
import { bombGlyph, castPolarityToken } from '../src/input/touch';

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

describe('polarity look: the bomb and the marks', () => {
  it('the bomb is the white seed for a positive intention and the black seed for a negative one', () => {
    expect(bombGlyph('positive')).toBe('seedLove');
    expect(bombGlyph('negative')).toBe('seed');
  });

  it('the polarity marks and the white seed are 10 × 10, and every colour they use is a palette token', () => {
    for (const name of ['seedLove', 'intentPositive', 'intentNegative'] as const) {
      const icon = HUD_ICONS[name] as { rows: string[]; palette: Record<string, string> };
      expect(icon.rows, name).toHaveLength(10);
      for (const row of icon.rows) expect(row, name).toHaveLength(10);
      for (const row of icon.rows) for (const ch of row) {
        if (ch === '.') continue;
        const token = icon.palette[ch];
        expect(token, `${name}:${ch}`).toBeDefined();
        expect(PALETTE[token as keyof typeof PALETTE], `${name}:${ch}`).toBeDefined();
      }
    }
  });

  it('the two marks have the same silhouette, so the value of the bead carries the polarity', () => {
    const shape = (rows: string[]) => rows.map(r => r.replace(/[^.]/g, '#')).join('\n');
    expect(shape(HUD_ICONS.intentPositive.rows)).toBe(shape(HUD_ICONS.intentNegative.rows));
  });
});
