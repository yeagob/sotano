// The sky tree: trunk, deck, halls, heartwood slabs and membranes (docs/architecture/SKY.md §7.1).
// Pure: shapes and plans only, integers only, no fx, no three.js. The layout (src/sky/layout.ts)
// indexes these shapes with the floors' and Totality's.
//
// Heights are realm y. Hall n is the air from its ground to its top, inclusive; the slab between two
// halls is three layers (top + 1 .. next ground − 1). The trunk's wall is WALL thick round each hall;
// the deck is a disc of cloud at y 29–31 (walking surface 32), outside the trunk.
//
// The deck's way up is the trunk's foot door: a three-high opening through the foot wall, and a
// spiral of heartwood up a well through the first slab, into hall 1. Each guardian floor's way up is
// a heartwood membrane across the bottom layer of the slab above its hall (the disc of its plan's
// gate), closed until `openGate(n)` writes it to air.

import { AIR, MAT } from '../../content/materials';
import type { Rng } from '../../core/rng';
import type { Fork, FloorIndex, Place, Shape, SkyFloorPlan, SkyHall, SkyTreePlan, SkyWorldApi, Vec3 } from '../types';
import { covers } from '../world/shapes';
import { SKY_FLOORS } from './index';

/** The sky tree's axis. */
export const SKY_AXIS = { x: 128, z: 128 } as const;

/** Heartwood walls and slabs are this thick (§7.1). */
const WALL = 3;
const SLAB = 3;
/** The deck: its walking surface, and its disc's radius (the deck row of §7.1). */
export const DECK_Y = 32;
const DECK_RADIUS = 48;
const DECK_LAYERS = 3;
/** The halls of floors 1–5: ground and top (§7.1). The radius is the floor's B6 radius + WALL. */
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
/** The foot well's radius: the deck's way up into hall 1. */
const WELL_R = 4;

/** Hall n's air radius (n = 1–5): the floor's B6 radius + the wall. */
const hallRadius = (n: number) => SKY_FLOORS[n - 1].radius + WALL;
/** The trunk's outer radius of storey n (1–5): the hall's air plus the wall. */
const storeyRadius = (n: number) => hallRadius(n) + WALL;

/** The sky tree's halls, deck first (floor 0), then floors 1–5. */
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

  // the deck's way up: a foot well through the first slab, a three-high door through the foot wall, and a spiral up to hall 1
  const first = BANDS[0];
  shapes.push({ k: 'ring', cx, cz, r0: 0, r1: WELL_R, y0: DECK_Y, y1: first.y0 - 1, m: AIR });
  shapes.push({ k: 'run', ax: cx + storeyRadius(1) + 2, ay: DECK_Y, az: cz, bx: cx + 2, by: DECK_Y, bz: cz, w: 2, h: 3, m: AIR });
  shapes.push({ k: 'helix', cx, cz, r: WELL_R, w: 2, y0: DECK_Y, y1: first.y0 - 1, rise: 8, m: MAT.heartwood });

  // the roof of the top hall
  shapes.push({ k: 'ring', cx, cz, r0: 0, r1: storeyRadius(BANDS.length), y0: BANDS[BANDS.length - 1].y1 + 1, y1: ROOF_TOP, m: MAT.heartwood });

  // each floor's way up: a hole through the slab above its hall, closed by a membrane on its bottom layer
  const gates: { x: number; y: number; z: number; r: number }[] = [];
  BANDS.forEach((b, i) => {
    const g = floors[i]?.gate;
    if (!g) return;
    const y = b.y1 + 1;
    shapes.push({ k: 'ring', cx: g.x, cz: g.z, r0: 0, r1: g.r, y0: y, y1: y + SLAB - 1, m: AIR });
    shapes.push({ k: 'ring', cx: g.x, cz: g.z, r0: 0, r1: g.r, y0: y, y1: y, m: MAT.heartwood });
    gates.push({ x: g.x, y, z: g.z, r: g.r });
  });

  const deck: Place = { id: 0, kind: 'ground', x: cx, y: DECK_Y, z: cz + 40, w: 1, d: 1, tag: 0 };
  const door: Place = { id: 1, kind: 'gate', x: cx, y: DECK_Y, z: cz, w: 1, d: 1, tag: 0 };

  return {
    shapes,
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

/** Floor n's deity was won: its way up turns to air (setStory), cell by cell over the membrane. */
export function openGate(world: SkyWorldApi, tree: SkyTreePlan, n: FloorIndex) {
  const g = tree.gates[n - 1];
  if (!g) return;
  const disc: Shape = { k: 'ring', cx: g.x, cz: g.z, r0: 0, r1: g.r, y0: g.y, y1: g.y, m: AIR };
  for (let z = g.z - g.r; z <= g.z + g.r; z++)
    for (let x = g.x - g.r; x <= g.x + g.r; x++)
      if (covers(disc, x, g.y, z)) world.setStory(x, g.y, z, AIR);
}
