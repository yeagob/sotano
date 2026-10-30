import { describe, expect, it } from 'vitest';
import type { Carried } from '../src/entities/player';
import { MAT } from '../src/content/materials';
import { PARTS, type PartKind } from '../src/content/parts';
import { LINEAGE, PATTERN_PATH } from '../src/content/patterns';
import { POTION_IDS, POTIONS, flaskRooms } from '../src/content/potions';
import { FALLBACK, ICE, RECIPES, brewOf, resolve, topMatches } from '../src/content/recipes';
import { ENEMIES } from '../src/content/enemies';

const part = (source: string, kind: PartKind) => {
  const p = PARTS.find(x => x.source === source && x.kind === kind);
  if (!p) throw new Error(`no ${kind} of ${source}`);
  return p;
};

function orders<T>(xs: readonly T[]): T[][] {
  if (xs.length <= 1) return [[...xs]];
  return xs.flatMap((x, i) => orders([...xs.slice(0, i), ...xs.slice(i + 1)]).map(r => [x, ...r]));
}

const SAMPLES: [string, Carried[]][] = [
  ['restoring-draught', [part('doubt', 'flesh'), part('panic', 'flesh')]],
  ['restoring-draught', [part('doubt', 'flesh'), part('doubt', 'flesh')]],
  ['footing-tincture', [part('impulse', 'flesh'), MAT.deepstone]],
  ['footing-tincture', [MAT.obsidian, part('craving', 'flesh')]],
  ['spring-tonic', [part('impulse', 'heart')]],
  ['clear-infusion', [part('doubt', 'mind'), part('critic', 'mind')]],
  ['questioning-tincture', [part('doubt', 'mind'), MAT.ore]],
  ['questioning-tincture', [MAT.ore, part('paralysis', 'mind')]],
  ['ember-tonic', [part('panic', 'heart')]],
  ['patient-draught', [part('autopilot', 'heart'), part('autopilot', 'mind')]],
];

describe('the paths and lineages of the patterns', () => {
  it('every pattern that leaves parts has a path', () => {
    for (const p of PARTS) expect(PATTERN_PATH[p.source], p.source).toBeDefined();
  });

  it('names only patterns that exist, and every lineage starts at its own first form', () => {
    const ids = new Set(ENEMIES.map(e => e.id));
    for (const id of Object.keys(PATTERN_PATH)) expect(ids.has(id), id).toBe(true);
    for (const [id, root] of Object.entries(LINEAGE)) {
      expect(LINEAGE[root], `${id} → ${root}`).toBe(root);
      expect(PATTERN_PATH[id], id).toBe(PATTERN_PATH[root]);
    }
  });

  it('follows the bestiary: Impulse is body, Panic is will, Doubt is mind, Comparison is emotion', () => {
    expect([PATTERN_PATH.impulse, PATTERN_PATH.panic, PATTERN_PATH.doubt, PATTERN_PATH.comparison]).toEqual(['body', 'will', 'mind', 'emotion']);
    expect(['doubt', 'second-guessing', 'paralysis'].map(id => LINEAGE[id])).toEqual(['doubt', 'doubt', 'doubt']);
  });
});

describe('the resolver', () => {
  it.each(SAMPLES)('brews %s from its bulb, in every order', (potion, bulb) => {
    for (const order of orders(bulb)) expect(brewOf(order)).toBe(potion);
  });

  it('every potion but the fallback has a recipe, and every recipe brews', () => {
    expect(new Set(RECIPES.map(r => r.potion))).toEqual(new Set(POTION_IDS.filter(id => id !== FALLBACK)));
    for (const r of RECIPES) expect(SAMPLES.some(([p]) => p === r.potion), r.potion).toBe(true);
  });

  it('accounts for every cube: one more thing than a recipe asks makes a Plain Tonic', () => {
    for (const [, bulb] of SAMPLES) if (bulb.length < 3) expect(brewOf([...bulb, MAT.stone])).toBe(FALLBACK);
  });

  it('keeps each recipe to its own sources', () => {
    expect(brewOf([part('doubt', 'mind'), part('doubt', 'mind')])).toBe(FALLBACK);
    expect(brewOf([part('autopilot', 'flesh'), part('panic', 'mind')])).toBe(FALLBACK);
    expect(brewOf([part('critic', 'mind'), MAT.ore])).toBe(FALLBACK);
    expect(brewOf([part('panic', 'flesh'), MAT.deepstone])).toBe(FALLBACK);
    expect(brewOf([part('impulse', 'flesh'), MAT.stone])).toBe(FALLBACK);
    expect(brewOf([part('doubt', 'heart')])).toBe(FALLBACK);
    expect(brewOf([part('doubt', 'flesh'), part('doubt', 'mind'), part('doubt', 'essence')])).toBe(FALLBACK);
  });

  it('leaves the warmth recipes and the Distillate unbuilt: their bulbs make a Plain Tonic', () => {
    expect(brewOf([part('gloom', 'heart'), part('panic', 'heart')])).toBe(FALLBACK);
    expect(brewOf([part('gloom', 'essence')])).toBe(FALLBACK);
    expect(brewOf([part('doubt', 'heart'), part('doubt', 'mind'), part('doubt', 'essence')])).toBe(FALLBACK);
  });

  it('ice takes a slot and adds a room to a potion counted in rooms, and nothing else', () => {
    const iced = resolve([part('panic', 'heart'), ICE]);
    expect(iced).toEqual({ potion: 'ember-tonic', iced: true });
    expect(flaskRooms(iced)).toBe(4);
    expect(flaskRooms({ potion: 'ember-tonic' })).toBe(3);
    expect(resolve([ICE, part('impulse', 'heart')])).toEqual({ potion: 'spring-tonic' });
    expect(resolve([part('doubt', 'flesh'), ICE, part('doubt', 'flesh')])).toEqual({ potion: 'restoring-draught' });
    expect(resolve([ICE])).toEqual({ potion: FALLBACK });
  });

  it('is pure: the same bulb gives the same flask and the bulb is left as it was', () => {
    const bulb: Carried[] = [part('doubt', 'mind'), part('critic', 'mind')];
    const copy = [...bulb];
    expect(resolve(bulb)).toEqual(resolve(bulb));
    expect(bulb).toEqual(copy);
  });

  it('every recipe is for a potion with its own definition', () => {
    for (const r of RECIPES) expect(POTIONS[r.potion].id).toBe(r.potion);
  });
});

describe('the validator: no two recipes tie for any bulb', () => {
  it('every bulb of one to three cubes has at most one most specific recipe, and an unmatched bulb brews the fallback', () => {
    const cubes: Carried[] = [...PARTS, MAT.deepstone, MAT.obsidian, MAT.ore, ICE, MAT.stone];
    const n = cubes.length;
    let bulbs = 0, matched = 0;
    const check = (bulb: Carried[]) => {
      bulbs++;
      const top = topMatches(bulb);
      if (top.length > 1) throw new Error(`tie: ${top.map(r => r.potion).join(', ')} for ${bulb.map(c => (typeof c === 'number' ? c : 'potion' in c ? c.potion : c.id)).join(' + ')}`);
      if (top.length) matched++;
      else expect(brewOf(bulb)).toBe(FALLBACK);
    };
    for (let i = 0; i < n; i++) {
      check([cubes[i]]);
      for (let j = i; j < n; j++) {
        check([cubes[i], cubes[j]]);
        for (let k = j; k < n; k++) check([cubes[i], cubes[j], cubes[k]]);
      }
    }
    expect(bulbs).toBe(n + (n * (n + 1)) / 2 + (n * (n + 1) * (n + 2)) / 6);
    expect(matched).toBeGreaterThan(0);
  }, 120_000);
});
