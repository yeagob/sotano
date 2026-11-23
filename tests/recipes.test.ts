import { describe, expect, it } from 'vitest';
import type { Carried } from '../src/entities/player';
import { MAT } from '../src/content/materials';
import { PARTS, type PartKind } from '../src/content/parts';
import { LINEAGE, PATTERN_PATH } from '../src/content/patterns';
import { POTION_IDS, POTIONS, flaskRooms } from '../src/content/potions';
import { ECHO, FALLBACK, ICE, RECIPES, brewOf, partsOf, resolve, topMatches } from '../src/content/recipes';
import { ECHO_ITEMS } from '../src/content/echo';
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
  ['berserker-draught', [part('panic', 'heart'), part('autopilot', 'heart'), MAT.obsidian]],
  ['rebirth-draught', [part('doubt', 'mind'), part('panic', 'heart'), part('impulse', 'flesh')]],
  ['stride-tonic', [part('impulse', 'mind')]],
  ['stride-tonic', [part('craving', 'mind')]],
  ['folding-tincture', [part('impulse', 'mind'), MAT.dirt]],
  ['folding-tincture', [MAT.dirt, part('craving', 'mind')]],
  ['rebirth-draught', [part('impulse', 'flesh'), part('panic', 'heart'), part('doubt', 'mind')]],
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

  it('every named recipe brews from its sample bulb', () => {
    for (const r of RECIPES) expect(SAMPLES.some(([p]) => p === r.potion), r.potion).toBe(true);
  });

  it('accounts for every cube: one more thing than a named recipe asks leaves that recipe, but never makes a Plain Tonic', () => {
    for (const [, bulb] of SAMPLES) if (bulb.length < 3) {
      expect(topMatches([...bulb, MAT.stone])).toEqual([]);
      expect(brewOf([...bulb, MAT.stone])).not.toBe(FALLBACK);
    }
  });

  it('keeps each named recipe to its own sources: other bulbs brew a variant of their type', () => {
    expect(brewOf([part('doubt', 'mind'), part('doubt', 'mind')])).toBe('lucid-tincture');
    expect(brewOf([part('autopilot', 'flesh'), part('panic', 'mind')])).toBe('steadfast-tincture');
    expect(brewOf([part('critic', 'mind'), MAT.ore])).toBe('lucid-tincture');
    expect(brewOf([part('panic', 'flesh'), MAT.deepstone])).toBe('mending-tonic');
    expect(brewOf([part('impulse', 'flesh'), MAT.stone])).toBe('mending-tonic');
    expect(brewOf([part('doubt', 'heart')])).toBe('lucid-cordial');
    expect(brewOf([part('doubt', 'flesh'), part('doubt', 'mind'), part('doubt', 'essence')])).toBe('lucid-elixir');
  });

  it('leaves the warmth recipes and the Distillate unbuilt: their bulbs brew a family variant or an echo', () => {
    expect(brewOf([part('gloom', 'heart'), part('panic', 'heart')])).toBe(ECHO);
    expect(brewOf([part('gloom', 'essence')])).toBe('tender-elixir');
    expect(brewOf([part('doubt', 'heart'), part('doubt', 'mind'), part('doubt', 'essence')])).toBe('lucid-elixir');
  });

  it('ice takes a slot and adds a room to a potion counted in rooms, and nothing else', () => {
    const iced = resolve([part('panic', 'heart'), ICE]);
    expect(iced).toEqual({ potion: 'ember-tonic', iced: true });
    expect(flaskRooms(iced)).toBe(4);
    expect(flaskRooms({ potion: 'ember-tonic' })).toBe(3);
    expect(resolve([ICE, part('impulse', 'heart')])).toEqual({ potion: 'spring-tonic' });
    expect(resolve([part('doubt', 'flesh'), ICE, part('doubt', 'flesh')])).toEqual({ potion: 'restoring-draught' });
    expect(resolve([ICE])).toEqual({ potion: FALLBACK });
    expect(resolve([part('doubt', 'heart'), part('panic', 'heart'), ICE])).toMatchObject({ potion: ECHO, iced: true });
    expect(flaskRooms(resolve([part('doubt', 'heart'), part('panic', 'heart'), ICE]))).toBe(3);
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

describe('the validator: every bulb resolves, no two recipes tie, and the Plain Tonic is rare', () => {
  it('every bulb of one to three cubes resolves without throwing, to at most one most specific recipe, and only a bulb with no part is a Plain Tonic', () => {
    const cubes: Carried[] = [...PARTS, MAT.deepstone, MAT.obsidian, MAT.ore, ICE, MAT.stone, MAT.dirt];
    const n = cubes.length;
    let bulbs = 0, matched = 0, fallback = 0;
    const brewed = new Set<string>();
    const echoed = new Set<string>();
    const check = (bulb: Carried[]) => {
      bulbs++;
      const top = topMatches(bulb);
      if (top.length > 1) throw new Error(`tie: ${top.map(r => r.potion).join(', ')} for ${bulb.map(c => (typeof c === 'number' ? c : 'potion' in c ? c.potion : c.id)).join(' + ')}`);
      if (top.length) matched++;
      const flask = resolve(bulb);
      brewed.add(flask.potion);
      if (flask.echo) echoed.add(flask.echo);
      expect(flask.potion === ECHO, `echo ${flask.potion}`).toBe(flask.echo !== undefined);
      if (flask.potion === FALLBACK) {
        fallback++;
        expect(partsOf(bulb)).toEqual([]);
      } else if (!top.length && !partsOf(bulb).length) throw new Error('a bulb with no part brewed something');
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
    expect(fallback / bulbs).toBeLessThan(0.001);
    expect(brewed).toEqual(new Set(POTION_IDS.filter(id => !POTIONS[id].meal)));
    expect(echoed).toEqual(new Set(ECHO_ITEMS.map(d => d.id)));
  }, 300_000);
});
