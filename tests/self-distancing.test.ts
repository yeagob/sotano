import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { BASE_RADIUS, Intents, distanceFactor, flightDamage, flightReach, intentFromStats, type IntentHooks } from '../src/combat/intents';
import { BASE_STATS, computeStats } from '../src/core/stats';
import type { IntentSpec } from '../src/game/events';
import selfDistancing from '../src/content/items/self-distancing';
import { copyMods } from '../src/items/types';

function shootAt(distance: number, size = 1): number {
  const stats = computeStats([...copyMods(selfDistancing, 0).map(s => ({ ...s, source: 'self-distancing' })), { stat: 'size', layer: 'mul', value: size, source: 'test' }]);
  const spec = intentFromStats(stats, 'positive');
  let damage = -1;
  const hooks: IntentHooks = {
    solid: () => false, hitBlock: () => false, tier: () => 0, debrisAt: () => -1, hitDebris: () => {},
    enemyAt: x => (x >= distance ? 7 : -1),
    hitEnemy: (_id, _v, s: IntentSpec) => { damage = s.damage; },
    splash: () => {}, hit: () => {}, nearestBlock: () => null, nearestEnemy: () => null,
  };
  const intents = new Intents(new THREE.Scene(), hooks);
  intents.fire(spec, new THREE.Vector3(0, 10, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
  for (let k = 0; k < 2000 && damage < 0; k++) intents.update(1 / 1000);
  return damage;
}

describe('Self-Distancing, the panda gift (#357)', () => {
  it('the distance factor is ×0.5 at 0, ×1 at half the flight, ×2 at its end, linear between, and capped', () => {
    expect(distanceFactor(0, 8)).toBe(0.5);
    expect(distanceFactor(2, 8)).toBeCloseTo(0.75);
    expect(distanceFactor(4, 8)).toBe(1);
    expect(distanceFactor(6, 8)).toBeCloseTo(1.5);
    expect(distanceFactor(8, 8)).toBe(2);
    expect(distanceFactor(20, 8)).toBe(2);
  });

  it('the maximum flight is the straight flight of the intention: speed times its straight seconds', () => {
    const spec = intentFromStats(BASE_STATS, 'positive');
    expect(flightReach(spec)).toBeCloseTo(16 * 0.5);
  });

  it('final damage = base × distance factor × size', () => {
    const spec = { ...intentFromStats(BASE_STATS, 'positive'), radius: BASE_RADIUS * 2 };
    const reach = flightReach(spec);
    expect(flightDamage(spec, reach)).toBeCloseTo(BASE_STATS.damage * 2 * 2);
    expect(flightDamage(spec, 0)).toBeCloseTo(BASE_STATS.damage * 0.5 * 2);
    expect(flightDamage(spec, reach / 2)).toBeCloseTo(BASE_STATS.damage * 2);
  });

  it('the stat marks the intention; without the practice nothing changes', () => {
    expect(intentFromStats(BASE_STATS, 'positive').flightDamage).toBeUndefined();
    const held = computeStats(copyMods(selfDistancing, 0).map(s => ({ ...s, source: 'self-distancing' })));
    expect(intentFromStats(held, 'positive').flightDamage).toBe(true);
  });

  it('in flight, the hit carries the damage of the distance flown, and of the size', () => {
    const base = BASE_STATS.damage, reach = flightReach(intentFromStats(BASE_STATS, 'positive'));
    expect(shootAt(0.05)).toBeCloseTo(base * 0.5, 1);
    expect(shootAt(reach / 2)).toBeCloseTo(base, 1);
    expect(shootAt(reach)).toBeCloseTo(base * 2, 1);
    expect(shootAt(reach, 2)).toBeCloseTo(base * 4, 1);
  });
});
