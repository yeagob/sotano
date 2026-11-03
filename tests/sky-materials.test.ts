// The sky's materials and air (docs/architecture/SKY.md §11, docs/art/sky/blocks.md): ids 30–42, two
// unbreakables, nothing flammable, every material its tile, nothing red, gold marks that read, and an
// atmosphere that is continuous, readable in every hall and dark only where the stars are.
import { describe, expect, it } from 'vitest';
import { MAT, MATERIALS } from '../src/content/materials';
import { PALETTE, pal, type PalToken } from '../src/content/palette';
import { SKY_BLOCKS_PALETTE } from '../src/content/palette/sky-blocks';
import { SKY_TOTALITY_PALETTE } from '../src/content/palette/sky-totality';
import { ATLAS_COLS, ATLAS_ROWS, CRACK_STAGES, MATERIAL_TILES, TILE_BAMBOO_TOP, TILE_CRACK0, TILE_GRASS_TOP, TILE_LOG_TOP, TILE_SKYWOOD_TOP, tileFor } from '../src/content/tiles';
import { atmosphereAt, HALLS, hallFar, TOTALITY } from '../src/sky/atmosphere';
import { STRATA } from '../src/sky/totality/strata';

const SKY_KEYS = ['cloud', 'skywood', 'heartwood', 'skyleaf', 'bamboo', 'moss', 'palestone', 'fencewood', 'mist',
  'starresin', 'meteorglass', 'solarglass', 'sunseal'];
const SKY = MATERIALS.filter(m => m.id >= 30 && m.id <= 42);

// CIE Lab (normal vision) and OKLab, the maths of tests/art.test.ts and DECISIONS §1.1
const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
const rgb = (n: number) => [lin((n >> 16) & 255), lin((n >> 8) & 255), lin(n & 255)];
function lab(n: number): number[] {
  const [r, g, b] = rgb(n);
  const X = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, Y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const Z = (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}
const dE = (a: number, b: number) => { const p = lab(a), q = lab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
function oklab(n: number): number[] {
  const [r, g, b] = rgb(n);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
const chroma = (n: number) => { const [, a, b] = oklab(n); return Math.hypot(a, b); };

describe('sky materials', () => {
  it('are the thirteen of §11 at ids 30–42, unique and in order', () => {
    expect(SKY.map(m => m.key)).toEqual(SKY_KEYS);
    expect(SKY.map(m => m.id)).toEqual(SKY_KEYS.map((_, i) => 30 + i));
    expect(new Set(MATERIALS.map(m => m.id)).size).toBe(MATERIALS.length);
    expect(new Set(MATERIALS.map(m => m.key)).size).toBe(MATERIALS.length);
    MATERIALS.forEach((m, i) => expect(m.id, m.key).toBe(i));
    for (const k of SKY_KEYS) expect(MAT[k], k).toBeGreaterThanOrEqual(30);
  });

  it('heartwood and the sun seal are unbreakable; the rest are as tough as brick', () => {
    for (const k of ['heartwood', 'sunseal']) {
      const m = MATERIALS[MAT[k]];
      expect([m.tier, m.hp], k).toEqual([Infinity, Infinity]);
    }
    const brick = MATERIALS[MAT.brick];
    for (const m of SKY.filter(q => q.key !== 'heartwood' && q.key !== 'sunseal')) {
      expect([m.tier, m.hp, m.armor], m.key).toEqual([brick.tier, brick.hp, brick.armor]);
    }
  });

  it('none is flammable, slippery, heavy or drawn by a model', () => {
    for (const m of SKY) expect([m.flammable, m.slippery, m.heavy, m.model], m.key).toEqual([undefined, undefined, undefined, undefined]);
  });

  it('every material has its own tile, inside the atlas and clear of the special tiles', () => {
    const atlas = ATLAS_COLS * ATLAS_ROWS;
    expect(MATERIALS.length).toBeLessThanOrEqual(MATERIAL_TILES);
    const special = [TILE_GRASS_TOP, TILE_LOG_TOP, TILE_SKYWOOD_TOP, TILE_BAMBOO_TOP, ...Array.from({ length: CRACK_STAGES }, (_, s) => TILE_CRACK0 + s)];
    expect(new Set(special).size).toBe(special.length);
    for (const t of special) { expect(t).toBeGreaterThanOrEqual(MATERIAL_TILES); expect(t).toBeLessThan(atlas); }
    for (const m of MATERIALS) for (let f = 0; f < 6; f++) {
      const t = tileFor(m.id, f);
      expect(t, `${m.key} face ${f}`).toBeGreaterThanOrEqual(0);
      expect(t, `${m.key} face ${f}`).toBeLessThan(atlas);
    }
    for (const m of SKY) expect(tileFor(m.id, 0), m.key).toBe(m.id);
    expect([tileFor(MAT.skywood, 2), tileFor(MAT.skywood, 3), tileFor(MAT.bamboo, 2)]).toEqual([TILE_SKYWOOD_TOP, TILE_SKYWOOD_TOP, TILE_BAMBOO_TOP]);
  });

  it('take their ramps from the sky-blocks palette part and never the light, the cold, life or the attack', () => {
    for (const m of SKY) {
      for (const t of m.ramp) expect(Object.keys(SKY_BLOCKS_PALETTE), `${m.key} ${t}`).toContain(t);
      for (const t of [...m.ramp, m.accent].filter(Boolean) as string[]) {
        expect(t, m.key).not.toMatch(/^(light|cold|life|heart|attack|captive|path)\./);
      }
    }
  });
});

describe('sky palette', () => {
  const parts = { ...SKY_BLOCKS_PALETTE, ...SKY_TOTALITY_PALETTE } as Record<string, string>;
  const all = Object.keys(parts) as PalToken[];

  it('nothing in the sky is red: every token ≥ 20 from life.heart and the attack red', () => {
    for (const t of all) for (const red of ['life.heart', 'attack.red.base', 'attack.red.dim'] as PalToken[]) {
      expect(dE(pal(t), pal(red)), `${t} vs ${red}`).toBeGreaterThanOrEqual(20);
    }
  });

  it('a gold mark reads on all of it: every token ≥ 20 from light.gold and the warning yellow', () => {
    for (const t of all) for (const gold of ['light.gold', 'attack.warn.base'] as PalToken[]) {
      expect(dE(pal(t), pal(gold)), `${t} vs ${gold}`).toBeGreaterThanOrEqual(20);
    }
  });

  it('sky matter stays clear of the cold and of the light\'s white (≥ 8, ≥ 15 for the coloured cold)', () => {
    const matter = all.filter(t => t.startsWith('mat.'));
    for (const t of matter) {
      for (const w of ['cold.white', 'light.core'] as PalToken[]) expect(dE(pal(t), pal(w)), `${t} vs ${w}`).toBeGreaterThanOrEqual(8);
      for (const c of ['cold.body', 'cold.rim', 'cold.dim', 'cold.deep'] as PalToken[]) expect(dE(pal(t), pal(c)), `${t} vs ${c}`).toBeGreaterThanOrEqual(15);
    }
  });

  it('sky matter is low in chroma: ≤ 0.06, named exceptions ≤ 0.10 (DECISIONS §1.1, docs/art/sky/README.md)', () => {
    const named = new Set(['heartwood', 'bamboo', 'meteorglass', 'solarglass', 'sunseal']);
    for (const m of SKY) for (const t of m.ramp) {
      expect(chroma(pal(t)), `${m.key} ${t}`).toBeLessThanOrEqual(named.has(m.key) ? 0.10 : 0.06);
    }
  });

  it('materials that touch on a floor differ by ≥ 0.12 OKL or ≥ 30° hue (DECISIONS §6.1 rule 9)', () => {
    const pairs: [string, string][] = [
      ['heartwood', 'cloud'], ['heartwood', 'skywood'], ['heartwood', 'skyleaf'], ['heartwood', 'bamboo'], ['heartwood', 'moss'],
      ['heartwood', 'palestone'], ['heartwood', 'fencewood'], ['heartwood', 'mist'], ['bamboo', 'moss'], ['bamboo', 'skyleaf'],
      ['skyleaf', 'moss'], ['skywood', 'skyleaf'], ['skywood', 'moss'], ['skywood', 'mist'], ['skywood', 'palestone'],
      ['skywood', 'fencewood'], ['fencewood', 'mist'], ['palestone', 'skyleaf'], ['cloud', 'mist'], ['starresin', 'skyleaf'],
      ['starresin', 'palestone'], ['meteorglass', 'starresin'], ['solarglass', 'sunseal'], ['solarglass', 'meteorglass'],
    ];
    for (const [a, b] of pairs) {
      const p = oklab(pal(MATERIALS[MAT[a]].ramp[2])), q = oklab(pal(MATERIALS[MAT[b]].ramp[2]));
      let hue = Math.abs(Math.atan2(p[2], p[1]) - Math.atan2(q[2], q[1])) * 180 / Math.PI;
      if (hue > 180) hue = 360 - hue;
      expect(Math.abs(p[0] - q[0]) >= 0.12 || hue >= 30, `${a} vs ${b}`).toBe(true);
    }
  });

  it('every part token is spread into PALETTE', () => {
    for (const [k, v] of Object.entries(parts)) expect((PALETTE as Record<string, string>)[k], k).toBe(v);
  });
});

describe('sky atmosphere', () => {
  const L = (n: number) => lab(n)[0];

  it('the deck is day: no stars, the day sky behind a pale haze', () => {
    const a = atmosphereAt('deck', 32);
    expect([a.clear, a.fog, a.stars]).toEqual([pal('sky.day'), pal('sky.deck.haze'), 0]);
  });

  it('every hall clears its own diagonal and grows lighter as the floors rise', () => {
    let last = -1;
    for (const h of HALLS) {
      const a = atmosphereAt('hall', h.y0 + 1);
      expect(a.far, `hall ${h.floor}`).toBeGreaterThanOrEqual(Math.hypot(2 * h.radius, h.y1 - h.y0) + 6);
      expect(a.far).toBe(hallFar(h));
      expect(a.stars).toBe(0);
      expect(L(a.fog), `hall ${h.floor}`).toBeGreaterThan(last);
      last = L(a.fog);
    }
  });

  it('Totality follows its strata: day blue at the crown, black with stars in the void, the corona at the top', () => {
    const [lower, mid, upper] = STRATA;
    expect(TOTALITY[0].y).toBe(lower.y0);
    expect(atmosphereAt('totality', lower.y0).clear).toBe(pal('sky.day'));
    const v = atmosphereAt('totality', (mid.y0 + mid.y1) / 2);
    expect([v.clear, v.stars]).toEqual([pal('sky.strata.void'), 1]);
    const top = atmosphereAt('totality', upper.y1);
    expect([top.clear, top.stars]).toEqual([pal('sky.strata.corona'), 0]);
    expect(atmosphereAt('totality', lower.y0 + 50).stars).toBe(0);
  });

  it('the void beside the trunk meets the deck below and Totality at the crown', () => {
    expect(atmosphereAt('void', 32)).toEqual(atmosphereAt('deck', 32));
    expect(atmosphereAt('void', STRATA[0].y0)).toEqual(atmosphereAt('totality', STRATA[0].y0));
  });

  it('is continuous: no height step of one block changes the colour by more than 3 ΔE or the fog by more than 2', () => {
    for (const place of ['void', 'totality', 'hall'] as const) {
      let prev = atmosphereAt(place, 0);
      for (let y = 1; y <= 1000; y++) {
        const a = atmosphereAt(place, y);
        expect(dE(prev.clear, a.clear), `${place} y ${y}`).toBeLessThanOrEqual(3);
        expect(dE(prev.fog, a.fog), `${place} y ${y}`).toBeLessThanOrEqual(3);
        if (place !== 'hall') expect(Math.abs(prev.far - a.far), `${place} y ${y}`).toBeLessThanOrEqual(2);
        prev = a;
      }
    }
  });

  it('is readable everywhere: far ≥ 24 and > near, stars within 0–1 (DECISIONS G1)', () => {
    for (const place of ['deck', 'hall', 'void', 'totality'] as const) for (let y = 0; y <= 1000; y += 5) {
      const a = atmosphereAt(place, y);
      expect(a.far, `${place} ${y}`).toBeGreaterThanOrEqual(24);
      expect(a.far, `${place} ${y}`).toBeGreaterThan(a.near);
      expect(a.stars).toBeGreaterThanOrEqual(0);
      expect(a.stars).toBeLessThanOrEqual(1);
    }
  });

  it('every Totality material shows against its stratum: some ramp step ≥ 20 L* from the fog at every height', () => {
    const where: [string, number, number][] = [
      ['starresin', STRATA[0].y0, STRATA[0].y1], ['palestone', STRATA[0].y0, STRATA[0].y1], ['skyleaf', STRATA[0].y0, STRATA[0].y1],
      ['meteorglass', STRATA[1].y0, STRATA[1].y1], ['solarglass', STRATA[2].y0, STRATA[2].y1], ['sunseal', STRATA[2].y0, STRATA[2].y1],
    ];
    for (const [k, y0, y1] of where) for (let y = y0; y <= y1; y += 5) {
      const fog = L(atmosphereAt('totality', y).fog);
      const best = Math.max(...MATERIALS[MAT[k]].ramp.map(t => Math.abs(L(pal(t)) - fog)));
      expect(best, `${k} at ${y}`).toBeGreaterThanOrEqual(20);
    }
  });

  it('is pure: the same height gives the same air', () => {
    expect(atmosphereAt('totality', 612.5)).toEqual(atmosphereAt('totality', 612.5));
  });
});
