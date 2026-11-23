// The minimap's pure parts (docs/design/built/feel/HUD.md "The minimap", issue #302): where the player's arrow sits
// on the map, and which dug columns of a floor are drawn as tunnels. The HUD draws; this file decides.
//
// Scale: one map cell per room cell of the floor grid (14 × 9 px and a 2 px gap for a 15 × 9 block pitch), so one
// block is about one map pixel. Rooms stay one cell each (DECISIONS §10.2: the map tells how many rooms and how they
// join, never their size or shape); the tunnels are a second layer drawn only where the player has dug.

import { BAND, cellOf, floorY, inRoomSpace, MARGIN, PITCH_X, PITCH_Z, type RoomInfo } from '../world/floor';

/** The map's cell, in canvas pixels. */
export const MAP_CELL = { w: 14, h: 9, gap: 2 } as const;

/** A dug hole is drawn on the map once it is more than 2 blocks tall (owner, issue #302). */
export const TUNNEL_MIN_HEIGHT = 3;

/** The floor as the minimap reads it. */
export interface MapFloor {
  plan: { w: number; h: number };
  space: ArrayLike<number>;
  rooms: readonly Pick<RoomInfo, 'id' | 'gx' | 'gz' | 'x0' | 'z0' | 'y0' | 'w' | 'd' | 'height' | 'open'>[];
}

/** Where the player is on the map: in a room (its id, the arrow on its cell) or between rooms (-1). */
export interface MapPlace {
  room: number;
  /** Map position in grid cells (0 is the west edge of cell 0); a room's cell centre is gx + 0.5. */
  u: number;
  v: number;
}

/** The grid position of a world point, continuous: the cell's west edge is a whole number. */
export function gridPoint(x: number, z: number): [number, number] {
  return [(x - MARGIN - 1) / PITCH_X, (z - MARGIN - 1) / PITCH_Z];
}

/**
 * Where the arrow goes. Inside a room's open space it sits on the room's own cell, as it always has (a big room is
 * still one cell). Anywhere else on the floor (a wall, a doorway, rock, a dug tunnel) it follows the body, so the
 * player is always on the map.
 */
export function mapPlace(floor: MapFloor, x: number, y: number, z: number): MapPlace {
  const [gx, gz] = cellOf(x, z);
  if (gx >= 0 && gz >= 0 && gx < floor.plan.w && gz < floor.plan.h) {
    const i = floor.space[gx + gz * floor.plan.w];
    const r = i >= 0 ? floor.rooms[i] : undefined;
    // pools sink up to 2 blocks under the floor and still belong to the room
    if (r && inRoomSpace(r as RoomInfo, x, z) && y >= r.y0 - 3 && y < r.y0 + r.height) return { room: r.id, u: r.gx + 0.5, v: r.gz + 0.5 };
  }
  const [u, v] = gridPoint(x, z);
  return { room: -1, u, v };
}

/** Canvas pixel of a grid position: a cell's centre lands where the room's cell is drawn. */
export function mapPx(u: number, v: number): [number, number] {
  const { w, h, gap } = MAP_CELL;
  return [gap / 2 + u * (w + gap), gap / 2 + v * (h + gap)];
}

/** The lowest and highest block of floor k's band (bandOf gives k for every height in it). */
export function bandRange(k: number): [number, number] {
  const lo = floorY(k) - 2;
  return [lo, lo + BAND - 1];
}

const colKey = (x: number, z: number) => x * 4096 + z;

/**
 * Every block broken in the dungeon this run, by column. A column is a tunnel tile of a floor when it holds a run of
 * at least TUNNEL_MIN_HEIGHT dug blocks, one above the other and still open, that reaches into that floor's band.
 * `version` changes on every dig, so the HUD knows when to look again.
 */
export class TunnelLog {
  private cols = new Map<number, Set<number>>();
  version = 0;

  dig(x: number, y: number, z: number) {
    const k = colKey(x, z);
    let ys = this.cols.get(k);
    if (!ys) this.cols.set(k, ys = new Set());
    if (ys.has(y)) return;
    ys.add(y);
    this.version++;
  }

  clear() {
    this.cols.clear();
    this.version++;
  }

  /** The tunnel tiles of the band [y0, y1], as world (x, z) columns. `open` says whether a block is still air. */
  tiles(y0: number, y1: number, open: (x: number, y: number, z: number) => boolean, min = TUNNEL_MIN_HEIGHT): [number, number][] {
    const out: [number, number][] = [];
    for (const [k, ys] of this.cols) {
      if (ys.size < min) continue;
      const x = Math.floor(k / 4096), z = k % 4096;
      const sorted = [...ys].filter(y => open(x, y, z)).sort((a, b) => a - b);
      let start = 0;
      for (let i = 1; i <= sorted.length; i++) {
        if (i < sorted.length && sorted[i] === sorted[i - 1] + 1) continue;
        const lo = sorted[start], hi = sorted[i - 1];
        if (hi - lo + 1 >= min && hi >= y0 && lo <= y1) { out.push([x, z]); break; }
        start = i;
      }
    }
    return out;
  }
}
