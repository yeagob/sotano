// Art rules on content (docs/art/DECISIONS.md §12.6): materials, item icons and projections.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ENEMIES } from '../src/content/enemies';
import { ITEMS } from '../src/content/items';
import { MATERIALS } from '../src/content/materials';
import { PALETTE, pal } from '../src/content/palette';
import { TX } from '../src/enemies/types';

const lin = (c: number) => { const v = c / 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
/** CIE L* of a colour given as a number. */
function L(n: number) {
  const Y = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return Y > 0.008856 ? 116 * Math.cbrt(Y) - 16 : 903.3 * Y;
}
const tokenOf = new Map<number, string>(Object.entries(PALETTE).map(([t, h]) => [parseInt(h.slice(1), 16), t]));
/** Items whose concept is light itself may use the light ramp in their icon (§10.1). */
const LIGHT_CONCEPT = new Set(['satori', 'occamsrazor', 'kiai']);

describe('materials', () => {
  it('every ramp goes dark to light: outline < dark < base < hi (L*)', () => {
    for (const m of MATERIALS) {
      if (m.key === 'air') continue;
      const ls = m.ramp.map(t => L(pal(t)));
      for (let i = 1; i < 4; i++) expect(ls[i], `${m.key} ${m.ramp[i - 1]} → ${m.ramp[i]}`).toBeGreaterThan(ls[i - 1]);
    }
  });

  it('every breakable material says what it stands for; bedrock never glows', () => {
    for (const m of MATERIALS) if (m.key !== 'air') expect(m.concept, m.key).toBeTruthy();
    const bedrock = MATERIALS.find(m => m.key === 'bedrock')!;
    expect(bedrock.accent).toBeUndefined();
  });
});

describe('item icons (§10.1)', () => {
  it('use palette tokens only, at most 4 colours, never life/cold (light only for light itself)', () => {
    for (const d of ITEMS) {
      const cols = new Set(Object.values(d.icon.palette));
      expect(cols.size, `${d.id}: colours`).toBeLessThanOrEqual(4);
      for (const c of cols) {
        const t = tokenOf.get(c);
        expect(t, `${d.id}: colour ${c.toString(16)} is not a palette token`).toBeDefined();
        expect(t!.startsWith('life.') || t!.startsWith('cold.'), `${d.id}: ${t}`).toBe(false);
        if (!LIGHT_CONCEPT.has(d.id)) expect(t!.startsWith('light.'), `${d.id}: ${t}`).toBe(false);
      }
    }
  });

  it("the item's colour is its primary path's glow", () => {
    for (const d of ITEMS) {
      const path = d.tags?.find(t => ['body', 'mind', 'emotion', 'will'].includes(t));
      expect(tokenOf.get(d.color), d.id).toBe(path ? `path.${path}.glow` : 'bone.paper');
    }
  });

  it('no two icons share a silhouette (alpha-mask IoU < 0.8)', () => {
    const mask = (rows: string[]) => rows.join('').split('').map(c => c !== '.');
    const masks = ITEMS.map(d => [d.id, mask(d.icon.rows)] as const);
    for (let i = 0; i < masks.length; i++) for (let j = i + 1; j < masks.length; j++) {
      const [a, ma] = masks[i], [b, mb] = masks[j];
      let and = 0, or = 0;
      for (let k = 0; k < 144; k++) { if (ma[k] && mb[k]) and++; if (ma[k] || mb[k]) or++; }
      expect(and / or, `${a} vs ${b}`).toBeLessThan(0.8);
    }
  });
});

describe('projections (§8.2–8.4)', () => {
  it('are made of whole texels, at most 24 parts, with a cold tell of at least 2 × 2 texels', () => {
    for (const e of ENEMIES) {
      expect(e.model.length, e.id).toBeLessThanOrEqual(24);
      for (const p of e.model) {
        // boxes are whole texels; face decals are half-texel plates resting on a face (quarter-texel centres)
        const decal = Math.min(...p.size) <= TX / 2 + 1e-9;
        for (const v of [...p.size, ...p.pos]) {
          const steps = v / TX * (decal ? 4 : 2);
          expect(Math.abs(steps - Math.round(steps)), `${e.id}: ${v} is off the texel grid`).toBeLessThan(1e-6);
        }
      }
      const tells = e.model.filter(p => p.glow && p.size[0] >= 2 * TX - 1e-9 && p.size[1] >= TX - 1e-9);
      expect(tells.length, `${e.id}: no emissive tell`).toBeGreaterThan(0);
    }
  });

  it('never use warm light, life, skin or the true path hues (warm is the player\'s)', () => {
    const src = readdirSync(join(__dirname, '../src/content/enemies')).map(f => readFileSync(join(__dirname, '../src/content/enemies', f), 'utf8')).join('\n');
    expect(src).not.toMatch(/pal\('(light\.|life\.|skin\.|path\.\w+\.(base|glow))/);
  });

  it('keep their value class against every floor: dark husks below L* 15, pale husks above 55', () => {
    const body = (id: string) => L(ENEMIES.find(e => e.id === id)!.model[0].color);
    expect(body('doubt')).toBeLessThan(15);
    expect(body('panic')).toBeLessThan(15);
    const lectern = ENEMIES.find(e => e.id === 'critic')!.model.filter(p => p.size[1] === 3 * TX);
    for (const p of lectern) expect(L(p.color)).toBeGreaterThan(55);
  });
});
