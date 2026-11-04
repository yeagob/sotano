// Sky floor 4, the lion's (docs/design/not-built/sky/guardians/LION.md, B6; docs/architecture/SKY.md §7.2).
// Fixed, no randomness drawn (every number is a target of the document, so the plan is the same for every seed).
//
// Coordinates are relative to the hall's ground centre o; cells are inclusive. The plain's walking height is 0
// (the slab under it belongs to the tree, so the floor writes nothing below o.y). A rock of walking height h
// has its top block at h − 1, so a player stands in the air cell h. The thorn tree is a helix of one-block
// treads (block h is the tread of sector h mod 8, walking height h + 1), and its top stands beside the
// Sunning Ledge at walking height 34.
//
// Links are written in both directions (a → b) because a climb, a jump and a fall differ: `moveOf` says
// what the player can do from a to b, and with what placed cubes.

import { MAT } from '../../content/materials';
import type { Rng } from '../../core/rng';
import type { Link, Move, Place, PlaceKind, PlatformTag, Shape, SkyFloorGen, SkyFloorPlan, Vec3 } from '../types';

interface Rock { x0: number; x1: number; z0: number; z1: number; h: number; fixed: boolean }

/** The nerve line, from the plain up to the Sunning Ledge, in climbing order. Fixed: the rocks that carry a nest. */
const NERVE: readonly Rock[] = [
  { x0: -19, x1: -17, z0: 11, z1: 13, h: 3, fixed: false },
  { x0: -15, x1: -13, z0: 11, z1: 13, h: 5, fixed: true },   // nest 1: on its east edge, before the 4-gap
  { x0: -8, x1: -6, z0: 11, z1: 13, h: 6, fixed: false },
  { x0: -3, x1: -1, z0: 11, z1: 13, h: 8, fixed: false },
  { x0: 2, x1: 4, z0: 11, z1: 13, h: 9, fixed: true },       // nest 2: on its east edge, before the 5-gap
  { x0: 10, x1: 12, z0: 11, z1: 13, h: 10, fixed: false },
  { x0: 15, x1: 17, z0: 11, z1: 13, h: 12, fixed: false },
  { x0: 19, x1: 21, z0: 9, z1: 11, h: 14, fixed: false },
  { x0: 23, x1: 25, z0: 5, z1: 7, h: 17, fixed: false },
  { x0: 23, x1: 25, z0: 0, z1: 2, h: 19, fixed: false },
  { x0: 23, x1: 25, z0: -4, z1: -2, h: 22, fixed: false },
  { x0: 18, x1: 20, z0: -6, z1: -4, h: 25, fixed: false },
  { x0: 13, x1: 15, z0: -6, z1: -4, h: 28, fixed: false },
  { x0: 16, x1: 18, z0: -3, z1: -2, h: 31, fixed: false },
];
/** The second shade rock: off the nerve line, a spawn beside it. */
const SHADE_2: Rock = { x0: -13, x1: -11, z0: -16, z1: -14, h: 2, fixed: false };
/** The Sunning Ledge: 6 by 6, its walking height 34, fixed (the deity's seat). */
const LEDGE: Rock = { x0: 17, x1: 22, z0: 0, z1: 5, h: 34, fixed: true };
/** The thorn tree's axis, its radius and width, and its top tread's block height (walking 34). */
const TREE = { x: 14, z: 2 } as const;
const TREE_TOP = 33;
const TREE_R = 2;
const TREE_W = 2;
const TREE_RISE = 8;
/** The sector representatives at radius √5: sector s holds the treads of the cells at angles [45s°, 45(s+1)°). */
const REPS: readonly (readonly [number, number])[] = [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]];
/** The plain's entry (the hall's door side) and the tree's foot on the plain. */
const ENTRY = { x: -21, z: 12 } as const;
const TREE_FOOT = { x: 13, z: 2 } as const;
const SPAWNS = [{ x: -18, z: 14 }, { x: -12, z: -13 }] as const;
const GATE_R = 3;

/** A place's footprint along one axis: [centre − ⌊(w−1)/2⌋, centre + ⌊w/2⌋]. */
const lo = (c: number, w: number) => c - ((w - 1) >> 1);
const hi = (c: number, w: number) => c + (w >> 1);

/** Empty cells between two inclusive intervals on one axis (0 when they overlap or touch). */
function gapOn(a0: number, a1: number, b0: number, b1: number): number {
  if (a1 < b0) return b0 - a1 - 1;
  if (b1 < a0) return a0 - b1 - 1;
  return 0;
}

/**
 * What the player can do from a to b, and the placed cubes it costs. Going up: a 1-block step touches (a step)
 * or has one or two empty cells between (a jump); a 2 or 3-block rise needs one placed block, with up to two
 * empty cells; a bridge over four or five empty cells needs two. Going down: a fall over up to three empty
 * cells, of any height, does not hurt; a bridge over four or five costs two. A flat gap of three is nothing.
 */
export function moveOf(a: Place, b: Place): { move: Move; cost: number } | null {
  const dy = b.y - a.y;
  const g = Math.max(
    gapOn(lo(a.x, a.w), hi(a.x, a.w), lo(b.x, b.w), hi(b.x, b.w)),
    gapOn(lo(a.z, a.d), hi(a.z, a.d), lo(b.z, b.d), hi(b.z, b.d)),
  );
  const bridge = g === 4 || g === 5;
  if (dy === 0) {
    if (g === 0) return { move: 'walk', cost: 0 };
    if (g <= 2) return { move: 'jump', cost: 0 };
    return bridge ? { move: 'build', cost: 2 } : null;
  }
  if (dy === 1) {
    if (g === 0) return { move: 'step', cost: 0 };
    if (g <= 2) return { move: 'jump', cost: 0 };
    return bridge ? { move: 'build', cost: 2 } : null;
  }
  if (dy === 2 || dy === 3) return g <= 2 ? { move: 'build', cost: 1 } : null;
  if (dy < 0) {
    if (g <= 3) return { move: 'drop', cost: 0 };
    return bridge ? { move: 'build', cost: 2 } : null;
  }
  return null;
}

export const lion: SkyFloorGen = {
  animal: 'lion', index: 4, radius: 26, height: 36,
  generate(_rng: Rng, o: Vec3): SkyFloorPlan {
    const places: Place[] = [];
    const add = (kind: PlaceKind, x: number, y: number, z: number, w: number, d: number, tag: number): Place => {
      const p: Place = { id: places.length, kind, x, y, z, w, d, tag };
      places.push(p);
      return p;
    };
    /** A rock's place: its footprint's centre cell, standing at its walking height. */
    const rockPlace = (kind: PlaceKind, r: Rock, tag: number): Place => {
      const w = r.x1 - r.x0 + 1, d = r.z1 - r.z0 + 1;
      return add(kind, o.x + r.x0 + ((w - 1) >> 1), o.y + r.h, o.z + r.z0 + ((d - 1) >> 1), w, d, tag);
    };
    const box = (r: Rock, tag: number): Shape => ({
      k: 'box', x0: o.x + r.x0, y0: o.y, z0: o.z + r.z0, x1: o.x + r.x1, y1: o.y + r.h - 1, z1: o.z + r.z1,
      m: MAT.palestone, tag,
    });

    // The thorn tree first, so the ledge (after it) owns the cells the tree shares with it.
    const shapes: Shape[] = [{
      k: 'helix', cx: o.x + TREE.x, cz: o.z + TREE.z, r: TREE_R, w: TREE_W,
      y0: o.y, y1: o.y + TREE_TOP, rise: TREE_RISE, m: MAT.skywood,
    }];
    const platforms: PlatformTag[] = [];

    // Rocks: the nerve line in climbing order, the second shade rock, then the ledge (its tag is the last).
    const nerve = NERVE.map((r, i) => {
      shapes.push(box(r, i + 1));
      const p = rockPlace('ledge', r, i + 1);
      platforms.push({ tag: i + 1, place: p.id, fixed: r.fixed });
      return p;
    });
    const shade2Tag = NERVE.length + 1;
    shapes.push(box(SHADE_2, shade2Tag));
    platforms.push({ tag: shade2Tag, place: rockPlace('ledge', SHADE_2, shade2Tag).id, fixed: SHADE_2.fixed });
    const ledgeTag = NERVE.length + 2;
    shapes.push(box(LEDGE, ledgeTag));
    const seat = add('seat', o.x + LEDGE.x0 + 2, o.y + LEDGE.h, o.z + LEDGE.z0 + 2, 6, 6, ledgeTag);
    platforms.push({ tag: ledgeTag, place: seat.id, fixed: LEDGE.fixed });

    // Nests: on the near rock of each 4 to 5 gap on the nerve line, at its edge facing the gap.
    const nests: Place[] = [];
    NERVE.forEach((r, i) => {
      const next = nerve[i + 1];
      if (!next) return;
      const m = moveOf(nerve[i], next);
      if (m?.move === 'build' && m.cost === 2) {
        nests.push(add('nest', o.x + r.x1, o.y + r.h, o.z + r.z1 - 1, 1, 1, i + 1));
      }
    });

    const spawns = SPAWNS.map(s => add('spawn', o.x + s.x, o.y, o.z + s.z, 1, 1, 0));
    add('ground', o.x + ENTRY.x, o.y, o.z + ENTRY.z, 1, 1, 0);
    add('ground', o.x + TREE_FOOT.x, o.y, o.z + TREE_FOOT.z, 1, 1, 0);

    // The vertical route: one place on each tread, bottom to top.
    const route: Place[] = [];
    for (let h = 0; h <= TREE_TOP; h++) {
      const [dx, dz] = REPS[h % TREE_RISE];
      route.push(add('route', o.x + TREE.x + dx, o.y + h + 1, o.z + TREE.z + dz, 1, 1, 0));
    }

    // Links, both ways. The plain is open ground: its places walk to each other.
    const links: Link[] = [];
    const plain = (p: Place) => p.kind === 'ground' || p.kind === 'spawn';
    for (const a of places) for (const b of places) {
      if (a === b) continue;
      if (plain(a) && plain(b)) { links.push({ a: a.id, b: b.id, move: 'walk' }); continue; }
      const m = moveOf(a, b);
      if (m) links.push({ a: a.id, b: b.id, move: m.move });
    }

    return {
      index: 4, animal: 'lion', y0: o.y, y1: o.y + 36,
      shapes, graph: { places, links },
      seat, spawns, nests, route,
      gate: { x: o.x + TREE.x, z: o.z + TREE.z, r: GATE_R },
      platforms,
    };
  },
};
