// The Leaves' gift (issue #316; docs/design/built/levels/giant-tree/LEAVES.md, STARS.md): the jump practice floats
// over the ring's east stone in the Leaves, and the crown leads on to the sky. The real player body
// (tests/helpers/walker.ts) climbs the last stair into the Leaves, stands in the ring where the practice is taken,
// then, holding it, climbs the rest of the stair onto the disc, walks onto the first star pad and rides the pads'
// route (the pads carry no teleport: the jumps walk it, `walkHops`) to the last pad, the one that leads up into the sky.

import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { LEAVES_GIFT, LEAVES_ROOM } from '../src/content/crown';
import { ITEM_BY_ID } from '../src/content/items';
import { Rng } from '../src/core/rng';
import { computeStats, type Stats } from '../src/core/stats';
import { reachesItem } from '../src/entities/pickups';
import { RealmGate } from '../src/sky/gate';
import type { SkyBounds } from '../src/sky/types';
import { SURFACE_Y, WORLD_SIZE } from '../src/world/floor';
import { CROWN_PLACE, LEAVES, LEAVES_GIFT_SPOT } from '../src/world/crown';
import { GiantTree, padUnder, TREE_STORIES, type StarPad } from '../src/world/tree';
import { VoxelWorld } from '../src/world/world';
import { walkHops, walkRoute, type Solid, type Waypoint } from './helpers/walker';

const CANOPY = TREE_STORIES.findIndex(s => s.key === 'canopy');
const SEEDS = [1, 7, 42];

function grown(seed: number) {
  const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
  const t = new GiantTree(w, SURFACE_Y, i => new Rng(seed * 31 + i));
  TREE_STORIES.forEach((_, i) => t.grow(i));
  return { w, t, solid: ((x, y, z) => w.solid(x, y, z)) as Solid };
}

/** The stair from the canopy to the stars: the centre of tread `k` (1 is the lowest step). */
function stairOf(t: GiantTree) {
  const [sx, sz] = t.stairAt(CANOPY);
  const fy = t.range(CANOPY)[0] + 2, steps = t.range(CANOPY + 1)[0] + 2 - fy;
  const DA = 2 / 4.5, a0 = CANOPY * 1.3;
  const tread = (k: number): Waypoint => {
    const a = a0 + (k - 0.5) * DA;
    return { x: sx + 0.5 + Math.cos(a) * 4.6, y: fy + k, z: sz + 0.5 + Math.sin(a) * 4.6 };
  };
  return { sx, sz, fy, steps, tread };
}

/** The stats of a player holding the jump practice: its stat modifiers on the base, as the inventory installs them. */
function holding(id: string): Stats {
  const def = ITEM_BY_ID.get(id)!;
  return computeStats((def.stats ?? []).map(s => ({ ...s, source: id })));
}

/** The climb from three steps below the Leaves' step, through the doorway, to the ring's centre. */
function intoTheRing(t: GiantTree): { from: Waypoint; route: Waypoint[] } {
  const { sx, sz, fy, tread } = stairOf(t), j = LEAVES.step;
  return {
    from: tread(j - 3),
    route: [tread(j - 2), tread(j - 1), tread(j), { x: sx + 6.5, y: fy + j, z: sz + 0.5 },
      { x: LEAVES.door.x0 + 1.5, y: LEAVES.y0, z: LEAVES.z0 + 3.5 }, { x: LEAVES.x0 + 2.5, y: LEAVES.y0, z: LEAVES.z0 + 3.5 },
      { x: CROWN_PLACE.x, y: CROWN_PLACE.y, z: CROWN_PLACE.z }],
  };
}

/** From the ring, out of the doorway, up the rest of the stair onto the disc, to the first star pad's centre. */
function ringToFirstPad(t: GiantTree): Waypoint[] {
  const { sx, sz, fy, steps, tread } = stairOf(t), j = LEAVES.step, p0 = t.pads[0];
  const route: Waypoint[] = [{ x: LEAVES.x0 + 2.5, y: LEAVES.y0, z: LEAVES.z0 + 3.5 }, { x: LEAVES.door.x0 + 1.5, y: LEAVES.y0, z: LEAVES.z0 + 3.5 },
    { x: sx + 6.5, y: fy + j, z: sz + 0.5 }];
  for (let k = j + 1; k <= steps; k++) route.push(tread(k));
  route.push({ x: p0.x + 0.5, y: p0.y, z: p0.z + 0.5 });
  return route;
}

const centre = (p: StarPad): Waypoint => ({ x: p.x + 0.5, y: p.y, z: p.z + 0.5 });

/**
 * Rides the pads' route from the first pad by the jumps alone (issue #325): from each pad's centre the player jumps to the
 * next pad's centre (`walkHops`). Returns the pads visited, whether the route was walked, and where the walk ended.
 */
function rideChain(solid: Solid, pads: readonly StarPad[], held: Stats) {
  const res = walkHops(solid, centre(pads[0]), pads.slice(1).map(centre), held);
  return { ok: res.ok, visited: pads.slice(0, res.reached + 1).map((_, i) => i), at: res.at };
}

const SKY: SkyBounds = { top: 1e9, floorOut: 4, deck: [0, 0, 0], crown: [0, 0, 0] };

describe('the Leaves\' gift (#316)', () => {
  it('is the jump practice, floating over the ring\'s east stone, with the centre left free', () => {
    expect(ITEM_BY_ID.get(LEAVES_GIFT.item)?.id).toBe('triple-jump');
    expect(holding(LEAVES_GIFT.item).airJumps).toBe(2);
    expect(LEAVES_ROOM.rows[LEAVES_GIFT.row][LEAVES_GIFT.col]).toBe('o');
    expect([LEAVES_GIFT_SPOT.x, LEAVES_GIFT_SPOT.z]).not.toEqual([CROWN_PLACE.x, CROWN_PLACE.z]);
    for (const seed of SEEDS) {
      const { w } = grown(seed);
      const x = Math.floor(LEAVES_GIFT_SPOT.x), z = Math.floor(LEAVES_GIFT_SPOT.z);
      expect(w.get(x, LEAVES_GIFT_SPOT.y - 1, z), `stone, seed ${seed}`).toBe(MAT.starstone);
      // nothing hangs over it: the dome's eye is open above the ring
      for (let y = LEAVES_GIFT_SPOT.y; y < LEAVES_GIFT_SPOT.y + 4; y++) expect(w.get(x, y, z), `air ${y}`).toBe(AIR);
    }
  });

  it('is taken by a player who climbs into the Leaves and stands in the ring', () => {
    for (const seed of SEEDS) {
      const { t, solid } = grown(seed);
      const { from, route } = intoTheRing(t);
      const res = walkRoute(solid, from, route);
      expect(res, `seed ${seed}`).toMatchObject({ ok: true });
      // the ring's centre is within reach of the practice, and the walker steps up to it and takes it
      expect(reachesItem(LEAVES_GIFT_SPOT, CROWN_PLACE.x, CROWN_PLACE.y, CROWN_PLACE.z)).toBe(true);
      const take = walkRoute(solid, res.at, [LEAVES_GIFT_SPOT]);
      expect(take, `seed ${seed}`).toMatchObject({ ok: true });
      expect(reachesItem(LEAVES_GIFT_SPOT, take.at.x, take.at.y, take.at.z), `seed ${seed}`).toBe(true);
      // the doorway alone does not take it: the practice waits in the ring
      expect(reachesItem(LEAVES_GIFT_SPOT, LEAVES.door.x0 + 1.5, LEAVES.y0, LEAVES.z0 + 3.5)).toBe(false);
    }
  });

  it('holding it, the player goes from the ring up the stair to the first star pad, crosses the route by the jumps to the pad that leads up, and the gate takes it into the sky', () => {
    const held = holding(LEAVES_GIFT.item);
    for (const seed of SEEDS) {
      const { t, solid } = grown(seed);
      const walk = walkRoute(solid, { x: CROWN_PLACE.x, y: CROWN_PLACE.y, z: CROWN_PLACE.z }, ringToFirstPad(t), held);
      expect(walk, `seed ${seed}`).toMatchObject({ ok: true });
      expect(padUnder(t.pads, walk.at.x, walk.at.y, walk.at.z, true), `seed ${seed}`).toBe(0);
      const ride = rideChain(solid, t.pads, held);
      expect(ride.ok, `seed ${seed}: ${JSON.stringify(ride)}`).toBe(true);
      expect(ride.visited).toEqual(t.pads.map((_, i) => i));
      const up = t.pads[ride.visited[ride.visited.length - 1]];
      expect(up.up).toBe(true);
      expect(RealmGate.check('dungeon', ride.at, { up: true }, SKY)?.to).toBe('sky');
    }
  });
});
