// The three multishot practices: Bilateral Stimulation (the hands take turns), Rule of Three (a triangle
// of strands that widens) and Spiral Growth (a helix of strands that turns), and the Double Helix synergy.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Intents, intentFromStats, HELIX_SHARE, TRIAD_SHARE, type IntentHooks } from '../src/combat/intents';
import { ITEM_BY_ID, ITEMS } from '../src/content/items';
import { SYNERGIES } from '../src/content/synergies';
import { Rng } from '../src/core/rng';
import { BASE_STATS, computeStats, StatSheet, type StatMod } from '../src/core/stats';
import { createBus, type IntentSpec } from '../src/game/events';
import { nextCastSide, Player } from '../src/entities/player';
import { Inventory } from '../src/items/inventory';
import type { HostApi } from '../src/items/types';
import { validateCatalogue } from '../src/items/validate';

const DT = 1 / 60;
const SQRT3 = Math.sqrt(3);
const mod = (stat: StatMod['stat'], value = 1): StatMod => ({ stat, layer: 'add', value, source: 'test' });

function setup() {
  const bus = createBus();
  const stats = new StatSheet();
  const api = {
    bus, stats: () => stats.all, defer: (fn: () => void) => bus.defer(fn),
    heal: () => {}, collect: () => true, damagePlayer: () => {}, rng: () => new Rng(1), message: () => {},
  } as unknown as HostApi;
  const inv = new Inventory(new Map(ITEMS.map(i => [i.id, i])), SYNERGIES, stats, () => bus, () => api);
  return { stats, inv };
}

/** An intention field with no walls, no projections and no blocks: only the flight matters. */
function field(): Intents {
  const hooks: IntentHooks = {
    solid: () => false,
    hitBlock: () => false,
    tier: () => 0,
    debrisAt: () => -1,
    hitDebris: () => {},
    enemyAt: () => -1,
    nearestEnemy: () => null,
    hitEnemy: () => {},
    splash: () => {},
    hit: () => {},
    nearestBlock: () => null,
  };
  return new Intents(new THREE.Scene(), hooks);
}

interface Flying { pos: THREE.Vector3; spec: IntentSpec }
const flying = (m: Intents) => (m as unknown as { list: Flying[] }).list;
/** The three distances between the strands of a triangle (equal for an equilateral one). */
function sides(list: Flying[]): number[] {
  const [a, b, c] = list.map(s => s.pos);
  return [a.distanceTo(b), b.distanceTo(c), a.distanceTo(c)];
}
const advance = (m: Intents, seconds: number) => { for (let t = 0; t < seconds - 1e-9; t += DT) m.update(DT); };

describe('the three practices are in the catalogue', () => {
  it('bilateral, ruleofthree and spiralgrowth are items, and the catalogue validates with the Double Helix', () => {
    for (const id of ['bilateral', 'ruleofthree', 'spiralgrowth']) expect(ITEM_BY_ID.has(id), id).toBe(true);
    expect(SYNERGIES.map(s => s.id)).toContain('doublehelix');
    expect(validateCatalogue(ITEMS, SYNERGIES)).toEqual([]);
  });
});

describe('Bilateral Stimulation: the hands take turns', () => {
  it('doubles the fire rate and turns the hands on', () => {
    const { stats, inv } = setup();
    inv.gain('bilateral');
    expect(stats.get('fireRate')).toBeCloseTo(BASE_STATS.fireRate * 2);
    expect(stats.get('twinCast')).toBe(1);
  });

  it('two copies multiply the rate (x4) and the turns stay a single flag', () => {
    const { stats, inv } = setup();
    inv.gain('bilateral');
    inv.gain('bilateral');
    expect(stats.get('fireRate')).toBeCloseTo(BASE_STATS.fireRate * 4);
    expect(stats.get('twinCast')).toBe(1);
  });

  it('losing it leaves no residue: the rate and the turns return to base', () => {
    const { stats, inv } = setup();
    inv.gain('bilateral');
    inv.lose('bilateral');
    expect(stats.get('fireRate')).toBe(BASE_STATS.fireRate);
    expect(stats.get('twinCast')).toBe(0);
  });

  it('the casting hand alternates on each shot: right, left, right', () => {
    expect(new Player().castSide).toBe(1);
    expect(nextCastSide(1)).toBe(-1);
    expect(nextCastSide(-1)).toBe(1);
  });
});

describe('Spiral Growth and Rule of Three: the stats', () => {
  it('Spiral Growth doubles the rate, turns the hands on and makes a helix', () => {
    const { stats, inv } = setup();
    inv.gain('spiralgrowth');
    expect(stats.get('fireRate')).toBeCloseTo(BASE_STATS.fireRate * 2);
    expect(stats.get('twinCast')).toBe(1);
    expect(stats.get('spiral')).toBe(1);
    expect(stats.get('triad')).toBe(0);
  });

  it('Rule of Three makes a triangle and leaves the rate alone', () => {
    const { stats, inv } = setup();
    inv.gain('ruleofthree');
    expect(stats.get('triad')).toBe(1);
    expect(stats.get('fireRate')).toBe(BASE_STATS.fireRate);
  });

  it('the Double Helix holds the pair at twice the base rate, and hits 1.25 times harder', () => {
    const { stats, inv } = setup();
    inv.gain('bilateral');
    const r = inv.gain('spiralgrowth')!;
    expect(r.newSynergies.map(s => s.id)).toContain('doublehelix');
    expect(stats.get('fireRate')).toBeCloseTo(BASE_STATS.fireRate * 2);
    expect(stats.get('damage')).toBeCloseTo(BASE_STATS.damage * 1.25);
    inv.lose('spiralgrowth');
    expect(stats.get('fireRate')).toBeCloseTo(BASE_STATS.fireRate * 2);
    expect(stats.get('damage')).toBeCloseTo(BASE_STATS.damage);
  });
});

describe('formations on the intention', () => {
  it('a plain intention has no formation', () => {
    expect(intentFromStats(BASE_STATS, 'positive').formation).toBeUndefined();
  });

  it('the triad and the spiral set the formation', () => {
    expect(intentFromStats(computeStats([mod('triad')]), 'positive').formation).toEqual({ triad: true, spiral: false });
    expect(intentFromStats(computeStats([mod('spiral')]), 'positive').formation).toEqual({ triad: false, spiral: true });
    expect(intentFromStats(computeStats([mod('triad'), mod('spiral')]), 'positive').formation).toEqual({ triad: true, spiral: true });
  });
});

describe('strands', () => {
  const triad = intentFromStats(computeStats([mod('triad')]), 'positive');
  const helix = intentFromStats(computeStats([mod('spiral')]), 'positive');
  const both = intentFromStats(computeStats([mod('triad'), mod('spiral')]), 'positive');
  const from = new THREE.Vector3(0, 5, 0);
  const dir = new THREE.Vector3(1, 0, 0);

  it('a triad is three strands at the corners of a triangle, starting small', () => {
    const m = field();
    m.fire(triad, from, dir, new THREE.Vector3());
    expect(flying(m)).toHaveLength(3);
    // the corners start 0.15 blocks from the line: the side is 0.15 * sqrt(3)
    for (const s of sides(flying(m))) expect(s).toBeCloseTo(0.15 * SQRT3, 6);
  });

  it('the triangle widens to 0.9 blocks over the straight flight, and stays equilateral', () => {
    const m = field();
    m.fire(triad, from, dir, new THREE.Vector3());
    advance(m, triad.flight);
    for (const s of sides(flying(m))) expect(s).toBeCloseTo(0.9 * SQRT3, 2);
  });

  it('a triad strand deals its share of damage and mining; the flight is not a fan', () => {
    const m = field();
    m.fire(triad, from, dir, new THREE.Vector3());
    for (const s of flying(m)) {
      expect(s.spec.damage).toBeCloseTo(BASE_STATS.damage * TRIAD_SHARE);
      expect(s.spec.mining).toBeCloseTo(BASE_STATS.mining * TRIAD_SHARE);
    }
  });

  it('a helix has strand 0 at full damage and two strands at 40%, on a circle of 0.3 blocks', () => {
    const m = field();
    m.fire(helix, from, dir, new THREE.Vector3());
    expect(flying(m).map(s => s.spec.damage)).toEqual([
      BASE_STATS.damage, BASE_STATS.damage * HELIX_SHARE, BASE_STATS.damage * HELIX_SHARE,
    ]);
    advance(m, 0.5);
    for (const s of sides(flying(m))) expect(s).toBeCloseTo(0.3 * SQRT3, 2);
  });

  it('with both, the triangle takes the triad share and the helix shares multiply it', () => {
    const m = field();
    m.fire(both, from, dir, new THREE.Vector3());
    const want = [BASE_STATS.damage * TRIAD_SHARE, BASE_STATS.damage * TRIAD_SHARE * HELIX_SHARE, BASE_STATS.damage * TRIAD_SHARE * HELIX_SHARE];
    flying(m).forEach((s, i) => expect(s.spec.damage).toBeCloseTo(want[i], 9));
  });

  it('under Triangulation (a volley of three directions) each direction is a triangle: nine strands', () => {
    const m = field();
    m.fire({ ...triad, volley: 3 }, from, dir, new THREE.Vector3());
    expect(flying(m)).toHaveLength(9);
  });

  it('a strand lives three seconds; a plain shot still lives six', () => {
    const m = field();
    m.fire(triad, from, dir, new THREE.Vector3());
    advance(m, 3.1);
    expect(flying(m)).toHaveLength(0);
    const plain = field();
    plain.fire(intentFromStats(BASE_STATS, 'positive'), from, dir, new THREE.Vector3());
    advance(plain, 3.1);
    expect(flying(plain)).toHaveLength(1);
  });

  it('a stress shot (two Bilaterals, a triangle and Triangulation: 10.8 shots a second) keeps the cap of 200', () => {
    const m = field();
    const spec = { ...triad, volley: 3 };
    let peak = 0, acc = 0;
    for (let f = 0; f < 600; f++) {
      acc += (BASE_STATS.fireRate * 4) * DT;
      while (acc >= 1) { m.fire(spec, from, dir, new THREE.Vector3()); acc -= 1; }
      m.update(DT);
      peak = Math.max(peak, flying(m).length);
    }
    expect(peak).toBeLessThanOrEqual(200);
  });
});
