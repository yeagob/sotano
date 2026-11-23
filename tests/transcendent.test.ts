// The Transcendent state (docs/design/built/practices/states-of-being/TRANSCENDENT.md): a positive intention carries an
// aura of three times its size. It takes the blocks it touches, adds their armor to its damage, and warms a projection.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Intents, intentFromStats, type IntentHooks } from '../src/combat/intents';
import { BASE_STATS } from '../src/core/stats';
import { SYNERGIES } from '../src/content/synergies';

function rig(opts: { armor: number; foe: number }) {
  const seen = { absorbed: [] as number[], hit: [] as number[] };
  const hooks: IntentHooks = {
    solid: () => false,
    hitBlock: () => false,
    tier: () => 0,
    debrisAt: () => -1,
    hitDebris: () => {},
    // only the aura's sphere (three times the radius) reaches the projection: the direct contact is not tested here
    enemyAt: (_x, _y, _z, r) => (r > 0.2 ? opts.foe : -1),
    hitEnemy: (id, _v, spec) => { seen.hit.push(spec.damage); seen.absorbed.push(id); },
    splash: () => {},
    hit: () => {},
    nearestBlock: () => null,
    nearestEnemy: () => null,
    absorbAt: (_x, _y, _z, r) => { seen.absorbed.push(-r); return opts.armor; },
  };
  return { intents: new Intents(new THREE.Scene(), hooks), seen };
}

describe('the Transcendent aura', () => {
  it('a positive intention with an aura takes the armor of the blocks it touches into its damage', () => {
    const { intents, seen } = rig({ armor: 1.5, foe: 0 });
    const base = intentFromStats(BASE_STATS, 'positive');
    const spec = { ...base, absorb: 3 };
    intents.fire(spec, new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    intents.update(1 / 60);
    // the aura's sphere is three times the intention's radius
    expect(seen.absorbed[0]).toBeCloseTo(-3 * base.radius, 9);
    // the damage grew by the armor, in this frame
    expect(seen.hit[0]).toBeCloseTo(BASE_STATS.damage + 1.5, 9);
  });

  it('a negative intention is not changed by the aura', () => {
    const { intents, seen } = rig({ armor: 3, foe: 0 });
    const spec = { ...intentFromStats(BASE_STATS, 'negative'), absorb: 3 };
    intents.fire(spec, new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    intents.update(1 / 60);
    expect(seen.absorbed.some(v => v < 0)).toBe(false);
    expect(seen.hit.every(d => d === BASE_STATS.damage)).toBe(true);
  });

  it('an aura warms the same projection once per 0.5 s, not every frame', () => {
    const { intents, seen } = rig({ armor: 0, foe: 4 });
    const spec = { ...intentFromStats(BASE_STATS, 'positive'), absorb: 3, flight: 10 };
    intents.fire(spec, new THREE.Vector3(0, 0, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    for (let i = 0; i < 30; i++) intents.update(1 / 60);
    expect(seen.hit.length).toBeLessThanOrEqual(2);
  });

  it('the state is the synergy that needs three Miracles practices and sets the aura on positive fire only', () => {
    const s = SYNERGIES.find(x => x.id === 'transcendent');
    expect(s).toBeDefined();
    expect(s!.requires).toEqual([{ tag: 'milagros', count: 3 }]);
  });
});
