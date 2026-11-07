// The staircase: the way up the Spiked Entity opens (docs/architecture/SKY.md §10.2).
//
// A stairwell in the world's margin, the solid rock round every floor, at the north-west corner:
// a two-wide spiral round a one-block core of living wood, rising one block per step, from the
// chamber of silence (stand 1, on the bedrock) to the grass (stand SURFACE_Y + 1). Seen from
// above, the well is the 5 × 5 square x, z ∈ [1, 5] (the bedrock wall at x = 0 and z = 0 stays):
//
//        x 1 2 3 4 5
//   z 1    0 0 1 2 2        0 NW corner   1 N    2 NE corner   3 E
//     2    0 0 1 2 2        4 SE corner   5 S    6 SW corner   7 W
//     3    7 7 # 3 3        # the core (living wood)
//     4    6 6 5 4 4
//     5    6 6 5 4 4        the spiral turns clockwise as it climbs, a lap of 8 steps
//
// The step standing at height s (feet at s, its block at s − 1) is at position (s + PHASE) mod 8.
// Every floor's level floorY(k) is a multiple of 8 (8 + 16·n), so every landing is the SE corner,
// the one step that touches both the north strip of the margin (z 4–5, running east) and the
// west strip (x 4–5, running south): a landing tunnel leaves the well without crossing another
// step, and runs along the margin (round its corners when it must) to a room that never seals. The grass (stand SURFACE_Y + 1 = 168) is the SE corner too, so the well's last step is
// the grass itself and the climb walks out onto the surface.
//
// Each column of the ring holds one step block every 8 heights and air between: headroom 7 over
// every step, more than the 3 the rule asks (a jump of 1.26 with a body of 1.8 needs 3.06).
//
// No randomness: the plan decides (stairRoute). The staircase is carved after everything else
// on its floors, so no other draw moves; whether it exists is a run option (`stair`), not a draw.

import { AIR, MAT } from '../content/materials';
import { ROOM_D, ROOM_W } from '../content/rooms';
import { FIRST_FLOOR, floorY, GRID, MARGIN, PITCH_X, PITCH_Z, SURFACE_Y, type FloorResult, type RoomInfo } from './floor';
import type { VoxelWorld } from './world';

/** The floor the permanent shortcut starts from in every run with the unlock: floor 0, the roots
 *  (owner decision 5, SKY.md §10.4). */
export const STAIR_START_FLOOR = 0;

/** The well's square in the margin (inclusive), the core at its centre. */
export const WELL = { x0: 1, z0: 1, x1: 5, z1: 5, cx: 3, cz: 3 } as const;
/** Steps in one lap of the spiral, and the offset that puts every floor's level on the SE corner. */
export const LAP = 8;
const PHASE = 4;
/** The lowest place the staircase stands: the bedrock floor of the chamber of silence. */
export const STAIR_BOTTOM = 1;
/** Where the climb ends: standing on the grass. */
export const STAIR_TOP = SURFACE_Y + 1;
/** Tunnels: two wide, three high (DOOR_H). */
const TUNNEL_H = 3;
/** The core and any step that has to be laid where the rock is gone. */
const CORE_MAT = MAT.log;
const STEP_MAT = MAT.stone;

export interface StairLanding {
  floor: number;
  /** Global id of the room the tunnel opens into, or −1 when it ends in an alcove off the margin. */
  room: number;
  /** The side of that room the gap opens in (for an alcove: the way the tunnel heads, 'e'). */
  side: 'n' | 's' | 'e' | 'w';
  /** Every cell the landing carves to air: the tunnel and the door-shaped gap, in order from the well. */
  tunnel: [number, number, number][];
}

export interface StairCarve {
  /** How many cells the whole job visits (a cell already right is left as it is). */
  cells: number;
  /** Writes up to `budget` more cells (through `VoxelWorld.set`, so chunks remesh); true once done. */
  next(budget: number): boolean;
}

/** Which of the 8 spiral positions a ring cell belongs to (−1 for the core or outside the well). */
export function wellPos(x: number, z: number): number {
  if (x < WELL.x0 || x > WELL.x1 || z < WELL.z0 || z > WELL.z1) return -1;
  const cx = x < 3 ? 0 : x === 3 ? 1 : 2, cz = z < 3 ? 0 : z === 3 ? 1 : 2;
  // [cz][cx] → position
  const POS = [[0, 1, 2], [7, -1, 3], [6, 5, 4]];
  return POS[cz][cx];
}

/** The position of the step whose feet stand at height s. */
export const stepPos = (s: number) => (((s + PHASE) % LAP) + LAP) % LAP;

/** Is (x, z) inside the well's square (ring or core)? */
export const inWell = (x: number, z: number) => x >= WELL.x0 && x <= WELL.x1 && z >= WELL.z0 && z <= WELL.z1;

/** A room the stair may open into: one that can never seal (no projections, no boss, no challenge)
 *  and is not shut behind a lock (the vault: a tunnel must never skip its key). */
export function canHostLanding(rm: RoomInfo): boolean {
  return rm.enemies.length === 0 && rm.type !== 'boss' && rm.type !== 'challenge' && rm.type !== 'vault';
}

/** The strips of the margin the landing tunnels run along: two wide, right against the rooms' walls
 *  (north z 4–5, west x 4–5, east x EAST–EAST+1, south z SOUTH–SOUTH+1). */
const EAST = MARGIN + 2 + GRID * PITCH_X;   // 113
const SOUTH = MARGIN + 2 + GRID * PITCH_Z;  // 71

/**
 * Where floor f's landing goes. From the SE corner of the well a tunnel runs along the margin
 * (the north strip east, the west strip south, and round the corner to the east or south strip),
 * then straight in through grid cells no room has claimed (`f.space`) to the home cell of the
 * first room it meets, on that side's door position, if the room can host a landing and has no
 * door on that side (the room validator keeps three walkable tiles in front of every door
 * position, sotano-levels §4). The shortest tunnel wins (ties: the first found, north, west, east,
 * south). With none, the tunnel ends in an alcove three blocks long off the north strip.
 */
export function stairRoute(f: FloorResult): StairLanding {
  const y0 = floorY(f.floor), y1 = y0 + TUNNEL_H - 1;
  const { plan, space } = f;
  let best: { len: number; side: StairLanding['side']; rm: RoomInfo } | null = null;
  // walks a line of grid cells from the margin inwards; the first claimed cell decides
  const scan = (side: StairLanding['side'], cells: [number, number][]) => {
    for (const [gx, gz] of cells) {
      const c = space[gx + gz * plan.w];
      if (c === -1) continue;
      const pr = plan.rooms[c], rm = f.rooms[c];
      const door = rm.doors[side.toUpperCase() as 'N' | 'S' | 'E' | 'W'];
      if (pr.gx === gx && pr.gz === gz && canHostLanding(rm) && door === undefined) {
        const len = landingTunnel(side, rm, y0, y1).length;
        if (!best || len < best.len) best = { len, side, rm };
      }
      return;
    }
  };
  const line = (n: number, at: (i: number) => [number, number]) => Array.from({ length: n }, (_, i) => at(i));
  for (let gx = 0; gx < plan.w; gx++) scan('n', line(plan.h, i => [gx, i]));
  for (let gz = 0; gz < plan.h; gz++) scan('w', line(plan.w, i => [i, gz]));
  for (let gz = 0; gz < plan.h; gz++) scan('e', line(plan.w, i => [plan.w - 1 - i, gz]));
  for (let gx = 0; gx < plan.w; gx++) scan('s', line(plan.h, i => [gx, plan.h - 1 - i]));
  const b = best as { side: StairLanding['side']; rm: RoomInfo } | null;
  if (b) return { floor: f.floor, room: b.rm.id, side: b.side, tunnel: landingTunnel(b.side, b.rm, y0, y1) };
  const t: [number, number, number][] = [];
  box(t, MARGIN, y0, 4, MARGIN + 2, y1, 5);
  return { floor: f.floor, room: -1, side: 'e', tunnel: t };
}

/** The cells of a landing tunnel into room `rm` on `side`, from the well's SE corner, in order. */
function landingTunnel(side: StairLanding['side'], rm: RoomInfo, y0: number, y1: number): [number, number, number][] {
  const t: [number, number, number][] = [];
  const { hx, hz } = rm;
  if (side === 'n') {
    box(t, MARGIN, y0, 4, hx + 6, y1, 5);                       // the north strip, east
    box(t, hx + 5, y0, MARGIN, hx + 6, y1, hz - 3);             // in through empty cells
    box(t, hx + 5, y0, hz - 2, hx + 7, y1, hz - 1);             // the door-shaped gap
  } else if (side === 'w') {
    box(t, 4, y0, MARGIN, 5, y1, hz + 3);                       // the west strip, south
    box(t, MARGIN, y0, hz + 2, hx - 3, y1, hz + 3);
    box(t, hx - 2, y0, hz + 2, hx - 1, y1, hz + 4);
  } else if (side === 'e') {
    box(t, MARGIN, y0, 4, EAST + 1, y1, 5);                     // the north strip, all the way east
    box(t, EAST, y0, MARGIN, EAST + 1, y1, hz + 3);             // the east strip, south
    box(t, hx + ROOM_W + 2, y0, hz + 2, EAST - 1, y1, hz + 3);  // in, westwards
    box(t, hx + ROOM_W, y0, hz + 2, hx + ROOM_W + 1, y1, hz + 4);
  } else {
    box(t, 4, y0, MARGIN, 5, y1, SOUTH + 1);                    // the west strip, all the way south
    box(t, MARGIN, y0, SOUTH, hx + 6, y1, SOUTH + 1);           // the south strip, east
    box(t, hx + 5, y0, hz + ROOM_D + 2, hx + 6, y1, SOUTH - 1); // in, northwards
    box(t, hx + 5, y0, hz + ROOM_D, hx + 7, y1, hz + ROOM_D + 1);
  }
  return t;
}

/** The tunnel from the chamber of silence (air y 1–4 under floor 9) to the well's foot, at y 1–3:
 *  down the west strip (x 4–5) and east along two middle rows of the chamber to its west face.
 *  The two layers of rock above it (y 4–5) and floor 9's slab stay whole. */
export function silenceTunnel(silence: NonNullable<FloorResult['silence']>): [number, number, number][] {
  const t: [number, number, number][] = [];
  const zr = Math.floor((silence.z0 + silence.z1) / 2) - 1;
  const top = STAIR_BOTTOM + TUNNEL_H - 1;
  box(t, 4, STAIR_BOTTOM, MARGIN, 5, top, zr + 1);
  box(t, MARGIN, STAIR_BOTTOM, zr, silence.x0 - 1, top, zr + 1);
  return t;
}

/**
 * The staircase as a job: from the chamber of silence (the revelation) or from floor `from`'s
 * landing (the roots' flight of every later run, `STAIR_START_FLOOR`) up to the surface. It carves
 * the well from that height to the grass and the landing of every floor at or above it.
 * `floors` holds the carved floors (any order); a floor missing from it gets no landing.
 * Nothing happens until `next` is called: a few hundred cells a frame, under the rumble.
 */
export function carveStair(w: VoxelWorld, floors: readonly FloorResult[], from: number | 'silence', to: 'surface'): StairCarve {
  void to;
  const ops = stairOps(floors, from);
  let i = 0;
  return {
    cells: ops.length,
    next(budget: number) {
      for (let n = 0; n < budget && i < ops.length; n++, i++) {
        const [x, y, z, m, ifAir] = ops[i];
        if (ifAir && w.get(x, y, z) !== AIR) continue;
        w.set(x, y, z, m);
      }
      return i >= ops.length;
    },
  };
}

/** Carves the whole staircase at once (tests, the sandbox). */
export function carveStairNow(w: VoxelWorld, floors: readonly FloorResult[], from: number | 'silence'): void {
  const job = carveStair(w, floors, from, 'surface');
  job.next(job.cells);
}

/** [x, y, z, material, only-if-air] in carving order: bottom up, the well before its landings. */
type Op = [number, number, number, number, boolean];

function stairOps(floors: readonly FloorResult[], from: number | 'silence'): Op[] {
  const ops: Op[] = [];
  const bottom = from === 'silence' ? STAIR_BOTTOM : floorY(from);
  const byFloor = new Map(floors.map(f => [f.floor, f]));
  // the bottom tunnel, from the chamber to the foot
  if (from === 'silence') {
    const last = floors.find(f => f.silence);
    if (last?.silence) for (const [x, y, z] of silenceTunnel(last.silence)) ops.push([x, y, z, AIR, false]);
  }
  // the well, layer by layer: the core, the ring's air and its steps
  for (let y = bottom; y <= SURFACE_Y; y++) {
    for (let z = WELL.z0; z <= WELL.z1; z++) for (let x = WELL.x0; x <= WELL.x1; x++) {
      const p = wellPos(x, z);
      if (p < 0) { ops.push([x, y, z, CORE_MAT, false]); continue; }
      // the step standing at y + 1 has its block here (below `bottom` the floor the well stands on)
      if (stepPos(y + 1) === p) {
        // the last step is the grass itself; below, the rock it was cut from stays (or stone is laid)
        if (y === SURFACE_Y) ops.push([x, y, z, MAT.grass, false]);
        else ops.push([x, y, z, STEP_MAT, true]);
      }
      else ops.push([x, y, z, AIR, false]);
    }
  }
  // the landings, from floor 0 down, each with a floor laid under its tunnel where the rock is gone
  const lowest = from === 'silence' ? Infinity : from;
  for (const [k, f] of [...byFloor].sort((a, b) => a[0] - b[0])) {
    if (k < FIRST_FLOOR || k > lowest) continue;
    const landing = stairRoute(f);
    const y0 = floorY(k);
    for (const [x, y, z] of landing.tunnel) {
      ops.push([x, y, z, AIR, false]);
      if (y === y0) ops.push([x, y0 - 1, z, STEP_MAT, true]);
    }
  }
  return ops;
}

function box(out: [number, number, number][], x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
  for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) out.push([x, y, z]);
}
