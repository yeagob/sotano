// Sky floor 3, the elephant's (docs/design/not-built/sky/guardians/ELEPHANT.md, B6 as resolved on 2026-11-04;
// docs/architecture/SKY.md §7.2–§7.4).
//
// Conventions as the panda's (floors/panda.ts): `o` is the hall's ground centre, `base` = o.y is the row
// of height 0; a block at height h fills base + h, and a place's (x, y, z) is its feet cell, the air above
// its walking surface. The floor's blocks fill heights 0 to 33, so y1 is the last of them. Pure: the plan
// draws nothing from the seed.
//
// The floor, bottom to top: the base (two blocks, the ground at height 2); three rings rising to the centre
// (the ground ring 19–24, the terraces 15–18, 11–14 and 7–10, each 6 blocks above the last) and the Basin's
// mesa (radius 6, top at 26) with its pool (radius 3, cut 2 deep, water to 26), its rim (radius 4, heights
// 26–27) and four culvert spouts on the axes; the waterhole (radius 2, cut 2 deep, water to 2) on the
// ground ring, on the diagonal opposite the tusk line; the tusk line on the (+, +) diagonal, five ledge
// strips up the rings to the way up (its top stands at 34); the herd's spawn by the waterhole; the nests,
// one on each ring, on the (−, +) diagonal.
//
// Not built here, and reported rather than invented (the resolved B6 does not say how a channel's stair
// gets over the 6-high wall): the four channels. The spouts are built, so the channels can be added later
// without moving anything else.

import { EL_WATER, SOURCE, elemByte } from '../../content/elements';
import { AIR, MAT } from '../../content/materials';
import type { Rng } from '../../core/rng';
import type { Box, Link, Move, Place, PlatformTag, Shape, SkyFloorGen, SkyFloorPlan, Vec3 } from '../types';

/** B6: radius 24, height 34 (the floor's blocks fill heights 0 to 33). */
export const RADIUS = 24;
export const HEIGHT = 34;
/** The Basin's water line: the shore's surface and the rim's base. */
export const WATER_LINE = 26;
/** The tusk line's top ledge (the player stands above it, at 34). */
export const TUSK_TOP = 33;

/** Tags of the platforms the hindrances may act on. All are fixed on this floor (see the report). */
export const TAG = { ground: 1, first: 2, second: 3, third: 4, mesa: 5 } as const;

/** The base: radius 24 at heights 0–1; the ground stands at height 2. */
const BASE_R = 24;
/** The terraces: outer radius, the heights of their walls and the surface they stand at. */
const RINGS: readonly { r: number; y0: number; y1: number; tag: number }[] = [
  { r: 18, y0: 2, y1: 7, tag: TAG.first },
  { r: 14, y0: 8, y1: 13, tag: TAG.second },
  { r: 10, y0: 14, y1: 19, tag: TAG.third },
  { r: 6, y0: 20, y1: 25, tag: TAG.mesa },
];
/** The pool (radius 3, cut into heights 24–25) and the rim (radius 4, heights 26–27). */
const POOL_R = 3;
const RIM_R = 4;
/** The waterhole: radius 2, cut into heights 0–1, centred on the (−, −) diagonal 21 from the axis. */
const WATERHOLE_R = 2;
const WATERHOLE_OFF = 15;
/** The tusk line: one ledge strip per ring, anchored on the (+, +) diagonal at x = z = anchor, heights y0..y1. */
const TUSK: readonly { x: number; y0: number; y1: number }[] = [
  { x: 14, y0: 2, y1: 7 },
  { x: 11, y0: 8, y1: 13 },
  { x: 8, y0: 14, y1: 19 },
  { x: 5, y0: 20, y1: 25 },
  { x: 4, y0: 26, y1: TUSK_TOP },
];
/** The standing cells on each ring between two strips: offset from the axis on the (+, +) diagonal (dx, dz), its surface, its tag. */
const TERRACES: readonly { dx: number; dz: number; h: number; tag: number }[] = [
  { dx: 13, dz: 13, h: 8, tag: TAG.first },
  { dx: 10, dz: 10, h: 14, tag: TAG.second },
  { dx: 7, dz: 7, h: 20, tag: TAG.third },
  { dx: 3, dz: 4, h: WATER_LINE, tag: TAG.mesa },
];
/** The nests: one on each ring, on the (−, +) diagonal at offset x, standing at height h. */
const NESTS: readonly { x: number; h: number; tag: number }[] = [
  { x: 4, h: WATER_LINE, tag: TAG.mesa },
  { x: 6, h: 20, tag: TAG.third },
  { x: 9, h: 14, tag: TAG.second },
  { x: 11, h: 8, tag: TAG.first },
  { x: 15, h: 2, tag: TAG.ground },
];
/** The ground foot of the vertical route, on the ground ring, beside the first strip. */
const GROUND_FOOT = 16;
/** A ledge strip's offsets round its 2 × 2 square (the turn of src/sky/world/shapes.ts `ledges`). */
const LEDGE: readonly (readonly [number, number])[] = [[0, 0], [1, 0], [1, 1], [0, 1]];
/** The water a cut holds: a source (the template element). */
const WATER = elemByte(EL_WATER, SOURCE);

export const elephant: SkyFloorGen = {
  animal: 'elephant', index: 3, radius: RADIUS, height: HEIGHT,
  generate(_rng: Rng, o: Vec3): SkyFloorPlan {
    const cx = o.x, cz = o.z, base = o.y;
    const places: Place[] = [];
    const links: Link[] = [];
    const shapes: Shape[] = [];
    const place = (kind: Place['kind'], x: number, y: number, z: number, tag: number): number => {
      places.push({ id: places.length, kind, x, y, z, w: 1, d: 1, tag });
      return places.length - 1;
    };
    const link = (a: number, b: number, move: Move) => { links.push({ a, b, move }); };

    // the base, then the rings rising to the Basin's mesa
    shapes.push({ k: 'ring', cx, cz, r0: 0, r1: BASE_R, y0: base, y1: base + 1, m: MAT.palestone, tag: TAG.ground });
    for (const r of RINGS) shapes.push({ k: 'ring', cx, cz, r0: 0, r1: r.r, y0: base + r.y0, y1: base + r.y1, m: MAT.palestone, tag: r.tag });

    // the Basin: the pool cut 2 deep into the mesa and filled to the water line; the rim; four spouts
    shapes.push({ k: 'ring', cx, cz, r0: 0, r1: POOL_R, y0: base + 24, y1: base + 25, m: AIR, tag: TAG.mesa });
    shapes.push({ k: 'elem', x0: cx - POOL_R, y0: base + 24, z0: cz - POOL_R, x1: cx + POOL_R, y1: base + 25, z1: cz + POOL_R, byte: WATER });
    shapes.push({ k: 'ring', cx, cz, r0: RIM_R, r1: RIM_R, y0: base + WATER_LINE, y1: base + WATER_LINE + 1, m: MAT.fencewood, tag: TAG.mesa });
    for (const [dx, dz] of [[RIM_R, 0], [-RIM_R, 0], [0, RIM_R], [0, -RIM_R]] as const) {
      shapes.push({ k: 'box', x0: cx + dx, y0: base + WATER_LINE, z0: cz + dz, x1: cx + dx, y1: base + WATER_LINE, z1: cz + dz, m: AIR });
    }
    const seat = place('seat', cx, base + WATER_LINE, cz, TAG.mesa);

    // the waterhole: cut into the base, filled to the ground's level
    const wx = cx - WATERHOLE_OFF, wz = cz - WATERHOLE_OFF;
    shapes.push({ k: 'ring', cx: wx, cz: wz, r0: 0, r1: WATERHOLE_R, y0: base, y1: base + 1, m: AIR, tag: TAG.ground });
    shapes.push({ k: 'elem', x0: wx - WATERHOLE_R, y0: base, z0: wz - WATERHOLE_R, x1: wx + WATERHOLE_R, y1: base + 1, z1: wz + WATERHOLE_R, byte: WATER });
    const spawn = place('spawn', wx, base + 2, wz, TAG.ground);

    // the tusk line: five ledge strips, each a 2 × 2 turn round its anchor, one ledge per height
    const strips: number[][] = TUSK.map(({ x, y0, y1 }) => {
      const ax = cx + x, az = cz + x;
      shapes.push({ k: 'ledges', x0: ax, z0: az, axis: 'x', y0: base + y0, y1: base + y1, m: MAT.skywood });
      const ids: number[] = [];
      for (let k = 0; k <= y1 - y0; k++) {
        const [a, c] = LEDGE[k & 3];
        // the ledge at height y0 + k is the block at base + y0 + k, so its feet cell is one above it
        ids.push(place('ledge', ax + a, base + y0 + k + 1, az + c, 0));
      }
      return ids;
    });

    // the vertical route: the ground foot, then each strip's ledges bottom to top, and between two strips the
    // ring's standing cell the strip climbs onto (a jump or a walk across the ring's edge)
    const foot = place('ground', cx + GROUND_FOOT, base + 2, cz + GROUND_FOOT, TAG.ground);
    const route: number[] = [foot];
    let below = foot;
    strips.forEach((ids, s) => {
      link(below, ids[0], below === foot ? 'step' : 'jump');
      route.push(...ids);
      for (let k = 0; k + 1 < ids.length; k++) link(ids[k], ids[k + 1], 'step');
      below = ids[ids.length - 1];
      if (s < TERRACES.length) {
        const t = TERRACES[s];
        const id = place('terrace', cx + t.dx, base + t.h, cz + t.dz, t.tag);
        link(below, id, 'jump');
        route.push(id);
        below = id;
      }
    });

    // the nests: on each ring, on the (−, +) diagonal
    const nests = NESTS.map(({ x, h, tag }) => place('nest', cx - x, base + h, cz + x, tag));

    const platforms: PlatformTag[] = [TAG.ground, TAG.first, TAG.second, TAG.third, TAG.mesa].map(tag => ({ tag, place: -1, fixed: true }));
    const rim: Box = { x0: cx - RIM_R, y0: base + WATER_LINE, z0: cz - RIM_R, x1: cx + RIM_R, y1: base + WATER_LINE + 1, z1: cz + RIM_R };
    const top = places[route[route.length - 1]];

    return {
      index: 3, animal: 'elephant', y0: base, y1: base + TUSK_TOP,
      shapes, graph: { places, links },
      seat: places[seat],
      spawns: [places[spawn]],
      nests: nests.map(id => places[id]),
      route: route.map(id => places[id]),
      gate: { x: top.x, z: top.z, r: 1 },
      platforms,
      extra: { rim },
    };
  },
};
