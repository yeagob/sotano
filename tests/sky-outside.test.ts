// Law 3.8, the only way up is inside the tree (SKY.md §4): a placed tower outside the trunk's outer radius asks the
// guardian of that height to knock it down; inside it does not; the trunk is heartwood that takes no damage.
// Headless: a real SkyWorld, a small tree plan and a fake host.

import { describe, expect, it } from 'vitest';
import { MAT, mat } from '../src/content/materials';
import type { Body } from '../src/physics/voxel-collide';
import { SKY_AXIS } from '../src/sky/floors/tree';
import { OutsideWatch, REWATCH } from '../src/sky/laws/outside';
import type { FloorIndex, Shape, SkyHost, SkyTreePlan, Tower } from '../src/sky/types';
import { buildIndex } from '../src/sky/world/shape-index';
import { SkyWorld } from '../src/sky/world/sky-world';

const C = SKY_AXIS.x, Z = SKY_AXIS.z;
const RADIUS = 20;
/** The deck at 10, floor 1 from 20, floor 2 from 50; the trunk spans 10..80. */
const TREE: SkyTreePlan = {
  shapes: [],
  halls: [{ floor: 0, y0: 10, y1: 10, radius: RADIUS }, { floor: 1, y0: 20, y1: 40, radius: RADIUS }, { floor: 2, y0: 50, y1: 70, radius: RADIUS }],
  deck: { id: 0, kind: 'ground', x: C, y: 10, z: Z, w: 1, d: 1, tag: 0 },
  door: { id: 1, kind: 'ground', x: C, y: 10, z: Z, w: 1, d: 1, tag: 0 },
  gates: [],
  trunkRadius: y => (y >= 10 && y <= 80 ? RADIUS : 0),
};
/** Ledges of stone at three heights, inside and outside the radius. */
const LEDGES: Shape[] = [
  { k: 'box', x0: C - 30, y0: 24, z0: Z - 2, x1: C + 30, y1: 24, z1: Z + 2, m: MAT.stone },
  { k: 'box', x0: C + 25, y0: 54, z0: Z - 2, x1: C + 30, y1: 54, z1: Z + 2, m: MAT.stone },
  { k: 'box', x0: C + 25, y0: 4, z0: Z - 2, x1: C + 30, y1: 4, z1: Z + 2, m: MAT.stone },
  { k: 'box', x0: C + 25, y0: 90, z0: Z - 2, x1: C + 30, y1: 90, z1: Z + 2, m: MAT.stone },
];

function setup() {
  const world = new SkyWorld(buildIndex(LEDGES));
  const clock = { t: 0 };
  const body: Body = { x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, hw: 0.3, h: 1.8, onGround: true };
  const host = { time: () => clock.t, world: () => world, player: () => ({ body }) } as unknown as SkyHost;
  const knocks: { tower: Tower; floor: FloorIndex }[] = [];
  const watch = new OutsideWatch(host, TREE, (tower, floor) => knocks.push({ tower, floor }));
  /** A stack of three placed cells on the ledge whose top is `ground`, at column x; the player stands on it. */
  const stack = (x: number, ground: number) => {
    world.placing = true;
    for (let y = ground + 1; y <= ground + 3; y++) world.set(x, y, Z, MAT.stone);
    world.placing = false;
    Object.assign(body, { x: x + 0.5, y: ground + 4, z: Z + 0.5, onGround: true });
  };
  return { world, clock, body, watch, knocks, stack };
}

describe('3.8 the outside watch', () => {
  it('a tower outside the trunk asks the guardian of that height to knock it down', () => {
    const { watch, knocks, stack } = setup();
    stack(C + 26, 24);
    watch.update(0.1);
    expect(knocks).toHaveLength(1);
    expect(knocks[0].floor).toBe(1);
    expect(knocks[0].tower.cells).toHaveLength(3);
  });

  it('a tower inside the trunk does not', () => {
    const { watch, knocks, stack } = setup();
    stack(C + 10, 24);
    watch.update(0.1);
    expect(knocks).toHaveLength(0);
  });

  it('standing outside on no tower does not', () => {
    const { watch, knocks, body } = setup();
    Object.assign(body, { x: C + 26.5, y: 25, z: Z + 0.5, onGround: true });
    watch.update(0.1);
    expect(knocks).toHaveLength(0);
  });

  it('the guardian is the one of that height: floor 2 higher up, the panda below the deck', () => {
    const { watch, knocks, stack } = setup();
    stack(C + 26, 54);
    watch.update(0.1);
    stack(C + 28, 4);
    watch.update(0.1);
    expect(knocks.map(k => k.floor)).toEqual([2, 1]);
  });

  it('above the roof (Totality) nothing is watched', () => {
    const { watch, knocks, stack } = setup();
    stack(C + 26, 90);
    watch.update(0.1);
    expect(knocks).toHaveLength(0);
  });

  it('asks once per tower, again only after REWATCH seconds on it, and at once after stepping off', () => {
    const { watch, knocks, stack, clock, body } = setup();
    stack(C + 26, 24);
    for (let i = 0; i < 10; i++) { clock.t += 0.1; watch.update(0.1); }
    expect(knocks).toHaveLength(1);
    clock.t += REWATCH;
    watch.update(0.1);
    expect(knocks).toHaveLength(2);
    body.onGround = false;
    watch.update(0.1);
    body.onGround = true;
    watch.update(0.1);
    expect(knocks).toHaveLength(3);
  });

  it('the trunk is heartwood: it takes no damage', () => {
    const h = mat(MAT.heartwood);
    expect(h.tier).toBe(Infinity);
    expect(h.hp).toBe(Infinity);
  });
});
