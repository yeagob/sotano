// Intentions against blocks: phasing (Tao Te Ching) and the shrinking of old loose cubes.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Intents, intentFromStats, type IntentHooks } from '../src/combat/intents';
import { BASE_STATS } from '../src/core/stats';
import { DebrisSystem, DEBRIS_LIFETIME, DEBRIS_SHRINK } from '../src/physics/debris';

function rig(blocks: Set<string>, tier = 0) {
  const state = { hits: [] as string[] };
  const hooks: IntentHooks = {
    solid: (x, y, z) => blocks.has(`${x},${y},${z}`),
    hitBlock: hit => { state.hits.push(`${hit.x},${hit.y},${hit.z}`); return false; },
    tier: () => tier,
    debrisAt: () => -1,
    hitDebris: () => {},
    enemyAt: () => -1,
    hitEnemy: () => {},
    splash: () => {},
  };
  const intents = new Intents(new THREE.Scene(), hooks);
  return { intents, state };
}

const wall = (n: number) => new Set(Array.from({ length: n }, (_, i) => `${3 + i},0,0`));

describe('phasing intentions (Tao Te Ching)', () => {
  it('pass through up to five blocks, damaging every one of them, then stop at the sixth', () => {
    const { intents, state } = rig(wall(8), 3);
    const spec = { ...intentFromStats(BASE_STATS, 'negative'), phase: 5, speed: 20, flight: 5 };
    intents.fire(spec, new THREE.Vector3(0.5, 0.5, 0.5), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    for (let i = 0; i < 120; i++) intents.update(1 / 60);
    expect(state.hits).toEqual(['3,0,0', '4,0,0', '5,0,0', '6,0,0', '7,0,0', '8,0,0']);
    expect(intents.count).toBe(0);
  });

  it('do not hit the same block twice while inside it, whatever the frame time', () => {
    const { intents, state } = rig(wall(2));
    const spec = { ...intentFromStats(BASE_STATS, 'negative'), phase: 5, speed: 20, flight: 5 };
    intents.fire(spec, new THREE.Vector3(0.5, 0.5, 0.5), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    for (let i = 0; i < 20; i++) intents.update(0.4);
    expect(state.hits).toEqual(['3,0,0', '4,0,0']);
  });

  it('cross each block exactly once flying towards negative coordinates too', () => {
    const blocks = new Set(Array.from({ length: 8 }, (_, i) => `${-3 - i},0,0`));
    const { intents, state } = rig(blocks, 3);
    const spec = { ...intentFromStats(BASE_STATS, 'negative'), phase: 5, speed: 20, flight: 5 };
    intents.fire(spec, new THREE.Vector3(0.5, 0.5, 0.5), new THREE.Vector3(-1, 0, 0), new THREE.Vector3());
    for (let i = 0; i < 120; i++) intents.update(1 / 60);
    expect(state.hits).toEqual(['-3,0,0', '-4,0,0', '-5,0,0', '-6,0,0', '-7,0,0', '-8,0,0']);
  });

  it('a plain intention stops at the first block', () => {
    const { intents, state } = rig(wall(3));
    intents.fire(intentFromStats(BASE_STATS, 'negative'), new THREE.Vector3(0.5, 0.5, 0.5), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    for (let i = 0; i < 120; i++) intents.update(1 / 60);
    expect(state.hits).toEqual(['3,0,0']);
  });
});

describe('old loose cubes', () => {
  it('keep their size for most of their life, then shrink smoothly to nothing instead of blinking', () => {
    const d = new DebrisSystem(4, () => false, () => {});
    d.spawn(1, 0.5, 0.5, 0.5, 0, 0, 0);
    const i = 0;
    d.age[i] = 10;
    expect(d.scale(i)).toBe(1);
    d.age[i] = DEBRIS_LIFETIME - DEBRIS_SHRINK / 2;
    expect(d.scale(i)).toBeGreaterThan(0.4);
    expect(d.scale(i)).toBeLessThan(0.6);
    const sizes = [6, 4, 2, 1, 0.2].map(left => { d.age[i] = DEBRIS_LIFETIME - left; return d.scale(i); });
    for (let k = 1; k < sizes.length; k++) expect(sizes[k]).toBeLessThan(sizes[k - 1]);
  });
});

describe('mirrors', () => {
  it('an intention that meets a mirror is reflected along its axis, damages it, and keeps going', () => {
    const hits: string[] = [];
    const hooks: IntentHooks = {
      solid: () => false,
      hitBlock: () => false,
      tier: () => 0,
      debrisAt: () => -1,
      hitDebris: () => {},
      enemyAt: (x) => (x > 2 && x < 3 ? 7 : -1),
      mirrorAxis: id => (id === 7 ? 'z' : null),
      hitEnemy: (id) => hits.push(`hit ${id}`),
      splash: () => {},
    };
    const intents = new Intents(new THREE.Scene(), hooks);
    const spec = { ...intentFromStats(BASE_STATS, 'negative'), speed: 20, flight: 5 };
    intents.fire(spec, new THREE.Vector3(0.5, 0.5, 0.5), new THREE.Vector3(1, 0, 1).normalize(), new THREE.Vector3());
    for (let i = 0; i < 12; i++) intents.update(1 / 60);
    expect(hits).toEqual(['hit 7']);
    expect(intents.count).toBe(1);
  });
});
