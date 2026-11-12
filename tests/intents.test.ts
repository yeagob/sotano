// Intentions against blocks: phasing (Tao Te Ching) and the shrinking of old loose cubes.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { Intents, intentFromStats, intentLook, intentPowerLevel, GHOSTS_MAX, POWER_MAX, type IntentHooks } from '../src/combat/intents';
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
    hit: () => {},
    nearestBlock: () => null,
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
      hit: () => {},
      nearestBlock: () => null,
    };
    const intents = new Intents(new THREE.Scene(), hooks);
    const spec = { ...intentFromStats(BASE_STATS, 'negative'), speed: 20, flight: 5 };
    intents.fire(spec, new THREE.Vector3(0.5, 0.5, 0.5), new THREE.Vector3(1, 0, 1).normalize(), new THREE.Vector3());
    for (let i = 0; i < 12; i++) intents.update(1 / 60);
    expect(hits).toEqual(['hit 7']);
    expect(intents.count).toBe(1);
  });
});

describe('the look of an intention grows with its power (#111)', () => {
  const base = () => intentFromStats(BASE_STATS, 'positive');
  const at = (damage: number) => intentLook({ ...base(), damage });

  it('a base intention keeps the base bead', () => {
    const look = intentLook(base());
    expect(look.power).toBe(0);
    expect(look.radius).toBeCloseTo(base().radius);
    expect(look.halo).toBeCloseTo(2.4);
    expect(look.glow).toBeCloseTo(1);
  });

  it('every step of damage is a visible step in size, halo, glow and trail', () => {
    const steps = [3.5, 4.5, 5.5, 7, 10.5, 14, 28].map(at);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i].radius).toBeGreaterThan(steps[i - 1].radius);
      expect(steps[i].halo).toBeGreaterThan(steps[i - 1].halo);
      expect(steps[i].glow).toBeGreaterThan(steps[i - 1].glow);
      expect(steps[i].ghosts).toBeGreaterThanOrEqual(steps[i - 1].ghosts);
    }
    // a doubling is at least 15 % bigger and one ghost longer, so it reads without colour
    expect(at(7).radius / at(3.5).radius).toBeGreaterThan(1.15);
    expect(at(7).ghosts).toBe(at(3.5).ghosts + 1);
  });

  it('effects widen the halo and lengthen the trail, at the same damage', () => {
    const plain = intentLook(base());
    const rich = intentLook({ ...base(), pierce: 1, homing: 2, tags: new Set(['x']) });
    expect(rich.effects).toBe(3);
    expect(rich.halo).toBeGreaterThan(plain.halo);
    expect(rich.glow).toBeGreaterThan(plain.glow);
    expect(rich.ghosts).toBe(plain.ghosts + 3);
    expect(rich.radius).toBeCloseTo(plain.radius);
  });

  it('stays a bead: size, effects and trail are capped', () => {
    const huge = intentLook({ ...base(), damage: 1e6, radius: 5, pierce: 9, phase: 9, bounces: 9, homing: 9, volley: 9, tags: new Set(['a', 'b']) });
    expect(huge.power).toBe(POWER_MAX);
    expect(huge.radius).toBeLessThanOrEqual(0.42);
    expect(huge.ghosts).toBeLessThanOrEqual(GHOSTS_MAX);
    expect(at(0.5).radius).toBeGreaterThan(0);
  });

  it('negative intentions grow the same way, so polarity and power read apart', () => {
    const neg = intentLook({ ...intentFromStats(BASE_STATS, 'negative'), damage: 14 });
    expect(neg).toEqual(at(14));
  });

  it('the meshes draw the trail behind a stronger intention', () => {
    const scene = new THREE.Scene();
    const { intents } = rig(new Set());
    const weak = new Intents(scene, (intents as unknown as { hooks: IntentHooks }).hooks);
    const strong = new Intents(scene, (intents as unknown as { hooks: IntentHooks }).hooks);
    weak.fire(base(), new THREE.Vector3(), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    strong.fire({ ...base(), damage: 28 }, new THREE.Vector3(), new THREE.Vector3(1, 0, 0), new THREE.Vector3());
    for (let i = 0; i < 10; i++) { weak.update(1 / 60); strong.update(1 / 60); }
    const shells = (m: Intents) => (m as unknown as { mesh: THREE.InstancedMesh }).mesh.count;
    expect(shells(weak)).toBe(1 + at(3.5).ghosts);
    expect(shells(strong)).toBe(1 + at(28).ghosts);
  });

  it('the fire button power follows the same damage steps', () => {
    expect(intentPowerLevel(3.5)).toBe(0);
    expect(intentPowerLevel(1)).toBe(0);
    expect(intentPowerLevel(7)).toBeCloseTo(1 / POWER_MAX);
    expect(intentPowerLevel(1e6)).toBe(1);
  });
});
