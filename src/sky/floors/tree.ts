// The sky tree: trunk, deck, halls, heartwood slabs and membranes (docs/architecture/SKY.md Â§7.1).
// Pure: shapes and plans only, integers only, no fx, no three.js. The layout (src/sky/layout.ts)
// indexes these shapes with the floors' and Totality's.
//
// Heights are realm y. Hall n is the air from its ground to its top, inclusive; the slab between two
// halls is three layers (top + 1 .. next ground âˆ’ 1). The trunk's wall is WALL thick round each hall;
// the deck is a disc of cloud at y 29â€“31 (walking surface 32), outside the trunk.
//
// The deck's way up is the trunk's foot door: a three-high opening through the foot wall, and a
// spiral of heartwood up a well through the first slab, into hall 1 beside the Bamboo Seat (the well
// stands off the axis, FOOT_WELL, so the seat keeps its ground at the centre). The arrival stands in
// front of the door. Each guardian floor's way up is a heartwood membrane across the bottom layer of
// the slab above its hall (the disc of its plan's gate), closed until `openGate(n)` writes it to air,
// and a climb of ledges from the floor's route through it to the next hall (`climbs`, drawn over the floors).

import { AIR, MAT } from '../../content/materials';
import type { Rng } from '../../core/rng';
import type { Fork, FloorIndex, Place, Shape, SkyFloorPlan, SkyGate, SkyHall, SkyTreePlan, SkyWorldApi, Vec3 } from '../types';
import { covers } from '../world/shapes';
import { SKY_FLOORS } from './index';

/** The sky tree's axis. */
export const SKY_AXIS = { x: 128, z: 128 } as const;

/** Heartwood walls and slabs are this thick (Â§7.1). */
const WALL = 3;
const SLAB = 3;
/** The deck: its walking surface, and its disc's radius (the deck row of Â§7.1). */
export const DECK_Y = 32;
const DECK_RADIUS = 48;
const DECK_LAYERS = 3;
/** The halls of floors 1â€“5: ground and top (Â§7.1). The radius is the floor's B6 radius + WALL. */
const BANDS: readonly { floor: FloorIndex; y0: number; y1: number }[] = [
  { floor: 1, y0: 36, y1: 67 },
  { floor: 2, y0: 71, y1: 106 },
  { floor: 3, y0: 110, y1: 147 },
  { floor: 4, y0: 151, y1: 190 },
  { floor: 5, y0: 194, y1: 217 },
];
/** The roof of the top hall is three layers; the crown (Totality's first platform) stands above it. */
export const CROWN_Y = 221;
const ROOF_TOP = CROWN_Y - 1;
/**
 * The foot well: the deck's way up into hall 1. Its axis stands off the trunk's, in the quarter of hall 1
 * the panda floor leaves empty (x +3, z +8 from the centre), so its mouth opens on the hall's ground
 * beside the Bamboo Seat, two cells clear of the seat and three of the building path, never under them
 * (provisional, to confirm: docs/architecture/SKY.md Â§7.1).
 */
export const FOOT_WELL = { x: SKY_AXIS.x + 3, z: SKY_AXIS.z + 8, r: 4 } as const;

/** Hall n's air radius (n = 1â€“5): the floor's B6 radius + the wall. */
const hallRadius = (n: number) => SKY_FLOORS[n - 1].radius + WALL;
/** The trunk's outer radius of storey n (1â€“5): the hall's air plus the wall. */
const storeyRadius = (n: number) => hallRadius(n) + WALL;
/** The foot door's outer end, on the deck two cells beyond the foot wall (+x). */
const DOOR_X0 = SKY_AXIS.x + storeyRadius(1) + 2;
/** The arrival: on the deck, four cells out from the foot door's mouth and on its centre line, facing the door. */
export const ARRIVAL = { x: DOOR_X0 + 4, z: FOOT_WELL.z + 1 } as const;

/** The sky tree's halls, deck first (floor 0), then floors 1â€“5. */
const HALLS: readonly SkyHall[] = [
  { floor: 0, y0: DECK_Y, y1: DECK_Y, radius: DECK_RADIUS },
  ...BANDS.map((b, i) => ({ floor: b.floor, y0: b.y0, y1: b.y1, radius: hallRadius(i + 1) })),
];

/** A knot window: a two-by-two hole through the wall, from just inside the hall to just outside it. */
function knot(cx: number, cz: number, dx: number, dz: number, inner: number, outer: number, y: number): Shape {
  const a = inner - 2, b = outer + 1;
  return { k: 'run', ax: cx + dx * a, ay: y, az: cz + dz * a, bx: cx + dx * b, by: y, bz: cz + dz * b, w: 2, h: 2, m: AIR };
}

/** Builds the trunk, the deck, the slabs and the membranes. `floors` are the guardian plans (their gates close the slabs). */
export function buildSkyTree(_rng: Rng, floors: readonly SkyFloorPlan[] = []): SkyTreePlan {
  const cx = SKY_AXIS.x, cz = SKY_AXIS.z;
  const shapes: Shape[] = [];

  // the deck: a disc of cloud, outside the trunk and under it
  shapes.push({ k: 'ring', cx, cz, r0: 0, r1: DECK_RADIUS, y0: DECK_Y - DECK_LAYERS, y1: DECK_Y - 1, m: MAT.cloud });

  // the storeys: each one a solid heartwood cylinder (its slab below, its hall above) with the hall's air carved out, and four knot windows
  BANDS.forEach((b, i) => {
    const n = i + 1;
    const bottom = i === 0 ? DECK_Y : BANDS[i - 1].y1 + 1;
    shapes.push({ k: 'ring', cx, cz, r0: 0, r1: storeyRadius(n), y0: bottom, y1: b.y1, m: MAT.heartwood });
    shapes.push({ k: 'ring', cx, cz, r0: 0, r1: hallRadius(n), y0: b.y0, y1: b.y1, m: AIR });
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const)
      shapes.push(knot(cx, cz, dx, dz, hallRadius(n), storeyRadius(n), b.y0 + 1));
  });

  // the deck's way up: a foot well through the first slab, a three-high door through the foot wall, and a spiral up to hall 1.
  // The spiral is one lap of four quarter treads (rise 4, each tread reaching from the axis cell to the wall), so every
  // step is a broad floor one block above the last and a slip lands on the step below, never at the bottom.
  const first = BANDS[0];
  const W = FOOT_WELL;
  shapes.push({ k: 'ring', cx: W.x, cz: W.z, r0: 0, r1: W.r, y0: DECK_Y, y1: first.y0 - 1, m: AIR });
  shapes.push({ k: 'run', ax: DOOR_X0, ay: DECK_Y, az: W.z, bx: W.x + 2, by: DECK_Y, bz: W.z, w: 2, h: 3, m: AIR });
  // the door's lintel ends one cell short of the well, so the jump onto the first tread has its headroom
  shapes.push({ k: 'box', x0: W.x + W.r + 1, y0: first.y0 - 1, z0: W.z, x1: W.x + W.r + 1, y1: first.y0 - 1, z1: W.z + 1, m: AIR });
  shapes.push({ k: 'helix', cx: W.x, cz: W.z, r: W.r, w: W.r, y0: DECK_Y, y1: first.y0 - 1, rise: first.y0 - DECK_Y, m: MAT.heartwood });
  // the rim: one block of pale stone round the mouth on the hall's ground, the cells one out from its edge (owner, 2026-11-05; the height is provisional)
  shapes.push({ k: 'ring', cx: W.x, cz: W.z, r0: W.r + 1, r1: W.r + 1, y0: first.y0, y1: first.y0, m: MAT.palestone });

  // the roof of the top hall
  shapes.push({ k: 'ring', cx, cz, r0: 0, r1: storeyRadius(BANDS.length), y0: BANDS[BANDS.length - 1].y1 + 1, y1: ROOF_TOP, m: MAT.heartwood });

  // each floor's way up: a hole through the slab above its hall, closed by a membrane on its bottom layer, and the
  // climb: heartwood ledges from the top of the floor's vertical route up through the hole to the next hall's ground
  // (drawn over the floors, so a shaft through the next floor's own blocks reaches its surface)
  const gates: SkyGate[] = [];
  const climbs: Shape[] = [];
  BANDS.forEach((b, i) => {
    const plan = floors[i];
    const g = plan?.gate;
    if (!g) return;
    const y = b.y1 + 1;
    shapes.push({ k: 'ring', cx: g.x, cz: g.z, r0: 0, r1: g.r, y0: y, y1: y + SLAB - 1, m: AIR });
    shapes.push({ k: 'ring', cx: g.x, cz: g.z, r0: 0, r1: g.r, y0: y, y1: y, m: MAT.heartwood });
    const next = i + 1 < BANDS.length ? BANDS[i + 1].y0 : CROWN_Y;
    const c = plan.route.length ? climbOf(plan, next, floors[i + 1]?.shapes ?? []) : null;
    if (c) climbs.push(...c.shapes);
    gates.push({ x: g.x, y, z: g.z, r: g.r, ...(c ? { steps: c.steps } : {}) });
  });

  const deck: Place = { id: 0, kind: 'ground', x: ARRIVAL.x, y: DECK_Y, z: ARRIVAL.z, w: 1, d: 1, tag: 0 };
  const door: Place = { id: 1, kind: 'gate', x: FOOT_WELL.x, y: DECK_Y, z: FOOT_WELL.z, w: 1, d: 1, tag: 0 };

  return {
    shapes,
    climbs,
    halls: HALLS,
    deck,
    door,
    gates,
    trunkRadius(y: number): number {
      if (y < DECK_Y || y > ROOF_TOP) return 0;
      const i = BANDS.findIndex(b => y <= b.y1);
      return storeyRadius(i < 0 ? BANDS.length : i + 1);
    },
  };
}

/** Each guardian floor's plan, generated from its own fork at its hall's ground centre (`fork('sky', 'floor', n)`). */
export function floorPlans(fork: Fork): SkyFloorPlan[] {
  return SKY_FLOORS.map((g, i) => {
    const o: Vec3 = { x: SKY_AXIS.x, y: BANDS[i].y0, z: SKY_AXIS.z };
    return g.generate(fork('sky', 'floor', g.index), o);
  });
}

/** Floor n's deity was won: its way up turns to air (setStory), cell by cell over the membrane; the climb's ledge stays. */
export function openGate(world: SkyWorldApi, tree: SkyTreePlan, n: FloorIndex) {
  const g = tree.gates[n - 1];
  if (!g) return;
  const disc: Shape = { k: 'ring', cx: g.x, cz: g.z, r0: 0, r1: g.r, y0: g.y, y1: g.y, m: AIR };
  for (let z = g.z - g.r; z <= g.z + g.r; z++)
    for (let x = g.x - g.r; x <= g.x + g.r; x++)
      if (covers(disc, x, g.y, z) && !(g.steps && covers(g.steps, x, g.y, z))) world.setStory(x, g.y, z, AIR);
}

/** Headroom a body needs over a ledge it stands on: two free cells (1.8 high). */
const HEADROOM = 2;
/** The climb never reaches higher than this above the next hall's ground looking for its surface. */
const SHAFT_MAX = 40;

/** Whether `shapes`, applied in order, leave a block (not air) at the cell; elements do not count. */
function solidIn(shapes: readonly Shape[], x: number, y: number, z: number): boolean {
  let m = AIR;
  for (const s of shapes) if (s.k !== 'elem' && covers(s, x, y, z)) m = s.m;
  return m !== AIR;
}

/**
 * The climb from a floor's vertical route through its way up (SKY.md Â§7.1): a strip of one-block heartwood ledges
 * that continues the route from its top cell, turning round a 2 Ã— 2 square inside the way up's disc, one ledge per
 * height, up to the next hall's ground (the slab's top layer). Where the next floor's own blocks stand over the way
 * up, a 2 Ã— 2 shaft of air is cut through them and the ledges go on to the surface it reaches. The square is the one
 * whose first ledge is a side neighbour of the route's top, inside the disc, and never within two cells over a route
 * ledge (so every route ledge keeps its headroom). Null when no square fits (a generator broke its gate's promise).
 */
function climbOf(plan: SkyFloorPlan, nextGround: number, above: readonly Shape[]):
  { steps: Extract<Shape, { k: 'ledges' }>; shapes: Shape[] } | null {
  const top = plan.route[plan.route.length - 1];
  const g = plan.gate;
  const y0 = top.y;
  // the top is at the square's last corner, (0, 1) along/across, so the strip's first ledge, (0, 0), is its side neighbour
  const squares = [
    { x0: top.x, z0: top.z - 1, axis: 'x' as const },
    { x0: top.x - 1, z0: top.z, axis: 'z' as const },
  ];
  const routeCells = plan.route.map(p => [p.x, p.y - 1, p.z] as const);
  for (const sq of squares) {
    const cell = (k: number): [number, number] => {
      const [a, c] = [[0, 0], [1, 0], [1, 1], [0, 1]][k & 3];
      return sq.axis === 'x' ? [sq.x0 + a, sq.z0 + c] : [sq.x0 + c, sq.z0 + a];
    };
    const cols = [0, 1, 2, 3].map(cell);
    const inside = cols.every(([x, z]) => (x - g.x) ** 2 + (z - g.z) ** 2 <= g.r * g.r + g.r);
    const clear = [0, 1, 2, 3].every(k => {
      const [x, z] = cell(k), y = y0 + k;
      return !routeCells.some(([rx, ry, rz]) => rx === x && rz === z && ry >= y - HEADROOM && ry < y);
    });
    if (!inside || !clear) continue;
    // the surface over the way up: the top of the next floor's blocks standing on its ground in the square's columns
    let surface = nextGround - 1;
    while (surface < nextGround + SHAFT_MAX && cols.some(([x, z]) => solidIn(above, x, surface + 1, z))) surface++;
    const xs = cols.map(c => c[0]), zs = cols.map(c => c[1]);
    const shapes: Shape[] = [];
    if (surface >= nextGround) {
      shapes.push({ k: 'box', x0: Math.min(...xs), y0: nextGround, z0: Math.min(...zs), x1: Math.max(...xs), y1: surface, z1: Math.max(...zs), m: AIR });
    }
    const steps = { k: 'ledges' as const, x0: sq.x0, z0: sq.z0, axis: sq.axis, y0, y1: surface, m: MAT.heartwood };
    shapes.push(steps);
    return { steps, shapes };
  }
  return null;
}
