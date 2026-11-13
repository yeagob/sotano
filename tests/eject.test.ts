// Rewards are dispensed away from the player (issue #156): straight away when the throw is clear, to the
// nearest clear side otherwise, and never toward the player. A throw is clear along its whole flight, and
// its landing must be ground, not a shaft, and not an element.
import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { EJECT_ARC, awayAngle, ejectAngle, restable, throwClear, throwReach, wrapAngle, type Ground } from '../src/entities/eject';
import { Chests, type ChestView } from '../src/entities/chests';
import type { ChestModel } from '../src/render/chest-model';
import type { ChestSpec } from '../src/world/floor';

const origin = { x: 5.5, z: 5.5 };
const player = { x: 4.5, z: 5.5 };   // the player stands west of the source, so "away" is east (angle 0)
const FEET = 2;                      // the reward's feet cell height in these tests

/**
 * A small world in cell coordinates: a floor one block below `floorY` everywhere except the shafts,
 * plus explicit solid cells, shaft columns and elements. Cells are "x,y,z" for the blocks and "x,z" for shafts.
 */
function world(opts: { floorY?: number; walls?: string[]; shafts?: string[]; elements?: string[] } = {}): Ground {
  const floorY = opts.floorY ?? 1;
  const walls = new Set(opts.walls ?? []);
  const shafts = new Set(opts.shafts ?? []);
  const elements = new Set(opts.elements ?? []);
  return {
    solid: (x, y, z) => walls.has(`${x},${y},${z}`) || (y === floorY && !shafts.has(`${x},${z}`)),
    element: (x, y, z) => elements.has(`${x},${y},${z}`),
  };
}

const ANY = world();

describe('reward ejection', () => {
  it('points straight away from the player when the throw is clear', () => {
    const a = ejectAngle(origin, player, ANY, FEET, 1.5);
    expect(a).toBeCloseTo(awayAngle(origin, player), 10);
    expect(a).toBeCloseTo(0, 10);
  });

  it('never points toward the player, whatever is in the way', () => {
    for (let k = 0; k < 32; k++) {
      // a wall in a different cell each time, somewhere in front of the source
      const g = world({ walls: [`${6 + (k % 3)},${FEET},${5 + (k % 5) - 2}`] });
      const a = ejectAngle(origin, player, g, FEET, 1.5);
      expect(Math.abs(wrapAngle(a - awayAngle(origin, player)))).toBeLessThanOrEqual(EJECT_ARC + 1e-9);
    }
  });

  it('a thin wall the throw crosses fails it, even when the landing spot beyond is clear', () => {
    const wall = world({ walls: [`7,${FEET},5`] });
    // a throw of 2.5 blocks lands in cell 8, which is clear, but crosses the wall in cell 7
    expect(throwClear(origin, 0, 2.5, wall, FEET)).toBe(false);
    expect(throwClear(origin, 0, 2.5, ANY, FEET)).toBe(true);
    // so the ejection takes a side of the wall instead
    const a = ejectAngle(origin, player, wall, FEET, 2.5);
    expect(a).not.toBeCloseTo(0, 6);
    expect(throwClear(origin, a, 2.5, wall, FEET)).toBe(true);
  });

  it('a shaft at the landing spot is not clear: the reward would fall through', () => {
    const shaft = world({ shafts: ['7,5'] });
    expect(restable(shaft, 7, FEET, 5)).toBe(false);
    expect(throwClear(origin, 0, 1.5, shaft, FEET)).toBe(false);
    expect(ejectAngle(origin, player, shaft, FEET, 1.5)).not.toBeCloseTo(0, 6);
  });

  it('a throw may fly over a shaft when it lands on ground beyond', () => {
    const shaft = world({ shafts: ['7,5'] });
    expect(throwClear(origin, 0, 2.5, shaft, FEET)).toBe(true);
  });

  it('ground up to four blocks below the feet is enough to rest on, a deeper shaft is not', () => {
    // a floor whose top is four blocks below the feet is found (three falls and a rest); five is a shaft
    expect(restable(world({ floorY: FEET - 4 }), 7, FEET, 5)).toBe(true);
    expect(restable(world({ floorY: FEET - 5 }), 7, FEET, 5)).toBe(false);
  });

  it('an element at the landing spot, or on the way down, is not clear', () => {
    expect(restable(world({ elements: [`7,${FEET},5`] }), 7, FEET, 5)).toBe(false);
    // an element on the way down, one block under the landing feet, with the floor under it
    expect(restable(world({ floorY: 0, elements: [`7,1,5`] }), 7, FEET, 5)).toBe(false);
    expect(throwClear(origin, 0, 1.5, world({ elements: [`7,${FEET},5`] }), FEET)).toBe(false);
  });

  it('falls back to straight away when no throw inside the arc is clear', () => {
    const solidEverywhere: Ground = { solid: () => true, element: () => false };
    expect(ejectAngle(origin, player, solidEverywhere, FEET, 1.5)).toBeCloseTo(0, 10);
  });

  it('spreads several rewards from one source by an offset around straight away', () => {
    expect(ejectAngle(origin, player, ANY, FEET, 1.5, 0.5)).toBeCloseTo(0.5, 10);
    expect(ejectAngle(origin, player, ANY, FEET, 1.5, -0.5)).toBeCloseTo(-0.5, 10);
  });

  it('is defined when the player stands on the source itself', () => {
    expect(Number.isFinite(ejectAngle(origin, origin, ANY, FEET, 1.5))).toBe(true);
  });

  it('gives the flight length from speed, lift and gravity', () => {
    // enemy drop: speed 3.2, lift 4 -> about 1.16 blocks; chest: speed 2.2, lift 6.5 -> about 1.3 blocks
    expect(throwReach(3.2, 4, 22)).toBeCloseTo(1.16, 2);
    expect(throwReach(1.5 / 0.68, 6.5, 22)).toBeCloseTo(1.3, 1);
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
