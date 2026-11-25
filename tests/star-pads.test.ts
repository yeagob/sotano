// The star pads' route (issue #325; docs/design/built/levels/giant-tree/STARS.md): the pads carry no teleport, so the way
// from the disc to the pad that leads up is walked by the jumps alone. Every hop fits the Triple Jump at base stats (0.8 of
// its reach), the real player body crosses every hop for several seeds, and the same route fails without the Triple Jump.

import { describe, expect, it } from 'vitest';
import { ITEM_BY_ID } from '../src/content/items';
import { copyMods } from '../src/items/types';
import { Rng } from '../src/core/rng';
import { BASE_STATS, computeStats, type Stats } from '../src/core/stats';
import { MARGIN, reach } from '../src/sky/totality/reach';
import { SURFACE_Y, WORLD_SIZE } from '../src/world/floor';
import { GiantTree, padHopFits, padUnder, TREE_STORIES, type StarPad } from '../src/world/tree';
import { VoxelWorld } from '../src/world/world';
import { walkHops, type Solid, type Waypoint } from './helpers/walker';

const SEEDS = [1, 7, 42, 0xbeef, 5];

function grown(seed: number) {
  const w = new VoxelWorld(WORLD_SIZE.sx, WORLD_SIZE.sy, WORLD_SIZE.sz);
  const t = new GiantTree(w, SURFACE_Y, i => new Rng(seed * 31 + i));
  TREE_STORIES.forEach((_, i) => t.grow(i));
  return { t, solid: ((x, y, z) => w.solid(x, y, z)) as Solid };
}

const centre = (p: StarPad): Waypoint => ({ x: p.x + 0.5, y: p.y, z: p.z + 0.5 });

/** The stats of a player holding one Triple Jump (the item's own stat modifiers on the base). */
function holdingOne(): Stats {
  const def = ITEM_BY_ID.get('triple-jump')!;
  return computeStats(copyMods(def, 0).map(s => ({ ...s, source: 'triple-jump' })));
}

describe('the star pads\' route (#325)', () => {
  it('no pad carries a teleport: a pad is a cell and, for the last one, the flag that leads up', () => {
    for (const seed of SEEDS) {
      const { t } = grown(seed);
      for (const p of t.pads) expect(Object.keys(p).filter(k => k !== 'up').sort(), `seed ${seed}`).toEqual(['x', 'y', 'z']);
      expect(t.pads.filter(p => p.up)).toEqual([t.pads[t.pads.length - 1]]);
    }
  });

  it('every hop of the route fits 0.8 of the Triple Jump\'s reach for its rise, from the disc to the pad that leads up', () => {
    for (const seed of SEEDS) {
      const { t } = grown(seed);
      expect(t.pads.length, `seed ${seed}`).toBeGreaterThan(15);
      for (let i = 1; i < t.pads.length; i++) {
        const a = t.pads[i - 1], b = t.pads[i];
        const r = reach(b.y - a.y);
        expect(r, `seed ${seed}, hop ${i - 1} → ${i}`).toBeDefined();
        expect(Math.hypot(b.x - a.x, b.z - a.z), `seed ${seed}, hop ${i - 1} → ${i}`).toBeLessThanOrEqual(MARGIN * r!);
        expect(padHopFits(a, b)).toBe(true);
      }
    }
  });

  it('the pads keep their cells: the same seed grows the same pads, and growing again moves none', () => {
    for (const seed of SEEDS) {
      const first = grown(seed), again = grown(seed);
      expect(again.t.pads, `seed ${seed}`).toEqual(first.t.pads);
      TREE_STORIES.forEach((_, i) => first.t.grow(i));
      expect(first.t.pads, `seed ${seed}`).toEqual(again.t.pads);
    }
  });

  it('the Triple Jump crosses every hop from the first pad to the pad that leads up, by jumps alone, for several seeds', () => {
    const held = holdingOne();
    for (const seed of SEEDS) {
      const { t, solid } = grown(seed);
      const last = t.pads.length - 1;
      const res = walkHops(solid, centre(t.pads[0]), t.pads.slice(1).map(centre), held);
      expect(res, `seed ${seed}`).toMatchObject({ ok: true, reached: last });
      expect(padUnder(t.pads, res.at.x, res.at.y, res.at.z, true), `seed ${seed}`).toBe(last);
      expect(t.pads[last].up, `seed ${seed}`).toBe(true);
    }
  });

  it('without the Triple Jump the same route fails, on every seed', () => {
    for (const seed of SEEDS) {
      const { t, solid } = grown(seed);
      const res = walkHops(solid, centre(t.pads[0]), t.pads.slice(1).map(centre), BASE_STATS);
      expect(res.ok, `seed ${seed}`).toBe(false);
    }
  });
});
