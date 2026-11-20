// The Leaves, the room of the crown (owner decision D14 of #149; docs/design/built/levels/giant-tree/LEAVES.md):
// a valid room template, carved by the giant tree in its canopy, inside the canopy's band, reachable on foot from the
// last stair, and the crown's place in one constant (D4: the Light's trigger reads it).
import { describe, expect, it } from 'vitest';
import { AIR, MAT } from '../src/content/materials';
import { LEAVES_ROOM } from '../src/content/crown';
import { ROOM_TEMPLATES, validateTemplate } from '../src/content/rooms';
import { Rng } from '../src/core/rng';
import { SURFACE_Y, WORLD_SIZE } from '../src/world/floor';
import { CROWN_PLACE, inLeaves, LEAVES } from '../src/world/crown';
import { GiantTree, LEAVES_CLEAR, TREE_STORIES } from '../src/world/tree';
import { VoxelWorld } from '../src/world/world';
import { walkRoute } from './helpers/walker';

const CANOPY = TREE_STORIES.findIndex(s => s.key === 'canopy');

function grown(seed: number) {
  const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
  const t = new GiantTree(w, SURFACE_Y, i => new Rng(seed * 31 + i));
  for (let i = CANOPY - 1; i <= CANOPY + 1; i++) t.grow(i);
  return { w, t };
}

describe('the Leaves (D14): the room of the crown', () => {
  it('is a valid room template, and no floor generator ever draws it', () => {
    expect(validateTemplate(LEAVES_ROOM)).toEqual([]);
    expect(ROOM_TEMPLATES.some(t => t.id === LEAVES_ROOM.id)).toBe(false);
  });

  it('the crown place is one constant, the same the tree grows', () => {
    const { t } = grown(1);
    expect(t.leaves).toEqual(LEAVES);
    expect(CROWN_PLACE.x).toBe(LEAVES.x0 + 6.5);
    expect(CROWN_PLACE.z).toBe(LEAVES.z0 + 3.5);
    expect(CROWN_PLACE.y).toBe(LEAVES.y0);
    expect(inLeaves(CROWN_PLACE.x, CROWN_PLACE.y, CROWN_PLACE.z)).toBe(true);
    expect(inLeaves(CROWN_PLACE.x, CROWN_PLACE.y - 3, CROWN_PLACE.z)).toBe(false);
    expect(Object.isFrozen(CROWN_PLACE)).toBe(true);
  });

  it('stays inside the canopy band: over the canopy floor, three clear rows under the stars, within the world', () => {
    const { t } = grown(2);
    const [c0, c1] = t.range(CANOPY), [s0] = t.range(CANOPY + 1);
    const shellBottom = LEAVES.y0 - 2, shellTop = LEAVES.y0 + LEAVES.height + 1;
    expect(shellBottom).toBeGreaterThan(c0 + 1);
    expect(shellTop).toBeLessThanOrEqual(c1 - LEAVES_CLEAR);
    expect(s0 - shellTop - 1).toBeGreaterThanOrEqual(LEAVES_CLEAR);
    expect(LEAVES.height).toBeLessThanOrEqual(8);
    expect(t.storyAt(LEAVES.y0)).toBe(CANOPY);
    expect(LEAVES.door.x0 - 2).toBeGreaterThan(0);
    expect(LEAVES.x0 + LEAVES.w + 2).toBeLessThan(WORLD_SIZE.sx - 1);
    expect(LEAVES.z0 - 2).toBeGreaterThan(0);
    expect(LEAVES.z0 + LEAVES.d + 2).toBeLessThan(WORLD_SIZE.sz - 1);
  });

  it('is carved in the crown: bough floor, leaf walls, the starstone ring, an open eye to the sky', () => {
    for (const seed of [1, 7, 42]) {
      const { w } = grown(seed);
      const { x0, y0, z0 } = LEAVES;
      for (let r = 0; r < 7; r++) for (let c = 0; c < 13; c++) {
        const ch = LEAVES_ROOM.rows[r][c], x = x0 + c, z = z0 + r;
        expect(w.get(x, y0 - 1, z), `floor ${c},${r}`).toBe(MAT.bough);
        if (ch === '.') for (let y = y0; y < y0 + 5; y++) expect(w.get(x, y, z), `air ${c},${r},${y - y0}`).toBe(AIR);
        if (ch === 'o') expect(w.get(x, y0, z)).toBe(MAT.starstone);
      }
      // the west wall is leaves, two blocks thick, outside the doorway
      for (const y of [y0, y0 + 2]) expect([MAT.leaves, MAT.youngleaf]).toContain(w.get(x0 - 1, y, z0));
      // the eye over the centre is open up to the top of the canopy story
      const [, c1] = new GiantTree(w, SURFACE_Y, i => new Rng(i)).range(CANOPY);
      for (let y = y0; y <= c1; y++) expect(w.get(x0 + 6, y, z0 + 3), `eye ${y - y0}`).toBe(AIR);
      // the doorway is open and floored
      for (let z = LEAVES.door.z0; z <= LEAVES.door.z1; z++) for (let x = LEAVES.door.x0; x <= LEAVES.door.x1; x++) {
        expect(w.get(x, y0 - 1, z)).toBe(MAT.bough);
        for (let y = y0; y < y0 + 3; y++) expect(w.get(x, y, z)).toBe(AIR);
      }
    }
  });

  it('is reachable on foot: up the last stair, through the doorway, into the ring at its centre', () => {
    for (const seed of [1, 7, 42]) {
      const { w, t } = grown(seed);
      const [sx, sz] = t.stairAt(CANOPY);
      const fy = t.range(CANOPY)[0] + 2;
      const DA = 2 / 4.5, a0 = CANOPY * 1.3, j = LEAVES.step;
      const tread = (k: number) => {
        const a = a0 + (k - 0.5) * DA;
        return { x: sx + 0.5 + Math.cos(a) * 4.6, y: fy + k, z: sz + 0.5 + Math.sin(a) * 4.6 };
      };
      const route = [tread(j - 2), tread(j - 1), tread(j), { x: sx + 6.5, y: fy + j, z: sz + 0.5 },
        { x: LEAVES.door.x0 + 1.5, y: LEAVES.y0, z: LEAVES.z0 + 3.5 }, { x: LEAVES.x0 + 2.5, y: LEAVES.y0, z: LEAVES.z0 + 3.5 },
        { x: LEAVES.x0 + 5.5, y: LEAVES.y0, z: LEAVES.z0 + 3.5 }, { x: CROWN_PLACE.x, y: CROWN_PLACE.y, z: CROWN_PLACE.z }];
      const res = walkRoute((x, y, z) => w.solid(x, y, z), tread(j - 3), route);
      expect(res, `seed ${seed}`).toMatchObject({ ok: true });
    }
  });
});
