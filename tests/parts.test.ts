// Parts (docs/design/BESTIARY.md §5.7): twelve parts for the three projections, rolled per
// release at 30 / 12 / 5 / 2 %, named in both shipped languages.

import { describe, expect, it } from 'vitest';
import { PART_CHANCE, PART_KINDS, PARTS, PART_BY_ID, rollParts } from '../src/content/parts';
import { Rng } from '../src/core/rng';
import { LOCALES } from '../src/i18n/locales';

describe('parts', () => {
  it('has four parts for each projection, named by their id', () => {
    const sources = [...new Set(PARTS.map(p => p.source))];
    expect(sources).toHaveLength(38);
    expect(PARTS).toHaveLength(38 * 4);
    expect(new Set(PARTS.map(p => p.id)).size).toBe(38 * 4);
    for (const source of sources) {
      expect(PARTS.filter(p => p.source === source).map(p => p.kind).sort()).toEqual([...PART_KINDS].sort());
    }
    for (const p of PARTS) expect(p.id).toBe(`${p.source}.${p.kind}`);
    expect(PART_BY_ID.get('doubt.flesh')?.name).toBe("Doubt's sack-stone");
  });

  it('rolls each kind at its chance (30 / 12 / 5 / 2 %)', () => {
    const rng = new Rng(7);
    const seen = new Map<string, number>();
    const trials = 40000;
    for (let i = 0; i < trials; i++) for (const p of rollParts(rng, 'doubt')) seen.set(p.kind, (seen.get(p.kind) ?? 0) + 1);
    expect(PART_CHANCE).toEqual({ flesh: 0.3, mind: 0.12, heart: 0.05, essence: 0.02 });
    for (const kind of PART_KINDS) {
      expect(Math.abs((seen.get(kind) ?? 0) / trials - PART_CHANCE[kind])).toBeLessThan(0.01);
    }
  });

  it('is deterministic for a seed and yields nothing for a source with no parts', () => {
    const a = rollParts(new Rng(99), 'panic').map(p => p.id);
    const b = rollParts(new Rng(99), 'panic').map(p => p.id);
    expect(a).toEqual(b);
    for (let s = 1; s < 200; s++) expect(rollParts(new Rng(s), 'splinter')).toEqual([]);
  });

  it('has a name and a description in every shipped language', () => {
    for (const locale of LOCALES) {
      for (const p of PARTS) {
        const tr = locale.content.parts[p.id];
        if (locale.code === 'en') {
          expect(p.name.length).toBeGreaterThan(0);
          expect(p.description.length).toBeGreaterThan(0);
        } else {
          expect(tr?.name, `${locale.code} name of ${p.id}`).toBeTruthy();
          expect(tr?.description, `${locale.code} description of ${p.id}`).toBeTruthy();
        }
      }
    }
  });
});
