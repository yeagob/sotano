// The giant tree's textures (issue #12, docs/design/built/levels/giant-tree/BARK.md): leaves and limbs
// have their own materials, the trunk's bark changes with height, and the same seed grows the same bark.
import { describe, expect, it } from 'vitest';
import { AIR, MAT, MATERIALS } from '../src/content/materials';
import { pal, type PalToken } from '../src/content/palette';
import { TILE_LOG_TOP, tileFor } from '../src/content/tiles';
import { Rng } from '../src/core/rng';
import { SURFACE_Y, WORLD_SIZE } from '../src/world/floor';
import { BARK_BLEND, GiantTree, STORY_BARK, TREE_STORIES } from '../src/world/tree';
import { VoxelWorld } from '../src/world/world';

const TREE_KEYS = ['bough', 'rootbark', 'oldbark', 'youngleaf'];

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

function tree(seed: number) {
  const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
  return { w, t: new GiantTree(w, SURFACE_Y, i => new Rng(seed * 31 + i)) };
}

/** The materials a grown story is built of, by count. */
function census(w: VoxelWorld, t: GiantTree, i: number) {
  const [y0, y1] = t.range(i), n = new Map<number, number>();
  for (let y = y0; y <= y1; y++) for (let z = 0; z < w.sz; z++) for (let x = 0; x < w.sx; x++) {
    const m = w.get(x, y, z);
    if (m !== AIR) n.set(m, (n.get(m) ?? 0) + 1);
  }
  return n;
}

describe('the tree\'s own materials', () => {
  it('leaves, young leaves and boughs exist, each with its own look, as tough as the wood or leaves they replace', () => {
    for (const k of TREE_KEYS) expect(MAT[k], k).toBeGreaterThan(0);
    const log = MATERIALS[MAT.log], leaves = MATERIALS[MAT.leaves], grass = MATERIALS[MAT.grass];
    const bough = MATERIALS[MAT.bough];
    expect(bough.pattern).not.toBe(log.pattern);
    expect(bough.ramp).not.toEqual(log.ramp);
    expect(leaves.ramp).not.toEqual(grass.ramp);
    expect(MATERIALS[MAT.youngleaf].ramp).not.toEqual(leaves.ramp);
    for (const k of ['bough', 'rootbark', 'oldbark']) {
      const m = MATERIALS[MAT[k]];
      expect([m.tier, m.hp, m.armor, m.flammable], k).toEqual([log.tier, log.hp, log.armor, true]);
    }
    const y = MATERIALS[MAT.youngleaf];
    expect([y.tier, y.hp, y.armor, y.flammable]).toEqual([leaves.tier, leaves.hp, leaves.armor, true]);
  });

  it('every bark of the trunk has a different pattern or ramp, and all show the same end grain', () => {
    const barks = ['rootbark', 'log', 'oldbark'].map(k => MATERIALS[MAT[k]]);
    expect(new Set(barks.map(m => m.pattern)).size).toBe(3);
    for (const m of barks) {
      expect([tileFor(m.id, 2), tileFor(m.id, 3)], m.key).toEqual([TILE_LOG_TOP, TILE_LOG_TOP]);
      expect(tileFor(m.id, 0), m.key).toBe(m.id);
    }
    // a limb is bark all round: its top is the branch's bark, not end grain
    for (let f = 0; f < 6; f++) expect(tileFor(MAT.bough, f)).toBe(MAT.bough);
  });

  it('their colours keep clear of life, the attack and the light (DECISIONS §3.12)', () => {
    const tokens = [...TREE_KEYS, 'leaves'].flatMap(k => MATERIALS[MAT[k]].ramp);
    for (const t of tokens) {
      for (const red of ['life.heart', 'attack.red.base'] as PalToken[]) expect(dE(pal(t), pal(red)), `${t} vs ${red}`).toBeGreaterThanOrEqual(20);
      for (const gold of ['light.gold', 'attack.warn.base'] as PalToken[]) expect(dE(pal(t), pal(gold)), `${t} vs ${gold}`).toBeGreaterThanOrEqual(20);
    }
  });

  it('materials that touch in the tree differ by ≥ 0.12 OKL or ≥ 30° hue (DECISIONS §6.1 rule 9)', () => {
    const pairs: [string, string][] = [
      ['rootbark', 'log'], ['log', 'oldbark'], ['oldbark', 'bough'], ['bough', 'leaves'], ['leaves', 'youngleaf'],
      ['bough', 'youngleaf'], ['oldbark', 'leaves'], ['rootbark', 'grass'], ['log', 'leaves'],
    ];
    for (const [a, b] of pairs) {
      const p = oklab(pal(MATERIALS[MAT[a]].ramp[2])), q = oklab(pal(MATERIALS[MAT[b]].ramp[2]));
      let hue = Math.abs(Math.atan2(p[2], p[1]) - Math.atan2(q[2], q[1])) * 180 / Math.PI;
      if (hue > 180) hue = 360 - hue;
      expect(Math.abs(p[0] - q[0]) >= 0.12 || hue >= 30, `${a} vs ${b}`).toBe(true);
    }
  });
});

describe('the bark changes with height', () => {
  it('each trunk band has its own bark: root bark at the foot, living wood in the middle, old bark high up', () => {
    const { t } = tree(5);
    const mid = (i: number) => t.range(i)[0] + BARK_BLEND + 3;
    const at = (key: string) => t.barkAt(t.cx + 30, mid(TREE_STORIES.findIndex(s => s.key === key)), t.cz);
    expect(at('roots')).toBe(MAT.rootbark);
    expect(at('rings')).toBe(MAT.log);
    expect(at('hollows')).toBe(MAT.oldbark);
    expect(new Set([at('roots'), at('rings'), at('hollows')]).size).toBe(3);
    for (const s of TREE_STORIES) expect(MAT[STORY_BARK[s.key]], s.key).toBeGreaterThan(0);
  });

  it('the grown tree is built of them: each story its bark, the limbs boughs, the crown old and young leaves', () => {
    const { w, t } = tree(5);
    TREE_STORIES.forEach((_, i) => t.grow(i));
    const story = (key: string) => census(w, t, TREE_STORIES.findIndex(s => s.key === key));
    const roots = story('roots'), rings = story('rings'), hollows = story('hollows'), branches = story('branches'), canopy = story('canopy');
    expect(roots.get(MAT.rootbark) ?? 0).toBeGreaterThan(roots.get(MAT.log) ?? 0);
    expect(rings.get(MAT.log) ?? 0).toBeGreaterThan(rings.get(MAT.rootbark) ?? 0);
    expect(rings.get(MAT.oldbark) ?? 0).toBe(0);
    expect(hollows.get(MAT.oldbark) ?? 0).toBeGreaterThan(hollows.get(MAT.log) ?? 0);
    expect(branches.get(MAT.bough) ?? 0).toBeGreaterThan(1000);
    expect(canopy.get(MAT.leaves) ?? 0).toBeGreaterThan(1000);
    expect(canopy.get(MAT.youngleaf) ?? 0).toBeGreaterThan(500);
  });

  it('a change of bark is a ragged seam of patches, never a straight line', () => {
    const { t } = tree(5);
    const i = TREE_STORIES.findIndex(s => s.key === 'rings'), y = t.range(i)[0];
    const row = new Set<number>();
    for (let x = t.cx - 30; x <= t.cx + 30; x++) for (let z = t.cz - 30; z <= t.cz + 30; z += 3) row.add(t.barkAt(x, y, z));
    expect([...row].sort()).toEqual([MAT.rootbark, MAT.log].sort());
    for (let x = t.cx - 30; x <= t.cx + 30; x++) expect(t.barkAt(x, y + BARK_BLEND, t.cz)).toBe(MAT.log);
  });

  it('is deterministic for a seed: the same seed grows the same bark, another seed other patches', () => {
    const sample = (seed: number) => {
      const { t } = tree(seed);
      const out: number[] = [];
      for (let i = 1; i < TREE_STORIES.length; i++) {
        const y0 = t.range(i)[0];
        for (let y = y0; y < y0 + BARK_BLEND; y++) for (let x = t.cx - 20; x <= t.cx + 20; x++) out.push(t.barkAt(x, y, t.cz + 7));
      }
      for (let y = t.range(5)[0]; y <= t.range(5)[1]; y += 3) for (let x = t.cx - 40; x <= t.cx + 40; x += 2) out.push(t.leafAt(x, y, t.cz));
      return out;
    };
    expect(sample(5)).toEqual(sample(5));
    expect(sample(5)).not.toEqual(sample(6));
  });
});
