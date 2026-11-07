// Sky floor 1, the panda's (docs/design/not-built/sky/guardians/PANDA.md, B6; docs/architecture/SKY.md §7.2–§7.4).
//
// Conventions. `o` is the hall's ground centre; `base` = o.y is the feet cell of the hall's ground (the
// hall's slab sits in the cell below and belongs to the tree, so nothing here writes at base − 1). A
// block at height h fills cell base + h, so a column of top 24 fills heights 0..23. A place's (x, y, z)
// is its feet cell: the air cell above its walking surface, so the seat's top at 24 is the seat place
// at base + 24. Links are undirected; a traversal is classified by its height change and its gap (the
// empty cells between the two footprints) against the jump numbers of physics/jump.ts. Pure: no
// randomness is drawn, so the plan is the same for every seed.
//
// The floor, bottom to top: the gentle path (sixteen 2 × 2 columns, each one block higher than the last,
// winding inward to the seat's ledge strip); the ledge strip on the seat's west face (the vertical route,
// one ledge per height, to the seat's top); the building path on the east side (eight 2 × 2 columns, each
// two blocks higher, one placed cube per step, nests on the way); the Bamboo Seat (3 × 3, top at 24); two
// bamboo clumps (minion spawns) on the ground on opposite sides; three nests at heights 0, 8 and 16.
// The quarter at x 0..+8, z +4..+12 stays empty: the tree's foot well opens there (FOOT_WELL in tree.ts).
//
// Deviations from B6 are reported with the change: the soft stairs are not in this plan, and the floor
// has twenty-four columns (sixteen gentle, eight building) where B6 says twelve to sixteen, because the
// gentle path needs one column per block of height and the shape budget of §7.4 (shapes < solid / 40)
// counts one shape per column.

import type { Rng } from '../../core/rng';
import { MAT } from '../../content/materials';
import type { Link, Move, Place, PlatformTag, Shape, SkyFloorGen, SkyFloorPlan, Vec3 } from '../types';

/** The seat's top, above the hall's ground (B6). */
export const SEAT_TOP = 24;
/** The floor's height (B6). */
export const HEIGHT = 28;

/** The gentle path: origin (x, z) of column k's 2 × 2 footprint (k = index + 1), relative to the centre. Consecutive columns are three cells apart. */
const GENTLE: readonly (readonly [number, number])[] = [
  [-12, -9], [-9, -9], [-9, -6], [-9, -3], [-12, -3], [-15, -3], [-15, -6], [-15, -9],
  [-15, -12], [-12, -12], [-9, -12], [-6, -12], [-6, -9], [-6, -6], [-6, -3], [-6, 0],
];
/** The ledge strip's offsets round its 2 × 2 square (the turn of src/sky/world/shapes.ts `ledges`). */
const LEDGE: readonly (readonly [number, number])[] = [[0, 0], [1, 0], [1, 1], [0, 1]];

/** Building path column j (1..8), top 2j: the origin of its footprint, relative to the centre. */
const building = (j: number): readonly [number, number] => [j % 2 === 1 ? 12 : 11, -14 + 4 * (j - 1)];

/** Platform tags: the seat 1, gentle column k 2..17 (k + 1), building column j 18..25 (17 + j). */
const SEAT_TAG = 1;
const gentleTag = (k: number) => k + 1;
const buildingTag = (j: number) => 17 + j;

export const panda: SkyFloorGen = {
  animal: 'panda', index: 1, radius: 20, height: 28,
  generate(_rng: Rng, o: Vec3): SkyFloorPlan {
    const cx = o.x, cz = o.z, base = o.y;
    const places: Place[] = [];
    const links: Link[] = [];
    const shapes: Shape[] = [];
    const place = (kind: Place['kind'], x: number, h: number, z: number, w: number, d: number, tag: number): number => {
      places.push({ id: places.length, kind, x, y: base + h, z, w, d, tag });
      return places.length - 1;
    };
    const link = (a: number, b: number, move: Move) => { links.push({ a, b, move }); };

    // the Bamboo Seat: a 3 × 3 column, top at 24
    shapes.push({ k: 'box', x0: cx - 1, y0: base, z0: cz - 1, x1: cx + 1, y1: base + SEAT_TOP - 1, z1: cz + 1, m: MAT.bamboo, tag: SEAT_TAG });
    const seat = place('seat', cx, SEAT_TOP, cz, 3, 3, SEAT_TAG);

    // the ledge strip on the seat's west face: one ledge per height from the ground to the seat's top
    shapes.push({ k: 'ledges', x0: cx - 3, z0: cz - 1, axis: 'x', y0: base, y1: base + SEAT_TOP - 1, m: MAT.bamboo });
    const ledges: number[] = [];
    for (let k = 0; k < SEAT_TOP; k++) {
      const [a, c] = LEDGE[k & 3];
      // the ledge at height k is the block at base + k, so its walking cell is the feet at k + 1
      ledges.push(place('ledge', cx - 3 + a, k + 1, cz - 1 + c, 1, 1, 0));
    }

    // the ground: beside the gentle path's first column, and beside the ledge strip's foot
    const groundStart = place('ground', cx - 13, 0, cz - 9, 1, 1, 0);
    const groundFoot = place('ground', cx - 4, 0, cz - 1, 1, 1, 0);

    // the gentle path: column k (1..16) at top k
    const gentle: number[] = [];
    GENTLE.forEach(([dx, dz], i) => {
      const k = i + 1;
      const x0 = cx + dx, z0 = cz + dz;
      shapes.push({ k: 'box', x0, y0: base, z0, x1: x0 + 1, y1: base + k - 1, z1: z0 + 1, m: MAT.bamboo, tag: gentleTag(k) });
      gentle.push(place('top', x0, k, z0, 2, 2, gentleTag(k)));
    });

    // the building path: column j at top 2j, one placed cube for each step
    const build: number[] = [];
    for (let j = 1; j <= 8; j++) {
      const [dx, dz] = building(j);
      const x0 = cx + dx, z0 = cz + dz;
      shapes.push({ k: 'box', x0, y0: base, z0, x1: x0 + 1, y1: base + 2 * j - 1, z1: z0 + 1, m: MAT.skywood, tag: buildingTag(j) });
      build.push(place('top', x0, 2 * j, z0, 2, 2, buildingTag(j)));
    }

    // nests (three cubes each): at the building path's foot, and on gentle columns 8 and 16
    const nestFoot = place('nest', cx + 11, 0, cz - 14, 1, 1, 0);
    const [x8, z8] = GENTLE[7];
    const nest8 = place('nest', cx + x8, 8, cz + z8, 1, 1, gentleTag(8));
    const [x16, z16] = GENTLE[15];
    const nest16 = place('nest', cx + x16, 16, cz + z16, 1, 1, gentleTag(16));

    // the bamboo clumps: minion spawns on the ground, on opposite sides of the seat
    const spawnW = place('spawn', cx - 17, 0, cz, 1, 1, 0);
    const spawnE = place('spawn', cx + 17, 0, cz, 1, 1, 0);

    // links: a step is up one with no gap; a jump is a gap the jump numbers allow; a build needs a placed cube
    link(groundStart, gentle[0], 'step');
    for (let k = 0; k < 15; k++) link(gentle[k], gentle[k + 1], 'jump');
    link(gentle[15], ledges[15], 'jump');
    link(groundFoot, ledges[0], 'step');
    for (let k = 0; k < SEAT_TOP - 1; k++) link(ledges[k], ledges[k + 1], 'step');
    link(ledges[SEAT_TOP - 1], seat, 'jump');
    link(gentle[7], nest8, 'walk');
    link(gentle[15], nest16, 'walk');
    link(nestFoot, build[0], 'build');
    for (let j = 0; j < 7; j++) link(build[j], build[j + 1], 'build');

    const platforms: PlatformTag[] = [
      { tag: SEAT_TAG, place: seat, fixed: true },
      ...gentle.map((p, i) => ({ tag: gentleTag(i + 1), place: p, fixed: true })),
      ...build.map((p, i) => ({ tag: buildingTag(i + 1), place: p, fixed: false })),
    ];

    // the vertical route, bottom to top: the ground foot, then every ledge; its top is under the way up
    const route = [groundFoot, ...ledges].map(id => places[id]);
    const top = route[route.length - 1];

    return {
      index: 1, animal: 'panda', y0: base, y1: base + HEIGHT,
      shapes, graph: { places, links },
      seat: places[seat],
      spawns: [places[spawnW], places[spawnE]],
      nests: [places[nestFoot], places[nest8], places[nest16]],
      route,
      gate: { x: top.x, z: top.z, r: 1 },
      platforms,
    };
  },
};
