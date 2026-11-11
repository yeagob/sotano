// Rewards are dispensed away from the player (issue #156): straight away when the ground is clear, to the
// nearest clear side otherwise, and never toward the player.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { EJECT_ARC, awayAngle, ejectAngle, wrapAngle } from '../src/entities/eject';
import { Chests, type ChestView } from '../src/entities/chests';
import type { ChestModel } from '../src/render/chest-model';
import type { ChestSpec } from '../src/world/floor';

const origin = { x: 5, z: 5 };
const player = { x: 4, z: 5 };       // the player stands west of the source, so "away" is east (angle 0)

/** Clear only where the landing spot lies on one of the given angles from the origin (within a small tolerance). */
function clearAt(...angles: number[]) {
  return (x: number, z: number) => {
    const a = Math.atan2(z - origin.z, x - origin.x);
    return angles.some(t => Math.abs(wrapAngle(a - t)) < 1e-6);
  };
}

describe('reward ejection', () => {
  it('points straight away from the player when the ground is clear', () => {
    const a = ejectAngle(origin, player, () => true);
    expect(a).toBeCloseTo(awayAngle(origin, player), 10);
    expect(a).toBeCloseTo(0, 10);
  });

  it('never points toward the player, whatever is blocked', () => {
    const toward = Math.PI;
    for (let k = 0; k < 64; k++) {
      // a blocked fan around the wanted direction, with one clear spot at a pseudo-random angle
      const spot = (k / 64) * Math.PI * 2;
      const a = ejectAngle(origin, player, clearAt(spot));
      expect(Math.abs(wrapAngle(a - awayAngle(origin, player)))).toBeLessThanOrEqual(EJECT_ARC + 1e-9);
      expect(Math.abs(wrapAngle(a - toward))).toBeGreaterThan(EJECT_ARC - 1e-9);
    }
  });

  it('takes the nearest clear side when the direct path is blocked', () => {
    // straight away is blocked, the spot a little to one side is clear
    expect(ejectAngle(origin, player, clearAt(0.3))).toBeCloseTo(0.3, 10);
    expect(ejectAngle(origin, player, clearAt(-0.3))).toBeCloseTo(-0.3, 10);
    expect(ejectAngle(origin, player, clearAt(0.6))).toBeCloseTo(0.6, 10);
  });

  it('falls back to straight away when no landing spot inside the arc is clear', () => {
    expect(ejectAngle(origin, player, () => false)).toBeCloseTo(0, 10);
    // only a spot toward the player is clear: it is not used
    expect(ejectAngle(origin, player, clearAt(Math.PI))).toBeCloseTo(0, 10);
  });

  it('spreads several rewards from one source by an offset around straight away', () => {
    expect(ejectAngle(origin, player, () => true, 0.5)).toBeCloseTo(0.5, 10);
    expect(ejectAngle(origin, player, () => true, -0.5)).toBeCloseTo(-0.5, 10);
  });

  it('keeps an offset that is still inside the arc even when it has to fan out', () => {
    // the offset spot is blocked, so the search fans to the next clear angle inside the arc
    const a = ejectAngle(origin, player, clearAt(0.5 + 0.3), 0.5);
    expect(a).toBeCloseTo(0.8, 10);
    expect(Math.abs(wrapAngle(a))).toBeLessThanOrEqual(EJECT_ARC);
  });

  it('is defined when the player stands on the source itself', () => {
    const a = ejectAngle(origin, origin, () => true);
    expect(Number.isFinite(a)).toBe(true);
  });
});

describe('chest removal', () => {
  const spec: ChestSpec = { room: 0, x: 3, y: 2, z: 3, keys: 0, item: null };

  /** A chest view with only the parts `remove` touches (`Chests.add` needs a DOM for its textures). */
  function view(scene: THREE.Object3D, x: number): ChestView {
    const root = new THREE.Group();
    const inner = new THREE.Group();
    root.add(inner);
    scene.add(root);
    const model = { root, inner, keyholes: [] } as unknown as ChestModel;
    return { spec: { ...spec, x }, model, t: -1, angle: 0, lockVy: 0, holes: [] };
  }

  it('takes an emptied chest out of the list and out of the scene', () => {
    const scene = new THREE.Group();
    const chests = new Chests(scene);
    const v = view(scene, 3);
    chests.list.push(v);
    expect(v.model.root.parent).toBe(scene);
    chests.remove(v);
    expect(chests.list).not.toContain(v);
    expect(v.model.root.parent).toBeNull();
  });

  it('leaves the other chests alone', () => {
    const scene = new THREE.Group();
    const chests = new Chests(scene);
    const a = view(scene, 3);
    const b = view(scene, 9);
    chests.list.push(a, b);
    chests.remove(a);
    expect(chests.list).toEqual([b]);
    expect(b.model.root.parent).toBe(scene);
  });
});
